import {
  NextRequest,
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import Admin from "@/models/Admin";

import CmsPage from "@/models/CmsPage";

import {
  ensureDefaultCmsPages,
} from "@/lib/cms/ensureDefaultCmsPages";

import {
  sanitizeCmsHtml,
} from "@/lib/cms/sanitizeCmsHtml";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

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

  if (!token) {
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

  /*
  |--------------------------------------------------------------------------
  | CONTENT MANAGEMENT
  |--------------------------------------------------------------------------
  |
  | super_admin only.
  |
  |--------------------------------------------------------------------------
  */

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
| ERROR RESPONSE
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
  value: unknown,
  fallback = 0
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
    return fallback;
  }

  return Math.max(
    0,
    number
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE CONTENT
|--------------------------------------------------------------------------
|
| Only content pages need HTML.
|
| Rich Text Editor HTML is always sanitized on server before database save.
|
|--------------------------------------------------------------------------
*/

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
|
| GET /api/admin/content
|
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
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
    | DEFAULT CMS PAGES
    |--------------------------------------------------------------------------
    */

    await ensureDefaultCmsPages();

    /*
    |--------------------------------------------------------------------------
    | QUERY
    |--------------------------------------------------------------------------
    */

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const section =
      normalizeString(
        searchParams.get(
          "section"
        )
      );

    const status =
      normalizeString(
        searchParams.get(
          "status"
        )
      );

    const search =
      normalizeString(
        searchParams.get(
          "search"
        )
      );

    /*
    |--------------------------------------------------------------------------
    | FILTER
    |--------------------------------------------------------------------------
    */

    const filter:
      Record<
        string,
        unknown
      > = {};

    if (
      section ===
        "help" ||
      section ===
        "policy"
    ) {
      filter.section =
        section;
    }

    if (
      status ===
        "Draft" ||
      status ===
        "Published"
    ) {
      filter.status =
        status;
    }

    if (
      search
    ) {
      filter.$or = [
        {
          title: {
            $regex:
              search,

            $options:
              "i",
          },
        },

        {
          slug: {
            $regex:
              search,

            $options:
              "i",
          },
        },

        {
          shortDescription: {
            $regex:
              search,

            $options:
              "i",
          },
        },
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD
    |--------------------------------------------------------------------------
    */

    const pages =
      await CmsPage.find(
        filter as never
      )
        .sort({
          section:
            1,

          sortOrder:
            1,

          title:
            1,
        })
        .lean();

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success:
        true,

      pages,
    });
  } catch (
    error
  ) {
    console.error(
      "ADMIN CONTENT LIST ERROR:",
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
          "Unable to load content pages.",
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
| POST
|--------------------------------------------------------------------------
|
| Create custom Help / Policy page.
|
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
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
    | BODY
    |--------------------------------------------------------------------------
    */

    const body =
      await request.json();

    /*
    |--------------------------------------------------------------------------
    | BASIC VALUES
    |--------------------------------------------------------------------------
    */

    const title =
      normalizeString(
        body?.title
      );

    const section =
      normalizeSection(
        body?.section
      );

    const pageType =
      normalizePageType(
        body?.pageType
      );

    const status =
      normalizeStatus(
        body?.status
      );

    const slug =
      createSlug(
        normalizeString(
          body?.slug
        ) ||
          title
      );

    /*
    |--------------------------------------------------------------------------
    | VALIDATE TITLE
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | VALIDATE SLUG
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
    | VALIDATE SECTION
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
    | VALIDATE PAGE TYPE
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

    const existing =
      await CmsPage.findOne({
        slug,
      })
        .select(
          "_id"
        )
        .lean();

    if (
      existing
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "This page slug already exists.",
        },
        {
          status:
            409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SORT ORDER
    |--------------------------------------------------------------------------
    */

    const lastPage =
      await CmsPage.findOne({
        section,
      })
        .sort({
          sortOrder:
            -1,
        })
        .select(
          "sortOrder"
        )
        .lean();

    const fallbackSortOrder =
      Number(
        lastPage
          ?.sortOrder ||
          0
      ) + 1;

    const sortOrder =
      normalizeSortOrder(
        body?.sortOrder,
        fallbackSortOrder
      );

    /*
    |--------------------------------------------------------------------------
    | SANITIZED CONTENT
    |--------------------------------------------------------------------------
    */

    const content =
      normalizeContent(
        body?.content,
        pageType
      );

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    const page =
      await CmsPage.create({
        /*
        |--------------------------------------------------------------------------
        | BASIC
        |--------------------------------------------------------------------------
        */

        title,

        slug,

        section,

        pageType,

        /*
        |--------------------------------------------------------------------------
        | CONTENT
        |--------------------------------------------------------------------------
        */

        shortDescription:
          normalizeString(
            body
              ?.shortDescription
          ),

        content,

        /*
        |--------------------------------------------------------------------------
        | STATUS / ORDER
        |--------------------------------------------------------------------------
        */

        status,

        sortOrder,

        /*
        |--------------------------------------------------------------------------
        | SEO
        |--------------------------------------------------------------------------
        */

        seoTitle:
          normalizeString(
            body
              ?.seoTitle
          ),

        seoDescription:
          normalizeString(
            body
              ?.seoDescription
          ),

        /*
        |--------------------------------------------------------------------------
        | EXTERNAL
        |--------------------------------------------------------------------------
        */

        externalUrl:
          pageType ===
          "external"
            ? normalizeString(
                body
                  ?.externalUrl
              )
            : "",

        /*
        |--------------------------------------------------------------------------
        | WHATSAPP
        |--------------------------------------------------------------------------
        */

        whatsappNumber:
          pageType ===
          "whatsapp"
            ? normalizeString(
                body
                  ?.whatsappNumber
              )
            : "",

        whatsappMessage:
          pageType ===
          "whatsapp"
            ? normalizeString(
                body
                  ?.whatsappMessage
              )
            : "",

        /*
        |--------------------------------------------------------------------------
        | ICON
        |--------------------------------------------------------------------------
        */

        icon:
          normalizeString(
            body?.icon
          ),

        /*
        |--------------------------------------------------------------------------
        | USER-CREATED PAGE
        |--------------------------------------------------------------------------
        */

        isSystem:
          false,
      });

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Content page created successfully.",

        page,
      },
      {
        status:
          201,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "ADMIN CONTENT CREATE ERROR:",
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
          "Unable to create content page.",
      },
      {
        status:
          500,
      }
    );
  }
}