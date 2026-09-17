"use client";

import {
  type FormEvent,
  type ReactNode,
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

type PurchaseItemForm = {
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

type PurchaseStatus =
  | "draft"
  | "issued"
  | "cancelled";

type Purchase = {
  _id: string;

  purchaseNumber: string;

  supplierInvoiceNumber?: string;

  purchaseDate: string;

  dueDate?: string | null;

  supplierName: string;

  supplierPhone?: string;

  supplierGstNumber?: string;

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
    PurchaseStatus;
};

type PurchaseListResponse = {
  success: boolean;

  message?: string;

  purchases?: Purchase[];

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

type CreatePurchaseResponse = {
  success: boolean;

  message?: string;

  purchase?: Purchase;
};

/* =========================================================
   HELPERS
========================================================= */

function createItem():
  PurchaseItemForm {
  return {
    id:
      `${Date.now()}-${Math.random()}`,

    productId: "",

    name: "",

    sku: "",

    hsnCode: "",

    quantity: "1",

    rate: "0",

    discountPercent:
      "0",

    gstRate: "5",
  };
}

function roundMoney(
  value: number
) {
  return Number(
    Number(
      value || 0
    ).toFixed(2)
  );
}

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      value || 0
    )
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
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
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
    return JSON.parse(
      text
    ) as T;
  } catch {
    return null;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function PurchasePage() {
  const [
    purchases,
    setPurchases,
  ] =
    useState<
      Purchase[]
    >([]);

  const [
    supplierLedgers,
    setSupplierLedgers,
  ] =
    useState<
      Ledger[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    supplierLoading,
    setSupplierLoading,
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
     SEARCH
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
    purchaseStatus,
    setPurchaseStatus,
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
    totalPurchases,
    setTotalPurchases,
  ] =
    useState(0);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const [
    summary,
    setSummary,
  ] =
    useState({
      grandTotal: 0,

      paidAmount: 0,

      dueAmount: 0,

      taxableAmount:
        0,

      totalGst: 0,
    });

  /* =======================================================
     MODAL
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
    supplierLedgerId,
    setSupplierLedgerId,
  ] =
    useState("");

  const [
    supplierInvoiceNumber,
    setSupplierInvoiceNumber,
  ] =
    useState("");

  const [
    purchaseDate,
    setPurchaseDate,
  ] =
    useState(
      new Date()
        .toISOString()
        .slice(
          0,
          10
        )
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
      PurchaseItemForm[]
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
     LOAD PURCHASES
  ======================================================= */

  const loadPurchases =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

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
            purchaseStatus
          ) {
            params.set(
              "status",
              purchaseStatus
            );
          }

          const response =
            await fetch(
              `/api/admin/accounts/purchase?${params.toString()}`,
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
            readJson<
              PurchaseListResponse
            >(text);

          if (!response.ok) {
            throw new Error(
              data?.message ||
                `Purchase API failed (${response.status}).`
            );
          }

          if (!data) {
            throw new Error(
              `Purchase API returned invalid JSON. HTTP ${response.status}.`
            );
          }

          if (!data.success) {
            throw new Error(
              data.message ||
                "Unable to load purchase bills."
            );
          }

          setPurchases(
            Array.isArray(
              data.purchases
            )
              ? data.purchases
              : []
          );

          setTotalPages(
            data.pagination
              ?.totalPages ??
              1
          );

          setTotalPurchases(
            data.pagination
              ?.total ??
              0
          );

          setSummary({
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
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load purchase bills."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        page,
        debouncedSearch,
        paymentStatus,
        purchaseStatus,
      ]
    );

  useEffect(
    () => {
      void loadPurchases();
    },
    [loadPurchases]
  );

  /* =======================================================
     SUPPLIERS
  ======================================================= */

  const loadSuppliers =
    useCallback(
      async () => {
        try {
          setSupplierLoading(
            true
          );

          const response =
            await fetch(
              "/api/admin/accounts/ledger?type=supplier&status=active&limit=100",
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
                "Unable to load supplier ledgers."
            );
          }

          setSupplierLedgers(
            Array.isArray(
              data.ledgers
            )
              ? data.ledgers
              : []
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load supplier ledgers."
          );
        } finally {
          setSupplierLoading(
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

    setSupplierLedgerId(
      ""
    );

    setSupplierInvoiceNumber(
      ""
    );

    setPurchaseDate(
      new Date()
        .toISOString()
        .slice(
          0,
          10
        )
    );

    setDueDate("");

    setBillingAddress(
      ""
    );

    setPlaceOfSupply(
      ""
    );

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

    setModalOpen(
      true
    );

    await loadSuppliers();
  }

  /* =======================================================
     SUPPLIER CHANGE
  ======================================================= */

  function handleSupplierChange(
    id: string
  ) {
    setSupplierLedgerId(
      id
    );

    const supplier =
      supplierLedgers.find(
        (ledger) =>
          ledger._id === id
      );

    if (!supplier) {
      return;
    }

    setBillingAddress(
      supplier.address ??
        ""
    );
  }

  /* =======================================================
     ITEMS
  ======================================================= */

  function updateItem(
    id: string,
    field:
      keyof PurchaseItemForm,
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
          current.length <=
          1
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
     CALCULATIONS
  ======================================================= */

  const calculated =
    useMemo(
      () => {
        let subtotal = 0;

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

        let cgst = 0;

        let sgst = 0;

        let igst = 0;

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
            Number(
              roundOff
            )
          )
            ? roundMoney(
                Number(
                  roundOff
                )
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
     VALIDATE
  ======================================================= */

  function validateForm() {
    if (
      !supplierLedgerId
    ) {
      return "Supplier ledger is required.";
    }

    if (
      !purchaseDate
    ) {
      return "Purchase date is required.";
    }

    if (
      dueDate &&
      dueDate <
        purchaseDate
    ) {
      return "Due date cannot be before purchase date.";
    }

    if (
      items.length ===
      0
    ) {
      return "At least one purchase item is required.";
    }

    for (
      const item of
      items
    ) {
      if (
        !item.name.trim()
      ) {
        return "Every purchase item requires a name.";
      }

      if (
        Number(
          item.quantity
        ) <= 0
      ) {
        return "Quantity must be greater than zero.";
      }

      if (
        Number(
          item.rate
        ) < 0
      ) {
        return "Rate cannot be negative.";
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
      return "Paid amount cannot exceed purchase total.";
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

      const response =
        await fetch(
          "/api/admin/accounts/purchase",
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
              JSON.stringify({
                supplierLedgerId,

                supplierInvoiceNumber,

                purchaseDate,

                dueDate:
                  dueDate ||
                  null,

                billingAddress,

                placeOfSupply,

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

                notes,
              }),
          }
        );

      const text =
        await response.text();

      const data =
        readJson<
          CreatePurchaseResponse
        >(text);

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            `Purchase create failed (${response.status}).`
        );
      }

      setModalOpen(false);

      setSuccess(
        `Purchase ${
          data.purchase
            ?.purchaseNumber ??
          ""
        } created successfully.`
      );

      setPage(1);

      await loadPurchases();
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to create purchase bill."
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
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Accounts
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-950">
              Purchase
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Purchase bills, Input GST and supplier payable.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                void loadPurchases()
              }
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              <RefreshCcw
                size={17}
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                void openCreateModal()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus
                size={18}
              />

              Create Purchase
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Purchases"
            value={String(
              totalPurchases
            )}
          />

          <SummaryCard
            label="Taxable"
            value={formatCurrency(
              summary.taxableAmount
            )}
          />

          <SummaryCard
            label="Input GST"
            value={formatCurrency(
              summary.totalGst
            )}
          />

          <SummaryCard
            label="Paid"
            value={formatCurrency(
              summary.paidAmount
            )}
          />

          <SummaryCard
            label="Supplier Due"
            value={formatCurrency(
              summary.dueAmount
            )}
          />
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border bg-white p-4 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search purchase or supplier..."
              className="w-full rounded-xl border px-4 py-3 pl-10 text-sm"
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
            className={
              inputClass
            }
          >
            <option value="">
              All Payment
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
              purchaseStatus
            }
            onChange={(
              event
            ) => {
              setPurchaseStatus(
                event.target
                  .value
              );

              setPage(1);
            }}
            className={
              inputClass
            }
          >
            <option value="">
              All Status
            </option>

            <option value="issued">
              Issued
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
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
                      colSpan={10}
                      className="py-16 text-center"
                    >
                      <Loader2
                        className="mx-auto animate-spin"
                      />
                    </td>
                  </tr>
                ) : purchases.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-16 text-center text-gray-500"
                    >
                      No purchase bills found.
                    </td>
                  </tr>
                ) : (
                  purchases.map(
                    (purchase) => (
                      <tr
                        key={
                          purchase._id
                        }
                        className="border-t"
                      >
                        <td className="px-5 py-4 font-bold">
                          {
                            purchase.purchaseNumber
                          }
                        </td>

                        <td className="px-5 py-4">
                          {purchase.supplierInvoiceNumber ||
                            "-"}
                        </td>

                        <td className="px-5 py-4">
                          {formatDate(
                            purchase.purchaseDate
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {
                            purchase.supplierName
                          }
                        </td>

                        <td className="px-5 py-4 text-right font-bold">
                          {formatCurrency(
                            purchase.grandTotal
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-green-700">
                          {formatCurrency(
                            purchase.paidAmount
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-red-600">
                          {formatCurrency(
                            purchase.dueAmount
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <PaymentBadge
                            value={
                              purchase.paymentStatus
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            value={
                              purchase.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/accounts/purchase/${purchase._id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border"
                          >
                            <Eye
                              size={16}
                            />
                          </Link>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t p-4">
            <span className="text-sm text-gray-500">
              Page {page} of{" "}
              {totalPages}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  page <= 1
                }
                onClick={() =>
                  setPage(
                    (value) =>
                      value - 1
                  )
                }
                className="rounded-lg border p-2 disabled:opacity-40"
              >
                <ChevronLeft
                  size={18}
                />
              </button>

              <button
                type="button"
                disabled={
                  page >=
                  totalPages
                }
                onClick={() =>
                  setPage(
                    (value) =>
                      value + 1
                  )
                }
                className="rounded-lg border p-2 disabled:opacity-40"
              >
                <ChevronRight
                  size={18}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto my-4 max-w-[1500px] rounded-2xl bg-white">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="text-xl font-bold">
                  Create Purchase Bill
                </h2>

                <p className="text-sm text-gray-500">
                  Supplier and Input GST accounting will post automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalOpen(
                    false
                  )
                }
                disabled={
                  saving
                }
              >
                <X />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="p-5"
            >
              <div className="grid gap-4 rounded-2xl border bg-gray-50 p-5 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Supplier"
                  required
                >
                  <select
                    value={
                      supplierLedgerId
                    }
                    onChange={(
                      event
                    ) =>
                      handleSupplierChange(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      supplierLoading
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      {supplierLoading
                        ? "Loading..."
                        : "Select Supplier"}
                    </option>

                    {supplierLedgers.map(
                      (supplier) => (
                        <option
                          key={
                            supplier._id
                          }
                          value={
                            supplier._id
                          }
                        >
                          {
                            supplier.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Supplier Invoice No.">
                  <input
                    value={
                      supplierInvoiceNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setSupplierInvoiceNumber(
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
                  label="Purchase Date"
                  required
                >
                  <input
                    type="date"
                    value={
                      purchaseDate
                    }
                    onChange={(
                      event
                    ) =>
                      setPurchaseDate(
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
                      purchaseDate
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

                <Field label="GST Type">
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
                      CGST + SGST
                    </option>

                    <option value="inter_state">
                      IGST
                    </option>

                    <option value="none">
                      No GST
                    </option>
                  </select>
                </Field>

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
                    className={
                      inputClass
                    }
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Supplier Address">
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
                      className={
                        inputClass
                      }
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border">
                <div className="flex items-center justify-between bg-gray-50 p-4">
                  <h3 className="font-bold">
                    Purchase Items
                  </h3>

                  <button
                    type="button"
                    onClick={
                      addItem
                    }
                    className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Plus
                      size={16}
                    />

                    Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1350px]">
                    <thead>
                      <tr>
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
                          Discount %
                        </Head>

                        <Head>
                          GST %
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

                        <Head />
                      </tr>
                    </thead>

                    <tbody>
                      {calculated.rows.map(
                        (item) => (
                          <tr
                            key={
                              item.id
                            }
                            className="border-t"
                          >
                            <td className="p-2">
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
                                className={
                                  smallInputClass
                                }
                              />
                            </td>

                            <td className="p-2">
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

                            <td className="p-2">
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

                            <td className="p-2">
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

                            <td className="p-2">
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

                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
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

                            <td className="p-2">
                              <select
                                value={
                                  gstType ===
                                  "none"
                                    ? "0"
                                    : item.gstRate
                                }
                                disabled={
                                  gstType ===
                                  "none"
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

                            <td className="p-3 text-right">
                              {formatCurrency(
                                item.taxableAmount
                              )}
                            </td>

                            <td className="p-3 text-right">
                              {formatCurrency(
                                item.cgst +
                                  item.sgst +
                                  item.igst
                              )}
                            </td>

                            <td className="p-3 text-right font-bold">
                              {formatCurrency(
                                item.total
                              )}
                            </td>

                            <td className="p-2">
                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    item.id
                                  )
                                }
                                disabled={
                                  items.length <=
                                  1
                                }
                                className="rounded-lg border border-red-200 p-2 text-red-600 disabled:opacity-30"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_430px]">
                <Field label="Notes">
                  <textarea
                    rows={6}
                    value={notes}
                    onChange={(
                      event
                    ) =>
                      setNotes(
                        event.target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

                <div className="rounded-2xl border bg-gray-50 p-5">
                  <SummaryRow
                    label="Subtotal"
                    value={formatCurrency(
                      calculated.subtotal
                    )}
                  />

                  <SummaryRow
                    label="Item Discount"
                    value={formatCurrency(
                      calculated.itemDiscount
                    )}
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
                    label="Taxable"
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
                    <div className="flex justify-between">
                      <strong>
                        Grand Total
                      </strong>

                      <strong className="text-xl">
                        {formatCurrency(
                          calculated.grandTotal
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Field label="Paid Amount">
                      <input
                        type="number"
                        min="0"
                        max={
                          calculated.grandTotal
                        }
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
                      <Field label="Payment Mode">
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
                            Bank
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
                    <div className="flex justify-between text-red-700">
                      <strong>
                        Supplier Due
                      </strong>

                      <strong>
                        {formatCurrency(
                          calculated.dueAmount
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(
                      false
                    )
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border px-5 py-3 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-semibold text-white disabled:opacity-50"
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
                    : "Create Purchase"}
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
   STYLES
========================================================= */

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10";

const smallInputClass =
  "w-full min-w-[110px] rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black";

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
    ReactNode;
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
  children?:
    ReactNode;

  align?:
    "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-bold uppercase text-gray-500 ${
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
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-xs font-bold uppercase text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
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
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">
        {label}
      </span>

      <strong>
        {value}
      </strong>
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
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Paid
      </span>
    );
  }

  if (
    value === "partial"
  ) {
    return (
      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
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
    PurchaseStatus;
}) {
  if (
    value ===
    "cancelled"
  ) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Cancelled
      </span>
    );
  }

  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
      Issued
    </span>
  );
}