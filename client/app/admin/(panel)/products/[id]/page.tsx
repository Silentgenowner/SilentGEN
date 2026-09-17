"use client";

import Image from "next/image";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import Product360Viewer from "@/components/Product/Product360Viewer";

/* ============================================================
   TYPES
============================================================ */

type ColorVariant = {
  color: string;
  images?: string[];
};

type Product360Frame = {
  angle: number;
  name?: string;
  url?: string;
  base64?: string;
  mimeType?: string;
};

type Product360 = {
  enabled: boolean;
  frames: Product360Frame[];
};

type Product = {
  _id: string;

  sku?: string;
  name?: string;
  slug?: string;

  category?: string;
  subCategory?: string;
  brand?: string;

  gender?: string;
  fabric?: string;
  fit?: string;

  gsm?: number;
  weight?: number;

  sizes?: string[];
  colors?: string[];

  mrp?: number;
  price?: number;
  discount?: number;

  stock?: number;
  lowStockLimit?: number;

  status?: string;

  thumbnail?: string;
  images?: string[];

  shortDescription?: string;
  description?: string;

  colorVariants?: ColorVariant[];

  product360?: Product360;

  tags?: string[];

  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  trending?: boolean;

  sortOrder?: number;

  seoTitle?: string;
  seoDescription?: string;

  createdAt?: string;
  updatedAt?: string;

  isDeleted?: boolean;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  product?: Product;
};

/* ============================================================
   SAFE API RESPONSE
============================================================ */

async function readApiResponse(
  response: Response
): Promise<{
  data: ApiResponse | null;
  responseText: string;
}> {
  const responseText =
    await response.text();

  if (!responseText.trim()) {
    return {
      data: null,
      responseText: "",
    };
  }

  try {
    return {
      data: JSON.parse(
        responseText
      ) as ApiResponse,

      responseText,
    };
  } catch (error) {
    console.error(
      "INVALID JSON RESPONSE:",
      responseText
    );

    console.error(
      "JSON PARSE ERROR:",
      error
    );

    return {
      data: null,
      responseText,
    };
  }
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status
      .trim()
      .toLowerCase();

  let className =
    "border-gray-200 bg-gray-100 text-gray-700";

  if (
    normalized === "active" ||
    normalized === "published" ||
    normalized === "in stock"
  ) {
    className =
      "border-green-200 bg-green-100 text-green-700";
  }

  if (
    normalized === "draft" ||
    normalized === "inactive"
  ) {
    className =
      "border-yellow-200 bg-yellow-100 text-yellow-700";
  }

  if (
    normalized ===
      "out of stock" ||
    normalized ===
      "deleted" ||
    normalized ===
      "archived"
  ) {
    className =
      "border-red-200 bg-red-100 text-red-700";
  }

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-3
        py-1
        text-xs
        font-semibold
        ${className}
      `}
    >
      {status}
    </span>
  );
}

/* ============================================================
   STOCK BADGE
============================================================ */

function StockBadge({
  stock,
  lowStockLimit,
}: {
  stock: number;
  lowStockLimit: number;
}) {
  if (stock <= 0) {
    return (
      <span className="inline-flex rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Out of Stock
      </span>
    );
  }

  if (
    stock <= lowStockLimit
  ) {
    return (
      <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
      In Stock
    </span>
  );
}

/* ============================================================
   INFO CARD
============================================================ */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}

/* ============================================================
   INFO ROW
============================================================ */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}

/* ============================================================
   TAG
============================================================ */

function Tag({
  text,
}: {
  text: string;
}) {
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
      {text}
    </span>
  );
}

/* ============================================================
   DATE FORMAT
============================================================ */

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function ProductDetailsPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const id =
    typeof params?.id ===
    "string"
      ? params.id
      : Array.isArray(
          params?.id
        )
      ? params.id[0]
      : "";

  const [
    product,
    setProduct,
  ] =
    useState<Product | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  /*
   * Fatal error:
   * only for product loading.
   */
  const [
    loadError,
    setLoadError,
  ] =
    useState("");

  /*
   * Action error:
   * delete etc.
   */
  const [
    actionError,
    setActionError,
  ] =
    useState("");

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState("");

  /* ==========================================================
     LOAD PRODUCT
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setLoadError(
        "Invalid product ID."
      );

      setLoading(false);

      return;
    }

    let cancelled =
      false;

    async function loadProduct() {
      try {
        setLoading(true);

        setLoadError("");
        setActionError("");

        const response =
          await fetch(
            `/api/admin/products/${id}`,
            {
              method: "GET",
              credentials:
                "include",
              cache:
                "no-store",
            }
          );

        const {
          data,
          responseText,
        } =
          await readApiResponse(
            response
          );

        if (!response.ok) {
          console.error(
            "PRODUCT LOAD API ERROR:",
            {
              status:
                response.status,

              statusText:
                response.statusText,

              responseText,

              data,
            }
          );

          throw new Error(
            data?.message ||
              data?.error ||
              `Unable to load product (${response.status}).`
          );
        }

        if (!data) {
          throw new Error(
            "Product API returned an empty response."
          );
        }

        if (
          !data.success ||
          !data.product
        ) {
          throw new Error(
            data.message ||
              data.error ||
              "Unable to load product."
          );
        }

        const loadedProduct =
          data.product;

        if (
          !loadedProduct?._id
        ) {
          throw new Error(
            "Invalid product data received."
          );
        }

        if (cancelled) {
          return;
        }

        setProduct(
          loadedProduct
        );

        const firstImage =
          loadedProduct
            .thumbnail ||
          loadedProduct
            .images?.[0] ||
          loadedProduct
            .colorVariants?.find(
              (variant) =>
                Array.isArray(
                  variant.images
                ) &&
                variant.images
                  .length > 0
            )?.images?.[0] ||
          "";

        setSelectedImage(
          firstImage
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "PRODUCT DETAILS ERROR:",
          error
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load product."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ==========================================================
     ALL PRODUCT IMAGES
  ========================================================== */

  const uniqueImages =
    useMemo(() => {
      if (!product) {
        return [];
      }

      const images:
        string[] = [];

      if (
        product.thumbnail
      ) {
        images.push(
          product.thumbnail
        );
      }

      if (
        Array.isArray(
          product.images
        )
      ) {
        images.push(
          ...product.images
        );
      }

      if (
        Array.isArray(
          product.colorVariants
        )
      ) {
        for (
          const variant
          of product.colorVariants
        ) {
          if (
            Array.isArray(
              variant.images
            )
          ) {
            images.push(
              ...variant.images
            );
          }
        }
      }

      return [
        ...new Set(
          images.filter(
            (
              image
            ): image is string =>
              typeof image ===
                "string" &&
              image.trim()
                .length > 0
          )
        ),
      ];
    }, [product]);

  /* ==========================================================
     VALID 360 FRAMES
  ========================================================== */

  const product360Frames =
    useMemo(() => {
      if (
        !product
          ?.product360
          ?.enabled
      ) {
        return [];
      }

      if (
        !Array.isArray(
          product
            .product360
            .frames
        )
      ) {
        return [];
      }

      return product
        .product360
        .frames
        .filter(
          (frame) =>
            frame &&
            typeof frame.angle ===
              "number" &&
            (
              (
                typeof frame.url ===
                  "string" &&
                frame.url.trim()
              ) ||
              (
                typeof frame.base64 ===
                  "string" &&
                frame.base64.trim()
              )
            )
        );
    }, [product]);

  /* ==========================================================
     DISCOUNT
  ========================================================== */

  const calculatedDiscount =
    useMemo(() => {
      if (
        product?.mrp ===
          undefined ||
        product?.price ===
          undefined ||
        product.mrp <=
          product.price ||
        product.mrp <= 0
      ) {
        return 0;
      }

      return Math.round(
        ((product.mrp -
          product.price) /
          product.mrp) *
          100
      );
    }, [
      product?.mrp,
      product?.price,
    ]);

  const discount =
    product?.discount ??
    calculatedDiscount;

  /* ==========================================================
     STOCK
  ========================================================== */

  const stock =
    Number(
      product?.stock ??
        0
    );

  const lowStockLimit =
    Number(
      product
        ?.lowStockLimit ??
        0
    );

  /* ==========================================================
     DELETE / MOVE TO TRASH
  ========================================================== */

  async function handleDelete() {
    if (
      !product ||
      deleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to move "${
          product.name ||
          "this product"
        }" to Trash?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      setActionError("");

      const response =
        await fetch(
          `/api/admin/products/${id}`,
          {
            method:
              "DELETE",

            credentials:
              "include",
          }
        );

      const {
        data,
        responseText,
      } =
        await readApiResponse(
          response
        );

      if (!response.ok) {
        console.error(
          "DELETE PRODUCT API ERROR:",
          {
            status:
              response.status,

            statusText:
              response.statusText,

            responseText,

            data,
          }
        );

        throw new Error(
          data?.message ||
            data?.error ||
            `Unable to delete product (${response.status}).`
        );
      }

      if (!data) {
        throw new Error(
          "Delete API returned an empty response."
        );
      }

      if (!data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to delete product."
        );
      }

      router.push(
        "/admin/products"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to delete product."
      );
    } finally {
      setDeleting(false);
    }
  }

  /* ==========================================================
     LOADING UI
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

            <div className="animate-pulse space-y-5">

              <div className="h-6 w-48 rounded bg-gray-200" />

              <div className="h-4 w-32 rounded bg-gray-200" />

              <div className="grid gap-6 lg:grid-cols-3">

                <div className="aspect-square rounded-xl bg-gray-200" />

                <div className="space-y-4 lg:col-span-2">

                  <div className="h-10 rounded bg-gray-200" />

                  <div className="h-24 rounded bg-gray-200" />

                  <div className="h-24 rounded bg-gray-200" />

                </div>

              </div>

            </div>

          </div>

        </div>
      </main>
    );
  }

  /* ==========================================================
     LOAD ERROR UI
  ========================================================== */

  if (
    loadError ||
    !product
  ) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6">

        <div className="mx-auto max-w-7xl">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h1 className="text-lg font-bold text-red-800">
                  Unable to Load Product
                </h1>

                <p className="mt-1 text-sm text-red-700">
                  {loadError ||
                    "Product not found."}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/products"
                  )
                }
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Back to Products
              </button>

            </div>

          </div>

        </div>

      </main>
    );
  }

  /* ==========================================================
     MAIN PAGE
  ========================================================== */

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-7xl p-4 sm:p-6">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/products"
                  )
                }
                className="mb-3 inline-flex items-center text-sm font-medium text-gray-500 transition hover:text-black"
              >
                ← Back to Products
              </button>

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  {product.name ||
                    "Product Details"}
                </h1>

                <StatusBadge
                  status={
                    product.status ||
                    "Draft"
                  }
                />

              </div>

              <p className="mt-1 text-sm text-gray-500">
                SKU:{" "}
                {product.sku ||
                  "—"}
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/admin/products/${id}/edit`
                  )
                }
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Edit Product
              </button>

              <button
                type="button"
                onClick={
                  handleDelete
                }
                disabled={
                  deleting
                }
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Moving..."
                  : "Move to Trash"}
              </button>

            </div>

          </div>

          {actionError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {actionError}
            </div>
          )}

        </div>

        {/* ====================================================
            MAIN PRODUCT AREA
        ==================================================== */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

            {/* MAIN IMAGE */}

            <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">

              {selectedImage ? (

                <Image
                  src={
                    selectedImage
                  }
                  alt={
                    product.name ||
                    "Product image"
                  }
                  fill
                  priority
                  loading="eager"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />

              ) : (

                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No Image Available
                </div>

              )}

            </div>

            {/* ================================================
                THUMBNAILS
            ================================================ */}

            {uniqueImages.length >
              0 && (
              <div className="mt-4">

                <div className="mb-2 flex items-center justify-between">

                  <p className="text-sm font-semibold text-gray-900">
                    Product Images
                  </p>

                  <span className="text-xs text-gray-500">
                    {
                      uniqueImages.length
                    }{" "}
                    images
                  </span>

                </div>

                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">

                  {uniqueImages.map(
                    (
                      image,
                      index
                    ) => (

                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() =>
                          setSelectedImage(
                            image
                          )
                        }
                        className={`
                          relative
                          aspect-square
                          overflow-hidden
                          rounded-lg
                          border-2
                          transition
                          ${
                            selectedImage ===
                            image
                              ? "border-black"
                              : "border-gray-200 hover:border-gray-400"
                          }
                        `}
                      >

                        <Image
                          src={
                            image
                          }
                          alt={`${product.name || "Product"} image ${
                            index +
                            1
                          }`}
                          fill
                          sizes="100px"
                          className="object-cover"
                        />

                      </button>

                    )
                  )}

                </div>

              </div>
            )}

            {/* ================================================
                PRODUCT 360 VIEWER
            ================================================ */}

            {product360Frames.length >
              0 && (
              <div className="mt-6 border-t border-gray-200 pt-6">

                <div className="mb-3 flex items-center justify-between">

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      360° Product View
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {
                        product360Frames.length
                      }{" "}
                      frames available
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Enabled
                  </span>

                </div>

                <Product360Viewer
                  frames={
                    product360Frames
                  }
                  enabled
                />

              </div>
            )}

          </section>

          {/* ==================================================
              PRODUCT SUMMARY
          ================================================== */}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">

            <div className="space-y-6">

              {/* CATEGORY */}

              <div>

                <p className="text-sm font-medium text-gray-500">
                  Category
                </p>

                <p className="mt-1 text-base font-semibold text-gray-900">

                  {product.category ||
                    "—"}

                  {product.subCategory && (
                    <span className="font-normal text-gray-500">
                      {" / "}
                      {
                        product.subCategory
                      }
                    </span>
                  )}

                </p>

              </div>

              {/* PRICE */}

              <div className="rounded-xl bg-gray-50 p-5">

                <p className="text-sm font-medium text-gray-500">
                  Selling Price
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">

                  <span className="text-3xl font-bold text-gray-900">
                    ₹
                    {Number(
                      product.price ??
                        0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </span>

                  {product.mrp !==
                    undefined &&
                    product.mrp >
                      Number(
                        product.price ??
                          0
                      ) && (

                      <span className="text-base text-gray-400 line-through">
                        ₹
                        {Number(
                          product.mrp
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </span>

                    )}

                  {discount > 0 && (

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      {discount}% OFF
                    </span>

                  )}

                </div>

              </div>

              {/* STOCK */}

              <div>

                <div className="mb-3 flex items-center justify-between">

                  <p className="text-sm font-semibold text-gray-900">
                    Inventory
                  </p>

                  <StockBadge
                    stock={
                      stock
                    }
                    lowStockLimit={
                      lowStockLimit
                    }
                  />

                </div>

                <div className="grid gap-4 sm:grid-cols-3">

                  <InfoCard
                    label="Stock"
                    value={String(
                      stock
                    )}
                  />

                  <InfoCard
                    label="Low Stock Alert"
                    value={String(
                      lowStockLimit
                    )}
                  />

                  <InfoCard
                    label="Stock Status"
                    value={
                      stock <= 0
                        ? "Out of Stock"
                        : stock <=
                            lowStockLimit
                        ? "Low Stock"
                        : "In Stock"
                    }
                  />

                </div>

              </div>

              {/* PRODUCT FLAGS */}

              <div>

                <p className="mb-3 text-sm font-semibold text-gray-900">
                  Product Tags
                </p>

                <div className="flex flex-wrap gap-2">

                  {product.featured && (
                    <Tag text="Featured" />
                  )}

                  {product.bestSeller && (
                    <Tag text="Best Seller" />
                  )}

                  {product.newArrival && (
                    <Tag text="New Arrival" />
                  )}

                  {product.trending && (
                    <Tag text="Trending" />
                  )}

                  {!product.featured &&
                    !product.bestSeller &&
                    !product.newArrival &&
                    !product.trending && (

                      <span className="text-sm text-gray-400">
                        No special tags
                      </span>

                    )}

                </div>

              </div>

              {/* QUICK DETAILS */}

              <div className="grid gap-4 sm:grid-cols-2">

                <InfoCard
                  label="Brand"
                  value={
                    product.brand ||
                    "—"
                  }
                />

                <InfoCard
                  label="Gender"
                  value={
                    product.gender ||
                    "—"
                  }
                />

                <InfoCard
                  label="Fabric"
                  value={
                    product.fabric ||
                    "—"
                  }
                />

                <InfoCard
                  label="Fit"
                  value={
                    product.fit ||
                    "—"
                  }
                />

              </div>

            </div>

          </section>

        </div>

        {/* ====================================================
            PRODUCT DETAILS + SIZE / COLOR
        ==================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* PRODUCT DETAILS */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold text-gray-900">
              Product Details
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <InfoRow
                label="Brand"
                value={
                  product.brand
                }
              />

              <InfoRow
                label="Gender"
                value={
                  product.gender
                }
              />

              <InfoRow
                label="Fabric"
                value={
                  product.fabric
                }
              />

              <InfoRow
                label="Fit"
                value={
                  product.fit
                }
              />

              <InfoRow
                label="GSM"
                value={
                  product.gsm !==
                  undefined
                    ? `${product.gsm} GSM`
                    : undefined
                }
              />

              <InfoRow
                label="Weight"
                value={
                  product.weight !==
                  undefined
                    ? `${product.weight} g`
                    : undefined
                }
              />

            </div>

          </section>

          {/* SIZES + COLORS */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold text-gray-900">
              Sizes & Colors
            </h2>

            {/* SIZES */}

            <div className="mt-5">

              <p className="mb-2 text-sm font-medium text-gray-600">
                Sizes
              </p>

              <div className="flex flex-wrap gap-2">

                {product.sizes
                  ?.length ? (

                  product.sizes.map(
                    (size) => (

                      <span
                        key={
                          size
                        }
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
                      >
                        {size}
                      </span>

                    )
                  )

                ) : (

                  <span className="text-sm text-gray-400">
                    No sizes
                  </span>

                )}

              </div>

            </div>

            {/* COLORS */}

            <div className="mt-5">

              <p className="mb-2 text-sm font-medium text-gray-600">
                Colors
              </p>

              <div className="flex flex-wrap gap-2">

                {product.colors
                  ?.length ? (

                  product.colors.map(
                    (color) => (

                      <span
                        key={
                          color
                        }
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
                      >
                        {color}
                      </span>

                    )
                  )

                ) : (

                  <span className="text-sm text-gray-400">
                    No colors
                  </span>

                )}

              </div>

            </div>

          </section>

        </div>

        {/* ====================================================
            COLOR VARIANTS
        ==================================================== */}

        {product.colorVariants
          ?.length ? (

          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold text-gray-900">
              Color Variants
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {product.colorVariants.map(
                (
                  variant,
                  index
                ) => (

                  <div
                    key={`${variant.color}-${index}`}
                    className="rounded-xl border border-gray-200 p-4"
                  >

                    <p className="font-semibold text-gray-900">
                      {
                        variant.color
                      }
                    </p>

                    {variant.images
                      ?.length ? (

                      <div className="mt-3 grid grid-cols-3 gap-2">

                        {variant.images.map(
                          (
                            image,
                            imageIndex
                          ) => (

                            <button
                              key={`${image}-${imageIndex}`}
                              type="button"
                              onClick={() =>
                                setSelectedImage(
                                  image
                                )
                              }
                              className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 transition hover:border-gray-400"
                            >

                              <Image
                                src={
                                  image
                                }
                                alt={`${variant.color} image ${
                                  imageIndex +
                                  1
                                }`}
                                fill
                                sizes="150px"
                                className="object-cover"
                              />

                            </button>

                          )
                        )}

                      </div>

                    ) : (

                      <p className="mt-3 text-sm text-gray-400">
                        No variant images
                      </p>

                    )}

                  </div>

                )
              )}

            </div>

          </section>

        ) : null}

        {/* ====================================================
            DESCRIPTION
        ==================================================== */}

        {(product.shortDescription ||
          product.description) && (

          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold text-gray-900">
              Description
            </h2>

            {product.shortDescription && (

              <div className="mt-5">

                <p className="text-sm font-semibold text-gray-700">
                  Short Description
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {
                    product.shortDescription
                  }
                </p>

              </div>

            )}

            {product.description && (

              <div className="mt-5">

                <p className="text-sm font-semibold text-gray-700">
                  Full Description
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                  {
                    product.description
                  }
                </p>

              </div>

            )}

          </section>

        )}

        {/* ====================================================
            TAGS
        ==================================================== */}

        {product.tags
          ?.length ? (

          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold text-gray-900">
              Tags
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">

              {product.tags.map(
                (
                  tag,
                  index
                ) => (

                  <span
                    key={`${tag}-${index}`}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                  >
                    #{tag}
                  </span>

                )
              )}

            </div>

          </section>

        ) : null}

        {/* ====================================================
            SEO
        ==================================================== */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-gray-900">
            SEO Information
          </h2>

          <div className="mt-5 space-y-4">

            <InfoRow
              label="SEO Title"
              value={
                product.seoTitle
              }
            />

            <InfoRow
              label="SEO Description"
              value={
                product.seoDescription
              }
            />

            <InfoRow
              label="Slug"
              value={
                product.slug
              }
            />

          </div>

        </section>

        {/* ====================================================
            SYSTEM INFORMATION
        ==================================================== */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-gray-900">
            System Information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <InfoCard
              label="Product ID"
              value={
                product._id
              }
            />

            <InfoCard
              label="Sort Order"
              value={String(
                product.sortOrder ??
                  0
              )}
            />

            <InfoCard
              label="Created"
              value={formatDate(
                product.createdAt
              )}
            />

            <InfoCard
              label="Updated"
              value={formatDate(
                product.updatedAt
              )}
            />

          </div>

        </section>

        {/* ====================================================
            BOTTOM ACTIONS
        ==================================================== */}

        <div className="mt-6 flex flex-wrap justify-end gap-3 pb-10">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/products"
              )
            }
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Back
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/products/${id}/edit`
              )
            }
            className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Edit Product
          </button>

        </div>

      </div>

    </main>
  );
}