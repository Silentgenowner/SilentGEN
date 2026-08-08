"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const router = useRouter();

  const {
    cart,
    loading,
    updateQuantity,
    removeFromCart,
  } = useCart();

  function getProductId(productId: any): string {
    if (typeof productId === "string") {
      return productId;
    }

    if (productId?._id) {
      return productId._id;
    }

    return "";
  }

  const totalItems = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + (item.price || 0) * item.quantity,
      0
    );
  }, [cart]);

  const shipping = subtotal >= 999 ? 0 : 99;

  const grandTotal = subtotal + shipping;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">
          Loading Cart...
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">

        <Image
          src="/images/empty-cart.png"
          alt="Empty Cart"
          width={220}
          height={220}
          className="mb-8"
        />

        <h1 className="text-4xl font-bold">
          Your Cart is Empty
        </h1>

        <p className="text-gray-500 mt-3 text-center max-w-md">
          Looks like you haven't added anything to your cart yet.
          Start shopping and find something you'll love.
        </p>

        <Link
          href="/shop"
          className="
            mt-8
            bg-black
            text-white
            px-8
            py-4
            rounded-xl
            hover:bg-gray-800
            transition
          "
        >
          Continue Shopping
        </Link>

      </main>
    );
  }

  return (
    <main className="bg-gray-100 min-h-screen">

      <section className="max-w-7xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">

          <div>

            <h1 className="text-4xl font-bold">
              Shopping Cart
            </h1>

            <p className="text-gray-500 mt-2">
              {totalItems} Item{totalItems > 1 ? "s" : ""} in your cart
            </p>

          </div>

          <Link
            href="/shop"
            className="
              border
              border-black
              px-5
              py-3
              rounded-lg
              hover:bg-black
              hover:text-white
              transition
            "
          >
            Continue Shopping
          </Link>

        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">
            {cart.map((item, index) => {
              const productId = getProductId(item.productId);

              const itemTotal =
                (item.price || 0) * item.quantity;

              const stock =
                (item as any).stock ?? 9999;

              const isOutOfStock = stock <= 0;

              const isLowStock =
                stock > 0 && stock <= 5;

              return (
                <div
                  key={`${productId}-${item.size}-${item.color}-${index}`}
                  className="
                    bg-white
                    rounded-2xl
                    shadow-sm
                    hover:shadow-lg
                    transition
                    p-5
                  "
                >
                  <div className="flex flex-col md:flex-row gap-6">

                    <Link
                      href={`/product/${productId}`}
                      className="shrink-0"
                    >
                      <Image
                        src={
                          item.image ||
                          "/images/no-image.png"
                        }
                        alt={
                          item.name ||
                          "Product"
                        }
                        width={170}
                        height={170}
                        className="
                          rounded-xl
                          object-cover
                        "
                      />
                    </Link>

                    <div className="flex-1">

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <Link
                            href={`/product/${productId}`}
                          >
                            <h2
                              className="
                                text-2xl
                                font-bold
                                hover:text-gray-600
                                transition
                              "
                            >
                              {item.name}
                            </h2>
                          </Link>

                          <div className="mt-3 flex flex-wrap gap-2">

                            {item.size && (
                              <span
                                className="
                                  px-3
                                  py-1
                                  rounded-full
                                  bg-gray-100
                                  text-sm
                                "
                              >
                                Size : {item.size}
                              </span>
                            )}

                            {item.color && (
                              <span
                                className="
                                  px-3
                                  py-1
                                  rounded-full
                                  bg-gray-100
                                  text-sm
                                "
                              >
                                Color : {item.color}
                              </span>
                            )}

                          </div>

                        </div>

                        <div className="text-right">

                          <p
                            className="
                              text-2xl
                              font-bold
                            "
                          >
                            ₹{item.price}
                          </p>

                          <p
                            className="
                              text-sm
                              text-gray-500
                              mt-1
                            "
                          >
                            each
                          </p>

                        </div>

                      </div>

                      <div className="mt-5">
                        {isOutOfStock ? (
                          <span
                            className="
                              bg-red-100
                              text-red-600
                              px-3
                              py-1
                              rounded-full
                              text-sm
                              font-semibold
                            "
                          >
                            Out Of Stock
                          </span>
                        ) : isLowStock ? (
                          <span
                            className="
                              bg-orange-100
                              text-orange-600
                              px-3
                              py-1
                              rounded-full
                              text-sm
                              font-semibold
                            "
                          >
                            Only {stock} Left
                          </span>
                        ) : (
                          <span
                            className="
                              bg-green-100
                              text-green-600
                              px-3
                              py-1
                              rounded-full
                              text-sm
                              font-semibold
                            "
                          >
                            In Stock
                          </span>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                        <div
                          className="
                            flex
                            items-center
                            border
                            rounded-xl
                            overflow-hidden
                          "
                        >
                          <button
                            onClick={() =>
                              updateQuantity(
                                productId,
                                item.size || "",
                                item.color || "",
                                "decrease"
                              )
                            }
                            className="
                              w-12
                              h-12
                              bg-gray-100
                              hover:bg-gray-200
                              text-xl
                              font-bold
                              transition
                            "
                          >
                            −
                          </button>

                          <div
                            className="
                              w-14
                              text-center
                              font-bold
                              text-lg
                            "
                          >
                            {item.quantity}
                          </div>

                          <button
                            disabled={
                              isOutOfStock ||
                              item.quantity >= stock
                            }
                            onClick={() =>
                              updateQuantity(
                                productId,
                                item.size || "",
                                item.color || "",
                                "increase"
                              )
                            }
                            className="
                              w-12
                              h-12
                              bg-gray-100
                              hover:bg-gray-200
                              text-xl
                              font-bold
                              transition
                              disabled:opacity-40
                              disabled:cursor-not-allowed
                            "
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">

                          <p className="text-sm text-gray-500">
                            Item Total
                          </p>

                          <p
                            className="
                              text-2xl
                              font-bold
                            "
                          >
                            ₹{itemTotal}
                          </p>

                        </div>

                      </div>

                      <div
                        className="
                          mt-6
                          flex
                          flex-wrap
                          gap-3
                        "
                      >
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Remove this item from cart?"
                              )
                            ) {
                              removeFromCart(
                                productId,
                                item.size || "",
                                item.color || ""
                              );
                            }
                          }}
                          className="
                            bg-red-600
                            hover:bg-red-700
                            text-white
                            px-6
                            py-3
                            rounded-xl
                            transition
                          "
                        >
                          Remove Item
                        </button>

                        <Link
                          href={`/product/${productId}`}
                          className="
                            border
                            px-6
                            py-3
                            rounded-xl
                            hover:bg-gray-100
                            transition
                          "
                        >
                          View Product
                        </Link>

                      </div>

                    </div>

                  </div>

                </div>

              );

            })}
          </div>

          {/* ===========================
              ORDER SUMMARY
          =========================== */}

          <div className="lg:sticky lg:top-24 h-fit">

            <div className="bg-white rounded-2xl shadow-sm p-6">

              <h2 className="text-2xl font-bold">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Total Items
                  </span>

                  <span className="font-semibold">
                    {totalItems}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    ₹{subtotal}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Shipping
                  </span>

                  <span
                    className={
                      shipping === 0
                        ? "font-semibold text-green-600"
                        : "font-semibold"
                    }
                  >
                    {shipping === 0
                      ? "FREE"
                      : `₹${shipping}`}
                  </span>
                </div>

                <hr />

                <div className="flex justify-between text-xl font-bold">

                  <span>Grand Total</span>

                  <span>
                    ₹{grandTotal}
                  </span>

                </div>

              </div>

              {shipping > 0 ? (

                <div
                  className="
                    mt-6
                    rounded-xl
                    bg-yellow-50
                    border
                    border-yellow-200
                    p-4
                  "
                >

                  <p className="text-sm">

                    Add products worth

                    <span className="font-bold">
                      {" "}
                      ₹{999 - subtotal}
                    </span>

                    {" "}more to get

                    <span className="font-bold text-green-600">
                      {" "}FREE Shipping
                    </span>

                  </p>

                </div>

              ) : (

                <div
                  className="
                    mt-6
                    rounded-xl
                    bg-green-50
                    border
                    border-green-200
                    p-4
                  "
                >

                  <p className="text-green-700 font-medium">
                    🎉 Congratulations!
                    You unlocked FREE Shipping.
                  </p>

                </div>

              )}

              <button
                onClick={() =>
                  router.push("/checkout")
                }
                className="
                  w-full
                  mt-8
                  bg-black
                  hover:bg-gray-800
                  text-white
                  py-4
                  rounded-xl
                  transition
                  font-semibold
                  text-lg
                "
              >
                Proceed To Checkout
              </button>

              <Link
                href="/shop"
                className="
                  mt-4
                  block
                  text-center
                  border
                  rounded-xl
                  py-4
                  hover:bg-gray-100
                  transition
                "
              >
                Continue Shopping
              </Link>
              {/* ===========================
                  FUTURE READY SECTION
              =========================== */}

              <div className="mt-8 space-y-5">

                {/* Coupon */}

                <div className="border rounded-xl p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="font-semibold">
                        Coupon
                      </h3>

                      <p className="text-sm text-gray-500">
                        Coupon system will be available soon
                      </p>

                    </div>

                    <button
                      disabled
                      className="
                        px-4
                        py-2
                        rounded-lg
                        bg-gray-200
                        text-gray-500
                        cursor-not-allowed
                      "
                    >
                      Apply
                    </button>

                  </div>

                </div>

                {/* Estimated Delivery */}

                <div className="border rounded-xl p-4">

                  <h3 className="font-semibold">
                    Estimated Delivery
                  </h3>

                  <p className="text-sm text-gray-600 mt-2">
                    Delivery in
                    <span className="font-semibold">
                      {" "}3 - 5 Business Days
                    </span>
                  </p>

                </div>

                {/* Payment */}

                <div className="border rounded-xl p-4">

                  <h3 className="font-semibold">
                    Secure Checkout
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">

                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                      Cash On Delivery
                    </span>

                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                      Razorpay (Coming Soon)
                    </span>

                  </div>

                </div>

                {/* Future Modules */}

                <div className="border rounded-xl p-4">

                  <h3 className="font-semibold">
                    Coming Soon
                  </h3>

                  <ul className="mt-3 text-sm text-gray-600 space-y-2">

                    <li>• Save For Later</li>

                    <li>• Move To Wishlist</li>

                    <li>• Gift Wrap</li>

                    <li>• Order Notes</li>

                    <li>• Recommended Products</li>

                    <li>• Recently Viewed</li>

                  </ul>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

    </main>

  );

}
