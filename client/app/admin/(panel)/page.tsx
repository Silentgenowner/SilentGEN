"use client";

import Link from "next/link";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  Banknote,
  BookOpen,
  Boxes,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileBarChart,
  Home,
  Landmark,
  Loader2,
  Package,
  Receipt,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Store,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type AdminRole =
  | "super_admin"
  | "product_manager"
  | "order_manager"
  | "support_admin"
  | "finance_manager";

type Overview = {
  ecommerceRevenue: number;
  orders: number;
  customers: number;
  products: number;

  accountSales: number;
  purchases: number;
  expenses: number;
  profitEstimate: number;
};

type TodaySummary = {
  ecommerceRevenue: number;
  orders: number;
  customers: number;
};

type CurrentMonthSummary = {
  ecommerceRevenue: number;
  orders: number;
  customers: number;

  sales: number;
  purchases: number;
  expenses: number;

  profitEstimate: number;
};

type FinancialYearSummary = {
  sales: number;
  purchases: number;
  expenses: number;
  profitEstimate: number;
};

type BreakdownRow = {
  _id?: string | null;
  count: number;
  amount: number;
};

type OrderSummary = {
  pending: number;
  delivered: number;
  cancelled: number;
  returns: number;
  exchanges: number;

  statusBreakdown: BreakdownRow[];
  paymentStatusBreakdown: BreakdownRow[];
  paymentMethodBreakdown: BreakdownRow[];
};

type LowStockProduct = {
  _id: string;
  name?: string;
  sku?: string;
  thumbnail?: string;
  stock?: number;
  lowStockLimit?: number;
  status?: string;
  price?: number;
};

type ProductSummary = {
  total: number;
  active: number;
  draft: number;
  outOfStock: number;
  featured: number;

  lowStock: LowStockProduct[];
};

type CustomerSummary = {
  total: number;
  today: number;
  month: number;
};

type AccountsMoneySummary = {
  count: number;
  taxable: number;
  gst: number;
  total: number;
  paid: number;
  due: number;
};

type ExpenseSummary = {
  count: number;
  taxable: number;
  gst: number;
  total: number;
};

type ReceivablePayable = {
  amount: number;
  count: number;
};

type CashBank = {
  cash: number;
  bank: number;
  total: number;
};

type GstSummary = {
  output: number;
  purchaseInput: number;
  expenseInput: number;
  input: number;
  net: number;
  payable: number;
  credit: number;
};

type AccountsSummary = {
  sales: AccountsMoneySummary;
  purchases: AccountsMoneySummary;
  expenses: ExpenseSummary;

  receivable: ReceivablePayable;
  payable: ReceivablePayable;

  cashBank: CashBank;
  gst: GstSummary;

  profitEstimate: number;
};

type OrderUser = {
  _id?: string;
  name?: string;
  mobile?: string;
  email?: string;
};

type RecentOrder = {
  _id: string;

  orderNumber?: string;
  orderId?: string;

  user?: OrderUser | string | null;

  totalAmount?: number;
  grandTotal?: number;
  totalPrice?: number;

  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;

  createdAt?: string;
};

type RecentCustomer = {
  _id: string;

  name?: string;
  mobile?: string;
  email?: string;
  profileImage?: string;

  isVerified?: boolean;
  isBlocked?: boolean;

  createdAt?: string;
};

type TopProduct = {
  _id: string;

  name?: string;
  sku?: string;

  thumbnail?: string;

  price?: number;
  stock?: number;
  sold?: number;

  status?: string;
};

type TransactionLedger = {
  _id?: string;
  name?: string;
  ledgerType?: string;
};

type RecentTransaction = {
  _id: string;

  transactionNumber?: string;
  transactionDate?: string;
  transactionType?: string;

  ledgerId?: TransactionLedger | string | null;

  contraLedgerId?:
    | TransactionLedger
    | string
    | null;

  debit?: number;
  credit?: number;
  amount?: number;

  referenceType?: string;
  referenceNumber?: string;
  narration?: string;
};

type OutstandingParty = {
  _id: string;

  name?: string;
  phone?: string;
  email?: string;

  currentBalance?: number;
  payable?: number;
};

type MonthlyTrend = {
  year: number;
  month: number;

  ecommerceRevenue: number;
  orders: number;

  accountSales: number;
  purchases: number;
  expenses: number;

  difference: number;
};

type DashboardResponse = {
  success: boolean;
  message?: string;

  generatedAt?: string;

  admin?: {
    role?: AdminRole | string;
  };

  overview?: Overview;
  today?: TodaySummary;
  currentMonth?: CurrentMonthSummary;
  financialYear?: FinancialYearSummary;

  orderSummary?: OrderSummary;
  productSummary?: ProductSummary;
  customerSummary?: CustomerSummary;
  accounts?: AccountsSummary;

  topReceivables?: OutstandingParty[];
  topPayables?: OutstandingParty[];

  lowStockProducts?: LowStockProduct[];

  recentOrders?: RecentOrder[];
  recentCustomers?: RecentCustomer[];
  topProducts?: TopProduct[];
  recentTransactions?: RecentTransaction[];

  monthlyTrend?: MonthlyTrend[];
};

/* =========================================================
   DEFAULT VALUES
========================================================= */

const emptyOverview: Overview = {
  ecommerceRevenue: 0,
  orders: 0,
  customers: 0,
  products: 0,

  accountSales: 0,
  purchases: 0,
  expenses: 0,
  profitEstimate: 0,
};

const emptyToday: TodaySummary = {
  ecommerceRevenue: 0,
  orders: 0,
  customers: 0,
};

const emptyCurrentMonth: CurrentMonthSummary = {
  ecommerceRevenue: 0,
  orders: 0,
  customers: 0,

  sales: 0,
  purchases: 0,
  expenses: 0,

  profitEstimate: 0,
};

const emptyFinancialYear: FinancialYearSummary = {
  sales: 0,
  purchases: 0,
  expenses: 0,
  profitEstimate: 0,
};

const emptyOrderSummary: OrderSummary = {
  pending: 0,
  delivered: 0,
  cancelled: 0,
  returns: 0,
  exchanges: 0,

  statusBreakdown: [],
  paymentStatusBreakdown: [],
  paymentMethodBreakdown: [],
};

const emptyProductSummary: ProductSummary = {
  total: 0,
  active: 0,
  draft: 0,
  outOfStock: 0,
  featured: 0,
  lowStock: [],
};

const emptyCustomerSummary: CustomerSummary = {
  total: 0,
  today: 0,
  month: 0,
};

const emptyAccountsMoney: AccountsMoneySummary = {
  count: 0,
  taxable: 0,
  gst: 0,
  total: 0,
  paid: 0,
  due: 0,
};

const emptyExpenseSummary: ExpenseSummary = {
  count: 0,
  taxable: 0,
  gst: 0,
  total: 0,
};

const emptyAccounts: AccountsSummary = {
  sales: emptyAccountsMoney,

  purchases: emptyAccountsMoney,

  expenses: emptyExpenseSummary,

  receivable: {
    amount: 0,
    count: 0,
  },

  payable: {
    amount: 0,
    count: 0,
  },

  cashBank: {
    cash: 0,
    bank: 0,
    total: 0,
  },

  gst: {
    output: 0,
    purchaseInput: 0,
    expenseInput: 0,
    input: 0,
    net: 0,
    payable: 0,
    credit: 0,
  },

  profitEstimate: 0,
};

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value) || 0
  );
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getMonthName(
  month: number
) {
  return new Date(
    2000,
    Math.max(
      0,
      month - 1
    ),
    1
  ).toLocaleString(
    "en-IN",
    {
      month: "short",
    }
  );
}

function readJson(
  text: string
): DashboardResponse | null {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(
      text
    ) as DashboardResponse;
  } catch {
    return null;
  }
}

function getOrderTotal(
  order: RecentOrder
) {
  return Number(
    order.totalAmount ??
      order.grandTotal ??
      order.totalPrice ??
      0
  );
}

function getOrderCustomer(
  order: RecentOrder
) {
  if (
    order.user &&
    typeof order.user ===
      "object"
  ) {
    return (
      order.user.name ||
      order.user.mobile ||
      order.user.email ||
      "Customer"
    );
  }

  return "Customer";
}

function getLedgerName(
  value:
    | TransactionLedger
    | string
    | null
    | undefined
) {
  if (!value) {
    return "-";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  return (
    value.name ||
    "-"
  );
}

function roleLabel(
  role?: string
) {
  switch (role) {
    case "super_admin":
      return "Super Admin";

    case "product_manager":
      return "Product Manager";

    case "order_manager":
      return "Order Manager";

    case "support_admin":
      return "Support Admin";

    case "finance_manager":
      return "Finance Manager";

    default:
      return "Admin";
  }
}

/* =========================================================
   STATUS STYLE
========================================================= */

function getStatusClass(
  status?: string
) {
  const value =
    String(
      status || ""
    ).toLowerCase();

  if (
    value.includes(
      "delivered"
    ) ||
    value.includes(
      "paid"
    ) ||
    value === "active"
  ) {
    return "bg-green-50 text-green-700";
  }

  if (
    value.includes(
      "cancel"
    ) ||
    value.includes(
      "failed"
    ) ||
    value.includes(
      "blocked"
    )
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    value.includes(
      "shipped"
    ) ||
    value.includes(
      "packed"
    )
  ) {
    return "bg-purple-50 text-purple-700";
  }

  if (
    value.includes(
      "confirmed"
    ) ||
    value.includes(
      "processing"
    )
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    value.includes(
      "out for delivery"
    )
  ) {
    return "bg-orange-50 text-orange-700";
  }

  if (
    value.includes(
      "return"
    ) ||
    value.includes(
      "exchange"
    )
  ) {
    return "bg-pink-50 text-pink-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminDashboardPage() {
  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    generatedAt,
    setGeneratedAt,
  ] =
    useState("");

  const [
    adminRole,
    setAdminRole,
  ] =
    useState<
      string
    >("super_admin");

  const [
    overview,
    setOverview,
  ] =
    useState<Overview>(
      emptyOverview
    );

  const [
    today,
    setToday,
  ] =
    useState<TodaySummary>(
      emptyToday
    );

  const [
    currentMonth,
    setCurrentMonth,
  ] =
    useState<CurrentMonthSummary>(
      emptyCurrentMonth
    );

  const [
    financialYear,
    setFinancialYear,
  ] =
    useState<FinancialYearSummary>(
      emptyFinancialYear
    );

  const [
    orderSummary,
    setOrderSummary,
  ] =
    useState<OrderSummary>(
      emptyOrderSummary
    );

  const [
    productSummary,
    setProductSummary,
  ] =
    useState<ProductSummary>(
      emptyProductSummary
    );

  const [
    customerSummary,
    setCustomerSummary,
  ] =
    useState<CustomerSummary>(
      emptyCustomerSummary
    );

  const [
    accounts,
    setAccounts,
  ] =
    useState<AccountsSummary>(
      emptyAccounts
    );

  const [
    recentOrders,
    setRecentOrders,
  ] =
    useState<
      RecentOrder[]
    >([]);

  const [
    recentCustomers,
    setRecentCustomers,
  ] =
    useState<
      RecentCustomer[]
    >([]);

  const [
    topProducts,
    setTopProducts,
  ] =
    useState<
      TopProduct[]
    >([]);

  const [
    recentTransactions,
    setRecentTransactions,
  ] =
    useState<
      RecentTransaction[]
    >([]);

  const [
    topReceivables,
    setTopReceivables,
  ] =
    useState<
      OutstandingParty[]
    >([]);

  const [
    topPayables,
    setTopPayables,
  ] =
    useState<
      OutstandingParty[]
    >([]);

  const [
    lowStockProducts,
    setLowStockProducts,
  ] =
    useState<
      LowStockProduct[]
    >([]);

  const [
    monthlyTrend,
    setMonthlyTrend,
  ] =
    useState<
      MonthlyTrend[]
    >([]);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard =
    useCallback(
      async (
        showRefresh =
          false
      ) => {
        try {
          if (
            showRefresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError("");

          const response =
            await fetch(
              "/api/admin/dashboard",
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const text =
            await response.text();

          const data =
            readJson(text);

          if (
            !response.ok ||
            !data?.success
          ) {
            throw new Error(
              data?.message ||
                `Unable to load dashboard (${response.status}).`
            );
          }

          setGeneratedAt(
            data.generatedAt ||
              ""
          );

          setAdminRole(
            data.admin
              ?.role ||
              "super_admin"
          );

          setOverview(
            data.overview ||
              emptyOverview
          );

          setToday(
            data.today ||
              emptyToday
          );

          setCurrentMonth(
            data.currentMonth ||
              emptyCurrentMonth
          );

          setFinancialYear(
            data.financialYear ||
              emptyFinancialYear
          );

          setOrderSummary(
            data.orderSummary ||
              emptyOrderSummary
          );

          setProductSummary(
            data.productSummary ||
              emptyProductSummary
          );

          setCustomerSummary(
            data.customerSummary ||
              emptyCustomerSummary
          );

          setAccounts(
            data.accounts ||
              emptyAccounts
          );

          setRecentOrders(
            Array.isArray(
              data.recentOrders
            )
              ? data.recentOrders
              : []
          );

          setRecentCustomers(
            Array.isArray(
              data.recentCustomers
            )
              ? data.recentCustomers
              : []
          );

          setTopProducts(
            Array.isArray(
              data.topProducts
            )
              ? data.topProducts
              : []
          );

          setRecentTransactions(
            Array.isArray(
              data.recentTransactions
            )
              ? data.recentTransactions
              : []
          );

          setTopReceivables(
            Array.isArray(
              data.topReceivables
            )
              ? data.topReceivables
              : []
          );

          setTopPayables(
            Array.isArray(
              data.topPayables
            )
              ? data.topPayables
              : []
          );

          const lowStock =
            Array.isArray(
              data.lowStockProducts
            )
              ? data.lowStockProducts
              : Array.isArray(
                  data.productSummary
                    ?.lowStock
                )
              ? data.productSummary!
                  .lowStock
              : [];

          setLowStockProducts(
            lowStock
          );

          setMonthlyTrend(
            Array.isArray(
              data.monthlyTrend
            )
              ? data.monthlyTrend
              : []
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load dashboard."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      void loadDashboard();
    },
    [loadDashboard]
  );

  /* =======================================================
     CHART MAX
  ======================================================= */

  const chartMaximum =
    useMemo(
      () => {
        let maximum =
          1;

        for (
          const row of
          monthlyTrend
        ) {
          maximum =
            Math.max(
              maximum,
              Number(
                row.ecommerceRevenue ||
                  0
              ),
              Number(
                row.accountSales ||
                  0
              ),
              Number(
                row.purchases ||
                  0
              ),
              Number(
                row.expenses ||
                  0
              )
            );
        }

        return maximum;
      },
      [monthlyTrend]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[650px] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-gray-700"
          />

          <p className="mt-3 text-sm font-semibold text-gray-500">
            Loading detailed Admin Dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="mx-auto max-w-[1800px] space-y-6">
      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="overflow-hidden rounded-3xl bg-black p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400">
              SilentGEN Control Center
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">
              Store, orders, products, customers and complete
              accounts performance from one dashboard.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                {roleLabel(
                  adminRole
                )}
              </span>

              {generatedAt && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-gray-300">
                  Updated{" "}
                  {new Date(
                    generatedAt
                  ).toLocaleString(
                    "en-IN"
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void loadDashboard(
                  true
                )
              }
              disabled={
                refreshing
              }
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black hover:bg-gray-200"
            >
              Orders

              <ArrowUpRight
                size={17}
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-bold text-red-700">
            Dashboard Error
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        </section>
      )}

      {/* ===================================================
          QUICK ACTIONS
      =================================================== */}

      <section>
        <SectionHeader
          title="Quick Actions"
          description="Open your most-used admin modules."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          <QuickAction
            href="/admin/products"
            icon={
              <Package
                size={20}
              />
            }
            title="Products"
          />

          <QuickAction
            href="/admin/orders"
            icon={
              <ShoppingCart
                size={20}
              />
            }
            title="Orders"
          />

          <QuickAction
            href="/admin/customers"
            icon={
              <Users
                size={20}
              />
            }
            title="Customers"
          />

          <QuickAction
            href="/admin/homepage"
            icon={
              <Home
                size={20}
              />
            }
            title="Homepage"
          />

          <QuickAction
            href="/admin/accounts"
            icon={
              <BookOpen
                size={20}
              />
            }
            title="Accounts"
          />

          <QuickAction
            href="/admin/accounts/gst"
            icon={
              <BadgeIndianRupee
                size={20}
              />
            }
            title="GST"
          />

          <QuickAction
            href="/admin/accounts/reports"
            icon={
              <FileBarChart
                size={20}
              />
            }
            title="Reports"
          />

          <QuickAction
            href="/admin/settings"
            icon={
              <Store
                size={20}
              />
            }
            title="Settings"
          />
        </div>
      </section>

      {/* ===================================================
          MAIN BUSINESS OVERVIEW
      =================================================== */}

      <section>
        <SectionHeader
          title="Business Overview"
          description="All-time ecommerce and store totals."
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MainStatCard
            label="Ecommerce Revenue"
            value={formatCurrency(
              overview.ecommerceRevenue
            )}
            description="Revenue excluding cancelled orders"
            icon={
              <CircleDollarSign
                size={23}
              />
            }
            iconClass="bg-green-100 text-green-700"
          />

          <MainStatCard
            label="Total Orders"
            value={overview.orders.toLocaleString(
              "en-IN"
            )}
            description="Orders received"
            icon={
              <ShoppingCart
                size={23}
              />
            }
            iconClass="bg-blue-100 text-blue-700"
          />

          <MainStatCard
            label="Customers"
            value={overview.customers.toLocaleString(
              "en-IN"
            )}
            description="Registered customers"
            icon={
              <Users
                size={23}
              />
            }
            iconClass="bg-purple-100 text-purple-700"
          />

          <MainStatCard
            label="Products"
            value={overview.products.toLocaleString(
              "en-IN"
            )}
            description="Products in catalog"
            icon={
              <Package
                size={23}
              />
            }
            iconClass="bg-orange-100 text-orange-700"
          />
        </div>
      </section>

      {/* ===================================================
          TODAY
      =================================================== */}

      <section>
        <SectionHeader
          title="Today"
          description="Today's ecommerce activity."
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SmallStatCard
            label="Today's Revenue"
            value={formatCurrency(
              today.ecommerceRevenue
            )}
            hint="Today ecommerce sales"
          />

          <SmallStatCard
            label="Today's Orders"
            value={today.orders.toLocaleString(
              "en-IN"
            )}
            hint="New orders today"
          />

          <SmallStatCard
            label="New Customers"
            value={today.customers.toLocaleString(
              "en-IN"
            )}
            hint="Registered today"
          />
        </div>
      </section>

      {/* ===================================================
          CURRENT MONTH
      =================================================== */}

      <section>
        <SectionHeader
          title="Current Month"
          description="Monthly ecommerce and accounting performance."
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SmallStatCard
            label="Ecommerce Revenue"
            value={formatCurrency(
              currentMonth.ecommerceRevenue
            )}
            hint={`${currentMonth.orders} orders`}
          />

          <SmallStatCard
            label="Accounting Sales"
            value={formatCurrency(
              currentMonth.sales
            )}
            hint="Sales invoices"
          />

          <SmallStatCard
            label="Purchases"
            value={formatCurrency(
              currentMonth.purchases
            )}
            hint="Purchase bills"
          />

          <SmallStatCard
            label="Expenses"
            value={formatCurrency(
              currentMonth.expenses
            )}
            hint="Expense vouchers"
          />
        </div>

        <div className="mt-4 rounded-2xl bg-black p-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Current Month Difference
              </p>

              <p className="mt-2 text-sm text-gray-300">
                Accounting sales - purchase - expenses
              </p>
            </div>

            <p className="text-3xl font-black">
              {formatCurrency(
                currentMonth.profitEstimate
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================
          ORDER OPERATIONS
      =================================================== */}

      <section>
        <SectionHeader
          title="Order Operations"
          description="Current order workflow status."
          actionHref="/admin/orders"
          actionText="Manage Orders"
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatusStat
            label="Pending / Active"
            value={
              orderSummary.pending
            }
            className="bg-yellow-50 text-yellow-700"
          />

          <StatusStat
            label="Delivered"
            value={
              orderSummary.delivered
            }
            className="bg-green-50 text-green-700"
          />

          <StatusStat
            label="Cancelled"
            value={
              orderSummary.cancelled
            }
            className="bg-red-50 text-red-700"
          />

          <StatusStat
            label="Returns"
            value={
              orderSummary.returns
            }
            className="bg-purple-50 text-purple-700"
          />

          <StatusStat
            label="Exchanges"
            value={
              orderSummary.exchanges
            }
            className="bg-blue-50 text-blue-700"
          />
        </div>
      </section>

      {/* ===================================================
          INVENTORY HEALTH
      =================================================== */}

      <section>
        <SectionHeader
          title="Inventory Health"
          description="Product availability and catalog status."
          actionHref="/admin/products"
          actionText="Manage Products"
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SmallStatCard
            label="Total Products"
            value={productSummary.total.toLocaleString(
              "en-IN"
            )}
            hint="Catalog total"
          />

          <SmallStatCard
            label="Active"
            value={productSummary.active.toLocaleString(
              "en-IN"
            )}
            hint="Published products"
          />

          <SmallStatCard
            label="Draft"
            value={productSummary.draft.toLocaleString(
              "en-IN"
            )}
            hint="Unpublished"
          />

          <SmallStatCard
            label="Out of Stock"
            value={productSummary.outOfStock.toLocaleString(
              "en-IN"
            )}
            hint="Needs restocking"
          />

          <SmallStatCard
            label="Featured"
            value={productSummary.featured.toLocaleString(
              "en-IN"
            )}
            hint="Featured products"
          />
        </div>
      </section>

      {/* ===================================================
          ACCOUNTS OVERVIEW
      =================================================== */}

      <section>
        <SectionHeader
          title="Accounts Overview"
          description="Sales, purchases, expenses and profit estimate."
          actionHref="/admin/accounts"
          actionText="Accounts Dashboard"
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MainStatCard
            label="Accounting Sales"
            value={formatCurrency(
              accounts.sales.total
            )}
            description={`${accounts.sales.count} invoices`}
            icon={
              <TrendingUp
                size={22}
              />
            }
            iconClass="bg-green-100 text-green-700"
          />

          <MainStatCard
            label="Purchases"
            value={formatCurrency(
              accounts.purchases.total
            )}
            description={`${accounts.purchases.count} bills`}
            icon={
              <TrendingDown
                size={22}
              />
            }
            iconClass="bg-blue-100 text-blue-700"
          />

          <MainStatCard
            label="Expenses"
            value={formatCurrency(
              accounts.expenses.total
            )}
            description={`${accounts.expenses.count} vouchers`}
            icon={
              <WalletCards
                size={22}
              />
            }
            iconClass="bg-orange-100 text-orange-700"
          />

          <MainStatCard
            label="Profit Estimate"
            value={formatCurrency(
              accounts.profitEstimate
            )}
            description="Taxable sales - purchase - expense"
            icon={
              <CircleDollarSign
                size={22}
              />
            }
            iconClass="bg-purple-100 text-purple-700"
          />
        </div>
      </section>

      {/* ===================================================
          RECEIVABLE PAYABLE CASH BANK
      =================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MainStatCard
          label="Receivable"
          value={formatCurrency(
            accounts.receivable.amount
          )}
          description={`${accounts.receivable.count} customers`}
          icon={
            <CreditCard
              size={22}
            />
          }
          iconClass="bg-green-100 text-green-700"
        />

        <MainStatCard
          label="Payable"
          value={formatCurrency(
            accounts.payable.amount
          )}
          description={`${accounts.payable.count} suppliers`}
          icon={
            <Receipt
              size={22}
            />
          }
          iconClass="bg-red-100 text-red-700"
        />

        <MainStatCard
          label="Cash"
          value={formatCurrency(
            accounts.cashBank.cash
          )}
          description="Cash ledger balance"
          icon={
            <Banknote
              size={22}
            />
          }
          iconClass="bg-yellow-100 text-yellow-700"
        />

        <MainStatCard
          label="Bank"
          value={formatCurrency(
            accounts.cashBank.bank
          )}
          description="Bank ledger balance"
          icon={
            <Landmark
              size={22}
            />
          }
          iconClass="bg-blue-100 text-blue-700"
        />
      </section>

      {/* ===================================================
          GST
      =================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="GST Position"
          description="Output GST vs eligible input GST."
          actionHref="/admin/accounts/gst"
          actionText="GST Report"
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <MiniStat
            label="Output GST"
            value={formatCurrency(
              accounts.gst.output
            )}
          />

          <MiniStat
            label="Purchase Input"
            value={formatCurrency(
              accounts.gst.purchaseInput
            )}
          />

          <MiniStat
            label="Expense Input"
            value={formatCurrency(
              accounts.gst.expenseInput
            )}
          />

          <MiniStat
            label="Total Input"
            value={formatCurrency(
              accounts.gst.input
            )}
          />

          <MiniStat
            label="GST Payable"
            value={formatCurrency(
              accounts.gst.payable
            )}
          />

          <MiniStat
            label="GST Credit"
            value={formatCurrency(
              accounts.gst.credit
            )}
          />
        </div>

        <div className="mt-4 rounded-xl bg-black p-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Net GST
              </p>

              <p className="mt-1 font-bold">
                {accounts.gst.net >
                0
                  ? "GST Payable"
                  : accounts.gst.net <
                    0
                  ? "Input Tax Credit"
                  : "Nil GST Position"}
              </p>
            </div>

            <p className="text-2xl font-black">
              {formatCurrency(
                Math.abs(
                  accounts.gst.net
                )
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================
          FINANCIAL YEAR
      =================================================== */}

      <section>
        <SectionHeader
          title="Current Financial Year"
          description="April to current date accounting summary."
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SmallStatCard
            label="FY Sales"
            value={formatCurrency(
              financialYear.sales
            )}
            hint="Accounting sales"
          />

          <SmallStatCard
            label="FY Purchases"
            value={formatCurrency(
              financialYear.purchases
            )}
            hint="Purchase bills"
          />

          <SmallStatCard
            label="FY Expenses"
            value={formatCurrency(
              financialYear.expenses
            )}
            hint="Business expenses"
          />

          <SmallStatCard
            label="FY Profit Estimate"
            value={formatCurrency(
              financialYear.profitEstimate
            )}
            hint="Estimated operating difference"
          />
        </div>
      </section>

      {/* ===================================================
          MONTHLY TREND
      =================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="12 Month Performance"
          description="Ecommerce revenue, accounts sales, purchases and expenses."
        />

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[1000px] space-y-5">
            {monthlyTrend.map(
              (row) => (
                <MonthlyTrendRow
                  key={`${row.year}-${row.month}`}
                  row={row}
                  maximum={
                    chartMaximum
                  }
                />
              )
            )}

            {monthlyTrend.length ===
              0 && (
              <EmptyState
                icon={
                  <TrendingUp
                    size={32}
                  />
                }
                title="No trend data"
                description="Monthly performance will appear when transactions are available."
              />
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-5 text-xs font-semibold text-gray-600">
          <Legend
            colorClass="bg-black"
            label="Ecommerce Revenue"
          />

          <Legend
            colorClass="bg-green-500"
            label="Accounting Sales"
          />

          <Legend
            colorClass="bg-blue-500"
            label="Purchase"
          />

          <Legend
            colorClass="bg-orange-500"
            label="Expense"
          />
        </div>
      </section>

      {/* ===================================================
          RECENT ORDERS
      =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <SectionHeaderContainer>
          <SectionHeader
            title="Recent Orders"
            description="Latest ecommerce orders."
            actionHref="/admin/orders"
            actionText="View All"
          />
        </SectionHeaderContainer>

        {recentOrders.length >
        0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <TableHead>
                    Order
                  </TableHead>

                  <TableHead>
                    Customer
                  </TableHead>

                  <TableHead>
                    Date
                  </TableHead>

                  <TableHead>
                    Payment
                  </TableHead>

                  <TableHead align="right">
                    Total
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Action
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map(
                  (order) => {
                    const status =
                      order.orderStatus ||
                      "Placed";

                    return (
                      <tr
                        key={
                          order._id
                        }
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <TableCell strong>
                          {order.orderNumber ||
                            order.orderId ||
                            order._id
                              .slice(-8)
                              .toUpperCase()}
                        </TableCell>

                        <TableCell>
                          {getOrderCustomer(
                            order
                          )}
                        </TableCell>

                        <TableCell>
                          {formatDate(
                            order.createdAt
                          )}
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-700">
                              {order.paymentMethod ||
                                "-"}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {order.paymentStatus ||
                                "-"}
                            </p>
                          </div>
                        </TableCell>

                        <MoneyTableCell
                          value={getOrderTotal(
                            order
                          )}
                        />

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="font-semibold text-black hover:underline"
                          >
                            View
                          </Link>
                        </TableCell>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={
              <ShoppingCart
                size={38}
              />
            }
            title="No orders found"
            description="Recent customer orders will appear here."
          />
        )}
      </section>

      {/* ===================================================
          TOP PRODUCTS + LOW STOCK
      =================================================== */}

      <section className="grid gap-6 2xl:grid-cols-2">
        <ListPanel
          title="Top Selling Products"
          description="Products sorted by sold quantity"
          actionHref="/admin/products"
        >
          {topProducts.length >
          0 ? (
            topProducts.map(
              (product) => (
                <Link
                  key={
                    product._id
                  }
                  href={`/admin/products/${product._id}`}
                  className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">
                      {product.name ||
                        "Product"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {product.sku ||
                        "-"}{" "}
                      · Stock{" "}
                      {Number(
                        product.stock ||
                          0
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-black">
                      {Number(
                        product.sold ||
                          0
                      )}{" "}
                      sold
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatCurrency(
                        Number(
                          product.price ||
                            0
                        )
                      )}
                    </p>
                  </div>
                </Link>
              )
            )
          ) : (
            <SmallEmpty text="No product sales data." />
          )}
        </ListPanel>

        <ListPanel
          title="Low Stock Alert"
          description="Products requiring stock attention"
          actionHref="/admin/products"
        >
          {lowStockProducts.length >
          0 ? (
            lowStockProducts.map(
              (product) => (
                <Link
                  key={
                    product._id
                  }
                  href={`/admin/products/${product._id}`}
                  className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {product.name ||
                        "Product"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {product.sku ||
                        "-"}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                      {Number(
                        product.stock ||
                          0
                      )}{" "}
                      left
                    </span>

                    <p className="mt-1 text-[11px] text-gray-400">
                      Limit{" "}
                      {Number(
                        product.lowStockLimit ||
                          5
                      )}
                    </p>
                  </div>
                </Link>
              )
            )
          ) : (
            <SmallEmpty text="No low stock products." />
          )}
        </ListPanel>
      </section>

      {/* ===================================================
          RECEIVABLE + PAYABLE
      =================================================== */}

      <section className="grid gap-6 2xl:grid-cols-2">
        <PartyPanel
          title="Top Receivables"
          description="Customers with highest outstanding balance"
          rows={topReceivables.map(
            (row) => ({
              id:
                row._id,

              name:
                row.name ||
                "Customer",

              detail:
                row.phone ||
                row.email ||
                "",

              amount:
                Number(
                  row.currentBalance ||
                    0
                ),
            })
          )}
        />

        <PartyPanel
          title="Top Payables"
          description="Suppliers with highest payable balance"
          rows={topPayables.map(
            (row) => ({
              id:
                row._id,

              name:
                row.name ||
                "Supplier",

              detail:
                row.phone ||
                row.email ||
                "",

              amount:
                Number(
                  row.payable ??
                    Math.abs(
                      Number(
                        row.currentBalance ||
                          0
                      )
                    )
                ),
            })
          )}
        />
      </section>

      {/* ===================================================
          RECENT CUSTOMERS
      =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <SectionHeaderContainer>
          <SectionHeader
            title="Recent Customers"
            description="Latest registered customers."
            actionHref="/admin/customers"
            actionText="View All"
          />
        </SectionHeaderContainer>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {recentCustomers.map(
            (customer) => (
              <div
                key={
                  customer._id
                }
                className="border-b border-gray-100 p-5 sm:border-r"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <Users
                      size={18}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {customer.name ||
                        "Customer"}
                    </p>

                    <p className="truncate text-xs text-gray-500">
                      {customer.mobile ||
                        customer.email ||
                        "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      customer.isBlocked
                        ? "bg-red-50 text-red-700"
                        : customer.isVerified
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {customer.isBlocked
                      ? "Blocked"
                      : customer.isVerified
                      ? "Verified"
                      : "Unverified"}
                  </span>

                  <span className="text-xs text-gray-400">
                    {formatDate(
                      customer.createdAt
                    )}
                  </span>
                </div>
              </div>
            )
          )}

          {recentCustomers.length ===
            0 && (
            <div className="col-span-full">
              <EmptyState
                icon={
                  <UserPlus
                    size={34}
                  />
                }
                title="No customers"
                description="Recent customers will appear here."
              />
            </div>
          )}
        </div>
      </section>

      {/* ===================================================
          RECENT ACCOUNTING ENTRIES
      =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <SectionHeaderContainer>
          <SectionHeader
            title="Recent Accounting Entries"
            description="Latest debit and credit postings."
            actionHref="/admin/accounts/ledger"
            actionText="Open Ledgers"
          />
        </SectionHeaderContainer>

        {recentTransactions.length >
        0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  <TableHead>
                    Entry
                  </TableHead>

                  <TableHead>
                    Date
                  </TableHead>

                  <TableHead>
                    Type
                  </TableHead>

                  <TableHead>
                    Ledger
                  </TableHead>

                  <TableHead>
                    Contra
                  </TableHead>

                  <TableHead align="right">
                    Debit
                  </TableHead>

                  <TableHead align="right">
                    Credit
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {recentTransactions.map(
                  (
                    transaction
                  ) => (
                    <tr
                      key={
                        transaction._id
                      }
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <TableCell strong>
                        {transaction.transactionNumber ||
                          transaction.referenceNumber ||
                          transaction._id
                            .slice(-8)
                            .toUpperCase()}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          transaction.transactionDate
                        )}
                      </TableCell>

                      <TableCell>
                        {String(
                          transaction.transactionType ||
                            "-"
                        )
                          .replace(
                            /_/g,
                            " "
                          )
                          .toUpperCase()}
                      </TableCell>

                      <TableCell strong>
                        {getLedgerName(
                          transaction.ledgerId
                        )}
                      </TableCell>

                      <TableCell>
                        {getLedgerName(
                          transaction.contraLedgerId
                        )}
                      </TableCell>

                      <MoneyTableCell
                        value={Number(
                          transaction.debit ||
                            0
                        )}
                      />

                      <MoneyTableCell
                        value={Number(
                          transaction.credit ||
                            0
                        )}
                      />
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={
              <BookOpen
                size={34}
              />
            }
            title="No accounting entries"
            description="Recent ledger entries will appear here."
          />
        )}
      </section>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  description,
  actionHref,
  actionText,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionText?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-black text-gray-950">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>

      {actionHref &&
        actionText && (
          <Link
            href={
              actionHref
            }
            className="inline-flex items-center gap-1 text-sm font-bold text-black hover:underline"
          >
            {actionText}

            <ArrowRight
              size={15}
            />
          </Link>
        )}
    </div>
  );
}

function SectionHeaderContainer({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="border-b border-gray-200 p-5 sm:p-6">
      {children}
    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  icon,
  title,
}: {
  href: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
          {icon}
        </div>

        <ArrowUpRight
          size={16}
          className="text-gray-300 transition group-hover:text-black"
        />
      </div>

      <p className="mt-4 text-sm font-black">
        {title}
      </p>
    </Link>
  );
}

/* =========================================================
   MAIN STAT
========================================================= */

function MainStatCard({
  label,
  value,
  description,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  description: string;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black text-gray-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   SMALL STAT
========================================================= */

function SmallStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-400">
        {hint}
      </p>
    </div>
  );
}

/* =========================================================
   STATUS STAT
========================================================= */

function StatusStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${className}`}
      >
        {label}
      </span>

      <p className="mt-4 text-3xl font-black">
        {Number(
          value || 0
        ).toLocaleString(
          "en-IN"
        )}
      </p>
    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold text-gray-500">
        {label}
      </p>

      <p className="mt-2 font-black">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   TREND ROW
========================================================= */

function MonthlyTrendRow({
  row,
  maximum,
}: {
  row: MonthlyTrend;
  maximum: number;
}) {
  return (
    <div className="grid grid-cols-[90px_1fr_170px] items-center gap-4">
      <div>
        <p className="text-sm font-bold">
          {getMonthName(
            row.month
          )}
        </p>

        <p className="text-xs text-gray-400">
          {row.year}
        </p>
      </div>

      <div className="space-y-1.5">
        <TrendBar
          value={
            row.ecommerceRevenue
          }
          maximum={
            maximum
          }
          className="bg-black"
        />

        <TrendBar
          value={
            row.accountSales
          }
          maximum={
            maximum
          }
          className="bg-green-500"
        />

        <TrendBar
          value={
            row.purchases
          }
          maximum={
            maximum
          }
          className="bg-blue-500"
        />

        <TrendBar
          value={
            row.expenses
          }
          maximum={
            maximum
          }
          className="bg-orange-500"
        />
      </div>

      <div className="text-right text-[11px] leading-5">
        <p>
          Web{" "}
          {formatCurrency(
            row.ecommerceRevenue
          )}
        </p>

        <p className="text-green-700">
          Sales{" "}
          {formatCurrency(
            row.accountSales
          )}
        </p>

        <p className="text-blue-700">
          Purchase{" "}
          {formatCurrency(
            row.purchases
          )}
        </p>

        <p className="text-orange-700">
          Expense{" "}
          {formatCurrency(
            row.expenses
          )}
        </p>
      </div>
    </div>
  );
}

function TrendBar({
  value,
  maximum,
  className,
}: {
  value: number;
  maximum: number;
  className: string;
}) {
  const width =
    Math.max(
      0,
      Math.min(
        100,
        (Number(
          value || 0
        ) /
          Math.max(
            maximum,
            1
          )) *
          100
      )
    );

  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${className}`}
        style={{
          width: `${width}%`,
        }}
      />
    </div>
  );
}

function Legend({
  colorClass,
  label,
}: {
  colorClass: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${colorClass}`}
      />

      {label}
    </div>
  );
}

/* =========================================================
   LIST PANEL
========================================================= */

function ListPanel({
  title,
  description,
  actionHref,
  children,
}: {
  title: string;
  description: string;
  actionHref: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-5">
        <div>
          <h2 className="font-black">
            {title}
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <Link
          href={
            actionHref
          }
          className="text-xs font-bold hover:underline"
        >
          View All
        </Link>
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   PARTY PANEL
========================================================= */

function PartyPanel({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;

  rows: Array<{
    id: string;
    name: string;
    detail: string;
    amount: number;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-5">
        <h2 className="font-black">
          {title}
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>
      </div>

      {rows.map(
        (row) => (
          <Link
            key={
              row.id
            }
            href={`/admin/accounts/ledger/${row.id}`}
            className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 hover:bg-gray-50"
          >
            <div>
              <p className="font-bold">
                {row.name}
              </p>

              {row.detail && (
                <p className="mt-1 text-xs text-gray-500">
                  {row.detail}
                </p>
              )}
            </div>

            <p className="font-black">
              {formatCurrency(
                row.amount
              )}
            </p>
          </Link>
        )
      )}

      {rows.length ===
        0 && (
        <SmallEmpty text="No outstanding balances." />
      )}
    </div>
  );
}

/* =========================================================
   TABLE
========================================================= */

function TableHead({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  strong = false,
}: {
  children: ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`px-5 py-4 text-sm ${
        strong
          ? "font-semibold text-gray-950"
          : "text-gray-600"
      }`}
    >
      {children}
    </td>
  );
}

function MoneyTableCell({
  value,
}: {
  value: number;
}) {
  return (
    <td className="px-5 py-4 text-right text-sm font-bold text-gray-950">
      {formatCurrency(
        value
      )}
    </td>
  );
}

/* =========================================================
   EMPTY STATES
========================================================= */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] items-center justify-center p-6 text-center">
      <div>
        <div className="mx-auto flex justify-center text-gray-300">
          {icon}
        </div>

        <p className="mt-3 font-bold text-gray-700">
          {title}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function SmallEmpty({
  text,
}: {
  text: string;
}) {
  return (
    <div className="p-10 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}