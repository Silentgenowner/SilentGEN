"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Loader2,
  RefreshCcw,
  ReceiptText,
  WalletCards,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type LedgerType =
  | "customer"
  | "supplier"
  | "sales"
  | "purchase"
  | "expense"
  | "gst_input"
  | "gst_output"
  | "cash"
  | "bank"
  | "other";

type BalanceType =
  | "debit"
  | "credit";

type Ledger = {
  _id:
    string;

  name:
    string;

  ledgerType:
    LedgerType;

  phone?:
    string;

  email?:
    string;

  gstNumber?:
    string;

  address?:
    string;

  openingBalance:
    number;

  balanceType:
    BalanceType;

  currentBalance:
    number;

  isActive:
    boolean;
};

type Transaction = {
  _id:
    string;

  transactionNumber:
    string;

  transactionDate:
    string;

  transactionType:
    string;

  debit:
    number;

  credit:
    number;

  amount:
    number;

  paymentMode:
    string;

  referenceType:
    string;

  referenceNumber?:
    string;

  narration?:
    string;

  gstAmount:
    number;

  cgst:
    number;

  sgst:
    number;

  igst:
    number;

  runningBalance:
    number;
};

type Summary = {
  openingBalance:
    number;

  totalDebit:
    number;

  totalCredit:
    number;

  totalGST:
    number;

  totalCGST:
    number;

  totalSGST:
    number;

  totalIGST:
    number;

  closingBalance:
    number;

  currentBalance:
    number;
};

type Pagination = {
  page:
    number;

  limit:
    number;

  totalTransactions:
    number;

  totalPages:
    number;
};

type ApiResponse = {
  success:
    boolean;

  message?:
    string;

  ledger?:
    Ledger;

  summary?:
    Summary;

  transactions?:
    Transaction[];

  pagination?:
    Pagination;
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function formatCurrency(
  value:
    number
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
  value:
    string
) {
  const date =
    new Date(
      value
    );

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

function formatText(
  value:
    string
) {
  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        letter
      ) =>
        letter.toUpperCase()
    );
}

function balanceText(
  balance:
    number
) {
  if (
    balance >
    0
  ) {
    return `${formatCurrency(
      balance
    )} Dr`;
  }

  if (
    balance <
    0
  ) {
    return `${formatCurrency(
      Math.abs(
        balance
      )
    )} Cr`;
  }

  return formatCurrency(
    0
  );
}

function balanceClass(
  balance:
    number
) {
  if (
    balance >
    0
  ) {
    return "text-emerald-700";
  }

  if (
    balance <
    0
  ) {
    return "text-red-600";
  }

  return "text-gray-700";
}

function readJson(
  text:
    string
): ApiResponse | null {
  if (
    !text.trim()
  ) {
    return null;
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function LedgerStatementPage() {
  const params =
    useParams<{
      id:
        string;
    }>();

  const id =
    String(
      params?.id ??
        ""
    );

  const [
    ledger,
    setLedger,
  ] =
    useState<
      Ledger | null
    >(
      null
    );

  const [
    transactions,
    setTransactions,
  ] =
    useState<
      Transaction[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<
      Summary
    >({
      openingBalance:
        0,

      totalDebit:
        0,

      totalCredit:
        0,

      totalGST:
        0,

      totalCGST:
        0,

      totalSGST:
        0,

      totalIGST:
        0,

      closingBalance:
        0,

      currentBalance:
        0,
    });

  const [
    pagination,
    setPagination,
  ] =
    useState<
      Pagination
    >({
      page:
        1,

      limit:
        30,

      totalTransactions:
        0,

      totalPages:
        1,
    });

  const [
    fromDate,
    setFromDate,
  ] =
    useState(
      ""
    );

  const [
    toDate,
    setToDate,
  ] =
    useState(
      ""
    );

  const [
    appliedFrom,
    setAppliedFrom,
  ] =
    useState(
      ""
    );

  const [
    appliedTo,
    setAppliedTo,
  ] =
    useState(
      ""
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  /*
  |--------------------------------------------------------------------------
  | LOAD
  |--------------------------------------------------------------------------
  */

  const loadStatement =
    useCallback(
      async () => {
        if (!id) {
          return;
        }

        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const query =
            new URLSearchParams();

          query.set(
            "page",
            String(
              pagination.page
            )
          );

          query.set(
            "limit",
            String(
              pagination.limit
            )
          );

          if (
            appliedFrom
          ) {
            query.set(
              "from",
              appliedFrom
            );
          }

          if (
            appliedTo
          ) {
            query.set(
              "to",
              appliedTo
            );
          }

          const response =
            await fetch(
              `/api/admin/accounts/ledger/${id}/statement?${query.toString()}`,
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
            readJson(
              text
            );

          if (
            !response.ok ||
            !data?.success
          ) {
            throw new Error(
              data?.message ||
                "Unable to load ledger statement."
            );
          }

          setLedger(
            data.ledger ??
              null
          );

          setTransactions(
            Array.isArray(
              data.transactions
            )
              ? data.transactions
              : []
          );

          if (
            data.summary
          ) {
            setSummary(
              data.summary
            );
          }

          if (
            data.pagination
          ) {
            setPagination(
              data.pagination
            );
          }
        } catch (
          loadError
        ) {
          console.error(
            "LEDGER_STATEMENT_LOAD_ERROR:",
            loadError
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load statement."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        id,
        pagination.page,
        pagination.limit,
        appliedFrom,
        appliedTo,
      ]
    );

  useEffect(
    () => {
      void loadStatement();
    },
    [
      loadStatement,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */

  function applyDateFilter() {
    if (
      fromDate &&
      toDate &&
      fromDate >
        toDate
    ) {
      setError(
        "From date cannot be after To date."
      );

      return;
    }

    setError(
      ""
    );

    setPagination(
      (
        current
      ) => ({
        ...current,

        page:
          1,
      })
    );

    setAppliedFrom(
      fromDate
    );

    setAppliedTo(
      toDate
    );
  }

  function clearDateFilter() {
    setFromDate(
      ""
    );

    setToDate(
      ""
    );

    setAppliedFrom(
      ""
    );

    setAppliedTo(
      ""
    );

    setPagination(
      (
        current
      ) => ({
        ...current,

        page:
          1,
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DISPLAY
  |--------------------------------------------------------------------------
  */

  const firstItem =
    pagination.totalTransactions >
    0
      ? (pagination.page -
          1) *
          pagination.limit +
        1
      : 0;

  const lastItem =
    Math.min(
      pagination.page *
        pagination.limit,
      pagination.totalTransactions
    );

  const filtered =
    useMemo(
      () =>
        Boolean(
          appliedFrom ||
            appliedTo
        ),
      [
        appliedFrom,
        appliedTo,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* HEADER */}

        <div className="mb-6">
          <Link
            href="/admin/accounts/ledger"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-black"
          >
            <ArrowLeft
              size={17}
            />

            Back to Ledger
          </Link>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Accounts / Ledger
              </p>

              <h1 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">
                {ledger?.name ||
                  "Ledger Statement"}
              </h1>

              {ledger && (
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                  <span>
                    Type:{" "}
                    <strong className="text-gray-700">
                      {formatText(
                        ledger.ledgerType
                      )}
                    </strong>
                  </span>

                  {ledger.phone && (
                    <span>
                      Phone:{" "}
                      {
                        ledger.phone
                      }
                    </span>
                  )}

                  {ledger.gstNumber && (
                    <span>
                      GSTIN:{" "}
                      {
                        ledger.gstNumber
                      }
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                void loadStatement()
              }
              disabled={
                loading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
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
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title={
              filtered
                ? "Opening Balance"
                : "Opening Balance"
            }
            value={balanceText(
              summary.openingBalance
            )}
            icon={
              <WalletCards
                size={21}
              />
            }
          />

          <SummaryCard
            title="Total Debit"
            value={formatCurrency(
              summary.totalDebit
            )}
            icon={
              <CircleDollarSign
                size={21}
              />
            }
          />

          <SummaryCard
            title="Total Credit"
            value={formatCurrency(
              summary.totalCredit
            )}
            icon={
              <CircleDollarSign
                size={21}
              />
            }
          />

          <SummaryCard
            title="Closing Balance"
            value={balanceText(
              summary.closingBalance
            )}
            icon={
              <ReceiptText
                size={21}
              />
            }
          />
        </div>

        {/* GST SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SmallSummary
            label="GST Total"
            value={formatCurrency(
              summary.totalGST
            )}
          />

          <SmallSummary
            label="CGST"
            value={formatCurrency(
              summary.totalCGST
            )}
          />

          <SmallSummary
            label="SGST"
            value={formatCurrency(
              summary.totalSGST
            )}
          />

          <SmallSummary
            label="IGST"
            value={formatCurrency(
              summary.totalIGST
            )}
          />
        </div>

        {/* DATE FILTER */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                From Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="date"
                  value={
                    fromDate
                  }
                  onChange={(
                    event
                  ) =>
                    setFromDate(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                To Date
              </label>

              <input
                type="date"
                value={
                  toDate
                }
                onChange={(
                  event
                ) =>
                  setToDate(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </div>

            <button
              type="button"
              onClick={
                applyDateFilter
              }
              className="self-end rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={
                clearDateFilter
              }
              disabled={
                !fromDate &&
                !toDate &&
                !filtered
              }
              className="self-end rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </section>

        {/* TABLE */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <Head>
                    Date
                  </Head>

                  <Head>
                    Transaction
                  </Head>

                  <Head>
                    Type
                  </Head>

                  <Head>
                    Reference
                  </Head>

                  <Head>
                    Narration
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

                  <Head align="right">
                    GST
                  </Head>

                  <Head align="right">
                    Balance
                  </Head>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={
                        10
                      }
                      className="py-16 text-center"
                    >
                      <Loader2
                        size={28}
                        className="mx-auto animate-spin text-gray-500"
                      />

                      <p className="mt-3 text-sm text-gray-500">
                        Loading
                        statement...
                      </p>
                    </td>
                  </tr>
                ) : transactions.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={
                        10
                      }
                      className="py-16 text-center"
                    >
                      <ReceiptText
                        size={30}
                        className="mx-auto text-gray-400"
                      />

                      <p className="mt-3 font-semibold text-gray-800">
                        No transactions
                        found
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
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDate(
                            transaction.transactionDate
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            {
                              transaction.transactionNumber
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            {formatText(
                              transaction.transactionType
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {transaction.referenceNumber ||
                            formatText(
                              transaction.referenceType
                            )}
                        </td>

                        <td className="max-w-[260px] px-5 py-4 text-sm text-gray-600">
                          <p className="truncate">
                            {transaction.narration ||
                              "-"}
                          </p>
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

                        <td className="px-5 py-4 text-right text-sm text-gray-600">
                          {transaction.gstAmount >
                          0
                            ? formatCurrency(
                                transaction.gstAmount
                              )
                            : "-"}
                        </td>

                        <td
                          className={`px-5 py-4 text-right font-bold ${balanceClass(
                            transaction.runningBalance
                          )}`}
                        >
                          {balanceText(
                            transaction.runningBalance
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <strong className="text-gray-800">
                {firstItem}
              </strong>{" "}
              to{" "}
              <strong className="text-gray-800">
                {lastItem}
              </strong>{" "}
              of{" "}
              <strong className="text-gray-800">
                {
                  pagination.totalTransactions
                }
              </strong>
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  loading ||
                  pagination.page <=
                    1
                }
                onClick={() =>
                  setPagination(
                    (
                      current
                    ) => ({
                      ...current,

                      page:
                        Math.max(
                          1,
                          current.page -
                            1
                        ),
                    })
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft
                  size={17}
                />

                Previous
              </button>

              <div className="flex min-w-11 items-center justify-center rounded-xl bg-black px-3 text-sm font-bold text-white">
                {
                  pagination.page
                }
              </div>

              <button
                type="button"
                disabled={
                  loading ||
                  pagination.page >=
                    pagination.totalPages
                }
                onClick={() =>
                  setPagination(
                    (
                      current
                    ) => ({
                      ...current,

                      page:
                        Math.min(
                          current.totalPages,
                          current.page +
                            1
                        ),
                    })
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
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
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENTS
|--------------------------------------------------------------------------
*/

function SummaryCard({
  title,
  value,
  icon,
}: {
  title:
    string;

  value:
    string;

  icon:
    React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold text-gray-950 sm:text-2xl">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SmallSummary({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function Head({
  children,
  align =
    "left",
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