import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Order from "@/models/Order";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {

  try {

    const { id } =
      await context.params;

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
    // ADMIN CHECK
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
    // GET ORDER
    // ==========================

    const order =
      await Order.findById(id)

        .populate({

          path: "user",

          select:
            "name email mobile phone",

        })

        .populate({

          path: "items.product",

        })

        .lean();

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

    // ==========================
    // SUCCESS RESPONSE
    // ==========================

    return NextResponse.json(

      {

        success: true,

        order,

      },

      {

        status: 200,

      }

    );
  } catch (error: any) {

    console.log(

      "ADMIN ORDER DETAIL ERROR:",

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

