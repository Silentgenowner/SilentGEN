import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import Product from "@/models/Product";
import AIStyleProfile from "@/models/AIStyleProfile";

/*
|--------------------------------------------------------------------------
| SILENTGEN PERSONALIZED RECOMMENDATION ENGINE
|--------------------------------------------------------------------------
|
| Responsibilities:
|
| 1. Load customer shopping preferences.
| 2. Use LIVE Product data for recommendations.
| 3. Never treat stale memory as product truth.
| 4. Respect disliked products/colors.
| 5. Prefer liked/viewed patterns only as weak signals.
| 6. Respect budget when available.
| 7. Avoid out-of-stock / archived / deleted products.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_LIMIT =
  12;

const MAX_LIMIT =
  50;

const MAX_CANDIDATES =
  250;

const MAX_MEMORY_PRODUCTS =
  100;

/*
|--------------------------------------------------------------------------
| INPUT
|--------------------------------------------------------------------------
*/

export type PersonalizedRecommendationInput = {
  userId:
    string;

  limit?:
    number;

  category?:
    string | null;

  gender?:
    string | null;

  color?:
    string | null;

  size?:
    string | null;

  minPrice?:
    number | null;

  maxPrice?:
    number | null;

  excludeProductIds?:
    string[];

  currentProductId?:
    string | null;
};

/*
|--------------------------------------------------------------------------
| RECOMMENDATION REASON
|--------------------------------------------------------------------------
*/

export type RecommendationReason =
  | "preferred_color"
  | "preferred_size"
  | "preferred_fit"
  | "preferred_category"
  | "preferred_brand"
  | "preferred_style"
  | "preferred_fabric"
  | "preferred_budget"
  | "liked_product_similarity"
  | "viewed_product_similarity"
  | "current_product_similarity"
  | "explicit_filter"
  | "general_relevance";

/*
|--------------------------------------------------------------------------
| RECOMMENDED PRODUCT
|--------------------------------------------------------------------------
*/

export type PersonalizedRecommendedProduct = {
  id:
    string;

  sku:
    string;

  name:
    string;

  slug:
    string;

  category:
    string;

  subCategory:
    string;

  brand:
    string;

  gender:
    string;

  fabric:
    string;

  fit:
    string;

  mrp:
    number;

  price:
    number;

  discount:
    number;

  stock:
    number;

  thumbnail:
    string;

  images:
    string[];

  sizes:
    string[];

  colors:
    string[];

  featured:
    boolean;

  bestSeller:
    boolean;

  newArrival:
    boolean;

  trending:
    boolean;

  recommendationScore:
    number;

  reasons:
    RecommendationReason[];
};

/*
|--------------------------------------------------------------------------
| RESULT
|--------------------------------------------------------------------------
*/

export type PersonalizedRecommendationResult = {
  success:
    boolean;

  message:
    string;

  personalizationUsed:
    boolean;

  products:
    PersonalizedRecommendedProduct[];

  profileSummary:
    {
      preferredColors:
        string[];

      preferredSizes:
        string[];

      preferredFits:
        string[];

      preferredCategories:
        string[];

      preferredBrands:
        string[];

      preferredStyles:
        string[];

      preferredFabrics:
        string[];

      minBudget:
        number | null;

      maxBudget:
        number | null;
    } | null;
};

/*
|--------------------------------------------------------------------------
| INTERNAL PROFILE
|--------------------------------------------------------------------------
*/

type NormalizedProfile = {
  preferredColors:
    string[];

  dislikedColors:
    string[];

  preferredSizes:
    string[];

  preferredFits:
    string[];

  preferredCategories:
    string[];

  preferredBrands:
    string[];

  preferredStyles:
    string[];

  preferredFabrics:
    string[];

  preferredOccasions:
    string[];

  minBudget:
    number | null;

  maxBudget:
    number | null;

  likedProductIds:
    string[];

  dislikedProductIds:
    string[];

  viewedProductIds:
    string[];

  personalizationEnabled:
    boolean;
};

/*
|--------------------------------------------------------------------------
| CLEAN STRING
|--------------------------------------------------------------------------
*/

function cleanString(
  value:
    unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE KEY
|--------------------------------------------------------------------------
*/

function normalizeKey(
  value:
    unknown
) {
  return cleanString(
    value
  ).toLowerCase();
}

/*
|--------------------------------------------------------------------------
| ARRAY
|--------------------------------------------------------------------------
*/

function normalizeStringArray(
  value:
    unknown
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  const result:
    string[] =
    [];

  const seen =
    new Set<string>();

  for (
    const item of
    value
  ) {
    const clean =
      cleanString(
        item
      );

    if (
      !clean
    ) {
      continue;
    }

    const key =
      normalizeKey(
        clean
      );

    if (
      seen.has(
        key
      )
    ) {
      continue;
    }

    seen.add(
      key
    );

    result.push(
      clean
    );
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| OBJECT ID ARRAY
|--------------------------------------------------------------------------
*/

function normalizeObjectIdArray(
  value:
    unknown
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  const result:
    string[] =
    [];

  const seen =
    new Set<string>();

  for (
    const item of
    value
  ) {
    const id =
      String(
        item || ""
      ).trim();

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      continue;
    }

    if (
      seen.has(
        id
      )
    ) {
      continue;
    }

    seen.add(
      id
    );

    result.push(
      id
    );

    if (
      result.length >=
      MAX_MEMORY_PRODUCTS
    ) {
      break;
    }
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| NUMBER
|--------------------------------------------------------------------------
*/

function safeNumber(
  value:
    unknown
) {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/*
|--------------------------------------------------------------------------
| OPTIONAL MONEY
|--------------------------------------------------------------------------
*/

function optionalMoney(
  value:
    unknown
):
  number | null {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return null;
  }

  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    ) ||
    number < 0
  ) {
    return null;
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| LIMIT
|--------------------------------------------------------------------------
*/

function normalizeLimit(
  value:
    unknown
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return DEFAULT_LIMIT;
  }

  return Math.min(
    MAX_LIMIT,
    Math.max(
      1,
      Math.floor(
        number
      )
    )
  );
}

/*
|--------------------------------------------------------------------------
| HAS VALUE
|--------------------------------------------------------------------------
*/

function hasNormalizedValue(
  values:
    string[],
  target:
    unknown
) {
  const targetKey =
    normalizeKey(
      target
    );

  if (
    !targetKey
  ) {
    return false;
  }

  return values.some(
    (
      value
    ) =>
      normalizeKey(
        value
      ) ===
      targetKey
  );
}

/*
|--------------------------------------------------------------------------
| ARRAY OVERLAP
|--------------------------------------------------------------------------
*/

function hasArrayOverlap(
  first:
    string[],
  second:
    string[]
) {
  const secondKeys =
    new Set(
      second.map(
        normalizeKey
      )
    );

  return first.some(
    (
      value
    ) =>
      secondKeys.has(
        normalizeKey(
          value
        )
      )
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE PROFILE
|--------------------------------------------------------------------------
*/

function normalizeProfile(
  profile:
    any
):
  NormalizedProfile {
  return {
    preferredColors:
      normalizeStringArray(
        profile?.preferredColors
      ),

    dislikedColors:
      normalizeStringArray(
        profile?.dislikedColors
      ),

    preferredSizes:
      normalizeStringArray(
        profile?.preferredSizes
      ),

    preferredFits:
      normalizeStringArray(
        profile?.preferredFits
      ),

    preferredCategories:
      normalizeStringArray(
        profile?.preferredCategories
      ),

    preferredBrands:
      normalizeStringArray(
        profile?.preferredBrands
      ),

    preferredStyles:
      normalizeStringArray(
        profile?.preferredStyles
      ),

    preferredFabrics:
      normalizeStringArray(
        profile?.preferredFabrics
      ),

    preferredOccasions:
      normalizeStringArray(
        profile?.preferredOccasions
      ),

    minBudget:
      typeof profile?.minBudget ===
        "number"
        ? profile.minBudget
        : null,

    maxBudget:
      typeof profile?.maxBudget ===
        "number"
        ? profile.maxBudget
        : null,

    likedProductIds:
      normalizeObjectIdArray(
        profile?.likedProductIds
      ),

    dislikedProductIds:
      normalizeObjectIdArray(
        profile?.dislikedProductIds
      ),

    viewedProductIds:
      normalizeObjectIdArray(
        profile?.viewedProductIds
      ),

    personalizationEnabled:
      profile?.personalizationEnabled !==
      false,
  };
}

/*
|--------------------------------------------------------------------------
| LOAD REFERENCE PRODUCTS
|--------------------------------------------------------------------------
|
| Used to weakly understand what customer's liked/viewed/current products
| have in common.
|
|--------------------------------------------------------------------------
*/

async function loadReferenceProducts(
  ids:
    string[]
) {
  if (
    ids.length ===
    0
  ) {
    return [];
  }

  return Product.find(
    {
      _id: {
        $in:
          ids,
      },

      isDeleted: {
        $ne:
          true,
      },
    }
  )
    .select(
      [
        "_id",
        "category",
        "subCategory",
        "brand",
        "gender",
        "fabric",
        "fit",
        "sizes",
        "colors",
        "tags",
      ].join(
        " "
      )
    )
    .lean();
}

/*
|--------------------------------------------------------------------------
| PRODUCT SIMILARITY
|--------------------------------------------------------------------------
*/

function calculateReferenceSimilarity(
  product:
    any,
  referenceProducts:
    any[]
) {
  let score =
    0;

  for (
    const reference of
    referenceProducts
  ) {
    if (
      normalizeKey(
        product.category
      ) &&
      normalizeKey(
        product.category
      ) ===
      normalizeKey(
        reference.category
      )
    ) {
      score +=
        3;
    }

    if (
      normalizeKey(
        product.subCategory
      ) &&
      normalizeKey(
        product.subCategory
      ) ===
      normalizeKey(
        reference.subCategory
      )
    ) {
      score +=
        2;
    }

    if (
      normalizeKey(
        product.brand
      ) &&
      normalizeKey(
        product.brand
      ) ===
      normalizeKey(
        reference.brand
      )
    ) {
      score +=
        2;
    }

    if (
      normalizeKey(
        product.fit
      ) &&
      normalizeKey(
        product.fit
      ) ===
      normalizeKey(
        reference.fit
      )
    ) {
      score +=
        2;
    }

    if (
      normalizeKey(
        product.fabric
      ) &&
      normalizeKey(
        product.fabric
      ) ===
      normalizeKey(
        reference.fabric
      )
    ) {
      score +=
        1;
    }

    if (
      hasArrayOverlap(
        normalizeStringArray(
          product.colors
        ),
        normalizeStringArray(
          reference.colors
        )
      )
    ) {
      score +=
        1;
    }

    if (
      hasArrayOverlap(
        normalizeStringArray(
          product.sizes
        ),
        normalizeStringArray(
          reference.sizes
        )
      )
    ) {
      score +=
        1;
    }
  }

  return score;
}

/*
|--------------------------------------------------------------------------
| PRODUCT SCORE
|--------------------------------------------------------------------------
*/

function calculateProductScore({
  product,
  profile,
  likedReferences,
  viewedReferences,
  currentReference,
  explicit,
}: {
  product:
    any;

  profile:
    NormalizedProfile;

  likedReferences:
    any[];

  viewedReferences:
    any[];

  currentReference:
    any | null;

  explicit: {
    category:
      string;

    gender:
      string;

    color:
      string;

    size:
      string;

    minPrice:
      number | null;

    maxPrice:
      number | null;
  };
}) {
  let score =
    0;

  const reasons =
    new Set<
      RecommendationReason
    >();

  const productColors =
    normalizeStringArray(
      product.colors
    );

  const productSizes =
    normalizeStringArray(
      product.sizes
    );

  const productTags =
    normalizeStringArray(
      product.tags
    );

  /*
  |--------------------------------------------------------------------------
  | EXPLICIT FILTERS
  |--------------------------------------------------------------------------
  */

  if (
    explicit.category &&
    normalizeKey(
      product.category
    ) ===
    normalizeKey(
      explicit.category
    )
  ) {
    score +=
      18;

    reasons.add(
      "explicit_filter"
    );
  }

  if (
    explicit.gender &&
    normalizeKey(
      product.gender
    ) ===
    normalizeKey(
      explicit.gender
    )
  ) {
    score +=
      10;

    reasons.add(
      "explicit_filter"
    );
  }

  if (
    explicit.color &&
    hasNormalizedValue(
      productColors,
      explicit.color
    )
  ) {
    score +=
      16;

    reasons.add(
      "explicit_filter"
    );
  }

  if (
    explicit.size &&
    hasNormalizedValue(
      productSizes,
      explicit.size
    )
  ) {
    score +=
      16;

    reasons.add(
      "explicit_filter"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER PREFERENCES
  |--------------------------------------------------------------------------
  */

  if (
    hasArrayOverlap(
      productColors,
      profile.preferredColors
    )
  ) {
    score +=
      14;

    reasons.add(
      "preferred_color"
    );
  }

  if (
    hasArrayOverlap(
      productSizes,
      profile.preferredSizes
    )
  ) {
    score +=
      14;

    reasons.add(
      "preferred_size"
    );
  }

  if (
    hasNormalizedValue(
      profile.preferredFits,
      product.fit
    )
  ) {
    score +=
      12;

    reasons.add(
      "preferred_fit"
    );
  }

  if (
    hasNormalizedValue(
      profile.preferredCategories,
      product.category
    ) ||
    hasNormalizedValue(
      profile.preferredCategories,
      product.subCategory
    )
  ) {
    score +=
      14;

    reasons.add(
      "preferred_category"
    );
  }

  if (
    hasNormalizedValue(
      profile.preferredBrands,
      product.brand
    )
  ) {
    score +=
      10;

    reasons.add(
      "preferred_brand"
    );
  }

  if (
    hasNormalizedValue(
      profile.preferredFabrics,
      product.fabric
    )
  ) {
    score +=
      8;

    reasons.add(
      "preferred_fabric"
    );
  }

  if (
    hasArrayOverlap(
      productTags,
      profile.preferredStyles
    )
  ) {
    score +=
      8;

    reasons.add(
      "preferred_style"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | BUDGET
  |--------------------------------------------------------------------------
  */

  const price =
    safeNumber(
      product.price
    );

  const effectiveMinBudget =
    explicit.minPrice ??
    profile.minBudget;

  const effectiveMaxBudget =
    explicit.maxPrice ??
    profile.maxBudget;

  if (
    effectiveMinBudget !==
      null ||
    effectiveMaxBudget !==
      null
  ) {
    const aboveMin =
      effectiveMinBudget ===
        null ||
      price >=
        effectiveMinBudget;

    const belowMax =
      effectiveMaxBudget ===
        null ||
      price <=
        effectiveMaxBudget;

    if (
      aboveMin &&
      belowMax
    ) {
      score +=
        12;

      reasons.add(
        "preferred_budget"
      );
    } else {
      score -=
        20;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LIKED PRODUCT SIMILARITY
  |--------------------------------------------------------------------------
  */

  const likedSimilarity =
    calculateReferenceSimilarity(
      product,
      likedReferences
    );

  if (
    likedSimilarity >
    0
  ) {
    score +=
      Math.min(
        18,
        likedSimilarity *
          2
      );

    reasons.add(
      "liked_product_similarity"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | VIEWED PRODUCT SIMILARITY
  |--------------------------------------------------------------------------
  */

  const viewedSimilarity =
    calculateReferenceSimilarity(
      product,
      viewedReferences
    );

  if (
    viewedSimilarity >
    0
  ) {
    score +=
      Math.min(
        8,
        viewedSimilarity
      );

    reasons.add(
      "viewed_product_similarity"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CURRENT PRODUCT SIMILARITY
  |--------------------------------------------------------------------------
  */

  if (
    currentReference
  ) {
    const currentSimilarity =
      calculateReferenceSimilarity(
        product,
        [
          currentReference,
        ]
      );

    if (
      currentSimilarity >
      0
    ) {
      score +=
        Math.min(
          12,
          currentSimilarity *
            2
        );

      reasons.add(
        "current_product_similarity"
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | BUSINESS QUALITY SIGNALS
  |--------------------------------------------------------------------------
  */

  if (
    product.featured ===
    true
  ) {
    score +=
      2;
  }

  if (
    product.bestSeller ===
    true
  ) {
    score +=
      4;
  }

  if (
    product.trending ===
    true
  ) {
    score +=
      3;
  }

  if (
    product.newArrival ===
    true
  ) {
    score +=
      1;
  }

  if (
    safeNumber(
      product.stock
    ) <=
    0
  ) {
    score -=
      100;
  }

  if (
    reasons.size ===
    0
  ) {
    reasons.add(
      "general_relevance"
    );
  }

  return {
    score:
      Number(
        Math.max(
          0,
          score
        ).toFixed(
          2
        )
      ),

    reasons:
      Array.from(
        reasons
      ),
  };
}

/*
|--------------------------------------------------------------------------
| MAIN RECOMMENDATION FUNCTION
|--------------------------------------------------------------------------
*/

export async function getPersonalizedRecommendations(
  input:
    PersonalizedRecommendationInput
): Promise<
  PersonalizedRecommendationResult
> {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | USER
    |--------------------------------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(
        input.userId
      )
    ) {
      return {
        success:
          false,

        message:
          "Invalid customer id.",

        personalizationUsed:
          false,

        products:
          [],

        profileSummary:
          null,
      };
    }

    const limit =
      normalizeLimit(
        input.limit
      );

    /*
    |--------------------------------------------------------------------------
    | PROFILE
    |--------------------------------------------------------------------------
    */

    const rawProfile:
      any =
      await AIStyleProfile.findOne(
        {
          userId:
            input.userId,
        }
      ).lean();

    const profile =
      normalizeProfile(
        rawProfile
      );

    /*
    |--------------------------------------------------------------------------
    | EXCLUSIONS
    |--------------------------------------------------------------------------
    */

    const excludedIds =
      new Set<string>();

    for (
      const id of
      normalizeObjectIdArray(
        input.excludeProductIds
      )
    ) {
      excludedIds.add(
        id
      );
    }

    for (
      const id of
      profile.dislikedProductIds
    ) {
      excludedIds.add(
        id
      );
    }

    if (
      input.currentProductId &&
      mongoose.Types.ObjectId.isValid(
        input.currentProductId
      )
    ) {
      excludedIds.add(
        input.currentProductId
      );
    }

    /*
    |--------------------------------------------------------------------------
    | EXPLICIT FILTERS
    |--------------------------------------------------------------------------
    */

    const explicitCategory =
      cleanString(
        input.category
      );

    const explicitGender =
      cleanString(
        input.gender
      );

    const explicitColor =
      cleanString(
        input.color
      );

    const explicitSize =
      cleanString(
        input.size
      );

    const explicitMinPrice =
      optionalMoney(
        input.minPrice
      );

    const explicitMaxPrice =
      optionalMoney(
        input.maxPrice
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT QUERY
    |--------------------------------------------------------------------------
    */

    const productFilter:
      Record<
        string,
        unknown
      > = {
      isDeleted: {
        $ne:
          true,
      },

      status: {
        $nin: [
          "Draft",
          "Archived",
          "Out of Stock",
        ],
      },

      stock: {
        $gt:
          0,
      },
    };

    if (
      excludedIds.size >
      0
    ) {
      productFilter._id = {
        $nin:
          Array.from(
            excludedIds
          ).map(
            (
              id
            ) =>
              new mongoose.Types.ObjectId(
                id
              )
          ),
      };
    }

    if (
      explicitCategory
    ) {
      productFilter.$or = [
        {
          category: {
            $regex:
              explicitCategory,

            $options:
              "i",
          },
        },
        {
          subCategory: {
            $regex:
              explicitCategory,

            $options:
              "i",
          },
        },
      ];
    }

    if (
      explicitGender
    ) {
      productFilter.gender = {
        $regex:
          `^${explicitGender}$`,

        $options:
          "i",
      };
    }

    if (
      explicitColor
    ) {
      productFilter.colors = {
        $elemMatch: {
          $regex:
            `^${explicitColor}$`,

          $options:
            "i",
        },
      };
    }

    if (
      explicitSize
    ) {
      productFilter.sizes = {
        $elemMatch: {
          $regex:
            `^${explicitSize}$`,

          $options:
            "i",
        },
      };
    }

    const priceFilter:
      Record<
        string,
        number
      > = {};

    if (
      explicitMinPrice !==
      null
    ) {
      priceFilter.$gte =
        explicitMinPrice;
    }

    if (
      explicitMaxPrice !==
      null
    ) {
      priceFilter.$lte =
        explicitMaxPrice;
    }

    if (
      Object.keys(
        priceFilter
      ).length >
      0
    ) {
      productFilter.price =
        priceFilter;
    }

    /*
    |--------------------------------------------------------------------------
    | CANDIDATES
    |--------------------------------------------------------------------------
    */

    const candidates:
      any[] =
      await Product.find(
        productFilter
      )
        .select(
          [
            "_id",
            "sku",
            "name",
            "slug",
            "category",
            "subCategory",
            "brand",
            "gender",
            "fabric",
            "fit",
            "mrp",
            "price",
            "discount",
            "stock",
            "thumbnail",
            "images",
            "sizes",
            "colors",
            "tags",
            "featured",
            "bestSeller",
            "newArrival",
            "trending",
          ].join(
            " "
          )
        )
        .limit(
          MAX_CANDIDATES
        )
        .lean();

    /*
    |--------------------------------------------------------------------------
    | REFERENCE PRODUCTS
    |--------------------------------------------------------------------------
    */

    const likedReferenceIds =
      profile.likedProductIds.slice(
        -20
      );

    const viewedReferenceIds =
      profile.viewedProductIds
        .filter(
          (
            id
          ) =>
            !profile
              .likedProductIds
              .includes(
                id
              )
        )
        .slice(
          -20
        );

    const [
      likedReferences,
      viewedReferences,
      currentReferenceArray,
    ] =
      await Promise.all(
        [
          loadReferenceProducts(
            likedReferenceIds
          ),

          loadReferenceProducts(
            viewedReferenceIds
          ),

          input.currentProductId &&
          mongoose.Types.ObjectId.isValid(
            input.currentProductId
          )
            ? loadReferenceProducts(
                [
                  input.currentProductId,
                ]
              )
            : Promise.resolve(
                []
              ),
        ]
      );

    const currentReference =
      currentReferenceArray[0] ||
      null;

    /*
    |--------------------------------------------------------------------------
    | SCORE
    |--------------------------------------------------------------------------
    */

    const scored =
      candidates.map(
        (
          product
        ) => {
          const recommendation =
            calculateProductScore(
              {
                product,

                profile,

                likedReferences,

                viewedReferences,

                currentReference,

                explicit: {
                  category:
                    explicitCategory,

                  gender:
                    explicitGender,

                  color:
                    explicitColor,

                  size:
                    explicitSize,

                  minPrice:
                    explicitMinPrice,

                  maxPrice:
                    explicitMaxPrice,
                },
              }
            );

          return {
            product,

            score:
              recommendation.score,

            reasons:
              recommendation.reasons,
          };
        }
      );

    /*
    |--------------------------------------------------------------------------
    | REMOVE DISLIKED COLOR MATCHES
    |--------------------------------------------------------------------------
    */

    const filtered =
      scored.filter(
        (
          item
        ) => {
          const colors =
            normalizeStringArray(
              item.product.colors
            );

          if (
            hasArrayOverlap(
              colors,
              profile.dislikedColors
            )
          ) {
            return false;
          }

          return true;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | SORT
    |--------------------------------------------------------------------------
    */

    filtered.sort(
      (
        first,
        second
      ) => {
        if (
          second.score !==
          first.score
        ) {
          return (
            second.score -
            first.score
          );
        }

        const secondSold =
          safeNumber(
            second.product.sold
          );

        const firstSold =
          safeNumber(
            first.product.sold
          );

        if (
          secondSold !==
          firstSold
        ) {
          return (
            secondSold -
            firstSold
          );
        }

        return (
          safeNumber(
            second.product.stock
          ) -
          safeNumber(
            first.product.stock
          )
        );
      }
    );

    /*
    |--------------------------------------------------------------------------
    | SERIALIZE
    |--------------------------------------------------------------------------
    */

    const products:
      PersonalizedRecommendedProduct[] =
      filtered
        .slice(
          0,
          limit
        )
        .map(
          (
            item
          ) => ({
            id:
              String(
                item.product._id
              ),

            sku:
              cleanString(
                item.product.sku
              ),

            name:
              cleanString(
                item.product.name
              ),

            slug:
              cleanString(
                item.product.slug
              ),

            category:
              cleanString(
                item.product.category
              ),

            subCategory:
              cleanString(
                item.product.subCategory
              ),

            brand:
              cleanString(
                item.product.brand
              ),

            gender:
              cleanString(
                item.product.gender
              ),

            fabric:
              cleanString(
                item.product.fabric
              ),

            fit:
              cleanString(
                item.product.fit
              ),

            mrp:
              safeNumber(
                item.product.mrp
              ),

            price:
              safeNumber(
                item.product.price
              ),

            discount:
              safeNumber(
                item.product.discount
              ),

            stock:
              safeNumber(
                item.product.stock
              ),

            thumbnail:
              cleanString(
                item.product.thumbnail
              ),

            images:
              normalizeStringArray(
                item.product.images
              ),

            sizes:
              normalizeStringArray(
                item.product.sizes
              ),

            colors:
              normalizeStringArray(
                item.product.colors
              ),

            featured:
              item.product.featured ===
              true,

            bestSeller:
              item.product.bestSeller ===
              true,

            newArrival:
              item.product.newArrival ===
              true,

            trending:
              item.product.trending ===
              true,

            recommendationScore:
              item.score,

            reasons:
              item.reasons,
          })
        );

    /*
    |--------------------------------------------------------------------------
    | PERSONALIZATION USED
    |--------------------------------------------------------------------------
    */

    const personalizationUsed =
      profile.personalizationEnabled &&
      (
        profile.preferredColors.length >
          0 ||
        profile.preferredSizes.length >
          0 ||
        profile.preferredFits.length >
          0 ||
        profile.preferredCategories.length >
          0 ||
        profile.preferredBrands.length >
          0 ||
        profile.preferredStyles.length >
          0 ||
        profile.preferredFabrics.length >
          0 ||
        profile.likedProductIds.length >
          0 ||
        profile.viewedProductIds.length >
          0 ||
        profile.minBudget !==
          null ||
        profile.maxBudget !==
          null
      );

    return {
      success:
        true,

      message:
        products.length >
        0
          ? "Personalized SilentGEN recommendations generated successfully."
          : "No matching products found for the current customer preferences.",

      personalizationUsed,

      products,

      profileSummary:
        profile.personalizationEnabled
          ? {
              preferredColors:
                profile.preferredColors,

              preferredSizes:
                profile.preferredSizes,

              preferredFits:
                profile.preferredFits,

              preferredCategories:
                profile.preferredCategories,

              preferredBrands:
                profile.preferredBrands,

              preferredStyles:
                profile.preferredStyles,

              preferredFabrics:
                profile.preferredFabrics,

              minBudget:
                profile.minBudget,

              maxBudget:
                profile.maxBudget,
            }
          : null,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN personalized recommendation error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to generate personalized recommendations.",

      personalizationUsed:
        false,

      products:
        [],

      profileSummary:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| GENERAL FALLBACK RECOMMENDATIONS
|--------------------------------------------------------------------------
|
| Can be used for:
|
| - guest customer
| - customer with personalization disabled
| - empty profile
|
|--------------------------------------------------------------------------
*/

export async function getGeneralRecommendations(
  limit =
    DEFAULT_LIMIT
) {
  try {
    await connectDB();

    const safeLimit =
      normalizeLimit(
        limit
      );

    const products:
      any[] =
      await Product.find(
        {
          isDeleted: {
            $ne:
              true,
          },

          status: {
            $nin: [
              "Draft",
              "Archived",
              "Out of Stock",
            ],
          },

          stock: {
            $gt:
              0,
          },
        }
      )
        .sort(
          {
            bestSeller:
              -1,

            trending:
              -1,

            featured:
              -1,

            sold:
              -1,

            createdAt:
              -1,
          }
        )
        .limit(
          safeLimit
        )
        .select(
          [
            "_id",
            "sku",
            "name",
            "slug",
            "category",
            "subCategory",
            "brand",
            "gender",
            "fabric",
            "fit",
            "mrp",
            "price",
            "discount",
            "stock",
            "thumbnail",
            "images",
            "sizes",
            "colors",
            "featured",
            "bestSeller",
            "newArrival",
            "trending",
          ].join(
            " "
          )
        )
        .lean();

    return {
      success:
        true,

      message:
        "General recommendations generated successfully.",

      personalizationUsed:
        false,

      products:
        products.map(
          (
            product
          ) => ({
            id:
              String(
                product._id
              ),

            sku:
              cleanString(
                product.sku
              ),

            name:
              cleanString(
                product.name
              ),

            slug:
              cleanString(
                product.slug
              ),

            category:
              cleanString(
                product.category
              ),

            subCategory:
              cleanString(
                product.subCategory
              ),

            brand:
              cleanString(
                product.brand
              ),

            gender:
              cleanString(
                product.gender
              ),

            fabric:
              cleanString(
                product.fabric
              ),

            fit:
              cleanString(
                product.fit
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
              safeNumber(
                product.stock
              ),

            thumbnail:
              cleanString(
                product.thumbnail
              ),

            images:
              normalizeStringArray(
                product.images
              ),

            sizes:
              normalizeStringArray(
                product.sizes
              ),

            colors:
              normalizeStringArray(
                product.colors
              ),

            featured:
              product.featured ===
              true,

            bestSeller:
              product.bestSeller ===
              true,

            newArrival:
              product.newArrival ===
              true,

            trending:
              product.trending ===
              true,

            recommendationScore:
              0,

            reasons: [
              "general_relevance" as
                RecommendationReason,
            ],
          })
        ),
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN general recommendation error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to generate general recommendations.",

      personalizationUsed:
        false,

      products:
        [],
    };
  }
}

/*
|--------------------------------------------------------------------------
| SMART RECOMMENDATIONS
|--------------------------------------------------------------------------
|
| If logged in:
| personalized recommendations
|
| Otherwise:
| general recommendations
|
|--------------------------------------------------------------------------
*/

export async function getSmartRecommendations({
  userId,
  limit,
  category,
  gender,
  color,
  size,
  minPrice,
  maxPrice,
  excludeProductIds,
  currentProductId,
}: {
  userId?:
    string | null;

  limit?:
    number;

  category?:
    string | null;

  gender?:
    string | null;

  color?:
    string | null;

  size?:
    string | null;

  minPrice?:
    number | null;

  maxPrice?:
    number | null;

  excludeProductIds?:
    string[];

  currentProductId?:
    string | null;
}) {
  if (
    userId &&
    mongoose.Types.ObjectId.isValid(
      userId
    )
  ) {
    const personalized =
      await getPersonalizedRecommendations(
        {
          userId,

          limit,

          category,

          gender,

          color,

          size,

          minPrice,

          maxPrice,

          excludeProductIds,

          currentProductId,
        }
      );

    if (
      personalized.success &&
      personalized.products.length >
        0
    ) {
      return personalized;
    }
  }

  return getGeneralRecommendations(
    limit
  );
}