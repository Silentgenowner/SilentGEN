import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| ADMIN AI ACTION LOG
|--------------------------------------------------------------------------
|
| Audit + confirmation model for consequential Admin AI actions.
|
| IMPORTANT:
|
| This model DOES NOT grant permission by itself.
|
| Actual Admin AI API/tool execution must still:
|
| 1. authenticate adminToken
| 2. resolve current admin role
| 3. verify role permission server-side
| 4. verify confirmation server-side
| 5. execute action
| 6. save result in this audit log
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| ADMIN ROLE
|--------------------------------------------------------------------------
*/

export type AdminAIActionAdminRole =
  | "super_admin"
  | "product_manager"
  | "order_manager"
  | "support_admin"
  | "finance_manager";

/*
|--------------------------------------------------------------------------
| ACTION STATUS
|--------------------------------------------------------------------------
*/

export type AdminAIActionStatus =
  | "requested"
  | "authorized"
  | "completed"
  | "failed"
  | "rejected"
  | "expired";

/*
|--------------------------------------------------------------------------
| ACTION RISK
|--------------------------------------------------------------------------
*/

export type AdminAIActionRiskLevel =
  | "read"
  | "low"
  | "medium"
  | "high"
  | "critical";

/*
|--------------------------------------------------------------------------
| ACTION CATEGORY
|--------------------------------------------------------------------------
*/

export type AdminAIActionCategory =
  | "analytics"
  | "product"
  | "inventory"
  | "pricing"
  | "order"
  | "refund"
  | "customer"
  | "coupon"
  | "report"
  | "settings"
  | "admin_management"
  | "other";

/*
|--------------------------------------------------------------------------
| ACTION TYPE
|--------------------------------------------------------------------------
*/

export type AdminAIActionType =
  /*
  |--------------------------------------------------------------------------
  | READ / ANALYTICS
  |--------------------------------------------------------------------------
  */

  | "view_business_intelligence"
  | "view_dashboard_summary"
  | "view_product"
  | "search_products"
  | "view_order"
  | "search_orders"
  | "view_customer"
  | "search_customers"
  | "view_report"

  /*
  |--------------------------------------------------------------------------
  | PRODUCT
  |--------------------------------------------------------------------------
  */

  | "create_product_draft"
  | "update_product"
  | "update_product_status"
  | "archive_product"
  | "delete_product"

  /*
  |--------------------------------------------------------------------------
  | INVENTORY
  |--------------------------------------------------------------------------
  */

  | "update_stock"
  | "increase_stock"
  | "decrease_stock"
  | "update_low_stock_limit"

  /*
  |--------------------------------------------------------------------------
  | PRICING
  |--------------------------------------------------------------------------
  */

  | "update_price"
  | "update_mrp"
  | "update_discount"

  /*
  |--------------------------------------------------------------------------
  | ORDER
  |--------------------------------------------------------------------------
  */

  | "update_order_status"
  | "cancel_order"
  | "approve_return"
  | "reject_return"
  | "approve_exchange"
  | "reject_exchange"

  /*
  |--------------------------------------------------------------------------
  | REFUND
  |--------------------------------------------------------------------------
  */

  | "initiate_refund"
  | "mark_refund_processing"
  | "mark_refund_completed"

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER
  |--------------------------------------------------------------------------
  */

  | "block_customer"
  | "unblock_customer"

  /*
  |--------------------------------------------------------------------------
  | COUPON
  |--------------------------------------------------------------------------
  */

  | "create_coupon"
  | "update_coupon"
  | "disable_coupon"

  /*
  |--------------------------------------------------------------------------
  | REPORT
  |--------------------------------------------------------------------------
  */

  | "generate_report"
  | "export_report"

  /*
  |--------------------------------------------------------------------------
  | SETTINGS
  |--------------------------------------------------------------------------
  */

  | "update_store_settings"

  /*
  |--------------------------------------------------------------------------
  | ADMIN MANAGEMENT
  |--------------------------------------------------------------------------
  */

  | "create_admin"
  | "update_admin_role"
  | "disable_admin"

  /*
  |--------------------------------------------------------------------------
  | FALLBACK
  |--------------------------------------------------------------------------
  */

  | "other";

/*
|--------------------------------------------------------------------------
| TARGET TYPE
|--------------------------------------------------------------------------
*/

export type AdminAIActionTargetType =
  | "product"
  | "order"
  | "customer"
  | "coupon"
  | "admin"
  | "settings"
  | "report"
  | "inventory"
  | "business"
  | "none";

/*
|--------------------------------------------------------------------------
| DOCUMENT
|--------------------------------------------------------------------------
*/

export interface IAdminAIActionLog
  extends Document {
  adminId:
    Types.ObjectId;

  adminRole:
    AdminAIActionAdminRole;

  conversationId?:
    Types.ObjectId | null;

  messageId?:
    Types.ObjectId | null;

  action:
    AdminAIActionType;

  toolName:
    string;

  category:
    AdminAIActionCategory;

  riskLevel:
    AdminAIActionRiskLevel;

  status:
    AdminAIActionStatus;

  targetType:
    AdminAIActionTargetType;

  targetId?:
    Types.ObjectId | null;

  targetLabel:
    string;

  requiresConfirmation:
    boolean;

  confirmedByAdmin:
    boolean;

  confirmationRequestedAt?:
    Date | null;

  confirmedAt?:
    Date | null;

  rejectedAt?:
    Date | null;

  expiredAt?:
    Date | null;

  executedAt?:
    Date | null;

  roleAuthorized:
    boolean;

  permissionCheckedAt?:
    Date | null;

  input:
    Record<
      string,
      unknown
    >;

  beforeState:
    Record<
      string,
      unknown
    >;

  afterState:
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

  requestId:
    string;

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

const MAX_TOOL_NAME_LENGTH =
  150;

const MAX_TARGET_LABEL_LENGTH =
  300;

const MAX_ERROR_LENGTH =
  3000;

const MAX_REQUEST_ID_LENGTH =
  200;

const MAX_OBJECT_KEYS =
  100;

const MAX_ARRAY_VALUES =
  100;

const MAX_STRING_VALUE_LENGTH =
  3000;

const MAX_DEPTH =
  5;

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
| SECRET FIELD NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeSecretKey(
  value:
    string
) {
  return value
    .replace(
      /[^a-z0-9]/gi,
      ""
    )
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| BLOCKED SECRET KEYS
|--------------------------------------------------------------------------
*/

const BLOCKED_KEYS =
  new Set([
    "password",
    "otp",
    "token",
    "authorization",
    "cookie",
    "secret",
    "apikey",
    "accesskey",
    "privatekey",
    "accesstoken",
    "refreshtoken",
    "adminToken",
    "admintoken",
    "cvv",
    "cardnumber",
    "creditcard",
  ].map(
    normalizeSecretKey
  ));

/*
|--------------------------------------------------------------------------
| SANITIZE VALUE
|--------------------------------------------------------------------------
*/

function sanitizeValue(
  value:
    unknown,
  depth =
    0
):
  unknown {
  if (
    depth >
    MAX_DEPTH
  ) {
    return null;
  }

  if (
    value ===
      null ||
    typeof value ===
      "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value
    )
      ? value
      : null;
  }

  if (
    typeof value ===
    "string"
  ) {
    return value.slice(
      0,
      MAX_STRING_VALUE_LENGTH
    );
  }

  if (
    value instanceof
    Date
  ) {
    return value;
  }

  if (
    value instanceof
    mongoose.Types.ObjectId
  ) {
    return String(
      value
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
        MAX_ARRAY_VALUES
      )
      .map(
        (
          current
        ) =>
          sanitizeValue(
            current,
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
        nestedValue,
      ] of Object.entries(
        value as
          Record<
            string,
            unknown
          >
      ).slice(
        0,
        MAX_OBJECT_KEYS
      )
    ) {
      const cleanKey =
        cleanString(
          key,
          150
        );

      if (
        !cleanKey
      ) {
        continue;
      }

      const normalizedKey =
        normalizeSecretKey(
          cleanKey
        );

      if (
        BLOCKED_KEYS.has(
          normalizedKey
        )
      ) {
        continue;
      }

      output[
        cleanKey
      ] =
        sanitizeValue(
          nestedValue,
          depth + 1
        );
    }

    return output;
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| SANITIZE OBJECT
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

  return (
    sanitizeValue(
      value
    ) as
      Record<
        string,
        unknown
      >
  ) ||
    {};
}

/*
|--------------------------------------------------------------------------
| VALID DATE
|--------------------------------------------------------------------------
*/

function normalizeDate(
  value:
    unknown
):
  Date | null {
  if (
    !value
  ) {
    return null;
  }

  const date =
    value instanceof
      Date
      ? value
      : new Date(
          value as
            string | number
        );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

/*
|--------------------------------------------------------------------------
| ACTION CATEGORY DEFAULT
|--------------------------------------------------------------------------
*/

function getDefaultCategory(
  action:
    AdminAIActionType
):
  AdminAIActionCategory {
  if (
    [
      "view_business_intelligence",
      "view_dashboard_summary",
    ].includes(
      action
    )
  ) {
    return "analytics";
  }

  if (
    [
      "create_product_draft",
      "update_product",
      "update_product_status",
      "archive_product",
      "delete_product",
      "view_product",
      "search_products",
    ].includes(
      action
    )
  ) {
    return "product";
  }

  if (
    [
      "update_stock",
      "increase_stock",
      "decrease_stock",
      "update_low_stock_limit",
    ].includes(
      action
    )
  ) {
    return "inventory";
  }

  if (
    [
      "update_price",
      "update_mrp",
      "update_discount",
    ].includes(
      action
    )
  ) {
    return "pricing";
  }

  if (
    [
      "view_order",
      "search_orders",
      "update_order_status",
      "cancel_order",
      "approve_return",
      "reject_return",
      "approve_exchange",
      "reject_exchange",
    ].includes(
      action
    )
  ) {
    return "order";
  }

  if (
    [
      "initiate_refund",
      "mark_refund_processing",
      "mark_refund_completed",
    ].includes(
      action
    )
  ) {
    return "refund";
  }

  if (
    [
      "view_customer",
      "search_customers",
      "block_customer",
      "unblock_customer",
    ].includes(
      action
    )
  ) {
    return "customer";
  }

  if (
    [
      "create_coupon",
      "update_coupon",
      "disable_coupon",
    ].includes(
      action
    )
  ) {
    return "coupon";
  }

  if (
    [
      "view_report",
      "generate_report",
      "export_report",
    ].includes(
      action
    )
  ) {
    return "report";
  }

  if (
    action ===
    "update_store_settings"
  ) {
    return "settings";
  }

  if (
    [
      "create_admin",
      "update_admin_role",
      "disable_admin",
    ].includes(
      action
    )
  ) {
    return "admin_management";
  }

  return "other";
}

/*
|--------------------------------------------------------------------------
| DEFAULT RISK LEVEL
|--------------------------------------------------------------------------
*/

function getDefaultRiskLevel(
  action:
    AdminAIActionType
):
  AdminAIActionRiskLevel {
  /*
  |--------------------------------------------------------------------------
  | READ
  |--------------------------------------------------------------------------
  */

  if (
    [
      "view_business_intelligence",
      "view_dashboard_summary",
      "view_product",
      "search_products",
      "view_order",
      "search_orders",
      "view_customer",
      "search_customers",
      "view_report",
    ].includes(
      action
    )
  ) {
    return "read";
  }

  /*
  |--------------------------------------------------------------------------
  | LOW
  |--------------------------------------------------------------------------
  */

  if (
    [
      "create_product_draft",
      "generate_report",
      "export_report",
    ].includes(
      action
    )
  ) {
    return "low";
  }

  /*
  |--------------------------------------------------------------------------
  | MEDIUM
  |--------------------------------------------------------------------------
  */

  if (
    [
      "update_product",
      "update_product_status",
      "update_low_stock_limit",
      "update_order_status",
      "create_coupon",
      "update_coupon",
      "disable_coupon",
    ].includes(
      action
    )
  ) {
    return "medium";
  }

  /*
  |--------------------------------------------------------------------------
  | HIGH
  |--------------------------------------------------------------------------
  */

  if (
    [
      "update_stock",
      "increase_stock",
      "decrease_stock",
      "update_price",
      "update_mrp",
      "update_discount",
      "archive_product",
      "cancel_order",
      "approve_return",
      "reject_return",
      "approve_exchange",
      "reject_exchange",
      "block_customer",
      "unblock_customer",
      "update_store_settings",
    ].includes(
      action
    )
  ) {
    return "high";
  }

  /*
  |--------------------------------------------------------------------------
  | CRITICAL
  |--------------------------------------------------------------------------
  */

  if (
    [
      "delete_product",
      "initiate_refund",
      "mark_refund_processing",
      "mark_refund_completed",
      "create_admin",
      "update_admin_role",
      "disable_admin",
    ].includes(
      action
    )
  ) {
    return "critical";
  }

  return "medium";
}

/*
|--------------------------------------------------------------------------
| ACTION REQUIRES CONFIRMATION
|--------------------------------------------------------------------------
*/

function actionRequiresConfirmation(
  action:
    AdminAIActionType
) {
  const risk =
    getDefaultRiskLevel(
      action
    );

  return (
    risk ===
      "high" ||
    risk ===
      "critical"
  );
}

/*
|--------------------------------------------------------------------------
| SCHEMA
|--------------------------------------------------------------------------
*/

const AdminAIActionLogSchema =
  new Schema<IAdminAIActionLog>(
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
      },

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
      | CONVERSATION
      |--------------------------------------------------------------------------
      */

      conversationId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "AdminAIConversation",

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | MESSAGE
      |--------------------------------------------------------------------------
      */

      messageId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "AdminAIMessage",

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | ACTION
      |--------------------------------------------------------------------------
      */

      action: {
        type:
          String,

        required:
          true,

        enum: [
          "view_business_intelligence",
          "view_dashboard_summary",
          "view_product",
          "search_products",
          "view_order",
          "search_orders",
          "view_customer",
          "search_customers",
          "view_report",

          "create_product_draft",
          "update_product",
          "update_product_status",
          "archive_product",
          "delete_product",

          "update_stock",
          "increase_stock",
          "decrease_stock",
          "update_low_stock_limit",

          "update_price",
          "update_mrp",
          "update_discount",

          "update_order_status",
          "cancel_order",
          "approve_return",
          "reject_return",
          "approve_exchange",
          "reject_exchange",

          "initiate_refund",
          "mark_refund_processing",
          "mark_refund_completed",

          "block_customer",
          "unblock_customer",

          "create_coupon",
          "update_coupon",
          "disable_coupon",

          "generate_report",
          "export_report",

          "update_store_settings",

          "create_admin",
          "update_admin_role",
          "disable_admin",

          "other",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | TOOL NAME
      |--------------------------------------------------------------------------
      */

      toolName: {
        type:
          String,

        required:
          true,

        trim:
          true,

        maxlength:
          MAX_TOOL_NAME_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | CATEGORY
      |--------------------------------------------------------------------------
      */

      category: {
        type:
          String,

        enum: [
          "analytics",
          "product",
          "inventory",
          "pricing",
          "order",
          "refund",
          "customer",
          "coupon",
          "report",
          "settings",
          "admin_management",
          "other",
        ],

        default:
          "other",
      },

      /*
      |--------------------------------------------------------------------------
      | RISK
      |--------------------------------------------------------------------------
      */

      riskLevel: {
        type:
          String,

        enum: [
          "read",
          "low",
          "medium",
          "high",
          "critical",
        ],

        default:
          "medium",
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
          "requested",
          "authorized",
          "completed",
          "failed",
          "rejected",
          "expired",
        ],

        default:
          "requested",
      },

      /*
      |--------------------------------------------------------------------------
      | TARGET
      |--------------------------------------------------------------------------
      */

      targetType: {
        type:
          String,

        enum: [
          "product",
          "order",
          "customer",
          "coupon",
          "admin",
          "settings",
          "report",
          "inventory",
          "business",
          "none",
        ],

        default:
          "none",
      },

      targetId: {
        type:
          Schema.Types.ObjectId,

        default:
          null,
      },

      targetLabel: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TARGET_LABEL_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | CONFIRMATION
      |--------------------------------------------------------------------------
      */

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

      confirmationRequestedAt: {
        type:
          Date,

        default:
          null,
      },

      confirmedAt: {
        type:
          Date,

        default:
          null,
      },

      rejectedAt: {
        type:
          Date,

        default:
          null,
      },

      expiredAt: {
        type:
          Date,

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | EXECUTION
      |--------------------------------------------------------------------------
      */

      executedAt: {
        type:
          Date,

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | PERMISSION
      |--------------------------------------------------------------------------
      */

      roleAuthorized: {
        type:
          Boolean,

        default:
          false,
      },

      permissionCheckedAt: {
        type:
          Date,

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | INPUT
      |--------------------------------------------------------------------------
      */

      input: {
        type:
          Schema.Types.Mixed,

        default:
          {},
      },

      /*
      |--------------------------------------------------------------------------
      | BEFORE STATE
      |--------------------------------------------------------------------------
      |
      | Useful for audit and rollback understanding.
      |
      |--------------------------------------------------------------------------
      */

      beforeState: {
        type:
          Schema.Types.Mixed,

        default:
          {},
      },

      /*
      |--------------------------------------------------------------------------
      | AFTER STATE
      |--------------------------------------------------------------------------
      */

      afterState: {
        type:
          Schema.Types.Mixed,

        default:
          {},
      },

      /*
      |--------------------------------------------------------------------------
      | OUTPUT
      |--------------------------------------------------------------------------
      */

      output: {
        type:
          Schema.Types.Mixed,

        default:
          {},
      },

      /*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */

      errorMessage: {
        type:
          String,

        default:
          "",

        maxlength:
          MAX_ERROR_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | REQUEST ID
      |--------------------------------------------------------------------------
      |
      | Useful for concurrency / double-submit protection.
      |
      |--------------------------------------------------------------------------
      */

      requestId: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_REQUEST_ID_LENGTH,
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

AdminAIActionLogSchema.pre(
  "validate",
  function () {
    /*
    |--------------------------------------------------------------------------
    | BASIC CLEANUP
    |--------------------------------------------------------------------------
    */

    this.toolName =
      cleanString(
        this.toolName,
        MAX_TOOL_NAME_LENGTH
      );

    this.targetLabel =
      cleanString(
        this.targetLabel,
        MAX_TARGET_LABEL_LENGTH
      );

    this.errorMessage =
      cleanString(
        this.errorMessage,
        MAX_ERROR_LENGTH
      );

    this.requestId =
      cleanString(
        this.requestId,
        MAX_REQUEST_ID_LENGTH
      );

    /*
    |--------------------------------------------------------------------------
    | CANONICAL CATEGORY / RISK
    |--------------------------------------------------------------------------
    |
    | Do not trust model-generated risk/category.
    |
    |--------------------------------------------------------------------------
    */

    this.category =
      getDefaultCategory(
        this.action
      );

    this.riskLevel =
      getDefaultRiskLevel(
        this.action
      );

    /*
    |--------------------------------------------------------------------------
    | CANONICAL CONFIRMATION REQUIREMENT
    |--------------------------------------------------------------------------
    */

    this.requiresConfirmation =
      actionRequiresConfirmation(
        this.action
      );

    /*
    |--------------------------------------------------------------------------
    | SANITIZE AUDIT DATA
    |--------------------------------------------------------------------------
    */

    this.input =
      sanitizeObject(
        this.input
      );

    this.beforeState =
      sanitizeObject(
        this.beforeState
      );

    this.afterState =
      sanitizeObject(
        this.afterState
      );

    this.output =
      sanitizeObject(
        this.output
      );

    this.metadata =
      sanitizeObject(
        this.metadata
      );

    /*
    |--------------------------------------------------------------------------
    | DATE NORMALIZATION
    |--------------------------------------------------------------------------
    */

    this.confirmationRequestedAt =
      normalizeDate(
        this.confirmationRequestedAt
      );

    this.confirmedAt =
      normalizeDate(
        this.confirmedAt
      );

    this.rejectedAt =
      normalizeDate(
        this.rejectedAt
      );

    this.expiredAt =
      normalizeDate(
        this.expiredAt
      );

    this.executedAt =
      normalizeDate(
        this.executedAt
      );

    this.permissionCheckedAt =
      normalizeDate(
        this.permissionCheckedAt
      );

    /*
    |--------------------------------------------------------------------------
    | READ / LOW / MEDIUM ACTIONS
    |--------------------------------------------------------------------------
    */

    if (
      !this.requiresConfirmation
    ) {
      this.confirmedByAdmin =
        false;

      this.confirmationRequestedAt =
        null;

      this.confirmedAt =
        null;

      this.rejectedAt =
        null;

      this.expiredAt =
        null;
    }

    /*
    |--------------------------------------------------------------------------
    | REQUESTED CONFIRMATION
    |--------------------------------------------------------------------------
    */

    if (
      this.requiresConfirmation &&
      this.status ===
        "requested"
    ) {
      this.confirmedByAdmin =
        false;

      this.confirmedAt =
        null;

      this.rejectedAt =
        null;

      this.expiredAt =
        null;

      if (
        !this.confirmationRequestedAt
      ) {
        this.confirmationRequestedAt =
          new Date();
      }
    }

    /*
    |--------------------------------------------------------------------------
    | AUTHORIZED
    |--------------------------------------------------------------------------
    */

    if (
      this.status ===
      "authorized"
    ) {
      if (
        this.requiresConfirmation
      ) {
        this.confirmedByAdmin =
          true;

        if (
          !this.confirmedAt
        ) {
          this.confirmedAt =
            new Date();
        }
      }

      this.rejectedAt =
        null;

      this.expiredAt =
        null;
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETED
    |--------------------------------------------------------------------------
    */

    if (
      this.status ===
      "completed"
    ) {
      if (
        this.requiresConfirmation &&
        !this.confirmedByAdmin
      ) {
        /*
        |--------------------------------------------------------------------------
        | DEFENCE IN DEPTH
        |--------------------------------------------------------------------------
        |
        | A high/critical action must never appear completed without
        | server-confirmed admin approval.
        |
        |--------------------------------------------------------------------------
        */

        this.status =
          "failed";

        this.errorMessage =
          this.errorMessage ||
          "Consequential admin action cannot complete without server-authorized confirmation.";
      } else {
        if (
          !this.executedAt
        ) {
          this.executedAt =
            new Date();
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | REJECTED
    |--------------------------------------------------------------------------
    */

    if (
      this.status ===
      "rejected"
    ) {
      this.confirmedByAdmin =
        false;

      this.confirmedAt =
        null;

      this.expiredAt =
        null;

      if (
        !this.rejectedAt
      ) {
        this.rejectedAt =
          new Date();
      }
    }

    /*
    |--------------------------------------------------------------------------
    | EXPIRED
    |--------------------------------------------------------------------------
    */

    if (
      this.status ===
      "expired"
    ) {
      this.confirmedByAdmin =
        false;

      this.confirmedAt =
        null;

      this.rejectedAt =
        null;

      if (
        !this.expiredAt
      ) {
        this.expiredAt =
          new Date();
      }
    }

    /*
    |--------------------------------------------------------------------------
    | FAILED
    |--------------------------------------------------------------------------
    */

    if (
      this.status ===
      "failed" &&
      !this.executedAt &&
      this.roleAuthorized
    ) {
      this.executedAt =
        new Date();
    }

    /*
    |--------------------------------------------------------------------------
    | PERMISSION CHECK DATE
    |--------------------------------------------------------------------------
    */

    if (
      this.roleAuthorized &&
      !this.permissionCheckedAt
    ) {
      this.permissionCheckedAt =
        new Date();
    }
  }
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| ADMIN AUDIT HISTORY
|--------------------------------------------------------------------------
*/

AdminAIActionLogSchema.index(
  {
    adminId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_action_admin_created",
  }
);

/*
|--------------------------------------------------------------------------
| CONVERSATION AUDIT
|--------------------------------------------------------------------------
*/

AdminAIActionLogSchema.index(
  {
    conversationId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_action_conversation_created",
  }
);

/*
|--------------------------------------------------------------------------
| STATUS HISTORY
|--------------------------------------------------------------------------
*/

AdminAIActionLogSchema.index(
  {
    status:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_action_status_created",
  }
);

/*
|--------------------------------------------------------------------------
| ACTION HISTORY
|--------------------------------------------------------------------------
*/

AdminAIActionLogSchema.index(
  {
    action:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_action_type_created",
  }
);

/*
|--------------------------------------------------------------------------
| TOOL HISTORY
|--------------------------------------------------------------------------
*/

AdminAIActionLogSchema.index(
  {
    toolName:
      1,

    status:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_action_tool_status_created",
  }
);

/*
|--------------------------------------------------------------------------
| TARGET HISTORY
|--------------------------------------------------------------------------
*/

AdminAIActionLogSchema.index(
  {
    targetType:
      1,

    targetId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_action_target_created",
  }
);

/*
|--------------------------------------------------------------------------
| ROLE AUDIT
|--------------------------------------------------------------------------
*/

AdminAIActionLogSchema.index(
  {
    adminRole:
      1,

    action:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_action_role_action_created",
  }
);

/*
|--------------------------------------------------------------------------
| PENDING CONFIRMATION LOOKUP
|--------------------------------------------------------------------------
|
| This index is important for secure Admin AI confirmation flow.
|
|--------------------------------------------------------------------------
*/

AdminAIActionLogSchema.index(
  {
    adminId:
      1,

    conversationId:
      1,

    requiresConfirmation:
      1,

    status:
      1,

    confirmedByAdmin:
      1,

    toolName:
      1,

    confirmationRequestedAt:
      -1,
  },
  {
    name:
      "admin_ai_action_pending_confirmation",
  }
);

/*
|--------------------------------------------------------------------------
| REQUEST / IDEMPOTENCY LOOKUP
|--------------------------------------------------------------------------
|
| requestId will later help prevent duplicate sensitive actions.
|
|--------------------------------------------------------------------------
*/

AdminAIActionLogSchema.index(
  {
    adminId:
      1,

    requestId:
      1,
  },
  {
    name:
      "admin_ai_action_admin_request",
  }
);

/*
|--------------------------------------------------------------------------
| CRITICAL ACTION AUDIT
|--------------------------------------------------------------------------
*/

AdminAIActionLogSchema.index(
  {
    riskLevel:
      1,

    status:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "admin_ai_action_risk_status_created",
  }
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const AdminAIActionLog =
  (
    mongoose.models
      .AdminAIActionLog as
      Model<IAdminAIActionLog>
  ) ||
  mongoose.model<IAdminAIActionLog>(
    "AdminAIActionLog",
    AdminAIActionLogSchema
  );

export default AdminAIActionLog;