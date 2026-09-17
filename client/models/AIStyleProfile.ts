import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

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
| STYLE PROFILE DOCUMENT
|--------------------------------------------------------------------------
*/

export interface IAIStyleProfile
  extends Document {
  userId:
    Types.ObjectId;

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
    Types.ObjectId[];

  dislikedProductIds:
    Types.ObjectId[];

  viewedProductIds:
    Types.ObjectId[];

  personalizationEnabled:
    boolean;

  createdAt:
    Date;

  updatedAt:
    Date;
}

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
      clean.toLowerCase();

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
| NORMALIZE OBJECT ID ARRAY
|--------------------------------------------------------------------------
*/

function normalizeObjectIdArray(
  values:
    unknown,
  limit:
    number
) {
  if (
    !Array.isArray(
      values
    )
  ) {
    return [];
  }

  const result:
    Types.ObjectId[] =
    [];

  const seen =
    new Set<string>();

  for (
    const value of
    values
  ) {
    const raw =
      value instanceof
      mongoose.Types.ObjectId
        ? value.toString()
        : String(
            value || ""
          ).trim();

    if (
      !mongoose.Types.ObjectId.isValid(
        raw
      )
    ) {
      continue;
    }

    const normalized =
      new mongoose.Types.ObjectId(
        raw
      );

    const key =
      normalized.toString();

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
      normalized
    );

    if (
      result.length >=
      limit
    ) {
      break;
    }
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE BUDGET
|--------------------------------------------------------------------------
*/

function normalizeBudget(
  value: unknown
):
  | number
  | null {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return null;
  }

  const numberValue =
    Number(
      value
    );

  if (
    !Number.isFinite(
      numberValue
    ) ||
    numberValue < 0
  ) {
    return null;
  }

  return Math.round(
    numberValue
  );
}

/*
|--------------------------------------------------------------------------
| SCHEMA
|--------------------------------------------------------------------------
*/

const AIStyleProfileSchema =
  new Schema<IAIStyleProfile>(
    {
      /*
      |--------------------------------------------------------------------------
      | CUSTOMER
      |--------------------------------------------------------------------------
      */

      userId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | COLORS
      |--------------------------------------------------------------------------
      */

      preferredColors: {
        type:
          [String],

        default:
          [],
      },

      dislikedColors: {
        type:
          [String],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | SIZE
      |--------------------------------------------------------------------------
      */

      preferredSizes: {
        type:
          [String],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | FIT
      |--------------------------------------------------------------------------
      */

      preferredFits: {
        type:
          [String],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | CATEGORIES
      |--------------------------------------------------------------------------
      */

      preferredCategories: {
        type:
          [String],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | BRANDS
      |--------------------------------------------------------------------------
      */

      preferredBrands: {
        type:
          [String],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | STYLES
      |--------------------------------------------------------------------------
      */

      preferredStyles: {
        type:
          [String],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | FABRICS
      |--------------------------------------------------------------------------
      */

      preferredFabrics: {
        type:
          [String],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | OCCASIONS
      |--------------------------------------------------------------------------
      */

      preferredOccasions: {
        type:
          [String],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | BUDGET
      |--------------------------------------------------------------------------
      */

      minBudget: {
        type:
          Number,

        default:
          null,

        min:
          0,
      },

      maxBudget: {
        type:
          Number,

        default:
          null,

        min:
          0,
      },

      /*
      |--------------------------------------------------------------------------
      | LIKED PRODUCTS
      |--------------------------------------------------------------------------
      */

      likedProductIds: {
        type: [
          {
            type:
              Schema.Types.ObjectId,

            ref:
              "Product",
          },
        ],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | DISLIKED PRODUCTS
      |--------------------------------------------------------------------------
      */

      dislikedProductIds: {
        type: [
          {
            type:
              Schema.Types.ObjectId,

            ref:
              "Product",
          },
        ],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | VIEWED PRODUCTS
      |--------------------------------------------------------------------------
      */

      viewedProductIds: {
        type: [
          {
            type:
              Schema.Types.ObjectId,

            ref:
              "Product",
          },
        ],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | PERSONALIZATION
      |--------------------------------------------------------------------------
      */

      personalizationEnabled: {
        type:
          Boolean,

        default:
          true,
      },
    },
    {
      timestamps:
        true,

      versionKey:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| PRE VALIDATE NORMALIZATION
|--------------------------------------------------------------------------
|
| Mongoose 9 compatible.
|
| Do NOT add `next`.
|
|--------------------------------------------------------------------------
*/

AIStyleProfileSchema.pre(
  "validate",
  function () {
    /*
    |--------------------------------------------------------------------------
    | STRING ARRAYS
    |--------------------------------------------------------------------------
    */

    this.preferredColors =
      normalizeStringArray(
        this.preferredColors
      );

    this.dislikedColors =
      normalizeStringArray(
        this.dislikedColors
      );

    this.preferredSizes =
      normalizeStringArray(
        this.preferredSizes
      );

    this.preferredFits =
      normalizeStringArray(
        this.preferredFits
      );

    this.preferredCategories =
      normalizeStringArray(
        this.preferredCategories
      );

    this.preferredBrands =
      normalizeStringArray(
        this.preferredBrands
      );

    this.preferredStyles =
      normalizeStringArray(
        this.preferredStyles
      );

    this.preferredFabrics =
      normalizeStringArray(
        this.preferredFabrics
      );

    this.preferredOccasions =
      normalizeStringArray(
        this.preferredOccasions
      );

    /*
    |--------------------------------------------------------------------------
    | COLOR CONFLICT PROTECTION
    |--------------------------------------------------------------------------
    |
    | styleProfileTools.ts normally resolves the latest explicit preference.
    |
    | This model-level protection guarantees that a color can never remain in
    | both preferredColors and dislikedColors at the same time.
    |
    | If legacy/dirty data contains both, dislikedColors wins here.
    |
    */

    const dislikedColorKeys =
      new Set(
        this.dislikedColors.map(
          (
            color
          ) =>
            color.toLowerCase()
        )
      );

    this.preferredColors =
      this.preferredColors.filter(
        (
          color
        ) =>
          !dislikedColorKeys.has(
            color.toLowerCase()
          )
      );

    /*
    |--------------------------------------------------------------------------
    | BUDGET
    |--------------------------------------------------------------------------
    */

    this.minBudget =
      normalizeBudget(
        this.minBudget
      );

    this.maxBudget =
      normalizeBudget(
        this.maxBudget
      );

    /*
    |--------------------------------------------------------------------------
    | FIX REVERSED BUDGET RANGE
    |--------------------------------------------------------------------------
    */

    if (
      typeof this.minBudget ===
        "number" &&
      typeof this.maxBudget ===
        "number" &&
      this.minBudget >
        this.maxBudget
    ) {
      const previousMin =
        this.minBudget;

      this.minBudget =
        this.maxBudget;

      this.maxBudget =
        previousMin;
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT MEMORY
    |--------------------------------------------------------------------------
    */

    this.likedProductIds =
      normalizeObjectIdArray(
        this.likedProductIds,
        MAX_PRODUCT_MEMORY
      );

    this.dislikedProductIds =
      normalizeObjectIdArray(
        this.dislikedProductIds,
        MAX_PRODUCT_MEMORY
      );

    this.viewedProductIds =
      normalizeObjectIdArray(
        this.viewedProductIds,
        MAX_PRODUCT_MEMORY
      );

    /*
    |--------------------------------------------------------------------------
    | LIKED / DISLIKED PRODUCT CONFLICT
    |--------------------------------------------------------------------------
    |
    | A product must never exist in both lists.
    |
    | styleProfileTools.ts resolves the latest explicit action before save.
    |
    | For old conflicting database data, disliked wins at schema level.
    |
    */

    const dislikedProductKeys =
      new Set(
        this.dislikedProductIds.map(
          (
            id
          ) =>
            id.toString()
        )
      );

    this.likedProductIds =
      this.likedProductIds.filter(
        (
          id
        ) =>
          !dislikedProductKeys.has(
            id.toString()
          )
      );

    /*
    |--------------------------------------------------------------------------
    | PERSONALIZATION DEFAULT PROTECTION
    |--------------------------------------------------------------------------
    */

    if (
      typeof this
        .personalizationEnabled !==
      "boolean"
    ) {
      this.personalizationEnabled =
        true;
    }
  }
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| ONE STYLE PROFILE PER CUSTOMER
|--------------------------------------------------------------------------
|
| This is the only userId index definition.
|
| Do not also add index:true / unique:true directly to the userId field,
| otherwise Mongoose can report duplicate index warnings.
|
|--------------------------------------------------------------------------
*/

AIStyleProfileSchema.index(
  {
    userId:
      1,
  },
  {
    unique:
      true,
    name:
      "unique_ai_style_profile_user",
  }
);

/*
|--------------------------------------------------------------------------
| PERSONALIZATION ADMIN / ANALYTICS
|--------------------------------------------------------------------------
*/

AIStyleProfileSchema.index(
  {
    personalizationEnabled:
      1,

    updatedAt:
      -1,
  },
  {
    name:
      "ai_style_personalization_updated",
  }
);

/*
|--------------------------------------------------------------------------
| RECENTLY UPDATED STYLE PROFILES
|--------------------------------------------------------------------------
*/

AIStyleProfileSchema.index(
  {
    updatedAt:
      -1,
  },
  {
    name:
      "ai_style_updated_at",
  }
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const AIStyleProfile =
  (
    mongoose.models
      .AIStyleProfile as
      Model<IAIStyleProfile>
  ) ||
  mongoose.model<IAIStyleProfile>(
    "AIStyleProfile",
    AIStyleProfileSchema
  );

export default AIStyleProfile;