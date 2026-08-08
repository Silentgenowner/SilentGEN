import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";
import Admin, { type AdminRole } from "@/models/Admin";

const allowedRoles: AdminRole[] = [
  "super_admin",
  "product_manager",
  "order_manager",
  "support_admin",
  "finance_manager",
];

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Unauthorized. Only a super admin can manage admin accounts.",
    },
    { status: 403 }
  );
}

async function getSuperAdmin(request: NextRequest) {
  const token = request.cookies.get("adminToken")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyAdminToken(token);

    if (!payload.adminId || payload.role !== "super_admin") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// બધા admin accounts ની list
export async function GET(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdmin(request);

    if (!superAdmin) {
      return unauthorizedResponse();
    }

    await connectDB();

    const admins = await Admin.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        admins,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_ADMINS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch admin accounts.",
      },
      { status: 500 }
    );
  }
}

// નવો admin account બનાવો
export async function POST(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdmin(request);

    if (!superAdmin) {
      return unauthorizedResponse();
    }

    await connectDB();

    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const confirmPassword = body.confirmPassword;
    const role = body.role as AdminRole | undefined;

    if (!name || !email || !password || !confirmPassword || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a valid admin role.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "An admin with this email already exists.",
        },
        { status: 409 }
      );
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      role,
    });

    return NextResponse.json(
      {
        success: true,
        message: "New admin created successfully.",
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_ADMIN_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create the new admin.",
      },
      { status: 500 }
    );
  }
}
