import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import { verifyAdminToken } from "@/lib/adminAuth";

// =====================================================
// ALLOWED ROLES
// =====================================================

const allowedRoles = [
  "super_admin",
  "product_manager",
] as const;

// =====================================================
// SUGGESTION TYPE
// =====================================================

type Suggestion = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  thumbnail: string;
  images: string[];
  price: number;
  mrp: number;
  discount: number;
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
};

// =====================================================
// PERMISSION CHECK
// =====================================================

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

// =====================================================
// GET SUGGESTED PRODUCTS
//
// GET /api/admin/products/[id]/suggestions
// =====================================================

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // =================================================
    // PERMISSION
    // =================================================

    const permitted = await hasPermission(request);

    if (!permitted) {
      return NextResponse.json(
        {
          success: false,
          message: "Permission denied.",
          suggestions: [],
        },
        {
          status: 403,
        }
      );
    }

    // =================================================
    // DATABASE
    // =================================================

    await connectDB();

    const { id } = await context.params;

    // =================================================
    // OBJECT ID VALIDATION
    // =================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product id.",
          suggestions: [],
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // FIND CURRENT PRODUCT
    // =================================================

    const product = await Product.findById(id)
      .select(
        "category subCategory brand gender suggestedProductIds"
      )
      .lean();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
          suggestions: [],
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // SUGGESTIONS ARRAY
    // =================================================

    let suggestions: Suggestion[] = [];

    // =================================================
    // MANUAL SUGGESTED PRODUCTS
    // =================================================

    if (
      Array.isArray(product.suggestedProductIds) &&
      product.suggestedProductIds.length > 0
    ) {
      const manualSuggestions =
        await Product.find({
          _id: {
            $in: product.suggestedProductIds,
            $ne: id,
          },

          isDeleted: false,

          status: "Active",
        })
          .select(
            "_id name slug thumbnail images price mrp discount category brand rating reviewCount"
          )
          .limit(4)
          .lean();

      suggestions = manualSuggestions as Suggestion[];
    }

    // =================================================
    // AUTOMATIC SUGGESTIONS
    // =================================================

    if (suggestions.length < 4) {
      const existingIds = [
        id,
        ...suggestions.map((item) =>
          String(item._id)
        ),
      ];

      const automaticSuggestions =
        await Product.find({
          _id: {
            $nin: existingIds,
          },

          isDeleted: false,

          status: "Active",

          $or: [
            {
              category: product.category,
            },
            {
              subCategory: product.subCategory,
            },
            {
              brand: product.brand,
            },
            {
              gender: product.gender,
            },
          ],
        })
          .select(
            "_id name slug thumbnail images price mrp discount category brand rating reviewCount"
          )
          .sort({
            featured: -1,
            bestSeller: -1,
            newArrival: -1,
            createdAt: -1,
          })
          .limit(4 - suggestions.length)
          .lean();

      suggestions = [
        ...suggestions,
        ...(automaticSuggestions as Suggestion[]),
      ];
    }

    // =================================================
    // FINAL RESPONSE
    // =================================================

    return NextResponse.json(
      {
        success: true,
        suggestions,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET ADMIN PRODUCT SUGGESTIONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load suggested products.",
        suggestions: [],
      },
      {
        status: 500,
      }
    );
  }
}