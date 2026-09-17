import {
  NextRequest,
  NextResponse,
} from "next/server";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import Cart from "@/models/Cart";
import User from "@/models/User";

import {
  calculateCartTotals,
} from "@/lib/cartTotals";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type TokenPayload = {
  id?: string;
  userId?: string;
};

type RemoveCartBody = {
  productId?: string;

  size?: string;

  color?: string;
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
              Math.max(
                safeNumber(
                  item.price
                ),
                0
              ),

            stock:
              Math.max(
                Math.floor(
                  safeNumber(
                    item.stock
                  )
                ),
                0
              ),

            status:
              String(
                item.status ||
                  ""
              ),

            quantity:
              Math.max(
                Math.floor(
                  safeNumber(
                    item.quantity
                  )
                ),
                1
              ),

            size:
              cleanString(
                item.size
              ),

            color:
              cleanString(
                item.color
              ),

            available:
              item.status ===
                "Active" &&
              safeNumber(
                item.stock
              ) >
                0,
          })
        )
      : [];

  const purchasableItems =
    items.filter(
      (
        item: any
      ) =>
        item.available ===
          true &&
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
| DELETE CART ITEM
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request: NextRequest
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
      RemoveCartBody;

    try {
      body =
        (await request.json()) as RemoveCartBody;
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
    | FIND EXACT VARIANT
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

    /*
    |--------------------------------------------------------------------------
    | REMOVED ITEM SNAPSHOT
    |--------------------------------------------------------------------------
    */

    const item =
      cart.items[
        itemIndex
      ] as any;

    const removedItem = {
      productId,

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

      image:
        String(
          item.image ||
            ""
        ),

      price:
        Math.max(
          safeNumber(
            item.price
          ),
          0
        ),

      quantity:
        Math.max(
          Math.floor(
            safeNumber(
              item.quantity
            )
          ),
          1
        ),

      size:
        cleanString(
          item.size
        ),

      color:
        cleanString(
          item.color
        ),
    };

    /*
    |--------------------------------------------------------------------------
    | REMOVE
    |--------------------------------------------------------------------------
    */

    cart.items.splice(
      itemIndex,
      1
    );

    await cart.save();

    /*
    |--------------------------------------------------------------------------
    | SERIALIZE UPDATED CART
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
          `${removedItem.name || "Product"} removed from cart successfully.`,

        removedItem,

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
      "Remove Cart Error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to remove product from cart. Please try again.",
      },
      {
        status:
          500,
      }
    );
  }
}