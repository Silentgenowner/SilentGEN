"use client";

import { useEffect, useState } from "react";

type Order = {
  _id: string;
  orderStatus: string;
  trackingNumber?: string;
  courierPartner?: string;
};

type Props = {
  order: Order;
  onUpdated: () => void | Promise<void>;
};

export default function OrderManagement({
  order,
  onUpdated,
}: Props) {
  const [status, setStatus] = useState("");
  const [trackingNumber, setTrackingNumber] =
    useState("");
  const [courierPartner, setCourierPartner] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    setStatus(order.orderStatus || "");
    setTrackingNumber(
      order.trackingNumber || ""
    );
    setCourierPartner(
      order.courierPartner || ""
    );
  }, [order]);

  async function updateOrder() {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/admin/orders/update",
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            orderId: order._id,
            orderStatus: status,
            trackingNumber,
            courierPartner,
          }),
        }
      );

      const data = await res.json();

      alert(data.message);

      if (data.success) {
        await onUpdated();
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-white shadow rounded-xl p-6 mb-8">
      <h2 className="text-xl font-bold mb-6">
        Order Management
      </h2>

      <div className="grid md:grid-cols-3 gap-5">

        <div>
          <label className="block mb-2 font-semibold">
            Order Status
          </label>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="w-full border rounded-lg p-3"
          >
            <option value="Placed">
              Placed
            </option>

            <option value="Confirmed">
              Confirmed
            </option>

            <option value="Packed">
              Packed
            </option>

            <option value="Shipped">
              Shipped
            </option>

            <option value="Out For Delivery">
              Out For Delivery
            </option>

            <option value="Delivered">
              Delivered
            </option>

            <option value="Cancelled">
              Cancelled
            </option>

            <option value="Returned">
              Returned
            </option>

            <option value="Refunded">
              Refunded
            </option>
          </select>
        </div>
        <div>
          <label className="block mb-2 font-semibold">
            Tracking Number
          </label>

          <input
            type="text"
            value={trackingNumber}
            onChange={(e) =>
              setTrackingNumber(e.target.value)
            }
            placeholder="Tracking Number"
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Courier Partner
          </label>

          <input
            type="text"
            value={courierPartner}
            onChange={(e) =>
              setCourierPartner(e.target.value)
            }
            placeholder="Courier Partner"
            className="w-full border rounded-lg p-3"
          />
        </div>

      </div>

      <div className="mt-6">
        <button
          onClick={updateOrder}
          disabled={loading}
          className="bg-black text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {loading
            ? "Updating..."
            : "Update Order"}
        </button>
      </div>

    </section>
  );
}

