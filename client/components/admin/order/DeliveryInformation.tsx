"use client";

type Props = {
  courierPartner?: string;
  trackingNumber?: string;
  createdAt: string;
};

export default function DeliveryInformation({
  courierPartner,
  trackingNumber,
  createdAt,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-6">
        Delivery Information
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">
            Courier Partner
          </p>

          <p className="font-semibold mt-2">
            {courierPartner || "Not Assigned"}
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">
            Tracking Number
          </p>

          <p className="font-semibold mt-2 break-all">
            {trackingNumber || "Not Added"}
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">
            Order Date
          </p>

          <p className="font-semibold mt-2">
            {new Date(createdAt).toLocaleDateString()}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            {new Date(createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="font-semibold mb-4">
          Delivery Status
        </h3>

        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-2 rounded-full bg-gray-100">
            Order Placed
          </span>

          <span className="px-3 py-2 rounded-full bg-gray-100">
            Confirmed
          </span>

          <span className="px-3 py-2 rounded-full bg-gray-100">
            Packed
          </span>

          <span className="px-3 py-2 rounded-full bg-gray-100">
            Shipped
          </span>

          <span className="px-3 py-2 rounded-full bg-gray-100">
            Out For Delivery
          </span>

          <span className="px-3 py-2 rounded-full bg-gray-100">
            Delivered
          </span>
        </div>
      </div>
    </div>
  );
}
