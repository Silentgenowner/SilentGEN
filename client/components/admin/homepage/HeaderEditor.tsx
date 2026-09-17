"use client";

import SectionVisibility from "./SectionVisibility";

type HeaderData = {
  enabled?: boolean;
  showSearch?: boolean;
  showAccount?: boolean;
  showWishlist?: boolean;
  showCart?: boolean;
};

type HeaderEditorProps = {
  homepage: {
    header?: HeaderData;
  };
  onChange: (header: HeaderData) => void;
};

export default function HeaderEditor({
  homepage,
  onChange,
}: HeaderEditorProps) {
  const header = homepage.header || {};

  function updateHeader(
    key: keyof HeaderData,
    value: boolean
  ) {
    onChange({
      ...header,
      [key]: value,
    });
  }

  return (
    <div className="space-y-6">
      <SectionVisibility
        enabled={header.enabled ?? true}
        onChange={(enabled) =>
          updateHeader("enabled", enabled)
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">
            Header Settings
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Choose which header features should be visible
            on your website.
          </p>
        </div>

        <div className="space-y-3">
          <SettingRow
            title="Search"
            description="Show search option in the website header."
            enabled={header.showSearch ?? true}
            onChange={(value) =>
              updateHeader("showSearch", value)
            }
          />

          <SettingRow
            title="Account"
            description="Show customer account/login option."
            enabled={header.showAccount ?? true}
            onChange={(value) =>
              updateHeader("showAccount", value)
            }
          />

          <SettingRow
            title="Wishlist"
            description="Show wishlist icon in the header."
            enabled={header.showWishlist ?? true}
            onChange={(value) =>
              updateHeader("showWishlist", value)
            }
          />

          <SettingRow
            title="Cart"
            description="Show shopping cart icon in the header."
            enabled={header.showCart ?? true}
            onChange={(value) =>
              updateHeader("showCart", value)
            }
          />
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-900">
          Header Preview
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {header.showSearch ?? true ? (
            <PreviewItem text="Search" />
          ) : null}

          {header.showAccount ?? true ? (
            <PreviewItem text="Account" />
          ) : null}

          {header.showWishlist ?? true ? (
            <PreviewItem text="Wishlist" />
          ) : null}

          {header.showCart ?? true ? (
            <PreviewItem text="Cart" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled ? "bg-black" : "bg-gray-300"
        }`}
        aria-label={`Toggle ${title}`}
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

function PreviewItem({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">
      {text}
    </span>
  );
}