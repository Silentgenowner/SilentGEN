"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type Ledger = {
  _id: string;
  name: string;
  ledgerType: string;

  phone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;

  currentBalance?: number;
  isActive?: boolean;
};

type InvoiceItemForm = {
  id: string;

  productId: string;

  name: string;

  sku: string;

  hsnCode: string;

  quantity: string;

  rate: string;

  discountPercent: string;

  gstRate: string;
};

type GstType =
  | "intra_state"
  | "inter_state"
  | "none";

type PaymentMode =
  | "cash"
  | "bank"
  | "upi"
  | "card"
  | "cheque";

type PaymentStatus =
  | "unpaid"
  | "partial"
  | "paid";

type InvoiceStatus =
  | "draft"
  | "issued"
  | "cancelled";

type Invoice = {
  _id: string;

  invoiceNumber: string;

  invoiceDate: string;

  dueDate?: string | null;

  customerName: string;

  customerPhone?: string;

  customerGstNumber?: string;

  gstType: GstType;

  subtotal: number;

  taxableAmount: number;

  totalGst: number;

  grandTotal: number;

  paidAmount: number;

  dueAmount: number;

  paymentStatus:
    PaymentStatus;

  status:
    InvoiceStatus;

  createdAt?: string;
};

type InvoiceListResponse = {
  success: boolean;

  message?: string;

  invoices?: Invoice[];

  summary?: {
    grandTotal?: number;
    paidAmount?: number;
    dueAmount?: number;
    taxableAmount?: number;
    totalGst?: number;
  };

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type LedgerResponse = {
  success: boolean;

  message?: string;

  ledgers?: Ledger[];
};

type CreateInvoiceResponse = {
  success: boolean;

  message?: string;

  invoice?: Invoice;
};

/* =========================================================
   HELPERS
========================================================= */

function createItem(): InvoiceItemForm {
  return {
    id: `${Date.now()}-${Math.random()}`,

    productId: "",

    name: "",

    sku: "",

    hsnCode: "",

    quantity: "1",

    rate: "0",

    discountPercent: "0",

    gstRate: "5",
  };
}

function roundMoney(value: number) {
  return Number(
    Number(value || 0).toFixed(2)
  );
}

function formatCurrency(value: number) {
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

function formatDate(value?: string) {
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

function readJson<T>(
  text: string
): T | null {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function SalesInvoicePage() {
  /* =======================================================
     LIST STATE
  ======================================================= */

  const [
    invoices,
    setInvoices,
  ] =
    useState<Invoice[]>([]);

  const [
    customerLedgers,
    setCustomerLedgers,
  ] =
    useState<Ledger[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    ledgerLoading,
    setLedgerLoading,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  /* =======================================================
     FILTERS
  ======================================================= */

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] =
    useState("");

  const [
    paymentStatus,
    setPaymentStatus,
  ] =
    useState("");

  const [
    invoiceStatus,
    setInvoiceStatus,
  ] =
    useState("");

  /* =======================================================
     PAGINATION
  ======================================================= */

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    totalPages,
    setTotalPages,
  ] =
    useState(1);

  const [
    totalInvoices,
    setTotalInvoices,
  ] =
    useState(0);

  /* =======================================================
     API SUMMARY
  ======================================================= */

  const [
    apiSummary,
    setApiSummary,
  ] =
    useState({
      grandTotal: 0,
      paidAmount: 0,
      dueAmount: 0,
      taxableAmount: 0,
      totalGst: 0,
    });

  /* =======================================================
     CREATE MODAL
  ======================================================= */

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  /* =======================================================
     FORM
  ======================================================= */

  const [
    customerLedgerId,
    setCustomerLedgerId,
  ] =
    useState("");

  const [
    invoiceDate,
    setInvoiceDate,
  ] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [
    dueDate,
    setDueDate,
  ] =
    useState("");

  const [
    billingAddress,
    setBillingAddress,
  ] =
    useState("");

  const [
    placeOfSupply,
    setPlaceOfSupply,
  ] =
    useState("");

  const [
    gstType,
    setGstType,
  ] =
    useState<GstType>(
      "intra_state"
    );

  const [
    items,
    setItems,
  ] =
    useState<
      InvoiceItemForm[]
    >([
      createItem(),
    ]);

  const [
    additionalDiscount,
    setAdditionalDiscount,
  ] =
    useState("0");

  const [
    roundOff,
    setRoundOff,
  ] =
    useState("0");

  const [
    paidAmount,
    setPaidAmount,
  ] =
    useState("0");

  const [
    paymentMode,
    setPaymentMode,
  ] =
    useState<PaymentMode>(
      "cash"
    );

  const [
    notes,
    setNotes,
  ] =
    useState("");

  const [
    terms,
    setTerms,
  ] =
    useState(
      "Goods once sold will not be taken back."
    );

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            setDebouncedSearch(
              search.trim()
            );

            setPage(1);
          },
          350
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [search]
  );

  /* =======================================================
     LOAD INVOICES
  ======================================================= */

  const loadInvoices =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(page)
          );

          params.set(
            "limit",
            "20"
          );

          if (
            debouncedSearch
          ) {
            params.set(
              "search",
              debouncedSearch
            );
          }

          if (
            paymentStatus
          ) {
            params.set(
              "paymentStatus",
              paymentStatus
            );
          }

          if (
            invoiceStatus
          ) {
            params.set(
              "status",
              invoiceStatus
            );
          }

          const response =
            await fetch(
              `/api/admin/accounts/sales-invoices?${params.toString()}`,
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
            readJson<
              InvoiceListResponse
            >(text);

          if (
            !response.ok ||
            !data?.success
          ) {
            throw new Error(
              data?.message ||
                "Unable to load sales invoices."
            );
          }

          setInvoices(
            Array.isArray(
              data.invoices
            )
              ? data.invoices
              : []
          );

          setTotalPages(
            data.pagination
              ?.totalPages ??
              1
          );

          setTotalInvoices(
            data.pagination
              ?.total ??
              0
          );

          setApiSummary({
            grandTotal:
              Number(
                data.summary
                  ?.grandTotal ??
                  0
              ),

            paidAmount:
              Number(
                data.summary
                  ?.paidAmount ??
                  0
              ),

            dueAmount:
              Number(
                data.summary
                  ?.dueAmount ??
                  0
              ),

            taxableAmount:
              Number(
                data.summary
                  ?.taxableAmount ??
                  0
              ),

            totalGst:
              Number(
                data.summary
                  ?.totalGst ??
                  0
              ),
          });
        } catch (
          loadError
        ) {
          console.error(
            "SALES_INVOICE_LOAD_ERROR:",
            loadError
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load invoices."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        page,
        debouncedSearch,
        paymentStatus,
        invoiceStatus,
      ]
    );

  useEffect(
    () => {
      void loadInvoices();
    },
    [loadInvoices]
  );

  /* =======================================================
     CUSTOMER LEDGER
  ======================================================= */

  const loadCustomerLedgers =
    useCallback(
      async () => {
        try {
          setLedgerLoading(
            true
          );

          const response =
            await fetch(
              "/api/admin/accounts/ledger?type=customer&status=active&limit=100",
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
            readJson<
              LedgerResponse
            >(text);

          if (
            !response.ok ||
            !data?.success
          ) {
            throw new Error(
              data?.message ||
                "Unable to load customers."
            );
          }

          setCustomerLedgers(
            Array.isArray(
              data.ledgers
            )
              ? data.ledgers
              : []
          );
        } catch (
          customerError
        ) {
          console.error(
            "LOAD_CUSTOMER_LEDGER_ERROR:",
            customerError
          );

          setError(
            customerError instanceof
              Error
              ? customerError.message
              : "Unable to load customer ledger."
          );
        } finally {
          setLedgerLoading(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     OPEN CREATE
  ======================================================= */

  async function openCreateModal() {
    setError("");
    setSuccess("");

    setCustomerLedgerId("");

    setInvoiceDate(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setDueDate("");

    setBillingAddress("");

    setPlaceOfSupply("");

    setGstType(
      "intra_state"
    );

    setItems([
      createItem(),
    ]);

    setAdditionalDiscount(
      "0"
    );

    setRoundOff(
      "0"
    );

    setPaidAmount(
      "0"
    );

    setPaymentMode(
      "cash"
    );

    setNotes("");

    setTerms(
      "Goods once sold will not be taken back."
    );

    setModalOpen(true);

    if (
      customerLedgers.length ===
      0
    ) {
      await loadCustomerLedgers();
    }
  }

  /* =======================================================
     CUSTOMER CHANGE
  ======================================================= */

  function handleCustomerChange(
    id: string
  ) {
    setCustomerLedgerId(id);

    const customer =
      customerLedgers.find(
        (ledger) =>
          ledger._id === id
      );

    if (!customer) {
      return;
    }

    setBillingAddress(
      customer.address ??
        ""
    );
  }

  /* =======================================================
     ITEM FUNCTIONS
  ======================================================= */

  function updateItem(
    id: string,
    field:
      keyof InvoiceItemForm,
    value: string
  ) {
    setItems(
      (current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,

                  [field]:
                    value,
                }
              : item
        )
    );
  }

  function addItem() {
    setItems(
      (current) => [
        ...current,

        createItem(),
      ]
    );
  }

  function removeItem(
    id: string
  ) {
    setItems(
      (current) => {
        if (
          current.length <= 1
        ) {
          return current;
        }

        return current.filter(
          (item) =>
            item.id !== id
        );
      }
    );
  }

  /* =======================================================
     CALCULATION
  ======================================================= */

  const calculated =
    useMemo(
      () => {
        let subtotal =
          0;

        let itemDiscount =
          0;

        let taxableBeforeExtra =
          0;

        const firstPass =
          items.map(
            (item) => {
              const quantity =
                Math.max(
                  0,
                  Number(
                    item.quantity ||
                      0
                  )
                );

              const rate =
                Math.max(
                  0,
                  Number(
                    item.rate ||
                      0
                  )
                );

              const discountPercent =
                Math.max(
                  0,
                  Math.min(
                    100,
                    Number(
                      item.discountPercent ||
                        0
                    )
                  )
                );

              const gstRate =
                gstType ===
                "none"
                  ? 0
                  : Math.max(
                      0,
                      Number(
                        item.gstRate ||
                          0
                      )
                    );

              const lineSubtotal =
                roundMoney(
                  quantity *
                    rate
                );

              const discountAmount =
                roundMoney(
                  lineSubtotal *
                    discountPercent /
                    100
                );

              const taxable =
                roundMoney(
                  lineSubtotal -
                    discountAmount
                );

              subtotal +=
                lineSubtotal;

              itemDiscount +=
                discountAmount;

              taxableBeforeExtra +=
                taxable;

              return {
                ...item,

                quantity,

                rate,

                discountPercent,

                gstRate,

                lineSubtotal,

                discountAmount,

                originalTaxable:
                  taxable,
              };
            }
          );

        subtotal =
          roundMoney(
            subtotal
          );

        itemDiscount =
          roundMoney(
            itemDiscount
          );

        taxableBeforeExtra =
          roundMoney(
            taxableBeforeExtra
          );

        const extraDiscount =
          Math.max(
            0,
            Number(
              additionalDiscount ||
                0
            )
          );

        let distributed =
          0;

        let finalTaxable =
          0;

        let cgst =
          0;

        let sgst =
          0;

        let igst =
          0;

        const rows =
          firstPass.map(
            (
              item,
              index
            ) => {
              let itemExtraDiscount =
                0;

              if (
                extraDiscount >
                  0 &&
                taxableBeforeExtra >
                  0
              ) {
                if (
                  index ===
                  firstPass.length -
                    1
                ) {
                  itemExtraDiscount =
                    roundMoney(
                      extraDiscount -
                        distributed
                    );
                } else {
                  itemExtraDiscount =
                    roundMoney(
                      extraDiscount *
                        item.originalTaxable /
                        taxableBeforeExtra
                    );

                  distributed =
                    roundMoney(
                      distributed +
                        itemExtraDiscount
                    );
                }
              }

              const taxable =
                Math.max(
                  0,
                  roundMoney(
                    item.originalTaxable -
                      itemExtraDiscount
                  )
                );

              let lineCgst =
                0;

              let lineSgst =
                0;

              let lineIgst =
                0;

              if (
                gstType ===
                "intra_state"
              ) {
                lineCgst =
                  roundMoney(
                    taxable *
                      item.gstRate /
                      200
                  );

                lineSgst =
                  roundMoney(
                    taxable *
                      item.gstRate /
                      200
                  );
              }

              if (
                gstType ===
                "inter_state"
              ) {
                lineIgst =
                  roundMoney(
                    taxable *
                      item.gstRate /
                      100
                  );
              }

              const total =
                roundMoney(
                  taxable +
                    lineCgst +
                    lineSgst +
                    lineIgst
                );

              finalTaxable +=
                taxable;

              cgst +=
                lineCgst;

              sgst +=
                lineSgst;

              igst +=
                lineIgst;

              return {
                ...item,

                taxableAmount:
                  taxable,

                cgst:
                  lineCgst,

                sgst:
                  lineSgst,

                igst:
                  lineIgst,

                total,
              };
            }
          );

        finalTaxable =
          roundMoney(
            finalTaxable
          );

        cgst =
          roundMoney(cgst);

        sgst =
          roundMoney(sgst);

        igst =
          roundMoney(igst);

        const totalGst =
          roundMoney(
            cgst +
              sgst +
              igst
          );

        const finalRoundOff =
          Number.isFinite(
            Number(roundOff)
          )
            ? roundMoney(
                Number(roundOff)
              )
            : 0;

        const grandTotal =
          Math.max(
            0,
            roundMoney(
              finalTaxable +
                totalGst +
                finalRoundOff
            )
          );

        const paid =
          Math.max(
            0,
            roundMoney(
              Number(
                paidAmount ||
                  0
              )
            )
          );

        const due =
          Math.max(
            0,
            roundMoney(
              grandTotal -
                paid
            )
          );

        return {
          rows,

          subtotal,

          itemDiscount,

          taxableBeforeExtra,

          additionalDiscount:
            extraDiscount,

          finalTaxable,

          cgst,

          sgst,

          igst,

          totalGst,

          roundOff:
            finalRoundOff,

          grandTotal,

          paidAmount:
            paid,

          dueAmount:
            due,
        };
      },
      [
        items,
        gstType,
        additionalDiscount,
        roundOff,
        paidAmount,
      ]
    );

  /* =======================================================
     VALIDATION
  ======================================================= */

  function validateForm() {
    if (
      !customerLedgerId
    ) {
      return "Customer ledger is required.";
    }

    if (
      !invoiceDate
    ) {
      return "Invoice date is required.";
    }

    if (
      dueDate &&
      dueDate <
        invoiceDate
    ) {
      return "Due date cannot be before invoice date.";
    }

    if (
      items.length ===
      0
    ) {
      return "At least one invoice item is required.";
    }

    for (
      const item of
      items
    ) {
      if (
        !item.name.trim()
      ) {
        return "Every invoice item requires a product/item name.";
      }

      const quantity =
        Number(
          item.quantity
        );

      const rate =
        Number(
          item.rate
        );

      const discount =
        Number(
          item.discountPercent ||
            0
        );

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        return "Quantity must be greater than zero.";
      }

      if (
        !Number.isFinite(
          rate
        ) ||
        rate < 0
      ) {
        return "Rate must be a valid non-negative amount.";
      }

      if (
        !Number.isFinite(
          discount
        ) ||
        discount < 0 ||
        discount > 100
      ) {
        return "Item discount must be between 0 and 100.";
      }
    }

    if (
      calculated.additionalDiscount >
      calculated.taxableBeforeExtra
    ) {
      return "Additional discount cannot exceed taxable value.";
    }

    if (
      calculated.paidAmount >
      calculated.grandTotal
    ) {
      return "Paid amount cannot exceed invoice total.";
    }

    return null;
  }

  /* =======================================================
     CREATE
  ======================================================= */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError =
      validateForm();

    if (
      validationError
    ) {
      setError(
        validationError
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        customerLedgerId,

        invoiceDate,

        dueDate:
          dueDate ||
          null,

        billingAddress:
          billingAddress.trim(),

        placeOfSupply:
          placeOfSupply.trim(),

        gstType,

        paymentMode:
          calculated.paidAmount >
          0
            ? paymentMode
            : "credit",

        items:
          items.map(
            (item) => ({
              productId:
                item.productId ||
                null,

              name:
                item.name.trim(),

              sku:
                item.sku.trim(),

              hsnCode:
                item.hsnCode.trim(),

              quantity:
                Number(
                  item.quantity
                ),

              rate:
                Number(
                  item.rate
                ),

              discountPercent:
                Number(
                  item.discountPercent ||
                    0
                ),

              gstRate:
                gstType ===
                "none"
                  ? 0
                  : Number(
                      item.gstRate ||
                        0
                    ),
            })
          ),

        additionalDiscount:
          calculated.additionalDiscount,

        roundOff:
          calculated.roundOff,

        paidAmount:
          calculated.paidAmount,

        notes:
          notes.trim(),

        terms:
          terms.trim(),
      };

      const response =
        await fetch(
          "/api/admin/accounts/sales-invoices",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const text =
        await response.text();

      const data =
        readJson<
          CreateInvoiceResponse
        >(text);

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to create sales invoice."
        );
      }

      setModalOpen(false);

      setSuccess(
        `Invoice ${
          data.invoice
            ?.invoiceNumber ??
          ""
        } created successfully.`
      );

      setPage(1);

      await loadInvoices();
    } catch (
      saveError
    ) {
      console.error(
        "CREATE_SALES_INVOICE_ERROR:",
        saveError
      );

      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to create invoice."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1700px] p-4 sm:p-6 lg:p-8">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Accounts
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">
              Sales Invoice
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage GST sales invoices,
              customer receivables and payments.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                void loadInvoices()
              }
              disabled={
                loading
              }
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCcw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                void openCreateModal()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <Plus
                size={18}
              />

              Create Invoice
            </button>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success &&
          !error && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {success}
            </div>
          )}

        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Invoices"
            value={String(
              totalInvoices
            )}
          />

          <SummaryCard
            label="Taxable Sales"
            value={formatCurrency(
              apiSummary.taxableAmount
            )}
          />

          <SummaryCard
            label="GST"
            value={formatCurrency(
              apiSummary.totalGst
            )}
          />

          <SummaryCard
            label="Received"
            value={formatCurrency(
              apiSummary.paidAmount
            )}
          />

          <SummaryCard
            label="Outstanding"
            value={formatCurrency(
              apiSummary.dueAmount
            )}
          />
        </div>

        {/* FILTERS */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search invoice, customer, mobile or GSTIN..."
                className={inputClass}
                style={{
                  paddingLeft:
                    "2.5rem",
                }}
              />
            </div>

            <select
              value={
                paymentStatus
              }
              onChange={(
                event
              ) => {
                setPaymentStatus(
                  event.target
                    .value
                );

                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">
                All Payment Status
              </option>

              <option value="unpaid">
                Unpaid
              </option>

              <option value="partial">
                Partial
              </option>

              <option value="paid">
                Paid
              </option>
            </select>

            <select
              value={
                invoiceStatus
              }
              onChange={(
                event
              ) => {
                setInvoiceStatus(
                  event.target
                    .value
                );

                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">
                All Invoice Status
              </option>

              <option value="issued">
                Issued
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </div>
        </section>

        {/* TABLE */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px]">
              <thead className="border-b border-gray-200 bg-gray-50">
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
                    GST
                  </Head>

                  <Head align="right">
                    Taxable
                  </Head>

                  <Head align="right">
                    GST Amount
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

                  <Head align="right">
                    Action
                  </Head>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="py-16 text-center"
                    >
                      <Loader2
                        size={28}
                        className="mx-auto animate-spin text-gray-500"
                      />

                      <p className="mt-3 text-sm text-gray-500">
                        Loading invoices...
                      </p>
                    </td>
                  </tr>
                ) : invoices.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="py-16 text-center"
                    >
                      <FileText
                        size={32}
                        className="mx-auto text-gray-400"
                      />

                      <p className="mt-3 font-semibold text-gray-800">
                        No sales invoices found
                      </p>
                    </td>
                  </tr>
                ) : (
                  invoices.map(
                    (invoice) => (
                      <tr
                        key={
                          invoice._id
                        }
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-900">
                            {
                              invoice.invoiceNumber
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDate(
                            invoice.invoiceDate
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            {
                              invoice.customerName
                            }
                          </p>

                          {invoice.customerPhone && (
                            <p className="mt-1 text-xs text-gray-400">
                              {
                                invoice.customerPhone
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            {invoice.gstType ===
                            "intra_state"
                              ? "CGST + SGST"
                              : invoice.gstType ===
                                "inter_state"
                              ? "IGST"
                              : "No GST"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right text-sm">
                          {formatCurrency(
                            invoice.taxableAmount
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-sm">
                          {formatCurrency(
                            invoice.totalGst
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-bold">
                          {formatCurrency(
                            invoice.grandTotal
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                          {formatCurrency(
                            invoice.paidAmount
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-red-600">
                          {formatCurrency(
                            invoice.dueAmount
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <PaymentBadge
                            value={
                              invoice.paymentStatus
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            value={
                              invoice.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <Link
                              href={`/admin/accounts/sales-invoice/${invoice._id}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-black"
                              title="View Invoice"
                            >
                              <Eye
                                size={16}
                              />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
            <p className="text-sm text-gray-500">
              Page{" "}
              <strong className="text-gray-900">
                {page}
              </strong>{" "}
              of{" "}
              <strong className="text-gray-900">
                {totalPages}
              </strong>
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  page <= 1 ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.max(
                        1,
                        current -
                          1
                      )
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                <ChevronLeft
                  size={17}
                />

                Previous
              </button>

              <button
                type="button"
                disabled={
                  page >=
                    totalPages ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.min(
                        totalPages,
                        current +
                          1
                      )
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                Next

                <ChevronRight
                  size={17}
                />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ===================================================
          CREATE MODAL
      =================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-5">
          <div className="mx-auto my-4 w-full max-w-[1500px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Create Sales Invoice
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  GST and accounting entries
                  will be posted automatically.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  setModalOpen(
                    false
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="p-5"
            >
              {/* BASIC */}

              <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field
                    label="Customer Ledger"
                    required
                  >
                    <select
                      value={
                        customerLedgerId
                      }
                      onChange={(
                        event
                      ) =>
                        handleCustomerChange(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        saving ||
                        ledgerLoading
                      }
                      className={
                        inputClass
                      }
                    >
                      <option value="">
                        {ledgerLoading
                          ? "Loading..."
                          : "Select Customer"}
                      </option>

                      {customerLedgers.map(
                        (ledger) => (
                          <option
                            key={
                              ledger._id
                            }
                            value={
                              ledger._id
                            }
                          >
                            {
                              ledger.name
                            }
                            {ledger.gstNumber
                              ? ` - ${ledger.gstNumber}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </Field>

                  <Field
                    label="Invoice Date"
                    required
                  >
                    <input
                      type="date"
                      value={
                        invoiceDate
                      }
                      onChange={(
                        event
                      ) =>
                        setInvoiceDate(
                          event.target
                            .value
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <Field label="Due Date">
                    <input
                      type="date"
                      min={
                        invoiceDate
                      }
                      value={
                        dueDate
                      }
                      onChange={(
                        event
                      ) =>
                        setDueDate(
                          event.target
                            .value
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <Field
                    label="GST Type"
                    required
                  >
                    <select
                      value={
                        gstType
                      }
                      onChange={(
                        event
                      ) =>
                        setGstType(
                          event.target
                            .value as GstType
                        )
                      }
                      className={
                        inputClass
                      }
                    >
                      <option value="intra_state">
                        Intra State - CGST + SGST
                      </option>

                      <option value="inter_state">
                        Inter State - IGST
                      </option>

                      <option value="none">
                        No GST
                      </option>
                    </select>
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Place of Supply">
                    <input
                      value={
                        placeOfSupply
                      }
                      onChange={(
                        event
                      ) =>
                        setPlaceOfSupply(
                          event.target
                            .value
                        )
                      }
                      placeholder="Gujarat"
                      className={
                        inputClass
                      }
                    />
                  </Field>

                  <Field label="Billing Address">
                    <input
                      value={
                        billingAddress
                      }
                      onChange={(
                        event
                      ) =>
                        setBillingAddress(
                          event.target
                            .value
                        )
                      }
                      placeholder="Customer billing address"
                      className={
                        inputClass
                      }
                    />
                  </Field>
                </div>
              </section>

              {/* ITEMS */}

              <section className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Invoice Items
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Add one or more taxable items.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addItem
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Plus
                      size={16}
                    />

                    Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1450px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-white">
                        <Head>
                          Item
                        </Head>

                        <Head>
                          SKU
                        </Head>

                        <Head>
                          HSN
                        </Head>

                        <Head>
                          Qty
                        </Head>

                        <Head>
                          Rate
                        </Head>

                        <Head>
                          Disc %
                        </Head>

                        <Head>
                          GST %
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
                          Total
                        </Head>

                        <Head align="right">
                          Action
                        </Head>
                      </tr>
                    </thead>

                    <tbody>
                      {calculated.rows.map(
                        (item) => (
                          <tr
                            key={
                              item.id
                            }
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="min-w-[220px] px-3 py-3">
                              <input
                                value={
                                  item.name
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    item.id,
                                    "name",
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="Product / Item"
                                className={
                                  smallInputClass
                                }
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                value={
                                  item.sku
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    item.id,
                                    "sku",
                                    event.target
                                      .value
                                  )
                                }
                                className={
                                  smallInputClass
                                }
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                value={
                                  item.hsnCode
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    item.id,
                                    "hsnCode",
                                    event.target
                                      .value
                                  )
                                }
                                className={
                                  smallInputClass
                                }
                              />
                            </td>

                            <td className="w-28 px-3 py-3">
                              <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={
                                  item.quantity
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    item.id,
                                    "quantity",
                                    event.target
                                      .value
                                  )
                                }
                                className={
                                  smallInputClass
                                }
                              />
                            </td>

                            <td className="w-32 px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.rate
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    item.id,
                                    "rate",
                                    event.target
                                      .value
                                  )
                                }
                                className={
                                  smallInputClass
                                }
                              />
                            </td>

                            <td className="w-28 px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={
                                  item.discountPercent
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    item.id,
                                    "discountPercent",
                                    event.target
                                      .value
                                  )
                                }
                                className={
                                  smallInputClass
                                }
                              />
                            </td>

                            <td className="w-28 px-3 py-3">
                              <select
                                value={
                                  gstType ===
                                  "none"
                                    ? "0"
                                    : item.gstRate
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    item.id,
                                    "gstRate",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  gstType ===
                                  "none"
                                }
                                className={
                                  smallInputClass
                                }
                              >
                                <option value="0">
                                  0%
                                </option>

                                <option value="3">
                                  3%
                                </option>

                                <option value="5">
                                  5%
                                </option>

                                <option value="12">
                                  12%
                                </option>

                                <option value="18">
                                  18%
                                </option>

                                <option value="28">
                                  28%
                                </option>
                              </select>
                            </td>

                            <td className="px-3 py-3 text-right text-sm font-semibold">
                              {formatCurrency(
                                item.taxableAmount
                              )}
                            </td>

                            <td className="px-3 py-3 text-right text-sm">
                              {formatCurrency(
                                item.cgst
                              )}
                            </td>

                            <td className="px-3 py-3 text-right text-sm">
                              {formatCurrency(
                                item.sgst
                              )}
                            </td>

                            <td className="px-3 py-3 text-right text-sm">
                              {formatCurrency(
                                item.igst
                              )}
                            </td>

                            <td className="px-3 py-3 text-right font-bold">
                              {formatCurrency(
                                item.total
                              )}
                            </td>

                            <td className="px-3 py-3">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  disabled={
                                    items.length <=
                                    1
                                  }
                                  onClick={() =>
                                    removeItem(
                                      item.id
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-30"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* BOTTOM */}

              <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_440px]">
                <div className="space-y-4">
                  <Field label="Notes">
                    <textarea
                      rows={4}
                      value={
                        notes
                      }
                      onChange={(
                        event
                      ) =>
                        setNotes(
                          event.target
                            .value
                        )
                      }
                      className={
                        textareaClass
                      }
                    />
                  </Field>

                  <Field label="Terms & Conditions">
                    <textarea
                      rows={4}
                      value={
                        terms
                      }
                      onChange={(
                        event
                      ) =>
                        setTerms(
                          event.target
                            .value
                        )
                      }
                      className={
                        textareaClass
                      }
                    />
                  </Field>
                </div>

                {/* TOTALS */}

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <h3 className="mb-4 font-bold text-gray-900">
                    Invoice Summary
                  </h3>

                  <SummaryRow
                    label="Subtotal"
                    value={formatCurrency(
                      calculated.subtotal
                    )}
                  />

                  <SummaryRow
                    label="Item Discount"
                    value={`- ${formatCurrency(
                      calculated.itemDiscount
                    )}`}
                  />

                  <div className="my-4">
                    <Field label="Additional Discount">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          additionalDiscount
                        }
                        onChange={(
                          event
                        ) =>
                          setAdditionalDiscount(
                            event.target
                              .value
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>
                  </div>

                  <SummaryRow
                    label="Taxable Amount"
                    value={formatCurrency(
                      calculated.finalTaxable
                    )}
                  />

                  <SummaryRow
                    label="CGST"
                    value={formatCurrency(
                      calculated.cgst
                    )}
                  />

                  <SummaryRow
                    label="SGST"
                    value={formatCurrency(
                      calculated.sgst
                    )}
                  />

                  <SummaryRow
                    label="IGST"
                    value={formatCurrency(
                      calculated.igst
                    )}
                  />

                  <SummaryRow
                    label="Total GST"
                    value={formatCurrency(
                      calculated.totalGst
                    )}
                  />

                  <div className="my-4">
                    <Field label="Round Off">
                      <input
                        type="number"
                        step="0.01"
                        value={
                          roundOff
                        }
                        onChange={(
                          event
                        ) =>
                          setRoundOff(
                            event.target
                              .value
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>
                  </div>

                  <div className="rounded-xl bg-black p-4 text-white">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold">
                        Grand Total
                      </span>

                      <span className="text-xl font-bold">
                        {formatCurrency(
                          calculated.grandTotal
                        )}
                      </span>
                    </div>
                  </div>

                  {/* PAYMENT */}

                  <div className="mt-5">
                    <Field label="Paid Amount">
                      <input
                        type="number"
                        min="0"
                        max={
                          calculated.grandTotal
                        }
                        step="0.01"
                        value={
                          paidAmount
                        }
                        onChange={(
                          event
                        ) =>
                          setPaidAmount(
                            event.target
                              .value
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>
                  </div>

                  {calculated.paidAmount >
                    0 && (
                    <div className="mt-4">
                      <Field
                        label="Payment Mode"
                        required
                      >
                        <select
                          value={
                            paymentMode
                          }
                          onChange={(
                            event
                          ) =>
                            setPaymentMode(
                              event.target
                                .value as PaymentMode
                            )
                          }
                          className={
                            inputClass
                          }
                        >
                          <option value="cash">
                            Cash
                          </option>

                          <option value="bank">
                            Bank Transfer
                          </option>

                          <option value="upi">
                            UPI
                          </option>

                          <option value="card">
                            Card
                          </option>

                          <option value="cheque">
                            Cheque
                          </option>
                        </select>
                      </Field>
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-red-700">
                        Due Amount
                      </span>

                      <span className="text-lg font-bold text-red-700">
                        {formatCurrency(
                          calculated.dueAmount
                        )}
                      </span>
                    </div>
                  </div>

                  {calculated.paidAmount >
                    0 && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                      Payment of{" "}
                      <strong>
                        {formatCurrency(
                          calculated.paidAmount
                        )}
                      </strong>{" "}
                      will be posted to{" "}
                      <strong>
                        {paymentMode ===
                        "cash"
                          ? "Cash"
                          : "Bank"}
                      </strong>{" "}
                      account automatically.
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION */}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    setModalOpen(
                      false
                    )
                  }
                  className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <CircleDollarSign
                      size={17}
                    />
                  )}

                  {saving
                    ? "Creating..."
                    : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   UI STYLES
========================================================= */

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-gray-100";

const smallInputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black/10 disabled:bg-gray-100";

const textareaClass =
  "w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10";

/* =========================================================
   COMPONENTS
========================================================= */

function Field({
  label,
  required = false,
  children,
}: {
  label: string;

  required?: boolean;

  children:
    React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function Head({
  children,
  align = "left",
}: {
  children:
    React.ReactNode;

  align?:
    "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 ${
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

function SummaryCard({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-950">
        {value}
      </p>
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
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}

function PaymentBadge({
  value,
}: {
  value:
    PaymentStatus;
}) {
  if (
    value === "paid"
  ) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Paid
      </span>
    );
  }

  if (
    value === "partial"
  ) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        Partial
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
      Unpaid
    </span>
  );
}

function StatusBadge({
  value,
}: {
  value:
    InvoiceStatus;
}) {
  if (
    value === "issued"
  ) {
    return (
      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        Issued
      </span>
    );
  }

  if (
    value === "cancelled"
  ) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Cancelled
      </span>
    );
  }

  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
      Draft
    </span>
  );
}