import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import Cart from "@/models/Cart";
import Order from "@/models/Order";

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

    const { addressId, paymentMethod } = await req.json();

    const cart = await Cart.findOne({
      userId: decoded.id,
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart is Empty",
        },
        {
          status: 400,
        }
      );
    }

    const totalAmount = cart.items.reduce(
      (total: number, item: any) =>
        total + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      userId: decoded.id,
      items: cart.items,
      totalAmount,
      addressId,
      paymentMethod: paymentMethod || "COD",
      paymentStatus:
        paymentMethod === "ONLINE"
          ? "Pending"
          : "Pending",
      orderStatus: "Placed",
    });

    cart.items = [];

    await cart.save();

    return NextResponse.json({
      success: true,
      message: "Order Placed Successfully",
      order,
    });

  } catch (error) {

    console.error(
      "PLACE ORDER ERROR:",
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
