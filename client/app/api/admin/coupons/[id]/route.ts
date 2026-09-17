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
import Coupon from "@/models/Coupon";

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

  if (
    ![
      "super_admin",
      "finance_manager",
    ].includes(
      String(admin.role)
    )
  ) {
    throw new Error(
      "FORBIDDEN"
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

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid coupon id.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    const coupon =
      await Coupon.findById(
        id
      );

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Coupon not found.",
        },
        {
          status: 404,
        }
      );
    }

    const code =
      String(
        body?.code ||
          coupon.code
      )
        .trim()
        .toUpperCase();

    const duplicate =
      await Coupon.findOne({
        code,
        _id: {
          $ne: id,
        },
      }).lean();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Coupon code already exists.",
        },
        {
          status: 409,
        }
      );
    }

    coupon.code =
      code;

    coupon.description =
      String(
        body?.description ??
          coupon.description
      ).trim();

    coupon.discountType =
      body?.discountType ===
      "fixed"
        ? "fixed"
        : "percentage";

    coupon.discountValue =
      Number(
        body?.discountValue ??
          coupon.discountValue
      );

    coupon.minimumOrderAmount =
      Number(
        body
          ?.minimumOrderAmount ??
          coupon.minimumOrderAmount
      );

    coupon.maximumDiscountAmount =
      body
        ?.maximumDiscountAmount
        ? Number(
            body.maximumDiscountAmount
          )
        : undefined;

    coupon.usageLimit =
      body?.usageLimit
        ? Number(
            body.usageLimit
          )
        : undefined;

    coupon.perUserLimit =
      Math.max(
        1,
        Number(
          body?.perUserLimit ??
            coupon.perUserLimit
        )
      );

    coupon.startDate =
      body?.startDate
        ? new Date(
            body.startDate
          )
        : undefined;

    coupon.expiryDate =
      body?.expiryDate
        ? new Date(
            body.expiryDate
          )
        : undefined;

    coupon.isActive =
      body?.isActive !==
      false;

    await coupon.save();

    return NextResponse.json({
      success: true,
      message:
        "Coupon updated successfully.",
      coupon,
    });
  } catch (error) {
    console.error(
      "COUPON UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update coupon.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
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
            "Invalid coupon id.",
        },
        {
          status: 400,
        }
      );
    }

    const coupon =
      await Coupon.findByIdAndDelete(
        id
      );

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Coupon not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Coupon deleted successfully.",
    });
  } catch (error) {
    console.error(
      "COUPON DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete coupon.",
      },
      {
        status: 500,
      }
    );
  }
}