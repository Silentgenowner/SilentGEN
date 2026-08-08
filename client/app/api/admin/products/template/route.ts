import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { verifyAdminToken } from "@/lib/adminAuth";

const allowedRoles = [
  "super_admin",
  "product_manager",
] as const;

// ===========================================
// Permission
// ===========================================

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

// ===========================================
// Download Excel Template
// ===========================================

export async function GET(
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

    const template = [
      {
        sku: "SG-TS-001",

        name: "Premium Cotton T-Shirt",

        category: "T-Shirts",

        subCategory: "Oversized",

        brand: "SilentGEN",

        shortDescription:
          "Premium Cotton Oversized T-Shirt",

        description:
          "Premium quality oversized cotton t-shirt.",

        mrp: 999,

        price: 699,

        stock: 50,

        image: "SG-TS-001.jpg",

        sizes: "S,M,L,XL",

        colors: "Black,White",

        tags:
          "Cotton,Oversized,Premium",

        featured: true,

        bestSeller: false,

        newArrival: true,

        trending: false,

        status: "Active",

        lowStockLimit: 5,

        seoTitle:
          "Premium Cotton T-Shirt",

        seoDescription:
          "Premium Cotton Oversized T-Shirt",
      },

      {
        sku: "SG-SH-002",
  
        name: "Premium Shirt",
  
        category: "Shirts",
  
        subCategory: "Formal",
  
        brand: "SilentGEN",
  
        shortDescription: "Premium Formal Shirt",
  
        description: "100% Cotton Formal Shirt",
  
        mrp: 1999,
  
        price: 1499,
  
        stock: 25,
  
        image: "SG-SH-002.jpg",
  
        sizes: "M,L,XL",
  
        colors: "White,Blue",
  
        tags: "Formal,Cotton",
  
        featured: false,
  
        bestSeller: true,
  
        newArrival: false,
  
        trending: true,
  
        status: "Active",
  
        lowStockLimit: 5,
  
        seoTitle: "Premium Shirt",
  
        seoDescription: "Premium Formal Shirt"
      },
    ];
    // ===========================================
    // Workbook
    // ===========================================

    const workbook = XLSX.utils.book_new();

    const worksheet =
      XLSX.utils.json_to_sheet(template);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Products Template"
    );

    // ===========================================
    // Column Width
    // ===========================================

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
      { wch: 30 }, // Image
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

    const buffer = XLSX.write(
      workbook,
      {
        type: "buffer",
        bookType: "xlsx",
      }
    );
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "Content-Disposition":
          'attachment; filename="SilentGEN_Product_Template.xlsx"',
      },
    });
  } catch (error) {
    console.error(
      "PRODUCT_TEMPLATE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to generate template.",
      },
      {
        status: 500,
      }
    );
  }
}
