import {
  NextRequest,
  NextResponse,
} from "next/server";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import {
  ExchangeRequestServiceError,
  submitExchangeRequest,
} from "@/lib/order/submitExchangeRequest";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type TokenPayload = {
  id?: string;

  userId?: string;
};

type ExchangeRequestBody = {
  reason?: string;
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

/*
|--------------------------------------------------------------------------
| POST EXCHANGE REQUEST
|--------------------------------------------------------------------------
|
| Route:
|
| POST /api/order/exchange/[id]
|
| Example:
|
| POST /api/order/exchange/68abc123...
|
| Body:
|
| {
|   reason: "Size does not fit"
| }
|
|--------------------------------------------------------------------------
*/

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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
      req.cookies.get(
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

    /*
    |--------------------------------------------------------------------------
    | USER ID
    |--------------------------------------------------------------------------
    */

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
    | ORDER ID FROM URL
    |--------------------------------------------------------------------------
    */

    const {
      id,
    } =
      await context.params;

    const orderId =
      cleanString(
        id
      );

    if (
      !orderId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Order ID is required.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid order ID.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | BODY
    |--------------------------------------------------------------------------
    */

    let body:
      ExchangeRequestBody;

    try {
      body =
        (
          await req.json()
        ) as ExchangeRequestBody;
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
    | REASON
    |--------------------------------------------------------------------------
    */

    const reason =
      cleanString(
        body.reason
      );

    if (
      !reason
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Please provide a reason for the exchange.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SHARED EXCHANGE SERVICE
    |--------------------------------------------------------------------------
    |
    | All important business logic now stays in:
    |
    | lib/order/submitExchangeRequest.ts
    |
    | It handles:
    |
    | - customer ownership
    | - Delivered eligibility
    | - duplicate exchange prevention
    | - return/exchange conflict
    | - atomic DB update
    | - Exchange Requested status
    | - delivery history
    | - exchange_requested learning
    |
    |--------------------------------------------------------------------------
    */

    const result =
      await submitExchangeRequest(
        {
          userId,

          orderId,

          reason,

          channel:
            "website_exchange_route",
        }
      );

    const order =
      result.order;

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
          "Exchange request submitted successfully.",

        order: {
          /*
          |--------------------------------------------------------------------------
          | ORDER ID
          |--------------------------------------------------------------------------
          */

          orderId:
            String(
              order._id
            ),

          /*
          |--------------------------------------------------------------------------
          | STATUS
          |--------------------------------------------------------------------------
          */

          orderStatus:
            order.orderStatus,

          /*
          |--------------------------------------------------------------------------
          | EXCHANGE REQUEST
          |--------------------------------------------------------------------------
          */

          exchangeRequest:
            order.exchangeRequest,

          /*
          |--------------------------------------------------------------------------
          | RETURN REQUEST
          |--------------------------------------------------------------------------
          */

          returnRequest:
            order.returnRequest,

          /*
          |--------------------------------------------------------------------------
          | REFUND
          |--------------------------------------------------------------------------
          |
          | Exchange Requested does not mean a refund has started.
          |
          |--------------------------------------------------------------------------
          */

          refundStatus:
            order.refundStatus,

          /*
          |--------------------------------------------------------------------------
          | PAYMENT
          |--------------------------------------------------------------------------
          */

          paymentStatus:
            order.paymentStatus,

          paymentMethod:
            order.paymentMethod,

          /*
          |--------------------------------------------------------------------------
          | TOTAL
          |--------------------------------------------------------------------------
          */

          totalAmount:
            order.totalAmount,

          /*
          |--------------------------------------------------------------------------
          | UPDATED
          |--------------------------------------------------------------------------
          */

          updatedAt:
            order.updatedAt,
        },
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
    | LOG
    |--------------------------------------------------------------------------
    */

    console.error(
      "EXCHANGE REQUEST ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | KNOWN BUSINESS ERROR
    |--------------------------------------------------------------------------
    */

    if (
      error instanceof
      ExchangeRequestServiceError
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
            "Exchange request validation failed.",
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
          "Exchange request failed. Please try again.",
      },
      {
        status:
          500,
      }
    );
  }
}