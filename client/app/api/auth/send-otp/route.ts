import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import OTP from "@/models/OTP";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile } = await req.json();

    if (!mobile) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile number is required",
        },
        {
          status: 400,
        }
      );
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await OTP.deleteMany({
      mobile,
    });

    await OTP.create({
      mobile,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Development only
    console.log("OTP:", otp);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      otp, // Remove this in production when using SMS
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

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
