"use client";

import {
  type ReactNode,
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

type LedgerInfo = {
  _id: string;

  name: string;

  ledgerType: string;

  currentBalance?: number;

  phone?: string;

  email?: string;

  gstNumber?: string;

  address?: string;
};

type Expense = {
  _id: string;

  expenseNumber: string;

  expenseDate: string;

  category: string;

  description: string;

  vendorName: string;

  vendorLedgerId?:
    | LedgerInfo
    | string
    | null;

  billNumber: string;

  gstNumber: string;

  gstType:
    | "intra_state"
    | "inter_state"
    | "none";

  taxableAmount: number;

  gstRate: number;

  cgst: number;

  sgst: number;

  igst: number;

  totalGst: number;

  totalAmount: number;

  paymentMode:
    | "cash"
    | "bank"
    | "upi"
    | "card"
    | "cheque"
    | "other";

  expenseLedgerId:
    | LedgerInfo
    | string;

  paymentLedgerId:
    | LedgerInfo
    | string;

  notes: string;

  status:
    | "active"
    | "cancelled";

  accountingPosted: boolean;

  createdAt?: string;

  updatedAt?: string;
};

type Transaction = {
  _id: string;

  transactionNumber: string;

  transactionDate: string;

  transactionType: string;

  ledgerId:
    | LedgerInfo
    | string;

  contraLedgerId?:
    | LedgerInfo
    | string
    | null;

  debit: number;

  credit: number;

  amount: number;

  paymentMode: string;

  narration?: string;
};

type ApiResponse = {
  success: boolean;

  message?: string;

  expense?: Expense;

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
    | LedgerInfo
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

export default function ExpenseDetailsPage() {
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
    expense,
    setExpense,
  ] =
    useState<
      Expense | null
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

  const loadExpense =
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
              `/api/admin/accounts/expenses/${id}`,
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
                "Unable to load expense."
            );
          }

          setExpense(
            data.expense ??
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
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load expense."
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
      void loadExpense();
    },
    [loadExpense]
  );

  /* =======================================================
     CANCEL
  ======================================================= */

  async function cancelExpense() {
    if (
      !expense ||
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
          `/api/admin/accounts/expenses/${expense._id}`,
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
            "Unable to cancel expense."
        );
      }

      setConfirmCancel(
        false
      );

      setSuccess(
        data.message ||
          "Expense cancelled successfully."
      );

      await loadExpense();
    } catch (
      cancelError
    ) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Unable to cancel expense."
      );
    } finally {
      setCancelling(
        false
      );
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading &&
    !expense
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin"
          />

          <p className="mt-3 text-sm text-gray-500">
            Loading expense...
          </p>
        </div>
      </main>
    );
  }

  if (!expense) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error ||
            "Expense not found."}
        </div>
      </main>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-gray-50 print:bg-white">
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 print:hidden lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/admin/accounts/expenses"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black"
            >
              <ArrowLeft
                size={17}
              />

              Back to Expenses
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-gray-950">
              {expense.expenseNumber}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void loadExpense()
              }
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
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
                window.print()
              }
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              <Printer
                size={17}
              />

              Print
            </button>

            {expense.status !==
              "cancelled" && (
              <button
                type="button"
                onClick={() =>
                  setConfirmCancel(
                    true
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Ban
                  size={17}
                />

                Cancel Expense
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 print:hidden">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700 print:hidden">
            {success}
          </div>
        )}

        {/* DOCUMENT */}

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm print:border-0 print:shadow-none">
          <div className="border-b p-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                  SilentGEN
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  EXPENSE VOUCHER
                </h2>

                <div className="mt-5 space-y-1 text-sm text-gray-600">
                  <p>
                    Expense No:{" "}
                    <strong className="text-black">
                      {
                        expense.expenseNumber
                      }
                    </strong>
                  </p>

                  <p>
                    Date:{" "}
                    <strong className="text-black">
                      {formatDate(
                        expense.expenseDate
                      )}
                    </strong>
                  </p>

                  <p>
                    Category:{" "}
                    <strong className="text-black">
                      {
                        expense.category
                      }
                    </strong>
                  </p>

                  <p>
                    Bill No:{" "}
                    <strong className="text-black">
                      {expense.billNumber ||
                        "-"}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="md:text-right">
                <StatusBadge
                  value={
                    expense.status
                  }
                />

                <p className="mt-5 text-sm text-gray-500">
                  Payment Mode
                </p>

                <p className="font-bold">
                  {formatText(
                    expense.paymentMode
                  )}
                </p>

                <p className="mt-4 text-sm text-gray-500">
                  GST Type
                </p>

                <p className="font-bold">
                  {expense.gstType ===
                  "intra_state"
                    ? "CGST + SGST"
                    : expense.gstType ===
                      "inter_state"
                    ? "IGST"
                    : "No GST"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-b p-6 sm:p-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Expense Details
              </p>

              <h3 className="mt-2 text-lg font-bold">
                {
                  expense.description
                }
              </h3>

              {expense.vendorName && (
                <p className="mt-3 text-sm text-gray-600">
                  Vendor:{" "}
                  <strong>
                    {
                      expense.vendorName
                    }
                  </strong>
                </p>
              )}

              {expense.gstNumber && (
                <p className="mt-1 text-sm text-gray-600">
                  GSTIN:{" "}
                  <strong>
                    {
                      expense.gstNumber
                    }
                  </strong>
                </p>
              )}
            </div>

            <div className="md:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Accounting Ledgers
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Expense Ledger
              </p>

              <p className="font-bold">
                {getLedgerName(
                  expense.expenseLedgerId
                )}
              </p>

              <p className="mt-3 text-sm text-gray-600">
                Payment Ledger
              </p>

              <p className="font-bold">
                {getLedgerName(
                  expense.paymentLedgerId
                )}
              </p>
            </div>
          </div>

          {/* TOTALS */}

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_420px]">
            <div>
              {expense.notes && (
                <>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Notes
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                    {
                      expense.notes
                    }
                  </p>
                </>
              )}
            </div>

            <div className="rounded-2xl border bg-gray-50 p-5">
              <SummaryRow
                label="Taxable Amount"
                value={formatCurrency(
                  expense.taxableAmount
                )}
              />

              <SummaryRow
                label={`GST Rate`}
                value={`${expense.gstRate}%`}
              />

              <SummaryRow
                label="Input CGST"
                value={formatCurrency(
                  expense.cgst
                )}
              />

              <SummaryRow
                label="Input SGST"
                value={formatCurrency(
                  expense.sgst
                )}
              />

              <SummaryRow
                label="Input IGST"
                value={formatCurrency(
                  expense.igst
                )}
              />

              <SummaryRow
                label="Total GST"
                value={formatCurrency(
                  expense.totalGst
                )}
              />

              <div className="my-3 border-t" />

              <div className="flex items-center justify-between rounded-xl bg-black p-4 text-white">
                <span className="font-semibold">
                  Total Expense
                </span>

                <span className="text-xl font-black">
                  {formatCurrency(
                    expense.totalAmount
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ACCOUNTING ENTRIES */}

        <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm print:hidden">
          <div className="flex items-center gap-3 border-b p-5">
            <ReceiptText
              size={20}
            />

            <div>
              <h2 className="font-bold">
                Accounting Entries
              </h2>

              <p className="text-xs text-gray-500">
                Expense, Input GST and payment postings.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
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
                      colSpan={6}
                      className="py-12 text-center"
                    >
                      <FileText
                        size={28}
                        className="mx-auto text-gray-400"
                      />

                      <p className="mt-3 text-sm text-gray-500">
                        No active accounting entries.
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
                        className="border-t"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">
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

                        <td className="px-5 py-4 text-right font-semibold text-green-700">
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

      {/* CANCEL MODAL */}

      {confirmCancel && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Ban
                size={22}
              />
            </div>

            <h2 className="mt-4 text-xl font-bold">
              Cancel Expense?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Expense{" "}
              <strong className="text-black">
                {
                  expense.expenseNumber
                }
              </strong>{" "}
              will be cancelled and all accounting entries will be reversed.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={() =>
                  setConfirmCancel(
                    false
                  )
                }
                className="flex-1 rounded-xl border px-4 py-3 font-semibold"
              >
                Keep Expense
              </button>

              <button
                type="button"
                disabled={cancelling}
                onClick={() =>
                  void cancelExpense()
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white"
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
                  : "Cancel Expense"}
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
  children?: ReactNode;

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

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({
  value,
}: {
  value:
    Expense["status"];
}) {
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
    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
      Active
    </span>
  );
}