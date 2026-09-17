import { NextRequest, NextResponse } from "next/server";

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import connectDB from "@/lib/connectDB";
import Category from "@/models/Category";
import { verifyAdminToken } from "@/lib/adminAuth";

/*
|--------------------------------------------------------------------------
| CLOUDINARY
|--------------------------------------------------------------------------
*/

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type RequestData = Record<string, unknown>;

type AdminAuthResult =
  | {
      success: true;
      admin: {
        adminId: string;
        role: string;
      };
    }
  | {
      success: false;
      response: NextResponse;
    };

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

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

function cleanSortOrder(value: unknown): number {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.floor(numberValue));
}

function validateCategoryId(id: string): boolean {
  return Boolean(
    id &&
      mongoose.Types.ObjectId.isValid(id)
  );
}

function hasCloudinaryConfig(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/*
|--------------------------------------------------------------------------
| ADMIN AUTH
|--------------------------------------------------------------------------
*/

async function authenticateAdmin(
  request: NextRequest
): Promise<AdminAuthResult> {
  const token =
    request.cookies.get("adminToken")?.value;

  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
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
      await verifyAdminToken(token);

    if (
      !admin?.adminId ||
      !admin?.role
    ) {
      return {
        success: false,
        response: NextResponse.json(
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
      admin: {
        adminId: String(
          admin.adminId
        ),
        role: String(
          admin.role
        ),
      },
    };
  } catch (error) {
    console.error(
      "CATEGORY ADMIN AUTH ERROR:",
      error
    );

    return {
      success: false,
      response: NextResponse.json(
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
| DELETE CLOUDINARY IMAGE
|--------------------------------------------------------------------------
*/

async function deleteCloudinaryImage(
  publicId: string
): Promise<void> {
  if (!publicId) {
    return;
  }

  if (!hasCloudinaryConfig()) {
    console.warn(
      "Cloudinary configuration missing. Image not deleted:",
      publicId
    );

    return;
  }

  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
        invalidate: true,
      }
    );
  } catch (error) {
    console.error(
      "CLOUDINARY IMAGE DELETE ERROR:",
      error
    );
  }
}

/*
|--------------------------------------------------------------------------
| NORMALIZE CATEGORY
|--------------------------------------------------------------------------
*/

function normalizeCategory(
  category: any
) {
  return {
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

      alt:
        cleanString(
          category.image?.alt
        ),

      title:
        cleanString(
          category.image
            ?.title
        ),
    },

    enabled:
      category.enabled !== false,

    sortOrder:
      cleanSortOrder(
        category.sortOrder
      ),

    createdAt:
      category.createdAt,

    updatedAt:
      category.updatedAt,
  };
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
| GET /api/admin/categories/[id]
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | AUTH
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
    | PARAMS
    |--------------------------------------------------------------------------
    */

    const params =
      await context.params;

    const id =
      cleanString(params.id);

    /*
    |--------------------------------------------------------------------------
    | VALIDATE ID
    |--------------------------------------------------------------------------
    */

    if (
      !validateCategoryId(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid category ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | FIND CATEGORY
    |--------------------------------------------------------------------------
    */

    const category =
      await Category.findById(
        id
      ).lean();

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,
        category:
          normalizeCategory(
            category
          ),
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
        message:
          "Unable to load category.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT
|--------------------------------------------------------------------------
| PUT /api/admin/categories/[id]
|--------------------------------------------------------------------------
*/

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | AUTH
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
    | PARAMS
    |--------------------------------------------------------------------------
    */

    const params =
      await context.params;

    const id =
      cleanString(params.id);

    /*
    |--------------------------------------------------------------------------
    | VALIDATE ID
    |--------------------------------------------------------------------------
    */

    if (
      !validateCategoryId(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid category ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | EXISTING CATEGORY
    |--------------------------------------------------------------------------
    */

    const existingCategory =
      await Category.findById(id);

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | READ JSON
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

    if (
      !body ||
      typeof body !== "object" ||
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
      body as RequestData;

    /*
    |--------------------------------------------------------------------------
    | NAME
    |--------------------------------------------------------------------------
    */

    let newName =
      existingCategory.name;

    if (
      Object.prototype.hasOwnProperty.call(
        data,
        "name"
      )
    ) {
      newName =
        cleanString(
          data.name
        );

      if (!newName) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Category name cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        newName.length > 100
      ) {
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
    }

    /*
    |--------------------------------------------------------------------------
    | SLUG
    |--------------------------------------------------------------------------
    */

    let newSlug =
      existingCategory.slug;

    if (
      Object.prototype.hasOwnProperty.call(
        data,
        "slug"
      )
    ) {
      const requestedSlug =
        cleanString(
          data.slug
        );

      newSlug =
        createSlug(
          requestedSlug ||
            newName
        );
    } else if (
      newName !==
      existingCategory.name
    ) {
      newSlug =
        createSlug(
          newName
        );
    }

    if (!newSlug) {
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
    | DUPLICATE CATEGORY
    |--------------------------------------------------------------------------
    */

    const escapedName =
      newName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const duplicate =
      await Category.findOne({
        _id: {
          $ne: id,
        },

        $or: [
          {
            name: {
              $regex:
                `^${escapedName}$`,
              $options: "i",
            },
          },

          {
            slug: newSlug,
          },
        ],
      })
        .select(
          "_id name slug"
        )
        .lean();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another category with this name or slug already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | IMAGE
    |--------------------------------------------------------------------------
    */

    const oldPublicId =
      cleanString(
        existingCategory.image
          ?.publicId
      );

    let newImage = {
      url: cleanString(
        existingCategory.image
          ?.url
      ),

      publicId:
        cleanString(
          existingCategory.image
            ?.publicId
        ),

      alt:
        cleanString(
          existingCategory.image
            ?.alt
        ),

      title:
        cleanString(
          existingCategory.image
            ?.title
        ),
    };

    let imageChanged =
      false;

    /*
    |--------------------------------------------------------------------------
    | NEW IMAGE PROVIDED
    |--------------------------------------------------------------------------
    */

    if (
      data.image !== undefined &&
      data.image !== null
    ) {
      if (
        typeof data.image !==
          "object" ||
        Array.isArray(
          data.image
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid category image data.",
          },
          {
            status: 400,
          }
        );
      }

      const imageData =
        data.image as Record<
          string,
          unknown
        >;

      const incomingPublicId =
        cleanString(
          imageData.publicId
        );

      const incomingUrl =
        cleanString(
          imageData.url
        );

      /*
      |--------------------------------------------------------------------------
      | IF IMAGE IS REMOVED
      |--------------------------------------------------------------------------
      */

      if (
        !incomingUrl &&
        !incomingPublicId
      ) {
        newImage = {
          url: "",
          publicId: "",
          alt: "",
          title: "",
        };

        imageChanged =
          Boolean(
            oldPublicId ||
              existingCategory.image
                ?.url
          );
      } else {
        newImage = {
          url: incomingUrl,

          publicId:
            incomingPublicId,

          alt:
            cleanString(
              imageData.alt
            ) || newName,

          title:
            cleanString(
              imageData.title
            ) || newName,
        };

        imageChanged =
          newImage.publicId !==
            oldPublicId ||
          newImage.url !==
            cleanString(
              existingCategory
                .image?.url
            );
      }
    } else if (
      newName !==
      existingCategory.name
    ) {
      /*
      |--------------------------------------------------------------------------
      | UPDATE ALT/TITLE WHEN NAME CHANGES
      |--------------------------------------------------------------------------
      */

      if (!newImage.alt) {
        newImage.alt =
          newName;
      }

      if (!newImage.title) {
        newImage.title =
          newName;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | ENABLED
    |--------------------------------------------------------------------------
    */

    let newEnabled =
      existingCategory.enabled;

    if (
      typeof data.enabled ===
      "boolean"
    ) {
      newEnabled =
        data.enabled;
    }

    /*
    |--------------------------------------------------------------------------
    | SORT ORDER
    |--------------------------------------------------------------------------
    */

    let newSortOrder =
      cleanSortOrder(
        existingCategory.sortOrder
      );

    if (
      Object.prototype.hasOwnProperty.call(
        data,
        "sortOrder"
      )
    ) {
      newSortOrder =
        cleanSortOrder(
          data.sortOrder
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE DOCUMENT
    |--------------------------------------------------------------------------
    */

    existingCategory.name =
      newName;

    existingCategory.slug =
      newSlug;

    existingCategory.image =
      newImage;

    existingCategory.enabled =
      newEnabled;

    existingCategory.sortOrder =
      newSortOrder;

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    await existingCategory.save();

    /*
    |--------------------------------------------------------------------------
    | DELETE OLD IMAGE
    |--------------------------------------------------------------------------
    */

    if (
      imageChanged &&
      oldPublicId &&
      oldPublicId !==
        newImage.publicId
    ) {
      await deleteCloudinaryImage(
        oldPublicId
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Category updated successfully.",

        category:
          normalizeCategory(
            existingCategory
          ),
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    /*
    |--------------------------------------------------------------------------
    | DUPLICATE KEY
    |--------------------------------------------------------------------------
    */

    const mongoError =
      error as {
        code?: number;
      };

    if (
      mongoError.code ===
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
    | ERROR
    |--------------------------------------------------------------------------
    */

    console.error(
      "ADMIN CATEGORY UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update category.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
| DELETE /api/admin/categories/[id]
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | AUTH
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
    | PARAMS
    |--------------------------------------------------------------------------
    */

    const params =
      await context.params;

    const id =
      cleanString(params.id);

    /*
    |--------------------------------------------------------------------------
    | VALIDATE ID
    |--------------------------------------------------------------------------
    */

    if (
      !validateCategoryId(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid category ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | FIND CATEGORY
    |--------------------------------------------------------------------------
    */

    const category =
      await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE DATA BEFORE DELETE
    |--------------------------------------------------------------------------
    */

    const publicId =
      cleanString(
        category.image
          ?.publicId
      );

    const deletedCategory = {
      _id: String(
        category._id
      ),

      name: category.name,

      slug: category.slug,
    };

    /*
    |--------------------------------------------------------------------------
    | DELETE DATABASE RECORD
    |--------------------------------------------------------------------------
    */

    await Category.deleteOne({
      _id: id,
    });

    /*
    |--------------------------------------------------------------------------
    | DELETE CLOUDINARY IMAGE
    |--------------------------------------------------------------------------
    */

    if (publicId) {
      await deleteCloudinaryImage(
        publicId
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Category deleted successfully.",

        deletedCategory,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN CATEGORY DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete category.",
      },
      {
        status: 500,
      }
    );
  }
}