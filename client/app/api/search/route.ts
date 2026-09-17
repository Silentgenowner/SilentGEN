import {
  NextRequest,
  NextResponse,
} from "next/server";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";

import {
  recordSearchLearningSafely,
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

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_SEARCH_LENGTH =
  150;

const MAX_RESULTS =
  50;

/*
|--------------------------------------------------------------------------
| CLEAN STRING
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

/*
|--------------------------------------------------------------------------
| ESCAPE REGEX
|--------------------------------------------------------------------------
|
| Customer search text must NOT be interpreted as raw MongoDB regex syntax.
|
| Example:
|
| (
| [
| *
| +
|
| should be treated as normal search characters.
|
|--------------------------------------------------------------------------
*/

function escapeRegex(
  value: string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/*
|--------------------------------------------------------------------------
| OPTIONAL CUSTOMER ID
|--------------------------------------------------------------------------
|
| Search remains PUBLIC.
|
| Logged-in customer:
|   event gets userId.
|
| Logged-out customer:
|   event is still useful for aggregate demand analytics.
|
| Invalid/expired cookie must NOT break product search.
|
|--------------------------------------------------------------------------
*/

function getOptionalUserId(
  req: NextRequest
): string | null {
  try {
    const jwtSecret =
      process.env
        .JWT_SECRET
        ?.trim();

    if (
      !jwtSecret
    ) {
      return null;
    }

    const token =
      req.cookies.get(
        "token"
      )?.value;

    if (
      !token
    ) {
      return null;
    }

    const decoded =
      jwt.verify(
        token,
        jwtSecret
      ) as TokenPayload;

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
      return null;
    }

    return userId;
  } catch {
    /*
    |--------------------------------------------------------------------------
    | PUBLIC SEARCH
    |--------------------------------------------------------------------------
    |
    | Expired/invalid login cookie must not prevent public search.
    |
    |--------------------------------------------------------------------------
    */

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| GET SEARCH
|--------------------------------------------------------------------------
*/

export async function GET(
  req: NextRequest
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
    | SEARCH PARAMS
    |--------------------------------------------------------------------------
    */

    const {
      searchParams,
    } =
      new URL(
        req.url
      );

    const rawQuery =
      searchParams.get(
        "q"
      );

    /*
    |--------------------------------------------------------------------------
    | QUERY REQUIRED
    |--------------------------------------------------------------------------
    */

    const searchText =
      cleanString(
        rawQuery
      );

    if (
      !searchText
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Search query required",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY LENGTH
    |--------------------------------------------------------------------------
    */

    if (
      searchText.length >
      MAX_SEARCH_LENGTH
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            `Search query is too long. Maximum ${MAX_SEARCH_LENGTH} characters allowed.`,
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SAFE SEARCH REGEX
    |--------------------------------------------------------------------------
    */

    const escapedSearchText =
      escapeRegex(
        searchText
      );

    const searchRegex = {
      $regex:
        escapedSearchText,

      $options:
        "i",
    };

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER
    |--------------------------------------------------------------------------
    |
    | Optional because product search is public.
    |
    |--------------------------------------------------------------------------
    */

    const userId =
      getOptionalUserId(
        req
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT SEARCH
    |--------------------------------------------------------------------------
    |
    | Customer-facing search must use actual Product DB data.
    |
    | Only active, non-deleted products should be shown.
    |
    |--------------------------------------------------------------------------
    */

    const products =
      await Product.find(
        {
          /*
          |--------------------------------------------------------------------------
          | CUSTOMER-VISIBLE PRODUCTS ONLY
          |--------------------------------------------------------------------------
          */

          status:
            "Active",

          isDeleted: {
            $ne:
              true,
          },

          /*
          |--------------------------------------------------------------------------
          | SEARCH FIELDS
          |--------------------------------------------------------------------------
          */

          $or: [
            {
              name:
                searchRegex,
            },

            {
              category:
                searchRegex,
            },

            {
              subCategory:
                searchRegex,
            },

            {
              description:
                searchRegex,
            },

            {
              shortDescription:
                searchRegex,
            },

            {
              brand:
                searchRegex,
            },

            {
              fabric:
                searchRegex,
            },

            {
              fit:
                searchRegex,
            },

            {
              gender:
                searchRegex,
            },

            {
              tags:
                searchRegex,
            },

            {
              sku:
                searchRegex,
            },
          ],
        }
      )
        /*
        |--------------------------------------------------------------------------
        | NEWEST / MOST RELEVANT STABLE ORDER
        |--------------------------------------------------------------------------
        |
        | We are not pretending Mongo regex has a relevance score.
        |
        | Existing sortOrder can control merchandising first,
        | then newer products.
        |
        |--------------------------------------------------------------------------
        */

        .sort(
          {
            sortOrder:
              1,

            createdAt:
              -1,
          }
        )

        .limit(
          MAX_RESULTS
        )

        .lean();

    /*
    |--------------------------------------------------------------------------
    | RESULT COUNT
    |--------------------------------------------------------------------------
    */

    const resultCount =
      products.length;

    /*
    |--------------------------------------------------------------------------
    | RECORD REAL WEBSITE SEARCH
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | This runs only AFTER the real MongoDB search succeeds.
    |
    | Therefore these do NOT create product_search events:
    |
    | - empty query
    | - invalid request
    | - database failure
    |
    | Search with 0 results IS still a real customer search and is valuable
    | demand intelligence, so it should be recorded.
    |
    |--------------------------------------------------------------------------
    */

    recordSearchLearningSafely(
      {
        userId,

        sessionId:
          null,

        conversationId:
          null,

        searchQuery:
          searchText,

        source:
          "website",

        metadata: {
          context:
            "real_website_product_search",

          route:
            "/api/search",

          resultCount,

          hasResults:
            resultCount >
            0,

          resultLimit:
            MAX_RESULTS,

          customerAuthenticated:
            Boolean(
              userId
            ),
        },
      }
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

        products,
      },
      {
        status:
          200,
      }
    );
  } catch (
    error: unknown
  ) {
    /*
    |--------------------------------------------------------------------------
    | ERROR LOG
    |--------------------------------------------------------------------------
    */

    console.error(
      "SEARCH API ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

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