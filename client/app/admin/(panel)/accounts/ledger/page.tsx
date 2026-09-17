"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Users,
  WalletCards,
  X,
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
  _id: string;

  name: string;

  ledgerType:
    LedgerType;

  phone?: string;

  email?: string;

  gstNumber?: string;

  address?: string;

  openingBalance:
    number;

  balanceType:
    BalanceType;

  currentBalance:
    number;

  isActive:
    boolean;

  createdAt?:
    string;

  updatedAt?:
    string;
};

type LedgerSummary = {
  totalLedgers:
    number;

  activeLedgers:
    number;

  totalDebit:
    number;

  totalCredit:
    number;
};

type Pagination = {
  page: number;

  limit: number;

  totalLedgers:
    number;

  totalPages:
    number;
};

type LedgerResponse = {
  success:
    boolean;

  message?:
    string;

  ledgers?:
    Ledger[];

  summary?:
    LedgerSummary;

  pagination?:
    Pagination;
};

type SingleLedgerResponse = {
  success:
    boolean;

  message?:
    string;

  ledger?:
    Ledger;
};

type LedgerForm = {
  name:
    string;

  ledgerType:
    LedgerType;

  phone:
    string;

  email:
    string;

  gstNumber:
    string;

  address:
    string;

  openingBalance:
    string;

  balanceType:
    BalanceType;

  isActive:
    boolean;
};

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const EMPTY_FORM:
  LedgerForm = {
    name:
      "",

    ledgerType:
      "customer",

    phone:
      "",

    email:
      "",

    gstNumber:
      "",

    address:
      "",

    openingBalance:
      "0",

    balanceType:
      "debit",

    isActive:
      true,
  };

const LEDGER_TYPE_OPTIONS: {
  value:
    LedgerType;

  label:
    string;
}[] = [
  {
    value:
      "customer",

    label:
      "Customer",
  },

  {
    value:
      "supplier",

    label:
      "Supplier",
  },

  {
    value:
      "sales",

    label:
      "Sales",
  },

  {
    value:
      "purchase",

    label:
      "Purchase",
  },

  {
    value:
      "expense",

    label:
      "Expense",
  },

  {
    value:
      "gst_input",

    label:
      "GST Input",
  },

  {
    value:
      "gst_output",

    label:
      "GST Output",
  },

  {
    value:
      "cash",

    label:
      "Cash",
  },

  {
    value:
      "bank",

    label:
      "Bank",
  },

  {
    value:
      "other",

    label:
      "Other",
  },
];

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
  value?:
    string
) {
  if (!value) {
    return "-";
  }

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

function getLedgerTypeLabel(
  type:
    LedgerType
) {
  return (
    LEDGER_TYPE_OPTIONS.find(
      (
        item
      ) =>
        item.value ===
        type
    )?.label ??
    type
  );
}

function getBalanceLabel(
  value:
    number
) {
  if (
    value > 0
  ) {
    return {
      text:
        `${formatCurrency(
          value
        )} Dr`,

      className:
        "text-emerald-700",
    };
  }

  if (
    value < 0
  ) {
    return {
      text:
        `${formatCurrency(
          Math.abs(
            value
          )
        )} Cr`,

      className:
        "text-red-600",
    };
  }

  return {
    text:
      formatCurrency(
        0
      ),

    className:
      "text-gray-600",
  };
}

function readJson<
  T,
>(
  responseText:
    string
): T | null {
  if (
    !responseText.trim()
  ) {
    return null;
  }

  try {
    return JSON.parse(
      responseText
    ) as T;
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function LedgerPage() {
  const [
    ledgers,
    setLedgers,
  ] =
    useState<
      Ledger[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<
      LedgerSummary
    >({
      totalLedgers:
        0,

      activeLedgers:
        0,

      totalDebit:
        0,

      totalCredit:
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
        20,

      totalLedgers:
        0,

      totalPages:
        1,
    });

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] =
    useState(
      ""
    );

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState(
      ""
    );

  const [
    statusFilter,
    setStatusFilter,
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

  const [
    success,
    setSuccess,
  ] =
    useState(
      ""
    );

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(
      false
    );

  const [
    editingLedger,
    setEditingLedger,
  ] =
    useState<
      Ledger | null
    >(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<
      LedgerForm
    >(
      EMPTY_FORM
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<
      Ledger | null
    >(
      null
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState(
      false
    );

  /*
  |--------------------------------------------------------------------------
  | DEBOUNCE SEARCH
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const timeout =
        window.setTimeout(
          () => {
            setDebouncedSearch(
              search.trim()
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
          },
          350
        );

      return () => {
        window.clearTimeout(
          timeout
        );
      };
    },
    [
      search,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD LEDGERS
  |--------------------------------------------------------------------------
  */

  const loadLedgers =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(
              pagination.page
            )
          );

          params.set(
            "limit",
            String(
              pagination.limit
            )
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
            typeFilter
          ) {
            params.set(
              "type",
              typeFilter
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

          const response =
            await fetch(
              `/api/admin/accounts/ledger?${params.toString()}`,
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const responseText =
            await response.text();

          const data =
            readJson<
              LedgerResponse
            >(
              responseText
            );

          if (
            !response.ok ||
            !data?.success
          ) {
            throw new Error(
              data?.message ||
                "Unable to load ledgers."
            );
          }

          setLedgers(
            Array.isArray(
              data.ledgers
            )
              ? data.ledgers
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
            "LEDGER_LOAD_ERROR:",
            loadError
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load ledgers."
          );

          setLedgers(
            []
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        pagination.page,
        pagination.limit,
        debouncedSearch,
        typeFilter,
        statusFilter,
      ]
    );

  useEffect(
    () => {
      void loadLedgers();
    },
    [
      loadLedgers,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | RESET MESSAGES
  |--------------------------------------------------------------------------
  */

  function clearMessages() {
    setError(
      ""
    );

    setSuccess(
      ""
    );
  }

  /*
  |--------------------------------------------------------------------------
  | OPEN CREATE
  |--------------------------------------------------------------------------
  */

  function openCreateModal() {
    clearMessages();

    setEditingLedger(
      null
    );

    setForm({
      ...EMPTY_FORM,
    });

    setModalOpen(
      true
    );
  }

  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT
  |--------------------------------------------------------------------------
  */

  function openEditModal(
    ledger:
      Ledger
  ) {
    clearMessages();

    setEditingLedger(
      ledger
    );

    setForm({
      name:
        ledger.name ??
        "",

      ledgerType:
        ledger.ledgerType,

      phone:
        ledger.phone ??
        "",

      email:
        ledger.email ??
        "",

      gstNumber:
        ledger.gstNumber ??
        "",

      address:
        ledger.address ??
        "",

      openingBalance:
        String(
          ledger.openingBalance ??
            0
        ),

      balanceType:
        ledger.balanceType ??
        "debit",

      isActive:
        ledger.isActive !==
        false,
    });

    setModalOpen(
      true
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CLOSE MODAL
  |--------------------------------------------------------------------------
  */

  function closeModal() {
    if (
      saving
    ) {
      return;
    }

    setModalOpen(
      false
    );

    setEditingLedger(
      null
    );

    setForm({
      ...EMPTY_FORM,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE FORM
  |--------------------------------------------------------------------------
  */

  function updateForm<
    K extends keyof LedgerForm,
  >(
    field:
      K,
    value:
      LedgerForm[K]
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDATE FORM
  |--------------------------------------------------------------------------
  */

  function validateForm() {
    if (
      !form.name.trim()
    ) {
      return "Ledger name is required.";
    }

    const openingBalance =
      Number(
        form.openingBalance
      );

    if (
      !Number.isFinite(
        openingBalance
      ) ||
      openingBalance <
        0
    ) {
      return "Opening balance must be a valid non-negative number.";
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      return "Please enter a valid email address.";
    }

    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      saving
    ) {
      return;
    }

    clearMessages();

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
      setSaving(
        true
      );

      const payload = {
        name:
          form.name.trim(),

        ledgerType:
          form.ledgerType,

        phone:
          form.phone.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        gstNumber:
          form.gstNumber
            .trim()
            .toUpperCase(),

        address:
          form.address.trim(),

        openingBalance:
          Number(
            form.openingBalance ||
              0
          ),

        balanceType:
          form.balanceType,

        isActive:
          form.isActive,
      };

      const editing =
        Boolean(
          editingLedger
        );

      const response =
        await fetch(
          editing
            ? `/api/admin/accounts/ledger/${editingLedger?._id}`
            : "/api/admin/accounts/ledger",
          {
            method:
              editing
                ? "PATCH"
                : "POST",

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

      const responseText =
        await response.text();

      const data =
        readJson<
          SingleLedgerResponse
        >(
          responseText
        );

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to save ledger."
        );
      }

      setSuccess(
        editing
          ? "Ledger updated successfully."
          : "Ledger created successfully."
      );

      closeModal();

      await loadLedgers();
    } catch (
      saveError
    ) {
      console.error(
        "LEDGER_SAVE_ERROR:",
        saveError
      );

      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save ledger."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  async function confirmDelete() {
    if (
      !deleteTarget ||
      deleting
    ) {
      return;
    }

    try {
      setDeleting(
        true
      );

      clearMessages();

      const response =
        await fetch(
          `/api/admin/accounts/ledger/${deleteTarget._id}`,
          {
            method:
              "DELETE",

            credentials:
              "include",
          }
        );

      const responseText =
        await response.text();

      const data =
        readJson<{
          success:
            boolean;

          message?:
            string;
        }>(
          responseText
        );

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to delete ledger."
        );
      }

      setDeleteTarget(
        null
      );

      setSuccess(
        data.message ||
          "Ledger deleted successfully."
      );

      if (
        ledgers.length ===
          1 &&
        pagination.page >
          1
      ) {
        setPagination(
          (
            current
          ) => ({
            ...current,

            page:
              current.page -
              1,
          })
        );
      } else {
        await loadLedgers();
      }
    } catch (
      deleteError
    ) {
      console.error(
        "LEDGER_DELETE_ERROR:",
        deleteError
      );

      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to delete ledger."
      );
    } finally {
      setDeleting(
        false
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  function resetFilters() {
    setSearch(
      ""
    );

    setDebouncedSearch(
      ""
    );

    setTypeFilter(
      ""
    );

    setStatusFilter(
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
  | DERIVED
  |--------------------------------------------------------------------------
  */

  const hasFilters =
    useMemo(
      () =>
        Boolean(
          search ||
            typeFilter ||
            statusFilter
        ),
      [
        search,
        typeFilter,
        statusFilter,
      ]
    );

  const firstItem =
    pagination.totalLedgers >
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
      pagination.totalLedgers
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

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Accounts
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">
              Ledger
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage customers, suppliers,
              cash, bank, GST and other
              accounting ledgers.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void loadLedgers()
              }
              disabled={
                loading
              }
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
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
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <Plus
                size={18}
              />

              Add Ledger
            </button>
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        {success &&
          !error && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {success}
            </div>
          )}

        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Ledgers"
            value={String(
              summary.totalLedgers
            )}
            icon={
              <WalletCards
                size={21}
              />
            }
          />

          <SummaryCard
            title="Active Ledgers"
            value={String(
              summary.activeLedgers
            )}
            icon={
              <Users
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
        </div>

        {/* FILTERS */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_180px_auto]">
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
                placeholder="Search name, phone, email or GSTIN..."
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </div>

            <select
              value={
                typeFilter
              }
              onChange={(
                event
              ) => {
                setTypeFilter(
                  event.target
                    .value
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
              }}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
            >
              <option value="">
                All Ledger Types
              </option>

              {LEDGER_TYPE_OPTIONS.map(
                (
                  option
                ) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                )
              )}
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

                setPagination(
                  (
                    current
                  ) => ({
                    ...current,

                    page:
                      1,
                  })
                );
              }}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
            >
              <option value="">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>

            <button
              type="button"
              onClick={
                resetFilters
              }
              disabled={
                !hasFilters
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </section>

        {/* TABLE */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <TableHead>
                    Ledger
                  </TableHead>

                  <TableHead>
                    Type
                  </TableHead>

                  <TableHead>
                    Contact
                  </TableHead>

                  <TableHead>
                    GSTIN
                  </TableHead>

                  <TableHead>
                    Opening
                  </TableHead>

                  <TableHead>
                    Current Balance
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Created
                  </TableHead>

                  <TableHead align="right">
                    Actions
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={
                        9
                      }
                      className="px-6 py-16 text-center"
                    >
                      <Loader2
                        size={28}
                        className="mx-auto animate-spin text-gray-500"
                      />

                      <p className="mt-3 text-sm text-gray-500">
                        Loading
                        ledgers...
                      </p>
                    </td>
                  </tr>
                ) : ledgers.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={
                        9
                      }
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <WalletCards
                          size={22}
                          className="text-gray-500"
                        />
                      </div>

                      <p className="mt-4 font-semibold text-gray-800">
                        No ledgers
                        found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Create your
                        first ledger
                        or change the
                        filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  ledgers.map(
                    (
                      ledger
                    ) => {
                      const balance =
                        getBalanceLabel(
                          Number(
                            ledger.currentBalance ??
                              0
                          )
                        );

                      return (
                        <tr
                          key={
                            ledger._id
                          }
                          className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50/70"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900">
                              {
                                ledger.name
                              }
                            </p>

                            {ledger.address && (
                              <p className="mt-1 max-w-[260px] truncate text-xs text-gray-500">
                                {
                                  ledger.address
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                              {getLedgerTypeLabel(
                                ledger.ledgerType
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-600">
                            <p>
                              {ledger.phone ||
                                "-"}
                            </p>

                            {ledger.email && (
                              <p className="mt-1 text-xs text-gray-400">
                                {
                                  ledger.email
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-600">
                            {ledger.gstNumber ||
                              "-"}
                          </td>

                          <td className="px-5 py-4 text-sm">
                            <span
                              className={
                                ledger.balanceType ===
                                "credit"
                                  ? "font-semibold text-red-600"
                                  : "font-semibold text-emerald-700"
                              }
                            >
                              {formatCurrency(
                                Number(
                                  ledger.openingBalance ??
                                    0
                                )
                              )}{" "}
                              {ledger.balanceType ===
                              "credit"
                                ? "Cr"
                                : "Dr"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`font-bold ${balance.className}`}
                            >
                              {
                                balance.text
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={
                                ledger.isActive
                                  ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                                  : "inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500"
                              }
                            >
                              {ledger.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-500">
                            {formatDate(
                              ledger.createdAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    ledger
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-100 hover:text-black"
                                title="Edit ledger"
                              >
                                <Pencil
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget(
                                    ledger
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                                title="Delete ledger"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-800">
                {firstItem}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-800">
                {lastItem}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-800">
                {
                  pagination.totalLedgers
                }
              </span>
            </p>

            <div className="flex items-center gap-2">
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
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft
                  size={17}
                />

                Previous
              </button>

              <div className="flex h-10 min-w-12 items-center justify-center rounded-xl bg-black px-3 text-sm font-bold text-white">
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
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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

      {/* CREATE / EDIT MODAL */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingLedger
                    ? "Edit Ledger"
                    : "Add Ledger"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingLedger
                    ? "Update ledger details and opening balance."
                    : "Create a new accounting ledger."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="p-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  label="Ledger Name"
                  required
                >
                  <input
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "name",
                        event.target
                          .value
                      )
                    }
                    placeholder="Customer / Supplier / Bank Name"
                    disabled={
                      saving
                    }
                    className={
                      inputClass
                    }
                  />
                </FormField>

                <FormField
                  label="Ledger Type"
                  required
                >
                  <select
                    value={
                      form.ledgerType
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "ledgerType",
                        event.target
                          .value as LedgerType
                      )
                    }
                    disabled={
                      saving
                    }
                    className={
                      inputClass
                    }
                  >
                    {LEDGER_TYPE_OPTIONS.map(
                      (
                        option
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                <FormField label="Phone">
                  <input
                    value={
                      form.phone
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "phone",
                        event.target
                          .value
                      )
                    }
                    placeholder="9876543210"
                    disabled={
                      saving
                    }
                    className={
                      inputClass
                    }
                  />
                </FormField>

                <FormField label="Email">
                  <input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "email",
                        event.target
                          .value
                      )
                    }
                    placeholder="example@email.com"
                    disabled={
                      saving
                    }
                    className={
                      inputClass
                    }
                  />
                </FormField>

                <FormField label="GST Number">
                  <input
                    value={
                      form.gstNumber
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "gstNumber",
                        event.target
                          .value.toUpperCase()
                      )
                    }
                    placeholder="24ABCDE1234F1Z5"
                    disabled={
                      saving
                    }
                    className={
                      inputClass
                    }
                  />
                </FormField>

                <FormField label="Status">
                  <select
                    value={
                      form.isActive
                        ? "active"
                        : "inactive"
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "isActive",
                        event.target
                          .value ===
                          "active"
                      )
                    }
                    disabled={
                      saving
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </FormField>

                <FormField
                  label="Opening Balance"
                  required
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.openingBalance
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "openingBalance",
                        event.target
                          .value
                      )
                    }
                    disabled={
                      saving
                    }
                    className={
                      inputClass
                    }
                  />
                </FormField>

                <FormField
                  label="Opening Balance Type"
                  required
                >
                  <select
                    value={
                      form.balanceType
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "balanceType",
                        event.target
                          .value as BalanceType
                      )
                    }
                    disabled={
                      saving
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="debit">
                      Debit (Dr)
                    </option>

                    <option value="credit">
                      Credit (Cr)
                    </option>
                  </select>
                </FormField>
              </div>

              <div className="mt-5">
                <FormField label="Address">
                  <textarea
                    rows={4}
                    value={
                      form.address
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "address",
                        event.target
                          .value
                      )
                    }
                    placeholder="Complete billing / business address"
                    disabled={
                      saving
                    }
                    className={
                      textareaClass
                    }
                  />
                </FormField>
              </div>

              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold">
                  Opening Balance
                </p>

                <p className="mt-1 leading-6">
                  Debit means amount receivable /
                  asset balance. Credit means
                  payable / liability balance.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingLedger
                    ? "Update Ledger"
                    : "Create Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2
                size={21}
              />
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Delete Ledger?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              You are deleting{" "}
              <span className="font-semibold text-gray-800">
                {
                  deleteTarget.name
                }
              </span>
              . If this ledger already has
              accounting transactions, backend
              will block deletion.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(
                    null
                  )
                }
                disabled={
                  deleting
                }
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void confirmDelete()
                }
                disabled={
                  deleting
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                )}

                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| UI HELPERS
|--------------------------------------------------------------------------
*/

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-gray-100 disabled:text-gray-500";

const textareaClass =
  "w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-gray-100 disabled:text-gray-500";

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-950">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function TableHead({
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

function FormField({
  label,
  required =
    false,
  children,
}: {
  label:
    string;

  required?:
    boolean;

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