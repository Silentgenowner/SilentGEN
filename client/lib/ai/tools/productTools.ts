import mongoose from "mongoose";

import Product from "@/models/Product";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type ProductSearchInput = {
  query: string | null;

  category: string | null;

  gender: string | null;

  color: string | null;

  size: string | null;

  fabric: string | null;

  fit: string | null;

  minPrice: number | null;

  maxPrice: number | null;

  inStockOnly: boolean;

  limit: number;
};

export type GetProductInput = {
  productId: string | null;

  slug: string | null;
};

export type CheckStockInput = {
  productId: string;

  size: string | null;

  color: string | null;
};

/*
|--------------------------------------------------------------------------
| INVENTORY RESULT
|--------------------------------------------------------------------------
*/

export type ProductInventoryResolution = {
  success: boolean;

  available: boolean;

  stock: number;

  totalStock: number;

  requestedSize: string | null;

  requestedColor: string | null;

  size: string | null;

  color: string | null;

  sizeRequired: boolean;

  colorRequired: boolean;

  sizeAvailable: boolean;

  colorAvailable: boolean;

  availableSizes: string[];

  availableColors: string[];

  image: string;

  message: string;
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const clean =
    value
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  return clean || null;
}

function normalizeText(
  value: unknown
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

function cleanNumber(
  value: unknown
): number | null {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value
    )
  ) {
    return null;
  }

  return value;
}

function safeStock(
  value: unknown
) {
  const stock =
    Number(
      value
    );

  if (
    !Number.isFinite(
      stock
    ) ||
    stock <= 0
  ) {
    return 0;
  }

  return Math.floor(
    stock
  );
}

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
| STRING ARRAY
|--------------------------------------------------------------------------
*/

function stringArray(
  value: unknown
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value
    .map(
      (
        item
      ) =>
        String(
          item || ""
        ).trim()
    )
    .filter(
      Boolean
    );
}

/*
|--------------------------------------------------------------------------
| CASE INSENSITIVE FIND
|--------------------------------------------------------------------------
*/

function findCanonicalValue(
  values: unknown,
  requested: unknown
) {
  const requestedValue =
    cleanString(
      requested
    );

  if (
    !requestedValue
  ) {
    return null;
  }

  const normalized =
    normalizeText(
      requestedValue
    );

  const items =
    stringArray(
      values
    );

  const exact =
    items.find(
      (
        item
      ) =>
        normalizeText(
          item
        ) ===
        normalized
    );

  return exact || null;
}

/*
|--------------------------------------------------------------------------
| GENDER NORMALIZER
|--------------------------------------------------------------------------
*/

export function normalizeProductGender(
  value: unknown
) {
  const clean =
    normalizeText(
      value
    );

  if (
    !clean
  ) {
    return null;
  }

  if (
    [
      "men",
      "man",
      "male",
      "mens",
      "men's",
      "boy",
      "boys",
    ].includes(
      clean
    )
  ) {
    return "Men";
  }

  if (
    [
      "women",
      "woman",
      "female",
      "womens",
      "women's",
      "girl",
      "girls",
    ].includes(
      clean
    )
  ) {
    return "Women";
  }

  if (
    [
      "kid",
      "kids",
      "child",
      "children",
    ].includes(
      clean
    )
  ) {
    return "Kids";
  }

  if (
    [
      "unisex",
      "all",
      "any",
    ].includes(
      clean
    )
  ) {
    return "Unisex";
  }

  return cleanString(
    value
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT IMAGE
|--------------------------------------------------------------------------
*/

function productImage(
  product: any
) {
  const thumbnail =
    cleanString(
      product?.thumbnail
    );

  if (
    thumbnail
  ) {
    return thumbnail;
  }

  const images =
    stringArray(
      product?.images
    );

  return (
    images[0] ||
    ""
  );
}

/*
|--------------------------------------------------------------------------
| COLOR VARIANT
|--------------------------------------------------------------------------
*/

function findColorVariant(
  product: any,
  requestedColor: unknown
) {
  const color =
    cleanString(
      requestedColor
    );

  if (
    !color ||
    !Array.isArray(
      product?.colorVariants
    )
  ) {
    return null;
  }

  const normalized =
    normalizeText(
      color
    );

  return (
    product.colorVariants.find(
      (
        variant: any
      ) =>
        normalizeText(
          variant?.color
        ) ===
        normalized
    ) ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| VARIANT IMAGE
|--------------------------------------------------------------------------
*/

export function getProductVariantImage(
  product: any,
  requestedColor?: unknown
) {
  const variant =
    findColorVariant(
      product,
      requestedColor
    );

  if (
    variant
  ) {
    const variantImages =
      stringArray(
        variant.images
      );

    if (
      variantImages.length >
      0
    ) {
      return variantImages[0];
    }
  }

  return productImage(
    product
  );
}

/*
|--------------------------------------------------------------------------
| SIZE STOCK TOTAL
|--------------------------------------------------------------------------
*/

function sizeStocksTotal(
  sizeStocks: unknown
) {
  if (
    !Array.isArray(
      sizeStocks
    )
  ) {
    return 0;
  }

  return sizeStocks.reduce(
    (
      total,
      entry: any
    ) =>
      total +
      safeStock(
        entry?.stock
      ),
    0
  );
}

/*
|--------------------------------------------------------------------------
| EXACT SIZE STOCK
|--------------------------------------------------------------------------
*/

function findSizeStock(
  sizeStocks: unknown,
  requestedSize: unknown
) {
  const requested =
    cleanString(
      requestedSize
    );

  if (
    !requested ||
    !Array.isArray(
      sizeStocks
    )
  ) {
    return null;
  }

  const normalized =
    normalizeText(
      requested
    );

  const entry =
    sizeStocks.find(
      (
        item: any
      ) =>
        normalizeText(
          item?.size
        ) ===
        normalized
    );

  if (
    !entry
  ) {
    return null;
  }

  return {
    size:
      String(
        entry.size ||
          requested
      ).trim(),

    stock:
      safeStock(
        entry.stock
      ),
  };
}

/*
|--------------------------------------------------------------------------
| VARIANT STOCK TOTAL
|--------------------------------------------------------------------------
*/

function getColorVariantStock(
  variant: any
) {
  if (
    !variant
  ) {
    return 0;
  }

  /*
  |--------------------------------------------------------------------------
  | SIZE STOCKS HAVE PRIORITY
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      variant.sizeStocks
    ) &&
    variant.sizeStocks.length >
      0
  ) {
    return sizeStocksTotal(
      variant.sizeStocks
    );
  }

  return safeStock(
    variant.stock
  );
}

/*
|--------------------------------------------------------------------------
| ALL AVAILABLE COLORS
|--------------------------------------------------------------------------
*/

function getAvailableColors(
  product: any
) {
  const values:
    string[] =
    [];

  const seen =
    new Set<string>();

  const add =
    (
      value: unknown
    ) => {
      const clean =
        cleanString(
          value
        );

      if (
        !clean
      ) {
        return;
      }

      const key =
        normalizeText(
          clean
        );

      if (
        seen.has(
          key
        )
      ) {
        return;
      }

      seen.add(
        key
      );

      values.push(
        clean
      );
    };

  for (
    const color of
    stringArray(
      product?.colors
    )
  ) {
    add(
      color
    );
  }

  if (
    Array.isArray(
      product?.colorVariants
    )
  ) {
    for (
      const variant of
      product.colorVariants
    ) {
      add(
        variant?.color
      );
    }
  }

  return values;
}

/*
|--------------------------------------------------------------------------
| ALL AVAILABLE SIZES
|--------------------------------------------------------------------------
*/

function getAvailableSizes(
  product: any,
  color?: string | null
) {
  const values:
    string[] =
    [];

  const seen =
    new Set<string>();

  const add =
    (
      value: unknown
    ) => {
      const clean =
        cleanString(
          value
        );

      if (
        !clean
      ) {
        return;
      }

      const key =
        normalizeText(
          clean
        );

      if (
        seen.has(
          key
        )
      ) {
        return;
      }

      seen.add(
        key
      );

      values.push(
        clean
      );
    };

  /*
  |--------------------------------------------------------------------------
  | WHEN COLOR SELECTED, VARIANT SIZE STOCKS ARE MOST ACCURATE
  |--------------------------------------------------------------------------
  */

  if (
    color
  ) {
    const variant =
      findColorVariant(
        product,
        color
      );

    if (
      variant &&
      Array.isArray(
        variant.sizeStocks
      ) &&
      variant.sizeStocks.length >
        0
    ) {
      for (
        const entry of
        variant.sizeStocks
      ) {
        if (
          safeStock(
            entry?.stock
          ) >
          0
        ) {
          add(
            entry?.size
          );
        }
      }

      return values;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT SIZE STOCK
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      product?.sizeStocks
    ) &&
    product.sizeStocks.length >
      0
  ) {
    for (
      const entry of
      product.sizeStocks
    ) {
      if (
        safeStock(
          entry?.stock
        ) >
        0
      ) {
        add(
          entry?.size
        );
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | COLOR VARIANT SIZE STOCKS
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      product?.colorVariants
    )
  ) {
    for (
      const variant of
      product.colorVariants
    ) {
      if (
        !Array.isArray(
          variant?.sizeStocks
        )
      ) {
        continue;
      }

      for (
        const entry of
        variant.sizeStocks
      ) {
        if (
          safeStock(
            entry?.stock
          ) >
          0
        ) {
          add(
            entry?.size
          );
        }
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FALLBACK TOP LEVEL SIZE ARRAY
  |--------------------------------------------------------------------------
  */

  if (
    values.length ===
    0
  ) {
    for (
      const size of
      stringArray(
        product?.sizes
      )
    ) {
      add(
        size
      );
    }
  }

  return values;
}

/*
|--------------------------------------------------------------------------
| DOES PRODUCT HAVE VARIANT SIZE INVENTORY
|--------------------------------------------------------------------------
*/

function hasColorVariantSizeInventory(
  product: any
) {
  return (
    Array.isArray(
      product?.colorVariants
    ) &&
    product.colorVariants.some(
      (
        variant: any
      ) =>
        Array.isArray(
          variant?.sizeStocks
        ) &&
        variant.sizeStocks.length >
          0
    )
  );
}

/*
|--------------------------------------------------------------------------
| INVENTORY RESOLVER
|--------------------------------------------------------------------------
|
| This helper is intentionally exported.
|
| Cart + checkout + order placement should use the same resolver so that:
|
| AI stock
| Cart stock
| Checkout stock
| Order stock
|
| all agree with each other.
|
|--------------------------------------------------------------------------
*/

export function resolveProductInventory(
  product: any,
  input?: {
    size?: string | null;

    color?: string | null;
  }
): ProductInventoryResolution {
  const requestedSize =
    cleanString(
      input?.size
    );

  const requestedColor =
    cleanString(
      input?.color
    );

  const totalStock =
    safeStock(
      product?.stock
    );

  const allColors =
    getAvailableColors(
      product
    );

  const topLevelSizes =
    stringArray(
      product?.sizes
    );

  const hasVariantSizes =
    hasColorVariantSizeInventory(
      product
    );

  const hasProductSizeStocks =
    Array.isArray(
      product?.sizeStocks
    ) &&
    product.sizeStocks.length >
      0;

  const colorRequired =
    allColors.length >
    0;

  const sizeRequired =
    topLevelSizes.length >
      0 ||
    hasProductSizeStocks ||
    hasVariantSizes;

  /*
  |--------------------------------------------------------------------------
  | CANONICAL COLOR
  |--------------------------------------------------------------------------
  */

  let canonicalColor:
    string | null =
    null;

  if (
    requestedColor
  ) {
    canonicalColor =
      findCanonicalValue(
        allColors,
        requestedColor
      );
  }

  const colorAvailable =
    !requestedColor ||
    Boolean(
      canonicalColor
    );

  /*
  |--------------------------------------------------------------------------
  | COLOR DOES NOT EXIST
  |--------------------------------------------------------------------------
  */

  if (
    requestedColor &&
    !canonicalColor
  ) {
    return {
      success:
        true,

      available:
        false,

      stock:
        0,

      totalStock,

      requestedSize,

      requestedColor,

      size:
        null,

      color:
        null,

      sizeRequired,

      colorRequired,

      sizeAvailable:
        !requestedSize,

      colorAvailable:
        false,

      availableSizes:
        getAvailableSizes(
          product
        ),

      availableColors:
        allColors,

      image:
        productImage(
          product
        ),

      message:
        `${requestedColor} color is not available for this product.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SIZE VALUES FOR SELECTED COLOR
  |--------------------------------------------------------------------------
  */

  const availableSizes =
    getAvailableSizes(
      product,
      canonicalColor
    );

  let canonicalSize:
    string | null =
    null;

  if (
    requestedSize
  ) {
    canonicalSize =
      findCanonicalValue(
        availableSizes.length >
          0
          ? availableSizes
          : topLevelSizes,
        requestedSize
      );
  }

  const sizeAvailable =
    !requestedSize ||
    Boolean(
      canonicalSize
    );

  if (
    requestedSize &&
    !canonicalSize
  ) {
    return {
      success:
        true,

      available:
        false,

      stock:
        0,

      totalStock,

      requestedSize,

      requestedColor,

      size:
        null,

      color:
        canonicalColor,

      sizeRequired,

      colorRequired,

      sizeAvailable:
        false,

      colorAvailable,

      availableSizes,

      availableColors:
        allColors,

      image:
        getProductVariantImage(
          product,
          canonicalColor
        ),

      message:
        `${requestedSize} size is not available for this product${canonicalColor ? ` in ${canonicalColor}` : ""}.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SELECTED COLOR VARIANT
  |--------------------------------------------------------------------------
  */

  const variant =
    canonicalColor
      ? findColorVariant(
          product,
          canonicalColor
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | COLOR + SIZE
  |--------------------------------------------------------------------------
  */

  if (
    canonicalColor &&
    canonicalSize &&
    variant &&
    Array.isArray(
      variant.sizeStocks
    ) &&
    variant.sizeStocks.length >
      0
  ) {
    const sizeStock =
      findSizeStock(
        variant.sizeStocks,
        canonicalSize
      );

    const stock =
      sizeStock?.stock ||
      0;

    return {
      success:
        true,

      available:
        stock > 0,

      stock,

      totalStock,

      requestedSize,

      requestedColor,

      size:
        sizeStock?.size ||
        canonicalSize,

      color:
        canonicalColor,

      sizeRequired,

      colorRequired,

      sizeAvailable:
        Boolean(
          sizeStock
        ),

      colorAvailable:
        true,

      availableSizes,

      availableColors:
        allColors,

      image:
        getProductVariantImage(
          product,
          canonicalColor
        ),

      message:
        stock > 0
          ? `${stock} item(s) available for ${canonicalColor}, size ${canonicalSize}.`
          : `${canonicalColor}, size ${canonicalSize} is out of stock.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | COLOR + SIZE BUT VARIANT HAS NO SIZE STOCK
  |--------------------------------------------------------------------------
  |
  | If the variant has its own total stock, use that stock.
  |
  |--------------------------------------------------------------------------
  */

  if (
    canonicalColor &&
    canonicalSize &&
    variant
  ) {
    const variantStock =
      getColorVariantStock(
        variant
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT LEVEL SIZE STOCK CAN STILL BE USED
    |--------------------------------------------------------------------------
    */

    if (
      hasProductSizeStocks
    ) {
      const sizeStock =
        findSizeStock(
          product.sizeStocks,
          canonicalSize
        );

      if (
        sizeStock
      ) {
        const stock =
          variantStock >
          0
            ? Math.min(
                sizeStock.stock,
                variantStock
              )
            : sizeStock.stock;

        return {
          success:
            true,

          available:
            stock > 0,

          stock,

          totalStock,

          requestedSize,

          requestedColor,

          size:
            sizeStock.size,

          color:
            canonicalColor,

          sizeRequired,

          colorRequired,

          sizeAvailable:
            true,

          colorAvailable:
            true,

          availableSizes,

          availableColors:
            allColors,

          image:
            getProductVariantImage(
              product,
              canonicalColor
            ),

          message:
            stock > 0
              ? `${stock} item(s) available.`
              : "Selected variant is out of stock.",
        };
      }
    }

    return {
      success:
        true,

      available:
        variantStock > 0,

      stock:
        variantStock,

      totalStock,

      requestedSize,

      requestedColor,

      size:
        canonicalSize,

      color:
        canonicalColor,

      sizeRequired,

      colorRequired,

      sizeAvailable:
        true,

      colorAvailable:
        true,

      availableSizes,

      availableColors:
        allColors,

      image:
        getProductVariantImage(
          product,
          canonicalColor
        ),

      message:
        variantStock >
        0
          ? `${variantStock} item(s) available for ${canonicalColor}.`
          : `${canonicalColor} is out of stock.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | COLOR ONLY
  |--------------------------------------------------------------------------
  */

  if (
    canonicalColor &&
    variant
  ) {
    const stock =
      getColorVariantStock(
        variant
      );

    return {
      success:
        true,

      available:
        stock > 0,

      stock,

      totalStock,

      requestedSize,

      requestedColor,

      size:
        null,

      color:
        canonicalColor,

      sizeRequired,

      colorRequired,

      sizeAvailable:
        true,

      colorAvailable:
        true,

      availableSizes,

      availableColors:
        allColors,

      image:
        getProductVariantImage(
          product,
          canonicalColor
        ),

      message:
        stock > 0
          ? `${stock} item(s) available in ${canonicalColor}.`
          : `${canonicalColor} is out of stock.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SIZE ONLY - PRODUCT SIZE STOCK
  |--------------------------------------------------------------------------
  */

  if (
    canonicalSize &&
    hasProductSizeStocks
  ) {
    const sizeStock =
      findSizeStock(
        product.sizeStocks,
        canonicalSize
      );

    const stock =
      sizeStock?.stock ||
      0;

    return {
      success:
        true,

      available:
        stock > 0,

      stock,

      totalStock,

      requestedSize,

      requestedColor,

      size:
        sizeStock?.size ||
        canonicalSize,

      color:
        null,

      sizeRequired,

      colorRequired,

      sizeAvailable:
        Boolean(
          sizeStock
        ),

      colorAvailable:
        true,

      availableSizes,

      availableColors:
        allColors,

      image:
        productImage(
          product
        ),

      message:
        stock > 0
          ? `${stock} item(s) available in size ${canonicalSize}.`
          : `Size ${canonicalSize} is out of stock.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SIZE ONLY - SUM SAME SIZE ACROSS COLOR VARIANTS
  |--------------------------------------------------------------------------
  |
  | Useful for AI stock inquiry when customer asks:
  | "L size available છે?"
  |
  | Cart will still require color when product has colors.
  |
  |--------------------------------------------------------------------------
  */

  if (
    canonicalSize &&
    hasVariantSizes &&
    Array.isArray(
      product.colorVariants
    )
  ) {
    let stock =
      0;

    for (
      const currentVariant of
      product.colorVariants
    ) {
      const sizeStock =
        findSizeStock(
          currentVariant?.sizeStocks,
          canonicalSize
        );

      if (
        sizeStock
      ) {
        stock +=
          sizeStock.stock;
      }
    }

    return {
      success:
        true,

      available:
        stock > 0,

      stock,

      totalStock,

      requestedSize,

      requestedColor,

      size:
        canonicalSize,

      color:
        null,

      sizeRequired,

      colorRequired,

      sizeAvailable:
        stock > 0,

      colorAvailable:
        true,

      availableSizes,

      availableColors:
        allColors,

      image:
        productImage(
          product
        ),

      message:
        stock > 0
          ? `${stock} item(s) available across colors in size ${canonicalSize}.`
          : `Size ${canonicalSize} is out of stock.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | FALLBACK TOTAL PRODUCT STOCK
  |--------------------------------------------------------------------------
  */

  return {
    success:
      true,

    available:
      totalStock > 0,

    stock:
      totalStock,

    totalStock,

    requestedSize,

    requestedColor,

    size:
      canonicalSize,

    color:
      canonicalColor,

    sizeRequired,

    colorRequired,

    sizeAvailable,

    colorAvailable,

    availableSizes,

    availableColors:
      allColors,

    image:
      getProductVariantImage(
        product,
        canonicalColor
      ),

    message:
      totalStock > 0
        ? `${totalStock} item(s) available.`
        : "Product is out of stock.",
  };
}

/*
|--------------------------------------------------------------------------
| SERIALIZE SIZE STOCKS
|--------------------------------------------------------------------------
*/

function serializeSizeStocks(
  value: unknown
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value.map(
    (
      entry: any
    ) => ({
      size:
        String(
          entry?.size ||
            ""
        ),

      stock:
        safeStock(
          entry?.stock
        ),
    })
  );
}

/*
|--------------------------------------------------------------------------
| SERIALIZE COLOR VARIANTS
|--------------------------------------------------------------------------
*/

function serializeColorVariants(
  product: any
) {
  if (
    !Array.isArray(
      product?.colorVariants
    )
  ) {
    return [];
  }

  return product.colorVariants.map(
    (
      variant: any
    ) => ({
      color:
        String(
          variant?.color ||
            ""
        ),

      images:
        stringArray(
          variant?.images
        ).slice(
          0,
          6
        ),

      stock:
        getColorVariantStock(
          variant
        ),

      sizeStocks:
        serializeSizeStocks(
          variant?.sizeStocks
        ),

      view360Images:
        stringArray(
          variant?.view360Images
        ).slice(
          0,
          36
        ),

      product360:
        variant?.product360
          ? {
              enabled:
                Boolean(
                  variant.product360
                    .enabled
                ),

              frames:
                Array.isArray(
                  variant.product360
                    .frames
                )
                  ? variant.product360.frames
                      .slice(
                        0,
                        36
                      )
                      .map(
                        (
                          frame: any
                        ) => ({
                          angle:
                            Number(
                              frame?.angle ||
                                0
                            ),

                          name:
                            String(
                              frame?.name ||
                                ""
                            ),

                          url:
                            String(
                              frame?.url ||
                                ""
                            ),
                        })
                      )
                  : [],
            }
          : null,
    })
  );
}

/*
|--------------------------------------------------------------------------
| SERIALIZE PRODUCT
|--------------------------------------------------------------------------
*/

function serializeProduct(
  product: any
) {
  return {
    id:
      String(
        product._id
      ),

    sku:
      String(
        product.sku ||
          ""
      ),

    name:
      String(
        product.name ||
          ""
      ),

    slug:
      String(
        product.slug ||
          ""
      ),

    category:
      String(
        product.category ||
          ""
      ),

    subCategory:
      String(
        product.subCategory ||
          ""
      ),

    brand:
      String(
        product.brand ||
          "SilentGEN"
      ),

    gender:
      String(
        product.gender ||
          ""
      ),

    fabric:
      String(
        product.fabric ||
          ""
      ),

    fit:
      String(
        product.fit ||
          ""
      ),

    gsm:
      typeof product.gsm ===
      "number"
        ? product.gsm
        : null,

    weight:
      typeof product.weight ===
      "number"
        ? product.weight
        : null,

    mrp:
      Number(
        product.mrp ||
          0
      ),

    price:
      Number(
        product.price ||
          0
      ),

    discount:
      Number(
        product.discount ||
          0
      ),

    stock:
      safeStock(
        product.stock
      ),

    lowStockLimit:
      safeStock(
        product.lowStockLimit
      ),

    sold:
      safeStock(
        product.sold
      ),

    sizes:
      stringArray(
        product.sizes
      ),

    colors:
      getAvailableColors(
        product
      ),

    sizeStocks:
      serializeSizeStocks(
        product.sizeStocks
      ),

    image:
      productImage(
        product
      ),

    images:
      stringArray(
        product.images
      ).slice(
        0,
        8
      ),

    shortDescription:
      String(
        product.shortDescription ||
          ""
      ),

    description:
      String(
        product.description ||
          ""
      ),

    featured:
      Boolean(
        product.featured
      ),

    bestSeller:
      Boolean(
        product.bestSeller
      ),

    newArrival:
      Boolean(
        product.newArrival
      ),

    trending:
      Boolean(
        product.trending
      ),

    rating:
      Number(
        product.rating ||
          0
      ),

    reviewCount:
      safeStock(
        product.reviewCount
      ),

    status:
      String(
        product.status ||
          ""
      ),

    colorVariants:
      serializeColorVariants(
        product
      ),

    url:
      `/product/${String(
        product._id
      )}`,
  };
}

/*
|--------------------------------------------------------------------------
| BASE ACTIVE PRODUCT CONDITIONS
|--------------------------------------------------------------------------
*/

function activeProductConditions() {
  return [
    {
      status:
        "Active",
    },

    {
      isDeleted: {
        $ne:
          true,
      },
    },
  ];
}

/*
|--------------------------------------------------------------------------
| SEARCH PRODUCTS
|--------------------------------------------------------------------------
*/

export async function searchProducts(
  rawInput:
    ProductSearchInput
) {
  const query =
    cleanString(
      rawInput.query
    );

  const category =
    cleanString(
      rawInput.category
    );

  const gender =
    normalizeProductGender(
      rawInput.gender
    );

  const color =
    cleanString(
      rawInput.color
    );

  const size =
    cleanString(
      rawInput.size
    );

  const fabric =
    cleanString(
      rawInput.fabric
    );

  const fit =
    cleanString(
      rawInput.fit
    );

  let minPrice =
    cleanNumber(
      rawInput.minPrice
    );

  let maxPrice =
    cleanNumber(
      rawInput.maxPrice
    );

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE PRICE RANGE
  |--------------------------------------------------------------------------
  */

  if (
    minPrice !== null &&
    minPrice < 0
  ) {
    minPrice =
      0;
  }

  if (
    maxPrice !== null &&
    maxPrice < 0
  ) {
    maxPrice =
      0;
  }

  if (
    minPrice !== null &&
    maxPrice !== null &&
    minPrice >
      maxPrice
  ) {
    const oldMin =
      minPrice;

    minPrice =
      maxPrice;

    maxPrice =
      oldMin;
  }

  const limit =
    Math.min(
      Math.max(
        Math.floor(
          Number(
            rawInput.limit
          ) ||
            6
        ),
        1
      ),
      12
    );

  const conditions:
    any[] =
    activeProductConditions();

  /*
  |--------------------------------------------------------------------------
  | TEXT SEARCH
  |--------------------------------------------------------------------------
  */

  if (
    query
  ) {
    const regex =
      new RegExp(
        escapeRegex(
          query
        ),
        "i"
      );

    conditions.push({
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
          subCategory:
            regex,
        },

        {
          brand:
            regex,
        },

        {
          shortDescription:
            regex,
        },

        {
          description:
            regex,
        },

        {
          fabric:
            regex,
        },

        {
          fit:
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
          "colorVariants.color":
            regex,
        },
      ],
    });
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY + SUBCATEGORY
  |--------------------------------------------------------------------------
  */

  if (
    category
  ) {
    const categoryRegex =
      new RegExp(
        escapeRegex(
          category
        ),
        "i"
      );

    conditions.push({
      $or: [
        {
          category:
            categoryRegex,
        },

        {
          subCategory:
            categoryRegex,
        },
      ],
    });
  }

  /*
  |--------------------------------------------------------------------------
  | GENDER
  |--------------------------------------------------------------------------
  */

  if (
    gender
  ) {
    if (
      gender ===
      "Unisex"
    ) {
      conditions.push({
        gender:
          /^Unisex$/i,
      });
    } else {
      conditions.push({
        $or: [
          {
            gender:
              new RegExp(
                `^${escapeRegex(
                  gender
                )}$`,
                "i"
              ),
          },

          {
            gender:
              /^Unisex$/i,
          },
        ],
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | COLOR
  |--------------------------------------------------------------------------
  */

  if (
    color
  ) {
    const colorRegex =
      new RegExp(
        `^${escapeRegex(
          color
        )}$`,
        "i"
      );

    conditions.push({
      $or: [
        {
          colors:
            colorRegex,
        },

        {
          "colorVariants.color":
            colorRegex,
        },
      ],
    });
  }

  /*
  |--------------------------------------------------------------------------
  | SIZE
  |--------------------------------------------------------------------------
  */

  if (
    size
  ) {
    const sizeRegex =
      new RegExp(
        `^${escapeRegex(
          size
        )}$`,
        "i"
      );

    conditions.push({
      $or: [
        {
          sizes:
            sizeRegex,
        },

        {
          "sizeStocks.size":
            sizeRegex,
        },

        {
          "colorVariants.sizeStocks.size":
            sizeRegex,
        },
      ],
    });
  }

  /*
  |--------------------------------------------------------------------------
  | FABRIC
  |--------------------------------------------------------------------------
  */

  if (
    fabric
  ) {
    conditions.push({
      fabric:
        new RegExp(
          escapeRegex(
            fabric
          ),
          "i"
        ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | FIT
  |--------------------------------------------------------------------------
  */

  if (
    fit
  ) {
    conditions.push({
      fit:
        new RegExp(
          escapeRegex(
            fit
          ),
          "i"
        ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | PRICE
  |--------------------------------------------------------------------------
  */

  if (
    minPrice !== null ||
    maxPrice !== null
  ) {
    const priceCondition:
      Record<
        string,
        number
      > = {};

    if (
      minPrice !==
      null
    ) {
      priceCondition.$gte =
        minPrice;
    }

    if (
      maxPrice !==
      null
    ) {
      priceCondition.$lte =
        maxPrice;
    }

    conditions.push({
      price:
        priceCondition,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | STOCK
  |--------------------------------------------------------------------------
  */

  if (
    rawInput.inStockOnly
  ) {
    conditions.push({
      stock: {
        $gt:
          0,
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | DATABASE SEARCH
  |--------------------------------------------------------------------------
  */

  const products =
    await Product.find({
      $and:
        conditions,
    })
      .sort({
        featured:
          -1,

        bestSeller:
          -1,

        trending:
          -1,

        newArrival:
          -1,

        sold:
          -1,

        sortOrder:
          1,

        createdAt:
          -1,
      })
      .limit(
        Math.min(
          limit * 3,
          36
        )
      )
      .lean();

  /*
  |--------------------------------------------------------------------------
  | EXACT INVENTORY FILTER
  |--------------------------------------------------------------------------
  |
  | MongoDB can confirm that a size and color exist somewhere in the product,
  | but only inventory resolver can confirm the exact requested combination.
  |
  |--------------------------------------------------------------------------
  */

  const filtered =
    products.filter(
      (
        product: any
      ) => {
        if (
          !rawInput.inStockOnly &&
          !size &&
          !color
        ) {
          return true;
        }

        const inventory =
          resolveProductInventory(
            product,
            {
              size,

              color,
            }
          );

        if (
          size &&
          !inventory.sizeAvailable
        ) {
          return false;
        }

        if (
          color &&
          !inventory.colorAvailable
        ) {
          return false;
        }

        if (
          rawInput.inStockOnly &&
          !inventory.available
        ) {
          return false;
        }

        return true;
      }
    )
    .slice(
      0,
      limit
    );

  return {
    success:
      true,

    count:
      filtered.length,

    filters: {
      query,

      category,

      gender,

      color,

      size,

      fabric,

      fit,

      minPrice,

      maxPrice,

      inStockOnly:
        rawInput.inStockOnly,
    },

    products:
      filtered.map(
        (
          product: any
        ) => {
          const serialized =
            serializeProduct(
              product
            );

          const inventory =
            resolveProductInventory(
              product,
              {
                size,

                color,
              }
            );

          return {
            ...serialized,

            selectedVariant:
              size ||
              color
                ? {
                    size:
                      inventory.size,

                    color:
                      inventory.color,

                    stock:
                      inventory.stock,

                    inStock:
                      inventory.available,

                    image:
                      inventory.image,
                  }
                : null,

            image:
              color
                ? inventory.image ||
                  serialized.image
                : serialized.image,
          };
        }
      ),

    message:
      filtered.length >
      0
        ? `${filtered.length} matching SilentGEN product(s) found.`
        : "No matching SilentGEN products found.",
  };
}

/*
|--------------------------------------------------------------------------
| GET PRODUCT
|--------------------------------------------------------------------------
*/

export async function getProduct(
  input:
    GetProductInput
) {
  const productId =
    cleanString(
      input.productId
    );

  const slug =
    cleanString(
      input.slug
    );

  if (
    !productId &&
    !slug
  ) {
    return {
      success:
        false,

      message:
        "A product id or slug is required.",

      product:
        null,
    };
  }

  const alternatives:
    any[] =
    [];

  if (
    productId &&
    mongoose.Types.ObjectId.isValid(
      productId
    )
  ) {
    alternatives.push({
      _id:
        productId,
    });
  }

  if (
    slug
  ) {
    alternatives.push({
      slug:
        slug.toLowerCase(),
    });
  }

  if (
    alternatives.length ===
    0
  ) {
    return {
      success:
        false,

      message:
        "Invalid product identifier.",

      product:
        null,
    };
  }

  const product =
    await Product.findOne({
      $and: [
        {
          $or:
            alternatives,
        },

        {
          isDeleted: {
            $ne:
              true,
          },
        },
      ],
    }).lean();

  if (
    !product
  ) {
    return {
      success:
        false,

      message:
        "Product not found.",

      product:
        null,
    };
  }

  return {
    success:
      true,

    product:
      serializeProduct(
        product
      ),
  };
}

/*
|--------------------------------------------------------------------------
| CHECK PRODUCT STOCK
|--------------------------------------------------------------------------
*/

export async function checkProductStock(
  input:
    CheckStockInput
) {
  const productId =
    cleanString(
      input.productId
    );

  if (
    !productId ||
    !mongoose.Types.ObjectId.isValid(
      productId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid product id.",
    };
  }

  const product =
    await Product.findOne({
      _id:
        productId,

      isDeleted: {
        $ne:
          true,
      },
    })
      .select(
        [
          "_id",
          "name",
          "slug",
          "sku",
          "status",
          "price",
          "stock",
          "thumbnail",
          "images",
          "sizes",
          "colors",
          "sizeStocks",
          "colorVariants",
        ].join(
          " "
        )
      )
      .lean();

  if (
    !product
  ) {
    return {
      success:
        false,

      message:
        "Product not found.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | NON ACTIVE PRODUCT
  |--------------------------------------------------------------------------
  */

  if (
    product.status !==
    "Active"
  ) {
    return {
      success:
        true,

      productId,

      productName:
        String(
          product.name ||
            ""
        ),

      status:
        String(
          product.status ||
            ""
        ),

      stock:
        0,

      totalStock:
        safeStock(
          product.stock
        ),

      inStock:
        false,

      available:
        false,

      requestedSize:
        cleanString(
          input.size
        ),

      requestedColor:
        cleanString(
          input.color
        ),

      size:
        null,

      color:
        null,

      sizeRequired:
        stringArray(
          product.sizes
        ).length >
          0,

      colorRequired:
        getAvailableColors(
          product
        ).length >
          0,

      sizeAvailable:
        false,

      colorAvailable:
        false,

      availableSizes:
        [],

      availableColors:
        [],

      image:
        productImage(
          product
        ),

      message:
        "Product is currently unavailable.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | RESOLVE EXACT STOCK
  |--------------------------------------------------------------------------
  */

  const inventory =
    resolveProductInventory(
      product,
      {
        size:
          input.size,

        color:
          input.color,
      }
    );

  return {
    success:
      true,

    productId,

    productName:
      String(
        product.name ||
          ""
      ),

    sku:
      String(
        product.sku ||
          ""
      ),

    status:
      String(
        product.status ||
          ""
      ),

    price:
      Number(
        product.price ||
          0
      ),

    stock:
      inventory.stock,

    totalStock:
      inventory.totalStock,

    inStock:
      inventory.available,

    available:
      inventory.available,

    requestedSize:
      inventory.requestedSize,

    requestedColor:
      inventory.requestedColor,

    size:
      inventory.size,

    color:
      inventory.color,

    sizeRequired:
      inventory.sizeRequired,

    colorRequired:
      inventory.colorRequired,

    sizeAvailable:
      inventory.sizeAvailable,

    colorAvailable:
      inventory.colorAvailable,

    availableSizes:
      inventory.availableSizes,

    availableColors:
      inventory.availableColors,

    image:
      inventory.image,

    url:
      `/product/${productId}`,

    message:
      inventory.message,
  };
}