"use client";

import { useState } from "react";

type Props = {
  orderId: string;

  exchangeRequest?: {
    reason: string;
    status: string;
    requestedAt: string;
  };

  onUpdated: () => void;
};

export default function ExchangeRequest({
  orderId,
  exchangeRequest,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!exchangeRequest) return null;

  async function updateExchange(
    action: "approve" | "reject"
  ) {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/admin/orders/exchange",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            action,
          }),
        }
      );

      const data = await res.json();

      alert(data.message);

      if (data.success) {
        onUpdated();
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-6">
        Exchange Request
      </h2>

      <div className="space-y-3">
        <p>
          <strong>Status :</strong>{" "}
          {exchangeRequest.status}
        </p>

        <p>
          <strong>Reason :</strong>{" "}
          {exchangeRequest.reason}
        </p>

        <p>
          <strong>Requested At :</strong>{" "}
          {new Date(
            exchangeRequest.requestedAt
          ).toLocaleString()}
        </p>
      </div>

      {exchangeRequest.status ===
        "Pending" && (
        <div className="flex gap-4 mt-6">
          <button
            disabled={loading}
            onClick={() =>
              updateExchange("approve")
            }
            className="bg-green-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Approve Exchange"}
          </button>

          <button
            disabled={loading}
            onClick={() =>
              updateExchange("reject")
            }
            className="bg-red-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Reject Exchange"}
          </button>
        </div>
      )}
    </div>
  );
}
