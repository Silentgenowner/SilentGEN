"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

type AdminRole =
  | "super_admin"
  | "product_manager"
  | "order_manager"
  | "support_admin"
  | "finance_manager";

type Admin = {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
};

type AdminListResponse = {
  success: boolean;
  message?: string;
  admins?: Admin[];
};

type CreateAdminResponse = {
  success: boolean;
  message?: string;
};

const roleLabels: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  product_manager: "Product Manager",
  order_manager: "Order Manager",
  support_admin: "Support Admin",
  finance_manager: "Finance Manager",
};

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [pageError, setPageError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("product_manager");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchAdmins() {
    try {
      setLoadingAdmins(true);
      setPageError("");

      const response = await fetch("/api/admin/admins", {
        method: "GET",
        cache: "no-store",
      });

      const data: AdminListResponse = await response.json();

      if (!response.ok) {
        setPageError(data.message || "Unable to load admin accounts.");
        return;
      }

      setAdmins(data.admins || []);
    } catch {
      setPageError("Unable to load admin accounts. Please try again.");
    } finally {
      setLoadingAdmins(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  function resetForm() {
    setName("");
    setEmail("");
    setRole("product_manager");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormError("");
  }

  function openModal() {
    setSuccess("");
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (creating) {
      return;
    }

    setIsModalOpen(false);
    resetForm();
  }

  function validateForm() {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      setFormError("All fields are required.");
      return false;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      setFormError("Please enter a valid email address.");
      return false;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return false;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return false;
    }

    return true;
  }

  async function handleCreateAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          password,
          confirmPassword,
        }),
      });

      const data: CreateAdminResponse = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Unable to create admin.");
        return;
      }

      setSuccess(data.message || "New admin created successfully.");
      setIsModalOpen(false);
      resetForm();

      await fetchAdmins();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl bg-black p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-gray-300">
            <ShieldCheck size={18} />
            <span className="text-sm font-medium">Access Management</span>
          </div>

          <h2 className="mt-2 text-2xl font-bold">Admin Accounts</h2>

          <p className="mt-2 text-sm text-gray-300">
            Create and manage access for your store administrators.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200"
        >
          <Plus size={18} />
          Create New Admin
        </button>
      </section>

      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      {pageError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{pageError}</span>

            <button
              type="button"
              onClick={fetchAdmins}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">All Admins</h3>

            <p className="mt-1 text-sm text-gray-500">
              {admins.length} admin account{admins.length === 1 ? "" : "s"}{" "}
              available.
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
            <Users size={22} />
          </div>
        </div>

        {loadingAdmins ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="animate-spin" size={21} />
              <span>Loading admins...</span>
            </div>
          </div>
        ) : admins.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <UserRound className="text-gray-400" size={38} />

            <h4 className="mt-4 font-semibold text-gray-900">
              No admins found
            </h4>

            <p className="mt-1 text-sm text-gray-500">
              Create an admin account to allow another user into the panel.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Admin</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Created On</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {admins.map((admin) => (
                  <tr key={admin._id} className="text-sm text-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black font-semibold text-white">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">
                            {admin.name}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            {admin.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                        {roleLabels[admin.role]}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          admin.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {admin.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {new Date(admin.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Create New Admin
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Select the access role for this administrator.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={creating}
                aria-label="Close form"
                className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed"
              >
                <X size={22} />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="new-admin-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>

                <input
                  id="new-admin-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={creating}
                  placeholder="Enter full name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="new-admin-email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>

                <input
                  id="new-admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={creating}
                  placeholder="admin@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="new-admin-role"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Admin Role
                </label>

                <select
                  id="new-admin-role"
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as AdminRole)
                  }
                  disabled={creating}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                >
                  <option value="product_manager">Product Manager</option>
                  <option value="order_manager">Order Manager</option>
                  <option value="support_admin">Support Admin</option>
                  <option value="finance_manager">Finance Manager</option>
                  <option value="super_admin">Super Admin</option>
                </select>

                <p className="mt-2 text-xs text-gray-500">
                  Only give Super Admin access to trusted administrators.
                </p>
              </div>

              <div>
                <label
                  htmlFor="new-admin-password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="new-admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={creating}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={creating}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-admin-confirm-password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    id="new-admin-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    disabled={creating}
                    placeholder="Confirm password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    disabled={creating}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={creating}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {creating && <Loader2 size={17} className="animate-spin" />}
                  {creating ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
