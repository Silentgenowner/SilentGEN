import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import { verifyAdminToken } from "@/lib/adminAuth";

const allowedRoles = [
  "super_admin",
  "product_manager",
] as const;

async function hasPermission(request: NextRequest) {
  const token = request.cookies.get("adminToken")?.value;

  if (!token) {
    return {
      success: false,
      message: "Unauthorized.",
    };
  }

  try {
    const payload = await verifyAdminToken(token);

    if (
      !payload.adminId ||
      !payload.role ||
      !allowedRoles.includes(
        payload.role as (typeof allowedRoles)[number]
      )
    ) {
      return {
        success: false,
        message: "Permission denied.",
      };
    }

    return {
      success: true,
      adminId: payload.adminId,
      role: payload.role,
    };
  } catch {
    return {
      success: false,
      message: "Invalid token.",
    };
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const permission = await hasPermission(request);

    if (!permission.success) {
      return NextResponse.json(permission, {
        status: 403,
      });
    }

    await connectDB();

    const { id } = await context.params;

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (product.status === "Archived") {
      return NextResponse.json(
        {
          success: false,
          message: "Product already archived.",
        },
        {
          status: 400,
        }
      );
    }

    product.status = "Archived";

    await product.save();

    return NextResponse.json({
      success: true,
      message: "Product archived successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to archive product.",
      },
      {
        status: 500,
      }
    );
  }
}
