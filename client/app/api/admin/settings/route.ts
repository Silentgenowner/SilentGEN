import {
  NextRequest,
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import Admin from "@/models/Admin";
import Settings from "@/models/Settings";

/*
|--------------------------------------------------------------------------
| ERROR CODES
|--------------------------------------------------------------------------
*/

const UNAUTHORIZED =
  "UNAUTHORIZED";

const FORBIDDEN =
  "FORBIDDEN";

/*
|--------------------------------------------------------------------------
| AUTHENTICATE
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
      UNAUTHORIZED
    );
  }

  const payload =
    await verifyAdminToken(
      token
    );

  if (!payload?.adminId) {
    throw new Error(
      UNAUTHORIZED
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
    admin.isActive === false
  ) {
    throw new Error(
      UNAUTHORIZED
    );
  }

  if (
    admin.role !==
    "super_admin"
  ) {
    throw new Error(
      FORBIDDEN
    );
  }

  return admin;
}

/*
|--------------------------------------------------------------------------
| GET SETTINGS
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
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizeString(
  value: unknown,
  fallback = ""
) {
  if (
    typeof value !==
    "string"
  ) {
    return fallback;
  }

  return value.trim();
}

function normalizeEmail(
  value: unknown
) {
  return normalizeString(
    value
  ).toLowerCase();
}

function normalizeNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(value);

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

function isValidEmail(
  value: string
) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function authErrorResponse(
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "";

  if (
    message === FORBIDDEN
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Access denied.",
      },
      {
        status: 403,
      }
    );
  }

  if (
    message ===
    UNAUTHORIZED
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Admin login required.",
      },
      {
        status: 401,
      }
    );
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    await connectDB();

    await authenticate(
      request
    );

    const settings =
      await getSettings();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "SETTINGS GET ERROR:",
      error
    );

    const authResponse =
      authErrorResponse(
        error
      );

    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load settings.",
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
*/

export async function PUT(
  request: NextRequest
) {
  try {
    await connectDB();

    await authenticate(
      request
    );

    const body =
      await request.json();

    /*
    |--------------------------------------------------------------------------
    | EMAILS
    |--------------------------------------------------------------------------
    */

    const supportEmail =
      normalizeEmail(
        body?.supportEmail
      );

    const contactEmail =
      normalizeEmail(
        body?.contactEmail
      );

    const orderEmail =
      normalizeEmail(
        body?.orderEmail
      );

    const returnRefundEmail =
      normalizeEmail(
        body?.returnRefundEmail
      );

    const emails = [
      {
        label:
          "Support email",
        value:
          supportEmail,
      },

      {
        label:
          "Contact email",
        value:
          contactEmail,
      },

      {
        label:
          "Order / Delivery email",
        value:
          orderEmail,
      },

      {
        label:
          "Return / Refund email",
        value:
          returnRefundEmail,
      },
    ];

    for (
      const email
      of emails
    ) {
      if (
        !isValidEmail(
          email.value
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              `${email.label} is invalid.`,
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | DOCUMENT
    |--------------------------------------------------------------------------
    */

    const settings =
      await getSettings();

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    settings.storeName =
      normalizeString(
        body?.storeName,
        "SilentGEN"
      ) ||
      "SilentGEN";

    settings.storeLogo =
      normalizeString(
        body?.storeLogo
      );

    settings.currency =
      (
        normalizeString(
          body?.currency,
          "INR"
        ) ||
        "INR"
      ).toUpperCase();

    settings.gstNumber =
      normalizeString(
        body?.gstNumber
      ).toUpperCase();

    /*
    |--------------------------------------------------------------------------
    | EMAIL
    |--------------------------------------------------------------------------
    */

    settings.supportEmail =
      supportEmail ||
      "silentgenofficial@gmail.com";

    settings.contactEmail =
      contactEmail ||
      "silentgenofficial@gmail.com";

    settings.orderEmail =
      orderEmail ||
      "silentgenofficial@gmail.com";

    settings.returnRefundEmail =
      returnRefundEmail ||
      "silentgenofficial@gmail.com";

    /*
    |--------------------------------------------------------------------------
    | PHONE
    |--------------------------------------------------------------------------
    */

    settings.supportMobile =
      normalizeString(
        body?.supportMobile
      );

    settings.customerCareNumber =
      normalizeString(
        body?.customerCareNumber
      );

    settings.productQueryNumber =
      normalizeString(
        body?.productQueryNumber,
        "+919998665658"
      ) ||
      "+919998665658";

    settings.deliveryQueryNumber =
      normalizeString(
        body?.deliveryQueryNumber,
        "+919998765658"
      ) ||
      "+919998765658";

    settings.paymentRefundNumber =
      normalizeString(
        body?.paymentRefundNumber,
        "+919998665652"
      ) ||
      "+919998665652";

    /*
    |--------------------------------------------------------------------------
    | WHATSAPP
    |--------------------------------------------------------------------------
    */

    settings.whatsappNumber =
      normalizeString(
        body?.whatsappNumber
      );

    settings.whatsappMessage =
      normalizeString(
        body?.whatsappMessage,
        "Hello SilentGEN, I need help."
      ) ||
      "Hello SilentGEN, I need help.";

    /*
    |--------------------------------------------------------------------------
    | BUSINESS
    |--------------------------------------------------------------------------
    */

    settings.businessAddress =
      normalizeString(
        body?.businessAddress
      );

    settings.legalBusinessName =
      normalizeString(
        body?.legalBusinessName
      );

    settings.supportHours =
      normalizeString(
        body?.supportHours
      );

    /*
    |--------------------------------------------------------------------------
    | SOCIAL
    |--------------------------------------------------------------------------
    */

    settings.instagramUrl =
      normalizeString(
        body?.instagramUrl,
        "https://www.instagram.com/silentgenofficial/"
      ) ||
      "https://www.instagram.com/silentgenofficial/";

    settings.facebookUrl =
      normalizeString(
        body?.facebookUrl,
        "https://www.facebook.com/share/1AiwV1MKfb/"
      );

    settings.youtubeUrl =
      normalizeString(
        body?.youtubeUrl,
        "https://www.youtube.com/@SilentGEN-org"
      );

    /*
    |--------------------------------------------------------------------------
    | SHIPPING
    |--------------------------------------------------------------------------
    */

    settings.shippingCharge =
      normalizeNumber(
        body?.shippingCharge
      );

    settings.freeShippingMinimum =
      normalizeNumber(
        body
          ?.freeShippingMinimum
      );

    /*
    |--------------------------------------------------------------------------
    | PAYMENT
    |--------------------------------------------------------------------------
    */

    settings.codEnabled =
      Boolean(
        body?.codEnabled
      );

    settings.onlinePaymentEnabled =
      Boolean(
        body
          ?.onlinePaymentEnabled
      );

    /*
    |--------------------------------------------------------------------------
    | RETURN / EXCHANGE
    |--------------------------------------------------------------------------
    */

    settings.returnDays =
      normalizeNumber(
        body?.returnDays,
        7
      );

    settings.exchangeDays =
      normalizeNumber(
        body?.exchangeDays,
        7
      );

    /*
    |--------------------------------------------------------------------------
    | INVENTORY
    |--------------------------------------------------------------------------
    */

    settings.lowStockLimit =
      normalizeNumber(
        body?.lowStockLimit,
        5
      );

    /*
    |--------------------------------------------------------------------------
    | SEO
    |--------------------------------------------------------------------------
    */

    settings.defaultSeoTitle =
      normalizeString(
        body?.defaultSeoTitle,
        "SilentGEN"
      ) ||
      "SilentGEN";

    settings.defaultSeoDescription =
      normalizeString(
        body
          ?.defaultSeoDescription
      );

    /*
    |--------------------------------------------------------------------------
    | SYSTEM
    |--------------------------------------------------------------------------
    */

    settings.maintenanceMode =
      Boolean(
        body?.maintenanceMode
      );

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    await settings.save();

    return NextResponse.json({
      success: true,

      message:
        "Settings saved successfully.",

      settings,
    });
  } catch (error) {
    console.error(
      "SETTINGS UPDATE ERROR:",
      error
    );

    const authResponse =
      authErrorResponse(
        error
      );

    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to save settings.",
      },
      {
        status: 500,
      }
    );
  }
}