"use client";

import { useState } from "react";

type Props = {
  orderId: string;

  returnRequest?: {
    reason: string;
    status: string;
    requestedAt: string;
  };

  onUpdated: () => void;
};

export default function ReturnRequest({
  orderId,
  returnRequest,
  onUpdated,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  if (!returnRequest) return null;

  async function updateReturn(
    action: "approve" | "reject"
  ) {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/admin/orders/return",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
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
        Return Request
      </h2>

      <div className="space-y-3">
        <p>
          <strong>Status :</strong>{" "}
          {returnRequest.status}
        </p>

        <p>
          <strong>Reason :</strong>{" "}
          {returnRequest.reason}
        </p>

        <p>
          <strong>Requested At :</strong>{" "}
          {new Date(
            returnRequest.requestedAt
          ).toLocaleString()}
        </p>
      </div>

      {returnRequest.status ===
        "Pending" && (
        <div className="flex gap-4 mt-6">
          <button
            disabled={loading}
            onClick={() =>
              updateReturn("approve")
            }
            className="bg-green-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Approve Return"}
          </button>

          <button
            disabled={loading}
            onClick={() =>
              updateReturn("reject")
            }
            className="bg-red-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Reject Return"}
          </button>
        </div>
      )}
    </div>
  );
}
