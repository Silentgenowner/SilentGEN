import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import { calculateCartTotals } from "@/lib/cartTotals";
import Cart from "@/models/Cart";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;

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

    let decoded: { id: string };

    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch {
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

    const body = await req.json();

    const {
      productId,
      size = "",
      color = "",
    } = body;

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

    const cart = await Cart.findOne({
      userId: decoded.id,
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

    const itemIndex = cart.items.findIndex(
      (item: any) =>
        item.productId.toString() === productId &&
        (item.size || "") === size &&
        (item.color || "") === color
    );

    if (itemIndex === -1) {
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

    cart.items.splice(itemIndex, 1);
    await cart.save();

    const totals = calculateCartTotals(cart.items);

    return NextResponse.json({
      success: true,
      message: "Item removed from cart",

      items: cart.items,

      summary: {
        totalItems: totals.totalItems,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        grandTotal: totals.grandTotal,
      },
    });
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
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
