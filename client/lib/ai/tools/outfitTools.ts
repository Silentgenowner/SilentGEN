import mongoose from "mongoose";

import Product from "@/models/Product";

import {
  getProductVariantImage,
  normalizeProductGender,
  resolveProductInventory,
} from "@/lib/ai/tools/productTools";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type BuildOutfitInput = {
  baseProductId: string | null;

  baseCategory: string | null;

  baseColor: string | null;

  gender: string | null;

  occasion: string | null;

  style: string | null;

  size: string | null;

  budget: number | null;

  limitPerCategory: number;
};

type OutfitProduct = {
  id: string;

  sku: string;

  name: string;

  slug: string;

  category: string;

  subCategory: string;

  brand: string;

  gender: string;

  fabric: string;

  fit: string;

  mrp: number;

  price: number;

  discount: number;

  stock: number;

  sizes: string[];

  colors: string[];

  image: string;

  images: string[];

  url: string;

  selectedVariant?: {
    size: string | null;

    color: string | null;

    stock: number;

    image: string;
  } | null;
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

  return clean ||
    null;
}

function normalizeText(
  value: unknown
) {
  return String(
    value ||
      ""
  )
    .trim()
    .toLowerCase();
}

function escapeRegex(
  value: string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function safeNumber(
  value: unknown
) {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return 0;
  }

  return parsed;
}

function safeStock(
  value: unknown
) {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isFinite(
      parsed
    ) ||
    parsed <=
      0
  ) {
    return 0;
  }

  return Math.floor(
    parsed
  );
}

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
          item ||
            ""
        ).trim()
    )
    .filter(
      Boolean
    );
}

/*
|--------------------------------------------------------------------------
| PRODUCT COLORS
|--------------------------------------------------------------------------
*/

function getProductColors(
  product: any
) {
  const result:
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

      result.push(
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

  return result;
}

/*
|--------------------------------------------------------------------------
| PRODUCT IMAGE
|--------------------------------------------------------------------------
*/

function getProductImage(
  product: any,
  color?: string | null
) {
  if (
    color
  ) {
    const variantImage =
      getProductVariantImage(
        product,
        color
      );

    if (
      variantImage
    ) {
      return variantImage;
    }
  }

  if (
    typeof product?.thumbnail ===
      "string" &&
    product.thumbnail.trim()
  ) {
    return product.thumbnail.trim();
  }

  if (
    Array.isArray(
      product?.images
    ) &&
    product.images.length >
      0
  ) {
    return String(
      product.images[0] ||
        ""
    );
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| SERIALIZE PRODUCT
|--------------------------------------------------------------------------
*/

function serializeProduct(
  product: any,
  selectedVariant?: {
    size?: string | null;

    color?: string | null;
  }
): OutfitProduct {
  const inventory =
    resolveProductInventory(
      product,
      {
        size:
          selectedVariant?.size ||
          null,

        color:
          selectedVariant?.color ||
          null,
      }
    );

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

    mrp:
      safeNumber(
        product.mrp
      ),

    price:
      safeNumber(
        product.price
      ),

    discount:
      safeNumber(
        product.discount
      ),

    stock:
      selectedVariant
        ? inventory.stock
        : safeStock(
            product.stock
          ),

    sizes:
      stringArray(
        product.sizes
      ),

    colors:
      getProductColors(
        product
      ),

    image:
      selectedVariant
        ? inventory.image ||
          getProductImage(
            product,
            inventory.color
          )
        : getProductImage(
            product
          ),

    images:
      stringArray(
        product.images
      ).slice(
        0,
        8
      ),

    url:
      `/product/${String(
        product._id
      )}`,

    selectedVariant:
      selectedVariant
        ? {
            size:
              inventory.size,

            color:
              inventory.color,

            stock:
              inventory.stock,

            image:
              inventory.image,
          }
        : null,
  };
}

/*
|--------------------------------------------------------------------------
| COLOR FAMILY NORMALIZER
|--------------------------------------------------------------------------
*/

function normalizeColor(
  rawColor:
    string | null
) {
  const color =
    normalizeText(
      rawColor
    );

  if (!color) {
    return "";
  }

  if (
    color.includes(
      "navy"
    )
  ) {
    return "navy";
  }

  if (
    color.includes(
      "light blue"
    ) ||
    color.includes(
      "sky blue"
    )
  ) {
    return "light blue";
  }

  if (
    color.includes(
      "blue"
    )
  ) {
    return "blue";
  }

  if (
    color.includes(
      "black"
    )
  ) {
    return "black";
  }

  if (
    color.includes(
      "off white"
    ) ||
    color.includes(
      "off-white"
    ) ||
    color.includes(
      "white"
    )
  ) {
    return "white";
  }

  if (
    color.includes(
      "beige"
    ) ||
    color.includes(
      "khaki"
    )
  ) {
    return "beige";
  }

  if (
    color.includes(
      "cream"
    )
  ) {
    return "cream";
  }

  if (
    color.includes(
      "olive"
    ) ||
    color.includes(
      "army green"
    )
  ) {
    return "olive";
  }

  if (
    color.includes(
      "green"
    )
  ) {
    return "green";
  }

  if (
    color.includes(
      "grey"
    ) ||
    color.includes(
      "gray"
    ) ||
    color.includes(
      "charcoal"
    )
  ) {
    return "grey";
  }

  if (
    color.includes(
      "brown"
    ) ||
    color.includes(
      "tan"
    )
  ) {
    return "brown";
  }

  if (
    color.includes(
      "maroon"
    ) ||
    color.includes(
      "burgundy"
    )
  ) {
    return "burgundy";
  }

  if (
    color.includes(
      "red"
    )
  ) {
    return "red";
  }

  if (
    color.includes(
      "pink"
    )
  ) {
    return "pink";
  }

  if (
    color.includes(
      "yellow"
    ) ||
    color.includes(
      "mustard"
    )
  ) {
    return "yellow";
  }

  return color;
}

/*
|--------------------------------------------------------------------------
| COLOR MATCH ENGINE
|--------------------------------------------------------------------------
*/

const COLOR_MATCHES:
  Record<
    string,
    string[]
  > = {
  navy: [
    "beige",
    "white",
    "grey",
    "light blue",
    "cream",
    "brown",
    "black",
  ],

  blue: [
    "white",
    "beige",
    "grey",
    "black",
    "cream",
    "navy",
  ],

  "light blue": [
    "navy",
    "beige",
    "white",
    "grey",
    "black",
  ],

  black: [
    "white",
    "grey",
    "beige",
    "blue",
    "cream",
    "olive",
  ],

  white: [
    "black",
    "navy",
    "beige",
    "olive",
    "blue",
    "grey",
    "brown",
  ],

  beige: [
    "navy",
    "black",
    "white",
    "brown",
    "olive",
    "blue",
  ],

  cream: [
    "brown",
    "navy",
    "black",
    "olive",
    "beige",
  ],

  olive: [
    "black",
    "beige",
    "cream",
    "white",
    "brown",
  ],

  green: [
    "black",
    "white",
    "beige",
    "navy",
    "cream",
  ],

  grey: [
    "black",
    "white",
    "navy",
    "burgundy",
    "blue",
  ],

  brown: [
    "cream",
    "beige",
    "white",
    "navy",
    "black",
  ],

  burgundy: [
    "black",
    "grey",
    "white",
    "navy",
    "beige",
  ],

  red: [
    "black",
    "white",
    "grey",
    "navy",
  ],

  pink: [
    "white",
    "beige",
    "grey",
    "navy",
    "black",
  ],

  yellow: [
    "black",
    "navy",
    "white",
    "grey",
    "brown",
  ],
};

/*
|--------------------------------------------------------------------------
| GET MATCHING COLORS
|--------------------------------------------------------------------------
*/

export function getMatchingColors(
  color:
    string | null
) {
  const normalized =
    normalizeColor(
      color
    );

  if (
    !normalized
  ) {
    return [
      "black",
      "white",
      "navy",
      "beige",
      "grey",
    ];
  }

  return (
    COLOR_MATCHES[
      normalized
    ] || [
      "black",
      "white",
      "navy",
      "beige",
      "grey",
    ]
  );
}

/*
|--------------------------------------------------------------------------
| CATEGORY FAMILY
|--------------------------------------------------------------------------
*/

function detectCategoryFamily(
  rawCategory:
    string | null,
  rawSubCategory?:
    string | null
) {
  const text =
    `${rawCategory || ""} ${rawSubCategory || ""}`
      .toLowerCase();

  if (
    text.includes(
      "t-shirt"
    ) ||
    text.includes(
      "tshirt"
    ) ||
    text.includes(
      "tee"
    )
  ) {
    return "tshirt";
  }

  if (
    text.includes(
      "shirt"
    )
  ) {
    return "shirt";
  }

  if (
    text.includes(
      "polo"
    )
  ) {
    return "polo";
  }

  if (
    text.includes(
      "jean"
    ) ||
    text.includes(
      "denim"
    )
  ) {
    return "jeans";
  }

  if (
    text.includes(
      "trouser"
    ) ||
    text.includes(
      "pant"
    )
  ) {
    return "trouser";
  }

  if (
    text.includes(
      "chino"
    )
  ) {
    return "chinos";
  }

  if (
    text.includes(
      "cargo"
    )
  ) {
    return "cargo";
  }

  if (
    text.includes(
      "short"
    )
  ) {
    return "shorts";
  }

  if (
    text.includes(
      "shoe"
    ) ||
    text.includes(
      "sneaker"
    ) ||
    text.includes(
      "footwear"
    )
  ) {
    return "shoes";
  }

  if (
    text.includes(
      "watch"
    )
  ) {
    return "watch";
  }

  if (
    text.includes(
      "accessor"
    )
  ) {
    return "accessory";
  }

  return normalizeText(
    rawCategory
  );
}

/*
|--------------------------------------------------------------------------
| OUTFIT CATEGORY MAP
|--------------------------------------------------------------------------
*/

function getComplementaryCategories(
  family: string
) {
  switch (
    family
  ) {
    case "shirt":
      return [
        [
          "Jeans",
          "Trouser",
          "Chinos",
        ],

        [
          "Shoes",
          "Sneakers",
          "Footwear",
        ],

        [
          "Watch",
          "Accessories",
        ],
      ];

    case "tshirt":
      return [
        [
          "Jeans",
          "Cargo",
          "Trouser",
        ],

        [
          "Shoes",
          "Sneakers",
          "Footwear",
        ],

        [
          "Watch",
          "Accessories",
        ],
      ];

    case "polo":
      return [
        [
          "Jeans",
          "Chinos",
          "Trouser",
        ],

        [
          "Shoes",
          "Sneakers",
          "Footwear",
        ],
      ];

    case "jeans":
    case "trouser":
    case "chinos":
    case "cargo":
      return [
        [
          "Shirt",
          "T-Shirt",
          "Tshirt",
          "Polo",
        ],

        [
          "Shoes",
          "Sneakers",
          "Footwear",
        ],

        [
          "Watch",
          "Accessories",
        ],
      ];

    case "shoes":
      return [
        [
          "Shirt",
          "T-Shirt",
          "Tshirt",
          "Polo",
        ],

        [
          "Jeans",
          "Trouser",
          "Chinos",
          "Cargo",
        ],
      ];

    default:
      return [
        [
          "Shirt",
          "T-Shirt",
          "Tshirt",
          "Polo",
        ],

        [
          "Jeans",
          "Trouser",
          "Chinos",
          "Cargo",
        ],

        [
          "Shoes",
          "Sneakers",
          "Footwear",
        ],
      ];
  }
}

/*
|--------------------------------------------------------------------------
| OCCASION CATEGORY PREFERENCE
|--------------------------------------------------------------------------
*/

function getOccasionCategoryBoost(
  occasion:
    string | null
) {
  const value =
    normalizeText(
      occasion
    );

  if (
    value.includes(
      "office"
    ) ||
    value.includes(
      "formal"
    )
  ) {
    return [
      "shirt",
      "trouser",
      "chinos",
    ];
  }

  if (
    value.includes(
      "party"
    ) ||
    value.includes(
      "date"
    )
  ) {
    return [
      "shirt",
      "jeans",
      "trouser",
    ];
  }

  if (
    value.includes(
      "college"
    ) ||
    value.includes(
      "casual"
    )
  ) {
    return [
      "tshirt",
      "jeans",
      "cargo",
    ];
  }

  return [];
}

/*
|--------------------------------------------------------------------------
| PRODUCT COLOR MATCH SCORE
|--------------------------------------------------------------------------
*/

function getColorScore(
  product: any,
  matchingColors:
    string[]
) {
  const productColors =
    getProductColors(
      product
    ).map(
      (
        color
      ) =>
        normalizeColor(
          color
        )
    );

  let bestScore =
    0;

  for (
    let index =
      0;
    index <
    matchingColors.length;
    index +=
      1
  ) {
    const desiredColor =
      matchingColors[
        index
      ];

    if (
      productColors.includes(
        desiredColor
      )
    ) {
      const score =
        60 -
        index * 6;

      bestScore =
        Math.max(
          bestScore,
          score
        );
    }
  }

  return Math.max(
    bestScore,
    0
  );
}

/*
|--------------------------------------------------------------------------
| GENERAL PRODUCT SCORE
|--------------------------------------------------------------------------
*/

function scoreProduct({
  product,
  matchingColors,
  occasion,
  style,
  availableStock,
}: {
  product: any;

  matchingColors:
    string[];

  occasion:
    string | null;

  style:
    string | null;

  availableStock:
    number;
}) {
  let score =
    0;

  /*
  |--------------------------------------------------------------------------
  | COLOR
  |--------------------------------------------------------------------------
  */

  score +=
    getColorScore(
      product,
      matchingColors
    );

  /*
  |--------------------------------------------------------------------------
  | STOCK
  |--------------------------------------------------------------------------
  */

  if (
    availableStock >
    0
  ) {
    score +=
      15;
  }

  /*
  |--------------------------------------------------------------------------
  | MERCHANDISING SIGNALS
  |--------------------------------------------------------------------------
  */

  if (
    product.featured
  ) {
    score +=
      7;
  }

  if (
    product.bestSeller
  ) {
    score +=
      6;
  }

  if (
    product.trending
  ) {
    score +=
      5;
  }

  if (
    product.newArrival
  ) {
    score +=
      4;
  }

  /*
  |--------------------------------------------------------------------------
  | OCCASION
  |--------------------------------------------------------------------------
  */

  const categoryFamily =
    detectCategoryFamily(
      product.category,
      product.subCategory
    );

  const occasionBoost =
    getOccasionCategoryBoost(
      occasion
    );

  if (
    occasionBoost.includes(
      categoryFamily
    )
  ) {
    score +=
      10;
  }

  /*
  |--------------------------------------------------------------------------
  | STYLE
  |--------------------------------------------------------------------------
  */

  const styleText =
    normalizeText(
      style
    );

  const fitText =
    normalizeText(
      product.fit
    );

  if (
    styleText &&
    fitText &&
    (
      fitText.includes(
        styleText
      ) ||
      styleText.includes(
        fitText
      )
    )
  ) {
    score +=
      8;
  }

  return Math.min(
    Math.max(
      Math.round(
        score
      ),
      0
    ),
    100
  );
}

/*
|--------------------------------------------------------------------------
| CATEGORY FILTER
|--------------------------------------------------------------------------
*/

function createCategoryFilter(
  categories:
    string[]
) {
  const regexes =
    categories.map(
      (
        category
      ) =>
        new RegExp(
          escapeRegex(
            category
          ),
          "i"
        )
    );

  return {
    $or: [
      {
        category: {
          $in:
            regexes,
        },
      },

      {
        subCategory: {
          $in:
            regexes,
        },
      },
    ],
  };
}

/*
|--------------------------------------------------------------------------
| SIZE SHOULD APPLY
|--------------------------------------------------------------------------
|
| Do not use clothing size L/XL to filter shoes or accessories.
|
|--------------------------------------------------------------------------
*/

function shouldApplySizeToCategories(
  categories:
    string[]
) {
  const text =
    categories
      .join(" ")
      .toLowerCase();

  if (
    text.includes(
      "shoe"
    ) ||
    text.includes(
      "sneaker"
    ) ||
    text.includes(
      "footwear"
    ) ||
    text.includes(
      "watch"
    ) ||
    text.includes(
      "accessor"
    )
  ) {
    return false;
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| FIND CANDIDATES
|--------------------------------------------------------------------------
*/

async function findCandidates({
  categories,
  gender,
  size,
  maxPrice,
  excludeId,
}: {
  categories:
    string[];

  gender:
    string | null;

  size:
    string | null;

  maxPrice:
    number | null;

  excludeId:
    string | null;
}) {
  const conditions:
    any[] = [
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

    {
      stock: {
        $gt:
          0,
      },
    },

    createCategoryFilter(
      categories
    ),
  ];

  if (
    excludeId &&
    mongoose.Types.ObjectId.isValid(
      excludeId
    )
  ) {
    conditions.push({
      _id: {
        $ne:
          excludeId,
      },
    });
  }

  const normalizedGender =
    normalizeProductGender(
      gender
    );

  if (
    normalizedGender
  ) {
    if (
      normalizedGender ===
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
                  normalizedGender
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
  | SIZE FILTER
  |--------------------------------------------------------------------------
  */

  if (
    size &&
    shouldApplySizeToCategories(
      categories
    )
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
  | PRICE
  |--------------------------------------------------------------------------
  */

  if (
    maxPrice !==
      null &&
    maxPrice >
      0
  ) {
    conditions.push({
      price: {
        $lte:
          maxPrice,
      },
    });
  }

  return Product.find({
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

      sold:
        -1,

      createdAt:
        -1,
    })
    .limit(
      40
    )
    .lean();
}

/*
|--------------------------------------------------------------------------
| CHOOSE BEST COLOR
|--------------------------------------------------------------------------
*/

function chooseBestColor(
  product: any,
  matchingColors:
    string[]
) {
  const colors =
    getProductColors(
      product
    );

  if (
    colors.length ===
    0
  ) {
    return null;
  }

  let bestColor =
    colors[0];

  let bestIndex =
    Number.POSITIVE_INFINITY;

  for (
    const color of
    colors
  ) {
    const normalized =
      normalizeColor(
        color
      );

    const index =
      matchingColors.indexOf(
        normalized
      );

    if (
      index !==
        -1 &&
      index <
        bestIndex
    ) {
      bestIndex =
        index;

      bestColor =
        color;
    }
  }

  return bestColor;
}

/*
|--------------------------------------------------------------------------
| FIND BEST AVAILABLE VARIANT
|--------------------------------------------------------------------------
*/

function resolveOutfitVariant(
  product: any,
  size:
    string | null,
  matchingColors:
    string[],
  applySize:
    boolean
) {
  const preferredColor =
    chooseBestColor(
      product,
      matchingColors
    );

  const requestedSize =
    applySize
      ? size
      : null;

  /*
  |--------------------------------------------------------------------------
  | TRY BEST MATCHING COLOR FIRST
  |--------------------------------------------------------------------------
  */

  if (
    preferredColor
  ) {
    const inventory =
      resolveProductInventory(
        product,
        {
          size:
            requestedSize,

          color:
            preferredColor,
        }
      );

    if (
      inventory.available
    ) {
      return inventory;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | TRY EVERY AVAILABLE COLOR
  |--------------------------------------------------------------------------
  */

  const colors =
    getProductColors(
      product
    );

  for (
    const color of
    colors
  ) {
    const inventory =
      resolveProductInventory(
        product,
        {
          size:
            requestedSize,

          color,
        }
      );

    if (
      inventory.available
    ) {
      return inventory;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | TRY WITHOUT COLOR
  |--------------------------------------------------------------------------
  */

  return resolveProductInventory(
    product,
    {
      size:
        requestedSize,

      color:
        null,
    }
  );
}

/*
|--------------------------------------------------------------------------
| BUILD OUTFIT
|--------------------------------------------------------------------------
*/

export async function buildOutfit(
  rawInput:
    BuildOutfitInput
) {
  const baseProductId =
    cleanString(
      rawInput.baseProductId
    );

  const suppliedCategory =
    cleanString(
      rawInput.baseCategory
    );

  const suppliedColor =
    cleanString(
      rawInput.baseColor
    );

  const suppliedGender =
    cleanString(
      rawInput.gender
    );

  const occasion =
    cleanString(
      rawInput.occasion
    );

  const style =
    cleanString(
      rawInput.style
    );

  const size =
    cleanString(
      rawInput.size
    );

  const budget =
    typeof rawInput.budget ===
      "number" &&
    Number.isFinite(
      rawInput.budget
    ) &&
    rawInput.budget >
      0
      ? rawInput.budget
      : null;

  const limitPerCategory =
    Math.min(
      Math.max(
        Math.floor(
          Number(
            rawInput.limitPerCategory
          ) ||
            3
        ),
        1
      ),
      5
    );

  /*
  |--------------------------------------------------------------------------
  | LOAD BASE PRODUCT
  |--------------------------------------------------------------------------
  */

  let baseProduct:
    any =
    null;

  if (
    baseProductId &&
    mongoose.Types.ObjectId.isValid(
      baseProductId
    )
  ) {
    baseProduct =
      await Product.findOne({
        _id:
          baseProductId,

        status:
          "Active",

        isDeleted: {
          $ne:
            true,
        },
      }).lean();

    if (
      !baseProduct
    ) {
      return {
        success:
          false,

        message:
          "Base product is unavailable or no longer exists.",

        products:
          [],

        groups:
          [],

        selectedProducts:
          [],
      };
    }
  }

  /*
  |--------------------------------------------------------------------------
  | BASE VALUES
  |--------------------------------------------------------------------------
  */

  const baseCategory =
    suppliedCategory ||
    cleanString(
      baseProduct?.category
    );

  const baseSubCategory =
    cleanString(
      baseProduct?.subCategory
    );

  if (
    !baseCategory
  ) {
    return {
      success:
        false,

      message:
        "A base product or base category is required to build an outfit.",

      products:
        [],

      groups:
        [],

      selectedProducts:
        [],
    };
  }

  const baseColors =
    baseProduct
      ? getProductColors(
          baseProduct
        )
      : [];

  const baseColor =
    suppliedColor ||
    cleanString(
      baseColors[0]
    );

  /*
  |--------------------------------------------------------------------------
  | BASE PRODUCT STOCK VALIDATION
  |--------------------------------------------------------------------------
  */

  let baseInventory:
    ReturnType<
      typeof resolveProductInventory
    > | null =
    null;

  if (
    baseProduct
  ) {
    baseInventory =
      resolveProductInventory(
        baseProduct,
        {
          size:
            size,

          color:
            baseColor,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | If supplied size/color combination does not exist, we still allow outfit
    | suggestions but do not claim base variant is purchasable.
    |--------------------------------------------------------------------------
    */
  }

  const baseFamily =
    detectCategoryFamily(
      baseCategory,
      baseSubCategory
    );

  const matchingColors =
    getMatchingColors(
      baseColor
    );

  const categoryGroups =
    getComplementaryCategories(
      baseFamily
    );

  /*
  |--------------------------------------------------------------------------
  | GENDER
  |--------------------------------------------------------------------------
  */

  const gender =
    normalizeProductGender(
      suppliedGender ||
      cleanString(
        baseProduct?.gender
      )
    );

  /*
  |--------------------------------------------------------------------------
  | BUDGET
  |--------------------------------------------------------------------------
  */

  const basePrice =
    safeNumber(
      baseProduct?.price
    );

  const availableBudget =
    budget !==
    null
      ? Math.max(
          budget -
            basePrice,
          0
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | RESULTS
  |--------------------------------------------------------------------------
  */

  const groups:
    Array<{
      group:
        string;

      products:
        Array<
          OutfitProduct & {
            matchScore:
              number;
          }
        >;
    }> = [];

  /*
  |--------------------------------------------------------------------------
  | CANDIDATE COLLECTION
  |--------------------------------------------------------------------------
  */

  for (
    let groupIndex =
      0;
    groupIndex <
    categoryGroups.length;
    groupIndex +=
      1
  ) {
    const categories =
      categoryGroups[
        groupIndex
      ];

    const applySize =
      Boolean(
        size &&
        shouldApplySizeToCategories(
          categories
        )
      );

    /*
    |--------------------------------------------------------------------------
    | Do not divide budget equally across groups.
    |
    | A ₹5000 outfit can legitimately contain:
    | ₹2500 jeans + ₹1200 shoes + ₹500 accessory.
    |
    | Equal slicing would wrongly discard good products.
    |--------------------------------------------------------------------------
    */

    const candidates =
      await findCandidates({
        categories,

        gender,

        size:
          applySize
            ? size
            : null,

        maxPrice:
          availableBudget,

        excludeId:
          baseProductId,
      });

    const ranked =
      candidates
        .map(
          (
            product:
              any
          ) => {
            const inventory =
              resolveOutfitVariant(
                product,
                size,
                matchingColors,
                applySize
              );

            return {
              product,

              inventory,

              score:
                scoreProduct({
                  product,

                  matchingColors,

                  occasion,

                  style,

                  availableStock:
                    inventory.stock,
                }),
            };
          }
        )
        .filter(
          (
            item
          ) =>
            item.inventory
              .available ===
              true &&
            item.inventory
              .stock >
              0
        )
        .sort(
          (
            a,
            b
          ) => {
            if (
              b.score !==
              a.score
            ) {
              return (
                b.score -
                a.score
              );
            }

            return (
              safeNumber(
                a.product.price
              ) -
              safeNumber(
                b.product.price
              )
            );
          }
        )
        .slice(
          0,
          limitPerCategory
        )
        .map(
          (
            item
          ) => ({
            ...serializeProduct(
              item.product,
              {
                size:
                  item.inventory
                    .size,

                color:
                  item.inventory
                    .color,
              }
            ),

            matchScore:
              item.score,
          })
        );

    if (
      ranked.length >
      0
    ) {
      groups.push({
        group:
          categories[0],

        products:
          ranked,
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SELECT BEST COMPLETE LOOK UNDER TOTAL BUDGET
  |--------------------------------------------------------------------------
  */

  const selectedProducts:
    Array<
      OutfitProduct & {
        matchScore:
          number;
      }
    > = [];

  let runningTotal =
    basePrice;

  for (
    const group of
    groups
  ) {
    let selected:
      (
        OutfitProduct & {
          matchScore:
            number;
        }
      ) | null =
      null;

    /*
    |--------------------------------------------------------------------------
    | NO BUDGET
    |--------------------------------------------------------------------------
    */

    if (
      budget ===
      null
    ) {
      selected =
        group.products[0] ||
        null;
    } else {
      /*
      |--------------------------------------------------------------------------
      | PICK HIGHEST-SCORE PRODUCT THAT STILL FITS TOTAL BUDGET
      |--------------------------------------------------------------------------
      */

      selected =
        group.products.find(
          (
            product
          ) =>
            runningTotal +
              safeNumber(
                product.price
              ) <=
            budget
        ) ||
        null;
    }

    if (
      selected
    ) {
      selectedProducts.push(
        selected
      );

      runningTotal +=
        safeNumber(
          selected.price
        );
    }
  }

  const selectedTotal =
    selectedProducts.reduce(
      (
        total,
        product
      ) =>
        total +
        safeNumber(
          product.price
        ),
      basePrice
    );

  /*
  |--------------------------------------------------------------------------
  | ALL PRODUCTS
  |--------------------------------------------------------------------------
  */

  const allProducts =
    groups.flatMap(
      (
        group
      ) =>
        group.products
    );

  /*
  |--------------------------------------------------------------------------
  | UNIQUE ALL PRODUCTS
  |--------------------------------------------------------------------------
  */

  const uniqueProducts =
    Array.from(
      new Map(
        allProducts.map(
          (
            product
          ) => [
            product.id,
            product,
          ]
        )
      ).values()
    );

  /*
  |--------------------------------------------------------------------------
  | RESPONSE
  |--------------------------------------------------------------------------
  */

  return {
    success:
      true,

    baseProduct:
      baseProduct
        ? serializeProduct(
            baseProduct,
            baseInventory
              ? {
                  size:
                    baseInventory
                      .size,

                  color:
                    baseInventory
                      .color,
                }
              : undefined
          )
        : null,

    baseCategory,

    baseColor,

    baseCategoryFamily:
      baseFamily,

    matchingColors,

    gender,

    occasion,

    style,

    size,

    budget,

    basePrice,

    selectedTotal,

    withinBudget:
      budget ===
      null
        ? null
        : selectedTotal <=
          budget,

    groups,

    selectedProducts,

    products:
      uniqueProducts,

    message:
      uniqueProducts.length >
      0
        ? selectedProducts.length >
          0
          ? "Matching SilentGEN outfit products found."
          : budget !==
            null
            ? "Matching products were found, but a complete look could not be selected within the requested budget."
            : "Matching SilentGEN outfit products found."
        : "No suitable matching SilentGEN outfit products were found.",
  };
}