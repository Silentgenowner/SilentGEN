"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type CategoryFilterProps = {
  selectedCategory: string;

  setSelectedCategory: React.Dispatch<
    React.SetStateAction<string>
  >;
};

type ProductListFilters = {
  genders?: string[];

  categories?: string[];

  subCategories?: string[];

  newArrivals?: boolean;

  bestSellers?: boolean;

  offers?: boolean;

  trending?: boolean;
};

type ProductListApiResponse = {
  success?: boolean;

  message?: string;

  filters?: ProductListFilters;
};

type CategoryItem = {
  name: string;

  value: string;

  image?: string;

  count?: number;
};

/*
|--------------------------------------------------------------------------
| FALLBACK CATEGORY STYLES
|--------------------------------------------------------------------------
*/

const FALLBACK_CATEGORY_STYLES = [
  "bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500",
  "bg-gradient-to-br from-slate-800 via-slate-600 to-slate-400",
  "bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500",
  "bg-gradient-to-br from-zinc-800 via-zinc-600 to-zinc-400",
  "bg-gradient-to-br from-stone-800 via-stone-600 to-stone-400",
];

/*
|--------------------------------------------------------------------------
| CATEGORY IMAGE MAP
|--------------------------------------------------------------------------
|
| Optional static category images.
|
| If image is not present,
| CSS fallback will automatically appear.
|
|--------------------------------------------------------------------------
*/

const CATEGORY_IMAGE_MAP: Record<
  string,
  string
> = {
  shirts:
    "/images/shirt.jpg",

  shirt:
    "/images/shirt.jpg",

  "t-shirts":
    "/images/tshirt.jpg",

  tshirts:
    "/images/tshirt.jpg",

  "t shirt":
    "/images/tshirt.jpg",

  "t-shirt":
    "/images/tshirt.jpg",

  jeans:
    "/images/jeans.jpg",

  jean:
    "/images/jeans.jpg",

  shoes:
    "/images/shoes.jpg",

  shoe:
    "/images/shoes.jpg",

  watches:
    "/images/watch.jpg",

  watch:
    "/images/watch.jpg",

  bags:
    "/images/bag.jpg",

  bag:
    "/images/bag.jpg",
};

/*
|--------------------------------------------------------------------------
| CLEAN STRING
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

/*
|--------------------------------------------------------------------------
| NORMALIZE VALUE
|--------------------------------------------------------------------------
*/

function normalizeValue(
  value: unknown
): string {
  return cleanString(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

/*
|--------------------------------------------------------------------------
| CATEGORY IMAGE
|--------------------------------------------------------------------------
*/

function getCategoryImage(
  category: string
): string {
  const raw =
    cleanString(category)
      .toLowerCase();

  if (!raw) {
    return "";
  }

  if (
    CATEGORY_IMAGE_MAP[raw]
  ) {
    return CATEGORY_IMAGE_MAP[
      raw
    ];
  }

  const normalized =
    raw
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  if (
    CATEGORY_IMAGE_MAP[
      normalized
    ]
  ) {
    return CATEGORY_IMAGE_MAP[
      normalized
    ];
  }

  const compact =
    normalized.replace(
      /\s+/g,
      ""
    );

  if (
    CATEGORY_IMAGE_MAP[
      compact
    ]
  ) {
    return CATEGORY_IMAGE_MAP[
      compact
    ];
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| FORMAT CATEGORY NAME
|--------------------------------------------------------------------------
*/

function formatCategoryName(
  value: string
): string {
  const cleaned =
    cleanString(value);

  if (!cleaned) {
    return "";
  }

  return cleaned
    .replace(
      /[-_]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .split(" ")
    .map((word) => {
      if (!word) {
        return "";
      }

      if (
        word.length <= 2 &&
        word ===
          word.toUpperCase()
      ) {
        return word;
      }

      return (
        word.charAt(0).toUpperCase() +
        word.slice(1)
      );
    })
    .join(" ");
}

/*
|--------------------------------------------------------------------------
| UNIQUE CATEGORIES
|--------------------------------------------------------------------------
*/

function buildCategoryItems(
  value: unknown
): CategoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const categoryMap =
    new Map<
      string,
      CategoryItem
    >();

  for (const item of value) {
    const categoryValue =
      cleanString(item);

    if (!categoryValue) {
      continue;
    }

    const key =
      normalizeValue(
        categoryValue
      );

    if (!key) {
      continue;
    }

    if (
      categoryMap.has(key)
    ) {
      continue;
    }

    categoryMap.set(
      key,
      {
        name:
          formatCategoryName(
            categoryValue
          ),

        value:
          categoryValue,

        image:
          getCategoryImage(
            categoryValue
          ),
      }
    );
  }

  return Array.from(
    categoryMap.values()
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function CategoryFilter({
  selectedCategory,

  setSelectedCategory,
}: CategoryFilterProps) {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    categories,
    setCategories,
  ] = useState<
    CategoryItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD DYNAMIC PRODUCT CATEGORIES
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | This now uses:
  |
  | GET /api/product/list
  |
  | filters.categories
  |
  | So categories are created from actual Active products.
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
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

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data =
          (await response.json()) as
            ProductListApiResponse;

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to load categories. (${response.status})`
          );
        }

        if (!data?.success) {
          throw new Error(
            data?.message ||
              "Unable to load categories."
          );
        }

        const nextCategories =
          buildCategoryItems(
            data.filters
              ?.categories
          );

        setCategories(
          nextCategories
        );
      } catch (
        loadError
      ) {
        console.error(
          "CATEGORY FILTER ERROR:",
          loadError
        );

        if (!mounted) {
          return;
        }

        setCategories([]);

        setError(
          loadError instanceof
            Error
            ? loadError.message
            : "Unable to load categories."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CATEGORY VALIDATION
  |--------------------------------------------------------------------------
  |
  | If selected category no longer exists,
  | automatically return to All.
  |
  | Example:
  |
  | User selected "Kids"
  | Admin removes/deactivates all Kids products
  | -> filter safely returns to All.
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (loading) {
      return;
    }

    const normalizedSelected =
      normalizeValue(
        selectedCategory
      );

    if (
      !normalizedSelected ||
      normalizedSelected ===
        "all"
    ) {
      return;
    }

    const stillExists =
      categories.some(
        (category) =>
          normalizeValue(
            category.value
          ) ===
          normalizedSelected
      );

    if (!stillExists) {
      setSelectedCategory(
        "All"
      );
    }
  }, [
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
  ]);

  /*
  |--------------------------------------------------------------------------
  | VISIBLE CATEGORIES
  |--------------------------------------------------------------------------
  */

  const visibleCategories =
    useMemo(() => {
      return [
        ...categories,
      ];
    }, [categories]);

  /*
  |--------------------------------------------------------------------------
  | NORMALIZED SELECTED CATEGORY
  |--------------------------------------------------------------------------
  */

  const normalizedSelectedCategory =
    normalizeValue(
      selectedCategory
    );

  /*
  |--------------------------------------------------------------------------
  | SELECT CATEGORY
  |--------------------------------------------------------------------------
  */

  function selectCategory(
    category: string
  ) {
    const value =
      cleanString(
        category
      );

    if (!value) {
      return;
    }

    setSelectedCategory(
      value
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <section
        className="w-full"
        aria-label="Loading categories"
      >
        <div className="mb-5">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />

          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-100" />
        </div>

        <div
          className="
            flex
            gap-4
            overflow-x-auto
            pb-3
            scrollbar-hide
          "
        >
          {[
            1,
            2,
            3,
            4,
            5,
          ].map(
            (item) => (
              <div
                key={item}
                className="
                  h-[132px]
                  w-24
                  shrink-0
                  animate-pulse
                  overflow-hidden
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-100
                  sm:w-28
                "
              >
                <div className="h-20 bg-gray-200 sm:h-24" />

                <div className="p-2">
                  <div className="mx-auto h-3 w-16 rounded bg-gray-200" />
                </div>
              </div>
            )
          )}
        </div>
      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <section
      className="w-full"
      aria-label="Shop by Category"
    >
      {/*
      |--------------------------------------------------------------------------
      | HEADER
      |--------------------------------------------------------------------------
      */}

      <div className="mb-5">
        <h2
          className="
            text-xl
            font-semibold
            text-gray-900
          "
        >
          Shop by Category
        </h2>

        <p
          className="
            mt-1
            text-sm
            text-gray-500
          "
        >
          Explore our latest fashion
          categories
        </p>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | CATEGORY LIST
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          flex
          gap-4
          overflow-x-auto
          pb-3
          scrollbar-hide
        "
        role="group"
        aria-label="Category filters"
      >
        {/*
        |--------------------------------------------------------------------------
        | ALL
        |--------------------------------------------------------------------------
        */}

        <button
          type="button"
          onClick={() =>
            selectCategory(
              "All"
            )
          }
          aria-pressed={
            normalizedSelectedCategory ===
            "all"
          }
          aria-label="Show all products"
          className={`
            group
            relative
            w-24
            shrink-0
            overflow-hidden
            rounded-xl
            border
            bg-white
            text-left
            shadow-sm
            transition-all
            duration-200
            hover:-translate-y-1
            hover:shadow-lg
            focus:outline-none
            focus:ring-2
            focus:ring-black
            focus:ring-offset-2
            sm:w-28

            ${
              normalizedSelectedCategory ===
              "all"
                ? "border-black ring-2 ring-black ring-offset-2"
                : "border-gray-200"
            }
          `}
        >
          <div
            className="
              relative
              h-20
              w-full
              overflow-hidden
              bg-gradient-to-br
              from-black
              via-gray-800
              to-gray-500
              sm:h-24
            "
          >
            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
              "
            >
              <span
                className="
                  text-2xl
                  font-bold
                  tracking-widest
                  text-white/90
                "
              >
                SG
              </span>
            </div>

            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                bg-black/20
              "
            >
              <span
                className="
                  rounded-full
                  bg-white/15
                  px-3
                  py-1
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-widest
                  text-white
                  backdrop-blur-sm
                "
              >
                All
              </span>
            </div>
          </div>

          <div className="p-2 text-center">
            <span
              className="
                block
                truncate
                text-sm
                font-semibold
                text-gray-900
              "
            >
              All
            </span>
          </div>
        </button>

        {/*
        |--------------------------------------------------------------------------
        | DYNAMIC CATEGORIES
        |--------------------------------------------------------------------------
        */}

        {visibleCategories.map(
          (
            category,
            index
          ) => {
            const isActive =
              normalizedSelectedCategory ===
              normalizeValue(
                category.value
              );

            const fallbackStyle =
              FALLBACK_CATEGORY_STYLES[
                index %
                  FALLBACK_CATEGORY_STYLES.length
              ];

            return (
              <button
                key={
                  normalizeValue(
                    category.value
                  ) ||
                  `${category.value}-${index}`
                }
                type="button"
                onClick={() =>
                  selectCategory(
                    category.value
                  )
                }
                aria-pressed={
                  isActive
                }
                aria-label={`Filter products by ${category.name}`}
                className={`
                  group
                  relative
                  w-24
                  shrink-0
                  overflow-hidden
                  rounded-xl
                  border
                  bg-white
                  text-left
                  shadow-sm
                  transition-all
                  duration-200
                  hover:-translate-y-1
                  hover:shadow-lg
                  focus:outline-none
                  focus:ring-2
                  focus:ring-black
                  focus:ring-offset-2
                  sm:w-28

                  ${
                    isActive
                      ? "border-black ring-2 ring-black ring-offset-2"
                      : "border-gray-200"
                  }
                `}
              >
                {/*
                |--------------------------------------------------------------------------
                | IMAGE AREA
                |--------------------------------------------------------------------------
                */}

                <div
                  className={`
                    relative
                    h-20
                    w-full
                    overflow-hidden
                    sm:h-24
                    ${fallbackStyle}
                  `}
                >
                  {category.image && (
                    <img
                      src={
                        category.image
                      }
                      alt={`${category.name} category`}
                      loading="lazy"
                      decoding="async"
                      className="
                        absolute
                        inset-0
                        z-10
                        h-full
                        w-full
                        object-cover
                        transition
                        duration-300
                        group-hover:scale-105
                      "
                      onError={(
                        event
                      ) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  )}

                  {/*
                  |--------------------------------------------------------------------------
                  | FALLBACK INITIALS
                  |--------------------------------------------------------------------------
                  */}

                  <div
                    className="
                      absolute
                      inset-0
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <span
                      className="
                        text-xl
                        font-bold
                        uppercase
                        tracking-widest
                        text-white/90
                      "
                    >
                      {category.name
                        .slice(
                          0,
                          2
                        )
                        .toUpperCase()}
                    </span>
                  </div>

                  {/*
                  |--------------------------------------------------------------------------
                  | ACTIVE OVERLAY
                  |--------------------------------------------------------------------------
                  */}

                  {isActive && (
                    <div
                      className="
                        absolute
                        inset-0
                        z-20
                        flex
                        items-center
                        justify-center
                        bg-black/30
                      "
                    >
                      <span
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-full
                          bg-white
                          text-sm
                          font-bold
                          text-black
                          shadow-lg
                        "
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    </div>
                  )}
                </div>

                {/*
                |--------------------------------------------------------------------------
                | CATEGORY NAME
                |--------------------------------------------------------------------------
                */}

                <div
                  className="
                    p-2
                    text-center
                  "
                >
                  <span
                    className={`
                      block
                      truncate
                      text-sm
                      font-semibold

                      ${
                        isActive
                          ? "text-black"
                          : "text-gray-700"
                      }
                    `}
                    title={
                      category.name
                    }
                  >
                    {
                      category.name
                    }
                  </span>
                </div>
              </button>
            );
          }
        )}
      </div>

      {/*
      |--------------------------------------------------------------------------
      | NO CATEGORIES
      |--------------------------------------------------------------------------
      |
      | All button still remains.
      |
      */}

      {!error &&
        visibleCategories.length ===
          0 && (
          <div
            className="
              mt-3
              rounded-lg
              border
              border-dashed
              border-gray-200
              px-4
              py-3
              text-center
            "
          >
            <p
              className="
                text-xs
                text-gray-400
              "
            >
              No active product
              categories are currently
              available.
            </p>
          </div>
        )}

      {/*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */}

      {error && (
        <p
          className="
            mt-3
            text-xs
            text-gray-400
          "
        >
          Categories could not be
          loaded right now.
        </p>
      )}
    </section>
  );
}