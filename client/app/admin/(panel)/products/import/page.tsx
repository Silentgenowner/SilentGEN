"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileImage,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type ImportSummary = {
  totalRows: number;
  imported: number;
  skipped: number;
  failed: number;
};

type ImportResponse = {
  success?: boolean;
  message?: string;

  summary?: ImportSummary;

  imported?: number;
  skipped?: number;

  errors?: string[];
};

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_IMAGE_SIZE =
  8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

const ALLOWED_EXCEL_EXTENSIONS =
  [".xlsx", ".xls"];

/* ============================================================
   HELPERS
============================================================ */

function getFileExtension(
  fileName: string
) {
  const dotIndex =
    fileName.lastIndexOf(".");

  if (dotIndex < 0) {
    return "";
  }

  return fileName
    .slice(dotIndex)
    .toLowerCase();
}

function isValidExcelFile(
  file: File
) {
  const extension =
    getFileExtension(
      file.name
    );

  return ALLOWED_EXCEL_EXTENSIONS.includes(
    extension
  );
}

function isValidImageFile(
  file: File
) {
  return (
    ALLOWED_IMAGE_TYPES.includes(
      file.type
    ) &&
    file.size <=
      MAX_IMAGE_SIZE
  );
}

function formatFileSize(
  bytes: number
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb =
    bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb =
    kb / 1024;

  return `${mb.toFixed(1)} MB`;
}

function uniqueFiles(
  files: File[]
) {
  const map =
    new Map<
      string,
      File
    >();

  for (const file of files) {
    const key =
      `${file.name.toLowerCase()}-${file.size}-${file.lastModified}`;

    if (!map.has(key)) {
      map.set(
        key,
        file
      );
    }
  }

  return Array.from(
    map.values()
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function ImportProductsPage() {
  const router =
    useRouter();

  const excelRef =
    useRef<HTMLInputElement>(
      null
    );

  const imageRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    excelFile,
    setExcelFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    imageFiles,
    setImageFiles,
  ] =
    useState<File[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    result,
    setResult,
  ] =
    useState<ImportResponse | null>(
      null
    );

  const [
    excelDragging,
    setExcelDragging,
  ] =
    useState(false);

  const [
    imageDragging,
    setImageDragging,
  ] =
    useState(false);

  /* ==========================================================
     TOTAL IMAGE SIZE
  ========================================================== */

  const totalImageSize =
    useMemo(
      () =>
        imageFiles.reduce(
          (
            total,
            file
          ) =>
            total +
            file.size,
          0
        ),
      [imageFiles]
    );

  /* ==========================================================
     EXCEL
  ========================================================== */

  function selectExcelFile(
    file: File | null
  ) {
    setError("");
    setResult(null);

    if (!file) {
      setExcelFile(
        null
      );

      return;
    }

    if (
      !isValidExcelFile(
        file
      )
    ) {
      setError(
        "Please select a valid .xlsx or .xls Excel file."
      );

      return;
    }

    setExcelFile(
      file
    );
  }

  function handleExcelChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    selectExcelFile(
      event.target
        .files?.[0] ??
        null
    );
  }

  function handleExcelDrop(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setExcelDragging(
      false
    );

    const file =
      event.dataTransfer
        .files?.[0];

    if (!file) {
      return;
    }

    selectExcelFile(
      file
    );
  }

  function removeExcelFile() {
    setExcelFile(
      null
    );

    setResult(null);

    if (
      excelRef.current
    ) {
      excelRef.current.value =
        "";
    }
  }

  /* ==========================================================
     IMAGES
  ========================================================== */

  function addImageFiles(
    files: File[]
  ) {
    setError("");
    setResult(null);

    if (
      files.length === 0
    ) {
      return;
    }

    const validFiles:
      File[] = [];

    const invalidFiles:
      string[] = [];

    for (
      const file of files
    ) {
      if (
        isValidImageFile(
          file
        )
      ) {
        validFiles.push(
          file
        );
      } else {
        invalidFiles.push(
          file.name
        );
      }
    }

    setImageFiles(
      (previous) =>
        uniqueFiles([
          ...previous,
          ...validFiles,
        ])
    );

    if (
      invalidFiles.length >
      0
    ) {
      setError(
        `Some images were skipped. Allowed: JPG, JPEG, PNG, WEBP up to 8 MB each. Skipped: ${invalidFiles.join(", ")}`
      );
    }
  }

  function handleImagesChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(
        event.target
          .files ?? []
      );

    addImageFiles(
      files
    );

    /*
     * Reset input so same file can
     * be selected again later.
     */

    event.target.value =
      "";
  }

  function handleImagesDrop(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setImageDragging(
      false
    );

    const files =
      Array.from(
        event.dataTransfer
          .files ?? []
      );

    addImageFiles(
      files
    );
  }

  function removeImage(
    index: number
  ) {
    setImageFiles(
      (previous) =>
        previous.filter(
          (
            _,
            itemIndex
          ) =>
            itemIndex !==
            index
        )
    );
  }

  function clearImages() {
    setImageFiles([]);

    if (
      imageRef.current
    ) {
      imageRef.current.value =
        "";
    }
  }

  /* ==========================================================
     RESET
  ========================================================== */

  function resetForm() {
    setExcelFile(
      null
    );

    setImageFiles([]);

    setError("");

    setResult(null);

    if (
      excelRef.current
    ) {
      excelRef.current.value =
        "";
    }

    if (
      imageRef.current
    ) {
      imageRef.current.value =
        "";
    }
  }

  /* ==========================================================
     IMPORT
  ========================================================== */

  async function handleImport(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setResult(null);

    if (!excelFile) {
      setError(
        "Please select an Excel file."
      );

      return;
    }

    if (
      !isValidExcelFile(
        excelFile
      )
    ) {
      setError(
        "Invalid Excel file. Please use .xlsx or .xls."
      );

      return;
    }

    try {
      setLoading(true);

      const formData =
        new FormData();

      formData.append(
        "excel",
        excelFile
      );

      for (
        const file of
        imageFiles
      ) {
        formData.append(
          "images",
          file
        );
      }

      const response =
        await fetch(
          "/api/admin/products/import",
          {
            method:
              "POST",

            credentials:
              "include",

            body:
              formData,
          }
        );

      const responseText =
        await response.text();

      let data:
        ImportResponse;

      try {
        data =
          responseText
            ? JSON.parse(
                responseText
              )
            : {};
      } catch {
        throw new Error(
          "Import API returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Import failed (${response.status}).`
        );
      }

      if (
        data.success ===
        false
      ) {
        throw new Error(
          data.message ||
            "Import failed."
        );
      }

      setResult(
        data
      );

      /*
       * Products page cache refresh.
       * We keep user on import page
       * so they can inspect skipped rows.
       */

      router.refresh();
    } catch (err) {
      console.error(
        "PRODUCT_IMPORT_ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while importing products."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        {/* =====================================================
            BACK
        ===================================================== */}

        <Link
          href="/admin/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-black"
        >
          <ArrowLeft
            size={18}
          />

          Back to Products
        </Link>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                <FileSpreadsheet
                  size={24}
                />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Bulk Product Import
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Import products using Excel
                with normal images,
                size-wise stock,
                color stock,
                color + size stock and
                360° product frames.
              </p>
            </div>

            <a
              href="/api/admin/products/template"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              <Download
                size={18}
              />

              Download Template
            </a>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={19}
            />

            <div>
              <p className="font-semibold">
                Import Error
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            RESULT
        ===================================================== */}

        {result && (
          <ImportResult
            result={
              result
            }
            onReset={
              resetForm
            }
          />
        )}

        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={
            handleImport
          }
          className="space-y-6"
        >
          {/* ===================================================
              EXCEL
          =================================================== */}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                1. Select Excel File
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Use SilentGEN Excel
                template or an exported
                SilentGEN products file.
              </p>
            </div>

            {!excelFile ? (
              <div
                onDragOver={(
                  event
                ) => {
                  event.preventDefault();

                  setExcelDragging(
                    true
                  );
                }}
                onDragLeave={() =>
                  setExcelDragging(
                    false
                  )
                }
                onDrop={
                  handleExcelDrop
                }
                onClick={() =>
                  excelRef.current?.click()
                }
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
                  excelDragging
                    ? "border-black bg-gray-100"
                    : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <FileSpreadsheet
                    size={28}
                  />
                </div>

                <p className="mt-4 font-bold text-gray-900">
                  Drag & drop Excel
                  file here
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  or click to browse
                </p>

                <p className="mt-3 text-xs font-medium text-gray-400">
                  XLSX / XLS
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-2xl border border-green-200 bg-green-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    <FileSpreadsheet
                      size={24}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">
                      {
                        excelFile.name
                      }
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatFileSize(
                        excelFile.size
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    removeExcelFile
                  }
                  disabled={
                    loading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <X
                    size={17}
                  />

                  Remove
                </button>
              </div>
            )}

            <input
              ref={
                excelRef
              }
              type="file"
              accept=".xlsx,.xls"
              onChange={
                handleExcelChange
              }
              disabled={
                loading
              }
              className="hidden"
            />
          </section>

          {/* ===================================================
              IMAGES
          =================================================== */}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  2. Product Images
                </h2>

                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Optional. Upload local
                  images whose filenames
                  are used inside Excel.
                  URLs in Excel do not
                  require image upload.
                </p>
              </div>

              {imageFiles.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    clearImages
                  }
                  disabled={
                    loading
                  }
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 disabled:opacity-50"
                >
                  <Trash2
                    size={16}
                  />

                  Clear All
                </button>
              )}
            </div>

            <div
              onDragOver={(
                event
              ) => {
                event.preventDefault();

                setImageDragging(
                  true
                );
              }}
              onDragLeave={() =>
                setImageDragging(
                  false
                )
              }
              onDrop={
                handleImagesDrop
              }
              onClick={() =>
                imageRef.current?.click()
              }
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-7 text-center transition ${
                imageDragging
                  ? "border-black bg-gray-100"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <FileImage
                  size={28}
                />
              </div>

              <p className="mt-4 font-bold text-gray-900">
                Drag & drop product
                images here
              </p>

              <p className="mt-2 text-sm text-gray-500">
                or click to select
                multiple images
              </p>

              <p className="mt-3 text-xs font-medium text-gray-400">
                JPG / JPEG / PNG / WEBP
                • Maximum 8 MB each
              </p>
            </div>

            <input
              ref={
                imageRef
              }
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={
                handleImagesChange
              }
              disabled={
                loading
              }
              className="hidden"
            />

            {/* SELECTED IMAGES */}

            {imageFiles.length >
              0 && (
              <div className="mt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-gray-900">
                    {
                      imageFiles.length
                    }{" "}
                    image
                    {imageFiles.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    selected
                  </p>

                  <p className="text-xs text-gray-500">
                    Total{" "}
                    {formatFileSize(
                      totalImageSize
                    )}
                  </p>
                </div>

                <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-3">
                  {imageFiles.map(
                    (
                      file,
                      index
                    ) => (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <FileImage
                            size={18}
                            className="shrink-0 text-gray-500"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-800">
                              {
                                file.name
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              {formatFileSize(
                                file.size
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            removeImage(
                              index
                            );
                          }}
                          disabled={
                            loading
                          }
                          className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <X
                            size={17}
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ===================================================
              IMPORT BUTTON
          =================================================== */}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-gray-900">
                  Ready to Import
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Products with duplicate
                  SKU or slug will be
                  skipped.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !excelFile
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-7 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Importing Products...
                  </>
                ) : (
                  <>
                    <Upload
                      size={18}
                    />

                    Import Products
                  </>
                )}
              </button>
            </div>
          </section>
        </form>

        {/* =====================================================
            EXCEL FORMAT GUIDE
        ===================================================== */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <FileSpreadsheet
                size={20}
              />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Excel Format Guide
              </h2>

              <p className="text-sm text-gray-500">
                Important columns used by
                the new SilentGEN import
                system.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-[950px] w-full text-left text-sm">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">
                    Column
                  </th>

                  <th className="px-4 py-3">
                    Example
                  </th>

                  <th className="px-4 py-3">
                    Purpose
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                <GuideRow
                  column="SizeStock"
                  example="S=10|M=15|L=20|XL=5"
                  purpose="Product-level size-wise stock"
                />

                <GuideRow
                  column="ColorStock"
                  example="Black=50;White=45"
                  purpose="Direct stock for each color"
                />

                <GuideRow
                  column="VariantStock"
                  example="Black:S=10|M=15|L=20;White:S=8|M=12|L=15"
                  purpose="Color + size-wise stock"
                />

                <GuideRow
                  column="ColorImages"
                  example="Black=black1.jpg|black2.jpg;White=white1.jpg"
                  purpose="Separate normal images for each color"
                />

                <GuideRow
                  column="Main360Images"
                  example="0:main0.jpg|30:main30.jpg|60:main60.jpg"
                  purpose="Main product 360° frames"
                />

                <GuideRow
                  column="Color360Images"
                  example="Black=0:black0.jpg|30:black30.jpg;White=0:white0.jpg|30:white30.jpg"
                  purpose="Separate 360° frames for each color"
                />

                <GuideRow
                  column="images"
                  example="img1.jpg|img2.jpg|img3.jpg"
                  purpose="Main product gallery"
                />

                <GuideRow
                  column="sizes"
                  example="S,M,L,XL"
                  purpose="Available product sizes"
                />

                <GuideRow
                  column="colors"
                  example="Black,White,Navy Blue"
                  purpose="Available product colors"
                />
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
            <strong className="text-gray-900">
              Image filename rule:
            </strong>{" "}
            If Excel contains
            <code className="mx-1 rounded bg-gray-200 px-1.5 py-0.5 text-xs">
              black-front.jpg
            </code>
            then an uploaded image must
            have exactly the same
            filename. You may also put
            full HTTPS image URLs directly
            in Excel.
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   RESULT
============================================================ */

function ImportResult({
  result,
  onReset,
}: {
  result: ImportResponse;

  onReset: () => void;
}) {
  const imported =
    result.summary
      ?.imported ??
    result.imported ??
    0;

  const skipped =
    result.summary
      ?.skipped ??
    result.skipped ??
    0;

  const totalRows =
    result.summary
      ?.totalRows ??
    imported +
      skipped;

  const errors =
    Array.isArray(
      result.errors
    )
      ? result.errors
      : [];

  return (
    <section className="mb-6 rounded-2xl border border-green-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2
          size={24}
          className="mt-0.5 shrink-0 text-green-600"
        />

        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Import Completed
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {result.message ||
              "Product import completed."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultCard
          label="Total Rows"
          value={
            totalRows
          }
        />

        <ResultCard
          label="Imported"
          value={
            imported
          }
        />

        <ResultCard
          label="Skipped"
          value={
            skipped
          }
        />
      </div>

      {errors.length >
        0 && (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-red-700">
            Skipped / Failed Rows
          </h3>

          <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-red-100 bg-red-50">
            {errors.map(
              (
                item,
                index
              ) => (
                <div
                  key={`${item}-${index}`}
                  className="border-b border-red-100 px-4 py-3 text-sm text-red-700 last:border-b-0"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/admin/products"
          className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
        >
          View Products
        </Link>

        <button
          type="button"
          onClick={
            onReset
          }
          className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700"
        >
          Import Another File
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   RESULT CARD
============================================================ */

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   GUIDE ROW
============================================================ */

function GuideRow({
  column,
  example,
  purpose,
}: {
  column: string;
  example: string;
  purpose: string;
}) {
  return (
    <tr className="bg-white">
      <td className="whitespace-nowrap px-4 py-3 font-bold text-gray-900">
        {column}
      </td>

      <td className="px-4 py-3">
        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
          {example}
        </code>
      </td>

      <td className="px-4 py-3 text-gray-600">
        {purpose}
      </td>
    </tr>
  );
}