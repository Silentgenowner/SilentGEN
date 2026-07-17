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

    const {
      productId,
      name,
      price,
    } = await req.json();

    let cart = await Cart.findOne({
      userId: decoded.id,
    });

    if (!cart) {
      cart = await Cart.create({
        userId: decoded.id,
        items: [
          {
            productId,
            name,
            price,
            quantity: 1,
          },
        ],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item: any) => item.productId === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push({
          productId,
          name,
          price,
          quantity: 1,
        });
      }

      await cart.save();
    }

    return NextResponse.json({
      success: true,
      message: "Added To Cart",
      cart,
    });

  } catch (error) {

    console.error(
      "ADD CART ERROR:",
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
