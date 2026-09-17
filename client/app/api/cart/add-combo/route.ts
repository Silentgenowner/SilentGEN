import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import connectDB from "@/lib/connectDB";
import Cart from "@/models/Cart";
import { ComboOffer } from "@/models/ComboOffer";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET;

type ProductSelection = {
  productId: string;
  size: string;
  color: string;
};

const fail = (
  message: string,
  status: number
) =>
  NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
    }
  );

function isCurrentCombo(combo: {
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
}) {
  const now = new Date();

  return (
    combo.isActive &&
    (!combo.startsAt || combo.startsAt <= now) &&
    (!combo.endsAt || combo.endsAt >= now)
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    if (!JWT_SECRET) {
      return fail(
        "Server configuration error.",
        500
      );
    }

    const token =
      request.cookies.get("token")?.value;

    if (!token) {
      return fail(
        "Please login first.",
        401
      );
    }

    let decoded: {
      id?: string;
    };

    try {
      decoded = jwt.verify(
        token,
        JWT_SECRET
      ) as {
        id?: string;
      };
    } catch {
      return fail(
        "Please login first.",
        401
      );
    }

    if (!decoded.id) {
      return fail(
        "Invalid authentication token.",
        401
      );
    }

    const body = await request.json();

    const comboId =
      typeof body?.comboId === "string"
        ? body.comboId.trim()
        : "";

    const quantity = Number(
      body?.quantity ?? 1
    );

    const selections: ProductSelection[] =
      Array.isArray(body?.selections)
        ? body.selections.map(
            (
              selection: unknown
            ): ProductSelection => {
              const item = selection as {
                productId?: unknown;
                size?: unknown;
                color?: unknown;
              };

              return {
                productId:
                  typeof item.productId ===
                  "string"
                    ? item.productId.trim()
                    : "",

                size:
                  typeof item.size === "string"
                    ? item.size.trim()
                    : "",

                color:
                  typeof item.color === "string"
                    ? item.color.trim()
                    : "",
              };
            }
          )
        : [];

    if (
      !Types.ObjectId.isValid(comboId) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    ) {
      return fail(
        "Invalid combo request.",
        400
      );
    }

    await connectDB();

    const user = await User.findById(
      decoded.id
    ).select("_id");

    if (!user) {
      return fail(
        "User not found.",
        404
      );
    }

    const combo =
      await ComboOffer.findById(comboId)
        .populate(
          "products",
          "sku name brand category thumbnail price stock status sizes colors"
        );

    if (!combo || !isCurrentCombo(combo)) {
      return fail(
        "This combo offer is no longer available.",
        400
      );
    }

    if (
      combo.products.length !== 2 ||
      selections.length !== 2
    ) {
      return fail(
        "Select variants for both combo products.",
        400
      );
    }

    const selectedById = new Map<
      string,
      Pick<ProductSelection, "size" | "color">
    >(
      selections.map((selection) => [
        selection.productId,
        {
          size: selection.size,
          color: selection.color,
        },
      ])
    );

    const comboProductIds =
      combo.products.map(
        (product: any) =>
          String(product._id)
      );

    if (
      selectedById.size !== 2 ||
      comboProductIds.some(
        (id: string) =>
          !selectedById.has(id)
      )
    ) {
      return fail(
        "Selected products do not match this combo.",
        400
      );
    }

    const originalPrice =
      combo.products.reduce(
        (
          total: number,
          product: any
        ) =>
          total +
          Number(product.price || 0),
        0
      );

    if (
      originalPrice <= 0 ||
      Number(combo.comboPrice) >
        originalPrice
    ) {
      return fail(
        "Invalid combo pricing.",
        400
      );
    }

    const comboPaise = Math.round(
      Number(combo.comboPrice) * 100
    );

    const firstProductPaise = Math.round(
      (Number(combo.products[0].price || 0) /
        originalPrice) *
        comboPaise
    );

    const prices = [
      firstProductPaise / 100,
      (comboPaise - firstProductPaise) /
        100,
    ];

    const lines = combo.products.map(
      (
        product: any,
        index: number
      ) => {
        const selection =
          selectedById.get(
            String(product._id)
          );

        if (!selection) {
          throw new Error(
            "Product selection is missing."
          );
        }

        const sizes = Array.isArray(
          product.sizes
        )
          ? product.sizes.map(String)
          : [];

        const colors = Array.isArray(
          product.colors
        )
          ? product.colors.map(String)
          : [];

        if (
          product.status !== "Active" ||
          Number(product.stock) < quantity
        ) {
          throw new Error(
            `${product.name} is unavailable or does not have enough stock.`
          );
        }

        if (
          sizes.length > 0 &&
          !sizes.includes(selection.size)
        ) {
          throw new Error(
            `Select a valid size for ${product.name}.`
          );
        }

        if (
          colors.length > 0 &&
          !colors.includes(selection.color)
        ) {
          throw new Error(
            `Select a valid colour for ${product.name}.`
          );
        }

        return {
          productId: product._id,

          sku: product.sku || "",

          name: product.name || "",

          brand: product.brand || "",

          category: product.category || "",

          image: product.thumbnail || "",

          price: prices[index],

          stock: Number(product.stock) || 0,

          status: product.status,

          quantity,

          size: selection.size,

          color: selection.color,

          comboId: String(combo._id),

          comboName: combo.name,
        };
      }
    );

    let cart = await Cart.findOne({
      userId: user._id,
    });

    if (!cart) {
      cart = await Cart.create({
        userId: user._id,
        items: [],
      });
    }

    for (const line of lines) {
      const existing = cart.items.find(
        (item: any) =>
          String(item.productId) ===
            String(line.productId) &&
          item.size === line.size &&
          item.color === line.color &&
          item.comboId === line.comboId
      );

      if (existing) {
        if (
          existing.quantity + quantity >
          line.stock
        ) {
          return fail(
            `Only ${line.stock} item(s) available for ${line.name}.`,
            400
          );
        }

        existing.quantity += quantity;
        existing.price = line.price;
      } else {
        cart.items.push(line);
      }
    }

    await cart.save();

    return NextResponse.json(
      {
        success: true,
        message: "Combo added to cart.",
        cart,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Unable to add combo to cart.",
      400
    );
  }
}