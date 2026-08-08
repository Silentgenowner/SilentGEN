import { NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import HomePageSettings from "@/models/HomePageSettings";

/*
|--------------------------------------------------------------------------
| GET HOME PAGE SETTINGS
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    await connectDB();

    let settings = await HomePageSettings.findOne().lean();

    /*
    |--------------------------------------------------------------------------
    | Create default settings if none exists
    |--------------------------------------------------------------------------
    */

    if (!settings) {
      const newSettings = await HomePageSettings.create({});

      settings = newSettings.toObject();
    }

    return NextResponse.json(
      {
        success: true,
        settings,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "HOME PAGE SETTINGS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load home page settings",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE HOME PAGE SETTINGS
|--------------------------------------------------------------------------
*/

export async function PUT(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    /*
    |--------------------------------------------------------------------------
    | Find existing settings
    |--------------------------------------------------------------------------
    */

    let settings = await HomePageSettings.findOne();

    /*
    |--------------------------------------------------------------------------
    | Create settings if they don't exist
    |--------------------------------------------------------------------------
    */

    if (!settings) {
      settings = new HomePageSettings();
    }

    /*
    |--------------------------------------------------------------------------
    | Allowed fields
    |--------------------------------------------------------------------------
    */

    const allowedFields = [
      "heroBanners",
      "categories",
      "genders",
      "offers",
      "seasonalCollections",
      "newsletter",
      "whyShop",
      "featuredSection",
      "trendingSection",
      "newArrivalsSection",
      "bestSellerSection",
      "menCollectionSection",
      "womenCollectionSection",
      "kidsCollectionSection",
    ];

    /*
    |--------------------------------------------------------------------------
    | Update only allowed fields
    |--------------------------------------------------------------------------
    */

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        settings.set(field, body[field]);
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    await settings.save();

    return NextResponse.json(
      {
        success: true,
        message: "Home page settings updated successfully",
        settings: settings.toObject(),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "HOME PAGE SETTINGS UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update home page settings",
      },
      {
        status: 500,
      }
    );
  }
}
