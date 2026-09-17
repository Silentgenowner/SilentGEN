"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bot,
  Boxes,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  Loader2,
  MessageCircle,
  Package,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| ADMIN AI ASSISTANT
|--------------------------------------------------------------------------
|
| Supported languages ONLY:
|
| - Gujarati
| - Hindi
| - English
|
| API:
|
| GET  /api/admin/ai/chat
| POST /api/admin/ai/chat
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| LANGUAGE
|--------------------------------------------------------------------------
*/

type AdminAILanguage =
  | "gu"
  | "hi"
  | "en";

/*
|--------------------------------------------------------------------------
| PERIOD
|--------------------------------------------------------------------------
*/

type AdminAIBusinessPeriod =
  | "daily"
  | "weekly"
  | "monthly";

/*
|--------------------------------------------------------------------------
| ADMIN ROLE
|--------------------------------------------------------------------------
*/

type AdminRole =
  | "super_admin"
  | "product_manager"
  | "order_manager"
  | "support_admin"
  | "finance_manager";

/*
|--------------------------------------------------------------------------
| API ADMIN
|--------------------------------------------------------------------------
*/

type AdminAIAdmin = {
  id:
    string;

  name:
    string;

  email?:
    string;

  role:
    AdminRole;
};

/*
|--------------------------------------------------------------------------
| CONFIRMATION
|--------------------------------------------------------------------------
*/

type AdminAIConfirmation = {
  required:
    boolean;

  actionLogId?:
    string;

  toolName?:
    string;

  action?:
    string;

  details?:
    unknown;

  decision?:
    "confirm"
    | "reject";

  completed?:
    boolean;
};

/*
|--------------------------------------------------------------------------
| CHAT API RESPONSE
|--------------------------------------------------------------------------
*/

type AdminAIChatResponse = {
  success:
    boolean;

  message?:
    string;

  conversationId?:
    string;

  sessionId?:
    string;

  language?:
    AdminAILanguage;

  businessPeriod?:
    AdminAIBusinessPeriod;

  admin?:
    AdminAIAdmin;

  confirmation?:
    AdminAIConfirmation;

  toolResult?: {
    success?:
      boolean;

    message?:
      string;

    data?:
      unknown;

    actionLogId?:
      string;
  };

  supportedLanguages?: Array<{
    code:
      AdminAILanguage;

    name:
      string;
  }>;

  error?:
    string;
};

/*
|--------------------------------------------------------------------------
| MESSAGE
|--------------------------------------------------------------------------
*/

type UIMessageRole =
  | "admin"
  | "assistant"
  | "system";

type UIMessage = {
  id:
    string;

  role:
    UIMessageRole;

  content:
    string;

  createdAt:
    Date;

  confirmation?:
    AdminAIConfirmation | null;

  isError?:
    boolean;
};

/*
|--------------------------------------------------------------------------
| LANGUAGE COPY
|--------------------------------------------------------------------------
*/

const COPY = {
  gu: {
    title:
      "SilentGEN Admin AI",

    subtitle:
      "Business Intelligence Assistant",

    placeholder:
      "Business, products, stock, orders અથવા sales વિશે પૂછો...",

    welcome:
      "નમસ્તે! હું SilentGEN Admin AI છું. Sales, demand, stock, products અને orders વિશે મદદ કરી શકું છું.",

    send:
      "મોકલો",

    loading:
      "વિચાર કરી રહ્યું છે...",

    unavailable:
      "Admin AI હાલમાં ઉપલબ્ધ નથી.",

    authFailed:
      "Admin authentication મળ્યું નથી. ફરી login કરો.",

    confirm:
      "Confirm",

    reject:
      "Reject",

    confirmationNeeded:
      "આ action execute કરતાં પહેલાં confirmation જરૂરી છે.",

    notExecuted:
      "આ change હજી execute થયું નથી.",

    processingAction:
      "Action process થઈ રહ્યું છે...",

    confirmed:
      "Action confirm કરવામાં આવ્યું.",

    rejected:
      "Action reject કરવામાં આવ્યું. કોઈ database change થયું નથી.",

    daily:
      "આજે",

    weekly:
      "7 દિવસ",

    monthly:
      "30 દિવસ",

    language:
      "ભાષા",

    period:
      "Period",

    quickActions:
      "Quick Actions",

    salesGrowth:
      "Sales કેવી રીતે વધારવી?",

    demand:
      "High demand products",

    restock:
      "Restock priority",

    conversion:
      "Conversion problems",

    slowStock:
      "Slow-moving stock",

    todayOrders:
      "Today's orders",

    dashboard:
      "Business summary",

    clearChat:
      "નવી Chat",

    online:
      "Ready",

    role:
      "Role",

    current:
      "Current",

    requested:
      "Requested",

    exactAction:
      "Exact action",

    warning:
      "Confirm કર્યા પછી stored exact action execute થશે.",

    noResponse:
      "AI તરફથી જવાબ મળ્યો નથી.",

    retry:
      "ફરી પ્રયાસ કરો",

    close:
      "બંધ કરો",

    open:
      "Admin AI ખોલો",
  },

  hi: {
    title:
      "SilentGEN Admin AI",

    subtitle:
      "Business Intelligence Assistant",

    placeholder:
      "Business, products, stock, orders या sales के बारे में पूछें...",

    welcome:
      "नमस्ते! मैं SilentGEN Admin AI हूँ। Sales, demand, stock, products और orders में आपकी मदद कर सकता हूँ।",

    send:
      "भेजें",

    loading:
      "सोच रहा है...",

    unavailable:
      "Admin AI अभी उपलब्ध नहीं है।",

    authFailed:
      "Admin authentication नहीं मिला। कृपया दोबारा login करें।",

    confirm:
      "Confirm",

    reject:
      "Reject",

    confirmationNeeded:
      "इस action को execute करने से पहले confirmation जरूरी है।",

    notExecuted:
      "यह change अभी execute नहीं हुआ है।",

    processingAction:
      "Action process हो रहा है...",

    confirmed:
      "Action confirm किया गया।",

    rejected:
      "Action reject किया गया। कोई database change नहीं हुआ।",

    daily:
      "आज",

    weekly:
      "7 दिन",

    monthly:
      "30 दिन",

    language:
      "भाषा",

    period:
      "Period",

    quickActions:
      "Quick Actions",

    salesGrowth:
      "Sales कैसे बढ़ाएं?",

    demand:
      "High demand products",

    restock:
      "Restock priority",

    conversion:
      "Conversion problems",

    slowStock:
      "Slow-moving stock",

    todayOrders:
      "Today's orders",

    dashboard:
      "Business summary",

    clearChat:
      "नई Chat",

    online:
      "Ready",

    role:
      "Role",

    current:
      "Current",

    requested:
      "Requested",

    exactAction:
      "Exact action",

    warning:
      "Confirm करने के बाद stored exact action execute होगा।",

    noResponse:
      "AI से जवाब नहीं मिला।",

    retry:
      "फिर कोशिश करें",

    close:
      "बंद करें",

    open:
      "Admin AI खोलें",
  },

  en: {
    title:
      "SilentGEN Admin AI",

    subtitle:
      "Business Intelligence Assistant",

    placeholder:
      "Ask about business, products, stock, orders or sales...",

    welcome:
      "Hello! I’m SilentGEN Admin AI. I can help with sales, demand, stock, products and orders.",

    send:
      "Send",

    loading:
      "Thinking...",

    unavailable:
      "Admin AI is currently unavailable.",

    authFailed:
      "Admin authentication was not found. Please log in again.",

    confirm:
      "Confirm",

    reject:
      "Reject",

    confirmationNeeded:
      "Confirmation is required before this action can execute.",

    notExecuted:
      "This change has not been executed yet.",

    processingAction:
      "Processing action...",

    confirmed:
      "Action confirmed.",

    rejected:
      "Action rejected. No database change was made.",

    daily:
      "Today",

    weekly:
      "7 Days",

    monthly:
      "30 Days",

    language:
      "Language",

    period:
      "Period",

    quickActions:
      "Quick Actions",

    salesGrowth:
      "How can I increase sales?",

    demand:
      "High demand products",

    restock:
      "Restock priority",

    conversion:
      "Conversion problems",

    slowStock:
      "Slow-moving stock",

    todayOrders:
      "Today's orders",

    dashboard:
      "Business summary",

    clearChat:
      "New Chat",

    online:
      "Ready",

    role:
      "Role",

    current:
      "Current",

    requested:
      "Requested",

    exactAction:
      "Exact action",

    warning:
      "After confirmation, the exact stored action will execute.",

    noResponse:
      "No response was returned by the AI.",

    retry:
      "Try again",

    close:
      "Close",

    open:
      "Open Admin AI",
  },
} as const;

/*
|--------------------------------------------------------------------------
| STORAGE KEYS
|--------------------------------------------------------------------------
*/

const LANGUAGE_STORAGE_KEY =
  "silentgen_admin_ai_language";

const PERIOD_STORAGE_KEY =
  "silentgen_admin_ai_period";

const SESSION_STORAGE_KEY =
  "silentgen_admin_ai_session";

const CONVERSATION_STORAGE_KEY =
  "silentgen_admin_ai_conversation";

/*
|--------------------------------------------------------------------------
| ROLE LABEL
|--------------------------------------------------------------------------
*/

function getRoleLabel(
  role:
    AdminRole | null
) {
  switch (
    role
  ) {
    case "super_admin":
      return "Super Admin";

    case "product_manager":
      return "Product Manager";

    case "order_manager":
      return "Order Manager";

    case "support_admin":
      return "Support Admin";

    case "finance_manager":
      return "Finance Manager";

    default:
      return "Admin";
  }
}

/*
|--------------------------------------------------------------------------
| RANDOM ID
|--------------------------------------------------------------------------
*/

function createId() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/*
|--------------------------------------------------------------------------
| SESSION ID
|--------------------------------------------------------------------------
*/

function createSessionId() {
  return `admin-ai-${createId()}`;
}

/*
|--------------------------------------------------------------------------
| VALID LANGUAGE
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
| VALID PERIOD
|--------------------------------------------------------------------------
*/

function normalizePeriod(
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
| SAFE TEXT
|--------------------------------------------------------------------------
*/

function safeText(
  value:
    unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

/*
|--------------------------------------------------------------------------
| FORMAT JSON
|--------------------------------------------------------------------------
*/

function stringifyDetails(
  value:
    unknown
) {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return "";
  }

  try {
    const text =
      JSON.stringify(
        value,
        null,
        2
      );

    return text.length >
      4000
      ? `${text.slice(
          0,
          4000
        )}\n...`
      : text;
  } catch {
    return "";
  }
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function AdminAIAssistant() {
  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(
      false
    );

  const [
    isExpanded,
    setIsExpanded,
  ] =
    useState(
      false
    );

  /*
  |--------------------------------------------------------------------------
  | ADMIN
  |--------------------------------------------------------------------------
  */

  const [
    admin,
    setAdmin,
  ] =
    useState<AdminAIAdmin | null>(
      null
    );

  const [
    authLoading,
    setAuthLoading,
  ] =
    useState(
      true
    );

  const [
    authError,
    setAuthError,
  ] =
    useState(
      ""
    );

  /*
  |--------------------------------------------------------------------------
  | LANGUAGE
  |--------------------------------------------------------------------------
  */

  const [
    language,
    setLanguage,
  ] =
    useState<AdminAILanguage>(
      "gu"
    );

  /*
  |--------------------------------------------------------------------------
  | PERIOD
  |--------------------------------------------------------------------------
  */

  const [
    businessPeriod,
    setBusinessPeriod,
  ] =
    useState<AdminAIBusinessPeriod>(
      "weekly"
    );

  /*
  |--------------------------------------------------------------------------
  | SESSION
  |--------------------------------------------------------------------------
  */

  const [
    sessionId,
    setSessionId,
  ] =
    useState(
      ""
    );

  const [
    conversationId,
    setConversationId,
  ] =
    useState(
      ""
    );

  /*
  |--------------------------------------------------------------------------
  | CHAT
  |--------------------------------------------------------------------------
  */

  const [
    messages,
    setMessages,
  ] =
    useState<UIMessage[]>(
      []
    );

  const [
    input,
    setInput,
  ] =
    useState(
      ""
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    confirmationLoading,
    setConfirmationLoading,
  ] =
    useState(
      false
    );

  /*
  |--------------------------------------------------------------------------
  | REFS
  |--------------------------------------------------------------------------
  */

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | COPY
  |--------------------------------------------------------------------------
  */

  const copy =
    COPY[
      language
    ];

  /*
  |--------------------------------------------------------------------------
  | CURRENT PATH
  |--------------------------------------------------------------------------
  */

  const getCurrentPath =
    useCallback(
      () => {
        if (
          typeof window ===
          "undefined"
        ) {
          return "/admin";
        }

        return (
          window.location.pathname ||
          "/admin"
        );
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | INITIAL STORAGE
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      const storedLanguage =
        window.localStorage.getItem(
          LANGUAGE_STORAGE_KEY
        );

      const storedPeriod =
        window.localStorage.getItem(
          PERIOD_STORAGE_KEY
        );

      const storedSession =
        window.sessionStorage.getItem(
          SESSION_STORAGE_KEY
        );

      const storedConversation =
        window.sessionStorage.getItem(
          CONVERSATION_STORAGE_KEY
        );

      setLanguage(
        storedLanguage
          ? normalizeLanguage(
              storedLanguage
            )
          : "gu"
      );

      setBusinessPeriod(
        normalizePeriod(
          storedPeriod
        )
      );

      if (
        storedSession
      ) {
        setSessionId(
          storedSession
        );
      } else {
        const newSession =
          createSessionId();

        window.sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          newSession
        );

        setSessionId(
          newSession
        );
      }

      if (
        storedConversation
      ) {
        setConversationId(
          storedConversation
        );
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | SAVE LANGUAGE
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      window.localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        language
      );
    },
    [
      language,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | SAVE PERIOD
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      window.localStorage.setItem(
        PERIOD_STORAGE_KEY,
        businessPeriod
      );
    },
    [
      businessPeriod,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | SAVE CONVERSATION
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      if (
        conversationId
      ) {
        window.sessionStorage.setItem(
          CONVERSATION_STORAGE_KEY,
          conversationId
        );
      }
    },
    [
      conversationId,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | WELCOME MESSAGE
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      setMessages(
        (
          previous
        ) => {
          if (
            previous.length >
            0
          ) {
            return previous;
          }

          return [
            {
              id:
                createId(),

              role:
                "assistant",

              content:
                copy.welcome,

              createdAt:
                new Date(),

              confirmation:
                null,
            },
          ];
        }
      );
    },
    [
      copy.welcome,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE WELCOME LANGUAGE
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      setMessages(
        (
          previous
        ) => {
          if (
            previous.length !==
            1 ||
            previous[0].role !==
              "assistant"
          ) {
            return previous;
          }

          return [
            {
              ...previous[0],

              content:
                copy.welcome,
            },
          ];
        }
      );
    },
    [
      copy.welcome,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | AUTH CHECK
  |--------------------------------------------------------------------------
  */

  const loadAdminAI =
    useCallback(
      async () => {
        setAuthLoading(
          true
        );

        setAuthError(
          ""
        );

        try {
          const response =
            await fetch(
              "/api/admin/ai/chat",
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data:
            AdminAIChatResponse =
            await response.json();

          if (
            !response.ok ||
            !data.success ||
            !data.admin
          ) {
            setAdmin(
              null
            );

            setAuthError(
              data.message ||
              COPY[
                language
              ].authFailed
            );

            return;
          }

          setAdmin(
            data.admin
          );
        } catch (
          error
        ) {
          console.error(
            "SilentGEN Admin AI auth error:",
            error
          );

          setAdmin(
            null
          );

          setAuthError(
            COPY[
              language
            ].unavailable
          );
        } finally {
          setAuthLoading(
            false
          );
        }
      },
      [
        language,
      ]
    );

  useEffect(
    () => {
      void loadAdminAI();
    },
    [
      loadAdminAI,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | AUTO SCROLL
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior:
            "smooth",
        }
      );
    },
    [
      messages,
      loading,
      confirmationLoading,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | FOCUS
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !isOpen
      ) {
        return;
      }

      const timeout =
        window.setTimeout(
          () => {
            textareaRef.current?.focus();
          },
          150
        );

      return () => {
        window.clearTimeout(
          timeout
        );
      };
    },
    [
      isOpen,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | QUICK ACTIONS
  |--------------------------------------------------------------------------
  */

  const quickActions =
    useMemo(
      () => [
        {
          id:
            "sales-growth",

          label:
            copy.salesGrowth,

          icon:
            TrendingUp,

          prompt:
            language ===
            "gu"
              ? "આ periodમાં SilentGENની sales વધારવા માટે live business data અને demand intelligence પરથી priority પ્રમાણે શું કરવું?"
              : language ===
                  "hi"
                ? "इस period में SilentGEN की sales बढ़ाने के लिए live business data और demand intelligence के आधार पर priority के अनुसार क्या करना चाहिए?"
                : "Based on live business data and demand intelligence, what should I prioritize to increase SilentGEN sales in this period?",
        },

        {
          id:
            "dashboard",

          label:
            copy.dashboard,

          icon:
            BarChart3,

          prompt:
            language ===
            "gu"
              ? "આ periodનો business summary આપો. Sales, demand, conversion, stock risk અને મુખ્ય opportunities બતાવો."
              : language ===
                  "hi"
                ? "इस period का business summary दें। Sales, demand, conversion, stock risk और मुख्य opportunities बताएं।"
                : "Give me a business summary for this period covering sales, demand, conversion, stock risk and key opportunities.",
        },

        {
          id:
            "demand",

          label:
            copy.demand,

          icon:
            ArrowUp,

          prompt:
            language ===
            "gu"
              ? "આ periodમાં સૌથી વધારે demand ધરાવતા products બતાવો અને દરેક માટે current stock સાથે સમજાવો."
              : language ===
                  "hi"
                ? "इस period में सबसे ज्यादा demand वाले products दिखाएं और हर product को current stock के साथ समझाएं।"
                : "Show the highest-demand products for this period and explain each with current stock.",
        },

        {
          id:
            "restock",

          label:
            copy.restock,

          icon:
            Boxes,

          prompt:
            language ===
            "gu"
              ? "Demand અને live stock પ્રમાણે કયા productsની restock priority સૌથી વધારે છે?"
              : language ===
                  "hi"
                ? "Demand और live stock के आधार पर किन products की restock priority सबसे ज्यादा है?"
                : "Which products have the highest restock priority based on demand and live stock?",
        },

        {
          id:
            "conversion",

          label:
            copy.conversion,

          icon:
            CircleDollarSign,

          prompt:
            language ===
            "gu"
              ? "High interest પણ low purchase conversion ધરાવતા products શોધો અને શું review કરવું તે કહો."
              : language ===
                  "hi"
                ? "High interest लेकिन low purchase conversion वाले products खोजें और बताएं कि क्या review करना चाहिए।"
                : "Find products with high interest but low purchase conversion and tell me what should be reviewed.",
        },

        {
          id:
            "slow-stock",

          label:
            copy.slowStock,

          icon:
            ArrowDown,

          prompt:
            language ===
            "gu"
              ? "High stock અને low demand ધરાવતા slow-moving products બતાવો અને inventory માટે શું કરવું તે કહો."
              : language ===
                  "hi"
                ? "High stock और low demand वाले slow-moving products दिखाएं और inventory के लिए क्या करना चाहिए बताएं।"
                : "Show slow-moving products with high stock and low demand and recommend what to do with the inventory.",
        },

        {
          id:
            "orders",

          label:
            copy.todayOrders,

          icon:
            Package,

          prompt:
            language ===
            "gu"
              ? "આજના orders વિશે summary આપો અને કોઈ pending અથવા ધ્યાન આપવા જેવી બાબત હોય તો બતાવો."
              : language ===
                  "hi"
                ? "आज के orders का summary दें और कोई pending या ध्यान देने योग्य बात हो तो बताएं।"
                : "Give me a summary of today's orders and highlight anything pending or requiring attention.",
        },
      ],
      [
        copy,
        language,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | ADD MESSAGE
  |--------------------------------------------------------------------------
  */

  const appendMessage =
    useCallback(
      (
        message:
          UIMessage
      ) => {
        setMessages(
          (
            previous
          ) => [
            ...previous,
            message,
          ]
        );
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | APPLY SERVER IDs
  |--------------------------------------------------------------------------
  */

  const applyResponseContext =
    useCallback(
      (
        data:
          AdminAIChatResponse
      ) => {
        if (
          data.conversationId
        ) {
          setConversationId(
            data.conversationId
          );
        }

        if (
          data.sessionId
        ) {
          setSessionId(
            data.sessionId
          );

          if (
            typeof window !==
            "undefined"
          ) {
            window.sessionStorage.setItem(
              SESSION_STORAGE_KEY,
              data.sessionId
            );
          }
        }

        if (
          data.admin
        ) {
          setAdmin(
            data.admin
          );
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | SEND MESSAGE
  |--------------------------------------------------------------------------
  */

  const sendMessage =
    useCallback(
      async (
        customMessage?:
          string
      ) => {
        const message =
          safeText(
            customMessage ??
            input
          );

        if (
          !message ||
          loading ||
          confirmationLoading ||
          authLoading ||
          !admin
        ) {
          return;
        }

        const currentSessionId =
          sessionId ||
          createSessionId();

        if (
          !sessionId
        ) {
          setSessionId(
            currentSessionId
          );

          if (
            typeof window !==
            "undefined"
          ) {
            window.sessionStorage.setItem(
              SESSION_STORAGE_KEY,
              currentSessionId
            );
          }
        }

        appendMessage(
          {
            id:
              createId(),

            role:
              "admin",

            content:
              message,

            createdAt:
              new Date(),

            confirmation:
              null,
          }
        );

        setInput(
          ""
        );

        setLoading(
          true
        );

        try {
          const response =
            await fetch(
              "/api/admin/ai/chat",
              {
                method:
                  "POST",

                credentials:
                  "include",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    {
                      message,

                      conversationId:
                        conversationId ||
                        undefined,

                      sessionId:
                        currentSessionId,

                      language,

                      businessPeriod,

                      currentPath:
                        getCurrentPath(),
                    }
                  ),
              }
            );

          const data:
            AdminAIChatResponse =
            await response.json();

          applyResponseContext(
            data
          );

          const assistantText =
            safeText(
              data.message
            ) ||
            copy.noResponse;

          appendMessage(
            {
              id:
                createId(),

              role:
                "assistant",

              content:
                assistantText,

              createdAt:
                new Date(),

              confirmation:
                data.confirmation
                  ?.required
                  ? data.confirmation
                  : null,

              isError:
                !data.success &&
                !data.confirmation
                  ?.required,
            }
          );
        } catch (
          error
        ) {
          console.error(
            "SilentGEN Admin AI send error:",
            error
          );

          appendMessage(
            {
              id:
                createId(),

              role:
                "assistant",

              content:
                copy.unavailable,

              createdAt:
                new Date(),

              confirmation:
                null,

              isError:
                true,
            }
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        admin,
        appendMessage,
        applyResponseContext,
        authLoading,
        businessPeriod,
        confirmationLoading,
        conversationId,
        copy.noResponse,
        copy.unavailable,
        getCurrentPath,
        input,
        language,
        loading,
        sessionId,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      await sendMessage();
    };

  /*
  |--------------------------------------------------------------------------
  | KEYBOARD
  |--------------------------------------------------------------------------
  */

  const handleKeyDown =
    (
      event:
        KeyboardEvent<HTMLTextAreaElement>
    ) => {
      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        void sendMessage();
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CONFIRM / REJECT
  |--------------------------------------------------------------------------
  */

  const handleConfirmation =
    useCallback(
      async ({
        messageId,
        confirmation,
        decision,
      }: {
        messageId:
          string;

        confirmation:
          AdminAIConfirmation;

        decision:
          "confirm"
          | "reject";
      }) => {
        const actionLogId =
          safeText(
            confirmation
              .actionLogId
          );

        if (
          !actionLogId ||
          confirmationLoading ||
          loading ||
          !admin
        ) {
          return;
        }

        setConfirmationLoading(
          true
        );

        /*
        |--------------------------------------------------------------------------
        | REMOVE BUTTONS IMMEDIATELY
        |--------------------------------------------------------------------------
        */

        setMessages(
          (
            previous
          ) =>
            previous.map(
              (
                item
              ) =>
                item.id ===
                messageId
                  ? {
                      ...item,

                      confirmation: {
                        ...confirmation,

                        required:
                          false,

                        decision,
                      },
                    }
                  : item
            )
        );

        try {
          const response =
            await fetch(
              "/api/admin/ai/chat",
              {
                method:
                  "POST",

                credentials:
                  "include",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    {
                      conversationId,

                      sessionId,

                      language,

                      businessPeriod,

                      currentPath:
                        getCurrentPath(),

                      confirmation: {
                        actionLogId,

                        decision,
                      },
                    }
                  ),
              }
            );

          const data:
            AdminAIChatResponse =
            await response.json();

          applyResponseContext(
            data
          );

          let content =
            safeText(
              data.message
            );

          if (
            !content
          ) {
            content =
              decision ===
              "confirm"
                ? data.success
                  ? copy.confirmed
                  : copy.unavailable
                : copy.rejected;
          }

          appendMessage(
            {
              id:
                createId(),

              role:
                "assistant",

              content,

              createdAt:
                new Date(),

              confirmation:
                null,

              isError:
                !data.success &&
                decision ===
                  "confirm",
            }
          );
        } catch (
          error
        ) {
          console.error(
            "SilentGEN Admin AI confirmation error:",
            error
          );

          appendMessage(
            {
              id:
                createId(),

              role:
                "assistant",

              content:
                copy.unavailable,

              createdAt:
                new Date(),

              confirmation:
                null,

              isError:
                true,
            }
          );
        } finally {
          setConfirmationLoading(
            false
          );
        }
      },
      [
        admin,
        appendMessage,
        applyResponseContext,
        businessPeriod,
        confirmationLoading,
        conversationId,
        copy.confirmed,
        copy.rejected,
        copy.unavailable,
        getCurrentPath,
        language,
        loading,
        sessionId,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | NEW CHAT
  |--------------------------------------------------------------------------
  */

  const startNewChat =
    () => {
      const newSession =
        createSessionId();

      setSessionId(
        newSession
      );

      setConversationId(
        ""
      );

      setInput(
        ""
      );

      setMessages(
        [
          {
            id:
              createId(),

            role:
              "assistant",

            content:
              copy.welcome,

            createdAt:
              new Date(),

            confirmation:
              null,
          },
        ]
      );

      if (
        typeof window !==
        "undefined"
      ) {
        window.sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          newSession
        );

        window.sessionStorage.removeItem(
          CONVERSATION_STORAGE_KEY
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | OPEN BUTTON
  |--------------------------------------------------------------------------
  */

  if (
    !isOpen
  ) {
    return (
      <button
        type="button"
        onClick={() =>
          setIsOpen(
            true
          )
        }
        title={
          copy.open
        }
        className="
          fixed
          bottom-5
          right-5
          z-[100]
          flex
          h-14
          items-center
          gap-2
          rounded-full
          bg-slate-950
          px-4
          text-sm
          font-semibold
          text-white
          shadow-2xl
          transition
          hover:-translate-y-0.5
          hover:bg-slate-800
          focus:outline-none
          focus:ring-4
          focus:ring-slate-300
        "
      >
        <span
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            bg-white/10
          "
        >
          <Sparkles
            size={
              17
            }
          />
        </span>

        <span
          className="
            hidden
            sm:inline
          "
        >
          Admin AI
        </span>
      </button>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PANEL
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={`
        fixed
        z-[100]
        overflow-hidden
        border
        border-slate-200
        bg-white
        shadow-2xl
        transition-all
        duration-200

        ${
          isExpanded
            ? `
              inset-3
              rounded-3xl
              md:inset-6
            `
            : `
              bottom-4
              right-4
              h-[min(760px,calc(100vh-2rem))]
              w-[calc(100vw-2rem)]
              max-w-[460px]
              rounded-3xl
            `
        }
      `}
    >
      <div
        className="
          flex
          h-full
          min-h-0
          flex-col
        "
      >
        {/*
        |--------------------------------------------------------------------------
        | HEADER
        |--------------------------------------------------------------------------
        */}

        <div
          className="
            shrink-0
            border-b
            border-slate-200
            bg-slate-950
            px-4
            py-3
            text-white
          "
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >
            <div
              className="
                flex
                min-w-0
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white/10
                "
              >
                <Bot
                  size={
                    22
                  }
                />
              </div>

              <div
                className="
                  min-w-0
                "
              >
                <div
                  className="
                    truncate
                    text-sm
                    font-bold
                  "
                >
                  {
                    copy.title
                  }
                </div>

                <div
                  className="
                    mt-0.5
                    flex
                    flex-wrap
                    items-center
                    gap-x-2
                    gap-y-1
                    text-[11px]
                    text-slate-300
                  "
                >
                  <span>
                    {
                      copy.subtitle
                    }
                  </span>

                  <span>
                    •
                  </span>

                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1
                    "
                  >
                    <span
                      className="
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-emerald-400
                      "
                    />

                    {
                      copy.online
                    }
                  </span>
                </div>
              </div>
            </div>

            <div
              className="
                flex
                shrink-0
                items-center
                gap-1
              "
            >
              <button
                type="button"
                onClick={
                  startNewChat
                }
                title={
                  copy.clearChat
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-300
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                <RefreshCcw
                  size={
                    17
                  }
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsExpanded(
                    (
                      previous
                    ) =>
                      !previous
                  )
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-300
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                {isExpanded ? (
                  <ChevronDown
                    size={
                      18
                    }
                  />
                ) : (
                  <ChevronUp
                    size={
                      18
                    }
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsOpen(
                    false
                  )
                }
                title={
                  copy.close
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-300
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                <X
                  size={
                    18
                  }
                />
              </button>
            </div>
          </div>

          {/*
          |--------------------------------------------------------------------------
          | ADMIN INFO
          |--------------------------------------------------------------------------
          */}

          <div
            className="
              mt-3
              flex
              flex-wrap
              items-center
              justify-between
              gap-2
            "
          >
            <div
              className="
                flex
                min-w-0
                items-center
                gap-2
                text-xs
                text-slate-300
              "
            >
              <ShieldCheck
                size={
                  14
                }
              />

              {authLoading ? (
                <span>
                  Loading admin...
                </span>
              ) : admin ? (
                <span
                  className="
                    truncate
                  "
                >
                  {admin.name ||
                    "Admin"}
                  {" · "}
                  {
                    getRoleLabel(
                      admin.role
                    )
                  }
                </span>
              ) : (
                <span
                  className="
                    text-red-300
                  "
                >
                  Authentication required
                </span>
              )}
            </div>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              {/*
              |--------------------------------------------------------------------------
              | LANGUAGE
              |--------------------------------------------------------------------------
              */}

              <select
                value={
                  language
                }
                onChange={(
                  event
                ) =>
                  setLanguage(
                    normalizeLanguage(
                      event
                        .target
                        .value
                    )
                  )
                }
                className="
                  h-8
                  rounded-lg
                  border
                  border-white/15
                  bg-white/10
                  px-2
                  text-xs
                  font-medium
                  text-white
                  outline-none
                "
              >
                <option
                  value="gu"
                  className="
                    text-slate-900
                  "
                >
                  ગુજરાતી
                </option>

                <option
                  value="hi"
                  className="
                    text-slate-900
                  "
                >
                  हिन्दी
                </option>

                <option
                  value="en"
                  className="
                    text-slate-900
                  "
                >
                  English
                </option>
              </select>

              {/*
              |--------------------------------------------------------------------------
              | PERIOD
              |--------------------------------------------------------------------------
              */}

              <select
                value={
                  businessPeriod
                }
                onChange={(
                  event
                ) =>
                  setBusinessPeriod(
                    normalizePeriod(
                      event
                        .target
                        .value
                    )
                  )
                }
                className="
                  h-8
                  rounded-lg
                  border
                  border-white/15
                  bg-white/10
                  px-2
                  text-xs
                  font-medium
                  text-white
                  outline-none
                "
              >
                <option
                  value="daily"
                  className="
                    text-slate-900
                  "
                >
                  {
                    copy.daily
                  }
                </option>

                <option
                  value="weekly"
                  className="
                    text-slate-900
                  "
                >
                  {
                    copy.weekly
                  }
                </option>

                <option
                  value="monthly"
                  className="
                    text-slate-900
                  "
                >
                  {
                    copy.monthly
                  }
                </option>
              </select>
            </div>
          </div>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | AUTH ERROR
        |--------------------------------------------------------------------------
        */}

        {!authLoading &&
          authError && (
            <div
              className="
                shrink-0
                border-b
                border-red-200
                bg-red-50
                px-4
                py-3
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-2
                  text-sm
                  text-red-700
                "
              >
                <AlertTriangle
                  className="
                    mt-0.5
                    shrink-0
                  "
                  size={
                    17
                  }
                />

                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  {
                    authError
                  }
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadAdminAI()
                  }
                  className="
                    shrink-0
                    rounded-lg
                    border
                    border-red-200
                    bg-white
                    px-2
                    py-1
                    text-xs
                    font-semibold
                    hover:bg-red-100
                  "
                >
                  {
                    copy.retry
                  }
                </button>
              </div>
            </div>
          )}

        {/*
        |--------------------------------------------------------------------------
        | QUICK ACTIONS
        |--------------------------------------------------------------------------
        */}

        <div
          className="
            shrink-0
            border-b
            border-slate-100
            bg-slate-50/80
            px-3
            py-3
          "
        >
          <div
            className="
              mb-2
              flex
              items-center
              gap-1.5
              text-[11px]
              font-bold
              uppercase
              tracking-wide
              text-slate-500
            "
          >
            <Sparkles
              size={
                13
              }
            />

            {
              copy.quickActions
            }
          </div>

          <div
            className="
              flex
              gap-2
              overflow-x-auto
              pb-1
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {quickActions.map(
              (
                action
              ) => {
                const Icon =
                  action.icon;

                return (
                  <button
                    key={
                      action.id
                    }
                    type="button"
                    disabled={
                      loading ||
                      confirmationLoading ||
                      authLoading ||
                      !admin
                    }
                    onClick={() =>
                      void sendMessage(
                        action.prompt
                      )
                    }
                    className="
                      flex
                      shrink-0
                      items-center
                      gap-1.5
                      rounded-full
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-2
                      text-xs
                      font-medium
                      text-slate-700
                      shadow-sm
                      transition
                      hover:border-slate-300
                      hover:bg-slate-100
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <Icon
                      size={
                        14
                      }
                    />

                    {
                      action.label
                    }
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | MESSAGES
        |--------------------------------------------------------------------------
        */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            bg-white
            px-3
            py-4
          "
        >
          <div
            className={`
              mx-auto
              flex
              w-full
              flex-col
              gap-4

              ${
                isExpanded
                  ? "max-w-5xl"
                  : "max-w-full"
              }
            `}
          >
            {messages.map(
              (
                message
              ) => {
                const isAdmin =
                  message.role ===
                  "admin";

                return (
                  <div
                    key={
                      message.id
                    }
                    className={`
                      flex
                      gap-2

                      ${
                        isAdmin
                          ? "justify-end"
                          : "justify-start"
                      }
                    `}
                  >
                    {!isAdmin && (
                      <div
                        className="
                          mt-1
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-slate-950
                          text-white
                        "
                      >
                        <Bot
                          size={
                            16
                          }
                        />
                      </div>
                    )}

                    <div
                      className={`
                        min-w-0

                        ${
                          isExpanded
                            ? "max-w-[80%]"
                            : "max-w-[84%]"
                        }
                      `}
                    >
                      <div
                        className={`
                          whitespace-pre-wrap
                          break-words
                          rounded-2xl
                          px-4
                          py-3
                          text-sm
                          leading-6

                          ${
                            isAdmin
                              ? `
                                rounded-br-md
                                bg-slate-950
                                text-white
                              `
                              : message.isError
                                ? `
                                  rounded-bl-md
                                  border
                                  border-red-200
                                  bg-red-50
                                  text-red-800
                                `
                                : `
                                  rounded-bl-md
                                  border
                                  border-slate-200
                                  bg-slate-50
                                  text-slate-800
                                `
                          }
                        `}
                      >
                        {
                          message.content
                        }
                      </div>

                      {/*
                      |--------------------------------------------------------------------------
                      | CONFIRMATION CARD
                      |--------------------------------------------------------------------------
                      */}

                      {message.confirmation
                        ?.required &&
                        message
                          .confirmation
                          .actionLogId && (
                          <div
                            className="
                              mt-2
                              overflow-hidden
                              rounded-2xl
                              border
                              border-amber-200
                              bg-amber-50
                            "
                          >
                            <div
                              className="
                                flex
                                gap-3
                                border-b
                                border-amber-200
                                px-4
                                py-3
                              "
                            >
                              <div
                                className="
                                  flex
                                  h-9
                                  w-9
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-xl
                                  bg-amber-100
                                  text-amber-700
                                "
                              >
                                <AlertTriangle
                                  size={
                                    18
                                  }
                                />
                              </div>

                              <div
                                className="
                                  min-w-0
                                "
                              >
                                <div
                                  className="
                                    text-sm
                                    font-bold
                                    text-amber-900
                                  "
                                >
                                  {
                                    copy.confirmationNeeded
                                  }
                                </div>

                                <div
                                  className="
                                    mt-1
                                    text-xs
                                    leading-5
                                    text-amber-800
                                  "
                                >
                                  {
                                    copy.notExecuted
                                  }
                                </div>
                              </div>
                            </div>

                            <div
                              className="
                                space-y-2
                                px-4
                                py-3
                                text-xs
                              "
                            >
                              {message
                                .confirmation
                                .action && (
                                <div
                                  className="
                                    flex
                                    gap-2
                                  "
                                >
                                  <span
                                    className="
                                      shrink-0
                                      font-semibold
                                      text-slate-500
                                    "
                                  >
                                    {
                                      copy.exactAction
                                    }:
                                  </span>

                                  <span
                                    className="
                                      break-all
                                      font-medium
                                      text-slate-900
                                    "
                                  >
                                    {
                                      message
                                        .confirmation
                                        .action
                                    }
                                  </span>
                                </div>
                              )}

                              {message
                                .confirmation
                                .toolName && (
                                <div
                                  className="
                                    flex
                                    gap-2
                                  "
                                >
                                  <span
                                    className="
                                      shrink-0
                                      font-semibold
                                      text-slate-500
                                    "
                                  >
                                    Tool:
                                  </span>

                                  <span
                                    className="
                                      break-all
                                      text-slate-700
                                    "
                                  >
                                    {
                                      message
                                        .confirmation
                                        .toolName
                                    }
                                  </span>
                                </div>
                              )}

                              {message
                                .confirmation
                                .details !==
                                undefined && (
                                <details
                                  className="
                                    rounded-xl
                                    border
                                    border-amber-200
                                    bg-white/70
                                    p-3
                                  "
                                >
                                  <summary
                                    className="
                                      cursor-pointer
                                      font-semibold
                                      text-slate-700
                                    "
                                  >
                                    {
                                      copy.requested
                                    }{" "}
                                    details
                                  </summary>

                                  <pre
                                    className="
                                      mt-3
                                      max-h-48
                                      overflow-auto
                                      whitespace-pre-wrap
                                      break-words
                                      text-[11px]
                                      leading-5
                                      text-slate-600
                                    "
                                  >
                                    {stringifyDetails(
                                      message
                                        .confirmation
                                        .details
                                    )}
                                  </pre>
                                </details>
                              )}

                              <div
                                className="
                                  flex
                                  items-start
                                  gap-2
                                  rounded-xl
                                  bg-white/70
                                  p-2.5
                                  text-amber-800
                                "
                              >
                                <ShieldCheck
                                  className="
                                    mt-0.5
                                    shrink-0
                                  "
                                  size={
                                    14
                                  }
                                />

                                <span>
                                  {
                                    copy.warning
                                  }
                                </span>
                              </div>
                            </div>

                            <div
                              className="
                                grid
                                grid-cols-2
                                gap-2
                                border-t
                                border-amber-200
                                p-3
                              "
                            >
                              <button
                                type="button"
                                disabled={
                                  confirmationLoading
                                }
                                onClick={() =>
                                  void handleConfirmation(
                                    {
                                      messageId:
                                        message.id,

                                      confirmation:
                                        message.confirmation!,

                                      decision:
                                        "reject",
                                    }
                                  )
                                }
                                className="
                                  flex
                                  h-10
                                  items-center
                                  justify-center
                                  gap-2
                                  rounded-xl
                                  border
                                  border-slate-300
                                  bg-white
                                  text-sm
                                  font-semibold
                                  text-slate-700
                                  transition
                                  hover:bg-slate-100
                                  disabled:cursor-not-allowed
                                  disabled:opacity-50
                                "
                              >
                                {confirmationLoading ? (
                                  <Loader2
                                    className="
                                      animate-spin
                                    "
                                    size={
                                      16
                                    }
                                  />
                                ) : (
                                  <XCircle
                                    size={
                                      16
                                    }
                                  />
                                )}

                                {
                                  copy.reject
                                }
                              </button>

                              <button
                                type="button"
                                disabled={
                                  confirmationLoading
                                }
                                onClick={() =>
                                  void handleConfirmation(
                                    {
                                      messageId:
                                        message.id,

                                      confirmation:
                                        message.confirmation!,

                                      decision:
                                        "confirm",
                                    }
                                  )
                                }
                                className="
                                  flex
                                  h-10
                                  items-center
                                  justify-center
                                  gap-2
                                  rounded-xl
                                  bg-emerald-600
                                  text-sm
                                  font-semibold
                                  text-white
                                  transition
                                  hover:bg-emerald-700
                                  disabled:cursor-not-allowed
                                  disabled:opacity-50
                                "
                              >
                                {confirmationLoading ? (
                                  <Loader2
                                    className="
                                      animate-spin
                                    "
                                    size={
                                      16
                                    }
                                  />
                                ) : (
                                  <Check
                                    size={
                                      16
                                    }
                                  />
                                )}

                                {
                                  copy.confirm
                                }
                              </button>
                            </div>
                          </div>
                        )}

                      <div
                        className={`
                          mt-1
                          px-1
                          text-[10px]
                          text-slate-400

                          ${
                            isAdmin
                              ? "text-right"
                              : "text-left"
                          }
                        `}
                      >
                        {message.createdAt.toLocaleTimeString(
                          [],
                          {
                            hour:
                              "2-digit",

                            minute:
                              "2-digit",
                          }
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div
                        className="
                          mt-1
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-slate-200
                          text-slate-700
                        "
                      >
                        <UserRound
                          size={
                            16
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              }
            )}

            {/*
            |--------------------------------------------------------------------------
            | AI LOADING
            |--------------------------------------------------------------------------
            */}

            {loading && (
              <div
                className="
                  flex
                  items-start
                  gap-2
                "
              >
                <div
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-slate-950
                    text-white
                  "
                >
                  <Bot
                    size={
                      16
                    }
                  />
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-2xl
                    rounded-bl-md
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    py-3
                    text-sm
                    text-slate-600
                  "
                >
                  <Loader2
                    className="
                      animate-spin
                    "
                    size={
                      16
                    }
                  />

                  {
                    copy.loading
                  }
                </div>
              </div>
            )}

            {confirmationLoading && (
              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  py-2
                  text-xs
                  font-medium
                  text-slate-500
                "
              >
                <Loader2
                  className="
                    animate-spin
                  "
                  size={
                    14
                  }
                />

                {
                  copy.processingAction
                }
              </div>
            )}

            <div
              ref={
                messagesEndRef
              }
            />
          </div>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | FOOTER / INPUT
        |--------------------------------------------------------------------------
        */}

        <div
          className="
            shrink-0
            border-t
            border-slate-200
            bg-white
            p-3
          "
        >
          <div
            className={`
              mx-auto
              w-full

              ${
                isExpanded
                  ? "max-w-5xl"
                  : "max-w-full"
              }
            `}
          >
            <form
              onSubmit={
                handleSubmit
              }
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-slate-300
                  bg-white
                  p-2
                  shadow-sm
                  transition
                  focus-within:border-slate-500
                  focus-within:ring-2
                  focus-within:ring-slate-100
                "
              >
                <textarea
                  ref={
                    textareaRef
                  }
                  value={
                    input
                  }
                  onChange={(
                    event
                  ) =>
                    setInput(
                      event
                        .target
                        .value
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                  disabled={
                    loading ||
                    confirmationLoading ||
                    authLoading ||
                    !admin
                  }
                  rows={
                    2
                  }
                  maxLength={
                    12_000
                  }
                  placeholder={
                    copy.placeholder
                  }
                  className="
                    block
                    max-h-36
                    min-h-[54px]
                    w-full
                    resize-none
                    border-0
                    bg-transparent
                    px-2
                    py-2
                    text-sm
                    leading-6
                    text-slate-900
                    outline-none
                    placeholder:text-slate-400
                    disabled:cursor-not-allowed
                    disabled:bg-transparent
                  "
                />

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-2
                    px-1
                    pb-1
                  "
                >
                  <div
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-1.5
                      text-[10px]
                      text-slate-400
                    "
                  >
                    <Clock3
                      size={
                        12
                      }
                    />

                    <span>
                      Enter = Send
                    </span>

                    <span>
                      •
                    </span>

                    <span>
                      Shift+Enter = New line
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      !input.trim() ||
                      loading ||
                      confirmationLoading ||
                      authLoading ||
                      !admin
                    }
                    className="
                      flex
                      h-9
                      shrink-0
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-slate-950
                      px-3
                      text-xs
                      font-semibold
                      text-white
                      transition
                      hover:bg-slate-800
                      disabled:cursor-not-allowed
                      disabled:bg-slate-300
                    "
                  >
                    {loading ? (
                      <Loader2
                        className="
                          animate-spin
                        "
                        size={
                          15
                        }
                      />
                    ) : (
                      <Send
                        size={
                          15
                        }
                      />
                    )}

                    <span
                      className="
                        hidden
                        sm:inline
                      "
                    >
                      {
                        copy.send
                      }
                    </span>
                  </button>
                </div>
              </div>
            </form>

            <div
              className="
                mt-2
                flex
                flex-wrap
                items-center
                justify-between
                gap-2
                px-1
                text-[10px]
                text-slate-400
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-1
                "
              >
                <ShieldCheck
                  size={
                    11
                  }
                />

                <span>
                  Server-side permissions + confirmation protected
                </span>
              </div>

              <div>
                ગુજરાતી · हिन्दी · English
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}