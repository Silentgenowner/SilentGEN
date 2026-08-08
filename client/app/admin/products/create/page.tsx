"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";

type ProductStatus = "Active" | "Draft" | "Out of Stock" | "Archived";

type ProductForm = {
  sku: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  subCategory: string;
  brand: string;
  gender: "Men" | "Women" | "Kids" | "Unisex";
  fabric: string;
  fit: string;
  mrp: string;
  price: string;
  stock: string;
  lowStockLimit: string;
  thumbnail: string;
  images: string;
  sizes: string;
  colors: string;
  tags: string;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  trending: boolean;
  status: ProductStatus;
  seoTitle: string;
  seoDescription: string;
};

const initialForm: ProductForm = {
  sku: "",
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  category: "",
  subCategory: "",
  brand: "SilentGEN",
  gender: "Unisex",
  fabric: "",
  fit: "",
  mrp: "",
  price: "",
  stock: "0",
  lowStockLimit: "5",
  thumbnail: "",
  images: "",
  sizes: "",
  colors: "",
  tags: "",
  featured: false,
  bestSeller: false,
  newArrival: false,
  trending: false,
  status: "Active",
  seoTitle: "",
  seoDescription: "",
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function textToArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function CreateProductPage() {
  const router = useRouter();

  const [form, setForm] = useState<ProductForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function handleNameChange(value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      name: value,
      slug: currentForm.slug || createSlug(value),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !form.sku.trim() ||
      !form.name.trim() ||
      !form.category.trim() ||
      !form.mrp ||
      !form.price
    ) {
      setError("SKU, name, category, MRP, and selling price are required.");
      return;
    }

    const mrp = Number(form.mrp);
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!Number.isFinite(mrp) || !Number.isFinite(price) || !Number.isFinite(stock)) {
      setError("MRP, price, and stock must be valid numbers.");
      return;
    }

    if (price > mrp) {
      setError("Selling price cannot be greater than MRP.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          sku: form.sku.trim().toUpperCase(),
          name: form.name.trim(),
          slug: createSlug(form.slug || form.name),
          category: form.category.trim(),
          subCategory: form.subCategory.trim(),
          brand: form.brand.trim() || "SilentGEN",
          mrp,
          price,
          stock,
          lowStockLimit: Number(form.lowStockLimit) || 5,
          thumbnail: form.thumbnail.trim(),
          images: textToArray(form.images),
          sizes: textToArray(form.sizes),
          colors: textToArray(form.colors),
          tags: textToArray(form.tags),
          seoTitle: form.seoTitle.trim(),
          seoDescription: form.seoDescription.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create product.");
        return;
      }

      router.replace("/admin/products");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  
  
     return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black"
          >
            <ArrowLeft size={17} />
            Back to Products
          </Link>

          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            Add New Product
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Add product details, pricing, inventory, images, and SEO settings.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                Basic Information
              </h3>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
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
                    onChange={(event) => updateField("sku", event.target.value)}
                    placeholder="Example: SG-TSHIRT-001"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

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
                    onChange={(event) => handleNameChange(event.target.value)}
                    placeholder="Example: Classic Cotton T-Shirt"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

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
                    onChange={(event) => updateField("slug", event.target.value)}
                    placeholder="classic-cotton-t-shirt"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

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
                    placeholder="Example: T-Shirts"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

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
                      updateField("subCategory", event.target.value)
                    }
                    placeholder="Example: Oversized T-Shirts"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

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
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>
              </div>

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
                    updateField("shortDescription", event.target.value)
                  }
                  rows={2}
                  placeholder="Short summary shown on product cards..."
                  disabled={loading}
                  className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />
              </div>

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
                    updateField("description", event.target.value)
                  }
                  rows={6}
                  placeholder="Write complete product details..."
                  disabled={loading}
                  className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                Pricing and Inventory
              </h3>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
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
                    step="0.01"
                    value={form.mrp}
                    onChange={(event) => updateField("mrp", event.target.value)}
                    placeholder="0"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

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
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      updateField("price", event.target.value)
                    }
                    placeholder="0"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stock"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Available Stock *
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
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

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
                      updateField("lowStockLimit", event.target.value)
                    }
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

                <div>
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
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
                      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                Product Details
              </h3>

              <div className="mt-5 space-y-5">
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
                        event.target.value as ProductForm["gender"]
                      )
                    }
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>

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
                      updateField("fabric", event.target.value)
                    }
                    placeholder="Example: 100% Cotton"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

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
                    onChange={(event) => updateField("fit", event.target.value)}
                    placeholder="Example: Oversized"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

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
                      updateField("sizes", event.target.value)
                    }
                    placeholder="S, M, L, XL"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

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
                      updateField("colors", event.target.value)
                    }
                    placeholder="Black, White, Navy Blue"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Images</h3>

              <div className="mt-5 space-y-5">
                <div>
                  <label
                    htmlFor="thumbnail"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Thumbnail URL
                  </label>

                  <input
                    id="thumbnail"
                    type="url"
                    value={form.thumbnail}
                    onChange={(event) =>
                      updateField("thumbnail", event.target.value)
                    }
                    placeholder="https://example.com/product.jpg"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="images"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Additional Image URLs
                  </label>

                  <textarea
                    id="images"
                    value={form.images}
                    onChange={(event) =>
                      updateField("images", event.target.value)
                    }
                    rows={3}
                    placeholder="Paste comma-separated image URLs"
                    disabled={loading}
                    className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Add multiple image URLs separated with commas.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                Visibility and Tags
              </h3>

              <div className="mt-5">
                <label
                  htmlFor="tags"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Search Tags
                </label>

                <input
                  id="tags"
                  type="text"
                  value={form.tags}
                  onChange={(event) => updateField("tags", event.target.value)}
                  placeholder="cotton, t-shirt, casual"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />
              </div>

              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      updateField("featured", event.target.checked)
                    }
                    disabled={loading}
                    className="h-4 w-4 accent-black"
                  />
                  Featured Product
                </label>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.bestSeller}
                    onChange={(event) =>
                      updateField("bestSeller", event.target.checked)
                    }
                    disabled={loading}
                    className="h-4 w-4 accent-black"
                  />
                  Best Seller
                </label>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.newArrival}
                    onChange={(event) =>
                      updateField("newArrival", event.target.checked)
                    }
                    disabled={loading}
                    className="h-4 w-4 accent-black"
                  />
                  New Arrival
                </label>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.trending}
                    onChange={(event) =>
                      updateField("trending", event.target.checked)
                    }
                    disabled={loading}
                    className="h-4 w-4 accent-black"
                  />
                  Trending Product
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">SEO</h3>

              <div className="mt-5 space-y-5">
                <div>
                  <label
                    htmlFor="seo-title"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    SEO Title
                  </label>

                  <input
                    id="seo-title"
                    type="text"
                    value={form.seoTitle}
                    onChange={(event) =>
                      updateField("seoTitle", event.target.value)
                    }
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="seo-description"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    SEO Description
                  </label>

                  <textarea
                    id="seo-description"
                    value={form.seoDescription}
                    onChange={(event) =>
                      updateField("seoDescription", event.target.value)
                    }
                    rows={3}
                    disabled={loading}
                    className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Creating Product..." : "Create Product"}
                {!loading && <Save size={18} />}
              </button>

                            <Link
                href="/admin/products"
                className="flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
