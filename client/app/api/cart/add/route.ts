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

import {
  recordAddToCartLearningSafely,
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

type AddCartBody = {
  productId?: string;
  quantity?: number;
  size?: string;
  color?: string;
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

/*
|--------------------------------------------------------------------------
| SERIALIZE CART
|--------------------------------------------------------------------------
*/

function serializeCart(
  cart:
    any
) {
  const items =
    Array.isArray(
      cart?.items
    )
      ? cart.items.map(
          (
            item:
              any
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
        item:
          any
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
| POST ADD TO CART
|--------------------------------------------------------------------------
*/

export async function POST(
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
      process.env
        .JWT_SECRET
        ?.trim();

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
      AddCartBody;

    try {
      body =
        (
          await request.json()
        ) as AddCartBody;
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
    | QUANTITY
    |--------------------------------------------------------------------------
    */

    const quantity =
      body.quantity ===
      undefined
        ? 1
        : Math.floor(
            safeNumber(
              body.quantity
            )
          );

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity <
        1
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Quantity must be at least 1.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      quantity >
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
    | PRODUCT
    |--------------------------------------------------------------------------
    */

    const product =
      await Product.findOne(
        {
          _id:
            productId,

          isDeleted: {
            $ne:
              true,
          },
        }
      ).lean();

    if (
      !product
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Product not found.",
        },
        {
          status:
            404,
        }
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
    | EXACT INVENTORY
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
    | REQUIRED SIZE
    |--------------------------------------------------------------------------
    */

    if (
      inventory.sizeRequired &&
      !requestedSize
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Please select a size.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | REQUIRED COLOR
    |--------------------------------------------------------------------------
    */

    if (
      inventory.colorRequired &&
      !requestedColor
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Please select a color.",
        },
        {
          status:
            400,
        }
      );
    }

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
            `Size ${requestedSize} is not available for this product.`,
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
            `Color ${requestedColor} is not available for this product.`,
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
      return NextResponse.json(
        {
          success:
            false,

          message:
            inventory.message ||
            "Selected product variant is out of stock.",
        },
        {
          status:
            409,
        }
      );
    }

    if (
      quantity >
      inventory.stock
    ) {
      return NextResponse.json(
        {
          success:
            false,

          stock:
            inventory.stock,

          message:
            `Only ${inventory.stock} item(s) are available for this exact variant.`,
        },
        {
          status:
            409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CANONICAL VARIANT VALUES
    |--------------------------------------------------------------------------
    */

    const finalSize =
      inventory.size ||
      requestedSize;

    const finalColor =
      inventory.color ||
      requestedColor;

    /*
    |--------------------------------------------------------------------------
    | GET / CREATE CART
    |--------------------------------------------------------------------------
    */

    let cart =
      await Cart.findOne(
        {
          userId,
        }
      );

    if (
      !cart
    ) {
      cart =
        new Cart(
          {
            userId,

            items:
              [],
          }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FIND SAME EXACT VARIANT
    |--------------------------------------------------------------------------
    |
    | Cart identity:
    |
    | productId + normalized size + normalized color
    |
    |--------------------------------------------------------------------------
    */

    const existingIndex =
      cart.items.findIndex(
        (
          item:
            any
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
              finalSize
            );

          const sameColor =
            normalizeValue(
              item.color
            ) ===
            normalizeValue(
              finalColor
            );

          return (
            sameProduct &&
            sameSize &&
            sameColor
          );
        }
      );

    /*
    |--------------------------------------------------------------------------
    | TRACK WHETHER VARIANT ALREADY EXISTED
    |--------------------------------------------------------------------------
    |
    | This is useful analytics metadata only.
    |
    | Both cases below are legitimate "Add to Cart" actions:
    |
    | new variant:
    | cart did not contain it before
    |
    | existing variant:
    | customer deliberately pressed Add to Cart again, adding `quantity`
    |
    | Quantity PATCH/Update route is separate and will NOT create this event.
    |
    |--------------------------------------------------------------------------
    */

    const wasExistingVariant =
      existingIndex !==
      -1;

    let previousQuantity =
      0;

    let finalCartQuantity =
      quantity;

    /*
    |--------------------------------------------------------------------------
    | EXISTING VARIANT
    |--------------------------------------------------------------------------
    */

    if (
      existingIndex !==
      -1
    ) {
      const existingItem =
        cart.items[
          existingIndex
        ] as any;

      const currentQuantity =
        Math.max(
          Math.floor(
            safeNumber(
              existingItem.quantity
            )
          ),
          0
        );

      previousQuantity =
        currentQuantity;

      const nextQuantity =
        currentQuantity +
        quantity;

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

            currentQuantity,

            message:
              `You already have ${currentQuantity} item(s) in your cart. Only ${inventory.stock} item(s) are available for this exact variant.`,
          },
          {
            status:
              409,
          }
        );
      }

      finalCartQuantity =
        nextQuantity;

      existingItem.quantity =
        nextQuantity;

      existingItem.sku =
        String(
          product.sku ||
            existingItem.sku ||
            ""
        );

      existingItem.name =
        String(
          product.name ||
            existingItem.name ||
            ""
        );

      existingItem.brand =
        String(
          product.brand ||
            existingItem.brand ||
            "SilentGEN"
        );

      existingItem.category =
        String(
          product.category ||
            existingItem.category ||
            ""
        );

      existingItem.price =
        Math.max(
          Number(
            product.price ||
              0
          ),
          0
        );

      existingItem.stock =
        inventory.stock;

      existingItem.status =
        "Active";

      existingItem.size =
        finalSize;

      existingItem.color =
        finalColor;

      existingItem.image =
        inventory.image ||
        getProductVariantImage(
          product,
          finalColor
        ) ||
        String(
          product.thumbnail ||
            product.images?.[0] ||
            existingItem.image ||
            ""
        );
    } else {
      /*
      |--------------------------------------------------------------------------
      | ADD NEW VARIANT
      |--------------------------------------------------------------------------
      */

      cart.items.push(
        {
          productId:
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

          brand:
            String(
              product.brand ||
                "SilentGEN"
            ),

          category:
            String(
              product.category ||
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

          price:
            Math.max(
              Number(
                product.price ||
                  0
              ),
              0
            ),

          stock:
            inventory.stock,

          status:
            "Active",

          quantity,

          size:
            finalSize,

          color:
            finalColor,
        } as any
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE REAL CART CHANGE
    |--------------------------------------------------------------------------
    */

    await cart.save();

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER BEHAVIOUR / DEMAND INTELLIGENCE
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | This runs ONLY after cart.save() succeeds.
    |
    | Therefore failed actions such as:
    |
    | - invalid product
    | - invalid size
    | - invalid color
    | - out of stock
    | - quantity too high
    | - unauthenticated customer
    |
    | are NOT counted as add_to_cart.
    |
    | The event quantity is the amount added by THIS Add to Cart action,
    | not the total quantity now sitting in the cart.
    |
    |--------------------------------------------------------------------------
    */

    recordAddToCartLearningSafely(
      {
        userId,

        sessionId:
          null,

        conversationId:
          null,

        productId,

        color:
          finalColor ||
          null,

        size:
          finalSize ||
          null,

        quantity,

        source:
          "cart",

        metadata: {
          context:
            "real_website_add_to_cart",

          productName:
            String(
              product.name ||
                ""
            ),

          sku:
            String(
              product.sku ||
                ""
            ),

          category:
            String(
              product.category ||
                ""
            ),

          subCategory:
            String(
              product.subCategory ||
                ""
            ),

          brand:
            String(
              product.brand ||
                ""
            ),

          gender:
            String(
              product.gender ||
                ""
            ),

          fabric:
            String(
              product.fabric ||
                ""
            ),

          fit:
            String(
              product.fit ||
                ""
            ),

          price:
            Number(
              product.price ||
                0
            ),

          availableStock:
            Number(
              inventory.stock ||
                0
            ),

          wasExistingVariant,

          previousQuantity,

          addedQuantity:
            quantity,

          finalCartQuantity,
        },
      }
    );

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
          `${product.name || "Product"} added to cart successfully.`,

        addedItem: {
          productId,

          /*
          |--------------------------------------------------------------------------
          | QUANTITY ADDED BY THIS ACTION
          |--------------------------------------------------------------------------
          */

          quantity,

          size:
            finalSize,

          color:
            finalColor,

          stock:
            inventory.stock,

          image:
            inventory.image ||
            getProductVariantImage(
              product,
              finalColor
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
      "Add To Cart Error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to add product to cart. Please try again.",
      },
      {
        status:
          500,
      }
    );
  }
}