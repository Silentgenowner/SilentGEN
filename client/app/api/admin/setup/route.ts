import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Admin from "@/models/Admin";

/*
    GET
    Check whether first admin already exists
*/
export async function GET() {
  try {
    await connectDB();

    const adminCount = await Admin.countDocuments();

    return NextResponse.json(
      {
        success: true,
        adminExists: adminCount > 0,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("ADMIN_SETUP_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        adminExists: false,
      },
      {
        status: 500,
      }
    );
  }
}

/*
    POST
    Create First Admin
*/
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const adminCount = await Admin.countDocuments();

    if (adminCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin already exists.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await req.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const confirmPassword = body.confirmPassword;

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        {
          status: 400,
        }
      );
    }

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Passwords do not match.",
        },
        {
          status: 400,
        }
      );
    }

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const admin = await Admin.create({
      name,
      email,
      password,
    });

    return NextResponse.json(
      {
        success: true,
        message: "First admin created successfully.",
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("ADMIN_SETUP_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
