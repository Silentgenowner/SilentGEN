import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { Readable } from "stream";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import cloudinary from "@/lib/cloudinary";
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

function toArray(value: unknown) {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function uploadImageToCloudinary(
  file: File
) {
  const bytes =
    await file.arrayBuffer();

  const buffer = Buffer.from(bytes);

  return new Promise<string>(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              "SilentGEN/products",
          },
          (error, result) => {
            if (error || !result) {
              reject(error);
              return;
            }

            resolve(
              result.secure_url
            );
          }
        );

      Readable.from(buffer).pipe(
        uploadStream
      );
    }
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const permitted =
      await hasPermission(request);

    if (!permitted) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Permission denied.",
        },
        {
          status: 403,
        }
      );
    }

    await connectDB();

    const formData =
      await request.formData();

    const excel =
      formData.get("excel") as File | null;

    if (!excel) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Excel file is required.",
        },
        {
          status: 400,
        }
      );
    }

    const images =
      formData.getAll(
        "images"
      ) as File[];

    const workbook = XLSX.read(
      Buffer.from(
        await excel.arrayBuffer()
      )
    );

    const sheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const rows =
      XLSX.utils.sheet_to_json<
        Record<string, unknown>
      >(sheet);

    let updated = 0;
    let skipped = 0;

    const errors: string[] = [];
        for (const row of rows) {
      try {
        const sku = String(row.sku || "")
          .trim()
          .toUpperCase();

        if (!sku) {
          skipped++;
          errors.push("Missing SKU");
          continue;
        }

        const product = await Product.findOne({
          sku,
        });

        if (!product) {
          skipped++;
          errors.push(
            `${sku} : Product not found`
          );
          continue;
        }

        const mrp = Number(
          row.mrp ?? product.mrp
        );

        const price = Number(
          row.price ?? product.price
        );

        if (price > mrp) {
          skipped++;
          errors.push(
            `${sku} : Price cannot be greater than MRP`
          );
          continue;
        }

        const stock = Number(
          row.stock ?? product.stock
        );

        if (stock < 0) {
          skipped++;
          errors.push(
            `${sku} : Invalid stock`
          );
          continue;
        }

        let thumbnail =
          product.thumbnail || "";

        // -------------------------
        // Image URL
        // -------------------------

        if (
          row.image &&
          String(row.image).startsWith("http")
        ) {
          thumbnail = String(
            row.image
          ).trim();
        }

        // -------------------------
        // Local Image Upload
        // -------------------------

        if (!thumbnail && row.image) {
          const fileName = String(
            row.image
          ).trim();

          const matchedImage =
            images.find(
              (image) =>
                image.name
                  .trim()
                  .toLowerCase() ===
                fileName
                  .trim()
                  .toLowerCase()
            );

          if (matchedImage) {
            try {
              thumbnail =
                await uploadImageToCloudinary(
                  matchedImage
                );
            } catch {
              errors.push(
                `${sku} : Image upload failed`
              );
            }
          }
        }
                await Product.findOneAndUpdate(
          {
            sku,
          },
          {
            $set: {
              name:
                row.name ??
                product.name,

              category:
                row.category ??
                product.category,

              subCategory:
                row.subCategory ??
                product.subCategory,

              brand:
                row.brand ??
                product.brand,

              shortDescription:
                row.shortDescription ??
                product.shortDescription,

              description:
                row.description ??
                product.description,

              mrp,

              price,

              discount:
                mrp > 0
                  ? Math.round(
                      ((mrp - price) /
                        mrp) *
                        100
                    )
                  : 0,

              stock,

              thumbnail,

              images: thumbnail
                ? [thumbnail]
                : product.images,

              sizes:
                row.sizes !== undefined
                  ? toArray(row.sizes)
                  : product.sizes,

              colors:
                row.colors !== undefined
                  ? toArray(row.colors)
                  : product.colors,

              tags:
                row.tags !== undefined
                  ? toArray(row.tags)
                  : product.tags,

              featured:
                row.featured !== undefined
                  ? String(
                      row.featured
                    ).toLowerCase() ===
                    "true"
                  : product.featured,

              bestSeller:
                row.bestSeller !== undefined
                  ? String(
                      row.bestSeller
                    ).toLowerCase() ===
                    "true"
                  : product.bestSeller,

              newArrival:
                row.newArrival !== undefined
                  ? String(
                      row.newArrival
                    ).toLowerCase() ===
                    "true"
                  : product.newArrival,

              trending:
                row.trending !== undefined
                  ? String(
                      row.trending
                    ).toLowerCase() ===
                    "true"
                  : product.trending,

              status:
                row.status ??
                product.status,

              lowStockLimit:
                row.lowStockLimit !== undefined
                  ? Number(
                      row.lowStockLimit
                    )
                  : product.lowStockLimit,

              seoTitle:
                row.seoTitle ??
                product.seoTitle,

              seoDescription:
                row.seoDescription ??
                product.seoDescription,
            },
          }
        );

        updated++;

      } catch (error) {

        skipped++;

        errors.push(
          `${row.sku || "UNKNOWN"} : Update failed`
        );

        console.error(
          "PRODUCT_UPDATE_ERROR:",
          error
        );
      }
    }
        return NextResponse.json(
      {
        success: true,

        message:
          "Products updated successfully.",

        updated,

        skipped,

        errors,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.error(
      "PRODUCT_UPDATE_API_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to update products.",
      },
      {
        status: 500,
      }
    );
  }
}
