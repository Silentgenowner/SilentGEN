import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

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
export async function GET(request: NextRequest) {
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

    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .lean();

    const rows = products.map((product) => ({
      sku: product.sku || "",

      name: product.name || "",

      category: product.category || "",

      subCategory: product.subCategory || "",

      brand: product.brand || "",

      shortDescription:
        product.shortDescription || "",

      description:
        product.description || "",

      mrp: product.mrp ?? 0,

      price: product.price ?? 0,

      stock: product.stock ?? 0,

      image:
        product.thumbnail ||
        product.images?.[0] ||
        "",

      sizes: (product.sizes || []).join(","),

      colors: (product.colors || []).join(","),

      tags: (product.tags || []).join(","),

      featured: product.featured,

      bestSeller: product.bestSeller,

      newArrival: product.newArrival,

      trending: product.trending,

      status: product.status,

      lowStockLimit:
        product.lowStockLimit ?? 5,

      seoTitle:
        product.seoTitle || "",

      seoDescription:
        product.seoDescription || "",
    }));
        const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Products"
    );

    worksheet["!cols"] = [
      { wch: 18 }, // SKU
      { wch: 35 }, // Name
      { wch: 20 }, // Category
      { wch: 20 }, // Sub Category
      { wch: 20 }, // Brand
      { wch: 35 }, // Short Description
      { wch: 50 }, // Description
      { wch: 10 }, // MRP
      { wch: 10 }, // Price
      { wch: 10 }, // Stock
      { wch: 40 }, // Image
      { wch: 18 }, // Sizes
      { wch: 18 }, // Colors
      { wch: 25 }, // Tags
      { wch: 12 }, // Featured
      { wch: 12 }, // Best Seller
      { wch: 12 }, // New Arrival
      { wch: 12 }, // Trending
      { wch: 18 }, // Status
      { wch: 15 }, // Low Stock
      { wch: 35 }, // SEO Title
      { wch: 50 }, // SEO Description
    ];

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="SilentGEN_Products.xlsx"',
      },
    });
  } catch (error) {
    console.error("PRODUCT_EXPORT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to export products.",
      },
      {
        status: 500,
      }
    );
  }
}
