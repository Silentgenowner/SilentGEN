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
import OrderTimeline from "@/models/OrderTimeline";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/*
|--------------------------------------------------------------------------
| ALLOWED ORDER STATUSES
|--------------------------------------------------------------------------
*/

const ALLOWED_STATUSES = [
  "Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Returned",
  "Exchange Requested",
  "Exchange Approved",
  "Exchange Completed",
] as const;

/*
|--------------------------------------------------------------------------
| UPDATE ORDER STATUS
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | ADMIN TOKEN
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
            "Admin login required.",
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
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid or expired admin session.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN CHECK
    |--------------------------------------------------------------------------
    */

    const admin =
      await Admin.findById(
        tokenPayload.adminId
      )
        .select(
          "_id role isActive"
        )
        .lean();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin not found.",
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
            "You do not have permission to update orders.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ORDER ID
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
    | BODY
    |--------------------------------------------------------------------------
    */

    const body =
      await request.json();

    const status =
      typeof body?.status ===
      "string"
        ? body.status.trim()
        : "";

    const message =
      typeof body?.message ===
      "string"
        ? body.message.trim()
        : "";

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Status is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !ALLOWED_STATUSES.includes(
        status as
          (typeof ALLOWED_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order status.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FIND ORDER
    |--------------------------------------------------------------------------
    */

    const order =
      await Order.findById(
        id
      );

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
    | OLD STATUS
    |--------------------------------------------------------------------------
    */

    const previousStatus =
      order.orderStatus;

    /*
    |--------------------------------------------------------------------------
    | UPDATE STATUS
    |--------------------------------------------------------------------------
    */

    order.orderStatus =
      status;

    if (
      status ===
      "Delivered"
    ) {
      order.deliveredAt =
        new Date();
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONAL:
    | If changed away from Delivered,
    | clear deliveredAt
    |--------------------------------------------------------------------------
    */

    if (
      status !==
        "Delivered" &&
      previousStatus ===
        "Delivered"
    ) {
      order.deliveredAt =
        undefined;
    }

    /*
    |--------------------------------------------------------------------------
    | DELIVERY HISTORY
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        order.deliveryHistory
      )
    ) {
      order.deliveryHistory.push({
        status,

        date:
          new Date(),

        note:
          message ||
          `Order status changed to ${status}`,
      });
    }

    await order.save();

    /*
    |--------------------------------------------------------------------------
    | ORDER TIMELINE MODEL
    |--------------------------------------------------------------------------
    */

    await OrderTimeline.create({
      order:
        order._id,

      status,

      message:
        message ||
        `Order status changed from ${previousStatus} to ${status}`,
    });

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Order status updated successfully.",

        order,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "STATUS UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof
          Error
            ? error.message
            : "Status update failed.",
      },
      {
        status: 500,
      }
    );
  }
}