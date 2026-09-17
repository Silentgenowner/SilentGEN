"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowRight,
  BadgeIndianRupee,
  Banknote,
  BookOpen,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  CreditCard,
  FileBarChart,
  FileText,
  Landmark,
  Loader2,
  Receipt,
  RefreshCcw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type MoneySummary = {
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

type DashboardTotals = {
  sales: MoneySummary;
  purchases: MoneySummary;
  expenses: ExpenseSummary;
  profitEstimate: number;
};

type TodaySummary = {
  sales: {
    count: number;
    total: number;
  };
};

type CurrentMonthSummary = {
  sales: {
    count: number;
    total: number;
    paid: number;
    due: number;
  };

  purchases: {
    count: number;
    total: number;
    paid: number;
    due: number;
  };

  expenses: {
    count: number;
    total: number;
    taxable: number;
  };

  profitEstimate: number;
};

type FinancialYearSummary = {
  sales: number;
  purchases: number;
  expenses: number;
  profitEstimate: number;
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

type LedgerInfo = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  currentBalance?: number;
  payable?: number;
};

type ExpenseCategory = {
  category: string;
  count: number;
  total: number;
};

type MonthlyTrend = {
  year: number;
  month: number;
  sales: number;
  purchases: number;
  expenses: number;
  difference: number;
};

type TransactionLedger = {
  _id: string;
  name: string;
  ledgerType: string;
};

type RecentTransaction = {
  _id: string;
  transactionNumber: string;
  transactionDate: string;
  transactionType: string;
  ledgerId:
    | TransactionLedger
    | string;
  contraLedgerId?:
    | TransactionLedger
    | string
    | null;
  debit: number;
  credit: number;
  amount: number;
  referenceType?: string;
  referenceNumber?: string;
  narration?: string;
};

type RecentSales = {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName?: string;
  grandTotal: number;
  paidAmount?: number;
  dueAmount?: number;
  paid?: number;
  due?: number;
  paymentStatus?: string;
  status?: string;
};

type RecentPurchase = {
  _id: string;
  purchaseNumber: string;
  purchaseDate: string;
  supplierName?: string;
  grandTotal: number;
  paidAmount?: number;
  dueAmount?: number;
  paid?: number;
  due?: number;
  paymentStatus?: string;
  status?: string;
};

type RecentExpense = {
  _id: string;
  expenseNumber: string;
  expenseDate: string;
  category: string;
  description?: string;
  vendorName?: string;
  totalAmount: number;
  paymentMode?: string;
  status?: string;
};

type DashboardResponse = {
  success: boolean;
  message?: string;

  generatedAt?: string;

  totals?: DashboardTotals;
  today?: TodaySummary;
  currentMonth?: CurrentMonthSummary;
  financialYear?: FinancialYearSummary;

  receivable?: ReceivablePayable;
  payable?: ReceivablePayable;
  cashBank?: CashBank;
  gst?: GstSummary;

  topReceivables?: LedgerInfo[];
  topPayables?: LedgerInfo[];
  expenseCategories?: ExpenseCategory[];
  monthlyTrend?: MonthlyTrend[];

  recentTransactions?: RecentTransaction[];
  recentSales?: RecentSales[];
  recentPurchases?: RecentPurchase[];
  recentExpenses?: RecentExpense[];
};

/* =========================================================
   DEFAULTS
========================================================= */

const emptyMoneySummary: MoneySummary = {
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

const emptyTotals: DashboardTotals = {
  sales: emptyMoneySummary,
  purchases: emptyMoneySummary,
  expenses: emptyExpenseSummary,
  profitEstimate: 0,
};

const emptyToday: TodaySummary = {
  sales: {
    count: 0,
    total: 0,
  },
};

const emptyMonth: CurrentMonthSummary = {
  sales: {
    count: 0,
    total: 0,
    paid: 0,
    due: 0,
  },

  purchases: {
    count: 0,
    total: 0,
    paid: 0,
    due: 0,
  },

  expenses: {
    count: 0,
    total: 0,
    taxable: 0,
  },

  profitEstimate: 0,
};

const emptyFinancialYear: FinancialYearSummary = {
  sales: 0,
  purchases: 0,
  expenses: 0,
  profitEstimate: 0,
};

const emptyReceivablePayable: ReceivablePayable = {
  amount: 0,
  count: 0,
};

const emptyCashBank: CashBank = {
  cash: 0,
  bank: 0,
  total: 0,
};

const emptyGst: GstSummary = {
  output: 0,
  purchaseInput: 0,
  expenseInput: 0,
  input: 0,
  net: 0,
  payable: 0,
  credit: 0,
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
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value || 0)
  );
}

function formatDate(
  value?: string
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

  return value.name;
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

function getPaid(
  row:
    | RecentSales
    | RecentPurchase
) {
  return Number(
    row.paidAmount ??
      row.paid ??
      0
  );
}

function getDue(
  row:
    | RecentSales
    | RecentPurchase
) {
  return Number(
    row.dueAmount ??
      row.due ??
      0
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AccountsDashboardPage() {
  const [
    loading,
    setLoading,
  ] =
    useState(true);

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
    totals,
    setTotals,
  ] =
    useState<DashboardTotals>(
      emptyTotals
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
      emptyMonth
    );

  const [
    financialYear,
    setFinancialYear,
  ] =
    useState<FinancialYearSummary>(
      emptyFinancialYear
    );

  const [
    receivable,
    setReceivable,
  ] =
    useState<ReceivablePayable>(
      emptyReceivablePayable
    );

  const [
    payable,
    setPayable,
  ] =
    useState<ReceivablePayable>(
      emptyReceivablePayable
    );

  const [
    cashBank,
    setCashBank,
  ] =
    useState<CashBank>(
      emptyCashBank
    );

  const [
    gst,
    setGst,
  ] =
    useState<GstSummary>(
      emptyGst
    );

  const [
    topReceivables,
    setTopReceivables,
  ] =
    useState<
      LedgerInfo[]
    >([]);

  const [
    topPayables,
    setTopPayables,
  ] =
    useState<
      LedgerInfo[]
    >([]);

  const [
    expenseCategories,
    setExpenseCategories,
  ] =
    useState<
      ExpenseCategory[]
    >([]);

  const [
    monthlyTrend,
    setMonthlyTrend,
  ] =
    useState<
      MonthlyTrend[]
    >([]);

  const [
    recentTransactions,
    setRecentTransactions,
  ] =
    useState<
      RecentTransaction[]
    >([]);

  const [
    recentSales,
    setRecentSales,
  ] =
    useState<
      RecentSales[]
    >([]);

  const [
    recentPurchases,
    setRecentPurchases,
  ] =
    useState<
      RecentPurchase[]
    >([]);

  const [
    recentExpenses,
    setRecentExpenses,
  ] =
    useState<
      RecentExpense[]
    >([]);

  /* =======================================================
     LOAD
  ======================================================= */

  const loadDashboard =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const response =
            await fetch(
              "/api/admin/accounts/dashboard",
              {
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
                `Accounts dashboard API failed (${response.status}).`
            );
          }

          setGeneratedAt(
            data.generatedAt ??
              ""
          );

          setTotals(
            data.totals ??
              emptyTotals
          );

          setToday(
            data.today ??
              emptyToday
          );

          setCurrentMonth(
            data.currentMonth ??
              emptyMonth
          );

          setFinancialYear(
            data.financialYear ??
              emptyFinancialYear
          );

          setReceivable(
            data.receivable ??
              emptyReceivablePayable
          );

          setPayable(
            data.payable ??
              emptyReceivablePayable
          );

          setCashBank(
            data.cashBank ??
              emptyCashBank
          );

          setGst(
            data.gst ??
              emptyGst
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

          setExpenseCategories(
            Array.isArray(
              data.expenseCategories
            )
              ? data.expenseCategories
              : []
          );

          setMonthlyTrend(
            Array.isArray(
              data.monthlyTrend
            )
              ? data.monthlyTrend
              : []
          );

          setRecentTransactions(
            Array.isArray(
              data.recentTransactions
            )
              ? data.recentTransactions
              : []
          );

          setRecentSales(
            Array.isArray(
              data.recentSales
            )
              ? data.recentSales
              : []
          );

          setRecentPurchases(
            Array.isArray(
              data.recentPurchases
            )
              ? data.recentPurchases
              : []
          );

          setRecentExpenses(
            Array.isArray(
              data.recentExpenses
            )
              ? data.recentExpenses
              : []
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load accounts dashboard."
          );
        } finally {
          setLoading(
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
     TREND MAX
  ======================================================= */

  const trendMax =
    useMemo(
      () => {
        let maximum =
          0;

        for (
          const row of
          monthlyTrend
        ) {
          maximum =
            Math.max(
              maximum,
              Number(
                row.sales ||
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

        return Math.max(
          maximum,
          1
        );
      },
      [monthlyTrend]
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              SilentGEN Finance
            </p>

            <h1 className="mt-1 text-3xl font-black text-gray-950">
              Accounts Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Complete overview of sales, purchases, expenses,
              GST, cash flow and outstanding balances.
            </p>

            {generatedAt && (
              <p className="mt-2 text-xs text-gray-400">
                Last updated:{" "}
                {new Date(
                  generatedAt
                ).toLocaleString(
                  "en-IN"
                )}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              void loadDashboard()
            }
            disabled={
              loading
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCcw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* QUICK NAVIGATION */}

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <QuickLink
            href="/admin/accounts/ledger"
            icon={
              <BookOpen
                size={20}
              />
            }
            title="Ledger"
            description="Party & system ledgers"
          />

          <QuickLink
            href="/admin/accounts/sales-invoice"
            icon={
              <Receipt
                size={20}
              />
            }
            title="Sales Invoice"
            description="Create & manage sales"
          />

          <QuickLink
            href="/admin/accounts/purchase"
            icon={
              <ShoppingCart
                size={20}
              />
            }
            title="Purchase"
            description="Supplier purchase bills"
          />

          <QuickLink
            href="/admin/accounts/expenses"
            icon={
              <WalletCards
                size={20}
              />
            }
            title="Expenses"
            description="Business expenses"
          />

          <QuickLink
            href="/admin/accounts/gst"
            icon={
              <BadgeIndianRupee
                size={20}
              />
            }
            title="GST Reports"
            description="Input & output GST"
          />

          <QuickLink
            href="/admin/accounts/reports"
            icon={
              <FileBarChart
                size={20}
              />
            }
            title="Reports"
            description="Detailed financial reports"
          />
        </section>

        {loading ? (
          <div className="flex min-h-[520px] items-center justify-center rounded-2xl border bg-white">
            <div className="text-center">
              <Loader2
                size={34}
                className="mx-auto animate-spin"
              />

              <p className="mt-3 text-sm text-gray-500">
                Loading detailed accounts dashboard...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* MAIN BUSINESS TOTALS */}

            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MainCard
                title="Total Sales"
                value={formatCurrency(
                  totals.sales.total
                )}
                subtitle={`${totals.sales.count} invoices`}
                icon={
                  <TrendingUp
                    size={22}
                  />
                }
              />

              <MainCard
                title="Total Purchases"
                value={formatCurrency(
                  totals.purchases.total
                )}
                subtitle={`${totals.purchases.count} purchase bills`}
                icon={
                  <ShoppingCart
                    size={22}
                  />
                }
              />

              <MainCard
                title="Total Expenses"
                value={formatCurrency(
                  totals.expenses.total
                )}
                subtitle={`${totals.expenses.count} expense vouchers`}
                icon={
                  <TrendingDown
                    size={22}
                  />
                }
              />

              <MainCard
                title="Profit Estimate"
                value={formatCurrency(
                  totals.profitEstimate
                )}
                subtitle="Taxable sales - purchases - expenses"
                icon={
                  <ChartNoAxesCombined
                    size={22}
                  />
                }
              />
            </section>

            {/* TODAY + MONTH */}

            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Today's Sales"
                value={formatCurrency(
                  today.sales.total
                )}
                hint={`${today.sales.count} invoices`}
              />

              <StatCard
                label="Month Sales"
                value={formatCurrency(
                  currentMonth.sales.total
                )}
                hint={`${currentMonth.sales.count} invoices`}
              />

              <StatCard
                label="Month Purchase"
                value={formatCurrency(
                  currentMonth.purchases.total
                )}
                hint={`${currentMonth.purchases.count} bills`}
              />

              <StatCard
                label="Month Expenses"
                value={formatCurrency(
                  currentMonth.expenses.total
                )}
                hint={`${currentMonth.expenses.count} expenses`}
              />

              <StatCard
                label="Month Difference"
                value={formatCurrency(
                  currentMonth.profitEstimate
                )}
                hint="Sales - purchases - expenses"
              />
            </section>

            {/* OUTSTANDING + CASH */}

            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MainCard
                title="Receivable"
                value={formatCurrency(
                  receivable.amount
                )}
                subtitle={`${receivable.count} customers`}
                icon={
                  <CircleDollarSign
                    size={22}
                  />
                }
              />

              <MainCard
                title="Payable"
                value={formatCurrency(
                  payable.amount
                )}
                subtitle={`${payable.count} suppliers`}
                icon={
                  <CreditCard
                    size={22}
                  />
                }
              />

              <MainCard
                title="Cash Balance"
                value={formatCurrency(
                  cashBank.cash
                )}
                subtitle="Current cash ledger"
                icon={
                  <Banknote
                    size={22}
                  />
                }
              />

              <MainCard
                title="Bank Balance"
                value={formatCurrency(
                  cashBank.bank
                )}
                subtitle="Current bank ledgers"
                icon={
                  <Landmark
                    size={22}
                  />
                }
              />
            </section>

            {/* SALES/PURCHASE PAYMENT DETAILS */}

            <section className="mb-6 grid gap-5 xl:grid-cols-3">
              <DetailPanel
                title="Sales Position"
                icon={
                  <TrendingUp
                    size={19}
                  />
                }
                rows={[
                  [
                    "Taxable Sales",
                    formatCurrency(
                      totals.sales.taxable
                    ),
                  ],
                  [
                    "Output GST",
                    formatCurrency(
                      totals.sales.gst
                    ),
                  ],
                  [
                    "Paid",
                    formatCurrency(
                      totals.sales.paid
                    ),
                  ],
                  [
                    "Due",
                    formatCurrency(
                      totals.sales.due
                    ),
                  ],
                  [
                    "Grand Total",
                    formatCurrency(
                      totals.sales.total
                    ),
                  ],
                ]}
              />

              <DetailPanel
                title="Purchase Position"
                icon={
                  <ShoppingCart
                    size={19}
                  />
                }
                rows={[
                  [
                    "Taxable Purchase",
                    formatCurrency(
                      totals.purchases.taxable
                    ),
                  ],
                  [
                    "Input GST",
                    formatCurrency(
                      totals.purchases.gst
                    ),
                  ],
                  [
                    "Paid",
                    formatCurrency(
                      totals.purchases.paid
                    ),
                  ],
                  [
                    "Due",
                    formatCurrency(
                      totals.purchases.due
                    ),
                  ],
                  [
                    "Grand Total",
                    formatCurrency(
                      totals.purchases.total
                    ),
                  ],
                ]}
              />

              <DetailPanel
                title="Expense Position"
                icon={
                  <WalletCards
                    size={19}
                  />
                }
                rows={[
                  [
                    "Taxable Expense",
                    formatCurrency(
                      totals.expenses.taxable
                    ),
                  ],
                  [
                    "Input GST",
                    formatCurrency(
                      totals.expenses.gst
                    ),
                  ],
                  [
                    "Total Expense",
                    formatCurrency(
                      totals.expenses.total
                    ),
                  ],
                  [
                    "Month Expense",
                    formatCurrency(
                      currentMonth.expenses.total
                    ),
                  ],
                ]}
              />
            </section>

            {/* GST */}

            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                    Tax Position
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    GST Summary
                  </h2>
                </div>

                <Link
                  href="/admin/accounts/gst"
                  className="inline-flex items-center gap-2 text-sm font-semibold"
                >
                  Full GST Report

                  <ArrowRight
                    size={16}
                  />
                </Link>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <MiniStat
                  label="Output GST"
                  value={formatCurrency(
                    gst.output
                  )}
                />

                <MiniStat
                  label="Purchase Input"
                  value={formatCurrency(
                    gst.purchaseInput
                  )}
                />

                <MiniStat
                  label="Expense Input"
                  value={formatCurrency(
                    gst.expenseInput
                  )}
                />

                <MiniStat
                  label="Total Input"
                  value={formatCurrency(
                    gst.input
                  )}
                />

                <MiniStat
                  label="GST Payable"
                  value={formatCurrency(
                    gst.payable
                  )}
                />

                <MiniStat
                  label="GST Credit"
                  value={formatCurrency(
                    gst.credit
                  )}
                />
              </div>

              <div className="mt-5 rounded-xl bg-black p-4 text-white">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Net GST Position
                    </p>

                    <p className="mt-1 font-bold">
                      {gst.net >
                      0
                        ? "GST Payable"
                        : gst.net <
                          0
                        ? "Input Tax Credit"
                        : "Nil GST Balance"}
                    </p>
                  </div>

                  <p className="text-2xl font-black">
                    {formatCurrency(
                      Math.abs(
                        gst.net
                      )
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* FINANCIAL YEAR */}

            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <CalendarDays
                  size={20}
                />

                <div>
                  <h2 className="font-black">
                    Current Financial Year
                  </h2>

                  <p className="text-xs text-gray-500">
                    April to current date
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat
                  label="FY Sales"
                  value={formatCurrency(
                    financialYear.sales
                  )}
                />

                <MiniStat
                  label="FY Purchases"
                  value={formatCurrency(
                    financialYear.purchases
                  )}
                />

                <MiniStat
                  label="FY Expenses"
                  value={formatCurrency(
                    financialYear.expenses
                  )}
                />

                <MiniStat
                  label="FY Profit Estimate"
                  value={formatCurrency(
                    financialYear.profitEstimate
                  )}
                />
              </div>
            </section>

            {/* MONTHLY TREND */}

            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <ChartNoAxesCombined
                  size={20}
                />

                <div>
                  <h2 className="font-black">
                    12 Month Trend
                  </h2>

                  <p className="text-xs text-gray-500">
                    Sales vs purchases vs expenses
                  </p>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <div className="min-w-[900px] space-y-4">
                  {monthlyTrend.map(
                    (row) => (
                      <TrendRow
                        key={`${row.year}-${row.month}`}
                        label={`${getMonthName(
                          row.month
                        )} ${row.year}`}
                        sales={
                          row.sales
                        }
                        purchases={
                          row.purchases
                        }
                        expenses={
                          row.expenses
                        }
                        max={
                          trendMax
                        }
                      />
                    )
                  )}

                  {monthlyTrend.length ===
                    0 && (
                    <EmptyState text="No monthly trend data available." />
                  )}
                </div>
              </div>
            </section>

            {/* OUTSTANDING PARTIES */}

            <section className="mb-6 grid gap-5 xl:grid-cols-2">
              <PartyPanel
                title="Top Receivables"
                description="Customers who owe the most"
                rows={
                  topReceivables.map(
                    (row) => ({
                      id:
                        row._id,

                      name:
                        row.name,

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
                  )
                }
                emptyText="No customer receivables."
              />

              <PartyPanel
                title="Top Payables"
                description="Highest supplier outstanding"
                rows={
                  topPayables.map(
                    (row) => ({
                      id:
                        row._id,

                      name:
                        row.name,

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
                  )
                }
                emptyText="No supplier payables."
              />
            </section>

            {/* EXPENSE CATEGORIES */}

            <section className="mb-6 rounded-2xl border bg-white shadow-sm">
              <div className="border-b p-5">
                <h2 className="font-black">
                  Current Month Expense Categories
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Where business money is being spent
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <Head>
                        Category
                      </Head>

                      <Head align="right">
                        Entries
                      </Head>

                      <Head align="right">
                        Amount
                      </Head>
                    </tr>
                  </thead>

                  <tbody>
                    {expenseCategories.map(
                      (
                        row,
                        index
                      ) => (
                        <tr
                          key={`${row.category}-${index}`}
                          className="border-t"
                        >
                          <Cell strong>
                            {
                              row.category
                            }
                          </Cell>

                          <NumberCell
                            value={
                              row.count
                            }
                          />

                          <MoneyCell
                            value={
                              row.total
                            }
                            strong
                          />
                        </tr>
                      )
                    )}

                    {expenseCategories.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-12 text-center text-sm text-gray-500"
                        >
                          No expense categories for this month.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* RECENT SALES / PURCHASE / EXPENSE */}

            <section className="mb-6 grid gap-5 2xl:grid-cols-3">
              <RecentSalesPanel
                rows={
                  recentSales
                }
              />

              <RecentPurchasesPanel
                rows={
                  recentPurchases
                }
              />

              <RecentExpensesPanel
                rows={
                  recentExpenses
                }
              />
            </section>

            {/* ACCOUNTING TRANSACTIONS */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-black">
                    Recent Accounting Entries
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Latest debit and credit postings
                  </p>
                </div>

                <Link
                  href="/admin/accounts/ledger"
                  className="inline-flex items-center gap-2 text-sm font-semibold"
                >
                  Open Ledgers

                  <ArrowRight
                    size={16}
                  />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <Head>
                        Transaction
                      </Head>

                      <Head>
                        Date
                      </Head>

                      <Head>
                        Type
                      </Head>

                      <Head>
                        Ledger
                      </Head>

                      <Head>
                        Contra
                      </Head>

                      <Head align="right">
                        Debit
                      </Head>

                      <Head align="right">
                        Credit
                      </Head>
                    </tr>
                  </thead>

                  <tbody>
                    {recentTransactions.map(
                      (
                        row
                      ) => (
                        <tr
                          key={
                            row._id
                          }
                          className="border-t hover:bg-gray-50"
                        >
                          <Cell strong>
                            {
                              row.transactionNumber
                            }
                          </Cell>

                          <Cell>
                            {formatDate(
                              row.transactionDate
                            )}
                          </Cell>

                          <Cell>
                            {String(
                              row.transactionType ||
                                "-"
                            )
                              .replace(
                                /_/g,
                                " "
                              )
                              .toUpperCase()}
                          </Cell>

                          <Cell strong>
                            {getLedgerName(
                              row.ledgerId
                            )}
                          </Cell>

                          <Cell>
                            {getLedgerName(
                              row.contraLedgerId
                            )}
                          </Cell>

                          <MoneyCell
                            value={
                              row.debit
                            }
                          />

                          <MoneyCell
                            value={
                              row.credit
                            }
                          />
                        </tr>
                      )
                    )}

                    {recentTransactions.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center text-sm text-gray-500"
                        >
                          No accounting transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   QUICK LINK
========================================================= */

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
          {icon}
        </div>

        <ArrowRight
          size={17}
          className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-black"
        />
      </div>

      <h3 className="mt-4 font-black">
        {title}
      </h3>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>
    </Link>
  );
}

/* =========================================================
   MAIN CARD
========================================================= */

function MainCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
          {title}
        </p>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-2xl font-black text-gray-950">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-black">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {hint}
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

      <p className="mt-1 font-black">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   DETAIL PANEL
========================================================= */

function DetailPanel({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: ReactNode;
  rows: Array<
    [string, string]
  >;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}

        <h2 className="font-black">
          {title}
        </h2>
      </div>

      <div className="mt-5 space-y-3">
        {rows.map(
          (
            [
              label,
              value,
            ]
          ) => (
            <div
              key={
                label
              }
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm text-gray-500">
                {label}
              </span>

              <span className="font-semibold">
                {value}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TREND
========================================================= */

function TrendRow({
  label,
  sales,
  purchases,
  expenses,
  max,
}: {
  label: string;
  sales: number;
  purchases: number;
  expenses: number;
  max: number;
}) {
  const salesWidth =
    Math.max(
      0,
      Math.min(
        100,
        (sales / max) *
          100
      )
    );

  const purchaseWidth =
    Math.max(
      0,
      Math.min(
        100,
        (purchases /
          max) *
          100
      )
    );

  const expenseWidth =
    Math.max(
      0,
      Math.min(
        100,
        (expenses /
          max) *
          100
      )
    );

  return (
    <div className="grid grid-cols-[90px_1fr_160px] items-center gap-4">
      <p className="text-sm font-bold">
        {label}
      </p>

      <div className="space-y-1.5">
        <Bar
          width={
            salesWidth
          }
          className="bg-green-500"
        />

        <Bar
          width={
            purchaseWidth
          }
          className="bg-blue-500"
        />

        <Bar
          width={
            expenseWidth
          }
          className="bg-orange-500"
        />
      </div>

      <div className="text-right text-xs">
        <p className="font-semibold text-green-700">
          S{" "}
          {formatCurrency(
            sales
          )}
        </p>

        <p className="font-semibold text-blue-700">
          P{" "}
          {formatCurrency(
            purchases
          )}
        </p>

        <p className="font-semibold text-orange-700">
          E{" "}
          {formatCurrency(
            expenses
          )}
        </p>
      </div>
    </div>
  );
}

function Bar({
  width,
  className,
}: {
  width: number;
  className: string;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${className}`}
        style={{
          width:
            `${width}%`,
        }}
      />
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
  emptyText,
}: {
  title: string;
  description: string;

  rows: Array<{
    id: string;
    name: string;
    detail: string;
    amount: number;
  }>;

  emptyText: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b p-5">
        <h2 className="font-black">
          {title}
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>
      </div>

      <div>
        {rows.map(
          (row) => (
            <Link
              href={`/admin/accounts/ledger/${row.id}`}
              key={
                row.id
              }
              className="flex items-center justify-between gap-4 border-b px-5 py-4 last:border-b-0 hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold">
                  {row.name}
                </p>

                {row.detail && (
                  <p className="mt-1 text-xs text-gray-400">
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
          <div className="py-12 text-center text-sm text-gray-500">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   RECENT SALES
========================================================= */

function RecentSalesPanel({
  rows,
}: {
  rows: RecentSales[];
}) {
  return (
    <RecentPanel
      title="Recent Sales"
      href="/admin/accounts/sales-invoice"
      icon={
        <Receipt
          size={18}
        />
      }
    >
      {rows.map(
        (row) => (
          <Link
            key={
              row._id
            }
            href={`/admin/accounts/sales-invoice/${row._id}`}
            className="block border-b px-5 py-4 last:border-b-0 hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {
                    row.invoiceNumber
                  }
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {row.customerName ||
                    "Customer"}{" "}
                  ·{" "}
                  {formatDate(
                    row.invoiceDate
                  )}
                </p>
              </div>

              <p className="font-black">
                {formatCurrency(
                  row.grandTotal
                )}
              </p>
            </div>

            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-green-700">
                Paid:{" "}
                {formatCurrency(
                  getPaid(
                    row
                  )
                )}
              </span>

              <span className="text-red-600">
                Due:{" "}
                {formatCurrency(
                  getDue(
                    row
                  )
                )}
              </span>
            </div>
          </Link>
        )
      )}

      {rows.length ===
        0 && (
        <EmptyState text="No recent sales." />
      )}
    </RecentPanel>
  );
}

/* =========================================================
   RECENT PURCHASE
========================================================= */

function RecentPurchasesPanel({
  rows,
}: {
  rows: RecentPurchase[];
}) {
  return (
    <RecentPanel
      title="Recent Purchases"
      href="/admin/accounts/purchase"
      icon={
        <ShoppingCart
          size={18}
        />
      }
    >
      {rows.map(
        (row) => (
          <Link
            key={
              row._id
            }
            href={`/admin/accounts/purchase/${row._id}`}
            className="block border-b px-5 py-4 last:border-b-0 hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {
                    row.purchaseNumber
                  }
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {row.supplierName ||
                    "Supplier"}{" "}
                  ·{" "}
                  {formatDate(
                    row.purchaseDate
                  )}
                </p>
              </div>

              <p className="font-black">
                {formatCurrency(
                  row.grandTotal
                )}
              </p>
            </div>

            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-green-700">
                Paid:{" "}
                {formatCurrency(
                  getPaid(
                    row
                  )
                )}
              </span>

              <span className="text-red-600">
                Due:{" "}
                {formatCurrency(
                  getDue(
                    row
                  )
                )}
              </span>
            </div>
          </Link>
        )
      )}

      {rows.length ===
        0 && (
        <EmptyState text="No recent purchases." />
      )}
    </RecentPanel>
  );
}

/* =========================================================
   RECENT EXPENSES
========================================================= */

function RecentExpensesPanel({
  rows,
}: {
  rows: RecentExpense[];
}) {
  return (
    <RecentPanel
      title="Recent Expenses"
      href="/admin/accounts/expenses"
      icon={
        <WalletCards
          size={18}
        />
      }
    >
      {rows.map(
        (row) => (
          <Link
            key={
              row._id
            }
            href={`/admin/accounts/expenses/${row._id}`}
            className="block border-b px-5 py-4 last:border-b-0 hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {
                    row.expenseNumber
                  }
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {row.category}{" "}
                  ·{" "}
                  {formatDate(
                    row.expenseDate
                  )}
                </p>
              </div>

              <p className="font-black">
                {formatCurrency(
                  row.totalAmount
                )}
              </p>
            </div>

            {row.vendorName && (
              <p className="mt-2 text-xs text-gray-400">
                {row.vendorName}
              </p>
            )}
          </Link>
        )
      )}

      {rows.length ===
        0 && (
        <EmptyState text="No recent expenses." />
      )}
    </RecentPanel>
  );
}

/* =========================================================
   RECENT PANEL
========================================================= */

function RecentPanel({
  title,
  href,
  icon,
  children,
}: {
  title: string;
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-5">
        <div className="flex items-center gap-2">
          {icon}

          <h2 className="font-black">
            {title}
          </h2>
        </div>

        <Link
          href={href}
          className="text-xs font-semibold text-gray-500 hover:text-black"
        >
          View All
        </Link>
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   TABLE HELPERS
========================================================= */

function Head({
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

function Cell({
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

function MoneyCell({
  value,
  strong = false,
}: {
  value: number;
  strong?: boolean;
}) {
  return (
    <td
      className={`px-5 py-4 text-right text-sm ${
        strong
          ? "font-black text-gray-950"
          : "font-semibold text-gray-700"
      }`}
    >
      {formatCurrency(
        value
      )}
    </td>
  );
}

function NumberCell({
  value,
}: {
  value: number;
}) {
  return (
    <td className="px-5 py-4 text-right text-sm font-semibold">
      {Number(
        value || 0
      )}
    </td>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="py-10 text-center">
      <FileText
        size={27}
        className="mx-auto text-gray-300"
      />

      <p className="mt-3 text-sm text-gray-500">
        {text}
      </p>
    </div>
  );
}