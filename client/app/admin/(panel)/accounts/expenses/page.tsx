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
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type Expense = {
  _id: string;

  expenseNumber: string;

  expenseDate: string;

  category: string;

  description: string;

  vendorName?: string;

  billNumber?: string;

  gstNumber?: string;

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

  status:
    | "active"
    | "cancelled";
};

type ExpensesResponse = {
  success: boolean;

  message?: string;

  expenses?: Expense[];

  categories?: string[];

  summary?: {
    taxableAmount?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    totalGst?: number;
    totalAmount?: number;
  };

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CreateExpenseResponse = {
  success: boolean;
  message?: string;
  expense?: Expense;
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
  | "cheque"
  | "other";

/* =========================================================
   HELPERS
========================================================= */

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

export default function ExpensesPage() {
  const [
    expenses,
    setExpenses,
  ] =
    useState<
      Expense[]
    >([]);

  const [
    categories,
    setCategories,
  ] =
    useState<
      string[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

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
    categoryFilter,
    setCategoryFilter,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("");

  const [
    paymentFilter,
    setPaymentFilter,
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
    totalExpenses,
    setTotalExpenses,
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
      taxableAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalGst: 0,
      totalAmount: 0,
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
    expenseDate,
    setExpenseDate,
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
    category,
    setCategory,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    vendorName,
    setVendorName,
  ] =
    useState("");

  const [
    billNumber,
    setBillNumber,
  ] =
    useState("");

  const [
    gstNumber,
    setGstNumber,
  ] =
    useState("");

  const [
    gstType,
    setGstType,
  ] =
    useState<GstType>(
      "none"
    );

  const [
    taxableAmount,
    setTaxableAmount,
  ] =
    useState("0");

  const [
    gstRate,
    setGstRate,
  ] =
    useState("18");

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
     LOAD EXPENSES
  ======================================================= */

  const loadExpenses =
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
            categoryFilter
          ) {
            params.set(
              "category",
              categoryFilter
            );
          }

          if (
            statusFilter
          ) {
            params.set(
              "status",
              statusFilter
            );
          }

          if (
            paymentFilter
          ) {
            params.set(
              "paymentMode",
              paymentFilter
            );
          }

          const response =
            await fetch(
              `/api/admin/accounts/expenses?${params.toString()}`,
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
              ExpensesResponse
            >(text);

          if (
            !response.ok ||
            !data?.success
          ) {
            throw new Error(
              data?.message ||
                `Expense API failed (${response.status}).`
            );
          }

          setExpenses(
            Array.isArray(
              data.expenses
            )
              ? data.expenses
              : []
          );

          setCategories(
            Array.isArray(
              data.categories
            )
              ? data.categories
              : []
          );

          setSummary({
            taxableAmount:
              Number(
                data.summary
                  ?.taxableAmount ??
                  0
              ),

            cgst:
              Number(
                data.summary
                  ?.cgst ??
                  0
              ),

            sgst:
              Number(
                data.summary
                  ?.sgst ??
                  0
              ),

            igst:
              Number(
                data.summary
                  ?.igst ??
                  0
              ),

            totalGst:
              Number(
                data.summary
                  ?.totalGst ??
                  0
              ),

            totalAmount:
              Number(
                data.summary
                  ?.totalAmount ??
                  0
              ),
          });

          setTotalPages(
            data.pagination
              ?.totalPages ??
              1
          );

          setTotalExpenses(
            data.pagination
              ?.total ??
              0
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load expenses."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        page,
        debouncedSearch,
        categoryFilter,
        statusFilter,
        paymentFilter,
      ]
    );

  useEffect(
    () => {
      void loadExpenses();
    },
    [loadExpenses]
  );

  /* =======================================================
     CALCULATION
  ======================================================= */

  const calculated =
    useMemo(
      () => {
        const taxable =
          Math.max(
            0,
            Number(
              taxableAmount ||
                0
            )
          );

        const rate =
          gstType ===
          "none"
            ? 0
            : Math.max(
                0,
                Number(
                  gstRate ||
                    0
                )
              );

        let cgst =
          0;

        let sgst =
          0;

        let igst =
          0;

        if (
          gstType ===
          "intra_state"
        ) {
          cgst =
            roundMoney(
              taxable *
                rate /
                200
            );

          sgst =
            roundMoney(
              taxable *
                rate /
                200
            );
        }

        if (
          gstType ===
          "inter_state"
        ) {
          igst =
            roundMoney(
              taxable *
                rate /
                100
            );
        }

        const totalGst =
          roundMoney(
            cgst +
              sgst +
              igst
          );

        const total =
          roundMoney(
            taxable +
              totalGst
          );

        return {
          taxable:
            roundMoney(
              taxable
            ),

          rate,

          cgst,

          sgst,

          igst,

          totalGst,

          total,
        };
      },
      [
        taxableAmount,
        gstRate,
        gstType,
      ]
    );

  /* =======================================================
     OPEN MODAL
  ======================================================= */

  function openCreateModal() {
    setError("");
    setSuccess("");

    setExpenseDate(
      new Date()
        .toISOString()
        .slice(
          0,
          10
        )
    );

    setCategory("");
    setDescription("");
    setVendorName("");
    setBillNumber("");
    setGstNumber("");
    setGstType("none");
    setTaxableAmount("0");
    setGstRate("18");
    setPaymentMode("cash");
    setNotes("");

    setModalOpen(true);
  }

  /* =======================================================
     SUBMIT
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

    if (
      !category.trim()
    ) {
      setError(
        "Expense category is required."
      );

      return;
    }

    if (
      !description.trim()
    ) {
      setError(
        "Expense description is required."
      );

      return;
    }

    if (
      calculated.taxable <=
      0
    ) {
      setError(
        "Amount must be greater than zero."
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/admin/accounts/expenses",
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
                expenseDate,

                category:
                  category.trim(),

                description:
                  description.trim(),

                vendorName:
                  vendorName.trim(),

                billNumber:
                  billNumber.trim(),

                gstNumber:
                  gstNumber.trim(),

                gstType,

                taxableAmount:
                  calculated.taxable,

                gstRate:
                  calculated.rate,

                paymentMode,

                notes:
                  notes.trim(),
              }),
          }
        );

      const text =
        await response.text();

      const data =
        readJson<
          CreateExpenseResponse
        >(text);

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            `Expense create failed (${response.status}).`
        );
      }

      setModalOpen(false);

      setSuccess(
        `Expense ${
          data.expense
            ?.expenseNumber ??
          ""
        } created successfully.`
      );

      setPage(1);

      await loadExpenses();
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to create expense."
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
              Expenses
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage business expenses,
              Input GST and cash/bank payments.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                void loadExpenses()
              }
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
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
                openCreateModal
              }
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <Plus
                size={18}
              />

              Add Expense
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

        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Expenses"
            value={String(
              totalExpenses
            )}
          />

          <SummaryCard
            label="Taxable Expense"
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
            label="CGST + SGST"
            value={formatCurrency(
              summary.cgst +
                summary.sgst
            )}
          />

          <SummaryCard
            label="Total Expense"
            value={formatCurrency(
              summary.totalAmount
            )}
          />
        </div>

        {/* FILTERS */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[1fr_220px_200px_200px]">
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
                placeholder="Search expense, vendor, bill number..."
                className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-black"
              />
            </div>

            <select
              value={
                categoryFilter
              }
              onChange={(
                event
              ) => {
                setCategoryFilter(
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
                All Categories
              </option>

              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            <select
              value={
                paymentFilter
              }
              onChange={(
                event
              ) => {
                setPaymentFilter(
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
                All Payments
              </option>

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

              <option value="other">
                Other
              </option>
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) => {
                setStatusFilter(
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

              <option value="active">
                Active
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
            <table className="w-full min-w-[1300px]">
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
                    Description
                  </Head>

                  <Head>
                    Vendor
                  </Head>

                  <Head>
                    Bill
                  </Head>

                  <Head>
                    GST
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
                      colSpan={13}
                      className="py-16 text-center"
                    >
                      <Loader2
                        size={28}
                        className="mx-auto animate-spin"
                      />
                    </td>
                  </tr>
                ) : expenses.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="py-16 text-center"
                    >
                      <FileText
                        size={32}
                        className="mx-auto text-gray-400"
                      />

                      <p className="mt-3 text-sm text-gray-500">
                        No expenses found.
                      </p>
                    </td>
                  </tr>
                ) : (
                  expenses.map(
                    (expense) => (
                      <tr
                        key={
                          expense._id
                        }
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 font-bold">
                          {
                            expense.expenseNumber
                          }
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {formatDate(
                            expense.expenseDate
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {
                            expense.category
                          }
                        </td>

                        <td className="max-w-[260px] truncate px-5 py-4 text-sm text-gray-600">
                          {
                            expense.description
                          }
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {expense.vendorName ||
                            "-"}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {expense.billNumber ||
                            "-"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                            {expense.gstType ===
                            "intra_state"
                              ? "CGST + SGST"
                              : expense.gstType ===
                                "inter_state"
                              ? "IGST"
                              : "No GST"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {formatCurrency(
                            expense.taxableAmount
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {formatCurrency(
                            expense.totalGst
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-bold">
                          {formatCurrency(
                            expense.totalAmount
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <PaymentBadge
                            value={
                              expense.paymentMode
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            value={
                              expense.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/accounts/expenses/${expense._id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100"
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

          <div className="flex items-center justify-between border-t border-gray-200 p-4">
            <span className="text-sm text-gray-500">
              Page {page} of{" "}
              {totalPages}
            </span>

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
                        current - 1
                      )
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
                    totalPages ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
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
        </section>
      </div>

      {/* CREATE MODAL */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-xl font-bold">
                  Add Expense
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Expense and GST accounting entries will post automatically.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setModalOpen(
                    false
                  )
                }
                className="rounded-xl border p-2"
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
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Expense Date"
                  required
                >
                  <input
                    type="date"
                    value={
                      expenseDate
                    }
                    onChange={(
                      event
                    ) =>
                      setExpenseDate(
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
                  label="Category"
                  required
                >
                  <input
                    list="expense-categories"
                    value={category}
                    onChange={(
                      event
                    ) =>
                      setCategory(
                        event.target
                          .value
                      )
                    }
                    placeholder="Rent, Electricity, Internet..."
                    className={
                      inputClass
                    }
                  />

                  <datalist id="expense-categories">
                    <option value="Office Rent" />
                    <option value="Electricity" />
                    <option value="Internet" />
                    <option value="Marketing" />
                    <option value="Packaging" />
                    <option value="Transport" />
                    <option value="Professional Fees" />
                    <option value="Software" />
                    <option value="Salary" />
                    <option value="Maintenance" />

                    {categories.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        />
                      )
                    )}
                  </datalist>
                </Field>

                <div className="md:col-span-2">
                  <Field
                    label="Description"
                    required
                  >
                    <input
                      value={
                        description
                      }
                      onChange={(
                        event
                      ) =>
                        setDescription(
                          event.target
                            .value
                        )
                      }
                      placeholder="Expense details"
                      className={
                        inputClass
                      }
                    />
                  </Field>
                </div>

                <Field label="Vendor Name">
                  <input
                    value={
                      vendorName
                    }
                    onChange={(
                      event
                    ) =>
                      setVendorName(
                        event.target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

                <Field label="Bill Number">
                  <input
                    value={
                      billNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setBillNumber(
                        event.target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

                <Field label="Vendor GSTIN">
                  <input
                    value={
                      gstNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setGstNumber(
                        event.target
                          .value.toUpperCase()
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

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

                    <option value="other">
                      Other
                    </option>
                  </select>
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
                    <option value="none">
                      No GST
                    </option>

                    <option value="intra_state">
                      CGST + SGST
                    </option>

                    <option value="inter_state">
                      IGST
                    </option>
                  </select>
                </Field>

                <Field label="GST Rate">
                  <select
                    value={
                      gstType ===
                      "none"
                        ? "0"
                        : gstRate
                    }
                    disabled={
                      gstType ===
                      "none"
                    }
                    onChange={(
                      event
                    ) =>
                      setGstRate(
                        event.target
                          .value
                      )
                    }
                    className={
                      inputClass
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
                </Field>

                <Field
                  label="Taxable Amount"
                  required
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      taxableAmount
                    }
                    onChange={(
                      event
                    ) =>
                      setTaxableAmount(
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
                  <Field label="Notes">
                    <textarea
                      rows={4}
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
                </div>
              </div>

              {/* CALC SUMMARY */}

              <div className="mt-5 rounded-2xl border bg-gray-50 p-5">
                <SummaryRow
                  label="Taxable Amount"
                  value={formatCurrency(
                    calculated.taxable
                  )}
                />

                <SummaryRow
                  label="Input CGST"
                  value={formatCurrency(
                    calculated.cgst
                  )}
                />

                <SummaryRow
                  label="Input SGST"
                  value={formatCurrency(
                    calculated.sgst
                  )}
                />

                <SummaryRow
                  label="Input IGST"
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

                <div className="mt-4 flex items-center justify-between rounded-xl bg-black p-4 text-white">
                  <span className="font-semibold">
                    Total Expense
                  </span>

                  <span className="text-xl font-black">
                    {formatCurrency(
                      calculated.total
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    setModalOpen(
                      false
                    )
                  }
                  className="rounded-xl border px-5 py-3 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
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
                    ? "Saving..."
                    : "Save Expense"}
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
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-gray-100";

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
  children: ReactNode;
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
  children?: ReactNode;
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

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-gray-950">
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

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}

function PaymentBadge({
  value,
}: {
  value:
    Expense["paymentMode"];
}) {
  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
      {value.toUpperCase()}
    </span>
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
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Cancelled
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
      Active
    </span>
  );
}