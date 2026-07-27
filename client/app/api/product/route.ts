import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const query: any = {
      status: "Active",
    };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = {
        $search: search,
      };
    }

    const products = await Product.find(query)
      .sort({
        createdAt: -1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("PRODUCT LIST ERROR:", error);

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
