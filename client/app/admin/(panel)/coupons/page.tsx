"use client";

import {
  useEffect,
  useState,
} from "react";

type Coupon = {
  _id: string;

  code: string;

  description: string;

  discountType:
    | "percentage"
    | "fixed";

  discountValue: number;

  minimumOrderAmount: number;

  maximumDiscountAmount?: number;

  usageLimit?: number;

  usedCount: number;

  perUserLimit: number;

  startDate?: string;

  expiryDate?: string;

  isActive: boolean;
};

const emptyForm = {
  code: "",
  description: "",
  discountType:
    "percentage",
  discountValue: "",
  minimumOrderAmount:
    "0",
  maximumDiscountAmount:
    "",
  usageLimit: "",
  perUserLimit: "1",
  startDate: "",
  expiryDate: "",
  isActive: true,
};

export default function CouponsPage() {
  const [
    coupons,
    setCoupons,
  ] =
    useState<Coupon[]>([]);

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
    search,
    setSearch,
  ] =
    useState("");

  const [
    editId,
    setEditId,
  ] =
    useState<string | null>(
      null
    );

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState(
      emptyForm
    );

  async function loadCoupons() {
    try {
      setLoading(true);

      const params =
        new URLSearchParams();

      if (
        search.trim()
      ) {
        params.set(
          "search",
          search.trim()
        );
      }

      const response =
        await fetch(
          `/api/admin/coupons${
            params.toString()
              ? `?${params.toString()}`
              : ""
          }`,
          {
            cache:
              "no-store",
            credentials:
              "include",
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setCoupons(
          Array.isArray(
            data.coupons
          )
            ? data.coupons
            : []
        );
      } else {
        alert(
          data.message ||
            "Unable to load coupons."
        );
      }
    } catch (error) {
      console.error(
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer =
      setTimeout(() => {
        void loadCoupons();
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [search]);

  function startCreate() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(
    coupon: Coupon
  ) {
    setEditId(
      coupon._id
    );

    setForm({
      code:
        coupon.code,

      description:
        coupon.description ||
        "",

      discountType:
        coupon.discountType,

      discountValue:
        String(
          coupon.discountValue
        ),

      minimumOrderAmount:
        String(
          coupon.minimumOrderAmount
        ),

      maximumDiscountAmount:
        coupon.maximumDiscountAmount !==
        undefined
          ? String(
              coupon.maximumDiscountAmount
            )
          : "",

      usageLimit:
        coupon.usageLimit !==
        undefined
          ? String(
              coupon.usageLimit
            )
          : "",

      perUserLimit:
        String(
          coupon.perUserLimit ||
            1
        ),

      startDate:
        coupon.startDate
          ? coupon.startDate.slice(
              0,
              10
            )
          : "",

      expiryDate:
        coupon.expiryDate
          ? coupon.expiryDate.slice(
              0,
              10
            )
          : "",

      isActive:
        coupon.isActive,
    });

    setShowForm(true);
  }

  async function saveCoupon() {
    try {
      setSaving(true);

      const url =
        editId
          ? `/api/admin/coupons/${editId}`
          : "/api/admin/coupons";

      const response =
        await fetch(
          url,
          {
            method:
              editId
                ? "PUT"
                : "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                form
              ),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        alert(
          data.message ||
            "Unable to save coupon."
        );

        return;
      }

      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);

      await loadCoupons();
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoupon(
    id: string
  ) {
    if (
      !window.confirm(
        "Delete this coupon?"
      )
    ) {
      return;
    }

    const response =
      await fetch(
        `/api/admin/coupons/${id}`,
        {
          method:
            "DELETE",
          credentials:
            "include",
        }
      );

    const data =
      await response.json();

    if (!data.success) {
      alert(
        data.message
      );
      return;
    }

    await loadCoupons();
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Coupons
          </h1>

          <p className="mt-1 text-gray-500">
            Manage discount coupons
          </p>
        </div>

        <button
          type="button"
          onClick={
            startCreate
          }
          className="rounded-lg bg-black px-5 py-3 text-white"
        >
          + Create Coupon
        </button>
      </div>

      <input
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
        placeholder="Search coupon..."
        className="mb-6 w-full rounded-lg border p-3"
      />

      {showForm && (
        <section className="mb-8 rounded-xl border bg-white p-6">
          <h2 className="mb-5 text-xl font-bold">
            {editId
              ? "Edit Coupon"
              : "Create Coupon"}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={
                form.code
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  code:
                    e.target.value.toUpperCase(),
                })
              }
              placeholder="Coupon Code"
              className="rounded-lg border p-3"
            />

            <input
              value={
                form.description
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
              placeholder="Description"
              className="rounded-lg border p-3"
            />

            <select
              value={
                form.discountType
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  discountType:
                    e.target.value,
                })
              }
              className="rounded-lg border bg-white p-3"
            >
              <option value="percentage">
                Percentage
              </option>

              <option value="fixed">
                Fixed Amount
              </option>
            </select>

            <input
              type="number"
              value={
                form.discountValue
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  discountValue:
                    e.target.value,
                })
              }
              placeholder="Discount Value"
              className="rounded-lg border p-3"
            />

            <input
              type="number"
              value={
                form.minimumOrderAmount
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  minimumOrderAmount:
                    e.target.value,
                })
              }
              placeholder="Minimum Order"
              className="rounded-lg border p-3"
            />

            <input
              type="number"
              value={
                form.maximumDiscountAmount
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  maximumDiscountAmount:
                    e.target.value,
                })
              }
              placeholder="Maximum Discount"
              className="rounded-lg border p-3"
            />

            <input
              type="number"
              value={
                form.usageLimit
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  usageLimit:
                    e.target.value,
                })
              }
              placeholder="Usage Limit"
              className="rounded-lg border p-3"
            />

            <input
              type="number"
              value={
                form.perUserLimit
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  perUserLimit:
                    e.target.value,
                })
              }
              placeholder="Per User Limit"
              className="rounded-lg border p-3"
            />

            <input
              type="date"
              value={
                form.startDate
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  startDate:
                    e.target.value,
                })
              }
              className="rounded-lg border p-3"
            />

            <input
              type="date"
              value={
                form.expiryDate
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  expiryDate:
                    e.target.value,
                })
              }
              className="rounded-lg border p-3"
            />
          </div>

          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                form.isActive
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  isActive:
                    e.target.checked,
                })
              }
            />

            Active Coupon
          </label>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={
                saving
              }
              onClick={() =>
                void saveCoupon()
              }
              className="rounded-lg bg-black px-6 py-3 text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Coupon"}
            </button>

            <button
              type="button"
              onClick={() =>
                setShowForm(
                  false
                )
              }
              className="rounded-lg border px-6 py-3"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="p-10 text-center">
          Loading Coupons...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-5 py-4 text-left">
                  Code
                </th>

                <th className="px-5 py-4 text-left">
                  Discount
                </th>

                <th className="px-5 py-4 text-left">
                  Min Order
                </th>

                <th className="px-5 py-4 text-left">
                  Usage
                </th>

                <th className="px-5 py-4 text-left">
                  Status
                </th>

                <th className="px-5 py-4 text-left">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {coupons.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-gray-500"
                  >
                    No coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map(
                  (coupon) => (
                    <tr
                      key={
                        coupon._id
                      }
                      className="border-t"
                    >
                      <td className="px-5 py-4 font-bold">
                        {
                          coupon.code
                        }
                      </td>

                      <td className="px-5 py-4">
                        {coupon.discountType ===
                        "percentage"
                          ? `${coupon.discountValue}%`
                          : `₹${coupon.discountValue}`}
                      </td>

                      <td className="px-5 py-4">
                        ₹
                        {
                          coupon.minimumOrderAmount
                        }
                      </td>

                      <td className="px-5 py-4">
                        {
                          coupon.usedCount
                        }
                        /
                        {coupon.usageLimit ||
                          "∞"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            coupon.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {coupon.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-4">
                          <button
                            onClick={() =>
                              startEdit(
                                coupon
                              )
                            }
                            className="text-blue-600"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              void deleteCoupon(
                                coupon._id
                              )
                            }
                            className="text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}