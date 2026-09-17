"use client";

type SectionVisibilityProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
};

export default function SectionVisibility({
  enabled,
  onChange,
  disabled = false,
}: SectionVisibilityProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          Section Visibility
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Control whether this section appears on the homepage.
        </p>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 rounded-full transition ${
          enabled ? "bg-black" : "bg-gray-300"
        } ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }`}
        aria-label={
          enabled
            ? "Disable section"
            : "Enable section"
        }
        aria-pressed={enabled}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}