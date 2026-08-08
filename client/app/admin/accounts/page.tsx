"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Wallet,
  Receipt,
  ShoppingBag,
  CreditCard,
  Landmark,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";

type DashboardStats = {
  todaySales: number;
  todayPurchase: number;
  todayExpense: number;

  cashBalance: number;
  bankBalance: number;

  receivable: number;
  payable: number;

  gstPayable: number;
  gstReceivable: number;

  totalOrders: number;

totalProducts: number;

lowStockProducts: number;

inventoryValue: number;
};

type DashboardResponse = {
  success: boolean;

  stats: DashboardStats;
};

const defaultStats: DashboardStats = {
  todaySales: 0,
  todayPurchase: 0,
  todayExpense: 0,

  cashBalance: 0,
  bankBalance: 0,

  receivable: 0,
  payable: 0,

  gstPayable: 0,
  gstReceivable: 0,

  totalOrders: 0,
  totalProducts: 0,
  lowStockProducts: 0,
  inventoryValue: 0,
};

export default function AccountsDashboardPage() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] =
    useState<DashboardStats>(defaultStats);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/accounts/dashboard",
        {
          cache: "no-store",
        }
      );

      const data: DashboardResponse =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2
          size={34}
          className="animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}

      <section className="rounded-3xl bg-gradient-to-r from-black to-gray-800 p-8 text-white">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="text-4xl font-bold">
              Accounts Dashboard
            </h1>

            <p className="mt-3 text-gray-300">
              Manage GST, Sales, Purchase, Ledger,
              Expenses, Banking and Financial Reports.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              href="/admin/accounts/sales"
              className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200"
            >
              Sales Invoice
            </Link>

            <Link
              href="/admin/accounts/purchase"
              className="rounded-xl border border-white/20 px-5 py-3 font-semibold hover:bg-white/10"
            >
              Purchase
            </Link>

            <Link
              href="/admin/accounts/expenses"
              className="rounded-xl border border-white/20 px-5 py-3 font-semibold hover:bg-white/10"
            >
              Expense
            </Link>

          </div>

        </div>

      </section>

      {/* KPI Cards */}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <Receipt className="text-green-600" />

            <ArrowUpRight className="text-green-600" />

          </div>

          <p className="mt-5 text-sm text-gray-500">
            Today's Sales
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            ₹
            {stats.todaySales.toLocaleString("en-IN")}
          </h2>

        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <ShoppingBag className="text-blue-600" />

            <ArrowDownRight className="text-blue-600" />

          </div>

          <p className="mt-5 text-sm text-gray-500">
            Today's Purchase
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            ₹
            {stats.todayPurchase.toLocaleString("en-IN")}
          </h2>

        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <CreditCard className="text-red-600" />

            <ArrowDownRight className="text-red-600" />

          </div>

          <p className="mt-5 text-sm text-gray-500">
            Today's Expense
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            ₹
            {stats.todayExpense.toLocaleString("en-IN")}
          </h2>

        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <Wallet className="text-emerald-600" />

            <TrendingUp className="text-emerald-600" />

          </div>

          <p className="mt-5 text-sm text-gray-500">
            Cash In Hand
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            ₹
            {stats.cashBalance.toLocaleString("en-IN")}
          </h2>

        </div>

      </section>
      {/* Financial Summary */}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {/* Bank Balance */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <Landmark className="text-indigo-600" />

            <IndianRupee className="text-indigo-600" />

          </div>

          <p className="mt-5 text-sm text-gray-500">
            Bank Balance
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            ₹
            {stats.bankBalance.toLocaleString("en-IN")}
          </h2>

        </div>

        {/* Receivable */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <ArrowUpRight className="text-green-600" />

            <TrendingUp className="text-green-600" />

          </div>

          <p className="mt-5 text-sm text-gray-500">
            Outstanding Receivable
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            ₹
            {stats.receivable.toLocaleString("en-IN")}
          </h2>

        </div>

        {/* Payable */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <ArrowDownRight className="text-red-600" />

            <AlertCircle className="text-red-600" />

          </div>

          <p className="mt-5 text-sm text-gray-500">
            Outstanding Payable
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-600">
            ₹
            {stats.payable.toLocaleString("en-IN")}
          </h2>

        </div>

        {/* GST */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <FileText className="text-orange-600" />

            <IndianRupee className="text-orange-600" />

          </div>

          <p className="mt-5 text-sm text-gray-500">
            Net GST Position
          </p>

          <div className="mt-4 space-y-2">

            <div className="flex items-center justify-between">

              <span className="text-sm text-gray-500">
                GST Payable
              </span>

              <span className="font-semibold text-red-600">
                ₹
                {stats.gstPayable.toLocaleString("en-IN")}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-sm text-gray-500">
                GST Receivable
              </span>

              <span className="font-semibold text-green-600">
                ₹
                {stats.gstReceivable.toLocaleString("en-IN")}
              </span>

            </div>

          </div>

        </div>

      </section>
      {/* Quick Actions */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Frequently used accounting shortcuts.
            </p>

          </div>

        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Link
            href="/admin/accounts/sales/new"
            className="rounded-xl border p-5 transition hover:border-black hover:bg-gray-50"
          >
            <Receipt
              size={28}
              className="text-green-600"
            />

            <h3 className="mt-4 font-semibold">
              Create Sales Invoice
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Create a new customer invoice.
            </p>

          </Link>

          <Link
            href="/admin/accounts/purchase/new"
            className="rounded-xl border p-5 transition hover:border-black hover:bg-gray-50"
          >
            <ShoppingBag
              size={28}
              className="text-blue-600"
            />

            <h3 className="mt-4 font-semibold">
              Purchase Entry
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Record supplier purchase bills.
            </p>

          </Link>

          <Link
            href="/admin/accounts/expenses/new"
            className="rounded-xl border p-5 transition hover:border-black hover:bg-gray-50"
          >
            <CreditCard
              size={28}
              className="text-red-600"
            />

            <h3 className="mt-4 font-semibold">
              Add Expense
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Record office and business expenses.
            </p>

          </Link>

          <Link
            href="/admin/accounts/ledger"
            className="rounded-xl border p-5 transition hover:border-black hover:bg-gray-50"
          >
            <Wallet
              size={28}
              className="text-purple-600"
            />

            <h3 className="mt-4 font-semibold">
              Ledger
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              View all customer and vendor ledgers.
            </p>

          </Link>

        </div>

      </section>

      {/* Recent Activity */}

      <section className="grid gap-6 xl:grid-cols-3">

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Recent Sales
          </h2>

          <div className="mt-6 flex h-52 items-center justify-center rounded-xl border border-dashed">

            <p className="text-sm text-gray-500">
              Sales invoices will appear here.
            </p>

          </div>

        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Recent Purchases
          </h2>

          <div className="mt-6 flex h-52 items-center justify-center rounded-xl border border-dashed">

            <p className="text-sm text-gray-500">
              Purchase entries will appear here.
            </p>

          </div>

        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Recent Expenses
          </h2>

          <div className="mt-6 flex h-52 items-center justify-center rounded-xl border border-dashed">

            <p className="text-sm text-gray-500">
              Expense records will appear here.
            </p>

          </div>

        </div>

      </section>
      {/* Cash Flow & GST Summary */}

      <section className="grid gap-6 xl:grid-cols-2">

        {/* Cash Flow */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">

            <TrendingUp
              size={26}
              className="text-green-600"
            />

            <div>

              <h2 className="text-2xl font-bold">
                Cash Flow Summary
              </h2>

              <p className="text-sm text-gray-500">
                Current financial overview
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <div className="flex items-center justify-between">

              <span className="text-gray-600">
                Cash Balance
              </span>

              <span className="font-bold text-green-600">
                ₹
                {stats.cashBalance.toLocaleString(
                  "en-IN"
                )}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-gray-600">
                Bank Balance
              </span>

              <span className="font-bold text-blue-600">
                ₹
                {stats.bankBalance.toLocaleString(
                  "en-IN"
                )}
              </span>

            </div>

            <div className="border-t pt-4">

              <div className="flex items-center justify-between text-lg font-bold">

                <span>Total Funds</span>

                <span>
                  ₹
                  {(
                    stats.cashBalance +
                    stats.bankBalance
                  ).toLocaleString("en-IN")}
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* GST */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">

            <FileText
              size={26}
              className="text-orange-600"
            />

            <div>

              <h2 className="text-2xl font-bold">
                GST Summary
              </h2>

              <p className="text-sm text-gray-500">
                Current GST position
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <div className="flex items-center justify-between">

              <span>
                GST Receivable
              </span>

              <span className="font-bold text-green-600">

                ₹
                {stats.gstReceivable.toLocaleString(
                  "en-IN"
                )}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span>
                GST Payable
              </span>

              <span className="font-bold text-red-600">

                ₹
                {stats.gstPayable.toLocaleString(
                  "en-IN"
                )}

              </span>

            </div>

            <div className="border-t pt-4">

              <div className="flex items-center justify-between text-lg font-bold">

                <span>Net GST</span>

                <span>

                  ₹
                  {(
                    stats.gstReceivable -
                    stats.gstPayable
                  ).toLocaleString("en-IN")}

                </span>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* Alerts */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-3">

          <AlertCircle
            size={24}
            className="text-red-500"
          />

          <h2 className="text-2xl font-bold">
            Financial Alerts
          </h2>

        </div>

        <div className="space-y-4">

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">

            <h3 className="font-semibold">
              Outstanding Receivable
            </h3>

            <p className="mt-2 text-sm text-gray-600">

              ₹
              {stats.receivable.toLocaleString(
                "en-IN"
              )}{" "}
              pending from customers.

            </p>

          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">

            <h3 className="font-semibold">
              Outstanding Payable
            </h3>

            <p className="mt-2 text-sm text-gray-600">

              ₹
              {stats.payable.toLocaleString(
                "en-IN"
              )}{" "}
              payable to suppliers.

            </p>

          </div>

        </div>

      </section>
      {/* Recent Activity Timeline */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold">
              Recent Activity
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest accounting activities will appear here.
            </p>

          </div>

        </div>

        <div className="space-y-5">

          <div className="flex items-start gap-4">

            <div className="mt-1 h-3 w-3 rounded-full bg-green-500" />

            <div>

              <p className="font-semibold">
                Sales invoices
              </p>

              <p className="text-sm text-gray-500">
                No recent sales invoices found.
              </p>

            </div>

          </div>

          <div className="flex items-start gap-4">

            <div className="mt-1 h-3 w-3 rounded-full bg-blue-500" />

            <div>

              <p className="font-semibold">
                Purchase entries
              </p>

              <p className="text-sm text-gray-500">
                No recent purchase entries found.
              </p>

            </div>

          </div>

          <div className="flex items-start gap-4">

            <div className="mt-1 h-3 w-3 rounded-full bg-red-500" />

            <div>

              <p className="font-semibold">
                Expense entries
              </p>

              <p className="text-sm text-gray-500">
                No recent expense records found.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* Footer */}

      <footer className="rounded-2xl border bg-white px-6 py-5 shadow-sm">

        <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">

          <div>

            <p className="font-semibold">
              SilentGEN Accounts ERP
            </p>

            <p className="text-sm text-gray-500">
              Integrated Accounting • GST • Inventory • Billing
            </p>

          </div>

          <div className="text-sm text-gray-500">

            Version 1.0.0

          </div>

        </div>

      </footer>

    </div>

  );
}

