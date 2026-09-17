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
| UPDATE TRACKING
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
            "You do not have permission to update tracking.",
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

    const courierPartner =
      typeof body?.courierPartner ===
      "string"
        ? body.courierPartner.trim()
        : "";

    const trackingNumber =
      typeof body?.trackingNumber ===
      "string"
        ? body.trackingNumber.trim()
        : "";

    if (
      !courierPartner ||
      !trackingNumber
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Courier partner and tracking number are required.",
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
    | UPDATE
    |--------------------------------------------------------------------------
    */

    order.courierPartner =
      courierPartner;

    order.trackingNumber =
      trackingNumber;

    await order.save();

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Tracking details saved successfully.",

        order,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "TRACKING UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof
          Error
            ? error.message
            : "Tracking update failed.",
      },
      {
        status: 500,
      }
    );
  }
}