import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {

    await connectDB();

    const token = req.cookies.get("token")?.value;

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

      decoded = jwt.verify(
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

    const orderId =
      body.orderId;

    if (!orderId) {

      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
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
      order.orderStatus !== "Placed" &&
      order.orderStatus !== "Confirmed"
    ) {

      return NextResponse.json(
        {
          success: false,
          message:
            "This order cannot be cancelled",
        },
        {
          status: 400,
        }
      );

    }

    order.orderStatus =
      "Cancelled";

    order.deliveryHistory.push({
      status: "Cancelled" as any,
      date: new Date(),
      note: "Cancelled by customer",
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
    });

  } catch (error: any) {

    console.log(
      "CANCEL ORDER ERROR:",
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
