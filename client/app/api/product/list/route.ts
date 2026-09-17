import { NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";

/*
|--------------------------------------------------------------------------
| PRODUCT 360 TYPES
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
  enabled: boolean;
  frames: Product360Frame[];
};

/*
|--------------------------------------------------------------------------
| PRODUCT REEL VIDEO
|--------------------------------------------------------------------------
*/

type ProductReelVideo = {
  enabled: boolean;
  url: string;
  publicId: string;
  duration: number;
  poster: string;
};

/*
|--------------------------------------------------------------------------
| COLOR VARIANT
|--------------------------------------------------------------------------
*/

type ColorVariant = {
  color: string;

  images?: string[];

  view360Images?: string[];

  product360?: Product360Data;
};

/*
|--------------------------------------------------------------------------
| FILTER METADATA
|--------------------------------------------------------------------------
*/

type ProductFilters = {
  genders: string[];

  categories: string[];

  subCategories: string[];

  newArrivals: boolean;

  bestSellers: boolean;

  offers: boolean;

  trending: boolean;
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
| CLEAN NUMBER
|--------------------------------------------------------------------------
*/

function cleanNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return fallback;
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| CLEAN STRING ARRAY
|--------------------------------------------------------------------------
*/

function cleanStringArray(
  value: unknown
): string[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) =>
          cleanString(item)
        )
        .filter(Boolean)
    )
  );
}

/*
|--------------------------------------------------------------------------
| UNIQUE STRINGS - CASE INSENSITIVE
|--------------------------------------------------------------------------
*/

function uniqueStrings(
  values: unknown[]
): string[] {
  const map =
    new Map<
      string,
      string
    >();

  for (
    const value of values
  ) {
    const cleaned =
      cleanString(value);

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

/*
|--------------------------------------------------------------------------
| NORMALIZE 360 FRAMES
|--------------------------------------------------------------------------
*/

function normalize360Frames(
  value: unknown
): Product360Frame[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const frameMap =
    new Map<
      number,
      Product360Frame
    >();

  for (
    const item of value
  ) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }

    const frame =
      item as Record<
        string,
        unknown
      >;

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

    const name =
      cleanString(
        frame.name
      );

    const url =
      cleanString(
        frame.url
      );

    const base64 =
      cleanString(
        frame.base64
      );

    const mimeType =
      cleanString(
        frame.mimeType
      );

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

    if (name) {
      normalizedFrame.name =
        name;
    }

    if (url) {
      normalizedFrame.url =
        url;
    }

    if (base64) {
      normalizedFrame.base64 =
        base64;
    }

    if (mimeType) {
      normalizedFrame.mimeType =
        mimeType;
    }

    frameMap.set(
      angle,
      normalizedFrame
    );
  }

  return Array.from(
    frameMap.values()
  ).sort(
    (a, b) =>
      a.angle -
      b.angle
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE PRODUCT 360
|--------------------------------------------------------------------------
*/

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
    value as Record<
      string,
      unknown
    >;

  const frames =
    normalize360Frames(
      raw.frames
    );

  return {
    enabled:
      frames.length > 0,

    frames,
  };
}

/*
|--------------------------------------------------------------------------
| NORMALIZE PRODUCT REEL VIDEO
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Customer side only receives a usable reel when:
|
| - URL exists
| - reel is not explicitly disabled
| - duration is 30 sec or less
|
| Actual 30-second validation will ALSO be enforced
| in the upload API.
|
|--------------------------------------------------------------------------
*/

function normalizeReelVideo(
  value: unknown
): ProductReelVideo {
  const empty:
    ProductReelVideo = {
    enabled: false,
    url: "",
    publicId: "",
    duration: 0,
    poster: "",
  };

  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return empty;
  }

  const raw =
    value as Record<
      string,
      unknown
    >;

  const url =
    cleanString(
      raw.url
    );

  const publicId =
    cleanString(
      raw.publicId
    );

  const poster =
    cleanString(
      raw.poster
    );

  const rawDuration =
    cleanNumber(
      raw.duration,
      0
    );

  const duration =
    rawDuration > 0
      ? Math.max(
          0,
          rawDuration
        )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | If database accidentally contains > 30 sec reel,
  | do not expose it on ProductCard.
  |--------------------------------------------------------------------------
  */

  const validDuration =
    duration <= 30;

  const explicitlyDisabled =
    raw.enabled === false;

  const enabled =
    Boolean(url) &&
    !explicitlyDisabled &&
    validDuration;

  return {
    enabled,

    url:
      enabled
        ? url
        : "",

    publicId:
      enabled
        ? publicId
        : "",

    duration:
      enabled
        ? duration
        : 0,

    poster:
      enabled
        ? poster
        : "",
  };
}

/*
|--------------------------------------------------------------------------
| NORMALIZE COLOR VARIANTS
|--------------------------------------------------------------------------
*/

function normalizeColorVariants(
  value: unknown
): ColorVariant[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const variantMap =
    new Map<
      string,
      ColorVariant
    >();

  for (
    const item of value
  ) {
    if (
      !item ||
      typeof item !==
        "object"
    ) {
      continue;
    }

    const raw =
      item as Record<
        string,
        unknown
      >;

    const color =
      cleanString(
        raw.color
      );

    if (!color) {
      continue;
    }

    const images =
      cleanStringArray(
        raw.images
      );

    const view360Images =
      cleanStringArray(
        raw.view360Images
      );

    const product360 =
      normalizeProduct360(
        raw.product360
      );

    variantMap.set(
      color.toLowerCase(),
      {
        color,
        images,
        view360Images,
        product360,
      }
    );
  }

  return Array.from(
    variantMap.values()
  );
}

/*
|--------------------------------------------------------------------------
| GET PRODUCTS
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | ACTIVE PRODUCTS
    |--------------------------------------------------------------------------
    */

    const products =
      await Product.find({
        isDeleted: {
          $ne: true,
        },

        status:
          "Active",
      })
        .sort({
          sortOrder: 1,

          createdAt: -1,
        })
        .lean();

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE
    |--------------------------------------------------------------------------
    */

    const normalizedProducts =
      products.map(
        (
          rawProduct: any
        ) => {
          /*
          |--------------------------------------------------------------------------
          | IMAGES
          |--------------------------------------------------------------------------
          */

          const images =
            cleanStringArray(
              rawProduct.images
            );

          const thumbnail =
            cleanString(
              rawProduct.thumbnail
            ) ||
            images[0] ||
            "/images/no-image.png";

          /*
          |--------------------------------------------------------------------------
          | COLORS
          |--------------------------------------------------------------------------
          */

          const rawColors =
            cleanStringArray(
              rawProduct.colors
            );

          /*
          |--------------------------------------------------------------------------
          | COLOR VARIANTS
          |--------------------------------------------------------------------------
          */

          const colorVariants =
            normalizeColorVariants(
              rawProduct
                .colorVariants
            );

          const variantColors =
            colorVariants.map(
              (variant) =>
                variant.color
            );

          const colors =
            uniqueStrings([
              ...rawColors,

              ...variantColors,
            ]);

          /*
          |--------------------------------------------------------------------------
          | PRODUCT 360
          |--------------------------------------------------------------------------
          */

          const product360 =
            normalizeProduct360(
              rawProduct
                .product360
            );

          /*
          |--------------------------------------------------------------------------
          | LEGACY 360
          |--------------------------------------------------------------------------
          */

          const view360Images =
            cleanStringArray(
              rawProduct
                .view360Images
            );

          /*
          |--------------------------------------------------------------------------
          | PRODUCT REEL
          |--------------------------------------------------------------------------
          */

          const reelVideo =
            normalizeReelVideo(
              rawProduct
                .reelVideo
            );

          /*
          |--------------------------------------------------------------------------
          | FINAL PRODUCT
          |--------------------------------------------------------------------------
          */

          return {
            /*
            |--------------------------------------------------------------------------
            | ID
            |--------------------------------------------------------------------------
            */

            _id:
              String(
                rawProduct._id
              ),

            /*
            |--------------------------------------------------------------------------
            | BASIC
            |--------------------------------------------------------------------------
            */

            sku:
              cleanString(
                rawProduct.sku
              ),

            name:
              cleanString(
                rawProduct.name
              ),

            slug:
              cleanString(
                rawProduct.slug
              ),

            shortDescription:
              cleanString(
                rawProduct
                  .shortDescription
              ),

            description:
              cleanString(
                rawProduct
                  .description
              ),

            /*
            |--------------------------------------------------------------------------
            | CATEGORY
            |--------------------------------------------------------------------------
            */

            category:
              cleanString(
                rawProduct
                  .category
              ),

            subCategory:
              cleanString(
                rawProduct
                  .subCategory
              ),

            brand:
              cleanString(
                rawProduct.brand
              ),

            gender:
              cleanString(
                rawProduct.gender
              ),

            /*
            |--------------------------------------------------------------------------
            | PRODUCT DETAILS
            |--------------------------------------------------------------------------
            */

            fabric:
              cleanString(
                rawProduct.fabric
              ),

            fit:
              cleanString(
                rawProduct.fit
              ),

            gsm:
              cleanNumber(
                rawProduct.gsm
              ),

            weight:
              cleanNumber(
                rawProduct.weight
              ),

            /*
            |--------------------------------------------------------------------------
            | PRICE
            |--------------------------------------------------------------------------
            */

            mrp:
              cleanNumber(
                rawProduct.mrp
              ),

            price:
              cleanNumber(
                rawProduct.price
              ),

            discount:
              cleanNumber(
                rawProduct.discount
              ),

            /*
            |--------------------------------------------------------------------------
            | STOCK
            |--------------------------------------------------------------------------
            */

            stock:
              cleanNumber(
                rawProduct.stock
              ),

            lowStockLimit:
              cleanNumber(
                rawProduct
                  .lowStockLimit,
                5
              ),

            sold:
              cleanNumber(
                rawProduct.sold
              ),

            /*
            |--------------------------------------------------------------------------
            | NORMAL IMAGES
            |--------------------------------------------------------------------------
            */

            thumbnail,

            images,

            /*
            |--------------------------------------------------------------------------
            | REEL VIDEO
            |--------------------------------------------------------------------------
            */

            reelVideo,

            /*
            |--------------------------------------------------------------------------
            | LEGACY 360
            |--------------------------------------------------------------------------
            */

            view360Images,

            /*
            |--------------------------------------------------------------------------
            | SIZES
            |--------------------------------------------------------------------------
            */

            sizes:
              cleanStringArray(
                rawProduct.sizes
              ),

            /*
            |--------------------------------------------------------------------------
            | COLORS
            |--------------------------------------------------------------------------
            */

            colors,

            /*
            |--------------------------------------------------------------------------
            | COLOR VARIANTS
            |--------------------------------------------------------------------------
            */

            colorVariants,

            /*
            |--------------------------------------------------------------------------
            | MAIN PRODUCT 360
            |--------------------------------------------------------------------------
            */

            product360,

            /*
            |--------------------------------------------------------------------------
            | TAGS
            |--------------------------------------------------------------------------
            */

            tags:
              cleanStringArray(
                rawProduct.tags
              ),

            /*
            |--------------------------------------------------------------------------
            | SUGGESTED PRODUCTS
            |--------------------------------------------------------------------------
            */

            suggestedProductIds:
              Array.isArray(
                rawProduct
                  .suggestedProductIds
              )
                ? rawProduct
                    .suggestedProductIds
                    .map(
                      (
                        currentId:
                          unknown
                      ) =>
                        String(
                          currentId ??
                            ""
                        ).trim()
                    )
                    .filter(
                      Boolean
                    )
                : [],

            /*
            |--------------------------------------------------------------------------
            | FLAGS
            |--------------------------------------------------------------------------
            */

            featured:
              Boolean(
                rawProduct
                  .featured
              ),

            bestSeller:
              Boolean(
                rawProduct
                  .bestSeller
              ),

            newArrival:
              Boolean(
                rawProduct
                  .newArrival
              ),

            trending:
              Boolean(
                rawProduct
                  .trending
              ),

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            status:
              cleanString(
                rawProduct.status
              ),

            sortOrder:
              cleanNumber(
                rawProduct
                  .sortOrder
              ),

            /*
            |--------------------------------------------------------------------------
            | RATING
            |--------------------------------------------------------------------------
            */

            rating:
              cleanNumber(
                rawProduct.rating
              ),

            reviewCount:
              cleanNumber(
                rawProduct
                  .reviewCount
              ),

            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            seoTitle:
              cleanString(
                rawProduct
                  .seoTitle
              ),

            seoDescription:
              cleanString(
                rawProduct
                  .seoDescription
              ),

            /*
            |--------------------------------------------------------------------------
            | DELETE
            |--------------------------------------------------------------------------
            */

            isDeleted:
              Boolean(
                rawProduct
                  .isDeleted
              ),

            deletedAt:
              rawProduct
                .deletedAt ??
              null,

            deletedBy:
              rawProduct
                .deletedBy
                ? String(
                    rawProduct
                      .deletedBy
                  )
                : null,

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            createdAt:
              rawProduct
                .createdAt,

            updatedAt:
              rawProduct
                .updatedAt,
          };
        }
      );

    /*
    |--------------------------------------------------------------------------
    | FILTER DATA
    |--------------------------------------------------------------------------
    */

    const genders =
      uniqueStrings(
        normalizedProducts.map(
          (product) =>
            product.gender
        )
      );

    const categories =
      uniqueStrings(
        normalizedProducts.map(
          (product) =>
            product.category
        )
      );

    const subCategories =
      uniqueStrings(
        normalizedProducts.map(
          (product) =>
            product.subCategory
        )
      );

    const newArrivals =
      normalizedProducts.some(
        (product) =>
          product.newArrival ===
          true
      );

    const bestSellers =
      normalizedProducts.some(
        (product) =>
          product.bestSeller ===
          true
      );

    const trending =
      normalizedProducts.some(
        (product) =>
          product.trending ===
          true
      );

    const offers =
      normalizedProducts.some(
        (product) =>
          Number(
            product.discount ??
              0
          ) > 0 ||
          Number(
            product.mrp ??
              0
          ) >
            Number(
              product.price ??
                0
            )
      );

    const filters:
      ProductFilters = {
      genders,

      categories,

      subCategories,

      newArrivals,

      bestSellers,

      offers,

      trending,
    };

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Products loaded successfully.",

        count:
          normalizedProducts.length,

        products:
          normalizedProducts,

        filters,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PRODUCT LIST API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load products.",

        count: 0,

        products: [],

        filters: {
          genders: [],

          categories: [],

          subCategories: [],

          newArrivals:
            false,

          bestSellers:
            false,

          offers:
            false,

          trending:
            false,
        },
      },
      {
        status: 500,
      }
    );
  }
}