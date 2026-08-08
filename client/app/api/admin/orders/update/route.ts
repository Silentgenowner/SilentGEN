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

      orderStatus,

      trackingNumber,

      courierPartner,

    } = await req.json();

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
      await Order.findById(orderId);

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
        // ==========================
    // UPDATE ORDER
    // ==========================

    if (orderStatus) {

      order.orderStatus =
        orderStatus;

      order.deliveryHistory.push({

        status:
          orderStatus,

        date:
          new Date(),

      });

      if (

        orderStatus ===
        "Delivered"

      ) {

        order.deliveredAt =
          new Date();

        if (

          order.paymentMethod ===
          "COD"

        ) {

          order.paymentStatus =
            "Paid";

        }

      }

    }

    if (

      trackingNumber !==
      undefined

    ) {

      order.trackingNumber =
        trackingNumber;

    }

    if (

      courierPartner !==
      undefined

    ) {

      order.courierPartner =
        courierPartner;

    }

    await order.save();

    return NextResponse.json(

      {

        success: true,

        message:
          "Order updated successfully",

        order,

      },

      {

        status: 200,

      }

    );
      } catch (error: any) {

    console.log(

      "ADMIN UPDATE ORDER ERROR:",

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
