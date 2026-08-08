"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Download, FileSpreadsheet, Upload } from "lucide-react";

export default function ImportProductsPage() {
  const router = useRouter();
  
  const excelRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImport(e: React.FormEvent) {
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

      const response = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Import failed.");
        return;
       }

      alert(
        `Imported : ${data.imported}

        Skipped : ${data.skipped}

        Errors : ${data.errors.length}`
        );

        setExcelFile(null);
        setImageFiles(null);

        if (excelRef.current) {
        excelRef.current.value = "";
        }

        if (imageRef.current) {
        imageRef.current.value = "";
        }

        router.push("/admin/products");
        router.refresh();
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

        <h1 className="text-3xl font-bold">
          Bulk Product Import
        </h1>

        <p className="mt-2 text-gray-500">
          Import hundreds of products using Excel.
        </p>

        <form
          onSubmit={handleImport}
          className="mt-8 space-y-8"
        >

          <div>

            <label className="mb-2 block font-semibold">
              Excel File (.xlsx)
            </label>

            <input
             ref={excelRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) =>
                setExcelFile(e.target.files?.[0] || null)
              }
              className="block w-full rounded-lg border p-3"
            />

          </div>

          <div>

            <label className="mb-2 block font-semibold">
              Product Images (JPG / PNG)
            </label>

            <input
              ref={imageRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) =>
                setImageFiles(e.target.files)
              }
              className="block w-full rounded-lg border p-3"
            />

            <p className="mt-2 text-sm text-gray-500">
              Image filename must match Excel image column.
            </p>

          </div>

          <div className="flex flex-wrap gap-4">

            <button
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-white"
            >
              <Upload size={18} />

              {loading
                ? "Importing..."
                : "Import Products"}
            </button>

            <Link
              href="/api/admin/products/template"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3"
            >
              <Download size={18} />
              Download Template
            </Link>

          </div>

        </form>

        <div className="mt-10 rounded-lg bg-gray-50 p-6">

          <div className="flex items-center gap-2 font-semibold">
            <FileSpreadsheet size={20} />
            Excel Rules
          </div>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>SKU must be unique.</li>
            <li>Name is required.</li>
            <li>MRP and Price must be numbers.</li>
            <li>Image column can contain URL.</li>
            <li>Or upload JPG/PNG with same filename.</li>
          </ul>

        </div>

      </div>

    </div>
  );
}