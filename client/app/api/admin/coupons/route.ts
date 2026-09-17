import {
  NextRequest,
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import Admin from "@/models/Admin";
import Coupon from "@/models/Coupon";

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
        "_id role isActive"
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

  const allowed = [
    "super_admin",
    "finance_manager",
  ];

  if (
    !allowed.includes(
      String(admin.role)
    )
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    await connectDB();

    await authenticate(
      request
    );

    const search =
      request.nextUrl.searchParams
        .get("search")
        ?.trim() || "";

    const filter: any = {};

    if (search) {
      filter.$or = [
        {
          code: {
            $regex:
              search,
            $options:
              "i",
          },
        },

        {
          description: {
            $regex:
              search,
            $options:
              "i",
          },
        },
      ];
    }

    const coupons =
      await Coupon.find(
        filter
      )
        .sort({
          createdAt: -1,
        })
        .lean();

    return NextResponse.json({
      success: true,
      coupons,
      total:
        coupons.length,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "UNAUTHORIZED"
    ) {
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

    if (
      message ===
      "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied.",
        },
        {
          status: 403,
        }
      );
    }

    console.error(
      "COUPONS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load coupons.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB();

    await authenticate(
      request
    );

    const body =
      await request.json();

    const code =
      String(
        body?.code || ""
      )
        .trim()
        .toUpperCase();

    const discountType =
      body?.discountType ===
      "fixed"
        ? "fixed"
        : "percentage";

    const discountValue =
      Number(
        body?.discountValue ||
          0
      );

    const minimumOrderAmount =
      Number(
        body
          ?.minimumOrderAmount ||
          0
      );

    const maximumDiscountAmount =
      body
        ?.maximumDiscountAmount
        ? Number(
            body.maximumDiscountAmount
          )
        : undefined;

    const usageLimit =
      body?.usageLimit
        ? Number(
            body.usageLimit
          )
        : undefined;

    const perUserLimit =
      Math.max(
        1,
        Number(
          body?.perUserLimit ||
            1
        )
      );

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Coupon code is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      discountValue <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Discount value must be greater than 0.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      discountType ===
        "percentage" &&
      discountValue > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Percentage discount cannot exceed 100%.",
        },
        {
          status: 400,
        }
      );
    }

    const exists =
      await Coupon.findOne({
        code,
      }).lean();

    if (exists) {
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

    const coupon =
      await Coupon.create({
        code,

        description:
          String(
            body?.description ||
              ""
          ).trim(),

        discountType,

        discountValue,

        minimumOrderAmount,

        maximumDiscountAmount,

        usageLimit,

        perUserLimit,

        usedCount: 0,

        startDate:
          body?.startDate
            ? new Date(
                body.startDate
              )
            : undefined,

        expiryDate:
          body?.expiryDate
            ? new Date(
                body.expiryDate
              )
            : undefined,

        isActive:
          body?.isActive !==
          false,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Coupon created successfully.",
        coupon,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "COUPON CREATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create coupon.",
      },
      {
        status: 500,
      }
    );
  }
}