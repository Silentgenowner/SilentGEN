import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import OTP from "@/models/OTP";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile, otp } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile and OTP are required",
        },
        {
          status: 400,
        }
      );
    }

    const otpData = await OTP.findOne({
      mobile,
    });

    if (!otpData) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP not found",
        },
        {
          status: 400,
        }
      );
    }

    if (otpData.expiresAt < new Date()) {
      await OTP.deleteMany({
        mobile,
      });

      return NextResponse.json(
        {
          success: false,
          message: "OTP Expired",
        },
        {
          status: 400,
        }
      );
    }

    if (otpData.otp !== otp) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid OTP",
        },
        {
          status: 400,
        }
      );
    }

    let user = await User.findOne({
      mobile,
    });

    if (!user) {
      user = await User.create({
        mobile,
        name: "New User",
        isProfileCompleted:false,
        isVerified: true,
        lastLogin: new Date(),
      });
    } else {
      user.isVerified = true;
      user.lastLogin = new Date();

      await user.save();
    }

    await OTP.deleteMany({
      mobile,
    });

    const token = jwt.sign(
      {
        id: user._id.toString(),
        mobile: user.mobile,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const profileRequired =
      !user.isProfileCompleted;

    const response = NextResponse.json({
      success: true,
      message: "Login Successful",
      profileRequired,
      user,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
