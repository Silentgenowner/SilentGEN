"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";

type ProductStatus =
  | "Active"
  | "Draft"
  | "Out of Stock"
  | "Archived";

type Product = {
  _id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  mrp: number;
  stock: number;
  thumbnail: string;
  images: string[];
  status: ProductStatus;
  createdAt: string;
};

type ProductsResponse = {
  success: boolean;
  message?: string;
  products?: Product[];
  categories?: string[];
  pagination?: {
    page: number;
    limit: number;
    totalProducts: number;
    totalPages: number;
  };
};

const statusClasses: Record<ProductStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Draft: "bg-gray-100 text-gray-700",
  "Out of Stock": "bg-orange-100 text-orange-700",
  Archived: "bg-red-100 text-red-700",
};

export default function AdminProductsPage() {

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Single Delete

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  // Bulk Delete

  const [selectedProducts, setSelectedProducts] =
    useState<string[]>([]);

  const [bulkDeleteOpen, setBulkDeleteOpen] =
    useState(false);

  const [bulkDeleteLoading, setBulkDeleteLoading] =
    useState(false);
useEffect(() => {
  const controller = new AbortController();

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        sort,
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (category) {
        params.set("category", category);
      }

      if (status) {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/admin/products?${params.toString()}`,
        {
          cache: "no-store",
          signal: controller.signal,
        }
      );

      const data: ProductsResponse =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to load products."
        );
        return;
      }

      setProducts(data.products || []);
      setCategories(data.categories || []);
      setTotalProducts(
        data.pagination?.totalProducts || 0
      );
      setTotalPages(
        data.pagination?.totalPages || 1
      );
    } catch (error) {
      if (
        (error as Error).name !== "AbortError"
      ) {
        setError(
          "Unable to load products."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const timer = setTimeout(
    fetchProducts,
    300
  );

  return () => {
    controller.abort();
    clearTimeout(timer);
  };
}, [
  page,
  search,
  category,
  status,
  sort,
]);

function getProductImage(
  product: Product
) {
  return (
    product.thumbnail ||
    product.images?.[0] ||
    ""
  );
}

function resetFilters() {
  setSearch("");
  setCategory("");
  setStatus("");
  setSort("newest");
  setPage(1);
}

function toggleProduct(id: string) {
  setSelectedProducts((prev) =>
    prev.includes(id)
      ? prev.filter(
          (item) => item !== id
        )
      : [...prev, id]
  );
}

function toggleSelectAll() {
  if (
    selectedProducts.length ===
    products.length
  ) {
    setSelectedProducts([]);
    return;
  }

  setSelectedProducts(
    products.map((item) => item._id)
  );
}

async function downloadTemplate() {
  try {
    const response = await fetch(
      "/api/admin/products/template"
    );

    if (!response.ok) {
      alert(
        "Unable to download template."
      );
      return;
    }

    const blob =
      await response.blob();

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "SilentGEN_Product_Template.xlsx";

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch {
    alert(
      "Unable to download template."
    );
  }
}

async function deleteProduct() {
  if (!selectedProduct) return;

  try {
    setDeleteLoading(true);

    const response = await fetch(
      `/api/admin/products/${selectedProduct._id}`,
      {
        method: "DELETE",
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      alert(
        data.message ||
          "Delete failed."
      );
      return;
    }

    setProducts((prev) =>
      prev.filter(
        (item) =>
          item._id !==
          selectedProduct._id
      )
    );

    setDeleteOpen(false);
    setSelectedProduct(null);

    alert(
      "Product deleted successfully."
    );
  } catch {
    alert("Something went wrong.");
  } finally {
    setDeleteLoading(false);
  }
}

async function bulkDeleteProducts() {
  if (
    selectedProducts.length === 0
  )
    return;

  try {
    setBulkDeleteLoading(true);

    const response = await fetch(
      "/api/admin/products/bulk-delete",
      {
        method: "DELETE",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          ids: selectedProducts,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      alert(
        data.message ||
          "Bulk delete failed."
      );
      return;
    }

    setProducts((prev) =>
      prev.filter(
        (item) =>
          !selectedProducts.includes(
            item._id
          )
      )
    );

    setSelectedProducts([]);

    setBulkDeleteOpen(false);

    alert(
      "Products deleted successfully."
    );
  } catch {
    alert("Something went wrong.");
  } finally {
    setBulkDeleteLoading(false);
  }
}

return (
<div className="mx-auto max-w-7xl space-y-6">

  {/* Header */}

  <section className="flex flex-col gap-4 rounded-2xl bg-black p-6 text-white sm:flex-row sm:items-center sm:justify-between">

    <div>

      <div className="flex items-center gap-2 text-gray-300">
        <Package size={18} />
        <span className="text-sm font-medium">
          Catalog Management
        </span>
      </div>

      <h2 className="mt-2 text-3xl font-bold">
        Products
      </h2>

      <p className="mt-2 text-sm text-gray-300">
        Manage products, stock, pricing,
        import, update and delete.
      </p>

    </div>

    <div className="flex flex-wrap gap-3">

      <button
        type="button"
        onClick={downloadTemplate}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 font-semibold text-black hover:bg-gray-200"
      >
        <Download size={18} />
        Download Template
      </button>

      <Link
        href="/admin/products/import"
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700"
      >
        <FileSpreadsheet size={18} />
        Bulk Import
      </Link>

      <Link
        href="/admin/products/update"
        className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2.5 font-semibold text-black hover:bg-yellow-400"
      >
        <FileSpreadsheet size={18} />
        Bulk Update
      </Link>
      
      <Link
        href="/admin/products/trash"
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700"
 >
       <Trash2 size={18} />
       Trash
      </Link>

      <Link
        href="/admin/products/create"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
      >
        <Plus size={18} />
        Add Product
      </Link>

    </div>

  </section>

  {/* Bulk Delete Toolbar */}

  {selectedProducts.length > 0 && (

    <section className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">

      <p className="font-semibold text-red-700">
        {selectedProducts.length} Product
        Selected
      </p>

      <div className="flex gap-3">

        <button
          type="button"
          onClick={() =>
            setSelectedProducts([])
          }
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold hover:bg-gray-100"
        >
          Clear Selection
        </button>

        <button
          type="button"
          onClick={() =>
            setBulkDeleteOpen(true)
          }
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          <Trash2 size={17} />
          Delete Selected
        </button>

      </div>

    </section>

  )}

  {/* Filters */}

  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

    <div className="flex items-center gap-2">

      <SlidersHorizontal
        size={19}
      />

      <h3 className="font-bold">
        Filters
      </h3>

    </div>

    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">

      <div className="relative">

        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search Product..."
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4"
        />

      </div>

      <select
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          setPage(1);
        }}
        className="rounded-lg border border-gray-300 px-3 py-2.5"
      >

        <option value="">
          All Categories
        </option>

        {categories.map((cat) => (

          <option
            key={cat}
            value={cat}
          >
            {cat}
          </option>

        ))}

      </select>

      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
        className="rounded-lg border border-gray-300 px-3 py-2.5"
      >

        <option value="">
          All Status
        </option>

        <option value="Active">
          Active
        </option>

        <option value="Draft">
          Draft
        </option>

        <option value="Out of Stock">
          Out Of Stock
        </option>

        <option value="Archived">
          Archived
        </option>

      </select>

      <select
        value={sort}
        onChange={(e) => {
          setSort(e.target.value);
          setPage(1);
        }}
        className="rounded-lg border border-gray-300 px-3 py-2.5"
      >

        <option value="newest">
          Newest
        </option>

        <option value="oldest">
          Oldest
        </option>

        <option value="name_a_to_z">
          Name A-Z
        </option>

        <option value="price_low_to_high">
          Price Low-High
        </option>

        <option value="price_high_to_low">
          Price High-Low
        </option>

      </select>

    </div>

    {(search ||
      category ||
      status ||
      sort !== "newest") && (

      <button
        type="button"
        onClick={resetFilters}
        className="mt-4 font-semibold text-black hover:underline"
      >
        Clear Filters
      </button>

    )}

  </section>
{error && (
  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
    {error}
  </div>
)}

<section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

  <div className="border-b border-gray-200 p-6">

    <h3 className="text-lg font-bold">
      All Products
    </h3>

    <p className="mt-1 text-sm text-gray-500">
      {totalProducts} Products Found
    </p>

  </div>

  {loading ? (

    <div className="flex min-h-[350px] items-center justify-center">

      <div className="flex items-center gap-3 text-gray-600">

        <Loader2
          size={22}
          className="animate-spin"
        />

        <span>
          Loading Products...
        </span>

      </div>

    </div>

  ) : products.length === 0 ? (

    <div className="flex min-h-[350px] flex-col items-center justify-center">

      <Package
        size={50}
        className="text-gray-300"
      />

      <h3 className="mt-5 text-xl font-bold">
        No Products Found
      </h3>

      <p className="mt-2 text-gray-500">
        Add products or import using Excel.
      </p>

    </div>

  ) : (

    <div className="overflow-x-auto">

      <table className="w-full min-w-[980px]">

        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">

          <tr>

            <th className="px-6 py-4">

              <div className="flex items-center gap-3">

                <input
                  type="checkbox"
                  checked={
                    products.length > 0 &&
                    selectedProducts.length ===
                      products.length
                  }
                  onChange={toggleSelectAll}
                  className="h-4 w-4"
                />

                Product

              </div>

            </th>

            <th className="px-6 py-4">
              Category
            </th>

            <th className="px-6 py-4">
              Price
            </th>

            <th className="px-6 py-4">
              Stock
            </th>

            <th className="px-6 py-4">
              Status
            </th>

            <th className="px-6 py-4 text-center">
              Actions
            </th>

          </tr>

        </thead>

        <tbody className="divide-y divide-gray-100">

          {products.map((product) => {

            const image =
              getProductImage(product);

            return (

              <tr
                key={product._id}
                className="hover:bg-gray-50 transition"
              >

                <td className="px-6 py-4">

                  <div className="flex items-center gap-3">

                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(
                        product._id
                      )}
                      onChange={() =>
                        toggleProduct(product._id)
                      }
                      className="h-4 w-4"
                    />

                    {image ? (

                      <img
                        src={image}
                        alt={product.name}
                        className="h-14 w-14 rounded-lg border object-cover"
                      />

                    ) : (

                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100">

                        <Package
                          size={22}
                          className="text-gray-400"
                        />

                      </div>

                    )}

                    <div>

                      <p className="max-w-xs truncate font-semibold text-gray-900">
                        {product.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        SKU : {product.sku}
                      </p>

                    </div>

                  </div>

                </td>

                <td className="px-6 py-4">

                  <p className="font-medium">
                    {product.category}
                  </p>

                  <p className="text-xs text-gray-500">
                    {product.brand || "SilentGEN"}
                  </p>

                </td>

                <td className="px-6 py-4">

                  <p className="font-semibold">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                  </p>

                  {product.mrp >
                    product.price && (

                    <p className="text-xs text-gray-400 line-through">
                      ₹{Number(product.mrp).toLocaleString("en-IN")}
                    </p>

                  )}

                </td>

                <td className="px-6 py-4">

                  <span
                    className={`font-semibold ${
                      product.stock <= 0
                        ? "text-red-600"
                        : product.stock <= 5
                        ? "text-orange-600"
                        : "text-green-700"
                    }`}
                  >
                    {product.stock} Units
                  </span>

                </td>

                <td className="px-6 py-4">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[product.status]}`}
                  >
                    {product.status}
                  </span>

                </td>

                <td className="px-6 py-4">

                  <div className="flex items-center justify-center gap-2">

                    <Link
                      href={`/admin/products/${product._id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <Pencil size={15} />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(product);
                        setDeleteOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>

                  </div>

                </td>

              </tr>

            );

          })}

        </tbody>

      </table>

    </div>

  )}
{/* Pagination */}

{!loading &&
  products.length > 0 &&
  totalPages > 1 && (

    <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

      <p className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-2">

        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => setPage((prev) => prev + 1)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight size={16} />
        </button>

      </div>

    </div>

)}

</section>

{/* ========================= */}
{/* Single Delete Modal */}
{/* ========================= */}

{deleteOpen && selectedProduct && (

<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

<div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

<div className="flex items-center justify-between border-b p-5">

<div className="flex items-center gap-3">

<AlertTriangle
size={28}
className="text-red-600"
/>

<div>

<h2 className="text-xl font-bold">
Delete Product
</h2>

<p className="text-sm text-gray-500">
This action cannot be undone.
</p>

</div>

</div>

<button
onClick={()=>{
setDeleteOpen(false);
setSelectedProduct(null);
}}
>
<X size={20}/>
</button>

</div>

<div className="p-6">

<p className="text-gray-700">
Are you sure you want to delete
this product?
</p>

<p className="mt-3 rounded-lg bg-gray-100 p-3 font-bold">
{selectedProduct.name}
</p>

</div>

<div className="flex justify-end gap-3 border-t p-5">

<button
onClick={()=>{
setDeleteOpen(false);
setSelectedProduct(null);
}}
className="rounded-lg border px-5 py-2 font-semibold"
>
Cancel
</button>

<button
onClick={deleteProduct}
disabled={deleteLoading}
className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
>
{deleteLoading
? "Deleting..."
: "Delete Product"}
</button>

</div>

</div>

</div>

)}
{/* ========================= */}
{/* Bulk Delete Modal */}
{/* ========================= */}

{bulkDeleteOpen && (

  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

      <div className="flex items-center justify-between border-b p-5">

        <div className="flex items-center gap-3">

          <AlertTriangle
            size={28}
            className="text-red-600"
          />

          <div>

            <h2 className="text-xl font-bold">
              Bulk Delete Products
            </h2>

            <p className="text-sm text-gray-500">
              This action cannot be undone.
            </p>

          </div>

        </div>

        <button
          onClick={() => setBulkDeleteOpen(false)}
        >
          <X size={20} />
        </button>

      </div>

      <div className="p-6">

        <p className="text-gray-700">
          Are you sure you want to delete
        </p>

        <div className="mt-4 rounded-lg bg-red-50 p-4">

          <span className="text-3xl font-bold text-red-600">
            {selectedProducts.length}
          </span>

          <p className="mt-1 font-semibold">
            Selected Products
          </p>

        </div>

      </div>

      <div className="flex justify-end gap-3 border-t p-5">

        <button
          type="button"
          onClick={() =>
            setBulkDeleteOpen(false)
          }
          className="rounded-lg border border-gray-300 px-5 py-2 font-semibold hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={bulkDeleteProducts}
          disabled={bulkDeleteLoading}
          className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {bulkDeleteLoading
            ? "Deleting..."
            : `Delete ${selectedProducts.length} Products`}
        </button>

      </div>

    </div>

  </div>

)}

</div>
);
}
