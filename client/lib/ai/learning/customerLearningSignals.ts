/*
|--------------------------------------------------------------------------
| SILENTGEN CUSTOMER LEARNING SIGNALS
|--------------------------------------------------------------------------
|
| Converts customer chat text into controlled shopping-memory candidates.
|
| IMPORTANT:
|
| This file DOES NOT write to MongoDB.
|
| It only extracts safe candidate preferences.
|
| Actual persistence should be done by:
|
| learnCustomerPreferences()
|
| from:
|
| @/lib/ai/learning/customerLearning
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type CustomerLearningConfidence =
  | "high"
  | "medium"
  | "low";

export type CustomerLearningSignalType =
  | "preferred_color"
  | "disliked_color"
  | "preferred_size"
  | "preferred_fit"
  | "preferred_category"
  | "preferred_brand"
  | "preferred_style"
  | "preferred_fabric"
  | "preferred_occasion"
  | "min_budget"
  | "max_budget";

export type CustomerLearningSignal = {
  type:
    CustomerLearningSignalType;

  value:
    string | number;

  confidence:
    CustomerLearningConfidence;

  explicit:
    boolean;

  sourceText:
    string;
};

export type CustomerLearningSignalResult = {
  success:
    boolean;

  shouldLearn:
    boolean;

  message:
    string;

  signals:
    CustomerLearningSignal[];

  preferences: {
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
  };

  ignoredReasons:
    string[];
};

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_MESSAGE_LENGTH =
  4000;

const MAX_SIGNAL_VALUES =
  20;

const MAX_VALUE_LENGTH =
  80;

const MAX_BUDGET =
  10_000_000;

/*
|--------------------------------------------------------------------------
| KNOWN COLORS
|--------------------------------------------------------------------------
*/

const COLORS = [
  "black",
  "white",
  "navy",
  "navy blue",
  "blue",
  "light blue",
  "sky blue",
  "royal blue",
  "premium blue",
  "grey",
  "gray",
  "charcoal",
  "red",
  "maroon",
  "burgundy",
  "green",
  "olive",
  "dark green",
  "mint",
  "yellow",
  "mustard",
  "orange",
  "brown",
  "beige",
  "cream",
  "off white",
  "off-white",
  "ivory",
  "pink",
  "purple",
  "lavender",
  "peach",
  "khaki",
  "teal",
  "cyan",
];

/*
|--------------------------------------------------------------------------
| KNOWN SIZES
|--------------------------------------------------------------------------
*/

const SIZES = [
  "xxs",
  "xs",
  "s",
  "m",
  "l",
  "xl",
  "xxl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "free size",
];

/*
|--------------------------------------------------------------------------
| KNOWN FITS
|--------------------------------------------------------------------------
*/

const FITS = [
  "slim fit",
  "regular fit",
  "relaxed fit",
  "oversized",
  "oversize",
  "loose fit",
  "skinny fit",
  "straight fit",
  "tapered fit",
  "comfort fit",
  "classic fit",
];

/*
|--------------------------------------------------------------------------
| KNOWN STYLES
|--------------------------------------------------------------------------
*/

const STYLES = [
  "casual",
  "formal",
  "smart casual",
  "streetwear",
  "minimal",
  "minimalist",
  "premium",
  "luxury",
  "classic",
  "sporty",
  "athleisure",
  "vintage",
  "modern",
  "trendy",
  "business casual",
  "party wear",
  "ethnic",
  "western",
];

/*
|--------------------------------------------------------------------------
| KNOWN FABRICS
|--------------------------------------------------------------------------
*/

const FABRICS = [
  "cotton",
  "pure cotton",
  "organic cotton",
  "polyester",
  "linen",
  "denim",
  "silk",
  "wool",
  "rayon",
  "viscose",
  "nylon",
  "fleece",
  "jersey",
  "lycra",
  "spandex",
  "corduroy",
];

/*
|--------------------------------------------------------------------------
| KNOWN CATEGORIES
|--------------------------------------------------------------------------
*/

const CATEGORIES = [
  "t-shirt",
  "tshirt",
  "t shirt",
  "shirt",
  "shirts",
  "jeans",
  "trouser",
  "trousers",
  "pants",
  "pant",
  "hoodie",
  "hoodies",
  "sweatshirt",
  "jacket",
  "jackets",
  "shorts",
  "polo",
  "polo t-shirt",
  "kurta",
  "dress",
  "top",
  "tops",
  "skirt",
  "shoes",
  "sneakers",
  "watch",
  "watches",
  "bag",
  "bags",
  "accessories",
];

/*
|--------------------------------------------------------------------------
| KNOWN OCCASIONS
|--------------------------------------------------------------------------
*/

const OCCASIONS = [
  "office",
  "work",
  "college",
  "daily wear",
  "everyday",
  "casual outing",
  "party",
  "wedding",
  "festival",
  "festive",
  "date",
  "travel",
  "vacation",
  "gym",
  "workout",
  "sports",
  "business meeting",
  "interview",
];

/*
|--------------------------------------------------------------------------
| STRONG PREFERENCE PHRASES
|--------------------------------------------------------------------------
*/

const STRONG_PREFERENCE_PATTERNS = [
  /\bi prefer\b/i,
  /\bi like\b/i,
  /\bi love\b/i,
  /\bmy favorite\b/i,
  /\bmy favourite\b/i,
  /\bmy preferred\b/i,
  /\busually wear\b/i,
  /\bi usually wear\b/i,
  /\bmy size is\b/i,
  /\bi wear size\b/i,
  /\bi always wear\b/i,
  /\bmujhe .* pasand\b/i,
  /\bmujhe .* पसंद\b/i,
  /\bmera size\b/i,
  /\bmeri size\b/i,
  /મને .* ગમે/i,
  /મને .* પસંદ/i,
  /મારો સાઇઝ/i,
  /મારી સાઇઝ/i,
  /મારો size/i,
  /મારી size/i,
];

/*
|--------------------------------------------------------------------------
| DISLIKE PHRASES
|--------------------------------------------------------------------------
*/

const DISLIKE_PATTERNS = [
  /\bi dislike\b/i,
  /\bi hate\b/i,
  /\bi don't like\b/i,
  /\bi do not like\b/i,
  /\bnot my style\b/i,
  /\bavoid\b/i,
  /\bmujhe .* pasand nahi\b/i,
  /\bmujhe .* पसंद नहीं\b/i,
  /મને .* નથી ગમતું/i,
  /મને .* નથી ગમતા/i,
  /મને .* પસંદ નથી/i,
];

/*
|--------------------------------------------------------------------------
| TEMPORARY INTENT
|--------------------------------------------------------------------------
|
| These phrases often represent only the current shopping task.
|
| Example:
|
| "Show me black t-shirts today"
|
| should not automatically mean:
|
| preferredColors = black forever
|
|--------------------------------------------------------------------------
*/

const TEMPORARY_REQUEST_PATTERNS = [
  /\bshow me\b/i,
  /\bfind me\b/i,
  /\bsearch for\b/i,
  /\blooking for\b/i,
  /\bi need\b/i,
  /\bi want to buy\b/i,
  /\btoday\b/i,
  /\bright now\b/i,
  /\bfor this order\b/i,
  /\bfor this occasion\b/i,
  /\bfor my friend\b/i,
  /\bfor my brother\b/i,
  /\bfor my sister\b/i,
  /\bfor my father\b/i,
  /\bfor my mother\b/i,
  /\bfor someone\b/i,
  /\bgift\b/i,
  /\bdikhao\b/i,
  /\bchahiye\b/i,
  /બતાવો/i,
  /જોઈએ/i,
  /શોધો/i,
];

/*
|--------------------------------------------------------------------------
| SENSITIVE / PROTECTED INFORMATION
|--------------------------------------------------------------------------
|
| Never create shopping memory from these topics.
|
|--------------------------------------------------------------------------
*/

const SENSITIVE_PATTERNS = [
  /\breligion\b/i,
  /\breligious\b/i,
  /\bhindu\b/i,
  /\bmuslim\b/i,
  /\bchristian\b/i,
  /\bsikh\b/i,
  /\bjain\b/i,
  /\bcaste\b/i,

  /\bpolitical\b/i,
  /\bpolitics\b/i,
  /\bparty member\b/i,

  /\bmedical\b/i,
  /\bdisease\b/i,
  /\bdiagnosis\b/i,
  /\bdiabetes\b/i,
  /\bcancer\b/i,
  /\bpregnant\b/i,
  /\bpregnancy\b/i,

  /\bsexual orientation\b/i,
  /\bgay\b/i,
  /\blesbian\b/i,
  /\bbisexual\b/i,

  /\brace\b/i,
  /\bethnicity\b/i,

  /\bcriminal\b/i,
  /\bcriminal record\b/i,

  /\bincome\b/i,
  /\bsalary\b/i,
  /\bbank account\b/i,
  /\bcredit card\b/i,
];

/*
|--------------------------------------------------------------------------
| SECRET DATA
|--------------------------------------------------------------------------
*/

const SECRET_PATTERNS = [
  /\bpassword\b/i,
  /\botp\b/i,
  /\bone time password\b/i,
  /\bapi key\b/i,
  /\bsecret key\b/i,
  /\baccess token\b/i,
  /\brefresh token\b/i,
  /\bauth token\b/i,
  /\bcredit card number\b/i,
  /\bcvv\b/i,
  /\bpin number\b/i,
];

/*
|--------------------------------------------------------------------------
| CLEAN STRING
|--------------------------------------------------------------------------
*/

function cleanString(
  value:
    unknown,
  maxLength =
    MAX_VALUE_LENGTH
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
      maxLength
    );
}

/*
|--------------------------------------------------------------------------
| NORMALIZED TEXT
|--------------------------------------------------------------------------
*/

function normalizeText(
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
    .slice(
      0,
      MAX_MESSAGE_LENGTH
    )
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
    string
) {
  return value
    .trim()
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| UNIQUE VALUES
|--------------------------------------------------------------------------
*/

function uniqueStrings(
  values:
    string[]
) {
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
      MAX_SIGNAL_VALUES
    ) {
      break;
    }
  }

  return output;
}

/*
|--------------------------------------------------------------------------
| CONTAINS ANY PATTERN
|--------------------------------------------------------------------------
*/

function containsPattern(
  text:
    string,
  patterns:
    RegExp[]
) {
  return patterns.some(
    (
      pattern
    ) =>
      pattern.test(
        text
      )
  );
}

/*
|--------------------------------------------------------------------------
| ESCAPE REGEX
|--------------------------------------------------------------------------
*/

function escapeRegex(
  value:
    string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/*
|--------------------------------------------------------------------------
| FIND KNOWN VALUES
|--------------------------------------------------------------------------
*/

function findKnownValues(
  text:
    string,
  values:
    string[]
) {
  const found:
    string[] =
    [];

  const lower =
    text.toLowerCase();

  const sorted =
    [
      ...values,
    ].sort(
      (
        first,
        second
      ) =>
        second.length -
        first.length
    );

  for (
    const value of
    sorted
  ) {
    const regex =
      new RegExp(
        `(^|[^a-z0-9])${escapeRegex(
          value.toLowerCase()
        )}([^a-z0-9]|$)`,
        "i"
      );

    if (
      regex.test(
        lower
      )
    ) {
      found.push(
        value
      );
    }
  }

  return uniqueStrings(
    found
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE SIZE
|--------------------------------------------------------------------------
*/

function normalizeSize(
  value:
    string
) {
  const clean =
    value
      .trim()
      .toUpperCase();

  if (
    clean ===
    "2XL"
  ) {
    return "XXL";
  }

  return clean;
}

/*
|--------------------------------------------------------------------------
| FIND SIZES
|--------------------------------------------------------------------------
*/

function findSizes(
  text:
    string
) {
  return uniqueStrings(
    findKnownValues(
      text,
      SIZES
    ).map(
      normalizeSize
    )
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE FIT
|--------------------------------------------------------------------------
*/

function normalizeFit(
  value:
    string
) {
  const clean =
    normalizeKey(
      value
    );

  if (
    clean ===
    "oversize"
  ) {
    return "Oversized";
  }

  return clean
    .split(
      " "
    )
    .map(
      (
        part
      ) =>
        part
          ? part[0]
              .toUpperCase() +
            part.slice(
              1
            )
          : ""
    )
    .join(
      " "
    );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE CATEGORY
|--------------------------------------------------------------------------
*/

function normalizeCategory(
  value:
    string
) {
  const key =
    normalizeKey(
      value
    );

  const aliases:
    Record<
      string,
      string
    > = {
    tshirt:
      "T-Shirt",

    "t shirt":
      "T-Shirt",

    "t-shirt":
      "T-Shirt",

    shirts:
      "Shirt",

    shirt:
      "Shirt",

    jeans:
      "Jeans",

    trouser:
      "Trouser",

    trousers:
      "Trouser",

    pant:
      "Trouser",

    pants:
      "Trouser",

    hoodie:
      "Hoodie",

    hoodies:
      "Hoodie",

    sweatshirt:
      "Sweatshirt",

    jacket:
      "Jacket",

    jackets:
      "Jacket",

    shorts:
      "Shorts",

    polo:
      "Polo T-Shirt",

    "polo t-shirt":
      "Polo T-Shirt",

    kurta:
      "Kurta",

    dress:
      "Dress",

    top:
      "Top",

    tops:
      "Top",

    skirt:
      "Skirt",

    shoes:
      "Shoes",

    sneakers:
      "Sneakers",

    watch:
      "Watch",

    watches:
      "Watch",

    bag:
      "Bag",

    bags:
      "Bag",

    accessories:
      "Accessories",
  };

  return aliases[
    key
  ] ||
    value;
}

/*
|--------------------------------------------------------------------------
| TITLE CASE
|--------------------------------------------------------------------------
*/

function titleCase(
  value:
    string
) {
  return value
    .trim()
    .split(
      /\s+/
    )
    .map(
      (
        part
      ) => {
        if (
          !part
        ) {
          return "";
        }

        return (
          part[0]
            .toUpperCase() +
          part
            .slice(
              1
            )
            .toLowerCase()
        );
      }
    )
    .join(
      " "
    );
}

/*
|--------------------------------------------------------------------------
| BUDGET PARSER
|--------------------------------------------------------------------------
*/

function parseMoneyValue(
  raw:
    string
):
  number | null {
  const clean =
    raw
      .replace(
        /,/g,
        ""
      )
      .trim()
      .toLowerCase();

  const match =
    clean.match(
      /^(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lac)?$/
    );

  if (
    !match
  ) {
    return null;
  }

  let value =
    Number(
      match[1]
    );

  if (
    !Number.isFinite(
      value
    )
  ) {
    return null;
  }

  const unit =
    match[2] ||
    "";

  if (
    unit ===
      "k" ||
    unit ===
      "thousand"
  ) {
    value *=
      1000;
  }

  if (
    unit ===
      "lakh" ||
    unit ===
      "lac"
  ) {
    value *=
      100000;
  }

  value =
    Math.round(
      value
    );

  if (
    value < 0 ||
    value >
      MAX_BUDGET
  ) {
    return null;
  }

  return value;
}

/*
|--------------------------------------------------------------------------
| EXTRACT BUDGET
|--------------------------------------------------------------------------
*/

function extractBudget(
  text:
    string
) {
  let minBudget:
    number | null =
    null;

  let maxBudget:
    number | null =
    null;

  /*
  |--------------------------------------------------------------------------
  | RANGE
  |--------------------------------------------------------------------------
  |
  | 1000 to 2000
  | 1000-2000
  | ₹1000 to ₹2000
  |
  |--------------------------------------------------------------------------
  */

  const rangeMatch =
    text.match(
      /(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?\s*(?:k|thousand|lakh|lac)?)\s*(?:-|to|થી|se)\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?\s*(?:k|thousand|lakh|lac)?)/i
    );

  if (
    rangeMatch
  ) {
    const first =
      parseMoneyValue(
        rangeMatch[1]
      );

    const second =
      parseMoneyValue(
        rangeMatch[2]
      );

    if (
      first !==
        null &&
      second !==
        null
    ) {
      minBudget =
        Math.min(
          first,
          second
        );

      maxBudget =
        Math.max(
          first,
          second
        );

      return {
        minBudget,
        maxBudget,
      };
    }
  }

  /*
  |--------------------------------------------------------------------------
  | MAX BUDGET
  |--------------------------------------------------------------------------
  */

  const maxPatterns = [
    /(?:budget\s*(?:is|of|around|under|below|upto|up to|max(?:imum)?(?: is)?)?|under|below|less than|up to|upto|max(?:imum)?(?: budget)?(?: is)?)\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?\s*(?:k|thousand|lakh|lac)?)/i,

    /(?:₹|rs\.?|inr)\s*(\d[\d,]*(?:\.\d+)?\s*(?:k|thousand|lakh|lac)?)\s*(?:budget|max|maximum|સુધી|ની અંદર)/i,

    /(\d[\d,]*(?:\.\d+)?\s*(?:k|thousand|lakh|lac)?)\s*(?:સુધી|ની અંદર)/i,
  ];

  for (
    const pattern of
    maxPatterns
  ) {
    const match =
      text.match(
        pattern
      );

    if (
      !match
    ) {
      continue;
    }

    const value =
      parseMoneyValue(
        match[1]
      );

    if (
      value !==
      null
    ) {
      maxBudget =
        value;

      break;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | MIN BUDGET
  |--------------------------------------------------------------------------
  */

  const minPatterns = [
    /(?:above|over|more than|minimum|min(?:imum)?(?: budget)?(?: is)?|starting from)\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?\s*(?:k|thousand|lakh|lac)?)/i,

    /(\d[\d,]*(?:\.\d+)?\s*(?:k|thousand|lakh|lac)?)\s*(?:થી ઉપર|થી વધારે)/i,
  ];

  for (
    const pattern of
    minPatterns
  ) {
    const match =
      text.match(
        pattern
      );

    if (
      !match
    ) {
      continue;
    }

    const value =
      parseMoneyValue(
        match[1]
      );

    if (
      value !==
      null
    ) {
      minBudget =
        value;

      break;
    }
  }

  return {
    minBudget,
    maxBudget,
  };
}

/*
|--------------------------------------------------------------------------
| EXTRACT BRANDS
|--------------------------------------------------------------------------
|
| We cannot maintain every brand name in source code.
|
| Brand extraction therefore only accepts explicitly framed statements.
|
|--------------------------------------------------------------------------
*/

function extractExplicitBrands(
  text:
    string
) {
  const brands:
    string[] =
    [];

  const patterns = [
    /\bi (?:prefer|like|love) ([a-z0-9&.' -]{2,40}) brand\b/i,

    /\bmy preferred brand is ([a-z0-9&.' -]{2,40})\b/i,

    /\bmy favorite brand is ([a-z0-9&.' -]{2,40})\b/i,

    /\bmy favourite brand is ([a-z0-9&.' -]{2,40})\b/i,

    /\bmujhe ([a-z0-9&.' -]{2,40}) brand pasand hai\b/i,

    /મને ([a-z0-9&.' -]{2,40}) brand (?:ગમે છે|પસંદ છે)/i,

    /મારી પસંદની brand ([a-z0-9&.' -]{2,40}) છે/i,
  ];

  for (
    const pattern of
    patterns
  ) {
    const match =
      text.match(
        pattern
      );

    if (
      !match?.[1]
    ) {
      continue;
    }

    const brand =
      cleanString(
        match[1],
        40
      );

    if (
      brand
    ) {
      brands.push(
        titleCase(
          brand
        )
      );
    }
  }

  return uniqueStrings(
    brands
  );
}

/*
|--------------------------------------------------------------------------
| ADD SIGNAL
|--------------------------------------------------------------------------
*/

function addSignal(
  signals:
    CustomerLearningSignal[],
  signal:
    CustomerLearningSignal
) {
  const alreadyExists =
    signals.some(
      (
        current
      ) =>
        current.type ===
          signal.type &&
        String(
          current.value
        )
          .toLowerCase() ===
        String(
          signal.value
        )
          .toLowerCase()
    );

  if (
    alreadyExists
  ) {
    return;
  }

  signals.push(
    signal
  );
}

/*
|--------------------------------------------------------------------------
| EMPTY RESULT
|--------------------------------------------------------------------------
*/

function createEmptyPreferences() {
  return {
    preferredColors:
      [] as string[],

    dislikedColors:
      [] as string[],

    preferredSizes:
      [] as string[],

    preferredFits:
      [] as string[],

    preferredCategories:
      [] as string[],

    preferredBrands:
      [] as string[],

    preferredStyles:
      [] as string[],

    preferredFabrics:
      [] as string[],

    preferredOccasions:
      [] as string[],

    minBudget:
      null as
        number | null,

    maxBudget:
      null as
        number | null,
  };
}

/*
|--------------------------------------------------------------------------
| DETECT LEARNING SIGNALS
|--------------------------------------------------------------------------
*/

export function detectCustomerLearningSignals(
  message:
    string
):
  CustomerLearningSignalResult {
  const text =
    normalizeText(
      message
    );

  const preferences =
    createEmptyPreferences();

  const signals:
    CustomerLearningSignal[] =
    [];

  const ignoredReasons:
    string[] =
    [];

  /*
  |--------------------------------------------------------------------------
  | EMPTY MESSAGE
  |--------------------------------------------------------------------------
  */

  if (
    !text
  ) {
    return {
      success:
        true,

      shouldLearn:
        false,

      message:
        "No customer learning signal detected.",

      signals,

      preferences,

      ignoredReasons: [
        "Message is empty.",
      ],
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SECRET DATA
  |--------------------------------------------------------------------------
  */

  if (
    containsPattern(
      text,
      SECRET_PATTERNS
    )
  ) {
    return {
      success:
        true,

      shouldLearn:
        false,

      message:
        "Message contains secret or credential-related information and was not used for learning.",

      signals:

        [],

      preferences,

      ignoredReasons: [
        "Secret or credential-related content must never be stored as shopping memory.",
      ],
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SENSITIVE DATA
  |--------------------------------------------------------------------------
  */

  if (
    containsPattern(
      text,
      SENSITIVE_PATTERNS
    )
  ) {
    return {
      success:
        true,

      shouldLearn:
        false,

      message:
        "Message contains sensitive information and was not used for customer learning.",

      signals:
        [],

      preferences,

      ignoredReasons: [
        "Sensitive personal information must not be inferred or stored as shopping preference memory.",
      ],
    };
  }

  const explicitPositive =
    containsPattern(
      text,
      STRONG_PREFERENCE_PATTERNS
    );

  const explicitNegative =
    containsPattern(
      text,
      DISLIKE_PATTERNS
    );

  const temporaryRequest =
    containsPattern(
      text,
      TEMPORARY_REQUEST_PATTERNS
    );

  /*
  |--------------------------------------------------------------------------
  | TEMPORARY REQUEST SAFETY
  |--------------------------------------------------------------------------
  |
  | If customer simply asks:
  |
  | "show me black t-shirts"
  |
  | that is search intent, not persistent preference.
  |
  |--------------------------------------------------------------------------
  */

  if (
    temporaryRequest &&
    !explicitPositive &&
    !explicitNegative
  ) {
    return {
      success:
        true,

      shouldLearn:
        false,

      message:
        "Temporary shopping intent detected. No long-term preference was learned.",

      signals:
        [],

      preferences,

      ignoredReasons: [
        "Current shopping request is not strong enough to become long-term customer memory.",
      ],
    };
  }

  /*
  |--------------------------------------------------------------------------
  | COLORS
  |--------------------------------------------------------------------------
  */

  const foundColors =
    findKnownValues(
      text,
      COLORS
    );

  if (
    foundColors.length >
    0
  ) {
    if (
      explicitNegative
    ) {
      preferences.dislikedColors =
        foundColors.map(
          titleCase
        );

      for (
        const color of
        preferences.dislikedColors
      ) {
        addSignal(
          signals,
          {
            type:
              "disliked_color",

            value:
              color,

            confidence:
              "high",

            explicit:
              true,

            sourceText:
              text,
          }
        );
      }
    } else if (
      explicitPositive
    ) {
      preferences.preferredColors =
        foundColors.map(
          titleCase
        );

      for (
        const color of
        preferences.preferredColors
      ) {
        addSignal(
          signals,
          {
            type:
              "preferred_color",

            value:
              color,

            confidence:
              "high",

            explicit:
              true,

            sourceText:
              text,
          }
        );
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SIZE
  |--------------------------------------------------------------------------
  */

  const sizeContext =
    /\b(?:size|wear|fit|સાઇઝ|size)\b/i.test(
      text
    );

  if (
    (
      explicitPositive ||
      sizeContext
    ) &&
    !explicitNegative
  ) {
    const foundSizes =
      findSizes(
        text
      );

    if (
      foundSizes.length >
      0
    ) {
      preferences.preferredSizes =
        foundSizes;

      for (
        const size of
        foundSizes
      ) {
        addSignal(
          signals,
          {
            type:
              "preferred_size",

            value:
              size,

            confidence:
              sizeContext
                ? "high"
                : "medium",

            explicit:
              true,

            sourceText:
              text,
          }
        );
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FIT
  |--------------------------------------------------------------------------
  */

  if (
    explicitPositive &&
    !explicitNegative
  ) {
    const fits =
      findKnownValues(
        text,
        FITS
      ).map(
        normalizeFit
      );

    preferences.preferredFits =
      fits;

    for (
      const fit of
      fits
    ) {
      addSignal(
        signals,
        {
          type:
            "preferred_fit",

          value:
            fit,

          confidence:
            "high",

          explicit:
            true,

          sourceText:
            text,
        }
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY
  |--------------------------------------------------------------------------
  */

  if (
    explicitPositive &&
    !explicitNegative
  ) {
    const categories =
      findKnownValues(
        text,
        CATEGORIES
      ).map(
        normalizeCategory
      );

    preferences.preferredCategories =
      uniqueStrings(
        categories
      );

    for (
      const category of
      preferences.preferredCategories
    ) {
      addSignal(
        signals,
        {
          type:
            "preferred_category",

          value:
            category,

          confidence:
            "high",

          explicit:
            true,

          sourceText:
            text,
        }
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | STYLE
  |--------------------------------------------------------------------------
  */

  if (
    explicitPositive &&
    !explicitNegative
  ) {
    const styles =
      findKnownValues(
        text,
        STYLES
      ).map(
        titleCase
      );

    preferences.preferredStyles =
      styles;

    for (
      const style of
      styles
    ) {
      addSignal(
        signals,
        {
          type:
            "preferred_style",

          value:
            style,

          confidence:
            "high",

          explicit:
            true,

          sourceText:
            text,
        }
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FABRIC
  |--------------------------------------------------------------------------
  */

  if (
    explicitPositive &&
    !explicitNegative
  ) {
    const fabrics =
      findKnownValues(
        text,
        FABRICS
      ).map(
        titleCase
      );

    preferences.preferredFabrics =
      fabrics;

    for (
      const fabric of
      fabrics
    ) {
      addSignal(
        signals,
        {
          type:
            "preferred_fabric",

          value:
            fabric,

          confidence:
            "high",

          explicit:
            true,

          sourceText:
            text,
        }
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | OCCASION
  |--------------------------------------------------------------------------
  */

  if (
    explicitPositive &&
    !explicitNegative
  ) {
    const occasions =
      findKnownValues(
        text,
        OCCASIONS
      ).map(
        titleCase
      );

    preferences.preferredOccasions =
      occasions;

    for (
      const occasion of
      occasions
    ) {
      addSignal(
        signals,
        {
          type:
            "preferred_occasion",

          value:
            occasion,

          confidence:
            "medium",

          explicit:
            true,

          sourceText:
            text,
        }
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | BRAND
  |--------------------------------------------------------------------------
  */

  if (
    explicitPositive &&
    !explicitNegative
  ) {
    const brands =
      extractExplicitBrands(
        text
      );

    preferences.preferredBrands =
      brands;

    for (
      const brand of
      brands
    ) {
      addSignal(
        signals,
        {
          type:
            "preferred_brand",

          value:
            brand,

          confidence:
            "high",

          explicit:
            true,

          sourceText:
            text,
        }
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | BUDGET
  |--------------------------------------------------------------------------
  |
  | Budget can be useful even without "I like" language if the customer says:
  |
  | "my budget is 2000"
  |
  |--------------------------------------------------------------------------
  */

  const budgetContext =
    /\b(?:budget|maximum|max|min|minimum|under|below|above|over|up to|upto|₹|rs\.?|inr)\b/i.test(
      text
    ) ||
    /બજેટ|સુધી|થી ઉપર|ની અંદર/i.test(
      text
    );

  if (
    budgetContext
  ) {
    const budget =
      extractBudget(
        text
      );

    if (
      budget.minBudget !==
      null
    ) {
      preferences.minBudget =
        budget.minBudget;

      addSignal(
        signals,
        {
          type:
            "min_budget",

          value:
            budget.minBudget,

          confidence:
            "high",

          explicit:
            true,

          sourceText:
            text,
        }
      );
    }

    if (
      budget.maxBudget !==
      null
    ) {
      preferences.maxBudget =
        budget.maxBudget;

      addSignal(
        signals,
        {
          type:
            "max_budget",

          value:
            budget.maxBudget,

          confidence:
            "high",

          explicit:
            true,

          sourceText:
            text,
        }
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | NO SIGNAL
  |--------------------------------------------------------------------------
  */

  if (
    signals.length ===
    0
  ) {
    ignoredReasons.push(
      "No sufficiently explicit long-term shopping preference was detected."
    );
  }

  return {
    success:
      true,

    shouldLearn:
      signals.length >
      0,

    message:
      signals.length >
      0
        ? "Explicit customer shopping preferences detected."
        : "No safe long-term customer preference detected.",

    signals,

    preferences,

    ignoredReasons,
  };
}

/*
|--------------------------------------------------------------------------
| STRONG SIGNALS ONLY
|--------------------------------------------------------------------------
*/

export function getStrongCustomerLearningSignals(
  message:
    string
) {
  const result =
    detectCustomerLearningSignals(
      message
    );

  return {
    ...result,

    signals:
      result.signals.filter(
        (
          signal
        ) =>
          signal.confidence ===
            "high" &&
          signal.explicit
      ),
  };
}

/*
|--------------------------------------------------------------------------
| HAS SAFE LEARNING SIGNAL
|--------------------------------------------------------------------------
*/

export function hasSafeCustomerLearningSignal(
  message:
    string
) {
  return detectCustomerLearningSignals(
    message
  ).shouldLearn;
}

/*
|--------------------------------------------------------------------------
| BUILD PERSISTENCE INPUT
|--------------------------------------------------------------------------
|
| Output is directly compatible with:
|
| learnCustomerPreferences(userId, input)
|
|--------------------------------------------------------------------------
*/

export function buildCustomerPreferenceLearningInput(
  message:
    string
) {
  const result =
    detectCustomerLearningSignals(
      message
    );

  if (
    !result.shouldLearn
  ) {
    return {
      shouldLearn:
        false,

      learningInput:
        null,

      signals:
        result.signals,

      ignoredReasons:
        result.ignoredReasons,
    };
  }

  return {
    shouldLearn:
      true,

    learningInput: {
      preferredColors:
        result.preferences
          .preferredColors,

      dislikedColors:
        result.preferences
          .dislikedColors,

      preferredSizes:
        result.preferences
          .preferredSizes,

      preferredFits:
        result.preferences
          .preferredFits,

      preferredCategories:
        result.preferences
          .preferredCategories,

      preferredBrands:
        result.preferences
          .preferredBrands,

      preferredStyles:
        result.preferences
          .preferredStyles,

      preferredFabrics:
        result.preferences
          .preferredFabrics,

      preferredOccasions:
        result.preferences
          .preferredOccasions,

      minBudget:
        result.preferences
          .minBudget,

      maxBudget:
        result.preferences
          .maxBudget,
    },

    signals:
      result.signals,

    ignoredReasons:
      result.ignoredReasons,
  };
}