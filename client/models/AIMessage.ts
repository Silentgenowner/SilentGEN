import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

import {
  SILENTGEN_LANGUAGES,
  isSilentGenLanguageCode,
  type SilentGenLanguageCode,
} from "@/lib/ai/languageConfig";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type AIMessageRole =
  | "user"
  | "assistant"
  | "system";

/*
|--------------------------------------------------------------------------
| AI MESSAGE INTERFACE
|--------------------------------------------------------------------------
*/

export interface IAIMessage
  extends Document {
  conversationId:
    Types.ObjectId;

  userId?:
    | Types.ObjectId
    | null;

  role:
    AIMessageRole;

  content:
    string;

  responseId?:
    string;

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | Keep this field as:
  |
  | aiModel
  |
  | Do NOT rename it to "model".
  |
  | "model" can conflict with Mongoose Document APIs.
  |
  */

  aiModel?:
    string;

  /*
  |--------------------------------------------------------------------------
  | LANGUAGE
  |--------------------------------------------------------------------------
  */

  languagePreference?:
    | SilentGenLanguageCode
    | null;

  /*
  |--------------------------------------------------------------------------
  | DETECTED LANGUAGE
  |--------------------------------------------------------------------------
  |
  | Optional informational field.
  |
  | Useful especially when:
  |
  | languagePreference = "auto"
  |
  */

  detectedLanguage?:
    string;

  /*
  |--------------------------------------------------------------------------
  | TOKEN USAGE
  |--------------------------------------------------------------------------
  */

  inputTokens?:
    number;

  outputTokens?:
    number;

  /*
  |--------------------------------------------------------------------------
  | TOOLS
  |--------------------------------------------------------------------------
  */

  toolNames?:
    string[];

  createdAt:
    Date;

  updatedAt:
    Date;
}

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_RESPONSE_ID_LENGTH =
  300;

const MAX_MODEL_NAME_LENGTH =
  150;

const MAX_DETECTED_LANGUAGE_LENGTH =
  80;

const MAX_TOOL_NAME_LENGTH =
  120;

const MAX_TOOL_NAMES =
  50;

/*
|--------------------------------------------------------------------------
| LANGUAGE ENUM
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Do not maintain a second hard-coded language list here.
|
| lib/ai/languageConfig.ts is the single source of truth.
|
|--------------------------------------------------------------------------
*/

const SILENTGEN_LANGUAGE_CODES:
  SilentGenLanguageCode[] =
  SILENTGEN_LANGUAGES.map(
    (
      language
    ) =>
      language.code
  );

/*
|--------------------------------------------------------------------------
| CLEAN STRING
|--------------------------------------------------------------------------
*/

function cleanString(
  value:
    unknown,
  maxLength?:
    number
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  const clean =
    value.trim();

  if (
    typeof maxLength ===
      "number" &&
    maxLength >
      0
  ) {
    return clean.slice(
      0,
      maxLength
    );
  }

  return clean;
}

/*
|--------------------------------------------------------------------------
| TOKEN COUNT
|--------------------------------------------------------------------------
*/

function normalizeTokenCount(
  value:
    unknown
) {
  const parsed =
    Math.floor(
      Number(
        value
      )
    );

  if (
    !Number.isFinite(
      parsed
    ) ||
    parsed <
      0
  ) {
    return 0;
  }

  return parsed;
}

/*
|--------------------------------------------------------------------------
| TOOL NAMES
|--------------------------------------------------------------------------
*/

function normalizeToolNames(
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
        value,
        MAX_TOOL_NAME_LENGTH
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

    output.push(
      clean
    );

    if (
      output.length >=
      MAX_TOOL_NAMES
    ) {
      break;
    }
  }

  return output;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE LANGUAGE PREFERENCE
|--------------------------------------------------------------------------
*/

function normalizeLanguagePreference(
  value:
    unknown
):
  | SilentGenLanguageCode
  | null {
  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | null = no explicit language preference
  |
  | "auto" = customer explicitly selected Auto Detect
  |
  */

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

  if (
    isSilentGenLanguageCode(
      value
    )
  ) {
    return value;
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| SCHEMA
|--------------------------------------------------------------------------
*/

const AIMessageSchema =
  new Schema<IAIMessage>(
    {
      /*
      |--------------------------------------------------------------------------
      | CONVERSATION
      |--------------------------------------------------------------------------
      */

      conversationId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "AIConversation",

        required:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | CUSTOMER
      |--------------------------------------------------------------------------
      |
      | null = guest message
      |
      */

      userId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | ROLE
      |--------------------------------------------------------------------------
      */

      role: {
        type:
          String,

        enum: [
          "user",
          "assistant",
          "system",
        ],

        required:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | CONTENT
      |--------------------------------------------------------------------------
      */

      content: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | OPENAI RESPONSE ID
      |--------------------------------------------------------------------------
      */

      responseId: {
        type:
          String,

        trim:
          true,

        default:
          "",

        maxlength:
          MAX_RESPONSE_ID_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | AI MODEL
      |--------------------------------------------------------------------------
      */

      aiModel: {
        type:
          String,

        trim:
          true,

        default:
          "",

        maxlength:
          MAX_MODEL_NAME_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | LANGUAGE PREFERENCE
      |--------------------------------------------------------------------------
      |
      | Canonical customer language preference for this message.
      |
      | null:
      | no explicit preference saved on this message.
      |
      | "auto":
      | customer explicitly selected Auto Detect.
      |
      */

      languagePreference: {
        type:
          String,

        enum: [
          ...SILENTGEN_LANGUAGE_CODES,
          null,
        ],

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | DETECTED LANGUAGE
      |--------------------------------------------------------------------------
      |
      | Optional future/current runtime metadata.
      |
      | This does NOT replace languagePreference.
      |
      */

      detectedLanguage: {
        type:
          String,

        trim:
          true,

        default:
          "",

        maxlength:
          MAX_DETECTED_LANGUAGE_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | TOKEN USAGE
      |--------------------------------------------------------------------------
      */

      inputTokens: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      outputTokens: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      /*
      |--------------------------------------------------------------------------
      | TOOLS USED
      |--------------------------------------------------------------------------
      */

      toolNames: {
        type:
          [String],

        default:
          [],
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
| Do NOT use next().
|
|--------------------------------------------------------------------------
*/

AIMessageSchema.pre(
  "validate",
  function () {
    /*
    |--------------------------------------------------------------------------
    | CONTENT
    |--------------------------------------------------------------------------
    */

    this.content =
      cleanString(
        this.content
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE ID
    |--------------------------------------------------------------------------
    */

    this.responseId =
      cleanString(
        this.responseId,
        MAX_RESPONSE_ID_LENGTH
      );

    /*
    |--------------------------------------------------------------------------
    | AI MODEL
    |--------------------------------------------------------------------------
    */

    this.aiModel =
      cleanString(
        this.aiModel,
        MAX_MODEL_NAME_LENGTH
      );

    /*
    |--------------------------------------------------------------------------
    | TOKEN COUNTS
    |--------------------------------------------------------------------------
    */

    this.inputTokens =
      normalizeTokenCount(
        this.inputTokens
      );

    this.outputTokens =
      normalizeTokenCount(
        this.outputTokens
      );

    /*
    |--------------------------------------------------------------------------
    | TOOL NAMES
    |--------------------------------------------------------------------------
    */

    this.toolNames =
      normalizeToolNames(
        this.toolNames
      );

    /*
    |--------------------------------------------------------------------------
    | LANGUAGE PREFERENCE
    |--------------------------------------------------------------------------
    */

    this.languagePreference =
      normalizeLanguagePreference(
        this.languagePreference
      );

    /*
    |--------------------------------------------------------------------------
    | DETECTED LANGUAGE
    |--------------------------------------------------------------------------
    */

    this.detectedLanguage =
      cleanString(
        this.detectedLanguage,
        MAX_DETECTED_LANGUAGE_LENGTH
      );
  }
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONVERSATION HISTORY
|--------------------------------------------------------------------------
|
| chat route reads newest conversation messages first.
|
|--------------------------------------------------------------------------
*/

AIMessageSchema.index(
  {
    conversationId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "ai_message_conversation_created",
  }
);

/*
|--------------------------------------------------------------------------
| CONVERSATION + ROLE
|--------------------------------------------------------------------------
*/

AIMessageSchema.index(
  {
    conversationId:
      1,

    role:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "ai_message_conversation_role_created",
  }
);

/*
|--------------------------------------------------------------------------
| CUSTOMER MESSAGE HISTORY
|--------------------------------------------------------------------------
*/

AIMessageSchema.index(
  {
    userId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "ai_message_user_created",
  }
);

/*
|--------------------------------------------------------------------------
| RESPONSE LOOKUP
|--------------------------------------------------------------------------
|
| Useful for debugging a stored assistant message against an OpenAI response.
|
| Empty responseId values are excluded.
|
|--------------------------------------------------------------------------
*/

AIMessageSchema.index(
  {
    responseId:
      1,
  },
  {
    name:
      "ai_message_response_id",

    partialFilterExpression: {
      responseId: {
        $type:
          "string",

        $ne:
          "",
      },
    },
  }
);

/*
|--------------------------------------------------------------------------
| LANGUAGE HISTORY
|--------------------------------------------------------------------------
*/

AIMessageSchema.index(
  {
    languagePreference:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "ai_message_language_created",
  }
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const AIMessage =
  (
    mongoose.models
      .AIMessage as
      Model<IAIMessage>
  ) ||
  mongoose.model<IAIMessage>(
    "AIMessage",
    AIMessageSchema
  );

export default AIMessage;