"use client";

import { ShippingAddress as ShippingAddressType } from "@/types/order";

type Props = {
  address: ShippingAddressType;
};

export default function ShippingAddress({
  address,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-5">
        Shipping Address
      </h2>

      <div className="space-y-3">
        <div>
          <p className="font-semibold text-lg">
            {address.fullName}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Mobile
          </p>

          <p className="font-medium">
            {address.mobile}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Address
          </p>

          <p>
            {address.address}
          </p>

          <p>
            {address.area}
          </p>

          <p>
            {address.city},{" "}
            {address.state}
          </p>

          <p>
            {address.country} -{" "}
            {address.pincode}
          </p>
        </div>

        {address.landmark && (
          <div>
            <p className="text-sm text-gray-500">
              Landmark
            </p>

            <p>{address.landmark}</p>
          </div>
        )}
      </div>
    </div>
  );
}
