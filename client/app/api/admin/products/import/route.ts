import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { Readable } from "stream";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import { verifyAdminToken } from "@/lib/adminAuth";
import cloudinary from "@/lib/cloudinary";

const allowedRoles = [
  "super_admin",
  "product_manager",
] as const;

// ======================================================
// ADMIN PERMISSION
// ======================================================

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

// ======================================================
// HELPERS
// ======================================================

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toArray(value: unknown) {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: unknown, defaultValue = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return defaultValue;
  }

  return number;
}

function calculateDiscount(
  mrp: number,
  price: number
) {
  if (mrp <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(((mrp - price) / mrp) * 100)
  );
}

function normalizeStatus(value: unknown) {
  const status = String(value || "");

  if (
    [
      "Active",
      "Draft",
      "Out of Stock",
      "Archived",
    ].includes(status)
  ) {
    return status;
  }

  return "Active";
}
// ======================================================
// CLOUDINARY IMAGE UPLOAD
// ======================================================

async function uploadImageToCloudinary(
  file: File
): Promise<string> {
  const bytes = await file.arrayBuffer();

  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "SilentGEN/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error);
          return;
        }

        resolve(result.secure_url);
      }
    );

    Readable.from(buffer).pipe(upload);
  });
}

// ======================================================
// IMAGE FINDER
// ======================================================

async function getImageUrl(
  imageValue: unknown,
  uploadedImages: File[]
) {
  if (!imageValue) {
    return "";
  }

  const image = String(imageValue).trim();

  // URL
  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  // Local File
  const matchedImage = uploadedImages.find(
    (file) =>
      file.name.trim().toLowerCase() ===
      image.toLowerCase()
  );

  if (!matchedImage) {
    return "";
  }

  try {
    return await uploadImageToCloudinary(
      matchedImage
    );
  } catch {
    return "";
  }
}

// ======================================================
// IMPORT PRODUCTS
// ======================================================

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
          message: "Permission denied.",
        },
        {
          status: 403,
        }
      );
    }

    await connectDB();

    const formData =
      await request.formData();

    const excel = formData.get(
      "excel"
    ) as File | null;

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

    const uploadedImages =
      formData.getAll("images") as File[];

    const workbook = XLSX.read(
      Buffer.from(await excel.arrayBuffer())
    );

    const sheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const rows =
      XLSX.utils.sheet_to_json<
        Record<string, unknown>
      >(sheet);

    let imported = 0;
    let skipped = 0;

    const errors: string[] = [];
    // ======================================================
    // IMPORT LOOP
    // ======================================================

    for (const row of rows) {
      try {
        const sku = String(row.sku || "")
          .trim()
          .toUpperCase();

        const name = String(row.name || "").trim();

        const slug = createSlug(name);

        const category = String(row.category || "").trim();

        if (!sku || !name || !category) {
          skipped++;
          errors.push(
            `${sku || "UNKNOWN"} : Missing required fields`
          );
          continue;
        }

        // ---------------------------------------
        // Duplicate SKU / Slug Check
        // ---------------------------------------

        const existing = await Product.findOne({
          $or: [
            { sku },
            { slug },
          ],
        }).lean();

        if (existing) {
          skipped++;
          errors.push(
            `${sku} : SKU or Slug already exists`
          );
          continue;
        }

        // ---------------------------------------
        // Numbers
        // ---------------------------------------

        const mrp = toNumber(row.mrp);

        const price = toNumber(row.price);

        const stock = toNumber(row.stock);

        if (
          mrp < 0 ||
          price < 0 ||
          stock < 0
        ) {
          skipped++;
          errors.push(
            `${sku} : Invalid MRP / Price / Stock`
          );
          continue;
        }

        if (price > mrp) {
          skipped++;
          errors.push(
            `${sku} : Price cannot be greater than MRP`
          );
          continue;
        }

        // ---------------------------------------
        // Image
        // ---------------------------------------

        const thumbnail =
          await getImageUrl(
            row.image,
            uploadedImages
          );

        const discount =
          calculateDiscount(
            mrp,
            price
          );

        const status =
          normalizeStatus(row.status);

        // ---------------------------------------
        // Create Product
        // ---------------------------------------

        await Product.create({
          sku,
          name,
          slug,

          category,
          subCategory: String(
            row.subCategory || ""
          ),

          brand:
            String(row.brand || "").trim() ||
            "SilentGEN",

          shortDescription: String(
            row.shortDescription || ""
          ),

          description: String(
            row.description || ""
          ),

          mrp,
          price,
          discount,
          stock,

          thumbnail,

          images: thumbnail
            ? [thumbnail]
            : [],

          sizes: toArray(row.sizes),

          colors: toArray(row.colors),

          tags: toArray(row.tags),

          featured:
            String(row.featured)
              .toLowerCase() === "true",

          bestSeller:
            String(row.bestSeller)
              .toLowerCase() === "true",

          newArrival:
            String(row.newArrival)
              .toLowerCase() === "true",

          trending:
            String(row.trending)
              .toLowerCase() === "true",

          status,

          lowStockLimit: toNumber(
            row.lowStockLimit,
            5
          ),

          seoTitle: String(
            row.seoTitle || ""
          ),

          seoDescription: String(
            row.seoDescription || ""
          ),
        });

        imported++;
      } catch (error) {
        skipped++;

        errors.push(
          `${String(row.sku || "UNKNOWN")} : Failed to import`
        );

        console.error(error);
      }
    }
    return NextResponse.json(
      {
        success: true,
        message: "Products imported successfully.",
        summary: {
          totalRows: rows.length,
          imported,
          skipped,
          failed: errors.length,
        },
        imported,
        skipped,
        errors,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PRODUCT_IMPORT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to import products.",
      },
      {
        status: 500,
      }
    );
  }
}
