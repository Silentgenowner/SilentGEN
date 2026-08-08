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

    if (!order.returnRequest) {

      return NextResponse.json(

        {

          success: false,

          message:
            "Return request not found",

        },

        {

          status: 404,

        }

      );

    }
        // ==========================
    // UPDATE RETURN REQUEST
    // ==========================

    if (action === "approve") {

      order.returnRequest.status =
        "Approved";

      order.orderStatus =
        "Returned";

      order.refundStatus =
        "Processing";

      order.deliveryHistory.push({

        status: "Returned",

        date: new Date(),

        note:
          "Return request approved by admin",

      });

    }

    else if (action === "reject") {

      order.returnRequest.status =
        "Rejected";

      order.orderStatus =
        "Delivered";

      order.deliveryHistory.push({

        status: "Delivered",

        date: new Date(),

        note:
          "Return request rejected by admin",

      });

    }

    else {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid action",

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

            ? "Return request approved successfully"

            : "Return request rejected successfully",

        order,

      },

      {

        status: 200,

      }

    );
      } catch (error: any) {

    console.log(

      "ADMIN RETURN REQUEST ERROR:",

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
