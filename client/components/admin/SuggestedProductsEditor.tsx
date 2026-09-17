"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Loader2,
  Package,
  Search,
  X,
} from "lucide-react";

type Product = {
  _id: string;
  name: string;
  sku: string;
  thumbnail?: string;
  price: number;
};

type Props = {
  value: string[];
  onChange: (
    productIds: string[]
  ) => void;
  disabled?: boolean;
};

export default function SuggestedProductsEditor({
  value,
  onChange,
  disabled = false,
}: Props) {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/admin/products?limit=100",
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load products."
          );
        }

        const productList =
          Array.isArray(data.products)
            ? (data.products as Product[])
            : [];

        setProducts(productList);
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const selectedProducts = useMemo(
    () =>
      value
        .map((id) =>
          products.find(
            (product) =>
              product._id === id
          )
        )
        .filter(
          (
            product
          ): product is Product =>
            Boolean(product)
        ),
    [products, value]
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      search.toLowerCase().trim();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        product.sku
          .toLowerCase()
          .includes(normalizedSearch)
    );
  }, [products, search]);

  function toggleProduct(
    productId: string
  ) {
    if (value.includes(productId)) {
      onChange(
        value.filter(
          (id) => id !== productId
        )
      );

      return;
    }

    if (value.length >= 4) {
      return;
    }

    onChange([
      ...value,
      productId,
    ]);
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold">
        Manual Suggested Products
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Optional. Selected products appear
        first. Remaining products are chosen
        automatically. Maximum 4.
      </p>

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {selectedProducts.map((product) => (
          <button
            key={product._id}
            type="button"
            disabled={disabled}
            onClick={() =>
              toggleProduct(product._id)
            }
            className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <span className="max-w-44 truncate">
              {product.name}
            </span>

            <X size={15} />
          </button>
        ))}

        {selectedProducts.length === 0 && (
          <span className="text-sm text-gray-500">
            No manual products selected.
          </span>
        )}
      </div>

      <div className="relative mt-5">
        <Search
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          value={search}
          disabled={disabled}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search product name or SKU..."
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none focus:border-black"
        />
      </div>

      <div className="mt-3 max-h-72 divide-y overflow-y-auto rounded-xl border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500">
            <Loader2
              size={17}
              className="animate-spin"
            />

            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No products found.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const selected =
              value.includes(product._id);

            const selectionLimitReached =
              !selected &&
              value.length >= 4;

            return (
              <button
                key={product._id}
                type="button"
                disabled={
                  disabled ||
                  selectionLimitReached
                }
                onClick={() =>
                  toggleProduct(product._id)
                }
                className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                    <Package
                      size={17}
                      className="text-gray-400"
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {product.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {product.sku} · ₹
                    {Number(
                      product.price
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <span
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-gray-300"
                  }`}
                >
                  {selected && <Check size={14} />}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}