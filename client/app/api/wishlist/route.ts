import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import {
  verifyToken,
} from "@/lib/jwt";

import {
  recordWishlistLearningSafely,
} from "@/lib/ai/learning/customerLearningEngine";

import User from "@/models/User";
import Product from "@/models/Product";

/*
|--------------------------------------------------------------------------
| GET USER ID
|--------------------------------------------------------------------------
*/

function getUserId(
  request:
    NextRequest
): string | null {
  try {
    const token =
      request.cookies.get(
        "token"
      )?.value;

    if (
      !token
    ) {
      return null;
    }

    const decoded =
      verifyToken(
        token
      );

    if (
      !decoded ||
      typeof decoded !==
        "object"
    ) {
      return null;
    }

    const payload =
      decoded as {
        id?:
          string;

        userId?:
          string;
      };

    const id =
      payload.id ||
      payload.userId;

    if (
      !id
    ) {
      return null;
    }

    const normalizedId =
      String(
        id
      ).trim();

    if (
      !mongoose.Types.ObjectId.isValid(
        normalizedId
      )
    ) {
      return null;
    }

    return normalizedId;
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| GET WISHLIST
|--------------------------------------------------------------------------
*/

export async function GET(
  request:
    NextRequest
) {
  try {
    await connectDB();

    const userId =
      getUserId(
        request
      );

    if (
      !userId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Please login first",
        },
        {
          status:
            401,
        }
      );
    }

    const user =
      await User.findById(
        userId
      )
        .populate({
          path:
            "wishlist",

          model:
            Product,

          select:
            "_id name slug thumbnail images price mrp stock status isDeleted",
        })
        .lean();

    if (
      !user
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "User not found",
        },
        {
          status:
            404,
        }
      );
    }

    const rawWishlist =
      Array.isArray(
        (user as any)
          .wishlist
      )
        ? (user as any)
            .wishlist
        : [];

    /*
    |--------------------------------------------------------------------------
    | ONLY ACTIVE PRODUCTS
    |--------------------------------------------------------------------------
    */

    const activeWishlist =
      rawWishlist.filter(
        (
          item:
            any
        ) => {
          if (
            !item
          ) {
            return false;
          }

          if (
            item.isDeleted ===
            true
          ) {
            return false;
          }

          if (
            item.status ===
            "Archived"
          ) {
            return false;
          }

          return true;
        }
      );

    return NextResponse.json(
      {
        success:
          true,

        wishlist:
          activeWishlist,

        count:
          activeWishlist.length,
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
      "WISHLIST GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof
          Error
            ? error.message
            : "Something went wrong",
      },
      {
        status:
          500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| ADD TO WISHLIST
|--------------------------------------------------------------------------
*/

export async function POST(
  request:
    NextRequest
) {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    const userId =
      getUserId(
        request
      );

    if (
      !userId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Please login first",
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
      {
        productId?:
          string;
      };

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid request body",
        },
        {
          status:
            400,
        }
      );
    }

    const productId =
      typeof body?.productId ===
      "string"
        ? body.productId.trim()
        : "";

    /*
    |--------------------------------------------------------------------------
    | VALIDATE PRODUCT ID
    |--------------------------------------------------------------------------
    */

    if (
      !productId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Product ID is required",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid Product ID",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT EXISTS
    |--------------------------------------------------------------------------
    |
    | Wishlist analytics must only use a real current Product DB document.
    |
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
      )
        .select(
          "_id status name category subCategory brand gender fabric fit price stock"
        )
        .lean();

    if (
      !product
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Product not found",
        },
        {
          status:
            404,
        }
      );
    }

    if (
      product.status ===
      "Archived"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "This product is not available",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ATOMIC ADD WITHOUT DUPLICATE
    |--------------------------------------------------------------------------
    |
    | Important:
    |
    | Filter includes:
    |
    | wishlist: { $ne: productId }
    |
    | Therefore only a genuinely new wishlist addition can modify the user.
    |
    | This also prevents duplicate behaviour events on:
    |
    | - double click
    | - retry
    | - repeated POST
    |
    |--------------------------------------------------------------------------
    */

    const updateResult =
      await User.updateOne(
        {
          _id:
            userId,

          wishlist: {
            $ne:
              productId,
          },
        },
        {
          $addToSet: {
            wishlist:
              productId,
          },
        }
      );

    /*
    |--------------------------------------------------------------------------
    | USER NOT MATCHED
    |--------------------------------------------------------------------------
    |
    | This can mean:
    |
    | 1. user does not exist
    | 2. product already exists in wishlist
    |
    |--------------------------------------------------------------------------
    */

    if (
      updateResult.matchedCount ===
      0
    ) {
      const userExists =
        await User.exists(
          {
            _id:
              userId,
          }
        );

      if (
        !userExists
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "User not found",
          },
          {
            status:
              404,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | ALREADY IN WISHLIST
      |--------------------------------------------------------------------------
      |
      | Return success because desired state already exists.
      |
      | IMPORTANT:
      | Do NOT record another wishlist_add event.
      |
      |--------------------------------------------------------------------------
      */

      return NextResponse.json(
        {
          success:
            true,

          added:
            false,

          alreadyExists:
            true,

          message:
            "Already in wishlist",
        },
        {
          status:
            200,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE UPDATE SAFETY
    |--------------------------------------------------------------------------
    */

    if (
      updateResult.modifiedCount !==
      1
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Unable to add product to wishlist",
        },
        {
          status:
            500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER BEHAVIOUR LEARNING
    |--------------------------------------------------------------------------
    |
    | We reached this point only when MongoDB actually added the product.
    |
    | Therefore:
    |
    | one real wishlist add
    |        ↓
    | one wishlist_add event
    |
    | This event feeds aggregate demand intelligence used by Admin AI.
    |
    |--------------------------------------------------------------------------
    */

    recordWishlistLearningSafely(
      {
        userId,

        sessionId:
          null,

        conversationId:
          null,

        productId,

        source:
          "wishlist",

        metadata: {
          context:
            "real_wishlist_add",

          productName:
            product.name,

          category:
            product.category,

          subCategory:
            product.subCategory,

          brand:
            product.brand,

          gender:
            product.gender,

          fabric:
            product.fabric,

          fit:
            product.fit,

          price:
            product.price,

          stock:
            product.stock,
        },
      }
    );

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    |
    | Learning runs safely/background.
    |
    | Analytics failure must never reverse or break the real wishlist action.
    |
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        added:
          true,

        alreadyExists:
          false,

        message:
          "Added to wishlist",
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
      "WISHLIST ADD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof
          Error
            ? error.message
            : "Something went wrong",
      },
      {
        status:
          500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| REMOVE FROM WISHLIST
|--------------------------------------------------------------------------
|
| Removing an item is NOT counted as wishlist_add.
|
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request:
    NextRequest
) {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    const userId =
      getUserId(
        request
      );

    if (
      !userId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Please login first",
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
      {
        productId?:
          string;
      };

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid request body",
        },
        {
          status:
            400,
        }
      );
    }

    const productId =
      typeof body?.productId ===
      "string"
        ? body.productId.trim()
        : "";

    /*
    |--------------------------------------------------------------------------
    | VALIDATE PRODUCT ID
    |--------------------------------------------------------------------------
    */

    if (
      !productId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Product ID is required",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid Product ID",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | REMOVE
    |--------------------------------------------------------------------------
    */

    const user =
      await User.findByIdAndUpdate(
        userId,
        {
          $pull: {
            wishlist:
              productId,
          },
        },
        {
          new:
            true,
        }
      );

    if (
      !user
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "User not found",
        },
        {
          status:
            404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Removed from wishlist",
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
      "WISHLIST REMOVE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof
          Error
            ? error.message
            : "Something went wrong",
      },
      {
        status:
          500,
      }
    );
  }
}