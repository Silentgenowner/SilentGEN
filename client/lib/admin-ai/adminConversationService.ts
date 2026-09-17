import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import AdminAIConversation, {
  type AdminAIAdminRole,
  type AdminAIBusinessPeriod,
  type AdminAIConversationSource,
  type AdminAIConversationStatus,
} from "@/models/AdminAIConversation";

import AdminAIMessage, {
  type AdminAIMessageAdminRole,
  type AdminAIMessageBusinessContext,
  type AdminAIMessageRole,
  type AdminAIMessageToolContext,
  type AdminAIMessageType,
  type AdminAIToolStatus,
} from "@/models/AdminAIMessage";

import type {
  AdminRole,
} from "@/lib/admin-ai/adminPermissions";

import type {
  AdminAILanguage,
} from "@/lib/admin-ai/prompts/adminSystemPrompt";

/*
|--------------------------------------------------------------------------
| SILENTGEN ADMIN AI CONVERSATION SERVICE
|--------------------------------------------------------------------------
|
| Responsibilities:
|
| - create Admin AI conversations
| - load owned conversations
| - update conversation metadata
| - save admin / assistant / tool messages
| - load message history
| - archive conversations
| - enforce admin ownership
|
| Customer AI data is completely separate.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_MESSAGE_LIMIT =
  30;

const MAX_MESSAGE_LIMIT =
  100;

const DEFAULT_CONVERSATION_LIMIT =
  30;

const MAX_CONVERSATION_LIMIT =
  100;

const MAX_SESSION_ID_LENGTH =
  150;

const MAX_TITLE_LENGTH =
  120;

const MAX_CONTENT_LENGTH =
  50_000;

const MAX_PATH_LENGTH =
  400;

const MAX_LANGUAGE_LENGTH =
  10;

const MAX_MODEL_LENGTH =
  150;

const MAX_TOOL_NAME_LENGTH =
  150;

const MAX_TOOL_CALL_ID_LENGTH =
  250;

const MAX_ERROR_LENGTH =
  2000;

const MAX_REFERENCE_VALUES =
  100;

const MAX_REFERENCE_LENGTH =
  250;

/*
|--------------------------------------------------------------------------
| CREATE CONVERSATION INPUT
|--------------------------------------------------------------------------
*/

export type CreateAdminAIConversationInput = {
  adminId:
    string;

  adminRole:
    AdminRole;

  sessionId:
    string;

  title?:
    string | null;

  source?:
    AdminAIConversationSource;

  currentPath?:
    string | null;

  businessPeriod?:
    AdminAIBusinessPeriod;

  language?:
    AdminAILanguage;
};

/*
|--------------------------------------------------------------------------
| UPDATE CONVERSATION INPUT
|--------------------------------------------------------------------------
*/

export type UpdateAdminAIConversationInput = {
  adminId:
    string;

  conversationId:
    string;

  title?:
    string | null;

  status?:
    AdminAIConversationStatus;

  source?:
    AdminAIConversationSource;

  currentPath?:
    string | null;

  adminRole?:
    AdminRole;

  businessPeriod?:
    AdminAIBusinessPeriod;

  language?:
    AdminAILanguage;

  lastToolName?:
    string | null;

  lastActionType?:
    string | null;
};

/*
|--------------------------------------------------------------------------
| SAVE MESSAGE INPUT
|--------------------------------------------------------------------------
*/

export type SaveAdminAIMessageInput = {
  adminId:
    string;

  adminRole:
    AdminRole;

  conversationId:
    string;

  role:
    AdminAIMessageRole;

  messageType?:
    AdminAIMessageType;

  content?:
    string | null;

  language?:
    AdminAILanguage;

  aiModel?:
    string | null;

  tool?:
    Partial<AdminAIMessageToolContext> | null;

  businessContext?:
    Partial<AdminAIMessageBusinessContext> | null;

  tokenUsage?: {
    inputTokens?:
      number;

    outputTokens?:
      number;

    totalTokens?:
      number;
  } | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;
};

/*
|--------------------------------------------------------------------------
| LIST CONVERSATIONS INPUT
|--------------------------------------------------------------------------
*/

export type ListAdminAIConversationsInput = {
  adminId:
    string;

  status?:
    AdminAIConversationStatus | null;

  limit?:
    number;
};

/*
|--------------------------------------------------------------------------
| GET HISTORY INPUT
|--------------------------------------------------------------------------
*/

export type GetAdminAIHistoryInput = {
  adminId:
    string;

  conversationId:
    string;

  limit?:
    number;
};

/*
|--------------------------------------------------------------------------
| RESULT
|--------------------------------------------------------------------------
*/

export type AdminAIConversationServiceResult<T> = {
  success:
    boolean;

  message:
    string;

  data:
    T | null;
};

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
| CLEAN CONTENT
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
| OBJECT ID
|--------------------------------------------------------------------------
*/

function normalizeObjectId(
  value:
    unknown
):
  string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const clean =
    value.trim();

  if (
    !mongoose.Types.ObjectId.isValid(
      clean
    )
  ) {
    return null;
  }

  return clean;
}

/*
|--------------------------------------------------------------------------
| LIMIT
|--------------------------------------------------------------------------
*/

function normalizeLimit(
  value:
    unknown,
  fallback:
    number,
  maximum:
    number
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(
      1,
      Math.floor(
        number
      )
    )
  );
}

/*
|--------------------------------------------------------------------------
| LANGUAGE
|--------------------------------------------------------------------------
*/

function normalizeLanguage(
  value:
    unknown
):
  AdminAILanguage {
  if (
    value ===
      "gu" ||
    value ===
      "hi"
  ) {
    return value;
  }

  return "en";
}

/*
|--------------------------------------------------------------------------
| BUSINESS PERIOD
|--------------------------------------------------------------------------
*/

function normalizeBusinessPeriod(
  value:
    unknown
):
  AdminAIBusinessPeriod {
  if (
    value ===
      "daily" ||
    value ===
      "monthly"
  ) {
    return value;
  }

  return "weekly";
}

/*
|--------------------------------------------------------------------------
| SOURCE
|--------------------------------------------------------------------------
*/

function normalizeSource(
  value:
    unknown
):
  AdminAIConversationSource {
  const allowed:
    AdminAIConversationSource[] = [
    "admin_dashboard",
    "admin_products",
    "admin_orders",
    "admin_customers",
    "admin_reports",
    "admin_settings",
    "admin_ai",
  ];

  if (
    typeof value ===
      "string" &&
    allowed.includes(
      value as
        AdminAIConversationSource
    )
  ) {
    return value as
      AdminAIConversationSource;
  }

  return "admin_ai";
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function normalizeConversationStatus(
  value:
    unknown
):
  AdminAIConversationStatus {
  return value ===
    "archived"
    ? "archived"
    : "active";
}

/*
|--------------------------------------------------------------------------
| TOOL STATUS
|--------------------------------------------------------------------------
*/

function normalizeToolStatus(
  value:
    unknown
):
  AdminAIToolStatus {
  const allowed:
    AdminAIToolStatus[] = [
    "requested",
    "completed",
    "failed",
    "rejected",
    "not_applicable",
  ];

  if (
    typeof value ===
      "string" &&
    allowed.includes(
      value as
        AdminAIToolStatus
    )
  ) {
    return value as
      AdminAIToolStatus;
  }

  return "not_applicable";
}

/*
|--------------------------------------------------------------------------
| ROLE
|--------------------------------------------------------------------------
*/

function normalizeAdminRole(
  role:
    AdminRole
):
  AdminAIAdminRole {
  return role;
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
| SAFE NUMBER
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
| DEFAULT TITLE
|--------------------------------------------------------------------------
*/

function buildDefaultConversationTitle(
  value:
    unknown
) {
  const text =
    cleanString(
      value,
      MAX_TITLE_LENGTH
    );

  return text ||
    "New Admin AI Conversation";
}

/*
|--------------------------------------------------------------------------
| OWNED CONVERSATION QUERY
|--------------------------------------------------------------------------
*/

function buildOwnedConversationQuery(
  adminId:
    string,
  conversationId:
    string
) {
  return {
    _id:
      conversationId,

    adminId,
  };
}

/*
|--------------------------------------------------------------------------
| CREATE CONVERSATION
|--------------------------------------------------------------------------
*/

export async function createAdminAIConversation(
  input:
    CreateAdminAIConversationInput
) {
  try {
    await connectDB();

    const adminId =
      normalizeObjectId(
        input.adminId
      );

    if (
      !adminId
    ) {
      return {
        success:
          false,

        message:
          "Invalid admin id.",

        data:
          null,
      };
    }

    const sessionId =
      cleanString(
        input.sessionId,
        MAX_SESSION_ID_LENGTH
      );

    if (
      !sessionId
    ) {
      return {
        success:
          false,

        message:
          "Admin AI session id is required.",

        data:
          null,
      };
    }

    const conversation =
      await AdminAIConversation.create(
        {
          adminId,

          sessionId,

          title:
            buildDefaultConversationTitle(
              input.title
            ),

          status:
            "active",

          messageCount:
            0,

          lastMessageAt:
            new Date(),

          metadata: {
            source:
              normalizeSource(
                input.source
              ),

            currentPath:
              cleanString(
                input.currentPath,
                MAX_PATH_LENGTH
              ),

            adminRole:
              normalizeAdminRole(
                input.adminRole
              ),

            businessPeriod:
              normalizeBusinessPeriod(
                input.businessPeriod
              ),

            language:
              normalizeLanguage(
                input.language
              ),

            lastToolName:
              "",

            lastActionType:
              "",
          },
        }
      );

    return {
      success:
        true,

      message:
        "Admin AI conversation created successfully.",

      data:
        conversation,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI conversation create error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to create Admin AI conversation.",

      data:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| GET OWNED CONVERSATION
|--------------------------------------------------------------------------
*/

export async function getAdminAIConversation({
  adminId,
  conversationId,
}: {
  adminId:
    string;

  conversationId:
    string;
}) {
  try {
    await connectDB();

    const normalizedAdminId =
      normalizeObjectId(
        adminId
      );

    const normalizedConversationId =
      normalizeObjectId(
        conversationId
      );

    if (
      !normalizedAdminId ||
      !normalizedConversationId
    ) {
      return {
        success:
          false,

        message:
          "Invalid admin or conversation id.",

        data:
          null,
      };
    }

    const conversation =
      await AdminAIConversation.findOne(
        buildOwnedConversationQuery(
          normalizedAdminId,
          normalizedConversationId
        )
      ).lean();

    if (
      !conversation
    ) {
      return {
        success:
          false,

        message:
          "Admin AI conversation not found.",

        data:
          null,
      };
    }

    return {
      success:
        true,

      message:
        "Admin AI conversation loaded successfully.",

      data:
        conversation,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI conversation load error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to load Admin AI conversation.",

      data:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| GET OR CREATE SESSION CONVERSATION
|--------------------------------------------------------------------------
|
| Useful when Admin AI UI opens.
|
|--------------------------------------------------------------------------
*/

export async function getOrCreateAdminAIConversation(
  input:
    CreateAdminAIConversationInput
) {
  try {
    await connectDB();

    const adminId =
      normalizeObjectId(
        input.adminId
      );

    const sessionId =
      cleanString(
        input.sessionId,
        MAX_SESSION_ID_LENGTH
      );

    if (
      !adminId ||
      !sessionId
    ) {
      return {
        success:
          false,

        message:
          "Invalid Admin AI conversation context.",

        data:
          null,
      };
    }

    const existing =
      await AdminAIConversation.findOne(
        {
          adminId,

          sessionId,

          status:
            "active",
        }
      )
        .sort(
          {
            lastMessageAt:
              -1,
          }
        );

    if (
      existing
    ) {
      existing.metadata.adminRole =
        normalizeAdminRole(
          input.adminRole
        );

      existing.metadata.source =
        normalizeSource(
          input.source
        );

      existing.metadata.currentPath =
        cleanString(
          input.currentPath,
          MAX_PATH_LENGTH
        );

      existing.metadata.businessPeriod =
        normalizeBusinessPeriod(
          input.businessPeriod
        );

      existing.metadata.language =
        normalizeLanguage(
          input.language
        );

      await existing.save();

      return {
        success:
          true,

        message:
          "Existing Admin AI conversation loaded successfully.",

        data:
          existing,
      };
    }

    return createAdminAIConversation(
      input
    );
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI get/create conversation error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to initialize Admin AI conversation.",

      data:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE CONVERSATION
|--------------------------------------------------------------------------
*/

export async function updateAdminAIConversation(
  input:
    UpdateAdminAIConversationInput
) {
  try {
    await connectDB();

    const adminId =
      normalizeObjectId(
        input.adminId
      );

    const conversationId =
      normalizeObjectId(
        input.conversationId
      );

    if (
      !adminId ||
      !conversationId
    ) {
      return {
        success:
          false,

        message:
          "Invalid admin or conversation id.",

        data:
          null,
      };
    }

    const conversation:
      any =
      await AdminAIConversation.findOne(
        buildOwnedConversationQuery(
          adminId,
          conversationId
        )
      );

    if (
      !conversation
    ) {
      return {
        success:
          false,

        message:
          "Admin AI conversation not found.",

        data:
          null,
      };
    }

    if (
      input.title !==
      undefined
    ) {
      conversation.title =
        buildDefaultConversationTitle(
          input.title
        );
    }

    if (
      input.status !==
      undefined
    ) {
      conversation.status =
        normalizeConversationStatus(
          input.status
        );
    }

    if (
      input.source !==
      undefined
    ) {
      conversation.metadata.source =
        normalizeSource(
          input.source
        );
    }

    if (
      input.currentPath !==
      undefined
    ) {
      conversation.metadata.currentPath =
        cleanString(
          input.currentPath,
          MAX_PATH_LENGTH
        );
    }

    if (
      input.adminRole !==
      undefined
    ) {
      conversation.metadata.adminRole =
        normalizeAdminRole(
          input.adminRole
        );
    }

    if (
      input.businessPeriod !==
      undefined
    ) {
      conversation.metadata.businessPeriod =
        normalizeBusinessPeriod(
          input.businessPeriod
        );
    }

    if (
      input.language !==
      undefined
    ) {
      conversation.metadata.language =
        normalizeLanguage(
          input.language
        );
    }

    if (
      input.lastToolName !==
      undefined
    ) {
      conversation.metadata.lastToolName =
        cleanString(
          input.lastToolName,
          MAX_TOOL_NAME_LENGTH
        );
    }

    if (
      input.lastActionType !==
      undefined
    ) {
      conversation.metadata.lastActionType =
        cleanString(
          input.lastActionType,
          120
        );
    }

    await conversation.save();

    return {
      success:
        true,

      message:
        "Admin AI conversation updated successfully.",

      data:
        conversation,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI conversation update error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to update Admin AI conversation.",

      data:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| SAVE MESSAGE
|--------------------------------------------------------------------------
*/

export async function saveAdminAIMessage(
  input:
    SaveAdminAIMessageInput
) {
  try {
    await connectDB();

    const adminId =
      normalizeObjectId(
        input.adminId
      );

    const conversationId =
      normalizeObjectId(
        input.conversationId
      );

    if (
      !adminId ||
      !conversationId
    ) {
      return {
        success:
          false,

        message:
          "Invalid admin or conversation id.",

        data:
          null,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | OWNERSHIP CHECK
    |--------------------------------------------------------------------------
    */

    const conversation:
      any =
      await AdminAIConversation.findOne(
        buildOwnedConversationQuery(
          adminId,
          conversationId
        )
      );

    if (
      !conversation
    ) {
      return {
        success:
          false,

        message:
          "Admin AI conversation not found or does not belong to this admin.",

        data:
          null,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | ARCHIVED CHECK
    |--------------------------------------------------------------------------
    */

    if (
      conversation.status ===
      "archived"
    ) {
      return {
        success:
          false,

        message:
          "Cannot add messages to an archived Admin AI conversation.",

        data:
          null,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | TOOL CONTEXT
    |--------------------------------------------------------------------------
    */

    const toolInput =
      input.tool ||
      {};

    const tool:
      AdminAIMessageToolContext = {
      toolName:
        cleanString(
          toolInput.toolName,
          MAX_TOOL_NAME_LENGTH
        ),

      toolCallId:
        cleanString(
          toolInput.toolCallId,
          MAX_TOOL_CALL_ID_LENGTH
        ),

      status:
        normalizeToolStatus(
          toolInput.status
        ),

      requiresConfirmation:
        toolInput.requiresConfirmation ===
        true,

      confirmedByAdmin:
        toolInput.confirmedByAdmin ===
        true,

      input:
        toolInput.input &&
        typeof toolInput.input ===
          "object" &&
        !Array.isArray(
          toolInput.input
        )
          ? toolInput.input
          : {},

      output:
        toolInput.output &&
        typeof toolInput.output ===
          "object" &&
        !Array.isArray(
          toolInput.output
        )
          ? toolInput.output
          : {},

      errorMessage:
        cleanString(
          toolInput.errorMessage,
          MAX_ERROR_LENGTH
        ),
    };

    /*
    |--------------------------------------------------------------------------
    | BUSINESS CONTEXT
    |--------------------------------------------------------------------------
    */

    const businessInput =
      input.businessContext ||
      {};

    const businessContext:
      AdminAIMessageBusinessContext = {
      period:
        businessInput.period ===
          "daily" ||
        businessInput.period ===
          "weekly" ||
        businessInput.period ===
          "monthly"
          ? businessInput.period
          : "",

      snapshotId:
        cleanString(
          businessInput.snapshotId,
          MAX_REFERENCE_LENGTH
        ),

      staleData:
        businessInput.staleData ===
        true,

      recommendationIds:
        normalizeStringArray(
          businessInput
            .recommendationIds
        ),

      productIds:
        normalizeStringArray(
          businessInput
            .productIds
        ),

      orderIds:
        normalizeStringArray(
          businessInput
            .orderIds
        ),

      categoryNames:
        normalizeStringArray(
          businessInput
            .categoryNames
        ),

      insightType:
        cleanString(
          businessInput.insightType,
          150
        ),
    };

    /*
    |--------------------------------------------------------------------------
    | TOKEN USAGE
    |--------------------------------------------------------------------------
    */

    const inputTokens =
      safeInteger(
        input.tokenUsage
          ?.inputTokens
      );

    const outputTokens =
      safeInteger(
        input.tokenUsage
          ?.outputTokens
      );

    const suppliedTotal =
      safeInteger(
        input.tokenUsage
          ?.totalTokens
      );

    const totalTokens =
      suppliedTotal >
      0
        ? suppliedTotal
        : inputTokens +
          outputTokens;

    /*
    |--------------------------------------------------------------------------
    | CREATE MESSAGE
    |--------------------------------------------------------------------------
    */

    const message =
      await AdminAIMessage.create(
        {
          conversationId,

          adminId,

          role:
            input.role,

          messageType:
            input.messageType ||
            "chat",

          content:
            cleanContent(
              input.content
            ),

          adminRole:
            input.adminRole as
              AdminAIMessageAdminRole,

          language:
            normalizeLanguage(
              input.language
            ),

          aiModel:
            cleanString(
              input.aiModel,
              MAX_MODEL_LENGTH
            ),

          tool,

          businessContext,

          tokenUsage: {
            inputTokens,

            outputTokens,

            totalTokens,
          },

          metadata:
            input.metadata &&
            typeof input.metadata ===
              "object" &&
            !Array.isArray(
              input.metadata
            )
              ? input.metadata
              : {},
        }
      );

    /*
    |--------------------------------------------------------------------------
    | UPDATE CONVERSATION
    |--------------------------------------------------------------------------
    */

    conversation.messageCount =
      Math.max(
        0,
        Number(
          conversation.messageCount
        ) ||
          0
      ) +
      1;

    conversation.lastMessageAt =
      new Date();

    conversation.metadata.adminRole =
      input.adminRole;

    conversation.metadata.language =
      normalizeLanguage(
        input.language
      );

    if (
      tool.toolName
    ) {
      conversation.metadata.lastToolName =
        tool.toolName;
    }

    await conversation.save();

    return {
      success:
        true,

      message:
        "Admin AI message saved successfully.",

      data:
        message,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI message save error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to save Admin AI message.",

      data:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| SAVE ADMIN MESSAGE
|--------------------------------------------------------------------------
*/

export async function saveAdminUserMessage({
  adminId,
  adminRole,
  conversationId,
  content,
  language =
    "en",
  metadata,
}: {
  adminId:
    string;

  adminRole:
    AdminRole;

  conversationId:
    string;

  content:
    string;

  language?:
    AdminAILanguage;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  return saveAdminAIMessage(
    {
      adminId,

      adminRole,

      conversationId,

      role:
        "admin",

      messageType:
        "chat",

      content,

      language,

      metadata,
    }
  );
}

/*
|--------------------------------------------------------------------------
| SAVE ASSISTANT MESSAGE
|--------------------------------------------------------------------------
*/

export async function saveAdminAssistantMessage({
  adminId,
  adminRole,
  conversationId,
  content,
  language =
    "en",
  aiModel,
  businessContext,
  tokenUsage,
  metadata,
}: {
  adminId:
    string;

  adminRole:
    AdminRole;

  conversationId:
    string;

  content:
    string;

  language?:
    AdminAILanguage;

  aiModel?:
    string | null;

  businessContext?:
    Partial<AdminAIMessageBusinessContext> | null;

  tokenUsage?: {
    inputTokens?:
      number;

    outputTokens?:
      number;

    totalTokens?:
      number;
  } | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  return saveAdminAIMessage(
    {
      adminId,

      adminRole,

      conversationId,

      role:
        "assistant",

      messageType:
        "chat",

      content,

      language,

      aiModel,

      businessContext,

      tokenUsage,

      metadata,
    }
  );
}

/*
|--------------------------------------------------------------------------
| SAVE TOOL CALL
|--------------------------------------------------------------------------
*/

export async function saveAdminToolCallMessage({
  adminId,
  adminRole,
  conversationId,
  toolName,
  toolCallId,
  toolInput,
  requiresConfirmation =
    false,
  language =
    "en",
  aiModel,
}: {
  adminId:
    string;

  adminRole:
    AdminRole;

  conversationId:
    string;

  toolName:
    string;

  toolCallId:
    string;

  toolInput:
    Record<
      string,
      unknown
    >;

  requiresConfirmation?:
    boolean;

  language?:
    AdminAILanguage;

  aiModel?:
    string | null;
}) {
  return saveAdminAIMessage(
    {
      adminId,

      adminRole,

      conversationId,

      role:
        "assistant",

      messageType:
        "tool_call",

      content:
        "",

      language,

      aiModel,

      tool: {
        toolName,

        toolCallId,

        status:
          "requested",

        requiresConfirmation,

        confirmedByAdmin:
          false,

        input:
          toolInput,

        output:
          {},

        errorMessage:
          "",
      },
    }
  );
}

/*
|--------------------------------------------------------------------------
| SAVE TOOL RESULT
|--------------------------------------------------------------------------
*/

export async function saveAdminToolResultMessage({
  adminId,
  adminRole,
  conversationId,
  toolName,
  toolCallId,
  success,
  output,
  errorMessage,
  requiresConfirmation =
    false,
  confirmedByAdmin =
    false,
  language =
    "en",
  businessContext,
}: {
  adminId:
    string;

  adminRole:
    AdminRole;

  conversationId:
    string;

  toolName:
    string;

  toolCallId:
    string;

  success:
    boolean;

  output:
    Record<
      string,
      unknown
    >;

  errorMessage?:
    string | null;

  requiresConfirmation?:
    boolean;

  confirmedByAdmin?:
    boolean;

  language?:
    AdminAILanguage;

  businessContext?:
    Partial<AdminAIMessageBusinessContext> | null;
}) {
  return saveAdminAIMessage(
    {
      adminId,

      adminRole,

      conversationId,

      role:
        "tool",

      messageType:
        "tool_result",

      content:
        "",

      language,

      tool: {
        toolName,

        toolCallId,

        status:
          success
            ? "completed"
            : "failed",

        requiresConfirmation,

        confirmedByAdmin,

        input:
          {},

        output,

        errorMessage:
          cleanString(
            errorMessage,
            MAX_ERROR_LENGTH
          ),
      },

      businessContext,
    }
  );
}

/*
|--------------------------------------------------------------------------
| SAVE CONFIRMATION MESSAGE
|--------------------------------------------------------------------------
*/

export async function saveAdminConfirmationMessage({
  adminId,
  adminRole,
  conversationId,
  content,
  toolName,
  actionLogId,
  confirmed,
  language =
    "en",
}: {
  adminId:
    string;

  adminRole:
    AdminRole;

  conversationId:
    string;

  content:
    string;

  toolName:
    string;

  actionLogId:
    string;

  confirmed:
    boolean;

  language?:
    AdminAILanguage;
}) {
  return saveAdminAIMessage(
    {
      adminId,

      adminRole,

      conversationId,

      role:
        "admin",

      messageType:
        "action_confirmation",

      content,

      language,

      tool: {
        toolName,

        toolCallId:
          actionLogId,

        status:
          confirmed
            ? "completed"
            : "rejected",

        requiresConfirmation:
          true,

        confirmedByAdmin:
          confirmed,

        input: {
          actionLogId,
        },

        output:
          {},

        errorMessage:
          "",
      },
    }
  );
}

/*
|--------------------------------------------------------------------------
| GET MESSAGE HISTORY
|--------------------------------------------------------------------------
*/

export async function getAdminAIMessageHistory(
  input:
    GetAdminAIHistoryInput
) {
  try {
    await connectDB();

    const adminId =
      normalizeObjectId(
        input.adminId
      );

    const conversationId =
      normalizeObjectId(
        input.conversationId
      );

    if (
      !adminId ||
      !conversationId
    ) {
      return {
        success:
          false,

        message:
          "Invalid admin or conversation id.",

        data:
          null,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | OWNERSHIP CHECK FIRST
    |--------------------------------------------------------------------------
    */

    const conversation =
      await AdminAIConversation.findOne(
        buildOwnedConversationQuery(
          adminId,
          conversationId
        )
      )
        .select(
          "_id"
        )
        .lean();

    if (
      !conversation
    ) {
      return {
        success:
          false,

        message:
          "Admin AI conversation not found.",

        data:
          null,
      };
    }

    const limit =
      normalizeLimit(
        input.limit,
        DEFAULT_MESSAGE_LIMIT,
        MAX_MESSAGE_LIMIT
      );

    /*
    |--------------------------------------------------------------------------
    | FETCH LATEST N THEN RETURN CHRONOLOGICALLY
    |--------------------------------------------------------------------------
    */

    const messages =
      await AdminAIMessage.find(
        {
          adminId,

          conversationId,
        }
      )
        .sort(
          {
            createdAt:
              -1,
          }
        )
        .limit(
          limit
        )
        .lean();

    messages.reverse();

    return {
      success:
        true,

      message:
        "Admin AI message history loaded successfully.",

      data:
        messages,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI history load error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to load Admin AI message history.",

      data:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| GET MODEL HISTORY
|--------------------------------------------------------------------------
|
| Converts saved history into a compact structure suitable for the model.
|
|--------------------------------------------------------------------------
*/

export async function getAdminAIModelHistory({
  adminId,
  conversationId,
  limit =
    DEFAULT_MESSAGE_LIMIT,
}: {
  adminId:
    string;

  conversationId:
    string;

  limit?:
    number;
}) {
  const result =
    await getAdminAIMessageHistory(
      {
        adminId,

        conversationId,

        limit,
      }
    );

  if (
    !result.success ||
    !result.data
  ) {
    return {
      success:
        result.success,

      message:
        result.message,

      history:
        [],
    };
  }

  const history =
    result.data
      .filter(
        (
          message:
            any
        ) => {
          if (
            message.role ===
              "admin" &&
            message.content
          ) {
            return true;
          }

          if (
            message.role ===
              "assistant" &&
            message.messageType ===
              "chat" &&
            message.content
          ) {
            return true;
          }

          return false;
        }
      )
      .map(
        (
          message:
            any
        ) => ({
          role:
            message.role ===
              "admin"
              ? "user"
              : "assistant",

          content:
            cleanContent(
              message.content
            ),
        })
      );

  return {
    success:
      true,

    message:
      "Admin AI model history prepared successfully.",

    history,
  };
}

/*
|--------------------------------------------------------------------------
| LIST CONVERSATIONS
|--------------------------------------------------------------------------
*/

export async function listAdminAIConversations(
  input:
    ListAdminAIConversationsInput
) {
  try {
    await connectDB();

    const adminId =
      normalizeObjectId(
        input.adminId
      );

    if (
      !adminId
    ) {
      return {
        success:
          false,

        message:
          "Invalid admin id.",

        data:
          null,
      };
    }

    const filter:
      Record<
        string,
        unknown
      > = {
      adminId,
    };

    if (
      input.status ===
        "active" ||
      input.status ===
        "archived"
    ) {
      filter.status =
        input.status;
    }

    const limit =
      normalizeLimit(
        input.limit,
        DEFAULT_CONVERSATION_LIMIT,
        MAX_CONVERSATION_LIMIT
      );

    const conversations =
      await AdminAIConversation.find(
        filter
      )
        .sort(
          {
            lastMessageAt:
              -1,
          }
        )
        .limit(
          limit
        )
        .lean();

    return {
      success:
        true,

      message:
        "Admin AI conversations loaded successfully.",

      data:
        conversations,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI conversation list error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to load Admin AI conversations.",

      data:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| ARCHIVE CONVERSATION
|--------------------------------------------------------------------------
*/

export async function archiveAdminAIConversation({
  adminId,
  conversationId,
}: {
  adminId:
    string;

  conversationId:
    string;
}) {
  try {
    await connectDB();

    const normalizedAdminId =
      normalizeObjectId(
        adminId
      );

    const normalizedConversationId =
      normalizeObjectId(
        conversationId
      );

    if (
      !normalizedAdminId ||
      !normalizedConversationId
    ) {
      return {
        success:
          false,

        message:
          "Invalid admin or conversation id.",

        data:
          null,
      };
    }

    const conversation =
      await AdminAIConversation.findOneAndUpdate(
        buildOwnedConversationQuery(
          normalizedAdminId,
          normalizedConversationId
        ),
        {
          $set: {
            status:
              "archived",
          },
        },
        {
          new:
            true,
        }
      );

    if (
      !conversation
    ) {
      return {
        success:
          false,

        message:
          "Admin AI conversation not found.",

        data:
          null,
      };
    }

    return {
      success:
        true,

      message:
        "Admin AI conversation archived successfully.",

      data:
        conversation,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI conversation archive error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to archive Admin AI conversation.",

      data:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| REACTIVATE CONVERSATION
|--------------------------------------------------------------------------
*/

export async function reactivateAdminAIConversation({
  adminId,
  conversationId,
}: {
  adminId:
    string;

  conversationId:
    string;
}) {
  try {
    await connectDB();

    const normalizedAdminId =
      normalizeObjectId(
        adminId
      );

    const normalizedConversationId =
      normalizeObjectId(
        conversationId
      );

    if (
      !normalizedAdminId ||
      !normalizedConversationId
    ) {
      return {
        success:
          false,

        message:
          "Invalid admin or conversation id.",

        data:
          null,
      };
    }

    const conversation =
      await AdminAIConversation.findOneAndUpdate(
        buildOwnedConversationQuery(
          normalizedAdminId,
          normalizedConversationId
        ),
        {
          $set: {
            status:
              "active",

            lastMessageAt:
              new Date(),
          },
        },
        {
          new:
            true,
        }
      );

    if (
      !conversation
    ) {
      return {
        success:
          false,

        message:
          "Admin AI conversation not found.",

        data:
          null,
      };
    }

    return {
      success:
        true,

      message:
        "Admin AI conversation reactivated successfully.",

      data:
        conversation,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI conversation reactivate error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to reactivate Admin AI conversation.",

      data:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| AUTO TITLE
|--------------------------------------------------------------------------
|
| Uses the admin's first meaningful message.
|
|--------------------------------------------------------------------------
*/

export async function updateAdminAIConversationTitleFromMessage({
  adminId,
  conversationId,
  message,
}: {
  adminId:
    string;

  conversationId:
    string;

  message:
    string;
}) {
  const cleanMessage =
    cleanString(
      message,
      MAX_TITLE_LENGTH
    );

  if (
    !cleanMessage
  ) {
    return {
      success:
        false,

      message:
        "No title text available.",

      data:
        null,
    };
  }

  const title =
    cleanMessage.length >
    70
      ? `${cleanMessage.slice(
          0,
          67
        )}...`
      : cleanMessage;

  return updateAdminAIConversation(
    {
      adminId,

      conversationId,

      title,
    }
  );
}

/*
|--------------------------------------------------------------------------
| DELETE ALL MESSAGE HISTORY FOR ONE CONVERSATION
|--------------------------------------------------------------------------
|
| This does NOT delete the conversation document.
|
| Keep this server-side and only expose later if required.
|
|--------------------------------------------------------------------------
*/

export async function clearAdminAIConversationMessages({
  adminId,
  conversationId,
}: {
  adminId:
    string;

  conversationId:
    string;
}) {
  try {
    await connectDB();

    const normalizedAdminId =
      normalizeObjectId(
        adminId
      );

    const normalizedConversationId =
      normalizeObjectId(
        conversationId
      );

    if (
      !normalizedAdminId ||
      !normalizedConversationId
    ) {
      return {
        success:
          false,

        message:
          "Invalid admin or conversation id.",

        data:
          null,
      };
    }

    const conversation:
      any =
      await AdminAIConversation.findOne(
        buildOwnedConversationQuery(
          normalizedAdminId,
          normalizedConversationId
        )
      );

    if (
      !conversation
    ) {
      return {
        success:
          false,

        message:
          "Admin AI conversation not found.",

        data:
          null,
      };
    }

    const result =
      await AdminAIMessage.deleteMany(
        {
          adminId:
            normalizedAdminId,

          conversationId:
            normalizedConversationId,
        }
      );

    conversation.messageCount =
      0;

    conversation.lastMessageAt =
      new Date();

    conversation.metadata.lastToolName =
      "";

    conversation.metadata.lastActionType =
      "";

    await conversation.save();

    return {
      success:
        true,

      message:
        "Admin AI conversation messages cleared successfully.",

      data: {
        deletedCount:
          result.deletedCount,
      },
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI conversation clear error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to clear Admin AI conversation messages.",

      data:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| DELETE CONVERSATION
|--------------------------------------------------------------------------
|
| Deletes only the requesting admin's conversation + messages.
|
|--------------------------------------------------------------------------
*/

export async function deleteAdminAIConversation({
  adminId,
  conversationId,
}: {
  adminId:
    string;

  conversationId:
    string;
}) {
  const session =
    await mongoose.startSession();

  try {
    await connectDB();

    const normalizedAdminId =
      normalizeObjectId(
        adminId
      );

    const normalizedConversationId =
      normalizeObjectId(
        conversationId
      );

    if (
      !normalizedAdminId ||
      !normalizedConversationId
    ) {
      return {
        success:
          false,

        message:
          "Invalid admin or conversation id.",

        data:
          null,
      };
    }

    let deleted =
      false;

    await session.withTransaction(
      async () => {
        const conversation =
          await AdminAIConversation.findOne(
            buildOwnedConversationQuery(
              normalizedAdminId,
              normalizedConversationId
            )
          ).session(
            session
          );

        if (
          !conversation
        ) {
          return;
        }

        await AdminAIMessage.deleteMany(
          {
            adminId:
              normalizedAdminId,

            conversationId:
              normalizedConversationId,
          },
          {
            session,
          }
        );

        await AdminAIConversation.deleteOne(
          {
            _id:
              normalizedConversationId,

            adminId:
              normalizedAdminId,
          },
          {
            session,
          }
        );

        deleted =
          true;
      }
    );

    if (
      !deleted
    ) {
      return {
        success:
          false,

        message:
          "Admin AI conversation not found.",

        data:
          null,
      };
    }

    return {
      success:
        true,

      message:
        "Admin AI conversation deleted successfully.",

      data: {
        conversationId:
          normalizedConversationId,
      },
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI conversation delete error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to delete Admin AI conversation.",

      data:
        null,
    };
  } finally {
    await session.endSession();
  }
}