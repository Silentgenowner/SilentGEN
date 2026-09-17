import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  GoogleGenAI,
} from "@google/genai";

import mongoose from "mongoose";

import {
  authenticateAdminAIRequest,
  buildAdminAIExecutionContext,
} from "@/lib/admin-ai/adminAuth";

import {
  buildAdminSystemPrompt,
  normalizeAdminAILanguage,
  type AdminAILanguage,
  type AdminAIBusinessPeriod,
} from "@/lib/admin-ai/prompts/adminSystemPrompt";

import {
  getAdminAIPermissionSummary,
} from "@/lib/admin-ai/adminPermissions";

import {
  getAdminAIToolsForRole,
  isAdminAIToolName,
  type AdminAIToolDefinition,
  type AdminAIToolName,
} from "@/lib/admin-ai/adminToolDefinitions";

import {
  executeAdminAITool,
  confirmAndExecuteAdminAIAction,
  rejectAdminAIAction,
} from "@/lib/admin-ai/adminToolExecutor";

import {
  getOrCreateAdminAIConversation,
  getAdminAIConversation,
  getAdminAIModelHistory,
  saveAdminUserMessage,
  saveAdminAssistantMessage,
  saveAdminToolCallMessage,
  saveAdminToolResultMessage,
  saveAdminConfirmationMessage,
  updateAdminAIConversation,
  updateAdminAIConversationTitleFromMessage,
} from "@/lib/admin-ai/adminConversationService";

/*
|--------------------------------------------------------------------------
| SILENTGEN ADMIN AI CHAT API - GEMINI VERSION
|--------------------------------------------------------------------------
|
| Customer AI:
|
| /api/ai/chat
|
| Admin AI:
|
| /api/admin/ai/chat
|
| Admin AI uses Gemini.
|
|--------------------------------------------------------------------------
*/

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_GEMINI_MODEL =
 "gemini-3.6-flash";

const DEFAULT_MAX_TOOL_ROUNDS =
  4;

const MAX_TOOL_ROUNDS =
  8;

const MAX_MESSAGE_LENGTH =
  12_000;

const MAX_CURRENT_PATH_LENGTH =
  500;

const MAX_SESSION_ID_LENGTH =
  150;

const MAX_TOOL_OUTPUT_LENGTH =
  25_000;

/*
|--------------------------------------------------------------------------
| REQUEST
|--------------------------------------------------------------------------
*/

type AdminAIChatRequestBody = {
  message?:
    unknown;

  conversationId?:
    unknown;

  sessionId?:
    unknown;

  language?:
    unknown;

  businessPeriod?:
    unknown;

  currentPath?:
    unknown;

  confirmation?: {
    actionLogId?:
      unknown;

    decision?:
      unknown;
  } | null;
};

/*
|--------------------------------------------------------------------------
| CONFIRMATION
|--------------------------------------------------------------------------
*/

type ConfirmationDecision =
  | "confirm"
  | "reject";

/*
|--------------------------------------------------------------------------
| GEMINI CONTENT
|--------------------------------------------------------------------------
*/

type GeminiPart = {
  text?:
    string;

  functionCall?: {
    id?:
      string;

    name?:
      string;

    args?:
      Record<
        string,
        unknown
      >;
  };

  functionResponse?: {
    id?:
      string;

    name:
      string;

    response:
      Record<
        string,
        unknown
      >;
  };
};

type GeminiContent = {
  role:
    "user"
    | "model";

  parts:
    GeminiPart[];
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
    .slice(
      0,
      maxLength
    );
}

/*
|--------------------------------------------------------------------------
| SAFE OBJECT
|--------------------------------------------------------------------------
*/

function safeObject(
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

  return value as
    Record<
      string,
      unknown
    >;
}

/*
|--------------------------------------------------------------------------
| GEMINI API KEY
|--------------------------------------------------------------------------
*/

function getGeminiApiKey() {
  const apiKey =
    cleanString(
      process.env
        .GEMINI_API_KEY,
      10_000
    );

  if (
    !apiKey
  ) {
    throw new Error(
      "GEMINI_API_KEY is not configured in .env.local"
    );
  }

  return apiKey;
}

/*
|--------------------------------------------------------------------------
| GEMINI CLIENT
|--------------------------------------------------------------------------
*/

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
| GEMINI MODEL
|--------------------------------------------------------------------------
*/

function getGeminiModel() {
  return (
    cleanString(
      process.env
        .GEMINI_AI_MODEL,
      200
    ) ||
    DEFAULT_GEMINI_MODEL
  );
}

/*
|--------------------------------------------------------------------------
| MAX TOOL ROUNDS
|--------------------------------------------------------------------------
*/

function getMaxToolRounds() {
  const number =
    Number(
      process.env
        .AI_MAX_TOOL_ROUNDS
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return DEFAULT_MAX_TOOL_ROUNDS;
  }

  return Math.min(
    MAX_TOOL_ROUNDS,
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
|
| ONLY:
|
| Gujarati
| Hindi
| English
|
|--------------------------------------------------------------------------
*/

function normalizeLanguage(
  value:
    unknown
):
  AdminAILanguage {
  return normalizeAdminAILanguage(
    value
  );
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
| SESSION ID
|--------------------------------------------------------------------------
*/

function normalizeSessionId(
  value:
    unknown
) {
  const supplied =
    cleanString(
      value,
      MAX_SESSION_ID_LENGTH
    );

  if (
    supplied
  ) {
    return supplied;
  }

  return `admin-ai-${crypto.randomUUID()}`;
}

/*
|--------------------------------------------------------------------------
| CONVERSATION ID
|--------------------------------------------------------------------------
*/

function normalizeConversationId(
  value:
    unknown
) {
  const id =
    cleanString(
      value,
      100
    );

  if (
    !id ||
    !mongoose.Types.ObjectId.isValid(
      id
    )
  ) {
    return "";
  }

  return id;
}

/*
|--------------------------------------------------------------------------
| CONFIRMATION DECISION
|--------------------------------------------------------------------------
*/

function normalizeConfirmationDecision(
  value:
    unknown
):
  ConfirmationDecision | null {
  if (
    value ===
      "confirm" ||
    value ===
      "reject"
  ) {
    return value;
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| TOOL CALL ID
|--------------------------------------------------------------------------
*/

function createToolCallId(
  value:
    unknown
) {
  const existing =
    cleanString(
      value,
      250
    );

  if (
    existing
  ) {
    return existing;
  }

  return `gemini-tool-${crypto.randomUUID()}`;
}

/*
|--------------------------------------------------------------------------
| SAFE TOOL OUTPUT
|--------------------------------------------------------------------------
*/

function limitToolOutput(
  value:
    unknown
):
  Record<
    string,
    unknown
  > {
  try {
    const serialized =
      JSON.stringify(
        value
      );

    if (
      serialized.length <=
      MAX_TOOL_OUTPUT_LENGTH
    ) {
      return safeObject(
        value
      );
    }

    // Preserve BI metrics as structured data when detail lists exceed the limit.
    const output = safeObject(JSON.parse(serialized));
    const data = safeObject(output.data);
    if (
      Object.prototype.hasOwnProperty.call(data, "summary") &&
      Object.prototype.hasOwnProperty.call(data, "dataSources")
    ) {
      const core: Record<string, unknown> = {};
      for (const key of [
        "success", "message", "period", "generatedAt", "staleData",
        "dataSources", "summary", "salesTrend",
      ]) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          core[key] = data[key];
        }
      }

      const compact: Record<string, unknown> = {
        success: output.success,
        message: output.message,
        truncated: true,
        truncationNotice:
          "Detail fields may be omitted or lists shortened. Retained lists are partial, not complete totals. Missing details do not mean zero activity. Core BI metrics and source status are preserved unless dataOmitted is true.",
        data: core,
      };

      if (JSON.stringify(compact).length > MAX_TOOL_OUTPUT_LENGTH) {
        return {
          success: output.success,
          truncated: true,
          dataOmitted: true,
          message:
            "The tool ran, but its BI summary exceeded the response size limit. Metrics are unavailable in this response; do not infer zero values or claim the analysis is complete.",
        };
      }

      // Fill the remaining budget with whole values or leading list items.
      // Never cut serialized JSON in the middle of a metric or object.
      for (const [key, detail] of Object.entries(data)) {
        if (Object.prototype.hasOwnProperty.call(core, key)) continue;
        if (Array.isArray(detail)) {
          const retained: unknown[] = [];
          for (const item of detail) {
            retained.push(item);
            core[key] = retained;
            if (JSON.stringify(compact).length > MAX_TOOL_OUTPUT_LENGTH) {
              retained.pop();
              break;
            }
          }
          if (retained.length === 0) delete core[key];
        } else {
          core[key] = detail;
          if (JSON.stringify(compact).length > MAX_TOOL_OUTPUT_LENGTH) {
            delete core[key];
          }
        }
      }
      return compact;
    }

    return {
      truncated:
        true,

      message:
        "Tool output was truncated before being returned to Gemini.",

      preview:
        serialized.slice(
          0,
          MAX_TOOL_OUTPUT_LENGTH
        ),
    };
  } catch {
    return {
      success:
        false,

      message:
        "Unable to serialize Admin AI tool output.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| JSON ERROR
|--------------------------------------------------------------------------
*/

function jsonError(
  message:
    string,
  status:
    number
) {
  return NextResponse.json(
    {
      success:
        false,

      message,
    },
    {
      status,
    }
  );
}

/*
|--------------------------------------------------------------------------
| GEMINI TOOL CONVERSION
|--------------------------------------------------------------------------
|
| Existing Admin tools are defined in OpenAI-style:
|
| {
|   type: "function",
|   function: {
|     name,
|     description,
|     parameters
|   }
| }
|
| Gemini needs:
|
| {
|   functionDeclarations: [
|     {
|       name,
|       description,
|       parametersJsonSchema
|     }
|   ]
| }
|
|--------------------------------------------------------------------------
*/

function convertAdminToolsToGemini(
  definitions:
    AdminAIToolDefinition[]
) {
  return [
    {
      functionDeclarations:
        definitions.map(
          (
            definition
          ) => ({
            name:
              definition
                .function
                .name,

            description:
              definition
                .function
                .description,

            parametersJsonSchema:
              definition
                .function
                .parameters,
          })
        ),
    },
  ];
}

/*
|--------------------------------------------------------------------------
| PREPARE CONVERSATION
|--------------------------------------------------------------------------
*/

async function prepareConversation({
  adminId,
  adminRole,
  requestedConversationId,
  sessionId,
  language,
  businessPeriod,
  currentPath,
}: {
  adminId:
    string;

  adminRole:
    Parameters<
      typeof getAdminAIToolsForRole
    >[0];

  requestedConversationId:
    string;

  sessionId:
    string;

  language:
    AdminAILanguage;

  businessPeriod:
    AdminAIBusinessPeriod;

  currentPath:
    string;
}) {
  /*
  |--------------------------------------------------------------------------
  | EXISTING CONVERSATION
  |--------------------------------------------------------------------------
  */

  if (
    requestedConversationId
  ) {
    const existing =
      await getAdminAIConversation(
        {
          adminId,

          conversationId:
            requestedConversationId,
        }
      );

    if (
      !existing.success ||
      !existing.data
    ) {
      return {
        success:
          false as const,

        message:
          "Admin AI conversation was not found or does not belong to this admin.",

        conversation:
          null,
      };
    }

    await updateAdminAIConversation(
      {
        adminId,

        conversationId:
          requestedConversationId,

        adminRole,

        currentPath,

        language,

        businessPeriod,
      }
    );

    return {
      success:
        true as const,

      message:
        "Admin AI conversation loaded.",

      conversation:
        existing.data,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | GET / CREATE BY SESSION
  |--------------------------------------------------------------------------
  */

  const result =
    await getOrCreateAdminAIConversation(
      {
        adminId,

        adminRole,

        sessionId,

        source:
          "admin_ai",

        currentPath,

        language,

        businessPeriod,
      }
    );

  if (
    !result.success ||
    !result.data
  ) {
    return {
      success:
        false as const,

      message:
        result.message,

      conversation:
        null,
    };
  }

  return {
    success:
      true as const,

    message:
      result.message,

    conversation:
      result.data,
  };
}

/*
|--------------------------------------------------------------------------
| BUILD GEMINI HISTORY
|--------------------------------------------------------------------------
*/

function buildGeminiHistory(
  history:
    Array<{
      role:
        string;

      content:
        string;
    }>
):
  GeminiContent[] {
  const contents:
    GeminiContent[] =
    [];

  for (
    const item of
    history
  ) {
    const text =
      cleanString(
        item.content,
        MAX_MESSAGE_LENGTH
      );

    if (
      !text
    ) {
      continue;
    }

    if (
      item.role ===
      "user"
    ) {
      contents.push(
        {
          role:
            "user",

          parts: [
            {
              text,
            },
          ],
        }
      );

      continue;
    }

    if (
      item.role ===
      "assistant"
    ) {
      contents.push(
        {
          role:
            "model",

          parts: [
            {
              text,
            },
          ],
        }
      );
    }
  }

  return contents;
}

/*
|--------------------------------------------------------------------------
| GET RESPONSE CONTENT
|--------------------------------------------------------------------------
*/

function getGeminiResponseContent(
  response:
    any
):
  GeminiContent | null {
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

  return {
    role:
      "model",

    parts:
      content.parts,
  };
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
  /*
  |--------------------------------------------------------------------------
  | SDK RESPONSE.TEXT
  |--------------------------------------------------------------------------
  */

  try {
    if (
      typeof response?.text ===
        "string"
    ) {
      const text =
        cleanString(
          response.text,
          MAX_MESSAGE_LENGTH
        );

      if (
        text
      ) {
        return text;
      }
    }
  } catch {
    // Ignore getter errors.
  }

  /*
  |--------------------------------------------------------------------------
  | PART FALLBACK
  |--------------------------------------------------------------------------
  */

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
    .trim()
    .slice(
      0,
      MAX_MESSAGE_LENGTH
    );
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
  /*
  |--------------------------------------------------------------------------
  | SDK FUNCTIONCALLS GETTER
  |--------------------------------------------------------------------------
  */

  try {
    if (
      Array.isArray(
        response?.functionCalls
      )
    ) {
      return response.functionCalls;
    }
  } catch {
    // Use parts fallback.
  }

  /*
  |--------------------------------------------------------------------------
  | PARTS FALLBACK
  |--------------------------------------------------------------------------
  */

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
| TOKEN USAGE
|--------------------------------------------------------------------------
*/

function getGeminiTokenUsage(
  response:
    any
) {
  const usage =
    response?.usageMetadata ||
    {};

  const inputTokens =
    Number(
      usage.promptTokenCount ||
      0
    );

  const outputTokens =
    Number(
      usage.candidatesTokenCount ||
      0
    );

  const totalTokens =
    Number(
      usage.totalTokenCount ||
      inputTokens +
        outputTokens
    );

  return {
    inputTokens:
      Number.isFinite(
        inputTokens
      )
        ? inputTokens
        : 0,

    outputTokens:
      Number.isFinite(
        outputTokens
      )
        ? outputTokens
        : 0,

    totalTokens:
      Number.isFinite(
        totalTokens
      )
        ? totalTokens
        : 0,
  };
}

/*
|--------------------------------------------------------------------------
| HANDLE EXPLICIT CONFIRMATION
|--------------------------------------------------------------------------
*/

async function handleConfirmation({
  body,
  adminId,
  adminRole,
  conversationId,
  language,
}: {
  body:
    AdminAIChatRequestBody;

  adminId:
    string;

  adminRole:
    Parameters<
      typeof getAdminAIToolsForRole
    >[0];

  conversationId:
    string;

  language:
    AdminAILanguage;
}) {
  const actionLogId =
    cleanString(
      body.confirmation
        ?.actionLogId,
      100
    );

  const decision =
    normalizeConfirmationDecision(
      body.confirmation
        ?.decision
    );

  if (
    !actionLogId ||
    !mongoose.Types.ObjectId.isValid(
      actionLogId
    ) ||
    !decision
  ) {
    return NextResponse.json(
      {
        success:
          false,

        message:
          "Invalid Admin AI confirmation request.",
      },
      {
        status:
          400,
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRM
  |--------------------------------------------------------------------------
  */

  if (
    decision ===
    "confirm"
  ) {
    const result =
      await confirmAndExecuteAdminAIAction(
        {
          actionLogId,

          adminId,

          adminRole,
        }
      );

    await saveAdminConfirmationMessage(
      {
        adminId,

        adminRole,

        conversationId,

        content:
          "Confirmed Admin AI action.",

        toolName:
          result.toolName ||
          "",

        actionLogId,

        confirmed:
          result.success,

        language,
      }
    );

    if (
      result.toolName
    ) {
      await saveAdminToolResultMessage(
        {
          adminId,

          adminRole,

          conversationId,

          toolName:
            result.toolName,

          toolCallId:
            actionLogId,

          success:
            result.success,

          output: {
            success:
              result.success,

            message:
              result.message,

            data:
              result.data ??
              null,

            actionLogId:
              result.actionLogId ||
              actionLogId,
          },

          errorMessage:
            result.error ||
            "",

          requiresConfirmation:
            true,

          confirmedByAdmin:
            result.success,

          language,
        }
      );
    }

    let content:
      string;

    if (
      language ===
      "gu"
    ) {
      content =
        result.success
          ? `Action સફળતાપૂર્વક પૂર્ણ થયું. ${result.message}`
          : `Action પૂર્ણ થઈ શક્યું નથી. ${result.message}`;
    } else if (
      language ===
      "hi"
    ) {
      content =
        result.success
          ? `Action सफलतापूर्वक पूरा हुआ। ${result.message}`
          : `Action पूरा नहीं हो सका। ${result.message}`;
    } else {
      content =
        result.success
          ? `Action completed successfully. ${result.message}`
          : `Action could not be completed. ${result.message}`;
    }

    await saveAdminAssistantMessage(
      {
        adminId,

        adminRole,

        conversationId,

        content,

        language,

        aiModel:
          getGeminiModel(),

        metadata: {
          provider:
            "gemini",

          confirmationResult:
            true,

          actionLogId,

          success:
            result.success,
        },
      }
    );

    return NextResponse.json(
      {
        success:
          result.success,

        message:
          content,

        conversationId,

        language,

        provider:
          "gemini",

        model:
          getGeminiModel(),

        confirmation: {
          required:
            false,

          actionLogId,

          decision:
            "confirm",

          completed:
            result.success,
        },

        toolResult:
          result,
      },
      {
        status:
          result.success
            ? 200
            : 400,
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | REJECT
  |--------------------------------------------------------------------------
  */

  const result =
    await rejectAdminAIAction(
      {
        actionLogId,

        adminId,

        adminRole,
      }
    );

  await saveAdminConfirmationMessage(
    {
      adminId,

      adminRole,

      conversationId,

      content:
        "Rejected Admin AI action.",

      toolName:
        result.toolName ||
        "",

      actionLogId,

      confirmed:
        false,

      language,
    }
  );

  let content:
    string;

  if (
    result.success
  ) {
    if (
      language ===
      "gu"
    ) {
      content =
        "Action reject કરવામાં આવ્યું. કોઈ database change થયું નથી.";
    } else if (
      language ===
      "hi"
    ) {
      content =
        "Action reject कर दिया गया। कोई database change नहीं हुआ।";
    } else {
      content =
        "Action rejected. No database change was made.";
    }
  } else {
    content =
      result.message;
  }

  await saveAdminAssistantMessage(
    {
      adminId,

      adminRole,

      conversationId,

      content,

      language,

      aiModel:
        getGeminiModel(),

      metadata: {
        provider:
          "gemini",

        confirmationResult:
          true,

        confirmationRejected:
          true,

        actionLogId,
      },
    }
  );

  return NextResponse.json(
    {
      success:
        result.success,

      message:
        content,

      conversationId,

      language,

      provider:
        "gemini",

      model:
        getGeminiModel(),

      confirmation: {
        required:
          false,

        actionLogId,

        decision:
          "reject",

        completed:
          false,
      },
    },
    {
      status:
        result.success
          ? 200
          : 400,
    }
  );
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
  try {
    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATE ADMIN
    |--------------------------------------------------------------------------
    */

    const auth =
      await authenticateAdminAIRequest(
        request
      );

    if (
      !auth.success
    ) {
      return jsonError(
        auth.message,
        auth.status
      );
    }

    const admin =
      auth.admin;

    /*
    |--------------------------------------------------------------------------
    | BODY
    |--------------------------------------------------------------------------
    */

    let body:
      AdminAIChatRequestBody;

    try {
      body =
        await request.json();
    } catch {
      return jsonError(
        "Invalid JSON request body.",
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | REQUEST CONTEXT
    |--------------------------------------------------------------------------
    */

    const language =
      normalizeLanguage(
        body.language
      );

    const businessPeriod =
      normalizeBusinessPeriod(
        body.businessPeriod
      );

    const currentPath =
      cleanString(
        body.currentPath,
        MAX_CURRENT_PATH_LENGTH
      );

    const sessionId =
      normalizeSessionId(
        body.sessionId
      );

    const requestedConversationId =
      normalizeConversationId(
        body.conversationId
      );

    /*
    |--------------------------------------------------------------------------
    | CONVERSATION
    |--------------------------------------------------------------------------
    */

    const prepared =
      await prepareConversation(
        {
          adminId:
            admin.id,

          adminRole:
            admin.role,

          requestedConversationId,

          sessionId,

          language,

          businessPeriod,

          currentPath,
        }
      );

    if (
      !prepared.success ||
      !prepared.conversation
    ) {
      return jsonError(
        prepared.message,
        404
      );
    }

    const conversationId =
      String(
        (
          prepared.conversation as
            any
        )._id
      );

    /*
    |--------------------------------------------------------------------------
    | EXPLICIT CONFIRMATION / REJECTION
    |--------------------------------------------------------------------------
    */

    if (
      body.confirmation
    ) {
      return handleConfirmation(
        {
          body,

          adminId:
            admin.id,

          adminRole:
            admin.role,

          conversationId,

          language,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | MESSAGE
    |--------------------------------------------------------------------------
    */

    const message =
      cleanString(
        body.message,
        MAX_MESSAGE_LENGTH
      );

    if (
      !message
    ) {
      return jsonError(
        "Admin AI message is required.",
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE ADMIN MESSAGE
    |--------------------------------------------------------------------------
    */

    const savedAdminMessage =
      await saveAdminUserMessage(
        {
          adminId:
            admin.id,

          adminRole:
            admin.role,

          conversationId,

          content:
            message,

          language,

          metadata: {
            provider:
              "gemini",

            currentPath,

            businessPeriod,
          },
        }
      );

    if (
      !savedAdminMessage.success
    ) {
      return jsonError(
        savedAdminMessage.message,
        500
      );
    }

    /*
    |--------------------------------------------------------------------------
    | AUTO TITLE
    |--------------------------------------------------------------------------
    */

    const conversationAny =
      prepared.conversation as
        any;

    if (
      !conversationAny
        .messageCount ||
      conversationAny
        .messageCount <=
        1 ||
      conversationAny
        .title ===
        "New Admin AI Conversation"
    ) {
      await updateAdminAIConversationTitleFromMessage(
        {
          adminId:
            admin.id,

          conversationId,

          message,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | HISTORY
    |--------------------------------------------------------------------------
    */

    const historyResult =
      await getAdminAIModelHistory(
        {
          adminId:
            admin.id,

          conversationId,

          limit:
            30,
        }
      );

    const history =
      historyResult.success
        ? historyResult.history
        : [];

    /*
    |--------------------------------------------------------------------------
    | SYSTEM PROMPT
    |--------------------------------------------------------------------------
    */

    const permissionSummary =
      getAdminAIPermissionSummary(
        admin.role
      );

    const systemPrompt =
      buildAdminSystemPrompt(
        {
          adminId:
            admin.id,

          adminName:
            admin.name,

          adminRole:
            admin.role,

          currentPath,

          language,

          businessPeriod,

          permissionSummary,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | GEMINI HISTORY
    |--------------------------------------------------------------------------
    |
    | Current message has already been saved, therefore getModelHistory()
    | already contains it.
    |
    |--------------------------------------------------------------------------
    */

    const contents:
      GeminiContent[] =
      buildGeminiHistory(
        history
      );

    /*
    |--------------------------------------------------------------------------
    | SAFETY FALLBACK
    |--------------------------------------------------------------------------
    */

    if (
      contents.length ===
      0
    ) {
      contents.push(
        {
          role:
            "user",

          parts: [
            {
              text:
                message,
            },
          ],
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | GEMINI CLIENT
    |--------------------------------------------------------------------------
    */

    const ai =
      getGeminiClient();

    const model =
      getGeminiModel();

    /*
    |--------------------------------------------------------------------------
    | ROLE-FILTERED ADMIN TOOLS
    |--------------------------------------------------------------------------
    */

    const adminTools =
      getAdminAIToolsForRole(
        admin.role
      );

    const geminiTools =
      convertAdminToolsToGemini(
        adminTools
      );

    const maxToolRounds =
      getMaxToolRounds();

    /*
    |--------------------------------------------------------------------------
    | CUMULATIVE TOKEN USAGE
    |--------------------------------------------------------------------------
    */

    let totalInputTokens =
      0;

    let totalOutputTokens =
      0;

    let totalTokens =
      0;

    /*
    |--------------------------------------------------------------------------
    | GEMINI TOOL LOOP
    |--------------------------------------------------------------------------
    */

    for (
      let round =
        0;
      round <
      maxToolRounds;
      round +=
        1
    ) {
      /*
      |--------------------------------------------------------------------------
      | CALL GEMINI
      |--------------------------------------------------------------------------
      */

      const response =
        await ai.models.generateContent(
          {
            model,

            contents:
              contents as any,

            config: {
              systemInstruction:
                systemPrompt,

              temperature:
                0.2,

              tools:
                geminiTools as any,
            },
          }
        );

      /*
      |--------------------------------------------------------------------------
      | TOKEN USAGE
      |--------------------------------------------------------------------------
      */

      const usage =
        getGeminiTokenUsage(
          response
        );

      totalInputTokens +=
        usage.inputTokens;

      totalOutputTokens +=
        usage.outputTokens;

      totalTokens +=
        usage.totalTokens;

      /*
      |--------------------------------------------------------------------------
      | GEMINI FUNCTION CALLS
      |--------------------------------------------------------------------------
      */

      const functionCalls =
        getGeminiFunctionCalls(
          response
        );

      /*
      |--------------------------------------------------------------------------
      | FINAL TEXT RESPONSE
      |--------------------------------------------------------------------------
      */

      if (
        functionCalls.length ===
        0
      ) {
        let content =
          getGeminiText(
            response
          );

        if (
          !content
        ) {
          if (
            language ===
            "gu"
          ) {
            content =
              "હાલમાં જવાબ ઉપલબ્ધ નથી.";
          } else if (
            language ===
            "hi"
          ) {
            content =
              "फिलहाल उत्तर उपलब्ध नहीं है।";
          } else {
            content =
              "No response is currently available.";
          }
        }

        await saveAdminAssistantMessage(
          {
            adminId:
              admin.id,

            adminRole:
              admin.role,

            conversationId,

            content,

            language,

            aiModel:
              model,

            tokenUsage: {
              inputTokens:
                totalInputTokens,

              outputTokens:
                totalOutputTokens,

              totalTokens,
            },

            metadata: {
              provider:
                "gemini",

              toolRounds:
                round,

              currentPath,

              businessPeriod,
            },
          }
        );

        return NextResponse.json(
          {
            success:
              true,

            message:
              content,

            conversationId,

            sessionId,

            language,

            businessPeriod,

            provider:
              "gemini",

            model,

            admin: {
              id:
                admin.id,

              name:
                admin.name,

              role:
                admin.role,
            },

            confirmation: {
              required:
                false,
            },
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SAVE GEMINI MODEL CONTENT
      |--------------------------------------------------------------------------
      |
      | For function calling continuation Gemini requires the model's
      | functionCall content to remain in the conversation.
      |
      |--------------------------------------------------------------------------
    */

      const modelContent =
        getGeminiResponseContent(
          response
        );

      if (
        modelContent
      ) {
        contents.push(
          modelContent
        );
      }

      /*
      |--------------------------------------------------------------------------
      | FUNCTION RESPONSES FOR NEXT GEMINI ROUND
      |--------------------------------------------------------------------------
      */

      const functionResponseParts:
        GeminiPart[] =
        [];

      /*
      |--------------------------------------------------------------------------
      | EXECUTE FUNCTION CALLS
      |--------------------------------------------------------------------------
      */

      for (
        const functionCall of
        functionCalls
      ) {
        const toolNameRaw =
          cleanString(
            functionCall?.name,
            150
          );

        const toolCallId =
          createToolCallId(
            functionCall?.id
          );

        const args =
          safeObject(
            functionCall?.args
          );

        /*
        |--------------------------------------------------------------------------
        | INVALID TOOL
        |--------------------------------------------------------------------------
        */

        if (
          !isAdminAIToolName(
            toolNameRaw
          )
        ) {
          const invalidOutput = {
            success:
              false,

            message:
              "Unsupported Admin AI tool.",
          };

          functionResponseParts.push(
            {
              functionResponse: {
                id:
                  toolCallId,

                name:
                  toolNameRaw ||
                  "invalid_tool",

                response:
                  invalidOutput,
              },
            }
          );

          continue;
        }

        const toolName:
          AdminAIToolName =
          toolNameRaw;

        /*
        |--------------------------------------------------------------------------
        | SAVE TOOL CALL
        |--------------------------------------------------------------------------
        */

        await saveAdminToolCallMessage(
          {
            adminId:
              admin.id,

            adminRole:
              admin.role,

            conversationId,

            toolName,

            toolCallId,

            toolInput:
              args,

            language,

            aiModel:
              model,
          }
        );

        /*
        |--------------------------------------------------------------------------
        | TRUSTED SERVER CONTEXT
        |--------------------------------------------------------------------------
        |
        | Admin ID + role come from authenticated adminToken.
        |
        | They NEVER come from Gemini arguments.
        |
        |--------------------------------------------------------------------------
        */

        const executionContext =
          buildAdminAIExecutionContext(
            {
              admin,

              conversationId,

              messageId:
                savedAdminMessage.data
                  ? String(
                      (
                        savedAdminMessage
                          .data as
                          any
                      )._id
                    )
                  : null,

              requestId:
                `${conversationId}:${toolCallId}`,
            }
          );

        /*
        |--------------------------------------------------------------------------
        | EXECUTE TOOL
        |--------------------------------------------------------------------------
        */

        const toolResult =
          await executeAdminAITool(
            {
              toolName,

              args,

              context:
                executionContext,
            }
          );

        /*
        |--------------------------------------------------------------------------
        | SAVE TOOL RESULT
        |--------------------------------------------------------------------------
        */

        await saveAdminToolResultMessage(
          {
            adminId:
              admin.id,

            adminRole:
              admin.role,

            conversationId,

            toolName,

            toolCallId,

            success:
              toolResult.success,

            output: {
              success:
                toolResult.success,

              message:
                toolResult.message,

              data:
                toolResult.data ??
                null,

              actionLogId:
                toolResult.actionLogId ||
                null,

              confirmationRequired:
                toolResult
                  .confirmationRequired ===
                true,
            },

            errorMessage:
              toolResult.error ||
              "",

            requiresConfirmation:
              toolResult
                .requiresConfirmation ===
              true,

            confirmedByAdmin:
              false,

            language,
          }
        );

        /*
        |--------------------------------------------------------------------------
        | CONFIRMATION REQUIRED
        |--------------------------------------------------------------------------
        |
        | STOP NOW.
        |
        | No destructive database mutation has occurred.
        |
        |--------------------------------------------------------------------------
        */

        if (
          toolResult
            .confirmationRequired ===
            true &&
          toolResult.actionLogId
        ) {
          let confirmationText:
            string;

          if (
            language ===
            "gu"
          ) {
            confirmationText =
              "આ action હજી execute થયું નથી. આગળ વધવા માટે નીચે દર્શાવેલ exact action Confirm કરો.";
          } else if (
            language ===
            "hi"
          ) {
            confirmationText =
              "यह action अभी execute नहीं हुआ है। आगे बढ़ने के लिए नीचे दिए गए exact action को Confirm करें।";
          } else {
            confirmationText =
              "This action has not been executed yet. Confirm the exact action below to continue.";
          }

          await saveAdminAssistantMessage(
            {
              adminId:
                admin.id,

              adminRole:
                admin.role,

              conversationId,

              content:
                confirmationText,

              language,

              aiModel:
                model,

              tokenUsage: {
                inputTokens:
                  totalInputTokens,

                outputTokens:
                  totalOutputTokens,

                totalTokens,
              },

              metadata: {
                provider:
                  "gemini",

                confirmationRequired:
                  true,

                actionLogId:
                  toolResult.actionLogId,

                toolName,

                action:
                  toolResult.action ||
                  "",
              },
            }
          );

          await updateAdminAIConversation(
            {
              adminId:
                admin.id,

              conversationId,

              lastToolName:
                toolName,

              lastActionType:
                toolResult.action ||
                "",
            }
          );

          return NextResponse.json(
            {
              success:
                true,

              message:
                confirmationText,

              conversationId,

              sessionId,

              language,

              businessPeriod,

              provider:
                "gemini",

              model,

              confirmation: {
                required:
                  true,

                actionLogId:
                  toolResult.actionLogId,

                toolName,

                action:
                  toolResult.action ||
                  "",

                details:
                  toolResult.data ??
                  null,
              },
            }
          );
        }

        /*
        |--------------------------------------------------------------------------
        | NORMAL TOOL RESULT → GEMINI
        |--------------------------------------------------------------------------
        */

        const responseForGemini =
          limitToolOutput(
            {
              success:
                toolResult.success,

              message:
                toolResult.message,

              data:
                toolResult.data ??
                null,
            }
          );

        functionResponseParts.push(
          {
            functionResponse: {
              id:
                toolCallId,

              name:
                toolName,

              response:
                responseForGemini,
            },
          }
        );

        /*
        |--------------------------------------------------------------------------
        | UPDATE CONVERSATION CONTEXT
        |--------------------------------------------------------------------------
        */

        await updateAdminAIConversation(
          {
            adminId:
              admin.id,

            conversationId,

            lastToolName:
              toolName,

            lastActionType:
              toolResult.action ||
              "",
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | FUNCTION RESPONSE MESSAGE
      |--------------------------------------------------------------------------
      |
      | Gemini expects functionResponse in a user-role Content.
      |
      |--------------------------------------------------------------------------
        */

      if (
        functionResponseParts.length >
        0
      ) {
        contents.push(
          {
            role:
              "user",

            parts:
              functionResponseParts,
          }
        );

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | NOTHING EXECUTABLE RETURNED
      |--------------------------------------------------------------------------
      */

      break;
    }

    /*
    |--------------------------------------------------------------------------
    | MAX TOOL ROUNDS
    |--------------------------------------------------------------------------
    */

    let fallback:
      string;

    if (
      language ===
      "gu"
    ) {
      fallback =
        "આ request માટે AI tool processing limit પહોંચી ગઈ છે. કૃપા કરીને request થોડું વધુ ચોક્કસ કરીને ફરી મોકલો.";
    } else if (
      language ===
      "hi"
    ) {
      fallback =
        "इस request के लिए AI tool processing limit पूरी हो गई है। कृपया request को थोड़ा अधिक स्पष्ट करके फिर भेजें।";
    } else {
      fallback =
        "The AI tool-processing limit was reached. Please make the request a little more specific and try again.";
    }

    await saveAdminAssistantMessage(
      {
        adminId:
          admin.id,

        adminRole:
          admin.role,

        conversationId,

        content:
          fallback,

        language,

        aiModel:
          model,

        tokenUsage: {
          inputTokens:
            totalInputTokens,

          outputTokens:
            totalOutputTokens,

          totalTokens,
        },

        metadata: {
          provider:
            "gemini",

          maxToolRoundsReached:
            true,
        },
      }
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          fallback,

        conversationId,

        sessionId,

        language,

        businessPeriod,

        provider:
          "gemini",

        model,
      },
      {
        status:
          422,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI Gemini chat route error:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | FRIENDLIER GEMINI ERROR
    |--------------------------------------------------------------------------
    */

    const rawMessage =
      error instanceof
        Error
        ? error.message
        : "";

    let message =
      "Unable to process Admin AI request.";

    if (
      rawMessage
        .toLowerCase()
        .includes(
          "api key"
        )
    ) {
      message =
        "Gemini API key configuration is invalid or missing.";
    } else if (
      rawMessage.includes(
        "429"
      ) ||
      rawMessage
        .toLowerCase()
        .includes(
          "quota"
        ) ||
      rawMessage
        .toLowerCase()
        .includes(
          "rate limit"
        )
    ) {
      message =
        "Gemini API free-tier limit has been reached. Please try again later.";
    } else if (
      rawMessage
        .toLowerCase()
        .includes(
          "model"
        ) &&
      rawMessage
        .toLowerCase()
        .includes(
          "not found"
        )
    ) {
      message =
        "Configured Gemini model is not available.";
    }

    return NextResponse.json(
      {
        success:
          false,

        message,

        provider:
          "gemini",

        error:
          process.env
            .NODE_ENV ===
          "development"
            ? rawMessage ||
              "Unknown Gemini error."
            : undefined,
      },
      {
        status:
          500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
|
| Admin AI auth / health check.
|
|--------------------------------------------------------------------------
*/

export async function GET(
  request:
    NextRequest
) {
  try {
    const auth =
      await authenticateAdminAIRequest(
        request
      );

    if (
      !auth.success
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    const permissionSummary =
      getAdminAIPermissionSummary(
        auth.admin.role
      );

    return NextResponse.json(
      {
        success:
          true,

        message:
          "SilentGEN Admin AI is available.",

        provider:
          "gemini",

        model:
          getGeminiModel(),

        admin: {
          id:
            auth.admin.id,

          name:
            auth.admin.name,

          email:
            auth.admin.email,

          role:
            auth.admin.role,
        },

        supportedLanguages: [
          {
            code:
              "gu",

            name:
              "Gujarati",
          },

          {
            code:
              "hi",

            name:
              "Hindi",
          },

          {
            code:
              "en",

            name:
              "English",
          },
        ],

        permissionSummary,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI Gemini GET error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to load Admin AI.",

        provider:
          "gemini",
      },
      {
        status:
          500,
      }
    );
  }
}