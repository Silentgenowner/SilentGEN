import { NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";

/*
|--------------------------------------------------------------------------
| CATEGORY TYPE
|--------------------------------------------------------------------------
*/

type CategoryResponse = {
  _id: string;
  name: string;
  category: string;
  title: string;
  enabled: boolean;
  sortOrder: number;
};

/*
|--------------------------------------------------------------------------
| GET PRODUCT CATEGORIES
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | 2. GET DISTINCT CATEGORIES
    |--------------------------------------------------------------------------
    |
    | We only read the category field.
    |
    */

    const rawCategories =
      await Product.distinct("category");

    /*
    |--------------------------------------------------------------------------
    | 3. CLEAN CATEGORIES
    |--------------------------------------------------------------------------
    */

    const categories: CategoryResponse[] =
      rawCategories
        .filter(
          (category): category is string =>
            typeof category === "string" &&
            category.trim().length > 0
        )
        .map((category) => {
          const cleanCategory =
            category.trim();

          return {
            _id: cleanCategory
              .toLowerCase()
              .replace(/\s+/g, "-"),

            name: cleanCategory,

            category: cleanCategory,

            title: cleanCategory,

            enabled: true,

            sortOrder: 0,
          };
        });

    /*
    |--------------------------------------------------------------------------
    | 4. REMOVE DUPLICATES
    |--------------------------------------------------------------------------
    */

    const uniqueCategories =
      Array.from(
        new Map(
          categories.map(
            (category) => [
              category.category
                .toLowerCase(),
              category,
            ]
          )
        ).values()
      );

    /*
    |--------------------------------------------------------------------------
    | 5. SORT
    |--------------------------------------------------------------------------
    */

    uniqueCategories.sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          undefined,
          {
            sensitivity: "base",
          }
        )
    );

    /*
    |--------------------------------------------------------------------------
    | 6. RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        categories:
          uniqueCategories,

        count:
          uniqueCategories.length,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    console.error(
      "PRODUCT_CATEGORIES_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load product categories.",

        categories: [],
      },
      {
        status: 500,
      }
    );
  }
}