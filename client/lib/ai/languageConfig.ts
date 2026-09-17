/*
|--------------------------------------------------------------------------
| SILENTGEN AI - LANGUAGE CONFIGURATION
|--------------------------------------------------------------------------
|
| SINGLE SOURCE OF TRUTH FOR SILENTGEN AI LANGUAGE SUPPORT.
|
| Used by:
|
| - SilentGenAI.tsx
| - AILanguageSelector.tsx
| - app/api/ai/chat/route.ts
| - silentGenSystemPrompt.ts
| - AIConversation.ts
| - AIMessage.ts
|
| IMPORTANT:
|
| null   = customer has NOT selected a language yet
| "auto" = customer explicitly selected Auto Detect
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| LANGUAGE CODE
|--------------------------------------------------------------------------
*/

export type SilentGenLanguageCode =
  | "auto"
  | "en"
  | "hi"
  | "gu"
  | "mr"
  | "bn"
  | "ta"
  | "te"
  | "kn"
  | "ml"
  | "pa"
  | "or"
  | "as"
  | "ur";

/*
|--------------------------------------------------------------------------
| LANGUAGE
|--------------------------------------------------------------------------
*/

export type SilentGenLanguage = {
  code:
    SilentGenLanguageCode;

  name:
    string;

  nativeName:
    string;

  displayName:
    string;

  aliases:
    string[];

  scripts:
    string[];

  instruction:
    string;

  isAuto?:
    boolean;
};

/*
|--------------------------------------------------------------------------
| SUPPORTED LANGUAGES
|--------------------------------------------------------------------------
*/

export const SILENTGEN_LANGUAGES:
  SilentGenLanguage[] = [
  /*
  |--------------------------------------------------------------------------
  | AUTO DETECT
  |--------------------------------------------------------------------------
  */

  {
    code:
      "auto",

    name:
      "Auto Detect",

    nativeName:
      "Auto Detect",

    displayName:
      "🌐 Auto Detect",

    aliases: [
      "auto",
      "auto detect",
      "automatic",
      "automatic detection",
    ],

    scripts:
      [],

    instruction:
      "Detect the language of the customer's latest meaningful message and reply naturally in that language. If the customer uses a natural mixed or Roman-script style, you may reply in the same natural style.",

    isAuto:
      true,
  },

  /*
  |--------------------------------------------------------------------------
  | ENGLISH
  |--------------------------------------------------------------------------
  */

  {
    code:
      "en",

    name:
      "English",

    nativeName:
      "English",

    displayName:
      "English",

    aliases: [
      "english",
      "eng",
      "en",
    ],

    scripts: [
      "Latin",
    ],

    instruction:
      "Reply in clear, professional and natural English.",
  },

  /*
  |--------------------------------------------------------------------------
  | HINDI
  |--------------------------------------------------------------------------
  */

  {
    code:
      "hi",

    name:
      "Hindi",

    nativeName:
      "हिन्दी",

    displayName:
      "हिन्दी",

    aliases: [
      "hindi",
      "हिंदी",
      "हिन्दी",
      "hinglish",
      "hi",
    ],

    scripts: [
      "Devanagari",
      "Latin",
    ],

    instruction:
      "Reply in natural Hindi. If the customer writes in Hinglish or Roman Hindi, you may reply in the same natural mixed or Roman Hindi style.",
  },

  /*
  |--------------------------------------------------------------------------
  | GUJARATI
  |--------------------------------------------------------------------------
  */

  {
    code:
      "gu",

    name:
      "Gujarati",

    nativeName:
      "ગુજરાતી",

    displayName:
      "ગુજરાતી",

    aliases: [
      "gujarati",
      "ગુજરાતી",
      "guj",
      "gujrati",
      "gu",
    ],

    scripts: [
      "Gujarati",
      "Latin",
    ],

    instruction:
      "Reply in natural Gujarati. If the customer writes Gujarati using English letters, you may reply in natural Roman Gujarati or Gujarati-English mixed style.",
  },

  /*
  |--------------------------------------------------------------------------
  | MARATHI
  |--------------------------------------------------------------------------
  */

  {
    code:
      "mr",

    name:
      "Marathi",

    nativeName:
      "मराठी",

    displayName:
      "मराठी",

    aliases: [
      "marathi",
      "मराठी",
      "mr",
    ],

    scripts: [
      "Devanagari",
      "Latin",
    ],

    instruction:
      "Reply in natural Marathi. Roman Marathi is acceptable when the customer writes in Roman Marathi.",
  },

  /*
  |--------------------------------------------------------------------------
  | BENGALI
  |--------------------------------------------------------------------------
  */

  {
    code:
      "bn",

    name:
      "Bengali",

    nativeName:
      "বাংলা",

    displayName:
      "বাংলা",

    aliases: [
      "bengali",
      "bangla",
      "বাংলা",
      "bn",
    ],

    scripts: [
      "Bengali",
      "Latin",
    ],

    instruction:
      "Reply in natural Bengali. Roman Bengali is acceptable when the customer uses it.",
  },

  /*
  |--------------------------------------------------------------------------
  | TAMIL
  |--------------------------------------------------------------------------
  */

  {
    code:
      "ta",

    name:
      "Tamil",

    nativeName:
      "தமிழ்",

    displayName:
      "தமிழ்",

    aliases: [
      "tamil",
      "தமிழ்",
      "ta",
    ],

    scripts: [
      "Tamil",
      "Latin",
    ],

    instruction:
      "Reply in natural Tamil. Roman Tamil is acceptable when the customer uses it.",
  },

  /*
  |--------------------------------------------------------------------------
  | TELUGU
  |--------------------------------------------------------------------------
  */

  {
    code:
      "te",

    name:
      "Telugu",

    nativeName:
      "తెలుగు",

    displayName:
      "తెలుగు",

    aliases: [
      "telugu",
      "తెలుగు",
      "te",
    ],

    scripts: [
      "Telugu",
      "Latin",
    ],

    instruction:
      "Reply in natural Telugu. Roman Telugu is acceptable when the customer uses it.",
  },

  /*
  |--------------------------------------------------------------------------
  | KANNADA
  |--------------------------------------------------------------------------
  */

  {
    code:
      "kn",

    name:
      "Kannada",

    nativeName:
      "ಕನ್ನಡ",

    displayName:
      "ಕನ್ನಡ",

    aliases: [
      "kannada",
      "ಕನ್ನಡ",
      "kn",
    ],

    scripts: [
      "Kannada",
      "Latin",
    ],

    instruction:
      "Reply in natural Kannada. Roman Kannada is acceptable when the customer uses it.",
  },

  /*
  |--------------------------------------------------------------------------
  | MALAYALAM
  |--------------------------------------------------------------------------
  */

  {
    code:
      "ml",

    name:
      "Malayalam",

    nativeName:
      "മലയാളം",

    displayName:
      "മലയാളം",

    aliases: [
      "malayalam",
      "മലയാളം",
      "ml",
    ],

    scripts: [
      "Malayalam",
      "Latin",
    ],

    instruction:
      "Reply in natural Malayalam. Roman Malayalam is acceptable when the customer uses it.",
  },

  /*
  |--------------------------------------------------------------------------
  | PUNJABI
  |--------------------------------------------------------------------------
  */

  {
    code:
      "pa",

    name:
      "Punjabi",

    nativeName:
      "ਪੰਜਾਬੀ",

    displayName:
      "ਪੰਜਾਬੀ",

    aliases: [
      "punjabi",
      "panjabi",
      "ਪੰਜਾਬੀ",
      "pa",
    ],

    scripts: [
      "Gurmukhi",
      "Latin",
    ],

    instruction:
      "Reply in natural Punjabi. Roman Punjabi is acceptable when the customer uses it.",
  },

  /*
  |--------------------------------------------------------------------------
  | ODIA
  |--------------------------------------------------------------------------
  */

  {
    code:
      "or",

    name:
      "Odia",

    nativeName:
      "ଓଡ଼ିଆ",

    displayName:
      "ଓଡ଼ିଆ",

    aliases: [
      "odia",
      "oriya",
      "ଓଡ଼ିଆ",
      "or",
    ],

    scripts: [
      "Odia",
      "Latin",
    ],

    instruction:
      "Reply in natural Odia. Roman Odia is acceptable when the customer uses it.",
  },

  /*
  |--------------------------------------------------------------------------
  | ASSAMESE
  |--------------------------------------------------------------------------
  */

  {
    code:
      "as",

    name:
      "Assamese",

    nativeName:
      "অসমীয়া",

    displayName:
      "অসমীয়া",

    aliases: [
      "assamese",
      "অসমীয়া",
      "as",
    ],

    scripts: [
      "Bengali-Assamese",
      "Latin",
    ],

    instruction:
      "Reply in natural Assamese. Roman Assamese is acceptable when the customer uses it.",
  },

  /*
  |--------------------------------------------------------------------------
  | URDU
  |--------------------------------------------------------------------------
  */

  {
    code:
      "ur",

    name:
      "Urdu",

    nativeName:
      "اردو",

    displayName:
      "اردو",

    aliases: [
      "urdu",
      "اردو",
      "roman urdu",
      "ur",
    ],

    scripts: [
      "Arabic",
      "Latin",
    ],

    instruction:
      "Reply in natural Urdu. Roman Urdu is acceptable when the customer uses it.",
  },
];

/*
|--------------------------------------------------------------------------
| DEFAULT LANGUAGE
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This is a fallback value only.
|
| First-open frontend state should still be:
|
| selectedLanguage = null
|
| until the customer explicitly selects a language.
|
|--------------------------------------------------------------------------
*/

export const DEFAULT_SILENTGEN_LANGUAGE:
  SilentGenLanguageCode =
  "auto";

/*
|--------------------------------------------------------------------------
| LANGUAGE SELECTION REQUIRED
|--------------------------------------------------------------------------
*/

export const SILENTGEN_LANGUAGE_SELECTION_REQUIRED =
  true;

/*
|--------------------------------------------------------------------------
| LANGUAGE SELECTION TITLE
|--------------------------------------------------------------------------
*/

export const SILENTGEN_LANGUAGE_SELECTION_TITLE =
  "Choose your preferred language";

/*
|--------------------------------------------------------------------------
| LANGUAGE SELECTION SUBTITLE
|--------------------------------------------------------------------------
*/

export const SILENTGEN_LANGUAGE_SELECTION_SUBTITLE =
  "Select the language you would like to use with SilentGEN AI.";

/*
|--------------------------------------------------------------------------
| NORMALIZE LANGUAGE LOOKUP VALUE
|--------------------------------------------------------------------------
*/

function normalizeLanguageLookup(
  value:
    string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
}

/*
|--------------------------------------------------------------------------
| GET LANGUAGE BY CODE
|--------------------------------------------------------------------------
*/

export function getSilentGenLanguage(
  code:
    string | null | undefined
): SilentGenLanguage | null {
  if (
    !code
  ) {
    return null;
  }

  const normalized =
    normalizeLanguageLookup(
      code
    );

  return (
    SILENTGEN_LANGUAGES.find(
      (
        language
      ) =>
        language.code ===
        normalized
    ) ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| GET LANGUAGE BY NAME / NATIVE NAME / ALIAS
|--------------------------------------------------------------------------
*/

export function findSilentGenLanguage(
  value:
    string | null | undefined
): SilentGenLanguage | null {
  if (
    !value
  ) {
    return null;
  }

  const normalized =
    normalizeLanguageLookup(
      value
    );

  return (
    SILENTGEN_LANGUAGES.find(
      (
        language
      ) => {
        if (
          language.code ===
          normalized
        ) {
          return true;
        }

        if (
          normalizeLanguageLookup(
            language.name
          ) ===
          normalized
        ) {
          return true;
        }

        if (
          normalizeLanguageLookup(
            language.nativeName
          ) ===
          normalized
        ) {
          return true;
        }

        if (
          normalizeLanguageLookup(
            language.displayName
          ) ===
          normalized
        ) {
          return true;
        }

        return language.aliases.some(
          (
            alias
          ) =>
            normalizeLanguageLookup(
              alias
            ) ===
            normalized
        );
      }
    ) ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| VALID LANGUAGE CODE
|--------------------------------------------------------------------------
*/

export function isSilentGenLanguageCode(
  value:
    unknown
): value is SilentGenLanguageCode {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }

  const normalized =
    normalizeLanguageLookup(
      value
    );

  return SILENTGEN_LANGUAGES.some(
    (
      language
    ) =>
      language.code ===
      normalized
  );
}

/*
|--------------------------------------------------------------------------
| GET UI LANGUAGE OPTIONS
|--------------------------------------------------------------------------
*/

export function getSilentGenLanguageOptions() {
  return SILENTGEN_LANGUAGES.map(
    (
      language
    ) => ({
      code:
        language.code,

      name:
        language.name,

      nativeName:
        language.nativeName,

      displayName:
        language.displayName,

      isAuto:
        language.isAuto ===
        true,
    })
  );
}

/*
|--------------------------------------------------------------------------
| SUPPORTED LANGUAGE NAMES
|--------------------------------------------------------------------------
|
| Auto Detect is intentionally excluded.
|
|--------------------------------------------------------------------------
*/

export function getSupportedLanguageNames() {
  return SILENTGEN_LANGUAGES
    .filter(
      (
        language
      ) =>
        !language.isAuto
    )
    .map(
      (
        language
      ) => ({
        code:
          language.code,

        name:
          language.name,

        nativeName:
          language.nativeName,
      })
    );
}

/*
|--------------------------------------------------------------------------
| GET LANGUAGE INSTRUCTION
|--------------------------------------------------------------------------
*/

export function getLanguageInstruction(
  code:
    SilentGenLanguageCode
) {
  const language =
    getSilentGenLanguage(
      code
    );

  if (
    language
  ) {
    return language.instruction;
  }

  const fallback =
    getSilentGenLanguage(
      DEFAULT_SILENTGEN_LANGUAGE
    );

  return (
    fallback?.instruction ||
    "Reply naturally in the customer's current language."
  );
}

/*
|--------------------------------------------------------------------------
| GET LANGUAGE SYSTEM PROMPT
|--------------------------------------------------------------------------
*/

export function getLanguageSystemPrompt(
  selectedLanguage?:
    SilentGenLanguageCode | null
) {
  const supportedLanguages =
    SILENTGEN_LANGUAGES
      .filter(
        (
          language
        ) =>
          !language.isAuto
      )
      .map(
        (
          language
        ) =>
          `${language.name} (${language.nativeName})`
      )
      .join(
        ", "
      );

  const selected =
    selectedLanguage
      ? getSilentGenLanguage(
          selectedLanguage
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | NO LANGUAGE SELECTED
  |--------------------------------------------------------------------------
  */

  const selectedInstruction =
    !selected
      ? `
CURRENT CUSTOMER LANGUAGE PREFERENCE

Selected mode:
None

No explicit language preference has been selected yet.

The frontend may present a language selector.

If the customer nevertheless sends a normal message before making a UI selection:

- Understand the message normally.
- Detect the language of the latest customer message.
- Reply naturally in that language.
- Do not assume Gujarati, Hindi or English.
`
      : selected.code ===
        "auto"
      ? `
CURRENT CUSTOMER LANGUAGE PREFERENCE

Selected mode:
${selected.displayName}

The customer explicitly selected Auto Detect.

Instruction:
${selected.instruction}

Auto Detect is an explicit preference.

Do not treat it as "no language selected".
`
      : `
CURRENT CUSTOMER LANGUAGE PREFERENCE

Selected mode:
${selected.displayName}

Selected language code:
${selected.code}

Instruction:
${selected.instruction}
`;

  return `
LANGUAGE POLICY

SilentGEN AI is multilingual.

Supported major customer languages:

${supportedLanguages}

${selectedInstruction}

LANGUAGE RULES:

1. If the customer selected a specific language, use that language by default.

2. If the customer explicitly selected Auto Detect, detect the language of the customer's latest meaningful message and reply naturally in that language.

3. A null language preference and "auto" are different:

   null:
   The customer has not selected a preference yet.

   auto:
   The customer explicitly selected Auto Detect.

4. If the customer explicitly asks to switch to another supported language, follow that request immediately.

5. A clear explicit language switch may override the previously selected fixed language for the current conversational flow.

Examples:

- "English please"
- "Gujarati માં જવાબ આપો"
- "Hindi mein bolo"
- "मराठीमध्ये सांगा"
- "Reply in Tamil"

6. If the customer uses a natural mixed language such as Hinglish, Gujarati-English, Marathi-English, Tamil-English, Telugu-English, Kannada-English, Malayalam-English, Punjabi-English or Roman Urdu, you may respond naturally in the same style.

7. Roman-script Indian languages are valid customer input.

Examples:

- "mane black shirt joiye" = Gujarati / Roman Gujarati
- "mujhe black tshirt chahiye" = Hindi / Hinglish
- "mala black shirt pahije" = Marathi / Roman Marathi
- "enakku black tshirt venum" = Tamil / Roman Tamil
- "naaku black tshirt kavali" = Telugu / Roman Telugu

8. Never force English merely because:

- tools return English
- database fields are English
- UI labels are English
- product metadata is English

9. Tool results may be written internally in English.

The final customer-facing answer must follow the active customer language.

10. Preserve factual identifiers exactly where appropriate:

- SilentGEN
- Brand names
- Product names
- SKU values
- Product IDs
- Order IDs
- AWB numbers
- Tracking numbers
- URLs
- Size values such as XS, S, M, L, XL, XXL
- Exact stored variant values when required

11. Do not translate or alter an exact database variant in a way that could identify a different variant.

Example:

Stored value:
Navy Blue

It may be explained naturally in another language, but the actual variant remains:

Navy Blue

12. Currency should normally remain Indian Rupees.

Use formats such as:

₹1,499

13. Sensitive and consequential confirmation messages must follow the customer's active language.

This includes:

- cancel order
- return request
- exchange request
- clear saved style preferences

14. Language must never change ecommerce facts.

Product price, stock, size, color, cart data, order status, refund status, courier and tracking information must remain factually identical regardless of response language.

15. Do not repeatedly ask for language selection after the customer has already selected a specific language or Auto Detect.

16. If there is no selected language and the frontend chooser is available, allow it to collect the initial preference.

If the customer sends a message anyway, answer naturally instead of blocking the conversation.
`.trim();
}

/*
|--------------------------------------------------------------------------
| LANGUAGE SUMMARY
|--------------------------------------------------------------------------
*/

export const SILENTGEN_LANGUAGE_SUMMARY =
  SILENTGEN_LANGUAGES
    .map(
      (
        language
      ) =>
        `${language.code}: ${language.name}`
    )
    .join(
      ", "
    );