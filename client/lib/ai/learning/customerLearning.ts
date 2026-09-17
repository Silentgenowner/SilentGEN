import mongoose from "mongoose";

import AIStyleProfile from "@/models/AIStyleProfile";

/*
|--------------------------------------------------------------------------
| CUSTOMER LEARNING
|--------------------------------------------------------------------------
|
| SilentGEN Customer AI controlled-learning layer.
|
| IMPORTANT PRINCIPLES:
|
| 1. Customer preferences may be remembered.
| 2. Product facts must NOT be learned here.
| 3. Price / stock / sizes / colors must always come from live product tools.
| 4. Never infer sensitive personal information.
| 5. Explicit customer preferences are stronger than inferred behaviour.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_PROFILE_VALUES =
  50;

const MAX_PRODUCT_MEMORY =
  100;

const MAX_VALUE_LENGTH =
  120;

const MAX_BUDGET =
  10_000_000;

/*
|--------------------------------------------------------------------------
| LEARNING EVENT TYPES
|--------------------------------------------------------------------------
*/

export type CustomerProductLearningEvent =
  | "viewed"
  | "liked"
  | "disliked";

/*
|--------------------------------------------------------------------------
| EXPLICIT PREFERENCE INPUT
|--------------------------------------------------------------------------
|
| These values should normally come from:
|
| - explicit customer statements
| - explicit UI selections
| - confirmed AI memory updates
|
| Example:
|
| "I like black oversized t-shirts"
|
|--------------------------------------------------------------------------
*/

export type CustomerExplicitPreferenceInput = {
  preferredColors?:
    string[] | null;

  dislikedColors?:
    string[] | null;

  preferredSizes?:
    string[] | null;

  preferredFits?:
    string[] | null;

  preferredCategories?:
    string[] | null;

  preferredBrands?:
    string[] | null;

  preferredStyles?:
    string[] | null;

  preferredFabrics?:
    string[] | null;

  preferredOccasions?:
    string[] | null;

  minBudget?:
    number | null;

  maxBudget?:
    number | null;

  personalizationEnabled?:
    boolean | null;
};

/*
|--------------------------------------------------------------------------
| PRODUCT EVENT INPUT
|--------------------------------------------------------------------------
*/

export type CustomerProductEventInput = {
  type:
    CustomerProductLearningEvent;

  productId:
    string;
};

/*
|--------------------------------------------------------------------------
| LEARNING RESULT
|--------------------------------------------------------------------------
*/

export type CustomerLearningResult = {
  success:
    boolean;

  message:
    string;

  profile?:
    {
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
    )
    .slice(
      0,
      MAX_VALUE_LENGTH
    );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE COMPARISON KEY
|--------------------------------------------------------------------------
*/

function normalizeKey(
  value:
    string
) {
  return value
    .trim()
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| NORMALIZE STRING ARRAY
|--------------------------------------------------------------------------
*/

function normalizeStringArray(
  values:
    unknown
) {
  if (
    !Array.isArray(
      values
    )
  ) {
    return [];
  }

  const output:
    string[] =
    [];

  const seen =
    new Set<string>();

  for (
    const value of
    values
  ) {
    const clean =
      cleanString(
        value
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

    output.push(
      clean
    );

    if (
      output.length >=
      MAX_PROFILE_VALUES
    ) {
      break;
    }
  }

  return output;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE EXISTING ARRAY
|--------------------------------------------------------------------------
*/

function normalizeExistingArray(
  values:
    unknown
) {
  return normalizeStringArray(
    values
  );
}

/*
|--------------------------------------------------------------------------
| MERGE VALUES
|--------------------------------------------------------------------------
|
| New explicit preferences are added without removing old preferences.
|
|--------------------------------------------------------------------------
*/

function mergeValues(
  existing:
    unknown,
  incoming:
    unknown
) {
  const current =
    normalizeExistingArray(
      existing
    );

  const additions =
    normalizeStringArray(
      incoming
    );

  const output =
    [
      ...current,
    ];

  const seen =
    new Set(
      current.map(
        normalizeKey
      )
    );

  for (
    const value of
    additions
  ) {
    const key =
      normalizeKey(
        value
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

    output.push(
      value
    );

    if (
      output.length >=
      MAX_PROFILE_VALUES
    ) {
      break;
    }
  }

  return output;
}

/*
|--------------------------------------------------------------------------
| REMOVE CONFLICTING VALUES
|--------------------------------------------------------------------------
*/

function removeValues(
  existing:
    unknown,
  valuesToRemove:
    unknown
) {
  const current =
    normalizeExistingArray(
      existing
    );

  const removeKeys =
    new Set(
      normalizeStringArray(
        valuesToRemove
      ).map(
        normalizeKey
      )
    );

  if (
    removeKeys.size ===
    0
  ) {
    return current;
  }

  return current.filter(
    (
      value
    ) =>
      !removeKeys.has(
        normalizeKey(
          value
        )
      )
  );
}

/*
|--------------------------------------------------------------------------
| BUDGET
|--------------------------------------------------------------------------
*/

function normalizeBudget(
  value:
    unknown
):
  number | null {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value
    ) ||
    value < 0
  ) {
    return null;
  }

  return Math.min(
    Math.round(
      value
    ),
    MAX_BUDGET
  );
}

/*
|--------------------------------------------------------------------------
| OBJECT ID ARRAY
|--------------------------------------------------------------------------
*/

function normalizeProductIdArray(
  values:
    unknown
) {
  if (
    !Array.isArray(
      values
    )
  ) {
    return [];
  }

  const output:
    string[] =
    [];

  const seen =
    new Set<string>();

  for (
    const value of
    values
  ) {
    const id =
      String(
        value || ""
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

    output.push(
      id
    );

    if (
      output.length >=
      MAX_PRODUCT_MEMORY
    ) {
      break;
    }
  }

  return output;
}

/*
|--------------------------------------------------------------------------
| ADD PRODUCT MEMORY
|--------------------------------------------------------------------------
|
| Latest interaction is kept near the end.
|
|--------------------------------------------------------------------------
*/

function addProductMemory(
  existing:
    unknown,
  productId:
    string
) {
  const current =
    normalizeProductIdArray(
      existing
    ).filter(
      (
        id
      ) =>
        id !==
        productId
    );

  current.push(
    productId
  );

  if (
    current.length >
    MAX_PRODUCT_MEMORY
  ) {
    return current.slice(
      current.length -
      MAX_PRODUCT_MEMORY
    );
  }

  return current;
}

/*
|--------------------------------------------------------------------------
| REMOVE PRODUCT MEMORY
|--------------------------------------------------------------------------
*/

function removeProductMemory(
  existing:
    unknown,
  productId:
    string
) {
  return normalizeProductIdArray(
    existing
  ).filter(
    (
      id
    ) =>
      id !==
      productId
  );
}

/*
|--------------------------------------------------------------------------
| SERIALIZE PROFILE
|--------------------------------------------------------------------------
*/

function serializeProfile(
  profile:
    any
) {
  return {
    preferredColors:
      normalizeExistingArray(
        profile?.preferredColors
      ),

    dislikedColors:
      normalizeExistingArray(
        profile?.dislikedColors
      ),

    preferredSizes:
      normalizeExistingArray(
        profile?.preferredSizes
      ),

    preferredFits:
      normalizeExistingArray(
        profile?.preferredFits
      ),

    preferredCategories:
      normalizeExistingArray(
        profile?.preferredCategories
      ),

    preferredBrands:
      normalizeExistingArray(
        profile?.preferredBrands
      ),

    preferredStyles:
      normalizeExistingArray(
        profile?.preferredStyles
      ),

    preferredFabrics:
      normalizeExistingArray(
        profile?.preferredFabrics
      ),

    preferredOccasions:
      normalizeExistingArray(
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
      normalizeProductIdArray(
        profile?.likedProductIds
      ),

    dislikedProductIds:
      normalizeProductIdArray(
        profile?.dislikedProductIds
      ),

    viewedProductIds:
      normalizeProductIdArray(
        profile?.viewedProductIds
      ),

    personalizationEnabled:
      profile?.personalizationEnabled !==
      false,
  };
}

/*
|--------------------------------------------------------------------------
| VALIDATE USER
|--------------------------------------------------------------------------
*/

function validateUserId(
  userId:
    string
) {
  return (
    typeof userId ===
      "string" &&
    mongoose.Types.ObjectId.isValid(
      userId
    )
  );
}

/*
|--------------------------------------------------------------------------
| LEARN EXPLICIT CUSTOMER PREFERENCES
|--------------------------------------------------------------------------
|
| This function should only receive explicit customer intent.
|
| Examples:
|
| ✅ "I prefer black."
| ✅ "My size is L."
| ✅ Customer explicitly selects ₹2000 max budget.
|
| Avoid:
|
| ❌ Guessing gender from product views.
| ❌ Guessing age.
| ❌ Guessing religion.
| ❌ Guessing income.
| ❌ Guessing medical conditions.
|
|--------------------------------------------------------------------------
*/

export async function learnCustomerPreferences(
  userId:
    string,
  input:
    CustomerExplicitPreferenceInput
): Promise<
  CustomerLearningResult
> {
  try {
    if (
      !validateUserId(
        userId
      )
    ) {
      return {
        success:
          false,

        message:
          "Invalid customer id.",
      };
    }

    const profile:
      any =
      await AIStyleProfile.findOneAndUpdate(
        {
          userId,
        },
        {
          $setOnInsert: {
            userId,

            preferredColors:
              [],

            dislikedColors:
              [],

            preferredSizes:
              [],

            preferredFits:
              [],

            preferredCategories:
              [],

            preferredBrands:
              [],

            preferredStyles:
              [],

            preferredFabrics:
              [],

            preferredOccasions:
              [],

            minBudget:
              null,

            maxBudget:
              null,

            likedProductIds:
              [],

            dislikedProductIds:
              [],

            viewedProductIds:
              [],

            personalizationEnabled:
              true,
          },
        },
        {
          new:
            true,

          upsert:
            true,

          setDefaultsOnInsert:
            true,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | PERSONALIZATION SWITCH
    |--------------------------------------------------------------------------
    */

    if (
      typeof input.personalizationEnabled ===
      "boolean"
    ) {
      profile.personalizationEnabled =
        input.personalizationEnabled;
    }

    /*
    |--------------------------------------------------------------------------
    | IF PERSONALIZATION IS DISABLED
    |--------------------------------------------------------------------------
    |
    | We allow the toggle itself to save, but do not learn new preferences.
    |
    |--------------------------------------------------------------------------
    */

    if (
      profile.personalizationEnabled ===
      false
    ) {
      await profile.save();

      return {
        success:
          true,

        message:
          "Personalization is disabled. No new shopping preferences were learned.",

        profile:
          serializeProfile(
            profile
          ),
      };
    }

    /*
    |--------------------------------------------------------------------------
    | COLORS
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        input.preferredColors
      )
    ) {
      profile.preferredColors =
        mergeValues(
          profile.preferredColors,
          input.preferredColors
        );

      profile.dislikedColors =
        removeValues(
          profile.dislikedColors,
          input.preferredColors
        );
    }

    if (
      Array.isArray(
        input.dislikedColors
      )
    ) {
      profile.dislikedColors =
        mergeValues(
          profile.dislikedColors,
          input.dislikedColors
        );

      profile.preferredColors =
        removeValues(
          profile.preferredColors,
          input.dislikedColors
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SIZES
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        input.preferredSizes
      )
    ) {
      profile.preferredSizes =
        mergeValues(
          profile.preferredSizes,
          input.preferredSizes
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FITS
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        input.preferredFits
      )
    ) {
      profile.preferredFits =
        mergeValues(
          profile.preferredFits,
          input.preferredFits
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORIES
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        input.preferredCategories
      )
    ) {
      profile.preferredCategories =
        mergeValues(
          profile.preferredCategories,
          input.preferredCategories
        );
    }

    /*
    |--------------------------------------------------------------------------
    | BRANDS
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        input.preferredBrands
      )
    ) {
      profile.preferredBrands =
        mergeValues(
          profile.preferredBrands,
          input.preferredBrands
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STYLES
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        input.preferredStyles
      )
    ) {
      profile.preferredStyles =
        mergeValues(
          profile.preferredStyles,
          input.preferredStyles
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FABRICS
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        input.preferredFabrics
      )
    ) {
      profile.preferredFabrics =
        mergeValues(
          profile.preferredFabrics,
          input.preferredFabrics
        );
    }

    /*
    |--------------------------------------------------------------------------
    | OCCASIONS
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        input.preferredOccasions
      )
    ) {
      profile.preferredOccasions =
        mergeValues(
          profile.preferredOccasions,
          input.preferredOccasions
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MINIMUM BUDGET
    |--------------------------------------------------------------------------
    |
    | null means "do not change".
    |
    |--------------------------------------------------------------------------
    */

    if (
      typeof input.minBudget ===
      "number"
    ) {
      const minBudget =
        normalizeBudget(
          input.minBudget
        );

      if (
        minBudget !==
        null
      ) {
        profile.minBudget =
          minBudget;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | MAXIMUM BUDGET
    |--------------------------------------------------------------------------
    */

    if (
      typeof input.maxBudget ===
      "number"
    ) {
      const maxBudget =
        normalizeBudget(
          input.maxBudget
        );

      if (
        maxBudget !==
        null
      ) {
        profile.maxBudget =
          maxBudget;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | BUDGET CONSISTENCY
    |--------------------------------------------------------------------------
    */

    if (
      typeof profile.minBudget ===
        "number" &&
      typeof profile.maxBudget ===
        "number" &&
      profile.minBudget >
        profile.maxBudget
    ) {
      const temporary =
        profile.minBudget;

      profile.minBudget =
        profile.maxBudget;

      profile.maxBudget =
        temporary;
    }

    await profile.save();

    return {
      success:
        true,

      message:
        "Customer shopping preferences learned successfully.",

      profile:
        serializeProfile(
          profile
        ),
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN customer preference learning error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to update customer shopping preferences.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| RECORD PRODUCT INTERACTION
|--------------------------------------------------------------------------
|
| Behaviour memory is intentionally weaker than explicit preferences.
|
| This stores:
|
| viewed
| liked
| disliked
|
| It does NOT copy product attributes such as:
|
| color
| size
| price
| brand
|
| into explicit customer preferences.
|
|--------------------------------------------------------------------------
*/

export async function recordCustomerProductEvent(
  userId:
    string,
  input:
    CustomerProductEventInput
): Promise<
  CustomerLearningResult
> {
  try {
    if (
      !validateUserId(
        userId
      )
    ) {
      return {
        success:
          false,

        message:
          "Invalid customer id.",
      };
    }

    const productId =
      String(
        input.productId ||
          ""
      ).trim();

    if (
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

    if (
      ![
        "viewed",
        "liked",
        "disliked",
      ].includes(
        input.type
      )
    ) {
      return {
        success:
          false,

        message:
          "Invalid learning event.",
      };
    }

    const profile:
      any =
      await AIStyleProfile.findOneAndUpdate(
        {
          userId,
        },
        {
          $setOnInsert: {
            userId,

            preferredColors:
              [],

            dislikedColors:
              [],

            preferredSizes:
              [],

            preferredFits:
              [],

            preferredCategories:
              [],

            preferredBrands:
              [],

            preferredStyles:
              [],

            preferredFabrics:
              [],

            preferredOccasions:
              [],

            minBudget:
              null,

            maxBudget:
              null,

            likedProductIds:
              [],

            dislikedProductIds:
              [],

            viewedProductIds:
              [],

            personalizationEnabled:
              true,
          },
        },
        {
          new:
            true,

          upsert:
            true,

          setDefaultsOnInsert:
            true,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | PERSONALIZATION DISABLED
    |--------------------------------------------------------------------------
    */

    if (
      profile.personalizationEnabled ===
      false
    ) {
      return {
        success:
          true,

        message:
          "Personalization is disabled. Product interaction was not learned.",

        profile:
          serializeProfile(
            profile
          ),
      };
    }

    /*
    |--------------------------------------------------------------------------
    | VIEWED
    |--------------------------------------------------------------------------
    */

    if (
      input.type ===
      "viewed"
    ) {
      profile.viewedProductIds =
        addProductMemory(
          profile.viewedProductIds,
          productId
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LIKED
    |--------------------------------------------------------------------------
    */

    if (
      input.type ===
      "liked"
    ) {
      profile.likedProductIds =
        addProductMemory(
          profile.likedProductIds,
          productId
        );

      /*
      |--------------------------------------------------------------------------
      | LIKE / DISLIKE MUST NOT CONFLICT
      |--------------------------------------------------------------------------
      */

      profile.dislikedProductIds =
        removeProductMemory(
          profile.dislikedProductIds,
          productId
        );

      profile.viewedProductIds =
        addProductMemory(
          profile.viewedProductIds,
          productId
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DISLIKED
    |--------------------------------------------------------------------------
    */

    if (
      input.type ===
      "disliked"
    ) {
      profile.dislikedProductIds =
        addProductMemory(
          profile.dislikedProductIds,
          productId
        );

      profile.likedProductIds =
        removeProductMemory(
          profile.likedProductIds,
          productId
        );

      profile.viewedProductIds =
        addProductMemory(
          profile.viewedProductIds,
          productId
        );
    }

    await profile.save();

    return {
      success:
        true,

      message:
        `Customer product ${input.type} event learned successfully.`,

      profile:
        serializeProfile(
          profile
        ),
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN customer product learning error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to record customer product interaction.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| GET CUSTOMER LEARNING PROFILE
|--------------------------------------------------------------------------
*/

export async function getCustomerLearningProfile(
  userId:
    string
): Promise<
  CustomerLearningResult
> {
  try {
    if (
      !validateUserId(
        userId
      )
    ) {
      return {
        success:
          false,

        message:
          "Invalid customer id.",
      };
    }

    const profile =
      await AIStyleProfile.findOne(
        {
          userId,
        }
      ).lean();

    if (
      !profile
    ) {
      return {
        success:
          true,

        message:
          "No customer learning profile exists yet.",

        profile: {
          preferredColors:
            [],

          dislikedColors:
            [],

          preferredSizes:
            [],

          preferredFits:
            [],

          preferredCategories:
            [],

          preferredBrands:
            [],

          preferredStyles:
            [],

          preferredFabrics:
            [],

          preferredOccasions:
            [],

          minBudget:
            null,

          maxBudget:
            null,

          likedProductIds:
            [],

          dislikedProductIds:
            [],

          viewedProductIds:
            [],

          personalizationEnabled:
            true,
        },
      };
    }

    return {
      success:
        true,

      message:
        "Customer learning profile loaded successfully.",

      profile:
        serializeProfile(
          profile
        ),
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN customer learning profile load error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to load customer learning profile.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| CLEAR BEHAVIOUR MEMORY
|--------------------------------------------------------------------------
|
| This clears only behavioural product memory.
|
| Explicit preferences remain untouched.
|
|--------------------------------------------------------------------------
*/

export async function clearCustomerBehaviourMemory(
  userId:
    string
): Promise<
  CustomerLearningResult
> {
  try {
    if (
      !validateUserId(
        userId
      )
    ) {
      return {
        success:
          false,

        message:
          "Invalid customer id.",
      };
    }

    const profile:
      any =
      await AIStyleProfile.findOne(
        {
          userId,
        }
      );

    if (
      !profile
    ) {
      return {
        success:
          true,

        message:
          "No behaviour memory exists.",
      };
    }

    profile.likedProductIds =
      [];

    profile.dislikedProductIds =
      [];

    profile.viewedProductIds =
      [];

    await profile.save();

    return {
      success:
        true,

      message:
        "Customer behaviour memory cleared successfully.",

      profile:
        serializeProfile(
          profile
        ),
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN clear behaviour memory error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to clear customer behaviour memory.",
    };
  }
}