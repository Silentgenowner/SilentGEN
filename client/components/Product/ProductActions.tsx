"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useCart,
} from "@/context/CartContext";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  productId: string;

  stock: number;

  sizes: string[];

  colors: string[];

  /*
  |--------------------------------------------------------------------------
  | CONTROLLED COLOR SUPPORT
  |--------------------------------------------------------------------------
  */

  selectedColor?: string;

  onColorChange?: (
    color: string
  ) => void;
};

/*
|--------------------------------------------------------------------------
| PRODUCT ACTIONS
|--------------------------------------------------------------------------
*/

export default function ProductActions({
  productId,

  stock,

  sizes = [],

  colors = [],

  selectedColor:
    controlledSelectedColor,

  onColorChange,
}: Props) {
  const router =
    useRouter();

  const {
    addToCart:
      addCartItem,
  } = useCart();

  /*
  |--------------------------------------------------------------------------
  | CLEAN SIZES
  |--------------------------------------------------------------------------
  */

  const safeSizes =
    useMemo(() => {
      if (
        !Array.isArray(sizes)
      ) {
        return [];
      }

      return Array.from(
        new Set(
          sizes
            .map((size) =>
              String(
                size ?? ""
              ).trim()
            )
            .filter(Boolean)
        )
      );
    }, [sizes]);

  /*
  |--------------------------------------------------------------------------
  | CLEAN COLORS
  |--------------------------------------------------------------------------
  */

  const safeColors =
    useMemo(() => {
      if (
        !Array.isArray(colors)
      ) {
        return [];
      }

      return Array.from(
        new Set(
          colors
            .map((color) =>
              String(
                color ?? ""
              ).trim()
            )
            .filter(Boolean)
        )
      );
    }, [colors]);

  /*
  |--------------------------------------------------------------------------
  | SIZE
  |--------------------------------------------------------------------------
  */

  const [
    selectedSize,
    setSelectedSize,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | INTERNAL COLOR
  |--------------------------------------------------------------------------
  */

  const [
    internalSelectedColor,
    setInternalSelectedColor,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | QUANTITY
  |--------------------------------------------------------------------------
  */

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  const [
    error,
    setError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | SUCCESS
  |--------------------------------------------------------------------------
  */

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | CONTROLLED COLOR MODE
  |--------------------------------------------------------------------------
  |
  | Important:
  |
  | onColorChange exists = parent controls product color.
  |
  */

  const isColorControlled =
    typeof onColorChange ===
    "function";

  /*
  |--------------------------------------------------------------------------
  | SELECTED COLOR
  |--------------------------------------------------------------------------
  */

  const selectedColor =
    isColorControlled
      ? String(
          controlledSelectedColor ??
            ""
        ).trim()
      : internalSelectedColor;

  /*
  |--------------------------------------------------------------------------
  | REQUIREMENTS
  |--------------------------------------------------------------------------
  */

  const requiresSize =
    safeSizes.length > 0;

  const requiresColor =
    safeColors.length > 0;

  /*
  |--------------------------------------------------------------------------
  | AUTO SELECT FIRST SIZE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      safeSizes.length ===
      0
    ) {
      setSelectedSize("");

      return;
    }

    const selectedStillExists =
      safeSizes.some(
        (size) =>
          size ===
          selectedSize
      );

    if (
      !selectedSize ||
      !selectedStillExists
    ) {
      setSelectedSize(
        safeSizes[0] || ""
      );
    }
  }, [
    safeSizes,
    selectedSize,
  ]);

  /*
  |--------------------------------------------------------------------------
  | AUTO SELECT FIRST COLOR
  |--------------------------------------------------------------------------
  |
  | This fixes disabled Add To Cart.
  |
  */

  useEffect(() => {
    if (
      safeColors.length ===
      0
    ) {
      if (
        isColorControlled
      ) {
        if (
          selectedColor
        ) {
          onColorChange?.("");
        }
      } else {
        setInternalSelectedColor(
          ""
        );
      }

      return;
    }

    const selectedStillExists =
      safeColors.some(
        (color) =>
          color
            .trim()
            .toLowerCase() ===
          selectedColor
            .trim()
            .toLowerCase()
      );

    if (
      selectedColor &&
      selectedStillExists
    ) {
      return;
    }

    const firstColor =
      safeColors[0] || "";

    if (
      isColorControlled
    ) {
      onColorChange?.(
        firstColor
      );
    } else {
      setInternalSelectedColor(
        firstColor
      );
    }
  }, [
    safeColors,
    selectedColor,
    isColorControlled,
    onColorChange,
  ]);

  /*
  |--------------------------------------------------------------------------
  | KEEP QUANTITY SAFE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (stock <= 0) {
      setQuantity(1);

      return;
    }

    setQuantity(
      (current) =>
        Math.min(
          Math.max(
            current,
            1
          ),
          stock
        )
    );
  }, [stock]);

  /*
  |--------------------------------------------------------------------------
  | SELECTION READY
  |--------------------------------------------------------------------------
  */

  const selectionReady =
    useMemo(() => {
      const sizeReady =
        requiresSize
          ? Boolean(
              selectedSize
            )
          : true;

      const colorReady =
        requiresColor
          ? Boolean(
              selectedColor
            )
          : true;

      return (
        sizeReady &&
        colorReady
      );
    }, [
      requiresSize,
      requiresColor,
      selectedSize,
      selectedColor,
    ]);

  /*
  |--------------------------------------------------------------------------
  | COLOR SELECT
  |--------------------------------------------------------------------------
  */

  function handleColorSelect(
    color: string
  ) {
    const cleanColor =
      String(
        color ?? ""
      ).trim();

    setError("");

    setSuccessMessage(
      ""
    );

    if (
      isColorControlled
    ) {
      onColorChange?.(
        cleanColor
      );

      return;
    }

    setInternalSelectedColor(
      cleanColor
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ADD TO CART
  |--------------------------------------------------------------------------
  */

  async function handleAddToCart(): Promise<boolean> {
    if (stock <= 0) {
      setError(
        "This product is out of stock."
      );

      return false;
    }

    if (
      requiresSize &&
      !selectedSize
    ) {
      setError(
        "Please select a size."
      );

      return false;
    }

    if (
      requiresColor &&
      !selectedColor
    ) {
      setError(
        "Please select a colour."
      );

      return false;
    }

    if (!selectionReady) {
      setError(
        "Please select the required options."
      );

      return false;
    }

    try {
      setLoading(true);

      setError("");

      setSuccessMessage(
        ""
      );

      const success =
        await addCartItem(
          productId,
          quantity,
          selectedSize,
          selectedColor
        );

      if (!success) {
        router.push(
          "/login"
        );

        return false;
      }

      setSuccessMessage(
        "Product added to cart."
      );

      return true;
    } catch (error) {
      console.error(
        "ADD TO CART ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while adding this item."
      );

      return false;
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | BUY NOW
  |--------------------------------------------------------------------------
  */

  async function handleBuyNow() {
    const success =
      await handleAddToCart();

    if (success) {
      router.push(
        "/cart"
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DECREASE QUANTITY
  |--------------------------------------------------------------------------
  */

  function decreaseQuantity() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1
        )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | INCREASE QUANTITY
  |--------------------------------------------------------------------------
  */

  function increaseQuantity() {
    if (stock <= 0) {
      return;
    }

    setQuantity(
      (current) =>
        Math.min(
          stock,
          current + 1
        )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/*
      |--------------------------------------------------------------------------
      | SIZE
      |--------------------------------------------------------------------------
      */}

      {requiresSize && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="font-semibold text-gray-900">
              Size
            </p>

            {selectedSize && (
              <span className="text-sm text-gray-500">
                Selected:{" "}
                <strong className="text-gray-900">
                  {
                    selectedSize
                  }
                </strong>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {safeSizes.map(
              (size) => {
                const active =
                  selectedSize ===
                  size;

                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={
                      active
                    }
                    onClick={() => {
                      setSelectedSize(
                        size
                      );

                      setError(
                        ""
                      );

                      setSuccessMessage(
                        ""
                      );
                    }}
                    disabled={
                      loading ||
                      stock <= 0
                    }
                    className={`
                      min-w-12
                      rounded-full
                      border
                      px-4
                      py-2
                      text-sm
                      font-medium
                      transition

                      ${
                        active
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-gray-800 hover:border-black"
                      }

                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    `}
                  >
                    {size}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | COLOR
      |--------------------------------------------------------------------------
      */}

      {requiresColor && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="font-semibold text-gray-900">
              Colour
            </p>

            {selectedColor && (
              <span className="text-sm text-gray-500">
                Selected:{" "}
                <strong className="text-gray-900">
                  {
                    selectedColor
                  }
                </strong>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {safeColors.map(
              (color) => {
                const active =
                  selectedColor
                    .trim()
                    .toLowerCase() ===
                  color
                    .trim()
                    .toLowerCase();

                return (
                  <button
                    key={color}
                    type="button"
                    aria-pressed={
                      active
                    }
                    onClick={() =>
                      handleColorSelect(
                        color
                      )
                    }
                    disabled={
                      loading ||
                      stock <= 0
                    }
                    className={`
                      rounded-full
                      border
                      px-4
                      py-2
                      text-sm
                      font-medium
                      transition

                      ${
                        active
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-gray-800 hover:border-black"
                      }

                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    `}
                  >
                    {color}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | QUANTITY
      |--------------------------------------------------------------------------
      */}

      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="font-semibold text-gray-900">
            Quantity
          </p>

          {stock > 0 && (
            <span className="text-sm text-gray-500">
              {stock} available
            </span>
          )}
        </div>

        <div className="flex w-fit items-center overflow-hidden rounded-full border border-gray-300 bg-white">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={
              decreaseQuantity
            }
            disabled={
              quantity <= 1 ||
              loading ||
              stock <= 0
            }
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              text-lg
              font-medium
              transition
              hover:bg-gray-100
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            −
          </button>

          <div className="flex h-11 min-w-12 items-center justify-center border-x border-gray-200 px-3 text-center text-sm font-semibold text-gray-900">
            {quantity}
          </div>

          <button
            type="button"
            aria-label="Increase quantity"
            onClick={
              increaseQuantity
            }
            disabled={
              stock <= 0 ||
              quantity >= stock ||
              loading
            }
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              text-lg
              font-medium
              transition
              hover:bg-gray-100
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            +
          </button>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-600">
            {error}
          </p>
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-700">
            {
              successMessage
            }
          </p>
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | ACTION BUTTONS
      |--------------------------------------------------------------------------
      */}

      {stock > 0 ? (
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              void handleAddToCart();
            }}
            disabled={
              loading ||
              !selectionReady
            }
            className="
              w-full
              rounded-full
              bg-black
              px-6
              py-3.5
              font-semibold
              text-white
              transition
              hover:bg-gray-800
              disabled:cursor-not-allowed
              disabled:bg-gray-300
              disabled:text-gray-500
            "
          >
            {loading
              ? "Adding..."
              : "Add To Cart"}
          </button>

          <button
            type="button"
            onClick={() => {
              void handleBuyNow();
            }}
            disabled={
              loading ||
              !selectionReady
            }
            className="
              w-full
              rounded-full
              border
              border-black
              bg-white
              px-6
              py-3.5
              font-semibold
              text-black
              transition
              hover:bg-black
              hover:text-white
              disabled:cursor-not-allowed
              disabled:border-gray-300
              disabled:bg-gray-100
              disabled:text-gray-400
            "
          >
            {loading
              ? "Please Wait..."
              : "Buy Now"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled
          className="
            w-full
            cursor-not-allowed
            rounded-full
            bg-gray-300
            px-6
            py-3.5
            font-semibold
            text-gray-600
          "
        >
          Out Of Stock
        </button>
      )}
    </div>
  );
}