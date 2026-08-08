import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";
import HomePage from "@/models/HomePage";


// ======================================================
// CHECK ADMIN AUTH
// ======================================================

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get("adminToken")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyAdminToken(token);

    if (!payload.adminId || !payload.role) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}


// ======================================================
// DEFAULT HOMEPAGE DATA
// ======================================================

function getDefaultHomepageData() {
  return {
    heroSlides: [],
    categories: [],
    genderSections: [],
    offers: [],
    seasonalCollections: [],
    whyShop: [],
    newsletter: {
      title: "Stay Updated With SilentGEN",
      description:
        "Get exclusive offers and latest collection updates.",
      active: true,
    },
    footer: {
      aboutUs: "",
      email: "",
      mobile: "",
      instagram: "",
      facebook: "",
      youtube: "",
      logo: "",
    },
    isActive: true,
  };
}


// ======================================================
// GET HOMEPAGE SETTINGS
// ======================================================

export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }


    if (admin.role !== "super_admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only Super Admin can manage homepage settings.",
        },
        {
          status: 403,
        }
      );
    }


    await connectDB();


    let homepage = await HomePage.findOne({
      isActive: true,
    }).lean();


    // --------------------------------------------------
    // Create default homepage if none exists
    // --------------------------------------------------

    if (!homepage) {
      homepage = await HomePage.create(
        getDefaultHomepageData()
      );

      homepage = homepage.toObject();
    }


    return NextResponse.json(
      {
        success: true,
        homepage,
      },
      {
        status: 200,
      }
    );


  } catch (error) {
    console.error(
      "ADMIN HOMEPAGE GET ERROR:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message: "Failed to load homepage settings.",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// UPDATE HOMEPAGE SETTINGS
// ======================================================

export async function PUT(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }


    if (admin.role !== "super_admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only Super Admin can manage homepage settings.",
        },
        {
          status: 403,
        }
      );
    }


    await connectDB();


    const body = await request.json();


    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid homepage data.",
        },
        {
          status: 400,
        }
      );
    }


    // --------------------------------------------------
    // Only allow known homepage fields
    // --------------------------------------------------

    const allowedFields = [
      "heroSlides",
      "categories",
      "genderSections",
      "offers",
      "seasonalCollections",
      "whyShop",
      "newsletter",
      "footer",
      "isActive",
    ];


    const updateData: Record<string, unknown> = {};


    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updateData[field] = body[field];
      }
    }


    // --------------------------------------------------
    // Make sure homepage exists
    // --------------------------------------------------

    let homepage = await HomePage.findOne({
      isActive: true,
    });


    if (!homepage) {
      homepage = new HomePage(
        getDefaultHomepageData()
      );
    }


    // --------------------------------------------------
    // Update only provided fields
    // --------------------------------------------------

    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          updateData,
          field
        )
      ) {
        (homepage as any)[field] =
          updateData[field];
      }
    }


    await homepage.save();


    return NextResponse.json(
      {
        success: true,
        message: "Homepage updated successfully.",
        homepage: homepage.toObject(),
      },
      {
        status: 200,
      }
    );


  } catch (error) {
    console.error(
      "ADMIN HOMEPAGE UPDATE ERROR:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update homepage settings.",
      },
      {
        status: 500,
      }
    );
  }
}
