"use client";

type Props = {
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  totalAmount: number;
};

export default function PaymentSummary({
  paymentMethod,
  paymentStatus,
  subtotal,
  shippingCharge,
  discount,
  totalAmount,
}: Props) {
  const badgeColor =
    paymentStatus === "Paid"
      ? "bg-green-100 text-green-700"
      : paymentStatus === "Refunded"
      ? "bg-blue-100 text-blue-700"
      : paymentStatus === "Failed"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-6">
        Payment Summary
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-gray-500">
            Payment Method
          </p>

          <p className="font-semibold mt-1">
            {paymentMethod}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Payment Status
          </p>

          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}
          >
            {paymentStatus}
          </span>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Subtotal
          </p>

          <p className="font-semibold mt-1">
            ₹{subtotal}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Shipping Charge
          </p>

          <p className="font-semibold mt-1">
            ₹{shippingCharge}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Discount
          </p>

          <p className="font-semibold mt-1 text-green-600">
            -₹{discount}
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-500">
            Grand Total
          </p>

          <p className="text-3xl font-bold mt-2">
            ₹{totalAmount}
          </p>
        </div>
      </div>
    </div>
  );
}
