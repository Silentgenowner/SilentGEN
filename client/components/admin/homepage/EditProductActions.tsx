"use client";

type EditProductActionsProps = {
  saving?: boolean;
  onSave: () => void;
  onReset?: () => void;
  saveText?: string;
};

export default function EditProductActions({
  saving = false,
  onSave,
  onReset,
  saveText = "Save Homepage",
}: EditProductActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset
        </button>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : saveText}
      </button>
    </div>
  );
}