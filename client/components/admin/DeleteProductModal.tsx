"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

type DeleteProductModalProps = {
  open: boolean;
  productName: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function DeleteProductModal({
  open,
  productName,
  loading,
  onClose,
  onConfirm,
}: DeleteProductModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle
                className="text-red-600"
                size={24}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Archive Product
              </h2>

              <p className="text-sm text-gray-500">
                This action can be restored later.
              </p>
            </div>
          </div>

          <button
            disabled={loading}
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
                <div className="px-6 py-6">
          <p className="text-gray-700">
            Are you sure you want to archive this product?
          </p>

          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-gray-500">
              Product
            </p>

            <p className="mt-1 break-words font-semibold text-gray-900">
              {productName}
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <h3 className="font-semibold text-yellow-800">
              What will happen?
            </h3>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-yellow-700">
              <li>
                Product will be marked as
                <strong> Archived</strong>.
              </li>

              <li>
                Customers will no longer see this product
                on the website.
              </li>

              <li>
                Existing orders will remain unchanged.
              </li>

              <li>
                Images and product data will remain safely
                stored.
              </li>

              <li>
                You can restore this product anytime from
                the Archived list.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Archiving...
              </>
            ) : (
              <>
                <Trash2 size={18} />
                Archive Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}