import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";
import Admin from "@/models/Admin";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("adminToken")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const payload = await verifyAdminToken(token);

    if (!payload.adminId) {
      throw new Error("Invalid token.");
    }

    await connectDB();

    const admin = await Admin.findById(payload.adminId)
      .select("name email role isActive")
      .lean();

    if (!admin || !admin.isActive) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Your admin account is inactive.",
        },
        { status: 401 }
      );

      response.cookies.delete("adminToken");

      return response;
    }

    return NextResponse.json(
      {
        success: true,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_CURRENT_ADMIN_ERROR:", error);

    const response = NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );

    response.cookies.delete("adminToken");

    return response;
  }
}
