import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";

type SuggestionProduct = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  discount: number;
  thumbnail: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
};

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // =====================================================
    // DATABASE
    // =====================================================

    await connectDB();

    const { id } = await context.params;

    // =====================================================
    // VALIDATE PRODUCT ID
    // =====================================================

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

    // =====================================================
    // FIND CURRENT PRODUCT
    // =====================================================

    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
    })
      .select("suggestedProductIds")
      .lean();

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

    // =====================================================
    // GET MANUAL SUGGESTED PRODUCT IDS
    // =====================================================

    const rawSuggestedIds =
      Array.isArray(product.suggestedProductIds)
        ? product.suggestedProductIds
        : [];

    // =====================================================
    // CLEAN IDS
    // =====================================================

    const suggestedIds: mongoose.Types.ObjectId[] = [];

    for (const item of rawSuggestedIds) {
      const stringId = String(item);

      if (
        mongoose.Types.ObjectId.isValid(stringId) &&
        stringId !== id
      ) {
        suggestedIds.push(
          new mongoose.Types.ObjectId(stringId)
        );
      }
    }

    // =====================================================
    // NO SUGGESTIONS
    // =====================================================

    if (suggestedIds.length === 0) {
      return NextResponse.json(
        {
          success: true,
          suggestions: [],
        },
        {
          status: 200,
        }
      );
    }

    // =====================================================
    // FIND SUGGESTED PRODUCTS
    // =====================================================

    const products =
      (await Product.find({
        _id: {
          $in: suggestedIds,
        },
        isDeleted: false,
        status: {
          $in: ["Active"],
        },
      })
        .select(
          [
            "_id",
            "name",
            "slug",
            "brand",
            "category",
            "price",
            "mrp",
            "discount",
            "thumbnail",
            "images",
            "rating",
            "reviewCount",
            "stock",
          ].join(" ")
        )
        .lean()) as unknown as SuggestionProduct[];

    // =====================================================
    // KEEP ADMIN SELECTED ORDER
    // =====================================================

    const productMap = new Map<string, SuggestionProduct>();

    for (const item of products) {
      productMap.set(
        String(item._id),
        item
      );
    }

    const suggestions: SuggestionProduct[] = [];

    for (const suggestedId of suggestedIds) {
      const item = productMap.get(
        String(suggestedId)
      );

      if (item) {
        suggestions.push(item);
      }

      if (suggestions.length >= 4) {
        break;
      }
    }

    // =====================================================
    // NORMALIZE IMAGES
    // =====================================================

    const normalizedSuggestions =
      suggestions.map(
        (
          item: SuggestionProduct
        ): SuggestionProduct => ({
          ...item,

          thumbnail:
            typeof item.thumbnail === "string"
              ? item.thumbnail
              : "",

          images:
            Array.isArray(item.images)
              ? item.images
                  .map(
                    (image: string): string =>
                      String(image).trim()
                  )
                  .filter(
                    (image: string): boolean =>
                      Boolean(image)
                  )
              : [],
        })
      );

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json(
      {
        success: true,
        suggestions:
          normalizedSuggestions,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET PRODUCT SUGGESTIONS ERROR:",
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