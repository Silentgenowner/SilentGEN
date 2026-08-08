import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { createAdminToken } from "@/lib/adminAuth";
import Admin from "@/models/Admin";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const rememberMe = Boolean(body.rememberMe);

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const admin = await Admin.findOne({ email });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const passwordMatches = await admin.comparePassword(password);

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const token = await createAdminToken({
      adminId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "adminToken",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(rememberMe ? { maxAge: 60 * 60 * 24 * 7 } : {}),
    });

    return response;
  } catch (error) {
    console.error("ADMIN_LOGIN_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
