"use client";

import { OrderUser } from "@/types/order";

type Props = {
  user: OrderUser;
};

export default function CustomerDetails({
  user,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-5">
        Customer Details
      </h2>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-500">
            Customer Name
          </p>

          <p className="font-semibold">
            {user?.name || "-"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Email
          </p>

          <p className="font-semibold break-all">
            {user?.email || "-"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Mobile
          </p>

          <p className="font-semibold">
            {user?.mobile ||
              user?.phone ||
              "-"}
          </p>
        </div>

        <div className="pt-3 border-t">
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm font-medium">
            Customer Verified
          </span>
        </div>
      </div>
    </div>
  );
}
