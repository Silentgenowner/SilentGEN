"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  RotateCcw,
  Search,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";

type Product = {
  _id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  thumbnail?: string;
  images?: string[];
  deletedAt?: string;
};

type TrashResponse = {
  success: boolean;
  message?: string;

  stats?: {
    totalDeleted: number;
    deletedToday: number;
    deletedThisWeek: number;
    deletedThisMonth: number;
  };

  products?: Product[];

  pagination?: {
    page: number;
    limit: number;
    totalProducts: number;
    totalPages: number;
  };
};

export default function TrashProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [totalProducts, setTotalProducts] = useState(0);

  const [selectAll, setSelectAll] = useState(false);

  const [stats,setStats] = useState({
  totalDeleted:0,
  deletedToday:0,
  deletedThisWeek:0,
  deletedThisMonth:0,
});


const [selectedProducts,setSelectedProducts] =
  useState<string[]>([]);


  useEffect(() => {
    const controller = new AbortController();

    async function fetchTrashProducts() {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const response = await fetch(
          `/api/admin/products/trash?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data: TrashResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load deleted products."
          );
        }

        setProducts(data.products || []);

        setStats(
        data.stats || {
        totalDeleted: 0,
        deletedToday: 0,
        deletedThisWeek: 0,
        deletedThisMonth: 0,
       }
       );

      setTotalPages(
      data.pagination?.totalPages || 1
       );

       setTotalProducts(
       data.pagination?.totalProducts || 0
       );

      } catch (error) {
        if (
          (error as Error).name !== "AbortError"
        ) {
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    }

    const timer = window.setTimeout(
      fetchTrashProducts,
      300
    );

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [page, search]);

  function getImage(product: Product) {
    return (
      product.thumbnail ||
      product.images?.[0] ||
      ""
    );
  }
  // =======================
// Select Single Product
// =======================

function toggleProductSelection(
  productId: string
) {
  setSelectedProducts((previous) => {
    if (previous.includes(productId)) {
      return previous.filter(
        (id) => id !== productId
      );
    }

    return [
      ...previous,
      productId,
    ];
  });
}


// =======================
// Select All Products
// =======================

function toggleSelectAll() {
  if (selectAll) {
    setSelectedProducts([]);
    setSelectAll(false);
    return;
  }

  setSelectedProducts(
    products.map(
      (product) => product._id
    )
  );

  setSelectAll(true);

}

// =======================
  // Restore Product
  // =======================

  async function restoreProduct(
    productId: string
  ) {
    try {
      const response = await fetch(
        `/api/admin/products/restore/${productId}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to restore product."
        );
      }

      alert(data.message);

      setProducts((previousProducts) =>
        previousProducts.filter(
          (product) =>
            product._id !== productId
        )
      );

      setTotalProducts((previous) =>
        Math.max(previous - 1, 0)
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    }
  }
  async function restoreSelectedProducts(){

  if(
    selectedProducts.length === 0
  ){
    return;
  }


  for(
    const id of selectedProducts
  ){

    await fetch(
      `/api/admin/products/restore/${id}`,
      {
        method:"PATCH",
      }
    );

  }


  setProducts((previous)=>
    previous.filter(
      (product)=>
        !selectedProducts.includes(
          product._id
        )
    )
  );


  setTotalProducts(
    (previous)=>
      Math.max(
        previous -
        selectedProducts.length,
        0
      )
  );


  setSelectedProducts([]);

  alert(
    "Selected products restored successfully."
  );

}

  // =======================
  // Delete Forever
  // =======================
async function deleteSelectedForever(){

  if(
    selectedProducts.length === 0
  ){
    return;
  }


  const confirmDelete =
    window.confirm(
      "Selected products will be permanently deleted.\n\nThis action cannot be undone.\n\nContinue?"
    );


  if(!confirmDelete){
    return;
  }


  try{

    for(
      const id of selectedProducts
    ){

      await fetch(
        `/api/admin/products/delete-forever/${id}`,
        {
          method:"DELETE",
        }
      );

    }


    setProducts((previous)=>
      previous.filter(
        (product)=>
          !selectedProducts.includes(
            product._id
          )
      )
    );


    setTotalProducts(
      (previous)=>
        Math.max(
          previous -
          selectedProducts.length,
          0
        )
    );


    setSelectedProducts([]);


    alert(
      "Selected products permanently deleted."
    );


  }catch(error){

    alert(
      "Something went wrong."
    );

  }

}

  async function deleteForeverProduct(
    productId: string
  ) {
    const confirmDelete =
      window.confirm(
        "This product will be permanently deleted.\n\nThis action cannot be undone.\n\nContinue?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/products/delete-forever/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete product."
        );
      }

      alert(data.message);

      setProducts((previousProducts) =>
        previousProducts.filter(
          (product) =>
            product._id !== productId
        )
      );

      setTotalProducts((previous) =>
        Math.max(previous - 1, 0)
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Header */}

      <section className="rounded-2xl bg-black p-6 text-white">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-center gap-2 text-gray-300">

              <Trash2 size={18} />

              <span className="text-sm font-medium">
                Deleted Products
              </span>

            </div>

            <h1 className="mt-2 text-3xl font-bold">
              Product Trash
            </h1>

            <p className="mt-2 text-gray-300">
              Restore deleted products or permanently remove them.
            </p>

          </div>

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200"
          >
            <ArrowLeft size={18} />
            Back To Products
          </Link>

        </div>

      </section>
      
    {/* Trash Stats */}

<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">


<div className="rounded-2xl border bg-white p-5 shadow-sm">

<p className="text-sm text-gray-500">
Deleted Products
</p>

<h2 className="mt-2 text-3xl font-bold">
{stats.totalDeleted}
</h2>

</div>



<div className="rounded-2xl border bg-white p-5 shadow-sm">

<p className="text-sm text-gray-500">
Deleted Today
</p>

<h2 className="mt-2 text-3xl font-bold">
{stats.deletedToday}
</h2>

</div>



<div className="rounded-2xl border bg-white p-5 shadow-sm">

<p className="text-sm text-gray-500">
Deleted This Week
</p>

<h2 className="mt-2 text-3xl font-bold">
{stats.deletedThisWeek}
</h2>

</div>



<div className="rounded-2xl border bg-white p-5 shadow-sm">

<p className="text-sm text-gray-500">
Deleted This Month
</p>

<h2 className="mt-2 text-3xl font-bold">
{stats.deletedThisMonth}
</h2>

</div>


</section>  
{/* Bulk Actions */}

{selectedProducts.length > 0 && (

<section className="rounded-2xl border bg-white p-4 shadow-sm">

  <div className="flex flex-wrap items-center justify-between gap-3">


    <div className="text-sm font-medium text-gray-700">

      Selected Products :

      <span className="ml-2 font-bold">
        {selectedProducts.length}
      </span>

    </div>


    <div className="flex gap-3">


      <button
        type="button"
        onClick={restoreSelectedProducts}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700"
      >

        <RotateCcw size={16}/>

        Restore Selected

      </button>



      <button
        type="button"
        onClick={deleteSelectedForever}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700"
      >

        <Trash2 size={16}/>

        Delete Forever

      </button>


    </div>


  </div>


</section>

)}
      {/* Search */}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

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
            placeholder="Search deleted products..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-black"
          />

        </div>

      </section>

      {/* Count */}

      <div className="text-sm text-gray-600">

        Total Deleted Products :

        <span className="ml-2 font-bold">
          {totalProducts}
        </span>

      </div>

      {/* Content */}

      {loading ? (

        <div className="flex min-h-[350px] items-center justify-center rounded-2xl border bg-white">

          <div className="flex items-center gap-3 text-gray-600">

            <Loader2
              size={22}
              className="animate-spin"
            />

            <span>
              Loading deleted products...
            </span>

          </div>

        </div>

      ) : products.length === 0 ? (

        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border bg-white px-6 text-center">

          <Package
            size={55}
            className="text-gray-300"
          />

          <h2 className="mt-5 text-2xl font-bold">
            Trash is Empty
          </h2>

          <p className="mt-2 text-gray-500">
            No deleted products found.
          </p>

          <Link
            href="/admin/products"
            className="mt-6 rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"
          >
            Back To Products
          </Link>

        </div>

      ) : (

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-gray-50">

<tr className="text-left text-sm text-gray-600">

  <th className="px-6 py-4">
    <input
      type="checkbox"
      checked={selectAll}
      onChange={toggleSelectAll}
      className="h-4 w-4"
    />
  </th>


  <th className="px-6 py-4">
    Product
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
    Deleted
  </th>


  <th className="px-6 py-4 text-center">
    Actions
  </th>

</tr>

</thead>

              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const image = getImage(product);

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50"
                    >
                      {/* Checkbox */}

<td className="px-6 py-4">

<input
type="checkbox"
checked={
 selectedProducts.includes(product._id)
}
onChange={() =>
 toggleProductSelection(product._id)
}
className="h-4 w-4"
/>

</td>

                      {/* Product */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          {image ? (
                            <img
                              src={image}
                              alt={product.name}
                              className="h-16 w-16 rounded-lg border object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">

                              <Package
                                size={22}
                                className="text-gray-400"
                              />

                            </div>
                          )}

                          <div>

                            <p className="font-semibold">
                              {product.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              SKU : {product.sku}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Category */}

                      <td className="px-6 py-4">

                        <p className="font-medium">
                          {product.category}
                        </p>

                        <p className="text-xs text-gray-500">
                          {product.brand || "SilentGEN"}
                        </p>

                      </td>

                      {/* Price */}

                      <td className="px-6 py-4 font-semibold">

                        ₹
                        {Number(product.price).toLocaleString(
                          "en-IN"
                        )}

                      </td>

                      {/* Stock */}

                      <td className="px-6 py-4">
                        {product.stock}
                      </td>

                      {/* Deleted */}

                      <td className="px-6 py-4 text-sm text-gray-500">

                        {product.deletedAt
                          ? new Date(
                              product.deletedAt
                            ).toLocaleString()
                          : "-"}

                      </td>

                      {/* Actions */}

                      <td className="px-6 py-4">

                        <div className="flex justify-center gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              restoreProduct(product._id)
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            <RotateCcw size={16} />
                            Restore
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteForeverProduct(
                                product._id
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                          >
                            <Trash2 size={16} />
                            Delete Forever
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>

          </div>
          {/* Pagination */}

          {totalPages > 1 && (

            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 px-6 py-4 sm:flex-row">

              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() =>
                    setPage((prev) => prev - 1)
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((prev) => prev + 1)
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight size={16} />
                </button>

              </div>

            </div>

          )}

        </section>

      )}

    </div>
  );
}
