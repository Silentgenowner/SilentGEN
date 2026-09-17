import {
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";

import Settings from "@/models/Settings";

/*
|--------------------------------------------------------------------------
| ALWAYS LOAD LATEST SETTINGS
|--------------------------------------------------------------------------
|
| Admin Settings save કર્યા પછી customer websiteને latest data જ મળવું જોઈએ.
|
|--------------------------------------------------------------------------
*/

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

/*
|--------------------------------------------------------------------------
| GET / CREATE SETTINGS
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
| PUBLIC SITE SETTINGS
|--------------------------------------------------------------------------
|
| આ API customer website માટે છે.
|
| Admin Settings
|       ↓
| MongoDB
|       ↓
| /api/site-settings
|       ↓
| Footer / CMS / Website
|
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | SETTINGS
    |--------------------------------------------------------------------------
    */

    const settings =
      await getSettings();

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        settings: {
          /*
          |--------------------------------------------------------------------------
          | STORE
          |--------------------------------------------------------------------------
          */

          storeName:
            settings.storeName,

          /*
          |--------------------------------------------------------------------------
          | BUSINESS NAME ALIAS
          |--------------------------------------------------------------------------
          |
          | CMSમાં {{businessName}} use કરી શકાય.
          |
          |--------------------------------------------------------------------------
          */

          businessName:
            settings.storeName,

          storeLogo:
            settings.storeLogo,

          currency:
            settings.currency,

          /*
          |--------------------------------------------------------------------------
          | EMAIL
          |--------------------------------------------------------------------------
          */

          supportEmail:
            settings.supportEmail,

          contactEmail:
            settings.contactEmail,

          orderEmail:
            settings.orderEmail,

          returnRefundEmail:
            settings.returnRefundEmail,

          /*
          |--------------------------------------------------------------------------
          | GENERAL PHONE
          |--------------------------------------------------------------------------
          */

          supportMobile:
            settings.supportMobile,

          customerCareNumber:
            settings.customerCareNumber,

          /*
          |--------------------------------------------------------------------------
          | QUERY NUMBERS
          |--------------------------------------------------------------------------
          |
          | IMPORTANT:
          |
          | પહેલાં આ ત્રણ fields public APIમાં નહોતા.
          | એટલે Adminમાં save થયા છતાં Footer સુધી પહોંચતા નહોતા.
          |
          |--------------------------------------------------------------------------
          */

          productQueryNumber:
            settings.productQueryNumber,

          deliveryQueryNumber:
            settings.deliveryQueryNumber,

          paymentRefundNumber:
            settings.paymentRefundNumber,

          /*
          |--------------------------------------------------------------------------
          | WHATSAPP
          |--------------------------------------------------------------------------
          */

          whatsappNumber:
            settings.whatsappNumber,

          whatsappMessage:
            settings.whatsappMessage,

          /*
          |--------------------------------------------------------------------------
          | BUSINESS
          |--------------------------------------------------------------------------
          */

          businessAddress:
            settings.businessAddress,

          legalBusinessName:
            settings.legalBusinessName,

          supportHours:
            settings.supportHours,

          /*
          |--------------------------------------------------------------------------
          | SOCIAL
          |--------------------------------------------------------------------------
          */

          instagramUrl:
            settings.instagramUrl,

          facebookUrl:
            settings.facebookUrl,

          youtubeUrl:
            settings.youtubeUrl,

          /*
          |--------------------------------------------------------------------------
          | SHIPPING
          |--------------------------------------------------------------------------
          */

          shippingCharge:
            settings.shippingCharge,

          freeShippingMinimum:
            settings.freeShippingMinimum,

          /*
          |--------------------------------------------------------------------------
          | PAYMENT
          |--------------------------------------------------------------------------
          */

          codEnabled:
            settings.codEnabled,

          onlinePaymentEnabled:
            settings.onlinePaymentEnabled,

          /*
          |--------------------------------------------------------------------------
          | RETURN / EXCHANGE
          |--------------------------------------------------------------------------
          */

          returnDays:
            settings.returnDays,

          exchangeDays:
            settings.exchangeDays,

          /*
          |--------------------------------------------------------------------------
          | SEO
          |--------------------------------------------------------------------------
          */

          defaultSeoTitle:
            settings.defaultSeoTitle,

          defaultSeoDescription:
            settings.defaultSeoDescription,

          /*
          |--------------------------------------------------------------------------
          | SYSTEM
          |--------------------------------------------------------------------------
          */

          maintenanceMode:
            settings.maintenanceMode,
        },
      },
      {
        status:
          200,

        /*
        |--------------------------------------------------------------------------
        | NO CACHE
        |--------------------------------------------------------------------------
        */

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",

          Pragma:
            "no-cache",

          Expires:
            "0",
        },
      }
    );
  } catch (error) {
    console.error(
      "PUBLIC SITE SETTINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to load site settings.",
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}