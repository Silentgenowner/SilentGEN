import {
  NextRequest,
  NextResponse,
} from "next/server";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import Order from "@/models/Order";
import Product from "@/models/Product";

import {
  recordLearningBusinessEvent,
} from "@/lib/ai/learning/customerLearningEngine";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type TokenPayload = {
  id?: string;

  userId?: string;
};

type CancelOrderBody = {
  orderId?: string;

  reason?: string;
};

/*
|--------------------------------------------------------------------------
| CUSTOM ERROR
|--------------------------------------------------------------------------
*/

class CancelOrderError
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
      "CancelOrderError";

    this.status =
      status;
  }
}

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
    Math.floor(
      safeNumber(
        value
      )
    );

  if (
    parsed <=
    0
  ) {
    return 0;
  }

  return parsed;
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
| RESTORE EXACT INVENTORY
|--------------------------------------------------------------------------
|
| Order placement સમયે જે exact inventoryમાંથી quantity deduct થઈ હતી,
| cancellation વખતે એ જ inventory level પર પાછી restore કરવી.
|
| Priority:
|
| 1. Color + Size
| 2. Color stock
| 3. Product size stock
| 4. Global product stock
|
|--------------------------------------------------------------------------
*/

async function restoreInventory({
  item,
  session,
}: {
  item:
    any;

  session:
    mongoose.ClientSession;
}) {
  const productId =
    String(
      item?.product?._id ||
        item?.product ||
        ""
    );

  if (
    !productId ||
    !mongoose.Types.ObjectId.isValid(
      productId
    )
  ) {
    throw new CancelOrderError(
      "Order contains an invalid product.",
      500
    );
  }

  const quantity =
    safeQuantity(
      item?.quantity
    );

  if (
    quantity <=
    0
  ) {
    throw new CancelOrderError(
      "Order contains an invalid product quantity.",
      500
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT
  |--------------------------------------------------------------------------
  |
  | Soft-deleted product પણ અહીં શોધવો જરૂરી છે.
  |
  | Product customer-facing shopમાંથી delete/archive થઈ ગયો હોય તો પણ
  | cancelled orderનું previously deducted stock restore થવું જોઈએ.
  |
  |--------------------------------------------------------------------------
  */

  const product:
    any =
    await Product.findById(
      productId
    ).session(
      session
    );

  if (
    !product
  ) {
    throw new CancelOrderError(
      `${item?.name || "Product"} no longer exists, so inventory could not be restored.`,
      409
    );
  }

  const size =
    cleanString(
      item?.size
    );

  const color =
    cleanString(
      item?.color
    );

  let restored =
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
          sizeEntry
        ) {
          sizeEntry.stock =
            Math.max(
              safeNumber(
                sizeEntry.stock
              ),
              0
            ) +
            quantity;

          restored =
            true;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | COLOR STOCK
      |--------------------------------------------------------------------------
      */

      if (
        !restored &&
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
        variant.stock =
          Math.max(
            safeNumber(
              variant.stock
            ),
            0
          ) +
          quantity;

        restored =
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
    !restored &&
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
      sizeEntry
    ) {
      sizeEntry.stock =
        Math.max(
          safeNumber(
            sizeEntry.stock
          ),
          0
        ) +
        quantity;

      restored =
        true;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | GLOBAL STOCK FALLBACK
  |--------------------------------------------------------------------------
  */

  if (
    !restored
  ) {
    product.stock =
      Math.max(
        safeNumber(
          product.stock
        ),
        0
      ) +
      quantity;
  }

  /*
  |--------------------------------------------------------------------------
  | SOLD COUNT
  |--------------------------------------------------------------------------
  |
  | Order placement દરમિયાન sold quantity increase થઈ હતી.
  | Successful cancellation પછી એ quantity પાછી reduce થાય છે.
  |
  |--------------------------------------------------------------------------
  */

  product.sold =
    Math.max(
      safeNumber(
        product.sold
      ) -
        quantity,
      0
    );

  /*
  |--------------------------------------------------------------------------
  | SAVE PRODUCT
  |--------------------------------------------------------------------------
  |
  | Existing Product model lifecycle/pre-save stock calculation preserve છે.
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
| BUILD CANCELLATION ANALYTICS SNAPSHOT
|--------------------------------------------------------------------------
|
| ONE cancellation event = ONE order cancellation.
|
| Product/item details metadataમાં snapshot તરીકે રાખીએ છીએ.
|
| This prevents:
|
| 1 order with 4 items
|
| from incorrectly becoming:
|
| 4 cancellation events.
|
|--------------------------------------------------------------------------
*/

function buildCancellationMetadata(
  order:
    any,
  reason:
    string
) {
  const items =
    Array.isArray(
      order?.items
    )
      ? order.items
      : [];

  const productIds:
    string[] =
    [];

  const productNames:
    string[] =
    [];

  const variants:
    string[] =
    [];

  let totalQuantity =
    0;

  for (
    const item of
    items
  ) {
    const productId =
      String(
        item?.product?._id ||
          item?.product ||
          ""
      );

    if (
      productId &&
      mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      productIds.push(
        productId
      );
    }

    const productName =
      cleanString(
        item?.name
      );

    if (
      productName
    ) {
      productNames.push(
        productName
      );
    }

    const quantity =
      safeQuantity(
        item?.quantity
      );

    totalQuantity +=
      quantity;

    const size =
      cleanString(
        item?.size
      );

    const color =
      cleanString(
        item?.color
      );

    const variantParts =
      [
        productName,
        color
          ? `color:${color}`
          : "",
        size
          ? `size:${size}`
          : "",
        quantity >
          0
          ? `qty:${quantity}`
          : "",
      ].filter(
        Boolean
      );

    if (
      variantParts.length >
      0
    ) {
      variants.push(
        variantParts.join(
          " | "
        )
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | METADATA ARRAYS ARE LIMITED
  |--------------------------------------------------------------------------
  |
  | Customer learning metadata sanitizer already limits arrays.
  | We also limit explicitly here.
  |
  |--------------------------------------------------------------------------
  */

  return {
    context:
      "real_committed_order_cancellation",

    cancellationChannel:
      "customer_order_api",

    reason,

    itemCount:
      items.length,

    totalQuantity,

    productIds:
      Array.from(
        new Set(
          productIds
        )
      ).slice(
        0,
        20
      ),

    productNames:
      Array.from(
        new Set(
          productNames
        )
      ).slice(
        0,
        20
      ),

    variants:
      variants.slice(
        0,
        20
      ),

    totalAmount:
      Math.max(
        safeNumber(
          order?.totalAmount
        ),
        0
      ),

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

    paymentMethod:
      cleanString(
        order?.paymentMethod
      ),

    paymentStatus:
      cleanString(
        order?.paymentStatus
      ),

    refundStatus:
      cleanString(
        order?.refundStatus
      ),

    orderStatus:
      cleanString(
        order?.orderStatus
      ),

    trackingNumberPresent:
      Boolean(
        cleanString(
          order?.trackingNumber
        )
      ),

    courierPartner:
      cleanString(
        order?.courierPartner
      ),
  };
}

/*
|--------------------------------------------------------------------------
| RECORD COMMITTED CANCELLATION
|--------------------------------------------------------------------------
|
| Called ONLY after:
|
| await session.commitTransaction()
|
| One order cancellation creates exactly one business event.
|
|--------------------------------------------------------------------------
*/

async function recordCommittedCancellation({
  userId,
  orderId,
  order,
  reason,
}: {
  userId:
    string;

  orderId:
    string;

  order:
    any;

  reason:
    string;
}) {
  if (
    !mongoose.Types.ObjectId.isValid(
      orderId
    )
  ) {
    return;
  }

  await recordLearningBusinessEvent(
    {
      eventType:
        "order_cancelled",

      source:
        "order",

      userId,

      sessionId:
        null,

      conversationId:
        null,

      /*
      |--------------------------------------------------------------------------
      | ORDER-LEVEL EVENT
      |--------------------------------------------------------------------------
      |
      | Deliberately no single productId.
      |
      | An order can contain multiple products, but cancellation count should
      | remain one event per cancelled order.
      |
      |--------------------------------------------------------------------------
      */

      productId:
        null,

      orderId,

      metadata:
        buildCancellationMetadata(
          order,
          reason
        ),

      /*
      |--------------------------------------------------------------------------
      | NO PRODUCT HYDRATION REQUIRED
      |--------------------------------------------------------------------------
      */

      hydrateProductSnapshot:
        false,
    }
  );
}

/*
|--------------------------------------------------------------------------
| CANCEL ORDER
|--------------------------------------------------------------------------
*/

export async function POST(
  req:
    NextRequest
) {
  let session:
    mongoose.ClientSession |
    null =
    null;

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
      throw new CancelOrderError(
        "Server authentication configuration is missing.",
        500
      );
    }

    /*
    |--------------------------------------------------------------------------
    | AUTH TOKEN
    |--------------------------------------------------------------------------
    */

    const token =
      req.cookies.get(
        "token"
      )?.value;

    if (
      !token
    ) {
      throw new CancelOrderError(
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
      throw new CancelOrderError(
        "Invalid or expired login session.",
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
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      throw new CancelOrderError(
        "Invalid customer account.",
        401
      );
    }

    /*
    |--------------------------------------------------------------------------
    | BODY
    |--------------------------------------------------------------------------
    */

    let body:
      CancelOrderBody;

    try {
      body =
        (
          await req.json()
        ) as CancelOrderBody;
    } catch {
      throw new CancelOrderError(
        "Invalid request body.",
        400
      );
    }

    const orderId =
      cleanString(
        body.orderId
      );

    const reason =
      cleanString(
        body.reason
      ) ||
      "Cancelled by customer";

    /*
    |--------------------------------------------------------------------------
    | ORDER ID
    |--------------------------------------------------------------------------
    */

    if (
      !orderId
    ) {
      throw new CancelOrderError(
        "Order ID is required.",
        400
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      throw new CancelOrderError(
        "Invalid order ID.",
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | TRANSACTION
    |--------------------------------------------------------------------------
    */

    session =
      await mongoose.startSession();

    session.startTransaction();

    /*
    |--------------------------------------------------------------------------
    | FIND CUSTOMER ORDER
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Order ownership field is:
    |
    | user
    |
    | not userId.
    |
    |--------------------------------------------------------------------------
    */

    const order:
      any =
      await Order.findOne(
        {
          _id:
            orderId,

          user:
            userId,
        }
      ).session(
        session
      );

    if (
      !order
    ) {
      throw new CancelOrderError(
        "Order not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ALREADY CANCELLED
    |--------------------------------------------------------------------------
    |
    | This also prevents duplicate order_cancelled events from repeated
    | customer POST requests.
    |
    |--------------------------------------------------------------------------
    */

    if (
      order.orderStatus ===
      "Cancelled"
    ) {
      throw new CancelOrderError(
        "This order is already cancelled.",
        409
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CANCELLATION ELIGIBILITY
    |--------------------------------------------------------------------------
    */

    if (
      ![
        "Placed",
        "Confirmed",
      ].includes(
        order.orderStatus
      )
    ) {
      throw new CancelOrderError(
        `This order cannot be cancelled because its current status is ${order.orderStatus}.`,
        409
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ORDER ITEMS
    |--------------------------------------------------------------------------
    */

    if (
      !Array.isArray(
        order.items
      ) ||
      order.items.length ===
        0
    ) {
      throw new CancelOrderError(
        "Order has no valid products.",
        500
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE ALL INVENTORY
    |--------------------------------------------------------------------------
    */

    for (
      const item of
      order.items
    ) {
      await restoreInventory(
        {
          item,

          session,
        }
      );
    }
        /*
    |--------------------------------------------------------------------------
    | UPDATE ORDER
    |--------------------------------------------------------------------------
    */

    order.orderStatus =
      "Cancelled";

    order.cancelReason =
      reason;

    order.cancelledAt =
      new Date();

    /*
    |--------------------------------------------------------------------------
    | PAID ORDER → REFUND REQUESTED
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Cancellation itself does NOT mean money has already been refunded.
    |
    | Therefore:
    |
    | paymentStatus stays "Paid"
    |
    | and:
    |
    | refundStatus = "Requested"
    |
    |--------------------------------------------------------------------------
    */

    if (
      order.paymentStatus ===
      "Paid"
    ) {
      order.refundStatus =
        "Requested";
    }

    /*
    |--------------------------------------------------------------------------
    | DELIVERY HISTORY
    |--------------------------------------------------------------------------
    */

    if (
      !Array.isArray(
        order.deliveryHistory
      )
    ) {
      order.deliveryHistory =
        [];
    }

    order.deliveryHistory.push(
      {
        status:
          "Cancelled",

        date:
          new Date(),

        note:
          reason,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | SAVE ORDER
    |--------------------------------------------------------------------------
    */

    await order.save(
      {
        session,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | COMMIT TRANSACTION
    |--------------------------------------------------------------------------
    |
    | THIS IS THE REAL CANCELLATION SUCCESS BOUNDARY.
    |
    | By the time this succeeds:
    |
    | - order status = Cancelled
    | - cancel reason saved
    | - cancelledAt saved
    | - inventory restored
    | - sold count reduced
    | - refund marked Requested when applicable
    | - delivery history updated
    |
    | Only AFTER this commit do we send order_cancelled to intelligence.
    |
    |--------------------------------------------------------------------------
    */

    await session.commitTransaction();

    /*
    |--------------------------------------------------------------------------
    | RECORD REAL CANCELLATION LEARNING
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Exactly ONE event is generated for the cancelled order.
    |
    | We do NOT create one cancellation event per order item.
    |
    |--------------------------------------------------------------------------
    */

    try {
      await recordCommittedCancellation(
        {
          userId,

          orderId:
            String(
              order._id
            ),

          order,

          reason,
        }
      );
    } catch (
      learningError
    ) {
      /*
      |--------------------------------------------------------------------------
      | LEARNING FAILURE MUST NEVER BREAK A COMMITTED CANCELLATION
      |--------------------------------------------------------------------------
      |
      | Transaction is already committed.
      |
      | The customer's valid cancellation must remain successful even if
      | analytics/intelligence recording temporarily fails.
      |
      |--------------------------------------------------------------------------
      */

      console.error(
        "ORDER CANCELLATION LEARNING ERROR:",
        learningError
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        message:
          order.paymentStatus ===
          "Paid"
            ? "Order cancelled successfully. Inventory has been restored and refund has been marked as requested."
            : "Order cancelled successfully. Inventory has been restored.",

        order: {
          orderId:
            String(
              order._id
            ),

          orderStatus:
            order.orderStatus,

          paymentStatus:
            order.paymentStatus,

          refundStatus:
            order.refundStatus,

          cancelReason:
            order.cancelReason,

          cancelledAt:
            order.cancelledAt,

          totalAmount:
            order.totalAmount,

          trackingNumber:
            order.trackingNumber ||
            "",

          courierPartner:
            order.courierPartner ||
            "",
        },

        /*
        |--------------------------------------------------------------------------
        | SHIPROCKET
        |--------------------------------------------------------------------------
        |
        | Existing behaviour preserved.
        |
        | If tracking/AWB already exists, shipment cancellation may require a
        | separate Shiprocket-side action.
        |
        |--------------------------------------------------------------------------
        */

        shiprocketActionRequired:
          Boolean(
            cleanString(
              order.trackingNumber
            )
          ),
      },
      {
        status:
          200,
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
    */

    if (
      session &&
      session.inTransaction()
    ) {
      try {
        await session.abortTransaction();
      } catch (
        rollbackError
      ) {
        console.error(
          "CANCEL ORDER ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    console.error(
      "CANCEL ORDER ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | KNOWN ERROR
    |--------------------------------------------------------------------------
    */

    if (
      error instanceof
      CancelOrderError
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
            "Order cancellation validation failed.",
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
          "Unable to cancel order. Please try again.",
      },
      {
        status:
          500,
      }
    );
  } finally {
    /*
    |--------------------------------------------------------------------------
    | END SESSION
    |--------------------------------------------------------------------------
    */

    if (
      session
    ) {
      await session.endSession();
    }
  }
}