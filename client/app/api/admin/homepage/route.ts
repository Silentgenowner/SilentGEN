import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";
import HomePage from "@/models/HomePage";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type AdminAuth = {
  adminId?: string;
  email?: string;
  role?: string;
};

/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

async function authenticateAdmin(
  request: NextRequest
): Promise<AdminAuth> {
  const token =
    request.cookies.get("adminToken")?.value;

  if (!token) {
    throw new Error("Unauthorized.");
  }

  const admin = await verifyAdminToken(token);

  if (!admin?.adminId || !admin?.role) {
    throw new Error("Invalid admin token.");
  }

  return admin;
}

/*
|--------------------------------------------------------------------------
| GET HOMEPAGE
|--------------------------------------------------------------------------
*/

export async function GET(request: NextRequest) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Admin Authentication
    |--------------------------------------------------------------------------
    */

    const admin =
      await authenticateAdmin(request);

    /*
    |--------------------------------------------------------------------------
    | Database
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Find Homepage
    |--------------------------------------------------------------------------
    */

    let homepage =
      await HomePage.findOne()
        .sort({ createdAt: 1 })
        .lean();

    /*
    |--------------------------------------------------------------------------
    | Create Default Homepage
    |--------------------------------------------------------------------------
    */

    if (!homepage) {
      const createdHomepage =
        await HomePage.create({
          isPublished: true,

          sectionOrder: [
            "hero",
            "featured",
            "categories",
            "gender",
            "offers",
            "new-arrivals",
            "best-sellers",
            "men-collection",
            "women-collection",
            "kids-collection",
            "seasonal",
            "why-shop",
            "newsletter",
          ],

          lastUpdatedBy: admin.adminId,
        });

      homepage =
        createdHomepage.toObject();
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        homepage,

        sections:
          buildAdminSections(homepage),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_HOMEPAGE_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load homepage.",

        error:
          process.env.NODE_ENV !==
          "production"
            ? serializeError(error)
            : undefined,
      },
      {
        status:
          error instanceof Error &&
          error.message ===
            "Unauthorized."
            ? 401
            : 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT HOMEPAGE
|--------------------------------------------------------------------------
*/

export async function PUT(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Admin Authentication
    |--------------------------------------------------------------------------
    */

    const admin =
      await authenticateAdmin(request);

    /*
    |--------------------------------------------------------------------------
    | Database
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Read Request Body
    |--------------------------------------------------------------------------
    */

    const body =
      await request.json();

    if (
      !body ||
      typeof body !== "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Find Homepage
    |--------------------------------------------------------------------------
    */

    let homepage =
      await HomePage.findOne();

    /*
    |--------------------------------------------------------------------------
    | Create Homepage If Missing
    |--------------------------------------------------------------------------
    */

    if (!homepage) {
      homepage =
        new HomePage({
          isPublished: true,

          sectionOrder: [
            "hero",
            "featured",
            "categories",
            "gender",
            "offers",
            "new-arrivals",
            "best-sellers",
            "men-collection",
            "women-collection",
            "kids-collection",
            "seasonal",
            "why-shop",
            "newsletter",
          ],

          lastUpdatedBy:
            admin.adminId,
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Allowed Full Homepage Fields
    |--------------------------------------------------------------------------
    */

    const allowedFields = [
      "logo",
      "favicon",
      "hero",
      "categories",
      "gender",
      "offers",
      "productSections",
      "collections",
      "seasonal",
      "whyShop",
      "newsletter",
      "settings",
      "sectionOrder",
      "isPublished",
    ];

    /*
    |--------------------------------------------------------------------------
    | Full Homepage Update
    |--------------------------------------------------------------------------
    */

    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          field
        )
      ) {
        (homepage as any)[field] =
          body[field];
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Legacy Sections Compatibility
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(body.sections)
    ) {
      applyLegacySections(
        homepage,
        body.sections
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Last Updated By
    |--------------------------------------------------------------------------
    */

    homepage.lastUpdatedBy =
      admin.adminId;

    /*
    |--------------------------------------------------------------------------
    | Validate Before Save
    |--------------------------------------------------------------------------
    |
    | Validation પહેલા explicitly ચલાવીએ છીએ.
    | એટલે exact validation error મળે.
    |
    */

    await homepage.validate();

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    await homepage.save();

    /*
    |--------------------------------------------------------------------------
    | Result
    |--------------------------------------------------------------------------
    */

    const result =
      homepage.toObject();

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Homepage saved successfully.",

        homepage: result,

        sections:
          buildAdminSections(result),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN_HOMEPAGE_PUT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          getErrorMessage(
            error,
            "Unable to save homepage."
          ),

        error:
          process.env.NODE_ENV !==
          "production"
            ? serializeError(error)
            : undefined,
      },
      {
        status:
          error instanceof Error &&
          error.message ===
            "Unauthorized."
            ? 401
            : 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| LEGACY SECTION → HOMEPAGE
|--------------------------------------------------------------------------
*/

function applyLegacySections(
  homepage: any,
  sections: any[]
) {
  /*
  |--------------------------------------------------------------------------
  | Safety
  |--------------------------------------------------------------------------
  */

  if (!Array.isArray(sections)) {
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Section Order
  |--------------------------------------------------------------------------
  */

  const sectionOrder =
    sections
      .map((section) => {
        if (!section?.id) {
          return null;
        }

        return String(section.id);
      })
      .filter(
        (
          value
        ): value is string =>
          Boolean(value)
      );

  if (
    sectionOrder.length > 0
  ) {
    homepage.sectionOrder =
      sectionOrder;
  }

  /*
  |--------------------------------------------------------------------------
  | Process Sections
  |--------------------------------------------------------------------------
  */

  for (const section of sections) {
    if (
      !section ||
      !section.id
    ) {
      continue;
    }

    const id =
      String(section.id);

    /*
    |--------------------------------------------------------------------------
    | LOGO
    |--------------------------------------------------------------------------
    */

    if (id === "logo") {
      homepage.logo = {
        url: cleanString(
          section.image
        ),

        alt:
          cleanString(
            section.title
          ) ||
          "SilentGEN",

        title:
          cleanString(
            section.title
          ) ||
          "SilentGEN",
      };

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | HERO
    |--------------------------------------------------------------------------
    */

    if (id === "hero") {
      /*
      |----------------------------------------------------------------------
      | Make sure hero exists
      |----------------------------------------------------------------------
      */

      if (!homepage.hero) {
        homepage.hero = {
          enabled: true,
          autoSlide: true,
          slideInterval: 5000,
          slides: [],
        };
      }

      homepage.hero.enabled =
        Boolean(
          section.enabled
        );

      const existingSlides =
        Array.isArray(
          homepage.hero.slides
        )
          ? homepage.hero.slides
          : [];

      const heroSlide = {
        title:
          cleanString(
            section.title
          ),

        subtitle:
          cleanString(
            section.subtitle
          ),

        description: "",

        image: {
          url: cleanString(
            section.image
          ),

          alt:
            cleanString(
              section.title
            ) ||
            "SilentGEN Hero",

          title:
            cleanString(
              section.title
            ),
        },

        mobileImage: {
          url: cleanString(
            section.mobileImage
          ),

          alt:
            cleanString(
              section.title
            ) ||
            "SilentGEN Hero",

          title:
            cleanString(
              section.title
            ),
        },

        button: {
          enabled:
            Boolean(
              section.buttonText
            ),

          text:
            cleanString(
              section.buttonText
            ),

          href:
            cleanString(
              section.buttonLink
            ),

          openInNewTab: false,
        },

        secondaryButton: {
          enabled: false,
          text: "",
          href: "",
          openInNewTab: false,
        },

        enabled:
          Boolean(
            section.enabled
          ),

        sortOrder: 0,
      };

      if (
        existingSlides.length >
        0
      ) {
        existingSlides[0] =
          heroSlide;
      } else {
        homepage.hero.slides = [
          heroSlide,
        ];
      }

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | BANNER
    |--------------------------------------------------------------------------
    */

    if (id === "banner") {
      if (!homepage.offers) {
        homepage.offers = {
          enabled: true,
          title:
            "Offers & Deals",
          items: [],
        };
      }

      const existingOffers =
        Array.isArray(
          homepage.offers.items
        )
          ? homepage.offers.items
          : [];

      homepage.offers.enabled =
        Boolean(
          section.enabled
        );

      homepage.offers.title =
        cleanString(
          section.title
        ) ||
        "Offers & Deals";

      const bannerOffer = {
        title:
          cleanString(
            section.title
          ),

        subtitle:
          cleanString(
            section.subtitle
          ),

        discountText: "",

        image: {
          url: cleanString(
            section.image
          ),

          alt:
            cleanString(
              section.title
            ) ||
            "SilentGEN Offer",

          title:
            cleanString(
              section.title
            ),
        },

        href:
          cleanString(
            section.buttonLink
          ) ||
          "/shop",

        buttonText:
          cleanString(
            section.buttonText
          ) ||
          "Shop Now",

        enabled:
          Boolean(
            section.enabled
          ),

        sortOrder: 0,

        startDate: null,

        endDate: null,
      };

      if (
        existingOffers.length >
        0
      ) {
        existingOffers[0] =
          bannerOffer;

        homepage.offers.items =
          existingOffers;
      } else {
        homepage.offers.items =
          [bannerOffer];
      }

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCTS
    |--------------------------------------------------------------------------
    */

    if (id === "products") {
      const existingSections =
        Array.isArray(
          homepage.productSections
        )
          ? homepage.productSections
          : [];

      const productSection = {
        title:
          cleanString(
            section.title
          ) ||
          "Featured Products",

        subtitle:
          cleanString(
            section.subtitle
          ),

        type: "featured",

        productIds: [],

        enabled:
          Boolean(
            section.enabled
          ),

        slider: true,

        sortOrder: 0,

        viewAllText:
          cleanString(
            section.buttonText
          ) ||
          "View All",

        viewAllHref:
          cleanString(
            section.buttonLink
          ) ||
          "/shop",
      };

      if (
        existingSections.length >
        0
      ) {
        existingSections[0] =
          productSection;

        homepage.productSections =
          existingSections;
      } else {
        homepage.productSections =
          [productSection];
      }

      continue;
    }
  }
}

/*
|--------------------------------------------------------------------------
| HOMEPAGE → LEGACY ADMIN SECTIONS
|--------------------------------------------------------------------------
*/

function buildAdminSections(
  homepage: any
) {
  const heroSlide =
    homepage?.hero?.slides?.[0];

  const offer =
    homepage?.offers?.items?.[0];

  const productSection =
    homepage?.productSections?.[0];

  return [
    /*
    |--------------------------------------------------------------------------
    | LOGO
    |--------------------------------------------------------------------------
    */

    {
      id: "logo",

      name: "Website Logo",

      type: "logo",

      enabled: true,

      image:
        homepage?.logo?.url ||
        "",

      mobileImage: "",

      title:
        homepage?.logo?.title ||
        "",

      subtitle: "",

      buttonText: "",

      buttonLink: "",

      font:
        homepage?.settings
          ?.primaryFont ||
        "Inter",
    },

    /*
    |--------------------------------------------------------------------------
    | HERO
    |--------------------------------------------------------------------------
    */

    {
      id: "hero",

      name: "Hero Slider",

      type: "hero",

      enabled:
        homepage?.hero?.enabled ??
        true,

      image:
        heroSlide?.image?.url ||
        "",

      mobileImage:
        heroSlide
          ?.mobileImage?.url ||
        "",

      title:
        heroSlide?.title ||
        "SilentGEN",

      subtitle:
        heroSlide?.subtitle ||
        "Premium Fashion",

      buttonText:
        heroSlide
          ?.button?.text ||
        "Shop Now",

      buttonLink:
        heroSlide
          ?.button?.href ||
        "/shop",

      font:
        homepage?.settings
          ?.headingFont ||
        "Inter",
    },

    /*
    |--------------------------------------------------------------------------
    | BANNER
    |--------------------------------------------------------------------------
    */

    {
      id: "banner",

      name:
        "Promotional Banner",

      type: "banner",

      enabled:
        homepage?.offers
          ?.enabled ??
        true,

      image:
        offer?.image?.url ||
        "",

      mobileImage: "",

      title:
        offer?.title ||
        "New Collection",

      subtitle:
        offer?.subtitle ||
        "Discover the latest styles",

      buttonText:
        offer?.buttonText ||
        "Explore",

      buttonLink:
        offer?.href ||
        "/shop",

      font:
        homepage?.settings
          ?.headingFont ||
        "Inter",
    },

    /*
    |--------------------------------------------------------------------------
    | PRODUCTS
    |--------------------------------------------------------------------------
    */

    {
      id: "products",

      name:
        "Featured Products",

      type: "products",

      enabled:
        productSection
          ?.enabled ??
        true,

      image: "",

      mobileImage: "",

      title:
        productSection?.title ||
        "Featured Products",

      subtitle:
        productSection
          ?.subtitle ||
        "Our latest collection",

      buttonText:
        productSection
          ?.viewAllText ||
        "View All",

      buttonLink:
        productSection
          ?.viewAllHref ||
        "/shop",

      font:
        homepage?.settings
          ?.headingFont ||
        "Inter",
    },
  ];
}

/*
|--------------------------------------------------------------------------
| CLEAN STRING
|--------------------------------------------------------------------------
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

/*
|--------------------------------------------------------------------------
| ERROR MESSAGE
|--------------------------------------------------------------------------
*/

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (
    error instanceof Error
  ) {
    return error.message ||
      fallback;
  }

  return fallback;
}

/*
|--------------------------------------------------------------------------
| SERIALIZE ERROR
|--------------------------------------------------------------------------
*/

function serializeError(
  error: unknown
) {
  if (
    error instanceof Error
  ) {
    const result: Record<
      string,
      unknown
    > = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    const mongooseError =
      error as Error & {
        errors?: Record<
          string,
          {
            message?: string;
            name?: string;
            path?: string;
            value?: unknown;
          }
        >;
        code?: number;
      };

    if (
      mongooseError.code !==
      undefined
    ) {
      result.code =
        mongooseError.code;
    }

    if (
      mongooseError.errors
    ) {
      result.errors =
        Object.fromEntries(
          Object.entries(
            mongooseError.errors
          ).map(
            ([
              key,
              value,
            ]) => [
              key,
              {
                name:
                  value?.name,
                message:
                  value?.message,
                path:
                  value?.path,
                value:
                  value?.value,
              },
            ]
          )
        );
    }

    return result;
  }

  return String(error);
}