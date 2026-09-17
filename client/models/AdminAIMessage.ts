import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| ADMIN AI MESSAGE
|--------------------------------------------------------------------------
|
| Separate message storage for SilentGEN Admin AI.
|
| Customer AI messages must NEVER be stored in this collection.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| MESSAGE ROLE
|--------------------------------------------------------------------------
*/

export type AdminAIMessageRole =
  | "admin"
  | "assistant"
  | "tool";

/*
|--------------------------------------------------------------------------
| ADMIN ROLE
|--------------------------------------------------------------------------
*/

export type AdminAIMessageAdminRole =
  | "super_admin"
  | "product_manager"
  | "order_manager"
  | "support_admin"
  | "finance_manager";

/*
|--------------------------------------------------------------------------
| MESSAGE TYPE
|--------------------------------------------------------------------------
*/

export type AdminAIMessageType =
  | "chat"
  | "tool_call"
  | "tool_result"
  | "business_insight"
  | "action_confirmation"
  | "system_notice";

/*
|--------------------------------------------------------------------------
| TOOL STATUS
|--------------------------------------------------------------------------
*/

export type AdminAIToolStatus =
  | "requested"
  | "completed"
  | "failed"
  | "rejected"
  | "not_applicable";

/*
|--------------------------------------------------------------------------
| TOKEN USAGE
|--------------------------------------------------------------------------
*/

export type AdminAIMessageTokenUsage = {
  inputTokens:
    number;

  outputTokens:
    number;

  totalTokens:
    number;
};

/*
|--------------------------------------------------------------------------
| TOOL CONTEXT
|--------------------------------------------------------------------------
*/

export type AdminAIMessageToolContext = {
  toolName:
    string;

  toolCallId:
    string;

  status:
    AdminAIToolStatus;

  requiresConfirmation:
    boolean;

  confirmedByAdmin:
    boolean;

  input:
    Record<
      string,
      unknown
    >;

  output:
    Record<
      string,
      unknown
    >;

  errorMessage:
    string;
};

/*
|--------------------------------------------------------------------------
| BUSINESS CONTEXT
|--------------------------------------------------------------------------
*/

export type AdminAIMessageBusinessContext = {
  period:
    "daily"
    | "weekly"
    | "monthly"
    | "";

  snapshotId:
    string;

  staleData:
    boolean;

  recommendationIds:
    string[];

  productIds:
    string[];

  orderIds:
    string[];

  categoryNames:
    string[];

  insightType:
    string;
};

/*
|--------------------------------------------------------------------------
| DOCUMENT
|--------------------------------------------------------------------------
*/

export interface IAdminAIMessage
  extends Document {
  conversationId:
    Types.ObjectId;

  adminId:
    Types.ObjectId;

  role:
    AdminAIMessageRole;

  messageType:
    AdminAIMessageType;

  content:
    string;

  adminRole:
    AdminAIMessageAdminRole;

  language:
    string;

  aiModel:
    string;

  tool:
    AdminAIMessageToolContext;

  businessContext:
    AdminAIMessageBusinessContext;

  tokenUsage:
    AdminAIMessageTokenUsage;

  metadata:
    Record<
      string,
      unknown
    >;

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

const MAX_CONTENT_LENGTH =
  50_000;

const MAX_LANGUAGE_LENGTH =
  50;

const MAX_MODEL_LENGTH =
  150;

const MAX_TOOL_NAME_LENGTH =
  150;

const MAX_TOOL_CALL_ID_LENGTH =
  250;

const MAX_ERROR_LENGTH =
  2000;

const MAX_INSIGHT_TYPE_LENGTH =
  150;

const MAX_REFERENCE_VALUES =
  100;

const MAX_REFERENCE_LENGTH =
  250;

const MAX_METADATA_KEYS =
  50;

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
| CONTENT
|--------------------------------------------------------------------------
|
| Do not collapse newlines in assistant/admin chat content.
|
|--------------------------------------------------------------------------
*/

function cleanContent(
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
      MAX_CONTENT_LENGTH
    );
}

/*
|--------------------------------------------------------------------------
| NUMBER
|--------------------------------------------------------------------------
*/

function safeInteger(
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
| STRING ARRAY
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

  const output:
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
        item,
        MAX_REFERENCE_LENGTH
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
      MAX_REFERENCE_VALUES
    ) {
      break;
    }
  }

  return output;
}

/*
|--------------------------------------------------------------------------
| SAFE OBJECT VALUE
|--------------------------------------------------------------------------
*/

function sanitizeObjectValue(
  value:
    unknown,
  depth =
    0
):
  unknown {
  if (
    depth >
    4
  ) {
    return null;
  }

  if (
    value ===
      null ||
    typeof value ===
      "boolean" ||
    typeof value ===
      "number"
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    return value.slice(
      0,
      2000
    );
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .slice(
        0,
        50
      )
      .map(
        (
          item
        ) =>
          sanitizeObjectValue(
            item,
            depth + 1
          )
      );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const output:
      Record<
        string,
        unknown
      > = {};

    for (
      const [
        key,
        item,
      ] of Object.entries(
        value as
          Record<
            string,
            unknown
          >
      ).slice(
        0,
        50
      )
    ) {
      const cleanKey =
        cleanString(
          key,
          100
        );

      if (
        !cleanKey
      ) {
        continue;
      }

      output[
        cleanKey
      ] =
        sanitizeObjectValue(
          item,
          depth + 1
        );
    }

    return output;
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| SAFE OBJECT
|--------------------------------------------------------------------------
*/

function sanitizeObject(
  value:
    unknown
):
  Record<
    string,
    unknown
  > {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {
    return {};
  }

  const blockedKeys =
    new Set([
      "password",
      "otp",
      "token",
      "authorization",
      "cookie",
      "secret",
      "apikey",
      "api_key",
      "access_token",
      "refresh_token",
      "accesstoken",
      "refreshtoken",
      "cvv",
    ]);

  const output:
    Record<
      string,
      unknown
    > = {};

  for (
    const [
      key,
      item,
    ] of Object.entries(
      value as
        Record<
          string,
          unknown
        >
    ).slice(
      0,
      MAX_METADATA_KEYS
    )
  ) {
    const cleanKey =
      cleanString(
        key,
        100
      );

    if (
      !cleanKey
    ) {
      continue;
    }

    const lookup =
      cleanKey
        .replace(
          /[^a-z0-9]/gi,
          ""
        )
        .toLowerCase();

    if (
      blockedKeys.has(
        lookup
      )
    ) {
      continue;
    }

    output[
      cleanKey
    ] =
      sanitizeObjectValue(
        item
      );
  }

  return output;
}

/*
|--------------------------------------------------------------------------
| TOKEN USAGE SCHEMA
|--------------------------------------------------------------------------
*/

const AdminAITokenUsageSchema =
  new Schema<AdminAIMessageTokenUsage>(
    {
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

      totalTokens: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| TOOL CONTEXT SCHEMA
|--------------------------------------------------------------------------
*/

const AdminAIToolContextSchema =
  new Schema<AdminAIMessageToolContext>(
    {
      toolName: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TOOL_NAME_LENGTH,
      },

      toolCallId: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TOOL_CALL_ID_LENGTH,
      },

      status: {
        type:
          String,

        enum: [
          "requested",
          "completed",
          "failed",
          "rejected",
          "not_applicable",
        ],

        default:
          "not_applicable",
      },

      requiresConfirmation: {
        type:
          Boolean,

        default:
          false,
      },

      confirmedByAdmin: {
        type:
          Boolean,

        default:
          false,
      },

      input: {
        type:
          Schema.Types.Mixed,

        default:
          {},
      },

      output: {
        type:
          Schema.Types.Mixed,

        default:
          {},
      },

      errorMessage: {
        type:
          String,

        default:
          "",

        maxlength:
          MAX_ERROR_LENGTH,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| BUSINESS CONTEXT SCHEMA
|--------------------------------------------------------------------------
*/

const AdminAIBusinessContextSchema =
  new Schema<AdminAIMessageBusinessContext>(
    {
      period: {
        type:
          String,

        enum: [
          "",
          "daily",
          "weekly",
          "monthly",
        ],

        default:
          "",
      },

      snapshotId: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_REFERENCE_LENGTH,
      },

      staleData: {
        type:
          Boolean,

        default:
          false,
      },

      recommendationIds: {
        type: [
          String,
        ],

        default:
          [],
      },

      productIds: {
        type: [
          String,
        ],

        default:
          [],
      },

      orderIds: {
        type: [
          String,
        ],

        default:
          [],
      },

      categoryNames: {
        type: [
          String,
        ],

        default:
          [],
      },

      insightType: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_INSIGHT_TYPE_LENGTH,
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

const AdminAIMessageSchema =
  new Schema<IAdminAIMessage>(
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
          "AdminAIConversation",

        required:
          true,
      },

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
      },

      /*
      |--------------------------------------------------------------------------
      | ROLE
      |--------------------------------------------------------------------------
      */

      role: {
        type:
          String,

        required:
          true,

        enum: [
          "admin",
          "assistant",
          "tool",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | MESSAGE TYPE
      |--------------------------------------------------------------------------
      */

      messageType: {
        type:
          String,

        enum: [
          "chat",
          "tool_call",
          "tool_result",
          "business_insight",
          "action_confirmation",
          "system_notice",
        ],

        default:
          "chat",
      },

      /*
      |--------------------------------------------------------------------------
      | CONTENT
      |--------------------------------------------------------------------------
      */

      content: {
        type:
          String,

        default:
          "",

        maxlength:
          MAX_CONTENT_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | ADMIN ROLE
      |--------------------------------------------------------------------------
      */

      adminRole: {
        type:
          String,

        required:
          true,

        enum: [
          "super_admin",
          "product_manager",
          "order_manager",
          "support_admin",
          "finance_manager",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | LANGUAGE
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | AI MODEL
      |--------------------------------------------------------------------------
      */

      aiModel: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_MODEL_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | TOOL CONTEXT
      |--------------------------------------------------------------------------
      */

      tool: {
        type:
          AdminAIToolContextSchema,

        default: () => ({
          toolName:
            "",

          toolCallId:
            "",

          status:
            "not_applicable",

          requiresConfirmation:
            false,

          confirmedByAdmin:
            false,

          input:
            {},

          output:
            {},

          errorMessage:
            "",
        }),
      },

      /*
      |--------------------------------------------------------------------------
      | BUSINESS CONTEXT
      |--------------------------------------------------------------------------
      */

      businessContext: {
        type:
          AdminAIBusinessContextSchema,

        default: () => ({
          period:
            "",

          snapshotId:
            "",

          staleData:
            false,

          recommendationIds:
            [],

          productIds:
            [],

          orderIds:
            [],

          categoryNames:
            [],

          insightType:
            "",
        }),
      },

      /*
      |--------------------------------------------------------------------------
      | TOKEN USAGE
      |--------------------------------------------------------------------------
      */

      tokenUsage: {
        type:
          AdminAITokenUsageSchema,

        default: () => ({
          inputTokens:
            0,

          outputTokens:
            0,

          totalTokens:
            0,
        }),
      },

      /*
      |--------------------------------------------------------------------------
      | METADATA
      |--------------------------------------------------------------------------
      */

      metadata: {
        type:
          Schema.Types.Mixed,

        default:
          {},
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
| Mongoose 9 callbackless hook.
|
|--------------------------------------------------------------------------
*/

AdminAIMessageSchema.pre(
  "validate",
  function () {
    /*
    |--------------------------------------------------------------------------
    | CONTENT
    |--------------------------------------------------------------------------
    */

    this.content =
      cleanContent(
        this.content
      );

    /*
    |--------------------------------------------------------------------------
    | LANGUAGE
    |--------------------------------------------------------------------------
    */

    this.language =
      cleanString(
        this.language,
        MAX_LANGUAGE_LENGTH
      ) ||
      "en";

    /*
    |--------------------------------------------------------------------------
    | MODEL
    |--------------------------------------------------------------------------
    */

    this.aiModel =
      cleanString(
        this.aiModel,
        MAX_MODEL_LENGTH
      );

    /*
    |--------------------------------------------------------------------------
    | TOOL
    |--------------------------------------------------------------------------
    */

    if (
      !this.tool
    ) {
      this.tool = {
        toolName:
          "",

        toolCallId:
          "",

        status:
          "not_applicable",

        requiresConfirmation:
          false,

        confirmedByAdmin:
          false,

        input:
          {},

        output:
          {},

        errorMessage:
          "",
      };
    }

    this.tool.toolName =
      cleanString(
        this.tool.toolName,
        MAX_TOOL_NAME_LENGTH
      );

    this.tool.toolCallId =
      cleanString(
        this.tool.toolCallId,
        MAX_TOOL_CALL_ID_LENGTH
      );

    this.tool.errorMessage =
      cleanString(
        this.tool.errorMessage,
        MAX_ERROR_LENGTH
      );

    this.tool.input =
      sanitizeObject(
        this.tool.input
      );

    this.tool.output =
      sanitizeObject(
        this.tool.output
      );

    /*
    |--------------------------------------------------------------------------
    | CONFIRMATION CONSISTENCY
    |--------------------------------------------------------------------------
    */

    if (
      this.tool.requiresConfirmation !==
      true
    ) {
      this.tool.confirmedByAdmin =
        false;
    }

    if (
      this.tool.status ===
      "rejected"
    ) {
      this.tool.confirmedByAdmin =
        false;
    }

    /*
    |--------------------------------------------------------------------------
    | BUSINESS CONTEXT
    |--------------------------------------------------------------------------
    */

    if (
      !this.businessContext
    ) {
      this.businessContext = {
        period:
          "",

        snapshotId:
          "",

        staleData:
          false,

        recommendationIds:
          [],

        productIds:
          [],

        orderIds:
          [],

        categoryNames:
          [],

        insightType:
          "",
      };
    }

    this.businessContext.snapshotId =
      cleanString(
        this.businessContext.snapshotId,
        MAX_REFERENCE_LENGTH
      );

    this.businessContext.recommendationIds =
      normalizeStringArray(
        this.businessContext
          .recommendationIds
      );

    this.businessContext.productIds =
      normalizeStringArray(
        this.businessContext
          .productIds
      );

    this.businessContext.orderIds =
      normalizeStringArray(
        this.businessContext
          .orderIds
      );

    this.businessContext.categoryNames =
      normalizeStringArray(
        this.businessContext
          .categoryNames
      );

    this.businessContext.insightType =
      cleanString(
        this.businessContext.insightType,
        MAX_INSIGHT_TYPE_LENGTH
      );

    /*
    |--------------------------------------------------------------------------
    | TOKEN USAGE
    |--------------------------------------------------------------------------
    */

    if (
      !this.tokenUsage
    ) {
      this.tokenUsage = {
        inputTokens:
          0,

        outputTokens:
          0,

        totalTokens:
          0,
      };
    }

    this.tokenUsage.inputTokens =
      safeInteger(
        this.tokenUsage.inputTokens
      );

    this.tokenUsage.outputTokens =
      safeInteger(
        this.tokenUsage.outputTokens
      );

    this.tokenUsage.totalTokens =
      safeInteger(
        this.tokenUsage.totalTokens
      );

    if (
      this.tokenUsage.totalTokens ===
      0
    ) {
      this.tokenUsage.totalTokens =
        this.tokenUsage.inputTokens +
        this.tokenUsage.outputTokens;
    }

    /*
    |--------------------------------------------------------------------------
    | METADATA
    |--------------------------------------------------------------------------
    */

    this.metadata =
      sanitizeObject(
        this.metadata
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
*/

AdminAIMessageSchema.index(
  {
    conversationId:
      1,

    createdAt:
      1,
  },
  {
    name:
      "admin_ai_message_conversation_created",
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN HISTORY
|--------------------------------------------------------------------------
*/

AdminAIMessageSchema.index(
  {
    adminId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_message_admin_created",
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN + CONVERSATION SECURITY LOOKUP
|--------------------------------------------------------------------------
*/

AdminAIMessageSchema.index(
  {
    adminId:
      1,

    conversationId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_message_admin_conversation_created",
  }
);

/*
|--------------------------------------------------------------------------
| ROLE ANALYTICS
|--------------------------------------------------------------------------
*/

AdminAIMessageSchema.index(
  {
    adminRole:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_message_role_created",
  }
);

/*
|--------------------------------------------------------------------------
| MESSAGE TYPE
|--------------------------------------------------------------------------
*/

AdminAIMessageSchema.index(
  {
    messageType:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_message_type_created",
  }
);

/*
|--------------------------------------------------------------------------
| TOOL HISTORY
|--------------------------------------------------------------------------
*/

AdminAIMessageSchema.index(
  {
    "tool.toolName":
      1,

    "tool.status":
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_message_tool_status_created",
  }
);

/*
|--------------------------------------------------------------------------
| BUSINESS PERIOD
|--------------------------------------------------------------------------
*/

AdminAIMessageSchema.index(
  {
    "businessContext.period":
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_message_business_period_created",
  }
);

/*
|--------------------------------------------------------------------------
| PRODUCT CONTEXT
|--------------------------------------------------------------------------
*/

AdminAIMessageSchema.index(
  {
    "businessContext.productIds":
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_message_product_context_created",
  }
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const AdminAIMessage =
  (
    mongoose.models
      .AdminAIMessage as
      Model<IAdminAIMessage>
  ) ||
  mongoose.model<IAdminAIMessage>(
    "AdminAIMessage",
    AdminAIMessageSchema
  );

export default AdminAIMessage;