import { NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import HomePage from "@/models/HomePage";
import Category from "@/models/Category";

/*
|--------------------------------------------------------------------------
| PUBLIC HOMEPAGE API
|--------------------------------------------------------------------------
|
| GET /api/homepage
|
| This API is PUBLIC.
| No admin authentication is required.
|
| It returns:
|
| 1. Published homepage configuration
| 2. Active categories from Category collection
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type CategoryResponseItem = {
  _id: string;

  name: string;

  slug: string;

  image: {
    url: string;
    publicId: string;
    alt: string;
    title: string;
  };

  enabled: boolean;

  sortOrder: number;
};

type HomepageResponse = {
  success: boolean;

  homepage: any;

  categories: {
    enabled: boolean;
    title: string;
    subtitle: string;
    items: CategoryResponseItem[];
  };
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Safely convert unknown value into trimmed string.
 */
function cleanString(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

/**
 * Safely convert sort order.
 */
function cleanSortOrder(
  value: unknown
): number {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(
      numberValue
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(numberValue)
  );
}

/**
 * Normalize category object.
 */
function normalizeCategory(
  category: any
): CategoryResponseItem {
  return {
    _id: String(
      category?._id ?? ""
    ),

    name: cleanString(
      category?.name
    ),

    slug: cleanString(
      category?.slug
    ).toLowerCase(),

    image: {
      url: cleanString(
        category?.image?.url
      ),

      publicId:
        cleanString(
          category?.image?.publicId
        ),

      alt:
        cleanString(
          category?.image?.alt
        ) ||
        cleanString(
          category?.name
        ),

      title:
        cleanString(
          category?.image?.title
        ) ||
        cleanString(
          category?.name
        ),
    },

    enabled:
      category?.enabled !== false,

    sortOrder:
      cleanSortOrder(
        category?.sortOrder
      ),
  };
}

/*
|--------------------------------------------------------------------------
| GET /api/homepage
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
    | 2. FETCH PUBLISHED HOMEPAGE + ACTIVE CATEGORIES
    |--------------------------------------------------------------------------
    |
    | Both requests start together.
    |
    |--------------------------------------------------------------------------
    */

    const [
      homepage,
      categoryDocuments,
    ] = await Promise.all([
      HomePage.findOne({
        isPublished: true,
      })
        .sort({
          createdAt: 1,
        })
        .lean(),

      Category.find({
        enabled: true,
      })
        .sort({
          sortOrder: 1,
          name: 1,
        })
        .lean(),
    ]);

    /*
    |--------------------------------------------------------------------------
    | 3. HOMEPAGE NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!homepage) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Homepage not found.",

          homepage: null,

          categories: {
            enabled: true,

            title:
              "Shop by Category",

            subtitle:
              "Explore our latest fashion categories",

            items: [],
          },
        },
        {
          status: 404,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 4. NORMALIZE CATEGORIES
    |--------------------------------------------------------------------------
    */

    const categories =
      Array.isArray(
        categoryDocuments
      )
        ? categoryDocuments
            .map(
              normalizeCategory
            )
            .filter(
              (category) =>
                Boolean(
                  category._id
                ) &&
                Boolean(
                  category.name
                )
            )
        : [];

    /*
    |--------------------------------------------------------------------------
    | 5. HOMEPAGE CATEGORY SETTINGS
    |--------------------------------------------------------------------------
    |
    | Category content itself comes from the Category collection.
    |
    | Homepage.categories is used only for section-level settings.
    |
    |--------------------------------------------------------------------------
    */

    const homepageCategories =
      (homepage as any)
        ?.categories;

    const categorySection = {
      enabled:
        homepageCategories
          ?.enabled !== false,

      title:
        cleanString(
          homepageCategories
            ?.title
        ) ||
        "Shop by Category",

      subtitle:
        cleanString(
          homepageCategories
            ?.subtitle
        ) ||
        "Explore our latest fashion categories",

      items: categories,
    };

    /*
    |--------------------------------------------------------------------------
    | 6. BUILD RESPONSE
    |--------------------------------------------------------------------------
    */

    const responseData: HomepageResponse =
      {
        success: true,

        homepage,

        categories:
          categorySection,
      };

    /*
    |--------------------------------------------------------------------------
    | 7. RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      responseData,
      {
        status: 200,

        headers: {
          /*
          | Public data should always be fresh.
          | This is especially important because
          | Admin category changes should appear
          | on the storefront without stale API data.
          */

          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          Pragma:
            "no-cache",

          Expires:
            "0",
        },
      }
    );
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | 8. ERROR LOG
    |--------------------------------------------------------------------------
    */

    console.error(
      "PUBLIC_HOMEPAGE_GET_ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | 9. ERROR RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load homepage.",

        homepage: null,

        categories: {
          enabled: true,

          title:
            "Shop by Category",

          subtitle:
            "Explore our latest fashion categories",

          items: [],
        },
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          Pragma:
            "no-cache",

          Expires:
            "0",
        },
      }
    );
  }
}