import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function PUT(req: NextRequest) {

  try {

    await connectDB();

    // ==========================
    // AUTH CHECK
    // ==========================

    const token =
      req.cookies.get("token")?.value;

    if (!token) {

      return NextResponse.json(

        {

          success: false,

          message: "Please login first",

        },

        {

          status: 401,

        }

      );

    }

    let decoded: any;

    try {

      decoded =
        jwt.verify(
          token,
          JWT_SECRET
        );

    } catch {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid token",

        },

        {

          status: 401,

        }

      );

    }

    const adminId =
      decoded.id ||
      decoded.userId;

    const admin =
      await User.findById(adminId);

    if (!admin || admin.role !== "admin") {

      return NextResponse.json(

        {

          success: false,

          message: "Access denied",

        },

        {

          status: 403,

        }

      );

    }

    // ==========================
    // REQUEST BODY
    // ==========================

    const {

      orderId,

      action,

    } = await req.json();

    if (

      !orderId ||

      !action

    ) {

      return NextResponse.json(

        {

          success: false,

          message:
            "Order ID and action are required",

        },

        {

          status: 400,

        }

      );

    }

    const order =
      await Order.findById(orderId);

    if (!order) {

      return NextResponse.json(

        {

          success: false,

          message:
            "Order not found",

        },

        {

          status: 404,

        }

      );

    }

    if (!order.exchangeRequest) {

      return NextResponse.json(

        {

          success: false,

          message:
            "Exchange request not found",

        },

        {

          status: 404,

        }

      );

    }
        // ==========================
    // UPDATE EXCHANGE REQUEST
    // ==========================

    if (action === "approve") {

      order.exchangeRequest.status =
        "Approved";

      order.orderStatus =
        "Exchange Requested";

      order.deliveryHistory.push({

        status:
          "Exchange Requested",

        date:
          new Date(),

        note:
          "Exchange request approved by admin",

      });

    }

    else if (action === "reject") {

      order.exchangeRequest.status =
        "Rejected";

      order.orderStatus =
        "Delivered";

      order.deliveryHistory.push({

        status:
          "Delivered",

        date:
          new Date(),

        note:
          "Exchange request rejected by admin",

      });

    }

    else {

      return NextResponse.json(

        {

          success: false,

          message:
            "Invalid action",

        },

        {

          status: 400,

        }

      );

    }

    await order.save();

    return NextResponse.json(

      {

        success: true,

        message:

          action === "approve"

            ? "Exchange request approved successfully"

            : "Exchange request rejected successfully",

        order,

      },

      {

        status: 200,

      }

    );
      } catch (error: any) {

    console.log(

      "ADMIN EXCHANGE REQUEST ERROR:",

      error

    );

    return NextResponse.json(

      {

        success: false,

        message:

          error.message ||

          "Something went wrong",

      },

      {

        status: 500,

      }

    );

  }

}
