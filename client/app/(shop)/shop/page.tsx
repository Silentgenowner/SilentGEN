"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import ProductCard from "@/components/ProductCard/ProductCard";
import CategoryFilter from "@/components/CategoryFilter/CategoryFilter";

import type {
  Product,
} from "@/types/product";

/*
|--------------------------------------------------------------------------
| SORT OPTIONS
|--------------------------------------------------------------------------
*/

type SortOption =
  | "default"
  | "price-low"
  | "price-high"
  | "name-az"
  | "name-za";

/*
|--------------------------------------------------------------------------
| NORMALIZE SEARCH VALUE
|--------------------------------------------------------------------------
*/

function normalizeSearchValue(
  value: unknown
): string {
  return String(
    value ?? ""
  )
    .normalize("NFKC")
    .toLowerCase()
    .replace(
      /[\s\-_]+/g,
      ""
    )
    .trim();
}

/*
|--------------------------------------------------------------------------
| SEARCH TOKEN NORMALIZATION
|--------------------------------------------------------------------------
*/

function getSearchValues(
  value: unknown
) {
  const original =
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase();

  const normalized =
    normalizeSearchValue(
      value
    );

  return {
    original,
    normalized,
  };
}

/*
|--------------------------------------------------------------------------
| BOOLEAN QUERY
|--------------------------------------------------------------------------
*/

function isTrueQuery(
  value: string | null
) {
  return (
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase() ===
    "true"
  );
}

/*
|--------------------------------------------------------------------------
| SHOP PAGE
|--------------------------------------------------------------------------
*/

export default function ShopPage() {
  const searchParams =
    useSearchParams();

  /*
  |--------------------------------------------------------------------------
  | PRODUCTS
  |--------------------------------------------------------------------------
  */

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      []
    );

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch,
  ] =
    useState<string>("");

  /*
  |--------------------------------------------------------------------------
  | CATEGORY
  |--------------------------------------------------------------------------
  */

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<string>(
      "All"
    );

  /*
  |--------------------------------------------------------------------------
  | SORT
  |--------------------------------------------------------------------------
  */

  const [
    sortBy,
    setSortBy,
  ] =
    useState<SortOption>(
      "default"
    );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading,
  ] =
    useState<boolean>(
      true
    );

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  const [
    error,
    setError,
  ] =
    useState<string>("");

  /*
  |--------------------------------------------------------------------------
  | URL FILTERS
  |--------------------------------------------------------------------------
  */

  const urlCategory =
    searchParams.get(
      "category"
    ) || "";

  const urlGender =
    searchParams.get(
      "gender"
    ) || "";

  const urlNewArrival =
    isTrueQuery(
      searchParams.get(
        "newArrival"
      )
    );

  const urlBestSeller =
    isTrueQuery(
      searchParams.get(
        "bestSeller"
      )
    );

  const urlTrending =
    isTrueQuery(
      searchParams.get(
        "trending"
      )
    );

  const urlOffer =
    isTrueQuery(
      searchParams.get(
        "offer"
      )
    );

  /*
  |--------------------------------------------------------------------------
  | LOAD PRODUCTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void getProducts();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SYNC CATEGORY FROM URL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      urlCategory
        .trim()
    ) {
      setSelectedCategory(
        urlCategory
      );

      return;
    }

    setSelectedCategory(
      "All"
    );
  }, [
    urlCategory,
  ]);

  /*
  |--------------------------------------------------------------------------
  | GET PRODUCTS
  |--------------------------------------------------------------------------
  */

  async function getProducts() {
    try {
      setLoading(true);

      setError("");

      const response =
        await fetch(
          "/api/product/list",
          {
            method:
              "GET",

            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load products."
        );
      }

      if (
        data?.success &&
        Array.isArray(
          data.products
        )
      ) {
        setProducts(
          data.products
        );

        return;
      }

      setProducts([]);

      setError(
        data?.message ||
          "Unable to load products."
      );
    } catch (error) {
      console.error(
        "SHOP PRODUCT ERROR:",
        error
      );

      setProducts([]);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load products."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FILTER + SEARCH + SORT
  |--------------------------------------------------------------------------
  */

  const filteredProducts =
    useMemo(() => {
      let result = [
        ...products,
      ];

      /*
      |--------------------------------------------------------------------------
      | CATEGORY FILTER
      |--------------------------------------------------------------------------
      */

      if (
        selectedCategory
          .trim()
          .toLowerCase() !==
        "all"
      ) {
        const targetCategory =
          getSearchValues(
            selectedCategory
          );

        result =
          result.filter(
            (
              product
            ) => {
              const productCategory =
                getSearchValues(
                  product.category
                );

              return (
                productCategory
                  .normalized ===
                targetCategory
                  .normalized
              );
            }
          );
      }

      /*
      |--------------------------------------------------------------------------
      | GENDER FILTER
      |--------------------------------------------------------------------------
      */

      if (
        urlGender.trim()
      ) {
        const targetGender =
          getSearchValues(
            urlGender
          );

        result =
          result.filter(
            (
              product
            ) => {
              const productGender =
                getSearchValues(
                  product.gender
                );

              return (
                productGender
                  .normalized ===
                targetGender
                  .normalized
              );
            }
          );
      }

      /*
      |--------------------------------------------------------------------------
      | NEW ARRIVAL FILTER
      |--------------------------------------------------------------------------
      */

      if (
        urlNewArrival
      ) {
        result =
          result.filter(
            (
              product
            ) =>
              product.newArrival ===
              true
          );
      }

      /*
      |--------------------------------------------------------------------------
      | BEST SELLER FILTER
      |--------------------------------------------------------------------------
      */

      if (
        urlBestSeller
      ) {
        result =
          result.filter(
            (
              product
            ) =>
              product.bestSeller ===
              true
          );
      }

      /*
      |--------------------------------------------------------------------------
      | TRENDING FILTER
      |--------------------------------------------------------------------------
      */

      if (
        urlTrending
      ) {
        result =
          result.filter(
            (
              product
            ) =>
              product.trending ===
              true
          );
      }

      /*
      |--------------------------------------------------------------------------
      | OFFER FILTER
      |--------------------------------------------------------------------------
      */

      if (
        urlOffer
      ) {
        result =
          result.filter(
            (
              product
            ) =>
              Number(
                product.discount ??
                  0
              ) > 0
          );
      }

      /*
      |--------------------------------------------------------------------------
      | SEARCH FILTER
      |--------------------------------------------------------------------------
      */

      const searchValues =
        getSearchValues(
          search
        );

      if (
        searchValues
          .original
      ) {
        result =
          result.filter(
            (
              product
            ) => {
              const productName =
                getSearchValues(
                  product.name
                );

              const productCategory =
                getSearchValues(
                  product.category
                );

              const productSlug =
                getSearchValues(
                  product.slug
                );

              const productGender =
                getSearchValues(
                  product.gender
                );

              const productSubCategory =
                getSearchValues(
                  product.subCategory
                );

              return (
                productName
                  .normalized
                  .includes(
                    searchValues.normalized
                  ) ||
                productCategory
                  .normalized
                  .includes(
                    searchValues.normalized
                  ) ||
                productSlug
                  .normalized
                  .includes(
                    searchValues.normalized
                  ) ||
                productGender
                  .normalized
                  .includes(
                    searchValues.normalized
                  ) ||
                productSubCategory
                  .normalized
                  .includes(
                    searchValues.normalized
                  ) ||
                productName
                  .original
                  .includes(
                    searchValues.original
                  ) ||
                productCategory
                  .original
                  .includes(
                    searchValues.original
                  ) ||
                productSlug
                  .original
                  .includes(
                    searchValues.original
                  )
              );
            }
          );
      }

      /*
      |--------------------------------------------------------------------------
      | SORT
      |--------------------------------------------------------------------------
      */

      if (
        sortBy ===
        "price-low"
      ) {
        result.sort(
          (a, b) =>
            Number(
              a.price ||
                0
            ) -
            Number(
              b.price ||
                0
            )
        );
      }

      if (
        sortBy ===
        "price-high"
      ) {
        result.sort(
          (a, b) =>
            Number(
              b.price ||
                0
            ) -
            Number(
              a.price ||
                0
            )
        );
      }

      if (
        sortBy ===
        "name-az"
      ) {
        result.sort(
          (a, b) =>
            String(
              a.name ||
                ""
            ).localeCompare(
              String(
                b.name ||
                  ""
              )
            )
        );
      }

      if (
        sortBy ===
        "name-za"
      ) {
        result.sort(
          (a, b) =>
            String(
              b.name ||
                ""
            ).localeCompare(
              String(
                a.name ||
                  ""
              )
            )
        );
      }

      return result;
    }, [
      products,
      search,
      selectedCategory,
      sortBy,
      urlGender,
      urlNewArrival,
      urlBestSeller,
      urlTrending,
      urlOffer,
    ]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVE URL FILTER
  |--------------------------------------------------------------------------
  */

  const hasUrlFilter =
    Boolean(
      urlGender.trim()
    ) ||
    urlNewArrival ||
    urlBestSeller ||
    urlTrending ||
    urlOffer;

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  function resetFilters() {
    setSearch("");

    setSelectedCategory(
      "All"
    );

    setSortBy(
      "default"
    );

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Remove query filters completely.
    |
    */

    window.history.replaceState(
      {},
      "",
      "/shop"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE TITLE
  |--------------------------------------------------------------------------
  */

  const pageTitle =
    useMemo(() => {
      if (
        urlGender
          .trim()
      ) {
        return urlGender
          .trim()
          .replace(
            /\b\w/g,
            (
              character
            ) =>
              character.toUpperCase()
          );
      }

      if (
        selectedCategory !==
        "All"
      ) {
        return selectedCategory;
      }

      if (
        urlNewArrival
      ) {
        return "New Arrivals";
      }

      if (
        urlBestSeller
      ) {
        return "Best Sellers";
      }

      if (
        urlTrending
      ) {
        return "Trending";
      }

      if (
        urlOffer
      ) {
        return "Offers";
      }

      return "Shop";
    }, [
      urlGender,
      selectedCategory,
      urlNewArrival,
      urlBestSeller,
      urlTrending,
      urlOffer,
    ]);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-gray-100">
      <section className="mx-auto max-w-7xl px-6 py-12">
        {/*
        |--------------------------------------------------------------------------
        | HEADER
        |--------------------------------------------------------------------------
        */}

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900">
            {pageTitle}
          </h1>

          <p className="mt-2 text-gray-500">
            Premium Fashion &
            Accessories
          </p>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | SEARCH + SORT
        |--------------------------------------------------------------------------
        */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-xl">
            <label
              htmlFor="shop-product-search"
              className="sr-only"
            >
              Search products
            </label>

            <input
              id="shop-product-search"
              type="search"
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event
                    .target
                    .value
                )
              }
              placeholder="Search products..."
              autoComplete="off"
              spellCheck={
                false
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-5 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="w-full md:w-56">
            <label
              htmlFor="shop-sort"
              className="sr-only"
            >
              Sort products
            </label>

            <select
              id="shop-sort"
              value={sortBy}
              onChange={(
                event
              ) =>
                setSortBy(
                  event
                    .target
                    .value as SortOption
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none focus:border-black"
            >
              <option value="default">
                Sort: Default
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="name-az">
                Name: A to Z
              </option>

              <option value="name-za">
                Name: Z to A
              </option>
            </select>
          </div>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | CATEGORY FILTER
        |--------------------------------------------------------------------------
        */}

        <div className="mb-8">
          <CategoryFilter
            selectedCategory={
              selectedCategory
            }
            setSelectedCategory={
              setSelectedCategory
            }
          />
        </div>

        {/*
        |--------------------------------------------------------------------------
        | ACTIVE FILTERS
        |--------------------------------------------------------------------------
        */}

        {(
          search.trim() ||
          selectedCategory !==
            "All" ||
          sortBy !==
            "default" ||
          hasUrlFilter
        ) && (
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">
              Active filters:
            </span>

            {search.trim() && (
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700">
                Search:{" "}
                <strong>
                  {search}
                </strong>
              </span>
            )}

            {selectedCategory !==
              "All" && (
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700">
                Category:{" "}
                <strong>
                  {
                    selectedCategory
                  }
                </strong>
              </span>
            )}

            {urlGender && (
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700">
                Gender:{" "}
                <strong>
                  {
                    urlGender
                  }
                </strong>
              </span>
            )}

            {urlNewArrival && (
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700">
                New Arrivals
              </span>
            )}

            {urlBestSeller && (
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700">
                Best Sellers
              </span>
            )}

            {urlTrending && (
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700">
                Trending
              </span>
            )}

            {urlOffer && (
              <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                Offers
              </span>
            )}

            {sortBy !==
              "default" && (
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700">
                Sorted
              </span>
            )}

            <button
              type="button"
              onClick={
                resetFilters
              }
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/*
        |--------------------------------------------------------------------------
        | LOADING
        |--------------------------------------------------------------------------
        */}

        {loading && (
          <div className="py-16 text-center">
            <p className="text-lg text-gray-500">
              Loading Products...
            </p>
          </div>
        )}

        {/*
        |--------------------------------------------------------------------------
        | ERROR
        |--------------------------------------------------------------------------
        */}

        {!loading &&
          error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="font-medium text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void getProducts()
                }
                className="mt-4 rounded-lg bg-black px-5 py-2 text-white transition hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          )}

        {/*
        |--------------------------------------------------------------------------
        | NO PRODUCTS
        |--------------------------------------------------------------------------
        */}

        {!loading &&
          !error &&
          products.length ===
            0 && (
            <div className="py-16 text-center">
              <p className="text-lg text-gray-500">
                No Products Found
              </p>
            </div>
          )}

        {/*
        |--------------------------------------------------------------------------
        | FILTER EMPTY
        |--------------------------------------------------------------------------
        */}

        {!loading &&
          !error &&
          products.length >
            0 &&
          filteredProducts.length ===
            0 && (
            <div className="rounded-xl bg-white py-16 text-center">
              <p className="text-lg font-medium text-gray-700">
                No Products Found
              </p>

              <p className="mt-2 text-sm text-gray-500">
                No products match
                the selected filter.
              </p>

              <button
                type="button"
                onClick={
                  resetFilters
                }
                className="mt-5 rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
              >
                Clear Filters
              </button>
            </div>
          )}

        {/*
        |--------------------------------------------------------------------------
        | PRODUCT COUNT
        |--------------------------------------------------------------------------
        */}

        {!loading &&
          !error &&
          filteredProducts.length >
            0 && (
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {
                    filteredProducts.length
                  }
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {
                    products.length
                  }
                </span>{" "}
                products
              </p>

              {selectedCategory !==
                "All" && (
                <p className="text-sm text-gray-500">
                  Category:{" "}
                  <span className="font-semibold text-gray-900">
                    {
                      selectedCategory
                    }
                  </span>
                </p>
              )}
            </div>
          )}

        {/*
        |--------------------------------------------------------------------------
        | PRODUCT GRID
        |--------------------------------------------------------------------------
        */}

        {!loading &&
          !error &&
          filteredProducts.length >
            0 && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map(
                (
                  product
                ) => (
                  <ProductCard
                    key={
                      product._id
                    }
                    id={
                      product._id
                    }
                    name={
                      product.name
                    }
                    slug={
                      product.slug
                    }
                    price={
                      Number(
                        product.price ??
                          0
                      )
                    }
                    mrp={
                      Number(
                        product.mrp ??
                          0
                      )
                    }
                    image={
                      product.thumbnail ||
                      product.images?.[0] ||
                      "/images/no-image.png"
                    }
                    images={
                      product.images ||
                      []
                    }
                    category={
                      product.category
                    }
                    discount={
                      Number(
                        product.discount ??
                          0
                      )
                    }
                    rating={
                      Number(
                        product.rating ??
                          0
                      )
                    }
                    stock={
                      Number(
                        product.stock ??
                          0
                      )
                    }
                    sizes={
                      product.sizes ||
                      []
                    }
                    colors={
                      product.colors ||
                      []
                    }
                    colorVariants={
                      product.colorVariants ||
                      []
                    }
                    product360={
                      product.product360
                    }
                  />
                )
              )}
            </div>
          )}
      </section>
    </main>
  );
}