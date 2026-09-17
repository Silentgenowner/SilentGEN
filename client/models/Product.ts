import {
  Schema,
  model,
  models,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| REEL CONFIG
|--------------------------------------------------------------------------
*/

export const MAX_PRODUCT_REEL_DURATION =
  30;

/*
|--------------------------------------------------------------------------
| PRODUCT REEL VIDEO TYPE
|--------------------------------------------------------------------------
*/

export type ProductReelVideo = {
  enabled: boolean;

  url: string;

  publicId: string;

  duration: number;

  poster: string;
};

/*
|--------------------------------------------------------------------------
| PRODUCT 360 FRAME TYPE
|--------------------------------------------------------------------------
*/

export type Product360Frame = {
  angle: number;

  name: string;

  url: string;
};

/*
|--------------------------------------------------------------------------
| PRODUCT 360 TYPE
|--------------------------------------------------------------------------
*/

export type Product360Data = {
  enabled: boolean;

  frames: Product360Frame[];
};

/*
|--------------------------------------------------------------------------
| SIZE STOCK TYPE
|--------------------------------------------------------------------------
*/

export type ProductSizeStock = {
  size: string;

  stock: number;
};

/*
|--------------------------------------------------------------------------
| COLOR VARIANT TYPE
|--------------------------------------------------------------------------
*/

export type ProductColorVariant = {
  color: string;

  images: string[];

  stock?: number;

  sizeStocks: ProductSizeStock[];

  view360Images: string[];

  product360: Product360Data;
};

/*
|--------------------------------------------------------------------------
| SIZE STOCK SCHEMA
|--------------------------------------------------------------------------
*/

const SizeStockSchema =
  new Schema(
    {
      size: {
        type: String,

        required: true,

        trim: true,
      },

      stock: {
        type: Number,

        required: true,

        default: 0,

        min: 0,
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| PRODUCT 360 FRAME SCHEMA
|--------------------------------------------------------------------------
*/

const Product360FrameSchema =
  new Schema(
    {
      angle: {
        type: Number,

        required: true,

        min: 0,

        max: 359,
      },

      name: {
        type: String,

        required: true,

        trim: true,
      },

      url: {
        type: String,

        required: true,

        trim: true,
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| PRODUCT 360 SCHEMA
|--------------------------------------------------------------------------
*/

const Product360Schema =
  new Schema(
    {
      enabled: {
        type: Boolean,

        default: false,
      },

      frames: {
        type: [
          Product360FrameSchema,
        ],

        default: [],
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| PRODUCT REEL VIDEO SCHEMA
|--------------------------------------------------------------------------
*/

const ProductReelVideoSchema =
  new Schema(
    {
      enabled: {
        type: Boolean,

        default: false,
      },

      url: {
        type: String,

        default: "",

        trim: true,
      },

      publicId: {
        type: String,

        default: "",

        trim: true,
      },

      duration: {
        type: Number,

        default: 0,

        min: 0,

        max:
          MAX_PRODUCT_REEL_DURATION,
      },

      poster: {
        type: String,

        default: "",

        trim: true,
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| COLOR VARIANT SCHEMA
|--------------------------------------------------------------------------
*/

const ColorVariantSchema =
  new Schema(
    {
      color: {
        type: String,

        required: true,

        trim: true,
      },

      images: {
        type: [
          {
            type: String,

            trim: true,
          },
        ],

        default: [],
      },

      stock: {
        type: Number,

        min: 0,

        required: false,
      },

      sizeStocks: {
        type: [
          SizeStockSchema,
        ],

        default: [],
      },

      view360Images: {
        type: [
          {
            type: String,

            trim: true,
          },
        ],

        default: [],
      },

      product360: {
        type:
          Product360Schema,

        default: () => ({
          enabled: false,

          frames: [],
        }),
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| PRODUCT SCHEMA
|--------------------------------------------------------------------------
*/

const ProductSchema =
  new Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | BASIC PRODUCT INFORMATION
      |--------------------------------------------------------------------------
      */

      sku: {
        type: String,

        required: true,

        unique: true,

        trim: true,

        uppercase: true,
      },

      name: {
        type: String,

        required: true,

        trim: true,
      },

      slug: {
        type: String,

        required: true,

        unique: true,

        lowercase: true,

        trim: true,
      },

      shortDescription: {
        type: String,

        default: "",

        trim: true,
      },

      description: {
        type: String,

        default: "",

        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | CATEGORY
      |--------------------------------------------------------------------------
      */

      category: {
        type: String,

        required: true,

        trim: true,
      },

      subCategory: {
        type: String,

        default: "",

        trim: true,
      },

      brand: {
        type: String,

        default:
          "SilentGEN",

        trim: true,
      },

      gender: {
        type: String,

        enum: [
          "Men",
          "Women",
          "Kids",
          "Unisex",
        ],

        default:
          "Unisex",
      },

      /*
      |--------------------------------------------------------------------------
      | PRODUCT DETAILS
      |--------------------------------------------------------------------------
      */

      fabric: {
        type: String,

        default: "",

        trim: true,
      },

      fit: {
        type: String,

        default: "",

        trim: true,
      },

      gsm: {
        type: Number,

        default: 0,

        min: 0,
      },

      weight: {
        type: Number,

        default: 0,

        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | PRICE
      |--------------------------------------------------------------------------
      */

      mrp: {
        type: Number,

        required: true,

        default: 0,

        min: 0,
      },

      price: {
        type: Number,

        required: true,

        default: 0,

        min: 0,
      },

      discount: {
        type: Number,

        default: 0,

        min: 0,

        max: 100,
      },

      /*
      |--------------------------------------------------------------------------
      | TOTAL PRODUCT STOCK
      |--------------------------------------------------------------------------
      */

      stock: {
        type: Number,

        required: true,

        default: 0,

        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | PRODUCT LEVEL SIZE STOCK
      |--------------------------------------------------------------------------
      */

      sizeStocks: {
        type: [
          SizeStockSchema,
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | LOW STOCK LIMIT
      |--------------------------------------------------------------------------
      */

      lowStockLimit: {
        type: Number,

        default: 5,

        min: 0,
      },

      sold: {
        type: Number,

        default: 0,

        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | PRODUCT IMAGES
      |--------------------------------------------------------------------------
      */

      thumbnail: {
        type: String,

        default: "",

        trim: true,
      },

      images: {
        type: [
          {
            type: String,

            trim: true,
          },
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | PRODUCT REEL VIDEO
      |--------------------------------------------------------------------------
      */

      reelVideo: {
        type:
          ProductReelVideoSchema,

        default: () => ({
          enabled: false,

          url: "",

          publicId: "",

          duration: 0,

          poster: "",
        }),
      },

      /*
      |--------------------------------------------------------------------------
      | LEGACY PRODUCT LEVEL 360
      |--------------------------------------------------------------------------
      */

      view360Images: {
        type: [
          {
            type: String,

            trim: true,
          },
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | SIZE
      |--------------------------------------------------------------------------
      */

      sizes: {
        type: [
          {
            type: String,

            trim: true,
          },
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | COLORS
      |--------------------------------------------------------------------------
      */

      colors: {
        type: [
          {
            type: String,

            trim: true,
          },
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | COLOR VARIANTS
      |--------------------------------------------------------------------------
      */

      colorVariants: {
        type: [
          ColorVariantSchema,
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | MAIN PRODUCT AI / CLOUDINARY 360
      |--------------------------------------------------------------------------
      */

      product360: {
        type:
          Product360Schema,

        default: () => ({
          enabled: false,

          frames: [],
        }),
      },

      /*
      |--------------------------------------------------------------------------
      | TAGS
      |--------------------------------------------------------------------------
      */

      tags: {
        type: [
          {
            type: String,

            trim: true,
          },
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | SUGGESTED PRODUCTS
      |--------------------------------------------------------------------------
      */

      suggestedProductIds: [
        {
          type:
            Schema.Types
              .ObjectId,

          ref:
            "Product",
        },
      ],

      /*
      |--------------------------------------------------------------------------
      | PRODUCT FLAGS
      |--------------------------------------------------------------------------
      */

      featured: {
        type: Boolean,

        default: false,
      },

      bestSeller: {
        type: Boolean,

        default: false,
      },

      newArrival: {
        type: Boolean,

        default: false,
      },

      trending: {
        type: Boolean,

        default: false,
      },

      /*
      |--------------------------------------------------------------------------
      | STATUS
      |--------------------------------------------------------------------------
      */

      status: {
        type: String,

        enum: [
          "Active",
          "Draft",
          "Out of Stock",
          "Archived",
        ],

        default:
          "Active",
      },

      sortOrder: {
        type: Number,

        default: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | REVIEWS
      |--------------------------------------------------------------------------
      */

      rating: {
        type: Number,

        default: 0,

        min: 0,

        max: 5,
      },

      reviewCount: {
        type: Number,

        default: 0,

        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | SOFT DELETE
      |--------------------------------------------------------------------------
      */

      isDeleted: {
        type: Boolean,

        default: false,

        index: true,
      },

      deletedAt: {
        type: Date,

        default: null,
      },

      deletedBy: {
        type:
          Schema.Types
            .ObjectId,

        ref:
          "Admin",

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | SEO
      |--------------------------------------------------------------------------
      */

      seoTitle: {
        type: String,

        default: "",

        trim: true,
      },

      seoDescription: {
        type: String,

        default: "",

        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
|--------------------------------------------------------------------------
| NORMALIZE STRING ARRAY
|--------------------------------------------------------------------------
*/

export function normalizeStringArray(
  value: unknown
): string[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  const cleaned =
    value
      .map(
        (item) =>
          String(
            item ?? ""
          ).trim()
      )
      .filter(
        Boolean
      );

  const map =
    new Map<
      string,
      string
    >();

  for (
    const item of
    cleaned
  ) {
    const key =
      item.toLowerCase();

    if (
      !map.has(
        key
      )
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

/*
|--------------------------------------------------------------------------
| NORMALIZE STOCK NUMBER
|--------------------------------------------------------------------------
*/

function normalizeStockNumber(
  value: unknown,
  fallback = 0
): number {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  if (
    number <
    0
  ) {
    return 0;
  }

  return Math.floor(
    number
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE OPTIONAL STOCK
|--------------------------------------------------------------------------
*/

function normalizeOptionalStock(
  value: unknown
):
  | number
  | undefined {
  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {
    return undefined;
  }

  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return undefined;
  }

  return Math.max(
    0,
    Math.floor(
      number
    )
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE SIZE STOCKS
|--------------------------------------------------------------------------
*/

export function normalizeSizeStocks(
  value: unknown
): ProductSizeStock[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  const sizeMap =
    new Map<
      string,
      ProductSizeStock
    >();

  for (
    const rawItem of
    value
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
      String(
        item.size ??
          ""
      ).trim();

    if (
      !size
    ) {
      continue;
    }

    const stock =
      normalizeStockNumber(
        item.stock,
        0
      );

    const key =
      size.toLowerCase();

    const existing =
      sizeMap.get(
        key
      );

    if (
      existing
    ) {
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
| CALCULATE SIZE STOCK TOTAL
|--------------------------------------------------------------------------
*/

export function calculateSizeStockTotal(
  value:
    ProductSizeStock[]
): number {
  return value.reduce(
    (
      total,
      item
    ) =>
      total +
      normalizeStockNumber(
        item.stock,
        0
      ),
    0
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE 360 FRAMES
|--------------------------------------------------------------------------
*/

export function normalize360Frames(
  value: unknown
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
    const rawFrame of
    value
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
      String(
        frame.url ??
          ""
      ).trim();

    if (
      !Number.isFinite(
        angle
      )
    ) {
      continue;
    }

    if (
      angle <
        0 ||
      angle >=
        360
    ) {
      continue;
    }

    if (
      !url
    ) {
      continue;
    }

    const safeAngle =
      Math.round(
        angle
      );

    const name =
      String(
        frame.name ??
          ""
      ).trim() ||
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
| NORMALIZE PRODUCT 360
|--------------------------------------------------------------------------
*/

export function normalizeProduct360(
  value: unknown
): Product360Data {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
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
      frames.length >
      0,

    frames,
  };
}

/*
|--------------------------------------------------------------------------
| NORMALIZE PRODUCT REEL VIDEO
|--------------------------------------------------------------------------
*/

export function normalizeProductReelVideo(
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
    Array.isArray(
      value
    )
  ) {
    return empty;
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
    String(
      raw.url ??
        ""
    ).trim();

  const publicId =
    String(
      raw.publicId ??
        ""
    ).trim();

  const poster =
    String(
      raw.poster ??
        ""
    ).trim();

  const duration =
    Number(
      raw.duration
    );

  if (
    !url
  ) {
    return empty;
  }

  if (
    !Number.isFinite(
      duration
    ) ||
    duration <=
      0 ||
    duration >
      MAX_PRODUCT_REEL_DURATION
  ) {
    return empty;
  }

  if (
    raw.enabled ===
    false
  ) {
    return {
      enabled: false,

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

  return {
    enabled: true,

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
| VALIDATION
|--------------------------------------------------------------------------
*/

ProductSchema.pre(
  "validate",
  function () {
    const product =
      this as {
        mrp?: number;

        price?: number;

        reelVideo?: {
          url?: unknown;

          duration?: unknown;
        };
      };

    const mrp =
      Number(
        product.mrp ??
          0
      );

    const price =
      Number(
        product.price ??
          0
      );

    if (
      Number.isFinite(
        mrp
      ) &&
      Number.isFinite(
        price
      ) &&
      price >
        mrp
    ) {
      this.invalidate(
        "price",

        "Selling price cannot be greater than MRP."
      );
    }

    const reelUrl =
      String(
        product.reelVideo
          ?.url ??
          ""
      ).trim();

    const reelDuration =
      Number(
        product.reelVideo
          ?.duration ??
          0
      );

    if (
      reelUrl &&
      (
        !Number.isFinite(
          reelDuration
        ) ||
        reelDuration <=
          0
      )
    ) {
      this.invalidate(
        "reelVideo.duration",

        "Product reel must have a valid duration."
      );
    }

    if (
      reelUrl &&
      Number.isFinite(
        reelDuration
      ) &&
      reelDuration >
        MAX_PRODUCT_REEL_DURATION
    ) {
      this.invalidate(
        "reelVideo.duration",

        `Product reel cannot be longer than ${MAX_PRODUCT_REEL_DURATION} seconds.`
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| NORMALIZE PRODUCT DATA BEFORE SAVE
|--------------------------------------------------------------------------
*/

ProductSchema.pre(
  "save",
  function () {
    const product =
      this as any;

    /*
    |--------------------------------------------------------------------------
    | NORMAL ARRAYS
    |--------------------------------------------------------------------------
    */

    product.images =
      normalizeStringArray(
        product.images
      );

    product.view360Images =
      normalizeStringArray(
        product.view360Images
      );

    product.sizes =
      normalizeStringArray(
        product.sizes
      );

    product.colors =
      normalizeStringArray(
        product.colors
      );

    product.tags =
      normalizeStringArray(
        product.tags
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT REEL VIDEO
    |--------------------------------------------------------------------------
    */

    product.reelVideo =
      normalizeProductReelVideo(
        product.reelVideo
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT LEVEL SIZE STOCK
    |--------------------------------------------------------------------------
    */

    product.sizeStocks =
      normalizeSizeStocks(
        product.sizeStocks
      );

    /*
    |--------------------------------------------------------------------------
    | GLOBAL PRODUCT 360
    |--------------------------------------------------------------------------
    */

    product.product360 =
      normalizeProduct360(
        product.product360
      );

    /*
    |--------------------------------------------------------------------------
    | COLOR VARIANTS
    |--------------------------------------------------------------------------
    */

    const rawVariants =
      Array.isArray(
        product.colorVariants
      )
        ? product.colorVariants
        : [];

    const variantMap =
      new Map<
        string,
        ProductColorVariant
      >();

    for (
      const rawVariant of
      rawVariants
    ) {
      if (
        !rawVariant
      ) {
        continue;
      }

      const color =
        String(
          rawVariant.color ??
            ""
        ).trim();

      if (
        !color
      ) {
        continue;
      }

      const key =
        color.toLowerCase();

      const images =
        normalizeStringArray(
          rawVariant.images
        );

      const view360Images =
        normalizeStringArray(
          rawVariant
            .view360Images
        );

      const product360 =
        normalizeProduct360(
          rawVariant
            .product360
        );

      const sizeStocks =
        normalizeSizeStocks(
          rawVariant
            .sizeStocks
        );

      const explicitStock =
        normalizeOptionalStock(
          rawVariant.stock
        );

      const colorStock =
        sizeStocks.length >
        0
          ? calculateSizeStockTotal(
              sizeStocks
            )
          : explicitStock;

      const existing =
        variantMap.get(
          key
        );

      if (
        existing
      ) {
        const mergedSizeStocks =
          normalizeSizeStocks([
            ...existing.sizeStocks,

            ...sizeStocks,
          ]);

        const mergedImages =
          normalizeStringArray([
            ...existing.images,

            ...images,
          ]);

        const mergedLegacy360 =
          normalizeStringArray([
            ...existing
              .view360Images,

            ...view360Images,
          ]);

        const merged360 =
          normalizeProduct360(
            {
              enabled: true,

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
          mergedSizeStocks
            .length >
          0
            ? calculateSizeStockTotal(
                mergedSizeStocks
              )
            : colorStock !==
                undefined
              ? colorStock
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
              mergedLegacy360,

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

          stock:
            colorStock,

          sizeStocks,

          view360Images,

          product360,
        }
      );
    }

    const normalizedVariants =
      Array.from(
        variantMap.values()
      );

    product.colorVariants =
      normalizedVariants;

    /*
    |--------------------------------------------------------------------------
    | SYNCHRONIZE COLORS
    |--------------------------------------------------------------------------
    */

    const variantColors =
      normalizedVariants.map(
        (
          variant
        ) =>
          variant.color
      );

    product.colors =
      normalizeStringArray([
        ...product.colors,

        ...variantColors,
      ]);

    /*
    |--------------------------------------------------------------------------
    | SYNCHRONIZE SIZES
    |--------------------------------------------------------------------------
    */

    const productStockSizes =
      product.sizeStocks.map(
        (
          item:
            ProductSizeStock
        ) =>
          item.size
      );

    const variantStockSizes =
      normalizedVariants.flatMap(
        (
          variant
        ) =>
          variant.sizeStocks.map(
            (
              item
            ) =>
              item.size
          )
      );

    product.sizes =
      normalizeStringArray([
        ...product.sizes,

        ...productStockSizes,

        ...variantStockSizes,
      ]);

    /*
    |--------------------------------------------------------------------------
    | AUTOMATIC TOTAL PRODUCT STOCK
    |--------------------------------------------------------------------------
    */

    const variantsWithInventory =
      normalizedVariants.filter(
        (
          variant
        ) =>
          variant
            .sizeStocks
            .length >
            0 ||
          variant.stock !==
            undefined
      );

    if (
      variantsWithInventory.length >
      0
    ) {
      product.stock =
        normalizedVariants.reduce(
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
                  variant
                    .sizeStocks
                )
              );
            }

            return (
              total +
              normalizeStockNumber(
                variant.stock,

                0
              )
            );
          },
          0
        );
    } else if (
      product.sizeStocks
        .length >
      0
    ) {
      product.stock =
        calculateSizeStockTotal(
          product.sizeStocks
        );
    } else {
      product.stock =
        normalizeStockNumber(
          product.stock,

          0
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AUTOMATIC STATUS
    |--------------------------------------------------------------------------
    */

    if (
      product.stock <=
        0 &&
      product.status ===
        "Active"
    ) {
      product.status =
        "Out of Stock";
    }

    if (
      product.stock >
        0 &&
      product.status ===
        "Out of Stock"
    ) {
      product.status =
        "Active";
    }
  }
);

/*
|--------------------------------------------------------------------------
| DATABASE INDEXES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| SEARCH INDEX
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  name: "text",

  sku: "text",

  category: "text",

  brand: "text",

  tags: "text",
});

/*
|--------------------------------------------------------------------------
| CATEGORY + STATUS
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  category: 1,

  status: 1,
});

/*
|--------------------------------------------------------------------------
| STATUS + CREATED
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  status: 1,

  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| FEATURED + STATUS + CREATED
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  featured: 1,

  status: 1,

  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| DELETED + CREATED
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  isDeleted: 1,

  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| PRICE
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  price: 1,
});

/*
|--------------------------------------------------------------------------
| STOCK
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  stock: 1,
});

/*
|--------------------------------------------------------------------------
| SIZE STOCK
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  "sizeStocks.size": 1,
});

/*
|--------------------------------------------------------------------------
| COLOR STOCK
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  "colorVariants.stock": 1,
});

/*
|--------------------------------------------------------------------------
| COLOR + SIZE STOCK
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  "colorVariants.color": 1,

  "colorVariants.sizeStocks.size":
    1,
});

/*
|--------------------------------------------------------------------------
| PRODUCT FLAGS
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  featured: 1,

  bestSeller: 1,

  newArrival: 1,

  trending: 1,
});

/*
|--------------------------------------------------------------------------
| MAIN 360
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  "product360.enabled": 1,
});

/*
|--------------------------------------------------------------------------
| COLOR 360
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  "colorVariants.product360.enabled":
    1,
});

/*
|--------------------------------------------------------------------------
| COLOR
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  "colorVariants.color": 1,
});

/*
|--------------------------------------------------------------------------
| PRODUCT REEL
|--------------------------------------------------------------------------
*/

ProductSchema.index({
  "reelVideo.enabled": 1,
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const Product =
  models.Product ||
  model(
    "Product",

    ProductSchema
  );

export default Product;