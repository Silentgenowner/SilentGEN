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
import User from "@/models/User";
import Order from "@/models/Order";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

async function authenticate(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (!token) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  const payload =
    await verifyAdminToken(
      token
    );

  const admin =
    await Admin.findById(
      payload.adminId
    )
      .select(
        "role isActive"
      )
      .lean();

  if (
    !admin ||
    admin.isActive === false
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }
}

export async function GET(
  request: NextRequest,
  context: Context
) {
  try {
    await connectDB();

    await authenticate(
      request
    );

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
            "Invalid customer id.",
        },
        {
          status: 400,
        }
      );
    }

    const customer =
      await User.findById(
        id
      )
        .select(
          "_id name email mobile profileImage isVerified isBlocked lastLogin createdAt"
        )
        .lean();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    const orders =
      await Order.find({
        user: id,
      })
        .select(
          "_id totalAmount paymentMethod paymentStatus orderStatus createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(20)
        .lean();

    const totalSpend =
      orders.reduce(
        (
          sum: number,
          order: any
        ) =>
          order.orderStatus ===
          "Cancelled"
            ? sum
            : sum +
              Number(
                order.totalAmount ||
                  0
              ),
        0
      );

    return NextResponse.json({
      success: true,

      customer: {
        ...customer,

        orderCount:
          orders.length,

        totalSpend,
      },

      orders,
    });
  } catch (error) {
    console.error(
      "CUSTOMER DETAIL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load customer.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: Context
) {
  try {
    await connectDB();

    await authenticate(
      request
    );

    const { id } =
      await context.params;

    const body =
      await request.json();

    const customer =
      await User.findById(
        id
      );

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      typeof body?.isBlocked ===
      "boolean"
    ) {
      customer.isBlocked =
        body.isBlocked;
    }

    await customer.save();

    return NextResponse.json({
      success: true,

      message:
        customer.isBlocked
          ? "Customer blocked."
          : "Customer unblocked.",

      customer,
    });
  } catch (error) {
    console.error(
      "CUSTOMER UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update customer.",
      },
      {
        status: 500,
      }
    );
  }
}   