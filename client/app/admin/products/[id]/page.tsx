"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";

type ProductStatus = "Active" | "Draft" | "Out of Stock" | "Archived";

type ProductForm = {
  sku: string;
  name: string;
  slug: string;
  category: string;
  subCategory: string;
  brand: string;
  shortDescription: string;
  description: string;
  mrp: string;
  price: string;
  stock: string;
  lowStockLimit: string;
  status: ProductStatus;
  thumbnail: string;
  images: string;
  sizes: string;
  colors: string;
  tags: string;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  trending: boolean;
  seoTitle: string;
  seoDescription: string;
};

const emptyForm: ProductForm = {
  sku: "",
  name: "",
  slug: "",
  category: "",
  subCategory: "",
  brand: "SilentGEN",
  shortDescription: "",
  description: "",
  mrp: "",
  price: "",
  stock: "0",
  lowStockLimit: "5",
  status: "Active",
  thumbnail: "",
  images: "",
  sizes: "",
  colors: "",
  tags: "",
  featured: false,
  bestSeller: false,
  newArrival: false,
  trending: false,
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

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoadingProduct(true);
        setError("");

        const response = await fetch(`/api/admin/products/${params.id}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.product) {
          setError(data.message || "Unable to load product.");
          return;
        }

        const product = data.product;

        setForm({
          sku: product.sku || "",
          name: product.name || "",
          slug: product.slug || "",
          category: product.category || "",
          subCategory: product.subCategory || "",
          brand: product.brand || "SilentGEN",
          shortDescription: product.shortDescription || "",
          description: product.description || "",
          mrp: String(product.mrp ?? ""),
          price: String(product.price ?? ""),
          stock: String(product.stock ?? 0),
          lowStockLimit: String(product.lowStockLimit ?? 5),
          status: product.status || "Active",
          thumbnail: product.thumbnail || "",
          images: Array.isArray(product.images)
            ? product.images.join(", ")
            : "",
          sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : "",
          colors: Array.isArray(product.colors)
            ? product.colors.join(", ")
            : "",
          tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
          featured: Boolean(product.featured),
          bestSeller: Boolean(product.bestSeller),
          newArrival: Boolean(product.newArrival),
          trending: Boolean(product.trending),
          seoTitle: product.seoTitle || "",
          seoDescription: product.seoDescription || "",
        });
      } catch {
        setError("Unable to load product. Please try again.");
      } finally {
        setLoadingProduct(false);
      }
    }

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

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

    if (
      !Number.isFinite(mrp) ||
      !Number.isFinite(price) ||
      !Number.isFinite(stock)
    ) {
      setError("MRP, price, and stock must be valid numbers.");
      return;
    }

    if (price > mrp) {
      setError("Selling price cannot be greater than MRP.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "PATCH",
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
        setError(data.message || "Unable to update product.");
        return;
      }

      router.replace("/admin/products");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  if (loadingProduct) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin/products"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
          >
            <ArrowLeft size={18} />
            Back to Products
          </Link>

          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="mt-2 text-gray-500">
            Update your product information.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 rounded-xl border bg-white p-6 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-semibold">
              SKU *
            </label>
            <input
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Product Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => {
                updateField("name", e.target.value);
                updateField("slug", createSlug(e.target.value));
              }}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Slug
            </label>
            <input
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Brand
            </label>
            <input
              value={form.brand}
              onChange={(e) => updateField("brand", e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Category *
            </label>
            <input
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Sub Category
            </label>
            <input
              value={form.subCategory}
              onChange={(e) => updateField("subCategory", e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              MRP *
            </label>
            <input
              type="number"
              value={form.mrp}
              onChange={(e) => updateField("mrp", e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Selling Price *
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Stock
            </label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => updateField("stock", e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Low Stock Limit
            </label>
            <input
              type="number"
              value={form.lowStockLimit}
              onChange={(e) =>
                updateField("lowStockLimit", e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Status
            </label>

            <select
              value={form.status}
              onChange={(e) =>
                updateField("status", e.target.value as ProductStatus)
              }
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Short Description
            </label>

            <textarea
              rows={3}
              value={form.shortDescription}
              onChange={(e) =>
                updateField("shortDescription", e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Description
            </label>

            <textarea
              rows={6}
              value={form.description}
              onChange={(e) =>
                updateField("description", e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Thumbnail URL
            </label>

            <input
              value={form.thumbnail}
              onChange={(e) =>
                updateField("thumbnail", e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Images (comma separated)
            </label>

            <textarea
              rows={3}
              value={form.images}
              onChange={(e) =>
                updateField("images", e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Sizes
            </label>

            <input
              value={form.sizes}
              onChange={(e) =>
                updateField("sizes", e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Colors
            </label>

            <input
              value={form.colors}
              onChange={(e) =>
                updateField("colors", e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Tags
            </label>

            <input
              value={form.tags}
              onChange={(e) =>
                updateField("tags", e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div className="md:col-span-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  updateField("featured", e.target.checked)
                }
              />
              Featured
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.bestSeller}
                onChange={(e) =>
                  updateField("bestSeller", e.target.checked)
                }
              />
              Best Seller
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.newArrival}
                onChange={(e) =>
                  updateField("newArrival", e.target.checked)
                }
              />
              New Arrival
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.trending}
                onChange={(e) =>
                  updateField("trending", e.target.checked)
                }
              />
              Trending
            </label>

          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              SEO Title
            </label>

            <input
              value={form.seoTitle}
              onChange={(e) =>
                updateField("seoTitle", e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              SEO Description
            </label>

            <textarea
              rows={3}
              value={form.seoDescription}
              onChange={(e) =>
                updateField("seoDescription", e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save size={18} />
                Update Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
