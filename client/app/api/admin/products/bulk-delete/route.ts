import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import { verifyAdminToken } from "@/lib/adminAuth";

const allowedRoles = [
  "super_admin",
  "product_manager",
] as const;

async function hasPermission(
  request: NextRequest
) {
  const token =
    request.cookies.get("adminToken")?.value;

  if (!token) {
    return false;
  }

  try {
    const payload =
      await verifyAdminToken(token);

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

type Body = {
  productIds: string[];
};

export async function DELETE(
  request: NextRequest
) {
  try {
    const permitted =
      await hasPermission(request);

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

    const body =
      (await request.json()) as Body;

    if (
      !body.productIds ||
      !Array.isArray(body.productIds)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request.",
        },
        {
          status: 400,
        }
      );
    }

    if (body.productIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No products selected.",
        },
        {
          status: 400,
        }
      );
    }
        /*
    =====================================
    Fetch Products
    =====================================
    */

    const products = await Product.find({
      _id: {
        $in: body.productIds,
      },
    }).lean();

    /*
    =====================================
    Cloudinary Cleanup
    =====================================
    */

    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      products.length > 0
    ) {
      try {
        const { v2: cloudinary } =
          await import("cloudinary");

        cloudinary.config({
          cloud_name:
            process.env.CLOUDINARY_CLOUD_NAME,
          api_key:
            process.env.CLOUDINARY_API_KEY,
          api_secret:
            process.env.CLOUDINARY_API_SECRET,
        });

        for (const product of products) {
          if (!Array.isArray(product.images))
            continue;

          for (const image of product.images) {
            if (!image) continue;

            try {
              const parts = image.split("/");

              const filename =
                parts[parts.length - 1];

              const publicId =
                filename.split(".")[0];

              await cloudinary.uploader.destroy(
                `SilentGEN/products/${publicId}`
              );
            } catch (error) {
              console.error(
                "Cloudinary delete failed:",
                error
              );
            }
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
    Delete Products
    =====================================
    */

    const result =
      await Product.deleteMany({
        _id: {
          $in: body.productIds,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: `${result.deletedCount} products deleted successfully.`,
        deletedCount:
          result.deletedCount,
      },
      {
        status: 200,
      }
    );
      } catch (error) {
    console.error(
      "BULK DELETE PRODUCTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete products.",
      },
      {
        status: 500,
      }
    );
  }
}
