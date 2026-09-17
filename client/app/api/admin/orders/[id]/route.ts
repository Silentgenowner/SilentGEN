import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";
import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import Admin from "@/models/Admin";
import Order from "@/models/Order";

/*
|--------------------------------------------------------------------------
| ROUTE CONTEXT
|--------------------------------------------------------------------------
*/

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/*
|--------------------------------------------------------------------------
| GET ORDER DETAILS
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | PARAMS
    |--------------------------------------------------------------------------
    */

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order id.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | ADMIN COOKIE
    |--------------------------------------------------------------------------
    */

    const token =
      request.cookies.get(
        "adminToken"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY ADMIN TOKEN
    |--------------------------------------------------------------------------
    */

    let tokenPayload;

    try {
      tokenPayload =
        await verifyAdminToken(
          token
        );
    } catch (error) {
      console.error(
        "ADMIN ORDER DETAIL TOKEN ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid or expired admin session. Please login again.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN
    |--------------------------------------------------------------------------
    */

    const admin =
      await Admin.findById(
        tokenPayload.adminId
      )
        .select(
          "_id name email role isActive"
        )
        .lean();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin account not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      admin.isActive ===
      false
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin account is disabled.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE CHECK
    |--------------------------------------------------------------------------
    */

    const allowedRoles = [
      "super_admin",
      "order_manager",
      "support_admin",
    ];

    if (
      !allowedRoles.includes(
        String(
          admin.role || ""
        )
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to view this order.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | GET ORDER
    |--------------------------------------------------------------------------
    */

    const order =
      await Order.findById(
        id
      )
        .populate({
          path: "user",
          select:
            "name email mobile phone",
        })
        .populate({
          path:
            "items.product",
          select:
            "name slug sku thumbnail images price mrp",
        })
        .lean();

    /*
    |--------------------------------------------------------------------------
    | NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,
        order,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN ORDER DETAIL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof
          Error
            ? error.message
            : "Unable to load order.",
      },
      {
        status: 500,
      }
    );
  }
}