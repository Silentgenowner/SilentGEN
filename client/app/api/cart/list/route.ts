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

function safeNumber(
  value: unknown
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return 0;
  }

  return parsed;
}

function safeStock(
  value: unknown
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed
    ) ||
    parsed <= 0
  ) {
    return 0;
  }

  return Math.floor(
    parsed
  );
}

/*
|--------------------------------------------------------------------------
| EMPTY SUMMARY
|--------------------------------------------------------------------------
*/

function emptySummary() {
  return {
    totalItems: 0,
    subtotal: 0,
    shipping: 0,
    grandTotal: 0,
  };
}

/*
|--------------------------------------------------------------------------
| GET CART
|--------------------------------------------------------------------------
*/

export async function GET(
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
          success: false,

          message:
            "Server authentication configuration is missing.",
        },
        {
          status: 500,
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
          success: false,

          message:
            "Please login first.",
        },
        {
          status: 401,
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
          success: false,

          message:
            "Invalid or expired login session.",
        },
        {
          status: 401,
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
          success: false,

          message:
            "Invalid customer account.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY CUSTOMER
    |--------------------------------------------------------------------------
    */

    const user =
      await User.findById(
        userId
      )
        .select("_id")
        .lean();

    if (
      !user
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Customer account not found.",
        },
        {
          status: 401,
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
          success: true,

          message:
            "Your cart is empty.",

          items: [],

          summary:
            emptySummary(),
        },
        {
          status: 200,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT IDS
    |--------------------------------------------------------------------------
    */

    const productIds =
      Array.from(
        new Set(
          cart.items
            .map(
              (
                item: any
              ) =>
                String(
                  item.productId ||
                    ""
                )
            )
            .filter(
              (
                id: string
              ) =>
                mongoose.Types.ObjectId.isValid(
                  id
                )
            )
        )
      );

    /*
    |--------------------------------------------------------------------------
    | LOAD CURRENT PRODUCTS
    |--------------------------------------------------------------------------
    */

    const products =
      productIds.length >
      0
        ? await Product.find({
            _id: {
              $in:
                productIds,
            },
          }).lean()
        : [];

    const productMap =
      new Map<
        string,
        any
      >(
        products.map(
          (
            product: any
          ) => [
            String(
              product._id
            ),

            product,
          ]
        )
      );

    /*
    |--------------------------------------------------------------------------
    | SYNC CART
    |--------------------------------------------------------------------------
    */

    const responseItems:
      any[] =
      [];

    let cartChanged =
      false;

    for (
      const item of
      cart.items as any[]
    ) {
      const productId =
        String(
          item.productId ||
            ""
        );

      const product =
        productMap.get(
          productId
        );

      /*
      |--------------------------------------------------------------------------
      | PRODUCT NO LONGER EXISTS
      |--------------------------------------------------------------------------
      */

      if (
        !product
      ) {
        if (
          item.status !==
          "Inactive"
        ) {
          item.status =
            "Inactive";

          cartChanged =
            true;
        }

        if (
          Number(
            item.stock ||
              0
          ) !== 0
        ) {
          item.stock =
            0;

          cartChanged =
            true;
        }

        responseItems.push({
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
            safeNumber(
              item.price
            ),

          stock:
            0,

          status:
            "Inactive",

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
            false,

          message:
            "Product is no longer available.",

          url:
            productId
              ? `/product/${productId}`
              : "",
        });

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | SELECTED VARIANT
      |--------------------------------------------------------------------------
      */

      const selectedSize =
        cleanString(
          item.size
        ) ||
        null;

      const selectedColor =
        cleanString(
          item.color
        ) ||
        null;

      /*
      |--------------------------------------------------------------------------
      | CURRENT INVENTORY
      |--------------------------------------------------------------------------
      */

      const inventory =
        resolveProductInventory(
          product,
          {
            size:
              selectedSize,

            color:
              selectedColor,
          }
        );

      /*
      |--------------------------------------------------------------------------
      | ACTIVE / DELETED CHECK
      |--------------------------------------------------------------------------
      */

      const productActive =
        product.status ===
          "Active" &&
        product.isDeleted !==
          true;

      /*
      |--------------------------------------------------------------------------
      | VARIANT VALID
      |--------------------------------------------------------------------------
      */

      const variantValid =
        (
          !selectedSize ||
          inventory.sizeAvailable
        ) &&
        (
          !selectedColor ||
          inventory.colorAvailable
        );

      /*
      |--------------------------------------------------------------------------
      | PURCHASABLE
      |--------------------------------------------------------------------------
      */

      const purchasable =
        productActive &&
        variantValid &&
        inventory.available &&
        inventory.stock >
          0;

      /*
      |--------------------------------------------------------------------------
      | CURRENT VALUES
      |--------------------------------------------------------------------------
      */

      const currentQuantity =
        Math.max(
          Math.floor(
            safeNumber(
              item.quantity
            )
          ),
          1
        );

      let finalQuantity =
        currentQuantity;

      /*
      |--------------------------------------------------------------------------
      | CLAMP QUANTITY TO EXACT VARIANT STOCK
      |--------------------------------------------------------------------------
      */

      if (
        purchasable &&
        currentQuantity >
          inventory.stock
      ) {
        finalQuantity =
          inventory.stock;
      }

      /*
      |--------------------------------------------------------------------------
      | SNAPSHOT BEFORE
      |--------------------------------------------------------------------------
      */

      const before =
        JSON.stringify({
          sku:
            item.sku,

          name:
            item.name,

          brand:
            item.brand,

          category:
            item.category,

          image:
            item.image,

          price:
            item.price,

          stock:
            item.stock,

          status:
            item.status,

          quantity:
            item.quantity,

          size:
            item.size,

          color:
            item.color,
        });

      /*
      |--------------------------------------------------------------------------
      | SYNC PRODUCT SNAPSHOT
      |--------------------------------------------------------------------------
      */

      item.sku =
        String(
          product.sku ||
            item.sku ||
            ""
        );

      item.name =
        String(
          product.name ||
            item.name ||
            ""
        );

      item.brand =
        String(
          product.brand ||
            item.brand ||
            "SilentGEN"
        );

      item.category =
        String(
          product.category ||
            item.category ||
            ""
        );

      item.price =
        Math.max(
          safeNumber(
            product.price
          ),
          0
        );

      item.stock =
        purchasable
          ? inventory.stock
          : 0;

      item.status =
        purchasable
          ? "Active"
          : "Inactive";

      item.quantity =
        finalQuantity;

      /*
      |--------------------------------------------------------------------------
      | CANONICAL SIZE
      |--------------------------------------------------------------------------
      */

      if (
        inventory.size
      ) {
        item.size =
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
        item.color =
          inventory.color;
      }

      /*
      |--------------------------------------------------------------------------
      | CORRECT COLOR IMAGE
      |--------------------------------------------------------------------------
      */

      item.image =
        inventory.image ||
        getProductVariantImage(
          product,
          inventory.color ||
            selectedColor
        ) ||
        String(
          product.thumbnail ||
            product.images?.[0] ||
            item.image ||
            ""
        );

      /*
      |--------------------------------------------------------------------------
      | DETECT CHANGES
      |--------------------------------------------------------------------------
      */

      const after =
        JSON.stringify({
          sku:
            item.sku,

          name:
            item.name,

          brand:
            item.brand,

          category:
            item.category,

          image:
            item.image,

          price:
            item.price,

          stock:
            item.stock,

          status:
            item.status,

          quantity:
            item.quantity,

          size:
            item.size,

          color:
            item.color,
        });

      if (
        before !==
        after
      ) {
        cartChanged =
          true;
      }

      /*
      |--------------------------------------------------------------------------
      | RESPONSE ITEM
      |--------------------------------------------------------------------------
      */

      responseItems.push({
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
          safeNumber(
            item.price
          ),

        stock:
          safeStock(
            item.stock
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
          purchasable,

        sizeAvailable:
          inventory.sizeAvailable,

        colorAvailable:
          inventory.colorAvailable,

        sizeRequired:
          inventory.sizeRequired,

        colorRequired:
          inventory.colorRequired,

        availableSizes:
          inventory.availableSizes,

        availableColors:
          inventory.availableColors,

        message:
          purchasable
            ? inventory.message
            : !productActive
              ? "Product is currently unavailable."
              : !variantValid
                ? "Selected size or color is no longer available."
                : inventory.message ||
                  "Selected product variant is out of stock.",

        url:
          `/product/${productId}`,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE SYNCHRONIZED CART
    |--------------------------------------------------------------------------
    */

    if (
      cartChanged
    ) {
      await cart.save();
    }

    /*
    |--------------------------------------------------------------------------
    | ONLY PURCHASABLE ITEMS FOR TOTALS
    |--------------------------------------------------------------------------
    */

    const purchasableItems =
      responseItems.filter(
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

    /*
    |--------------------------------------------------------------------------
    | TOTALS
    |--------------------------------------------------------------------------
    */

    const totals =
      calculateCartTotals(
        purchasableItems
      );

    /*
    |--------------------------------------------------------------------------
    | UNAVAILABLE COUNT
    |--------------------------------------------------------------------------
    */

    const unavailableCount =
      responseItems.filter(
        (
          item: any
        ) =>
          item.available !==
          true
      ).length;

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          responseItems.length ===
          0
            ? "Your cart is empty."
            : unavailableCount >
                0
              ? `Cart loaded. ${unavailableCount} item(s) are currently unavailable or need attention.`
              : "Cart loaded successfully.",

        items:
          responseItems,

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

        unavailableCount,
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Cart List Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load cart. Please try again.",

        items: [],

        summary:
          emptySummary(),
      },
      {
        status: 500,
      }
    );
  }
}