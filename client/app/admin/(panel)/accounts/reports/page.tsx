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
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCcw,
  Search,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type MoneySummary = {
  count: number;

  taxable: number;

  cgst: number;
  sgst: number;
  igst: number;

  gst: number;

  total: number;

  paid: number;
  due: number;
};

type ExpenseSummary = {
  count: number;

  taxable: number;

  cgst: number;
  sgst: number;
  igst: number;

  gst: number;

  total: number;
};

type ReceivablePayable = {
  amount: number;
  count: number;
};

type CashBankSummary = {
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

type ProfitSummary = {
  estimate: number;
  operatingDifference?: number;
};

type SalesDetail = {
  id: string;

  invoiceNumber: string;
  invoiceDate: string | null;

  customerLedgerId: string;
  customerName: string;
  customerGstNumber: string;

  taxableAmount: number;

  cgst: number;
  sgst: number;
  igst: number;

  totalGst: number;

  roundOff: number;
  grandTotal: number;

  paid: number;
  due: number;

  paymentStatus: string;

  status: string;
  notes: string;
};

type PurchaseDetail = {
  id: string;

  purchaseNumber: string;
  supplierInvoiceNumber: string;

  purchaseDate: string | null;

  supplierLedgerId: string;
  supplierName: string;
  supplierGstNumber: string;

  taxableAmount: number;

  cgst: number;
  sgst: number;
  igst: number;

  totalGst: number;

  roundOff: number;
  grandTotal: number;

  paid: number;
  due: number;

  paymentStatus: string;

  status: string;
  notes: string;
};

type ExpenseDetail = {
  id: string;

  expenseNumber: string;
  expenseDate: string | null;

  category: string;
  description: string;

  vendorName: string;
  vendorLedgerId: string;

  billNumber: string;
  gstNumber: string;

  taxableAmount: number;
  gstRate: number;

  cgst: number;
  sgst: number;
  igst: number;

  totalGst: number;
  totalAmount: number;

  paymentMode: string;

  status: string;
  notes: string;
};

type OutstandingDetail = {
  id: string;

  name: string;

  phone: string;
  email: string;

  gstNumber: string;
  address: string;

  openingBalance: number;
  balanceType: string;

  amount: number;
};

type CashBankDetail = {
  id: string;

  name: string;
  ledgerType: string;

  openingBalance: number;
  balanceType: string;

  balance: number;
};

type TopCustomer = {
  customerLedgerId?: string;

  customerName?: string;

  invoices: number;

  sales: number;
  due: number;
};

type TopSupplier = {
  supplierLedgerId?: string;

  supplierName?: string;

  purchases: number;

  amount: number;
  due: number;
};

type ExpenseCategory = {
  category: string;

  count: number;

  taxable: number;
  gst: number;
  total: number;
};

type MonthlyTrend = {
  year: number;
  month: number;

  sales: number;
  purchases: number;
  expenses: number;

  difference?: number;
};

type ReportsResponse = {
  success: boolean;
  message?: string;

  generatedAt?: string;

  period?: {
    from: string | null;
    to: string | null;
  };

  sales?: MoneySummary;

  purchases?: MoneySummary;

  expenses?: ExpenseSummary;

  receivable?: ReceivablePayable;

  payable?: ReceivablePayable;

  cashBank?: CashBankSummary;

  gst?: GstSummary;

  profit?: ProfitSummary;

  topCustomers?: TopCustomer[];

  topSuppliers?: TopSupplier[];

  expenseCategories?: ExpenseCategory[];

  monthlyTrend?: MonthlyTrend[];

  salesDetails?: SalesDetail[];

  purchaseDetails?: PurchaseDetail[];

  expenseDetails?: ExpenseDetail[];

  receivableDetails?: OutstandingDetail[];

  payableDetails?: OutstandingDetail[];

  cashBankDetails?: CashBankDetail[];
};

type ReportTab =
  | "sales"
  | "purchases"
  | "expenses"
  | "receivables"
  | "payables"
  | "cash-bank"
  | "customers"
  | "suppliers"
  | "expense-category"
  | "monthly";

/* =========================================================
   DEFAULTS
========================================================= */

const emptyMoneySummary: MoneySummary = {
  count: 0,

  taxable: 0,

  cgst: 0,
  sgst: 0,
  igst: 0,

  gst: 0,

  total: 0,

  paid: 0,
  due: 0,
};

const emptyExpenseSummary: ExpenseSummary = {
  count: 0,

  taxable: 0,

  cgst: 0,
  sgst: 0,
  igst: 0,

  gst: 0,

  total: 0,
};

const emptyReceivablePayable: ReceivablePayable = {
  amount: 0,
  count: 0,
};

const emptyCashBank: CashBankSummary = {
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

const emptyProfit: ProfitSummary = {
  estimate: 0,
  operatingDifference: 0,
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
    Number(value) || 0
  );
}

function formatNumber(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString(
    "en-IN"
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

function toDateInput(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function getCurrentMonthRange() {
  const now =
    new Date();

  return {
    from:
      toDateInput(
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        )
      ),

    to:
      toDateInput(
        now
      ),
  };
}

function getFinancialYearRange() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const startYear =
    now.getMonth() >= 3
      ? year
      : year - 1;

  return {
    from:
      `${startYear}-04-01`,

    to:
      toDateInput(
        now
      ),
  };
}

function readJson(
  text: string
): ReportsResponse | null {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(
      text
    ) as ReportsResponse;
  } catch {
    return null;
  }
}

function normalizeSearch(
  value: unknown
) {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();
}

/* =========================================================
   CSV HELPERS
========================================================= */

function csvValue(
  value: unknown
) {
  const text =
    String(
      value ?? ""
    );

  return `"${text.replace(
    /"/g,
    '""'
  )}"`;
}

function createCsv(
  headers: string[],
  rows: unknown[][]
) {
  const output: string[] = [];

  output.push(
    headers
      .map(csvValue)
      .join(",")
  );

  for (
    const row of rows
  ) {
    output.push(
      row
        .map(csvValue)
        .join(",")
    );
  }

  return output.join(
    "\r\n"
  );
}

function downloadCsv(
  filename: string,
  content: string
) {
  const blob =
    new Blob(
      [
        "\uFEFF",
        content,
      ],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      "a"
    );

  anchor.href =
    url;

  anchor.download =
    filename;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(
    url
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AccountsReportsPage() {
  const initialRange =
    getCurrentMonthRange();

  const [
    from,
    setFrom,
  ] =
    useState(
      initialRange.from
    );

  const [
    to,
    setTo,
  ] =
    useState(
      initialRange.to
    );

  const [
    appliedFrom,
    setAppliedFrom,
  ] =
    useState(
      initialRange.from
    );

  const [
    appliedTo,
    setAppliedTo,
  ] =
    useState(
      initialRange.to
    );

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ReportTab>(
      "sales"
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

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
    sales,
    setSales,
  ] =
    useState<MoneySummary>(
      emptyMoneySummary
    );

  const [
    purchases,
    setPurchases,
  ] =
    useState<MoneySummary>(
      emptyMoneySummary
    );

  const [
    expenses,
    setExpenses,
  ] =
    useState<ExpenseSummary>(
      emptyExpenseSummary
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
    useState<CashBankSummary>(
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
    profit,
    setProfit,
  ] =
    useState<ProfitSummary>(
      emptyProfit
    );

  const [
    salesDetails,
    setSalesDetails,
  ] =
    useState<
      SalesDetail[]
    >([]);

  const [
    purchaseDetails,
    setPurchaseDetails,
  ] =
    useState<
      PurchaseDetail[]
    >([]);

  const [
    expenseDetails,
    setExpenseDetails,
  ] =
    useState<
      ExpenseDetail[]
    >([]);

  const [
    receivableDetails,
    setReceivableDetails,
  ] =
    useState<
      OutstandingDetail[]
    >([]);

  const [
    payableDetails,
    setPayableDetails,
  ] =
    useState<
      OutstandingDetail[]
    >([]);

  const [
    cashBankDetails,
    setCashBankDetails,
  ] =
    useState<
      CashBankDetail[]
    >([]);

  const [
    topCustomers,
    setTopCustomers,
  ] =
    useState<
      TopCustomer[]
    >([]);

  const [
    topSuppliers,
    setTopSuppliers,
  ] =
    useState<
      TopSupplier[]
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

  /* =======================================================
     LOAD REPORT
  ======================================================= */

  const loadReport =
    useCallback(
      async (
        filterFrom:
          string,
        filterTo:
          string,
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

          const params =
            new URLSearchParams();

          if (
            filterFrom
          ) {
            params.set(
              "from",
              filterFrom
            );
          }

          if (
            filterTo
          ) {
            params.set(
              "to",
              filterTo
            );
          }

          const response =
            await fetch(
              `/api/admin/accounts/reports?${params.toString()}`,
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
            readJson(
              text
            );

          if (
            !response.ok ||
            !data?.success
          ) {
            throw new Error(
              data?.message ||
                `Unable to load reports (${response.status}).`
            );
          }

          setGeneratedAt(
            data.generatedAt ||
              ""
          );

          setSales(
            data.sales ||
              emptyMoneySummary
          );

          setPurchases(
            data.purchases ||
              emptyMoneySummary
          );

          setExpenses(
            data.expenses ||
              emptyExpenseSummary
          );

          setReceivable(
            data.receivable ||
              emptyReceivablePayable
          );

          setPayable(
            data.payable ||
              emptyReceivablePayable
          );

          setCashBank(
            data.cashBank ||
              emptyCashBank
          );

          setGst(
            data.gst ||
              emptyGst
          );

          setProfit(
            data.profit ||
              emptyProfit
          );

          setSalesDetails(
            Array.isArray(
              data.salesDetails
            )
              ? data.salesDetails
              : []
          );

          setPurchaseDetails(
            Array.isArray(
              data.purchaseDetails
            )
              ? data.purchaseDetails
              : []
          );

          setExpenseDetails(
            Array.isArray(
              data.expenseDetails
            )
              ? data.expenseDetails
              : []
          );

          setReceivableDetails(
            Array.isArray(
              data.receivableDetails
            )
              ? data.receivableDetails
              : []
          );

          setPayableDetails(
            Array.isArray(
              data.payableDetails
            )
              ? data.payableDetails
              : []
          );

          setCashBankDetails(
            Array.isArray(
              data.cashBankDetails
            )
              ? data.cashBankDetails
              : []
          );

          setTopCustomers(
            Array.isArray(
              data.topCustomers
            )
              ? data.topCustomers
              : []
          );

          setTopSuppliers(
            Array.isArray(
              data.topSuppliers
            )
              ? data.topSuppliers
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
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load reports."
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
      void loadReport(
        appliedFrom,
        appliedTo
      );
    },
    [
      appliedFrom,
      appliedTo,
      loadReport,
    ]
  );

  /* =======================================================
     FILTER
  ======================================================= */

  function applyFilter() {
    setAppliedFrom(
      from
    );

    setAppliedTo(
      to
    );

    setSearch("");
  }

  function useCurrentMonth() {
    const range =
      getCurrentMonthRange();

    setFrom(
      range.from
    );

    setTo(
      range.to
    );

    setAppliedFrom(
      range.from
    );

    setAppliedTo(
      range.to
    );

    setSearch("");
  }

  function useFinancialYear() {
    const range =
      getFinancialYearRange();

    setFrom(
      range.from
    );

    setTo(
      range.to
    );

    setAppliedFrom(
      range.from
    );

    setAppliedTo(
      range.to
    );

    setSearch("");
  }

  function useAllTime() {
    setFrom("");
    setTo("");

    setAppliedFrom("");
    setAppliedTo("");

    setSearch("");
  }

  /* =======================================================
     FILTERED DATA
  ======================================================= */

  const query =
    normalizeSearch(
      search
    );

  const filteredSales =
    useMemo(
      () => {
        if (!query) {
          return salesDetails;
        }

        return salesDetails.filter(
          (row) =>
            [
              row.invoiceNumber,
              row.customerName,
              row.customerGstNumber,
              row.paymentStatus,
              row.status,
              row.notes,
            ].some(
              (value) =>
                normalizeSearch(
                  value
                ).includes(
                  query
                )
            )
        );
      },
      [
        salesDetails,
        query,
      ]
    );

  const filteredPurchases =
    useMemo(
      () => {
        if (!query) {
          return purchaseDetails;
        }

        return purchaseDetails.filter(
          (row) =>
            [
              row.purchaseNumber,
              row.supplierInvoiceNumber,
              row.supplierName,
              row.supplierGstNumber,
              row.paymentStatus,
              row.status,
              row.notes,
            ].some(
              (value) =>
                normalizeSearch(
                  value
                ).includes(
                  query
                )
            )
        );
      },
      [
        purchaseDetails,
        query,
      ]
    );

  const filteredExpenses =
    useMemo(
      () => {
        if (!query) {
          return expenseDetails;
        }

        return expenseDetails.filter(
          (row) =>
            [
              row.expenseNumber,
              row.category,
              row.description,
              row.vendorName,
              row.billNumber,
              row.gstNumber,
              row.paymentMode,
              row.status,
            ].some(
              (value) =>
                normalizeSearch(
                  value
                ).includes(
                  query
                )
            )
        );
      },
      [
        expenseDetails,
        query,
      ]
    );

  const filteredReceivables =
    useMemo(
      () => {
        if (!query) {
          return receivableDetails;
        }

        return receivableDetails.filter(
          (row) =>
            [
              row.name,
              row.phone,
              row.email,
              row.gstNumber,
              row.address,
            ].some(
              (value) =>
                normalizeSearch(
                  value
                ).includes(
                  query
                )
            )
        );
      },
      [
        receivableDetails,
        query,
      ]
    );

  const filteredPayables =
    useMemo(
      () => {
        if (!query) {
          return payableDetails;
        }

        return payableDetails.filter(
          (row) =>
            [
              row.name,
              row.phone,
              row.email,
              row.gstNumber,
              row.address,
            ].some(
              (value) =>
                normalizeSearch(
                  value
                ).includes(
                  query
                )
            )
        );
      },
      [
        payableDetails,
        query,
      ]
    );

  const filteredCashBank =
    useMemo(
      () => {
        if (!query) {
          return cashBankDetails;
        }

        return cashBankDetails.filter(
          (row) =>
            [
              row.name,
              row.ledgerType,
              row.balanceType,
            ].some(
              (value) =>
                normalizeSearch(
                  value
                ).includes(
                  query
                )
            )
        );
      },
      [
        cashBankDetails,
        query,
      ]
    );

  const filteredCustomers =
    useMemo(
      () => {
        if (!query) {
          return topCustomers;
        }

        return topCustomers.filter(
          (row) =>
            normalizeSearch(
              row.customerName
            ).includes(
              query
            )
        );
      },
      [
        topCustomers,
        query,
      ]
    );

  const filteredSuppliers =
    useMemo(
      () => {
        if (!query) {
          return topSuppliers;
        }

        return topSuppliers.filter(
          (row) =>
            normalizeSearch(
              row.supplierName
            ).includes(
              query
            )
        );
      },
      [
        topSuppliers,
        query,
      ]
    );

  const filteredCategories =
    useMemo(
      () => {
        if (!query) {
          return expenseCategories;
        }

        return expenseCategories.filter(
          (row) =>
            normalizeSearch(
              row.category
            ).includes(
              query
            )
        );
      },
      [
        expenseCategories,
        query,
      ]
    );

  /* =======================================================
     CSV DOWNLOADS
  ======================================================= */

  function fileSuffix() {
    if (
      appliedFrom &&
      appliedTo
    ) {
      return `${appliedFrom}_to_${appliedTo}`;
    }

    if (
      appliedFrom
    ) {
      return `from_${appliedFrom}`;
    }

    if (
      appliedTo
    ) {
      return `to_${appliedTo}`;
    }

    return "all_time";
  }

  function downloadSales() {
    downloadCsv(
      `silentgen_sales_report_${fileSuffix()}.csv`,

      createCsv(
        [
          "Invoice Number",
          "Invoice Date",
          "Customer",
          "Customer GST",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "Total GST",
          "Round Off",
          "Grand Total",
          "Paid",
          "Due",
          "Payment Status",
          "Status",
          "Notes",
        ],

        salesDetails.map(
          (row) => [
            row.invoiceNumber,
            formatDate(
              row.invoiceDate
            ),
            row.customerName,
            row.customerGstNumber,
            row.taxableAmount,
            row.cgst,
            row.sgst,
            row.igst,
            row.totalGst,
            row.roundOff,
            row.grandTotal,
            row.paid,
            row.due,
            row.paymentStatus,
            row.status,
            row.notes,
          ]
        )
      )
    );
  }

  function downloadPurchases() {
    downloadCsv(
      `silentgen_purchase_report_${fileSuffix()}.csv`,

      createCsv(
        [
          "Purchase Number",
          "Supplier Invoice",
          "Purchase Date",
          "Supplier",
          "Supplier GST",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "Total GST",
          "Round Off",
          "Grand Total",
          "Paid",
          "Due",
          "Payment Status",
          "Status",
          "Notes",
        ],

        purchaseDetails.map(
          (row) => [
            row.purchaseNumber,
            row.supplierInvoiceNumber,
            formatDate(
              row.purchaseDate
            ),
            row.supplierName,
            row.supplierGstNumber,
            row.taxableAmount,
            row.cgst,
            row.sgst,
            row.igst,
            row.totalGst,
            row.roundOff,
            row.grandTotal,
            row.paid,
            row.due,
            row.paymentStatus,
            row.status,
            row.notes,
          ]
        )
      )
    );
  }

  function downloadExpenses() {
    downloadCsv(
      `silentgen_expense_report_${fileSuffix()}.csv`,

      createCsv(
        [
          "Expense Number",
          "Expense Date",
          "Category",
          "Vendor",
          "Bill Number",
          "GST Number",
          "Description",
          "Taxable",
          "GST Rate",
          "CGST",
          "SGST",
          "IGST",
          "Total GST",
          "Total Amount",
          "Payment Mode",
          "Status",
          "Notes",
        ],

        expenseDetails.map(
          (row) => [
            row.expenseNumber,
            formatDate(
              row.expenseDate
            ),
            row.category,
            row.vendorName,
            row.billNumber,
            row.gstNumber,
            row.description,
            row.taxableAmount,
            row.gstRate,
            row.cgst,
            row.sgst,
            row.igst,
            row.totalGst,
            row.totalAmount,
            row.paymentMode,
            row.status,
            row.notes,
          ]
        )
      )
    );
  }

  function downloadReceivables() {
    downloadCsv(
      `silentgen_receivable_report_${fileSuffix()}.csv`,

      createCsv(
        [
          "Customer",
          "Phone",
          "Email",
          "GST Number",
          "Address",
          "Opening Balance",
          "Balance Type",
          "Receivable",
        ],

        receivableDetails.map(
          (row) => [
            row.name,
            row.phone,
            row.email,
            row.gstNumber,
            row.address,
            row.openingBalance,
            row.balanceType,
            row.amount,
          ]
        )
      )
    );
  }

  function downloadPayables() {
    downloadCsv(
      `silentgen_payable_report_${fileSuffix()}.csv`,

      createCsv(
        [
          "Supplier",
          "Phone",
          "Email",
          "GST Number",
          "Address",
          "Opening Balance",
          "Balance Type",
          "Payable",
        ],

        payableDetails.map(
          (row) => [
            row.name,
            row.phone,
            row.email,
            row.gstNumber,
            row.address,
            row.openingBalance,
            row.balanceType,
            row.amount,
          ]
        )
      )
    );
  }

  function downloadCashBank() {
    downloadCsv(
      `silentgen_cash_bank_report_${fileSuffix()}.csv`,

      createCsv(
        [
          "Ledger",
          "Type",
          "Opening Balance",
          "Balance Type",
          "Current Balance",
        ],

        cashBankDetails.map(
          (row) => [
            row.name,
            row.ledgerType,
            row.openingBalance,
            row.balanceType,
            row.balance,
          ]
        )
      )
    );
  }

  function downloadCompleteReport() {
    const lines: string[] = [];

    lines.push(
      "SILENTGEN COMPLETE ACCOUNTS REPORT"
    );

    lines.push(
      `Period,${csvValue(
        appliedFrom ||
          "Beginning"
      )},${csvValue(
        appliedTo ||
          "Current"
      )}`
    );

    lines.push("");

    lines.push(
      "BUSINESS SUMMARY"
    );

    lines.push(
      createCsv(
        [
          "Section",
          "Count",
          "Taxable",
          "GST",
          "Total",
          "Paid",
          "Due",
        ],
        [
          [
            "Sales",
            sales.count,
            sales.taxable,
            sales.gst,
            sales.total,
            sales.paid,
            sales.due,
          ],
          [
            "Purchases",
            purchases.count,
            purchases.taxable,
            purchases.gst,
            purchases.total,
            purchases.paid,
            purchases.due,
          ],
          [
            "Expenses",
            expenses.count,
            expenses.taxable,
            expenses.gst,
            expenses.total,
            "",
            "",
          ],
        ]
      )
    );

    lines.push("");

    lines.push(
      "OUTSTANDING & CASH BANK"
    );

    lines.push(
      createCsv(
        [
          "Particular",
          "Amount",
          "Count",
        ],
        [
          [
            "Receivable",
            receivable.amount,
            receivable.count,
          ],
          [
            "Payable",
            payable.amount,
            payable.count,
          ],
          [
            "Cash",
            cashBank.cash,
            "",
          ],
          [
            "Bank",
            cashBank.bank,
            "",
          ],
          [
            "Cash + Bank",
            cashBank.total,
            "",
          ],
        ]
      )
    );

    lines.push("");

    lines.push(
      "GST SUMMARY"
    );

    lines.push(
      createCsv(
        [
          "Particular",
          "Amount",
        ],
        [
          [
            "Output GST",
            gst.output,
          ],
          [
            "Purchase Input GST",
            gst.purchaseInput,
          ],
          [
            "Expense Input GST",
            gst.expenseInput,
          ],
          [
            "Total Input GST",
            gst.input,
          ],
          [
            "Net GST",
            gst.net,
          ],
          [
            "GST Payable",
            gst.payable,
          ],
          [
            "GST Credit",
            gst.credit,
          ],
        ]
      )
    );

    lines.push("");

    lines.push(
      "OPERATING DIFFERENCE"
    );

    lines.push(
      createCsv(
        [
          "Particular",
          "Amount",
        ],
        [
          [
            "Sales Taxable - Purchase Taxable - Expense Taxable",
            profit.operatingDifference ??
              profit.estimate,
          ],
        ]
      )
    );

    lines.push("");

    lines.push(
      "SALES DETAILS"
    );

    lines.push(
      createCsv(
        [
          "Invoice",
          "Date",
          "Customer",
          "GSTIN",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "GST",
          "Total",
          "Paid",
          "Due",
          "Payment Status",
          "Status",
        ],

        salesDetails.map(
          (row) => [
            row.invoiceNumber,
            formatDate(
              row.invoiceDate
            ),
            row.customerName,
            row.customerGstNumber,
            row.taxableAmount,
            row.cgst,
            row.sgst,
            row.igst,
            row.totalGst,
            row.grandTotal,
            row.paid,
            row.due,
            row.paymentStatus,
            row.status,
          ]
        )
      )
    );

    lines.push("");

    lines.push(
      "PURCHASE DETAILS"
    );

    lines.push(
      createCsv(
        [
          "Purchase",
          "Supplier Invoice",
          "Date",
          "Supplier",
          "GSTIN",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "GST",
          "Total",
          "Paid",
          "Due",
          "Payment Status",
          "Status",
        ],

        purchaseDetails.map(
          (row) => [
            row.purchaseNumber,
            row.supplierInvoiceNumber,
            formatDate(
              row.purchaseDate
            ),
            row.supplierName,
            row.supplierGstNumber,
            row.taxableAmount,
            row.cgst,
            row.sgst,
            row.igst,
            row.totalGst,
            row.grandTotal,
            row.paid,
            row.due,
            row.paymentStatus,
            row.status,
          ]
        )
      )
    );

    lines.push("");

    lines.push(
      "EXPENSE DETAILS"
    );

    lines.push(
      createCsv(
        [
          "Expense",
          "Date",
          "Category",
          "Vendor",
          "Bill",
          "GSTIN",
          "Taxable",
          "GST",
          "Total",
          "Payment Mode",
          "Status",
        ],

        expenseDetails.map(
          (row) => [
            row.expenseNumber,
            formatDate(
              row.expenseDate
            ),
            row.category,
            row.vendorName,
            row.billNumber,
            row.gstNumber,
            row.taxableAmount,
            row.totalGst,
            row.totalAmount,
            row.paymentMode,
            row.status,
          ]
        )
      )
    );

    lines.push("");

    lines.push(
      "RECEIVABLE DETAILS"
    );

    lines.push(
      createCsv(
        [
          "Customer",
          "Phone",
          "Email",
          "GSTIN",
          "Receivable",
        ],

        receivableDetails.map(
          (row) => [
            row.name,
            row.phone,
            row.email,
            row.gstNumber,
            row.amount,
          ]
        )
      )
    );

    lines.push("");

    lines.push(
      "PAYABLE DETAILS"
    );

    lines.push(
      createCsv(
        [
          "Supplier",
          "Phone",
          "Email",
          "GSTIN",
          "Payable",
        ],

        payableDetails.map(
          (row) => [
            row.name,
            row.phone,
            row.email,
            row.gstNumber,
            row.amount,
          ]
        )
      )
    );

    lines.push("");

    lines.push(
      "CASH BANK DETAILS"
    );

    lines.push(
      createCsv(
        [
          "Ledger",
          "Type",
          "Opening",
          "Balance Type",
          "Balance",
        ],

        cashBankDetails.map(
          (row) => [
            row.name,
            row.ledgerType,
            row.openingBalance,
            row.balanceType,
            row.balance,
          ]
        )
      )
    );

    lines.push("");

    lines.push(
      "MONTHLY TREND"
    );

    lines.push(
      createCsv(
        [
          "Year",
          "Month",
          "Sales",
          "Purchases",
          "Expenses",
          "Difference",
        ],

        monthlyTrend.map(
          (row) => [
            row.year,
            getMonthName(
              row.month
            ),
            row.sales,
            row.purchases,
            row.expenses,
            row.difference ??
              row.sales -
                row.purchases -
                row.expenses,
          ]
        )
      )
    );

    downloadCsv(
      `silentgen_complete_accounts_report_${fileSuffix()}.csv`,
      lines.join(
        "\r\n"
      )
    );
  }

  /* =======================================================
     ACTIVE DOWNLOAD
  ======================================================= */

  function downloadActiveReport() {
    switch (
      activeTab
    ) {
      case "sales":
        downloadSales();
        break;

      case "purchases":
        downloadPurchases();
        break;

      case "expenses":
        downloadExpenses();
        break;

      case "receivables":
        downloadReceivables();
        break;

      case "payables":
        downloadPayables();
        break;

      case "cash-bank":
        downloadCashBank();
        break;

      case "customers":
        downloadCsv(
          `silentgen_top_customers_${fileSuffix()}.csv`,
          createCsv(
            [
              "Customer",
              "Invoices",
              "Sales",
              "Due",
            ],
            topCustomers.map(
              (row) => [
                row.customerName ||
                  "",
                row.invoices,
                row.sales,
                row.due,
              ]
            )
          )
        );
        break;

      case "suppliers":
        downloadCsv(
          `silentgen_top_suppliers_${fileSuffix()}.csv`,
          createCsv(
            [
              "Supplier",
              "Purchases",
              "Amount",
              "Due",
            ],
            topSuppliers.map(
              (row) => [
                row.supplierName ||
                  "",
                row.purchases,
                row.amount,
                row.due,
              ]
            )
          )
        );
        break;

      case "expense-category":
        downloadCsv(
          `silentgen_expense_category_${fileSuffix()}.csv`,
          createCsv(
            [
              "Category",
              "Entries",
              "Taxable",
              "GST",
              "Total",
            ],
            expenseCategories.map(
              (row) => [
                row.category,
                row.count,
                row.taxable,
                row.gst,
                row.total,
              ]
            )
          )
        );
        break;

      case "monthly":
        downloadCsv(
          `silentgen_monthly_report_${fileSuffix()}.csv`,
          createCsv(
            [
              "Year",
              "Month",
              "Sales",
              "Purchases",
              "Expenses",
              "Difference",
            ],
            monthlyTrend.map(
              (row) => [
                row.year,
                getMonthName(
                  row.month
                ),
                row.sales,
                row.purchases,
                row.expenses,
                row.difference ??
                  row.sales -
                    row.purchases -
                    row.expenses,
              ]
            )
          )
        );
        break;
    }
  }

  /* =======================================================
     PRINT
  ======================================================= */

  function printReport() {
    window.print();
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[650px] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={34}
            className="mx-auto animate-spin"
          />

          <p className="mt-3 text-sm font-semibold text-gray-500">
            Loading detailed reports...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="mx-auto max-w-[1900px] space-y-6 pb-10 print:max-w-none print:bg-white">
      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="rounded-3xl bg-black p-6 text-white sm:p-8 print:rounded-none print:bg-white print:p-0 print:text-black">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/accounts"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 print:hidden"
              >
                <ArrowLeft
                  size={18}
                />
              </Link>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 print:text-gray-500">
                  SilentGEN Accounts
                </p>

                <h1 className="mt-1 text-3xl font-black">
                  Detailed Reports
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-sm text-gray-300 print:text-gray-600">
              Complete sales, purchase, expense, GST,
              receivable, payable and cash-bank reporting.
            </p>

            <p className="mt-2 text-xs text-gray-400 print:text-gray-500">
              Period:{" "}
              {appliedFrom ||
                "Beginning"}{" "}
              to{" "}
              {appliedTo ||
                "Current"}
            </p>

            {generatedAt && (
              <p className="mt-1 text-xs text-gray-500">
                Generated:{" "}
                {new Date(
                  generatedAt
                ).toLocaleString(
                  "en-IN"
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={() =>
                void loadReport(
                  appliedFrom,
                  appliedTo,
                  true
                )
              }
              disabled={
                refreshing
              }
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCcw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={
                downloadCompleteReport
              }
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-black hover:bg-gray-200"
            >
              <Download
                size={17}
              />

              Complete CSV
            </button>

            <button
              type="button"
              onClick={
                printReport
              }
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20"
            >
              <Printer
                size={17}
              />

              Print / PDF
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700 print:hidden">
          {error}
        </section>
      )}

      {/* ===================================================
          FILTER
      =================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <CalendarDays
            size={19}
          />

          <h2 className="font-black">
            Report Period
          </h2>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-500">
              From Date
            </label>

            <input
              type="date"
              value={from}
              onChange={(
                event
              ) =>
                setFrom(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-500">
              To Date
            </label>

            <input
              type="date"
              value={to}
              onChange={(
                event
              ) =>
                setTo(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <button
            type="button"
            onClick={
              applyFilter
            }
            className="self-end rounded-xl bg-black px-6 py-3 text-sm font-bold text-white hover:bg-gray-800"
          >
            Apply Filter
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <PresetButton
            onClick={
              useCurrentMonth
            }
          >
            Current Month
          </PresetButton>

          <PresetButton
            onClick={
              useFinancialYear
            }
          >
            Financial Year
          </PresetButton>

          <PresetButton
            onClick={
              useAllTime
            }
          >
            All Time
          </PresetButton>
        </div>
      </section>

      {/* ===================================================
          OVERVIEW
      =================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Sales"
          value={formatCurrency(
            sales.total
          )}
          hint={`${sales.count} invoices`}
        />

        <SummaryCard
          label="Total Purchase"
          value={formatCurrency(
            purchases.total
          )}
          hint={`${purchases.count} bills`}
        />

        <SummaryCard
          label="Total Expense"
          value={formatCurrency(
            expenses.total
          )}
          hint={`${expenses.count} vouchers`}
        />

        <SummaryCard
          label="Operating Difference"
          value={formatCurrency(
            profit.operatingDifference ??
              profit.estimate
          )}
          hint="Sales taxable - Purchase taxable - Expense taxable"
        />
      </section>

      {/* ===================================================
          OUTSTANDING
      =================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Receivable"
          value={formatCurrency(
            receivable.amount
          )}
          hint={`${receivable.count} customers`}
        />

        <SummaryCard
          label="Payable"
          value={formatCurrency(
            payable.amount
          )}
          hint={`${payable.count} suppliers`}
        />

        <SummaryCard
          label="Cash Balance"
          value={formatCurrency(
            cashBank.cash
          )}
          hint="Cash ledgers"
        />

        <SummaryCard
          label="Bank Balance"
          value={formatCurrency(
            cashBank.bank
          )}
          hint="Bank ledgers"
        />
      </section>

      {/* ===================================================
          TAXABLE + GST
      =================================================== */}

      <section className="grid gap-5 xl:grid-cols-3">
        <BreakdownCard
          title="Sales Position"
          rows={[
            [
              "Taxable",
              sales.taxable,
            ],
            [
              "CGST",
              sales.cgst,
            ],
            [
              "SGST",
              sales.sgst,
            ],
            [
              "IGST",
              sales.igst,
            ],
            [
              "Total GST",
              sales.gst,
            ],
            [
              "Paid",
              sales.paid,
            ],
            [
              "Due",
              sales.due,
            ],
            [
              "Grand Total",
              sales.total,
            ],
          ]}
        />

        <BreakdownCard
          title="Purchase Position"
          rows={[
            [
              "Taxable",
              purchases.taxable,
            ],
            [
              "CGST",
              purchases.cgst,
            ],
            [
              "SGST",
              purchases.sgst,
            ],
            [
              "IGST",
              purchases.igst,
            ],
            [
              "Total GST",
              purchases.gst,
            ],
            [
              "Paid",
              purchases.paid,
            ],
            [
              "Due",
              purchases.due,
            ],
            [
              "Grand Total",
              purchases.total,
            ],
          ]}
        />

        <BreakdownCard
          title="Expense Position"
          rows={[
            [
              "Taxable",
              expenses.taxable,
            ],
            [
              "CGST",
              expenses.cgst,
            ],
            [
              "SGST",
              expenses.sgst,
            ],
            [
              "IGST",
              expenses.igst,
            ],
            [
              "Input GST",
              expenses.gst,
            ],
            [
              "Total",
              expenses.total,
            ],
          ]}
        />
      </section>

      {/* ===================================================
          GST
      =================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black">
          GST Summary
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
          <MiniCard
            label="Output GST"
            value={
              gst.output
            }
          />

          <MiniCard
            label="Purchase Input"
            value={
              gst.purchaseInput
            }
          />

          <MiniCard
            label="Expense Input"
            value={
              gst.expenseInput
            }
          />

          <MiniCard
            label="Total Input"
            value={
              gst.input
            }
          />

          <MiniCard
            label="Net GST"
            value={
              gst.net
            }
          />

          <MiniCard
            label="Payable"
            value={
              gst.payable
            }
          />

          <MiniCard
            label="Credit"
            value={
              gst.credit
            }
          />
        </div>
      </section>

      {/* ===================================================
          TABS
      =================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5 print:hidden">
          <div className="flex flex-wrap gap-2">
            <TabButton
              active={
                activeTab ===
                "sales"
              }
              onClick={() =>
                setActiveTab(
                  "sales"
                )
              }
            >
              Sales
            </TabButton>

            <TabButton
              active={
                activeTab ===
                "purchases"
              }
              onClick={() =>
                setActiveTab(
                  "purchases"
                )
              }
            >
              Purchases
            </TabButton>

            <TabButton
              active={
                activeTab ===
                "expenses"
              }
              onClick={() =>
                setActiveTab(
                  "expenses"
                )
              }
            >
              Expenses
            </TabButton>

            <TabButton
              active={
                activeTab ===
                "receivables"
              }
              onClick={() =>
                setActiveTab(
                  "receivables"
                )
              }
            >
              Receivables
            </TabButton>

            <TabButton
              active={
                activeTab ===
                "payables"
              }
              onClick={() =>
                setActiveTab(
                  "payables"
                )
              }
            >
              Payables
            </TabButton>

            <TabButton
              active={
                activeTab ===
                "cash-bank"
              }
              onClick={() =>
                setActiveTab(
                  "cash-bank"
                )
              }
            >
              Cash / Bank
            </TabButton>

            <TabButton
              active={
                activeTab ===
                "customers"
              }
              onClick={() =>
                setActiveTab(
                  "customers"
                )
              }
            >
              Top Customers
            </TabButton>

            <TabButton
              active={
                activeTab ===
                "suppliers"
              }
              onClick={() =>
                setActiveTab(
                  "suppliers"
                )
              }
            >
              Top Suppliers
            </TabButton>

            <TabButton
              active={
                activeTab ===
                "expense-category"
              }
              onClick={() =>
                setActiveTab(
                  "expense-category"
                )
              }
            >
              Expense Categories
            </TabButton>

            <TabButton
              active={
                activeTab ===
                "monthly"
              }
              onClick={() =>
                setActiveTab(
                  "monthly"
                )
              }
            >
              Monthly
            </TabButton>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search current report..."
                className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-black"
              />
            </div>

            <button
              type="button"
              onClick={
                downloadActiveReport
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold hover:bg-gray-50"
            >
              <Download
                size={17}
              />

              Download Current Report
            </button>
          </div>
        </div>

        {/* SALES */}

        {activeTab ===
          "sales" && (
          <ReportTable
            title="Sales Invoice Report"
            description={`${filteredSales.length} records`}
          >
            <table className="w-full min-w-[1500px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Invoice
                  </Head>

                  <Head>
                    Date
                  </Head>

                  <Head>
                    Customer
                  </Head>

                  <Head>
                    GSTIN
                  </Head>

                  <Head align="right">
                    Taxable
                  </Head>

                  <Head align="right">
                    CGST
                  </Head>

                  <Head align="right">
                    SGST
                  </Head>

                  <Head align="right">
                    IGST
                  </Head>

                  <Head align="right">
                    GST
                  </Head>

                  <Head align="right">
                    Total
                  </Head>

                  <Head align="right">
                    Paid
                  </Head>

                  <Head align="right">
                    Due
                  </Head>

                  <Head>
                    Payment
                  </Head>

                  <Head>
                    Status
                  </Head>
                </tr>
              </thead>

              <tbody>
                {filteredSales.map(
                  (row) => (
                    <tr
                      key={
                        row.id
                      }
                      className="border-t hover:bg-gray-50"
                    >
                      <Cell strong>
                        {
                          row.invoiceNumber
                        }
                      </Cell>

                      <Cell>
                        {formatDate(
                          row.invoiceDate
                        )}
                      </Cell>

                      <Cell strong>
                        {
                          row.customerName
                        }
                      </Cell>

                      <Cell>
                        {row.customerGstNumber ||
                          "-"}
                      </Cell>

                      <MoneyCell
                        value={
                          row.taxableAmount
                        }
                      />

                      <MoneyCell
                        value={
                          row.cgst
                        }
                      />

                      <MoneyCell
                        value={
                          row.sgst
                        }
                      />

                      <MoneyCell
                        value={
                          row.igst
                        }
                      />

                      <MoneyCell
                        value={
                          row.totalGst
                        }
                      />

                      <MoneyCell
                        value={
                          row.grandTotal
                        }
                        strong
                      />

                      <MoneyCell
                        value={
                          row.paid
                        }
                      />

                      <MoneyCell
                        value={
                          row.due
                        }
                      />

                      <Cell>
                        {row.paymentStatus ||
                          "-"}
                      </Cell>

                      <Cell>
                        {row.status ||
                          "-"}
                      </Cell>
                    </tr>
                  )
                )}
              </tbody>

              <MoneyFooter
                label="Sales Total"
                colSpan={4}
                values={[
                  sales.taxable,
                  sales.cgst,
                  sales.sgst,
                  sales.igst,
                  sales.gst,
                  sales.total,
                  sales.paid,
                  sales.due,
                ]}
                remainingColumns={
                  2
                }
              />
            </table>
          </ReportTable>
        )}

        {/* PURCHASES */}

        {activeTab ===
          "purchases" && (
          <ReportTable
            title="Purchase Report"
            description={`${filteredPurchases.length} records`}
          >
            <table className="w-full min-w-[1550px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Purchase
                  </Head>

                  <Head>
                    Supplier Invoice
                  </Head>

                  <Head>
                    Date
                  </Head>

                  <Head>
                    Supplier
                  </Head>

                  <Head>
                    GSTIN
                  </Head>

                  <Head align="right">
                    Taxable
                  </Head>

                  <Head align="right">
                    CGST
                  </Head>

                  <Head align="right">
                    SGST
                  </Head>

                  <Head align="right">
                    IGST
                  </Head>

                  <Head align="right">
                    GST
                  </Head>

                  <Head align="right">
                    Total
                  </Head>

                  <Head align="right">
                    Paid
                  </Head>

                  <Head align="right">
                    Due
                  </Head>

                  <Head>
                    Status
                  </Head>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.map(
                  (row) => (
                    <tr
                      key={
                        row.id
                      }
                      className="border-t hover:bg-gray-50"
                    >
                      <Cell strong>
                        {
                          row.purchaseNumber
                        }
                      </Cell>

                      <Cell>
                        {row.supplierInvoiceNumber ||
                          "-"}
                      </Cell>

                      <Cell>
                        {formatDate(
                          row.purchaseDate
                        )}
                      </Cell>

                      <Cell strong>
                        {
                          row.supplierName
                        }
                      </Cell>

                      <Cell>
                        {row.supplierGstNumber ||
                          "-"}
                      </Cell>

                      <MoneyCell
                        value={
                          row.taxableAmount
                        }
                      />

                      <MoneyCell
                        value={
                          row.cgst
                        }
                      />

                      <MoneyCell
                        value={
                          row.sgst
                        }
                      />

                      <MoneyCell
                        value={
                          row.igst
                        }
                      />

                      <MoneyCell
                        value={
                          row.totalGst
                        }
                      />

                      <MoneyCell
                        value={
                          row.grandTotal
                        }
                        strong
                      />

                      <MoneyCell
                        value={
                          row.paid
                        }
                      />

                      <MoneyCell
                        value={
                          row.due
                        }
                      />

                      <Cell>
                        {row.status ||
                          "-"}
                      </Cell>
                    </tr>
                  )
                )}
              </tbody>

              <MoneyFooter
                label="Purchase Total"
                colSpan={5}
                values={[
                  purchases.taxable,
                  purchases.cgst,
                  purchases.sgst,
                  purchases.igst,
                  purchases.gst,
                  purchases.total,
                  purchases.paid,
                  purchases.due,
                ]}
                remainingColumns={
                  1
                }
              />
            </table>
          </ReportTable>
        )}

        {/* EXPENSES */}

        {activeTab ===
          "expenses" && (
          <ReportTable
            title="Expense Report"
            description={`${filteredExpenses.length} records`}
          >
            <table className="w-full min-w-[1500px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Expense
                  </Head>

                  <Head>
                    Date
                  </Head>

                  <Head>
                    Category
                  </Head>

                  <Head>
                    Vendor
                  </Head>

                  <Head>
                    Bill
                  </Head>

                  <Head>
                    GSTIN
                  </Head>

                  <Head align="right">
                    Taxable
                  </Head>

                  <Head align="right">
                    Rate
                  </Head>

                  <Head align="right">
                    CGST
                  </Head>

                  <Head align="right">
                    SGST
                  </Head>

                  <Head align="right">
                    IGST
                  </Head>

                  <Head align="right">
                    GST
                  </Head>

                  <Head align="right">
                    Total
                  </Head>

                  <Head>
                    Payment
                  </Head>
                </tr>
              </thead>

              <tbody>
                {filteredExpenses.map(
                  (row) => (
                    <tr
                      key={
                        row.id
                      }
                      className="border-t hover:bg-gray-50"
                    >
                      <Cell strong>
                        {
                          row.expenseNumber
                        }
                      </Cell>

                      <Cell>
                        {formatDate(
                          row.expenseDate
                        )}
                      </Cell>

                      <Cell>
                        {
                          row.category
                        }
                      </Cell>

                      <Cell strong>
                        {row.vendorName ||
                          "-"}
                      </Cell>

                      <Cell>
                        {row.billNumber ||
                          "-"}
                      </Cell>

                      <Cell>
                        {row.gstNumber ||
                          "-"}
                      </Cell>

                      <MoneyCell
                        value={
                          row.taxableAmount
                        }
                      />

                      <Cell align="right">
                        {row.gstRate}
                        %
                      </Cell>

                      <MoneyCell
                        value={
                          row.cgst
                        }
                      />

                      <MoneyCell
                        value={
                          row.sgst
                        }
                      />

                      <MoneyCell
                        value={
                          row.igst
                        }
                      />

                      <MoneyCell
                        value={
                          row.totalGst
                        }
                      />

                      <MoneyCell
                        value={
                          row.totalAmount
                        }
                        strong
                      />

                      <Cell>
                        {row.paymentMode ||
                          "-"}
                      </Cell>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </ReportTable>
        )}

        {/* RECEIVABLE */}

        {activeTab ===
          "receivables" && (
          <OutstandingTable
            title="Customer Receivable Report"
            description={`${filteredReceivables.length} customers`}
            rows={
              filteredReceivables
            }
            amountLabel="Receivable"
          />
        )}

        {/* PAYABLE */}

        {activeTab ===
          "payables" && (
          <OutstandingTable
            title="Supplier Payable Report"
            description={`${filteredPayables.length} suppliers`}
            rows={
              filteredPayables
            }
            amountLabel="Payable"
          />
        )}

        {/* CASH BANK */}

        {activeTab ===
          "cash-bank" && (
          <ReportTable
            title="Cash & Bank Report"
            description={`${filteredCashBank.length} ledgers`}
          >
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Ledger
                  </Head>

                  <Head>
                    Type
                  </Head>

                  <Head align="right">
                    Opening
                  </Head>

                  <Head>
                    Balance Type
                  </Head>

                  <Head align="right">
                    Current Balance
                  </Head>
                </tr>
              </thead>

              <tbody>
                {filteredCashBank.map(
                  (row) => (
                    <tr
                      key={
                        row.id
                      }
                      className="border-t"
                    >
                      <Cell strong>
                        {
                          row.name
                        }
                      </Cell>

                      <Cell>
                        {row.ledgerType.toUpperCase()}
                      </Cell>

                      <MoneyCell
                        value={
                          row.openingBalance
                        }
                      />

                      <Cell>
                        {
                          row.balanceType
                        }
                      </Cell>

                      <MoneyCell
                        value={
                          row.balance
                        }
                        strong
                      />
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </ReportTable>
        )}

        {/* TOP CUSTOMERS */}

        {activeTab ===
          "customers" && (
          <ReportTable
            title="Top Customers"
            description={`${filteredCustomers.length} customers`}
          >
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Customer
                  </Head>

                  <Head align="right">
                    Invoices
                  </Head>

                  <Head align="right">
                    Sales
                  </Head>

                  <Head align="right">
                    Due
                  </Head>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (
                    row,
                    index
                  ) => (
                    <tr
                      key={`${row.customerLedgerId}-${index}`}
                      className="border-t"
                    >
                      <Cell strong>
                        {row.customerName ||
                          "Customer"}
                      </Cell>

                      <Cell align="right">
                        {formatNumber(
                          row.invoices
                        )}
                      </Cell>

                      <MoneyCell
                        value={
                          row.sales
                        }
                      />

                      <MoneyCell
                        value={
                          row.due
                        }
                      />
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </ReportTable>
        )}

        {/* TOP SUPPLIERS */}

        {activeTab ===
          "suppliers" && (
          <ReportTable
            title="Top Suppliers"
            description={`${filteredSuppliers.length} suppliers`}
          >
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Supplier
                  </Head>

                  <Head align="right">
                    Bills
                  </Head>

                  <Head align="right">
                    Purchase
                  </Head>

                  <Head align="right">
                    Due
                  </Head>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map(
                  (
                    row,
                    index
                  ) => (
                    <tr
                      key={`${row.supplierLedgerId}-${index}`}
                      className="border-t"
                    >
                      <Cell strong>
                        {row.supplierName ||
                          "Supplier"}
                      </Cell>

                      <Cell align="right">
                        {formatNumber(
                          row.purchases
                        )}
                      </Cell>

                      <MoneyCell
                        value={
                          row.amount
                        }
                      />

                      <MoneyCell
                        value={
                          row.due
                        }
                      />
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </ReportTable>
        )}

        {/* EXPENSE CATEGORY */}

        {activeTab ===
          "expense-category" && (
          <ReportTable
            title="Expense Category Analysis"
            description={`${filteredCategories.length} categories`}
          >
            <table className="w-full min-w-[750px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Category
                  </Head>

                  <Head align="right">
                    Entries
                  </Head>

                  <Head align="right">
                    Taxable
                  </Head>

                  <Head align="right">
                    GST
                  </Head>

                  <Head align="right">
                    Total
                  </Head>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.map(
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

                      <Cell align="right">
                        {formatNumber(
                          row.count
                        )}
                      </Cell>

                      <MoneyCell
                        value={
                          row.taxable
                        }
                      />

                      <MoneyCell
                        value={
                          row.gst
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
              </tbody>
            </table>
          </ReportTable>
        )}

        {/* MONTHLY */}

        {activeTab ===
          "monthly" && (
          <ReportTable
            title="Monthly Business Trend"
            description={`${monthlyTrend.length} months`}
          >
            <table className="w-full min-w-[850px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Month
                  </Head>

                  <Head align="right">
                    Sales
                  </Head>

                  <Head align="right">
                    Purchases
                  </Head>

                  <Head align="right">
                    Expenses
                  </Head>

                  <Head align="right">
                    Difference
                  </Head>
                </tr>
              </thead>

              <tbody>
                {monthlyTrend.map(
                  (row) => (
                    <tr
                      key={`${row.year}-${row.month}`}
                      className="border-t"
                    >
                      <Cell strong>
                        {getMonthName(
                          row.month
                        )}{" "}
                        {row.year}
                      </Cell>

                      <MoneyCell
                        value={
                          row.sales
                        }
                      />

                      <MoneyCell
                        value={
                          row.purchases
                        }
                      />

                      <MoneyCell
                        value={
                          row.expenses
                        }
                      />

                      <MoneyCell
                        value={
                          row.difference ??
                          row.sales -
                            row.purchases -
                            row.expenses
                        }
                        strong
                      />
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </ReportTable>
        )}
      </section>

      {/* ===================================================
          PRINT SUMMARY FOOTER
      =================================================== */}

      <section className="hidden border-t pt-4 text-xs text-gray-500 print:block">
        <p>
          SilentGEN Accounts Report
        </p>

        <p className="mt-1">
          Generated{" "}
          {new Date().toLocaleString(
            "en-IN"
          )}
        </p>

        <p className="mt-1">
          Operating Difference is Sales Taxable -
          Purchase Taxable - Expense Taxable and is
          not inventory-adjusted statutory net profit.
        </p>
      </section>
    </main>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
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
   BREAKDOWN
========================================================= */

function BreakdownCard({
  title,
  rows,
}: {
  title: string;

  rows: Array<
    [string, number]
  >;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="font-black">
        {title}
      </h2>

      <div className="mt-4 space-y-3">
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

              <span className="font-bold">
                {formatCurrency(
                  value
                )}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MINI
========================================================= */

function MiniCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold text-gray-500">
        {label}
      </p>

      <p className="mt-2 font-black">
        {formatCurrency(
          value
        )}
      </p>
    </div>
  );
}

/* =========================================================
   BUTTONS
========================================================= */

function PresetButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
        active
          ? "bg-black text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   REPORT WRAPPER
========================================================= */

function ReportTable({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="font-black">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   OUTSTANDING TABLE
========================================================= */

function OutstandingTable({
  title,
  description,
  rows,
  amountLabel,
}: {
  title: string;
  description: string;

  rows: OutstandingDetail[];

  amountLabel: string;
}) {
  return (
    <ReportTable
      title={
        title
      }
      description={
        description
      }
    >
      <table className="w-full min-w-[1100px]">
        <thead className="bg-gray-50">
          <tr>
            <Head>
              Name
            </Head>

            <Head>
              Phone
            </Head>

            <Head>
              Email
            </Head>

            <Head>
              GSTIN
            </Head>

            <Head>
              Address
            </Head>

            <Head align="right">
              Opening
            </Head>

            <Head>
              Balance Type
            </Head>

            <Head align="right">
              {amountLabel}
            </Head>
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (row) => (
              <tr
                key={
                  row.id
                }
                className="border-t hover:bg-gray-50"
              >
                <Cell strong>
                  {
                    row.name
                  }
                </Cell>

                <Cell>
                  {row.phone ||
                    "-"}
                </Cell>

                <Cell>
                  {row.email ||
                    "-"}
                </Cell>

                <Cell>
                  {row.gstNumber ||
                    "-"}
                </Cell>

                <Cell>
                  {row.address ||
                    "-"}
                </Cell>

                <MoneyCell
                  value={
                    row.openingBalance
                  }
                />

                <Cell>
                  {
                    row.balanceType
                  }
                </Cell>

                <MoneyCell
                  value={
                    row.amount
                  }
                  strong
                />
              </tr>
            )
          )}
        </tbody>
      </table>
    </ReportTable>
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

  align?:
    | "left"
    | "right";
}) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 ${
        align ===
        "right"
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
  align = "left",
}: {
  children: ReactNode;

  strong?: boolean;

  align?:
    | "left"
    | "right";
}) {
  return (
    <td
      className={`whitespace-nowrap px-4 py-4 text-sm ${
        strong
          ? "font-bold text-gray-950"
          : "text-gray-600"
      } ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
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
      className={`whitespace-nowrap px-4 py-4 text-right text-sm ${
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

/* =========================================================
   TOTAL FOOTER
========================================================= */

function MoneyFooter({
  label,
  colSpan,
  values,
  remainingColumns = 0,
}: {
  label: string;
  colSpan: number;
  values: number[];
  remainingColumns?: number;
}) {
  return (
    <tfoot>
      <tr className="border-t-2 border-gray-300 bg-gray-50">
        <td
          colSpan={
            colSpan
          }
          className="px-4 py-4 text-sm font-black"
        >
          {label}
        </td>

        {values.map(
          (
            value,
            index
          ) => (
            <td
              key={
                index
              }
              className="whitespace-nowrap px-4 py-4 text-right text-sm font-black"
            >
              {formatCurrency(
                value
              )}
            </td>
          )
        )}

        {Array.from({
          length:
            remainingColumns,
        }).map(
          (
            _,
            index
          ) => (
            <td
              key={`empty-${index}`}
            />
          )
        )}
      </tr>
    </tfoot>
  );
}