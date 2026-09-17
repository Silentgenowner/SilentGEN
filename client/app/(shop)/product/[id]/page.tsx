"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import ProductGallery from "@/components/Product/ProductGallery";
import Product360Viewer from "@/components/Product/Product360Viewer";
import ProductInfo from "@/components/Product/ProductInfo";
import ProductActions from "@/components/Product/ProductActions";
import ProductTabs from "@/components/Product/ProductTabs";

import RelatedProducts, {
  RelatedProduct,
} from "@/components/Product/RelatedProducts";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type Product360Frame = {
  angle: number;

  name?: string;

  url?: string;

  base64?: string;

  mimeType?: string;
};

type Product360Data = {
  enabled?: boolean;

  frames?: Product360Frame[];
};

type ColorVariant = {
  color: string;

  /*
  |--------------------------------------------------------------------------
  | NORMAL COLOR IMAGES
  |--------------------------------------------------------------------------
  */

  images?: string[];

  /*
  |--------------------------------------------------------------------------
  | LEGACY COLOR 360
  |--------------------------------------------------------------------------
  */

  view360Images?: string[];

  /*
  |--------------------------------------------------------------------------
  | NEW COLOR SPECIFIC 360
  |--------------------------------------------------------------------------
  */

  product360?: Product360Data;
};

type Product = {
  _id: string;

  sku: string;

  name: string;

  slug: string;

  shortDescription: string;

  description: string;

  category: string;

  subCategory: string;

  brand: string;

  gender: string;

  fabric: string;

  fit: string;

  gsm: number;

  weight: number;

  mrp: number;

  price: number;

  discount: number;

  stock: number;

  thumbnail: string;

  images: string[];

  /*
  |--------------------------------------------------------------------------
  | LEGACY MAIN 360
  |--------------------------------------------------------------------------
  */

  view360Images?: string[];

  sizes: string[];

  colors: string[];

  colorVariants?: ColorVariant[];

  rating: number;

  reviewCount: number;

  /*
  |--------------------------------------------------------------------------
  | MAIN PRODUCT 360
  |--------------------------------------------------------------------------
  */

  product360?: Product360Data;
};

type Active360Source =
  | "none"
  | "main"
  | "color"
  | "main-fallback";

/*
|--------------------------------------------------------------------------
| PRODUCT VIEW TRACKING
|--------------------------------------------------------------------------
|
| React development Strict Mode may run effects more than once.
|
| We therefore use:
|
| 1. in-memory request guard
| 2. sessionStorage short deduplication window
|
| This prevents one page load from becoming multiple product_view events.
|
| A genuine revisit later can still create another real view.
|
|--------------------------------------------------------------------------
*/

const PRODUCT_VIEW_DEDUP_MS =
  10_000;

const PRODUCT_VIEW_STORAGE_PREFIX =
  "silentgen_real_product_view:";

/*
|--------------------------------------------------------------------------
| CLEAN STRING ARRAY
|--------------------------------------------------------------------------
*/

function cleanStringArray(
  value:
    unknown
): string[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (
            item
          ): item is string =>
            typeof item ===
            "string"
        )
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(
          Boolean
        )
    )
  );
}

/*
|--------------------------------------------------------------------------
| CLEAN 360 FRAMES
|--------------------------------------------------------------------------
*/

function clean360Frames(
  value:
    unknown
): Product360Frame[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  const frameMap =
    new Map<
      number,
      Product360Frame
    >();

  for (
    const item of
    value
  ) {
    if (
      !item ||
      typeof item !==
        "object"
    ) {
      continue;
    }

    const frame =
      item as
        Product360Frame;

    const rawAngle =
      Number(
        frame.angle
      );

    if (
      !Number.isFinite(
        rawAngle
      )
    ) {
      continue;
    }

    const angle =
      Math.round(
        rawAngle
      );

    if (
      angle < 0 ||
      angle >= 360
    ) {
      continue;
    }

    const url =
      typeof frame.url ===
      "string"
        ? frame.url.trim()
        : "";

    const base64 =
      typeof frame.base64 ===
      "string"
        ? frame.base64.trim()
        : "";

    /*
    |--------------------------------------------------------------------------
    | FRAME MUST HAVE URL OR BASE64
    |--------------------------------------------------------------------------
    */

    if (
      !url &&
      !base64
    ) {
      continue;
    }

    const normalizedFrame:
      Product360Frame = {
        angle,
      };

    const name =
      typeof frame.name ===
      "string"
        ? frame.name.trim()
        : "";

    const mimeType =
      typeof frame.mimeType ===
      "string"
        ? frame.mimeType.trim()
        : "";

    if (
      name
    ) {
      normalizedFrame.name =
        name;
    }

    if (
      url
    ) {
      normalizedFrame.url =
        url;
    }

    if (
      base64
    ) {
      normalizedFrame.base64 =
        base64;
    }

    if (
      mimeType
    ) {
      normalizedFrame.mimeType =
        mimeType;
    }

    /*
    |--------------------------------------------------------------------------
    | SAME ANGLE = LAST VALID FRAME WINS
    |--------------------------------------------------------------------------
    */

    frameMap.set(
      angle,
      normalizedFrame
    );
  }

  return Array.from(
    frameMap.values()
  ).sort(
    (
      a,
      b
    ) =>
      a.angle -
      b.angle
  );
}

/*
|--------------------------------------------------------------------------
| LEGACY IMAGE ARRAY TO 360 FRAMES
|--------------------------------------------------------------------------
*/

function imageArrayTo360Frames(
  value:
    unknown
): Product360Frame[] {
  const images =
    cleanStringArray(
      value
    );

  if (
    images.length ===
    0
  ) {
    return [];
  }

  return images.map(
    (
      url,
      index
    ) => ({
      angle:
        Math.round(
          (
            360 /
            images.length
          ) *
            index
        ) % 360,

      name:
        `legacy-360-${index}`,

      url,
    })
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT VIEW STORAGE KEY
|--------------------------------------------------------------------------
*/

function getProductViewStorageKey(
  productId:
    string
) {
  return (
    PRODUCT_VIEW_STORAGE_PREFIX +
    productId
  );
}

/*
|--------------------------------------------------------------------------
| CHECK PRODUCT VIEW DEDUPLICATION
|--------------------------------------------------------------------------
*/

function canRecordProductView(
  productId:
    string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  const key =
    getProductViewStorageKey(
      productId
    );

  try {
    const storedValue =
      window.sessionStorage
        .getItem(
          key
        );

    const previousTimestamp =
      Number(
        storedValue ||
          0
      );

    const now =
      Date.now();

    if (
      Number.isFinite(
        previousTimestamp
      ) &&
      previousTimestamp >
        0 &&
      now -
        previousTimestamp <
        PRODUCT_VIEW_DEDUP_MS
    ) {
      return false;
    }

    window.sessionStorage
      .setItem(
        key,
        String(
          now
        )
      );

    return true;
  } catch {
    /*
    |--------------------------------------------------------------------------
    | STORAGE MAY BE BLOCKED
    |--------------------------------------------------------------------------
    |
    | Product page must still work.
    |
    |--------------------------------------------------------------------------
    */

    return true;
  }
}

/*
|--------------------------------------------------------------------------
| RELEASE PRODUCT VIEW DEDUPLICATION
|--------------------------------------------------------------------------
|
| If analytics request fails, remove the short lock so another legitimate
| attempt can retry.
|
|--------------------------------------------------------------------------
*/

function releaseProductViewLock(
  productId:
    string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.sessionStorage
      .removeItem(
        getProductViewStorageKey(
          productId
        )
      );
  } catch {
    // Ignore browser storage errors.
  }
}

/*
|--------------------------------------------------------------------------
| PRODUCT PAGE
|--------------------------------------------------------------------------
*/

export default function ProductDetailsPage() {
  const params =
    useParams();

  const id =
    typeof params.id ===
    "string"
      ? params.id
      : Array.isArray(
          params.id
        )
        ? params.id[0]
        : "";

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    product,
    setProduct,
  ] =
    useState<Product | null>(
      null
    );

  const [
    related,
    setRelated,
  ] =
    useState<
      RelatedProduct[]
    >(
      []
    );

  /*
  |--------------------------------------------------------------------------
  | SELECTED COLOR
  |--------------------------------------------------------------------------
  */

  const [
    selectedColor,
    setSelectedColor,
  ] =
    useState(
      ""
    );

  /*
  |--------------------------------------------------------------------------
  | PRODUCT VIEW REQUEST GUARD
  |--------------------------------------------------------------------------
  |
  | Prevent duplicate requests inside the same mounted component.
  |
  |--------------------------------------------------------------------------
  */

  const productViewRequestRef =
    useRef<
      Set<string>
    >(
      new Set()
    );

  /*
  |--------------------------------------------------------------------------
  | LOAD PRODUCT
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !id
      ) {
        setLoading(
          false
        );

        return;
      }

      void fetchProduct(
        id
      );
    },
    [
      id,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | RESET COLOR WHEN PRODUCT CHANGES
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      setSelectedColor(
        ""
      );
    },
    [
      id,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | RECORD REAL PRODUCT VIEW
  |--------------------------------------------------------------------------
  |
  | Called only after the real Product API returns a valid product.
  |
  |--------------------------------------------------------------------------
  */

  async function recordRealProductView(
    productId:
      string
  ) {
    if (
      !productId
    ) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SAME MOUNT DUPLICATE GUARD
    |--------------------------------------------------------------------------
    */

    if (
      productViewRequestRef
        .current
        .has(
          productId
        )
    ) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | STRICT MODE / FAST REMOUNT GUARD
    |--------------------------------------------------------------------------
    */

    if (
      !canRecordProductView(
        productId
      )
    ) {
      return;
    }

    productViewRequestRef
      .current
      .add(
        productId
      );

    try {
      const currentPath =
        typeof window !==
        "undefined"
          ? (
              window.location
                .pathname +
              window.location
                .search
            )
          : `/product/${productId}`;

      const response =
        await fetch(
          "/api/ai/learning/product-view",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            cache:
              "no-store",

            body:
              JSON.stringify(
                {
                  productId,

                  currentPath,
                }
              ),
          }
        );

      if (
        !response.ok
      ) {
        /*
        |--------------------------------------------------------------------------
        | ALLOW RETRY AFTER FAILED ANALYTICS REQUEST
        |--------------------------------------------------------------------------
        */

        productViewRequestRef
          .current
          .delete(
            productId
          );

        releaseProductViewLock(
          productId
        );

        if (
          process.env.NODE_ENV ===
          "development"
        ) {
          console.warn(
            "PRODUCT VIEW LEARNING API ERROR:",
            response.status
          );
        }

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | DO NOT BLOCK OR CHANGE PRODUCT UI BASED ON ANALYTICS RESPONSE
      |--------------------------------------------------------------------------
      */

      if (
        process.env.NODE_ENV ===
        "development"
      ) {
        try {
          const data =
            await response.json();

          if (
            data?.success ===
            false
          ) {
            console.warn(
              "PRODUCT VIEW LEARNING WARNING:",
              data?.message ||
                "View learning was not recorded."
            );
          }
        } catch {
          // Debug response parsing is optional.
        }
      }
    } catch (
      error
    ) {
      /*
      |--------------------------------------------------------------------------
      | ANALYTICS FAILURE MUST NEVER BREAK PRODUCT PAGE
      |--------------------------------------------------------------------------
      */

      productViewRequestRef
        .current
        .delete(
          productId
        );

      releaseProductViewLock(
        productId
      );

      if (
        process.env.NODE_ENV ===
        "development"
      ) {
        console.error(
          "PRODUCT VIEW LEARNING ERROR:",
          error
        );
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FETCH PRODUCT
  |--------------------------------------------------------------------------
  */

  async function fetchProduct(
    productId:
      string
  ) {
    try {
      setLoading(
        true
      );

      const response =
        await fetch(
          `/api/product/${productId}`,
          {
            method:
              "GET",

            cache:
              "no-store",
          }
        );

      if (
        !response.ok
      ) {
        console.error(
          "PRODUCT API ERROR:",
          response.status
        );

        setProduct(
          null
        );

        return;
      }

      const data =
        await response.json();

      if (
        !data?.success ||
        !data?.product
      ) {
        setProduct(
          null
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | REAL PRODUCT SUCCESSFULLY LOADED
      |--------------------------------------------------------------------------
      */

      setProduct(
        data.product
      );

      /*
      |--------------------------------------------------------------------------
      | RECORD EXACTLY THE REAL LOADED PRODUCT
      |--------------------------------------------------------------------------
      |
      | We prefer the DB-returned _id and fall back to the route id.
      |
      |--------------------------------------------------------------------------
      */

      const loadedProductId =
        typeof data.product?._id ===
        "string"
          ? data.product._id
          : productId;

      void recordRealProductView(
        loadedProductId
      );

      /*
      |--------------------------------------------------------------------------
      | RELATED PRODUCTS
      |--------------------------------------------------------------------------
      */

      void fetchSuggestedProducts(
        productId
      );
    } catch (
      error
    ) {
      console.error(
        "PRODUCT FETCH ERROR:",
        error
      );

      setProduct(
        null
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FETCH SUGGESTED PRODUCTS
  |--------------------------------------------------------------------------
  */

  async function fetchSuggestedProducts(
    productId:
      string
  ) {
    try {
      const response =
        await fetch(
          `/api/product/${productId}/suggestions`,
          {
            method:
              "GET",

            cache:
              "no-store",
          }
        );

      if (
        !response.ok
      ) {
        console.warn(
          "Suggestions API not available:",
          response.status
        );

        setRelated(
          []
        );

        return;
      }

      const data =
        await response.json();

      if (
        data?.success &&
        Array.isArray(
          data.suggestions
        )
      ) {
        const filtered =
          data.suggestions.filter(
            (
              item:
                RelatedProduct
            ) =>
              String(
                item._id
              ) !==
              String(
                productId
              )
          );

        setRelated(
          filtered
        );
      } else {
        setRelated(
          []
        );
      }
    } catch (
      error
    ) {
      console.error(
        "SUGGESTED PRODUCTS ERROR:",
        error
      );

      setRelated(
        []
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | COLOR VARIANTS
  |--------------------------------------------------------------------------
  */

  const colorVariants =
    useMemo(
      () => {
        if (
          !Array.isArray(
            product?.colorVariants
          )
        ) {
          return [];
        }

        return product
          .colorVariants
          .filter(
            (
              variant
            ) =>
              typeof variant
                ?.color ===
                "string" &&
              variant.color
                .trim()
          );
      },
      [
        product,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | SELECTED COLOR VARIANT
  |--------------------------------------------------------------------------
  */

  const selectedColorVariant =
    useMemo(
      () => {
        if (
          !selectedColor
        ) {
          return null;
        }

        const normalizedColor =
          selectedColor
            .trim()
            .toLowerCase();

        return (
          colorVariants.find(
            (
              variant
            ) =>
              variant.color
                .trim()
                .toLowerCase() ===
              normalizedColor
          ) ||
          null
        );
      },
      [
        colorVariants,
        selectedColor,
      ]
    );
  /*
  |--------------------------------------------------------------------------
  | MAIN PRODUCT IMAGES
  |--------------------------------------------------------------------------
  */

  const mainImages =
    useMemo(
      () => {
        if (
          !product
        ) {
          return [];
        }

        const images =
          cleanStringArray(
            [
              product.thumbnail,

              ...cleanStringArray(
                product.images
              ),
            ]
          );

        if (
          images.length >
          0
        ) {
          return images;
        }

        return [
          "/images/no-image.png",
        ];
      },
      [
        product,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | COLOR IMAGES
  |--------------------------------------------------------------------------
  */

  const colorImages =
    useMemo(
      () => {
        return cleanStringArray(
          selectedColorVariant
            ?.images
        );
      },
      [
        selectedColorVariant,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | ACTIVE GALLERY IMAGES
  |--------------------------------------------------------------------------
  |
  | Selected color has images:
  | -> use selected color images.
  |
  | Selected color has no images:
  | -> use main product images.
  |
  |--------------------------------------------------------------------------
  */

  const activeGalleryImages =
    useMemo(
      () => {
        if (
          selectedColor &&
          colorImages.length >
            0
        ) {
          return colorImages;
        }

        return mainImages;
      },
      [
        selectedColor,
        colorImages,
        mainImages,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | MAIN PRODUCT 360
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | We do NOT require:
  |
  | product360.enabled === true
  |
  | If valid saved frames exist,
  | those frames are usable.
  |
  | This keeps compatibility with older products where:
  |
  | enabled: false
  | frames: [...]
  |
  |--------------------------------------------------------------------------
  */

  const main360Frames =
    useMemo(
      () => {
        if (
          !product
        ) {
          return [];
        }

        const newFrames =
          clean360Frames(
            product
              .product360
              ?.frames
          );

        /*
        |--------------------------------------------------------------------------
        | SAVED NEW 360 FRAMES
        |--------------------------------------------------------------------------
        */

        if (
          newFrames.length >
          0
        ) {
          return newFrames;
        }

        /*
        |--------------------------------------------------------------------------
        | LEGACY MAIN 360 FALLBACK
        |--------------------------------------------------------------------------
        */

        return imageArrayTo360Frames(
          product
            .view360Images
        );
      },
      [
        product,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | COLOR PRODUCT 360
  |--------------------------------------------------------------------------
  |
  | Priority:
  |
  | 1. colorVariants[].product360.frames
  | 2. colorVariants[].view360Images
  |
  |--------------------------------------------------------------------------
  */

  const color360Frames =
    useMemo(
      () => {
        if (
          !selectedColorVariant
        ) {
          return [];
        }

        /*
        |--------------------------------------------------------------------------
        | NEW COLOR PRODUCT 360
        |--------------------------------------------------------------------------
        */

        const newFrames =
          clean360Frames(
            selectedColorVariant
              .product360
              ?.frames
          );

        /*
        |--------------------------------------------------------------------------
        | VALID FRAMES ARE ENOUGH
        |--------------------------------------------------------------------------
        |
        | We intentionally do not require:
        |
        | product360.enabled === true
        |
        |--------------------------------------------------------------------------
        */

        if (
          newFrames.length >
          0
        ) {
          return newFrames;
        }

        /*
        |--------------------------------------------------------------------------
        | LEGACY COLOR 360
        |--------------------------------------------------------------------------
        */

        return imageArrayTo360Frames(
          selectedColorVariant
            .view360Images
        );
      },
      [
        selectedColorVariant,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | ACTIVE 360 SOURCE
  |--------------------------------------------------------------------------
  |
  | none
  | main
  | color
  | main-fallback
  |
  |--------------------------------------------------------------------------
  */

  const active360Source:
    Active360Source =
    useMemo(
      () => {
        /*
        |--------------------------------------------------------------------------
        | COLOR SELECTED
        |--------------------------------------------------------------------------
        */

        if (
          selectedColor
        ) {
          /*
          |--------------------------------------------------------------------------
          | COLOR HAS OWN 360
          |--------------------------------------------------------------------------
          */

          if (
            color360Frames
              .length >
            0
          ) {
            return "color";
          }

          /*
          |--------------------------------------------------------------------------
          | COLOR DOES NOT HAVE OWN 360
          |--------------------------------------------------------------------------
          |
          | Do not hide 360 completely.
          |
          | If main product 360 exists,
          | use it as fallback.
          |
          |--------------------------------------------------------------------------
          */

          if (
            main360Frames
              .length >
            0
          ) {
            return "main-fallback";
          }

          return "none";
        }

        /*
        |--------------------------------------------------------------------------
        | NO COLOR SELECTED
        |--------------------------------------------------------------------------
        */

        if (
          main360Frames
            .length >
          0
        ) {
          return "main";
        }

        return "none";
      },
      [
        selectedColor,
        color360Frames,
        main360Frames,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | ACTIVE 360 FRAMES
  |--------------------------------------------------------------------------
  |
  | No color selected
  | -> Main 360
  |
  | Color selected + own color 360
  | -> Color 360
  |
  | Color selected + no own 360
  | -> Main 360 fallback
  |
  | No 360 anywhere
  | -> []
  |
  |--------------------------------------------------------------------------
  */

  const active360Frames =
    useMemo(
      () => {
        if (
          active360Source ===
          "color"
        ) {
          return color360Frames;
        }

        if (
          active360Source ===
            "main" ||
          active360Source ===
            "main-fallback"
        ) {
          return main360Frames;
        }

        return [];
      },
      [
        active360Source,
        color360Frames,
        main360Frames,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | HAS 360
  |--------------------------------------------------------------------------
  */

  const has360 =
    active360Frames
      .length >
    0;

  /*
  |--------------------------------------------------------------------------
  | COLOR HAS OWN 360
  |--------------------------------------------------------------------------
  */

  const selectedColorHasOwn360 =
    selectedColor.length >
      0 &&
    color360Frames.length >
      0;

  /*
  |--------------------------------------------------------------------------
  | USING MAIN 360 AS COLOR FALLBACK
  |--------------------------------------------------------------------------
  */

  const usingMain360Fallback =
    Boolean(
      selectedColor
    ) &&
    color360Frames.length ===
      0 &&
    main360Frames.length >
      0;

  /*
  |--------------------------------------------------------------------------
  | COLOR SELECT
  |--------------------------------------------------------------------------
  */

  function handleColorChange(
    color:
      string
  ) {
    setSelectedColor(
      color
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading
  ) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-24">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

          <p className="mt-4 text-gray-500">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (
    !product
  ) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Product Not Found
          </h2>

          <p className="mt-2 text-gray-500">
            This product does not exist or is no longer available.
          </p>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ACTIVE THUMBNAIL
  |--------------------------------------------------------------------------
  */

  const activeThumbnail =
    activeGalleryImages[0] ||
    product.thumbnail ||
    "/images/no-image.png";

  /*
  |--------------------------------------------------------------------------
  | 360 SUBTITLE
  |--------------------------------------------------------------------------
  */

  let viewerSubtitle =
    "Main product 360° view";

  if (
    active360Source ===
    "color"
  ) {
    viewerSubtitle =
      `${selectedColor} 360° view`;
  }

  if (
    active360Source ===
    "main-fallback"
  ) {
    viewerSubtitle =
      `${selectedColor} selected • Main 360° view`;
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/*
      |--------------------------------------------------------------------------
      | MAIN PRODUCT
      |--------------------------------------------------------------------------
      */}

      <div className="grid gap-10 lg:grid-cols-2">
        {/*
        |--------------------------------------------------------------------------
        | LEFT
        |--------------------------------------------------------------------------
        */}

        <div>
          {/*
          |--------------------------------------------------------------------------
          | PRODUCT GALLERY
          |--------------------------------------------------------------------------
          */}

          <ProductGallery
            key={`gallery-${product._id}-${selectedColor || "main"}`}
            images={
              activeGalleryImages
            }
            thumbnail={
              activeThumbnail
            }
            name={
              selectedColor
                ? `${product.name} - ${selectedColor}`
                : product.name
            }
          />

          {/*
          |--------------------------------------------------------------------------
          | PRODUCT 360
          |--------------------------------------------------------------------------
          */}

          {has360 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    360° Product View
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {
                      viewerSubtitle
                    }
                  </p>
                </div>

                <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold text-white">
                  {
                    active360Frames.length
                  }{" "}
                  Frames
                </span>
              </div>

              <Product360Viewer
                key={`360-${product._id}-${selectedColor || "main"}-${active360Source}`}
                frames={
                  active360Frames
                }
              />

              {/*
              |--------------------------------------------------------------------------
              | MAIN 360 FALLBACK NOTICE
              |--------------------------------------------------------------------------
              |
              | Selected color has no separate 360 set,
              | but customer can still inspect main product 360.
              |
              |--------------------------------------------------------------------------
              */}

              {usingMain360Fallback && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-xs leading-5 text-blue-700">
                    <strong>
                      {
                        selectedColor
                      }
                    </strong>{" "}
                    does not have a separate 360° set yet. Showing the main product 360° view.
                  </p>
                </div>
              )}
            </div>
          )}

          {/*
          |--------------------------------------------------------------------------
          | NO 360 AVAILABLE
          |--------------------------------------------------------------------------
          */}

          {selectedColor &&
            !has360 && (
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                360° view is currently not available for{" "}
                <strong className="text-gray-800">
                  {
                    selectedColor
                  }
                </strong>
                . Showing color images instead.
              </div>
            )}
        </div>

        {/*
        |--------------------------------------------------------------------------
        | RIGHT
        |--------------------------------------------------------------------------
        */}

        <div className="space-y-8">
          <ProductInfo
            name={
              product.name
            }
            brand={
              product.brand
            }
            category={
              product.category
            }
            shortDescription={
              product.shortDescription
            }
            price={
              product.price
            }
            mrp={
              product.mrp
            }
            discount={
              product.discount
            }
            rating={
              product.rating
            }
            reviewCount={
              product.reviewCount
            }
            stock={
              product.stock
            }
            fabric={
              product.fabric
            }
            fit={
              product.fit
            }
            gsm={
              product.gsm
            }
            weight={
              product.weight
            }
          />

          {/*
          |--------------------------------------------------------------------------
          | PRODUCT ACTIONS
          |--------------------------------------------------------------------------
          */}

          <ProductActions
            productId={
              product._id
            }
            stock={
              product.stock
            }
            sizes={
              Array.isArray(
                product.sizes
              )
                ? product.sizes
                : []
            }
            colors={
              Array.isArray(
                product.colors
              )
                ? product.colors
                : []
            }
            selectedColor={
              selectedColor
            }
            onColorChange={
              handleColorChange
            }
          />
          {/*
          |--------------------------------------------------------------------------
          | SELECTED COLOR INFO
          |--------------------------------------------------------------------------
          */}

          {selectedColor && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">
                  Selected Color:
                </span>

                <span className="text-sm font-semibold text-gray-900">
                  {
                    selectedColor
                  }
                </span>

                {selectedColorHasOwn360 && (
                  <span className="rounded-full bg-black px-2.5 py-1 text-[9px] font-semibold text-white">
                    Color 360°
                  </span>
                )}

                {usingMain360Fallback && (
                  <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[9px] font-semibold text-white">
                    Main 360°
                  </span>
                )}

                {colorImages.length >
                  0 && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold text-gray-700 shadow-sm">
                    {
                      colorImages.length
                    }{" "}
                    Images
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | PRODUCT TABS
      |--------------------------------------------------------------------------
      */}

      <div className="mt-12">
        <ProductTabs
          description={
            product.description
          }
          category={
            product.category
          }
          brand={
            product.brand
          }
          fabric={
            product.fabric
          }
          fit={
            product.fit
          }
          gsm={
            product.gsm
          }
          weight={
            product.weight
          }
          sku={
            product.sku
          }
          rating={
            product.rating
          }
          reviewCount={
            product.reviewCount
          }
        />
      </div>

      {/*
      |--------------------------------------------------------------------------
      | RELATED PRODUCTS
      |--------------------------------------------------------------------------
      */}

      {related.length >
        0 && (
        <section className="mt-14">
          <RelatedProducts
            products={
              related.slice(
                0,
                4
              )
            }
          />
        </section>
      )}
    </main>
  );
}