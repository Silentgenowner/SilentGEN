"use client";

type SEOData = {
  title: string;
  description: string;
  keywords: string;
};

type SEOEditorProps = {
  seo: SEOData;

  onChange: (seo: SEOData) => void;
};

export default function SEOEditor({
  seo,
  onChange,
}: SEOEditorProps) {
  const safeSEO: SEOData = {
    title: seo?.title ?? "",
    description: seo?.description ?? "",
    keywords: seo?.keywords ?? "",
  };

  const updateField = (
    field: keyof SEOData,
    value: string
  ) => {
    onChange({
      ...safeSEO,
      [field]: value,
    });
  };

  const titleLength = safeSEO.title.length;
  const descriptionLength =
    safeSEO.description.length;

  const titleStatus =
    titleLength === 0
      ? "empty"
      : titleLength < 30
        ? "short"
        : titleLength <= 60
          ? "good"
          : "long";

  const descriptionStatus =
    descriptionLength === 0
      ? "empty"
      : descriptionLength < 120
        ? "short"
        : descriptionLength <= 160
          ? "good"
          : "long";

  const getStatusText = (
    status:
      | "empty"
      | "short"
      | "good"
      | "long"
  ) => {
    switch (status) {
      case "empty":
        return "Required";

      case "short":
        return "Too short";

      case "good":
        return "Good length";

      case "long":
        return "Too long";

      default:
        return "";
    }
  };

  const getStatusClass = (
    status:
      | "empty"
      | "short"
      | "good"
      | "long"
  ) => {
    switch (status) {
      case "empty":
        return "text-red-500";

      case "short":
        return "text-amber-500";

      case "good":
        return "text-green-600";

      case "long":
        return "text-red-500";

      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* ------------------------------------------------------------- */}
      {/* HEADER */}
      {/* ------------------------------------------------------------- */}

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
            SEO
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900">
              SEO Settings
            </h3>

            <p className="mt-0.5 text-sm text-gray-500">
              Optimize your product page for search engines.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* ------------------------------------------------------------- */}
        {/* SEO TITLE */}
        {/* ------------------------------------------------------------- */}

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="seo-title"
              className="text-sm font-semibold text-gray-800"
            >
              SEO Title
            </label>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${getStatusClass(
                  titleStatus
                )}`}
              >
                {getStatusText(titleStatus)}
              </span>

              <span className="text-xs text-gray-400">
                {titleLength}/60
              </span>
            </div>
          </div>

          <input
            id="seo-title"
            type="text"
            value={safeSEO.title}
            maxLength={60}
            onChange={(e) =>
              updateField(
                "title",
                e.target.value
              )
            }
            placeholder="SilentGEN | Premium Fashion"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-1 ${
              titleStatus === "long"
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-200 focus:border-gray-900 focus:ring-gray-900"
            }`}
          />

          <p className="mt-1.5 text-xs text-gray-400">
            Recommended length: 50–60
            characters.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SEO DESCRIPTION */}
        {/* ------------------------------------------------------------- */}

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="seo-description"
              className="text-sm font-semibold text-gray-800"
            >
              SEO Description
            </label>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${getStatusClass(
                  descriptionStatus
                )}`}
              >
                {getStatusText(
                  descriptionStatus
                )}
              </span>

              <span className="text-xs text-gray-400">
                {descriptionLength}/160
              </span>
            </div>
          </div>

          <textarea
            id="seo-description"
            value={safeSEO.description}
            maxLength={160}
            rows={4}
            onChange={(e) =>
              updateField(
                "description",
                e.target.value
              )
            }
            placeholder="Discover premium fashion from SilentGEN. Shop premium clothing, t-shirts and more."
            className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-1 ${
              descriptionStatus === "long"
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-200 focus:border-gray-900 focus:ring-gray-900"
            }`}
          />

          <p className="mt-1.5 text-xs text-gray-400">
            Recommended length: 140–160
            characters.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* KEYWORDS */}
        {/* ------------------------------------------------------------- */}

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="seo-keywords"
              className="text-sm font-semibold text-gray-800"
            >
              Keywords
            </label>

            <span className="text-xs text-gray-400">
              Optional
            </span>
          </div>

          <input
            id="seo-keywords"
            type="text"
            value={safeSEO.keywords}
            onChange={(e) =>
              updateField(
                "keywords",
                e.target.value
              )
            }
            placeholder="fashion, premium clothing, t-shirts, SilentGEN"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />

          <p className="mt-1.5 text-xs text-gray-400">
            Separate keywords using commas.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SEARCH PREVIEW */}
      {/* ------------------------------------------------------------- */}

      <div className="mt-7 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Google Search Preview
          </p>

          <span className="text-[11px] text-gray-400">
            Preview
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">
            silentgen.com
          </div>

          <div className="mt-1 truncate text-lg font-medium text-blue-700">
            {safeSEO.title ||
              "SilentGEN | Premium Fashion"}
          </div>

          <div className="mt-1 line-clamp-2 text-sm leading-5 text-gray-600">
            {safeSEO.description ||
              "Discover premium fashion from SilentGEN."}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SEO CHECKLIST */}
      {/* ------------------------------------------------------------- */}

      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-gray-900">
          SEO Checklist
        </p>

        <div className="space-y-2">
          <ChecklistItem
            checked={titleLength >= 30}
            text="SEO title has enough content"
          />

          <ChecklistItem
            checked={
              titleLength >= 50 &&
              titleLength <= 60
            }
            text="SEO title is within recommended length"
          />

          <ChecklistItem
            checked={descriptionLength >= 120}
            text="SEO description has enough content"
          />

          <ChecklistItem
            checked={
              descriptionLength >= 140 &&
              descriptionLength <= 160
            }
            text="SEO description is within recommended length"
          />

          <ChecklistItem
            checked={safeSEO.keywords.trim().length > 0}
            text="Keywords are added"
            optional
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CHECKLIST ITEM */
/* -------------------------------------------------------------------------- */

function ChecklistItem({
  checked,
  text,
  optional = false,
}: {
  checked: boolean;
  text: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          checked
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {checked ? "✓" : "–"}
      </div>

      <span
        className={`text-xs ${
          checked
            ? "text-gray-700"
            : "text-gray-400"
        }`}
      >
        {text}
        {optional && (
          <span className="ml-1 text-gray-400">
            (optional)
          </span>
        )}
      </span>
    </div>
  );
}