"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Minus, Plus, ShoppingCart, Truck, ShieldCheck } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;

  product: {
    _id: string;
    name: string;
    category?: string;

    image: string;

    price: number;
    mrp: number;

    rating?: number;
    discount?: number;

    stock: number;

    sizes?: string[];
    colors?: string[];

    bestSeller?: boolean;
    featured?: boolean;
    newArrival?: boolean;
    trending?: boolean;
  };

  onAddToCart: (
    quantity: number,
    size: string,
    color: string
  ) => Promise<void>;
};

export default function ProductVariantModal({
  open,
  onClose,
  product,
  onAddToCart,
}: Props) {
  const [selectedSize, setSelectedSize] = useState("");

  const [selectedColor, setSelectedColor] = useState("");

  const [qty, setQty] = useState(1);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setQty(1);
    setSelectedSize("");
    setSelectedColor("");

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKey);
    }

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  const stockText = useMemo(() => {
    if (product.stock <= 0) {
      return {
        text: "Out Of Stock",
        color: "text-red-600",
      };
    }

    if (product.stock <= 5) {
      return {
        text: `Only ${product.stock} Left`,
        color: "text-orange-600",
      };
    }

    return {
      text: "In Stock",
      color: "text-green-600",
    };
  }, [product.stock]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold">
            Select Variant
          </h2>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 p-6">

          <div className="relative w-full aspect-square rounded-xl overflow-hidden border">

            <Image
              src={product.image || "/images/no-image.png"}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />

          </div>

          <div>

            <p className="text-sm text-gray-500">
              {product.category}
            </p>

            <h2 className="text-2xl font-bold mt-2">
              {product.name}
            </h2>

            <div className="flex items-center gap-3 mt-4">

              <span className="text-3xl font-bold">
                ₹{product.price}
              </span>

              <span className="line-through text-gray-400">
                ₹{product.mrp}
              </span>

              {(product.discount ?? 0) > 0 && (
                <span className="text-green-600 font-semibold">
                  {product.discount}% OFF
                </span>
              )}

            </div>

            <div className="mt-3">

              <span className={`font-semibold ${stockText.color}`}>
                {stockText.text}
              </span>

            </div>

            <div className="flex flex-wrap gap-2 mt-5">

              {product.bestSeller && (
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-sm">
                  Bestseller
                </span>
              )}

              {product.newArrival && (
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm">
                  New
                </span>
              )}

              {product.featured && (
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-sm">
                  Featured
                </span>
              )}

              {product.trending && (
                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-sm">
                  Trending
                </span>
              )}

            </div>
                        {/* Size Selection */}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-8">

                <h3 className="font-semibold mb-3">
                  Select Size
                </h3>

                <div className="flex flex-wrap gap-3">

                  {product.sizes.map((size) => {

                    const active =
                      selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          setSelectedSize(size)
                        }
                        className={`min-w-[52px] h-12 rounded-lg border font-medium transition
                        ${
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white hover:border-black"
                        }`}
                      >
                        {size}
                      </button>
                    );

                  })}

                </div>

              </div>
            )}

            {/* Color Selection */}

            {product.colors && product.colors.length > 0 && (
              <div className="mt-8">

                <h3 className="font-semibold mb-3">
                  Select Color
                </h3>

                <div className="flex flex-wrap gap-3">

                  {product.colors.map((color) => {

                    const active =
                      selectedColor === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setSelectedColor(color)
                        }
                        className={`px-4 h-11 rounded-lg border transition
                        ${
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white hover:border-black"
                        }`}
                      >
                        {color}
                      </button>
                    );

                  })}

                </div>

              </div>
            )}

            {/* Quantity */}

            <div className="mt-8">

              <h3 className="font-semibold mb-3">
                Quantity
              </h3>

              <div className="flex items-center gap-4">

                <button
                  type="button"
                  disabled={qty <= 1}
                  onClick={() =>
                    setQty((prev) =>
                      Math.max(1, prev - 1)
                    )
                  }
                  className="w-11 h-11 rounded-lg border flex items-center justify-center disabled:opacity-40"
                >
                  <Minus size={18} />
                </button>

                <span className="text-xl font-bold min-w-[40px] text-center">
                  {qty}
                </span>

                <button
                  type="button"
                  disabled={
                    qty >= product.stock
                  }
                  onClick={() =>
                    setQty((prev) =>
                      Math.min(
                        product.stock,
                        prev + 1
                      )
                    )
                  }
                  className="w-11 h-11 rounded-lg border flex items-center justify-center disabled:opacity-40"
                >
                  <Plus size={18} />
                </button>

              </div>

            </div>

            {/* Information */}

            <div className="mt-8 space-y-3 rounded-xl border p-4 bg-gray-50">

              <div className="flex items-center gap-3">

                <Truck
                  size={20}
                  className="text-green-600"
                />

                <span className="text-sm">
                  Estimated Delivery :
                  <b> 2–5 Days</b>
                </span>

              </div>

              <div className="flex items-center gap-3">

                <ShoppingCart
                  size={20}
                  className="text-blue-600"
                />

                <span className="text-sm">
                  Cash On Delivery Available
                </span>

              </div>

              <div className="flex items-center gap-3">

                <ShieldCheck
                  size={20}
                  className="text-purple-600"
                />

                <span className="text-sm">
                  Secure Checkout & Easy Returns
                </span>

              </div>

            </div>
                        {/* Validation Message */}

            {product.stock <= 0 && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-600">
                  This product is currently out of stock.
                </p>
              </div>
            )}

            {product.stock > 0 && (
              <div className="mt-6 space-y-2">

                {product.sizes &&
                  product.sizes.length > 0 &&
                  !selectedSize && (
                    <p className="text-sm text-red-600">
                      * Please select a size
                    </p>
                  )}

                {product.colors &&
                  product.colors.length > 0 &&
                  !selectedColor && (
                    <p className="text-sm text-red-600">
                      * Please select a color
                    </p>
                  )}

              </div>
            )}

          </div>
        </div>

        {/* Footer */}

        <div className="border-t p-6">

          <div className="flex flex-col md:flex-row gap-4">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border rounded-xl py-3 font-semibold hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                loading ||
                product.stock <= 0
              }
              onClick={async () => {

                if (
                  product.sizes &&
                  product.sizes.length > 0 &&
                  !selectedSize
                ) {
                  alert("Please select size");
                  return;
                }

                if (
                  product.colors &&
                  product.colors.length > 0 &&
                  !selectedColor
                ) {
                  alert("Please select color");
                  return;
                }

                try {

                  setLoading(true);

                  await onAddToCart(
                    qty,
                    selectedSize,
                    selectedColor
                  );

                  onClose();

                } catch (error) {

                  console.error(error);

                  alert("Unable to add product to cart.");

                } finally {

                  setLoading(false);

                }

              }}
              className="flex-1 bg-black text-white rounded-xl py-3 font-semibold hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >

              {loading
                ? "Adding..."
                : "Add To Cart"}

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}
