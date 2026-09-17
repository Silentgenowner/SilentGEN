import {
  NextRequest,
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";

import CmsPage from "@/models/CmsPage";
import Settings from "@/models/Settings";

import ensureDefaultCmsPages from "@/lib/cms/ensureDefaultCmsPages";

import {
  renderCmsContent,
} from "@/lib/cms/renderCmsContent";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

/*
|--------------------------------------------------------------------------
| NORMALIZE SLUG
|--------------------------------------------------------------------------
*/

function normalizeSlug(
  value: string
) {
  return decodeURIComponent(
    value || ""
  )
    .trim()
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| SETTINGS
|--------------------------------------------------------------------------
*/

async function getSettings() {
  let settings =
    await Settings.findOne();

  if (!settings) {
    settings =
      await Settings.create(
        {}
      );
  }

  return settings;
}

/*
|--------------------------------------------------------------------------
| WHATSAPP URL
|--------------------------------------------------------------------------
*/

function createWhatsAppUrl(
  phone: string,
  message: string
) {
  const number =
    String(phone || "")
      .replace(
        /\D/g,
        ""
      );

  if (!number) {
    return "";
  }

  const text =
    String(
      message || ""
    ).trim();

  if (!text) {
    return `https://wa.me/${number}`;
  }

  return (
    `https://wa.me/${number}` +
    `?text=${encodeURIComponent(
      text
    )}`
  );
}

/*
|--------------------------------------------------------------------------
| GET CMS PAGE
|--------------------------------------------------------------------------
*/

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();

    await ensureDefaultCmsPages();

    const {
      slug: rawSlug,
    } =
      await context.params;

    const slug =
      normalizeSlug(
        rawSlug
      );

    if (!slug) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Page slug is required.",
        },
        {
          status: 400,
        }
      );
    }

    const page =
      await CmsPage.findOne({
        slug,

        status:
          "Published" as const,
      })
        .select(
          [
            "_id",
            "title",
            "slug",
            "section",
            "pageType",
            "content",
            "shortDescription",
            "status",
            "sortOrder",
            "seoTitle",
            "seoDescription",
            "externalUrl",
            "whatsappNumber",
            "whatsappMessage",
            "icon",
            "isSystem",
            "createdAt",
            "updatedAt",
          ].join(" ")
        )
        .lean();

    if (!page) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Page not found.",
        },
        {
          status: 404,
        }
      );
    }

    const settings =
      await getSettings();

    const cmsSettings = {
      storeName:
        settings.storeName,

      businessName:
        settings.storeName,

      businessAddress:
        settings.businessAddress,

      legalBusinessName:
        settings.legalBusinessName,

      supportEmail:
        settings.supportEmail,

      contactEmail:
        settings.contactEmail,

      orderEmail:
        settings.orderEmail,

      returnRefundEmail:
        settings.returnRefundEmail,

      supportMobile:
        settings.supportMobile,

      customerCareNumber:
        settings.customerCareNumber,

      productQueryNumber:
        settings.productQueryNumber,

      deliveryQueryNumber:
        settings.deliveryQueryNumber,

      paymentRefundNumber:
        settings.paymentRefundNumber,

      whatsappNumber:
        settings.whatsappNumber,

      supportHours:
        settings.supportHours,

      gstNumber:
        settings.gstNumber,

      currency:
        settings.currency,

      returnDays:
        settings.returnDays,

      exchangeDays:
        settings.exchangeDays,

      shippingCharge:
        settings.shippingCharge,

      freeShippingMinimum:
        settings.freeShippingMinimum,
    };

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    const renderedTitle =
      renderCmsContent(
        page.title || "",
        cmsSettings
      );

    const renderedDescription =
      renderCmsContent(
        page.shortDescription ||
          "",
        cmsSettings
      );

    const renderedContent =
      renderCmsContent(
        page.content || "",
        cmsSettings
      );

    const renderedSeoTitle =
      renderCmsContent(
        page.seoTitle || "",
        cmsSettings
      );

    const renderedSeoDescription =
      renderCmsContent(
        page.seoDescription ||
          "",
        cmsSettings
      );

    /*
    |--------------------------------------------------------------------------
    | TARGET URL
    |--------------------------------------------------------------------------
    */

    let targetUrl = "";

    if (
      page.pageType ===
      "external"
    ) {
      targetUrl =
        String(
          page.externalUrl ||
            ""
        ).trim();
    }

    if (
      page.pageType ===
      "whatsapp"
    ) {
      const whatsappNumber =
        page.whatsappNumber ||
        settings.whatsappNumber ||
        "";

      const whatsappMessage =
        renderCmsContent(
          page.whatsappMessage ||
            settings.whatsappMessage ||
            "Hello SilentGEN, I need help.",
          cmsSettings
        );

      targetUrl =
        createWhatsAppUrl(
          whatsappNumber,
          whatsappMessage
        );
    }

    return NextResponse.json({
      success: true,

      page: {
        id:
          String(
            page._id
          ),

        title:
          renderedTitle,

        slug:
          page.slug,

        section:
          page.section,

        pageType:
          page.pageType,

        shortDescription:
          renderedDescription,

        content:
          renderedContent,

        sortOrder:
          page.sortOrder,

        icon:
          page.icon,

        seo: {
          title:
            renderedSeoTitle ||
            renderedTitle,

          description:
            renderedSeoDescription ||
            renderedDescription,
        },

        targetUrl,

        createdAt:
          page.createdAt,

        updatedAt:
          page.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "CMS PAGE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load page.",
      },
      {
        status: 500,
      }
    );
  }
}