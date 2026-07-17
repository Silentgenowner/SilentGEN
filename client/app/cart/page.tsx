"use client";

import { useEffect, useState } from "react";

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    try {
      const res = await fetch("/api/cart/get");

      const data = await res.json();

      if (data.success) {
        setItems(data.cart.items);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (
    productId: number,
    action: "increase" | "decrease"
  ) => {
    const res = await fetch("/api/cart/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        action,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setItems(data.cart.items);
    } else {
      alert(data.message);
    }
  };

  const removeItem = async (productId: number) => {
    const res = await fetch("/api/cart/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setItems(data.cart.items);
    } else {
      alert(data.message);
    }
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-6">

        <h1 className="text-3xl font-bold mb-8">
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between items-center border-b py-5"
              >
                <div>
                  <h2 className="text-xl font-semibold">
                    {item.name}
                  </h2>

                  <p className="text-gray-500">
                    ₹{item.price}
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  <button
                    onClick={() =>
                      updateQuantity(
                        item.productId,
                        "decrease"
                      )
                    }
                    className="bg-gray-200 px-3 py-1 rounded"
                  >
                    -
                  </button>

                  <span className="text-lg font-bold">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      updateQuantity(
                        item.productId,
                        "increase"
                      )
                    }
                    className="bg-gray-200 px-3 py-1 rounded"
                  >
                    +
                  </button>

                  <button
                    onClick={() =>
                      removeItem(item.productId)
                    }
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Remove
                  </button>

                </div>
              </div>
            ))}

            <div className="mt-8 flex justify-between items-center">

              <h2 className="text-2xl font-bold">
                Total: ₹{total}
              </h2>

              <button className="bg-black text-white px-8 py-3 rounded-lg">
                Checkout
              </button>

            </div>
          </>
        )}

      </div>
    </div>
  );
}
