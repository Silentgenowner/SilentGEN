import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";

import {
  calculateCartTotals,
} from "@/lib/cartTotals";

import {
  createInvoiceFromOrder,
} from "@/lib/createInvoiceFromOrder";

import {
  getProductVariantImage,
  resolveProductInventory,
} from "@/lib/ai/tools/productTools";

import {
  recordLearningBusinessEvent,
} from "@/lib/ai/learning/customerLearningEngine";

import Cart from "@/models/Cart";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type TokenPayload = {
  id?: string;

  userId?: string;
};

type ShippingAddressInput = {
  fullName?: string;

  mobile?: string;

  address?: string;

  area?: string;

  city?: string;

  state?: string;

  country?: string;

  pincode?: string;

  landmark?: string;
};

type PlaceOrderBody = {
  shippingAddress?:
    ShippingAddressInput;

  paymentMethod?:
    "COD" | "ONLINE";

  couponCode?:
    string;

  couponDiscount?:
    number;
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(
  value:
    unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

function normalizeValue(
  value:
    unknown
) {
  return cleanString(
    value
  ).toLowerCase();
}

function safeNumber(
  value:
    unknown
) {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return 0;
  }

  return parsed;
}

function safeQuantity(
  value:
    unknown
) {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isInteger(
      parsed
    ) ||
    parsed <=
      0
  ) {
    return 0;
  }

  return parsed;
}

function isValidObjectId(
  value:
    string
) {
  return mongoose.Types.ObjectId.isValid(
    value
  );
}

/*
|--------------------------------------------------------------------------
| ERROR HELPER
|--------------------------------------------------------------------------
*/

class OrderPlacementError
  extends Error {
  status:
    number;

  constructor(
    message:
      string,
    status =
      400
  ) {
    super(
      message
    );

    this.name =
      "OrderPlacementError";

    this.status =
      status;
  }
}

/*
|--------------------------------------------------------------------------
| ADDRESS VALIDATION
|--------------------------------------------------------------------------
*/

function validateShippingAddress(
  raw:
    ShippingAddressInput |
    undefined
) {
  if (
    !raw ||
    typeof raw !==
      "object"
  ) {
    throw new OrderPlacementError(
      "Shipping address is required.",
      400
    );
  }

  const address = {
    fullName:
      cleanString(
        raw.fullName
      ),

    mobile:
      cleanString(
        raw.mobile
      ),

    address:
      cleanString(
        raw.address
      ),

    area:
      cleanString(
        raw.area
      ),

    city:
      cleanString(
        raw.city
      ),

    state:
      cleanString(
        raw.state
      ),

    country:
      cleanString(
        raw.country
      ) ||
      "India",

    pincode:
      cleanString(
        raw.pincode
      ),

    landmark:
      cleanString(
        raw.landmark
      ),
  };

  if (
    !address.fullName
  ) {
    throw new OrderPlacementError(
      "Full name is required in shipping address."
    );
  }

  if (
    !/^[0-9]{10}$/.test(
      address.mobile
    )
  ) {
    throw new OrderPlacementError(
      "Please enter a valid 10-digit mobile number."
    );
  }

  if (
    !address.address
  ) {
    throw new OrderPlacementError(
      "Address is required."
    );
  }

  if (
    !address.area
  ) {
    throw new OrderPlacementError(
      "Area is required."
    );
  }

  if (
    !address.city
  ) {
    throw new OrderPlacementError(
      "City is required."
    );
  }

  if (
    !address.state
  ) {
    throw new OrderPlacementError(
      "State is required."
    );
  }

  if (
    !/^[0-9]{6}$/.test(
      address.pincode
    )
  ) {
    throw new OrderPlacementError(
      "Please enter a valid 6-digit pincode."
    );
  }

  return address;
}

/*
|--------------------------------------------------------------------------
| FIND COLOR VARIANT
|--------------------------------------------------------------------------
*/

function findColorVariant(
  product:
    any,
  color:
    string
) {
  if (
    !color ||
    !Array.isArray(
      product?.colorVariants
    )
  ) {
    return null;
  }

  const normalizedColor =
    normalizeValue(
      color
    );

  return (
    product.colorVariants.find(
      (
        variant:
          any
      ) =>
        normalizeValue(
          variant?.color
        ) ===
        normalizedColor
    ) ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| FIND SIZE STOCK
|--------------------------------------------------------------------------
*/

function findSizeStock(
  sizeStocks:
    unknown,
  size:
    string
) {
  if (
    !size ||
    !Array.isArray(
      sizeStocks
    )
  ) {
    return null;
  }

  const normalizedSize =
    normalizeValue(
      size
    );

  return (
    sizeStocks.find(
      (
        entry:
          any
      ) =>
        normalizeValue(
          entry?.size
        ) ===
        normalizedSize
    ) ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| DEDUCT EXACT INVENTORY
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. Color + Size stock
| 2. Color stock
| 3. Product size stock
| 4. Product global stock
|
|--------------------------------------------------------------------------
*/

function deductExactInventory({
  product,
  size,
  color,
  quantity,
}: {
  product:
    any;

  size:
    string;

  color:
    string;

  quantity:
    number;
}) {
  let deducted =
    false;

  /*
  |--------------------------------------------------------------------------
  | COLOR VARIANT
  |--------------------------------------------------------------------------
  */

  if (
    color
  ) {
    const variant =
      findColorVariant(
        product,
        color
      );

    if (
      variant
    ) {
      /*
      |--------------------------------------------------------------------------
      | COLOR + SIZE STOCK
      |--------------------------------------------------------------------------
      */

      if (
        size &&
        Array.isArray(
          variant.sizeStocks
        ) &&
        variant.sizeStocks.length >
          0
      ) {
        const sizeEntry =
          findSizeStock(
            variant.sizeStocks,
            size
          );

        if (
          !sizeEntry
        ) {
          throw new OrderPlacementError(
            `${product.name}: selected size is no longer available.`,
            409
          );
        }

        const currentStock =
          safeNumber(
            sizeEntry.stock
          );

        if (
          currentStock <
          quantity
        ) {
          throw new OrderPlacementError(
            `Only ${Math.max(
              Math.floor(
                currentStock
              ),
              0
            )} item(s) are available for ${product.name} in ${color} / ${size}.`,
            409
          );
        }

        sizeEntry.stock =
          currentStock -
          quantity;

        deducted =
          true;
      }

      /*
      |--------------------------------------------------------------------------
      | COLOR STOCK
      |--------------------------------------------------------------------------
      */

      if (
        !deducted &&
        (
          typeof variant.stock ===
            "number" ||
          (
            !Array.isArray(
              variant.sizeStocks
            ) ||
            variant.sizeStocks.length ===
              0
          )
        )
      ) {
        const currentStock =
          safeNumber(
            variant.stock
          );

        if (
          currentStock <
          quantity
        ) {
          throw new OrderPlacementError(
            `Only ${Math.max(
              Math.floor(
                currentStock
              ),
              0
            )} item(s) are available for ${product.name} in ${color}.`,
            409
          );
        }

        variant.stock =
          currentStock -
          quantity;

        deducted =
          true;
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT SIZE STOCK
  |--------------------------------------------------------------------------
  */

  if (
    !deducted &&
    size &&
    Array.isArray(
      product.sizeStocks
    ) &&
    product.sizeStocks.length >
      0
  ) {
    const sizeEntry =
      findSizeStock(
        product.sizeStocks,
        size
      );

    if (
      !sizeEntry
    ) {
      throw new OrderPlacementError(
        `${product.name}: selected size is no longer available.`,
        409
      );
    }

    const currentStock =
      safeNumber(
        sizeEntry.stock
      );

    if (
      currentStock <
      quantity
    ) {
      throw new OrderPlacementError(
        `Only ${Math.max(
          Math.floor(
            currentStock
          ),
          0
        )} item(s) are available for ${product.name} in size ${size}.`,
        409
      );
    }

    sizeEntry.stock =
      currentStock -
      quantity;

    deducted =
      true;
  }

  /*
  |--------------------------------------------------------------------------
  | GLOBAL STOCK FALLBACK
  |--------------------------------------------------------------------------
  */

  if (
    !deducted
  ) {
    const currentStock =
      safeNumber(
        product.stock
      );

    if (
      currentStock <
      quantity
    ) {
      throw new OrderPlacementError(
        `Only ${Math.max(
          Math.floor(
            currentStock
          ),
          0
        )} item(s) are available for ${product.name}.`,
        409
      );
    }

    product.stock =
      currentStock -
      quantity;
  }

  /*
  |--------------------------------------------------------------------------
  | SOLD
  |--------------------------------------------------------------------------
  */

  product.sold =
    Math.max(
      safeNumber(
        product.sold
      ),
      0
    ) +
    quantity;
}

/*
|--------------------------------------------------------------------------
| RECORD COMMITTED PURCHASE LEARNING
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This helper is called ONLY AFTER:
|
|   await session.commitTransaction()
|
| Therefore a rolled-back order never becomes a product_purchased event.
|
| We use the awaited learning API here rather than fire-and-forget.
| Promise.allSettled guarantees:
|
| - analytics gets time to finish before the server response ends
| - one failed analytics item does not fail other items
| - analytics failure NEVER changes the successful order result
|
|--------------------------------------------------------------------------
*/

async function recordCommittedPurchaseLearning({
  userId,
  order,
  orderItems,
  paymentMethod,
}: {
  userId:
    string;

  order:
    any;

  orderItems:
    any[];

  paymentMethod:
    "COD" | "ONLINE";
}) {
  const orderId =
    String(
      order?._id ||
        ""
    );

  if (
    !orderId ||
    !isValidObjectId(
      orderId
    )
  ) {
    return;
  }

  if (
    !Array.isArray(
      orderItems
    ) ||
    orderItems.length ===
      0
  ) {
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | ONE PURCHASE EVENT PER REAL ORDER ITEM
  |--------------------------------------------------------------------------
  */

  const tasks =
    orderItems.map(
      async (
        item:
          any
      ) => {
        const productId =
          String(
            item?.product ||
              ""
          );

        if (
          !productId ||
          !isValidObjectId(
            productId
          )
        ) {
          return null;
        }

        const quantity =
          Math.max(
            safeQuantity(
              item?.quantity
            ),
            1
          );

        const price =
          Math.max(
            safeNumber(
              item?.price
            ),
            0
          );

        const size =
          cleanString(
            item?.size
          );

        const color =
          cleanString(
            item?.color
          );

        /*
        |--------------------------------------------------------------------------
        | CENTRAL CUSTOMER BUSINESS INTELLIGENCE
        |--------------------------------------------------------------------------
        */

        return recordLearningBusinessEvent(
          {
            eventType:
              "product_purchased",

            source:
              "order",

            userId,

            sessionId:
              null,

            conversationId:
              null,

            productId,

            orderId,

            color:
              color ||
              null,

            size:
              size ||
              null,

            quantity,

            price,

            metadata: {
              context:
                "real_committed_order_purchase",

              sku:
                cleanString(
                  item?.sku
                ),

              productName:
                cleanString(
                  item?.name
                ),

              unitPrice:
                price,

              lineTotal:
                price *
                quantity,

              paymentMethod,

              paymentStatus:
                cleanString(
                  order?.paymentStatus
                ) ||
                "Pending",

              orderStatus:
                cleanString(
                  order?.orderStatus
                ) ||
                "Placed",

              /*
              |--------------------------------------------------------------------------
              | ONLINE NOTE
              |--------------------------------------------------------------------------
              |
              | ONLINE currently creates the order with paymentStatus Pending.
              | We still preserve the real order-placement intent here, but
              | paymentStatus remains available so BI can distinguish a paid
              | transaction from a pending online order.
              |
              |--------------------------------------------------------------------------
              */

              paymentConfirmed:
                cleanString(
                  order?.paymentStatus
                ) ===
                "Paid",

              subtotal:
                Math.max(
                  safeNumber(
                    order?.subtotal
                  ),
                  0
                ),

              shippingCharge:
                Math.max(
                  safeNumber(
                    order?.shippingCharge
                  ),
                  0
                ),

              discount:
                Math.max(
                  safeNumber(
                    order?.discount
                  ),
                  0
                ),

              totalAmount:
                Math.max(
                  safeNumber(
                    order?.totalAmount
                  ),
                  0
                ),
            },
          }
        );
      }
    );

  const results =
    await Promise.allSettled(
      tasks
    );

  /*
  |--------------------------------------------------------------------------
  | DEVELOPMENT LOG ONLY
  |--------------------------------------------------------------------------
  */

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    const failed =
      results.filter(
        (
          result
        ) =>
          result.status ===
          "rejected"
      );

    if (
      failed.length >
      0
    ) {
      console.warn(
        `ORDER PURCHASE LEARNING: ${failed.length} item event(s) failed for order ${orderId}.`
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| POST PLACE ORDER
|--------------------------------------------------------------------------
*/

export async function POST(
  req:
    NextRequest
) {
  const session =
    await mongoose.startSession();

  try {
    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | JWT SECRET
    |--------------------------------------------------------------------------
    */

    const jwtSecret =
      process.env
        .JWT_SECRET
        ?.trim();

    if (
      !jwtSecret
    ) {
      throw new OrderPlacementError(
        "Server authentication configuration is missing.",
        500
      );
    }

    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    const token =
      req.cookies.get(
        "token"
      )?.value;

    if (
      !token
    ) {
      throw new OrderPlacementError(
        "Please login first.",
        401
      );
    }

    let decoded:
      TokenPayload;

    try {
      decoded =
        jwt.verify(
          token,
          jwtSecret
        ) as TokenPayload;
    } catch {
      throw new OrderPlacementError(
        "Please login first.",
        401
      );
    }

    const userId =
      cleanString(
        decoded.id ||
          decoded.userId
      );

    if (
      !userId ||
      !isValidObjectId(
        userId
      )
    ) {
      throw new OrderPlacementError(
        "Invalid customer account.",
        401
      );
    }

    /*
    |--------------------------------------------------------------------------
    | USER EXISTS
    |--------------------------------------------------------------------------
    */

    const user =
      await User.findById(
        userId
      )
        .select(
          "_id"
        )
        .lean();

    if (
      !user
    ) {
      throw new OrderPlacementError(
        "Customer account not found.",
        401
      );
    }

    /*
    |--------------------------------------------------------------------------
    | REQUEST BODY
    |--------------------------------------------------------------------------
    */

    let body:
      PlaceOrderBody;

    try {
      body =
        (
          await req.json()
        ) as PlaceOrderBody;
    } catch {
      throw new OrderPlacementError(
        "Invalid request body.",
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SHIPPING ADDRESS
    |--------------------------------------------------------------------------
    */

    const shippingAddress =
      validateShippingAddress(
        body.shippingAddress
      );

    /*
    |--------------------------------------------------------------------------
    | PAYMENT METHOD
    |--------------------------------------------------------------------------
    */

    const paymentMethod =
      body.paymentMethod;

    if (
      paymentMethod !==
        "COD" &&
      paymentMethod !==
        "ONLINE"
    ) {
      throw new OrderPlacementError(
        "Invalid payment method.",
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | BEGIN TRANSACTION
    |--------------------------------------------------------------------------
    */

    session.startTransaction();

    /*
    |--------------------------------------------------------------------------
    | GET CART
    |--------------------------------------------------------------------------
    */

    const cart =
      await Cart.findOne(
        {
          userId,
        }
      ).session(
        session
      );

    if (
      !cart ||
      !Array.isArray(
        cart.items
      ) ||
      cart.items.length ===
        0
    ) {
      throw new OrderPlacementError(
        "Cart is empty.",
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ORDER ITEMS
    |--------------------------------------------------------------------------
    */

    const orderItems:
      any[] =
      [];
          /*
    |--------------------------------------------------------------------------
    | VALIDATE EVERY CART ITEM
    |--------------------------------------------------------------------------
    */

    for (
      const cartItem of
      cart.items as any[]
    ) {
      const productId =
        String(
          cartItem.productId ||
            ""
        );

      if (
        !isValidObjectId(
          productId
        )
      ) {
        throw new OrderPlacementError(
          "Cart contains an invalid product.",
          400
        );
      }

      /*
      |--------------------------------------------------------------------------
      | PRODUCT
      |--------------------------------------------------------------------------
      */

      const product:
        any =
        await Product.findOne(
          {
            _id:
              productId,

            isDeleted: {
              $ne:
                true,
            },
          }
        ).session(
          session
        );

      if (
        !product
      ) {
        throw new OrderPlacementError(
          `${cartItem.name || "Product"} is no longer available.`,
          409
        );
      }

      /*
      |--------------------------------------------------------------------------
      | ACTIVE PRODUCT ONLY
      |--------------------------------------------------------------------------
      */

      if (
        product.status !==
        "Active"
      ) {
        throw new OrderPlacementError(
          `${product.name} is currently unavailable.`,
          409
        );
      }

      /*
      |--------------------------------------------------------------------------
      | QUANTITY
      |--------------------------------------------------------------------------
      */

      const quantity =
        safeQuantity(
          cartItem.quantity
        );

      if (
        quantity <=
        0
      ) {
        throw new OrderPlacementError(
          `Invalid quantity for ${product.name}.`,
          400
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SELECTED VARIANT
      |--------------------------------------------------------------------------
      */

      const selectedSize =
        cleanString(
          cartItem.size
        );

      const selectedColor =
        cleanString(
          cartItem.color
        );

      /*
      |--------------------------------------------------------------------------
      | RESOLVE CURRENT INVENTORY
      |--------------------------------------------------------------------------
      |
      | Never trust cart-stock snapshots.
      |
      | The current Product DB state is checked again at checkout.
      |
      |--------------------------------------------------------------------------
      */

      const inventory =
        resolveProductInventory(
          product,
          {
            size:
              selectedSize ||
              null,

            color:
              selectedColor ||
              null,
          }
        );

      /*
      |--------------------------------------------------------------------------
      | REQUIRED SIZE
      |--------------------------------------------------------------------------
      */

      if (
        inventory.sizeRequired &&
        !selectedSize
      ) {
        throw new OrderPlacementError(
          `Please select a size for ${product.name}.`,
          409
        );
      }

      /*
      |--------------------------------------------------------------------------
      | REQUIRED COLOR
      |--------------------------------------------------------------------------
      */

      if (
        inventory.colorRequired &&
        !selectedColor
      ) {
        throw new OrderPlacementError(
          `Please select a color for ${product.name}.`,
          409
        );
      }

      /*
      |--------------------------------------------------------------------------
      | VALID SIZE
      |--------------------------------------------------------------------------
      */

      if (
        selectedSize &&
        !inventory.sizeAvailable
      ) {
        throw new OrderPlacementError(
          `${product.name}: size ${selectedSize} is no longer available.`,
          409
        );
      }

      /*
      |--------------------------------------------------------------------------
      | VALID COLOR
      |--------------------------------------------------------------------------
      */

      if (
        selectedColor &&
        !inventory.colorAvailable
      ) {
        throw new OrderPlacementError(
          `${product.name}: color ${selectedColor} is no longer available.`,
          409
        );
      }

      /*
      |--------------------------------------------------------------------------
      | EXACT STOCK
      |--------------------------------------------------------------------------
      */

      if (
        !inventory.available ||
        inventory.stock <=
          0
      ) {
        throw new OrderPlacementError(
          inventory.message ||
            `${product.name} is out of stock.`,
          409
        );
      }

      if (
        quantity >
        inventory.stock
      ) {
        throw new OrderPlacementError(
          `Only ${inventory.stock} item(s) are available for ${product.name} in the selected variant.`,
          409
        );
      }

      /*
      |--------------------------------------------------------------------------
      | CANONICAL VARIANT
      |--------------------------------------------------------------------------
      */

      const finalSize =
        inventory.size ||
        selectedSize ||
        "";

      const finalColor =
        inventory.color ||
        selectedColor ||
        "";

      /*
      |--------------------------------------------------------------------------
      | SERVER PRICE
      |--------------------------------------------------------------------------
      |
      | IMPORTANT SECURITY:
      |
      | Browser/cart stored price is NOT trusted as final order price.
      |
      | Current Product DB price becomes the order snapshot price.
      |
      |--------------------------------------------------------------------------
      */

      const price =
        safeNumber(
          product.price
        );

      if (
        price <
        0
      ) {
        throw new OrderPlacementError(
          `Invalid price for ${product.name}.`,
          500
        );
      }

      /*
      |--------------------------------------------------------------------------
      | ORDER ITEM SNAPSHOT
      |--------------------------------------------------------------------------
      |
      | This snapshot is also what purchase learning will use AFTER the
      | transaction successfully commits.
      |
      |--------------------------------------------------------------------------
      */

      orderItems.push(
        {
          product:
            product._id,

          sku:
            String(
              product.sku ||
                ""
            ),

          name:
            String(
              product.name ||
                ""
            ),

          image:
            inventory.image ||
            getProductVariantImage(
              product,
              finalColor
            ) ||
            String(
              product.thumbnail ||
                product.images?.[0] ||
                ""
            ),

          price,

          quantity,

          size:
            finalSize,

          color:
            finalColor,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | DEDUCT EXACT VARIANT STOCK
      |--------------------------------------------------------------------------
      */

      deductExactInventory(
        {
          product,

          size:
            finalSize,

          color:
            finalColor,

          quantity,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | SAVE PRODUCT INSIDE TRANSACTION
      |--------------------------------------------------------------------------
      |
      | Product.save() runs the existing Product model lifecycle.
      |
      | If any later order step fails, MongoDB transaction rollback restores
      | these inventory changes.
      |
      |--------------------------------------------------------------------------
      */

      await product.save(
        {
          session,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VALID ORDER ITEMS
    |--------------------------------------------------------------------------
    */

    if (
      orderItems.length ===
      0
    ) {
      throw new OrderPlacementError(
        "No valid products were found in the cart.",
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SERVER CALCULATED TOTALS
    |--------------------------------------------------------------------------
    */

    const totals =
      calculateCartTotals(
        orderItems
      );

    const subtotal =
      Math.max(
        safeNumber(
          totals.subtotal
        ),
        0
      );

    const shippingCharge =
      Math.max(
        safeNumber(
          totals.shipping
        ),
        0
      );

    /*
    |--------------------------------------------------------------------------
    | COUPON SECURITY
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | couponDiscount supplied by the browser is intentionally NOT trusted.
    |
    | Until the Coupon DB / API is validated directly inside this checkout
    | transaction, server discount remains 0.
    |
    |--------------------------------------------------------------------------
    */

    const couponCode =
      cleanString(
        body.couponCode
      );

    const discount =
      0;

    /*
    |--------------------------------------------------------------------------
    | FINAL TOTAL
    |--------------------------------------------------------------------------
    */

    const totalAmount =
      Math.max(
        subtotal +
          shippingCharge -
          discount,
        0
      );

    /*
    |--------------------------------------------------------------------------
    | CREATE ORDER
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Creating the Order document does NOT yet mean the purchase-learning
    | event should be written.
    |
    | Invoice creation, cart clear and transaction commit must all succeed.
    |
    |--------------------------------------------------------------------------
    */

    const createdOrders =
      await Order.create(
        [
          {
            user:
              userId,

            items:
              orderItems,

            shippingAddress,

            paymentMethod,

            /*
            |--------------------------------------------------------------------------
            | PAYMENT STATUS
            |--------------------------------------------------------------------------
            |
            | COD:
            | Pending until fulfilment/payment flow updates it.
            |
            | ONLINE:
            | Pending until payment gateway confirms it.
            |
            |--------------------------------------------------------------------------
            */

            paymentStatus:
              "Pending",

            /*
            |--------------------------------------------------------------------------
            | ORDER STATUS
            |--------------------------------------------------------------------------
            */

            orderStatus:
              "Placed",

            /*
            |--------------------------------------------------------------------------
            | DELIVERY HISTORY
            |--------------------------------------------------------------------------
            */

            deliveryHistory: [
              {
                status:
                  "Placed",

                date:
                  new Date(),

                note:
                  "Order placed successfully",
              },
            ],

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL SNAPSHOT
            |--------------------------------------------------------------------------
            */

            subtotal,

            shippingCharge,

            discount,

            totalAmount,

            /*
            |--------------------------------------------------------------------------
            | REFUND
            |--------------------------------------------------------------------------
            */

            refundStatus:
              "None",
          },
        ],
        {
          session,
        }
      );

    const order =
      createdOrders[0];

    if (
      !order
    ) {
      throw new OrderPlacementError(
        "Order creation failed.",
        500
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ORDER ID
    |--------------------------------------------------------------------------
    */

    const orderId =
      String(
        order._id
      );

    if (
      !isValidObjectId(
        orderId
      )
    ) {
      throw new OrderPlacementError(
        "Invalid order was created.",
        500
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE INVOICE
    |--------------------------------------------------------------------------
    |
    | Invoice is part of the same MongoDB transaction.
    |
    | If invoice creation fails:
    |
    | - order rolls back
    | - stock deductions roll back
    | - cart remains intact
    | - NO product_purchased learning gets recorded
    |
    |--------------------------------------------------------------------------
    */

    const invoice =
      await createInvoiceFromOrder(
        order._id,
        session
      );

    if (
      !invoice
    ) {
      throw new OrderPlacementError(
        "Invoice creation failed.",
        500
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CLEAR CART
    |--------------------------------------------------------------------------
    |
    | Clear only after Order + Invoice have been created successfully inside
    | the transaction.
    |
    |--------------------------------------------------------------------------
    */

    cart.items =
      [];

    await cart.save(
      {
        session,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | COMMIT TRANSACTION
    |--------------------------------------------------------------------------
    |
    | THIS IS THE REAL ORDER SUCCESS BOUNDARY.
    |
    | Only after this line succeeds may customer purchase behaviour be sent
    | to the learning / business-intelligence pipeline.
    |
    |--------------------------------------------------------------------------
    */

    await session.commitTransaction();
        /*
    |--------------------------------------------------------------------------
    | RECORD REAL PURCHASE LEARNING
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | MongoDB transaction has already committed successfully.
    |
    | Therefore:
    |
    | - Order exists ✅
    | - Inventory deduction exists ✅
    | - Invoice exists ✅
    | - Cart is cleared ✅
    |
    | Only now do we record product_purchased behaviour.
    |
    |--------------------------------------------------------------------------
    */

    try {
      await recordCommittedPurchaseLearning(
        {
          userId,

          order,

          orderItems,

          paymentMethod,
        }
      );
    } catch (
      learningError
    ) {
      /*
      |--------------------------------------------------------------------------
      | LEARNING MUST NEVER BREAK A COMMITTED ORDER
      |--------------------------------------------------------------------------
      |
      | At this point the order transaction has already committed.
      |
      | Analytics failure must therefore NEVER return an order-placement error
      | to the customer.
      |
      |--------------------------------------------------------------------------
      */

      console.error(
        "ORDER PURCHASE LEARNING ERROR:",
        learningError
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SUCCESS RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        message:
          paymentMethod ===
          "ONLINE"
            ? "Order created successfully. Online payment is pending confirmation."
            : "Order placed successfully.",

        /*
        |--------------------------------------------------------------------------
        | ORDER
        |--------------------------------------------------------------------------
        */

        orderId:
          String(
            order._id
          ),

        orderStatus:
          order.orderStatus,

        /*
        |--------------------------------------------------------------------------
        | INVOICE
        |--------------------------------------------------------------------------
        */

        invoiceId:
          String(
            invoice._id
          ),

        invoiceNumber:
          invoice.invoiceNumber,

        /*
        |--------------------------------------------------------------------------
        | PAYMENT
        |--------------------------------------------------------------------------
        */

        paymentStatus:
          order.paymentStatus,

        paymentMethod,

        /*
        |--------------------------------------------------------------------------
        | TOTALS
        |--------------------------------------------------------------------------
        */

        subtotal:
          order.subtotal,

        shippingCharge:
          order.shippingCharge,

        discount:
          order.discount,

        totalAmount:
          order.totalAmount,

        /*
        |--------------------------------------------------------------------------
        | COUPON
        |--------------------------------------------------------------------------
        |
        | Coupon value from client is not trusted yet.
        |
        |--------------------------------------------------------------------------
        */

        couponCode:
          couponCode ||
          null,

        couponApplied:
          false,
      },
      {
        status:
          201,
      }
    );
  } catch (
    error:
      unknown
  ) {
    /*
    |--------------------------------------------------------------------------
    | ROLLBACK
    |--------------------------------------------------------------------------
    |
    | If transaction is still active, undo:
    |
    | - stock changes
    | - sold changes
    | - order
    | - invoice
    | - cart clearing
    |
    | Because purchase learning only happens after commitTransaction(),
    | rolled-back orders never create product_purchased events.
    |
    |--------------------------------------------------------------------------
    */

    if (
      session.inTransaction()
    ) {
      try {
        await session.abortTransaction();
      } catch (
        rollbackError
      ) {
        console.error(
          "ORDER ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    console.error(
      "PLACE ORDER ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | KNOWN ORDER ERROR
    |--------------------------------------------------------------------------
    */

    if (
      error instanceof
      OrderPlacementError
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            error.message,
        },
        {
          status:
            error.status,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | MONGOOSE VALIDATION ERROR
    |--------------------------------------------------------------------------
    */

    if (
      error instanceof
      mongoose.Error.ValidationError
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            error.message ||
            "Order validation failed.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | UNKNOWN ERROR
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to place order. Please try again.",
      },
      {
        status:
          500,
      }
    );
  } finally {
    /*
    |--------------------------------------------------------------------------
    | END MONGOOSE SESSION
    |--------------------------------------------------------------------------
    */

    await session.endSession();
  }
}