import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Cart from "@/models/Cart";
import Product from "@/models/Product";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function PATCH(req: NextRequest) {

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

    }
    catch {

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
      action,
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

    if (
      action !== "increase" &&
      action !== "decrease"
    ) {

      return NextResponse.json(
        {
          success: false,
          message: "Invalid action",
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

    const item =
      cart.items.find(
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
        // =====================================
    // LOAD PRODUCT
    // =====================================

    const product = await Product.findById(productId).select(
      `
      name
      price
      stock
      status
      sizes
      colors
      `
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

    // =====================================
    // PRODUCT STATUS
    // =====================================

    if (
      product.status === "Draft" ||
      product.status === "Archived"
    ) {

      return NextResponse.json(
        {
          success: false,
          message: "This product is not available",
        },
        {
          status: 400,
        }
      );

    }

    // =====================================
    // SIZE VALIDATION
    // =====================================

    if (
      size &&
      product.sizes.length > 0 &&
      !product.sizes.includes(size)
    ) {

      return NextResponse.json(
        {
          success: false,
          message: "Invalid size selected",
        },
        {
          status: 400,
        }
      );

    }

    // =====================================
    // COLOR VALIDATION
    // =====================================

    if (
      color &&
      product.colors.length > 0 &&
      !product.colors.includes(color)
    ) {

      return NextResponse.json(
        {
          success: false,
          message: "Invalid color selected",
        },
        {
          status: 400,
        }
      );

    }

    // =====================================
    // STOCK CHECK
    // =====================================

    if (product.stock <= 0) {

      return NextResponse.json(
        {
          success: false,
          message: "Product is out of stock",
        },
        {
          status: 400,
        }
      );

    }

    // =====================================
    // UPDATE QUANTITY
    // =====================================

    if (action === "increase") {

      if (item.quantity >= product.stock) {

        return NextResponse.json(
          {
            success: false,
            message: `Only ${product.stock} item(s) available`,
          },
          {
            status: 400,
          }
        );

      }

      item.quantity += 1;

    } else {

      if (item.quantity > 1) {

        item.quantity -= 1;

      } else {

        cart.items = cart.items.filter(
          (cartItem: any) =>
            !(
              cartItem.productId.toString() === productId &&
              (cartItem.size || "") === size &&
              (cartItem.color || "") === color
            )
        );

      }

    }

    // =====================================
    // KEEP CART DATA UPDATED
    // =====================================

    item.price = product.price;
    item.name = product.name;
        // =====================================
    // UPDATE IMAGE
    // =====================================

    item.image =
      product.thumbnail ||
      product.images?.[0] ||
      "/images/no-image.png";

    // =====================================
    // SAVE CART
    // =====================================

    await cart.save();

    // =====================================
    // CALCULATE TOTALS
    // =====================================

    let totalItems = 0;
    let subtotal = 0;

    for (const cartItem of cart.items) {

      totalItems += cartItem.quantity;

      subtotal +=
        cartItem.price *
        cartItem.quantity;

    }

    // =====================================
    // SUCCESS
    // =====================================

    return NextResponse.json(
      {
        success: true,

        message: "Cart updated successfully",

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
      "UPDATE CART ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Failed to update cart",
      },
      {
        status: 500,
      }
    );

  }

}
