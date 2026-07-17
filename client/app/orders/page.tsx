"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/order/list");

      const data = await res.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            No Orders Found
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-xl shadow p-6 mb-6"
            >

              <div className="flex justify-between mb-4">

                <div>
                  <p className="font-semibold">
                    Order ID
                  </p>

                  <p className="text-sm text-gray-500">
                    {order._id}
                  </p>
                </div>

                <div className="text-right">

                  <p className="font-semibold">
                    {order.orderStatus}
                  </p>

                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>

                </div>

              </div>

              <div className="space-y-3">

                {order.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between border-b pb-2"
                  >

                    <div>

                      <p className="font-medium">
                        {item.name}
                      </p>

                      <p className="text-gray-500">
                        Qty : {item.quantity}
                      </p>

                    </div>

                    <p>
                      ₹{item.price * item.quantity}
                    </p>

                  </div>
                ))}

              </div>

              <div className="mt-6 flex justify-between">

                <div>

                  <p>
                    Payment :
                    <span className="font-semibold ml-2">
                      {order.paymentMethod}
                    </span>
                  </p>

                  <p>
                    Status :
                    <span className="font-semibold ml-2">
                      {order.paymentStatus}
                    </span>
                  </p>

                </div>

                <div className="text-xl font-bold">
                  ₹{order.totalAmount}
                </div>

              </div>

            </div>
          ))
        )}

      </div>
    </div>
  );
}
