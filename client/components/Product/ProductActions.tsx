"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

type Props = {
  productId: string;
  stock: number;
  sizes: string[];
  colors: string[];
};

export default function ProductActions({
  productId,
  stock,
  sizes,
  colors,
}: Props) {
  const router = useRouter();
  const { addToCart: addCartItem } = useCart();

  const [selectedSize, setSelectedSize] = useState(sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(colors?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requiresSize = sizes.length > 0;
  const requiresColor = colors.length > 0;

  const selectionReady = useMemo(() => {
    const sizeReady = requiresSize ? Boolean(selectedSize) : true;
    const colorReady = requiresColor ? Boolean(selectedColor) : true;
    return sizeReady && colorReady;
  }, [requiresColor, requiresSize, selectedColor, selectedSize]);

  async function handleAddToCart() {
    if (!selectionReady) {
      setError("Please select the required size and color before adding to cart.");
      return false;
    }

    try {
      setLoading(true);
      setError("");

      const success = await addCartItem(productId, quantity, selectedSize, selectedColor);

      if (!success) {
        router.push("/login");
        return false;
      }

      return true;
    } catch (error) {
      console.error("ADD TO CART ERROR", error);
      setError("Something went wrong while adding this item.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyNow() {
    const success = await handleAddToCart();

    if (success) {
      router.push("/cart");
    }
  }

  return (
    <div className="space-y-6">
      {requiresSize && (
        <div>
          <p className="mb-2 font-semibold">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selectedSize === size ? "border-black bg-black text-white" : "bg-white hover:border-black"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {requiresColor && (
        <div>
          <p className="mb-2 font-semibold">Colour</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selectedColor === color ? "border-black bg-black text-white" : "bg-white hover:border-black"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 font-semibold">Quantity</p>
        <div className="flex w-fit items-center rounded-full border">
          <button
            type="button"
            className="px-4 py-2"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <div className="w-12 text-center">{quantity}</div>
          <button
            type="button"
            className="px-4 py-2"
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
          >
            +
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {stock > 0 ? (
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              void handleAddToCart();
            }}
            disabled={loading || !selectionReady}
            className="w-full rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add To Cart"}
          </button>

          <button
            type="button"
            onClick={() => {
              void handleBuyNow();
            }}
            disabled={loading || !selectionReady}
            className="w-full rounded-full border border-black px-6 py-3 font-semibold transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Buy Now
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-full bg-gray-300 px-6 py-3 font-semibold text-gray-600"
        >
          Out Of Stock
        </button>
      )}
    </div>
  );
}
