import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type Product360Frame = {
  angle?: number;

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
  color?: string;

  images?: string[];

  view360Images?: string[];

  product360?: Product360Data;
};

/*
|--------------------------------------------------------------------------
| ACTIVE PRODUCT FILTER
|--------------------------------------------------------------------------
|
| Supports:
|
| 1. New products:
|    isDeleted === false
|
| 2. Old products:
|    isDeleted field does not exist
|
|--------------------------------------------------------------------------
*/

function activeProductFilter() {
  return {
    $or: [
      {
        isDeleted: false,
      },
      {
        isDeleted: {
          $exists: false,
        },
      },
    ],
  };
}

/*
|--------------------------------------------------------------------------
| CLEAN STRING
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/*
|--------------------------------------------------------------------------
| CLEAN STRING ARRAY
|--------------------------------------------------------------------------
*/

function cleanStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
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
        .map((item) =>
          item.trim()
        )
        .filter(Boolean)
    )
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE 360 FRAMES
|--------------------------------------------------------------------------
*/

function normalize360Frames(
  value: unknown
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const frameMap =
    new Map<
      number,
      {
        angle: number;

        name?: string;

        url?: string;

        base64?: string;

        mimeType?: string;
      }
    >();

  for (const item of value) {
    if (
      !item ||
      typeof item !==
        "object"
    ) {
      continue;
    }

    const raw =
      item as Product360Frame;

    const angle =
      Math.round(
        Number(
          raw.angle
        )
      );

    if (
      !Number.isFinite(
        angle
      ) ||
      angle < 0 ||
      angle >= 360
    ) {
      continue;
    }

    const url =
      cleanString(
        raw.url
      );

    const base64 =
      cleanString(
        raw.base64
      );

    if (
      !url &&
      !base64
    ) {
      continue;
    }

    const frame: {
      angle: number;

      name?: string;

      url?: string;

      base64?: string;

      mimeType?: string;
    } = {
      angle,
    };

    const name =
      cleanString(
        raw.name
      );

    const mimeType =
      cleanString(
        raw.mimeType
      );

    if (name) {
      frame.name =
        name;
    }

    if (url) {
      frame.url =
        url;
    }

    if (base64) {
      frame.base64 =
        base64;
    }

    if (mimeType) {
      frame.mimeType =
        mimeType;
    }

    /*
    |--------------------------------------------------------------------------
    | SAME ANGLE = LAST VALID FRAME
    |--------------------------------------------------------------------------
    */

    frameMap.set(
      angle,
      frame
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
| LEGACY 360 IMAGE ARRAY
|--------------------------------------------------------------------------
*/

function normalizeLegacy360Images(
  value: unknown
) {
  return cleanStringArray(
    value
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE PRODUCT 360
|--------------------------------------------------------------------------
*/

function normalizeProduct360(
  value: unknown
) {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return {
      enabled: false,

      frames: [],
    };
  }

  const raw =
    value as Product360Data;

  const frames =
    normalize360Frames(
      raw.frames
    );

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | If valid frames exist,
  | automatically consider 360 enabled.
  |
  | This fixes older saved products where:
  |
  | enabled = false
  | frames = [...]
  |
  |--------------------------------------------------------------------------
  */

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
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const variants: {
    color: string;

    images: string[];

    view360Images: string[];

    product360: {
      enabled: boolean;

      frames: ReturnType<
        typeof normalize360Frames
      >;
    };
  }[] = [];

  for (const item of value) {
    if (
      !item ||
      typeof item !==
        "object"
    ) {
      continue;
    }

    const raw =
      item as ColorVariant;

    const color =
      cleanString(
        raw.color
      );

    if (!color) {
      continue;
    }

    variants.push({
      color,

      images:
        cleanStringArray(
          raw.images
        ),

      view360Images:
        normalizeLegacy360Images(
          raw.view360Images
        ),

      product360:
        normalizeProduct360(
          raw.product360
        ),
    });
  }

  return variants;
}

/*
|--------------------------------------------------------------------------
| GET CUSTOMER PRODUCT
|--------------------------------------------------------------------------
|
| GET /api/product/[id]
|
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | GET PRODUCT ID
    |--------------------------------------------------------------------------
    */

    const {
      id,
    } =
      await context.params;

    /*
    |--------------------------------------------------------------------------
    | VALIDATE PRODUCT ID
    |--------------------------------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid product id.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FIND ACTIVE PRODUCT
    |--------------------------------------------------------------------------
    */

    const rawProduct =
      await Product.findOne({
        _id: id,

        ...activeProductFilter(),
      }).lean();

    /*
    |--------------------------------------------------------------------------
    | PRODUCT NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!rawProduct) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE IMAGES
    |--------------------------------------------------------------------------
    */

    const thumbnail =
      cleanString(
        rawProduct.thumbnail
      );

    const images =
      cleanStringArray(
        rawProduct.images
      );

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE COLORS
    |--------------------------------------------------------------------------
    */

    const colorVariants =
      normalizeColorVariants(
        rawProduct.colorVariants
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT COLORS
    |--------------------------------------------------------------------------
    |
    | Merge:
    |
    | 1. product.colors
    | 2. colorVariants[].color
    |
    |--------------------------------------------------------------------------
    */

    const colors =
      Array.from(
        new Set([
          ...cleanStringArray(
            rawProduct.colors
          ),

          ...colorVariants.map(
            (variant) =>
              variant.color
          ),
        ])
      );

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE MAIN PRODUCT 360
    |--------------------------------------------------------------------------
    */

    const product360 =
      normalizeProduct360(
        rawProduct.product360
      );

    /*
    |--------------------------------------------------------------------------
    | LEGACY MAIN 360
    |--------------------------------------------------------------------------
    */

    const view360Images =
      normalizeLegacy360Images(
        rawProduct.view360Images
      );

    /*
    |--------------------------------------------------------------------------
    | FINAL PRODUCT
    |--------------------------------------------------------------------------
    */

    const product = {
      ...rawProduct,

      _id:
        String(
          rawProduct._id
        ),

      thumbnail,

      images,

      colors,

      colorVariants,

      product360,

      view360Images,

      sizes:
        cleanStringArray(
          rawProduct.sizes
        ),

      /*
      |--------------------------------------------------------------------------
      | SAFE NUMBERS
      |--------------------------------------------------------------------------
      */

      mrp:
        Number(
          rawProduct.mrp ||
            0
        ),

      price:
        Number(
          rawProduct.price ||
            0
        ),

      discount:
        Number(
          rawProduct.discount ||
            0
        ),

      stock:
        Number(
          rawProduct.stock ||
            0
        ),

      rating:
        Number(
          rawProduct.rating ||
            0
        ),

      reviewCount:
        Number(
          rawProduct.reviewCount ||
            0
        ),

      gsm:
        Number(
          rawProduct.gsm ||
            0
        ),

      weight:
        Number(
          rawProduct.weight ||
            0
        ),
    };

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        product,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "GET CUSTOMER PRODUCT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load product.",
      },
      {
        status: 500,
      }
    );
  }
}