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
  AlertTriangle,
  ArrowLeft,
  BadgeIndianRupee,
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type GstOutputSummary = {
  taxableSales: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  invoiceCount: number;
};

type GstInputSummary = {
  taxablePurchase: number;
  taxableExpense: number;

  purchaseCgst?: number;
  purchaseSgst?: number;
  purchaseIgst?: number;
  purchaseGst?: number;

  expenseCgst?: number;
  expenseSgst?: number;
  expenseIgst?: number;
  expenseGst?: number;

  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;

  purchaseCount: number;
  expenseCount: number;
};

type GstNetSummary = {
  cgst: number;
  sgst: number;
  igst: number;

  total: number;
  payable: number;
  credit: number;
};

type ExecutiveSummary = {
  outward: {
    invoices: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    gst: number;
    grandTotal: number;
  };

  purchase: {
    bills: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    gst: number;
    grandTotal: number;
  };

  expenses: {
    vouchers: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    gst: number;
    total: number;
  };

  inputTaxCredit: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };

  net: GstNetSummary;
};

type SalesRegisterRow = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string | null;

  customerLedgerId?: string;
  customerName: string;
  customerGstNumber: string;

  taxableAmount: number;

  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;

  roundOff?: number;
  grandTotal: number;

  paymentStatus?: string;
  status?: string;
};

type PurchaseRegisterRow = {
  id: string;

  purchaseNumber: string;
  supplierInvoiceNumber: string;

  purchaseDate: string | null;

  supplierLedgerId?: string;
  supplierName: string;
  supplierGstNumber: string;

  taxableAmount: number;

  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;

  roundOff?: number;
  grandTotal: number;

  paymentStatus?: string;
  status?: string;
};

type ExpenseRegisterRow = {
  id: string;

  expenseNumber: string;
  expenseDate: string | null;

  category: string;
  description: string;

  vendorName: string;
  vendorLedgerId?: string;

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
  status?: string;
};

type ItcRegisterRow = {
  source: "purchase" | "expense" | string;

  id: string;

  documentNumber: string;
  externalInvoiceNumber: string;

  date: string | null;

  partyName: string;
  gstNumber: string;

  taxableAmount: number;

  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;

  eligible: boolean;
  eligibilitySource: string;
};

type OutputTaxRegisterRow = {
  id: string;

  invoiceNumber: string;
  invoiceDate: string | null;

  customerName: string;
  customerGstNumber: string;

  supplyType: string;

  taxableAmount: number;

  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;

  grandTotal: number;
};

type Gstr1Working = {
  totalInvoices: number;
  totalTaxableValue: number;

  b2b: {
    count: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    gst: number;
    total: number;
  };

  b2c: {
    count: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    gst: number;
    total: number;
  };

  tax: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
};

type Gstr3bWorking = {
  table31: {
    outwardTaxableSupplies: {
      taxableValue: number;
      igst: number;
      cgst: number;
      sgst: number;
      cess: number;
    };

    reverseChargeInwardSupplies: {
      supported: boolean;
      taxableValue: number;
      igst: number;
      cgst: number;
      sgst: number;
      cess: number;
    };

    zeroRatedSupplies: {
      supported: boolean;
      taxableValue: number;
      igst: number;
    };

    nilExemptSupplies: {
      supported: boolean;
      taxableValue: number;
    };

    nonGstSupplies: {
      supported: boolean;
      taxableValue: number;
    };
  };

  table4EligibleItc: {
    purchase: {
      igst: number;
      cgst: number;
      sgst: number;
      total: number;
    };

    expense: {
      igst: number;
      cgst: number;
      sgst: number;
      total: number;
    };

    total: {
      igst: number;
      cgst: number;
      sgst: number;
      total: number;
    };

    reversal: {
      supported: boolean;
      total: number;
    };
  };

  booksNetPosition: {
    output: number;
    input: number;
    net: number;
    payable: number;
    credit: number;
  };
};

type GstinCustomerSummary = {
  gstNumber: string;
  customerName: string;

  invoices: number;

  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  gst: number;

  total: number;
};

type GstinSupplierSummary = {
  gstNumber: string;
  supplierName: string;

  bills: number;

  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  gst: number;

  total: number;
};

type MonthlyGstSummary = {
  year: number;
  month: number;

  salesTaxable: number;

  outputCgst: number;
  outputSgst: number;
  outputIgst: number;
  outputGst: number;

  purchaseTaxable: number;
  purchaseInputGst: number;

  expenseTaxable: number;
  expenseInputGst: number;

  totalInputGst: number;
  netGst: number;
};

type ComponentRegisterRow = {
  source: string;

  documentNumber: string;
  date: string | null;

  partyName: string;
  gstNumber: string;

  taxable: number;

  cgst?: number;
  sgst?: number;
  igst?: number;
};

type ComponentRegister = {
  output: ComponentRegisterRow[];
  input: ComponentRegisterRow[];

  summary: {
    output: number;
    input: number;
    net: number;
  };
};

type DataQuality = {
  invalidCustomerGstin: {
    count: number;
    records: SalesRegisterRow[];
  };

  invalidSupplierGstin: {
    count: number;
    records: PurchaseRegisterRow[];
  };

  taxMismatch: {
    sales: {
      count: number;
      records: SalesRegisterRow[];
    };

    purchases: {
      count: number;
      records: PurchaseRegisterRow[];
    };

    expenses: {
      count: number;
      records: ExpenseRegisterRow[];
    };

    total: number;
  };
};

type PendingModule = {
  id: string;
  name: string;
  ready: boolean;
  reason: string;
};

type Capabilities = Record<
  string,
  boolean
>;

type GstResponse = {
  success: boolean;
  message?: string;

  generatedAt?: string;

  period?: {
    from: string | null;
    to: string | null;
  };

  capabilities?: Capabilities;

  executiveSummary?: ExecutiveSummary;

  output?: GstOutputSummary;
  input?: GstInputSummary;
  net?: GstNetSummary;

  gstr1Working?: Gstr1Working;
  gstr3bWorking?: Gstr3bWorking;

  salesRegister?: SalesRegisterRow[];
  purchaseRegister?: PurchaseRegisterRow[];
  expenseRegister?: ExpenseRegisterRow[];

  outputTaxRegister?: OutputTaxRegisterRow[];
  itcRegister?: ItcRegisterRow[];

  b2bSales?: SalesRegisterRow[];
  b2cSales?: SalesRegisterRow[];

  customerGstinSummary?: GstinCustomerSummary[];
  supplierGstinSummary?: GstinSupplierSummary[];

  monthlySummary?: MonthlyGstSummary[];

  cgstRegister?: ComponentRegister;
  sgstRegister?: ComponentRegister;
  igstRegister?: ComponentRegister;

  dataQuality?: DataQuality;

  pendingModules?: PendingModule[];
};

/* =========================================================
   TABS
========================================================= */

type GstTab =
  | "summary"
  | "gstr1"
  | "gstr3b"
  | "sales"
  | "purchase"
  | "expenses"
  | "b2b"
  | "b2c"
  | "itc"
  | "output-tax"
  | "cgst"
  | "sgst"
  | "igst"
  | "customers"
  | "suppliers"
  | "monthly"
  | "quality";

/* =========================================================
   DEFAULTS
========================================================= */

const emptyOutput: GstOutputSummary = {
  taxableSales: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  totalGst: 0,
  invoiceCount: 0,
};

const emptyInput: GstInputSummary = {
  taxablePurchase: 0,
  taxableExpense: 0,

  cgst: 0,
  sgst: 0,
  igst: 0,
  totalGst: 0,

  purchaseCount: 0,
  expenseCount: 0,
};

const emptyNet: GstNetSummary = {
  cgst: 0,
  sgst: 0,
  igst: 0,

  total: 0,
  payable: 0,
  credit: 0,
};

const emptyExecutive: ExecutiveSummary = {
  outward: {
    invoices: 0,
    taxable: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    gst: 0,
    grandTotal: 0,
  },

  purchase: {
    bills: 0,
    taxable: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    gst: 0,
    grandTotal: 0,
  },

  expenses: {
    vouchers: 0,
    taxable: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    gst: 0,
    total: 0,
  },

  inputTaxCredit: {
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0,
  },

  net: emptyNet,
};

const emptyGstr1: Gstr1Working = {
  totalInvoices: 0,
  totalTaxableValue: 0,

  b2b: {
    count: 0,
    taxable: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    gst: 0,
    total: 0,
  },

  b2c: {
    count: 0,
    taxable: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    gst: 0,
    total: 0,
  },

  tax: {
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0,
  },
};

const emptyGstr3b: Gstr3bWorking = {
  table31: {
    outwardTaxableSupplies: {
      taxableValue: 0,
      igst: 0,
      cgst: 0,
      sgst: 0,
      cess: 0,
    },

    reverseChargeInwardSupplies: {
      supported: false,
      taxableValue: 0,
      igst: 0,
      cgst: 0,
      sgst: 0,
      cess: 0,
    },

    zeroRatedSupplies: {
      supported: false,
      taxableValue: 0,
      igst: 0,
    },

    nilExemptSupplies: {
      supported: false,
      taxableValue: 0,
    },

    nonGstSupplies: {
      supported: false,
      taxableValue: 0,
    },
  },

  table4EligibleItc: {
    purchase: {
      igst: 0,
      cgst: 0,
      sgst: 0,
      total: 0,
    },

    expense: {
      igst: 0,
      cgst: 0,
      sgst: 0,
      total: 0,
    },

    total: {
      igst: 0,
      cgst: 0,
      sgst: 0,
      total: 0,
    },

    reversal: {
      supported: false,
      total: 0,
    },
  },

  booksNetPosition: {
    output: 0,
    input: 0,
    net: 0,
    payable: 0,
    credit: 0,
  },
};

const emptyComponent: ComponentRegister = {
  output: [],
  input: [],

  summary: {
    output: 0,
    input: 0,
    net: 0,
  },
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

function formatNumber(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString(
    "en-IN"
  );
}

function getMonthName(
  month: number
) {
  return new Date(
    2000,
    Math.max(
      0,
      Number(month) - 1
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

function currentMonthRange() {
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

function financialYearRange() {
  const now =
    new Date();

  const startYear =
    now.getMonth() >= 3
      ? now.getFullYear()
      : now.getFullYear() - 1;

  return {
    from:
      `${startYear}-04-01`,

    to:
      toDateInput(
        now
      ),
  };
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

function readJson(
  text: string
): GstResponse | null {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(
      text
    ) as GstResponse;
  } catch {
    return null;
  }
}

/* =========================================================
   CSV
========================================================= */

function csvValue(
  value: unknown
) {
  return `"${String(
    value ?? ""
  ).replace(
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
    const row of
    rows
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

export default function GstReportsPage() {
  const initialRange =
    currentMonthRange();

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
    useState<GstTab>(
      "summary"
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
    output,
    setOutput,
  ] =
    useState<GstOutputSummary>(
      emptyOutput
    );

  const [
    input,
    setInput,
  ] =
    useState<GstInputSummary>(
      emptyInput
    );

  const [
    net,
    setNet,
  ] =
    useState<GstNetSummary>(
      emptyNet
    );

  const [
    executive,
    setExecutive,
  ] =
    useState<ExecutiveSummary>(
      emptyExecutive
    );

  const [
    gstr1,
    setGstr1,
  ] =
    useState<Gstr1Working>(
      emptyGstr1
    );

  const [
    gstr3b,
    setGstr3b,
  ] =
    useState<Gstr3bWorking>(
      emptyGstr3b
    );

  const [
    salesRegister,
    setSalesRegister,
  ] =
    useState<
      SalesRegisterRow[]
    >([]);

  const [
    purchaseRegister,
    setPurchaseRegister,
  ] =
    useState<
      PurchaseRegisterRow[]
    >([]);

  const [
    expenseRegister,
    setExpenseRegister,
  ] =
    useState<
      ExpenseRegisterRow[]
    >([]);

  const [
    b2bSales,
    setB2bSales,
  ] =
    useState<
      SalesRegisterRow[]
    >([]);

  const [
    b2cSales,
    setB2cSales,
  ] =
    useState<
      SalesRegisterRow[]
    >([]);

  const [
    itcRegister,
    setItcRegister,
  ] =
    useState<
      ItcRegisterRow[]
    >([]);

  const [
    outputTaxRegister,
    setOutputTaxRegister,
  ] =
    useState<
      OutputTaxRegisterRow[]
    >([]);

  const [
    customerGstinSummary,
    setCustomerGstinSummary,
  ] =
    useState<
      GstinCustomerSummary[]
    >([]);

  const [
    supplierGstinSummary,
    setSupplierGstinSummary,
  ] =
    useState<
      GstinSupplierSummary[]
    >([]);

  const [
    monthlySummary,
    setMonthlySummary,
  ] =
    useState<
      MonthlyGstSummary[]
    >([]);

  const [
    cgstRegister,
    setCgstRegister,
  ] =
    useState<ComponentRegister>(
      emptyComponent
    );

  const [
    sgstRegister,
    setSgstRegister,
  ] =
    useState<ComponentRegister>(
      emptyComponent
    );

  const [
    igstRegister,
    setIgstRegister,
  ] =
    useState<ComponentRegister>(
      emptyComponent
    );

  const [
    dataQuality,
    setDataQuality,
  ] =
    useState<
      DataQuality | undefined
    >();

  const [
    capabilities,
    setCapabilities,
  ] =
    useState<Capabilities>(
      {}
    );

  const [
    pendingModules,
    setPendingModules,
  ] =
    useState<
      PendingModule[]
    >([]);

  /* =======================================================
     LOAD
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

          const query =
            params.toString();

          const response =
            await fetch(
              `/api/admin/accounts/gst${
                query
                  ? `?${query}`
                  : ""
              }`,
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
                `Unable to load GST reports (${response.status}).`
            );
          }

          setGeneratedAt(
            data.generatedAt ||
              ""
          );

          setOutput(
            data.output ||
              emptyOutput
          );

          setInput(
            data.input ||
              emptyInput
          );

          setNet(
            data.net ||
              emptyNet
          );

          setExecutive(
            data.executiveSummary ||
              emptyExecutive
          );

          setGstr1(
            data.gstr1Working ||
              emptyGstr1
          );

          setGstr3b(
            data.gstr3bWorking ||
              emptyGstr3b
          );

          setSalesRegister(
            Array.isArray(
              data.salesRegister
            )
              ? data.salesRegister
              : []
          );

          setPurchaseRegister(
            Array.isArray(
              data.purchaseRegister
            )
              ? data.purchaseRegister
              : []
          );

          setExpenseRegister(
            Array.isArray(
              data.expenseRegister
            )
              ? data.expenseRegister
              : []
          );

          setB2bSales(
            Array.isArray(
              data.b2bSales
            )
              ? data.b2bSales
              : []
          );

          setB2cSales(
            Array.isArray(
              data.b2cSales
            )
              ? data.b2cSales
              : []
          );

          setItcRegister(
            Array.isArray(
              data.itcRegister
            )
              ? data.itcRegister
              : []
          );

          setOutputTaxRegister(
            Array.isArray(
              data.outputTaxRegister
            )
              ? data.outputTaxRegister
              : []
          );

          setCustomerGstinSummary(
            Array.isArray(
              data.customerGstinSummary
            )
              ? data.customerGstinSummary
              : []
          );

          setSupplierGstinSummary(
            Array.isArray(
              data.supplierGstinSummary
            )
              ? data.supplierGstinSummary
              : []
          );

          setMonthlySummary(
            Array.isArray(
              data.monthlySummary
            )
              ? data.monthlySummary
              : []
          );

          setCgstRegister(
            data.cgstRegister ||
              emptyComponent
          );

          setSgstRegister(
            data.sgstRegister ||
              emptyComponent
          );

          setIgstRegister(
            data.igstRegister ||
              emptyComponent
          );

          setDataQuality(
            data.dataQuality
          );

          setCapabilities(
            data.capabilities ||
              {}
          );

          setPendingModules(
            Array.isArray(
              data.pendingModules
            )
              ? data.pendingModules
              : []
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load GST reports."
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
     FILTERS
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

  function setCurrentMonth() {
    const range =
      currentMonthRange();

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

  function setFinancialYear() {
    const range =
      financialYearRange();

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

  function setAllTime() {
    setFrom("");
    setTo("");

    setAppliedFrom("");
    setAppliedTo("");

    setSearch("");
  }

  /* =======================================================
     SEARCHED DATA
  ======================================================= */

  const query =
    normalizeSearch(
      search
    );

  const searchedSales =
    useMemo(
      () =>
        !query
          ? salesRegister
          : salesRegister.filter(
              (row) =>
                [
                  row.invoiceNumber,
                  row.customerName,
                  row.customerGstNumber,
                  row.paymentStatus,
                  row.status,
                ].some(
                  (value) =>
                    normalizeSearch(
                      value
                    ).includes(
                      query
                    )
                )
            ),
      [
        salesRegister,
        query,
      ]
    );

  const searchedPurchase =
    useMemo(
      () =>
        !query
          ? purchaseRegister
          : purchaseRegister.filter(
              (row) =>
                [
                  row.purchaseNumber,
                  row.supplierInvoiceNumber,
                  row.supplierName,
                  row.supplierGstNumber,
                  row.paymentStatus,
                ].some(
                  (value) =>
                    normalizeSearch(
                      value
                    ).includes(
                      query
                    )
                )
            ),
      [
        purchaseRegister,
        query,
      ]
    );

  const searchedExpenses =
    useMemo(
      () =>
        !query
          ? expenseRegister
          : expenseRegister.filter(
              (row) =>
                [
                  row.expenseNumber,
                  row.category,
                  row.vendorName,
                  row.gstNumber,
                  row.billNumber,
                  row.description,
                ].some(
                  (value) =>
                    normalizeSearch(
                      value
                    ).includes(
                      query
                    )
                )
            ),
      [
        expenseRegister,
        query,
      ]
    );

  const searchedB2b =
    useMemo(
      () =>
        !query
          ? b2bSales
          : b2bSales.filter(
              (row) =>
                [
                  row.invoiceNumber,
                  row.customerName,
                  row.customerGstNumber,
                ].some(
                  (value) =>
                    normalizeSearch(
                      value
                    ).includes(
                      query
                    )
                )
            ),
      [
        b2bSales,
        query,
      ]
    );

  const searchedB2c =
    useMemo(
      () =>
        !query
          ? b2cSales
          : b2cSales.filter(
              (row) =>
                [
                  row.invoiceNumber,
                  row.customerName,
                ].some(
                  (value) =>
                    normalizeSearch(
                      value
                    ).includes(
                      query
                    )
                )
            ),
      [
        b2cSales,
        query,
      ]
    );

  /* =======================================================
     FILE NAME
  ======================================================= */

  function suffix() {
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

  /* =======================================================
     EXPORTS
  ======================================================= */

  function downloadSalesRegister() {
    downloadCsv(
      `silentgen_gst_sales_register_${suffix()}.csv`,

      createCsv(
        [
          "Invoice Number",
          "Invoice Date",
          "Customer",
          "GSTIN",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "Total GST",
          "Grand Total",
        ],

        salesRegister.map(
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
          ]
        )
      )
    );
  }

  function downloadPurchaseRegister() {
    downloadCsv(
      `silentgen_gst_purchase_register_${suffix()}.csv`,

      createCsv(
        [
          "Purchase Number",
          "Supplier Invoice",
          "Date",
          "Supplier",
          "GSTIN",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "Input GST",
          "Grand Total",
        ],

        purchaseRegister.map(
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
          ]
        )
      )
    );
  }

  function downloadExpenseRegister() {
    downloadCsv(
      `silentgen_gst_expense_register_${suffix()}.csv`,

      createCsv(
        [
          "Expense Number",
          "Date",
          "Category",
          "Vendor",
          "Bill",
          "GSTIN",
          "Taxable",
          "GST Rate",
          "CGST",
          "SGST",
          "IGST",
          "Input GST",
          "Total",
        ],

        expenseRegister.map(
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
            row.gstRate,
            row.cgst,
            row.sgst,
            row.igst,
            row.totalGst,
            row.totalAmount,
          ]
        )
      )
    );
  }

  function downloadItcRegister() {
    downloadCsv(
      `silentgen_itc_register_${suffix()}.csv`,

      createCsv(
        [
          "Source",
          "Document",
          "External Invoice",
          "Date",
          "Party",
          "GSTIN",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "Total ITC",
          "Books Eligible",
        ],

        itcRegister.map(
          (row) => [
            row.source,
            row.documentNumber,
            row.externalInvoiceNumber,
            formatDate(
              row.date
            ),
            row.partyName,
            row.gstNumber,
            row.taxableAmount,
            row.cgst,
            row.sgst,
            row.igst,
            row.totalGst,
            row.eligible
              ? "Yes"
              : "No",
          ]
        )
      )
    );
  }

  function downloadGstr1Working() {
    downloadCsv(
      `silentgen_gstr1_working_${suffix()}.csv`,

      createCsv(
        [
          "Section",
          "Invoices",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "GST",
          "Total",
        ],
        [
          [
            "B2B",
            gstr1.b2b.count,
            gstr1.b2b.taxable,
            gstr1.b2b.cgst,
            gstr1.b2b.sgst,
            gstr1.b2b.igst,
            gstr1.b2b.gst,
            gstr1.b2b.total,
          ],

          [
            "B2C",
            gstr1.b2c.count,
            gstr1.b2c.taxable,
            gstr1.b2c.cgst,
            gstr1.b2c.sgst,
            gstr1.b2c.igst,
            gstr1.b2c.gst,
            gstr1.b2c.total,
          ],

          [
            "Total",
            gstr1.totalInvoices,
            gstr1.totalTaxableValue,
            gstr1.tax.cgst,
            gstr1.tax.sgst,
            gstr1.tax.igst,
            gstr1.tax.total,
            "",
          ],
        ]
      )
    );
  }

  function downloadGstr3bWorking() {
    downloadCsv(
      `silentgen_gstr3b_working_${suffix()}.csv`,

      createCsv(
        [
          "Section",
          "Taxable Value",
          "IGST",
          "CGST",
          "SGST",
          "CESS",
          "Total",
        ],
        [
          [
            "3.1(a) Outward taxable supplies",
            gstr3b.table31
              .outwardTaxableSupplies
              .taxableValue,
            gstr3b.table31
              .outwardTaxableSupplies
              .igst,
            gstr3b.table31
              .outwardTaxableSupplies
              .cgst,
            gstr3b.table31
              .outwardTaxableSupplies
              .sgst,
            gstr3b.table31
              .outwardTaxableSupplies
              .cess,
            "",
          ],

          [
            "4 - Purchase ITC",
            "",
            gstr3b.table4EligibleItc
              .purchase.igst,
            gstr3b.table4EligibleItc
              .purchase.cgst,
            gstr3b.table4EligibleItc
              .purchase.sgst,
            "",
            gstr3b.table4EligibleItc
              .purchase.total,
          ],

          [
            "4 - Expense ITC",
            "",
            gstr3b.table4EligibleItc
              .expense.igst,
            gstr3b.table4EligibleItc
              .expense.cgst,
            gstr3b.table4EligibleItc
              .expense.sgst,
            "",
            gstr3b.table4EligibleItc
              .expense.total,
          ],

          [
            "Books Net Position",
            "",
            "",
            "",
            "",
            "",
            gstr3b.booksNetPosition
              .net,
          ],
        ]
      )
    );
  }

  function downloadCaPack() {
    const lines: string[] = [];

    lines.push(
      "SILENTGEN CA GST WORKING PACK"
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
      "GST EXECUTIVE SUMMARY"
    );

    lines.push(
      createCsv(
        [
          "Particular",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "GST",
          "Grand Total",
        ],
        [
          [
            "Outward Supplies",
            executive.outward.taxable,
            executive.outward.cgst,
            executive.outward.sgst,
            executive.outward.igst,
            executive.outward.gst,
            executive.outward.grandTotal,
          ],

          [
            "Purchases",
            executive.purchase.taxable,
            executive.purchase.cgst,
            executive.purchase.sgst,
            executive.purchase.igst,
            executive.purchase.gst,
            executive.purchase.grandTotal,
          ],

          [
            "Expenses",
            executive.expenses.taxable,
            executive.expenses.cgst,
            executive.expenses.sgst,
            executive.expenses.igst,
            executive.expenses.gst,
            executive.expenses.total,
          ],
        ]
      )
    );

    lines.push("");

    lines.push(
      "GST NET POSITION"
    );

    lines.push(
      createCsv(
        [
          "Component",
          "Output",
          "Input",
          "Net",
        ],
        [
          [
            "CGST",
            output.cgst,
            input.cgst,
            net.cgst,
          ],

          [
            "SGST",
            output.sgst,
            input.sgst,
            net.sgst,
          ],

          [
            "IGST",
            output.igst,
            input.igst,
            net.igst,
          ],

          [
            "TOTAL",
            output.totalGst,
            input.totalGst,
            net.total,
          ],
        ]
      )
    );

    lines.push("");

    lines.push(
      "GSTR-1 WORKING"
    );

    lines.push(
      createCsv(
        [
          "Section",
          "Invoices",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "GST",
          "Total",
        ],
        [
          [
            "B2B",
            gstr1.b2b.count,
            gstr1.b2b.taxable,
            gstr1.b2b.cgst,
            gstr1.b2b.sgst,
            gstr1.b2b.igst,
            gstr1.b2b.gst,
            gstr1.b2b.total,
          ],

          [
            "B2C",
            gstr1.b2c.count,
            gstr1.b2c.taxable,
            gstr1.b2c.cgst,
            gstr1.b2c.sgst,
            gstr1.b2c.igst,
            gstr1.b2c.gst,
            gstr1.b2c.total,
          ],
        ]
      )
    );

    lines.push("");

    lines.push(
      "SALES REGISTER"
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
          "Grand Total",
        ],

        salesRegister.map(
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
          ]
        )
      )
    );

    lines.push("");

    lines.push(
      "PURCHASE REGISTER"
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
          "Input GST",
          "Grand Total",
        ],

        purchaseRegister.map(
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
          ]
        )
      )
    );

    lines.push("");

    lines.push(
      "EXPENSE GST REGISTER"
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
          "CGST",
          "SGST",
          "IGST",
          "GST",
          "Total",
        ],

        expenseRegister.map(
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
            row.cgst,
            row.sgst,
            row.igst,
            row.totalGst,
            row.totalAmount,
          ]
        )
      )
    );

    lines.push("");

    lines.push(
      "ITC REGISTER"
    );

    lines.push(
      createCsv(
        [
          "Source",
          "Document",
          "Invoice",
          "Date",
          "Party",
          "GSTIN",
          "Taxable",
          "CGST",
          "SGST",
          "IGST",
          "ITC",
        ],

        itcRegister.map(
          (row) => [
            row.source,
            row.documentNumber,
            row.externalInvoiceNumber,
            formatDate(
              row.date
            ),
            row.partyName,
            row.gstNumber,
            row.taxableAmount,
            row.cgst,
            row.sgst,
            row.igst,
            row.totalGst,
          ]
        )
      )
    );

    lines.push("");

    lines.push(
      "MONTH-WISE GST"
    );

    lines.push(
      createCsv(
        [
          "Month",
          "Sales Taxable",
          "Output CGST",
          "Output SGST",
          "Output IGST",
          "Output GST",
          "Purchase Input GST",
          "Expense Input GST",
          "Total Input GST",
          "Net GST",
        ],

        monthlySummary.map(
          (row) => [
            `${getMonthName(
              row.month
            )} ${row.year}`,
            row.salesTaxable,
            row.outputCgst,
            row.outputSgst,
            row.outputIgst,
            row.outputGst,
            row.purchaseInputGst,
            row.expenseInputGst,
            row.totalInputGst,
            row.netGst,
          ]
        )
      )
    );

    lines.push("");

    lines.push(
      "DATA QUALITY CHECK"
    );

    lines.push(
      createCsv(
        [
          "Check",
          "Count",
        ],
        [
          [
            "Invalid Customer GSTIN",
            dataQuality
              ?.invalidCustomerGstin
              .count || 0,
          ],

          [
            "Invalid Supplier GSTIN",
            dataQuality
              ?.invalidSupplierGstin
              .count || 0,
          ],

          [
            "GST Component Mismatch",
            dataQuality
              ?.taxMismatch.total || 0,
          ],
        ]
      )
    );

    downloadCsv(
      `silentgen_CA_GST_pack_${suffix()}.csv`,
      lines.join(
        "\r\n"
      )
    );
  }

  function downloadActiveReport() {
    switch (
      activeTab
    ) {
      case "gstr1":
        downloadGstr1Working();
        break;

      case "gstr3b":
        downloadGstr3bWorking();
        break;

      case "sales":
        downloadSalesRegister();
        break;

      case "purchase":
        downloadPurchaseRegister();
        break;

      case "expenses":
        downloadExpenseRegister();
        break;

      case "itc":
        downloadItcRegister();
        break;

      case "b2b":
        downloadCsv(
          `silentgen_B2B_sales_${suffix()}.csv`,
          salesRowsCsv(
            b2bSales
          )
        );
        break;

      case "b2c":
        downloadCsv(
          `silentgen_B2C_sales_${suffix()}.csv`,
          salesRowsCsv(
            b2cSales
          )
        );
        break;

      case "customers":
        downloadCsv(
          `silentgen_customer_GSTIN_summary_${suffix()}.csv`,
          createCsv(
            [
              "GSTIN",
              "Customer",
              "Invoices",
              "Taxable",
              "CGST",
              "SGST",
              "IGST",
              "GST",
              "Total",
            ],

            customerGstinSummary.map(
              (row) => [
                row.gstNumber,
                row.customerName,
                row.invoices,
                row.taxable,
                row.cgst,
                row.sgst,
                row.igst,
                row.gst,
                row.total,
              ]
            )
          )
        );
        break;

      case "suppliers":
        downloadCsv(
          `silentgen_supplier_GSTIN_summary_${suffix()}.csv`,
          createCsv(
            [
              "GSTIN",
              "Supplier",
              "Bills",
              "Taxable",
              "CGST",
              "SGST",
              "IGST",
              "GST",
              "Total",
            ],

            supplierGstinSummary.map(
              (row) => [
                row.gstNumber,
                row.supplierName,
                row.bills,
                row.taxable,
                row.cgst,
                row.sgst,
                row.igst,
                row.gst,
                row.total,
              ]
            )
          )
        );
        break;

      case "monthly":
        downloadCsv(
          `silentgen_monthly_GST_${suffix()}.csv`,
          createCsv(
            [
              "Month",
              "Sales Taxable",
              "Output CGST",
              "Output SGST",
              "Output IGST",
              "Output GST",
              "Purchase Taxable",
              "Purchase Input GST",
              "Expense Taxable",
              "Expense Input GST",
              "Total Input GST",
              "Net GST",
            ],

            monthlySummary.map(
              (row) => [
                `${getMonthName(
                  row.month
                )} ${row.year}`,
                row.salesTaxable,
                row.outputCgst,
                row.outputSgst,
                row.outputIgst,
                row.outputGst,
                row.purchaseTaxable,
                row.purchaseInputGst,
                row.expenseTaxable,
                row.expenseInputGst,
                row.totalInputGst,
                row.netGst,
              ]
            )
          )
        );
        break;

      case "cgst":
        downloadComponentRegister(
          "CGST",
          cgstRegister,
          "cgst"
        );
        break;

      case "sgst":
        downloadComponentRegister(
          "SGST",
          sgstRegister,
          "sgst"
        );
        break;

      case "igst":
        downloadComponentRegister(
          "IGST",
          igstRegister,
          "igst"
        );
        break;

      default:
        downloadCaPack();
        break;
    }
  }

  function downloadComponentRegister(
    name: string,
    register: ComponentRegister,
    field:
      | "cgst"
      | "sgst"
      | "igst"
  ) {
    downloadCsv(
      `silentgen_${name.toLowerCase()}_register_${suffix()}.csv`,

      createCsv(
        [
          "Side",
          "Source",
          "Document",
          "Date",
          "Party",
          "GSTIN",
          "Taxable",
          name,
        ],

        [
          ...register.output.map(
            (row) => [
              "Output",
              row.source,
              row.documentNumber,
              formatDate(
                row.date
              ),
              row.partyName,
              row.gstNumber,
              row.taxable,
              Number(
                row[field] ||
                  0
              ),
            ]
          ),

          ...register.input.map(
            (row) => [
              "Input",
              row.source,
              row.documentNumber,
              formatDate(
                row.date
              ),
              row.partyName,
              row.gstNumber,
              row.taxable,
              Number(
                row[field] ||
                  0
              ),
            ]
          ),
        ]
      )
    );
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
            Loading CA GST Report Center...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="mx-auto max-w-[1900px] space-y-6 pb-10 print:max-w-none">
      {/* HEADER */}

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
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                  SilentGEN Accounts
                </p>

                <h1 className="mt-1 text-3xl font-black">
                  CA GST Report Center
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-4xl text-sm leading-6 text-gray-300 print:text-gray-600">
              GST working reports for CA review including
              GSTR-1 working, GSTR-3B working, B2B/B2C,
              registers, ITC, tax components and data-quality checks.
            </p>

            <p className="mt-2 text-xs text-gray-400">
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

            <button
              type="button"
              onClick={
                downloadCaPack
              }
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-black"
            >
              <FileSpreadsheet
                size={17}
              />

              Download CA GST Pack
            </button>

            <button
              type="button"
              onClick={() =>
                window.print()
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

      {/* ERROR */}

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {error}
        </section>
      )}

      {/* FILTER */}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <CalendarDays
            size={18}
          />

          <h2 className="font-black">
            GST Report Period
          </h2>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <DateInput
            label="From Date"
            value={from}
            onChange={
              setFrom
            }
          />

          <DateInput
            label="To Date"
            value={to}
            onChange={
              setTo
            }
          />

          <button
            type="button"
            onClick={
              applyFilter
            }
            className="self-end rounded-xl bg-black px-6 py-3 text-sm font-bold text-white"
          >
            Apply Filter
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <PresetButton
            onClick={
              setCurrentMonth
            }
          >
            Current Month
          </PresetButton>

          <PresetButton
            onClick={
              setFinancialYear
            }
          >
            Financial Year
          </PresetButton>

          <PresetButton
            onClick={
              setAllTime
            }
          >
            All Time
          </PresetButton>
        </div>
      </section>

      {/* MAIN GST SUMMARY */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Taxable Sales"
          value={formatCurrency(
            output.taxableSales
          )}
          hint={`${formatNumber(
            output.invoiceCount
          )} invoices`}
        />

        <SummaryCard
          label="Output GST"
          value={formatCurrency(
            output.totalGst
          )}
          hint="GST liability from books"
        />

        <SummaryCard
          label="Input GST"
          value={formatCurrency(
            input.totalGst
          )}
          hint="Purchase + expense GST"
        />

        <SummaryCard
          label={
            net.payable >
            0
              ? "GST Payable"
              : "GST Credit"
          }
          value={formatCurrency(
            net.payable >
              0
              ? net.payable
              : net.credit
          )}
          hint={`Net GST ${formatCurrency(
            net.total
          )}`}
        />
      </section>

      {/* COMPONENT SUMMARY */}

      <section className="grid gap-5 lg:grid-cols-3">
        <TaxComponentCard
          title="CGST"
          output={
            output.cgst
          }
          input={
            input.cgst
          }
          net={
            net.cgst
          }
        />

        <TaxComponentCard
          title="SGST"
          output={
            output.sgst
          }
          input={
            input.sgst
          }
          net={
            net.sgst
          }
        />

        <TaxComponentCard
          title="IGST"
          output={
            output.igst
          }
          input={
            input.igst
          }
          net={
            net.igst
          }
        />
      </section>

      {/* CA CHECKS */}

      <section className="grid gap-4 md:grid-cols-3">
        <QualityCard
          title="Invalid Customer GSTIN"
          value={
            dataQuality
              ?.invalidCustomerGstin
              .count || 0
          }
        />

        <QualityCard
          title="Invalid Supplier GSTIN"
          value={
            dataQuality
              ?.invalidSupplierGstin
              .count || 0
          }
        />

        <QualityCard
          title="GST Calculation Mismatch"
          value={
            dataQuality
              ?.taxMismatch.total || 0
          }
        />
      </section>

      {/* TABS */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5 print:hidden">
          <div className="flex flex-wrap gap-2">
            <Tab
              active={
                activeTab ===
                "summary"
              }
              onClick={() =>
                setActiveTab(
                  "summary"
                )
              }
            >
              Summary
            </Tab>

            <Tab
              active={
                activeTab ===
                "gstr1"
              }
              onClick={() =>
                setActiveTab(
                  "gstr1"
                )
              }
            >
              GSTR-1
            </Tab>

            <Tab
              active={
                activeTab ===
                "gstr3b"
              }
              onClick={() =>
                setActiveTab(
                  "gstr3b"
                )
              }
            >
              GSTR-3B
            </Tab>

            <Tab
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
              Sales Register
            </Tab>

            <Tab
              active={
                activeTab ===
                "purchase"
              }
              onClick={() =>
                setActiveTab(
                  "purchase"
                )
              }
            >
              Purchase Register
            </Tab>

            <Tab
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
              Expense GST
            </Tab>

            <Tab
              active={
                activeTab ===
                "b2b"
              }
              onClick={() =>
                setActiveTab(
                  "b2b"
                )
              }
            >
              B2B
            </Tab>

            <Tab
              active={
                activeTab ===
                "b2c"
              }
              onClick={() =>
                setActiveTab(
                  "b2c"
                )
              }
            >
              B2C
            </Tab>

            <Tab
              active={
                activeTab ===
                "itc"
              }
              onClick={() =>
                setActiveTab(
                  "itc"
                )
              }
            >
              ITC Register
            </Tab>

            <Tab
              active={
                activeTab ===
                "cgst"
              }
              onClick={() =>
                setActiveTab(
                  "cgst"
                )
              }
            >
              CGST
            </Tab>

            <Tab
              active={
                activeTab ===
                "sgst"
              }
              onClick={() =>
                setActiveTab(
                  "sgst"
                )
              }
            >
              SGST
            </Tab>

            <Tab
              active={
                activeTab ===
                "igst"
              }
              onClick={() =>
                setActiveTab(
                  "igst"
                )
              }
            >
              IGST
            </Tab>

            <Tab
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
              Customer GSTIN
            </Tab>

            <Tab
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
              Supplier GSTIN
            </Tab>

            <Tab
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
              Month-wise
            </Tab>

            <Tab
              active={
                activeTab ===
                "quality"
              }
              onClick={() =>
                setActiveTab(
                  "quality"
                )
              }
            >
              CA Checks
            </Tab>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xl flex-1">
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
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold hover:bg-gray-50"
            >
              <Download
                size={17}
              />

              Download Current Report
            </button>
          </div>
        </div>

        {/* SUMMARY */}

        {activeTab ===
          "summary" && (
          <div className="p-5">
            <div className="grid gap-5 lg:grid-cols-3">
              <BreakdownCard
                title="Outward Supplies"
                rows={[
                  [
                    "Invoices",
                    executive.outward
                      .invoices,
                    false,
                  ],
                  [
                    "Taxable",
                    executive.outward
                      .taxable,
                    true,
                  ],
                  [
                    "CGST",
                    executive.outward
                      .cgst,
                    true,
                  ],
                  [
                    "SGST",
                    executive.outward
                      .sgst,
                    true,
                  ],
                  [
                    "IGST",
                    executive.outward
                      .igst,
                    true,
                  ],
                  [
                    "GST",
                    executive.outward
                      .gst,
                    true,
                  ],
                ]}
              />

              <BreakdownCard
                title="Purchase Input"
                rows={[
                  [
                    "Bills",
                    executive.purchase
                      .bills,
                    false,
                  ],
                  [
                    "Taxable",
                    executive.purchase
                      .taxable,
                    true,
                  ],
                  [
                    "CGST",
                    executive.purchase
                      .cgst,
                    true,
                  ],
                  [
                    "SGST",
                    executive.purchase
                      .sgst,
                    true,
                  ],
                  [
                    "IGST",
                    executive.purchase
                      .igst,
                    true,
                  ],
                  [
                    "Input GST",
                    executive.purchase
                      .gst,
                    true,
                  ],
                ]}
              />

              <BreakdownCard
                title="Expense Input"
                rows={[
                  [
                    "Vouchers",
                    executive.expenses
                      .vouchers,
                    false,
                  ],
                  [
                    "Taxable",
                    executive.expenses
                      .taxable,
                    true,
                  ],
                  [
                    "CGST",
                    executive.expenses
                      .cgst,
                    true,
                  ],
                  [
                    "SGST",
                    executive.expenses
                      .sgst,
                    true,
                  ],
                  [
                    "IGST",
                    executive.expenses
                      .igst,
                    true,
                  ],
                  [
                    "Input GST",
                    executive.expenses
                      .gst,
                    true,
                  ],
                ]}
              />
            </div>
          </div>
        )}

        {/* GSTR 1 */}

        {activeTab ===
          "gstr1" && (
          <SimpleTable
            title="GSTR-1 Working Summary"
          >
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Section
                  </Head>

                  <Head align="right">
                    Invoices
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
                </tr>
              </thead>

              <tbody>
                <Gstr1Row
                  name="B2B"
                  data={
                    gstr1.b2b
                  }
                />

                <Gstr1Row
                  name="B2C"
                  data={
                    gstr1.b2c
                  }
                />
              </tbody>
            </table>
          </SimpleTable>
        )}

        {/* GSTR 3B */}

        {activeTab ===
          "gstr3b" && (
          <div className="space-y-6 p-5">
            <h2 className="text-lg font-black">
              GSTR-3B Books Working
            </h2>

            <div className="grid gap-5 lg:grid-cols-2">
              <BreakdownCard
                title="3.1(a) Outward Taxable Supplies"
                rows={[
                  [
                    "Taxable Value",
                    gstr3b.table31
                      .outwardTaxableSupplies
                      .taxableValue,
                    true,
                  ],
                  [
                    "IGST",
                    gstr3b.table31
                      .outwardTaxableSupplies
                      .igst,
                    true,
                  ],
                  [
                    "CGST",
                    gstr3b.table31
                      .outwardTaxableSupplies
                      .cgst,
                    true,
                  ],
                  [
                    "SGST",
                    gstr3b.table31
                      .outwardTaxableSupplies
                      .sgst,
                    true,
                  ],
                ]}
              />

              <BreakdownCard
                title="Table 4 - Eligible ITC"
                rows={[
                  [
                    "Purchase ITC",
                    gstr3b.table4EligibleItc
                      .purchase.total,
                    true,
                  ],
                  [
                    "Expense ITC",
                    gstr3b.table4EligibleItc
                      .expense.total,
                    true,
                  ],
                  [
                    "Total ITC",
                    gstr3b.table4EligibleItc
                      .total.total,
                    true,
                  ],
                  [
                    "Books Net GST",
                    gstr3b.booksNetPosition
                      .net,
                    true,
                  ],
                ]}
              />
            </div>

            <WarningBox>
              RCM, zero-rated, nil/exempt, non-GST and
              ITC reversal are not populated until those
              fields are stored in the accounting models.
            </WarningBox>
          </div>
        )}

        {/* SALES */}

        {activeTab ===
          "sales" && (
          <SalesTable
            title="GST Sales Register"
            rows={
              searchedSales
            }
          />
        )}

        {/* PURCHASE */}

        {activeTab ===
          "purchase" && (
          <PurchaseTable
            title="GST Purchase Register"
            rows={
              searchedPurchase
            }
          />
        )}

        {/* EXPENSE */}

        {activeTab ===
          "expenses" && (
          <ExpenseTable
            rows={
              searchedExpenses
            }
          />
        )}

        {/* B2B */}

        {activeTab ===
          "b2b" && (
          <SalesTable
            title="B2B Sales Report"
            rows={
              searchedB2b
            }
          />
        )}

        {/* B2C */}

        {activeTab ===
          "b2c" && (
          <SalesTable
            title="B2C Sales Report"
            rows={
              searchedB2c
            }
          />
        )}

        {/* ITC */}

        {activeTab ===
          "itc" && (
          <SimpleTable
            title="Input Tax Credit Register"
          >
            <table className="w-full min-w-[1300px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Source
                  </Head>

                  <Head>
                    Document
                  </Head>

                  <Head>
                    Invoice
                  </Head>

                  <Head>
                    Date
                  </Head>

                  <Head>
                    Party
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
                    ITC
                  </Head>
                </tr>
              </thead>

              <tbody>
                {itcRegister.map(
                  (row) => (
                    <tr
                      key={`${row.source}-${row.id}`}
                      className="border-t"
                    >
                      <Cell strong>
                        {row.source.toUpperCase()}
                      </Cell>

                      <Cell>
                        {
                          row.documentNumber
                        }
                      </Cell>

                      <Cell>
                        {row.externalInvoiceNumber ||
                          "-"}
                      </Cell>

                      <Cell>
                        {formatDate(
                          row.date
                        )}
                      </Cell>

                      <Cell strong>
                        {
                          row.partyName
                        }
                      </Cell>

                      <Cell>
                        {row.gstNumber ||
                          "-"}
                      </Cell>

                      <Money
                        value={
                          row.taxableAmount
                        }
                      />

                      <Money
                        value={
                          row.cgst
                        }
                      />

                      <Money
                        value={
                          row.sgst
                        }
                      />

                      <Money
                        value={
                          row.igst
                        }
                      />

                      <Money
                        value={
                          row.totalGst
                        }
                        strong
                      />
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </SimpleTable>
        )}

        {/* COMPONENT */}

        {activeTab ===
          "cgst" && (
          <ComponentTable
            title="CGST Register"
            field="cgst"
            register={
              cgstRegister
            }
          />
        )}

        {activeTab ===
          "sgst" && (
          <ComponentTable
            title="SGST Register"
            field="sgst"
            register={
              sgstRegister
            }
          />
        )}

        {activeTab ===
          "igst" && (
          <ComponentTable
            title="IGST Register"
            field="igst"
            register={
              igstRegister
            }
          />
        )}

        {/* CUSTOMER GSTIN */}

        {activeTab ===
          "customers" && (
          <SimpleTable
            title="Customer GSTIN-wise Sales"
          >
            <GstinSummaryTable
              rows={customerGstinSummary.map(
                (row) => ({
                  name:
                    row.customerName,
                  gstNumber:
                    row.gstNumber,
                  count:
                    row.invoices,
                  taxable:
                    row.taxable,
                  cgst:
                    row.cgst,
                  sgst:
                    row.sgst,
                  igst:
                    row.igst,
                  gst:
                    row.gst,
                  total:
                    row.total,
                })
              )}
            />
          </SimpleTable>
        )}

        {/* SUPPLIER GSTIN */}

        {activeTab ===
          "suppliers" && (
          <SimpleTable
            title="Supplier GSTIN-wise Purchases"
          >
            <GstinSummaryTable
              rows={supplierGstinSummary.map(
                (row) => ({
                  name:
                    row.supplierName,
                  gstNumber:
                    row.gstNumber,
                  count:
                    row.bills,
                  taxable:
                    row.taxable,
                  cgst:
                    row.cgst,
                  sgst:
                    row.sgst,
                  igst:
                    row.igst,
                  gst:
                    row.gst,
                  total:
                    row.total,
                })
              )}
            />
          </SimpleTable>
        )}

        {/* MONTHLY */}

        {activeTab ===
          "monthly" && (
          <SimpleTable
            title="Month-wise GST Summary"
          >
            <table className="w-full min-w-[1250px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Month
                  </Head>

                  <Head align="right">
                    Sales Taxable
                  </Head>

                  <Head align="right">
                    Output CGST
                  </Head>

                  <Head align="right">
                    Output SGST
                  </Head>

                  <Head align="right">
                    Output IGST
                  </Head>

                  <Head align="right">
                    Output GST
                  </Head>

                  <Head align="right">
                    Purchase ITC
                  </Head>

                  <Head align="right">
                    Expense ITC
                  </Head>

                  <Head align="right">
                    Total ITC
                  </Head>

                  <Head align="right">
                    Net GST
                  </Head>
                </tr>
              </thead>

              <tbody>
                {monthlySummary.map(
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

                      <Money
                        value={
                          row.salesTaxable
                        }
                      />

                      <Money
                        value={
                          row.outputCgst
                        }
                      />

                      <Money
                        value={
                          row.outputSgst
                        }
                      />

                      <Money
                        value={
                          row.outputIgst
                        }
                      />

                      <Money
                        value={
                          row.outputGst
                        }
                      />

                      <Money
                        value={
                          row.purchaseInputGst
                        }
                      />

                      <Money
                        value={
                          row.expenseInputGst
                        }
                      />

                      <Money
                        value={
                          row.totalInputGst
                        }
                      />

                      <Money
                        value={
                          row.netGst
                        }
                        strong
                      />
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </SimpleTable>
        )}

        {/* QUALITY */}

        {activeTab ===
          "quality" && (
          <div className="space-y-6 p-5">
            <h2 className="text-lg font-black">
              CA Data Quality Checks
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <QualityCard
                title="Invalid Customer GSTIN"
                value={
                  dataQuality
                    ?.invalidCustomerGstin
                    .count || 0
                }
              />

              <QualityCard
                title="Invalid Supplier GSTIN"
                value={
                  dataQuality
                    ?.invalidSupplierGstin
                    .count || 0
                }
              />

              <QualityCard
                title="GST Mismatch"
                value={
                  dataQuality
                    ?.taxMismatch.total || 0
                }
              />
            </div>

            <div className="rounded-2xl border border-gray-200">
              <div className="border-b p-4">
                <h3 className="font-black">
                  Pending GST Modules
                </h3>
              </div>

              {pendingModules.map(
                (module) => (
                  <div
                    key={
                      module.id
                    }
                    className="flex gap-3 border-b p-4 last:border-b-0"
                  >
                    {module.ready ? (
                      <CheckCircle2
                        size={20}
                        className="shrink-0 text-green-600"
                      />
                    ) : (
                      <AlertTriangle
                        size={20}
                        className="shrink-0 text-orange-500"
                      />
                    )}

                    <div>
                      <p className="font-bold">
                        {
                          module.name
                        }
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {
                          module.reason
                        }
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </section>

      {/* CAPABILITIES */}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={20}
          />

          <h2 className="font-black">
            GST Report Capability Status
          </h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(
            capabilities
          ).map(
            ([
              key,
              ready,
            ]) => (
              <div
                key={
                  key
                }
                className="flex items-center gap-2 rounded-xl bg-gray-50 p-3"
              >
                {ready ? (
                  <CheckCircle2
                    size={16}
                    className="text-green-600"
                  />
                ) : (
                  <AlertTriangle
                    size={16}
                    className="text-orange-500"
                  />
                )}

                <span className="text-xs font-semibold">
                  {key
                    .replace(
                      /([A-Z])/g,
                      " $1"
                    )
                    .trim()}
                </span>
              </div>
            )
          )}
        </div>
      </section>

      <section className="hidden text-xs text-gray-500 print:block">
        <p>
          SilentGEN GST Books Working Report
        </p>

        <p className="mt-1">
          This is a books-based working report. Final GST
          return filing values should be reconciled with GST
          Portal data and reviewed by your CA.
        </p>
      </section>
    </main>
  );
}

/* =========================================================
   CSV SALES
========================================================= */

function salesRowsCsv(
  rows: SalesRegisterRow[]
) {
  return createCsv(
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
    ],

    rows.map(
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
      ]
    )
  );
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-gray-500">
        {label}
      </label>

      <input
        type="date"
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
      />
    </div>
  );
}

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
      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

function Tab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-lg px-3 py-2 text-xs font-bold ${
        active
          ? "bg-black text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

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

function TaxComponentCard({
  title,
  output,
  input,
  net,
}: {
  title: string;
  output: number;
  input: number;
  net: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <BadgeIndianRupee
          size={19}
        />

        <h2 className="font-black">
          {title}
        </h2>
      </div>

      <div className="mt-4 space-y-3">
        <Row
          label="Output"
          value={formatCurrency(
            output
          )}
        />

        <Row
          label="Input"
          value={formatCurrency(
            input
          )}
        />

        <div className="border-t pt-3">
          <Row
            label="Net"
            value={formatCurrency(
              net
            )}
            strong
          />
        </div>
      </div>
    </div>
  );
}

function QualityCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  const good =
    value === 0;

  return (
    <div
      className={`rounded-2xl border p-5 ${
        good
          ? "border-green-200 bg-green-50"
          : "border-orange-200 bg-orange-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">
          {title}
        </p>

        {good ? (
          <CheckCircle2
            size={20}
            className="text-green-600"
          />
        ) : (
          <AlertTriangle
            size={20}
            className="text-orange-600"
          />
        )}
      </div>

      <p className="mt-3 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;

  rows: Array<
    [
      string,
      number,
      boolean
    ]
  >;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="font-black">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {rows.map(
          ([
            label,
            value,
            money,
          ]) => (
            <Row
              key={
                label
              }
              label={
                label
              }
              value={
                money
                  ? formatCurrency(
                      value
                    )
                  : formatNumber(
                      value
                    )
              }
            />
          )
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span
        className={
          strong
            ? "font-black"
            : "font-bold"
        }
      >
        {value}
      </span>
    </div>
  );
}

function WarningBox({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
      <AlertTriangle
        size={20}
        className="shrink-0"
      />

      <div>
        {children}
      </div>
    </div>
  );
}

function SimpleTable({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="font-black">
          {title}
        </h2>
      </div>

      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

function SalesTable({
  title,
  rows,
}: {
  title: string;
  rows: SalesRegisterRow[];
}) {
  return (
    <SimpleTable
      title={`${title} (${rows.length})`}
    >
      <table className="w-full min-w-[1250px]">
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

                <Money
                  value={
                    row.taxableAmount
                  }
                />

                <Money
                  value={
                    row.cgst
                  }
                />

                <Money
                  value={
                    row.sgst
                  }
                />

                <Money
                  value={
                    row.igst
                  }
                />

                <Money
                  value={
                    row.totalGst
                  }
                />

                <Money
                  value={
                    row.grandTotal
                  }
                  strong
                />
              </tr>
            )
          )}
        </tbody>
      </table>
    </SimpleTable>
  );
}

function PurchaseTable({
  title,
  rows,
}: {
  title: string;
  rows: PurchaseRegisterRow[];
}) {
  return (
    <SimpleTable
      title={`${title} (${rows.length})`}
    >
      <table className="w-full min-w-[1350px]">
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

                <Money
                  value={
                    row.taxableAmount
                  }
                />

                <Money
                  value={
                    row.cgst
                  }
                />

                <Money
                  value={
                    row.sgst
                  }
                />

                <Money
                  value={
                    row.igst
                  }
                />

                <Money
                  value={
                    row.totalGst
                  }
                />

                <Money
                  value={
                    row.grandTotal
                  }
                  strong
                />
              </tr>
            )
          )}
        </tbody>
      </table>
    </SimpleTable>
  );
}

function ExpenseTable({
  rows,
}: {
  rows: ExpenseRegisterRow[];
}) {
  return (
    <SimpleTable
      title={`Expense GST Register (${rows.length})`}
    >
      <table className="w-full min-w-[1350px]">
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
                  {row.gstNumber ||
                    "-"}
                </Cell>

                <Money
                  value={
                    row.taxableAmount
                  }
                />

                <Cell align="right">
                  {row.gstRate}
                  %
                </Cell>

                <Money
                  value={
                    row.cgst
                  }
                />

                <Money
                  value={
                    row.sgst
                  }
                />

                <Money
                  value={
                    row.igst
                  }
                />

                <Money
                  value={
                    row.totalGst
                  }
                />

                <Money
                  value={
                    row.totalAmount
                  }
                  strong
                />
              </tr>
            )
          )}
        </tbody>
      </table>
    </SimpleTable>
  );
}

function ComponentTable({
  title,
  field,
  register,
}: {
  title: string;
  field:
    | "cgst"
    | "sgst"
    | "igst";

  register: ComponentRegister;
}) {
  const rows = [
    ...register.output.map(
      (row) => ({
        ...row,
        side:
          "Output",
      })
    ),

    ...register.input.map(
      (row) => ({
        ...row,
        side:
          "Input",
      })
    ),
  ];

  return (
    <SimpleTable
      title={title}
    >
      <div className="border-b bg-gray-50 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat
            label="Output"
            value={
              register.summary
                .output
            }
          />

          <MiniStat
            label="Input"
            value={
              register.summary
                .input
            }
          />

          <MiniStat
            label="Net"
            value={
              register.summary
                .net
            }
          />
        </div>
      </div>

      <table className="w-full min-w-[1000px]">
        <thead className="bg-gray-50">
          <tr>
            <Head>
              Side
            </Head>

            <Head>
              Source
            </Head>

            <Head>
              Document
            </Head>

            <Head>
              Date
            </Head>

            <Head>
              Party
            </Head>

            <Head>
              GSTIN
            </Head>

            <Head align="right">
              Taxable
            </Head>

            <Head align="right">
              {field.toUpperCase()}
            </Head>
          </tr>
        </thead>

        <tbody>
          {rows.map(
            (
              row,
              index
            ) => (
              <tr
                key={`${row.side}-${row.documentNumber}-${index}`}
                className="border-t"
              >
                <Cell strong>
                  {
                    row.side
                  }
                </Cell>

                <Cell>
                  {
                    row.source
                  }
                </Cell>

                <Cell>
                  {
                    row.documentNumber
                  }
                </Cell>

                <Cell>
                  {formatDate(
                    row.date
                  )}
                </Cell>

                <Cell>
                  {
                    row.partyName
                  }
                </Cell>

                <Cell>
                  {row.gstNumber ||
                    "-"}
                </Cell>

                <Money
                  value={
                    row.taxable
                  }
                />

                <Money
                  value={
                    Number(
                      row[field] ||
                        0
                    )
                  }
                  strong
                />
              </tr>
            )
          )}
        </tbody>
      </table>
    </SimpleTable>
  );
}

function Gstr1Row({
  name,
  data,
}: {
  name: string;

  data: {
    count: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    gst: number;
    total: number;
  };
}) {
  return (
    <tr className="border-t">
      <Cell strong>
        {name}
      </Cell>

      <Cell align="right">
        {
          data.count
        }
      </Cell>

      <Money
        value={
          data.taxable
        }
      />

      <Money
        value={
          data.cgst
        }
      />

      <Money
        value={
          data.sgst
        }
      />

      <Money
        value={
          data.igst
        }
      />

      <Money
        value={
          data.gst
        }
      />

      <Money
        value={
          data.total
        }
        strong
      />
    </tr>
  );
}

function GstinSummaryTable({
  rows,
}: {
  rows: Array<{
    name: string;
    gstNumber: string;
    count: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    gst: number;
    total: number;
  }>;
}) {
  return (
    <table className="w-full min-w-[1050px]">
      <thead className="bg-gray-50">
        <tr>
          <Head>
            Party
          </Head>

          <Head>
            GSTIN
          </Head>

          <Head align="right">
            Documents
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
        </tr>
      </thead>

      <tbody>
        {rows.map(
          (
            row,
            index
          ) => (
            <tr
              key={`${row.gstNumber}-${row.name}-${index}`}
              className="border-t"
            >
              <Cell strong>
                {
                  row.name
                }
              </Cell>

              <Cell>
                {row.gstNumber ||
                  "Unregistered"}
              </Cell>

              <Cell align="right">
                {
                  row.count
                }
              </Cell>

              <Money
                value={
                  row.taxable
                }
              />

              <Money
                value={
                  row.cgst
                }
              />

              <Money
                value={
                  row.sgst
                }
              />

              <Money
                value={
                  row.igst
                }
              />

              <Money
                value={
                  row.gst
                }
              />

              <Money
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
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 font-black">
        {formatCurrency(
          value
        )}
      </p>
    </div>
  );
}

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

function Money({
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
          ? "font-black"
          : "font-semibold text-gray-700"
      }`}
    >
      {formatCurrency(
        value
      )}
    </td>
  );
}