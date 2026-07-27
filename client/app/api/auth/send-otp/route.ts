import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import OTP from "@/models/OTP";

export async function POST(req: NextRequest) {
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

    // Generate 6 Digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP Valid For 5 Minutes
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Delete Previous OTP
    await OTP.deleteMany({
      mobile,
    });

    // Save New OTP
    await OTP.create({
      mobile,
      otp,
      expiresAt,
    });

    console.log("================================");
    console.log("Mobile :", mobile);
    console.log("OTP    :", otp);
    console.log("================================");

    return NextResponse.json({
      success: true,
      message: "OTP Sent Successfully",
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
