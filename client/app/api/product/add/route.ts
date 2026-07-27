import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();

    const token = cookieStore.get("adminToken")?.value;

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
      role: string;
    };

    if (decoded.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access Denied",
        },
        {
          status: 403,
        }
      );
    }

    const {
      name,
      description,
      price,
      category,
      brand,
      stock,
      images,
      sizes,
      colors,
      featured,
    } = await req.json();

    if (
      !name ||
      !description ||
      !price ||
      !category
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill all required fields",
        },
        {
          status: 400,
        }
      );
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      brand: brand || "SilentGEN",
      stock: Number(stock),
      images: images || [],
      sizes: sizes || [],
      colors: colors || [],
      featured: featured || false,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "Product Added Successfully",
      product,
    });

  } catch (error) {

    console.error("ADD PRODUCT ERROR:", error);

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
