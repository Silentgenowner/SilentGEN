"use client";

import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import AdminImageUploader from "@/components/admin/AdminImageUploader";

import AdminProductVideoUploader, {
  EMPTY_PRODUCT_REEL_VIDEO,
  type ProductReelVideo,
} from "@/components/admin/AdminProductVideoUploader";

import Product360Generator from "@/components/admin/Product360Generator";

/* ============================================================
   TYPES
============================================================ */

type ProductStatus =
  | "Active"
  | "Draft"
  | "Out of Stock"
  | "Archived";

type Gender =
  | "Men"
  | "Women"
  | "Kids"
  | "Unisex";

type SizeStock = {
  size: string;
  stock: string;
};

type Product360Frame = {
  angle: number;
  name: string;
  url: string;
};

type Product360Data = {
  enabled?: boolean;
  frames?: Product360Frame[];
};

type ColorVariant = {
  color: string;

  images: string[];

  /*
  |--------------------------------------------------------------------------
  | UI ONLY INVENTORY FLAG
  |--------------------------------------------------------------------------
  */

  inventoryEnabled: boolean;

  stock: string;

  sizeStocks: SizeStock[];

  view360Images: string[];

  product360: Product360Data;
};

type ProductForm = {
  sku: string;

  name: string;

  slug: string;

  category: string;

  subCategory: string;

  brand: string;

  gender: Gender;

  fabric: string;

  fit: string;

  gsm: string;

  weight: string;

  sizes: string[];

  colors: string[];

  mrp: string;

  price: string;

  stock: string;

  sizeStocks: SizeStock[];

  lowStockLimit: string;

  status: ProductStatus;

  thumbnail: string;

  images: string[];

  /*
  |--------------------------------------------------------------------------
  | PRODUCT REEL VIDEO
  |--------------------------------------------------------------------------
  */

  reelVideo: ProductReelVideo;

  view360Images: string[];

  product360: Product360Data;

  shortDescription: string;

  description: string;

  colorVariants: ColorVariant[];

  tags: string[];

  featured: boolean;

  bestSeller: boolean;

  newArrival: boolean;

  trending: boolean;

  sortOrder: string;

  seoTitle: string;

  seoDescription: string;
};

type ApiResponse = {
  success?: boolean;

  message?: string;

  error?: string;

  product?: any;
};

/* ============================================================
   EMPTY FORM
============================================================ */

const EMPTY_FORM: ProductForm = {
  sku: "",

  name: "",

  slug: "",

  category: "",

  subCategory: "",

  brand: "SilentGEN",

  gender: "Unisex",

  fabric: "",

  fit: "",

  gsm: "",

  weight: "",

  sizes: [],

  colors: [],

  mrp: "",

  price: "",

  stock: "0",

  sizeStocks: [],

  lowStockLimit: "5",

  status: "Active",

  thumbnail: "",

  images: [],

  /*
  |--------------------------------------------------------------------------
  | REEL
  |--------------------------------------------------------------------------
  */

  reelVideo: {
    ...EMPTY_PRODUCT_REEL_VIDEO,
  },

  view360Images: [],

  product360: {
    enabled: false,

    frames: [],
  },

  shortDescription: "",

  description: "",

  colorVariants: [],

  tags: [],

  featured: false,

  bestSeller: false,

  newArrival: false,

  trending: false,

  sortOrder: "0",

  seoTitle: "",

  seoDescription: "",
};

/* ============================================================
   BASIC HELPERS
============================================================ */

function stringValue(
  value: unknown
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value);
}

function stringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const map =
    new Map<
      string,
      string
    >();

  for (const item of value) {
    const cleaned =
      stringValue(
        item
      ).trim();

    if (!cleaned) {
      continue;
    }

    const key =
      cleaned.toLowerCase();

    if (!map.has(key)) {
      map.set(
        key,
        cleaned
      );
    }
  }

  return Array.from(
    map.values()
  );
}

function normalizeStockString(
  value: unknown,
  fallback = "0"
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return fallback;
  }

  return String(
    Math.floor(number)
  );
}

/* ============================================================
   PRODUCT REEL
============================================================ */

function normalizeReelVideo(
  value: unknown
): ProductReelVideo {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {
      ...EMPTY_PRODUCT_REEL_VIDEO,
    };
  }

  const raw =
    value as {
      enabled?: unknown;

      url?: unknown;

      publicId?: unknown;

      duration?: unknown;

      poster?: unknown;
    };

  const url =
    stringValue(
      raw.url
    ).trim();

  const publicId =
    stringValue(
      raw.publicId
    ).trim();

  const poster =
    stringValue(
      raw.poster
    ).trim();

  const rawDuration =
    Number(
      raw.duration
    );

  const duration =
    Number.isFinite(
      rawDuration
    ) &&
    rawDuration > 0
      ? rawDuration
      : 0;

  if (!url) {
    return {
      ...EMPTY_PRODUCT_REEL_VIDEO,
    };
  }

  return {
    enabled:
      raw.enabled !== false,

    url,

    publicId,

    duration,

    poster,
  };
}

/* ============================================================
   SIZE STOCK
============================================================ */

function normalizeSizeStocks(
  value: unknown
): SizeStock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const map =
    new Map<
      string,
      SizeStock
    >();

  for (
    const rawItem of value
  ) {
    if (
      !rawItem ||
      typeof rawItem !==
        "object"
    ) {
      continue;
    }

    const item =
      rawItem as {
        size?: unknown;

        stock?: unknown;
      };

    const size =
      stringValue(
        item.size
      ).trim();

    if (!size) {
      continue;
    }

    const stock =
      normalizeStockString(
        item.stock
      );

    map.set(
      size.toLowerCase(),
      {
        size,

        stock,
      }
    );
  }

  return Array.from(
    map.values()
  );
}

function getSizeStockTotal(
  sizeStocks: SizeStock[]
) {
  return sizeStocks.reduce(
    (
      total,
      item
    ) => {
      const stock =
        Number(
          item.stock
        );

      if (
        !Number.isFinite(
          stock
        ) ||
        stock < 0
      ) {
        return total;
      }

      return (
        total +
        Math.floor(stock)
      );
    },
    0
  );
}

/* ============================================================
   360 HELPERS
============================================================ */

function normalize360Frames(
  value: unknown
): Product360Frame[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const map =
    new Map<
      number,
      Product360Frame
    >();

  for (
    const rawFrame of value
  ) {
    if (
      !rawFrame ||
      typeof rawFrame !==
        "object"
    ) {
      continue;
    }

    const frame =
      rawFrame as {
        angle?: unknown;

        name?: unknown;

        url?: unknown;
      };

    const angle =
      Number(
        frame.angle
      );

    const url =
      stringValue(
        frame.url
      ).trim();

    if (
      !Number.isFinite(angle) ||
      angle < 0 ||
      angle >= 360 ||
      !url
    ) {
      continue;
    }

    const safeAngle =
      Math.round(angle);

    const name =
      stringValue(
        frame.name
      ).trim() ||
      `frame-${safeAngle}`;

    map.set(
      safeAngle,
      {
        angle:
          safeAngle,

        name,

        url,
      }
    );
  }

  return Array.from(
    map.values()
  ).sort(
    (a, b) =>
      a.angle -
      b.angle
  );
}

function normalizeProduct360(
  value: unknown
): Product360Data {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return {
      enabled: false,

      frames: [],
    };
  }

  const raw =
    value as {
      enabled?: unknown;

      frames?: unknown;
    };

  const frames =
    normalize360Frames(
      raw.frames
    );

  return {
    enabled:
      typeof raw.enabled ===
      "boolean"
        ? raw.enabled &&
          frames.length > 0
        : frames.length > 0,

    frames,
  };
}

/* ============================================================
   COLOR VARIANTS
============================================================ */

function normalizeColorVariants(
  value: unknown
): ColorVariant[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const map =
    new Map<
      string,
      ColorVariant
    >();

  for (
    const rawVariant of value
  ) {
    if (
      !rawVariant ||
      typeof rawVariant !==
        "object"
    ) {
      continue;
    }

    const variant =
      rawVariant as {
        color?: unknown;

        images?: unknown;

        stock?: unknown;

        sizeStocks?: unknown;

        view360Images?: unknown;

        product360?: unknown;
      };

    const color =
      stringValue(
        variant.color
      ).trim();

    if (!color) {
      continue;
    }

    const sizeStocks =
      normalizeSizeStocks(
        variant.sizeStocks
      );

    const hasExplicitStock =
      variant.stock !==
        undefined &&
      variant.stock !==
        null &&
      variant.stock !== "";

    const inventoryEnabled =
      sizeStocks.length > 0 ||
      hasExplicitStock;

    const sizeTotal =
      getSizeStockTotal(
        sizeStocks
      );

    map.set(
      color.toLowerCase(),
      {
        color,

        images:
          stringArray(
            variant.images
          ),

        inventoryEnabled,

        stock:
          sizeStocks.length > 0
            ? String(
                sizeTotal
              )
            : hasExplicitStock
              ? normalizeStockString(
                  variant.stock
                )
              : "",

        sizeStocks,

        view360Images:
          stringArray(
            variant
              .view360Images
          ),

        product360:
          normalizeProduct360(
            variant
              .product360
          ),
      }
    );
  }

  return Array.from(
    map.values()
  );
}

function getColorStock(
  variant: ColorVariant
) {
  if (
    !variant.inventoryEnabled
  ) {
    return 0;
  }

  if (
    variant.sizeStocks.length >
    0
  ) {
    return getSizeStockTotal(
      variant.sizeStocks
    );
  }

  const stock =
    Number(
      variant.stock
    );

  if (
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    return 0;
  }

  return Math.floor(
    stock
  );
}

/* ============================================================
   CREATE FORM FROM PRODUCT
============================================================ */

function createFormFromProduct(
  product: any
): ProductForm {
  const sizes =
    stringArray(
      product?.sizes
    );

  const loadedSizeStocks =
    normalizeSizeStocks(
      product?.sizeStocks
    );

  const globalMap =
    new Map(
      loadedSizeStocks.map(
        (item) => [
          item.size.toLowerCase(),

          item.stock,
        ]
      )
    );

  /*
  |--------------------------------------------------------------------------
  | KEEP GLOBAL SIZE STOCK SYNCED WITH SIZES
  |--------------------------------------------------------------------------
  */

  const sizeStocks =
    loadedSizeStocks.length > 0
      ? sizes.map(
          (size) => ({
            size,

            stock:
              globalMap.get(
                size.toLowerCase()
              ) ?? "0",
          })
        )
      : [];

  /*
  |--------------------------------------------------------------------------
  | COLOR VARIANTS
  |--------------------------------------------------------------------------
  */

  const colorVariants =
    normalizeColorVariants(
      product?.colorVariants
    ).map(
      (variant) => {
        if (
          variant.sizeStocks
            .length === 0
        ) {
          return variant;
        }

        const variantMap =
          new Map(
            variant.sizeStocks.map(
              (item) => [
                item.size.toLowerCase(),

                item.stock,
              ]
            )
          );

        return {
          ...variant,

          sizeStocks:
            sizes.map(
              (size) => ({
                size,

                stock:
                  variantMap.get(
                    size.toLowerCase()
                  ) ?? "0",
              })
            ),
        };
      }
    );

  /*
  |--------------------------------------------------------------------------
  | GENDER
  |--------------------------------------------------------------------------
  */

  const rawGender =
    stringValue(
      product?.gender
    );

  const gender: Gender =
    rawGender === "Men" ||
    rawGender === "Women" ||
    rawGender === "Kids" ||
    rawGender === "Unisex"
      ? rawGender
      : "Unisex";

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const rawStatus =
    stringValue(
      product?.status
    );

  const status:
    ProductStatus =
      rawStatus ===
        "Active" ||
      rawStatus ===
        "Draft" ||
      rawStatus ===
        "Out of Stock" ||
      rawStatus ===
        "Archived"
        ? rawStatus
        : "Active";

  /*
  |--------------------------------------------------------------------------
  | REEL
  |--------------------------------------------------------------------------
  */

  const reelVideo =
    normalizeReelVideo(
      product?.reelVideo
    );

  return {
    sku:
      stringValue(
        product?.sku
      ),

    name:
      stringValue(
        product?.name
      ),

    slug:
      stringValue(
        product?.slug
      ),

    category:
      stringValue(
        product?.category
      ),

    subCategory:
      stringValue(
        product?.subCategory
      ),

    brand:
      stringValue(
        product?.brand
      ) ||
      "SilentGEN",

    gender,

    fabric:
      stringValue(
        product?.fabric
      ),

    fit:
      stringValue(
        product?.fit
      ),

    gsm:
      stringValue(
        product?.gsm
      ),

    weight:
      stringValue(
        product?.weight
      ),

    sizes,

    colors:
      stringArray(
        product?.colors
      ),

    mrp:
      stringValue(
        product?.mrp
      ),

    price:
      stringValue(
        product?.price
      ),

    stock:
      normalizeStockString(
        product?.stock
      ),

    sizeStocks,

    lowStockLimit:
      normalizeStockString(
        product
          ?.lowStockLimit,
        "5"
      ),

    status,

    thumbnail:
      stringValue(
        product?.thumbnail
      ),

    images:
      stringArray(
        product?.images
      ),

    /*
    |--------------------------------------------------------------------------
    | REEL VIDEO
    |--------------------------------------------------------------------------
    */

    reelVideo,

    view360Images:
      stringArray(
        product
          ?.view360Images
      ),

    product360:
      normalizeProduct360(
        product?.product360
      ),

    shortDescription:
      stringValue(
        product
          ?.shortDescription
      ),

    description:
      stringValue(
        product?.description
      ),

    colorVariants,

    tags:
      stringArray(
        product?.tags
      ),

    featured:
      Boolean(
        product?.featured
      ),

    bestSeller:
      Boolean(
        product?.bestSeller
      ),

    newArrival:
      Boolean(
        product?.newArrival
      ),

    trending:
      Boolean(
        product?.trending
      ),

    sortOrder:
      stringValue(
        product?.sortOrder ??
          0
      ),

    seoTitle:
      stringValue(
        product?.seoTitle
      ),

    seoDescription:
      stringValue(
        product
          ?.seoDescription
      ),
  };
}

/* ============================================================
   SAFE API RESPONSE
============================================================ */

async function readJsonResponse(
  response: Response
): Promise<{
  data: ApiResponse | null;

  responseText: string;
}> {
  const responseText =
    await response.text();

  if (
    !responseText.trim()
  ) {
    return {
      data: null,

      responseText: "",
    };
  }

  try {
    return {
      data:
        JSON.parse(
          responseText
        ) as ApiResponse,

      responseText,
    };
  } catch {
    return {
      data: null,

      responseText,
    };
  }
}

/* ============================================================
   UI HELPERS
============================================================ */

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-gray-100 disabled:text-gray-500";

const textareaClass =
  "w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-gray-100 disabled:text-gray-500";

function Section({
  title,
  description,
  children,
}: {
  title: string;

  description?: string;

  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function Label({
  children,
  required = false,
}: {
  children: ReactNode;

  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-semibold text-gray-700">
      {children}

      {required && (
        <span className="ml-1 text-red-500">
          *
        </span>
      )}
    </label>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function EditProductPage() {
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
    form,
    setForm,
  ] =
    useState<ProductForm>(
      EMPTY_FORM
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    newSize,
    setNewSize,
  ] =
    useState("");

  const [
    newColor,
    setNewColor,
  ] =
    useState("");

  const [
    newTag,
    setNewTag,
  ] =
    useState("");

  const [
    variantColor,
    setVariantColor,
  ] =
    useState("");

  /* ==========================================================
     LOAD PRODUCT
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setError(
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

        setError("");

        const response =
          await fetch(
            `/api/admin/products/${id}`,
            {
              method:
                "GET",

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
          await readJsonResponse(
            response
          );

        if (!response.ok) {
          console.error(
            "PRODUCT LOAD API ERROR:",
            responseText
          );

          throw new Error(
            data?.message ||
              data?.error ||
              `Unable to load product (${response.status}).`
          );
        }

        if (
          !data?.success ||
          !data.product?._id
        ) {
          throw new Error(
            data?.message ||
              "Invalid product data received."
          );
        }

        if (cancelled) {
          return;
        }

        setForm(
          createFormFromProduct(
            data.product
          )
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
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
      cancelled =
        true;
    };
  }, [id]);

  /* ==========================================================
     CALCULATED DISCOUNT
  ========================================================== */

  const calculatedDiscount =
    useMemo(() => {
      const mrp =
        Number(
          form.mrp
        );

      const price =
        Number(
          form.price
        );

      if (
        !Number.isFinite(
          mrp
        ) ||
        !Number.isFinite(
          price
        ) ||
        mrp <= 0 ||
        price < 0
      ) {
        return 0;
      }

      return Math.max(
        0,
        Math.min(
          100,
          Math.round(
            ((mrp - price) /
              mrp) *
              100
          )
        )
      );
    }, [
      form.mrp,
      form.price,
    ]);

  /* ==========================================================
     INVENTORY TOTALS
  ========================================================== */

  const globalSizeStockTotal =
    useMemo(
      () =>
        getSizeStockTotal(
          form.sizeStocks
        ),
      [
        form.sizeStocks,
      ]
    );

  const inventoryColorVariants =
    useMemo(
      () =>
        form.colorVariants.filter(
          (variant) =>
            variant.inventoryEnabled
        ),
      [
        form.colorVariants,
      ]
    );

  const hasColorInventory =
    inventoryColorVariants.length >
    0;

  const colorStockTotal =
    useMemo(
      () =>
        inventoryColorVariants.reduce(
          (
            total,
            variant
          ) =>
            total +
            getColorStock(
              variant
            ),
          0
        ),
      [
        inventoryColorVariants,
      ]
    );

  const calculatedStock =
    useMemo(() => {
      if (
        hasColorInventory
      ) {
        return colorStockTotal;
      }

      if (
        form.sizeStocks.length >
        0
      ) {
        return globalSizeStockTotal;
      }

      const manual =
        Number(
          form.stock
        );

      if (
        !Number.isFinite(
          manual
        )
      ) {
        return 0;
      }

      return Math.max(
        0,
        Math.floor(
          manual
        )
      );
    }, [
      hasColorInventory,
      colorStockTotal,
      form.sizeStocks.length,
      globalSizeStockTotal,
      form.stock,
    ]);

  /* ==========================================================
     UPDATE FIELD
  ========================================================== */

  function updateField<
    K extends keyof ProductForm,
  >(
    field: K,
    value: ProductForm[K]
  ) {
    setForm(
      (previous) => ({
        ...previous,

        [field]:
          value,
      })
    );
  }

  function handleInput(
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >
  ) {
    const {
      name,
      value,
    } =
      event.target;

    setForm(
      (previous) => ({
        ...previous,

        [name]:
          value,
      })
    );
  }

  /* ==========================================================
     PRODUCT REEL
  ========================================================== */

  function updateReelVideo(
    reelVideo:
      ProductReelVideo
  ) {
    setForm(
      (previous) => ({
        ...previous,

        reelVideo,
      })
    );

    setError("");

    setSuccess("");
  }

  /* ==========================================================
     SIZE
  ========================================================== */

  function addSize() {
    const value =
      newSize.trim();

    if (!value) {
      return;
    }

    setForm(
      (previous) => {
        const exists =
          previous.sizes.some(
            (size) =>
              size.toLowerCase() ===
              value.toLowerCase()
          );

        if (exists) {
          return previous;
        }

        return {
          ...previous,

          sizes: [
            ...previous.sizes,

            value,
          ],

          sizeStocks:
            previous.sizeStocks
              .length > 0
              ? [
                  ...previous.sizeStocks,

                  {
                    size:
                      value,

                    stock:
                      "0",
                  },
                ]
              : previous.sizeStocks,

          colorVariants:
            previous.colorVariants.map(
              (variant) => {
                if (
                  !variant.inventoryEnabled ||
                  variant.sizeStocks
                    .length ===
                    0
                ) {
                  return variant;
                }

                return {
                  ...variant,

                  sizeStocks: [
                    ...variant.sizeStocks,

                    {
                      size:
                        value,

                      stock:
                        "0",
                    },
                  ],
                };
              }
            ),
        };
      }
    );

    setNewSize("");
  }

  function removeSize(
    size: string
  ) {
    const normalized =
      size.toLowerCase();

    setForm(
      (previous) => ({
        ...previous,

        sizes:
          previous.sizes.filter(
            (item) =>
              item.toLowerCase() !==
              normalized
          ),

        sizeStocks:
          previous.sizeStocks.filter(
            (item) =>
              item.size.toLowerCase() !==
              normalized
          ),

        colorVariants:
          previous.colorVariants.map(
            (variant) => ({
              ...variant,

              sizeStocks:
                variant.sizeStocks.filter(
                  (item) =>
                    item.size.toLowerCase() !==
                    normalized
                ),
            })
          ),
      })
    );
  }

  function enableGlobalSizeStock() {
    if (
      form.sizes.length ===
      0
    ) {
      return;
    }

    setForm(
      (previous) => {
        const existingMap =
          new Map(
            previous.sizeStocks.map(
              (item) => [
                item.size.toLowerCase(),

                item.stock,
              ]
            )
          );

        return {
          ...previous,

          sizeStocks:
            previous.sizes.map(
              (size) => ({
                size,

                stock:
                  existingMap.get(
                    size.toLowerCase()
                  ) ??
                  "0",
              })
            ),
        };
      }
    );
  }

  function disableGlobalSizeStock() {
    setForm(
      (previous) => ({
        ...previous,

        stock:
          String(
            getSizeStockTotal(
              previous.sizeStocks
            )
          ),

        sizeStocks:
          [],
      })
    );
  }

  function updateGlobalSizeStock(
    size: string,
    stock: string
  ) {
    if (
      stock !== "" &&
      (
        !Number.isFinite(
          Number(stock)
        ) ||
        Number(stock) < 0
      )
    ) {
      return;
    }

    const normalized =
      size.toLowerCase();

    setForm(
      (previous) => ({
        ...previous,

        sizeStocks:
          previous.sizeStocks.map(
            (item) =>
              item.size.toLowerCase() ===
              normalized
                ? {
                    ...item,

                    stock,
                  }
                : item
          ),
      })
    );
  }

  /* ==========================================================
     COLORS
  ========================================================== */

  function addColor() {
    const value =
      newColor.trim();

    if (!value) {
      return;
    }

    setForm(
      (previous) => {
        const exists =
          previous.colors.some(
            (color) =>
              color.toLowerCase() ===
              value.toLowerCase()
          );

        if (exists) {
          return previous;
        }

        return {
          ...previous,

          colors: [
            ...previous.colors,

            value,
          ],
        };
      }
    );

    setNewColor("");
  }

  function removeColor(
    color: string
  ) {
    const normalized =
      color.toLowerCase();

    setForm(
      (previous) => ({
        ...previous,

        colors:
          previous.colors.filter(
            (item) =>
              item.toLowerCase() !==
              normalized
          ),
      })
    );
  }

  /* ==========================================================
     TAGS
  ========================================================== */

  function addTag() {
    const value =
      newTag
        .trim()
        .replace(
          /^#/,
          ""
        );

    if (!value) {
      return;
    }

    const exists =
      form.tags.some(
        (tag) =>
          tag.toLowerCase() ===
          value.toLowerCase()
      );

    if (!exists) {
      updateField(
        "tags",
        [
          ...form.tags,

          value,
        ]
      );
    }

    setNewTag("");
  }

  function removeTag(
    tag: string
  ) {
    const normalized =
      tag.toLowerCase();

    updateField(
      "tags",
      form.tags.filter(
        (item) =>
          item.toLowerCase() !==
          normalized
      )
    );
  }

  /* ==========================================================
     COLOR VARIANT
  ========================================================== */

  function addColorVariant() {
    const color =
      variantColor.trim();

    if (!color) {
      return;
    }

    setForm(
      (previous) => {
        const exists =
          previous.colorVariants.some(
            (variant) =>
              variant.color
                .toLowerCase() ===
              color.toLowerCase()
          );

        if (exists) {
          return previous;
        }

        const nextVariant:
          ColorVariant = {
          color,

          images: [],

          inventoryEnabled:
            false,

          stock: "",

          sizeStocks: [],

          view360Images: [],

          product360: {
            enabled: false,

            frames: [],
          },
        };

        return {
          ...previous,

          colors:
            stringArray([
              ...previous.colors,

              color,
            ]),

          colorVariants: [
            ...previous.colorVariants,

            nextVariant,
          ],
        };
      }
    );

    setVariantColor("");
  }

  function removeColorVariant(
    index: number
  ) {
    setForm(
      (previous) => ({
        ...previous,

        colorVariants:
          previous.colorVariants.filter(
            (
              _,
              itemIndex
            ) =>
              itemIndex !==
              index
          ),
      })
    );
  }

  function updateVariantImages(
    variantIndex: number,
    images: string[]
  ) {
    setForm(
      (previous) => ({
        ...previous,

        colorVariants:
          previous.colorVariants.map(
            (
              variant,
              index
            ) =>
              index ===
              variantIndex
                ? {
                    ...variant,

                    images:
                      stringArray(
                        images
                      ),
                  }
                : variant
          ),
      })
    );
  }

  function enableVariantInventory(
    variantIndex: number
  ) {
    setForm(
      (previous) => ({
        ...previous,

        colorVariants:
          previous.colorVariants.map(
            (
              variant,
              index
            ) => {
              if (
                index !==
                variantIndex
              ) {
                return variant;
              }

              if (
                previous.sizes.length >
                0
              ) {
                const existingMap =
                  new Map(
                    variant.sizeStocks.map(
                      (item) => [
                        item.size.toLowerCase(),

                        item.stock,
                      ]
                    )
                  );

                return {
                  ...variant,

                  inventoryEnabled:
                    true,

                  stock: "",

                  sizeStocks:
                    previous.sizes.map(
                      (size) => ({
                        size,

                        stock:
                          existingMap.get(
                            size.toLowerCase()
                          ) ??
                          "0",
                      })
                    ),
                };
              }

              return {
                ...variant,

                inventoryEnabled:
                  true,

                stock:
                  variant.stock ||
                  "0",

                sizeStocks: [],
              };
            }
          ),
      })
    );
  }

  function disableVariantInventory(
    variantIndex: number
  ) {
    setForm(
      (previous) => ({
        ...previous,

        colorVariants:
          previous.colorVariants.map(
            (
              variant,
              index
            ) =>
              index ===
              variantIndex
                ? {
                    ...variant,

                    inventoryEnabled:
                      false,

                    stock: "",

                    sizeStocks: [],
                  }
                : variant
          ),
      })
    );
  }

  function updateVariantStock(
    variantIndex: number,
    stock: string
  ) {
    if (
      stock !== "" &&
      (
        !Number.isFinite(
          Number(stock)
        ) ||
        Number(stock) < 0
      )
    ) {
      return;
    }

    setForm(
      (previous) => ({
        ...previous,

        colorVariants:
          previous.colorVariants.map(
            (
              variant,
              index
            ) =>
              index ===
              variantIndex
                ? {
                    ...variant,

                    inventoryEnabled:
                      true,

                    stock,
                  }
                : variant
          ),
      })
    );
  }

  function enableVariantSizeStock(
    variantIndex: number
  ) {
    if (
      form.sizes.length ===
      0
    ) {
      return;
    }

    setForm(
      (previous) => ({
        ...previous,

        colorVariants:
          previous.colorVariants.map(
            (
              variant,
              index
            ) => {
              if (
                index !==
                variantIndex
              ) {
                return variant;
              }

              const existingMap =
                new Map(
                  variant.sizeStocks.map(
                    (item) => [
                      item.size.toLowerCase(),

                      item.stock,
                    ]
                  )
                );

              return {
                ...variant,

                inventoryEnabled:
                  true,

                sizeStocks:
                  previous.sizes.map(
                    (size) => ({
                      size,

                      stock:
                        existingMap.get(
                          size.toLowerCase()
                        ) ??
                        "0",
                    })
                  ),
              };
            }
          ),
      })
    );
  }

  function disableVariantSizeStock(
    variantIndex: number
  ) {
    setForm(
      (previous) => ({
        ...previous,

        colorVariants:
          previous.colorVariants.map(
            (
              variant,
              index
            ) =>
              index ===
              variantIndex
                ? {
                    ...variant,

                    inventoryEnabled:
                      true,

                    stock:
                      String(
                        getColorStock(
                          variant
                        )
                      ),

                    sizeStocks: [],
                  }
                : variant
          ),
      })
    );
  }

  function updateVariantSizeStock(
    variantIndex: number,
    size: string,
    stock: string
  ) {
    if (
      stock !== "" &&
      (
        !Number.isFinite(
          Number(stock)
        ) ||
        Number(stock) < 0
      )
    ) {
      return;
    }

    const normalizedSize =
      size.toLowerCase();

    setForm(
      (previous) => ({
        ...previous,

        colorVariants:
          previous.colorVariants.map(
            (
              variant,
              index
            ) =>
              index ===
              variantIndex
                ? {
                    ...variant,

                    inventoryEnabled:
                      true,

                    sizeStocks:
                      variant.sizeStocks.map(
                        (item) =>
                          item.size.toLowerCase() ===
                          normalizedSize
                            ? {
                                ...item,

                                stock,
                              }
                            : item
                      ),
                  }
                : variant
          ),
      })
    );
  }

  /* ==========================================================
     360 CALLBACK
  ========================================================== */

  function handle360Saved(
    data: {
      targetType:
        | "main"
        | "color";

      color?: string;

      product360: {
        enabled?: boolean;

        frames?: Array<{
          angle: number;

          name: string;

          url: string;
        }>;
      };
    }
  ) {
    const normalized360 =
      normalizeProduct360(
        data.product360
      );

    if (
      data.targetType ===
      "main"
    ) {
      setForm(
        (previous) => ({
          ...previous,

          product360:
            normalized360,
        })
      );

      return;
    }

    const targetColor =
      data.color
        ?.trim()
        .toLowerCase();

    if (!targetColor) {
      return;
    }

    setForm(
      (previous) => ({
        ...previous,

        colorVariants:
          previous.colorVariants.map(
            (variant) =>
              variant.color
                .trim()
                .toLowerCase() ===
              targetColor
                ? {
                    ...variant,

                    product360:
                      normalized360,
                  }
                : variant
          ),
      })
    );
  }

  /* ==========================================================
     BUILD PAYLOAD
  ========================================================== */

  function buildPayload() {
    const mrp =
      Number(
        form.mrp
      );

    const price =
      Number(
        form.price
      );

    const cleanSizeStocks =
      form.sizeStocks.map(
        (item) => ({
          size:
            item.size.trim(),

          stock:
            Number(
              item.stock
            ),
        })
      );

    const cleanVariants =
      form.colorVariants.map(
        (variant) => {
          const frames =
            variant.product360
              .frames ?? [];

          const baseVariant:
            Record<
              string,
              unknown
            > = {
            color:
              variant.color.trim(),

            images:
              stringArray(
                variant.images
              ),

            view360Images:
              stringArray(
                variant
                  .view360Images
              ),

            product360: {
              enabled:
                Boolean(
                  variant.product360
                    .enabled
                ) &&
                frames.length >
                  0,

              frames,
            },
          };

          if (
            variant.inventoryEnabled
          ) {
            const cleanedVariantSizeStocks =
              variant.sizeStocks.map(
                (item) => ({
                  size:
                    item.size.trim(),

                  stock:
                    Number(
                      item.stock
                    ),
                })
              );

            baseVariant.sizeStocks =
              cleanedVariantSizeStocks;

            baseVariant.stock =
              cleanedVariantSizeStocks.length >
              0
                ? getSizeStockTotal(
                    variant.sizeStocks
                  )
                : Number(
                    variant.stock
                  );
          } else {
            /*
            |--------------------------------------------------------------------------
            | IMAGE-ONLY COLOR
            |--------------------------------------------------------------------------
            */

            baseVariant.sizeStocks =
              [];
          }

          return baseVariant;
        }
      );

    const variantColors =
      form.colorVariants.map(
        (variant) =>
          variant.color.trim()
      );

    const finalColors =
      stringArray([
        ...form.colors,

        ...variantColors,
      ]);

    /*
    |--------------------------------------------------------------------------
    | CLEAN REEL
    |--------------------------------------------------------------------------
    */

    const reelVideo =
      form.reelVideo.url.trim()
        ? {
            enabled:
              Boolean(
                form.reelVideo
                  .enabled
              ),

            url:
              form.reelVideo
                .url
                .trim(),

            publicId:
              form.reelVideo
                .publicId
                .trim(),

            duration:
              Number(
                form.reelVideo
                  .duration
              ),

            poster:
              form.reelVideo
                .poster
                .trim(),
          }
        : {
            ...EMPTY_PRODUCT_REEL_VIDEO,
          };

    return {
      sku:
        form.sku
          .trim()
          .toUpperCase(),

      name:
        form.name.trim(),

      slug:
        form.slug.trim(),

      category:
        form.category.trim(),

      subCategory:
        form.subCategory.trim(),

      brand:
        form.brand.trim() ||
        "SilentGEN",

      gender:
        form.gender,

      fabric:
        form.fabric.trim(),

      fit:
        form.fit.trim(),

      gsm:
        form.gsm.trim()
          ? Number(
              form.gsm
            )
          : 0,

      weight:
        form.weight.trim()
          ? Number(
              form.weight
            )
          : 0,

      sizes:
        form.sizes,

      colors:
        finalColors,

      mrp,

      price,

      discount:
        calculatedDiscount,

      stock:
        calculatedStock,

      sizeStocks:
        cleanSizeStocks,

      lowStockLimit:
        Number(
          form.lowStockLimit ||
            0
        ),

      status:
        calculatedStock <=
          0 &&
        form.status ===
          "Active"
          ? "Out of Stock"
          : form.status,

      thumbnail:
        form.thumbnail.trim(),

      images:
        stringArray(
          form.images
        ),

      /*
      |--------------------------------------------------------------------------
      | PRODUCT REEL VIDEO
      |--------------------------------------------------------------------------
      */

      reelVideo,

      view360Images:
        stringArray(
          form.view360Images
        ),

      /*
      |--------------------------------------------------------------------------
      | MAIN PRODUCT360 IS NOT SENT HERE
      |--------------------------------------------------------------------------
      |
      | Product360Generator saves main 360 separately.
      | Normal product Save must not overwrite it with stale state.
      |
      |--------------------------------------------------------------------------
      */

      shortDescription:
        form.shortDescription
          .trim(),

      description:
        form.description
          .trim(),

      colorVariants:
        cleanVariants,

      tags:
        stringArray(
          form.tags
        ),

      featured:
        form.featured,

      bestSeller:
        form.bestSeller,

      newArrival:
        form.newArrival,

      trending:
        form.trending,

      sortOrder:
        Number(
          form.sortOrder ||
            0
        ),

      seoTitle:
        form.seoTitle.trim(),

      seoDescription:
        form.seoDescription
          .trim(),
    };
  }
    /* ==========================================================
     VALIDATION
  ========================================================== */

  function validateForm():
    | string
    | null {
    if (!form.name.trim()) {
      return "Product name is required.";
    }

    if (!form.sku.trim()) {
      return "SKU is required.";
    }

    if (!form.slug.trim()) {
      return "Product slug is required.";
    }

    if (!form.category.trim()) {
      return "Category is required.";
    }

    if (form.mrp.trim() === "") {
      return "MRP is required.";
    }

    if (form.price.trim() === "") {
      return "Selling price is required.";
    }

    const mrp =
      Number(
        form.mrp
      );

    const price =
      Number(
        form.price
      );

    if (
      !Number.isFinite(mrp) ||
      mrp < 0
    ) {
      return "MRP must be a valid non-negative number.";
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return "Selling price must be a valid non-negative number.";
    }

    if (price > mrp) {
      return "Selling price cannot be greater than MRP.";
    }

    if (form.gsm.trim()) {
      const gsm =
        Number(
          form.gsm
        );

      if (
        !Number.isFinite(gsm) ||
        gsm < 0
      ) {
        return "GSM must be a valid non-negative number.";
      }
    }

    if (form.weight.trim()) {
      const weight =
        Number(
          form.weight
        );

      if (
        !Number.isFinite(weight) ||
        weight < 0
      ) {
        return "Weight must be a valid non-negative number.";
      }
    }

    const lowStockLimit =
      Number(
        form.lowStockLimit
      );

    if (
      !Number.isFinite(
        lowStockLimit
      ) ||
      lowStockLimit < 0 ||
      !Number.isInteger(
        lowStockLimit
      )
    ) {
      return "Low stock limit must be a valid whole number.";
    }

    const sortOrder =
      Number(
        form.sortOrder ||
          0
      );

    if (
      !Number.isFinite(
        sortOrder
      ) ||
      sortOrder < 0 ||
      !Number.isInteger(
        sortOrder
      )
    ) {
      return "Sort order must be a non-negative whole number.";
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT REEL VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      form.reelVideo.url.trim()
    ) {
      const duration =
        Number(
          form.reelVideo
            .duration
        );

      if (
        !Number.isFinite(
          duration
        ) ||
        duration <= 0
      ) {
        return "Product reel duration is invalid.";
      }

      if (
        duration > 30
      ) {
        return "Product reel cannot be longer than 30 seconds.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | MANUAL STOCK
    |--------------------------------------------------------------------------
    */

    if (
      !hasColorInventory &&
      form.sizeStocks.length ===
        0
    ) {
      const manualStock =
        Number(
          form.stock
        );

      if (
        form.stock === "" ||
        !Number.isFinite(
          manualStock
        ) ||
        manualStock < 0 ||
        !Number.isInteger(
          manualStock
        )
      ) {
        return "Product stock must be a valid whole number.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT SIZE STOCK
    |--------------------------------------------------------------------------
    */

    for (
      const item of
      form.sizeStocks
    ) {
      const stock =
        Number(
          item.stock
        );

      if (
        item.stock === "" ||
        !Number.isFinite(
          stock
        ) ||
        stock < 0 ||
        !Number.isInteger(
          stock
        )
      ) {
        return `${item.size} stock must be a valid whole number.`;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE COLORS
    |--------------------------------------------------------------------------
    */

    const colorNames =
      form.colorVariants.map(
        (variant) =>
          variant.color
            .trim()
            .toLowerCase()
      );

    if (
      colorNames.some(
        (color) =>
          !color
      )
    ) {
      return "Every color variant must have a color name.";
    }

    if (
      new Set(
        colorNames
      ).size !==
      colorNames.length
    ) {
      return "Duplicate color variants are not allowed.";
    }

    /*
    |--------------------------------------------------------------------------
    | COLOR INVENTORY
    |--------------------------------------------------------------------------
    */

    for (
      const variant of
      form.colorVariants
    ) {
      if (
        !variant.inventoryEnabled
      ) {
        continue;
      }

      if (
        variant.sizeStocks
          .length > 0
      ) {
        for (
          const item of
          variant.sizeStocks
        ) {
          const stock =
            Number(
              item.stock
            );

          if (
            item.stock === "" ||
            !Number.isFinite(
              stock
            ) ||
            stock < 0 ||
            !Number.isInteger(
              stock
            )
          ) {
            return `${variant.color} - ${item.size} stock must be a valid whole number.`;
          }
        }
      } else {
        const stock =
          Number(
            variant.stock
          );

        if (
          variant.stock === "" ||
          !Number.isFinite(
            stock
          ) ||
          stock < 0 ||
          !Number.isInteger(
            stock
          )
        ) {
          return `${variant.color} stock must be a valid whole number.`;
        }
      }
    }

    return null;
  }

  /* ==========================================================
     SAVE
  ========================================================== */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");

    setSuccess("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          `/api/admin/products/${id}`,
          {
            method:
              "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                buildPayload()
              ),
          }
        );

      const {
        data,
        responseText,
      } =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        console.error(
          "PRODUCT UPDATE API ERROR:",
          responseText
        );

        throw new Error(
          data?.message ||
            data?.error ||
            `Product update failed (${response.status}).`
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to update product."
        );
      }

      if (data.product) {
        setForm(
          createFormFromProduct(
            data.product
          )
        );
      }

      setSuccess(
        data.message ||
          "Product updated successfully."
      );

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update product."
      );

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="animate-pulse space-y-5">
              <div className="h-8 w-64 rounded bg-gray-200" />

              <div className="h-4 w-96 max-w-full rounded bg-gray-200" />

              <div className="h-80 rounded-2xl bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     LOAD ERROR
  ========================================================== */

  if (
    error &&
    !form.name
  ) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-bold text-red-800">
              Unable to Load Product
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/products"
                )
              }
              className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Products
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/products/${id}`
              )
            }
            className="mb-4 text-sm font-semibold text-gray-500 hover:text-black"
          >
            ← Back to Product
          </button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Product
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Product information,
                images, reel video,
                size stock, color stock
                and 360° view.
              </p>
            </div>

            <button
              type="submit"
              form="edit-product-form"
              disabled={saving}
              className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {success}
            </div>
          )}
        </div>

        {/* =====================================================
            INVENTORY SUMMARY
        ===================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StockSummary
            title="Product Total Stock"
            value={
              calculatedStock
            }
          />

          <StockSummary
            title="Product Size Stock"
            value={
              globalSizeStockTotal
            }
          />

          <StockSummary
            title="Color Stock"
            value={
              colorStockTotal
            }
          />
        </div>

        <form
          id="edit-product-form"
          onSubmit={
            handleSubmit
          }
          className="space-y-6"
        >
          {/* ===================================================
              BASIC
          =================================================== */}

          <Section
            title="Basic Information"
            description="Main product identity."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Product Name"
                required
                name="name"
                value={form.name}
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <Field
                label="SKU"
                required
                name="sku"
                value={form.sku}
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <Field
                label="Slug"
                required
                name="slug"
                value={form.slug}
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <Field
                label="Category"
                required
                name="category"
                value={
                  form.category
                }
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <Field
                label="Sub Category"
                name="subCategory"
                value={
                  form.subCategory
                }
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <Field
                label="Brand"
                name="brand"
                value={
                  form.brand
                }
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />
            </div>
          </Section>

          {/* ===================================================
              SPECIFICATIONS
          =================================================== */}

          <Section
            title="Product Specifications"
            description="Fabric, fit and physical product information."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>
                  Gender
                </Label>

                <select
                  name="gender"
                  value={
                    form.gender
                  }
                  onChange={
                    handleInput
                  }
                  disabled={
                    saving
                  }
                  className={
                    inputClass
                  }
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

              <Field
                label="Fabric"
                name="fabric"
                value={
                  form.fabric
                }
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <Field
                label="Fit"
                name="fit"
                value={
                  form.fit
                }
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <Field
                label="GSM"
                type="number"
                name="gsm"
                value={
                  form.gsm
                }
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <Field
                label="Weight (g)"
                type="number"
                name="weight"
                value={
                  form.weight
                }
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />
            </div>
          </Section>

          {/* ===================================================
              PRICE
          =================================================== */}

          <Section
            title="Pricing & Inventory"
            description="Total stock automatically follows color-wise or size-wise inventory."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="MRP"
                required
                type="number"
                name="mrp"
                value={
                  form.mrp
                }
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <Field
                label="Selling Price"
                required
                type="number"
                name="price"
                value={
                  form.price
                }
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <div>
                <Label>
                  Discount %
                </Label>

                <input
                  type="number"
                  value={
                    calculatedDiscount
                  }
                  readOnly
                  className={
                    inputClass
                  }
                />
              </div>

              <div>
                <Label>
                  Total Stock
                </Label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    calculatedStock
                  }
                  readOnly={
                    hasColorInventory ||
                    form.sizeStocks
                      .length > 0
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "stock",

                      event.target
                        .value
                    )
                  }
                  disabled={
                    saving
                  }
                  className={
                    inputClass
                  }
                />

                <p className="mt-1 text-xs text-gray-500">
                  {hasColorInventory
                    ? "Calculated from color inventory."
                    : form
                          .sizeStocks
                          .length > 0
                      ? "Calculated from product size stock."
                      : "Manual stock."}
                </p>
              </div>

              <Field
                label="Low Stock Limit"
                type="number"
                name="lowStockLimit"
                value={
                  form.lowStockLimit
                }
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <Field
                label="Sort Order"
                type="number"
                name="sortOrder"
                value={
                  form.sortOrder
                }
                onChange={
                  handleInput
                }
                disabled={
                  saving
                }
              />

              <div>
                <Label>
                  Status
                </Label>

                <select
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleInput
                  }
                  disabled={
                    saving
                  }
                  className={
                    inputClass
                  }
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
          </Section>

          {/* ===================================================
              SIZES
          =================================================== */}

          <Section
            title="Sizes & Size-wise Stock"
            description="Manage sizes and optional product-level stock for each size."
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={
                  newSize
                }
                onChange={(
                  event
                ) =>
                  setNewSize(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    addSize();
                  }
                }}
                placeholder="Example: XL"
                disabled={
                  saving
                }
                className={
                  inputClass
                }
              />

              <button
                type="button"
                onClick={
                  addSize
                }
                disabled={
                  saving
                }
                className="rounded-xl bg-black px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                Add Size
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {form.sizes.map(
                (size) => (
                  <span
                    key={size}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold"
                  >
                    {size}

                    <button
                      type="button"
                      onClick={() =>
                        removeSize(
                          size
                        )
                      }
                      disabled={
                        saving
                      }
                      className="text-red-500"
                    >
                      ×
                    </button>
                  </span>
                )
              )}

              {form.sizes.length ===
                0 && (
                <p className="text-sm text-gray-500">
                  No sizes added.
                </p>
              )}
            </div>

            {form.sizes.length >
              0 && (
              <div className="mt-6">
                {form.sizeStocks
                  .length ===
                0 ? (
                  <button
                    type="button"
                    onClick={
                      enableGlobalSizeStock
                    }
                    disabled={
                      saving
                    }
                    className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold disabled:opacity-50"
                  >
                    Enable Product Size Stock
                  </button>
                ) : (
                  <>
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <div className="grid grid-cols-[1fr_160px] bg-gray-100 px-4 py-3 text-xs font-bold uppercase text-gray-600">
                        <span>
                          Size
                        </span>

                        <span>
                          Stock
                        </span>
                      </div>

                      {form.sizeStocks.map(
                        (item) => (
                          <div
                            key={
                              item.size
                            }
                            className="grid grid-cols-[1fr_160px] items-center gap-4 border-t border-gray-100 p-4"
                          >
                            <strong>
                              {
                                item.size
                              }
                            </strong>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={
                                item.stock
                              }
                              onChange={(
                                event
                              ) =>
                                updateGlobalSizeStock(
                                  item.size,

                                  event
                                    .target
                                    .value
                                )
                              }
                              disabled={
                                saving
                              }
                              className={
                                inputClass
                              }
                            />
                          </div>
                        )
                      )}

                      <div className="flex justify-between bg-black p-4 text-white">
                        <strong>
                          Size Total
                        </strong>

                        <strong>
                          {
                            globalSizeStockTotal
                          }
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        disableGlobalSizeStock
                      }
                      disabled={
                        saving
                      }
                      className="mt-3 text-sm font-semibold text-red-600 disabled:opacity-50"
                    >
                      Disable Product Size Stock
                    </button>
                  </>
                )}
              </div>
            )}
          </Section>

          {/* ===================================================
              COLORS
          =================================================== */}

          <Section
            title="Available Colors"
            description="General color options shown to customers."
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={
                  newColor
                }
                onChange={(
                  event
                ) =>
                  setNewColor(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    addColor();
                  }
                }}
                placeholder="Black"
                disabled={
                  saving
                }
                className={
                  inputClass
                }
              />

              <button
                type="button"
                onClick={
                  addColor
                }
                disabled={
                  saving
                }
                className="rounded-xl bg-black px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                Add Color
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {form.colors.map(
                (color) => (
                  <span
                    key={
                      color
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold"
                  >
                    {color}

                    <button
                      type="button"
                      onClick={() =>
                        removeColor(
                          color
                        )
                      }
                      disabled={
                        saving
                      }
                      className="text-red-500"
                    >
                      ×
                    </button>
                  </span>
                )
              )}

              {form.colors.length ===
                0 && (
                <p className="text-sm text-gray-500">
                  No colors added.
                </p>
              )}
            </div>
          </Section>

          {/* ===================================================
              PRODUCT IMAGES
          =================================================== */}

          <Section
            title="Product Images"
            description="Upload main thumbnail and normal product gallery."
          >
            <div className="space-y-8">
              <AdminImageUploader
                label="Main Thumbnail"
                helperText="Primary image used on shop product cards."
                value={
                  form.thumbnail
                    ? [
                        form.thumbnail,
                      ]
                    : []
                }
                onChange={(
                  images
                ) =>
                  updateField(
                    "thumbnail",

                    images[0] ||
                      ""
                  )
                }
                multiple={
                  false
                }
                maxImages={1}
                disabled={
                  saving
                }
                allowUrl
              />

              <AdminImageUploader
                label="Product Gallery"
                helperText="Upload multiple normal product images."
                value={
                  form.images
                }
                onChange={(
                  images
                ) =>
                  updateField(
                    "images",

                    images
                  )
                }
                multiple
                maxImages={20}
                disabled={
                  saving
                }
                allowUrl
              />
            </div>
          </Section>

          {/* ===================================================
              PRODUCT REEL VIDEO
          =================================================== */}

          <AdminProductVideoUploader
            value={
              form.reelVideo
            }
            onChange={
              updateReelVideo
            }
            disabled={
              saving
            }
            label="Product Reel Video"
            helperText="Upload one short reel for the product card. Maximum 30 seconds."
          />

          {/* ===================================================
              360
          =================================================== */}

          <Section
            title="AI 360° Product View"
            description="Generate or manage main and color-specific 360° product frames."
          >
            <Product360Generator
              productId={
                id
              }
              initialProduct360={
                form.product360
              }
              initialColorVariants={
                form.colorVariants
              }
              onSaved={(
                data
              ) =>
                handle360Saved(
                  data
                )
              }
            />
          </Section>

          {/* ===================================================
              COLOR INVENTORY
          =================================================== */}

          <Section
            title="Color-wise Inventory & Images"
            description="Each color can have its own images, optional stock and optional size-wise stock."
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={
                  variantColor
                }
                onChange={(
                  event
                ) =>
                  setVariantColor(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    addColorVariant();
                  }
                }}
                placeholder="Example: Black"
                disabled={
                  saving
                }
                className={
                  inputClass
                }
              />

              <button
                type="button"
                onClick={
                  addColorVariant
                }
                disabled={
                  saving
                }
                className="rounded-xl bg-black px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                Add Color Variant
              </button>
            </div>

            {form.colorVariants
              .length ===
              0 && (
              <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No color variants added.
              </div>
            )}

            <div className="mt-6 space-y-6">
              {form.colorVariants.map(
                (
                  variant,
                  variantIndex
                ) => {
                  const total =
                    getColorStock(
                      variant
                    );

                  const frameCount =
                    variant
                      .product360
                      .frames
                      ?.length ??
                    0;

                  return (
                    <div
                      key={`${variant.color}-${variantIndex}`}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                    >
                      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {
                              variant.color
                            }
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {variant.inventoryEnabled
                              ? `Inventory enabled • Stock ${total}`
                              : "Images only • Inventory not enabled"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeColorVariant(
                              variantIndex
                            )
                          }
                          disabled={
                            saving
                          }
                          className="self-start rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove Variant
                        </button>
                      </div>

                      <AdminImageUploader
                        label={`${variant.color} Images`}
                        helperText={`Upload normal ${variant.color} product images.`}
                        value={
                          variant.images
                        }
                        onChange={(
                          images
                        ) =>
                          updateVariantImages(
                            variantIndex,

                            images
                          )
                        }
                        multiple
                        maxImages={20}
                        disabled={
                          saving
                        }
                        allowUrl
                      />

                      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900">
                              Color Inventory
                            </h4>

                            <p className="mt-1 text-xs text-gray-500">
                              Inventory can be disabled when this color is only used for images or 360°.
                            </p>
                          </div>

                          {!variant.inventoryEnabled ? (
                            <button
                              type="button"
                              onClick={() =>
                                enableVariantInventory(
                                  variantIndex
                                )
                              }
                              disabled={
                                saving
                              }
                              className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Enable Inventory
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                disableVariantInventory(
                                  variantIndex
                                )
                              }
                              disabled={
                                saving
                              }
                              className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                            >
                              Disable Inventory
                            </button>
                          )}
                        </div>

                        {variant.inventoryEnabled && (
                          <div className="mt-5">
                            {variant.sizeStocks
                              .length >
                            0 ? (
                              <>
                                <div className="overflow-hidden rounded-xl border border-gray-200">
                                  <div className="grid grid-cols-[1fr_160px] bg-gray-100 px-4 py-3 text-xs font-bold uppercase text-gray-600">
                                    <span>
                                      Size
                                    </span>

                                    <span>
                                      Stock
                                    </span>
                                  </div>

                                  {variant.sizeStocks.map(
                                    (
                                      item
                                    ) => (
                                      <div
                                        key={
                                          item.size
                                        }
                                        className="grid grid-cols-[1fr_160px] items-center gap-4 border-t border-gray-100 p-4"
                                      >
                                        <strong>
                                          {
                                            item.size
                                          }
                                        </strong>

                                        <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={
                                            item.stock
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            updateVariantSizeStock(
                                              variantIndex,

                                              item.size,

                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          disabled={
                                            saving
                                          }
                                          className={
                                            inputClass
                                          }
                                        />
                                      </div>
                                    )
                                  )}

                                  <div className="flex justify-between bg-black p-4 text-white">
                                    <span className="font-semibold">
                                      {
                                        variant.color
                                      }{" "}
                                      Total
                                    </span>

                                    <strong>
                                      {
                                        total
                                      }
                                    </strong>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    disableVariantSizeStock(
                                      variantIndex
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  className="mt-3 text-sm font-semibold text-gray-700 disabled:opacity-50"
                                >
                                  Use Color Total Stock Instead
                                </button>
                              </>
                            ) : (
                              <div className="space-y-4">
                                <div>
                                  <Label>
                                    {
                                      variant.color
                                    }{" "}
                                    Total Stock
                                  </Label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={
                                      variant.stock
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateVariantStock(
                                        variantIndex,

                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    disabled={
                                      saving
                                    }
                                    className={
                                      inputClass
                                    }
                                  />
                                </div>

                                {form.sizes
                                  .length >
                                  0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      enableVariantSizeStock(
                                        variantIndex
                                      )
                                    }
                                    disabled={
                                      saving
                                    }
                                    className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                                  >
                                    Enable Size-wise Stock
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {frameCount >
                        0 && (
                        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                          <p className="text-sm font-semibold text-green-700">
                            {frameCount}{" "}
                            360° frame
                            {frameCount ===
                            1
                              ? ""
                              : "s"}{" "}
                            saved for{" "}
                            {
                              variant.color
                            }.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {hasColorInventory && (
              <div className="mt-6 flex items-center justify-between rounded-xl bg-black p-5 text-white">
                <div>
                  <p className="font-semibold">
                    All Color Inventory
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Only inventory-enabled colors are counted.
                  </p>
                </div>

                <strong className="text-2xl">
                  {
                    colorStockTotal
                  }
                </strong>
              </div>
            )}
          </Section>

          {/* ===================================================
              DESCRIPTION
          =================================================== */}

          <Section
            title="Description"
            description="Product content shown on the customer product page."
          >
            <div className="space-y-5">
              <div>
                <Label>
                  Short Description
                </Label>

                <textarea
                  name="shortDescription"
                  value={
                    form.shortDescription
                  }
                  onChange={
                    handleInput
                  }
                  rows={3}
                  disabled={
                    saving
                  }
                  className={
                    textareaClass
                  }
                />
              </div>

              <div>
                <Label>
                  Full Description
                </Label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleInput
                  }
                  rows={8}
                  disabled={
                    saving
                  }
                  className={
                    textareaClass
                  }
                />
              </div>
            </div>
          </Section>

          {/* ===================================================
              TAGS
          =================================================== */}

          <Section
            title="Product Tags"
            description="Search and merchandising tags."
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={
                  newTag
                }
                onChange={(
                  event
                ) =>
                  setNewTag(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    addTag();
                  }
                }}
                placeholder="Example: cotton"
                disabled={
                  saving
                }
                className={
                  inputClass
                }
              />

              <button
                type="button"
                onClick={
                  addTag
                }
                disabled={
                  saving
                }
                className="rounded-xl bg-black px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                Add Tag
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {form.tags.map(
                (tag) => (
                  <span
                    key={
                      tag
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold"
                  >
                    #{tag}

                    <button
                      type="button"
                      onClick={() =>
                        removeTag(
                          tag
                        )
                      }
                      disabled={
                        saving
                      }
                      className="text-red-500"
                    >
                      ×
                    </button>
                  </span>
                )
              )}

              {form.tags.length ===
                0 && (
                <p className="text-sm text-gray-500">
                  No tags added.
                </p>
              )}
            </div>
          </Section>

          {/* ===================================================
              FLAGS
          =================================================== */}

          <Section
            title="Product Flags"
            description="Control special product collections."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Checkbox
                label="Featured"
                checked={
                  form.featured
                }
                disabled={
                  saving
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "featured",

                    value
                  )
                }
              />

              <Checkbox
                label="Best Seller"
                checked={
                  form.bestSeller
                }
                disabled={
                  saving
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "bestSeller",

                    value
                  )
                }
              />

              <Checkbox
                label="New Arrival"
                checked={
                  form.newArrival
                }
                disabled={
                  saving
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "newArrival",

                    value
                  )
                }
              />

              <Checkbox
                label="Trending"
                checked={
                  form.trending
                }
                disabled={
                  saving
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "trending",

                    value
                  )
                }
              />
            </div>
          </Section>

          {/* ===================================================
              SEO
          =================================================== */}

          <Section
            title="SEO Information"
            description="Search engine metadata."
          >
            <div className="space-y-5">
              <div>
                <Label>
                  SEO Title
                </Label>

                <input
                  name="seoTitle"
                  value={
                    form.seoTitle
                  }
                  onChange={
                    handleInput
                  }
                  maxLength={70}
                  disabled={
                    saving
                  }
                  className={
                    inputClass
                  }
                />

                <p className="mt-1 text-xs text-gray-400">
                  {
                    form.seoTitle
                      .length
                  }
                  /70
                </p>
              </div>

              <div>
                <Label>
                  SEO Description
                </Label>

                <textarea
                  name="seoDescription"
                  value={
                    form.seoDescription
                  }
                  onChange={
                    handleInput
                  }
                  rows={4}
                  maxLength={160}
                  disabled={
                    saving
                  }
                  className={
                    textareaClass
                  }
                />

                <p className="mt-1 text-xs text-gray-400">
                  {
                    form
                      .seoDescription
                      .length
                  }
                  /160
                </p>
              </div>
            </div>
          </Section>

          {/* ===================================================
              ACTIONS
          =================================================== */}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pb-10 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/admin/products/${id}`
                )
              }
              disabled={
                saving
              }
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="rounded-xl bg-black px-7 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

/* ============================================================
   FIELD
============================================================ */

function Field({
  label,
  name,
  value,
  type = "text",
  required = false,
  disabled = false,
  onChange,
}: {
  label: string;

  name: string;

  value: string;

  type?: string;

  required?: boolean;

  disabled?: boolean;

  onChange: (
    event:
      ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
    <div>
      <Label
        required={
          required
        }
      >
        {label}
      </Label>

      <input
        name={name}
        type={type}
        min={
          type ===
          "number"
            ? "0"
            : undefined
        }
        step={
          type ===
          "number"
            ? "any"
            : undefined
        }
        value={value}
        onChange={
          onChange
        }
        required={
          required
        }
        disabled={
          disabled
        }
        className={
          inputClass
        }
      />
    </div>
  );
}

/* ============================================================
   CHECKBOX
============================================================ */

function Checkbox({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;

  checked: boolean;

  disabled?: boolean;

  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .checked
          )
        }
        disabled={
          disabled
        }
        className="h-5 w-5 accent-black"
      />

      <span className="text-sm font-semibold">
        {label}
      </span>
    </label>
  );
}

/* ============================================================
   STOCK SUMMARY
============================================================ */

function StockSummary({
  title,
  value,
}: {
  title: string;

  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}