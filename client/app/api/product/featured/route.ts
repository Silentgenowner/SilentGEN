import { NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({
      featured: true,
      status: "Active",
    })
      .sort({ createdAt: -1 })
      .limit(8);

    return NextResponse.json({
      success: true,
      products,
    });

  } catch (error) {
    console.error("FEATURED PRODUCT ERROR:", error);

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
