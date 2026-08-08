import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import { calculateCartTotals } from "@/lib/cartTotals";
import Cart from "@/models/Cart";
import Product from "@/models/Product";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

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

    let cart = await Cart.findOne({
      userId: decoded.id,
    });

    if (!cart) {
      cart = await Cart.create({
        userId: decoded.id,
        items: [],
      });
    }

    let cartUpdated = false;

    const items: any[] = [];

    for (const item of cart.items) {
      const product = await Product.findById(
        item.productId
      ).select(
        `
        sku
        name
        brand
        category
        thumbnail
        price
        stock
        status
        `
      );

      // Product deleted
      if (!product) {
        cartUpdated = true;
        continue;
      }

      // Product inactive
      if (product.status !== "Active") {
        cartUpdated = true;
        continue;
      }

      // Sync latest product data
      item.sku = product.sku;
      item.name = product.name;
      item.brand = product.brand;
      item.category = product.category;
      item.image = product.thumbnail;
      item.price = product.price;
      item.stock = product.stock;
      item.status = product.status;

      // Fix quantity
      if (item.quantity > product.stock) {
        item.quantity = product.stock;
        cartUpdated = true;
      }

      // Remove zero quantity / stock
      if (
        item.quantity <= 0 ||
        product.stock <= 0
      ) {
        cartUpdated = true;
        continue;
      }

      items.push({
        productId: product._id,

        sku: product.sku,

        name: product.name,

        brand: product.brand,

        category: product.category,

        image: product.thumbnail,

        price: product.price,

        stock: product.stock,

        status: product.status,

        quantity: item.quantity,

        size: item.size,

        color: item.color,

        total:
          product.price *
          item.quantity,
      });
    }
    // Remove invalid / inactive / out-of-stock items
    cart.items = cart.items.filter((cartItem: any) =>
      items.some(
        (item) =>
          item.productId.toString() ===
            cartItem.productId.toString() &&
          (item.size || "") ===
            (cartItem.size || "") &&
          (item.color || "") ===
            (cartItem.color || "")
      )
    );

    if (cartUpdated) {
      await cart.save();
    }

    const totals = calculateCartTotals(items);

    return NextResponse.json({
      success: true,

      items,

      summary: {
        totalItems: totals.totalItems,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        grandTotal: totals.grandTotal,
      },
    });
  } catch (error: any) {
    console.error(
      "GET CART ERROR:",
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
