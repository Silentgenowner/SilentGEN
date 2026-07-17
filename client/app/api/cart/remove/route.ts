import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import Cart from "@/models/Cart";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Please Login First",
        },
        {
          status: 401,
        }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
    };

    const { productId } = await req.json();

    const cart = await Cart.findOne({
      userId: decoded.id,
    });

    if (!cart) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart Not Found",
        },
        {
          status: 404,
        }
      );
    }

    cart.items = cart.items.filter(
      (item: any) => item.productId !== productId
    );

    await cart.save();

    return NextResponse.json({
      success: true,
      message: "Item Removed",
      cart,
    });

  } catch (error) {

    console.error(
      "REMOVE CART ERROR:",
      error
    );

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
