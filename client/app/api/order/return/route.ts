import {
  NextRequest,
  NextResponse,
} from "next/server";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import {
  ReturnRequestServiceError,
  submitReturnRequest,
} from "@/lib/order/submitReturnRequest";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type TokenPayload = {
  id?: string;

  userId?: string;
};

type ReturnRequestBody = {
  orderId?: string;

  reason?: string;

  image?: string;
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
| POST RETURN REQUEST
|--------------------------------------------------------------------------
|
| Route:
|
| POST /api/order/return
|
| Body:
|
| {
|   orderId: "...",
|   reason: "...",
|   image?: "..."
| }
|
|--------------------------------------------------------------------------
*/

export async function POST(
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
    | BODY
    |--------------------------------------------------------------------------
    */

    let body:
      ReturnRequestBody;

    try {
      body =
        (
          await req.json()
        ) as ReturnRequestBody;
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
    | ORDER ID
    |--------------------------------------------------------------------------
    */

    const orderId =
      cleanString(
        body.orderId
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
            "Invalid order id.",
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
            "Please provide a reason for the return.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONAL IMAGE
    |--------------------------------------------------------------------------
    */

    const image =
      cleanString(
        body.image
      );

    /*
    |--------------------------------------------------------------------------
    | SHARED RETURN SERVICE
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | This route intentionally does NOT contain its own:
    |
    | - Delivered status validation
    | - duplicate return validation
    | - returnRequest DB update
    | - orderStatus update
    | - deliveryHistory update
    | - learning event creation
    |
    | All of that is centralized inside:
    |
    | lib/order/submitReturnRequest.ts
    |
    |--------------------------------------------------------------------------
    */

    const result =
      await submitReturnRequest(
        {
          userId,

          orderId,

          reason,

          image:
            image ||
            null,

          channel:
            "website_flat_route",
        }
      );

    const order =
      result.order;

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
          "Return request submitted successfully.",

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
          | ORDER STATUS
          |--------------------------------------------------------------------------
          */

          orderStatus:
            order.orderStatus,

          /*
          |--------------------------------------------------------------------------
          | RETURN REQUEST
          |--------------------------------------------------------------------------
          */

          returnRequest:
            order.returnRequest,

          /*
          |--------------------------------------------------------------------------
          | REFUND STATUS
          |--------------------------------------------------------------------------
          |
          | IMPORTANT:
          |
          | Return Requested does NOT automatically mean:
          |
          | refundStatus = Requested
          |
          | Admin approval / completed return / refund flow is separate.
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
      "RETURN REQUEST ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | KNOWN BUSINESS ERROR
    |--------------------------------------------------------------------------
    */

    if (
      error instanceof
      ReturnRequestServiceError
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
            "Return request validation failed.",
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
          "Return request failed. Please try again.",
      },
      {
        status:
          500,
      }
    );
  }
}