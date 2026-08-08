import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {

  try {

    await connectDB();

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

    const userId =
      decoded.id ||
      decoded.userId;

    const body =
      await req.json();

    const {
      orderId,
      reason,
    } = body;

    if (!orderId || !reason) {

      return NextResponse.json(
        {
          success: false,
          message:
            "Order ID and reason are required",
        },
        {
          status: 400,
        }
      );

    }

    const order =
      await Order.findOne({

        _id: orderId,

        user: userId,

      });

    if (!order) {

      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        {
          status: 404,
        }
      );

    }

    if (
      order.orderStatus !==
      "Delivered"
    ) {

      return NextResponse.json(
        {
          success: false,
          message:
            "Only delivered orders can be returned",
        },
        {
          status: 400,
        }
      );

    }

    order.orderStatus =
      "Return Requested";

    order.returnRequest = {

      reason,

      status: "Pending",

      requestedAt:
        new Date(),

    };

    order.deliveryHistory.push({

      status:
        "Return Requested" as any,

      date:
        new Date(),

      note:
        "Return requested by customer",

    });

    await order.save();

    return NextResponse.json({

      success: true,

      message:
        "Return request submitted successfully",

    });

  } catch (error: any) {

    console.log(
      "RETURN REQUEST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Server Error",
      },
      {
        status: 500,
      }
    );

  }

}
