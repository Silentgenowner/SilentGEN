import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyToken } from "@/lib/jwt";
import User from "@/models/User";
import Product from "@/models/Product";


// ==============================
// AUTH HELPER
// ==============================

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  const decoded = verifyToken(token);

  if (!decoded || typeof decoded !== "object") return null;

  const id =
    (decoded as any).id ||
    (decoded as any).userId;

  return id ? String(id) : null;
}


// ==============================
// GET — Fetch wishlist
// ==============================

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please login first" },
        { status: 401 }
      );
    }

    const user = await User.findById(userId).populate(
      "wishlist",
      "name slug thumbnail price mrp stock status isDeleted"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Filter out deleted products from the wishlist
    const activeWishlist = (user.wishlist as any[]).filter(
      (item: any) => item && !item.isDeleted
    );

    return NextResponse.json({
      success: true,
      wishlist: activeWishlist,
    });
  } catch (error: any) {
    console.error("WISHLIST GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}


// ==============================
// POST — Add to wishlist
// ==============================

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please login first" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    // Verify product exists and is not deleted
    const product = await Product.findOne({
      _id: productId,
      isDeleted: { $ne: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // $addToSet prevents duplicates atomically
    await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: productId },
    });

    return NextResponse.json({
      success: true,
      message: "Added to wishlist",
    });
  } catch (error: any) {
    console.error("WISHLIST ADD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}


// ==============================
// DELETE — Remove from wishlist
// ==============================

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const userId = getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please login first" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { wishlist: productId },
    });

    return NextResponse.json({
      success: true,
      message: "Removed from wishlist",
    });
  } catch (error: any) {
    console.error("WISHLIST REMOVE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}
