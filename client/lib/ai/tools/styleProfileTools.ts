import mongoose from "mongoose";

import AIStyleProfile from "@/models/AIStyleProfile";
import Product from "@/models/Product";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type UpdateStyleProfileInput = {
  preferredColors?:
    | string[]
    | null;

  dislikedColors?:
    | string[]
    | null;

  preferredSizes?:
    | string[]
    | null;

  preferredFits?:
    | string[]
    | null;

  preferredCategories?:
    | string[]
    | null;

  preferredBrands?:
    | string[]
    | null;

  preferredStyles?:
    | string[]
    | null;

  preferredFabrics?:
    | string[]
    | null;

  preferredOccasions?:
    | string[]
    | null;

  minBudget?:
    | number
    | null;

  maxBudget?:
    | number
    | null;

  likedProductId?:
    | string
    | null;

  dislikedProductId?:
    | string
    | null;

  viewedProductId?:
    | string
    | null;

  personalizationEnabled?:
    | boolean
    | null;
};

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_PROFILE_VALUES =
  50;

const MAX_PRODUCT_MEMORY =
  100;

/*
|--------------------------------------------------------------------------
| CLEAN STRING
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
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
  value: unknown
) {
  return cleanString(
    value
  ).toLowerCase();
}

/*
|--------------------------------------------------------------------------
| CLEAN ARRAY
|--------------------------------------------------------------------------
*/

function cleanArray(
  values: unknown
) {
  if (
    !Array.isArray(
      values
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

    result.push(
      clean
    );

    if (
      result.length >=
      MAX_PROFILE_VALUES
    ) {
      break;
    }
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| VALID OBJECT ID
|--------------------------------------------------------------------------
*/

function validObjectId(
  value: string
) {
  return (
    Boolean(
      value
    ) &&
    mongoose.Types.ObjectId.isValid(
      value
    )
  );
}

/*
|--------------------------------------------------------------------------
| CLEAN BUDGET
|--------------------------------------------------------------------------
*/

function cleanBudget(
  value: unknown
):
  | number
  | null {
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

  return Math.round(
    value
  );
}

/*
|--------------------------------------------------------------------------
| UNIQUE MERGE
|--------------------------------------------------------------------------
|
| Existing values stay first.
| Incoming values are added only when they are not already present.
|
|--------------------------------------------------------------------------
*/

function mergeValues(
  existing: unknown,
  incoming: unknown
) {
  const existingValues =
    cleanArray(
      existing
    );

  const incomingValues =
    cleanArray(
      incoming
    );

  const result =
    [
      ...existingValues,
    ];

  const seen =
    new Set(
      existingValues.map(
        (
          value
        ) =>
          normalizeKey(
            value
          )
      )
    );

  for (
    const value of
    incomingValues
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

    result.push(
      value
    );

    if (
      result.length >=
      MAX_PROFILE_VALUES
    ) {
      break;
    }
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| REMOVE VALUES CASE INSENSITIVELY
|--------------------------------------------------------------------------
*/

function removeValues(
  existing: unknown,
  valuesToRemove: unknown
) {
  const existingValues =
    cleanArray(
      existing
    );

  const removeKeys =
    new Set(
      cleanArray(
        valuesToRemove
      ).map(
        (
          value
        ) =>
          normalizeKey(
            value
          )
      )
    );

  return existingValues.filter(
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
| NORMALIZE PRODUCT MEMORY
|--------------------------------------------------------------------------
*/

function normalizeProductMemory(
  value: unknown
) {
  if (
    !Array.isArray(
      value
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
    const item of
    value
  ) {
    const id =
      String(
        item || ""
      ).trim();

    if (
      !id ||
      !validObjectId(
        id
      ) ||
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
| ADD PRODUCT TO MEMORY
|--------------------------------------------------------------------------
|
| Most recent item stays first.
|
|--------------------------------------------------------------------------
*/

function addProductToMemory(
  existing: unknown,
  productId: string
) {
  const current =
    normalizeProductMemory(
      existing
    ).filter(
      (
        id
      ) =>
        id !==
        productId
    );

  current.unshift(
    productId
  );

  return current.slice(
    0,
    MAX_PRODUCT_MEMORY
  );
}

/*
|--------------------------------------------------------------------------
| REMOVE PRODUCT FROM MEMORY
|--------------------------------------------------------------------------
*/

function removeProductFromMemory(
  existing: unknown,
  productId: string
) {
  return normalizeProductMemory(
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
  raw: any
) {
  return {
    id:
      String(
        raw?._id ||
          ""
      ),

    userId:
      String(
        raw?.userId ||
          ""
      ),

    preferredColors:
      cleanArray(
        raw?.preferredColors
      ),

    dislikedColors:
      cleanArray(
        raw?.dislikedColors
      ),

    preferredSizes:
      cleanArray(
        raw?.preferredSizes
      ),

    preferredFits:
      cleanArray(
        raw?.preferredFits
      ),

    preferredCategories:
      cleanArray(
        raw?.preferredCategories
      ),

    preferredBrands:
      cleanArray(
        raw?.preferredBrands
      ),

    preferredStyles:
      cleanArray(
        raw?.preferredStyles
      ),

    preferredFabrics:
      cleanArray(
        raw?.preferredFabrics
      ),

    preferredOccasions:
      cleanArray(
        raw?.preferredOccasions
      ),

    minBudget:
      typeof raw?.minBudget ===
        "number" &&
      Number.isFinite(
        raw.minBudget
      )
        ? raw.minBudget
        : null,

    maxBudget:
      typeof raw?.maxBudget ===
        "number" &&
      Number.isFinite(
        raw.maxBudget
      )
        ? raw.maxBudget
        : null,

    likedProductIds:
      normalizeProductMemory(
        raw?.likedProductIds
      ),

    dislikedProductIds:
      normalizeProductMemory(
        raw?.dislikedProductIds
      ),

    viewedProductIds:
      normalizeProductMemory(
        raw?.viewedProductIds
      ),

    personalizationEnabled:
      raw?.personalizationEnabled !==
      false,

    createdAt:
      raw?.createdAt ||
      null,

    updatedAt:
      raw?.updatedAt ||
      null,
  };
}

/*
|--------------------------------------------------------------------------
| EMPTY PROFILE
|--------------------------------------------------------------------------
*/

function createEmptyProfile(
  userId: string
) {
  return {
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
  };
}

/*
|--------------------------------------------------------------------------
| LOGIN REQUIRED
|--------------------------------------------------------------------------
*/

function loginRequired(
  message =
    "Please login to use personalized styling."
) {
  return {
    success:
      false,

    requiresLogin:
      true,

    message,
  };
}

/*
|--------------------------------------------------------------------------
| VALIDATE PRODUCT MEMORY ID
|--------------------------------------------------------------------------
*/

async function validateProductId(
  productId: string
) {
  if (
    !validObjectId(
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

  const exists =
    await Product.exists({
      _id:
        productId,

      isDeleted: {
        $ne:
          true,
      },
    });

  if (
    !exists
  ) {
    return {
      success:
        false,

      message:
        "Product not found.",
    };
  }

  return {
    success:
      true,
  };
}

/*
|--------------------------------------------------------------------------
| GET STYLE PROFILE
|--------------------------------------------------------------------------
*/

export async function getAIStyleProfile(
  userId:
    | string
    | null
) {
  if (
    !userId
  ) {
    return loginRequired();
  }

  if (
    !validObjectId(
      userId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid customer account.",
    };
  }

  const profile =
    await AIStyleProfile.findOne({
      userId,
    }).lean();

  if (
    !profile
  ) {
    return {
      success:
        true,

      exists:
        false,

      profile:
        createEmptyProfile(
          userId
        ),

      message:
        "No saved style preferences yet.",
    };
  }

  return {
    success:
      true,

    exists:
      true,

    profile:
      serializeProfile(
        profile
      ),

    message:
      "Style preferences loaded successfully.",
  };
}

/*
|--------------------------------------------------------------------------
| GET OR CREATE PROFILE
|--------------------------------------------------------------------------
*/

async function getOrCreateProfile(
  userId: string
) {
  let profile =
    await AIStyleProfile.findOne({
      userId,
    });

  if (
    profile
  ) {
    return profile;
  }

  try {
    profile =
      await AIStyleProfile.create({
        userId,
      });

    return profile;
  } catch (
    error: any
  ) {
    /*
    |--------------------------------------------------------------------------
    | DUPLICATE CREATE RACE
    |--------------------------------------------------------------------------
    |
    | userId should be unique.
    | Two concurrent requests may both attempt profile creation.
    |
    */

    if (
      error?.code ===
      11000
    ) {
      profile =
        await AIStyleProfile.findOne({
          userId,
        });

      if (
        profile
      ) {
        return profile;
      }
    }

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE STYLE PROFILE
|--------------------------------------------------------------------------
*/

export async function updateAIStyleProfile(
  userId:
    | string
    | null,
  input:
    UpdateStyleProfileInput
) {
  /*
  |--------------------------------------------------------------------------
  | AUTH
  |--------------------------------------------------------------------------
  */

  if (
    !userId
  ) {
    return loginRequired();
  }

  if (
    !validObjectId(
      userId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid customer account.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDATE PRODUCT IDS BEFORE MUTATING PROFILE
  |--------------------------------------------------------------------------
  |
  | Like/dislike actions are explicit durable preferences, so invalid product
  | references should fail before any profile changes are saved.
  |
  */

  const likedProductId =
    cleanString(
      input.likedProductId
    );

  const dislikedProductId =
    cleanString(
      input.dislikedProductId
    );

  const viewedProductId =
    cleanString(
      input.viewedProductId
    );

  if (
    likedProductId
  ) {
    const validation =
      await validateProductId(
        likedProductId
      );

    if (
      !validation.success
    ) {
      return validation;
    }
  }

  if (
    dislikedProductId
  ) {
    const validation =
      await validateProductId(
        dislikedProductId
      );

    if (
      !validation.success
    ) {
      return validation;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PROFILE
  |--------------------------------------------------------------------------
  */

  const profile:
    any =
    await getOrCreateProfile(
      userId
    );

  /*
  |--------------------------------------------------------------------------
  | ARRAY PREFERENCES
  |--------------------------------------------------------------------------
  |
  | Semantics:
  |
  | null      = no change
  | undefined = no change
  | []        = no new values
  | ["Black"] = merge Black into existing preference
  |
  | Individual deletion is intentionally not inferred.
  |
  */

  const arrayUpdates: Array<{
    field:
      | "preferredColors"
      | "dislikedColors"
      | "preferredSizes"
      | "preferredFits"
      | "preferredCategories"
      | "preferredBrands"
      | "preferredStyles"
      | "preferredFabrics"
      | "preferredOccasions";

    value:
      unknown;
  }> = [
    {
      field:
        "preferredColors",

      value:
        input.preferredColors,
    },

    {
      field:
        "dislikedColors",

      value:
        input.dislikedColors,
    },

    {
      field:
        "preferredSizes",

      value:
        input.preferredSizes,
    },

    {
      field:
        "preferredFits",

      value:
        input.preferredFits,
    },

    {
      field:
        "preferredCategories",

      value:
        input.preferredCategories,
    },

    {
      field:
        "preferredBrands",

      value:
        input.preferredBrands,
    },

    {
      field:
        "preferredStyles",

      value:
        input.preferredStyles,
    },

    {
      field:
        "preferredFabrics",

      value:
        input.preferredFabrics,
    },

    {
      field:
        "preferredOccasions",

      value:
        input.preferredOccasions,
    },
  ];

  for (
    const update of
    arrayUpdates
  ) {
    if (
      update.value ===
        undefined ||
      update.value ===
        null
    ) {
      continue;
    }

    profile[
      update.field
    ] =
      mergeValues(
        profile[
          update.field
        ],
        update.value
      );
  }

  /*
  |--------------------------------------------------------------------------
  | COLOR CONFLICT RESOLUTION
  |--------------------------------------------------------------------------
  |
  | If Black becomes preferred, remove Black from dislikedColors.
  |
  | If Yellow becomes disliked, remove Yellow from preferredColors.
  |
  */

  if (
    Array.isArray(
      input.preferredColors
    ) &&
    input.preferredColors.length >
      0
  ) {
    profile.dislikedColors =
      removeValues(
        profile.dislikedColors,
        input.preferredColors
      );
  }

  if (
    Array.isArray(
      input.dislikedColors
    ) &&
    input.dislikedColors.length >
      0
  ) {
    profile.preferredColors =
      removeValues(
        profile.preferredColors,
        input.dislikedColors
      );
  }

  /*
  |--------------------------------------------------------------------------
  | BUDGET
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Tool definition uses:
  |
  | null = no change
  |
  | This prevents an unrelated style update from accidentally deleting the
  | customer's saved budget.
  |
  */

  if (
    typeof input.minBudget ===
    "number"
  ) {
    const minBudget =
      cleanBudget(
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

  if (
    typeof input.maxBudget ===
    "number"
  ) {
    const maxBudget =
      cleanBudget(
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
  | NORMALIZE BUDGET RANGE
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
    const previousMin =
      profile.minBudget;

    profile.minBudget =
      profile.maxBudget;

    profile.maxBudget =
      previousMin;
  }

  /*
  |--------------------------------------------------------------------------
  | PERSONALIZATION
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
  | LIKED PRODUCT
  |--------------------------------------------------------------------------
  */

  if (
    likedProductId
  ) {
    profile.likedProductIds =
      addProductToMemory(
        profile.likedProductIds,
        likedProductId
      );

    profile.dislikedProductIds =
      removeProductFromMemory(
        profile.dislikedProductIds,
        likedProductId
      );
  }

  /*
  |--------------------------------------------------------------------------
  | DISLIKED PRODUCT
  |--------------------------------------------------------------------------
  */

  if (
    dislikedProductId
  ) {
    profile.dislikedProductIds =
      addProductToMemory(
        profile.dislikedProductIds,
        dislikedProductId
      );

    profile.likedProductIds =
      removeProductFromMemory(
        profile.likedProductIds,
        dislikedProductId
      );
  }

  /*
  |--------------------------------------------------------------------------
  | VIEWED PRODUCT
  |--------------------------------------------------------------------------
  |
  | Viewed memory is passive personalization data.
  |
  | If a stale/nonexistent product ID reaches this field, do not fail an
  | otherwise valid style-preference update.
  |
  */

  if (
    viewedProductId &&
    validObjectId(
      viewedProductId
    )
  ) {
    const validation =
      await validateProductId(
        viewedProductId
      );

    if (
      validation.success
    ) {
      profile.viewedProductIds =
        addProductToMemory(
          profile.viewedProductIds,
          viewedProductId
        );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FINAL NORMALIZATION
  |--------------------------------------------------------------------------
  */

  profile.preferredColors =
    cleanArray(
      profile.preferredColors
    );

  profile.dislikedColors =
    cleanArray(
      profile.dislikedColors
    );

  profile.preferredSizes =
    cleanArray(
      profile.preferredSizes
    );

  profile.preferredFits =
    cleanArray(
      profile.preferredFits
    );

  profile.preferredCategories =
    cleanArray(
      profile.preferredCategories
    );

  profile.preferredBrands =
    cleanArray(
      profile.preferredBrands
    );

  profile.preferredStyles =
    cleanArray(
      profile.preferredStyles
    );

  profile.preferredFabrics =
    cleanArray(
      profile.preferredFabrics
    );

  profile.preferredOccasions =
    cleanArray(
      profile.preferredOccasions
    );

  profile.likedProductIds =
    normalizeProductMemory(
      profile.likedProductIds
    );

  profile.dislikedProductIds =
    normalizeProductMemory(
      profile.dislikedProductIds
    );

  profile.viewedProductIds =
    normalizeProductMemory(
      profile.viewedProductIds
    );

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  await profile.save();

  return {
    success:
      true,

    profile:
      serializeProfile(
        profile.toObject()
      ),

    message:
      "Style preferences updated successfully.",
  };
}

/*
|--------------------------------------------------------------------------
| CLEAR STYLE PROFILE
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This function performs the actual clear operation.
|
| The confirmation gate is intentionally NOT implemented here because:
|
| chat/route.ts
|      ↓
| executeAITool.ts
|      ↓
| clearAIStyleProfile()
|
| must authorize the action before this function is reached.
|
|--------------------------------------------------------------------------
*/

export async function clearAIStyleProfile(
  userId:
    | string
    | null
) {
  if (
    !userId
  ) {
    return loginRequired(
      "Please login to clear your saved style preferences."
    );
  }

  if (
    !validObjectId(
      userId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid customer account.",
    };
  }

  const profile =
    await AIStyleProfile.findOne({
      userId,
    });

  /*
  |--------------------------------------------------------------------------
  | NOTHING SAVED
  |--------------------------------------------------------------------------
  */

  if (
    !profile
  ) {
    return {
      success:
        true,

      exists:
        false,

      profile:
        createEmptyProfile(
          userId
        ),

      message:
        "No saved style preferences found.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CLEAR DURABLE STYLE MEMORY
  |--------------------------------------------------------------------------
  */

  profile.preferredColors =
    [];

  profile.dislikedColors =
    [];

  profile.preferredSizes =
    [];

  profile.preferredFits =
    [];

  profile.preferredCategories =
    [];

  profile.preferredBrands =
    [];

  profile.preferredStyles =
    [];

  profile.preferredFabrics =
    [];

  profile.preferredOccasions =
    [];

  profile.minBudget =
    null;

  profile.maxBudget =
    null;

  profile.likedProductIds =
    [];

  profile.dislikedProductIds =
    [];

  profile.viewedProductIds =
    [];

  /*
  |--------------------------------------------------------------------------
  | KEEP PERSONALIZATION SETTING
  |--------------------------------------------------------------------------
  |
  | Clear Style means:
  |
  | clear remembered preferences
  |
  | It does NOT silently enable/disable personalization.
  |
  */

  await profile.save();

  return {
    success:
      true,

    exists:
      true,

    profile:
      serializeProfile(
        profile.toObject()
      ),

    message:
      "Saved style preferences cleared successfully.",
  };
}