import type {
  AdminAIActionAdminRole,
  AdminAIActionCategory,
  AdminAIActionRiskLevel,
  AdminAIActionType,
} from "@/models/AdminAIActionLog";

/*
|--------------------------------------------------------------------------
| SILENTGEN ADMIN AI PERMISSIONS
|--------------------------------------------------------------------------
|
| Central authorization policy for Admin AI.
|
| IMPORTANT:
|
| This file answers:
|
| "Is this admin role allowed to request/execute this action?"
|
| It does NOT:
|
| - authenticate adminToken
| - confirm destructive actions
| - execute database mutations
|
| Those are separate security layers.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| ROLE
|--------------------------------------------------------------------------
*/

export type AdminRole =
  AdminAIActionAdminRole;

/*
|--------------------------------------------------------------------------
| PERMISSION RESULT
|--------------------------------------------------------------------------
*/

export type AdminPermissionResult = {
  allowed:
    boolean;

  role:
    AdminRole;

  action:
    AdminAIActionType;

  category:
    AdminAIActionCategory;

  riskLevel:
    AdminAIActionRiskLevel;

  requiresConfirmation:
    boolean;

  reason:
    string;
};

/*
|--------------------------------------------------------------------------
| ROLE CAPABILITY
|--------------------------------------------------------------------------
*/

export type AdminRoleCapability = {
  role:
    AdminRole;

  label:
    string;

  description:
    string;

  allowedActions:
    AdminAIActionType[];
};

/*
|--------------------------------------------------------------------------
| READ ACTIONS
|--------------------------------------------------------------------------
*/

const GENERAL_READ_ACTIONS:
  AdminAIActionType[] = [
    "view_business_intelligence",
    "view_dashboard_summary",
];

/*
|--------------------------------------------------------------------------
| PRODUCT READ
|--------------------------------------------------------------------------
*/

const PRODUCT_READ_ACTIONS:
  AdminAIActionType[] = [
    "view_product",
    "search_products",
];

/*
|--------------------------------------------------------------------------
| PRODUCT WRITE
|--------------------------------------------------------------------------
*/

const PRODUCT_WRITE_ACTIONS:
  AdminAIActionType[] = [
    "create_product_draft",
    "update_product",
    "update_product_status",
    "archive_product",
];

/*
|--------------------------------------------------------------------------
| PRODUCT DANGEROUS
|--------------------------------------------------------------------------
*/

const PRODUCT_DESTRUCTIVE_ACTIONS:
  AdminAIActionType[] = [
    "delete_product",
];

/*
|--------------------------------------------------------------------------
| INVENTORY
|--------------------------------------------------------------------------
*/

const INVENTORY_ACTIONS:
  AdminAIActionType[] = [
    "update_stock",
    "increase_stock",
    "decrease_stock",
    "update_low_stock_limit",
];

/*
|--------------------------------------------------------------------------
| PRICING
|--------------------------------------------------------------------------
*/

const PRICING_ACTIONS:
  AdminAIActionType[] = [
    "update_price",
    "update_mrp",
    "update_discount",
];

/*
|--------------------------------------------------------------------------
| ORDER READ
|--------------------------------------------------------------------------
*/

const ORDER_READ_ACTIONS:
  AdminAIActionType[] = [
    "view_order",
    "search_orders",
];

/*
|--------------------------------------------------------------------------
| ORDER WRITE
|--------------------------------------------------------------------------
*/

const ORDER_WRITE_ACTIONS:
  AdminAIActionType[] = [
    "update_order_status",
    "cancel_order",
    "approve_return",
    "reject_return",
    "approve_exchange",
    "reject_exchange",
];

/*
|--------------------------------------------------------------------------
| REFUND
|--------------------------------------------------------------------------
*/

const REFUND_ACTIONS:
  AdminAIActionType[] = [
    "initiate_refund",
    "mark_refund_processing",
    "mark_refund_completed",
];

/*
|--------------------------------------------------------------------------
| CUSTOMER
|--------------------------------------------------------------------------
*/

const CUSTOMER_READ_ACTIONS:
  AdminAIActionType[] = [
    "view_customer",
    "search_customers",
];

const CUSTOMER_WRITE_ACTIONS:
  AdminAIActionType[] = [
    "block_customer",
    "unblock_customer",
];

/*
|--------------------------------------------------------------------------
| COUPON
|--------------------------------------------------------------------------
*/

const COUPON_ACTIONS:
  AdminAIActionType[] = [
    "create_coupon",
    "update_coupon",
    "disable_coupon",
];

/*
|--------------------------------------------------------------------------
| REPORT
|--------------------------------------------------------------------------
*/

const REPORT_ACTIONS:
  AdminAIActionType[] = [
    "view_report",
    "generate_report",
    "export_report",
];

/*
|--------------------------------------------------------------------------
| SETTINGS
|--------------------------------------------------------------------------
*/

const SETTINGS_ACTIONS:
  AdminAIActionType[] = [
    "update_store_settings",
];

/*
|--------------------------------------------------------------------------
| ADMIN MANAGEMENT
|--------------------------------------------------------------------------
*/

const ADMIN_MANAGEMENT_ACTIONS:
  AdminAIActionType[] = [
    "create_admin",
    "update_admin_role",
    "disable_admin",
];

/*
|--------------------------------------------------------------------------
| ALL ACTIONS
|--------------------------------------------------------------------------
*/

const ALL_ACTIONS:
  AdminAIActionType[] = [
    ...GENERAL_READ_ACTIONS,

    ...PRODUCT_READ_ACTIONS,
    ...PRODUCT_WRITE_ACTIONS,
    ...PRODUCT_DESTRUCTIVE_ACTIONS,

    ...INVENTORY_ACTIONS,

    ...PRICING_ACTIONS,

    ...ORDER_READ_ACTIONS,
    ...ORDER_WRITE_ACTIONS,

    ...REFUND_ACTIONS,

    ...CUSTOMER_READ_ACTIONS,
    ...CUSTOMER_WRITE_ACTIONS,

    ...COUPON_ACTIONS,

    ...REPORT_ACTIONS,

    ...SETTINGS_ACTIONS,

    ...ADMIN_MANAGEMENT_ACTIONS,

    "other",
  ];

/*
|--------------------------------------------------------------------------
| UNIQUE ACTIONS
|--------------------------------------------------------------------------
*/

function uniqueActions(
  actions:
    AdminAIActionType[]
) {
  return Array.from(
    new Set(
      actions
    )
  );
}

/*
|--------------------------------------------------------------------------
| ROLE PERMISSIONS
|--------------------------------------------------------------------------
|
| These permissions are intentionally conservative.
|
|--------------------------------------------------------------------------
*/

const SUPER_ADMIN_ACTIONS =
  uniqueActions(
    ALL_ACTIONS
  );

/*
|--------------------------------------------------------------------------
| PRODUCT MANAGER
|--------------------------------------------------------------------------
|
| Product manager can:
|
| - inspect business/product intelligence
| - search/view products
| - create/edit/archive products
| - manage inventory
| - manage product pricing
| - view reports
|
| Cannot:
|
| - manage admins
| - block customers
| - execute refunds
| - update store settings
| - manage order lifecycle
|
|--------------------------------------------------------------------------
*/

const PRODUCT_MANAGER_ACTIONS =
  uniqueActions(
    [
      ...GENERAL_READ_ACTIONS,

      ...PRODUCT_READ_ACTIONS,
      ...PRODUCT_WRITE_ACTIONS,

      ...INVENTORY_ACTIONS,

      ...PRICING_ACTIONS,

      "view_report",
    ]
  );

/*
|--------------------------------------------------------------------------
| ORDER MANAGER
|--------------------------------------------------------------------------
|
| Order manager can:
|
| - inspect dashboard/business intelligence
| - inspect products for order context
| - view/search orders
| - update order lifecycle
| - approve/reject returns/exchanges
| - view customers for fulfilment/support context
|
| Cannot:
|
| - edit product inventory/pricing
| - refund money
| - block customers
| - manage admins/settings
|
|--------------------------------------------------------------------------
*/

const ORDER_MANAGER_ACTIONS =
  uniqueActions(
    [
      ...GENERAL_READ_ACTIONS,

      ...PRODUCT_READ_ACTIONS,

      ...ORDER_READ_ACTIONS,
      ...ORDER_WRITE_ACTIONS,

      ...CUSTOMER_READ_ACTIONS,

      "view_report",
    ]
  );

/*
|--------------------------------------------------------------------------
| SUPPORT ADMIN
|--------------------------------------------------------------------------
|
| Support admin is intentionally limited.
|
| Can:
|
| - search/view orders
| - search/view customers
| - support cancellation flow
| - review return/exchange related order information
|
| Cannot:
|
| - modify products
| - modify prices
| - modify stock
| - process refunds
| - manage admins/settings
|
|--------------------------------------------------------------------------
*/

const SUPPORT_ADMIN_ACTIONS =
  uniqueActions(
    [
      "view_dashboard_summary",

      ...PRODUCT_READ_ACTIONS,

      ...ORDER_READ_ACTIONS,

      "cancel_order",

      ...CUSTOMER_READ_ACTIONS,
    ]
  );

/*
|--------------------------------------------------------------------------
| FINANCE MANAGER
|--------------------------------------------------------------------------
|
| Finance manager can:
|
| - inspect business intelligence
| - read products/orders/customers
| - work with financial reports
| - manage coupons
| - review/update pricing
| - execute refund workflow
|
| Cannot:
|
| - delete/archive products
| - manage stock
| - block customers
| - manage admins
| - change general store settings
|
|--------------------------------------------------------------------------
*/

const FINANCE_MANAGER_ACTIONS =
  uniqueActions(
    [
      ...GENERAL_READ_ACTIONS,

      ...PRODUCT_READ_ACTIONS,

      ...PRICING_ACTIONS,

      ...ORDER_READ_ACTIONS,

      ...CUSTOMER_READ_ACTIONS,

      ...REFUND_ACTIONS,

      ...COUPON_ACTIONS,

      ...REPORT_ACTIONS,
    ]
  );

/*
|--------------------------------------------------------------------------
| ROLE MAP
|--------------------------------------------------------------------------
*/

const ROLE_ALLOWED_ACTIONS:
  Record<
    AdminRole,
    ReadonlySet<AdminAIActionType>
  > = {
  super_admin:
    new Set(
      SUPER_ADMIN_ACTIONS
    ),

  product_manager:
    new Set(
      PRODUCT_MANAGER_ACTIONS
    ),

  order_manager:
    new Set(
      ORDER_MANAGER_ACTIONS
    ),

  support_admin:
    new Set(
      SUPPORT_ADMIN_ACTIONS
    ),

  finance_manager:
    new Set(
      FINANCE_MANAGER_ACTIONS
    ),
};

/*
|--------------------------------------------------------------------------
| ROLE LABELS
|--------------------------------------------------------------------------
*/

const ROLE_LABELS:
  Record<
    AdminRole,
    string
  > = {
  super_admin:
    "Super Admin",

  product_manager:
    "Product Manager",

  order_manager:
    "Order Manager",

  support_admin:
    "Support Admin",

  finance_manager:
    "Finance Manager",
};

/*
|--------------------------------------------------------------------------
| ROLE DESCRIPTIONS
|--------------------------------------------------------------------------
*/

const ROLE_DESCRIPTIONS:
  Record<
    AdminRole,
    string
  > = {
  super_admin:
    "Full SilentGEN administrative access, subject to confirmation requirements for consequential actions.",

  product_manager:
    "Product catalog, inventory and product pricing management access.",

  order_manager:
    "Order fulfilment, cancellation, return and exchange management access.",

  support_admin:
    "Customer support and limited order-support access.",

  finance_manager:
    "Financial reporting, pricing, coupons and refund-management access.",
};

/*
|--------------------------------------------------------------------------
| VALID ROLE
|--------------------------------------------------------------------------
*/

export function isAdminRole(
  value:
    unknown
): value is AdminRole {
  return (
    value ===
      "super_admin" ||
    value ===
      "product_manager" ||
    value ===
      "order_manager" ||
    value ===
      "support_admin" ||
    value ===
      "finance_manager"
  );
}

/*
|--------------------------------------------------------------------------
| VALID ACTION
|--------------------------------------------------------------------------
*/

export function isAdminAIAction(
  value:
    unknown
): value is AdminAIActionType {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }

  return ALL_ACTIONS.includes(
    value as
      AdminAIActionType
  );
}

/*
|--------------------------------------------------------------------------
| ACTION CATEGORY
|--------------------------------------------------------------------------
*/

export function getAdminActionCategory(
  action:
    AdminAIActionType
):
  AdminAIActionCategory {
  if (
    GENERAL_READ_ACTIONS.includes(
      action
    )
  ) {
    return "analytics";
  }

  if (
    PRODUCT_READ_ACTIONS.includes(
      action
    ) ||
    PRODUCT_WRITE_ACTIONS.includes(
      action
    ) ||
    PRODUCT_DESTRUCTIVE_ACTIONS.includes(
      action
    )
  ) {
    return "product";
  }

  if (
    INVENTORY_ACTIONS.includes(
      action
    )
  ) {
    return "inventory";
  }

  if (
    PRICING_ACTIONS.includes(
      action
    )
  ) {
    return "pricing";
  }

  if (
    ORDER_READ_ACTIONS.includes(
      action
    ) ||
    ORDER_WRITE_ACTIONS.includes(
      action
    )
  ) {
    return "order";
  }

  if (
    REFUND_ACTIONS.includes(
      action
    )
  ) {
    return "refund";
  }

  if (
    CUSTOMER_READ_ACTIONS.includes(
      action
    ) ||
    CUSTOMER_WRITE_ACTIONS.includes(
      action
    )
  ) {
    return "customer";
  }

  if (
    COUPON_ACTIONS.includes(
      action
    )
  ) {
    return "coupon";
  }

  if (
    REPORT_ACTIONS.includes(
      action
    )
  ) {
    return "report";
  }

  if (
    SETTINGS_ACTIONS.includes(
      action
    )
  ) {
    return "settings";
  }

  if (
    ADMIN_MANAGEMENT_ACTIONS.includes(
      action
    )
  ) {
    return "admin_management";
  }

  return "other";
}

/*
|--------------------------------------------------------------------------
| ACTION RISK
|--------------------------------------------------------------------------
|
| Canonical server-defined risk.
|
| Never trust model supplied risk.
|
|--------------------------------------------------------------------------
*/

export function getAdminActionRiskLevel(
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
      ...GENERAL_READ_ACTIONS,
      ...PRODUCT_READ_ACTIONS,
      ...ORDER_READ_ACTIONS,
      ...CUSTOMER_READ_ACTIONS,
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
      "archive_product",

      "update_stock",
      "increase_stock",
      "decrease_stock",

      "update_price",
      "update_mrp",
      "update_discount",

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
| CONFIRMATION REQUIRED
|--------------------------------------------------------------------------
|
| High and critical actions require explicit confirmation.
|
| Medium actions are role protected but can execute without the destructive
| confirmation flow unless a specific tool later chooses stricter handling.
|
|--------------------------------------------------------------------------
*/

export function adminActionRequiresConfirmation(
  action:
    AdminAIActionType
) {
  const risk =
    getAdminActionRiskLevel(
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
| ROLE CAN PERFORM ACTION
|--------------------------------------------------------------------------
*/

export function canAdminRolePerformAction(
  role:
    AdminRole,
  action:
    AdminAIActionType
) {
  const permissions =
    ROLE_ALLOWED_ACTIONS[
      role
    ];

  if (
    !permissions
  ) {
    return false;
  }

  return permissions.has(
    action
  );
}

/*
|--------------------------------------------------------------------------
| CHECK PERMISSION
|--------------------------------------------------------------------------
*/

export function checkAdminPermission(
  role:
    unknown,
  action:
    unknown
):
  AdminPermissionResult {
  /*
  |--------------------------------------------------------------------------
  | INVALID ROLE
  |--------------------------------------------------------------------------
  */

  if (
    !isAdminRole(
      role
    )
  ) {
    return {
      allowed:
        false,

      role:
        "support_admin",

      action:
        "other",

      category:
        "other",

      riskLevel:
        "medium",

      requiresConfirmation:
        false,

      reason:
        "Invalid or unsupported admin role.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | INVALID ACTION
  |--------------------------------------------------------------------------
  */

  if (
    !isAdminAIAction(
      action
    )
  ) {
    return {
      allowed:
        false,

      role,

      action:
        "other",

      category:
        "other",

      riskLevel:
        "medium",

      requiresConfirmation:
        false,

      reason:
        "Invalid or unsupported Admin AI action.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | PERMISSION
  |--------------------------------------------------------------------------
  */

  const allowed =
    canAdminRolePerformAction(
      role,
      action
    );

  const category =
    getAdminActionCategory(
      action
    );

  const riskLevel =
    getAdminActionRiskLevel(
      action
    );

  const requiresConfirmation =
    adminActionRequiresConfirmation(
      action
    );

  return {
    allowed,

    role,

    action,

    category,

    riskLevel,

    requiresConfirmation,

    reason:
      allowed
        ? `${ROLE_LABELS[role]} is authorized for this action.`
        : `${ROLE_LABELS[role]} is not authorized for this action.`,
  };
}

/*
|--------------------------------------------------------------------------
| ASSERT PERMISSION
|--------------------------------------------------------------------------
|
| Useful inside execution tools.
|
| Throws if role is not permitted.
|
|--------------------------------------------------------------------------
*/

export function assertAdminPermission(
  role:
    unknown,
  action:
    unknown
) {
  const result =
    checkAdminPermission(
      role,
      action
    );

  if (
    !result.allowed
  ) {
    throw new Error(
      result.reason
    );
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| GET ROLE CAPABILITY
|--------------------------------------------------------------------------
*/

export function getAdminRoleCapability(
  role:
    AdminRole
):
  AdminRoleCapability {
  return {
    role,

    label:
      ROLE_LABELS[
        role
      ],

    description:
      ROLE_DESCRIPTIONS[
        role
      ],

    allowedActions:
      Array.from(
        ROLE_ALLOWED_ACTIONS[
          role
        ]
      ),
  };
}

/*
|--------------------------------------------------------------------------
| GET ALL ROLE CAPABILITIES
|--------------------------------------------------------------------------
*/

export function getAllAdminRoleCapabilities():
  AdminRoleCapability[] {
  return [
    "super_admin",
    "product_manager",
    "order_manager",
    "support_admin",
    "finance_manager",
  ].map(
    (
      role
    ) =>
      getAdminRoleCapability(
        role as
          AdminRole
      )
  );
}

/*
|--------------------------------------------------------------------------
| GET ALLOWED ACTIONS
|--------------------------------------------------------------------------
*/

export function getAllowedAdminActions(
  role:
    unknown
):
  AdminAIActionType[] {
  if (
    !isAdminRole(
      role
    )
  ) {
    return [];
  }

  return Array.from(
    ROLE_ALLOWED_ACTIONS[
      role
    ]
  );
}

/*
|--------------------------------------------------------------------------
| GET DENIED ACTIONS
|--------------------------------------------------------------------------
*/

export function getDeniedAdminActions(
  role:
    unknown
):
  AdminAIActionType[] {
  if (
    !isAdminRole(
      role
    )
  ) {
    return [
      ...ALL_ACTIONS,
    ];
  }

  const allowed =
    ROLE_ALLOWED_ACTIONS[
      role
    ];

  return ALL_ACTIONS.filter(
    (
      action
    ) =>
      !allowed.has(
        action
      )
  );
}

/*
|--------------------------------------------------------------------------
| CAN ACCESS PRODUCT MANAGEMENT
|--------------------------------------------------------------------------
*/

export function canManageProducts(
  role:
    unknown
) {
  return (
    role ===
      "super_admin" ||
    role ===
      "product_manager"
  );
}

/*
|--------------------------------------------------------------------------
| CAN ACCESS INVENTORY
|--------------------------------------------------------------------------
*/

export function canManageInventory(
  role:
    unknown
) {
  return (
    role ===
      "super_admin" ||
    role ===
      "product_manager"
  );
}

/*
|--------------------------------------------------------------------------
| CAN ACCESS PRICING
|--------------------------------------------------------------------------
*/

export function canManagePricing(
  role:
    unknown
) {
  return (
    role ===
      "super_admin" ||
    role ===
      "product_manager" ||
    role ===
      "finance_manager"
  );
}

/*
|--------------------------------------------------------------------------
| CAN ACCESS ORDERS
|--------------------------------------------------------------------------
*/

export function canReadOrders(
  role:
    unknown
) {
  return (
    role ===
      "super_admin" ||
    role ===
      "order_manager" ||
    role ===
      "support_admin" ||
    role ===
      "finance_manager"
  );
}

/*
|--------------------------------------------------------------------------
| CAN MANAGE ORDERS
|--------------------------------------------------------------------------
*/

export function canManageOrders(
  role:
    unknown
) {
  return (
    role ===
      "super_admin" ||
    role ===
      "order_manager"
  );
}

/*
|--------------------------------------------------------------------------
| CAN READ CUSTOMERS
|--------------------------------------------------------------------------
*/

export function canReadCustomers(
  role:
    unknown
) {
  return (
    role ===
      "super_admin" ||
    role ===
      "order_manager" ||
    role ===
      "support_admin" ||
    role ===
      "finance_manager"
  );
}

/*
|--------------------------------------------------------------------------
| CAN MANAGE CUSTOMERS
|--------------------------------------------------------------------------
*/

export function canManageCustomers(
  role:
    unknown
) {
  return (
    role ===
    "super_admin"
  );
}

/*
|--------------------------------------------------------------------------
| CAN MANAGE REFUNDS
|--------------------------------------------------------------------------
*/

export function canManageRefunds(
  role:
    unknown
) {
  return (
    role ===
      "super_admin" ||
    role ===
      "finance_manager"
  );
}

/*
|--------------------------------------------------------------------------
| CAN MANAGE COUPONS
|--------------------------------------------------------------------------
*/

export function canManageCoupons(
  role:
    unknown
) {
  return (
    role ===
      "super_admin" ||
    role ===
      "finance_manager"
  );
}

/*
|--------------------------------------------------------------------------
| CAN ACCESS REPORTS
|--------------------------------------------------------------------------
*/

export function canAccessReports(
  role:
    unknown
) {
  return (
    role ===
      "super_admin" ||
    role ===
      "product_manager" ||
    role ===
      "order_manager" ||
    role ===
      "finance_manager"
  );
}

/*
|--------------------------------------------------------------------------
| CAN MANAGE SETTINGS
|--------------------------------------------------------------------------
*/

export function canManageStoreSettings(
  role:
    unknown
) {
  return (
    role ===
    "super_admin"
  );
}

/*
|--------------------------------------------------------------------------
| CAN MANAGE ADMINS
|--------------------------------------------------------------------------
*/

export function canManageAdmins(
  role:
    unknown
) {
  return (
    role ===
    "super_admin"
  );
}

/*
|--------------------------------------------------------------------------
| TOOL ACCESS HELPER
|--------------------------------------------------------------------------
|
| Tool definition can map itself to one or more actions.
|
|--------------------------------------------------------------------------
*/

export function canAdminUseTool(
  role:
    unknown,
  actions:
    AdminAIActionType[]
) {
  if (
    !isAdminRole(
      role
    )
  ) {
    return false;
  }

  if (
    actions.length ===
    0
  ) {
    return false;
  }

  return actions.every(
    (
      action
    ) =>
      canAdminRolePerformAction(
        role,
        action
      )
  );
}

/*
|--------------------------------------------------------------------------
| ANY TOOL ACCESS
|--------------------------------------------------------------------------
*/

export function canAdminUseAnyToolAction(
  role:
    unknown,
  actions:
    AdminAIActionType[]
) {
  if (
    !isAdminRole(
      role
    )
  ) {
    return false;
  }

  return actions.some(
    (
      action
    ) =>
      canAdminRolePerformAction(
        role,
        action
      )
  );
}

/*
|--------------------------------------------------------------------------
| READ-ONLY ACTION
|--------------------------------------------------------------------------
*/

export function isAdminReadOnlyAction(
  action:
    AdminAIActionType
) {
  return (
    getAdminActionRiskLevel(
      action
    ) ===
    "read"
  );
}

/*
|--------------------------------------------------------------------------
| MUTATION ACTION
|--------------------------------------------------------------------------
*/

export function isAdminMutationAction(
  action:
    AdminAIActionType
) {
  return (
    !isAdminReadOnlyAction(
      action
    )
  );
}

/*
|--------------------------------------------------------------------------
| HIGH-RISK ACTION
|--------------------------------------------------------------------------
*/

export function isHighRiskAdminAction(
  action:
    AdminAIActionType
) {
  const risk =
    getAdminActionRiskLevel(
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
| CRITICAL ACTION
|--------------------------------------------------------------------------
*/

export function isCriticalAdminAction(
  action:
    AdminAIActionType
) {
  return (
    getAdminActionRiskLevel(
      action
    ) ===
    "critical"
  );
}

/*
|--------------------------------------------------------------------------
| ADMIN AI PERMISSION SUMMARY
|--------------------------------------------------------------------------
|
| Can be safely given to the Admin AI system prompt so the model knows
| what the currently authenticated admin can request.
|
| Server still performs the real permission check.
|
|--------------------------------------------------------------------------
*/

export function getAdminAIPermissionSummary(
  role:
    unknown
) {
  if (
    !isAdminRole(
      role
    )
  ) {
    return {
      validRole:
        false,

      role:
        null,

      label:
        "Unknown Admin",

      description:
        "No Admin AI permissions available.",

      allowedActions:
        [],

      confirmationRequiredActions:
        [],
    };
  }

  const allowedActions =
    getAllowedAdminActions(
      role
    );

  const confirmationRequiredActions =
    allowedActions.filter(
      adminActionRequiresConfirmation
    );

  return {
    validRole:
      true,

    role,

    label:
      ROLE_LABELS[
        role
      ],

    description:
      ROLE_DESCRIPTIONS[
        role
      ],

    allowedActions,

    confirmationRequiredActions,
  };
}