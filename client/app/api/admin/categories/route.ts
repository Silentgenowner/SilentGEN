import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Category from "@/models/Category";
import { verifyAdminToken } from "@/lib/adminAuth";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Convert category name into a safe URL slug.
 */
function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Safely convert any value to string.
 */
function cleanString(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ");
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

/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

async function authenticateAdmin(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (!token) {
    return {
      success: false,
      response:
        NextResponse.json(
          {
            success: false,
            message:
              "Unauthorized. Admin login session not found.",
          },
          {
            status: 401,
          }
        ),
    };
  }

  try {
    const admin =
      await verifyAdminToken(
        token
      );

    if (
      !admin?.adminId ||
      !admin?.role
    ) {
      return {
        success: false,
        response:
          NextResponse.json(
            {
              success: false,
              message:
                "Unauthorized. Invalid admin credentials.",
            },
            {
              status: 401,
            }
          ),
      };
    }

    return {
      success: true,
      admin,
    };
  } catch (error) {
    console.error(
      "ADMIN CATEGORY AUTH ERROR:",
      error
    );

    return {
      success: false,
      response:
        NextResponse.json(
          {
            success: false,
            message:
              "Unauthorized. Admin session is invalid or expired.",
          },
          {
            status: 401,
          }
        ),
    };
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/admin/categories
|--------------------------------------------------------------------------
| Returns ALL categories for admin panel.
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. AUTHENTICATION
    |--------------------------------------------------------------------------
    */

    const auth =
      await authenticateAdmin(
        request
      );

    if (!auth.success) {
      return auth.response;
    }

    /*
    |--------------------------------------------------------------------------
    | 2. DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | 3. FETCH CATEGORIES
    |--------------------------------------------------------------------------
    */

    const categories =
      await Category.find({})
        .sort({
          sortOrder: 1,
          name: 1,
        })
        .lean();

    /*
    |--------------------------------------------------------------------------
    | 4. NORMALIZE
    |--------------------------------------------------------------------------
    */

    const normalizedCategories =
      categories.map(
        (category) => ({
          _id: String(
            category._id
          ),

          name: cleanString(
            category.name
          ),

          slug: cleanString(
            category.slug
          ).toLowerCase(),

          image: {
            url: cleanString(
              category.image?.url
            ),

            publicId:
              cleanString(
                category.image
                  ?.publicId
              ),

            alt: cleanString(
              category.image?.alt
            ),

            title: cleanString(
              category.image?.title
            ),
          },

          enabled:
            category.enabled !==
            false,

          sortOrder:
            cleanSortOrder(
              category.sortOrder
            ),

          createdAt:
            category.createdAt,

          updatedAt:
            category.updatedAt,
        })
      );

    /*
    |--------------------------------------------------------------------------
    | 5. SUCCESS
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
    console.error(
      "ADMIN CATEGORY GET ERROR:",
      error
    );

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
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/admin/categories
|--------------------------------------------------------------------------
| Create new category.
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. AUTHENTICATION
    |--------------------------------------------------------------------------
    */

    const auth =
      await authenticateAdmin(
        request
      );

    if (!auth.success) {
      return auth.response;
    }

    /*
    |--------------------------------------------------------------------------
    | 2. DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | 3. READ REQUEST BODY
    |--------------------------------------------------------------------------
    */

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 4. VALIDATE OBJECT
    |--------------------------------------------------------------------------
    */

    if (
      !body ||
      typeof body !==
        "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid category data.",
        },
        {
          status: 400,
        }
      );
    }

    const data =
      body as Record<
        string,
        unknown
      >;

    /*
    |--------------------------------------------------------------------------
    | 5. CATEGORY NAME
    |--------------------------------------------------------------------------
    */

    const name =
      cleanString(
        data.name
      );

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category name cannot exceed 100 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 6. SLUG
    |--------------------------------------------------------------------------
    */

    const requestedSlug =
      cleanString(
        data.slug
      );

    const slug =
      createSlug(
        requestedSlug ||
          name
      );

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create a valid category slug.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 7. DUPLICATE CHECK
    |--------------------------------------------------------------------------
    */

    const existingCategory =
      await Category.findOne({
        $or: [
          {
            name: {
              $regex: `^${name.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              )}$`,
              $options: "i",
            },
          },

          {
            slug: slug,
          },
        ],
      })
        .select("_id name slug")
        .lean();

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A category with this name or slug already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 8. IMAGE
    |--------------------------------------------------------------------------
    */

    const imageData =
      data.image &&
      typeof data.image ===
        "object" &&
      !Array.isArray(
        data.image
      )
        ? (data.image as Record<
            string,
            unknown
          >)
        : {};

    const image = {
      url: cleanString(
        imageData.url
      ),

      publicId:
        cleanString(
          imageData.publicId
        ),

      alt:
        cleanString(
          imageData.alt
        ) || name,

      title:
        cleanString(
          imageData.title
        ) || name,
    };

    /*
    |--------------------------------------------------------------------------
    | 9. ENABLED
    |--------------------------------------------------------------------------
    */

    const enabled =
      typeof data.enabled ===
      "boolean"
        ? data.enabled
        : true;

    /*
    |--------------------------------------------------------------------------
    | 10. SORT ORDER
    |--------------------------------------------------------------------------
    */

    let sortOrder =
      cleanSortOrder(
        data.sortOrder
      );

    /*
    |--------------------------------------------------------------------------
    | AUTO SORT ORDER
    |--------------------------------------------------------------------------
    */

    if (
      data.sortOrder ===
        undefined ||
      data.sortOrder ===
        null ||
      data.sortOrder ===
        ""
    ) {
      const lastCategory =
        await Category.findOne({})
          .sort({
            sortOrder: -1,
          })
          .select(
            "sortOrder"
          )
          .lean();

      sortOrder =
        cleanSortOrder(
          lastCategory
            ?.sortOrder
        ) + 1;
    }

    /*
    |--------------------------------------------------------------------------
    | 11. CREATE CATEGORY
    |--------------------------------------------------------------------------
    */

    const category =
      await Category.create({
        name,
        slug,
        image,
        enabled,
        sortOrder,
      });

    /*
    |--------------------------------------------------------------------------
    | 12. RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Category created successfully.",

        category: {
          _id: String(
            category._id
          ),

          name:
            category.name,

          slug:
            category.slug,

          image:
            category.image,

          enabled:
            category.enabled,

          sortOrder:
            category.sortOrder,

          createdAt:
            category.createdAt,

          updatedAt:
            category.updatedAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    /*
    |--------------------------------------------------------------------------
    | DUPLICATE KEY ERROR
    |--------------------------------------------------------------------------
    */

    const mongoError =
      error as {
        code?: number;
      };

    if (
      mongoError?.code ===
      11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A category with this slug already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LOG
    |--------------------------------------------------------------------------
    */

    console.error(
      "ADMIN CATEGORY CREATE ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create category.",
      },
      {
        status: 500,
      }
    );
  }
}