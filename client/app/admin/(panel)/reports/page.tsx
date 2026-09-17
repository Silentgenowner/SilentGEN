"use client";

import {
  useEffect,
  useState,
} from "react";

type ReportsData = {
  summary: {
    totalRevenue: number;

    totalOrders: number;

    delivered: number;

    pending: number;

    cancelled: number;

    customerCount: number;

    productCount: number;

    codRevenue: number;

    onlineRevenue: number;

    averageOrderValue: number;
  };

  dailySales: {
    date: string;

    orders: number;

    revenue: number;
  }[];

  topProducts: {
    name: string;

    quantity: number;

    revenue: number;
  }[];

  lowStockProducts: {
    _id: string;

    name: string;

    sku?: string;

    stock: number;

    lowStockLimit?: number;
  }[];
};

export default function ReportsPage() {
  const [
    data,
    setData,
  ] =
    useState<ReportsData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    void loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/admin/reports",
          {
            cache:
              "no-store",

            credentials:
              "include",
          }
        );

      const result =
        await response.json();

      if (
        result.success
      ) {
        setData(result);
      } else {
        alert(
          result.message ||
            "Unable to load reports."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading Reports...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-10 text-center">
        Reports unavailable.
      </div>
    );
  }

  const s =
    data.summary;

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Reports
          </h1>

          <p className="mt-1 text-gray-500">
            Business performance overview
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadReports()
          }
          className="rounded-lg bg-black px-5 py-3 text-white"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Revenue"
          value={`₹${Math.round(
            s.totalRevenue
          ).toLocaleString(
            "en-IN"
          )}`}
        />

        <Card
          title="Orders"
          value={String(
            s.totalOrders
          )}
        />

        <Card
          title="Customers"
          value={String(
            s.customerCount
          )}
        />

        <Card
          title="Average Order"
          value={`₹${Math.round(
            s.averageOrderValue
          ).toLocaleString(
            "en-IN"
          )}`}
        />

        <Card
          title="Delivered"
          value={String(
            s.delivered
          )}
        />

        <Card
          title="Pending"
          value={String(
            s.pending
          )}
        />

        <Card
          title="Cancelled"
          value={String(
            s.cancelled
          )}
        />

        <Card
          title="Products"
          value={String(
            s.productCount
          )}
        />
      </div>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-bold">
            Payment Summary
          </h2>

          <div className="space-y-4">
            <SummaryRow
              label="COD Revenue"
              value={`₹${Math.round(
                s.codRevenue
              ).toLocaleString(
                "en-IN"
              )}`}
            />

            <SummaryRow
              label="Online Revenue"
              value={`₹${Math.round(
                s.onlineRevenue
              ).toLocaleString(
                "en-IN"
              )}`}
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-bold">
            Order Status
          </h2>

          <SummaryRow
            label="Delivered"
            value={String(
              s.delivered
            )}
          />

          <SummaryRow
            label="Pending"
            value={String(
              s.pending
            )}
          />

          <SummaryRow
            label="Cancelled"
            value={String(
              s.cancelled
            )}
          />
        </div>
      </section>

      <section className="mt-8 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-5 text-xl font-bold">
          Top Selling Products
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left">
                  Product
                </th>

                <th className="py-3 text-left">
                  Sold
                </th>

                <th className="py-3 text-left">
                  Revenue
                </th>
              </tr>
            </thead>

            <tbody>
              {data.topProducts.map(
                (
                  item,
                  index
                ) => (
                  <tr
                    key={
                      index
                    }
                    className="border-b"
                  >
                    <td className="py-3">
                      {
                        item.name
                      }
                    </td>

                    <td className="py-3">
                      {
                        item.quantity
                      }
                    </td>

                    <td className="py-3">
                      ₹
                      {Math.round(
                        item.revenue
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-5 text-xl font-bold">
          Low Stock Products
        </h2>

        {data.lowStockProducts.length ===
        0 ? (
          <p className="text-gray-500">
            No low stock products.
          </p>
        ) : (
          <div className="space-y-3">
            {data.lowStockProducts.map(
              (product) => (
                <div
                  key={
                    product._id
                  }
                  className="flex justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="font-semibold">
                      {
                        product.name
                      }
                    </div>

                    <div className="text-xs text-gray-500">
                      {product.sku ||
                        "-"}
                    </div>
                  </div>

                  <span className="font-bold text-red-600">
                    {
                      product.stock
                    }{" "}
                    left
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-5 text-xl font-bold">
          Last 30 Days
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left">
                  Date
                </th>

                <th className="py-3 text-left">
                  Orders
                </th>

                <th className="py-3 text-left">
                  Revenue
                </th>
              </tr>
            </thead>

            <tbody>
              {data.dailySales.map(
                (day) => (
                  <tr
                    key={
                      day.date
                    }
                    className="border-b"
                  >
                    <td className="py-3">
                      {
                        day.date
                      }
                    </td>

                    <td className="py-3">
                      {
                        day.orders
                      }
                    </td>

                    <td className="py-3">
                      ₹
                      {Math.round(
                        day.revenue
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className="mt-2 text-2xl font-bold">
        {value}
      </h2>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between border-b py-3 last:border-0">
      <span className="text-gray-500">
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}