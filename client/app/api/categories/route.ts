import { NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Category from "@/models/Category";

/*
|--------------------------------------------------------------------------
| GET /api/categories
|--------------------------------------------------------------------------
| Public Category API
|
| Returns only enabled categories.
| Categories are always sorted by sortOrder.
|
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. CONNECT DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | 2. FETCH CATEGORIES
    |--------------------------------------------------------------------------
    */

    const categories =
      await Category.find({
        enabled: true,
      })
        .sort({
          sortOrder: 1,
          name: 1,
        })
        .lean();

    /*
    |--------------------------------------------------------------------------
    | 3. NORMALIZE RESPONSE
    |--------------------------------------------------------------------------
    */

    const normalizedCategories =
      categories.map(
        (category) => ({
          _id: String(
            category._id
          ),

          name: String(
            category.name || ""
          ).trim(),

          slug: String(
            category.slug || ""
          )
            .trim()
            .toLowerCase(),

          image: {
            url: String(
              category.image?.url ||
                ""
            ).trim(),

            publicId: String(
              category.image
                ?.publicId || ""
            ).trim(),

            alt: String(
              category.image?.alt ||
                category.name ||
                ""
            ).trim(),

            title: String(
              category.image
                ?.title ||
                category.name ||
                ""
            ).trim(),
          },

          enabled:
            category.enabled !==
            false,

          sortOrder:
            Number(
              category.sortOrder
            ) || 0,
        })
      );

    /*
    |--------------------------------------------------------------------------
    | 4. SUCCESS RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        categories:
          normalizedCategories,

        count:
          normalizedCategories.length,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | ERROR LOG
    |--------------------------------------------------------------------------
    */

    console.error(
      "PUBLIC CATEGORY API ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | ERROR RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: false,

        categories: [],

        count: 0,

        message:
          "Unable to load categories.",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}