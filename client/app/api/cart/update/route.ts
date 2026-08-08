import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import { calculateCartTotals } from "@/lib/cartTotals";
import Cart from "@/models/Cart";
import Product from "@/models/Product";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function PATCH(req: NextRequest) {
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
      action,
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

    if (
      action !== "increase" &&
      action !== "decrease"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Action must be increase or decrease",
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

    const item = cart.items.find(
      (item: any) =>
        item.productId.toString() === productId &&
        (item.size || "") === size &&
        (item.color || "") === color
    );

    if (!item) {
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

    const product = await Product.findById(
      productId
    );

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      product.status !== "Active" ||
      product.stock <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product is unavailable",
        },
        {
          status: 400,
        }
      );
    }

    item.price = product.price;
    item.stock = product.stock;
    item.status = product.status;
    item.image = product.thumbnail;
    item.name = product.name;
    item.brand = product.brand;
    item.category = product.category;
    item.sku = product.sku;
    if (action === "increase") {
      if (item.quantity >= product.stock) {
        return NextResponse.json(
          {
            success: false,
            message: `Only ${product.stock} item(s) available in stock`,
          },
          {
            status: 400,
          }
        );
      }

      item.quantity += 1;
    } else {
      if (item.quantity <= 1) {
        cart.items = cart.items.filter(
          (cartItem: any) =>
            !(
              cartItem.productId.toString() === productId &&
              (cartItem.size || "") === size &&
              (cartItem.color || "") === color
            )
        );
      } else {
        item.quantity -= 1;
      }
    }

    await cart.save();

    const totals = calculateCartTotals(cart.items);

    return NextResponse.json({
      success: true,
      message: "Cart updated successfully",

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
      "UPDATE CART ERROR:",
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
