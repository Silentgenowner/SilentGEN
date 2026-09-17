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

export type AIConversationStatus =
  | "active"
  | "closed"
  | "archived";

/*
|--------------------------------------------------------------------------
| METADATA
|--------------------------------------------------------------------------
*/

export interface IAIConversationMetadata {
  source?: string;

  /*
  |--------------------------------------------------------------------------
  | CANONICAL LANGUAGE FIELD
  |--------------------------------------------------------------------------
  |
  | null:
  | Customer has not selected a language yet.
  |
  | "auto":
  | Customer explicitly selected Auto Detect.
  |
  */

  languagePreference?:
    | SilentGenLanguageCode
    | null;

  /*
  |--------------------------------------------------------------------------
  | LEGACY LANGUAGE FIELD
  |--------------------------------------------------------------------------
  |
  | Read-only compatibility for older conversation documents.
  |
  | New code should use languagePreference.
  |
  */

  language?: string;

  currentPath?: string;
}

/*
|--------------------------------------------------------------------------
| CONVERSATION DOCUMENT
|--------------------------------------------------------------------------
*/

export interface IAIConversation
  extends Document {
  userId?:
    | Types.ObjectId
    | null;

  sessionId:
    string;

  title:
    string;

  status:
    AIConversationStatus;

  lastMessageAt:
    Date;

  lastResponseId?:
    string;

  messageCount:
    number;

  metadata?:
    IAIConversationMetadata;

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

const MAX_SESSION_ID_LENGTH =
  150;

const MAX_TITLE_LENGTH =
  160;

const MAX_RESPONSE_ID_LENGTH =
  300;

const MAX_SOURCE_LENGTH =
  80;

const MAX_LANGUAGE_LENGTH =
  40;

const MAX_PATH_LENGTH =
  300;

/*
|--------------------------------------------------------------------------
| LANGUAGE ENUM
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Do not maintain a second hard-coded language-code list here.
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
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(
  value:
    unknown,
  maxLength:
    number
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
| PATH CLEANER
|--------------------------------------------------------------------------
*/

function cleanPath(
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
      MAX_PATH_LENGTH
    );
}

/*
|--------------------------------------------------------------------------
| MESSAGE COUNT
|--------------------------------------------------------------------------
*/

function normalizeMessageCount(
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
| DATE VALIDATOR
|--------------------------------------------------------------------------
*/

function normalizeDate(
  value:
    unknown
) {
  if (
    value instanceof
      Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return value;
  }

  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {
    const parsed =
      new Date(
        value
      );

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      return parsed;
    }
  }

  return new Date();
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

const AIConversationSchema =
  new Schema<IAIConversation>(
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

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | SESSION
      |--------------------------------------------------------------------------
      */

      sessionId: {
        type:
          String,

        required:
          true,

        trim:
          true,

        minlength:
          8,

        maxlength:
          MAX_SESSION_ID_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | TITLE
      |--------------------------------------------------------------------------
      */

      title: {
        type:
          String,

        trim:
          true,

        default:
          "New AI Conversation",

        maxlength:
          MAX_TITLE_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | STATUS
      |--------------------------------------------------------------------------
      */

      status: {
        type:
          String,

        enum: [
          "active",
          "closed",
          "archived",
        ],

        default:
          "active",
      },

      /*
      |--------------------------------------------------------------------------
      | LAST MESSAGE
      |--------------------------------------------------------------------------
      */

      lastMessageAt: {
        type:
          Date,

        default:
          Date.now,
      },

      /*
      |--------------------------------------------------------------------------
      | OPENAI RESPONSE ID
      |--------------------------------------------------------------------------
      */

      lastResponseId: {
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
      | MESSAGE COUNT
      |--------------------------------------------------------------------------
      */

      messageCount: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      /*
      |--------------------------------------------------------------------------
      | METADATA
      |--------------------------------------------------------------------------
      */

      metadata: {
        source: {
          type:
            String,

          trim:
            true,

          default:
            "website",

          maxlength:
            MAX_SOURCE_LENGTH,
        },

        /*
        |--------------------------------------------------------------------------
        | CANONICAL LANGUAGE PREFERENCE
        |--------------------------------------------------------------------------
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
        | LEGACY LANGUAGE
        |--------------------------------------------------------------------------
        |
        | Keep temporarily for old MongoDB documents.
        |
        */

        language: {
          type:
            String,

          trim:
            true,

          default:
            "",

          maxlength:
            MAX_LANGUAGE_LENGTH,
        },

        /*
        |--------------------------------------------------------------------------
        | CURRENT PAGE
        |--------------------------------------------------------------------------
        */

        currentPath: {
          type:
            String,

          trim:
            true,

          default:
            "",

          maxlength:
            MAX_PATH_LENGTH,
        },
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
| Mongoose 9 middleware.
|
| Do NOT use next().
|
|--------------------------------------------------------------------------
*/

AIConversationSchema.pre(
  "validate",
  function () {
    /*
    |--------------------------------------------------------------------------
    | SESSION
    |--------------------------------------------------------------------------
    */

    this.sessionId =
      cleanString(
        this.sessionId,
        MAX_SESSION_ID_LENGTH
      );

    /*
    |--------------------------------------------------------------------------
    | TITLE
    |--------------------------------------------------------------------------
    */

    this.title =
      cleanString(
        this.title,
        MAX_TITLE_LENGTH
      ) ||
      "New AI Conversation";

    /*
    |--------------------------------------------------------------------------
    | RESPONSE ID
    |--------------------------------------------------------------------------
    */

    this.lastResponseId =
      cleanString(
        this.lastResponseId,
        MAX_RESPONSE_ID_LENGTH
      );

    /*
    |--------------------------------------------------------------------------
    | MESSAGE COUNT
    |--------------------------------------------------------------------------
    */

    this.messageCount =
      normalizeMessageCount(
        this.messageCount
      );

    /*
    |--------------------------------------------------------------------------
    | LAST MESSAGE
    |--------------------------------------------------------------------------
    */

    this.lastMessageAt =
      normalizeDate(
        this.lastMessageAt
      );

    /*
    |--------------------------------------------------------------------------
    | METADATA
    |--------------------------------------------------------------------------
    */

    if (
      !this.metadata
    ) {
      this.metadata = {
        source:
          "website",

        languagePreference:
          null,

        language:
          "",

        currentPath:
          "",
      };
    }

    this.metadata.source =
      cleanString(
        this.metadata.source,
        MAX_SOURCE_LENGTH
      ) ||
      "website";

    this.metadata.currentPath =
      cleanPath(
        this.metadata.currentPath
      );

    /*
    |--------------------------------------------------------------------------
    | CANONICAL LANGUAGE
    |--------------------------------------------------------------------------
    |
    | null and "auto" MUST remain different.
    |
    */

    this.metadata.languagePreference =
      normalizeLanguagePreference(
        this.metadata
          .languagePreference
      );

    /*
    |--------------------------------------------------------------------------
    | LEGACY LANGUAGE
    |--------------------------------------------------------------------------
    */

    this.metadata.language =
      cleanString(
        this.metadata.language,
        MAX_LANGUAGE_LENGTH
      );

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT LEGACY RULE
    |--------------------------------------------------------------------------
    |
    | We intentionally do NOT automatically copy:
    |
    | metadata.language
    |
    | into:
    |
    | metadata.languagePreference
    |
    | on every save.
    |
    | Reason:
    |
    | null is a meaningful canonical state:
    | "customer has not selected a language".
    |
    | The chat route may still read legacy language as a fallback when
    | handling an old conversation.
    |
    |--------------------------------------------------------------------------
    */
  }
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CUSTOMER CONVERSATION HISTORY
|--------------------------------------------------------------------------
*/

AIConversationSchema.index(
  {
    userId:
      1,

    lastMessageAt:
      -1,
  },
  {
    name:
      "ai_conversation_user_last_message",
  }
);

/*
|--------------------------------------------------------------------------
| GUEST / SESSION CONVERSATION HISTORY
|--------------------------------------------------------------------------
*/

AIConversationSchema.index(
  {
    sessionId:
      1,

    lastMessageAt:
      -1,
  },
  {
    name:
      "ai_conversation_session_last_message",
  }
);

/*
|--------------------------------------------------------------------------
| CUSTOMER + STATUS
|--------------------------------------------------------------------------
*/

AIConversationSchema.index(
  {
    userId:
      1,

    status:
      1,

    lastMessageAt:
      -1,
  },
  {
    name:
      "ai_conversation_user_status_last_message",
  }
);

/*
|--------------------------------------------------------------------------
| SESSION + STATUS
|--------------------------------------------------------------------------
*/

AIConversationSchema.index(
  {
    sessionId:
      1,

    status:
      1,

    lastMessageAt:
      -1,
  },
  {
    name:
      "ai_conversation_session_status_last_message",
  }
);

/*
|--------------------------------------------------------------------------
| GLOBAL RECENT CONVERSATIONS
|--------------------------------------------------------------------------
*/

AIConversationSchema.index(
  {
    lastMessageAt:
      -1,
  },
  {
    name:
      "ai_conversation_last_message",
  }
);

/*
|--------------------------------------------------------------------------
| LANGUAGE HISTORY LOOKUP
|--------------------------------------------------------------------------
*/

AIConversationSchema.index(
  {
    "metadata.languagePreference":
      1,

    lastMessageAt:
      -1,
  },
  {
    name:
      "ai_conversation_language_last_message",
  }
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const AIConversation =
  (
    mongoose.models
      .AIConversation as
      Model<IAIConversation>
  ) ||
  mongoose.model<IAIConversation>(
    "AIConversation",
    AIConversationSchema
  );

export default AIConversation;