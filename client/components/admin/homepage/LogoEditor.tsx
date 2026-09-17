"use client";

import SectionVisibility from "./SectionVisibility";

type LogoData = {
  enabled?: boolean;
  url?: string;
  alt?: string;
  title?: string;
};

type LogoEditorProps = {
  logo?: LogoData;
  onChange: (logo: LogoData) => void;
};

export default function LogoEditor({
  logo,
  onChange,
}: LogoEditorProps) {
  const data = logo || {};

  function updateLogo(
    key: keyof LogoData,
    value: string | boolean
  ) {
    onChange({
      ...data,
      [key]: value,
    });
  }

  return (
    <div className="space-y-6">
      <SectionVisibility
        enabled={data.enabled ?? true}
        onChange={(enabled) =>
          updateLogo("enabled", enabled)
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">
            Website Logo
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Manage the main SilentGEN logo used on the
            homepage.
          </p>
        </div>

        <div className="space-y-5">
          {/* LOGO URL */}
          <div>
            <label
              htmlFor="logo-url"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Logo Image URL
            </label>

            <input
              id="logo-url"
              type="text"
              value={data.url || ""}
              onChange={(e) =>
                updateLogo("url", e.target.value)
              }
              placeholder="https://example.com/logo.png"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black"
            />

            <p className="mt-1.5 text-xs text-gray-500">
              Enter the uploaded logo image URL.
            </p>
          </div>

          {/* ALT */}
          <div>
            <label
              htmlFor="logo-alt"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Alt Text
            </label>

            <input
              id="logo-alt"
              type="text"
              value={data.alt || ""}
              onChange={(e) =>
                updateLogo("alt", e.target.value)
              }
              placeholder="SilentGEN"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black"
            />
          </div>

          {/* TITLE */}
          <div>
            <label
              htmlFor="logo-title"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Logo Title
            </label>

            <input
              id="logo-title"
              type="text"
              value={data.title || ""}
              onChange={(e) =>
                updateLogo("title", e.target.value)
              }
              placeholder="SilentGEN"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black"
            />
          </div>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Logo Preview
        </p>

        <div className="flex min-h-28 items-center justify-center rounded-xl border border-gray-200 bg-white p-6">
          {data.url ? (
            <img
              src={data.url}
              alt={data.alt || "SilentGEN"}
              title={data.title || "SilentGEN"}
              className="max-h-20 max-w-[220px] object-contain"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          ) : (
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">
                SilentGEN
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Add a logo URL to preview the image.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}