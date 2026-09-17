"use client";

type ProductForm = {
  sku: string;
  name: string;
  slug: string;

  shortDescription: string;
  description: string;

  category: string;
  subCategory: string;
  brand: string;
};

type BasicInformationProps = {
  form: ProductForm;
  saving: boolean;

  updateField: <K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K]
  ) => void;

  handleNameChange: (value: string) => void;
};

export default function BasicInformation({
  form,
  saving,
  updateField,
  handleNameChange,
}: BasicInformationProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">
        Basic Information
      </h3>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* SKU */}
        <div>
          <label
            htmlFor="sku"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            SKU *
          </label>

          <input
            id="sku"
            type="text"
            value={form.sku}
            onChange={(event) =>
              updateField("sku", event.target.value)
            }
            disabled={saving}
            placeholder="Example: SG-TSH-001"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>

        {/* PRODUCT NAME */}
        <div>
          <label
            htmlFor="product-name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Product Name *
          </label>

          <input
            id="product-name"
            type="text"
            value={form.name}
            onChange={(event) =>
              handleNameChange(event.target.value)
            }
            disabled={saving}
            placeholder="Example: Premium Cotton T-Shirt"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>

        {/* SLUG */}
        <div>
          <label
            htmlFor="slug"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Product Slug
          </label>

          <input
            id="slug"
            type="text"
            value={form.slug}
            onChange={(event) =>
              updateField("slug", event.target.value)
            }
            disabled={saving}
            placeholder="premium-cotton-t-shirt"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />

          <p className="mt-1.5 text-xs text-gray-500">
            Leave it as generated from the product name, or edit it manually.
          </p>
        </div>

        {/* CATEGORY */}
        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Category *
          </label>

          <input
            id="category"
            type="text"
            value={form.category}
            onChange={(event) =>
              updateField("category", event.target.value)
            }
            disabled={saving}
            placeholder="Example: T-Shirts"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>

        {/* SUB CATEGORY */}
        <div>
          <label
            htmlFor="sub-category"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Sub Category
          </label>

          <input
            id="sub-category"
            type="text"
            value={form.subCategory}
            onChange={(event) =>
              updateField(
                "subCategory",
                event.target.value
              )
            }
            disabled={saving}
            placeholder="Example: Oversized T-Shirts"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>

        {/* BRAND */}
        <div>
          <label
            htmlFor="brand"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Brand
          </label>

          <input
            id="brand"
            type="text"
            value={form.brand}
            onChange={(event) =>
              updateField("brand", event.target.value)
            }
            disabled={saving}
            placeholder="SilentGEN"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* SHORT DESCRIPTION */}
      <div className="mt-5">
        <label
          htmlFor="short-description"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Short Description
        </label>

        <textarea
          id="short-description"
          value={form.shortDescription}
          onChange={(event) =>
            updateField(
              "shortDescription",
              event.target.value
            )
          }
          rows={2}
          placeholder="Short product description..."
          disabled={saving}
          className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
        />
      </div>

      {/* FULL DESCRIPTION */}
      <div className="mt-5">
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Full Description
        </label>

        <textarea
          id="description"
          value={form.description}
          onChange={(event) =>
            updateField(
              "description",
              event.target.value
            )
          }
          rows={6}
          placeholder="Write complete product description..."
          disabled={saving}
          className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
        />
      </div>
    </section>
  );
}