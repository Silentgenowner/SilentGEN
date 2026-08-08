"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";

type Address = {
  _id: string;

  fullName?: string;
  name?: string;

  mobile?: string;
  phone?: string;

  address: string;
  area?: string;

  city: string;
  state: string;
  country?: string;

  pincode: string;

  landmark?: string;

  isDefault?: boolean;
};

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    summary,
    clearCart,
    refreshCart,
  } = useCart();

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [
    selectedAddress,
    setSelectedAddress,
  ] = useState<Address | null>(null);

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("COD");

  const [loading, setLoading] =
    useState(true);

  const [placing, setPlacing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [
    couponCode,
    setCouponCode,
  ] = useState("");

  const [
    couponDiscount,
    setCouponDiscount,
  ] = useState(0);

  const finalTotal =
    summary.grandTotal -
    couponDiscount;
// =========================
// LOAD ADDRESSES
// =========================

async function loadAddresses() {
  try {
    setLoading(true);

    const res = await fetch(
      "/api/address",
      {
        cache: "no-store",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!data.success) {
      setAddresses([]);
      return;
    }

    const list =
      data.addresses || [];

    setAddresses(list);

    if (list.length > 0) {
      const defaultAddress =
        list.find(
          (item: Address) =>
            item.isDefault
        );

      setSelectedAddress(
        defaultAddress ||
          list[0]
      );
    }
  } catch (error) {
    console.error(
      "LOAD ADDRESS ERROR:",
      error
    );

    setAddresses([]);
  } finally {
    setLoading(false);
  }
}

// =========================
// LOAD DATA
// =========================

useEffect(() => {
  async function init() {
    await refreshCart();

    await loadAddresses();
  }

  init();
}, []);

// =========================
// EMPTY CART REDIRECT
// =========================

useEffect(() => {
  if (
    !loading &&
    cart.length === 0
  ) {
    router.replace("/cart");
  }
}, [
  cart,
  loading,
  router,
]);

// =========================
// APPLY COUPON
// =========================

function applyCoupon() {
  const code =
    couponCode
      .trim()
      .toUpperCase();

  if (!code) {
    return;
  }

  if (code === "WELCOME10") {
    setCouponDiscount(
      Math.round(
        summary.subtotal * 0.1
      )
    );

    setMessage(
      "Coupon Applied Successfully"
    );
  } else {
    setCouponDiscount(0);

    setMessage(
      "Invalid Coupon Code"
    );
  }
}
// =========================
// PLACE ORDER
// =========================

async function placeOrder() {
  if (cart.length === 0) {
    setMessage("Your cart is empty");
    return;
  }

  if (!selectedAddress) {
    setMessage(
      "Please select delivery address"
    );
    return;
  }

  if (!paymentMethod) {
    setMessage(
      "Please select payment method"
    );
    return;
  }

  try {
    setPlacing(true);

    setMessage("");

    const shippingAddress = {
      fullName:
        selectedAddress.fullName ||
        selectedAddress.name ||
        "Customer",

      mobile:
        selectedAddress.mobile ||
        selectedAddress.phone ||
        "",

      address:
        selectedAddress.address,

      area:
        selectedAddress.area || "",

      city:
        selectedAddress.city,

      state:
        selectedAddress.state,

      country:
        selectedAddress.country ||
        "India",

      pincode:
        selectedAddress.pincode,

      landmark:
        selectedAddress.landmark ||
        "",
    };

    const res = await fetch(
      "/api/order/place",
      {
        method: "POST",

        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          shippingAddress,

          paymentMethod,

          couponCode,

          couponDiscount,
        }),
      }
    );

    const data = await res.json();

    if (!data.success) {
      setMessage(
        data.message ||
          "Order failed"
      );

      return;
    }

    clearCart();

    setMessage(
      "Order placed successfully"
    );

    setTimeout(() => {
      if (data.orderId) {
        router.push(
          `/account/orders/${data.orderId}`
        );
      } else {
        router.push(
          "/account/orders"
        );
      }
    }, 1000);
  } catch (error) {
    console.error(
      "PLACE ORDER ERROR:",
      error
    );

    setMessage(
      "Something went wrong"
    );
  } finally {
    setPlacing(false);
  }
}

// =========================
// LOADING
// =========================

if (loading) {
  return (
    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      text-xl
      font-semibold
    "
    >
      Loading Checkout...
    </div>
  );
}
return (
  <main
    className="
    max-w-7xl
    mx-auto
    px-4
    md:px-6
    py-10
  "
  >
    <h1
      className="
      text-4xl
      font-bold
      mb-8
    "
    >
      Checkout
    </h1>

    <div
      className="
      grid
      grid-cols-1
      lg:grid-cols-3
      gap-8
    "
    >
      {/* ===========================
          LEFT SIDE
      =========================== */}

      <div className="lg:col-span-2 space-y-8">

        {/* ADDRESS */}

        <section
          className="
          bg-white
          rounded-xl
          shadow
          p-6
        "
        >
          <div
            className="
            flex
            justify-between
            items-center
            mb-6
          "
          >
            <h2
              className="
              text-2xl
              font-bold
            "
            >
              Delivery Address
            </h2>

            <button
              onClick={() =>
                router.push(
                  "/account/address"
                )
              }
              className="
              bg-black
              text-white
              px-5
              py-2
              rounded-lg
              "
            >
              + Add Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div
              className="
              border
              rounded-lg
              p-6
              text-center
              "
            >
              No address found.
            </div>
          ) : (
            <div className="space-y-4">

              {addresses.map(
                (item) => (
                  <label
                    key={item._id}
                    className={`
                    block
                    border
                    rounded-xl
                    p-5
                    cursor-pointer

                    ${
                      selectedAddress?._id ===
                      item._id
                        ? "border-black"
                        : "border-gray-300"
                    }
                  `}
                  >
                    <div className="flex gap-4">

                      <input
                        type="radio"
                        checked={
                          selectedAddress?._id ===
                          item._id
                        }
                        onChange={() =>
                          setSelectedAddress(
                            item
                          )
                        }
                      />

                      <div>

                        <h3 className="font-bold text-lg">
                          {item.fullName ||
                            item.name}
                        </h3>

                        {item.isDefault && (
                          <span
                            className="
                            inline-block
                            mt-2
                            bg-green-100
                            text-green-700
                            px-3
                            py-1
                            rounded-full
                            text-xs
                          "
                          >
                            Default
                          </span>
                        )}

                        <p className="mt-3">
                          {item.mobile ||
                            item.phone}
                        </p>

                        <p>
                          {item.address}
                        </p>

                        {item.area && (
                          <p>
                            {item.area}
                          </p>
                        )}

                        <p>
                          {item.city},{" "}
                          {item.state}
                        </p>

                        <p>
                          {item.country ||
                            "India"}{" "}
                          -{" "}
                          {item.pincode}
                        </p>

                        {item.landmark && (
                          <p>
                            Landmark :{" "}
                            {
                              item.landmark
                            }
                          </p>
                        )}

                      </div>

                    </div>
                  </label>
                )
              )}

            </div>
          )}

        </section>

        {/* PAYMENT */}

        <section
          className="
          bg-white
          rounded-xl
          shadow
          p-6
        "
        >
          <h2
            className="
            text-2xl
            font-bold
            mb-6
          "
          >
            Payment Method
          </h2>

          <label className="flex gap-3 mb-4">

            <input
              type="radio"
              checked={
                paymentMethod === "COD"
              }
              onChange={() =>
                setPaymentMethod("COD")
              }
            />

            <span>
              Cash On Delivery
            </span>

          </label>

          <label className="flex gap-3">

            <input
              type="radio"
              checked={
                paymentMethod ===
                "ONLINE"
              }
              onChange={() =>
                setPaymentMethod(
                  "ONLINE"
                )
              }
            />

            <span>
              Online Payment
            </span>

          </label>

        </section>
      </div>
      {/* ===========================
          RIGHT SIDE
      =========================== */}

      <div>

        <section
          className="
          bg-white
          rounded-xl
          shadow
          p-6
          sticky
          top-6
        "
        >

          <h2
            className="
            text-2xl
            font-bold
            mb-6
          "
          >
            Order Summary
          </h2>

          <div
            className="
            space-y-5
            max-h-[420px]
            overflow-y-auto
            pr-2
          "
          >

            {cart.map((item: any, index: number) => (

              <div
                key={index}
                className="
                flex
                gap-4
                border-b
                pb-4
                "
              >

                <Image
                  src={
                    item.image ||
                    "/images/no-image.png"
                  }
                  alt={item.name}
                  width={70}
                  height={70}
                  className="
                  rounded-lg
                  object-cover
                  "
                />

                <div className="flex-1">

                  <h3 className="font-semibold">
                    {item.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    Qty : {item.quantity}
                  </p>

                  {item.size && (
                    <p className="text-sm">
                      Size : {item.size}
                    </p>
                  )}

                  {item.color && (
                    <p className="text-sm">
                      Color : {item.color}
                    </p>
                  )}

                  <p
                    className="
                    font-bold
                    mt-2
                    "
                  >
                    ₹
                    {item.price *
                      item.quantity}
                  </p>

                </div>

              </div>

            ))}

          </div>

          {/* Coupon */}

          <div className="mt-6">

            <p className="font-semibold mb-2">
              Coupon Code
            </p>

            <div className="flex gap-2">

              <input
                type="text"
                value={couponCode}
                onChange={(e) =>
                  setCouponCode(
                    e.target.value
                  )
                }
                placeholder="Enter Coupon"
                className="
                flex-1
                border
                rounded-lg
                px-3
                py-2
                "
              />

              <button
                onClick={applyCoupon}
                className="
                bg-black
                text-white
                px-4
                rounded-lg
                "
              >
                Apply
              </button>

            </div>

          </div>

          {/* Price Summary */}

          <div
            className="
            mt-8
            space-y-3
            "
          >

            <div className="flex justify-between">

              <span>
                Items
              </span>

              <span>
                {summary.totalItems}
              </span>

            </div>

            <div className="flex justify-between">

              <span>
                Subtotal
              </span>

              <span>
                ₹{summary.subtotal}
              </span>

            </div>

            <div className="flex justify-between">

              <span>
                Shipping
              </span>

              <span>
                ₹{summary.shipping}
              </span>

            </div>

            {couponDiscount > 0 && (

              <div className="flex justify-between text-green-600">

                <span>
                  Coupon Discount
                </span>

                <span>
                  -₹{couponDiscount}
                </span>

              </div>

            )}

            <hr />

            <div
              className="
              flex
              justify-between
              text-2xl
              font-bold
              "
            >

              <span>
                Grand Total
              </span>

              <span>
                ₹{finalTotal}
              </span>

            </div>

          </div>

          <button
            onClick={placeOrder}
            disabled={placing}
            className="
            w-full
            mt-8
            bg-black
            text-white
            py-4
            rounded-xl
            text-lg
            disabled:opacity-50
            "
          >

            {placing
              ? "Placing Order..."
              : "Place Order"}

          </button>

          {message && (

            <p
              className="
              text-center
              mt-5
              font-semibold
              text-red-600
              "
            >
              {message}
            </p>

          )}

        </section>

      </div>
    </div>
  </main>
);
}
