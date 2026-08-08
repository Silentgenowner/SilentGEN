"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSpreadsheet,
  RefreshCcw,
  Upload,
} from "lucide-react";

export default function UpdateProductsPage() {
  const [excelFile, setExcelFile] =
    useState<File | null>(null);

  const [imageFiles, setImageFiles] =
    useState<FileList | null>(null);

  const [loading, setLoading] =
    useState(false);

  async function handleUpdate(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!excelFile) {
      alert("Please select an Excel file.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("excel", excelFile);

      if (imageFiles) {
        Array.from(imageFiles).forEach((file) => {
          formData.append("images", file);
        });
      }

      const response = await fetch(
        "/api/admin/products/update",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Product update failed."
        );
        return;
      }

      alert(
        `Updated : ${data.updated}
Skipped : ${data.skipped}`
      );

      setExcelFile(null);
      setImageFiles(null);
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">

      <Link
        href="/admin/products"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft size={18} />
        Back to Products
      </Link>

      <div className="rounded-xl border bg-white p-8">

        <div className="flex items-center gap-3">

          <RefreshCcw size={28} />

          <div>

            <h1 className="text-3xl font-bold">
              Bulk Product Update
            </h1>

            <p className="mt-2 text-gray-500">
              Update existing products using Excel.
            </p>

          </div>

        </div>

        <form
          onSubmit={handleUpdate}
          className="mt-8 space-y-8"
        ><div>
  <label className="mb-2 block font-semibold">
    Excel File (.xlsx)
  </label>

  <input
    type="file"
    accept=".xlsx,.xls"
    onChange={(e) =>
      setExcelFile(e.target.files?.[0] || null)
    }
    className="block w-full rounded-lg border p-3"
  />

  <p className="mt-2 text-sm text-gray-500">
    Upload the Excel file that contains the products you
    want to update.
  </p>
</div>

<div>
  <label className="mb-2 block font-semibold">
    Product Images (Optional)
  </label>

  <input
    type="file"
    multiple
    accept=".jpg,.jpeg,.png,.webp"
    onChange={(e) =>
      setImageFiles(e.target.files)
    }
    className="block w-full rounded-lg border p-3"
  />

  <p className="mt-2 text-sm text-gray-500">
    Upload images only if your Excel file references local
    image filenames.
  </p>
</div>

<div className="flex flex-wrap gap-4">

  <button
    type="submit"
    disabled={loading}
    className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Upload size={18} />

    {loading
      ? "Updating..."
      : "Update Products"}
  </button>

  <Link
    href="/api/admin/products/template"
    className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 font-semibold"
  >
    <FileSpreadsheet size={18} />
    Download Template
  </Link>

</div>
        </form>

        <div className="mt-10 rounded-lg bg-gray-50 p-6">

          <div className="flex items-center gap-2 font-semibold">
            <FileSpreadsheet size={20} />
            Update Rules
          </div>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>SKU is required.</li>
            <li>Only existing products will be updated.</li>
            <li>Products with unknown SKU will be skipped.</li>
            <li>Price cannot be greater than MRP.</li>
            <li>Stock cannot be negative.</li>
            <li>
              Image column can contain a Cloudinary/HTTP URL.
            </li>
            <li>
              Or upload JPG / PNG / WEBP images with the same
              filename as mentioned in Excel.
            </li>
          </ul>

        </div>

      </div>

    </div>
  );
}