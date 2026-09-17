"use client";

import { useState } from "react";

type EditProductActionsProps = {
  isSaving?: boolean;
  isDeleting?: boolean;

  isPublished?: boolean;

  onSave: () => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => void | Promise<void>;
  onPublishChange?: (
    published: boolean
  ) => void | Promise<void>;
};

export default function EditProductActions({
  isSaving = false,
  isDeleting = false,
  isPublished = false,
  onSave,
  onCancel,
  onDelete,
  onPublishChange,
}: EditProductActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const busy = isSaving || isDeleting;

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      await onDelete();
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!onPublishChange || busy) return;

    await onPublishChange(!isPublished);
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* MAIN ACTION BAR */}
      {/* ------------------------------------------------------------- */}

      <div className="sticky bottom-0 z-20 mt-6 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* --------------------------------------------------------- */}
          {/* LEFT SIDE */}
          {/* --------------------------------------------------------- */}

          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                isPublished
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isPublished ? "✓" : "•"}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                {isPublished
                  ? "Product Published"
                  : "Product Draft"}
              </p>

              <p className="text-xs text-gray-500">
                {isPublished
                  ? "This product is visible on your store."
                  : "This product is currently hidden from customers."}
              </p>
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* RIGHT SIDE ACTIONS */}
          {/* --------------------------------------------------------- */}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* ------------------------------------------------------- */}
            {/* DELETE */}
            {/* ------------------------------------------------------- */}

            {onDelete && (
              <button
                type="button"
                onClick={() =>
                  setShowDeleteConfirm(true)
                }
                disabled={busy}
                className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            )}

            {/* ------------------------------------------------------- */}
            {/* CANCEL */}
            {/* ------------------------------------------------------- */}

            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            {/* ------------------------------------------------------- */}
            {/* PUBLISH / UNPUBLISH */}
            {/* ------------------------------------------------------- */}

            {onPublishChange && (
              <button
                type="button"
                onClick={handlePublishToggle}
                disabled={busy}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isPublished
                    ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {isPublished
                  ? "Move to Draft"
                  : "Publish"}
              </button>
            )}

            {/* ------------------------------------------------------- */}
            {/* SAVE */}
            {/* ------------------------------------------------------- */}

            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {/* ------------------------------------------------------- */}
            {/* ICON */}
            {/* ------------------------------------------------------- */}

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
              !
            </div>

            {/* ------------------------------------------------------- */}
            {/* TITLE */}
            {/* ------------------------------------------------------- */}

            <h3 className="mt-4 text-lg font-bold text-gray-900">
              Delete Product?
            </h3>

            {/* ------------------------------------------------------- */}
            {/* DESCRIPTION */}
            {/* ------------------------------------------------------- */}

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This action cannot be undone. The product
              and its related information may be permanently
              removed.
            </p>

            {/* ------------------------------------------------------- */}
            {/* ACTIONS */}
            {/* ------------------------------------------------------- */}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowDeleteConfirm(false)
                }
                disabled={isDeleting}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Product
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}