import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";
import cloudinary from "@/lib/cloudinary";

import Product, {
  MAX_PRODUCT_REEL_DURATION,
} from "@/models/Product";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

/* =====================================================
   ALLOWED ROLES
===================================================== */

const allowedRoles = [
  "super_admin",
  "product_manager",
] as const;

type AllowedRole =
  (typeof allowedRoles)[number];

/* =====================================================
   TYPES
===================================================== */

type AdminPayload = {
  adminId?: string;
  role?: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ProductBooleanField =
  | "featured"
  | "bestSeller"
  | "newArrival"
  | "trending";

type ProductSizeStock = {
  size: string;
  stock: number;
};

type Product360Frame = {
  angle: number;
  name: string;
  url: string;
};

type CleanedProduct360 = {
  enabled: boolean;
  frames: Product360Frame[];
};

type CleanedProductReelVideo = {
  enabled: boolean;
  url: string;
  publicId: string;
  duration: number;
  poster: string;
};

type CleanedColorVariant = {
  color: string;

  images: string[];

  stock?: number;

  sizeStocks:
    ProductSizeStock[];

  view360Images:
    string[];

  product360:
    CleanedProduct360;
};

type DuplicateKeyError = {
  code?: number;

  keyPattern?: Record<
    string,
    unknown
  >;
};

/* =====================================================
   ADMIN AUTH
===================================================== */

async function getAdminPayload(
  request: NextRequest
): Promise<
  AdminPayload | null
> {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (!token) {
    return null;
  }

  try {
    const payload =
      await verifyAdminToken(
        token
      );

    if (
      !payload?.adminId ||
      !payload?.role
    ) {
      return null;
    }

    const role =
      String(
        payload.role
      );

    if (
      !allowedRoles.includes(
        role as AllowedRole
      )
    ) {
      return null;
    }

    return {
      adminId:
        String(
          payload.adminId
        ),

      role,
    };
  } catch {
    return null;
  }
}

/* =====================================================
   HELPERS
===================================================== */

function cleanString(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim();
}

function cleanStringArray(
  value: unknown
): string[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .map(
      (
        item:
          unknown
      ) =>
        cleanString(
          item
        )
    )
    .filter(
      Boolean
    );
}

function uniqueStrings(
  values: string[]
): string[] {
  const map =
    new Map<
      string,
      string
    >();

  for (
    const rawValue of
    values
  ) {
    const value =
      rawValue.trim();

    if (!value) {
      continue;
    }

    const key =
      value.toLowerCase();

    if (
      !map.has(key)
    ) {
      map.set(
        key,
        value
      );
    }
  }

  return Array.from(
    map.values()
  );
}

function isStrictBoolean(
  value: unknown
): value is boolean {
  return (
    typeof value ===
    "boolean"
  );
}

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

function cleanNonNegativeInteger(
  value: unknown
):
  | number
  | null {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    ) ||
    number < 0 ||
    !Number.isInteger(
      number
    )
  ) {
    return null;
  }

  return number;
}

function cleanOptionalStock(
  value: unknown
):
  | number
  | undefined
  | null {
  if (
    value ===
      undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const number =
    cleanNonNegativeInteger(
      value
    );

  if (
    number === null
  ) {
    return null;
  }

  return number;
}

/* =====================================================
   API RESPONSES
===================================================== */

function invalidResponse(
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

function notFoundResponse(
  message: string
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status: 404,
    }
  );
}

function permissionDeniedResponse() {
  return NextResponse.json(
    {
      success: false,

      message:
        "Permission denied.",
    },
    {
      status: 403,
    }
  );
}

/* =====================================================
   ACTIVE PRODUCT FILTER
===================================================== */

function activeProductFilter() {
  return {
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
  };
}

/* =====================================================
   CLEAN PRODUCT REEL
===================================================== */

function cleanProductReelVideo(
  value: unknown
):
  | CleanedProductReelVideo
  | null {
  if (
    !isRecord(value)
  ) {
    return null;
  }

  if (
    value.enabled !==
      undefined &&
    !isStrictBoolean(
      value.enabled
    )
  ) {
    return null;
  }

  const url =
    cleanString(
      value.url
    );

  const publicId =
    cleanString(
      value.publicId
    );

  const poster =
    cleanString(
      value.poster
    );

  /*
  -----------------------------------------------------
  EMPTY REEL
  -----------------------------------------------------
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
  -----------------------------------------------------
  DURATION
  -----------------------------------------------------
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

/* =====================================================
   PRODUCT REEL CLOUDINARY HELPERS
===================================================== */

function isProductReelPublicId(
  publicId: string
) {
  return publicId.startsWith(
    "SilentGEN/product-reels/"
  );
}

async function deleteProductReelFromCloudinary(
  publicId: string
) {
  const cleanedPublicId =
    cleanString(
      publicId
    );

  if (
    !cleanedPublicId ||
    !isProductReelPublicId(
      cleanedPublicId
    )
  ) {
    return;
  }

  try {
    const result =
      await cloudinary.uploader.destroy(
        cleanedPublicId,
        {
          resource_type:
            "video",

          invalidate:
            true,
        }
      );

    if (
      result?.result !==
        "ok" &&
      result?.result !==
        "not found"
    ) {
      console.warn(
        "PRODUCT_REEL_CLOUDINARY_DELETE_RESULT:",
        result
      );
    }
  } catch (error) {
    console.error(
      "PRODUCT_REEL_CLOUDINARY_DELETE_ERROR:",
      error
    );
  }
}

/* =====================================================
   CLEAN SIZE STOCKS
===================================================== */

function cleanSizeStocks(
  value: unknown
):
  | ProductSizeStock[]
  | null {
  if (
    !Array.isArray(value)
  ) {
    return null;
  }

  const stockMap =
    new Map<
      string,
      ProductSizeStock
    >();

  for (
    const rawItem of
    value
  ) {
    if (
      !isRecord(
        rawItem
      )
    ) {
      return null;
    }

    const size =
      cleanString(
        rawItem.size
      );

    if (!size) {
      return null;
    }

    const stock =
      cleanNonNegativeInteger(
        rawItem.stock
      );

    if (
      stock === null
    ) {
      return null;
    }

    const key =
      size.toLowerCase();

    const existing =
      stockMap.get(
        key
      );

    if (existing) {
      existing.stock +=
        stock;

      continue;
    }

    stockMap.set(
      key,
      {
        size,
        stock,
      }
    );
  }

  return Array.from(
    stockMap.values()
  );
}

/* =====================================================
   SIZE STOCK TOTAL
===================================================== */

function calculateSizeStockTotal(
  value:
    ProductSizeStock[]
) {
  return value.reduce(
    (
      total,
      item
    ) =>
      total +
      item.stock,
    0
  );
}

/* =====================================================
   CLEAN PRODUCT 360
===================================================== */

function cleanProduct360(
  value: unknown
):
  | CleanedProduct360
  | null {
  if (
    !isRecord(value)
  ) {
    return null;
  }

  if (
    value.enabled !==
      undefined &&
    !isStrictBoolean(
      value.enabled
    )
  ) {
    return null;
  }

  if (
    value.frames ===
    undefined
  ) {
    return {
      enabled:
        false,

      frames: [],
    };
  }

  if (
    !Array.isArray(
      value.frames
    )
  ) {
    return null;
  }

  const frameMap =
    new Map<
      number,
      Product360Frame
    >();

  for (
    const frameValue of
    value.frames
  ) {
    if (
      !isRecord(
        frameValue
      )
    ) {
      return null;
    }

    const angle =
      Number(
        frameValue.angle
      );

    const url =
      cleanString(
        frameValue.url
      );

    if (
      !Number.isFinite(
        angle
      ) ||
      angle < 0 ||
      angle >= 360
    ) {
      return null;
    }

    if (!url) {
      return null;
    }

    const safeAngle =
      Math.round(
        angle
      );

    const name =
      cleanString(
        frameValue.name
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

  const frames =
    Array.from(
      frameMap.values()
    ).sort(
      (a, b) =>
        a.angle -
        b.angle
    );

  return {
    enabled:
      frames.length > 0,

    frames,
  };
}

/* =====================================================
   CLEAN COLOR VARIANTS
===================================================== */

function cleanColorVariants(
  value: unknown
):
  | CleanedColorVariant[]
  | null {
  if (
    !Array.isArray(value)
  ) {
    return null;
  }

  const variantMap =
    new Map<
      string,
      CleanedColorVariant
    >();

  for (
    const rawVariant of
    value
  ) {
    if (
      !isRecord(
        rawVariant
      )
    ) {
      return null;
    }

    const color =
      cleanString(
        rawVariant.color
      );

    if (!color) {
      return null;
    }

    /*
    -----------------------------------------------
    IMAGES
    -----------------------------------------------
    */

    let images:
      string[] =
      [];

    if (
      rawVariant.images !==
      undefined
    ) {
      if (
        !Array.isArray(
          rawVariant.images
        )
      ) {
        return null;
      }

      images =
        uniqueStrings(
          cleanStringArray(
            rawVariant.images
          )
        );
    }

    /*
    -----------------------------------------------
    SIZE STOCK
    -----------------------------------------------
    */

    let sizeStocks:
      ProductSizeStock[] =
      [];

    if (
      rawVariant.sizeStocks !==
      undefined
    ) {
      const cleaned =
        cleanSizeStocks(
          rawVariant.sizeStocks
        );

      if (!cleaned) {
        return null;
      }

      sizeStocks =
        cleaned;
    }

    /*
    -----------------------------------------------
    COLOR STOCK
    -----------------------------------------------
    */

    const optionalStock =
      cleanOptionalStock(
        rawVariant.stock
      );

    if (
      optionalStock ===
      null
    ) {
      return null;
    }

    const stock =
      sizeStocks.length >
      0
        ? calculateSizeStockTotal(
            sizeStocks
          )
        : optionalStock;

    /*
    -----------------------------------------------
    LEGACY 360
    -----------------------------------------------
    */

    let view360Images:
      string[] = [];

    if (
      rawVariant
        .view360Images !==
      undefined
    ) {
      if (
        !Array.isArray(
          rawVariant
            .view360Images
        )
      ) {
        return null;
      }

      view360Images =
        uniqueStrings(
          cleanStringArray(
            rawVariant
              .view360Images
          )
        );
    }

    /*
    -----------------------------------------------
    COLOR PRODUCT 360
    -----------------------------------------------
    */

    let product360:
      CleanedProduct360 =
      {
        enabled:
          false,

        frames: [],
      };

    if (
      rawVariant
        .product360 !==
      undefined
    ) {
      const cleaned360 =
        cleanProduct360(
          rawVariant
            .product360
        );

      if (!cleaned360) {
        return null;
      }

      product360 =
        cleaned360;
    }

    const key =
      color.toLowerCase();

    if (
      variantMap.has(
        key
      )
    ) {
      return null;
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
  );
}

/* =====================================================
   CALCULATE TOTAL VARIANT STOCK
===================================================== */

function calculateVariantStock(
  variants:
    CleanedColorVariant[]
) {
  return variants.reduce(
    (
      total,
      variant
    ) => {
      if (
        variant
          .sizeStocks
          .length > 0
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
        (
          variant.stock ??
          0
        )
      );
    },
    0
  );
}

/* =====================================================
   GET PRODUCT

   GET /api/admin/products/[id]
===================================================== */

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin =
      await getAdminPayload(
        request
      );

    if (!admin) {
      return permissionDeniedResponse();
    }

    await connectDB();

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return invalidResponse(
        "Invalid product id."
      );
    }

    const product =
      await Product.findOne({
        _id: id,

        ...activeProductFilter(),
      }).lean();

    if (!product) {
      return notFoundResponse(
        "Product not found."
      );
    }

    return NextResponse.json(
      {
        success:
          true,

        product,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET_ADMIN_PRODUCT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to load product.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   PATCH PRODUCT

   PATCH /api/admin/products/[id]
===================================================== */

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /* =================================================
       AUTH
    ================================================= */

    const admin =
      await getAdminPayload(
        request
      );

    if (!admin) {
      return permissionDeniedResponse();
    }

    /* =================================================
       DB + ID
    ================================================= */

    await connectDB();

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return invalidResponse(
        "Invalid product id."
      );
    }

    /* =================================================
       PRODUCT
    ================================================= */

    const product =
      await Product.findOne({
        _id: id,

        ...activeProductFilter(),
      });

    if (!product) {
      return notFoundResponse(
        "Product not found."
      );
    }

    /* =================================================
       EXISTING PRODUCT REEL
    ================================================= */

    const previousReelPublicId =
      cleanString(
        product.get(
          "reelVideo"
        )?.publicId
      );

    let reelWasUpdated =
      false;

    let nextReelPublicId =
      previousReelPublicId;

    /* =================================================
       BODY
    ================================================= */

    let body:
      unknown;

    try {
      body =
        await request.json();
    } catch {
      return invalidResponse(
        "Invalid JSON request body."
      );
    }

    if (
      !isRecord(body)
    ) {
      return invalidResponse(
        "Invalid request body."
      );
    }

    /* =================================================
       SKU
    ================================================= */

    if (
      body.sku !==
      undefined
    ) {
      const sku =
        cleanString(
          body.sku
        ).toUpperCase();

      if (!sku) {
        return invalidResponse(
          "SKU is required."
        );
      }

      const duplicateSku =
        await Product.findOne({
          sku,

          _id: {
            $ne: id,
          },

          ...activeProductFilter(),
        }).lean();

      if (
        duplicateSku
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "A product with the same SKU already exists.",
          },
          {
            status:
              409,
          }
        );
      }

      product.sku =
        sku;
    }

    /* =================================================
       NAME
    ================================================= */

    if (
      body.name !==
      undefined
    ) {
      const name =
        cleanString(
          body.name
        );

      if (!name) {
        return invalidResponse(
          "Product name is required."
        );
      }

      product.name =
        name;
    }

    /* =================================================
       SLUG
    ================================================= */

    if (
      body.slug !==
      undefined
    ) {
      const slug =
        cleanString(
          body.slug
        )
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          );

      if (!slug) {
        return invalidResponse(
          "Slug is required."
        );
      }

      const duplicateSlug =
        await Product.findOne({
          slug,

          _id: {
            $ne: id,
          },

          ...activeProductFilter(),
        }).lean();

      if (
        duplicateSlug
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "A product with the same slug already exists.",
          },
          {
            status:
              409,
          }
        );
      }

      product.slug =
        slug;
    }

    /* =================================================
       CATEGORY
    ================================================= */

    if (
      body.category !==
      undefined
    ) {
      const category =
        cleanString(
          body.category
        );

      if (
        !category
      ) {
        return invalidResponse(
          "Category is required."
        );
      }

      product.category =
        category;
    }

    /* =================================================
       SUB CATEGORY
    ================================================= */

    if (
      body.subCategory !==
      undefined
    ) {
      product.subCategory =
        cleanString(
          body.subCategory
        );
    }

    /* =================================================
       BRAND
    ================================================= */

    if (
      body.brand !==
      undefined
    ) {
      product.brand =
        cleanString(
          body.brand
        ) ||
        "SilentGEN";
    }

    /* =================================================
       GENDER
    ================================================= */

    if (
      body.gender !==
      undefined
    ) {
      const allowedGenders =
        [
          "Men",
          "Women",
          "Kids",
          "Unisex",
        ] as const;

      if (
        typeof body.gender !==
          "string" ||
        !allowedGenders.includes(
          body.gender as
            (typeof allowedGenders)[number]
        )
      ) {
        return invalidResponse(
          "Invalid gender."
        );
      }

      product.gender =
        body.gender;
    }

    /* =================================================
       FABRIC
    ================================================= */

    if (
      body.fabric !==
      undefined
    ) {
      product.fabric =
        cleanString(
          body.fabric
        );
    }

    /* =================================================
       FIT
    ================================================= */

    if (
      body.fit !==
      undefined
    ) {
      product.fit =
        cleanString(
          body.fit
        );
    }

    /* =================================================
       GSM
    ================================================= */

    if (
      body.gsm !==
      undefined
    ) {
      const gsm =
        Number(
          body.gsm
        );

      if (
        !Number.isFinite(
          gsm
        ) ||
        gsm < 0
      ) {
        return invalidResponse(
          "GSM must be a valid non-negative number."
        );
      }

      product.gsm =
        gsm;
    }

    /* =================================================
       WEIGHT
    ================================================= */

    if (
      body.weight !==
      undefined
    ) {
      const weight =
        Number(
          body.weight
        );

      if (
        !Number.isFinite(
          weight
        ) ||
        weight < 0
      ) {
        return invalidResponse(
          "Weight must be a valid non-negative number."
        );
      }

      product.weight =
        weight;
    }

    /* =================================================
       DESCRIPTION
    ================================================= */

    if (
      body.shortDescription !==
      undefined
    ) {
      product.shortDescription =
        cleanString(
          body.shortDescription
        );
    }

    if (
      body.description !==
      undefined
    ) {
      product.description =
        cleanString(
          body.description
        );
    }

    /* =================================================
       PRICE + MRP
    ================================================= */

    const currentMrp =
      Number(
        product.mrp
      );

    const currentPrice =
      Number(
        product.price
      );

    const mrp =
      body.mrp !==
      undefined
        ? Number(
            body.mrp
          )
        : currentMrp;

    const price =
      body.price !==
      undefined
        ? Number(
            body.price
          )
        : currentPrice;

    if (
      !Number.isFinite(
        mrp
      ) ||
      !Number.isFinite(
        price
      )
    ) {
      return invalidResponse(
        "MRP and selling price must be valid numbers."
      );
    }

    if (
      mrp < 0 ||
      price < 0
    ) {
      return invalidResponse(
        "MRP and selling price cannot be negative."
      );
    }

    if (
      price > mrp
    ) {
      return invalidResponse(
        "Selling price cannot be greater than MRP."
      );
    }

    product.mrp =
      mrp;

    product.price =
      price;

    /* =================================================
       DISCOUNT
    ================================================= */

    if (
      body.discount !==
      undefined
    ) {
      const discount =
        Number(
          body.discount
        );

      if (
        !Number.isFinite(
          discount
        ) ||
        discount < 0 ||
        discount > 100
      ) {
        return invalidResponse(
          "Discount must be between 0 and 100."
        );
      }

      product.discount =
        discount;
    } else if (
      mrp > 0
    ) {
      product.discount =
        Math.max(
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
    } else {
      product.discount =
        0;
    }

    /* =================================================
       MANUAL TOTAL STOCK
    ================================================= */

    if (
      body.stock !==
      undefined
    ) {
      const stock =
        cleanNonNegativeInteger(
          body.stock
        );

      if (
        stock ===
        null
      ) {
        return invalidResponse(
          "Stock must be a valid non-negative whole number."
        );
      }

      product.stock =
        stock;
    }

    /* =================================================
       PRODUCT LEVEL SIZE STOCK
    ================================================= */

    if (
      body.sizeStocks !==
      undefined
    ) {
      const sizeStocks =
        cleanSizeStocks(
          body.sizeStocks
        );

      if (
        !sizeStocks
      ) {
        return invalidResponse(
          "Size stock must contain valid size and stock values."
        );
      }

      product.set(
        "sizeStocks",
        sizeStocks
      );
    }

    /* =================================================
       LOW STOCK LIMIT
    ================================================= */

    if (
      body.lowStockLimit !==
      undefined
    ) {
      const lowStockLimit =
        cleanNonNegativeInteger(
          body.lowStockLimit
        );

      if (
        lowStockLimit ===
        null
      ) {
        return invalidResponse(
          "Low stock limit must be a valid non-negative whole number."
        );
      }

      product.lowStockLimit =
        lowStockLimit;
    }

    /* =================================================
       STATUS
    ================================================= */

    if (
      body.status !==
      undefined
    ) {
      const allowedStatuses =
        [
          "Active",
          "Draft",
          "Out of Stock",
          "Archived",
        ] as const;

      if (
        typeof body.status !==
          "string" ||
        !allowedStatuses.includes(
          body.status as
            (typeof allowedStatuses)[number]
        )
      ) {
        return invalidResponse(
          "Invalid product status."
        );
      }

      product.status =
        body.status;
    }

    /* =================================================
       THUMBNAIL
    ================================================= */

    if (
      body.thumbnail !==
      undefined
    ) {
      product.thumbnail =
        cleanString(
          body.thumbnail
        );
    }

    /* =================================================
       PRODUCT IMAGES
    ================================================= */

    if (
      body.images !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.images
        )
      ) {
        return invalidResponse(
          "Images must be an array."
        );
      }

      product.images =
        uniqueStrings(
          cleanStringArray(
            body.images
          )
        );
    }

    /* =================================================
       PRODUCT REEL VIDEO
    ================================================= */

    if (
      body.reelVideo !==
      undefined
    ) {
      const reelVideo =
        cleanProductReelVideo(
          body.reelVideo
        );

      if (
        !reelVideo
      ) {
        return invalidResponse(
          `Product reel must contain valid video data and cannot exceed ${MAX_PRODUCT_REEL_DURATION} seconds.`
        );
      }

      /*
      -------------------------------------------------
      CLOUDINARY PUBLIC ID SECURITY
      -------------------------------------------------
      */

      if (
        reelVideo.publicId &&
        !isProductReelPublicId(
          reelVideo.publicId
        )
      ) {
        return invalidResponse(
          "Invalid product reel Cloudinary publicId."
        );
      }

      reelWasUpdated =
        true;

      nextReelPublicId =
        reelVideo.publicId;

      product.set(
        "reelVideo",
        reelVideo
      );
    }

    /* =================================================
       GLOBAL LEGACY 360 IMAGES
    ================================================= */

    if (
      body.view360Images !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.view360Images
        )
      ) {
        return invalidResponse(
          "360 images must be an array."
        );
      }

      product.view360Images =
        uniqueStrings(
          cleanStringArray(
            body.view360Images
          )
        );
    }

    /* =================================================
       SIZES
    ================================================= */

    if (
      body.sizes !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.sizes
        )
      ) {
        return invalidResponse(
          "Sizes must be an array."
        );
      }

      product.sizes =
        uniqueStrings(
          cleanStringArray(
            body.sizes
          )
        );
    }

    /* =================================================
       COLORS
    ================================================= */

    if (
      body.colors !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.colors
        )
      ) {
        return invalidResponse(
          "Colors must be an array."
        );
      }

      product.colors =
        uniqueStrings(
          cleanStringArray(
            body.colors
          )
        );
    }

    /* =================================================
       COLOR VARIANTS
    ================================================= */

    if (
      body.colorVariants !==
      undefined
    ) {
      const cleanedVariants =
        cleanColorVariants(
          body.colorVariants
        );

      if (
        !cleanedVariants
      ) {
        return invalidResponse(
          "Invalid color variants. Check colors, stock, size stock, images and 360° data."
        );
      }

      product.set(
        "colorVariants",
        cleanedVariants
      );

      const currentColors =
        Array.isArray(
          product.colors
        )
          ? product.colors.map(
              (
                color:
                  unknown
              ) =>
                cleanString(
                  color
                )
            )
          : [];

      product.colors =
        uniqueStrings([
          ...currentColors,

          ...cleanedVariants.map(
            (variant) =>
              variant.color
          ),
        ]);
    }

    /* =================================================
       GLOBAL AI PRODUCT 360
    ================================================= */

    if (
      body.product360 !==
      undefined
    ) {
      const cleaned360 =
        cleanProduct360(
          body.product360
        );

      if (
        !cleaned360
      ) {
        return invalidResponse(
          "Invalid 360° product data."
        );
      }

      product.product360 = {
        enabled:
          cleaned360.enabled,

        frames:
          cleaned360.frames,
      };
    }

    /* =================================================
       SYNCHRONIZE ALL SIZES
    ================================================= */

    const productSizeStocks =
      Array.isArray(
        product.get(
          "sizeStocks"
        )
      )
        ? product
            .get(
              "sizeStocks"
            )
            .map(
              (
                item:
                  any
              ) =>
                cleanString(
                  item.size
                )
            )
        : [];

    const currentVariants =
      Array.isArray(
        product.colorVariants
      )
        ? product.colorVariants
        : [];

    const variantSizes =
      currentVariants.flatMap(
        (
          variant:
            any
        ) =>
          Array.isArray(
            variant.sizeStocks
          )
            ? variant.sizeStocks.map(
                (
                  item:
                    any
                ) =>
                  cleanString(
                    item.size
                  )
              )
            : []
      );

    product.sizes =
      uniqueStrings([
        ...(
          Array.isArray(
            product.sizes
          )
            ? product.sizes.map(
                (
                  size:
                    unknown
                ) =>
                  cleanString(
                    size
                  )
              )
            : []
        ),

        ...productSizeStocks,

        ...variantSizes,
      ]);

    /* =================================================
       CALCULATE FINAL TOTAL STOCK
    ================================================= */

    const normalizedCurrentVariants:
      CleanedColorVariant[] =
      currentVariants.map(
        (
          variant:
            any
        ) => {
          const sizeStocks =
            Array.isArray(
              variant.sizeStocks
            )
              ? variant.sizeStocks.map(
                  (
                    item:
                      any
                  ) => ({
                    size:
                      cleanString(
                        item.size
                      ),

                    stock:
                      Number(
                        item.stock ??
                          0
                      ),
                  })
                )
              : [];

          return {
            color:
              cleanString(
                variant.color
              ),

            images:
              Array.isArray(
                variant.images
              )
                ? cleanStringArray(
                    variant.images
                  )
                : [],

            stock:
              variant.stock ===
                undefined
                ? undefined
                : Number(
                    variant.stock
                  ),

            sizeStocks,

            view360Images:
              Array.isArray(
                variant
                  .view360Images
              )
                ? cleanStringArray(
                    variant
                      .view360Images
                  )
                : [],

            product360: {
              enabled:
                Boolean(
                  variant
                    .product360
                    ?.enabled
                ),

              frames:
                Array.isArray(
                  variant
                    .product360
                    ?.frames
                )
                  ? variant
                      .product360
                      .frames
                  : [],
            },
          };
        }
      );

    const variantsWithInventory =
      normalizedCurrentVariants.filter(
        (variant) =>
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
        calculateVariantStock(
          normalizedCurrentVariants
        );
    } else {
      const currentSizeStocks =
        Array.isArray(
          product.get(
            "sizeStocks"
          )
        )
          ? product
              .get(
                "sizeStocks"
              )
              .map(
                (
                  item:
                    any
                ) => ({
                  size:
                    cleanString(
                      item.size
                    ),

                  stock:
                    Number(
                      item.stock ??
                        0
                    ),
                })
              )
          : [];

      if (
        currentSizeStocks.length >
        0
      ) {
        product.stock =
          calculateSizeStockTotal(
            currentSizeStocks
          );
      }
    }

    /* =================================================
       AUTO STATUS
    ================================================= */

    if (
      product.status ===
        "Active" &&
      Number(
        product.stock
      ) <= 0
    ) {
      product.status =
        "Out of Stock";
    }

    if (
      product.status ===
        "Out of Stock" &&
      Number(
        product.stock
      ) > 0
    ) {
      product.status =
        "Active";
    }

    /* =================================================
       TAGS
    ================================================= */

    if (
      body.tags !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.tags
        )
      ) {
        return invalidResponse(
          "Tags must be an array."
        );
      }

      product.tags =
        uniqueStrings(
          cleanStringArray(
            body.tags
          )
        );
    }

    /* =================================================
       SUGGESTED PRODUCTS
    ================================================= */

    if (
      body.suggestedProductIds !==
      undefined
    ) {
      if (
        !Array.isArray(
          body
            .suggestedProductIds
        )
      ) {
        return invalidResponse(
          "Suggested products must be an array."
        );
      }

      if (
        body
          .suggestedProductIds
          .length > 4
      ) {
        return invalidResponse(
          "You can select up to 4 suggested products."
        );
      }

      const suggestedIds =
        body
          .suggestedProductIds
          .map(
            (
              suggestedId:
                unknown
            ) =>
              cleanString(
                suggestedId
              )
          )
          .filter(
            Boolean
          );

      const invalidIds =
        suggestedIds.filter(
          (
            suggestedId
          ) =>
            !mongoose.Types.ObjectId.isValid(
              suggestedId
            )
        );

      if (
        invalidIds.length >
        0
      ) {
        return invalidResponse(
          "Suggested products contain an invalid product id."
        );
      }

      if (
        suggestedIds.some(
          (
            suggestedId
          ) =>
            suggestedId ===
            id
        )
      ) {
        return invalidResponse(
          "A product cannot suggest itself."
        );
      }

      const uniqueIds =
        Array.from(
          new Set(
            suggestedIds
          )
        );

      if (
        uniqueIds.length !==
        suggestedIds.length
      ) {
        return invalidResponse(
          "Suggested products must be unique."
        );
      }

      if (
        uniqueIds.length >
        0
      ) {
        const existingProducts =
          await Product.find({
            _id: {
              $in:
                uniqueIds,
            },

            ...activeProductFilter(),
          })
            .select(
              "_id"
            )
            .lean();

        const existingIds =
          existingProducts.map(
            (item) =>
              String(
                item._id
              )
          );

        if (
          existingIds.length !==
          uniqueIds.length
        ) {
          return invalidResponse(
            "One or more suggested products do not exist."
          );
        }
      }

      product.set(
        "suggestedProductIds",
        uniqueIds
      );
    }

    /* =================================================
       BOOLEAN FLAGS
    ================================================= */

    const booleanFields:
      ProductBooleanField[] =
      [
        "featured",
        "bestSeller",
        "newArrival",
        "trending",
      ];

    for (
      const field of
      booleanFields
    ) {
      if (
        body[field] !==
        undefined
      ) {
        if (
          !isStrictBoolean(
            body[field]
          )
        ) {
          return invalidResponse(
            `${field} must be true or false.`
          );
        }

        product[field] =
          body[field];
      }
    }

    /* =================================================
       SORT ORDER
    ================================================= */

    if (
      body.sortOrder !==
      undefined
    ) {
      const sortOrder =
        Number(
          body.sortOrder
        );

      if (
        !Number.isFinite(
          sortOrder
        ) ||
        !Number.isInteger(
          sortOrder
        ) ||
        sortOrder < 0
      ) {
        return invalidResponse(
          "Sort order must be a valid non-negative whole number."
        );
      }

      product.sortOrder =
        sortOrder;
    }

    /* =================================================
       SEO TITLE
    ================================================= */

    if (
      body.seoTitle !==
      undefined
    ) {
      const seoTitle =
        cleanString(
          body.seoTitle
        );

      if (
        seoTitle.length >
        70
      ) {
        return invalidResponse(
          "SEO title cannot exceed 70 characters."
        );
      }

      product.seoTitle =
        seoTitle;
    }

    /* =================================================
       SEO DESCRIPTION
    ================================================= */

    if (
      body.seoDescription !==
      undefined
    ) {
      const seoDescription =
        cleanString(
          body.seoDescription
        );

      if (
        seoDescription.length >
        160
      ) {
        return invalidResponse(
          "SEO description cannot exceed 160 characters."
        );
      }

      product.seoDescription =
        seoDescription;
    }

    /* =================================================
       SAVE PRODUCT FIRST
    ================================================= */

    await product.save();

    /* =================================================
       CLEAN OLD CLOUDINARY REEL
    =================================================

       Replace:
       old ID != new ID
       => delete old video

       Remove:
       old ID exists, new ID empty
       => delete old video

       Enable/Disable:
       same ID
       => no delete

       Other product edit:
       reelWasUpdated = false
       => no delete
    ================================================= */

    if (
      reelWasUpdated &&
      previousReelPublicId &&
      previousReelPublicId !==
        nextReelPublicId
    ) {
      await deleteProductReelFromCloudinary(
        previousReelPublicId
      );
    }

    /* =================================================
       SUCCESS
    ================================================= */

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Product updated successfully.",

        product,
      },
      {
        status:
          200,
      }
    );
  } catch (error) {
    console.error(
      "PATCH_ADMIN_PRODUCT_ERROR:",
      error
    );

    /* =================================================
       MONGOOSE VALIDATION
    ================================================= */

    if (
      error instanceof
      mongoose.Error
        .ValidationError
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Product validation failed.",

          errors:
            Object.values(
              error.errors
            ).map(
              (item) =>
                item.message
            ),
        },
        {
          status:
            400,
        }
      );
    }

    /* =================================================
       DUPLICATE KEY
    ================================================= */

    if (
      typeof error ===
        "object" &&
      error !== null &&
      "code" in error &&
      (
        error as
          DuplicateKeyError
      ).code ===
        11000
    ) {
      const mongoError =
        error as
          DuplicateKeyError;

      const duplicateField =
        Object.keys(
          mongoError
            .keyPattern ??
            {}
        )[0] ||
        "field";

      return NextResponse.json(
        {
          success:
            false,

          message:
            `A product with the same ${duplicateField} already exists.`,
        },
        {
          status:
            409,
        }
      );
    }

    /* =================================================
       GENERIC ERROR
    ================================================= */

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to update product.",
      },
      {
        status:
          500,
      }
    );
  }
}

/* =====================================================
   DELETE PRODUCT

   DELETE /api/admin/products/[id]

   SOFT DELETE
===================================================== */

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /* =================================================
       AUTH
    ================================================= */

    const admin =
      await getAdminPayload(
        request
      );

    if (!admin) {
      return permissionDeniedResponse();
    }

    /* =================================================
       DB
    ================================================= */

    await connectDB();

    const { id } =
      await context.params;

    /* =================================================
       ID
    ================================================= */

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return invalidResponse(
        "Invalid product id."
      );
    }

    /* =================================================
       PRODUCT
    ================================================= */

    const product =
      await Product.findOne({
        _id: id,

        ...activeProductFilter(),
      });

    if (!product) {
      return notFoundResponse(
        "Product not found."
      );
    }

    /* =================================================
       SOFT DELETE
    ================================================= */

    product.isDeleted =
      true;

    product.deletedAt =
      new Date();

    /* =================================================
       DELETED BY
    ================================================= */

    if (
      admin.adminId &&
      mongoose.Types.ObjectId.isValid(
        admin.adminId
      )
    ) {
      product.deletedBy =
        new mongoose.Types.ObjectId(
          admin.adminId
        );
    }

    /* =================================================
       SAVE
    ================================================= */

    await product.save();

    /* =================================================
       SUCCESS
    ================================================= */

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Product moved to Trash.",
      },
      {
        status:
          200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE_ADMIN_PRODUCT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to delete product.",
      },
      {
        status:
          500,
      }
    );
  }
}