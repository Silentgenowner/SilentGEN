"use client";

type Gender =
  | "Men"
  | "Women"
  | "Kids"
  | "Unisex";

type ProductDetailsForm = {
  gender: Gender;
  fabric: string;
  fit: string;
  sizes: string;
  colors: string;
};

type ProductDetailsProps = {
  form: ProductDetailsForm;
  saving: boolean;

  updateField: <K extends keyof ProductDetailsForm>(
    field: K,
    value: ProductDetailsForm[K]
  ) => void;
};

export default function ProductDetails({
  form,
  saving,
  updateField,
}: ProductDetailsProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">
        Product Details
      </h3>

      <div className="mt-5 space-y-5">
        {/* GENDER */}
        <div>
          <label
            htmlFor="gender"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Gender
          </label>

          <select
            id="gender"
            value={form.gender}
            onChange={(event) =>
              updateField(
                "gender",
                event.target.value as Gender
              )
            }
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          >
            <option value="Unisex">
              Unisex
            </option>

            <option value="Men">
              Men
            </option>

            <option value="Women">
              Women
            </option>

            <option value="Kids">
              Kids
            </option>
          </select>
        </div>

        {/* FABRIC */}
        <div>
          <label
            htmlFor="fabric"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Fabric
          </label>

          <input
            id="fabric"
            type="text"
            value={form.fabric}
            onChange={(event) =>
              updateField(
                "fabric",
                event.target.value
              )
            }
            placeholder="Example: 100% Cotton"
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>

        {/* FIT */}
        <div>
          <label
            htmlFor="fit"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Fit
          </label>

          <input
            id="fit"
            type="text"
            value={form.fit}
            onChange={(event) =>
              updateField(
                "fit",
                event.target.value
              )
            }
            placeholder="Example: Oversized"
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>

        {/* SIZES */}
        <div>
          <label
            htmlFor="sizes"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Sizes
          </label>

          <input
            id="sizes"
            type="text"
            value={form.sizes}
            onChange={(event) =>
              updateField(
                "sizes",
                event.target.value
              )
            }
            placeholder="S, M, L, XL"
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />

          <p className="mt-2 text-xs text-gray-500">
            Enter sizes separated by commas.
          </p>
        </div>

        {/* COLORS */}
        <div>
          <label
            htmlFor="colors"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Colors
          </label>

          <input
            id="colors"
            type="text"
            value={form.colors}
            onChange={(event) =>
              updateField(
                "colors",
                event.target.value
              )
            }
            placeholder="Black, White, Navy Blue"
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />

          <p className="mt-2 text-xs text-gray-500">
            Add colors here and configure their
            images below.
          </p>
        </div>
      </div>
    </section>
  );
}