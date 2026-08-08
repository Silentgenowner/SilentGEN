import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(
  req: NextRequest
) {

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

          message:
            "Please login first",

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

          message:
            "Invalid token",

        },

        {

          status: 401,

        }

      );

    }

    const adminId =
      decoded.id ||
      decoded.userId;

    if (!adminId) {

      return NextResponse.json(

        {

          success: false,

          message:
            "Unauthorized",

        },

        {

          status: 401,

        }

      );

    }

    // ==========================
    // CHECK ADMIN
    // ==========================

    const admin =
      await User.findById(adminId);

    if (!admin) {

      return NextResponse.json(

        {

          success: false,

          message:
            "Admin not found",

        },

        {

          status: 404,

        }

      );

    }

    if (admin.role !== "admin") {

      return NextResponse.json(

        {

          success: false,

          message:
            "Access denied",

        },

        {

          status: 403,

        }

      );

    }
    // ==========================
    // QUERY PARAMS
    // ==========================

    const search =
      req.nextUrl.searchParams
        .get("search") || "";

    const status =
      req.nextUrl.searchParams
        .get("status") || "";

    const filter: any = {};

    if (status) {

      filter.orderStatus = status;

    }

    // ==========================
    // GET ORDERS
    // ==========================

    let orders =
      await Order.find(filter)

        .populate({

          path: "user",

          select:
            "name email mobile phone",

        })

        .populate({

          path: "items.product",

        })

        .sort({

          createdAt: -1,

        })

        .lean();

    // ==========================
    // SEARCH FILTER
    // ==========================

    if (search.trim()) {

      const keyword =
        search.toLowerCase();

      orders = orders.filter(
        (order: any) => {

          const user =
            order.user || {};

          const customerName =
            (
              user.name || ""
            ).toLowerCase();

          const customerEmail =
            (
              user.email || ""
            ).toLowerCase();

          const customerPhone =
            (
              user.mobile ||
              user.phone ||
              ""
            ).toLowerCase();

          const orderId =
            String(order._id)
              .toLowerCase();

          return (

            customerName.includes(keyword) ||

            customerEmail.includes(keyword) ||

            customerPhone.includes(keyword) ||

            orderId.includes(keyword)

          );

        }

      );

    }
    // ==========================
    // SUCCESS RESPONSE
    // ==========================

    return NextResponse.json(

      {

        success: true,

        totalOrders:
          orders.length,

        orders,

      },

      {

        status: 200,

      }

    );

  } catch (error: any) {

    console.log(

      "ADMIN ORDERS ERROR:",

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
