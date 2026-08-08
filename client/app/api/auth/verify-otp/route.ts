import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { createToken } from "@/lib/jwt";
import OTP from "@/models/OTP";
import User from "@/models/User";

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
    const otp =
      typeof body?.otp === "string"
        ? body.otp.replace(/\D/g, "")
        : "";

    if (!mobile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid mobile number is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Enter a valid 6 digit OTP.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Find latest OTP for this mobile.
     */
    const otpData = await OTP.findOne({
      mobile,
    }).sort({
      createdAt: -1,
    });

    if (!otpData) {
      return NextResponse.json(
        {
          success: false,
          message:
            "OTP not found. Please request a new OTP.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Check OTP expiry.
     */
    if (
      !otpData.expiresAt ||
      otpData.expiresAt.getTime() <= Date.now()
    ) {
      await OTP.deleteMany({
        mobile,
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "OTP has expired. Please request a new OTP.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Verify OTP.
     */
    if (otpData.otp !== otp) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid OTP. Please enter the correct OTP.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Find existing customer.
     */
    let user = await User.findOne({
      mobile,
    });

    /*
     * Create customer if first login.
     */
    if (!user) {
      user = await User.create({
        mobile,
        name: "New User",
        isProfileCompleted: false,
        isVerified: true,
        lastLogin: new Date(),
      });
    } else {
      /*
       * Blocked customer cannot login.
       */
      if (user.isBlocked) {
        await OTP.deleteMany({
          mobile,
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "Your account has been blocked. Please contact support.",
          },
          {
            status: 403,
          }
        );
      }

      user.isVerified = true;
      user.lastLogin = new Date();

      await user.save();
    }

    /*
     * OTP can be used only once.
     */
    await OTP.deleteMany({
      mobile,
    });

    /*
     * Create SilentGEN JWT.
     */
    const token = createToken({
      id: user._id.toString(),
      mobile: user.mobile,
      role: user.role,
    });

    const profileRequired =
      !user.isProfileCompleted;

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",

      profileRequired,

      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified,
        isProfileCompleted:
          user.isProfileCompleted,
      },
    });

    /*
     * Store JWT in HTTP-only cookie.
     */
    response.cookies.set(
      "token",
      token,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",

        path: "/",

        maxAge:
          60 * 60 * 24 * 7,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "VERIFY OTP ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify OTP. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}
