import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import Address from "@/models/Address";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    await connectDB();

    const cookie = req.headers.get("cookie") || "";

    const token = cookie
      .split("; ")
      .find((item) => item.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
    };

    const body = await req.json();

    await Address.findOneAndUpdate(
      {
        userId: decoded.id,
      },
      {
        userId: decoded.id,
        fullName: body.fullName,
        mobile: body.mobile,
        pincode: body.pincode,
        state: body.state,
        city: body.city,
        area: body.area,
        house: body.house,
        landmark: body.landmark || "",
      },
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Address Saved Successfully",
    });
  } catch (error) {
    console.error("ADDRESS SAVE ERROR:", error);

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
