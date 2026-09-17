"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

type Customer = {
  _id: string;

  name?: string;

  email?: string;

  mobile?: string;

  isVerified?: boolean;

  isBlocked?: boolean;

  orderCount?: number;

  totalSpend?: number;

  createdAt?: string;
};

export default function CustomersPage() {
  const [
    customers,
    setCustomers,
  ] =
    useState<Customer[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState("");

  const [
    summary,
    setSummary,
  ] =
    useState({
      total: 0,
      active: 0,
      blocked: 0,
    });

  async function loadCustomers() {
    try {
      setLoading(true);

      const params =
        new URLSearchParams();

      if (search) {
        params.set(
          "search",
          search
        );
      }

      if (status) {
        params.set(
          "status",
          status
        );
      }

      const response =
        await fetch(
          `/api/admin/customers?${params.toString()}`,
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
        setCustomers(
          data.customers ||
            []
        );

        setSummary(
          data.summary ||
            summary
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer =
      setTimeout(() => {
        void loadCustomers();
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [search, status]);

  async function toggleBlock(
    customer: Customer
  ) {
    const response =
      await fetch(
        `/api/admin/customers/${customer._id}`,
        {
          method:
            "PUT",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              isBlocked:
                !customer.isBlocked,
            }),
        }
      );

    const data =
      await response.json();

    if (!data.success) {
      alert(
        data.message
      );
      return;
    }

    await loadCustomers();
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-3xl font-bold">
        Customers
      </h1>

      <p className="mt-1 text-gray-500">
        Manage SilentGEN customers
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-gray-500">
            Total Customers
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {
              summary.total
            }
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-gray-500">
            Active
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {
              summary.active
            }
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-gray-500">
            Blocked
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            {
              summary.blocked
            }
          </h2>
        </div>
      </div>

      <div className="my-8 grid gap-4 md:grid-cols-2">
        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search name, email, mobile..."
          className="rounded-lg border p-3"
        />

        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
          className="rounded-lg border bg-white p-3"
        >
          <option value="">
            All Customers
          </option>

          <option value="active">
            Active
          </option>

          <option value="blocked">
            Blocked
          </option>
        </select>
      </div>

      {loading ? (
        <div className="p-10 text-center">
          Loading Customers...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-5 py-4 text-left">
                  Customer
                </th>

                <th className="px-5 py-4 text-left">
                  Mobile
                </th>

                <th className="px-5 py-4 text-left">
                  Orders
                </th>

                <th className="px-5 py-4 text-left">
                  Spend
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
              {customers.map(
                (customer) => (
                  <tr
                    key={
                      customer._id
                    }
                    className="border-t"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold">
                        {customer.name ||
                          "Customer"}
                      </div>

                      <div className="text-sm text-gray-500">
                        {customer.email ||
                          "-"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {customer.mobile ||
                        "-"}
                    </td>

                    <td className="px-5 py-4">
                      {customer.orderCount ||
                        0}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      ₹
                      {Number(
                        customer.totalSpend ||
                          0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          customer.isBlocked
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {customer.isBlocked
                          ? "Blocked"
                          : "Active"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-4">
                        <Link
                          href={`/admin/customers/${customer._id}`}
                          className="text-blue-600"
                        >
                          View
                        </Link>

                        <button
                          onClick={() =>
                            void toggleBlock(
                              customer
                            )
                          }
                          className={
                            customer.isBlocked
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {customer.isBlocked
                            ? "Unblock"
                            : "Block"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}