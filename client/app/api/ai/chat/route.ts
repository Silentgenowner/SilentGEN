import {
  NextRequest,
  NextResponse,
} from "next/server";

import crypto from "crypto";
import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import {
  AI_CONFIG,
} from "@/lib/ai/config";

import {
  GoogleGenAI,
} from "@google/genai";

import {
  getOptionalAIUserId,
} from "@/lib/ai/getAIUser";

import {
  createSilentGenSystemPrompt,
  type CurrentProductContext,
  type StyleProfileContext,
} from "@/lib/ai/prompts/silentGenSystemPrompt";

import {
  isSilentGenLanguageCode,
  type SilentGenLanguageCode,
} from "@/lib/ai/languageConfig";

import {
  silentGenToolDefinitions,
} from "@/lib/ai/tools/toolDefinitions";

import {
  executeAITool,
} from "@/lib/ai/tools/executeAITool";

import {
  getProduct,
} from "@/lib/ai/tools/productTools";

import {
  getAIStyleProfile,
} from "@/lib/ai/tools/styleProfileTools";

import {
  learnFromCustomerMessage,
  recordLearningBusinessEvent,
} from "@/lib/ai/learning/customerLearningEngine";

import AIConversation from "@/models/AIConversation";
import AIMessage from "@/models/AIMessage";
import AIActionLog, {
  type AIActionStatus,
} from "@/models/AIActionLog";

/*
|--------------------------------------------------------------------------
| REQUEST BODY
|--------------------------------------------------------------------------
*/

type AIChatBody = {
  message?: string;

  conversationId?: string;

  sessionId?: string;

  currentPath?: string;

  /*
  |--------------------------------------------------------------------------
  | CANONICAL LANGUAGE FIELD
  |--------------------------------------------------------------------------
  */

  languagePreference?:
    string | null;

  /*
  |--------------------------------------------------------------------------
  | LEGACY COMPATIBILITY
  |--------------------------------------------------------------------------
  |
  | Older SilentGenAI.tsx versions may send:
  |
  | language
  |
  | New frontend should send:
  |
  | languagePreference
  |
  */

  language?:
    string | null;
};

/*
|--------------------------------------------------------------------------
| HISTORY MESSAGE
|--------------------------------------------------------------------------
*/

type HistoryMessage = {
  role:
    | "user"
    | "assistant";

  content:
    string;
};

/*
|--------------------------------------------------------------------------
| GENERIC OBJECT
|--------------------------------------------------------------------------
*/

type GenericObject =
  Record<
    string,
    any
  >;

/*
|--------------------------------------------------------------------------
| PENDING CONFIRMATION
|--------------------------------------------------------------------------
*/

type PendingConfirmation = {
  logId:
    string;

  toolName:
    string;

  input:
    Record<
      string,
      unknown
    >;

  orderId:
    string;

  reason:
    string;

  confirmationRequestedAt:
    Date | null;

  createdAt:
    Date | null;
};

/*
|--------------------------------------------------------------------------
| CONSEQUENTIAL TOOLS
|--------------------------------------------------------------------------
*/

const CONFIRMATION_TOOLS =
  new Set<string>([
    "cancel_order",
    "request_return",
    "request_exchange",
    "clear_style_profile",
  ]);

/*
|--------------------------------------------------------------------------
| CONFIRMATION EXPIRY
|--------------------------------------------------------------------------
*/

const CONFIRMATION_MAX_AGE_MS =
  30 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET() {
  return NextResponse.json(
    {
      success:
        true,

      service:
        "SilentGEN AI",

      status:
        "online",

      capabilities: [
        "multilingual-ai",

        "product-search",
        "product-details",
        "stock-check",
        "color-styling",
        "outfit-builder",

        "personal-stylist",
        "style-memory",
        "budget-memory",

        "cart",
        "cart-add",
        "cart-quantity-update",
        "cart-removal",

        "orders",
        "order-details",
        "order-tracking",
        "order-cancellation",

        "return-request",
        "exchange-request",

        "shiprocket-tracking",

        "secure-action-confirmation",
      ],

      message:
        "SilentGEN AI API is running successfully. Use POST to chat with AI.",
    },
    {
      status:
        200,
    }
  );
}

/*
|--------------------------------------------------------------------------
| CREATE CONVERSATION TITLE
|--------------------------------------------------------------------------
*/

function createConversationTitle(
  message:
    string
) {
  const clean =
    message
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (
    clean.length <=
    70
  ) {
    return clean;
  }

  return (
    clean.slice(
      0,
      67
    ) + "..."
  );
}

/*
|--------------------------------------------------------------------------
| CREATE SESSION ID
|--------------------------------------------------------------------------
*/

function createSessionId() {
  return crypto.randomUUID();
}

/*
|--------------------------------------------------------------------------
| NORMALIZE SESSION ID
|--------------------------------------------------------------------------
*/

function normalizeSessionId(
  value:
    unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const clean =
    value.trim();

  if (
    clean.length < 8 ||
    clean.length > 150
  ) {
    return null;
  }

  return clean;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE CURRENT PATH
|--------------------------------------------------------------------------
*/

function normalizeCurrentPath(
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
    .slice(
      0,
      300
    );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE LANGUAGE
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| null and "auto" are NOT the same.
|
| null:
| customer has not selected a language yet.
|
| auto:
| customer explicitly selected Auto Detect.
|
|--------------------------------------------------------------------------
*/

function normalizeLanguagePreference(
  value:
    unknown
): SilentGenLanguageCode | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const clean =
    value
      .trim()
      .toLowerCase();

  if (
    !clean ||
    !isSilentGenLanguageCode(
      clean
    )
  ) {
    return null;
  }

  return clean;
}

/*
|--------------------------------------------------------------------------
| GET CONVERSATION SAVED LANGUAGE
|--------------------------------------------------------------------------
*/

function getSavedConversationLanguage(
  conversation:
    any
): SilentGenLanguageCode | null {
  const canonical =
    conversation
      ?.metadata
      ?.languagePreference;

  if (
    typeof canonical ===
      "string" &&
    isSilentGenLanguageCode(
      canonical
    )
  ) {
    return canonical;
  }

  /*
  |--------------------------------------------------------------------------
  | LEGACY FALLBACK
  |--------------------------------------------------------------------------
  */

  const legacy =
    conversation
      ?.metadata
      ?.language;

  if (
    typeof legacy ===
      "string" &&
    isSilentGenLanguageCode(
      legacy
    )
  ) {
    return legacy;
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| PRODUCT ID FROM PATH
|--------------------------------------------------------------------------
*/

function getProductIdFromPath(
  currentPath?:
    string
) {
  if (
    !currentPath ||
    typeof currentPath !==
      "string"
  ) {
    return null;
  }

  const cleanPath =
    currentPath
      .split("?")[0]
      .split("#")[0]
      .trim();

  const parts =
    cleanPath
      .split("/")
      .filter(
        Boolean
      );

  if (
    parts.length < 2 ||
    parts[0] !==
      "product"
  ) {
    return null;
  }

  const productId =
    parts[1];

  if (
    !mongoose.Types.ObjectId.isValid(
      productId
    )
  ) {
    return null;
  }

  return productId;
}

/*
|--------------------------------------------------------------------------
| EXPLICIT REJECTION
|--------------------------------------------------------------------------
*/

function hasExplicitRejection(
  message:
    string
) {
  const clean =
    message
      .trim()
      .toLowerCase();

  if (
    !clean
  ) {
    return false;
  }

  const patterns = [
    /*
    |--------------------------------------------------------------------------
    | ENGLISH
    |--------------------------------------------------------------------------
    */

    /^no$/i,
    /^nope$/i,
    /\bdo not\b/i,
    /\bdon't\b/i,
    /\bstop\b/i,
    /\bleave it\b/i,
    /\bnever mind\b/i,

    /*
    |--------------------------------------------------------------------------
    | ROMAN
    |--------------------------------------------------------------------------
    */

    /^nahi$/i,
    /^nahin$/i,
    /\bmat karo\b/i,
    /\bna karo\b/i,
    /\brehne do\b/i,

    /*
    |--------------------------------------------------------------------------
    | GUJARATI
    |--------------------------------------------------------------------------
    */

    /^ના$/i,
    /^નહીં$/i,
    /^નહિ$/i,
    /ન કરો/i,
    /રહેવા દો/i,

    /*
    |--------------------------------------------------------------------------
    | HINDI
    |--------------------------------------------------------------------------
    */

    /^नहीं$/i,
    /^नही$/i,
    /मत करो/i,
    /रहने दो/i,

    /*
    |--------------------------------------------------------------------------
    | MARATHI
    |--------------------------------------------------------------------------
    */

    /^नाही$/i,
    /^नको$/i,

    /*
    |--------------------------------------------------------------------------
    | BENGALI
    |--------------------------------------------------------------------------
    */

    /^না$/i,

    /*
    |--------------------------------------------------------------------------
    | TAMIL
    |--------------------------------------------------------------------------
    */

    /வேண்டாம்/i,

    /*
    |--------------------------------------------------------------------------
    | TELUGU
    |--------------------------------------------------------------------------
    */

    /వద్దు/i,

    /*
    |--------------------------------------------------------------------------
    | KANNADA
    |--------------------------------------------------------------------------
    */

    /ಬೇಡ/i,

    /*
    |--------------------------------------------------------------------------
    | MALAYALAM
    |--------------------------------------------------------------------------
    */

    /വേണ്ട/i,

    /*
    |--------------------------------------------------------------------------
    | PUNJABI
    |--------------------------------------------------------------------------
    */

    /^ਨਹੀਂ$/i,
    /ਨਾ ਕਰੋ/i,

    /*
    |--------------------------------------------------------------------------
    | ODIA
    |--------------------------------------------------------------------------
    */

    /^ନା$/i,
    /ନାହିଁ/i,

    /*
    |--------------------------------------------------------------------------
    | ASSAMESE
    |--------------------------------------------------------------------------
    */

    /নকৰিব/i,

    /*
    |--------------------------------------------------------------------------
    | URDU
    |--------------------------------------------------------------------------
    */

    /نہیں/i,
    /مت کرو/i,
    /مت کریں/i,
  ];

  return patterns.some(
    (
      pattern
    ) =>
      pattern.test(
        clean
      )
  );
}

/*
|--------------------------------------------------------------------------
| EXPLICIT CONFIRMATION
|--------------------------------------------------------------------------
*/

function hasExplicitConfirmation(
  message:
    string
) {
  const clean =
    message
      .trim()
      .toLowerCase();

  if (
    !clean
  ) {
    return false;
  }

  /*
  |--------------------------------------------------------------------------
  | NEGATIVE ALWAYS WINS
  |--------------------------------------------------------------------------
  */

  if (
    hasExplicitRejection(
      message
    )
  ) {
    return false;
  }

  const patterns = [
    /*
    |--------------------------------------------------------------------------
    | ENGLISH
    |--------------------------------------------------------------------------
    */

    /^yes$/i,
    /\byes please\b/i,
    /\byes,?\s*confirm\b/i,
    /^confirm$/i,
    /^confirmed$/i,
    /\bi confirm\b/i,
    /\bproceed\b/i,
    /\bgo ahead\b/i,
    /\bdo it\b/i,

    /*
    |--------------------------------------------------------------------------
    | ROMAN
    |--------------------------------------------------------------------------
    */

    /^haan$/i,
    /^han$/i,
    /^ha$/i,
    /^hanji$/i,
    /\bconfirm karo\b/i,
    /\bkar do\b/i,

    /*
    |--------------------------------------------------------------------------
    | GUJARATI
    |--------------------------------------------------------------------------
    */

    /^હા$/i,
    /^હાં$/i,
    /કન્ફર્મ કરો/i,
    /confirm કરો/i,
    /આગળ વધો/i,
    /કરી દો/i,

    /*
    |--------------------------------------------------------------------------
    | HINDI
    |--------------------------------------------------------------------------
    */

    /^हाँ$/i,
    /^हां$/i,
    /जी हाँ/i,
    /कर दो/i,
    /कर दीजिए/i,
    /आगे बढ़ो/i,

    /*
    |--------------------------------------------------------------------------
    | MARATHI
    |--------------------------------------------------------------------------
    */

    /^हो$/i,
    /पुष्टी करा/i,

    /*
    |--------------------------------------------------------------------------
    | BENGALI
    |--------------------------------------------------------------------------
    */

    /^হ্যাঁ$/i,

    /*
    |--------------------------------------------------------------------------
    | TAMIL
    |--------------------------------------------------------------------------
    */

    /^ஆம்$/i,

    /*
    |--------------------------------------------------------------------------
    | TELUGU
    |--------------------------------------------------------------------------
    */

    /^అవును$/i,

    /*
    |--------------------------------------------------------------------------
    | KANNADA
    |--------------------------------------------------------------------------
    */

    /^ಹೌದು$/i,

    /*
    |--------------------------------------------------------------------------
    | MALAYALAM
    |--------------------------------------------------------------------------
    */

    /^അതെ$/i,

    /*
    |--------------------------------------------------------------------------
    | PUNJABI
    |--------------------------------------------------------------------------
    */

    /^ਹਾਂ$/i,

    /*
    |--------------------------------------------------------------------------
    | ODIA
    |--------------------------------------------------------------------------
    */

    /^ହଁ$/i,

    /*
    |--------------------------------------------------------------------------
    | ASSAMESE
    |--------------------------------------------------------------------------
    */

    /^হয়$/i,

    /*
    |--------------------------------------------------------------------------
    | URDU
    |--------------------------------------------------------------------------
    */

    /^ہاں$/i,
    /تصدیق/i,
    /کر دیں/i,
  ];

  return patterns.some(
    (
      pattern
    ) =>
      pattern.test(
        clean
      )
  );
}

/*
|--------------------------------------------------------------------------
| GET CONVERSATION
|--------------------------------------------------------------------------
*/

async function getConversation({
  conversationId,
  sessionId,
  userId,
}: {
  conversationId?:
    string;

  sessionId:
    string;

  userId:
    string | null;
}) {
  if (
    conversationId &&
    mongoose.Types.ObjectId.isValid(
      conversationId
    )
  ) {
    const securityFilter =
      userId
        ? {
            _id:
              conversationId,

            userId,
          }
        : {
            _id:
              conversationId,

            userId:
              null,

            sessionId,
          };

    const existing =
      await AIConversation.findOne(
        securityFilter
      );

    if (
      existing
    ) {
      return existing;
    }
  }

  return AIConversation.create(
    {
      userId:
        userId ||
        null,

      sessionId,

      title:
        "New AI Conversation",

      status:
        "active",

      lastMessageAt:
        new Date(),

      messageCount:
        0,

      metadata: {
        source:
          "website",

        languagePreference:
          null,
      },
    }
  );
}

/*
|--------------------------------------------------------------------------
| GET HISTORY
|--------------------------------------------------------------------------
*/

async function getHistory(
  conversationId:
    string
): Promise<
  HistoryMessage[]
> {
  const messages =
    await AIMessage.find(
      {
        conversationId,

        role: {
          $in: [
            "user",
            "assistant",
          ],
        },
      }
    )
      .sort({
        createdAt:
          -1,
      })
      .limit(
        AI_CONFIG.historyLimit
      )
      .lean();

  return messages
    .reverse()
    .map(
      (
        currentMessage:
          any
      ) => ({
        role:
          currentMessage.role ===
          "assistant"
            ? "assistant"
            : "user",

        content:
          String(
            currentMessage.content ||
              ""
          ),
      })
    );
}

/*
|--------------------------------------------------------------------------
| LATEST TOOL RESULT
|--------------------------------------------------------------------------
*/

function getLatestToolResult(
  toolResults:
    GenericObject[],
  toolNames:
    string[]
): GenericObject | null {
  for (
    let index =
      toolResults.length -
      1;
    index >= 0;
    index -= 1
  ) {
    const item =
      toolResults[
        index
      ];

    if (
      toolNames.includes(
        String(
          item?.tool ||
            ""
        )
      )
    ) {
      const result =
        item?.result;

      if (
        result &&
        typeof result ===
          "object"
      ) {
        return result as
          GenericObject;
      }

      return null;
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| LATEST CONFIRMATION RESULT
|--------------------------------------------------------------------------
*/

function getLatestConfirmationResult(
  toolResults:
    GenericObject[]
) {
  for (
    let index =
      toolResults.length -
      1;
    index >= 0;
    index -= 1
  ) {
    const item =
      toolResults[
        index
      ];

    if (
      item?.result
        ?.confirmationRequired ===
      true
    ) {
      return item;
    }
  }

  return null;
}
/*
|--------------------------------------------------------------------------
| STYLE PROFILE MAPPER
|--------------------------------------------------------------------------
*/

function mapStyleProfile(
  raw:
    any
): StyleProfileContext {
  return {
    preferredColors:
      Array.isArray(
        raw?.preferredColors
      )
        ? raw.preferredColors.map(
            String
          )
        : [],

    dislikedColors:
      Array.isArray(
        raw?.dislikedColors
      )
        ? raw.dislikedColors.map(
            String
          )
        : [],

    preferredSizes:
      Array.isArray(
        raw?.preferredSizes
      )
        ? raw.preferredSizes.map(
            String
          )
        : [],

    preferredFits:
      Array.isArray(
        raw?.preferredFits
      )
        ? raw.preferredFits.map(
            String
          )
        : [],

    preferredCategories:
      Array.isArray(
        raw?.preferredCategories
      )
        ? raw.preferredCategories.map(
            String
          )
        : [],

    preferredBrands:
      Array.isArray(
        raw?.preferredBrands
      )
        ? raw.preferredBrands.map(
            String
          )
        : [],

    preferredStyles:
      Array.isArray(
        raw?.preferredStyles
      )
        ? raw.preferredStyles.map(
            String
          )
        : [],

    preferredFabrics:
      Array.isArray(
        raw?.preferredFabrics
      )
        ? raw.preferredFabrics.map(
            String
          )
        : [],

    preferredOccasions:
      Array.isArray(
        raw?.preferredOccasions
      )
        ? raw.preferredOccasions.map(
            String
          )
        : [],

    minBudget:
      typeof raw?.minBudget ===
      "number"
        ? raw.minBudget
        : null,

    maxBudget:
      typeof raw?.maxBudget ===
      "number"
        ? raw.maxBudget
        : null,

    likedProductIds:
      Array.isArray(
        raw?.likedProductIds
      )
        ? raw.likedProductIds.map(
            (
              id:
                unknown
            ) =>
              String(
                id
              )
          )
        : [],

    dislikedProductIds:
      Array.isArray(
        raw?.dislikedProductIds
      )
        ? raw.dislikedProductIds.map(
            (
              id:
                unknown
            ) =>
              String(
                id
              )
          )
        : [],

    viewedProductIds:
      Array.isArray(
        raw?.viewedProductIds
      )
        ? raw.viewedProductIds.map(
            (
              id:
                unknown
            ) =>
              String(
                id
              )
          )
        : [],

    personalizationEnabled:
      raw?.personalizationEnabled !==
      false,
  };
}

/*
|--------------------------------------------------------------------------
| GET PROFILE FROM RESULT
|--------------------------------------------------------------------------
*/

function getProfileFromResult(
  result:
    unknown
) {
  if (
    !result ||
    typeof result !==
      "object"
  ) {
    return null;
  }

  if (
    !(
      "profile" in
      result
    )
  ) {
    return null;
  }

  const profile =
    (
      result as {
        profile?:
          unknown;
      }
    ).profile;

  return profile ||
    null;
}

/*
|--------------------------------------------------------------------------
| SAFE BOOLEAN
|--------------------------------------------------------------------------
*/

function getBooleanField(
  object:
    GenericObject | null,
  key:
    string
) {
  return (
    object?.[key] ===
    true
  );
}

/*
|--------------------------------------------------------------------------
| SAFE STRING
|--------------------------------------------------------------------------
*/

function getStringField(
  object:
    GenericObject | null,
  key:
    string
) {
  const value =
    object?.[key];

  return typeof value ===
    "string"
    ? value
    : "";
}

/*
|--------------------------------------------------------------------------
| READ STRING FROM INPUT
|--------------------------------------------------------------------------
*/

function readObjectString(
  object:
    Record<
      string,
      unknown
    > | null | undefined,
  key:
    string
) {
  const value =
    object?.[key];

  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

/*
|--------------------------------------------------------------------------
| READ NUMBER FROM INPUT
|--------------------------------------------------------------------------
*/

function readObjectNumber(
  object:
    Record<
      string,
      unknown
    > | null | undefined,
  key:
    string
): number | null {
  const value =
    object?.[key];

  if (
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    )
  ) {
    return value;
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    const parsed =
      Number(
        value
      );

    if (
      Number.isFinite(
        parsed
      )
    ) {
      return parsed;
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| READ FIRST STRING
|--------------------------------------------------------------------------
*/

function readFirstObjectString(
  object:
    Record<
      string,
      unknown
    > | null | undefined,
  keys:
    string[]
) {
  for (
    const key of
    keys
  ) {
    const value =
      readObjectString(
        object,
        key
      );

    if (
      value
    ) {
      return value;
    }
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| GET PENDING CONFIRMATION
|--------------------------------------------------------------------------
|
| SECURITY:
|
| We do not trust model-generated confirmed=true.
|
| A real previous server-side confirmationRequired action must exist.
|
|--------------------------------------------------------------------------
*/

async function getPendingConfirmation(
  conversationId:
    string,
  userId:
    string | null
): Promise<
  PendingConfirmation | null
> {
  try {
    const filter:
      Record<
        string,
        unknown
      > = {
        conversationId,

        userId:
          userId ||
          null,

        requiresConfirmation:
          true,

        status:
          "requested",

        confirmedByUser:
          false,

        toolName: {
          $in:
            Array.from(
              CONFIRMATION_TOOLS
            ),
        },

        "output.confirmationRequired":
          true,
      };

    /*
    |--------------------------------------------------------------------------
    | ONLY A REAL WAITING SERVER-SIDE ACTION CAN BE CONFIRMED
    |--------------------------------------------------------------------------
    */

    const latestLog:
      any =
      await AIActionLog.findOne(
        filter
      )
        .sort({
          confirmationRequestedAt:
            -1,

          createdAt:
            -1,
        })
        .lean();

    if (
      !latestLog
    ) {
      return null;
    }

    const output =
      latestLog.output &&
      typeof latestLog.output ===
        "object" &&
      !Array.isArray(
        latestLog.output
      )
        ? latestLog.output
        : {};

    /*
    |--------------------------------------------------------------------------
    | DEFENCE IN DEPTH
    |--------------------------------------------------------------------------
    */

    if (
      latestLog.status !==
        "requested" ||
      latestLog.confirmedByUser ===
        true ||
      output.confirmationRequired !==
        true
    ) {
      return null;
    }

    const createdAt =
      latestLog.createdAt
        ? new Date(
            latestLog.createdAt
          )
        : null;

    const confirmationRequestedAt =
      latestLog.confirmationRequestedAt
        ? new Date(
            latestLog.confirmationRequestedAt
          )
        : createdAt;

    /*
    |--------------------------------------------------------------------------
    | EXPIRY
    |--------------------------------------------------------------------------
    */

    if (
      confirmationRequestedAt &&
      !Number.isNaN(
        confirmationRequestedAt.getTime()
      )
    ) {
      const age =
        Date.now() -
        confirmationRequestedAt.getTime();

      if (
        age >
        CONFIRMATION_MAX_AGE_MS
      ) {
        await AIActionLog.updateOne(
          {
            _id:
              latestLog._id,

            status:
              "requested",

            confirmedByUser:
              false,

            requiresConfirmation:
              true,

            "output.confirmationRequired":
              true,
          },
          {
            $set: {
              status:
                "rejected",

              rejectedAt:
                new Date(),

              "output.confirmationRequired":
                false,

              "output.confirmationExpired":
                true,

              "output.actionCompleted":
                false,

              "output.message":
                "The pending confirmation expired. No change was made.",
            },
          }
        );

        return null;
      }
    }

    const input =
      latestLog.input &&
      typeof latestLog.input ===
        "object" &&
      !Array.isArray(
        latestLog.input
      )
        ? {
            ...latestLog.input,
          }
        : {};

    /*
    |--------------------------------------------------------------------------
    | NEVER TRUST STORED/MODEL CONFIRMED FLAG
    |--------------------------------------------------------------------------
    */

    delete input.confirmed;

    const orderId =
      readObjectString(
        input,
        "orderId"
      ) ||
      (
        typeof output.orderId ===
          "string"
          ? output.orderId.trim()
          : ""
      );

    const reason =
      readObjectString(
        input,
        "reason"
      ) ||
      (
        typeof output.reason ===
          "string"
          ? output.reason.trim()
          : ""
      );

    return {
      logId:
        String(
          latestLog._id
        ),

      toolName:
        String(
          latestLog.toolName ||
            latestLog.action ||
            ""
        ),

      input,

      orderId,

      reason,

      confirmationRequestedAt,

      createdAt,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN AI pending confirmation lookup error:",
      error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| DECLINE PENDING ACTION
|--------------------------------------------------------------------------
*/

async function markPendingConfirmationDeclined(
  pending:
    PendingConfirmation
) {
  try {
    const result =
      await AIActionLog.updateOne(
        {
          _id:
            pending.logId,

          status:
            "requested",

          confirmedByUser:
            false,

          requiresConfirmation:
            true,

          "output.confirmationRequired":
            true,
        },
        {
          $set: {
            status:
              "rejected",

            confirmedByUser:
              false,

            rejectedAt:
              new Date(),

            "output.confirmationRequired":
              false,

            "output.confirmationDeclined":
              true,

            "output.actionCompleted":
              false,

            "output.message":
              "Customer declined the pending action. No change was made.",
          },
        }
      );

    return (
      result.modifiedCount ===
      1
    );
  } catch (
    error
  ) {
    console.error(
      "SilentGEN AI confirmation decline update error:",
      error
    );

    return false;
  }
}

/*
|--------------------------------------------------------------------------
| ATOMICALLY CLAIM PENDING ACTION
|--------------------------------------------------------------------------
*/

async function claimPendingConfirmation(
  pending:
    PendingConfirmation
) {
  try {
    const result =
      await AIActionLog.updateOne(
        {
          _id:
            pending.logId,

          status:
            "requested",

          confirmedByUser:
            false,

          requiresConfirmation:
            true,

          "output.confirmationRequired":
            true,
        },
        {
          $set: {
            confirmedByUser:
              true,

            confirmedAt:
              new Date(),

            "output.confirmationRequired":
              false,

            "output.confirmationConsumed":
              true,
          },
        }
      );

    return (
      result.modifiedCount ===
      1
    );
  } catch (
    error
  ) {
    console.error(
      "SilentGEN AI confirmation claim error:",
      error
    );

    return false;
  }
}

/*
|--------------------------------------------------------------------------
| CHECK SAME PENDING ACTION
|--------------------------------------------------------------------------
*/

function matchesPendingAction(
  toolName:
    string,
  currentInput:
    Record<
      string,
      unknown
    >,
  pending:
    PendingConfirmation | null
) {
  if (
    !pending
  ) {
    return false;
  }

  if (
    pending.toolName !==
    toolName
  ) {
    return false;
  }

  /*
  |--------------------------------------------------------------------------
  | STYLE PROFILE CLEAR HAS NO ORDER ID
  |--------------------------------------------------------------------------
  */

  if (
    toolName ===
    "clear_style_profile"
  ) {
    return true;
  }

  const pendingOrderId =
    pending.orderId;

  if (
    !pendingOrderId
  ) {
    return false;
  }

  const currentOrderId =
    readObjectString(
      currentInput,
      "orderId"
    );

  /*
  |--------------------------------------------------------------------------
  | DIFFERENT TARGET ORDER = NEVER AUTHORIZE
  |--------------------------------------------------------------------------
  */

  if (
    currentOrderId &&
    currentOrderId !==
      pendingOrderId
  ) {
    return false;
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| BUILD SERVER-AUTHORIZED INPUT
|--------------------------------------------------------------------------
|
| Stored pending arguments override new model-generated arguments.
|
|--------------------------------------------------------------------------
*/

function buildConfirmedToolInput(
  currentInput:
    Record<
      string,
      unknown
    >,
  pending:
    PendingConfirmation
) {
  return {
    ...currentInput,

    ...pending.input,

    confirmed:
      true,
  };
}

/*
|--------------------------------------------------------------------------
| CONFIRMATION SYSTEM CONTEXT
|--------------------------------------------------------------------------
*/

function createConfirmationSecurityPrompt(
  pending:
    PendingConfirmation | null,
  explicitConfirmation:
    boolean,
  explicitRejection:
    boolean
) {
  if (
    explicitRejection
  ) {
    return `
============================================================
SERVER CONFIRMATION STATE
============================================================

The customer explicitly rejected the currently pending consequential action.

Do not execute:

- cancel_order
- request_return
- request_exchange
- clear_style_profile

based on the rejected confirmation.

A rejection must never be interpreted as approval.
`.trim();
  }

  if (
    !pending
  ) {
    return `
============================================================
SERVER CONFIRMATION STATE
============================================================

There is currently NO server-authorized pending consequential action.

For these tools:

- cancel_order
- request_return
- request_exchange
- clear_style_profile

a fresh action request must first create a confirmation-required state.

Do not assume that generating confirmed=true provides authorization.

The server independently controls final confirmation authorization.
`.trim();
  }

  const orderText =
    pending.orderId
      ? `
Pending Order ID:
${pending.orderId}
`
      : "";

  if (
    explicitConfirmation
  ) {
    return `
============================================================
SERVER CONFIRMATION STATE
============================================================

The customer has explicitly confirmed the currently pending server-side action.

Pending Tool:
${pending.toolName}

${orderText}

If the current customer message genuinely confirms this exact pending action:

- Call the SAME consequential tool.
- Do not substitute another action.
- Do not change the target order.
- Do not change the previously stored destructive-action details.

The server will supply the canonical stored arguments.
`.trim();
  }

  return `
============================================================
SERVER CONFIRMATION STATE
============================================================

A consequential action is currently waiting for customer confirmation.

Pending Tool:
${pending.toolName}

${orderText}

The customer has NOT explicitly confirmed the pending action on this turn.

Do not execute it.

Do not treat unrelated messages as approval.
`.trim();
}

/*
|--------------------------------------------------------------------------
| RUNTIME TOOL CAPABILITY CONTEXT
|--------------------------------------------------------------------------
*/

function createRuntimeToolPrompt() {
  return `
============================================================
CURRENT RUNTIME TOOL CAPABILITIES
============================================================

The tool definitions attached to this request are the authoritative current capability list.

SilentGEN AI currently has real tools for:

- Product search
- Product details
- Product stock
- Outfit building
- Cart viewing
- Add to cart
- Cart quantity updates
- Cart removal
- Orders
- Tracking
- Eligible cancellation
- Return requests
- Exchange requests
- Style profile reading
- Style profile updating
- Style profile clearing

If add_cart_item is available, SilentGEN AI CAN add an exact product variant to the authenticated customer's real cart.

For cart actions:

- Never invent productId.
- Never guess required size.
- Never guess required color.
- Respect exact stock.
- Do not claim success before the real backend tool confirms it.

There is no direct AI payment or direct AI place-order capability unless such a tool is explicitly attached to this request.
`.trim();
}

/*
|--------------------------------------------------------------------------
| FALLBACK RESPONSE
|--------------------------------------------------------------------------
*/

function getFallbackAssistantMessage(
  language:
    SilentGenLanguageCode | null
) {
  switch (
    language
  ) {
    case "gu":
      return "માફ કરશો, હમણાં યોગ્ય જવાબ generate થઈ શક્યો નથી. કૃપા કરીને ફરી પ્રયત્ન કરો.";

    case "hi":
      return "माफ़ कीजिए, अभी सही जवाब तैयार नहीं हो पाया। कृपया फिर से कोशिश करें।";

    case "mr":
      return "माफ करा, आत्ता योग्य उत्तर तयार होऊ शकले नाही. कृपया पुन्हा प्रयत्न करा.";

    case "bn":
      return "দুঃখিত, এই মুহূর্তে সঠিক উত্তর তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।";

    case "ta":
      return "மன்னிக்கவும், தற்போது சரியான பதிலை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.";

    case "te":
      return "క్షమించండి, ప్రస్తుతం సరైన సమాధానం రూపొందించలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి.";

    case "kn":
      return "ಕ್ಷಮಿಸಿ, ಈಗ ಸರಿಯಾದ ಉತ್ತರವನ್ನು ರಚಿಸಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";

    case "ml":
      return "ക്ഷമിക്കണം, ഇപ്പോൾ ശരിയായ മറുപടി സൃഷ്ടിക്കാനായില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.";

    case "pa":
      return "ਮਾਫ਼ ਕਰਨਾ, ਇਸ ਵੇਲੇ ਸਹੀ ਜਵਾਬ ਤਿਆਰ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।";

    case "or":
      return "ଦୁଃଖିତ, ବର୍ତ୍ତମାନ ସଠିକ୍ ଉତ୍ତର ତିଆରି ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।";

    case "as":
      return "দুঃখিত, এই মুহূর্তত সঠিক উত্তৰ তৈয়াৰ কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।";

    case "ur":
      return "معذرت، ابھی مناسب جواب تیار نہیں ہو سکا۔ براہِ کرم دوبارہ کوشش کریں۔";

    case "auto":
    case "en":
    default:
      return "Sorry, I could not generate a proper response right now. Please try again.";
  }
}

/*
|--------------------------------------------------------------------------
| GEMINI CONFIG
|--------------------------------------------------------------------------
*/

const DEFAULT_GEMINI_MODEL =
  "gemini-3.6-flash";

function getGeminiApiKey() {
  const key =
    process.env
      .GEMINI_API_KEY
      ?.trim();

  if (
    !key
  ) {
    throw new Error(
      "GEMINI_API_KEY is not configured in .env.local"
    );
  }

  return key;
}

function getGeminiModel() {
  return (
    process.env
      .GEMINI_AI_MODEL
      ?.trim() ||
    DEFAULT_GEMINI_MODEL
  );
}

function getGeminiClient() {
  return new GoogleGenAI(
    {
      apiKey:
        getGeminiApiKey(),
    }
  );
}

/*
|--------------------------------------------------------------------------
| CONVERT SILENTGEN TOOLS TO GEMINI
|--------------------------------------------------------------------------
*/

function convertSilentGenToolsToGemini() {
  const functionDeclarations =
    Array.from(
      silentGenToolDefinitions
    )
      .map(
        (
          tool:
            any
        ) => {
          const source =
            tool?.function &&
            typeof tool.function ===
              "object"
              ? tool.function
              : tool;

          const name =
            typeof source?.name ===
              "string"
              ? source.name.trim()
              : "";

          if (
            !name
          ) {
            return null;
          }

          return {
            name,

            description:
              typeof source?.description ===
              "string"
                ? source.description
                : "",

            parametersJsonSchema:
              source?.parameters &&
              typeof source.parameters ===
                "object"
                ? source.parameters
                : {
                    type:
                      "object",

                    properties:
                      {},

                    additionalProperties:
                      false,
                  },
          };
        }
      )
      .filter(
        Boolean
      );

  return [
    {
      functionDeclarations,
    },
  ];
}

/*
|--------------------------------------------------------------------------
| BUILD GEMINI CONTENTS
|--------------------------------------------------------------------------
*/

function buildGeminiContents(
  history:
    HistoryMessage[]
) {
  return history
    .filter(
      (
        item
      ) =>
        Boolean(
          item.content?.trim()
        )
    )
    .map(
      (
        item
      ) => ({
        role:
          item.role ===
          "assistant"
            ? "model"
            : "user",

        parts: [
          {
            text:
              item.content,
          },
        ],
      })
    );
}

/*
|--------------------------------------------------------------------------
| GET GEMINI MODEL CONTENT
|--------------------------------------------------------------------------
*/

function getGeminiModelContent(
  response:
    any
) {
  const content =
    response
      ?.candidates?.[0]
      ?.content;

  if (
    !content ||
    !Array.isArray(
      content.parts
    )
  ) {
    return null;
  }

  return content;
}

/*
|--------------------------------------------------------------------------
| GET GEMINI FUNCTION CALLS
|--------------------------------------------------------------------------
*/

function getGeminiFunctionCalls(
  response:
    any
) {
  try {
    if (
      Array.isArray(
        response?.functionCalls
      )
    ) {
      return response.functionCalls;
    }
  } catch {
    // Fall through.
  }

  const parts =
    response
      ?.candidates?.[0]
      ?.content
      ?.parts;

  if (
    !Array.isArray(
      parts
    )
  ) {
    return [];
  }

  return parts
    .map(
      (
        part:
          any
      ) =>
        part?.functionCall
    )
    .filter(
      Boolean
    );
}

/*
|--------------------------------------------------------------------------
| GET GEMINI TEXT
|--------------------------------------------------------------------------
*/

function getGeminiText(
  response:
    any
) {
  try {
    if (
      typeof response?.text ===
      "string"
    ) {
      const text =
        response.text.trim();

      if (
        text
      ) {
        return text;
      }
    }
  } catch {
    // Fall through.
  }

  const parts =
    response
      ?.candidates?.[0]
      ?.content
      ?.parts;

  if (
    !Array.isArray(
      parts
    )
  ) {
    return "";
  }

  return parts
    .map(
      (
        part:
          any
      ) =>
        typeof part?.text ===
          "string"
          ? part.text
          : ""
    )
    .filter(
      Boolean
    )
    .join(
      "\n"
    )
    .trim();
}

/*
|--------------------------------------------------------------------------
| GEMINI TOKEN USAGE
|--------------------------------------------------------------------------
*/

function getGeminiUsage(
  response:
    any
) {
  const usage =
    response
      ?.usageMetadata ||
    {};

  return {
    inputTokens:
      Number(
        usage.promptTokenCount ||
          0
      ),

    outputTokens:
      Number(
        usage.candidatesTokenCount ||
          0
      ),
  };
}

/*
|--------------------------------------------------------------------------
| SAFE CUSTOMER MESSAGE LEARNING
|--------------------------------------------------------------------------
|
| This learns explicit customer preferences.
|
| Corrected customerLearningEngine no longer creates a product_view simply
| because the customer sends another AI message while on a product page.
|
|--------------------------------------------------------------------------
*/

function learnFromChatSafely({
  userId,
  sessionId,
  conversationId,
  message,
  currentProductId,
  currentPath,
}: {
  userId:
    string | null;

  sessionId:
    string;

  conversationId:
    string;

  message:
    string;

  currentProductId:
    string | null;

  currentPath:
    string;
}) {
  void learnFromCustomerMessage(
    {
      userId,

      sessionId,

      conversationId,

      message,

      source:
        "ai",

      currentProductId,

      metadata: {
        currentPath,

        context:
          "customer_ai_chat",
      },
    }
  ).catch(
    (
      error
    ) => {
      console.error(
        "SilentGEN AI customer learning error:",
        error
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| RECORD SUCCESSFUL AI TOOL BUSINESS EVENT
|--------------------------------------------------------------------------
|
| Only REAL successful tool actions are recorded.
|
| Important:
|
| - search_products → product_search
| - add_cart_item → add_to_cart
| - confirmed cancel_order → order_cancelled
| - confirmed request_return → return_requested
| - confirmed request_exchange → exchange_requested
|
| get_product is NOT treated as a real browser product_view.
|
|--------------------------------------------------------------------------
*/

function recordSuccessfulAIToolLearning({
  toolName,
  parsedInput,
  result,
  userId,
  sessionId,
  conversationId,
  serverAuthorizedConfirmation,
}: {
  toolName:
    string;

  parsedInput:
    Record<
      string,
      unknown
    >;

  result:
    GenericObject;

  userId:
    string | null;

  sessionId:
    string;

  conversationId:
    string;

  serverAuthorizedConfirmation:
    boolean;
}) {
  /*
  |--------------------------------------------------------------------------
  | ONLY SUCCESSFUL COMPLETED ACTIONS
  |--------------------------------------------------------------------------
  */

  if (
    result?.success ===
      false ||
    result?.confirmationRequired ===
      true
  ) {
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT SEARCH
  |--------------------------------------------------------------------------
  */

  if (
    toolName ===
    "search_products"
  ) {
    const searchQuery =
      readFirstObjectString(
        parsedInput,
        [
          "search",
          "searchText",
          "searchQuery",
          "query",
          "keyword",
          "name",
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | Search with filters only is still useful demand intelligence.
    |--------------------------------------------------------------------------
    */

    const category =
      readObjectString(
        parsedInput,
        "category"
      );

    const gender =
      readObjectString(
        parsedInput,
        "gender"
      );

    const color =
      readObjectString(
        parsedInput,
        "color"
      );

    const size =
      readObjectString(
        parsedInput,
        "size"
      );

    const fit =
      readObjectString(
        parsedInput,
        "fit"
      );

    const fabric =
      readObjectString(
        parsedInput,
        "fabric"
      );

    const minPrice =
      readObjectNumber(
        parsedInput,
        "minPrice"
      );

    const maxPrice =
      readObjectNumber(
        parsedInput,
        "maxPrice"
      );

    void recordLearningBusinessEvent(
      {
        eventType:
          "product_search",

        source:
          "ai",

        userId,

        sessionId,

        conversationId,

        category:
          category ||
          null,

        gender:
          gender ||
          null,

        color:
          color ||
          null,

        size:
          size ||
          null,

        fit:
          fit ||
          null,

        fabric:
          fabric ||
          null,

        searchQuery:
          searchQuery ||
          null,

        metadata: {
          toolName,

          minPrice,

          maxPrice,

          resultCount:
            Array.isArray(
              result?.products
            )
              ? result.products.length
              : null,
        },

        hydrateProductSnapshot:
          false,
      }
    ).catch(
      (
        error
      ) => {
        console.error(
          "SilentGEN AI search learning error:",
          error
        );
      }
    );

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | ADD TO CART
  |--------------------------------------------------------------------------
  */

  if (
    toolName ===
    "add_cart_item"
  ) {
    const productId =
      readObjectString(
        parsedInput,
        "productId"
      );

    if (
      !mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      return;
    }

    const quantity =
      readObjectNumber(
        parsedInput,
        "quantity"
      );

    void recordLearningBusinessEvent(
      {
        eventType:
          "add_to_cart",

        source:
          "ai",

        userId,

        sessionId,

        conversationId,

        productId,

        color:
          readObjectString(
            parsedInput,
            "color"
          ) ||
          null,

        size:
          readObjectString(
            parsedInput,
            "size"
          ) ||
          null,

        quantity,

        metadata: {
          toolName,

          context:
            "customer_ai_tool",
        },

        hydrateProductSnapshot:
          true,
      }
    ).catch(
      (
        error
      ) => {
        console.error(
          "SilentGEN AI cart learning error:",
          error
        );
      }
    );

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | DESTRUCTIVE ORDER EVENTS
  |--------------------------------------------------------------------------
  |
  | These events are recorded ONLY after the server-side confirmation has
  | actually been claimed and the real action succeeds.
  |
  |--------------------------------------------------------------------------
  */

  if (
    !serverAuthorizedConfirmation
  ) {
    return;
  }

  const orderId =
    readObjectString(
      parsedInput,
      "orderId"
    ) ||
    (
      typeof result?.orderId ===
        "string"
        ? result.orderId.trim()
        : ""
    );

  if (
    !mongoose.Types.ObjectId.isValid(
      orderId
    )
  ) {
    return;
  }

  const reason =
    readObjectString(
      parsedInput,
      "reason"
    ) ||
    (
      typeof result?.reason ===
        "string"
        ? result.reason.trim()
        : ""
    );

  if (
    toolName ===
    "cancel_order"
  ) {
    void recordLearningBusinessEvent(
      {
        eventType:
          "order_cancelled",

        source:
          "ai",

        userId,

        sessionId,

        conversationId,

        orderId,

        metadata: {
          toolName,

          reason:
            reason ||
            null,

          confirmed:
            true,
        },

        hydrateProductSnapshot:
          false,
      }
    ).catch(
      (
        error
      ) => {
        console.error(
          "SilentGEN AI cancellation learning error:",
          error
        );
      }
    );

    return;
  }

  if (
    toolName ===
    "request_return"
  ) {
    void recordLearningBusinessEvent(
      {
        eventType:
          "return_requested",

        source:
          "ai",

        userId,

        sessionId,

        conversationId,

        orderId,

        metadata: {
          toolName,

          reason:
            reason ||
            null,

          confirmed:
            true,
        },

        hydrateProductSnapshot:
          false,
      }
    ).catch(
      (
        error
      ) => {
        console.error(
          "SilentGEN AI return learning error:",
          error
        );
      }
    );

    return;
  }

  if (
    toolName ===
    "request_exchange"
  ) {
    void recordLearningBusinessEvent(
      {
        eventType:
          "exchange_requested",

        source:
          "ai",

        userId,

        sessionId,

        conversationId,

        orderId,

        metadata: {
          toolName,

          reason:
            reason ||
            null,

          confirmed:
            true,
        },

        hydrateProductSnapshot:
          false,
      }
    ).catch(
      (
        error
      ) => {
        console.error(
          "SilentGEN AI exchange learning error:",
          error
        );
      }
    );
  }
}
/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export async function POST(
  request:
    NextRequest
) {
  let activeLanguage:
    SilentGenLanguageCode | null =
    null;

  try {
    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | REQUEST BODY
    |--------------------------------------------------------------------------
    */

    let body:
      AIChatBody;

    try {
      body =
        (
          await request.json()
        ) as AIChatBody;
    } catch {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid request body.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | MESSAGE
    |--------------------------------------------------------------------------
    */

    const message =
      typeof body.message ===
      "string"
        ? body.message.trim()
        : "";

    if (
      !message
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Message is required.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      message.length >
      AI_CONFIG.maxMessageLength
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            `Message is too long. Maximum ${AI_CONFIG.maxMessageLength} characters allowed.`,
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER
    |--------------------------------------------------------------------------
    */

    const userId =
      getOptionalAIUserId(
        request
      );

    /*
    |--------------------------------------------------------------------------
    | SESSION
    |--------------------------------------------------------------------------
    */

    const sessionId =
      normalizeSessionId(
        body.sessionId
      ) ||
      createSessionId();

    /*
    |--------------------------------------------------------------------------
    | CURRENT PATH
    |--------------------------------------------------------------------------
    */

    const currentPath =
      normalizeCurrentPath(
        body.currentPath
      );

    /*
    |--------------------------------------------------------------------------
    | REQUESTED LANGUAGE
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Existing customer multilingual system remains unchanged.
    |
    |--------------------------------------------------------------------------
    */

    const requestedLanguage =
      normalizeLanguagePreference(
        body.languagePreference ??
          body.language
      );

    /*
    |--------------------------------------------------------------------------
    | CONVERSATION
    |--------------------------------------------------------------------------
    */

    const conversation =
      await getConversation(
        {
          conversationId:
            body.conversationId,

          sessionId,

          userId,
        }
      );

    const conversationId =
      String(
        conversation._id
      );

    /*
    |--------------------------------------------------------------------------
    | LANGUAGE RESOLUTION
    |--------------------------------------------------------------------------
    |
    | Current request wins.
    |
    | Otherwise use existing saved conversation preference.
    |
    |--------------------------------------------------------------------------
    */

    activeLanguage =
      requestedLanguage ??
      getSavedConversationLanguage(
        conversation
      );

    /*
    |--------------------------------------------------------------------------
    | PENDING SECURE CONFIRMATION
    |--------------------------------------------------------------------------
    */

    let pendingConfirmation =
      await getPendingConfirmation(
        conversationId,
        userId
      );

    const explicitRejection =
      hasExplicitRejection(
        message
      );

    const explicitUserConfirmation =
      !explicitRejection &&
      hasExplicitConfirmation(
        message
      );

    /*
    |--------------------------------------------------------------------------
    | HANDLE CUSTOMER REJECTION BEFORE GEMINI
    |--------------------------------------------------------------------------
    */

    if (
      pendingConfirmation &&
      explicitRejection
    ) {
      await markPendingConfirmationDeclined(
        pendingConfirmation
      );

      pendingConfirmation =
        null;
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE CUSTOMER MESSAGE
    |--------------------------------------------------------------------------
    */

    await AIMessage.create(
      {
        conversationId:
          conversation._id,

        userId:
          userId ||
          null,

        role:
          "user",

        content:
          message,

        languagePreference:
          activeLanguage,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | CONVERSATION TITLE
    |--------------------------------------------------------------------------
    */

    if (
      conversation.title ===
        "New AI Conversation" ||
      !conversation.title
    ) {
      conversation.title =
        createConversationTitle(
          message
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE CONVERSATION METADATA
    |--------------------------------------------------------------------------
    */

    conversation.lastMessageAt =
      new Date();

    conversation.messageCount =
      Number(
        conversation.messageCount ||
          0
      ) + 1;

    conversation.metadata =
      {
        ...(
          conversation.metadata ||
          {}
        ),

        source:
          "website",

        currentPath,

        languagePreference:
          activeLanguage,
      } as any;

    await conversation.save();

    /*
    |--------------------------------------------------------------------------
    | HISTORY
    |--------------------------------------------------------------------------
    */

    const history =
      await getHistory(
        conversationId
      );

    /*
    |--------------------------------------------------------------------------
    | CURRENT PRODUCT ID
    |--------------------------------------------------------------------------
    */

    const currentProductId =
      getProductIdFromPath(
        currentPath
      );

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER PREFERENCE LEARNING
    |--------------------------------------------------------------------------
    |
    | This learns explicit safe shopping preferences such as:
    |
    | "I like black oversized t-shirts"
    | "My size is XL"
    | "I prefer cotton"
    |
    | IMPORTANT:
    |
    | This does NOT count another product_view.
    |
    |--------------------------------------------------------------------------
    */

    learnFromChatSafely(
      {
        userId,

        sessionId,

        conversationId,

        message,

        currentProductId,

        currentPath,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | CURRENT PRODUCT - LIVE DB FACT
    |--------------------------------------------------------------------------
    |
    | Current product information comes from the real product tool/database.
    |
    | Gemini must not invent current product facts.
    |
    |--------------------------------------------------------------------------
    */

    let currentProduct:
      CurrentProductContext | null =
      null;

    if (
      currentProductId
    ) {
      try {
        const productResult =
          await getProduct(
            {
              productId:
                currentProductId,

              slug:
                null,
            }
          );

        if (
          productResult.success &&
          productResult.product
        ) {
          const product =
            productResult.product;

          currentProduct =
            {
              id:
                String(
                  product.id
                ),

              name:
                product.name,

              sku:
                product.sku,

              category:
                product.category,

              subCategory:
                product.subCategory,

              brand:
                product.brand,

              gender:
                product.gender,

              fabric:
                product.fabric,

              fit:
                product.fit,

              mrp:
                product.mrp,

              price:
                product.price,

              discount:
                product.discount,

              stock:
                product.stock,

              sizes:
                Array.isArray(
                  product.sizes
                )
                  ? product.sizes
                  : [],

              colors:
                Array.isArray(
                  product.colors
                )
                  ? product.colors
                  : [],

              shortDescription:
                product.shortDescription,
            };
        }
      } catch (
        error
      ) {
        /*
        |--------------------------------------------------------------------------
        | PRODUCT CONTEXT FAILURE MUST NOT BREAK CHAT
        |--------------------------------------------------------------------------
        */

        console.error(
          "SilentGEN AI current product error:",
          error
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE PROFILE
    |--------------------------------------------------------------------------
    */

    let styleProfile:
      StyleProfileContext | null =
      null;

    if (
      userId
    ) {
      try {
        const profileResult =
          await getAIStyleProfile(
            userId
          );

        const profile =
          getProfileFromResult(
            profileResult
          );

        if (
          profile
        ) {
          styleProfile =
            mapStyleProfile(
              profile
            );
        }
      } catch (
        error
      ) {
        /*
        |--------------------------------------------------------------------------
        | STYLE MEMORY FAILURE MUST NOT BREAK CHAT
        |--------------------------------------------------------------------------
        */

        console.error(
          "SilentGEN AI style profile load error:",
          error
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | SYSTEM PROMPT
    |--------------------------------------------------------------------------
    */

    const baseInstructions =
      createSilentGenSystemPrompt(
        {
          isLoggedIn:
            Boolean(
              userId
            ),

          currentPath,

          currentProduct,

          styleProfile,

          languagePreference:
            activeLanguage,

          languageSelectionCompleted:
            activeLanguage !==
            null,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | SECURE CONFIRMATION INSTRUCTIONS
    |--------------------------------------------------------------------------
    */

    const confirmationInstructions =
      createConfirmationSecurityPrompt(
        pendingConfirmation,
        explicitUserConfirmation,
        explicitRejection
      );

    /*
    |--------------------------------------------------------------------------
    | FINAL SYSTEM INSTRUCTIONS
    |--------------------------------------------------------------------------
    */

    const instructions =
      [
        baseInstructions,

        createRuntimeToolPrompt(),

        confirmationInstructions,
      ]
        .filter(
          Boolean
        )
        .join(
          "\n\n"
        );

    /*
    |--------------------------------------------------------------------------
    | GEMINI CLIENT
    |--------------------------------------------------------------------------
    */

    const gemini =
      getGeminiClient();

    const geminiModel =
      getGeminiModel();

    /*
    |--------------------------------------------------------------------------
    | GEMINI CONVERSATION CONTENT
    |--------------------------------------------------------------------------
    */

    const geminiContents:
      any[] =
      buildGeminiContents(
        history
      );

    /*
    |--------------------------------------------------------------------------
    | GEMINI TOOLS
    |--------------------------------------------------------------------------
    */

    const geminiTools =
      convertSilentGenToolsToGemini();

    /*
    |--------------------------------------------------------------------------
    | INITIAL GEMINI RESPONSE
    |--------------------------------------------------------------------------
    */

    let response:
      any =
      await gemini.models.generateContent(
        {
          model:
            geminiModel,

          contents:
            geminiContents as any,

          config: {
            systemInstruction:
              instructions,

            temperature:
              0.2,

            tools:
              geminiTools as any,
          },
        }
      );

    /*
    |--------------------------------------------------------------------------
    | TOOL RESULTS FOR FRONTEND
    |--------------------------------------------------------------------------
    */

    const frontendToolResults:
      GenericObject[] =
      [];

    /*
    |--------------------------------------------------------------------------
    | USED TOOL NAMES
    |--------------------------------------------------------------------------
    */

    const usedToolNames =
      new Set<string>();

    /*
    |--------------------------------------------------------------------------
    | TOOL LOOP
    |--------------------------------------------------------------------------
    */

    let round =
      0;

    while (
      round <
      AI_CONFIG.maxToolRounds
    ) {
      /*
      |--------------------------------------------------------------------------
      | GET GEMINI FUNCTION CALLS
      |--------------------------------------------------------------------------
      */

      const rawFunctionCalls =
        getGeminiFunctionCalls(
          response
        );

      /*
      |--------------------------------------------------------------------------
      | NORMALIZE FUNCTION CALLS
      |--------------------------------------------------------------------------
      */

      const functionCalls =
        rawFunctionCalls.map(
          (
            call:
              any
          ) => ({
            name:
              String(
                call?.name ||
                  ""
              ),

            arguments:
              JSON.stringify(
                call?.args &&
                typeof call.args ===
                  "object" &&
                !Array.isArray(
                  call.args
                )
                  ? call.args
                  : {}
              ),

            call_id:
              String(
                call?.id ||
                  crypto.randomUUID()
              ),
          })
        );

      /*
      |--------------------------------------------------------------------------
      | NO TOOL CALLS = FINAL MODEL RESPONSE
      |--------------------------------------------------------------------------
      */

      if (
        functionCalls.length ===
        0
      ) {
        break;
      }

      round +=
        1;

      /*
      |--------------------------------------------------------------------------
      | PRESERVE GEMINI FUNCTION CALL CONTENT
      |--------------------------------------------------------------------------
      |
      | Gemini requires the model's function-call content in the conversation
      | when functionResponse is sent back.
      |
      |--------------------------------------------------------------------------
      */

      const modelContent =
        getGeminiModelContent(
          response
        );

      if (
        modelContent
      ) {
        geminiContents.push(
          modelContent
        );
      }

      /*
      |--------------------------------------------------------------------------
      | TOOL RESPONSES FOR GEMINI
      |--------------------------------------------------------------------------
      */

      const toolOutputs:
        any[] =
        [];

      /*
      |--------------------------------------------------------------------------
      | EXECUTE EACH TOOL CALL
      |--------------------------------------------------------------------------
      */

      for (
        const call of
        functionCalls
      ) {
        const toolName =
          String(
            call.name ||
              ""
          ).trim();

        if (
          !toolName
        ) {
          continue;
        }

        usedToolNames.add(
          toolName
        );

        /*
        |--------------------------------------------------------------------------
        | PARSE GEMINI TOOL ARGUMENTS
        |--------------------------------------------------------------------------
        */

        let parsedInput:
          Record<
            string,
            unknown
          > = {};

        try {
          const parsed =
            JSON.parse(
              String(
                call.arguments ||
                  "{}"
              )
            );

          if (
            parsed &&
            typeof parsed ===
              "object" &&
            !Array.isArray(
              parsed
            )
          ) {
            parsedInput =
              parsed;
          }
        } catch {
          parsedInput =
            {};
        }

        /*
        |--------------------------------------------------------------------------
        | CONSEQUENTIAL ACTION
        |--------------------------------------------------------------------------
        */

        const requiresConfirmation =
          CONFIRMATION_TOOLS.has(
            toolName
          );

        let serverAuthorizedConfirmation =
          false;

        let actionRejected =
          false;

        /*
        |--------------------------------------------------------------------------
        | SERVER CONFIRMATION GATE
        |--------------------------------------------------------------------------
        |
        | Gemini's confirmed=true is NEVER authorization.
        |
        | Only:
        |
        | 1. previous server-side pending action
        | 2. customer's explicit confirmation
        | 3. same exact action
        | 4. successful atomic claim
        |
        | can authorize execution.
        |
        |--------------------------------------------------------------------------
        */

        if (
          requiresConfirmation
        ) {
          /*
          |--------------------------------------------------------------------------
          | CUSTOMER EXPLICITLY REJECTED
          |--------------------------------------------------------------------------
          */

          if (
            explicitRejection
          ) {
            actionRejected =
              true;

            parsedInput.confirmed =
              false;
          } else {
            const samePendingAction =
              matchesPendingAction(
                toolName,
                parsedInput,
                pendingConfirmation
              );

            if (
              explicitUserConfirmation &&
              samePendingAction &&
              pendingConfirmation
            ) {
              /*
              |--------------------------------------------------------------------------
              | ATOMIC ONE-TIME CLAIM
              |--------------------------------------------------------------------------
              */

              const claimed =
                await claimPendingConfirmation(
                  pendingConfirmation
                );

              if (
                claimed
              ) {
                serverAuthorizedConfirmation =
                  true;

                /*
                |--------------------------------------------------------------------------
                | STORED SERVER ARGUMENTS ARE AUTHORITATIVE
                |--------------------------------------------------------------------------
                */

                parsedInput =
                  buildConfirmedToolInput(
                    parsedInput,
                    pendingConfirmation
                  );

                /*
                |--------------------------------------------------------------------------
                | ONE CONFIRMATION AUTHORIZES ONE ACTION
                |--------------------------------------------------------------------------
                */

                pendingConfirmation =
                  null;
              } else {
                serverAuthorizedConfirmation =
                  false;

                parsedInput.confirmed =
                  false;
              }
            } else {
              /*
              |--------------------------------------------------------------------------
              | NEVER TRUST MODEL-GENERATED CONFIRMATION
              |--------------------------------------------------------------------------
              */

              parsedInput.confirmed =
                false;
            }
          }
        }

        /*
        |--------------------------------------------------------------------------
        | RESULT STATE
        |--------------------------------------------------------------------------
        */

        let result:
          GenericObject;

        let status:
          AIActionStatus =
          "completed";

        let errorMessage =
          "";
        /*
        |--------------------------------------------------------------------------
        | CUSTOMER REJECTED ACTION
        |--------------------------------------------------------------------------
        */

        if (
          actionRejected
        ) {
          status =
            "rejected";

          result =
            {
              success:
                false,

              confirmationRequired:
                false,

              confirmationDeclined:
                true,

              actionCompleted:
                false,

              message:
                "Customer declined the action. No change was made.",
            };
        } else {
          /*
          |--------------------------------------------------------------------------
          | EXECUTE REAL CUSTOMER TOOL
          |--------------------------------------------------------------------------
          */

          try {
            const executedResult =
              await executeAITool(
                {
                  name:
                    toolName,

                  argumentsJson:
                    JSON.stringify(
                      parsedInput
                    ),

                  userId,
                }
              );

            result =
              (
                executedResult &&
                typeof executedResult ===
                  "object"
              )
                ? executedResult as
                    GenericObject
                : {
                    success:
                      false,

                    message:
                      "Tool returned an invalid response.",
                  };

            /*
            |--------------------------------------------------------------------------
            | TOOL IS WAITING FOR CONFIRMATION
            |--------------------------------------------------------------------------
            */

            if (
              result.confirmationRequired ===
              true
            ) {
              status =
                "requested";
            } else if (
              result.success ===
              false
            ) {
              /*
              |--------------------------------------------------------------------------
              | REAL TOOL FAILED
              |--------------------------------------------------------------------------
              */

              status =
                "failed";

              errorMessage =
                String(
                  result.message ||
                    ""
                );
            }
          } catch (
            error
          ) {
            /*
            |--------------------------------------------------------------------------
            | TOOL EXECUTION ERROR
            |--------------------------------------------------------------------------
            */

            status =
              "failed";

            errorMessage =
              error instanceof
              Error
                ? error.message
                : "Tool execution failed.";

            result =
              {
                success:
                  false,

                message:
                  errorMessage,
              };
          }
        }

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER BUSINESS / LEARNING EVENT
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | This happens only AFTER the real tool has executed.
        |
        | Therefore Admin AI intelligence receives actual behaviour instead of
        | model intentions.
        |
        | Examples:
        |
        | search_products
        |      ↓
        | product_search
        |
        | add_cart_item successful
        |      ↓
        | add_to_cart
        |
        | confirmed + successful cancel_order
        |      ↓
        | order_cancelled
        |
        | confirmed + successful request_return
        |      ↓
        | return_requested
        |
        | confirmed + successful request_exchange
        |      ↓
        | exchange_requested
        |
        |--------------------------------------------------------------------------
        */

        try {
          recordSuccessfulAIToolLearning(
            {
              toolName,

              parsedInput,

              result,

              userId,

              sessionId,

              conversationId,

              serverAuthorizedConfirmation,
            }
          );
        } catch (
          learningError
        ) {
          /*
          |--------------------------------------------------------------------------
          | LEARNING MUST NEVER BREAK CUSTOMER ACTION
          |--------------------------------------------------------------------------
          */

          console.error(
            "SilentGEN AI tool learning error:",
            learningError
          );
        }

        /*
        |--------------------------------------------------------------------------
        | ACTION LOG
        |--------------------------------------------------------------------------
        |
        | Existing action logging remains separate from aggregate customer
        | behaviour intelligence.
        |
        |--------------------------------------------------------------------------
        */

        try {
          await AIActionLog.create(
            {
              userId:
                userId ||
                null,

              conversationId:
                conversation._id,

              action:
                toolName,

              toolName,

              status,

              requiresConfirmation,

              confirmedByUser:
                requiresConfirmation
                  ? serverAuthorizedConfirmation
                  : false,

              confirmationRequestedAt:
                requiresConfirmation &&
                result.confirmationRequired ===
                  true
                  ? new Date()
                  : null,

              confirmedAt:
                serverAuthorizedConfirmation
                  ? new Date()
                  : null,

              rejectedAt:
                status ===
                "rejected"
                  ? new Date()
                  : null,

              input:
                parsedInput,

              output:
                result,

              errorMessage,
            }
          );
        } catch (
          logError
        ) {
          /*
          |--------------------------------------------------------------------------
          | LOG FAILURE MUST NOT BREAK CUSTOMER RESPONSE
          |--------------------------------------------------------------------------
          */

          console.error(
            "SilentGEN AI action log error:",
            logError
          );
        }

        /*
        |--------------------------------------------------------------------------
        | FRONTEND TOOL RESULT
        |--------------------------------------------------------------------------
        */

        frontendToolResults.push(
          {
            tool:
              toolName,

            result,
          }
        );

        /*
        |--------------------------------------------------------------------------
        | RETURN TOOL RESULT TO GEMINI
        |--------------------------------------------------------------------------
        |
        | Gemini functionResponse contains the exact backend result.
        |
        | The model therefore must base its next answer on the real tool result.
        |
        |--------------------------------------------------------------------------
        */

        toolOutputs.push(
          {
            functionResponse: {
              id:
                call.call_id,

              name:
                toolName,

              response:
                result,
            },
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | NO TOOL OUTPUT
      |--------------------------------------------------------------------------
      */

      if (
        toolOutputs.length ===
        0
      ) {
        break;
      }

      /*
      |--------------------------------------------------------------------------
      | ADD REAL TOOL RESULTS TO GEMINI HISTORY
      |--------------------------------------------------------------------------
      */

      geminiContents.push(
        {
          role:
            "user",

          parts:
            toolOutputs,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | CONTINUE GEMINI AFTER TOOL EXECUTION
      |--------------------------------------------------------------------------
      */

      response =
        await gemini.models.generateContent(
          {
            model:
              geminiModel,

            contents:
              geminiContents as any,

            config: {
              systemInstruction:
                instructions,

              temperature:
                0.2,

              tools:
                geminiTools as any,
            },
          }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ASSISTANT TEXT
    |--------------------------------------------------------------------------
    */

    let assistantText =
      getGeminiText(
        response
      );

    if (
      !assistantText
    ) {
      assistantText =
        getFallbackAssistantMessage(
          activeLanguage
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TOKEN USAGE
    |--------------------------------------------------------------------------
    */

    const geminiUsage =
      getGeminiUsage(
        response
      );

    const inputTokens =
      geminiUsage.inputTokens;

    const outputTokens =
      geminiUsage.outputTokens;

    /*
    |--------------------------------------------------------------------------
    | SAVE ASSISTANT MESSAGE
    |--------------------------------------------------------------------------
    */

    await AIMessage.create(
      {
        conversationId:
          conversation._id,

        userId:
          userId ||
          null,

        role:
          "assistant",

        content:
          assistantText,

        /*
        |--------------------------------------------------------------------------
        | Gemini generateContent does not use OpenAI response IDs.
        |--------------------------------------------------------------------------
        */

        responseId:
          "",

        aiModel:
          geminiModel,

        languagePreference:
          activeLanguage,

        inputTokens,

        outputTokens,

        toolNames:
          Array.from(
            usedToolNames
          ),
      }
    );

    /*
    |--------------------------------------------------------------------------
    | UPDATE CONVERSATION
    |--------------------------------------------------------------------------
    */

    conversation.lastResponseId =
      "";

    conversation.lastMessageAt =
      new Date();

    conversation.messageCount =
      Number(
        conversation.messageCount ||
          0
      ) + 1;

    conversation.metadata =
      {
        ...(
          conversation.metadata ||
          {}
        ),

        source:
          "website",

        currentPath,

        languagePreference:
          activeLanguage,
      } as any;

    await conversation.save();

    /*
    |--------------------------------------------------------------------------
    | PRODUCT CARDS
    |--------------------------------------------------------------------------
    */

    const products =
      frontendToolResults
        .flatMap(
          (
            item
          ) => {
            /*
            |--------------------------------------------------------------------------
            | SEARCH PRODUCTS
            |--------------------------------------------------------------------------
            */

            if (
              item.tool ===
                "search_products" &&
              Array.isArray(
                item.result
                  ?.products
              )
            ) {
              return item.result
                .products;
            }

            /*
            |--------------------------------------------------------------------------
            | SINGLE PRODUCT
            |--------------------------------------------------------------------------
            */

            if (
              item.tool ===
                "get_product" &&
              item.result
                ?.product
            ) {
              return [
                item.result
                  .product,
              ];
            }

            /*
            |--------------------------------------------------------------------------
            | OUTFIT PRODUCTS
            |--------------------------------------------------------------------------
            */

            if (
              item.tool ===
                "build_outfit" &&
              Array.isArray(
                item.result
                  ?.products
              )
            ) {
              return item.result
                .products;
            }

            return [];
          }
        )
        .filter(
          Boolean
        );

    /*
    |--------------------------------------------------------------------------
    | REMOVE CURRENT PRODUCT FROM RECOMMENDATION CARDS
    |--------------------------------------------------------------------------
    |
    | If customer is already viewing Product A, don't unnecessarily show the
    | same Product A again as an AI recommendation card.
    |
    |--------------------------------------------------------------------------
    */

    const productsWithoutCurrent =
      currentProductId
        ? products.filter(
            (
              product:
                any
            ) =>
              String(
                product.id ||
                  ""
              ) !==
              String(
                currentProductId
              )
          )
        : products;

    /*
    |--------------------------------------------------------------------------
    | UNIQUE PRODUCTS
    |--------------------------------------------------------------------------
    */

    const uniqueProducts =
      Array.from(
        new Map(
          productsWithoutCurrent
            .filter(
              (
                product:
                  any
              ) =>
                Boolean(
                  product?.id
                )
            )
            .map(
              (
                product:
                  any
              ) => [
                String(
                  product.id
                ),

                product,
              ]
            )
        ).values()
      );

    /*
    |--------------------------------------------------------------------------
    | OUTFIT RESULT
    |--------------------------------------------------------------------------
    */

    const outfit =
      getLatestToolResult(
        frontendToolResults,
        [
          "build_outfit",
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | CART RESULT
    |--------------------------------------------------------------------------
    */

    const latestCartResult =
      getLatestToolResult(
        frontendToolResults,
        [
          "get_cart",
          "add_cart_item",
          "update_cart_quantity",
          "remove_cart_item",
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | ORDER LIST RESULT
    |--------------------------------------------------------------------------
    */

    const latestOrdersResult =
      getLatestToolResult(
        frontendToolResults,
        [
          "get_orders",
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | SINGLE ORDER / ORDER ACTION
    |--------------------------------------------------------------------------
    */

    const latestOrderResult =
      getLatestToolResult(
        frontendToolResults,
        [
          "get_order",
          "cancel_order",
          "request_return",
          "request_exchange",
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | TRACKING
    |--------------------------------------------------------------------------
    */

    const latestTrackingResult =
      getLatestToolResult(
        frontendToolResults,
        [
          "track_order",
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | STYLE PROFILE ACTION
    |--------------------------------------------------------------------------
    */

    const latestStyleProfileResult =
      getLatestToolResult(
        frontendToolResults,
        [
          "get_style_profile",
          "update_style_profile",
          "clear_style_profile",
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | FINAL STYLE PROFILE
    |--------------------------------------------------------------------------
    */

    let finalStyleProfile:
      StyleProfileContext | null =
      styleProfile;

    const latestToolProfile =
      getProfileFromResult(
        latestStyleProfileResult
      );

    if (
      latestToolProfile
    ) {
      finalStyleProfile =
        mapStyleProfile(
          latestToolProfile
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CONFIRMATION RESULT
    |--------------------------------------------------------------------------
    */

    const confirmationResult =
      getLatestConfirmationResult(
        frontendToolResults
      );
    /*
    |--------------------------------------------------------------------------
    | FINAL RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        conversationId:
          String(
            conversation._id
          ),

        sessionId,

        /*
        |--------------------------------------------------------------------------
        | LANGUAGE
        |--------------------------------------------------------------------------
        |
        | Existing customer multilingual system remains unchanged.
        |
        |--------------------------------------------------------------------------
        */

        languagePreference:
          activeLanguage,

        /*
        |--------------------------------------------------------------------------
        | LEGACY LANGUAGE COMPATIBILITY
        |--------------------------------------------------------------------------
        */

        language:
          activeLanguage,

        /*
        |--------------------------------------------------------------------------
        | ASSISTANT MESSAGE
        |--------------------------------------------------------------------------
        */

        message:
          assistantText,

        /*
        |--------------------------------------------------------------------------
        | PRODUCT CARDS
        |--------------------------------------------------------------------------
        */

        products:
          uniqueProducts,

        /*
        |--------------------------------------------------------------------------
        | OUTFIT
        |--------------------------------------------------------------------------
        */

        outfit:
          outfit
            ? {
                baseProduct:
                  outfit.baseProduct ||
                  null,

                baseCategory:
                  outfit.baseCategory ||
                  null,

                baseColor:
                  outfit.baseColor ||
                  null,

                matchingColors:
                  Array.isArray(
                    outfit.matchingColors
                  )
                    ? outfit.matchingColors
                    : [],

                occasion:
                  outfit.occasion ||
                  null,

                style:
                  outfit.style ||
                  null,

                budget:
                  typeof outfit.budget ===
                  "number"
                    ? outfit.budget
                    : null,

                basePrice:
                  Number(
                    outfit.basePrice ||
                      0
                  ),

                selectedTotal:
                  Number(
                    outfit.selectedTotal ||
                      0
                  ),

                withinBudget:
                  typeof outfit.withinBudget ===
                  "boolean"
                    ? outfit.withinBudget
                    : null,

                groups:
                  Array.isArray(
                    outfit.groups
                  )
                    ? outfit.groups
                    : [],

                selectedProducts:
                  Array.isArray(
                    outfit.selectedProducts
                  )
                    ? outfit.selectedProducts
                    : [],
              }
            : null,

        /*
        |--------------------------------------------------------------------------
        | CART
        |--------------------------------------------------------------------------
        */

        cart:
          latestCartResult
            ? {
                success:
                  getBooleanField(
                    latestCartResult,
                    "success"
                  ),

                message:
                  getStringField(
                    latestCartResult,
                    "message"
                  ),

                requiresLogin:
                  getBooleanField(
                    latestCartResult,
                    "requiresLogin"
                  ),

                items:
                  Array.isArray(
                    latestCartResult.items
                  )
                    ? latestCartResult.items
                    : [],

                summary:
                  latestCartResult.summary ||
                  null,

                addedItem:
                  latestCartResult.addedItem ||
                  null,

                updatedItem:
                  latestCartResult.updatedItem ||
                  null,

                removedItem:
                  latestCartResult.removedItem ||
                  null,
              }
            : null,

        /*
        |--------------------------------------------------------------------------
        | ORDERS
        |--------------------------------------------------------------------------
        */

        orders:
          latestOrdersResult
            ? {
                success:
                  getBooleanField(
                    latestOrdersResult,
                    "success"
                  ),

                requiresLogin:
                  getBooleanField(
                    latestOrdersResult,
                    "requiresLogin"
                  ),

                message:
                  getStringField(
                    latestOrdersResult,
                    "message"
                  ),

                count:
                  Number(
                    latestOrdersResult.count ||
                      0
                  ),

                orders:
                  Array.isArray(
                    latestOrdersResult.orders
                  )
                    ? latestOrdersResult.orders
                    : [],
              }
            : null,

        /*
        |--------------------------------------------------------------------------
        | SINGLE ORDER / ORDER ACTION
        |--------------------------------------------------------------------------
        */

        order:
          latestOrderResult ||
          null,

        /*
        |--------------------------------------------------------------------------
        | TRACKING
        |--------------------------------------------------------------------------
        */

        tracking:
          latestTrackingResult ||
          null,

        /*
        |--------------------------------------------------------------------------
        | STYLE PROFILE
        |--------------------------------------------------------------------------
        */

        styleProfile:
          finalStyleProfile
            ? {
                preferredColors:
                  finalStyleProfile
                    .preferredColors,

                dislikedColors:
                  finalStyleProfile
                    .dislikedColors,

                preferredSizes:
                  finalStyleProfile
                    .preferredSizes,

                preferredFits:
                  finalStyleProfile
                    .preferredFits,

                preferredCategories:
                  finalStyleProfile
                    .preferredCategories,

                preferredBrands:
                  finalStyleProfile
                    .preferredBrands,

                preferredStyles:
                  finalStyleProfile
                    .preferredStyles,

                preferredFabrics:
                  finalStyleProfile
                    .preferredFabrics,

                preferredOccasions:
                  finalStyleProfile
                    .preferredOccasions,

                minBudget:
                  finalStyleProfile
                    .minBudget,

                maxBudget:
                  finalStyleProfile
                    .maxBudget,

                likedProductIds:
                  finalStyleProfile
                    .likedProductIds,

                dislikedProductIds:
                  finalStyleProfile
                    .dislikedProductIds,

                viewedProductIds:
                  finalStyleProfile
                    .viewedProductIds,

                personalizationEnabled:
                  finalStyleProfile
                    .personalizationEnabled,
              }
            : null,

        /*
        |--------------------------------------------------------------------------
        | STYLE PROFILE ACTION
        |--------------------------------------------------------------------------
        */

        styleProfileAction:
          latestStyleProfileResult
            ? {
                success:
                  getBooleanField(
                    latestStyleProfileResult,
                    "success"
                  ),

                requiresLogin:
                  getBooleanField(
                    latestStyleProfileResult,
                    "requiresLogin"
                  ),

                message:
                  getStringField(
                    latestStyleProfileResult,
                    "message"
                  ),
              }
            : null,

        /*
        |--------------------------------------------------------------------------
        | SECURE CONFIRMATION CARD
        |--------------------------------------------------------------------------
        |
        | The actual destructive action remains controlled by the server-side
        | confirmation state.
        |
        | assistantText is used so the confirmation message remains in the
        | customer's currently selected language.
        |
        |--------------------------------------------------------------------------
        */

        confirmation:
          confirmationResult
            ? {
                required:
                  true,

                tool:
                  String(
                    confirmationResult.tool ||
                      ""
                  ),

                action:
                  String(
                    confirmationResult.result
                      ?.action ||
                      confirmationResult.tool ||
                      ""
                  ),

                orderId:
                  String(
                    confirmationResult.result
                      ?.orderId ||
                      ""
                  ),

                reason:
                  confirmationResult.result
                    ?.reason ||
                  null,

                message:
                  assistantText ||
                  String(
                    confirmationResult.result
                      ?.message ||
                      "Confirmation required."
                  ),
              }
            : null,

        /*
        |--------------------------------------------------------------------------
        | CURRENT PRODUCT
        |--------------------------------------------------------------------------
        |
        | This comes from the real Product DB lookup performed earlier in the
        | request.
        |
        |--------------------------------------------------------------------------
        */

        currentProduct:
          currentProduct
            ? {
                id:
                  currentProduct.id,

                name:
                  currentProduct.name,

                category:
                  currentProduct.category,

                subCategory:
                  currentProduct.subCategory,

                colors:
                  currentProduct.colors ||
                  [],

                sizes:
                  currentProduct.sizes ||
                  [],

                price:
                  currentProduct.price,

                stock:
                  currentProduct.stock,
              }
            : null,

        /*
        |--------------------------------------------------------------------------
        | DEVELOPMENT DEBUGGING
        |--------------------------------------------------------------------------
        */

        toolResults:
          process.env.NODE_ENV ===
          "development"
            ? frontendToolResults
            : undefined,

        /*
        |--------------------------------------------------------------------------
        | AI MODEL
        |--------------------------------------------------------------------------
        */

        model:
          geminiModel,
      },
      {
        status:
          200,
      }
    );
  } catch (
    error
  ) {
    /*
    |--------------------------------------------------------------------------
    | TOP LEVEL ERROR
    |--------------------------------------------------------------------------
    */

    console.error(
      "SilentGEN AI Gemini Chat Error:",
      error
    );

    const errorMessage =
      error instanceof
      Error
        ? error.message
        : "Unknown AI error.";

    /*
    |--------------------------------------------------------------------------
    | GEMINI CONFIGURATION ERROR
    |--------------------------------------------------------------------------
    */

    const isGeminiConfigError =
      errorMessage.includes(
        "GEMINI_API_KEY"
      );

    /*
    |--------------------------------------------------------------------------
    | GEMINI MODEL ERROR
    |--------------------------------------------------------------------------
    */

    const isGeminiModelError =
      errorMessage
        .toLowerCase()
        .includes(
          "model"
        ) &&
      (
        errorMessage.includes(
          "404"
        ) ||
        errorMessage
          .toLowerCase()
          .includes(
            "not found"
          ) ||
        errorMessage
          .toLowerCase()
          .includes(
            "not available"
          )
      );

    /*
    |--------------------------------------------------------------------------
    | GEMINI RATE LIMIT / QUOTA ERROR
    |--------------------------------------------------------------------------
    */

    const isGeminiRateLimitError =
      errorMessage.includes(
        "429"
      ) ||
      errorMessage
        .toLowerCase()
        .includes(
          "quota"
        ) ||
      errorMessage
        .toLowerCase()
        .includes(
          "rate limit"
        ) ||
      errorMessage
        .toLowerCase()
        .includes(
          "resource_exhausted"
        );

    /*
    |--------------------------------------------------------------------------
    | ERROR MESSAGE
    |--------------------------------------------------------------------------
    */

    let publicMessage =
      getFallbackAssistantMessage(
        activeLanguage
      );

    if (
      isGeminiConfigError
    ) {
      publicMessage =
        "SilentGEN AI is not configured yet.";
    } else if (
      isGeminiModelError
    ) {
      publicMessage =
        "SilentGEN AI model is currently unavailable. Please try again shortly.";
    } else if (
      isGeminiRateLimitError
    ) {
      publicMessage =
        "SilentGEN AI is temporarily busy. Please try again shortly.";
    }

    /*
    |--------------------------------------------------------------------------
    | ERROR RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          false,

        languagePreference:
          activeLanguage,

        language:
          activeLanguage,

        message:
          publicMessage,
      },
      {
        status:
          isGeminiConfigError
            ? 503
            : isGeminiRateLimitError
              ? 429
              : isGeminiModelError
                ? 503
                : 500,
      }
    );
  }
}