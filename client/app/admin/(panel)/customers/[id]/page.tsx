"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

type Customer = {
  _id: string;

  name?: string;

  email?: string;

  mobile?: string;

  isVerified?: boolean;

  isBlocked?: boolean;

  createdAt?: string;

  lastLogin?: string;

  orderCount?: number;

  totalSpend?: number;
};

type Order = {
  _id: string;

  totalAmount?: number;

  paymentMethod?: string;

  paymentStatus?: string;

  orderStatus?: string;

  createdAt?: string;
};

export default function CustomerDetailsPage() {
  const params =
    useParams();

  const id =
    String(
      params.id ||
        ""
    );

  const [
    customer,
    setCustomer,
  ] =
    useState<Customer | null>(
      null
    );

  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    void loadCustomer();
  }, [id]);

  async function loadCustomer() {
    try {
      const response =
        await fetch(
          `/api/admin/customers/${id}`,
          {
            cache:
              "no-store",

            credentials:
              "include",
          }
        );

      const data =
        await response.json();

      if (
        data.success
      ) {
        setCustomer(
          data.customer
        );

        setOrders(
          data.orders ||
            []
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading Customer...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-10 text-center">
        Customer not found.
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8 flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Customer Details
          </h1>

          <p className="text-gray-500">
            {
              customer._id
            }
          </p>
        </div>

        <Link
          href="/admin/customers"
          className="rounded-lg border px-5 py-2"
        >
          Back
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow md:col-span-2">
          <h2 className="text-xl font-bold">
            {customer.name ||
              "Customer"}
          </h2>

          <p className="mt-3">
            Email:{" "}
            {customer.email ||
              "-"}
          </p>

          <p>
            Mobile:{" "}
            {customer.mobile ||
              "-"}
          </p>

          <p>
            Verified:{" "}
            {customer.isVerified
              ? "Yes"
              : "No"}
          </p>

          <p>
            Status:{" "}
            {customer.isBlocked
              ? "Blocked"
              : "Active"}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-gray-500">
            Orders
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {
              customer.orderCount
            }
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-gray-500">
            Total Spend
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            ₹
            {Number(
              customer.totalSpend ||
                0
            ).toLocaleString(
              "en-IN"
            )}
          </h2>
        </div>
      </div>

      <section className="mt-8 overflow-x-auto rounded-xl bg-white shadow">
        <h2 className="p-5 text-xl font-bold">
          Recent Orders
        </h2>

        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-4 text-left">
                Order
              </th>

              <th className="px-5 py-4 text-left">
                Amount
              </th>

              <th className="px-5 py-4 text-left">
                Payment
              </th>

              <th className="px-5 py-4 text-left">
                Status
              </th>

              <th className="px-5 py-4 text-left">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {orders.map(
              (order) => (
                <tr
                  key={
                    order._id
                  }
                  className="border-t"
                >
                  <td className="px-5 py-4">
                    #
                    {order._id.slice(
                      -8
                    )}
                  </td>

                  <td className="px-5 py-4">
                    ₹
                    {Number(
                      order.totalAmount ||
                        0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {
                      order.paymentMethod
                    }
                  </td>

                  <td className="px-5 py-4">
                    {
                      order.orderStatus
                    }
                  </td>

                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="text-blue-600"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}