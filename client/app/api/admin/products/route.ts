import {
  NextRequest,
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";
import Product from "@/models/Product";

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
  stock: number;
};

type Product360Frame = {
  angle: number;
  name: string;
  url: string;
};

type Product360Data = {
  enabled: boolean;
  frames: Product360Frame[];
};

type ProductReelVideo = {
  enabled: boolean;
  url: string;
  publicId: string;
  duration: number;
  poster: string;
};

type ColorVariant = {
  color: string;

  images: string[];

  stock?: number;

  sizeStocks: SizeStock[];

  view360Images: string[];

  product360: Product360Data;
};

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_PRODUCT_REEL_DURATION =
  30;

/*
|--------------------------------------------------------------------------
| PRODUCT MANAGER ROLES
|--------------------------------------------------------------------------
*/

const productRoles = [
  "super_admin",
  "product_manager",
] as const;

/*
|--------------------------------------------------------------------------
| UNAUTHORIZED RESPONSE
|--------------------------------------------------------------------------
*/

function createUnauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,

      message:
        "You do not have permission to manage products.",
    },
    {
      status: 403,
    }
  );
}

/*
|--------------------------------------------------------------------------
| BAD REQUEST
|--------------------------------------------------------------------------
*/

function badRequest(
  message: string
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status: 400,
    }
  );
}

/*
|--------------------------------------------------------------------------
| PERMISSION CHECK
|--------------------------------------------------------------------------
*/

async function canManageProducts(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (!token) {
    return false;
  }

  try {
    const payload =
      await verifyAdminToken(
        token
      );

    return Boolean(
      payload.adminId &&
        payload.role &&
        productRoles.includes(
          payload.role as
            (typeof productRoles)[number]
        )
    );
  } catch {
    return false;
  }
}

/*
|--------------------------------------------------------------------------
| PAGINATION
|--------------------------------------------------------------------------
*/

function toPositiveInteger(
  value: string | null,
  fallback: number
) {
  const parsedValue =
    Number.parseInt(
      value || "",
      10
    );

  if (
    !Number.isInteger(
      parsedValue
    ) ||
    parsedValue < 1
  ) {
    return fallback;
  }

  return parsedValue;
}

/*
|--------------------------------------------------------------------------
| ESCAPE REGEX
|--------------------------------------------------------------------------
*/

function escapeRegex(
  value: string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/*
|--------------------------------------------------------------------------
| CREATE SLUG
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

/*
|--------------------------------------------------------------------------
| NORMALIZE STRING
|--------------------------------------------------------------------------
*/

function normalizeString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

/*
|--------------------------------------------------------------------------
| RECORD CHECK
|--------------------------------------------------------------------------
*/

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE STRING ARRAY
|--------------------------------------------------------------------------
*/

function toStringArray(
  value: unknown,
  maximumItems = 100
): string[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const values =
    value
      .map((item) =>
        String(
          item ?? ""
        ).trim()
      )
      .filter(Boolean);

  const map =
    new Map<
      string,
      string
    >();

  for (
    const item of values
  ) {
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
  ).slice(
    0,
    maximumItems
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE NUMBER
|--------------------------------------------------------------------------
*/

function normalizeNumber(
  value: unknown,
  defaultValue = 0
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return defaultValue;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return defaultValue;
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE STOCK NUMBER
|--------------------------------------------------------------------------
*/

function normalizeStockNumber(
  value: unknown,
  defaultValue = 0
) {
  const number =
    normalizeNumber(
      value,
      defaultValue
    );

  return Math.max(
    0,
    Math.floor(number)
  );
}

/*
|--------------------------------------------------------------------------
| OPTIONAL STOCK
|--------------------------------------------------------------------------
*/

function normalizeOptionalStock(
  value: unknown
):
  | number
  | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return undefined;
  }

  return Math.max(
    0,
    Math.floor(number)
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE PRODUCT REEL VIDEO
|--------------------------------------------------------------------------
*/

function normalizeProductReelVideo(
  value: unknown
):
  | ProductReelVideo
  | null {
  /*
  |--------------------------------------------------------------------------
  | NO REEL
  |--------------------------------------------------------------------------
  */

  if (
    value === undefined ||
    value === null
  ) {
    return {
      enabled: false,
      url: "",
      publicId: "",
      duration: 0,
      poster: "",
    };
  }

  if (
    !isRecord(value)
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | ENABLED VALIDATION
  |--------------------------------------------------------------------------
  */

  if (
    value.enabled !==
      undefined &&
    typeof value.enabled !==
      "boolean"
  ) {
    return null;
  }

  const url =
    normalizeString(
      value.url
    );

  const publicId =
    normalizeString(
      value.publicId
    );

  const poster =
    normalizeString(
      value.poster
    );

  /*
  |--------------------------------------------------------------------------
  | EMPTY REEL
  |--------------------------------------------------------------------------
  */

  if (!url) {
    return {
      enabled: false,
      url: "",
      publicId: "",
      duration: 0,
      poster: "",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | DURATION
  |--------------------------------------------------------------------------
  */

  const duration =
    Number(
      value.duration
    );

  if (
    !Number.isFinite(
      duration
    ) ||
    duration <= 0
  ) {
    return null;
  }

  if (
    duration >
    MAX_PRODUCT_REEL_DURATION
  ) {
    return null;
  }

  return {
    enabled:
      value.enabled !==
      false,

    url,

    publicId,

    duration:
      Number(
        duration.toFixed(
          2
        )
      ),

    poster,
  };
}

/*
|--------------------------------------------------------------------------
| NORMALIZE SIZE STOCKS
|--------------------------------------------------------------------------
*/

function normalizeSizeStocks(
  value: unknown
): SizeStock[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const sizeMap =
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
      normalizeString(
        item.size
      );

    if (!size) {
      continue;
    }

    const stock =
      normalizeStockNumber(
        item.stock
      );

    const key =
      size.toLowerCase();

    const existing =
      sizeMap.get(key);

    if (existing) {
      existing.stock +=
        stock;

      continue;
    }

    sizeMap.set(
      key,
      {
        size,
        stock,
      }
    );
  }

  return Array.from(
    sizeMap.values()
  );
}

/*
|--------------------------------------------------------------------------
| SIZE STOCK TOTAL
|--------------------------------------------------------------------------
*/

function calculateSizeStockTotal(
  sizeStocks: SizeStock[]
) {
  return sizeStocks.reduce(
    (
      total,
      item
    ) =>
      total +
      normalizeStockNumber(
        item.stock
      ),
    0
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
      normalizeString(
        frame.url
      );

    if (
      !Number.isFinite(
        angle
      )
    ) {
      continue;
    }

    if (
      angle < 0 ||
      angle >= 360
    ) {
      continue;
    }

    if (!url) {
      continue;
    }

    const safeAngle =
      Math.round(
        angle
      );

    const name =
      normalizeString(
        frame.name
      ) ||
      `frame-${safeAngle}`;

    frameMap.set(
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
      frames.length > 0,

    frames,
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
      normalizeString(
        variant.color
      );

    if (!color) {
      continue;
    }

    const images =
      toStringArray(
        variant.images,
        50
      );

    const sizeStocks =
      normalizeSizeStocks(
        variant.sizeStocks
      );

    const explicitStock =
      normalizeOptionalStock(
        variant.stock
      );

    const stock =
      sizeStocks.length >
      0
        ? calculateSizeStockTotal(
            sizeStocks
          )
        : explicitStock;

    const view360Images =
      toStringArray(
        variant.view360Images,
        60
      );

    const product360 =
      normalizeProduct360(
        variant.product360
      );

    const key =
      color.toLowerCase();

    const existing =
      variantMap.get(
        key
      );

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE COLOR MERGE
    |--------------------------------------------------------------------------
    */

    if (existing) {
      const mergedSizeStocks =
        normalizeSizeStocks([
          ...existing.sizeStocks,
          ...sizeStocks,
        ]);

      const mergedImages =
        toStringArray(
          [
            ...existing.images,
            ...images,
          ],
          50
        );

      const mergedView360 =
        toStringArray(
          [
            ...existing
              .view360Images,

            ...view360Images,
          ],
          60
        );

      const merged360 =
        normalizeProduct360(
          {
            frames: [
              ...existing
                .product360
                .frames,

              ...product360
                .frames,
            ],
          }
        );

      const mergedStock =
        mergedSizeStocks.length >
        0
          ? calculateSizeStockTotal(
              mergedSizeStocks
            )
          : stock !==
              undefined
            ? stock
            : existing.stock;

      variantMap.set(
        key,
        {
          color:
            existing.color,

          images:
            mergedImages,

          stock:
            mergedStock,

          sizeStocks:
            mergedSizeStocks,

          view360Images:
            mergedView360,

          product360:
            merged360,
        }
      );

      continue;
    }

    variantMap.set(
      key,
      {
        color,

        images,

        stock,

        sizeStocks,

        view360Images,

        product360,
      }
    );
  }

  return Array.from(
    variantMap.values()
  ).slice(
    0,
    50
  );
}

/*
|--------------------------------------------------------------------------
| STATUS VALIDATION
|--------------------------------------------------------------------------
*/

function isValidStatus(
  value: unknown
): value is ProductStatus {
  return (
    value === "Active" ||
    value === "Draft" ||
    value ===
      "Out of Stock" ||
    value ===
      "Archived"
  );
}

/*
|--------------------------------------------------------------------------
| GENDER VALIDATION
|--------------------------------------------------------------------------
*/

function isValidGender(
  value: unknown
): value is Gender {
  return (
    value === "Men" ||
    value === "Women" ||
    value === "Kids" ||
    value === "Unisex"
  );
}

/*
|--------------------------------------------------------------------------
| DISCOUNT
|--------------------------------------------------------------------------
*/

function calculateDiscount(
  mrp: number,
  price: number
) {
  if (mrp <= 0) {
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
}

/*
|--------------------------------------------------------------------------
| GET PRODUCTS
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | PERMISSION
    |--------------------------------------------------------------------------
    */

    const hasPermission =
      await canManageProducts(
        request
      );

    if (!hasPermission) {
      return createUnauthorizedResponse();
    }

    await connectDB();

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    /*
    |--------------------------------------------------------------------------
    | QUERY
    |--------------------------------------------------------------------------
    */

    const page =
      toPositiveInteger(
        searchParams.get(
          "page"
        ),
        1
      );

    const requestedLimit =
      toPositiveInteger(
        searchParams.get(
          "limit"
        ),
        10
      );

    const limit =
      Math.min(
        requestedLimit,
        100
      );

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const category =
      searchParams
        .get("category")
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim() || "";

    const sort =
      searchParams.get(
        "sort"
      ) ||
      "newest";

    /*
    |--------------------------------------------------------------------------
    | BASE FILTER
    |--------------------------------------------------------------------------
    */

    const andFilters:
      Record<
        string,
        unknown
      >[] = [
        {
          $or: [
            {
              isDeleted:
                false,
            },

            {
              isDeleted: {
                $exists:
                  false,
              },
            },
          ],
        },
      ];

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    if (search) {
      const regex =
        new RegExp(
          escapeRegex(
            search
          ),
          "i"
        );

      andFilters.push({
        $or: [
          {
            name:
              regex,
          },

          {
            sku:
              regex,
          },

          {
            category:
              regex,
          },

          {
            brand:
              regex,
          },

          {
            tags:
              regex,
          },

          {
            colors:
              regex,
          },

          {
            sizes:
              regex,
          },

          {
            "colorVariants.color":
              regex,
          },
        ],
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY
    |--------------------------------------------------------------------------
    */

    if (category) {
      andFilters.push({
        category,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    if (
      isValidStatus(
        status
      )
    ) {
      andFilters.push({
        status,
      });
    }

    const filter = {
      $and:
        andFilters,
    };

    /*
    |--------------------------------------------------------------------------
    | SORTING
    |--------------------------------------------------------------------------
    */

    const sortOptions:
      Record<
        string,
        Record<
          string,
          1 | -1
        >
      > = {
        newest: {
          createdAt: -1,
        },

        oldest: {
          createdAt: 1,
        },

        price_low_to_high: {
          price: 1,
        },

        price_high_to_low: {
          price: -1,
        },

        name_a_to_z: {
          name: 1,
        },

        name_z_to_a: {
          name: -1,
        },

        stock_low_to_high: {
          stock: 1,
        },

        stock_high_to_low: {
          stock: -1,
        },
      };

    const sortQuery =
      sortOptions[
        sort
      ] ||
      sortOptions.newest;

    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    const [
      products,
      totalProducts,
      categories,
    ] =
      await Promise.all([
        Product.find(
          filter
        )
          .sort(
            sortQuery
          )
          .skip(
            (page -
              1) *
              limit
          )
          .limit(
            limit
          )
          .lean(),

        Product.countDocuments(
          filter
        ),

        Product.distinct(
          "category",
          {
            $or: [
              {
                isDeleted:
                  false,
              },

              {
                isDeleted: {
                  $exists:
                    false,
                },
              },
            ],
          }
        ),
      ]);

    /*
    |--------------------------------------------------------------------------
    | REMOVE CORRUPT PRODUCTS
    |--------------------------------------------------------------------------
    */

    const validProducts =
      products.filter(
        (
          product:
            any
        ) =>
          product &&
          typeof product.name ===
            "string" &&
          typeof product.price ===
            "number" &&
          typeof product.mrp ===
            "number" &&
          typeof product.stock ===
            "number"
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        products:
          validProducts,

        categories:
          categories
            .filter(
              Boolean
            )
            .sort(),

        pagination: {
          page,

          limit,

          totalProducts,

          totalPages:
            Math.ceil(
              totalProducts /
                limit
            ),
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET_ADMIN_PRODUCTS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to fetch products.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST PRODUCT
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | PERMISSION
    |--------------------------------------------------------------------------
    */

    const hasPermission =
      await canManageProducts(
        request
      );

    if (!hasPermission) {
      return createUnauthorizedResponse();
    }

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | BODY
    |--------------------------------------------------------------------------
    */

    let body:
      unknown;

    try {
      body =
        await request.json();
    } catch {
      return badRequest(
        "Invalid JSON request body."
      );
    }

    if (
      !isRecord(body)
    ) {
      return badRequest(
        "Invalid request body."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | BASIC FIELDS
    |--------------------------------------------------------------------------
    */

    const name =
      normalizeString(
        body.name
      );

    const sku =
      normalizeString(
        body.sku
      ).toUpperCase();

    const category =
      normalizeString(
        body.category
      );

    const slug =
      createSlug(
        normalizeString(
          body.slug
        ) ||
          name
      );

    /*
    |--------------------------------------------------------------------------
    | NUMBERS
    |--------------------------------------------------------------------------
    */

    const mrp =
      normalizeNumber(
        body.mrp
      );

    const price =
      normalizeNumber(
        body.price
      );

    const manualStock =
      normalizeStockNumber(
        body.stock
      );

    const lowStockLimit =
      normalizeStockNumber(
        body.lowStockLimit,
        5
      );

    const gsm =
      normalizeNumber(
        body.gsm
      );

    const weight =
      normalizeNumber(
        body.weight
      );

    const sortOrder =
      normalizeNumber(
        body.sortOrder
      );

    /*
    |--------------------------------------------------------------------------
    | REQUIRED VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !name ||
      !sku ||
      !slug ||
      !category
    ) {
      return badRequest(
        "Name, SKU, Slug and Category are required."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | NUMBER VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isFinite(
        mrp
      ) ||
      !Number.isFinite(
        price
      ) ||
      !Number.isFinite(
        gsm
      ) ||
      !Number.isFinite(
        weight
      ) ||
      !Number.isFinite(
        sortOrder
      )
    ) {
      return badRequest(
        "Numeric fields contain invalid values."
      );
    }

    if (
      mrp < 0 ||
      price < 0 ||
      manualStock < 0 ||
      lowStockLimit < 0 ||
      gsm < 0 ||
      weight < 0
    ) {
      return badRequest(
        "Numeric values cannot be negative."
      );
    }

    if (
      !Number.isInteger(
        lowStockLimit
      )
    ) {
      return badRequest(
        "Low stock limit must be a whole number."
      );
    }

    if (
      !Number.isInteger(
        sortOrder
      ) ||
      sortOrder < 0
    ) {
      return badRequest(
        "Sort order must be a non-negative whole number."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PRICE VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      price > mrp
    ) {
      return badRequest(
        "Selling price cannot be greater than MRP."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT REEL
    |--------------------------------------------------------------------------
    */

    const reelVideo =
      normalizeProductReelVideo(
        body.reelVideo
      );

    if (
      !reelVideo
    ) {
      return badRequest(
        `Product reel data is invalid. Reel duration cannot exceed ${MAX_PRODUCT_REEL_DURATION} seconds.`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE CHECK
    |--------------------------------------------------------------------------
    */

    const existingProduct =
      await Product.findOne({
        $or: [
          {
            sku,
          },

          {
            slug,
          },
        ],
      }).select(
        "_id sku slug isDeleted"
      );

    if (
      existingProduct
    ) {
      if (
        existingProduct.sku ===
        sku
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "SKU already exists.",
          },
          {
            status:
              409,
          }
        );
      }

      return NextResponse.json(
        {
          success:
            false,

          message:
            "Slug already exists.",
        },
        {
          status:
            409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    const status:
      ProductStatus =
      isValidStatus(
        body.status
      )
        ? body.status
        : "Active";

    /*
    |--------------------------------------------------------------------------
    | GENDER
    |--------------------------------------------------------------------------
    */

    const gender:
      Gender =
      isValidGender(
        body.gender
      )
        ? body.gender
        : "Unisex";

    /*
    |--------------------------------------------------------------------------
    | DISCOUNT
    |--------------------------------------------------------------------------
    */

    const discount =
      calculateDiscount(
        mrp,
        price
      );

    /*
    |--------------------------------------------------------------------------
    | BASIC ARRAYS
    |--------------------------------------------------------------------------
    */

    const sizes =
      toStringArray(
        body.sizes,
        50
      );

    const colors =
      toStringArray(
        body.colors,
        50
      );

    const images =
      toStringArray(
        body.images,
        50
      );

    const tags =
      toStringArray(
        body.tags,
        50
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT LEVEL SIZE STOCK
    |--------------------------------------------------------------------------
    */

    const sizeStocks =
      normalizeSizeStocks(
        body.sizeStocks
      );

    /*
    |--------------------------------------------------------------------------
    | COLOR VARIANTS
    |--------------------------------------------------------------------------
    */

    const colorVariants =
      normalizeColorVariants(
        body.colorVariants
      );

    /*
    |--------------------------------------------------------------------------
    | LEGACY GLOBAL 360 IMAGES
    |--------------------------------------------------------------------------
    */

    const view360Images =
      toStringArray(
        body.view360Images,
        60
      );

    /*
    |--------------------------------------------------------------------------
    | GLOBAL PRODUCT 360
    |--------------------------------------------------------------------------
    */

    const product360 =
      normalizeProduct360(
        body.product360
      );

    /*
    |--------------------------------------------------------------------------
    | SYNCHRONIZE COLORS
    |--------------------------------------------------------------------------
    */

    const variantColors =
      colorVariants.map(
        (variant) =>
          variant.color
      );

    const finalColors =
      toStringArray(
        [
          ...colors,

          ...variantColors,
        ],
        50
      );

    /*
    |--------------------------------------------------------------------------
    | SYNCHRONIZE SIZES
    |--------------------------------------------------------------------------
    */

    const productSizeStockNames =
      sizeStocks.map(
        (item) =>
          item.size
      );

    const variantSizeNames =
      colorVariants.flatMap(
        (variant) =>
          variant.sizeStocks.map(
            (item) =>
              item.size
          )
      );

    const finalSizes =
      toStringArray(
        [
          ...sizes,

          ...productSizeStockNames,

          ...variantSizeNames,
        ],
        50
      );

    /*
    |--------------------------------------------------------------------------
    | CALCULATE TOTAL STOCK
    |--------------------------------------------------------------------------
    */

    const variantsWithStock =
      colorVariants.filter(
        (variant) =>
          variant.sizeStocks
            .length >
            0 ||
          variant.stock !==
            undefined
      );

    let stock =
      manualStock;

    if (
      variantsWithStock.length >
      0
    ) {
      stock =
        colorVariants.reduce(
          (
            total,
            variant
          ) => {
            if (
              variant
                .sizeStocks
                .length >
              0
            ) {
              return (
                total +
                calculateSizeStockTotal(
                  variant.sizeStocks
                )
              );
            }

            return (
              total +
              normalizeStockNumber(
                variant.stock
              )
            );
          },
          0
        );
    } else if (
      sizeStocks.length >
      0
    ) {
      stock =
        calculateSizeStockTotal(
          sizeStocks
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AUTOMATIC STATUS
    |--------------------------------------------------------------------------
    */

    let finalStatus =
      status;

    if (
      finalStatus ===
        "Active" &&
      stock <= 0
    ) {
      finalStatus =
        "Out of Stock";
    }

    if (
      finalStatus ===
        "Out of Stock" &&
      stock > 0
    ) {
      finalStatus =
        "Active";
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PRODUCT
    |--------------------------------------------------------------------------
    */

    const product =
      await Product.create({
        /*
        |--------------------------------------------------------------------------
        | BASIC
        |--------------------------------------------------------------------------
        */

        sku,

        name,

        slug,

        shortDescription:
          normalizeString(
            body.shortDescription
          ),

        description:
          normalizeString(
            body.description
          ),

        /*
        |--------------------------------------------------------------------------
        | CATEGORY
        |--------------------------------------------------------------------------
        */

        category,

        subCategory:
          normalizeString(
            body.subCategory
          ),

        brand:
          normalizeString(
            body.brand
          ) ||
          "SilentGEN",

        /*
        |--------------------------------------------------------------------------
        | PRODUCT DETAILS
        |--------------------------------------------------------------------------
        */

        gender,

        fabric:
          normalizeString(
            body.fabric
          ),

        fit:
          normalizeString(
            body.fit
          ),

        gsm,

        weight,

        /*
        |--------------------------------------------------------------------------
        | PRICING
        |--------------------------------------------------------------------------
        */

        mrp,

        price,

        discount,

        /*
        |--------------------------------------------------------------------------
        | INVENTORY
        |--------------------------------------------------------------------------
        */

        stock,

        sizeStocks,

        lowStockLimit,

        sold: 0,

        /*
        |--------------------------------------------------------------------------
        | PRODUCT IMAGES
        |--------------------------------------------------------------------------
        */

        thumbnail:
          normalizeString(
            body.thumbnail
          ),

        images,

        /*
        |--------------------------------------------------------------------------
        | PRODUCT REEL VIDEO
        |--------------------------------------------------------------------------
        */

        reelVideo,

        /*
        |--------------------------------------------------------------------------
        | GLOBAL LEGACY 360
        |--------------------------------------------------------------------------
        */

        view360Images,

        /*
        |--------------------------------------------------------------------------
        | GLOBAL AI / CLOUDINARY 360
        |--------------------------------------------------------------------------
        */

        product360,

        /*
        |--------------------------------------------------------------------------
        | VARIANTS
        |--------------------------------------------------------------------------
        */

        sizes:
          finalSizes,

        colors:
          finalColors,

        colorVariants,

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        tags,

        /*
        |--------------------------------------------------------------------------
        | FLAGS
        |--------------------------------------------------------------------------
        */

        featured:
          Boolean(
            body.featured
          ),

        bestSeller:
          Boolean(
            body.bestSeller
          ),

        newArrival:
          Boolean(
            body.newArrival
          ),

        trending:
          Boolean(
            body.trending
          ),

        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        status:
          finalStatus,

        sortOrder,

        isDeleted:
          false,

        deletedAt:
          null,

        deletedBy:
          null,

        /*
        |--------------------------------------------------------------------------
        | SEO
        |--------------------------------------------------------------------------
        */

        seoTitle:
          normalizeString(
            body.seoTitle
          ),

        seoDescription:
          normalizeString(
            body.seoDescription
          ),
      });

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Product created successfully.",

        product,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE_ADMIN_PRODUCT_ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | MONGODB DUPLICATE
    |--------------------------------------------------------------------------
    */

    const mongoError =
      error as {
        code?: number;

        keyPattern?: Record<
          string,
          unknown
        >;
      };

    if (
      mongoError.code ===
      11000
    ) {
      const duplicateField =
        mongoError.keyPattern
          ? Object.keys(
              mongoError.keyPattern
            )[0]
          : "value";

      return NextResponse.json(
        {
          success:
            false,

          message:
            `A product with this ${duplicateField} already exists.`,
        },
        {
          status:
            409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | MONGOOSE VALIDATION ERROR
    |--------------------------------------------------------------------------
    */

    if (
      error &&
      typeof error ===
        "object" &&
      "name" in error &&
      (
        error as {
          name?: string;
        }
      ).name ===
        "ValidationError"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            error instanceof
            Error
              ? error.message
              : "Product validation failed.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | GENERAL ERROR
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to create the product.",
      },
      {
        status: 500,
      }
    );
  }
}