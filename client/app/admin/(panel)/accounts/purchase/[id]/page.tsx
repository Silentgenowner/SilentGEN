"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import {
  ArrowLeft,
  Ban,
  FileText,
  Loader2,
  Printer,
  ReceiptText,
  RefreshCcw,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type PurchaseItem = {
  _id?: string;

  productId?: string | null;

  name: string;

  sku: string;

  hsnCode: string;

  quantity: number;

  rate: number;

  discountPercent: number;

  discountAmount: number;

  taxableAmount: number;

  gstRate: number;

  cgst: number;

  sgst: number;

  igst: number;

  total: number;
};

type SupplierLedger = {
  _id: string;

  name: string;

  phone?: string;

  email?: string;

  gstNumber?: string;

  address?: string;

  currentBalance?: number;

  ledgerType?: string;
};

type Purchase = {
  _id: string;

  purchaseNumber: string;

  supplierInvoiceNumber: string;

  purchaseDate: string;

  dueDate?: string | null;

  supplierLedgerId:
    | SupplierLedger
    | string;

  supplierName: string;

  supplierPhone: string;

  supplierEmail: string;

  supplierGstNumber: string;

  billingAddress: string;

  placeOfSupply: string;

  gstType:
    | "intra_state"
    | "inter_state"
    | "none";

  items: PurchaseItem[];

  subtotal: number;

  itemDiscount: number;

  additionalDiscount: number;

  taxableAmount: number;

  cgst: number;

  sgst: number;

  igst: number;

  totalGst: number;

  roundOff: number;

  grandTotal: number;

  paidAmount: number;

  dueAmount: number;

  paymentStatus:
    | "unpaid"
    | "partial"
    | "paid";

  status:
    | "draft"
    | "issued"
    | "cancelled";

  notes: string;

  accountingPosted: boolean;

  createdAt?: string;

  updatedAt?: string;
};

type TransactionLedger = {
  _id: string;

  name: string;

  ledgerType: string;
};

type Transaction = {
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

  paymentMode: string;

  referenceNumber?: string;

  narration?: string;

  gstAmount: number;

  cgst: number;

  sgst: number;

  igst: number;
};

type ApiResponse = {
  success: boolean;

  message?: string;

  purchase?: Purchase;

  transactions?: Transaction[];
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
    Number(
      value || 0
    )
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

function formatText(
  value: string
) {
  return String(
    value || "-"
  )
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
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
): ApiResponse | null {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(
      text
    ) as ApiResponse;
  } catch {
    return null;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function PurchaseDetailsPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const id =
    String(
      params?.id ??
        ""
    );

  const [
    purchase,
    setPurchase,
  ] =
    useState<
      Purchase | null
    >(null);

  const [
    transactions,
    setTransactions,
  ] =
    useState<
      Transaction[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    cancelling,
    setCancelling,
  ] =
    useState(false);

  const [
    confirmCancel,
    setConfirmCancel,
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
     LOAD
  ======================================================= */

  const loadPurchase =
    useCallback(
      async () => {
        if (!id) {
          return;
        }

        try {
          setLoading(
            true
          );

          setError("");

          const response =
            await fetch(
              `/api/admin/accounts/purchase/${id}`,
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
                "Unable to load purchase bill."
            );
          }

          setPurchase(
            data.purchase ??
              null
          );

          setTransactions(
            Array.isArray(
              data.transactions
            )
              ? data.transactions
              : []
          );
        } catch (
          loadError
        ) {
          console.error(
            "PURCHASE_DETAILS_LOAD_ERROR:",
            loadError
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load purchase bill."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [id]
    );

  useEffect(
    () => {
      void loadPurchase();
    },
    [loadPurchase]
  );

  /* =======================================================
     CANCEL
  ======================================================= */

  async function cancelPurchase() {
    if (
      !purchase ||
      cancelling
    ) {
      return;
    }

    try {
      setCancelling(
        true
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/accounts/purchase/${purchase._id}`,
          {
            method:
              "DELETE",

            credentials:
              "include",
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
            "Unable to cancel purchase."
        );
      }

      setConfirmCancel(
        false
      );

      setSuccess(
        data.message ||
          "Purchase bill cancelled successfully."
      );

      await loadPurchase();
    } catch (
      cancelError
    ) {
      console.error(
        "CANCEL_PURCHASE_PAGE_ERROR:",
        cancelError
      );

      setError(
        cancelError instanceof
          Error
          ? cancelError.message
          : "Unable to cancel purchase."
      );
    } finally {
      setCancelling(
        false
      );
    }
  }

  /* =======================================================
     PRINT
  ======================================================= */

  function printPurchase() {
    window.print();
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading &&
    !purchase
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-gray-600"
          />

          <p className="mt-3 text-sm text-gray-500">
            Loading purchase bill...
          </p>
        </div>
      </main>
    );
  }

  if (!purchase) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error ||
            "Purchase bill not found."}
        </div>
      </main>
    );
  }

  /* =======================================================
     SUPPLIER
  ======================================================= */

  const supplier =
    typeof purchase.supplierLedgerId ===
    "object"
      ? purchase.supplierLedgerId
      : null;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-gray-50 print:bg-white">
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 print:hidden lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/admin/accounts/purchase"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black"
            >
              <ArrowLeft
                size={17}
              />

              Back to Purchase
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-gray-950">
              {purchase.purchaseNumber}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void loadPurchase()
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
              onClick={
                printPurchase
              }
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <Printer
                size={17}
              />

              Print
            </button>

            {purchase.status !==
              "cancelled" && (
              <button
                type="button"
                onClick={() =>
                  setConfirmCancel(
                    true
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                <Ban
                  size={17}
                />

                Cancel Purchase
              </button>
            )}
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 print:hidden">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 print:hidden">
            {success}
          </div>
        )}

        {/* PURCHASE DOCUMENT */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          {/* TOP */}

          <div className="border-b border-gray-200 p-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                  SilentGEN
                </p>

                <h2 className="mt-2 text-3xl font-black text-gray-950">
                  PURCHASE BILL
                </h2>

                <div className="mt-5 space-y-1 text-sm text-gray-600">
                  <p>
                    Purchase No:{" "}
                    <strong className="text-gray-950">
                      {
                        purchase.purchaseNumber
                      }
                    </strong>
                  </p>

                  <p>
                    Supplier Invoice:{" "}
                    <strong className="text-gray-950">
                      {purchase.supplierInvoiceNumber ||
                        "-"}
                    </strong>
                  </p>

                  <p>
                    Purchase Date:{" "}
                    <strong className="text-gray-950">
                      {formatDate(
                        purchase.purchaseDate
                      )}
                    </strong>
                  </p>

                  <p>
                    Due Date:{" "}
                    <strong className="text-gray-950">
                      {formatDate(
                        purchase.dueDate
                      )}
                    </strong>
                  </p>

                  <p>
                    Place of Supply:{" "}
                    <strong className="text-gray-950">
                      {purchase.placeOfSupply ||
                        "-"}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="md:text-right">
                <StatusBadge
                  value={
                    purchase.status
                  }
                />

                <div className="mt-4">
                  <PaymentBadge
                    value={
                      purchase.paymentStatus
                    }
                  />
                </div>

                <p className="mt-5 text-sm text-gray-500">
                  GST Type
                </p>

                <p className="font-bold text-gray-900">
                  {purchase.gstType ===
                  "intra_state"
                    ? "Intra State - Input CGST + SGST"
                    : purchase.gstType ===
                      "inter_state"
                    ? "Inter State - Input IGST"
                    : "No GST"}
                </p>
              </div>
            </div>
          </div>

          {/* SUPPLIER */}

          <div className="grid gap-6 border-b border-gray-200 p-6 sm:p-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Supplier
              </p>

              <h3 className="mt-2 text-lg font-bold text-gray-950">
                {purchase.supplierName}
              </h3>

              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {purchase.supplierPhone && (
                  <p>
                    Phone:{" "}
                    {
                      purchase.supplierPhone
                    }
                  </p>
                )}

                {purchase.supplierEmail && (
                  <p>
                    Email:{" "}
                    {
                      purchase.supplierEmail
                    }
                  </p>
                )}

                {purchase.supplierGstNumber && (
                  <p>
                    GSTIN:{" "}
                    <strong>
                      {
                        purchase.supplierGstNumber
                      }
                    </strong>
                  </p>
                )}

                <p className="max-w-xl whitespace-pre-line">
                  {purchase.billingAddress ||
                    supplier?.address ||
                    "-"}
                </p>
              </div>
            </div>

            <div className="md:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Supplier Ledger Balance
              </p>

              <p className="mt-2 text-xl font-bold text-gray-950">
                {supplier
                  ? formatCurrency(
                      Math.abs(
                        Number(
                          supplier.currentBalance ??
                            0
                        )
                      )
                    )
                  : "-"}
              </p>

              {supplier &&
                Number(
                  supplier.currentBalance ??
                    0
                ) !== 0 && (
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    {Number(
                      supplier.currentBalance ??
                        0
                    ) < 0
                      ? "Credit / Payable"
                      : "Debit / Advance"}
                  </p>
                )}
            </div>
          </div>

          {/* ITEMS */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <Head>
                    #
                  </Head>

                  <Head>
                    Item
                  </Head>

                  <Head>
                    HSN
                  </Head>

                  <Head align="right">
                    Qty
                  </Head>

                  <Head align="right">
                    Rate
                  </Head>

                  <Head align="right">
                    Disc
                  </Head>

                  <Head align="right">
                    Taxable
                  </Head>

                  <Head align="right">
                    GST %
                  </Head>

                  <Head align="right">
                    Input GST
                  </Head>

                  <Head align="right">
                    Total
                  </Head>
                </tr>
              </thead>

              <tbody>
                {purchase.items.map(
                  (
                    item,
                    index
                  ) => (
                    <tr
                      key={
                        item._id ||
                        `${item.name}-${index}`
                      }
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>

                        {item.sku && (
                          <p className="mt-1 text-xs text-gray-400">
                            SKU:{" "}
                            {
                              item.sku
                            }
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {item.hsnCode ||
                          "-"}
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        {
                          item.quantity
                        }
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        {formatCurrency(
                          item.rate
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        {item.discountPercent >
                        0
                          ? `${item.discountPercent}%`
                          : "-"}
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        {formatCurrency(
                          item.taxableAmount
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        {
                          item.gstRate
                        }
                        %
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        {formatCurrency(
                          Number(
                            item.cgst ||
                              0
                          ) +
                            Number(
                              item.sgst ||
                                0
                            ) +
                            Number(
                              item.igst ||
                                0
                            )
                        )}
                      </td>

                      <td className="px-5 py-4 text-right font-bold">
                        {formatCurrency(
                          item.total
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* TOTALS */}

          <div className="grid gap-8 border-t border-gray-200 p-6 sm:p-8 lg:grid-cols-[1fr_420px]">
            <div>
              {purchase.notes && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Notes
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                    {purchase.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(
                  purchase.subtotal
                )}
              />

              <SummaryRow
                label="Item Discount"
                value={`- ${formatCurrency(
                  purchase.itemDiscount
                )}`}
              />

              <SummaryRow
                label="Additional Discount"
                value={`- ${formatCurrency(
                  purchase.additionalDiscount
                )}`}
              />

              <div className="my-3 border-t border-gray-200" />

              <SummaryRow
                label="Taxable Amount"
                value={formatCurrency(
                  purchase.taxableAmount
                )}
              />

              <SummaryRow
                label="Input CGST"
                value={formatCurrency(
                  purchase.cgst
                )}
              />

              <SummaryRow
                label="Input SGST"
                value={formatCurrency(
                  purchase.sgst
                )}
              />

              <SummaryRow
                label="Input IGST"
                value={formatCurrency(
                  purchase.igst
                )}
              />

              <SummaryRow
                label="Total Input GST"
                value={formatCurrency(
                  purchase.totalGst
                )}
              />

              <SummaryRow
                label="Round Off"
                value={formatCurrency(
                  purchase.roundOff
                )}
              />

              <div className="my-3 border-t border-gray-300" />

              <div className="flex items-center justify-between rounded-xl bg-black p-4 text-white">
                <span className="font-semibold">
                  Grand Total
                </span>

                <span className="text-xl font-black">
                  {formatCurrency(
                    purchase.grandTotal
                  )}
                </span>
              </div>

              <div className="mt-4">
                <SummaryRow
                  label="Paid"
                  value={formatCurrency(
                    purchase.paidAmount
                  )}
                />

                <SummaryRow
                  label="Supplier Due"
                  value={formatCurrency(
                    purchase.dueAmount
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ACCOUNTING ENTRIES */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm print:hidden">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <ReceiptText
                size={20}
              />

              <div>
                <h2 className="font-bold text-gray-900">
                  Accounting Entries
                </h2>

                <p className="text-xs text-gray-500">
                  Purchase, Input GST,
                  supplier and payment postings.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  <Head>
                    Transaction
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

                  <Head>
                    Payment
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
                {transactions.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center"
                    >
                      <FileText
                        size={28}
                        className="mx-auto text-gray-400"
                      />

                      <p className="mt-3 text-sm text-gray-500">
                        No active accounting
                        entries.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map(
                    (
                      transaction
                    ) => (
                      <tr
                        key={
                          transaction._id
                        }
                        className="border-t border-gray-100"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            {
                              transaction.transactionNumber
                            }
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(
                              transaction.transactionDate
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {formatText(
                            transaction.transactionType
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold">
                          {getLedgerName(
                            transaction.ledgerId
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {getLedgerName(
                            transaction.contraLedgerId
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatText(
                            transaction.paymentMode
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                          {transaction.debit >
                          0
                            ? formatCurrency(
                                transaction.debit
                              )
                            : "-"}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-red-600">
                          {transaction.credit >
                          0
                            ? formatCurrency(
                                transaction.credit
                              )
                            : "-"}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* CANCEL CONFIRMATION */}

      {confirmCancel && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Ban
                size={22}
              />
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-950">
              Cancel Purchase?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Purchase{" "}
              <strong className="text-gray-900">
                {
                  purchase.purchaseNumber
                }
              </strong>{" "}
              will be cancelled. Purchase,
              Input GST, supplier and payment
              ledger entries will be reversed.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={
                  cancelling
                }
                onClick={() =>
                  setConfirmCancel(
                    false
                  )
                }
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Purchase
              </button>

              <button
                type="button"
                disabled={
                  cancelling
                }
                onClick={() =>
                  void cancelPurchase()
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelling ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Ban
                    size={17}
                  />
                )}

                {cancelling
                  ? "Cancelling..."
                  : "Cancel Purchase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   UI
========================================================= */

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
    Purchase["paymentStatus"];
}) {
  if (
    value === "paid"
  ) {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
        Paid
      </span>
    );
  }

  if (
    value === "partial"
  ) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
        Partial
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
      Unpaid
    </span>
  );
}

function StatusBadge({
  value,
}: {
  value:
    Purchase["status"];
}) {
  if (
    value === "issued"
  ) {
    return (
      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
        Issued
      </span>
    );
  }

  if (
    value === "cancelled"
  ) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
      Draft
    </span>
  );
}