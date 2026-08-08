import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import OTP from "@/models/OTP";

function normalizeMobile(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const mobile = value.replace(/\D/g, "");

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return null;
  }

  return mobile;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const mobile = normalizeMobile(body?.mobile);

    if (!mobile) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid 10 digit mobile number.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Generate 6 digit OTP
     */
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    /*
     * OTP valid for 5 minutes
     */
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    /*
     * Remove previous OTP for this mobile
     */
    await OTP.deleteMany({
      mobile,
    });

    /*
     * Save new OTP
     */
    await OTP.create({
      mobile,
      otp,
      expiresAt,
    });

    /*
     * DEVELOPMENT MODE
     *
     * Currently we are not using SMS provider.
     * OTP is returned only for local testing.
     *
     * IMPORTANT:
     * Remove "otp" from response before production.
     */
    return NextResponse.json({
      success: true,
      message: "OTP generated successfully.",
      otpSent: true,

      // Development only
      otp,
    });
  } catch (error) {
    console.error(
      "SEND OTP ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to generate OTP. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}
