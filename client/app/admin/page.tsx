import Link from "next/link";
import {
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

const recentOrders = [
  {
    id: "#SG-1001",
    customer: "Rahul Patel",
    total: "₹2,499",
    status: "Processing",
    date: "31 Jul 2026",
  },
  {
    id: "#SG-1002",
    customer: "Priya Shah",
    total: "₹1,299",
    status: "Delivered",
    date: "31 Jul 2026",
  },
  {
    id: "#SG-1003",
    customer: "Amit Mehta",
    total: "₹3,799",
    status: "Pending",
    date: "30 Jul 2026",
  },
  {
    id: "#SG-1004",
    customer: "Neha Joshi",
    total: "₹899",
    status: "Cancelled",
    date: "30 Jul 2026",
  },
];

const statusClasses: Record<string, string> = {
  Processing: "bg-blue-50 text-blue-700",
  Delivered: "bg-green-50 text-green-700",
  Pending: "bg-yellow-50 text-yellow-700",
  Cancelled: "bg-red-50 text-red-700",
};

export default function AdminDashboardPage() {
  const stats = [
    {
      title: "Total Revenue",
      value: "₹0",
      description: "No completed orders yet",
      icon: CircleDollarSign,
      iconClass: "bg-green-100 text-green-700",
    },
    {
      title: "Total Orders",
      value: "0",
      description: "Orders received so far",
      icon: ShoppingCart,
      iconClass: "bg-blue-100 text-blue-700",
    },
    {
      title: "Customers",
      value: "0",
      description: "Registered customers",
      icon: Users,
      iconClass: "bg-purple-100 text-purple-700",
    },
    {
      title: "Products",
      value: "0",
      description: "Active products in store",
      icon: Package,
      iconClass: "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-black px-6 py-7 text-white sm:px-8">
        <p className="text-sm font-medium text-gray-300">SilentGEN Admin</p>

        <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Welcome back, Super Admin
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              Here is an overview of your store performance.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200"
          >
            View Orders
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconClass}`}
                >
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-500">{stat.description}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Revenue Overview
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Sales chart will appear when orders are available.
              </p>
            </div>

            <CircleDollarSign className="text-gray-400" size={24} />
          </div>

          <div className="mt-6 flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
            <div className="text-center">
              <CircleDollarSign
                className="mx-auto text-gray-400"
                size={34}
              />
              <p className="mt-3 font-medium text-gray-700">
                No revenue data available
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Revenue analytics will show here after sales begin.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Order Summary
              </h3>
              <p className="mt-1 text-sm text-gray-500">Current status</p>
            </div>

            <Clock3 className="text-gray-400" size={23} />
          </div>

          <div className="mt-6 space-y-5">
            <SummaryRow label="Pending Orders" value="0" color="bg-yellow-500" />
            <SummaryRow label="Processing Orders" value="0" color="bg-blue-500" />
            <SummaryRow label="Delivered Orders" value="0" color="bg-green-500" />
            <SummaryRow label="Cancelled Orders" value="0" color="bg-red-500" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              Latest customer orders from your store.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-black hover:underline"
          >
            View all orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="text-sm text-gray-700">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4">{order.date}</td>
                  <td className="px-6 py-4 font-medium">{order.total}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        statusClasses[order.status]
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>

      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}
