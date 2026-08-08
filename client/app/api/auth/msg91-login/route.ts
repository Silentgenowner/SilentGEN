import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { createToken } from "@/lib/jwt";
import User from "@/models/User";

function normalizeMobile(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const digits = value.replace(/\D/g, "");

  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits.slice(2);
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const mobile = normalizeMobile(body?.mobile);
    const accessToken =
      typeof body?.accessToken === "string"
        ? body.accessToken.trim()
        : "";

    if (!mobile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid mobile number is required.",
        },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message:
            "MSG91 access token is required.",
        },
        { status: 400 }
      );
    }

    const authKey =
      process.env.MSG91_AUTH_KEY;

    if (!authKey) {
      console.error(
        "MSG91_AUTH_KEY is missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "MSG91 authentication is not configured.",
        },
        { status: 500 }
      );
    }

    /*
     * Verify the access token generated
     * by MSG91 OTP Widget.
     */

    const msg91Response = await fetch(
      "https://control.msg91.com/api/v5/widget/verifyAccessToken",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          authkey: authKey,
          "access-token": accessToken,
        }),

        cache: "no-store",
      }
    );

    const rawText =
      await msg91Response.text();

    let msg91Data: any = null;

    try {
      msg91Data = rawText
        ? JSON.parse(rawText)
        : null;
    } catch {
      msg91Data = null;
    }

    console.log(
      "MSG91 ACCESS TOKEN RESPONSE:",
      msg91Response.status,
      msg91Data
    );

    if (!msg91Response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            msg91Data?.message ||
            msg91Data?.error ||
            "MSG91 token verification failed.",
        },
        { status: 401 }
      );
    }

    /*
     * MSG91 verification response can contain
     * different response fields depending on
     * the Widget/API version.
     *
     * Accept a successful response only.
     */

    const responseText = JSON.stringify(
      msg91Data || {}
    ).toLowerCase();

    const failed =
      responseText.includes("invalid") ||
      responseText.includes("expired") ||
      responseText.includes("failed") ||
      responseText.includes("error");

    if (failed) {
      return NextResponse.json(
        {
          success: false,
          message:
            msg91Data?.message ||
            "MSG91 access token is invalid or expired.",
        },
        { status: 401 }
      );
    }

    /*
     * Token is valid.
     *
     * Now create/find the SilentGEN customer.
     */

    let user = await User.findOne({
      mobile,
    });

    if (!user) {
      user = await User.create({
        mobile,
        name: "New User",
        isProfileCompleted: false,
        isVerified: true,
        lastLogin: new Date(),
      });
    } else {
      if (user.isBlocked) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Your account has been blocked. Please contact support.",
          },
          { status: 403 }
        );
      }

      user.isVerified = true;
      user.lastLogin = new Date();

      await user.save();
    }

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

      message:
        "Login successful.",

      profileRequired,

      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isProfileCompleted:
          user.isProfileCompleted,
        isVerified:
          user.isVerified,
      },
    });

    /*
     * SilentGEN authentication cookie.
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
      "MSG91 LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong during login.",
      },
      { status: 500 }
    );
  }
}