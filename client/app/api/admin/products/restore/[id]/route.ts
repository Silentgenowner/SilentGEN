import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

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
    return false;
  }

  try {
    const payload = await verifyAdminToken(token);

    return Boolean(
      payload.adminId &&
        payload.role &&
        allowedRoles.includes(
          payload.role as (typeof allowedRoles)[number]
        )
    );
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const permitted = await hasPermission(request);

    if (!permitted) {
      return NextResponse.json(
        {
          success: false,
          message: "Permission denied.",
        },
        {
          status: 403,
        }
      );
    }

    await connectDB();

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product id.",
        },
        {
          status: 400,
        }
      );
    }

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

    product.isDeleted = false;
    product.deletedAt = null;
    product.deletedBy = null;

    await product.save();

    return NextResponse.json(
      {
        success: true,
        message: "Product restored successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "RESTORE_PRODUCT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to restore product.",
      },
      {
        status: 500,
      }
    );
  }
}
