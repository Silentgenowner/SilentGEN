import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Cart from "@/models/Cart";
import Product from "@/models/Product";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  try {

    await connectDB();

    // ============================
    // TOKEN
    // ============================

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

    // ============================
    // VERIFY TOKEN
    // ============================

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

    // ============================
    // LOAD CART
    // ============================

    const cart =
      await Cart.findOne({
        userId,
      }).populate({
        path: "items.productId",
        select: `
          name
          thumbnail
          images
          price
          stock
          status
          sizes
          colors
        `,
      });

    if (!cart) {

      return NextResponse.json({
        success: true,
        items: [],
        totalItems: 0,
        subtotal: 0,
      });

    }

    const items: any[] = [];

    let subtotal = 0;
    let totalItems = 0;
        let cartChanged = false;

    for (const item of cart.items) {

      const product: any = item.productId;

      // ============================
      // PRODUCT EXISTS ?
      // ============================

      if (!product) {
        cartChanged = true;
        continue;
      }

      // ============================
      // PRODUCT STATUS CHECK
      // ============================

      if (
        product.status === "Draft" ||
        product.status === "Archived"
      ) {
        cartChanged = true;
        continue;
      }

      // ============================
      // SIZE VALIDATION
      // ============================

      if (
        item.size &&
        product.sizes?.length > 0 &&
        !product.sizes.includes(item.size)
      ) {
        cartChanged = true;
        continue;
      }

      // ============================
      // COLOR VALIDATION
      // ============================

      if (
        item.color &&
        product.colors?.length > 0 &&
        !product.colors.includes(item.color)
      ) {
        cartChanged = true;
        continue;
      }

      // ============================
      // QUANTITY VALIDATION
      // ============================

      let quantity = item.quantity;

      if (quantity < 1) {
        quantity = 1;
        cartChanged = true;
      }

      // ============================
      // STOCK VALIDATION
      // ============================

      if (product.stock <= 0) {
        cartChanged = true;
        continue;
      }

      if (quantity > product.stock) {
        quantity = product.stock;
        cartChanged = true;
      }

      // ============================
      // ALWAYS USE LATEST PRODUCT DATA
      // ============================

      const latestPrice = product.price;

      const latestImage =
        product.thumbnail ||
        product.images?.[0] ||
        "/images/no-image.png";

      subtotal += latestPrice * quantity;
      totalItems += quantity;

      items.push({

        productId: product._id,

        name: product.name,

        image: latestImage,

        price: latestPrice,

        quantity,

        size: item.size || "",

        color: item.color || "",

        stock: product.stock,

        availableSizes: product.sizes || [],

        availableColors: product.colors || [],

      });

    }
        // =====================================
    // SAVE CLEANED CART (optional sync)
    // =====================================

    if (cartChanged) {

      cart.items = items.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));

      await cart.save();

    }

    // =====================================
    // SUCCESS RESPONSE
    // =====================================

    return NextResponse.json(
      {
        success: true,

        items,

        totalItems,

        subtotal,

        message: "Cart loaded successfully",
      },
      {
        status: 200,
      }
    );

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
          "Failed to load cart",
      },
      {
        status: 500,
      }
    );

  }

}
