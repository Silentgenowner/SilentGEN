import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Cart from "@/models/Cart";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function DELETE(req: NextRequest) {

  try {

    await connectDB();

    // =====================================
    // AUTH
    // =====================================

    const token =
      req.cookies.get("token")?.value;

    if (!token) {

      return NextResponse.json(
        {
          success: false,
          message: "Please login first",
        },
        {
          status: 401,
        }
      );

    }

    let decoded: any;

    try {

      decoded = jwt.verify(
        token,
        JWT_SECRET
      );

    } catch {

      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        {
          status: 401,
        }
      );

    }

    const userId =
      decoded.id ||
      decoded.userId;

    if (!userId) {

      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 401,
        }
      );

    }

    // =====================================
    // REQUEST BODY
    // =====================================

    const {
      productId,
      size = "",
      color = "",
    } = await req.json();

    if (!productId) {

      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
        },
        {
          status: 400,
        }
      );

    }

    // =====================================
    // FIND CART
    // =====================================

    const cart =
      await Cart.findOne({
        userId,
      });

    if (!cart) {

      return NextResponse.json(
        {
          success: false,
          message: "Cart not found",
        },
        {
          status: 404,
        }
      );

    }

    const oldLength =
      cart.items.length;
          // =====================================
    // REMOVE ONLY MATCHING VARIANT
    // =====================================

    cart.items = cart.items.filter(
      (item: any) =>
        !(
          item.productId.toString() === productId &&
          (item.size || "") === (size || "") &&
          (item.color || "") === (color || "")
        )
    );

    if (cart.items.length === oldLength) {

      return NextResponse.json(
        {
          success: false,
          message: "Cart item not found",
        },
        {
          status: 404,
        }
      );

    }

    // =====================================
    // SAVE CART
    // =====================================

    await cart.save();

    // =====================================
    // TOTALS
    // =====================================

    let totalItems = 0;
    let subtotal = 0;

    for (const item of cart.items) {

      totalItems += item.quantity;

      subtotal +=
        item.price *
        item.quantity;

    }

    // =====================================
    // SUCCESS
    // =====================================

    return NextResponse.json(
      {
        success: true,

        message: "Item removed successfully",

        cart: {
          items: cart.items,
          totalItems,
          subtotal,
        },
      },
      {
        status: 200,
      }
    );

  } catch (error: any) {

    console.error(
      "REMOVE CART ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Failed to remove item",
      },
      {
        status: 500,
      }
    );

  }

}