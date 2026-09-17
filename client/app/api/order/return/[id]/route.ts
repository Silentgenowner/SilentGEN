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
  | POST /api/order/return/[id]
  |
  | Example:
  |
  | POST /api/order/return/66abc123...
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
      | ROUTE PARAM
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
        !orderId ||
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
        body =
          {};
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
      | SHARED REAL RETURN SERVICE
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      |
      | All business rules now live inside:
      |
      | lib/order/submitReturnRequest.ts
      |
      | Therefore this route does NOT independently:
      |
      | - change stock
      | - change refund
      | - write analytics
      | - duplicate return eligibility rules
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
              "website_dynamic_route",
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
            orderId:
              String(
                order._id
              ),

            orderStatus:
              order.orderStatus,

            /*
            |--------------------------------------------------------------------------
            | REFUND
            |--------------------------------------------------------------------------
            |
            | Return request ≠ refund request.
            |
            | Therefore this value is merely current real Order DB state.
            |
            |--------------------------------------------------------------------------
            */

            refundStatus:
              order.refundStatus,

            /*
            |--------------------------------------------------------------------------
            | RETURN REQUEST
            |--------------------------------------------------------------------------
            */

            returnRequest:
              order.returnRequest,

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
            | ORDER TOTAL
            |--------------------------------------------------------------------------
            */

            totalAmount:
              order.totalAmount,

            /*
            |--------------------------------------------------------------------------
            | LAST UPDATE
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
      console.error(
        "RETURN REQUEST ERROR:",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | KNOWN SERVICE ERROR
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