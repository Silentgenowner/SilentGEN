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

export async function DELETE(
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

    /*
    =====================================
    Delete Product Images (Cloudinary)
    =====================================
    */

    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      Array.isArray(product.images)
    ) {
      try {
        const { v2: cloudinary } = await import("cloudinary");

        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        for (const image of product.images) {
          if (!image) continue;

          const parts = image.split("/");

          const filename =
            parts[parts.length - 1];

          const publicId =
            filename.split(".")[0];

          try {
            await cloudinary.uploader.destroy(
              `SilentGEN/products/${publicId}`
            );
          } catch (error) {
            console.error(
              "Cloudinary delete failed:",
              publicId,
              error
            );
          }
        }
      } catch (error) {
        console.error(
          "Cloudinary configuration error:",
          error
        );
      }
    }
 /*
=====================================
Soft Delete Product
=====================================
*/

product.isDeleted = true;
product.deletedAt = new Date();

await product.save();

return NextResponse.json(
  {
    success: true,
    message: "Product moved to Trash.",
  },
  {
    status: 200,
  }
);

  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete product.",
      },
      {
        status: 500,
      }
    );
  }
}
