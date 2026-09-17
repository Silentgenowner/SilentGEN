import {
  NextRequest,
  NextResponse,
} from "next/server";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import Cart from "@/models/Cart";
import Product from "@/models/Product";
import User from "@/models/User";

import {
  calculateCartTotals,
} from "@/lib/cartTotals";

import {
  getProductVariantImage,
  resolveProductInventory,
} from "@/lib/ai/tools/productTools";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type TokenPayload = {
  id?: string;

  userId?: string;
};

type UpdateCartBody = {
  productId?: string;

  size?: string;

  color?: string;

  quantity?: number;

  action?:
    | "increase"
    | "decrease";
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
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
  value: unknown
) {
  return cleanString(
    value
  ).toLowerCase();
}

function safeNumber(
  value: unknown
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| SERIALIZE CART
|--------------------------------------------------------------------------
*/

function serializeCart(
  cart: any
) {
  const items =
    Array.isArray(
      cart?.items
    )
      ? cart.items.map(
          (
            item: any
          ) => ({
            productId:
              String(
                item.productId ||
                  ""
              ),

            sku:
              String(
                item.sku ||
                  ""
              ),

            name:
              String(
                item.name ||
                  ""
              ),

            brand:
              String(
                item.brand ||
                  ""
              ),

            category:
              String(
                item.category ||
                  ""
              ),

            image:
              String(
                item.image ||
                  ""
              ),

            price:
              Number(
                item.price ||
                  0
              ),

            stock:
              Number(
                item.stock ||
                  0
              ),

            status:
              String(
                item.status ||
                  ""
              ),

            quantity:
              Number(
                item.quantity ||
                  0
              ),

            size:
              String(
                item.size ||
                  ""
              ),

            color:
              String(
                item.color ||
                  ""
              ),
          })
        )
      : [];

const purchasableItems =
  items.filter(
    (
      item: {
        productId: string;
        sku: string;
        name: string;
        brand: string;
        category: string;
        image: string;
        price: number;
        stock: number;
        status: string;
        quantity: number;
        size: string;
        color: string;
      }
    ) =>
      item.status ===
        "Active" &&
      item.stock >
        0 &&
      item.quantity >
        0
  );

  const totals =
    calculateCartTotals(
      purchasableItems
    );

  return {
    items,

    summary: {
      totalItems:
        Number(
          totals.totalItems ||
            0
        ),

      subtotal:
        Number(
          totals.subtotal ||
            0
        ),

      shipping:
        Number(
          totals.shipping ||
            0
        ),

      grandTotal:
        Number(
          totals.grandTotal ||
            0
        ),
    },
  };
}

/*
|--------------------------------------------------------------------------
| PATCH CART QUANTITY
|--------------------------------------------------------------------------
*/

export async function PATCH(
  request:
    NextRequest
) {
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
      process.env.JWT_SECRET?.trim();

    if (
      !jwtSecret
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Server authentication configuration is missing.",
        },
        {
          status:
            500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | TOKEN
    |--------------------------------------------------------------------------
    */

    const token =
      request.cookies.get(
        "token"
      )?.value;

    if (
      !token
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Please login first.",
        },
        {
          status:
            401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY TOKEN
    |--------------------------------------------------------------------------
    */

    let decoded:
      TokenPayload;

    try {
      decoded =
        jwt.verify(
          token,
          jwtSecret
        ) as TokenPayload;
    } catch {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid or expired login session.",
        },
        {
          status:
            401,
        }
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
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid customer account.",
        },
        {
          status:
            401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY USER
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
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Customer account not found.",
        },
        {
          status:
            401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | BODY
    |--------------------------------------------------------------------------
    */

    let body:
      UpdateCartBody;

    try {
      body =
        (await request.json()) as UpdateCartBody;
    } catch {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid request body.",
        },
        {
          status:
            400,
        }
      );
    }

    const productId =
      cleanString(
        body.productId
      );

    const requestedSize =
      cleanString(
        body.size
      );

    const requestedColor =
      cleanString(
        body.color
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT ID
    |--------------------------------------------------------------------------
    */

    if (
      !productId ||
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid product id.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CART
    |--------------------------------------------------------------------------
    */

    const cart =
      await Cart.findOne({
        userId,
      });

    if (
      !cart ||
      !Array.isArray(
        cart.items
      ) ||
      cart.items.length ===
        0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Cart is empty.",
        },
        {
          status:
            404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FIND EXACT CART VARIANT
    |--------------------------------------------------------------------------
    */

    const itemIndex =
      cart.items.findIndex(
        (
          item: any
        ) => {
          const sameProduct =
            String(
              item.productId
            ) ===
            productId;

          const sameSize =
            normalizeValue(
              item.size
            ) ===
            normalizeValue(
              requestedSize
            );

          const sameColor =
            normalizeValue(
              item.color
            ) ===
            normalizeValue(
              requestedColor
            );

          return (
            sameProduct &&
            sameSize &&
            sameColor
          );
        }
      );

    if (
      itemIndex ===
      -1
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "This exact product, size and color combination was not found in your cart.",
        },
        {
          status:
            404,
        }
      );
    }

    const cartItem =
      cart.items[
        itemIndex
      ] as any;

    /*
    |--------------------------------------------------------------------------
    | PRODUCT
    |--------------------------------------------------------------------------
    */

    const product =
      await Product.findOne({
        _id:
          productId,

        isDeleted: {
          $ne:
            true,
        },
      }).lean();

    if (
      !product
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Product is no longer available.",
        },
        {
          status:
            404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT STATUS
    |--------------------------------------------------------------------------
    */

    if (
      product.status !==
      "Active"
    ) {
      cartItem.status =
        "Inactive";

      cartItem.stock =
        0;

      await cart.save();

      return NextResponse.json(
        {
          success:
            false,

          message:
            "Product is currently unavailable.",
        },
        {
          status:
            409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | EXACT VARIANT STOCK
    |--------------------------------------------------------------------------
    */

    const inventory =
      resolveProductInventory(
        product,
        {
          size:
            requestedSize ||
            null,

          color:
            requestedColor ||
            null,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | SIZE VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      requestedSize &&
      !inventory.sizeAvailable
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            `Size ${requestedSize} is no longer available for this product.`,
        },
        {
          status:
            409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | COLOR VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      requestedColor &&
      !inventory.colorAvailable
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            `Color ${requestedColor} is no longer available for this product.`,
        },
        {
          status:
            409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | STOCK VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !inventory.available ||
      inventory.stock <=
        0
    ) {
      cartItem.stock =
        0;

      cartItem.status =
        "Inactive";

      await cart.save();

      return NextResponse.json(
        {
          success:
            false,

          message:
            inventory.message ||
            "Selected product variant is currently out of stock.",
        },
        {
          status:
            409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT QUANTITY
    |--------------------------------------------------------------------------
    */

    const currentQuantity =
      Math.max(
        Math.floor(
          safeNumber(
            cartItem.quantity
          )
        ),
        1
      );

    /*
    |--------------------------------------------------------------------------
    | DETERMINE NEXT QUANTITY
    |--------------------------------------------------------------------------
    |
    | New format:
    |
    | {
    |   quantity: 3
    | }
    |
    | Old format still supported:
    |
    | {
    |   action: "increase"
    | }
    |
    |--------------------------------------------------------------------------
    */

    let nextQuantity:
      number;

    if (
      typeof body.quantity ===
        "number" &&
      Number.isFinite(
        body.quantity
      )
    ) {
      nextQuantity =
        Math.floor(
          body.quantity
        );
    } else if (
      body.action ===
      "increase"
    ) {
      nextQuantity =
        currentQuantity +
        1;
    } else if (
      body.action ===
      "decrease"
    ) {
      nextQuantity =
        currentQuantity -
        1;
    } else {
      return NextResponse.json(
        {
          success:
            false,

          message:
            'Provide either quantity or action "increase"/"decrease".',
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | REMOVE WHEN DECREASED BELOW 1
    |--------------------------------------------------------------------------
    */

    if (
      nextQuantity <
      1
    ) {
      cart.items.splice(
        itemIndex,
        1
      );

      await cart.save();

      const serialized =
        serializeCart(
          cart
        );

      return NextResponse.json(
        {
          success:
            true,

          removed:
            true,

          message:
            `${product.name || "Product"} removed from cart.`,

          ...serialized,
        },
        {
          status:
            200,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | MAX QUANTITY
    |--------------------------------------------------------------------------
    */

    if (
      nextQuantity >
      100
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Maximum quantity allowed is 100.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | EXACT VARIANT STOCK LIMIT
    |--------------------------------------------------------------------------
    */

    if (
      nextQuantity >
      inventory.stock
    ) {
      return NextResponse.json(
        {
          success:
            false,

          stock:
            inventory.stock,

          message:
            `Only ${inventory.stock} item(s) are currently available for this exact variant.`,
        },
        {
          status:
            409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SYNC CART ITEM
    |--------------------------------------------------------------------------
    */

    cartItem.quantity =
      nextQuantity;

    cartItem.sku =
      String(
        product.sku ||
          cartItem.sku ||
          ""
      );

    cartItem.name =
      String(
        product.name ||
          cartItem.name ||
          ""
      );

    cartItem.brand =
      String(
        product.brand ||
          cartItem.brand ||
          "SilentGEN"
      );

    cartItem.category =
      String(
        product.category ||
          cartItem.category ||
          ""
      );

    cartItem.price =
      Math.max(
        Number(
          product.price ||
            0
        ),
        0
      );

    cartItem.stock =
      inventory.stock;

    cartItem.status =
      "Active";

    /*
    |--------------------------------------------------------------------------
    | CANONICAL SIZE
    |--------------------------------------------------------------------------
    */

    if (
      inventory.size
    ) {
      cartItem.size =
        inventory.size;
    }

    /*
    |--------------------------------------------------------------------------
    | CANONICAL COLOR
    |--------------------------------------------------------------------------
    */

    if (
      inventory.color
    ) {
      cartItem.color =
        inventory.color;
    }

    /*
    |--------------------------------------------------------------------------
    | COLOR VARIANT IMAGE
    |--------------------------------------------------------------------------
    */

    cartItem.image =
      inventory.image ||
      getProductVariantImage(
        product,
        inventory.color ||
          requestedColor
      ) ||
      String(
        product.thumbnail ||
          product.images?.[0] ||
          cartItem.image ||
          ""
      );

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    await cart.save();

    /*
    |--------------------------------------------------------------------------
    | TOTALS
    |--------------------------------------------------------------------------
    */

    const serialized =
      serializeCart(
        cart
      );

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
          `${product.name || "Product"} quantity updated to ${nextQuantity}.`,

        updatedItem: {
          productId,

          quantity:
            nextQuantity,

          size:
            String(
              cartItem.size ||
                ""
            ),

          color:
            String(
              cartItem.color ||
                ""
            ),

          stock:
            inventory.stock,

          image:
            String(
              cartItem.image ||
                ""
            ),
        },

        ...serialized,
      },
      {
        status:
          200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Update Cart Error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to update cart quantity. Please try again.",
      },
      {
        status:
          500,
      }
    );
  }
}