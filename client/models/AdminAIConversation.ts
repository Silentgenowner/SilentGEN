import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| ADMIN AI CONVERSATION
|--------------------------------------------------------------------------
|
| Separate conversation model for SilentGEN Admin AI.
|
| IMPORTANT:
|
| - Customer AI and Admin AI histories remain completely separate.
| - Each conversation belongs to one admin.
| - Admin role is stored as conversation context.
| - No customer-sensitive data should be copied here unnecessarily.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| ADMIN ROLE
|--------------------------------------------------------------------------
*/

export type AdminAIAdminRole =
  | "super_admin"
  | "product_manager"
  | "order_manager"
  | "support_admin"
  | "finance_manager";

/*
|--------------------------------------------------------------------------
| CONVERSATION STATUS
|--------------------------------------------------------------------------
*/

export type AdminAIConversationStatus =
  | "active"
  | "archived";

/*
|--------------------------------------------------------------------------
| CONVERSATION SOURCE
|--------------------------------------------------------------------------
*/

export type AdminAIConversationSource =
  | "admin_dashboard"
  | "admin_products"
  | "admin_orders"
  | "admin_customers"
  | "admin_reports"
  | "admin_settings"
  | "admin_ai";

/*
|--------------------------------------------------------------------------
| PERIOD
|--------------------------------------------------------------------------
*/

export type AdminAIBusinessPeriod =
  | "daily"
  | "weekly"
  | "monthly";

/*
|--------------------------------------------------------------------------
| METADATA
|--------------------------------------------------------------------------
*/

export type AdminAIConversationMetadata = {
  source:
    AdminAIConversationSource;

  currentPath?:
    string;

  adminRole?:
    AdminAIAdminRole;

  businessPeriod?:
    AdminAIBusinessPeriod;

  language?:
    string;

  lastToolName?:
    string;

  lastActionType?:
    string;
};

/*
|--------------------------------------------------------------------------
| DOCUMENT
|--------------------------------------------------------------------------
*/

export interface IAdminAIConversation
  extends Document {
  adminId:
    Types.ObjectId;

  sessionId:
    string;

  title:
    string;

  status:
    AdminAIConversationStatus;

  messageCount:
    number;

  lastMessageAt:
    Date;

  metadata:
    AdminAIConversationMetadata;

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
  120;

const MAX_PATH_LENGTH =
  400;

const MAX_LANGUAGE_LENGTH =
  50;

const MAX_TOOL_NAME_LENGTH =
  120;

const MAX_ACTION_TYPE_LENGTH =
  120;

/*
|--------------------------------------------------------------------------
| CLEAN STRING
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
| NORMALIZE MESSAGE COUNT
|--------------------------------------------------------------------------
*/

function normalizeMessageCount(
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
    ) ||
    number < 0
  ) {
    return 0;
  }

  return Math.floor(
    number
  );
}

/*
|--------------------------------------------------------------------------
| METADATA SCHEMA
|--------------------------------------------------------------------------
*/

const AdminAIConversationMetadataSchema =
  new Schema<AdminAIConversationMetadata>(
    {
      source: {
        type:
          String,

        enum: [
          "admin_dashboard",
          "admin_products",
          "admin_orders",
          "admin_customers",
          "admin_reports",
          "admin_settings",
          "admin_ai",
        ],

        default:
          "admin_ai",
      },

      currentPath: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_PATH_LENGTH,
      },

      adminRole: {
        type:
          String,

        enum: [
          "super_admin",
          "product_manager",
          "order_manager",
          "support_admin",
          "finance_manager",
        ],

        default:
          "super_admin",
      },

      businessPeriod: {
        type:
          String,

        enum: [
          "daily",
          "weekly",
          "monthly",
        ],

        default:
          "weekly",
      },

      language: {
        type:
          String,

        default:
          "en",

        trim:
          true,

        maxlength:
          MAX_LANGUAGE_LENGTH,
      },

      lastToolName: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TOOL_NAME_LENGTH,
      },

      lastActionType: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_ACTION_TYPE_LENGTH,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| MAIN SCHEMA
|--------------------------------------------------------------------------
*/

const AdminAIConversationSchema =
  new Schema<IAdminAIConversation>(
    {
      /*
      |--------------------------------------------------------------------------
      | ADMIN
      |--------------------------------------------------------------------------
      */

      adminId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Admin",

        required:
          true,

        index:
          false,
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

        default:
          "New Admin AI Conversation",

        trim:
          true,

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
          "archived",
        ],

        default:
          "active",
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
      | METADATA
      |--------------------------------------------------------------------------
      */

      metadata: {
        type:
          AdminAIConversationMetadataSchema,

        default: () => ({
          source:
            "admin_ai",

          currentPath:
            "",

          adminRole:
            "super_admin",

          businessPeriod:
            "weekly",

          language:
            "en",

          lastToolName:
            "",

          lastActionType:
            "",
        }),
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
| PRE VALIDATE
|--------------------------------------------------------------------------
|
| Mongoose 9 compatible.
|
|--------------------------------------------------------------------------
*/

AdminAIConversationSchema.pre(
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
      "New Admin AI Conversation";

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
    | LAST MESSAGE DATE
    |--------------------------------------------------------------------------
    */

    if (
      !(
        this.lastMessageAt instanceof
        Date
      ) ||
      Number.isNaN(
        this.lastMessageAt.getTime()
      )
    ) {
      this.lastMessageAt =
        new Date();
    }

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
          "admin_ai",

        currentPath:
          "",

        adminRole:
          "super_admin",

        businessPeriod:
          "weekly",

        language:
          "en",

        lastToolName:
          "",

        lastActionType:
          "",
      };
    }

    this.metadata.currentPath =
      cleanString(
        this.metadata.currentPath,
        MAX_PATH_LENGTH
      );

    this.metadata.language =
      cleanString(
        this.metadata.language,
        MAX_LANGUAGE_LENGTH
      ) ||
      "en";

    this.metadata.lastToolName =
      cleanString(
        this.metadata.lastToolName,
        MAX_TOOL_NAME_LENGTH
      );

    this.metadata.lastActionType =
      cleanString(
        this.metadata.lastActionType,
        MAX_ACTION_TYPE_LENGTH
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
| ADMIN CONVERSATION HISTORY
|--------------------------------------------------------------------------
*/

AdminAIConversationSchema.index(
  {
    adminId:
      1,

    lastMessageAt:
      -1,
  },
  {
    name:
      "admin_ai_conversation_admin_last_message",
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN ACTIVE CONVERSATIONS
|--------------------------------------------------------------------------
*/

AdminAIConversationSchema.index(
  {
    adminId:
      1,

    status:
      1,

    lastMessageAt:
      -1,
  },
  {
    name:
      "admin_ai_conversation_admin_status_last_message",
  }
);

/*
|--------------------------------------------------------------------------
| SESSION LOOKUP
|--------------------------------------------------------------------------
*/

AdminAIConversationSchema.index(
  {
    adminId:
      1,

    sessionId:
      1,
  },
  {
    name:
      "admin_ai_conversation_admin_session",
  }
);

/*
|--------------------------------------------------------------------------
| ROLE HISTORY
|--------------------------------------------------------------------------
*/

AdminAIConversationSchema.index(
  {
    "metadata.adminRole":
      1,

    lastMessageAt:
      -1,
  },
  {
    name:
      "admin_ai_conversation_role_last_message",
  }
);

/*
|--------------------------------------------------------------------------
| BUSINESS PERIOD
|--------------------------------------------------------------------------
*/

AdminAIConversationSchema.index(
  {
    "metadata.businessPeriod":
      1,

    lastMessageAt:
      -1,
  },
  {
    name:
      "admin_ai_conversation_period_last_message",
  }
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const AdminAIConversation =
  (
    mongoose.models
      .AdminAIConversation as
      Model<IAdminAIConversation>
  ) ||
  mongoose.model<IAdminAIConversation>(
    "AdminAIConversation",
    AdminAIConversationSchema
  );

export default AdminAIConversation;