"use client";

type ProductStatus =
  | "Active"
  | "Draft"
  | "Out of Stock"
  | "Archived";

type PricingForm = {
  mrp: string;
  price: string;
  stock: string;
  lowStockLimit: string;
  status: ProductStatus;
};

type PricingInventoryProps = {
  form: PricingForm;
  saving: boolean;

  updateField: <K extends keyof PricingForm>(
    field: K,
    value: PricingForm[K]
  ) => void;
};

export default function PricingInventory({
  form,
  saving,
  updateField,
}: PricingInventoryProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">
        Pricing and Inventory
      </h3>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* MRP */}
        <div>
          <label
            htmlFor="mrp"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            MRP (₹) *
          </label>

          <input
            id="mrp"
            type="number"
            min="0"
            step="1"
            value={form.mrp}
            onChange={(event) =>
              updateField("mrp", event.target.value)
            }
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>

        {/* SELLING PRICE */}
        <div>
          <label
            htmlFor="price"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Selling Price (₹) *
          </label>

          <input
            id="price"
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(event) =>
              updateField("price", event.target.value)
            }
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>

        {/* STOCK */}
        <div>
          <label
            htmlFor="stock"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Available Stock
          </label>

          <input
            id="stock"
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(event) =>
              updateField("stock", event.target.value)
            }
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>

        {/* LOW STOCK LIMIT */}
        <div>
          <label
            htmlFor="low-stock-limit"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Low Stock Alert At
          </label>

          <input
            id="low-stock-limit"
            type="number"
            min="0"
            step="1"
            value={form.lowStockLimit}
            onChange={(event) =>
              updateField(
                "lowStockLimit",
                event.target.value
              )
            }
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />
        </div>

        {/* STATUS */}
        <div className="md:col-span-2">
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Product Status
          </label>

          <select
            id="status"
            value={form.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value as ProductStatus
              )
            }
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          >
            <option value="Active">
              Active
            </option>

            <option value="Draft">
              Draft
            </option>

            <option value="Out of Stock">
              Out of Stock
            </option>

            <option value="Archived">
              Archived
            </option>
          </select>
        </div>
      </div>
    </section>
  );
}