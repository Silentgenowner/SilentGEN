import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";
import Product from "@/models/Product";

const productRoles = ["super_admin", "product_manager"] as const;

function createUnauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "You do not have permission to manage products.",
    },
    { status: 403 }
  );
}

async function canManageProducts(request: NextRequest) {
  const token = request.cookies.get("adminToken")?.value;

  if (!token) {
    return false;
  }

  try {
    const payload = await verifyAdminToken(token);

    return Boolean(
      payload.adminId &&
        payload.role &&
        productRoles.includes(
          payload.role as (typeof productRoles)[number]
        )
    );
  } catch {
    return false;
  }
}

function toPositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number.parseInt(value || "", 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toStringArray(value: unknown, maximumItems = 20) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maximumItems);
}

// =====================================================
// GET PRODUCTS
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const hasPermission = await canManageProducts(request);

    if (!hasPermission) {
      return createUnauthorizedResponse();
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = toPositiveInteger(searchParams.get("page"), 1);
    const requestedLimit = toPositiveInteger(
      searchParams.get("limit"),
      10
    );
    const limit = Math.min(requestedLimit, 100);

    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const sort = searchParams.get("sort") || "newest";

    const filter: Record<string, unknown> = {
     $or: [
     { isDeleted: false },
     { isDeleted: { $exists: false } },
       ],
     };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { name: regex },
        { sku: regex },
        { category: regex },
        { brand: regex },
        { tags: regex },
      ];
    }

    if (category) {
      filter.category = category;
    }

    const allowedStatuses = [
      "Active",
      "Draft",
      "Out of Stock",
      "Archived",
    ];

    if (allowedStatuses.includes(status)) {
      filter.status = status;
    }

    const sortOptions: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_low_to_high: { price: 1 },
      price_high_to_low: { price: -1 },
      name_a_to_z: { name: 1 },
      stock_low_to_high: { stock: 1 },
    };

    const sortQuery =
      sortOptions[sort] || sortOptions.newest;
    const [products, totalProducts, categories] = await Promise.all([
      Product.find(filter)
        .sort(sortQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),

      Product.distinct("category"),
    ]);

    // Debug (જો જરૂર ન હોય તો પછી કાઢી શકો)
    console.log(
      products.map((product: any) => ({
        id: String(product._id),
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        stock: product.stock,
      }))
    );

    // Corrupt products remove
    const validProducts = products.filter((product: any) => {
      return (
        product &&
        typeof product.name === "string" &&
        typeof product.price === "number" &&
        typeof product.mrp === "number" &&
        typeof product.stock === "number"
      );
    });

    return NextResponse.json(
      {
        success: true,
        products: validProducts,
        categories: categories.filter(Boolean).sort(),
        pagination: {
          page,
          limit,
          totalProducts,
          totalPages: Math.ceil(totalProducts / limit),
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET_ADMIN_PRODUCTS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch products.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST PRODUCT
// =====================================================
// =====================================================
// POST HELPERS
// =====================================================

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown, defaultValue = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return defaultValue;
  }

  return number;
}

function isValidStatus(value: unknown): value is
  | "Active"
  | "Draft"
  | "Out of Stock"
  | "Archived" {
  return (
    value === "Active" ||
    value === "Draft" ||
    value === "Out of Stock" ||
    value === "Archived"
  );
}

function calculateDiscount(mrp: number, price: number) {
  if (mrp <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(((mrp - price) / mrp) * 100)
  );
}
// =====================================================
// CREATE PRODUCT
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const hasPermission = await canManageProducts(request);

    if (!hasPermission) {
      return createUnauthorizedResponse();
    }

    await connectDB();

    const body = await request.json();

    const name = normalizeString(body.name);
    const sku = normalizeString(body.sku).toUpperCase();
    const category = normalizeString(body.category);

    const slug = createSlug(
      normalizeString(body.slug) || name
    );

    const mrp = normalizeNumber(body.mrp);
    const price = normalizeNumber(body.price);
    const stock = normalizeNumber(body.stock);

    if (!name || !sku || !slug || !category) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, SKU, Slug and Category are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (mrp < 0 || price < 0 || stock < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "MRP, Price and Stock cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    if (price > mrp) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selling price cannot be greater than MRP.",
        },
        {
          status: 400,
        }
      );
    }

    const existingProduct = await Product.findOne({
      $or: [
        { sku },
        { slug },
      ],
    }).select("_id sku slug");

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            existingProduct.sku === sku
              ? "SKU already exists."
              : "Slug already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const status = isValidStatus(body.status)
      ? body.status
      : "Active";

    const discount = calculateDiscount(mrp, price);
    const product = await Product.create({
      sku,
      name,
      slug,

      shortDescription: normalizeString(body.shortDescription),
      description: normalizeString(body.description),

      category,
      subCategory: normalizeString(body.subCategory),

      brand:
        normalizeString(body.brand) || "SilentGEN",

      gender: ["Men", "Women", "Kids", "Unisex"].includes(body.gender)
        ? body.gender
        : "Unisex",

      fabric: normalizeString(body.fabric),
      fit: normalizeString(body.fit),

      gsm: normalizeNumber(body.gsm),
      weight: normalizeNumber(body.weight),

      mrp,
      price,
      discount,

      stock,

      lowStockLimit: normalizeNumber(
        body.lowStockLimit,
        5
      ),

      sold: 0,

      thumbnail: normalizeString(body.thumbnail),

      images: toStringArray(body.images, 10),

      sizes: toStringArray(body.sizes, 20),

      colors: toStringArray(body.colors, 20),

      tags: toStringArray(body.tags, 30),

      featured: Boolean(body.featured),
      bestSeller: Boolean(body.bestSeller),
      newArrival: Boolean(body.newArrival),
      trending: Boolean(body.trending),

      status,

      isDeleted: false,

      sortOrder: normalizeNumber(body.sortOrder),

      seoTitle: normalizeString(body.seoTitle),
      seoDescription: normalizeString(body.seoDescription),
    });
    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully.",
        product,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("CREATE_ADMIN_PRODUCT_ERROR:", error);

    const mongoError = error as {
      code?: number;
      keyPattern?: Record<string, unknown>;
    };

    if (mongoError.code === 11000) {
      const duplicateField = mongoError.keyPattern
        ? Object.keys(mongoError.keyPattern)[0]
        : "value";

      return NextResponse.json(
        {
          success: false,
          message: `A product with this ${duplicateField} already exists.`,
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create the product.",
      },
      {
        status: 500,
      }
    );
  }
}