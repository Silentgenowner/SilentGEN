import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import {
  getOptionalAIUserId,
} from "@/lib/ai/getAIUser";

import {
  learnFromProductBehaviour,
} from "@/lib/ai/learning/customerLearningEngine";

/*
|--------------------------------------------------------------------------
| REQUEST BODY
|--------------------------------------------------------------------------
*/

type ProductViewBody = {
  productId?:
    string;

  sessionId?:
    string | null;

  currentPath?:
    string | null;
};

/*
|--------------------------------------------------------------------------
| NORMALIZE SESSION ID
|--------------------------------------------------------------------------
*/

function normalizeSessionId(
  value:
    unknown
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const clean =
    value.trim();

  if (
    clean.length < 8 ||
    clean.length > 150
  ) {
    return null;
  }

  return clean;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE CURRENT PATH
|--------------------------------------------------------------------------
*/

function normalizeCurrentPath(
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
    .slice(
      0,
      300
    );
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
|
| Records a REAL product-page view.
|
| IMPORTANT:
|
| - This is called only after the actual product successfully loads.
| - AI chat messages do NOT call this route.
| - Guest views may contribute to aggregate demand intelligence.
| - Logged-in customer views may also contribute to personal learning,
|   subject to the customer's personalization setting.
|
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
    | BODY
    |--------------------------------------------------------------------------
    */

    let body:
      ProductViewBody;

    try {
      body =
        (
          await request.json()
        ) as ProductViewBody;
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

    /*
    |--------------------------------------------------------------------------
    | PRODUCT ID
    |--------------------------------------------------------------------------
    */

    const productId =
      typeof body.productId ===
      "string"
        ? body.productId.trim()
        : "";

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
    | CUSTOMER
    |--------------------------------------------------------------------------
    |
    | Authentication comes from the existing customer token cookie.
    |
    |--------------------------------------------------------------------------
    */

    const userId =
      getOptionalAIUserId(
        request
      );

    /*
    |--------------------------------------------------------------------------
    | SESSION
    |--------------------------------------------------------------------------
    */

    const sessionId =
      normalizeSessionId(
        body.sessionId
      );

    /*
    |--------------------------------------------------------------------------
    | CURRENT PATH
    |--------------------------------------------------------------------------
    */

    const currentPath =
      normalizeCurrentPath(
        body.currentPath
      );

    /*
    |--------------------------------------------------------------------------
    | RECORD REAL PRODUCT VIEW
    |--------------------------------------------------------------------------
    */

    const learningResult =
      await learnFromProductBehaviour(
        {
          userId,

          sessionId,

          conversationId:
            null,

          productId,

          behaviour:
            "viewed",

          source:
            "product_page",

          metadata: {
            context:
              "real_product_page_view",

            currentPath:
              currentPath ||
              `/product/${productId}`,
          },
        }
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    |
    | Analytics/profile learning status is returned for debugging.
    | Customer product page itself does not depend on this response.
    |
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          learningResult.success,

        message:
          learningResult.message,

        productId,

        analyticsRecorded:
          Boolean(
            learningResult.analytics
              ?.success
          ),

        profileLearningRecorded:
          Boolean(
            learningResult
              .profileLearning
              ?.success
          ),
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
      "SilentGEN product view learning error:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | ANALYTICS FAILURE MUST NEVER BREAK PRODUCT PAGE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Product view learning could not be recorded.",
      },
      {
        status:
          500,
      }
    );
  }
}