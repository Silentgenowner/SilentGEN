import { NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();

    const categories = await Product.aggregate([
      {
        $match: {
          isDeleted: false,
          status: "Active",
          category: {
            $exists: true,
            $nin: ["", null],
          },
        },
      },

      {
        $group: {
          _id: "$category",
          count: {
            $sum: 1,
          },
        },
      },

      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
        },
      },

      {
        $sort: {
          name: 1,
        },
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        categories,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET PRODUCT CATEGORIES ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load categories",
        categories: [],
      },
      {
        status: 500,
      }
    );
  }
}
