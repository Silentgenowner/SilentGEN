"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";

/*
|--------------------------------------------------------------------------
| CART ITEM TYPE
|--------------------------------------------------------------------------
*/

type CartItem = {
  productId:
    | string
    | {
        _id?: string;
      };

  sku?: string;
  name?: string;
  brand?: string;
  category?: string;
  image?: string;

  price?: number;
  stock?: number;
  status?: string;

  quantity: number;

  size?: string;
  color?: string;
};

/*
|--------------------------------------------------------------------------
| SAFE PRODUCT ID
|--------------------------------------------------------------------------
*/

function getProductId(
  productId: CartItem["productId"]
): string {
  if (typeof productId === "string") {
    return productId;
  }

  if (
    productId &&
    typeof productId === "object" &&
    "_id" in productId
  ) {
    return String(productId._id || "");
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| SAFE IMAGE
|--------------------------------------------------------------------------
*/

function getSafeImage(
  image?: string
): string {
  if (
    typeof image === "string" &&
    image.trim() !== ""
  ) {
    return image;
  }

  return "/images/no-image.png";
}

/*
|--------------------------------------------------------------------------
| CART PAGE
|--------------------------------------------------------------------------
*/

export default function CartPage() {
  const router = useRouter();

  const {
    cart,
    loading,
    summary,
    updateQuantity,
    removeFromCart,
    refreshCart,
  } = useCart();

  /*
  |--------------------------------------------------------------------------
  | ACTION STATE
  |--------------------------------------------------------------------------
  */

  const [actionKey, setActionKey] =
    useState<string>("");

  /*
  |--------------------------------------------------------------------------
  | ERROR STATE
  |--------------------------------------------------------------------------
  */

  const [pageError, setPageError] =
    useState<string>("");

  /*
  |--------------------------------------------------------------------------
  | SAFE CART
  |--------------------------------------------------------------------------
  */

  const cartItems = useMemo<CartItem[]>(
    () => {
      if (!Array.isArray(cart)) {
        return [];
      }

      return cart as CartItem[];
    },
    [cart]
  );

  /*
  |--------------------------------------------------------------------------
  | ITEM KEY
  |--------------------------------------------------------------------------
  */

  function getItemKey(
    item: CartItem
  ): string {
    const productId =
      getProductId(
        item.productId
      );

    return [
      productId,
      item.size || "",
      item.color || "",
    ].join("-");
  }

  /*
  |--------------------------------------------------------------------------
  | INCREASE QUANTITY
  |--------------------------------------------------------------------------
  */

  async function handleIncrease(
    item: CartItem
  ) {
    const productId =
      getProductId(
        item.productId
      );

    if (!productId) {
      setPageError(
        "Invalid product in cart."
      );

      return;
    }

    const key =
      getItemKey(item);

    try {
      setPageError("");
      setActionKey(key);

      await updateQuantity(
        productId,
        item.size || "",
        item.color || "",
        "increase"
      );
    } catch (error) {
      console.error(
        "CART INCREASE ERROR:",
        error
      );

      setPageError(
        "Unable to increase quantity."
      );
    } finally {
      setActionKey("");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DECREASE QUANTITY
  |--------------------------------------------------------------------------
  */

  async function handleDecrease(
    item: CartItem
  ) {
    const productId =
      getProductId(
        item.productId
      );

    if (!productId) {
      setPageError(
        "Invalid product in cart."
      );

      return;
    }

    const key =
      getItemKey(item);

    try {
      setPageError("");
      setActionKey(key);

      await updateQuantity(
        productId,
        item.size || "",
        item.color || "",
        "decrease"
      );
    } catch (error) {
      console.error(
        "CART DECREASE ERROR:",
        error
      );

      setPageError(
        "Unable to decrease quantity."
      );
    } finally {
      setActionKey("");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE ITEM
  |--------------------------------------------------------------------------
  */

  async function handleRemove(
    item: CartItem
  ) {
    const productId =
      getProductId(
        item.productId
      );

    if (!productId) {
      setPageError(
        "Invalid product in cart."
      );

      return;
    }

    const key =
      getItemKey(item);

    try {
      setPageError("");
      setActionKey(key);

      await removeFromCart(
        productId,
        item.size || "",
        item.color || ""
      );
    } catch (error) {
      console.error(
        "CART REMOVE ERROR:",
        error
      );

      setPageError(
        "Unable to remove item."
      );
    } finally {
      setActionKey("");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  async function handleRefresh() {
    try {
      setPageError("");

      await refreshCart();
    } catch (error) {
      console.error(
        "CART REFRESH ERROR:",
        error
      );

      setPageError(
        "Unable to refresh cart."
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CHECKOUT
  |--------------------------------------------------------------------------
  */

  function handleCheckout() {
    if (cartItems.length === 0) {
      return;
    }

    router.push("/checkout");
  }

  /*
  |--------------------------------------------------------------------------
  | PRICE
  |--------------------------------------------------------------------------
  */

  function formatPrice(
    value: number
  ): string {
    return Number(value || 0).toLocaleString(
      "en-IN"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TOTAL FROM CONTEXT
  |--------------------------------------------------------------------------
  */

  const subtotal =
    Number(
      summary?.subtotal || 0
    );

  const shipping =
    Number(
      summary?.shipping || 0
    );

  const grandTotal =
    Number(
      summary?.grandTotal || 0
    );

  const totalItems =
    Number(
      summary?.totalItems || 0
    );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="h-10 w-40 animate-pulse rounded bg-gray-200" />

            <div className="mt-3 h-5 w-64 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      h-48
                      animate-pulse
                      rounded-xl
                      bg-white
                    "
                  />
                )
              )}
            </div>

            <div
              className="
                h-80
                animate-pulse
                rounded-xl
                bg-white
              "
            />
          </div>
        </section>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EMPTY CART
  |--------------------------------------------------------------------------
  */

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gray-100">
        <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div
            className="
              w-full
              max-w-xl
              rounded-2xl
              bg-white
              px-6
              py-14
              text-center
              shadow-sm
            "
          >
            {/* ICON */}

            <div
              className="
                mx-auto
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-full
                bg-gray-100
              "
            >
              <span className="text-4xl">
                🛒
              </span>
            </div>

            {/* TITLE */}

            <h1
              className="
                mt-6
                text-3xl
                font-bold
                text-gray-900
              "
            >
              Your Cart is Empty
            </h1>

            {/* DESCRIPTION */}

            <p
              className="
                mx-auto
                mt-3
                max-w-md
                text-gray-500
              "
            >
              Looks like you haven't added
              anything to your cart yet.
              Start shopping and find
              something you love.
            </p>

            {/* BUTTON */}

            <Link
              href="/shop"
              className="
                mt-8
                inline-flex
                items-center
                justify-center
                rounded-lg
                bg-black
                px-7
                py-3
                font-semibold
                text-white
                transition
                hover:bg-gray-800
              "
            >
              Continue Shopping
            </Link>

            {/* REFRESH */}

            <button
              type="button"
              onClick={
                handleRefresh
              }
              className="
                mt-4
                block
                w-full
                text-sm
                text-gray-500
                underline
                transition
                hover:text-black
              "
            >
              Refresh Cart
            </button>
          </div>
        </section>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN CART PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-gray-100">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ================================================================
            HEADER
        ================================================================= */}

        <div
          className="
            mb-8
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <h1
              className="
                text-3xl
                font-bold
                text-gray-900
                sm:text-4xl
              "
            >
              Shopping Cart
            </h1>

            <p
              className="
                mt-2
                text-gray-500
              "
            >
              {totalItems}{" "}
              {totalItems === 1
                ? "item"
                : "items"}{" "}
              in your cart
            </p>
          </div>

          <Link
            href="/shop"
            className="
              inline-flex
              items-center
              justify-center
              rounded-lg
              border
              border-gray-300
              bg-white
              px-5
              py-2.5
              text-sm
              font-medium
              text-gray-800
              transition
              hover:border-black
              hover:bg-gray-50
            "
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* ================================================================
            ERROR
        ================================================================= */}

        {pageError && (
          <div
            className="
              mb-6
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-5
              py-4
              text-sm
              text-red-600
            "
          >
            {pageError}
          </div>
        )}

        {/* ================================================================
            CART + SUMMARY
        ================================================================= */}

        <div
          className="
            grid
            gap-8
            lg:grid-cols-3
          "
        >
          {/* ==============================================================
              CART ITEMS
          ============================================================== */}

          <div
            className="
              space-y-5
              lg:col-span-2
            "
          >
            {cartItems.map(
              (item) => {
                const productId =
                  getProductId(
                    item.productId
                  );

                const itemKey =
                  getItemKey(item);

                const itemImage =
                  getSafeImage(
                    item.image
                  );

                const itemPrice =
                  Number(
                    item.price || 0
                  );

                const quantity =
                  Number(
                    item.quantity || 0
                  );

                const itemTotal =
                  itemPrice *
                  quantity;

                const isUpdating =
                  actionKey ===
                  itemKey;

                const isOutOfStock =
                  Number(
                    item.stock || 0
                  ) <= 0;

                return (
                  <article
                    key={itemKey}
                    className="
                      overflow-hidden
                      rounded-xl
                      bg-white
                      shadow-sm
                    "
                  >
                    <div
                      className="
                        flex
                        flex-col
                        gap-5
                        p-5
                        sm:flex-row
                      "
                    >
                      {/* ==================================================
                          IMAGE
                      ================================================== */}

                      <Link
                        href={
                          productId
                            ? `/product/${productId}`
                            : "/shop"
                        }
                        className="
                          relative
                          block
                          h-40
                          w-full
                          flex-shrink-0
                          overflow-hidden
                          rounded-lg
                          bg-gray-100
                          sm:h-44
                          sm:w-36
                        "
                      >
                        <Image
                          src={
                            itemImage
                          }
                          alt={
                            item.name ||
                            "Product"
                          }
                          fill
                          sizes="
                            (max-width: 640px) 100vw,
                            144px
                          "
                          className="
                            object-cover
                            transition
                            duration-300
                            hover:scale-105
                          "
                          loading="eager"
                        />
                      </Link>

                      {/* ==================================================
                          DETAILS
                      ================================================== */}

                      <div
                        className="
                          flex
                          min-w-0
                          flex-1
                          flex-col
                        "
                      >
                        {/* BRAND */}

                        {item.brand && (
                          <p
                            className="
                              text-xs
                              font-medium
                              uppercase
                              tracking-wide
                              text-gray-400
                            "
                          >
                            {item.brand}
                          </p>
                        )}

                        {/* NAME */}

                        <Link
                          href={
                            productId
                              ? `/product/${productId}`
                              : "/shop"
                          }
                        >
                          <h2
                            className="
                              mt-1
                              line-clamp-2
                              text-lg
                              font-semibold
                              text-gray-900
                              transition
                              hover:text-gray-600
                            "
                          >
                            {item.name ||
                              "Product"}
                          </h2>
                        </Link>

                        {/* CATEGORY */}

                        {item.category && (
                          <p
                            className="
                              mt-1
                              text-sm
                              text-gray-500
                            "
                          >
                            {item.category}
                          </p>
                        )}

                        {/* SIZE + COLOR */}

                        <div
                          className="
                            mt-3
                            flex
                            flex-wrap
                            gap-2
                          "
                        >
                          {item.size && (
                            <span
                              className="
                                rounded-md
                                bg-gray-100
                                px-3
                                py-1.5
                                text-xs
                                font-medium
                                text-gray-700
                              "
                            >
                              Size:{" "}
                              {item.size}
                            </span>
                          )}

                          {item.color && (
                            <span
                              className="
                                rounded-md
                                bg-gray-100
                                px-3
                                py-1.5
                                text-xs
                                font-medium
                                text-gray-700
                              "
                            >
                              Color:{" "}
                              {item.color}
                            </span>
                          )}
                        </div>

                        {/* STOCK */}

                        <div className="mt-3">
                          {isOutOfStock ? (
                            <span
                              className="
                                text-xs
                                font-semibold
                                text-red-600
                              "
                            >
                              Out of Stock
                            </span>
                          ) : item.stock &&
                            item.stock <=
                              5 ? (
                            <span
                              className="
                                text-xs
                                font-semibold
                                text-orange-600
                              "
                            >
                              Only{" "}
                              {
                                item.stock
                              }{" "}
                              left
                            </span>
                          ) : (
                            <span
                              className="
                                text-xs
                                font-semibold
                                text-green-600
                              "
                            >
                              In Stock
                            </span>
                          )}
                        </div>

                        {/* PRICE + QUANTITY */}

                        <div
                          className="
                            mt-5
                            flex
                            flex-col
                            gap-4
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                          "
                        >
                          {/* PRICE */}

                          <div>
                            <p
                              className="
                                text-lg
                                font-bold
                                text-gray-900
                              "
                            >
                              ₹
                              {formatPrice(
                                itemPrice
                              )}
                            </p>

                            <p
                              className="
                                mt-0.5
                                text-xs
                                text-gray-400
                              "
                            >
                              per item
                            </p>
                          </div>

                          {/* QUANTITY */}

                          <div
                            className="
                              flex
                              items-center
                              gap-3
                            "
                          >
                            <span
                              className="
                                text-sm
                                font-medium
                                text-gray-600
                              "
                            >
                              Quantity
                            </span>

                            <div
                              className="
                                flex
                                items-center
                                overflow-hidden
                                rounded-lg
                                border
                                border-gray-300
                              "
                            >
                              {/* MINUS */}

                              <button
                                type="button"
                                disabled={
                                  isUpdating
                                }
                                onClick={() =>
                                  handleDecrease(
                                    item
                                  )
                                }
                                aria-label="Decrease quantity"
                                className="
                                  flex
                                  h-10
                                  w-10
                                  items-center
                                  justify-center
                                  bg-white
                                  text-lg
                                  font-semibold
                                  text-gray-700
                                  transition
                                  hover:bg-gray-100
                                  disabled:cursor-not-allowed
                                  disabled:opacity-50
                                "
                              >
                                −
                              </button>

                              {/* VALUE */}

                              <span
                                className="
                                  flex
                                  h-10
                                  min-w-12
                                  items-center
                                  justify-center
                                  border-x
                                  border-gray-300
                                  bg-gray-50
                                  px-3
                                  text-sm
                                  font-semibold
                                  text-gray-900
                                "
                              >
                                {isUpdating
                                  ? "..."
                                  : quantity}
                              </span>

                              {/* PLUS */}

                              <button
                                type="button"
                                disabled={
                                  isUpdating ||
                                  isOutOfStock ||
                                  (typeof item.stock ===
                                    "number" &&
                                    quantity >=
                                      item.stock)
                                }
                                onClick={() =>
                                  handleIncrease(
                                    item
                                  )
                                }
                                aria-label="Increase quantity"
                                className="
                                  flex
                                  h-10
                                  w-10
                                  items-center
                                  justify-center
                                  bg-white
                                  text-lg
                                  font-semibold
                                  text-gray-700
                                  transition
                                  hover:bg-gray-100
                                  disabled:cursor-not-allowed
                                  disabled:opacity-50
                                "
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* REMOVE */}

                        <button
                          type="button"
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            handleRemove(
                              item
                            )
                          }
                          className="
                            mt-4
                            w-fit
                            text-sm
                            font-medium
                            text-red-600
                            transition
                            hover:text-red-800
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          {isUpdating
                            ? "Updating..."
                            : "Remove"}
                        </button>
                      </div>

                      {/* ==================================================
                          ITEM TOTAL
                      ================================================== */}

                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-4
                          border-t
                          pt-4
                          sm:w-28
                          sm:flex-col
                          sm:items-end
                          sm:justify-start
                          sm:border-t-0
                          sm:pt-0
                        "
                      >
                        <span
                          className="
                            text-xs
                            text-gray-400
                          "
                        >
                          Item Total
                        </span>

                        <span
                          className="
                            text-lg
                            font-bold
                            text-gray-900
                          "
                        >
                          ₹
                          {formatPrice(
                            itemTotal
                          )}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>

          {/* ==============================================================
              ORDER SUMMARY
          ============================================================== */}

          <aside
            className="
              h-fit
              rounded-xl
              bg-white
              p-6
              shadow-sm
              lg:sticky
              lg:top-24
            "
          >
            <h2
              className="
                text-xl
                font-bold
                text-gray-900
              "
            >
              Order Summary
            </h2>

            {/* ==========================================================
                ITEMS
            ========================================================== */}

            <div
              className="
                mt-6
                space-y-4
                border-b
                border-gray-200
                pb-5
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-sm
                "
              >
                <span className="text-gray-500">
                  Items
                </span>

                <span className="font-medium text-gray-900">
                  {totalItems}
                </span>
              </div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-sm
                "
              >
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-medium text-gray-900">
                  ₹
                  {formatPrice(
                    subtotal
                  )}
                </span>
              </div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-sm
                "
              >
                <span className="text-gray-500">
                  Shipping
                </span>

                <span className="font-medium text-gray-900">
                  {shipping === 0
                    ? "FREE"
                    : `₹${formatPrice(
                        shipping
                      )}`}
                </span>
              </div>
            </div>

            {/* ==========================================================
                FREE SHIPPING MESSAGE
            ========================================================== */}

            {subtotal > 0 &&
              subtotal < 999 && (
                <div
                  className="
                    mt-5
                    rounded-lg
                    bg-gray-50
                    px-4
                    py-3
                    text-sm
                    text-gray-600
                  "
                >
                  Add ₹
                  {formatPrice(
                    999 - subtotal
                  )}{" "}
                  more to get
                  <strong className="ml-1 text-gray-900">
                    FREE shipping
                  </strong>
                  .
                </div>
              )}

            {subtotal >= 999 && (
              <div
                className="
                  mt-5
                  rounded-lg
                  bg-green-50
                  px-4
                  py-3
                  text-sm
                  font-medium
                  text-green-700
                "
              >
                🎉 You qualify for
                FREE shipping!
              </div>
            )}

            {/* ==========================================================
                GRAND TOTAL
            ========================================================== */}

            <div
              className="
                mt-6
                flex
                items-center
                justify-between
              "
            >
              <span
                className="
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                Total
              </span>

              <span
                className="
                  text-2xl
                  font-bold
                  text-gray-900
                "
              >
                ₹
                {formatPrice(
                  grandTotal
                )}
              </span>
            </div>

            {/* ==========================================================
                CHECKOUT
            ========================================================== */}

            <button
              type="button"
              onClick={
                handleCheckout
              }
              disabled={
                cartItems.length ===
                  0 ||
                grandTotal <= 0
              }
              className="
                mt-6
                w-full
                rounded-lg
                bg-black
                px-5
                py-3.5
                font-semibold
                text-white
                transition
                hover:bg-gray-800
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Proceed to Checkout
            </button>

            {/* ==========================================================
                PAYMENT NOTE
            ========================================================== */}

            <p
              className="
                mt-4
                text-center
                text-xs
                leading-5
                text-gray-400
              "
            >
              Secure checkout. Your
              order details will be
              confirmed before placing
              the order.
            </p>

            {/* ==========================================================
                REFRESH
            ========================================================== */}

            <button
              type="button"
              onClick={
                handleRefresh
              }
              className="
                mt-5
                w-full
                text-sm
                font-medium
                text-gray-500
                transition
                hover:text-black
              "
            >
              ↻ Refresh Cart
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}