import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import Admin from "@/models/Admin";

import CmsPage from "@/models/CmsPage";

import {
  sanitizeCmsHtml,
} from "@/lib/cms/sanitizeCmsHtml";

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

type CmsSection =
  | "help"
  | "policy";

type CmsPageType =
  | "content"
  | "external"
  | "whatsapp";

type CmsPageStatus =
  | "Draft"
  | "Published";

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

async function authenticate(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (
    !token
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  const payload =
    await verifyAdminToken(
      token
    );

  if (
    !payload?.adminId
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  const admin =
    await Admin.findById(
      payload.adminId
    )
      .select(
        "role isActive"
      )
      .lean();

  if (
    !admin ||
    admin.isActive ===
      false
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  if (
    admin.role !==
    "super_admin"
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return admin;
}

/*
|--------------------------------------------------------------------------
| AUTH ERROR RESPONSE
|--------------------------------------------------------------------------
*/

function authErrorResponse(
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "";

  if (
    message ===
    "UNAUTHORIZED"
  ) {
    return NextResponse.json(
      {
        success:
          false,

        message:
          "Admin login required.",
      },
      {
        status:
          401,
      }
    );
  }

  if (
    message ===
    "FORBIDDEN"
  ) {
    return NextResponse.json(
      {
        success:
          false,

        message:
          "Access denied.",
      },
      {
        status:
          403,
      }
    );
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizeString(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function createSlug(
  value: string
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function normalizeSection(
  value: unknown
): CmsSection | null {
  if (
    value ===
      "help" ||
    value ===
      "policy"
  ) {
    return value;
  }

  return null;
}

function normalizePageType(
  value: unknown
): CmsPageType | null {
  if (
    value ===
      "content" ||
    value ===
      "external" ||
    value ===
      "whatsapp"
  ) {
    return value;
  }

  return null;
}

function normalizeStatus(
  value: unknown
): CmsPageStatus {
  return value ===
    "Published"
    ? "Published"
    : "Draft";
}

function normalizeSortOrder(
  value: unknown
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    number
  );
}

function normalizeContent(
  value: unknown,
  pageType:
    CmsPageType
) {
  if (
    pageType !==
    "content"
  ) {
    return "";
  }

  return sanitizeCmsHtml(
    typeof value ===
      "string"
      ? value
      : ""
  );
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | DB
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    await authenticate(
      request
    );

    /*
    |--------------------------------------------------------------------------
    | ID
    |--------------------------------------------------------------------------
    */

    const {
      id,
    } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid content page id.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PAGE
    |--------------------------------------------------------------------------
    */

    const page =
      await CmsPage.findById(
        id
      ).lean();

    if (
      !page
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Content page not found.",
        },
        {
          status:
            404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success:
        true,

      page,
    });
  } catch (
    error
  ) {
    console.error(
      "ADMIN CONTENT GET ERROR:",
      error
    );

    const authResponse =
      authErrorResponse(
        error
      );

    if (
      authResponse
    ) {
      return authResponse;
    }

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to load content page.",
      },
      {
        status:
          500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT
|--------------------------------------------------------------------------
*/

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | DB
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    await authenticate(
      request
    );

    /*
    |--------------------------------------------------------------------------
    | ID
    |--------------------------------------------------------------------------
    */

    const {
      id,
    } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid content page id.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PAGE
    |--------------------------------------------------------------------------
    */

    const page =
      await CmsPage.findById(
        id
      );

    if (
      !page
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Content page not found.",
        },
        {
          status:
            404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | BODY
    |--------------------------------------------------------------------------
    */

    const body =
      await request.json();

    /*
    |--------------------------------------------------------------------------
    | TITLE
    |--------------------------------------------------------------------------
    */

    const title =
      normalizeString(
        body?.title
      );

    if (
      !title
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Page title is required.",
        },
        {
          status:
            400,
        }
      );
    }

    page.title =
      title;

    /*
    |--------------------------------------------------------------------------
    | SYSTEM PAGE
    |--------------------------------------------------------------------------
    |
    | SilentGEN default/system pages:
    |
    | slug
    | section
    | pageType
    |
    | locked રાખીએ.
    |
    |--------------------------------------------------------------------------
    */

    if (
      page.isSystem !==
      true
    ) {
      const slug =
        createSlug(
          normalizeString(
            body?.slug
          )
        );

      const section =
        normalizeSection(
          body?.section
        );

      const pageType =
        normalizePageType(
          body?.pageType
        );

      /*
      |--------------------------------------------------------------------------
      | SLUG
      |--------------------------------------------------------------------------
      */

      if (
        !slug
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Page slug is required.",
          },
          {
            status:
              400,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SECTION
      |--------------------------------------------------------------------------
      */

      if (
        !section
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Valid section is required.",
          },
          {
            status:
              400,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | PAGE TYPE
      |--------------------------------------------------------------------------
      */

      if (
        !pageType
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Valid page type is required.",
          },
          {
            status:
              400,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | UNIQUE SLUG
      |--------------------------------------------------------------------------
      */

      const duplicate =
        await CmsPage.findOne({
          _id: {
            $ne:
              page._id,
          },

          slug,
        })
          .select(
            "_id"
          )
          .lean();

      if (
        duplicate
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Another page already uses this slug.",
          },
          {
            status:
              409,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | APPLY
      |--------------------------------------------------------------------------
      */

      page.slug =
        slug;

      page.section =
        section;

      page.pageType =
        pageType;
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT PAGE TYPE
    |--------------------------------------------------------------------------
    |
    | System pageમાં pageType protected હોવાથી database value use થશે.
    |
    |--------------------------------------------------------------------------
    */

    const currentPageType =
      page.pageType as
        CmsPageType;

    /*
    |--------------------------------------------------------------------------
    | SHORT DESCRIPTION
    |--------------------------------------------------------------------------
    */

    page.shortDescription =
      normalizeString(
        body
          ?.shortDescription
      );

    /*
    |--------------------------------------------------------------------------
    | SANITIZED CONTENT
    |--------------------------------------------------------------------------
    */

    page.content =
      normalizeContent(
        body?.content,
        currentPageType
      );

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    page.status =
      normalizeStatus(
        body?.status
      );

    /*
    |--------------------------------------------------------------------------
    | SORT ORDER
    |--------------------------------------------------------------------------
    */

    page.sortOrder =
      normalizeSortOrder(
        body?.sortOrder
      );

    /*
    |--------------------------------------------------------------------------
    | SEO
    |--------------------------------------------------------------------------
    */

    page.seoTitle =
      normalizeString(
        body?.seoTitle
      );

    page.seoDescription =
      normalizeString(
        body
          ?.seoDescription
      );

    /*
    |--------------------------------------------------------------------------
    | EXTERNAL PAGE
    |--------------------------------------------------------------------------
    */

    page.externalUrl =
      currentPageType ===
      "external"
        ? normalizeString(
            body?.externalUrl
          )
        : "";

    /*
    |--------------------------------------------------------------------------
    | WHATSAPP PAGE
    |--------------------------------------------------------------------------
    */

    page.whatsappNumber =
      currentPageType ===
      "whatsapp"
        ? normalizeString(
            body
              ?.whatsappNumber
          )
        : "";

    page.whatsappMessage =
      currentPageType ===
      "whatsapp"
        ? normalizeString(
            body
              ?.whatsappMessage
          )
        : "";

    /*
    |--------------------------------------------------------------------------
    | ICON
    |--------------------------------------------------------------------------
    */

    page.icon =
      normalizeString(
        body?.icon
      );

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    await page.save();

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success:
        true,

      message:
        "Content page saved successfully.",

      page,
    });
  } catch (
    error
  ) {
    console.error(
      "ADMIN CONTENT UPDATE ERROR:",
      error
    );

    const authResponse =
      authErrorResponse(
        error
      );

    if (
      authResponse
    ) {
      return authResponse;
    }

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to save content page.",
      },
      {
        status:
          500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | DB
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    await authenticate(
      request
    );

    /*
    |--------------------------------------------------------------------------
    | ID
    |--------------------------------------------------------------------------
    */

    const {
      id,
    } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid content page id.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PAGE
    |--------------------------------------------------------------------------
    */

    const page =
      await CmsPage.findById(
        id
      );

    if (
      !page
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Content page not found.",
        },
        {
          status:
            404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PROTECT SYSTEM PAGES
    |--------------------------------------------------------------------------
    */

    if (
      page.isSystem ===
      true
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "System pages cannot be deleted.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    await page.deleteOne();

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success:
        true,

      message:
        "Content page deleted successfully.",
    });
  } catch (
    error
  ) {
    console.error(
      "ADMIN CONTENT DELETE ERROR:",
      error
    );

    const authResponse =
      authErrorResponse(
        error
      );

    if (
      authResponse
    ) {
      return authResponse;
    }

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to delete content page.",
      },
      {
        status:
          500,
      }
    );
  }
}