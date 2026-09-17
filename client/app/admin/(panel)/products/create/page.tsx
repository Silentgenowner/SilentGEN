"use client";

import {
  FormEvent,
  ReactNode,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import AdminImageUploader from "@/components/admin/AdminImageUploader";

import AdminProductVideoUploader, {
  EMPTY_PRODUCT_REEL_VIDEO,
  type ProductReelVideo,
} from "@/components/admin/AdminProductVideoUploader";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

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
  enabled: boolean;

  frames:
    Product360Frame[];
};

type ColorVariant = {
  color: string;

  images: string[];

  stock: string;

  sizeStocks:
    SizeStock[];

  view360Images:
    string[];

  product360:
    Product360Data;
};

type ProductForm = {
  sku: string;

  name: string;

  slug: string;

  shortDescription:
    string;

  description:
    string;

  category: string;

  subCategory:
    string;

  brand: string;

  gender:
    Gender;

  fabric: string;

  fit: string;

  gsm: string;

  weight: string;

  mrp: string;

  price: string;

  stock: string;

  lowStockLimit:
    string;

  thumbnail:
    string;

  images:
    string[];

  /*
  |--------------------------------------------------------------------------
  | PRODUCT REEL VIDEO
  |--------------------------------------------------------------------------
  */

  reelVideo:
    ProductReelVideo;

  sizes: string;

  colors: string;

  sizeStocks:
    SizeStock[];

  colorVariants:
    ColorVariant[];

  tags: string;

  featured:
    boolean;

  bestSeller:
    boolean;

  newArrival:
    boolean;

  trending:
    boolean;

  status:
    ProductStatus;

  sortOrder:
    string;

  seoTitle:
    string;

  seoDescription:
    string;
};

/*
|--------------------------------------------------------------------------
| INITIAL FORM
|--------------------------------------------------------------------------
*/

const initialForm:
  ProductForm = {
  sku: "",

  name: "",

  slug: "",

  shortDescription:
    "",

  description:
    "",

  category: "",

  subCategory:
    "",

  brand:
    "SilentGEN",

  gender:
    "Unisex",

  fabric: "",

  fit: "",

  gsm: "",

  weight: "",

  mrp: "",

  price: "",

  stock: "0",

  lowStockLimit:
    "5",

  thumbnail: "",

  images: [],

  reelVideo: {
    ...EMPTY_PRODUCT_REEL_VIDEO,
  },

  sizes: "",

  colors: "",

  sizeStocks: [],

  colorVariants:
    [],

  tags: "",

  featured:
    false,

  bestSeller:
    false,

  newArrival:
    false,

  trending:
    false,

  status:
    "Active",

  sortOrder:
    "0",

  seoTitle: "",

  seoDescription:
    "",
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function createSlug(
  value: string
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function textToArray(
  value: string
) {
  const map =
    new Map<
      string,
      string
    >();

  for (
    const rawItem of
    value.split(",")
  ) {
    const item =
      rawItem.trim();

    if (!item) {
      continue;
    }

    const key =
      item.toLowerCase();

    if (
      !map.has(key)
    ) {
      map.set(
        key,
        item
      );
    }
  }

  return Array.from(
    map.values()
  );
}

function cleanStringArray(
  value: string[]
) {
  const map =
    new Map<
      string,
      string
    >();

  for (
    const rawItem of value
  ) {
    const item =
      rawItem.trim();

    if (!item) {
      continue;
    }

    const key =
      item.toLowerCase();

    if (
      !map.has(key)
    ) {
      map.set(
        key,
        item
      );
    }
  }

  return Array.from(
    map.values()
  );
}

function getSizeStockTotal(
  sizeStocks:
    SizeStock[]
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
        Math.floor(
          stock
        )
      );
    },
    0
  );
}

function getColorStock(
  variant:
    ColorVariant
) {
  if (
    variant.sizeStocks
      .length > 0
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
    !Number.isFinite(
      stock
    ) ||
    stock < 0
  ) {
    return 0;
  }

  return Math.floor(
    stock
  );
}

/*
|--------------------------------------------------------------------------
| UI CLASSES
|--------------------------------------------------------------------------
*/

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-gray-100 disabled:text-gray-500";

const textareaClass =
  "w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-gray-100 disabled:text-gray-500";

/*
|--------------------------------------------------------------------------
| SECTION
|--------------------------------------------------------------------------
*/

function Section({
  title,
  description,
  children,
}: {
  title: string;

  description?:
    string;

  children:
    ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900">
          {title}
        </h3>

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

/*
|--------------------------------------------------------------------------
| LABEL
|--------------------------------------------------------------------------
*/

function Label({
  children,
  required = false,
}: {
  children:
    ReactNode;

  required?:
    boolean;
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

/*
|--------------------------------------------------------------------------
| MAIN PAGE
|--------------------------------------------------------------------------
*/

export default function CreateProductPage() {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] =
    useState<ProductForm>(
      initialForm
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | UPDATE FIELD
  |--------------------------------------------------------------------------
  */

  function updateField<
    K extends keyof ProductForm,
  >(
    field: K,
    value:
      ProductForm[K]
  ) {
    setForm(
      (current) => ({
        ...current,

        [field]:
          value,
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT REEL
  |--------------------------------------------------------------------------
  */

  function updateReelVideo(
    reelVideo:
      ProductReelVideo
  ) {
    setForm(
      (current) => ({
        ...current,

        reelVideo,
      })
    );

    setError("");
  }

  /*
  |--------------------------------------------------------------------------
  | NAME + SLUG
  |--------------------------------------------------------------------------
  */

  function handleNameChange(
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,

        name:
          value,

        slug:
          current.slug ||
          createSlug(
            value
          ),
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PARSED SIZES
  |--------------------------------------------------------------------------
  */

  const parsedSizes =
    useMemo(
      () =>
        textToArray(
          form.sizes
        ),
      [
        form.sizes,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | GLOBAL SIZE STOCK
  |--------------------------------------------------------------------------
  */

  function syncGlobalSizeStocks(
    sizes: string[]
  ) {
    setForm(
      (current) => {
        const existingMap =
          new Map(
            current
              .sizeStocks
              .map(
                (item) => [
                  item.size.toLowerCase(),

                  item.stock,
                ]
              )
          );

        return {
          ...current,

          sizeStocks:
            sizes.map(
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

  function handleSizesChange(
    value: string
  ) {
    const sizes =
      textToArray(
        value
      );

    setForm(
      (current) => {
        const existingMap =
          new Map(
            current
              .sizeStocks
              .map(
                (item) => [
                  item.size.toLowerCase(),

                  item.stock,
                ]
              )
          );

        const sizeStocks =
          sizes.map(
            (size) => ({
              size,

              stock:
                existingMap.get(
                  size.toLowerCase()
                ) ??
                "0",
            })
          );

        const colorVariants =
          current
            .colorVariants
            .map(
              (variant) => {
                const variantMap =
                  new Map(
                    variant
                      .sizeStocks
                      .map(
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
                          ) ??
                          "0",
                      })
                    ),
                };
              }
            );

        return {
          ...current,

          sizes:
            value,

          sizeStocks,

          colorVariants,
        };
      }
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
          Number(
            stock
          )
        ) ||
        Number(
          stock
        ) < 0
      )
    ) {
      return;
    }

    const normalizedSize =
      size.toLowerCase();

    setForm(
      (current) => ({
        ...current,

        sizeStocks:
          current
            .sizeStocks
            .map(
              (item) =>
                item.size.toLowerCase() ===
                normalizedSize
                  ? {
                      ...item,

                      stock,
                    }
                  : item
            ),
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | COLOR VARIANT
  |--------------------------------------------------------------------------
  */

  function addColorVariant() {
    setForm(
      (current) => ({
        ...current,

        colorVariants: [
          ...current
            .colorVariants,

          {
            color: "",

            images: [],

            stock:
              "0",

            sizeStocks:
              parsedSizes.map(
                (size) => ({
                  size,

                  stock:
                    "0",
                })
              ),

            view360Images:
              [],

            product360: {
              enabled:
                false,

              frames:
                [],
            },
          },
        ],
      })
    );
  }

  function removeColorVariant(
    colorIndex:
      number
  ) {
    setForm(
      (current) => ({
        ...current,

        colorVariants:
          current
            .colorVariants
            .filter(
              (
                _,
                index
              ) =>
                index !==
                colorIndex
            ),
      })
    );
  }

  function updateColorName(
    colorIndex:
      number,
    value:
      string
  ) {
    setForm(
      (current) => ({
        ...current,

        colorVariants:
          current
            .colorVariants
            .map(
              (
                variant,
                index
              ) =>
                index ===
                colorIndex
                  ? {
                      ...variant,

                      color:
                        value,
                    }
                  : variant
            ),
      })
    );
  }

  function updateColorImages(
    colorIndex:
      number,
    images:
      string[]
  ) {
    setForm(
      (current) => ({
        ...current,

        colorVariants:
          current
            .colorVariants
            .map(
              (
                variant,
                index
              ) =>
                index ===
                colorIndex
                  ? {
                      ...variant,

                      images:
                        cleanStringArray(
                          images
                        ),
                    }
                  : variant
            ),
      })
    );
  }

  function updateColorStock(
    colorIndex:
      number,
    stock:
      string
  ) {
    if (
      stock !== "" &&
      (
        !Number.isFinite(
          Number(
            stock
          )
        ) ||
        Number(
          stock
        ) < 0
      )
    ) {
      return;
    }

    setForm(
      (current) => ({
        ...current,

        colorVariants:
          current
            .colorVariants
            .map(
              (
                variant,
                index
              ) =>
                index ===
                colorIndex
                  ? {
                      ...variant,

                      stock,
                    }
                  : variant
            ),
      })
    );
  }

  function updateColorSizeStock(
    colorIndex:
      number,
    size:
      string,
    stock:
      string
  ) {
    if (
      stock !== "" &&
      (
        !Number.isFinite(
          Number(
            stock
          )
        ) ||
        Number(
          stock
        ) < 0
      )
    ) {
      return;
    }

    const normalizedSize =
      size.toLowerCase();

    setForm(
      (current) => ({
        ...current,

        colorVariants:
          current
            .colorVariants
            .map(
              (
                variant,
                index
              ) =>
                index ===
                colorIndex
                  ? {
                      ...variant,

                      sizeStocks:
                        variant
                          .sizeStocks
                          .map(
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

  /*
  |--------------------------------------------------------------------------
  | TOTAL STOCK
  |--------------------------------------------------------------------------
  */

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

  const colorStockTotal =
    useMemo(
      () =>
        form.colorVariants.reduce(
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
        form.colorVariants,
      ]
    );

  const calculatedStock =
    useMemo(
      () => {
        if (
          form.colorVariants
            .length > 0
        ) {
          return colorStockTotal;
        }

        if (
          form.sizeStocks
            .length > 0
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
      },
      [
        form.colorVariants
          .length,

        form.sizeStocks
          .length,

        form.stock,

        colorStockTotal,

        globalSizeStockTotal,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | DISCOUNT
  |--------------------------------------------------------------------------
  */

  const calculatedDiscount =
    useMemo(
      () => {
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
              ((mrp -
                price) /
                mrp) *
                100
            )
          )
        );
      },
      [
        form.mrp,
        form.price,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  function validateForm():
    | string
    | null {
    if (
      !form.sku.trim()
    ) {
      return "SKU is required.";
    }

    if (
      !form.name.trim()
    ) {
      return "Product name is required.";
    }

    if (
      !form.category.trim()
    ) {
      return "Category is required.";
    }

    if (
      form.mrp.trim() ===
      ""
    ) {
      return "MRP is required.";
    }

    if (
      form.price.trim() ===
      ""
    ) {
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

    const lowStockLimit =
      Number(
        form.lowStockLimit
      );

    const gsm =
      form.gsm.trim()
        ? Number(
            form.gsm
          )
        : 0;

    const weight =
      form.weight.trim()
        ? Number(
            form.weight
          )
        : 0;

    const sortOrder =
      form.sortOrder.trim()
        ? Number(
            form.sortOrder
          )
        : 0;

    if (
      !Number.isFinite(
        mrp
      ) ||
      mrp < 0
    ) {
      return "MRP must be a valid non-negative number.";
    }

    if (
      !Number.isFinite(
        price
      ) ||
      price < 0
    ) {
      return "Selling price must be a valid non-negative number.";
    }

    if (
      price > mrp
    ) {
      return "Selling price cannot be greater than MRP.";
    }

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

    if (
      !Number.isFinite(
        gsm
      ) ||
      gsm < 0
    ) {
      return "GSM must be a valid non-negative number.";
    }

    if (
      !Number.isFinite(
        weight
      ) ||
      weight < 0
    ) {
      return "Weight must be a valid non-negative number.";
    }

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
    | MANUAL STOCK
    |--------------------------------------------------------------------------
    */

    if (
      form.colorVariants
        .length === 0 &&
      form.sizeStocks
        .length === 0
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
    | PRODUCT REEL
    |--------------------------------------------------------------------------
    */

    if (
      form.reelVideo
        .url.trim()
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
    | GLOBAL SIZE STOCK
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
    | COLOR VARIANTS
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

    for (
      const variant of
      form.colorVariants
    ) {
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

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const validationError =
      validateForm();

    if (
      validationError
    ) {
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

    const mrp =
      Number(
        form.mrp
      );

    const price =
      Number(
        form.price
      );

    const lowStockLimit =
      Number(
        form.lowStockLimit
      );

    const gsm =
      form.gsm.trim()
        ? Number(
            form.gsm
          )
        : 0;

    const weight =
      form.weight.trim()
        ? Number(
            form.weight
          )
        : 0;

    const sortOrder =
      form.sortOrder.trim()
        ? Number(
            form.sortOrder
          )
        : 0;

    const sizes =
      textToArray(
        form.sizes
      );

    const manualColors =
      textToArray(
        form.colors
      );

    const cleanedSizeStocks =
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

    const cleanedColorVariants =
      form.colorVariants.map(
        (variant) => ({
          color:
            variant.color.trim(),

          images:
            cleanStringArray(
              variant.images
            ),

          stock:
            getColorStock(
              variant
            ),

          sizeStocks:
            variant.sizeStocks.map(
              (item) => ({
                size:
                  item.size.trim(),

                stock:
                  Number(
                    item.stock
                  ),
              })
            ),

          view360Images:
            cleanStringArray(
              variant
                .view360Images
            ),

          product360: {
            enabled:
              variant.product360
                .frames.length >
              0,

            frames:
              variant
                .product360
                .frames,
          },
        })
      );

    const variantColors =
      cleanedColorVariants.map(
        (variant) =>
          variant.color
      );

    const colorMap =
      new Map<
        string,
        string
      >();

    for (
      const color of [
        ...manualColors,
        ...variantColors,
      ]
    ) {
      const cleaned =
        color.trim();

      if (!cleaned) {
        continue;
      }

      const key =
        cleaned.toLowerCase();

      if (
        !colorMap.has(
          key
        )
      ) {
        colorMap.set(
          key,
          cleaned
        );
      }
    }

    const colors =
      Array.from(
        colorMap.values()
      );

    const reelVideo =
      form.reelVideo
        .url.trim()
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

    try {
      setLoading(
        true
      );

      const response =
        await fetch(
          "/api/admin/products",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                sku:
                  form.sku
                    .trim()
                    .toUpperCase(),

                name:
                  form.name
                    .trim(),

                slug:
                  createSlug(
                    form.slug ||
                      form.name
                  ),

                shortDescription:
                  form.shortDescription
                    .trim(),

                description:
                  form.description
                    .trim(),

                category:
                  form.category
                    .trim(),

                subCategory:
                  form.subCategory
                    .trim(),

                brand:
                  form.brand.trim() ||
                  "SilentGEN",

                gender:
                  form.gender,

                fabric:
                  form.fabric
                    .trim(),

                fit:
                  form.fit
                    .trim(),

                gsm,

                weight,

                mrp,

                price,

                discount:
                  calculatedDiscount,

                stock:
                  calculatedStock,

                lowStockLimit,

                thumbnail:
                  form.thumbnail
                    .trim(),

                images:
                  cleanStringArray(
                    form.images
                  ),

                /*
                |--------------------------------------------------------------------------
                | PRODUCT REEL
                |--------------------------------------------------------------------------
                */

                reelVideo,

                sizes,

                colors,

                sizeStocks:
                  cleanedSizeStocks,

                colorVariants:
                  cleanedColorVariants,

                tags:
                  textToArray(
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

                status:
                  calculatedStock <=
                    0 &&
                  form.status ===
                    "Active"
                    ? "Out of Stock"
                    : form.status,

                sortOrder,

                seoTitle:
                  form.seoTitle
                    .trim(),

                seoDescription:
                  form.seoDescription
                    .trim(),
              }),
          }
        );

      const responseText =
        await response.text();

      let data:
        | {
            success?:
              boolean;

            message?:
              string;

            error?:
              string;
          }
        | null =
        null;

      if (
        responseText.trim()
      ) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch {
          data =
            null;
        }
      }

      if (
        !response.ok
      ) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Unable to create product (${response.status}).`
        );
      }

      if (
        data?.success ===
        false
      ) {
        throw new Error(
          data.message ||
            "Unable to create product."
        );
      }

      router.replace(
        "/admin/products"
      );

      router.refresh();
    } catch (err) {
      console.error(
        "CREATE PRODUCT ERROR:",
        err
      );

      setError(
        err instanceof
          Error
          ? err.message
          : "Something went wrong. Please try again."
      );

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    } finally {
      setLoading(
        false
      );
    }
  }
    /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        {/* HEADER */}

        <div className="mb-6">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-black"
          >
            <ArrowLeft size={17} />

            Back to Products
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
            Add New Product
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Add product details, images,
            reel video, size-wise stock,
            color-wise stock and inventory.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        {/* TOTAL STOCK SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StockSummary
            title="Product Total Stock"
            value={calculatedStock}
          />

          <StockSummary
            title="Size Stock"
            value={globalSizeStockTotal}
          />

          <StockSummary
            title="Color Stock"
            value={colorStockTotal}
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            {/* LEFT */}

            <div className="space-y-6">
              {/* BASIC */}

              <Section
                title="Basic Information"
                description="Main product identity and category information."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <Label required>
                      SKU
                    </Label>

                    <input
                      value={form.sku}
                      onChange={(event) =>
                        updateField(
                          "sku",
                          event.target.value
                        )
                      }
                      placeholder="SG-TSHIRT-001"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label required>
                      Product Name
                    </Label>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        handleNameChange(
                          event.target.value
                        )
                      }
                      placeholder="Classic Cotton T-Shirt"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label>
                      Product Slug
                    </Label>

                    <input
                      value={form.slug}
                      onChange={(event) =>
                        updateField(
                          "slug",
                          event.target.value
                        )
                      }
                      placeholder="classic-cotton-t-shirt"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label required>
                      Category
                    </Label>

                    <input
                      value={form.category}
                      onChange={(event) =>
                        updateField(
                          "category",
                          event.target.value
                        )
                      }
                      placeholder="T-Shirts"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label>
                      Sub Category
                    </Label>

                    <input
                      value={form.subCategory}
                      onChange={(event) =>
                        updateField(
                          "subCategory",
                          event.target.value
                        )
                      }
                      placeholder="Oversized T-Shirts"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label>
                      Brand
                    </Label>

                    <input
                      value={form.brand}
                      onChange={(event) =>
                        updateField(
                          "brand",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <Label>
                    Short Description
                  </Label>

                  <textarea
                    value={form.shortDescription}
                    onChange={(event) =>
                      updateField(
                        "shortDescription",
                        event.target.value
                      )
                    }
                    rows={3}
                    disabled={loading}
                    className={textareaClass}
                  />
                </div>

                <div className="mt-5">
                  <Label>
                    Full Description
                  </Label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                    rows={7}
                    disabled={loading}
                    className={textareaClass}
                  />
                </div>
              </Section>

              {/* PRICING */}

              <Section
                title="Pricing & Inventory"
                description="Total stock is automatically calculated when size/color stock is configured."
              >
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label required>
                      MRP (₹)
                    </Label>

                    <input
                      type="number"
                      min="0"
                      value={form.mrp}
                      onChange={(event) =>
                        updateField(
                          "mrp",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label required>
                      Selling Price (₹)
                    </Label>

                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(event) =>
                        updateField(
                          "price",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label>
                      Discount %
                    </Label>

                    <input
                      type="number"
                      value={calculatedDiscount}
                      readOnly
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label>
                      Total Available Stock
                    </Label>

                    <input
                      type="number"
                      min="0"
                      value={calculatedStock}
                      readOnly={
                        form.sizeStocks.length > 0 ||
                        form.colorVariants.length > 0
                      }
                      onChange={(event) =>
                        updateField(
                          "stock",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      className={inputClass}
                    />

                    <p className="mt-1 text-xs text-gray-500">
                      {form.colorVariants.length > 0
                        ? "Calculated from all color variants."
                        : form.sizeStocks.length > 0
                          ? "Calculated from size stock."
                          : "Manual stock."}
                    </p>
                  </div>

                  <div>
                    <Label>
                      Low Stock Alert At
                    </Label>

                    <input
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
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label>
                      GSM
                    </Label>

                    <input
                      type="number"
                      min="0"
                      value={form.gsm}
                      onChange={(event) =>
                        updateField(
                          "gsm",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label>
                      Weight (g)
                    </Label>

                    <input
                      type="number"
                      min="0"
                      value={form.weight}
                      onChange={(event) =>
                        updateField(
                          "weight",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label>
                      Sort Order
                    </Label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.sortOrder}
                      onChange={(event) =>
                        updateField(
                          "sortOrder",
                          event.target.value
                        )
                      }
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label>
                      Product Status
                    </Label>

                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateField(
                          "status",
                          event.target.value as ProductStatus
                        )
                      }
                      disabled={loading}
                      className={inputClass}
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

              {/* PRODUCT IMAGES */}

              <Section
                title="Product Images"
                description="Upload thumbnail and gallery images."
              >
                <div className="space-y-8">
                  <AdminImageUploader
                    label="Main Thumbnail"
                    helperText="Primary image shown on product cards."
                    value={
                      form.thumbnail
                        ? [form.thumbnail]
                        : []
                    }
                    onChange={(images) =>
                      updateField(
                        "thumbnail",
                        images[0] || ""
                      )
                    }
                    multiple={false}
                    maxImages={1}
                    disabled={loading}
                    allowUrl
                  />

                  <AdminImageUploader
                    label="Product Gallery"
                    helperText="Upload multiple product images."
                    value={form.images}
                    onChange={(images) =>
                      updateField(
                        "images",
                        images
                      )
                    }
                    multiple
                    maxImages={20}
                    disabled={loading}
                    allowUrl
                  />
                </div>
              </Section>

              {/* PRODUCT REEL VIDEO */}

              <AdminProductVideoUploader
                value={form.reelVideo}
                onChange={updateReelVideo}
                disabled={loading}
                label="Product Reel Video"
                helperText="Upload one short product reel. MP4, WEBM or MOV. Maximum 30 seconds."
              />

              {/* GLOBAL SIZE STOCK */}

              <Section
                title="Size-wise Stock"
                description="Enter the stock available for every product size. If colors have their own size stock, color stock gets priority for total inventory."
              >
                <div>
                  <Label>
                    Sizes
                  </Label>

                  <input
                    value={form.sizes}
                    onChange={(event) =>
                      handleSizesChange(
                        event.target.value
                      )
                    }
                    onBlur={() =>
                      syncGlobalSizeStocks(
                        textToArray(
                          form.sizes
                        )
                      )
                    }
                    placeholder="S, M, L, XL, XXL"
                    disabled={loading}
                    className={inputClass}
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Separate sizes with commas.
                  </p>
                </div>

                {form.sizeStocks.length > 0 && (
                  <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
                    <div className="grid grid-cols-[1fr_160px] bg-gray-100 px-4 py-3 text-xs font-bold uppercase text-gray-600">
                      <span>
                        Size
                      </span>

                      <span>
                        Stock
                      </span>
                    </div>

                    {form.sizeStocks.map(
                      (item, index) => (
                        <div
                          key={`${item.size}-${index}`}
                          className="grid grid-cols-[1fr_160px] items-center gap-4 border-t border-gray-100 px-4 py-3"
                        >
                          <span className="font-semibold text-gray-900">
                            {item.size}
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.stock}
                            onChange={(event) =>
                              updateGlobalSizeStock(
                                item.size,
                                event.target.value
                              )
                            }
                            disabled={loading}
                            className={inputClass}
                          />
                        </div>
                      )
                    )}

                    <div className="flex items-center justify-between border-t border-gray-200 bg-black px-4 py-4 text-white">
                      <span className="font-semibold">
                        Size Total
                      </span>

                      <span className="text-lg font-bold">
                        {globalSizeStockTotal}
                      </span>
                    </div>
                  </div>
                )}

                {!form.sizeStocks.length && (
                  <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
                    Add sizes above to create
                    size-wise inventory.
                  </div>
                )}
              </Section>

              {/* COLOR VARIANTS */}

              <Section
                title="Color-wise Inventory & Images"
                description="Each color can have separate product images and separate size-wise stock."
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Example: Black S = 10,
                      Black M = 20,
                      White S = 8.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addColorVariant}
                    disabled={loading}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    <Plus size={16} />

                    Add Color
                  </button>
                </div>

                {!form.colorVariants.length && (
                  <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                    <p className="text-sm font-semibold text-gray-700">
                      No color variants added.
                    </p>
                  </div>
                )}

                <div className="mt-5 space-y-6">
                  {form.colorVariants.map(
                    (
                      variant,
                      colorIndex
                    ) => {
                      const colorTotal =
                        getColorStock(
                          variant
                        );

                      return (
                        <div
                          key={colorIndex}
                          className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                        >
                          <div className="flex flex-col gap-4 border-b border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
                            <div className="min-w-0 flex-1">
                              <Label>
                                Color Name
                              </Label>

                              <input
                                value={variant.color}
                                onChange={(event) =>
                                  updateColorName(
                                    colorIndex,
                                    event.target.value
                                  )
                                }
                                placeholder="Black"
                                disabled={loading}
                                className={inputClass}
                              />
                            </div>

                            <div className="rounded-xl bg-black px-5 py-3 text-center text-white">
                              <p className="text-[11px] uppercase text-gray-300">
                                Color Stock
                              </p>

                              <p className="mt-1 text-xl font-bold">
                                {colorTotal}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeColorVariant(
                                  colorIndex
                                )
                              }
                              disabled={loading}
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="space-y-7 p-4 sm:p-5">
                            <AdminImageUploader
                              label={
                                variant.color.trim()
                                  ? `${variant.color} Images`
                                  : "Color Images"
                              }
                              helperText="Upload product photos for this color."
                              value={variant.images}
                              onChange={(images) =>
                                updateColorImages(
                                  colorIndex,
                                  images
                                )
                              }
                              multiple
                              maxImages={20}
                              disabled={loading}
                              allowUrl
                            />

                            <div>
                              <h4 className="font-bold text-gray-900">
                                Size-wise Stock
                              </h4>

                              <p className="mt-1 text-xs text-gray-500">
                                Stock for each size of
                                this color.
                              </p>

                              {variant.sizeStocks.length > 0 ? (
                                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                                      item,
                                      index
                                    ) => (
                                      <div
                                        key={`${item.size}-${index}`}
                                        className="grid grid-cols-[1fr_160px] items-center gap-4 border-t border-gray-100 px-4 py-3"
                                      >
                                        <span className="font-semibold text-gray-800">
                                          {item.size}
                                        </span>

                                        <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={item.stock}
                                          onChange={(event) =>
                                            updateColorSizeStock(
                                              colorIndex,
                                              item.size,
                                              event.target.value
                                            )
                                          }
                                          disabled={loading}
                                          className={inputClass}
                                        />
                                      </div>
                                    )
                                  )}

                                  <div className="flex justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
                                    <span className="font-semibold text-gray-700">
                                      {variant.color || "Color"}{" "}
                                      Total
                                    </span>

                                    <span className="font-bold text-black">
                                      {colorTotal}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4">
                                  <Label>
                                    Color Stock
                                  </Label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={variant.stock}
                                    onChange={(event) =>
                                      updateColorStock(
                                        colorIndex,
                                        event.target.value
                                      )
                                    }
                                    disabled={loading}
                                    className={inputClass}
                                  />

                                  <p className="mt-2 text-xs text-gray-500">
                                    Add product sizes above
                                    if you want size-wise
                                    stock.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {form.colorVariants.length > 0 && (
                  <div className="mt-6 flex items-center justify-between rounded-xl bg-black px-5 py-4 text-white">
                    <div>
                      <p className="text-xs uppercase text-gray-300">
                        All Colors Total
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Final available inventory
                      </p>
                    </div>

                    <span className="text-2xl font-bold">
                      {colorStockTotal}
                    </span>
                  </div>
                )}
              </Section>
            </div>

            {/* RIGHT */}

            <div className="space-y-6">
              {/* DETAILS */}

              <Section title="Product Details">
                <div className="space-y-5">
                  <div>
                    <Label>
                      Gender
                    </Label>

                    <select
                      value={form.gender}
                      onChange={(event) =>
                        updateField(
                          "gender",
                          event.target.value as Gender
                        )
                      }
                      disabled={loading}
                      className={inputClass}
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

                  <div>
                    <Label>
                      Fabric
                    </Label>

                    <input
                      value={form.fabric}
                      onChange={(event) =>
                        updateField(
                          "fabric",
                          event.target.value
                        )
                      }
                      placeholder="100% Cotton"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label>
                      Fit
                    </Label>

                    <input
                      value={form.fit}
                      onChange={(event) =>
                        updateField(
                          "fit",
                          event.target.value
                        )
                      }
                      placeholder="Oversized"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label>
                      Sizes
                    </Label>

                    <input
                      value={form.sizes}
                      onChange={(event) =>
                        handleSizesChange(
                          event.target.value
                        )
                      }
                      placeholder="S, M, L, XL"
                      disabled={loading}
                      className={inputClass}
                    />

                    <p className="mt-1 text-xs text-gray-500">
                      Changing this updates all
                      size-stock tables.
                    </p>
                  </div>

                  <div>
                    <Label>
                      Colors
                    </Label>

                    <input
                      value={form.colors}
                      onChange={(event) =>
                        updateField(
                          "colors",
                          event.target.value
                        )
                      }
                      placeholder="Black, White"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </div>
              </Section>

              {/* REEL SUMMARY */}

              <Section
                title="Reel Status"
                description="Quick product reel summary."
              >
                {form.reelVideo.url.trim() ? (
                  <div className="space-y-3">
                    <SummaryRow
                      label="Reel"
                      value={
                        form.reelVideo.enabled
                          ? "Enabled"
                          : "Disabled"
                      }
                    />

                    <SummaryRow
                      label="Duration"
                      value={`${Number(
                        form.reelVideo.duration
                      ).toFixed(1)} sec`}
                    />

                    <div className="overflow-hidden rounded-xl bg-black">
                      <video
                        src={form.reelVideo.url}
                        poster={
                          form.reelVideo.poster ||
                          undefined
                        }
                        muted
                        controls
                        playsInline
                        preload="metadata"
                        className="aspect-[9/16] max-h-[360px] w-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
                    No reel uploaded.
                  </div>
                )}
              </Section>

              {/* TAGS */}

              <Section title="Visibility & Tags">
                <div>
                  <Label>
                    Search Tags
                  </Label>

                  <input
                    value={form.tags}
                    onChange={(event) =>
                      updateField(
                        "tags",
                        event.target.value
                      )
                    }
                    placeholder="cotton, t-shirt, casual"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                <div className="mt-5 space-y-3">
                  <CheckField
                    label="Featured Product"
                    checked={form.featured}
                    disabled={loading}
                    onChange={(value) =>
                      updateField(
                        "featured",
                        value
                      )
                    }
                  />

                  <CheckField
                    label="Best Seller"
                    checked={form.bestSeller}
                    disabled={loading}
                    onChange={(value) =>
                      updateField(
                        "bestSeller",
                        value
                      )
                    }
                  />

                  <CheckField
                    label="New Arrival"
                    checked={form.newArrival}
                    disabled={loading}
                    onChange={(value) =>
                      updateField(
                        "newArrival",
                        value
                      )
                    }
                  />

                  <CheckField
                    label="Trending Product"
                    checked={form.trending}
                    disabled={loading}
                    onChange={(value) =>
                      updateField(
                        "trending",
                        value
                      )
                    }
                  />
                </div>
              </Section>

              {/* SEO */}

              <Section title="SEO">
                <div className="space-y-5">
                  <div>
                    <Label>
                      SEO Title
                    </Label>

                    <input
                      value={form.seoTitle}
                      onChange={(event) =>
                        updateField(
                          "seoTitle",
                          event.target.value
                        )
                      }
                      maxLength={70}
                      disabled={loading}
                      className={inputClass}
                    />

                    <p className="mt-1 text-xs text-gray-400">
                      {form.seoTitle.length}
                      /70
                    </p>
                  </div>

                  <div>
                    <Label>
                      SEO Description
                    </Label>

                    <textarea
                      value={form.seoDescription}
                      onChange={(event) =>
                        updateField(
                          "seoDescription",
                          event.target.value
                        )
                      }
                      rows={4}
                      maxLength={160}
                      disabled={loading}
                      className={textareaClass}
                    />

                    <p className="mt-1 text-xs text-gray-400">
                      {
                        form.seoDescription
                          .length
                      }
                      /160
                    </p>
                  </div>
                </div>
              </Section>

              {/* INVENTORY SUMMARY */}

              <Section title="Inventory Summary">
                <div className="space-y-3">
                  <SummaryRow
                    label="Sizes"
                    value={
                      parsedSizes.length
                    }
                  />

                  <SummaryRow
                    label="Colors"
                    value={
                      form.colorVariants
                        .length
                    }
                  />

                  <SummaryRow
                    label="Global Size Stock"
                    value={
                      globalSizeStockTotal
                    }
                  />

                  <SummaryRow
                    label="Color Stock"
                    value={
                      colorStockTotal
                    }
                  />

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-black px-4 py-4 text-white">
                    <span className="font-semibold">
                      Total Stock
                    </span>

                    <span className="text-xl font-bold">
                      {calculatedStock}
                    </span>
                  </div>
                </div>
              </Section>

              {/* ACTION */}

              <div className="sticky bottom-4 space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 font-semibold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={18} />
                  )}

                  {loading
                    ? "Creating Product..."
                    : "Create Product"}
                </button>

                <Link
                  href="/admin/products"
                  className="flex w-full items-center justify-center rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| CHECK FIELD
|--------------------------------------------------------------------------
*/

function CheckField({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;

  checked:
    boolean;

  onChange:
    (
      checked:
        boolean
    ) => void;

  disabled?:
    boolean;
}) {
  return (
    <label
      className={`
        flex
        items-center
        gap-3
        rounded-xl
        border
        border-gray-200
        bg-gray-50
        p-3
        text-sm
        text-gray-700

        ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer"
        }
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        disabled={disabled}
        className="h-4 w-4 accent-black"
      />

      {label}
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| STOCK SUMMARY
|--------------------------------------------------------------------------
*/

function StockSummary({
  title,
  value,
}: {
  title: string;

  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SUMMARY ROW
|--------------------------------------------------------------------------
*/

function SummaryRow({
  label,
  value,
}: {
  label: string;

  value:
    | string
    | number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
      <span className="text-sm text-gray-600">
        {label}
      </span>

      <span className="text-right text-sm font-bold text-gray-900">
        {value}
      </span>
    </div>
  );
}