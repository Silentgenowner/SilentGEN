import type {
  AdminAIActionType,
} from "@/models/AdminAIActionLog";

import {
  adminActionRequiresConfirmation,
  getAdminActionRiskLevel,
  type AdminRole,
} from "@/lib/admin-ai/adminPermissions";

/*
|--------------------------------------------------------------------------
| SILENTGEN ADMIN AI TOOL DEFINITIONS
|--------------------------------------------------------------------------
|
| Strict tool schema definitions for Admin AI.
|
| IMPORTANT:
|
| - additionalProperties is always false.
| - The AI model never decides permissions.
| - Server checks role using adminPermissions.ts.
| - Consequential actions require server-side confirmation.
| - Read tools and write tools stay clearly separated.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| JSON SCHEMA TYPES
|--------------------------------------------------------------------------
*/

type JSONSchemaProperty =
  | {
      type:
        "string";

      description?:
        string;

      enum?:
        string[];

      minLength?:
        number;

      maxLength?:
        number;

      pattern?:
        string;
    }
  | {
      type:
        "number";

      description?:
        string;

      minimum?:
        number;

      maximum?:
        number;
    }
  | {
      type:
        "integer";

      description?:
        string;

      minimum?:
        number;

      maximum?:
        number;
    }
  | {
      type:
        "boolean";

      description?:
        string;
    }
  | {
      type:
        "array";

      description?:
        string;

      items:
        JSONSchemaProperty;

      minItems?:
        number;

      maxItems?:
        number;
    }
  | {
      type:
        "object";

      description?:
        string;

      properties:
        Record<
          string,
          JSONSchemaProperty
        >;

      required?:
        string[];

      additionalProperties:
        false;
    };

export type AdminAIToolParameters = {
  type:
    "object";

  properties:
    Record<
      string,
      JSONSchemaProperty
    >;

  required:
    string[];

  additionalProperties:
    false;
};

export type AdminAIToolDefinition = {
  type:
    "function";

  function: {
    name:
      AdminAIToolName;

    description:
      string;

    parameters:
      AdminAIToolParameters;

    strict:
      true;
  };
};

/*
|--------------------------------------------------------------------------
| TOOL NAMES
|--------------------------------------------------------------------------
*/

export type AdminAIToolName =
  /*
  |--------------------------------------------------------------------------
  | BUSINESS INTELLIGENCE
  |--------------------------------------------------------------------------
  */

  | "get_business_intelligence"
  | "get_dashboard_summary"
  | "get_demand_trends"
  | "get_restock_recommendations"
  | "get_conversion_opportunities"

  /*
  |--------------------------------------------------------------------------
  | PRODUCTS
  |--------------------------------------------------------------------------
  */

  | "search_admin_products"
  | "get_admin_product"
  | "create_product_draft"
  | "update_product"
  | "update_product_status"
  | "update_product_stock"
  | "update_product_price"

  /*
  |--------------------------------------------------------------------------
  | ORDERS
  |--------------------------------------------------------------------------
  */

  | "search_admin_orders"
  | "get_admin_order"
  | "update_admin_order_status"
  | "cancel_admin_order"
  | "approve_admin_return"
  | "reject_admin_return"
  | "approve_admin_exchange"
  | "reject_admin_exchange"

  /*
  |--------------------------------------------------------------------------
  | CUSTOMERS
  |--------------------------------------------------------------------------
  */

  | "search_admin_customers"
  | "get_admin_customer"

  /*
  |--------------------------------------------------------------------------
  | REPORTS
  |--------------------------------------------------------------------------
  */

  | "get_sales_report";

/*
|--------------------------------------------------------------------------
| TOOL → ACTION MAP
|--------------------------------------------------------------------------
*/

export const ADMIN_TOOL_ACTION_MAP:
  Record<
    AdminAIToolName,
    AdminAIActionType
  > = {
  /*
  |--------------------------------------------------------------------------
  | BUSINESS
  |--------------------------------------------------------------------------
  */

  get_business_intelligence:
    "view_business_intelligence",

  get_dashboard_summary:
    "view_dashboard_summary",

  get_demand_trends:
    "view_business_intelligence",

  get_restock_recommendations:
    "view_business_intelligence",

  get_conversion_opportunities:
    "view_business_intelligence",

  /*
  |--------------------------------------------------------------------------
  | PRODUCTS
  |--------------------------------------------------------------------------
  */

  search_admin_products:
    "search_products",

  get_admin_product:
    "view_product",

  create_product_draft:
    "create_product_draft",

  update_product:
    "update_product",

  update_product_status:
    "update_product_status",

  update_product_stock:
    "update_stock",

  update_product_price:
    "update_price",

  /*
  |--------------------------------------------------------------------------
  | ORDERS
  |--------------------------------------------------------------------------
  */

  search_admin_orders:
    "search_orders",

  get_admin_order:
    "view_order",

  update_admin_order_status:
    "update_order_status",

  cancel_admin_order:
    "cancel_order",

  approve_admin_return:
    "approve_return",

  reject_admin_return:
    "reject_return",

  approve_admin_exchange:
    "approve_exchange",

  reject_admin_exchange:
    "reject_exchange",

  /*
  |--------------------------------------------------------------------------
  | CUSTOMERS
  |--------------------------------------------------------------------------
  */

  search_admin_customers:
    "search_customers",

  get_admin_customer:
    "view_customer",

  /*
  |--------------------------------------------------------------------------
  | REPORTS
  |--------------------------------------------------------------------------
  */

  get_sales_report:
    "view_report",
};

/*
|--------------------------------------------------------------------------
| BUSINESS PERIOD
|--------------------------------------------------------------------------
*/

const BUSINESS_PERIOD_PROPERTY:
  JSONSchemaProperty = {
  type:
    "string",

  description:
    "Select daily, weekly or monthly for the requested analysis. If unspecified, use the current admin context default period. These labels do not guarantee calendar-aligned boundaries; use returned period metadata. For an explicit sales date range, use get_sales_report.",

  enum: [
    "daily",
    "weekly",
    "monthly",
  ],
};

/*
|--------------------------------------------------------------------------
| PRODUCT ID
|--------------------------------------------------------------------------
*/

const PRODUCT_ID_PROPERTY:
  JSONSchemaProperty = {
  type:
    "string",

  description:
    "MongoDB product _id.",

  minLength:
    24,

  maxLength:
    24,

  pattern:
    "^[a-fA-F0-9]{24}$",
};

/*
|--------------------------------------------------------------------------
| ORDER ID
|--------------------------------------------------------------------------
*/

const ORDER_ID_PROPERTY:
  JSONSchemaProperty = {
  type:
    "string",

  description:
    "MongoDB order _id.",

  minLength:
    24,

  maxLength:
    24,

  pattern:
    "^[a-fA-F0-9]{24}$",
};

/*
|--------------------------------------------------------------------------
| CUSTOMER ID
|--------------------------------------------------------------------------
*/

const CUSTOMER_ID_PROPERTY:
  JSONSchemaProperty = {
  type:
    "string",

  description:
    "MongoDB customer _id.",

  minLength:
    24,

  maxLength:
    24,

  pattern:
    "^[a-fA-F0-9]{24}$",
};

/*
|--------------------------------------------------------------------------
| TOOL DEFINITIONS
|--------------------------------------------------------------------------
*/

export const ADMIN_AI_TOOL_DEFINITIONS:
  AdminAIToolDefinition[] = [
  /*
  |--------------------------------------------------------------------------
  | BUSINESS INTELLIGENCE
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "get_business_intelligence",

      description:
        "Get detailed SilentGEN business intelligence for performance analysis and growth recommendations. Includes order-backed summary metrics: ordersPlaced (also exposed as summary.purchases), unitsPurchased, revenue, grossOrderValue, paidRevenue, averageOrderValue, cancellations, cancelledOrderValue, returns and exchanges; plus demand, conversion signals, inventory risk, trends, categories, colors and sizes. Check dataSources.orders and dataSources.customerBehaviour independently: unavailable-source fallback zeros are not measured zero activity. Revenue excludes currently Cancelled or Refunded orders; grossOrderValue is before these exclusions; paidRevenue additionally requires current Paid status. These are not profit or settlement totals. Product-level demand purchases are not summary order counts. Respect generatedAt and staleData when interpreting demand snapshots.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          period:
            BUSINESS_PERIOD_PROPERTY,
        },

        required: [
          "period",
        ],

        additionalProperties:
          false,
      },
    },
  },

  {
    type:
      "function",

    function: {
      name:
        "get_dashboard_summary",

      description:
        "Get a compact SilentGEN dashboard overview for the selected period, including order-backed summary metrics (ordersPlaced, purchases alias, unitsPurchased, revenue, grossOrderValue, paidRevenue, averageOrderValue, cancellations, cancelledOrderValue, returns and exchanges), sales trends and prioritized demand/inventory recommendations. Prefer this for a quick overview; use get_business_intelligence for detailed analysis. Check dataSources for each source and do not report unavailable-source fallback zeros as facts. Keep revenue, gross order value and paid revenue distinct, and disclose stale demand snapshots when indicated.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          period:
            BUSINESS_PERIOD_PROPERTY,
        },

        required: [
          "period",
        ],

        additionalProperties:
          false,
      },
    },
  },

  {
    type:
      "function",

    function: {
      name:
        "get_demand_trends",

      description:
        "Compare current and previous demand periods and return rising, falling and newly-demanded products.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          period:
            BUSINESS_PERIOD_PROPERTY,
        },

        required: [
          "period",
        ],

        additionalProperties:
          false,
      },
    },
  },

  {
    type:
      "function",

    function: {
      name:
        "get_restock_recommendations",

      description:
        "Return high-demand products that currently need inventory review or restocking.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          period:
            BUSINESS_PERIOD_PROPERTY,

          limit: {
            type:
              "integer",

            description:
              "Maximum number of recommendations.",

            minimum:
              1,

            maximum:
              50,
          },
        },

        required: [
          "period",
          "limit",
        ],

        additionalProperties:
          false,
      },
    },
  },

  {
    type:
      "function",

    function: {
      name:
        "get_conversion_opportunities",

      description:
        "Find products with strong customer interest but weak purchase conversion.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          period:
            BUSINESS_PERIOD_PROPERTY,

          limit: {
            type:
              "integer",

            minimum:
              1,

            maximum:
              50,

            description:
              "Maximum number of conversion opportunities.",
          },
        },

        required: [
          "period",
          "limit",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | SEARCH PRODUCTS
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "search_admin_products",

      description:
        "Search SilentGEN products using current live product database information.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          search: {
            type:
              "string",

            description:
              "Product name, SKU, brand, category, subcategory or search text.",

            maxLength:
              200,
          },

          category: {
            type:
              "string",

            maxLength:
              100,
          },

          status: {
            type:
              "string",

            enum: [
              "",
              "Active",
              "Draft",
              "Out of Stock",
              "Archived",
            ],
          },

          lowStockOnly: {
            type:
              "boolean",

            description:
              "Return only products at or below their low-stock threshold.",
          },

          limit: {
            type:
              "integer",

            minimum:
              1,

            maximum:
              50,
          },
        },

        required: [
          "search",
          "category",
          "status",
          "lowStockOnly",
          "limit",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | GET PRODUCT
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "get_admin_product",

      description:
        "Get complete live admin-visible information for one SilentGEN product.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          productId:
            PRODUCT_ID_PROPERTY,
        },

        required: [
          "productId",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE PRODUCT DRAFT
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "create_product_draft",

      description:
        "Create a new SilentGEN product in Draft status. Do not publish the product automatically.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          sku: {
            type:
              "string",

            minLength:
              1,

            maxLength:
              100,
          },

          name: {
            type:
              "string",

            minLength:
              1,

            maxLength:
              200,
          },

          category: {
            type:
              "string",

            minLength:
              1,

            maxLength:
              100,
          },

          subCategory: {
            type:
              "string",

            maxLength:
              100,
          },

          brand: {
            type:
              "string",

            maxLength:
              100,
          },

          gender: {
            type:
              "string",

            enum: [
              "Men",
              "Women",
              "Kids",
              "Unisex",
            ],
          },

          mrp: {
            type:
              "number",

            minimum:
              0,
          },

          price: {
            type:
              "number",

            minimum:
              0,
          },

          stock: {
            type:
              "integer",

            minimum:
              0,
          },

          sizes: {
            type:
              "array",

            maxItems:
              30,

            items: {
              type:
                "string",

              maxLength:
                50,
            },
          },

          colors: {
            type:
              "array",

            maxItems:
              30,

            items: {
              type:
                "string",

              maxLength:
                80,
            },
          },

          shortDescription: {
            type:
              "string",

            maxLength:
              1000,
          },
        },

        required: [
          "sku",
          "name",
          "category",
          "subCategory",
          "brand",
          "gender",
          "mrp",
          "price",
          "stock",
          "sizes",
          "colors",
          "shortDescription",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE PRODUCT
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "update_product",

      description:
        "Update non-price and non-stock product information. Use dedicated stock and price tools for inventory or pricing changes.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          productId:
            PRODUCT_ID_PROPERTY,

          name: {
            type:
              "string",

            maxLength:
              200,
          },

          category: {
            type:
              "string",

            maxLength:
              100,
          },

          subCategory: {
            type:
              "string",

            maxLength:
              100,
          },

          brand: {
            type:
              "string",

            maxLength:
              100,
          },

          gender: {
            type:
              "string",

            enum: [
              "",
              "Men",
              "Women",
              "Kids",
              "Unisex",
            ],
          },

          fabric: {
            type:
              "string",

            maxLength:
              100,
          },

          fit: {
            type:
              "string",

            maxLength:
              100,
          },

          shortDescription: {
            type:
              "string",

            maxLength:
              1500,
          },

          description: {
            type:
              "string",

            maxLength:
              10000,
          },

          sizes: {
            type:
              "array",

            maxItems:
              30,

            items: {
              type:
                "string",

              maxLength:
                50,
            },
          },

          colors: {
            type:
              "array",

            maxItems:
              30,

            items: {
              type:
                "string",

              maxLength:
                80,
            },
          },
        },

        required: [
          "productId",
          "name",
          "category",
          "subCategory",
          "brand",
          "gender",
          "fabric",
          "fit",
          "shortDescription",
          "description",
          "sizes",
          "colors",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE PRODUCT STATUS
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "update_product_status",

      description:
        "Change the status of one SilentGEN product.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          productId:
            PRODUCT_ID_PROPERTY,

          status: {
            type:
              "string",

            enum: [
              "Active",
              "Draft",
              "Out of Stock",
              "Archived",
            ],
          },
        },

        required: [
          "productId",
          "status",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE STOCK
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "update_product_stock",

      description:
        "Set a product's total stock to an exact new value. This is consequential and requires explicit server-side confirmation.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          productId:
            PRODUCT_ID_PROPERTY,

          stock: {
            type:
              "integer",

            minimum:
              0,

            maximum:
              1_000_000,
          },
        },

        required: [
          "productId",
          "stock",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE PRICE
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "update_product_price",

      description:
        "Set product price and MRP. This is consequential and requires explicit server-side confirmation.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          productId:
            PRODUCT_ID_PROPERTY,

          price: {
            type:
              "number",

            minimum:
              0,

            maximum:
              100_000_000,
          },

          mrp: {
            type:
              "number",

            minimum:
              0,

            maximum:
              100_000_000,
          },
        },

        required: [
          "productId",
          "price",
          "mrp",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | SEARCH ORDERS
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "search_admin_orders",

      description:
        "Search SilentGEN orders using live order data.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          search: {
            type:
              "string",

            maxLength:
              200,

            description:
              "Order id, tracking number, customer reference or search text.",
          },

          status: {
            type:
              "string",

            enum: [
              "",
              "Placed",
              "Confirmed",
              "Packed",
              "Shipped",
              "Out For Delivery",
              "Delivered",
              "Cancelled",
              "Return Requested",
              "Returned",
              "Exchange Requested",
              "Refunded",
            ],
          },

          limit: {
            type:
              "integer",

            minimum:
              1,

            maximum:
              50,
          },
        },

        required: [
          "search",
          "status",
          "limit",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | GET ORDER
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "get_admin_order",

      description:
        "Get complete current information for one SilentGEN order.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          orderId:
            ORDER_ID_PROPERTY,
        },

        required: [
          "orderId",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE ORDER STATUS
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "update_admin_order_status",

      description:
        "Update an order lifecycle status. The server must validate legal status transitions.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          orderId:
            ORDER_ID_PROPERTY,

          status: {
            type:
              "string",

            enum: [
              "Placed",
              "Confirmed",
              "Packed",
              "Shipped",
              "Out For Delivery",
              "Delivered",
              "Cancelled",
              "Return Requested",
              "Returned",
              "Exchange Requested",
              "Refunded",
            ],
          },
        },

        required: [
          "orderId",
          "status",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | CANCEL ORDER
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "cancel_admin_order",

      description:
        "Cancel an order for a specific admin-provided reason. Requires explicit server-side confirmation.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          orderId:
            ORDER_ID_PROPERTY,

          reason: {
            type:
              "string",

            minLength:
              2,

            maxLength:
              1000,
          },
        },

        required: [
          "orderId",
          "reason",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | RETURN APPROVAL
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "approve_admin_return",

      description:
        "Approve an existing return request. Requires explicit server-side confirmation.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          orderId:
            ORDER_ID_PROPERTY,

          note: {
            type:
              "string",

            maxLength:
              1000,
          },
        },

        required: [
          "orderId",
          "note",
        ],

        additionalProperties:
          false,
      },
    },
  },

  {
    type:
      "function",

    function: {
      name:
        "reject_admin_return",

      description:
        "Reject an existing return request with an admin-provided reason. Requires explicit server-side confirmation.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          orderId:
            ORDER_ID_PROPERTY,

          reason: {
            type:
              "string",

            minLength:
              2,

            maxLength:
              1000,
          },
        },

        required: [
          "orderId",
          "reason",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | EXCHANGE APPROVAL
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "approve_admin_exchange",

      description:
        "Approve an existing exchange request. Requires explicit server-side confirmation.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          orderId:
            ORDER_ID_PROPERTY,

          note: {
            type:
              "string",

            maxLength:
              1000,
          },
        },

        required: [
          "orderId",
          "note",
        ],

        additionalProperties:
          false,
      },
    },
  },

  {
    type:
      "function",

    function: {
      name:
        "reject_admin_exchange",

      description:
        "Reject an existing exchange request with an admin-provided reason. Requires explicit server-side confirmation.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          orderId:
            ORDER_ID_PROPERTY,

          reason: {
            type:
              "string",

            minLength:
              2,

            maxLength:
              1000,
          },
        },

        required: [
          "orderId",
          "reason",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | CUSTOMERS
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "search_admin_customers",

      description:
        "Search customers by allowed admin-visible identifiers such as name, email or mobile. Do not expose unnecessary private customer data.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          search: {
            type:
              "string",

            minLength:
              1,

            maxLength:
              200,
          },

          limit: {
            type:
              "integer",

            minimum:
              1,

            maximum:
              50,
          },
        },

        required: [
          "search",
          "limit",
        ],

        additionalProperties:
          false,
      },
    },
  },

  {
    type:
      "function",

    function: {
      name:
        "get_admin_customer",

      description:
        "Get limited admin-visible account information for one customer. Do not return secrets, authentication tokens or unnecessary sensitive profile information.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          customerId:
            CUSTOMER_ID_PROPERTY,
        },

        required: [
          "customerId",
        ],

        additionalProperties:
          false,
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | SALES REPORT
  |--------------------------------------------------------------------------
  */

  {
    type:
      "function",

    function: {
      name:
        "get_sales_report",

      description:
        "Get a sales report for an explicit date range using live order data. Prefer this when the admin specifies dates rather than a daily, weekly or monthly business-intelligence period. Supply fromDate and toDate in YYYY-MM-DD format. Interpret totals according to this report payload; do not assume its revenue definition or returned fields match the business-intelligence summary.",

      strict:
        true,

      parameters: {
        type:
          "object",

        properties: {
          fromDate: {
            type:
              "string",

            description:
              "Start date in YYYY-MM-DD format.",

            pattern:
              "^\\d{4}-\\d{2}-\\d{2}$",

            minLength:
              10,

            maxLength:
              10,
          },

          toDate: {
            type:
              "string",

            description:
              "End date in YYYY-MM-DD format.",

            pattern:
              "^\\d{4}-\\d{2}-\\d{2}$",

            minLength:
              10,

            maxLength:
              10,
          },
        },

        required: [
          "fromDate",
          "toDate",
        ],

        additionalProperties:
          false,
      },
    },
  },
];

/*
|--------------------------------------------------------------------------
| GET TOOL ACTION
|--------------------------------------------------------------------------
*/

export function getAdminToolAction(
  toolName:
    unknown
):
  AdminAIActionType | null {
  if (
    typeof toolName !==
    "string"
  ) {
    return null;
  }

  return (
    ADMIN_TOOL_ACTION_MAP[
      toolName as
        AdminAIToolName
    ] ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| VALID TOOL NAME
|--------------------------------------------------------------------------
*/

export function isAdminAIToolName(
  value:
    unknown
): value is AdminAIToolName {
  return (
    typeof value ===
      "string" &&
    Object.prototype.hasOwnProperty.call(
      ADMIN_TOOL_ACTION_MAP,
      value
    )
  );
}

/*
|--------------------------------------------------------------------------
| TOOL REQUIRES CONFIRMATION
|--------------------------------------------------------------------------
*/

export function adminToolRequiresConfirmation(
  toolName:
    AdminAIToolName
) {
  const action =
    ADMIN_TOOL_ACTION_MAP[
      toolName
    ];

  return adminActionRequiresConfirmation(
    action
  );
}

/*
|--------------------------------------------------------------------------
| TOOL RISK
|--------------------------------------------------------------------------
*/

export function getAdminToolRiskLevel(
  toolName:
    AdminAIToolName
) {
  return getAdminActionRiskLevel(
    ADMIN_TOOL_ACTION_MAP[
      toolName
    ]
  );
}

/*
|--------------------------------------------------------------------------
| FILTER TOOLS FOR ROLE
|--------------------------------------------------------------------------
|
| This controls which tools the model even sees.
|
| Server execution must STILL perform the real permission check.
|
|--------------------------------------------------------------------------
*/

export function getAdminAIToolsForRole(
  role:
    AdminRole
) {
  /*
  |--------------------------------------------------------------------------
  | LOCAL IMPORT AVOIDED
  |--------------------------------------------------------------------------
  |
  | Permission matrix is represented directly here only for tool exposure.
  |
  | Real execution permission is checked again server-side through
  | adminPermissions.ts.
  |
  |--------------------------------------------------------------------------
  */

  const allowedToolNames =
    new Set<
      AdminAIToolName
    >();

  /*
  |--------------------------------------------------------------------------
  | SUPER ADMIN
  |--------------------------------------------------------------------------
  */

  if (
    role ===
    "super_admin"
  ) {
    return [
      ...ADMIN_AI_TOOL_DEFINITIONS,
    ];
  }

  /*
  |--------------------------------------------------------------------------
  | EVERY AUTHORIZED ADMIN
  |--------------------------------------------------------------------------
  */

  allowedToolNames.add(
    "get_dashboard_summary"
  );

  /*
  |--------------------------------------------------------------------------
  | PRODUCT MANAGER
  |--------------------------------------------------------------------------
  */

  if (
    role ===
    "product_manager"
  ) {
    [
      "get_business_intelligence",
      "get_demand_trends",
      "get_restock_recommendations",
      "get_conversion_opportunities",
      "search_admin_products",
      "get_admin_product",
      "create_product_draft",
      "update_product",
      "update_product_status",
      "update_product_stock",
      "update_product_price",
      "get_sales_report",
    ].forEach(
      (
        tool
      ) =>
        allowedToolNames.add(
          tool as
            AdminAIToolName
        )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ORDER MANAGER
  |--------------------------------------------------------------------------
  */

  if (
    role ===
    "order_manager"
  ) {
    [
      "get_business_intelligence",
      "search_admin_products",
      "get_admin_product",
      "search_admin_orders",
      "get_admin_order",
      "update_admin_order_status",
      "cancel_admin_order",
      "approve_admin_return",
      "reject_admin_return",
      "approve_admin_exchange",
      "reject_admin_exchange",
      "search_admin_customers",
      "get_admin_customer",
      "get_sales_report",
    ].forEach(
      (
        tool
      ) =>
        allowedToolNames.add(
          tool as
            AdminAIToolName
        )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SUPPORT ADMIN
  |--------------------------------------------------------------------------
  */

  if (
    role ===
    "support_admin"
  ) {
    [
      "search_admin_products",
      "get_admin_product",
      "search_admin_orders",
      "get_admin_order",
      "cancel_admin_order",
      "search_admin_customers",
      "get_admin_customer",
    ].forEach(
      (
        tool
      ) =>
        allowedToolNames.add(
          tool as
            AdminAIToolName
        )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FINANCE MANAGER
  |--------------------------------------------------------------------------
  */

  if (
    role ===
    "finance_manager"
  ) {
    [
      "get_business_intelligence",
      "get_demand_trends",
      "get_conversion_opportunities",
      "search_admin_products",
      "get_admin_product",
      "update_product_price",
      "search_admin_orders",
      "get_admin_order",
      "search_admin_customers",
      "get_admin_customer",
      "get_sales_report",
    ].forEach(
      (
        tool
      ) =>
        allowedToolNames.add(
          tool as
            AdminAIToolName
        )
    );
  }

  return ADMIN_AI_TOOL_DEFINITIONS.filter(
    (
      definition
    ) =>
      allowedToolNames.has(
        definition.function.name
      )
  );
}

/*
|--------------------------------------------------------------------------
| TOOL SECURITY SUMMARY
|--------------------------------------------------------------------------
*/

export function getAdminToolSecuritySummary(
  toolName:
    AdminAIToolName
) {
  const action =
    ADMIN_TOOL_ACTION_MAP[
      toolName
    ];

  return {
    toolName,

    action,

    riskLevel:
      getAdminActionRiskLevel(
        action
      ),

    requiresConfirmation:
      adminActionRequiresConfirmation(
        action
      ),
  };
}

/*
|--------------------------------------------------------------------------
| ALL TOOL SECURITY SUMMARIES
|--------------------------------------------------------------------------
*/

export function getAllAdminToolSecuritySummaries() {
  return (
    Object.keys(
      ADMIN_TOOL_ACTION_MAP
    ) as
      AdminAIToolName[]
  ).map(
    getAdminToolSecuritySummary
  );
}