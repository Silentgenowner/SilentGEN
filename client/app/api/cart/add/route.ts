import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
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

    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    const body = await req.json();

    const {
      productId,
      quantity = 1,
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

    const quantityValue = Number(quantity);

    if (!Number.isInteger(quantityValue) || quantityValue <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be a positive integer",
        },
        {
          status: 400,
        }
      );
    }

    const product = await Product.findById(productId);

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

    if (product.status !== "Active") {
      return NextResponse.json(
        {
          success: false,
          message: "Product is not available",
        },
        {
          status: 400,
        }
      );
    }

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

    const requiresSize = Array.isArray(product.sizes) && product.sizes.length > 0;
    const requiresColor = Array.isArray(product.colors) && product.colors.length > 0;

    if (requiresSize && !size) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a size",
        },
        {
          status: 400,
        }
      );
    }

    if (requiresColor && !color) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a color",
        },
        {
          status: 400,
        }
      );
    }

    if (
      size &&
      requiresSize &&
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

    if (
      color &&
      requiresColor &&
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

    let cart = await Cart.findOne({
      userId: user._id,
    });
        if (!cart) {
      cart = await Cart.create({
        userId: user._id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item: any) =>
        item.productId.toString() === productId &&
        (item.size || "") === (size || "") &&
        (item.color || "") === (color || "")
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantityValue;

      if (newQuantity > product.stock) {
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

      existingItem.quantity = newQuantity;

      existingItem.price = product.price;
      existingItem.stock = product.stock;
      existingItem.status = product.status;
      existingItem.image = product.thumbnail;
      existingItem.name = product.name;
      existingItem.brand = product.brand;
      existingItem.category = product.category;
      existingItem.sku = product.sku;
    } else {
      if (quantityValue > product.stock) {
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

      cart.items.push({
        productId: product._id,

        sku: product.sku,

        name: product.name,

        brand: product.brand,

        category: product.category,

        image: product.thumbnail,

        price: product.price,

        stock: product.stock,

        status: product.status,

        quantity: quantityValue,

        size,

        color,
      });
    }

    await cart.save();

    return NextResponse.json({
      success: true,
      message: "Product added to cart",
      cart,
    });
  } catch (error: any) {
    console.error(
      "ADD TO CART ERROR:",
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
