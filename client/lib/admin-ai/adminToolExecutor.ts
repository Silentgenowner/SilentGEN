import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";

import AdminAIActionLog, {
  type AdminAIActionStatus,
  type AdminAIActionTargetType,
  type AdminAIActionType,
} from "@/models/AdminAIActionLog";

import {
  checkAdminPermission,
  isAdminRole,
  type AdminRole,
} from "@/lib/admin-ai/adminPermissions";

import {
  ADMIN_TOOL_ACTION_MAP,
  adminToolRequiresConfirmation,
  isAdminAIToolName,
  type AdminAIToolName,
} from "@/lib/admin-ai/adminToolDefinitions";

import {
  getAdminBusinessIntelligence,
  getAdminSalesGrowthSummary,
  type AdminBusinessPeriod,
} from "@/lib/admin-ai/adminBusinessIntelligence";

import {
  compareDemandSnapshots,
} from "@/lib/ai/learning/demandSnapshotService";

/*
|--------------------------------------------------------------------------
| SILENTGEN ADMIN AI TOOL EXECUTOR
|--------------------------------------------------------------------------
|
| SECURITY MODEL
|
| Admin AI model
|      ↓
| tool request
|      ↓
| authenticated admin context from API route
|      ↓
| role permission check
|      ↓
| validation against live database
|      ↓
| high / critical?
|      ↓
| YES → save exact pending action
|      ↓
| explicit admin confirmation
|      ↓
| atomic one-time claim
|      ↓
| execute exact stored arguments
|      ↓
| before/after state audit
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const CONFIRMATION_MAX_AGE_MS =
  30 * 60 * 1000;

const DEFAULT_SEARCH_LIMIT =
  20;

const MAX_SEARCH_LIMIT =
  50;

const MAX_SEARCH_LENGTH =
  200;

const MAX_REASON_LENGTH =
  1000;

const MAX_NOTE_LENGTH =
  1000;

const MAX_PRODUCT_TEXT =
  10_000;

const MAX_STOCK =
  1_000_000;

const MAX_PRICE =
  100_000_000;

/*
|--------------------------------------------------------------------------
| ORDER STATUSES
|--------------------------------------------------------------------------
*/

const ORDER_STATUSES = [
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
] as const;

type OrderStatus =
  typeof ORDER_STATUSES[number];

/*
|--------------------------------------------------------------------------
| PRODUCT STATUS
|--------------------------------------------------------------------------
*/

const PRODUCT_STATUSES = [
  "Active",
  "Draft",
  "Out of Stock",
  "Archived",
] as const;

type ProductStatus =
  typeof PRODUCT_STATUSES[number];

/*
|--------------------------------------------------------------------------
| ORDER TRANSITIONS
|--------------------------------------------------------------------------
|
| Prevent arbitrary lifecycle jumping.
|
|--------------------------------------------------------------------------
*/

const ORDER_STATUS_TRANSITIONS:
  Record<
    OrderStatus,
    ReadonlySet<OrderStatus>
  > = {
  Placed:
    new Set([
      "Confirmed",
      "Cancelled",
    ]),

  Confirmed:
    new Set([
      "Packed",
      "Cancelled",
    ]),

  Packed:
    new Set([
      "Shipped",
      "Cancelled",
    ]),

  Shipped:
    new Set([
      "Out For Delivery",
    ]),

  "Out For Delivery":
    new Set([
      "Delivered",
    ]),

  Delivered:
    new Set([
      "Return Requested",
      "Exchange Requested",
    ]),

  Cancelled:
    new Set(),

  "Return Requested":
    new Set([
      "Returned",
    ]),

  Returned:
    new Set([
      "Refunded",
    ]),

  "Exchange Requested":
    new Set(),

  Refunded:
    new Set(),
};

/*
|--------------------------------------------------------------------------
| EXECUTION CONTEXT
|--------------------------------------------------------------------------
*/

export type AdminAIToolExecutionContext = {
  adminId:
    string;

  adminRole:
    AdminRole;

  conversationId?:
    string | null;

  messageId?:
    string | null;

  requestId?:
    string | null;
};

/*
|--------------------------------------------------------------------------
| EXECUTION INPUT
|--------------------------------------------------------------------------
*/

export type ExecuteAdminAIToolInput = {
  toolName:
    string;

  args:
    Record<
      string,
      unknown
    >;

  context:
    AdminAIToolExecutionContext;
};

/*
|--------------------------------------------------------------------------
| CONFIRM INPUT
|--------------------------------------------------------------------------
*/

export type ConfirmAdminAIActionInput = {
  actionLogId:
    string;

  adminId:
    string;

  adminRole:
    AdminRole;
};

/*
|--------------------------------------------------------------------------
| REJECT INPUT
|--------------------------------------------------------------------------
*/

export type RejectAdminAIActionInput = {
  actionLogId:
    string;

  adminId:
    string;

  adminRole:
    AdminRole;
};

/*
|--------------------------------------------------------------------------
| RESULT
|--------------------------------------------------------------------------
*/

export type AdminAIToolExecutionResult = {
  success:
    boolean;

  message:
    string;

  toolName?:
    AdminAIToolName;

  action?:
    AdminAIActionType;

  requiresConfirmation?:
    boolean;

  confirmationRequired?:
    boolean;

  actionLogId?:
    string;

  data?:
    unknown;

  error?:
    string;
};

/*
|--------------------------------------------------------------------------
| INTERNAL ACTION EXECUTION
|--------------------------------------------------------------------------
*/

type InternalExecutionResult = {
  success:
    boolean;

  message:
    string;

  targetType:
    AdminAIActionTargetType;

  targetId?:
    string | null;

  targetLabel?:
    string;

  beforeState?:
    Record<
      string,
      unknown
    >;

  afterState?:
    Record<
      string,
      unknown
    >;

  data?:
    unknown;
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(
  value:
    unknown,
  maxLength =
    MAX_SEARCH_LENGTH
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

function safeNumber(
  value:
    unknown
) {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

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
    )
  ) {
    return 0;
  }

  return Math.floor(
    number
  );
}

function normalizeLimit(
  value:
    unknown
) {
  return Math.min(
    MAX_SEARCH_LIMIT,
    Math.max(
      1,
      safeInteger(
        value
      ) ||
        DEFAULT_SEARCH_LIMIT
    )
  );
}

function validObjectId(
  value:
    unknown
): value is string {
  return (
    typeof value ===
      "string" &&
    mongoose.Types.ObjectId.isValid(
      value
    )
  );
}

function normalizeObjectId(
  value:
    unknown
):
  string | null {
  if (
    !validObjectId(
      value
    )
  ) {
    return null;
  }

  return value;
}

function regexEscape(
  value:
    string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function stringArray(
  value:
    unknown,
  maxItems =
    30
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
        100
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
      maxItems
    ) {
      break;
    }
  }

  return output;
}

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

function isProductStatus(
  value:
    unknown
): value is ProductStatus {
  return (
    typeof value ===
      "string" &&
    PRODUCT_STATUSES.includes(
      value as
        ProductStatus
    )
  );
}

function isOrderStatus(
  value:
    unknown
): value is OrderStatus {
  return (
    typeof value ===
      "string" &&
    ORDER_STATUSES.includes(
      value as
        OrderStatus
    )
  );
}

function normalizePeriod(
  value:
    unknown
):
  AdminBusinessPeriod {
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

function createRequestId() {
  return new mongoose.Types.ObjectId()
    .toString();
}

/*
|--------------------------------------------------------------------------
| SERIALIZE PRODUCT
|--------------------------------------------------------------------------
*/

function serializeProduct(
  product:
    any
) {
  if (
    !product
  ) {
    return null;
  }

  return {
    id:
      String(
        product._id
      ),

    sku:
      cleanString(
        product.sku,
        100
      ),

    name:
      cleanString(
        product.name,
        300
      ),

    slug:
      cleanString(
        product.slug,
        300
      ),

    category:
      cleanString(
        product.category,
        150
      ),

    subCategory:
      cleanString(
        product.subCategory,
        150
      ),

    brand:
      cleanString(
        product.brand,
        150
      ),

    gender:
      cleanString(
        product.gender,
        50
      ),

    fabric:
      cleanString(
        product.fabric,
        150
      ),

    fit:
      cleanString(
        product.fit,
        150
      ),

    mrp:
      safeNumber(
        product.mrp
      ),

    price:
      safeNumber(
        product.price
      ),

    discount:
      safeNumber(
        product.discount
      ),

    stock:
      Math.max(
        0,
        safeInteger(
          product.stock
        )
      ),

    lowStockLimit:
      Math.max(
        0,
        safeInteger(
          product.lowStockLimit
        )
      ),

    sold:
      Math.max(
        0,
        safeInteger(
          product.sold
        )
      ),

    status:
      cleanString(
        product.status,
        50
      ),

    sizes:
      stringArray(
        product.sizes
      ),

    colors:
      stringArray(
        product.colors
      ),

    thumbnail:
      cleanString(
        product.thumbnail,
        2000
      ),

    images:
      stringArray(
        product.images,
        50
      ),

    featured:
      product.featured ===
      true,

    bestSeller:
      product.bestSeller ===
      true,

    newArrival:
      product.newArrival ===
      true,

    trending:
      product.trending ===
      true,

    createdAt:
      product.createdAt ||
      null,

    updatedAt:
      product.updatedAt ||
      null,
  };
}

/*
|--------------------------------------------------------------------------
| SERIALIZE CUSTOMER
|--------------------------------------------------------------------------
|
| Authentication secrets are intentionally excluded.
|
|--------------------------------------------------------------------------
*/

function serializeCustomer(
  customer:
    any
) {
  if (
    !customer
  ) {
    return null;
  }

  return {
    id:
      String(
        customer._id
      ),

    name:
      cleanString(
        customer.name,
        250
      ),

    mobile:
      cleanString(
        customer.mobile,
        30
      ),

    email:
      cleanString(
        customer.email,
        300
      ),

    role:
      cleanString(
        customer.role,
        50
      ),

    isVerified:
      customer.isVerified ===
      true,

    isBlocked:
      customer.isBlocked ===
      true,

    lastLogin:
      customer.lastLogin ||
      null,

    createdAt:
      customer.createdAt ||
      null,

    updatedAt:
      customer.updatedAt ||
      null,
  };
}

/*
|--------------------------------------------------------------------------
| SERIALIZE ORDER
|--------------------------------------------------------------------------
*/

function serializeOrder(
  order:
    any
) {
  if (
    !order
  ) {
    return null;
  }

  const customer =
    order.user &&
    typeof order.user ===
      "object" &&
    order.user._id
      ? serializeCustomer(
          order.user
        )
      : order.user
        ? {
            id:
              String(
                order.user
              ),
          }
        : null;

  return {
    id:
      String(
        order._id
      ),

    customer,

    items:
      Array.isArray(
        order.items
      )
        ? order.items.map(
            (
              item:
                any
            ) => ({
              productId:
                item.product
                  ? String(
                      item.product
                        ?._id ||
                        item.product
                    )
                  : "",

              name:
                cleanString(
                  item.name,
                  300
                ),

              image:
                cleanString(
                  item.image,
                  2000
                ),

              price:
                safeNumber(
                  item.price
                ),

              quantity:
                Math.max(
                  0,
                  safeInteger(
                    item.quantity
                  )
                ),

              size:
                cleanString(
                  item.size,
                  100
                ),

              color:
                cleanString(
                  item.color,
                  100
                ),
            })
          )
        : [],

    orderStatus:
      cleanString(
        order.orderStatus,
        100
      ),

    paymentMethod:
      cleanString(
        order.paymentMethod,
        50
      ),

    paymentStatus:
      cleanString(
        order.paymentStatus,
        50
      ),

    refundStatus:
      cleanString(
        order.refundStatus,
        50
      ),

    trackingNumber:
      cleanString(
        order.trackingNumber,
        250
      ),

    courierPartner:
      cleanString(
        order.courierPartner,
        250
      ),

    invoiceNo:
      cleanString(
        order.invoiceNo,
        250
      ),

    totalAmount:
      safeNumber(
        order.totalAmount ??
        order.grandTotal ??
        order.total ??
        0
      ),

    returnRequest:
      order.returnRequest ||
      null,

    exchangeRequest:
      order.exchangeRequest ||
      null,

    createdAt:
      order.createdAt ||
      null,

    updatedAt:
      order.updatedAt ||
      null,
  };
}

/*
|--------------------------------------------------------------------------
| CREATE ACTION LOG
|--------------------------------------------------------------------------
*/

async function createActionLog({
  context,
  toolName,
  action,
  args,
  status,
  targetType =
    "none",
  targetId =
    null,
  targetLabel =
    "",
  roleAuthorized,
}: {
  context:
    AdminAIToolExecutionContext;

  toolName:
    AdminAIToolName;

  action:
    AdminAIActionType;

  args:
    Record<
      string,
      unknown
    >;

  status:
    AdminAIActionStatus;

  targetType?:
    AdminAIActionTargetType;

  targetId?:
    string | null;

  targetLabel?:
    string;

  roleAuthorized:
    boolean;
}) {
  const requiresConfirmation =
    adminToolRequiresConfirmation(
      toolName
    );

  return AdminAIActionLog.create(
    {
      adminId:
        context.adminId,

      adminRole:
        context.adminRole,

      conversationId:
        normalizeObjectId(
          context.conversationId
        ),

      messageId:
        normalizeObjectId(
          context.messageId
        ),

      action,

      toolName,

      status,

      targetType,

      targetId:
        normalizeObjectId(
          targetId
        ),

      targetLabel,

      requiresConfirmation,

      confirmedByAdmin:
        false,

      confirmationRequestedAt:
        requiresConfirmation &&
        status ===
          "requested"
          ? new Date()
          : null,

      roleAuthorized,

      permissionCheckedAt:
        new Date(),

      input:
        args,

      beforeState:
        {},

      afterState:
        {},

      output:
        {},

      errorMessage:
        "",

      requestId:
        cleanString(
          context.requestId,
          200
        ) ||
        createRequestId(),

      metadata: {
        executor:
          "adminToolExecutor",
      },
    }
  );
}

/*
|--------------------------------------------------------------------------
| UPDATE ACTION LOG
|--------------------------------------------------------------------------
*/

async function finishActionLog({
  actionLogId,
  result,
}: {
  actionLogId:
    string;

  result:
    InternalExecutionResult;
}) {
  const update:
    Record<
      string,
      unknown
    > = {
    status:
      result.success
        ? "completed"
        : "failed",

    targetType:
      result.targetType,

    targetLabel:
      result.targetLabel ||
      "",

    beforeState:
      result.beforeState ||
      {},

    afterState:
      result.afterState ||
      {},

    output: {
      message:
        result.message,

      data:
        result.data ??
        null,
    },

    errorMessage:
      result.success
        ? ""
        : result.message,

    executedAt:
      new Date(),
  };

  if (
    result.targetId &&
    mongoose.Types.ObjectId.isValid(
      result.targetId
    )
  ) {
    update.targetId =
      new mongoose.Types.ObjectId(
        result.targetId
      );
  }

  await AdminAIActionLog.updateOne(
    {
      _id:
        actionLogId,
    },
    {
      $set:
        update,
    }
  );
}

/*
|--------------------------------------------------------------------------
| BUSINESS INTELLIGENCE
|--------------------------------------------------------------------------
*/

async function executeBusinessIntelligence(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const period =
    normalizePeriod(
      args.period
    );

  const data =
    await getAdminBusinessIntelligence(
      period
    );

  return {
    success:
      data.success,

    message:
      data.message,

    targetType:
      "business",

    targetLabel:
      `${period} business intelligence`,

    data,
  };
}

/*
|--------------------------------------------------------------------------
| DASHBOARD SUMMARY
|--------------------------------------------------------------------------
*/

async function executeDashboardSummary(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const period =
    normalizePeriod(
      args.period
    );

  const data =
    await getAdminSalesGrowthSummary(
      period
    );

  return {
    success:
      data.success,

    message:
      data.message,

    targetType:
      "business",

    targetLabel:
      `${period} dashboard summary`,

    data,
  };
}

/*
|--------------------------------------------------------------------------
| DEMAND TRENDS
|--------------------------------------------------------------------------
*/

async function executeDemandTrends(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const period =
    normalizePeriod(
      args.period
    );

  const data =
    await compareDemandSnapshots(
      period
    );

  return {
    success:
      data.success,

    message:
      data.message,

    targetType:
      "business",

    targetLabel:
      `${period} demand trends`,

    data,
  };
}

/*
|--------------------------------------------------------------------------
| RESTOCK RECOMMENDATIONS
|--------------------------------------------------------------------------
*/

async function executeRestockRecommendations(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const period =
    normalizePeriod(
      args.period
    );

  const limit =
    normalizeLimit(
      args.limit
    );

  const intelligence =
    await getAdminBusinessIntelligence(
      period
    );

  const data =
    intelligence.urgentRestock.slice(
      0,
      limit
    );

  return {
    success:
      intelligence.success,

    message:
      intelligence.success
        ? "Restock recommendations loaded successfully."
        : intelligence.message,

    targetType:
      "inventory",

    targetLabel:
      `${period} restock recommendations`,

    data,
  };
}

/*
|--------------------------------------------------------------------------
| CONVERSION OPPORTUNITIES
|--------------------------------------------------------------------------
*/

async function executeConversionOpportunities(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const period =
    normalizePeriod(
      args.period
    );

  const limit =
    normalizeLimit(
      args.limit
    );

  const intelligence =
    await getAdminBusinessIntelligence(
      period
    );

  const data =
    intelligence
      .conversionOpportunities
      .slice(
        0,
        limit
      );

  return {
    success:
      intelligence.success,

    message:
      intelligence.success
        ? "Conversion opportunities loaded successfully."
        : intelligence.message,

    targetType:
      "business",

    targetLabel:
      `${period} conversion opportunities`,

    data,
  };
}

/*
|--------------------------------------------------------------------------
| SEARCH PRODUCTS
|--------------------------------------------------------------------------
*/

async function executeSearchProducts(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const search =
    cleanString(
      args.search
    );

  const category =
    cleanString(
      args.category,
      150
    );

  const status =
    cleanString(
      args.status,
      50
    );

  const lowStockOnly =
    args.lowStockOnly ===
    true;

  const limit =
    normalizeLimit(
      args.limit
    );

  const filter:
    Record<
      string,
      unknown
    > = {
    isDeleted: {
      $ne:
        true,
    },
  };

  if (
    status &&
    isProductStatus(
      status
    )
  ) {
    filter.status =
      status;
  }

  if (
    category
  ) {
    filter.category = {
      $regex:
        regexEscape(
          category
        ),

      $options:
        "i",
    };
  }

  if (
    search
  ) {
    const regex = {
      $regex:
        regexEscape(
          search
        ),

      $options:
        "i",
    };

    filter.$or = [
      {
        name:
          regex,
      },
      {
        sku:
          regex,
      },
      {
        brand:
          regex,
      },
      {
        category:
          regex,
      },
      {
        subCategory:
          regex,
      },
    ];
  }

  let products:
    any[] =
    await Product.find(
      filter
    )
      .sort(
        {
          updatedAt:
            -1,
        }
      )
      .limit(
        lowStockOnly
          ? Math.min(
              200,
              limit *
                5
            )
          : limit
      )
      .lean();

  if (
    lowStockOnly
  ) {
    products =
      products.filter(
        (
          product
        ) =>
          safeInteger(
            product.stock
          ) <=
          (
            safeInteger(
              product
                .lowStockLimit
            ) ||
            5
          )
      )
      .slice(
        0,
        limit
      );
  }

  return {
    success:
      true,

    message:
      `${products.length} product(s) found.`,

    targetType:
      "product",

    targetLabel:
      "product search",

    data:
      products.map(
        serializeProduct
      ),
  };
}

/*
|--------------------------------------------------------------------------
| GET PRODUCT
|--------------------------------------------------------------------------
*/

async function executeGetProduct(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const productId =
    normalizeObjectId(
      args.productId
    );

  if (
    !productId
  ) {
    return {
      success:
        false,

      message:
        "Invalid product id.",

      targetType:
        "product",
    };
  }

  const product =
    await Product.findOne(
      {
        _id:
          productId,

        isDeleted: {
          $ne:
            true,
        },
      }
    ).lean();

  if (
    !product
  ) {
    return {
      success:
        false,

      message:
        "Product not found.",

      targetType:
        "product",

      targetId:
        productId,
    };
  }

  return {
    success:
      true,

    message:
      "Product loaded successfully.",

    targetType:
      "product",

    targetId:
      productId,

    targetLabel:
      cleanString(
        (product as any).name,
        300
      ),

    data:
      serializeProduct(
        product
      ),
  };
}

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT DRAFT
|--------------------------------------------------------------------------
*/

async function executeCreateProductDraft(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const sku =
    cleanString(
      args.sku,
      100
    ).toUpperCase();

  const name =
    cleanString(
      args.name,
      300
    );

  const category =
    cleanString(
      args.category,
      150
    );

  const subCategory =
    cleanString(
      args.subCategory,
      150
    );

  const brand =
    cleanString(
      args.brand,
      150
    ) ||
    "SilentGEN";

  const gender =
    cleanString(
      args.gender,
      50
    ) ||
    "Unisex";

  const mrp =
    safeNumber(
      args.mrp
    );

  const price =
    safeNumber(
      args.price
    );

  const stock =
    Math.max(
      0,
      safeInteger(
        args.stock
      )
    );

  const sizes =
    stringArray(
      args.sizes
    );

  const colors =
    stringArray(
      args.colors
    );

  const shortDescription =
    cleanString(
      args.shortDescription,
      1000
    );

  if (
    !sku ||
    !name ||
    !category
  ) {
    return {
      success:
        false,

      message:
        "SKU, name and category are required.",

      targetType:
        "product",
    };
  }

  if (
    price >
    mrp
  ) {
    return {
      success:
        false,

      message:
        "Product price cannot be greater than MRP.",

      targetType:
        "product",
    };
  }

  const duplicate =
    await Product.findOne(
      {
        sku,
      }
    )
      .select(
        "_id"
      )
      .lean();

  if (
    duplicate
  ) {
    return {
      success:
        false,

      message:
        "A product with this SKU already exists.",

      targetType:
        "product",

      targetId:
        String(
          (duplicate as any)._id
        ),
    };
  }

  const slugBase =
    name
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      ) ||
    `product-${Date.now()}`;

  let slug =
    slugBase;

  const slugExists =
    await Product.exists(
      {
        slug,
      }
    );

  if (
    slugExists
  ) {
    slug =
      `${slugBase}-${Date.now()}`;
  }

  const product =
    await Product.create(
      {
        sku,

        name,

        slug,

        category,

        subCategory,

        brand,

        gender,

        mrp,

        price,

        discount:
          mrp >
          0
            ? Math.max(
                0,
                Math.round(
                  (
                    (
                      mrp -
                      price
                    ) /
                    mrp
                  ) *
                    100
                )
              )
            : 0,

        stock,

        sizes,

        colors,

        shortDescription,

        status:
          "Draft",
      }
    );

  const serialized =
    serializeProduct(
      product.toObject()
    );

  return {
    success:
      true,

    message:
      "Product draft created successfully.",

    targetType:
      "product",

    targetId:
      String(
        product._id
      ),

    targetLabel:
      name,

    beforeState:
      {},

    afterState:
      serialized ||
      {},

    data:
      serialized,
  };
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
*/

async function executeUpdateProduct(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const productId =
    normalizeObjectId(
      args.productId
    );

  if (
    !productId
  ) {
    return {
      success:
        false,

      message:
        "Invalid product id.",

      targetType:
        "product",
    };
  }

  const product:
    any =
    await Product.findOne(
      {
        _id:
          productId,

        isDeleted: {
          $ne:
            true,
        },
      }
    );

  if (
    !product
  ) {
    return {
      success:
        false,

      message:
        "Product not found.",

      targetType:
        "product",

      targetId:
        productId,
    };
  }

  const before =
    serializeProduct(
      product.toObject()
    ) ||
    {};

  const assignString = (
    key:
      string,
    maxLength:
      number
  ) => {
    if (
      Object.prototype.hasOwnProperty.call(
        args,
        key
      )
    ) {
      product[key] =
        cleanString(
          args[key],
          maxLength
        );
    }
  };

  assignString(
    "name",
    300
  );

  assignString(
    "category",
    150
  );

  assignString(
    "subCategory",
    150
  );

  assignString(
    "brand",
    150
  );

  assignString(
    "gender",
    50
  );

  assignString(
    "fabric",
    150
  );

  assignString(
    "fit",
    150
  );

  assignString(
    "shortDescription",
    1500
  );

  assignString(
    "description",
    MAX_PRODUCT_TEXT
  );

  if (
    Array.isArray(
      args.sizes
    )
  ) {
    product.sizes =
      stringArray(
        args.sizes
      );
  }

  if (
    Array.isArray(
      args.colors
    )
  ) {
    product.colors =
      stringArray(
        args.colors
      );
  }

  await product.save();

  const after =
    serializeProduct(
      product.toObject()
    ) ||
    {};

  return {
    success:
      true,

    message:
      "Product updated successfully.",

    targetType:
      "product",

    targetId:
      productId,

    targetLabel:
      cleanString(
        product.name,
        300
      ),

    beforeState:
      before,

    afterState:
      after,

    data:
      after,
  };
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT STATUS
|--------------------------------------------------------------------------
*/

async function executeUpdateProductStatus(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const productId =
    normalizeObjectId(
      args.productId
    );

  const status =
    args.status;

  if (
    !productId ||
    !isProductStatus(
      status
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid product id or product status.",

      targetType:
        "product",

      targetId:
        productId,
    };
  }

  const product:
    any =
    await Product.findOne(
      {
        _id:
          productId,

        isDeleted: {
          $ne:
            true,
        },
      }
    );

  if (
    !product
  ) {
    return {
      success:
        false,

      message:
        "Product not found.",

      targetType:
        "product",

      targetId:
        productId,
    };
  }

  const before = {
    status:
      product.status,
  };

  product.status =
    status;

  await product.save();

  return {
    success:
      true,

    message:
      `Product status changed to ${status}.`,

    targetType:
      "product",

    targetId:
      productId,

    targetLabel:
      cleanString(
        product.name,
        300
      ),

    beforeState:
      before,

    afterState: {
      status:
        product.status,
    },

    data:
      serializeProduct(
        product.toObject()
      ),
  };
}

/*
|--------------------------------------------------------------------------
| UPDATE STOCK
|--------------------------------------------------------------------------
*/

async function executeUpdateProductStock(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const productId =
    normalizeObjectId(
      args.productId
    );

  const stock =
    safeInteger(
      args.stock
    );

  if (
    !productId
  ) {
    return {
      success:
        false,

      message:
        "Invalid product id.",

      targetType:
        "inventory",
    };
  }

  if (
    stock <
      0 ||
    stock >
      MAX_STOCK
  ) {
    return {
      success:
        false,

      message:
        "Invalid stock value.",

      targetType:
        "inventory",

      targetId:
        productId,
    };
  }

  const product:
    any =
    await Product.findOne(
      {
        _id:
          productId,

        isDeleted: {
          $ne:
            true,
        },
      }
    );

  if (
    !product
  ) {
    return {
      success:
        false,

      message:
        "Product not found.",

      targetType:
        "inventory",

      targetId:
        productId,
    };
  }

  const before = {
    stock:
      safeInteger(
        product.stock
      ),

    status:
      product.status,
  };

  product.stock =
    stock;

  /*
  |--------------------------------------------------------------------------
  | SAFE STATUS SYNC
  |--------------------------------------------------------------------------
  |
  | Only switch Active → Out of Stock automatically.
  | Draft / Archived status remains untouched.
  |
  |--------------------------------------------------------------------------
  */

  if (
    stock ===
      0 &&
    product.status ===
      "Active"
  ) {
    product.status =
      "Out of Stock";
  }

  if (
    stock >
      0 &&
    product.status ===
      "Out of Stock"
  ) {
    product.status =
      "Active";
  }

  await product.save();

  const after = {
    stock:
      safeInteger(
        product.stock
      ),

    status:
      product.status,
  };

  return {
    success:
      true,

    message:
      `Product stock updated from ${before.stock} to ${after.stock}.`,

    targetType:
      "inventory",

    targetId:
      productId,

    targetLabel:
      cleanString(
        product.name,
        300
      ),

    beforeState:
      before,

    afterState:
      after,

    data:
      serializeProduct(
        product.toObject()
      ),
  };
}

/*
|--------------------------------------------------------------------------
| UPDATE PRICE
|--------------------------------------------------------------------------
*/

async function executeUpdateProductPrice(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const productId =
    normalizeObjectId(
      args.productId
    );

  const price =
    safeNumber(
      args.price
    );

  const mrp =
    safeNumber(
      args.mrp
    );

  if (
    !productId
  ) {
    return {
      success:
        false,

      message:
        "Invalid product id.",

      targetType:
        "product",
    };
  }

  if (
    price <
      0 ||
    mrp <
      0 ||
    price >
      MAX_PRICE ||
    mrp >
      MAX_PRICE
  ) {
    return {
      success:
        false,

      message:
        "Invalid product price or MRP.",

      targetType:
        "product",

      targetId:
        productId,
    };
  }

  if (
    price >
    mrp
  ) {
    return {
      success:
        false,

      message:
        "Price cannot be greater than MRP.",

      targetType:
        "product",

      targetId:
        productId,
    };
  }

  const product:
    any =
    await Product.findOne(
      {
        _id:
          productId,

        isDeleted: {
          $ne:
            true,
        },
      }
    );

  if (
    !product
  ) {
    return {
      success:
        false,

      message:
        "Product not found.",

      targetType:
        "product",

      targetId:
        productId,
    };
  }

  const before = {
    price:
      safeNumber(
        product.price
      ),

    mrp:
      safeNumber(
        product.mrp
      ),

    discount:
      safeNumber(
        product.discount
      ),
  };

  product.price =
    price;

  product.mrp =
    mrp;

  product.discount =
    mrp >
    0
      ? Math.max(
          0,
          Math.round(
            (
              (
                mrp -
                price
              ) /
              mrp
            ) *
              100
          )
        )
      : 0;

  await product.save();

  const after = {
    price:
      safeNumber(
        product.price
      ),

    mrp:
      safeNumber(
        product.mrp
      ),

    discount:
      safeNumber(
        product.discount
      ),
  };

  return {
    success:
      true,

    message:
      "Product pricing updated successfully.",

    targetType:
      "product",

    targetId:
      productId,

    targetLabel:
      cleanString(
        product.name,
        300
      ),

    beforeState:
      before,

    afterState:
      after,

    data:
      serializeProduct(
        product.toObject()
      ),
  };
}

/*
|--------------------------------------------------------------------------
| SEARCH ORDERS
|--------------------------------------------------------------------------
*/

async function executeSearchOrders(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const search =
    cleanString(
      args.search
    );

  const status =
    cleanString(
      args.status,
      100
    );

  const limit =
    normalizeLimit(
      args.limit
    );

  const filter:
    Record<
      string,
      unknown
    > = {};

  if (
    status &&
    isOrderStatus(
      status
    )
  ) {
    filter.orderStatus =
      status;
  }

  if (
    search
  ) {
    const conditions:
      Record<
        string,
        unknown
      >[] = [];

    if (
      mongoose.Types.ObjectId.isValid(
        search
      )
    ) {
      conditions.push(
        {
          _id:
            search,
        }
      );
    }

    const regex = {
      $regex:
        regexEscape(
          search
        ),

      $options:
        "i",
    };

    conditions.push(
      {
        trackingNumber:
          regex,
      },
      {
        invoiceNo:
          regex,
      },
      {
        courierPartner:
          regex,
      }
    );

    filter.$or =
      conditions;
  }

  const orders:
    any[] =
    await Order.find(
      filter
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
      .populate(
        "user",
        "name mobile email role isVerified isBlocked lastLogin createdAt updatedAt"
      )
      .lean();

  return {
    success:
      true,

    message:
      `${orders.length} order(s) found.`,

    targetType:
      "order",

    targetLabel:
      "order search",

    data:
      orders.map(
        serializeOrder
      ),
  };
}

/*
|--------------------------------------------------------------------------
| GET ORDER
|--------------------------------------------------------------------------
*/

async function executeGetOrder(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const orderId =
    normalizeObjectId(
      args.orderId
    );

  if (
    !orderId
  ) {
    return {
      success:
        false,

      message:
        "Invalid order id.",

      targetType:
        "order",
    };
  }

  const order =
    await Order.findById(
      orderId
    )
      .populate(
        "user",
        "name mobile email role isVerified isBlocked lastLogin createdAt updatedAt"
      )
      .lean();

  if (
    !order
  ) {
    return {
      success:
        false,

      message:
        "Order not found.",

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  return {
    success:
      true,

    message:
      "Order loaded successfully.",

    targetType:
      "order",

    targetId:
      orderId,

    targetLabel:
      `Order ${orderId}`,

    data:
      serializeOrder(
        order
      ),
  };
}

/*
|--------------------------------------------------------------------------
| UPDATE ORDER STATUS
|--------------------------------------------------------------------------
*/

async function executeUpdateOrderStatus(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const orderId =
    normalizeObjectId(
      args.orderId
    );

  const requestedStatus =
    args.status;

  if (
    !orderId ||
    !isOrderStatus(
      requestedStatus
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid order id or status.",

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  const order:
    any =
    await Order.findById(
      orderId
    );

  if (
    !order
  ) {
    return {
      success:
        false,

      message:
        "Order not found.",

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  const currentStatus =
    cleanString(
      order.orderStatus,
      100
    ) as
      OrderStatus;

  if (
    currentStatus ===
    requestedStatus
  ) {
    return {
      success:
        true,

      message:
        `Order is already ${requestedStatus}.`,

      targetType:
        "order",

      targetId:
        orderId,

      targetLabel:
        `Order ${orderId}`,

      beforeState: {
        orderStatus:
          currentStatus,
      },

      afterState: {
        orderStatus:
          currentStatus,
      },

      data:
        serializeOrder(
          order.toObject()
        ),
    };
  }

  if (
    !isOrderStatus(
      currentStatus
    )
  ) {
    return {
      success:
        false,

      message:
        "Current order status is unsupported.",

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  const allowed =
    ORDER_STATUS_TRANSITIONS[
      currentStatus
    ];

  if (
    !allowed.has(
      requestedStatus
    )
  ) {
    return {
      success:
        false,

      message:
        `Order cannot move directly from ${currentStatus} to ${requestedStatus}.`,

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  const before = {
    orderStatus:
      currentStatus,
  };

  order.orderStatus =
    requestedStatus;

  if (
    Array.isArray(
      order.deliveryHistory
    )
  ) {
    order.deliveryHistory.push(
      {
        status:
          requestedStatus,

        date:
          new Date(),
      }
    );
  }

  await order.save();

  return {
    success:
      true,

    message:
      `Order status updated from ${currentStatus} to ${requestedStatus}.`,

    targetType:
      "order",

    targetId:
      orderId,

    targetLabel:
      `Order ${orderId}`,

    beforeState:
      before,

    afterState: {
      orderStatus:
        requestedStatus,
    },

    data:
      serializeOrder(
        order.toObject()
      ),
  };
}

/*
|--------------------------------------------------------------------------
| CANCEL ORDER
|--------------------------------------------------------------------------
*/

async function executeCancelOrder(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const orderId =
    normalizeObjectId(
      args.orderId
    );

  const reason =
    cleanString(
      args.reason,
      MAX_REASON_LENGTH
    );

  if (
    !orderId ||
    !reason
  ) {
    return {
      success:
        false,

      message:
        "Order id and cancellation reason are required.",

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  const session =
    await mongoose.startSession();

  try {
    let result:
      InternalExecutionResult = {
      success:
        false,

      message:
        "Unable to cancel order.",

      targetType:
        "order",

      targetId:
        orderId,
    };

    await session.withTransaction(
      async () => {
        const order:
          any =
          await Order.findById(
            orderId
          ).session(
            session
          );

        if (
          !order
        ) {
          result = {
            success:
              false,

            message:
              "Order not found.",

            targetType:
              "order",

            targetId:
              orderId,
          };

          return;
        }

        const currentStatus =
          cleanString(
            order.orderStatus,
            100
          );

        if (
          currentStatus ===
          "Cancelled"
        ) {
          result = {
            success:
              true,

            message:
              "Order is already cancelled.",

            targetType:
              "order",

            targetId:
              orderId,

            targetLabel:
              `Order ${orderId}`,

            data:
              serializeOrder(
                order.toObject()
              ),
          };

          return;
        }

        if (
          ![
            "Placed",
            "Confirmed",
            "Packed",
          ].includes(
            currentStatus
          )
        ) {
          result = {
            success:
              false,

            message:
              `Order cannot be cancelled from ${currentStatus} status.`,

            targetType:
              "order",

            targetId:
              orderId,
          };

          return;
        }

        const before = {
          orderStatus:
            currentStatus,
        };

        /*
        |--------------------------------------------------------------------------
        | RESTOCK ORDER ITEMS
        |--------------------------------------------------------------------------
        */

        for (
          const item of
          Array.isArray(
            order.items
          )
            ? order.items
            : []
        ) {
          const productId =
            item.product?._id ||
            item.product;

          const quantity =
            Math.max(
              0,
              safeInteger(
                item.quantity
              )
            );

          if (
            productId &&
            quantity >
              0 &&
            mongoose.Types.ObjectId.isValid(
              String(
                productId
              )
            )
          ) {
            await Product.updateOne(
              {
                _id:
                  productId,
              },
              {
                $inc: {
                  stock:
                    quantity,
                },
              },
              {
                session,
              }
            );
          }
        }

        order.orderStatus =
          "Cancelled";

        if (
          Array.isArray(
            order.deliveryHistory
          )
        ) {
          order.deliveryHistory.push(
            {
              status:
                "Cancelled",

              date:
                new Date(),

              note:
                reason,
            }
          );
        }

        await order.save(
          {
            session,
          }
        );

        result = {
          success:
            true,

          message:
            "Order cancelled successfully.",

          targetType:
            "order",

          targetId:
            orderId,

          targetLabel:
            `Order ${orderId}`,

          beforeState:
            before,

          afterState: {
            orderStatus:
              "Cancelled",

            cancellationReason:
              reason,
          },

          data:
            serializeOrder(
              order.toObject()
            ),
        };
      }
    );

    return result;
  } finally {
    await session.endSession();
  }
}

/*
|--------------------------------------------------------------------------
| RETURN ACTION
|--------------------------------------------------------------------------
*/

async function executeReturnDecision(
  args:
    Record<
      string,
      unknown
    >,
  approved:
    boolean
): Promise<
  InternalExecutionResult
> {
  const orderId =
    normalizeObjectId(
      args.orderId
    );

  const note =
    approved
      ? cleanString(
          args.note,
          MAX_NOTE_LENGTH
        )
      : cleanString(
          args.reason,
          MAX_REASON_LENGTH
        );

  if (
    !orderId
  ) {
    return {
      success:
        false,

      message:
        "Invalid order id.",

      targetType:
        "order",
    };
  }

  if (
    !approved &&
    !note
  ) {
    return {
      success:
        false,

      message:
        "Return rejection reason is required.",

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  const order:
    any =
    await Order.findById(
      orderId
    );

  if (
    !order
  ) {
    return {
      success:
        false,

      message:
        "Order not found.",

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  if (
    order.orderStatus !==
      "Return Requested"
  ) {
    return {
      success:
        false,

      message:
        "This order does not currently have an active return request.",

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  const before = {
    orderStatus:
      order.orderStatus,

    returnRequest:
      order.returnRequest
        ? JSON.parse(
            JSON.stringify(
              order.returnRequest
            )
          )
        : null,
  };

  if (
    !order.returnRequest ||
    typeof order.returnRequest !==
      "object"
  ) {
    order.returnRequest =
      {};
  }

  order.returnRequest.status =
    approved
      ? "Approved"
      : "Rejected";

  if (
    approved
  ) {
    order.returnRequest.approvedAt =
      new Date();

    if (
      note
    ) {
      order.returnRequest.adminNote =
        note;
    }
  } else {
    order.returnRequest.rejectedAt =
      new Date();

    order.returnRequest.adminNote =
      note;
  }

  await order.save();

  return {
    success:
      true,

    message:
      approved
        ? "Return request approved successfully."
        : "Return request rejected successfully.",

    targetType:
      "order",

    targetId:
      orderId,

    targetLabel:
      `Order ${orderId}`,

    beforeState:
      before,

    afterState: {
      orderStatus:
        order.orderStatus,

      returnRequest:
        order.returnRequest,
    },

    data:
      serializeOrder(
        order.toObject()
      ),
  };
}

/*
|--------------------------------------------------------------------------
| EXCHANGE ACTION
|--------------------------------------------------------------------------
*/

async function executeExchangeDecision(
  args:
    Record<
      string,
      unknown
    >,
  approved:
    boolean
): Promise<
  InternalExecutionResult
> {
  const orderId =
    normalizeObjectId(
      args.orderId
    );

  const note =
    approved
      ? cleanString(
          args.note,
          MAX_NOTE_LENGTH
        )
      : cleanString(
          args.reason,
          MAX_REASON_LENGTH
        );

  if (
    !orderId
  ) {
    return {
      success:
        false,

      message:
        "Invalid order id.",

      targetType:
        "order",
    };
  }

  if (
    !approved &&
    !note
  ) {
    return {
      success:
        false,

      message:
        "Exchange rejection reason is required.",

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  const order:
    any =
    await Order.findById(
      orderId
    );

  if (
    !order
  ) {
    return {
      success:
        false,

      message:
        "Order not found.",

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  if (
    order.orderStatus !==
      "Exchange Requested"
  ) {
    return {
      success:
        false,

      message:
        "This order does not currently have an active exchange request.",

      targetType:
        "order",

      targetId:
        orderId,
    };
  }

  const before = {
    orderStatus:
      order.orderStatus,

    exchangeRequest:
      order.exchangeRequest
        ? JSON.parse(
            JSON.stringify(
              order.exchangeRequest
            )
          )
        : null,
  };

  if (
    !order.exchangeRequest ||
    typeof order.exchangeRequest !==
      "object"
  ) {
    order.exchangeRequest =
      {};
  }

  order.exchangeRequest.status =
    approved
      ? "Approved"
      : "Rejected";

  if (
    approved
  ) {
    order.exchangeRequest.approvedAt =
      new Date();

    if (
      note
    ) {
      order.exchangeRequest.adminNote =
        note;
    }
  } else {
    order.exchangeRequest.rejectedAt =
      new Date();

    order.exchangeRequest.adminNote =
      note;
  }

  await order.save();

  return {
    success:
      true,

    message:
      approved
        ? "Exchange request approved successfully."
        : "Exchange request rejected successfully.",

    targetType:
      "order",

    targetId:
      orderId,

    targetLabel:
      `Order ${orderId}`,

    beforeState:
      before,

    afterState: {
      orderStatus:
        order.orderStatus,

      exchangeRequest:
        order.exchangeRequest,
    },

    data:
      serializeOrder(
        order.toObject()
      ),
  };
}

/*
|--------------------------------------------------------------------------
| SEARCH CUSTOMERS
|--------------------------------------------------------------------------
*/

async function executeSearchCustomers(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const search =
    cleanString(
      args.search
    );

  const limit =
    normalizeLimit(
      args.limit
    );

  if (
    !search
  ) {
    return {
      success:
        false,

      message:
        "Customer search text is required.",

      targetType:
        "customer",
    };
  }

  const regex = {
    $regex:
      regexEscape(
        search
      ),

    $options:
      "i",
  };

  const customers:
    any[] =
    await User.find(
      {
        role:
          "user",

        $or: [
          {
            name:
              regex,
          },
          {
            email:
              regex,
          },
          {
            mobile:
              regex,
          },
        ],
      }
    )
      .select(
        [
          "_id",
          "name",
          "mobile",
          "email",
          "role",
          "isVerified",
          "isBlocked",
          "lastLogin",
          "createdAt",
          "updatedAt",
        ].join(
          " "
        )
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

  return {
    success:
      true,

    message:
      `${customers.length} customer(s) found.`,

    targetType:
      "customer",

    targetLabel:
      "customer search",

    data:
      customers.map(
        serializeCustomer
      ),
  };
}

/*
|--------------------------------------------------------------------------
| GET CUSTOMER
|--------------------------------------------------------------------------
*/

async function executeGetCustomer(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const customerId =
    normalizeObjectId(
      args.customerId
    );

  if (
    !customerId
  ) {
    return {
      success:
        false,

      message:
        "Invalid customer id.",

      targetType:
        "customer",
    };
  }

  const customer =
    await User.findOne(
      {
        _id:
          customerId,

        role:
          "user",
      }
    )
      .select(
        [
          "_id",
          "name",
          "mobile",
          "email",
          "role",
          "isVerified",
          "isBlocked",
          "lastLogin",
          "createdAt",
          "updatedAt",
        ].join(
          " "
        )
      )
      .lean();

  if (
    !customer
  ) {
    return {
      success:
        false,

      message:
        "Customer not found.",

      targetType:
        "customer",

      targetId:
        customerId,
    };
  }

  const orderStats:
    any[] =
    await Order.aggregate(
      [
        {
          $match: {
            user:
              new mongoose.Types.ObjectId(
                customerId
              ),
          },
        },
        {
          $group: {
            _id:
              null,

            totalOrders: {
              $sum:
                1,
            },

            deliveredOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "Delivered",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            cancelledOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "Cancelled",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]
    );

  return {
    success:
      true,

    message:
      "Customer loaded successfully.",

    targetType:
      "customer",

    targetId:
      customerId,

    targetLabel:
      cleanString(
        (customer as any).name,
        300
      ),

    data: {
      customer:
        serializeCustomer(
          customer
        ),

      orderSummary:
        orderStats[0] || {
          totalOrders:
            0,

          deliveredOrders:
            0,

          cancelledOrders:
            0,
        },
    },
  };
}

/*
|--------------------------------------------------------------------------
| DATE RANGE
|--------------------------------------------------------------------------
*/

function parseDateRange(
  fromDate:
    unknown,
  toDate:
    unknown
) {
  const fromRaw =
    cleanString(
      fromDate,
      10
    );

  const toRaw =
    cleanString(
      toDate,
      10
    );

  const pattern =
    /^\d{4}-\d{2}-\d{2}$/;

  if (
    !pattern.test(
      fromRaw
    ) ||
    !pattern.test(
      toRaw
    )
  ) {
    return null;
  }

  const from =
    new Date(
      `${fromRaw}T00:00:00.000Z`
    );

  const to =
    new Date(
      `${toRaw}T23:59:59.999Z`
    );

  if (
    Number.isNaN(
      from.getTime()
    ) ||
    Number.isNaN(
      to.getTime()
    ) ||
    from >
      to
  ) {
    return null;
  }

  return {
    from,
    to,
  };
}

/*
|--------------------------------------------------------------------------
| SALES REPORT
|--------------------------------------------------------------------------
*/

async function executeSalesReport(
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  const range =
    parseDateRange(
      args.fromDate,
      args.toDate
    );

  if (
    !range
  ) {
    return {
      success:
        false,

      message:
        "Invalid sales report date range.",

      targetType:
        "report",
    };
  }

  const rows:
    any[] =
    await Order.aggregate(
      [
        {
          $match: {
            createdAt: {
              $gte:
                range.from,

              $lte:
                range.to,
            },
          },
        },

        {
          $addFields: {
            calculatedOrderValue: {
              $ifNull: [
                "$totalAmount",
                {
                  $ifNull: [
                    "$grandTotal",
                    {
                      $ifNull: [
                        "$total",
                        {
                          $sum: {
                            $map: {
                              input: {
                                $ifNull: [
                                  "$items",
                                  [],
                                ],
                              },

                              as:
                                "item",

                              in: {
                                $multiply: [
                                  {
                                    $ifNull: [
                                      "$$item.price",
                                      0,
                                    ],
                                  },
                                  {
                                    $ifNull: [
                                      "$$item.quantity",
                                      0,
                                    ],
                                  },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },

        {
          $group: {
            _id:
              null,

            totalOrders: {
              $sum:
                1,
            },

            deliveredOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "Delivered",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            cancelledOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "Cancelled",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            returnedOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "Returned",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            refundedOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "Refunded",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            grossOrderValue: {
              $sum:
                "$calculatedOrderValue",
            },

            deliveredRevenue: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "Delivered",
                    ],
                  },
                  "$calculatedOrderValue",
                  0,
                ],
              },
            },
          },
        },
      ]
    );

  const byStatus =
    await Order.aggregate(
      [
        {
          $match: {
            createdAt: {
              $gte:
                range.from,

              $lte:
                range.to,
            },
          },
        },

        {
          $group: {
            _id:
              "$orderStatus",

            count: {
              $sum:
                1,
            },
          },
        },

        {
          $sort: {
            count:
              -1,
          },
        },
      ]
    );

  const summary =
    rows[0] || {
      totalOrders:
        0,

      deliveredOrders:
        0,

      cancelledOrders:
        0,

      returnedOrders:
        0,

      refundedOrders:
        0,

      grossOrderValue:
        0,

      deliveredRevenue:
        0,
    };

  return {
    success:
      true,

    message:
      "Sales report generated successfully.",

    targetType:
      "report",

    targetLabel:
      `${cleanString(
        args.fromDate,
        10
      )} to ${cleanString(
        args.toDate,
        10
      )}`,

    data: {
      from:
        range.from,

      to:
        range.to,

      summary,

      byStatus:
        byStatus.map(
          (
            item:
              any
          ) => ({
            status:
              cleanString(
                item._id,
                100
              ),

            count:
              safeInteger(
                item.count
              ),
          })
        ),
    },
  };
}

/*
|--------------------------------------------------------------------------
| INTERNAL EXECUTOR
|--------------------------------------------------------------------------
*/

async function executeToolInternally(
  toolName:
    AdminAIToolName,
  args:
    Record<
      string,
      unknown
    >
): Promise<
  InternalExecutionResult
> {
  switch (
    toolName
  ) {
    /*
    |--------------------------------------------------------------------------
    | BUSINESS
    |--------------------------------------------------------------------------
    */

    case "get_business_intelligence":
      return executeBusinessIntelligence(
        args
      );

    case "get_dashboard_summary":
      return executeDashboardSummary(
        args
      );

    case "get_demand_trends":
      return executeDemandTrends(
        args
      );

    case "get_restock_recommendations":
      return executeRestockRecommendations(
        args
      );

    case "get_conversion_opportunities":
      return executeConversionOpportunities(
        args
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCTS
    |--------------------------------------------------------------------------
    */

    case "search_admin_products":
      return executeSearchProducts(
        args
      );

    case "get_admin_product":
      return executeGetProduct(
        args
      );

    case "create_product_draft":
      return executeCreateProductDraft(
        args
      );

    case "update_product":
      return executeUpdateProduct(
        args
      );

    case "update_product_status":
      return executeUpdateProductStatus(
        args
      );

    case "update_product_stock":
      return executeUpdateProductStock(
        args
      );

    case "update_product_price":
      return executeUpdateProductPrice(
        args
      );

    /*
    |--------------------------------------------------------------------------
    | ORDERS
    |--------------------------------------------------------------------------
    */

    case "search_admin_orders":
      return executeSearchOrders(
        args
      );

    case "get_admin_order":
      return executeGetOrder(
        args
      );

    case "update_admin_order_status":
      return executeUpdateOrderStatus(
        args
      );

    case "cancel_admin_order":
      return executeCancelOrder(
        args
      );

    case "approve_admin_return":
      return executeReturnDecision(
        args,
        true
      );

    case "reject_admin_return":
      return executeReturnDecision(
        args,
        false
      );

    case "approve_admin_exchange":
      return executeExchangeDecision(
        args,
        true
      );

    case "reject_admin_exchange":
      return executeExchangeDecision(
        args,
        false
      );

    /*
    |--------------------------------------------------------------------------
    | CUSTOMERS
    |--------------------------------------------------------------------------
    */

    case "search_admin_customers":
      return executeSearchCustomers(
        args
      );

    case "get_admin_customer":
      return executeGetCustomer(
        args
      );

    /*
    |--------------------------------------------------------------------------
    | REPORT
    |--------------------------------------------------------------------------
    */

    case "get_sales_report":
      return executeSalesReport(
        args
      );

    default:
      return {
        success:
          false,

        message:
          "Unsupported Admin AI tool.",

        targetType:
          "none",
      };
  }
}

/*
|--------------------------------------------------------------------------
| EXECUTE ADMIN AI TOOL
|--------------------------------------------------------------------------
|
| Main entry point for AI-generated tool calls.
|
|--------------------------------------------------------------------------
*/

export async function executeAdminAITool(
  input:
    ExecuteAdminAIToolInput
): Promise<
  AdminAIToolExecutionResult
> {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | ADMIN VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(
        input.context.adminId
      )
    ) {
      return {
        success:
          false,

        message:
          "Invalid authenticated admin id.",
      };
    }

    if (
      !isAdminRole(
        input.context.adminRole
      )
    ) {
      return {
        success:
          false,

        message:
          "Invalid authenticated admin role.",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | TOOL VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !isAdminAIToolName(
        input.toolName
      )
    ) {
      return {
        success:
          false,

        message:
          "Unsupported Admin AI tool.",
      };
    }

    const toolName =
      input.toolName;

    const action =
      ADMIN_TOOL_ACTION_MAP[
        toolName
      ];

    const args =
      safeObject(
        input.args
      );

    /*
    |--------------------------------------------------------------------------
    | PERMISSION
    |--------------------------------------------------------------------------
    */

    const permission =
      checkAdminPermission(
        input.context.adminRole,
        action
      );

    if (
      !permission.allowed
    ) {
      const deniedLog =
        await createActionLog(
          {
            context:
              input.context,

            toolName,

            action,

            args,

            status:
              "rejected",

            roleAuthorized:
              false,
          }
        );

      await AdminAIActionLog.updateOne(
        {
          _id:
            deniedLog._id,
        },
        {
          $set: {
            errorMessage:
              permission.reason,

            rejectedAt:
              new Date(),
          },
        }
      );

      return {
        success:
          false,

        toolName,

        action,

        message:
          permission.reason,

        actionLogId:
          String(
            deniedLog._id
          ),
      };
    }

    /*
    |--------------------------------------------------------------------------
    | HIGH-RISK CONFIRMATION
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Do NOT execute now.
    |
    | Store the exact tool name + exact arguments.
    |
    |--------------------------------------------------------------------------
    */

    if (
      permission.requiresConfirmation
    ) {
      const pendingLog =
        await createActionLog(
          {
            context:
              input.context,

            toolName,

            action,

            args,

            status:
              "requested",

            roleAuthorized:
              true,
          }
        );

      return {
        success:
          true,

        toolName,

        action,

        requiresConfirmation:
          true,

        confirmationRequired:
          true,

        actionLogId:
          String(
            pendingLog._id
          ),

        message:
          "This admin action requires explicit confirmation before execution.",

        data: {
          actionLogId:
            String(
              pendingLog._id
            ),

          toolName,

          action,

          arguments:
            args,

          expiresInMinutes:
            Math.floor(
              CONFIRMATION_MAX_AGE_MS /
              60_000
            ),
        },
      };
    }

    /*
    |--------------------------------------------------------------------------
    | NON-CONFIRMATION ACTION
    |--------------------------------------------------------------------------
    */

    const actionLog =
      await createActionLog(
        {
          context:
            input.context,

          toolName,

          action,

          args,

          status:
            "authorized",

          roleAuthorized:
            true,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | EXECUTE
    |--------------------------------------------------------------------------
    */

    const result =
      await executeToolInternally(
        toolName,
        args
      );

    await finishActionLog(
      {
        actionLogId:
          String(
            actionLog._id
          ),

        result,
      }
    );

    return {
      success:
        result.success,

      toolName,

      action,

      requiresConfirmation:
        false,

      confirmationRequired:
        false,

      actionLogId:
        String(
          actionLog._id
        ),

      message:
        result.message,

      data:
        result.data,

      error:
        result.success
          ? undefined
          : result.message,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI tool execution error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to execute Admin AI tool.",

      error:
        error instanceof
          Error
          ? error.message
          : "Unknown Admin AI tool execution error.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| CONFIRM AND EXECUTE
|--------------------------------------------------------------------------
|
| Critical security function.
|
| Rules:
|
| - actionLogId must belong to authenticated admin
| - same role must still be authorized
| - status must still be requested
| - confirmation cannot be older than 30 minutes
| - atomic findOneAndUpdate claims it once
| - exact STORED arguments are used
| - caller cannot replace arguments during confirmation
|
|--------------------------------------------------------------------------
*/

export async function confirmAndExecuteAdminAIAction(
  input:
    ConfirmAdminAIActionInput
): Promise<
  AdminAIToolExecutionResult
> {
  try {
    await connectDB();

    if (
      !mongoose.Types.ObjectId.isValid(
        input.adminId
      ) ||
      !mongoose.Types.ObjectId.isValid(
        input.actionLogId
      ) ||
      !isAdminRole(
        input.adminRole
      )
    ) {
      return {
        success:
          false,

        message:
          "Invalid confirmation request.",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | READ PENDING ACTION FIRST
    |--------------------------------------------------------------------------
    */

    const pending:
      any =
      await AdminAIActionLog.findOne(
        {
          _id:
            input.actionLogId,

          adminId:
            input.adminId,

          requiresConfirmation:
            true,

          confirmedByAdmin:
            false,

          status:
            "requested",
        }
      ).lean();

    if (
      !pending
    ) {
      return {
        success:
          false,

        message:
          "Pending Admin AI confirmation was not found or has already been used.",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | TOOL VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !isAdminAIToolName(
        pending.toolName
      )
    ) {
      await AdminAIActionLog.updateOne(
        {
          _id:
            pending._id,
        },
        {
          $set: {
            status:
              "failed",

            errorMessage:
              "Stored Admin AI tool is invalid.",
          },
        }
      );

      return {
        success:
          false,

        message:
          "Stored Admin AI action is invalid.",
      };
    }

    const toolName:
      AdminAIToolName =
      pending.toolName;

    const action =
      ADMIN_TOOL_ACTION_MAP[
        toolName
      ];

    /*
    |--------------------------------------------------------------------------
    | ACTION MUST STILL MATCH
    |--------------------------------------------------------------------------
    */

    if (
      pending.action !==
      action
    ) {
      await AdminAIActionLog.updateOne(
        {
          _id:
            pending._id,
        },
        {
          $set: {
            status:
              "failed",

            errorMessage:
              "Stored action/tool security mapping mismatch.",
          },
        }
      );

      return {
        success:
          false,

        toolName,

        action,

        message:
          "Admin AI action security validation failed.",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE CHECK AGAIN
    |--------------------------------------------------------------------------
    */

    const permission =
      checkAdminPermission(
        input.adminRole,
        action
      );

    if (
      !permission.allowed
    ) {
      await AdminAIActionLog.updateOne(
        {
          _id:
            pending._id,
        },
        {
          $set: {
            status:
              "rejected",

            rejectedAt:
              new Date(),

            roleAuthorized:
              false,

            permissionCheckedAt:
              new Date(),

            errorMessage:
              permission.reason,
          },
        }
      );

      return {
        success:
          false,

        toolName,

        action,

        message:
          permission.reason,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | EXPIRY
    |--------------------------------------------------------------------------
    */

    const confirmationRequestedAt =
      pending.confirmationRequestedAt
        ? new Date(
            pending
              .confirmationRequestedAt
          )
        : null;

    if (
      !confirmationRequestedAt ||
      Number.isNaN(
        confirmationRequestedAt
          .getTime()
      ) ||
      Date.now() -
        confirmationRequestedAt.getTime() >
        CONFIRMATION_MAX_AGE_MS
    ) {
      await AdminAIActionLog.updateOne(
        {
          _id:
            pending._id,

          status:
            "requested",
        },
        {
          $set: {
            status:
              "expired",

            expiredAt:
              new Date(),

            confirmedByAdmin:
              false,
          },
        }
      );

      return {
        success:
          false,

        toolName,

        action,

        message:
          "Admin AI confirmation expired. Please request the action again.",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | ATOMIC ONE-TIME CLAIM
    |--------------------------------------------------------------------------
    |
    | Only one request can change:
    |
    | requested → authorized
    |
    |--------------------------------------------------------------------------
    */

    const claimed:
      any =
      await AdminAIActionLog.findOneAndUpdate(
        {
          _id:
            pending._id,

          adminId:
            input.adminId,

          status:
            "requested",

          confirmedByAdmin:
            false,

          requiresConfirmation:
            true,
        },
        {
          $set: {
            status:
              "authorized",

            confirmedByAdmin:
              true,

            confirmedAt:
              new Date(),

            roleAuthorized:
              true,

            permissionCheckedAt:
              new Date(),
          },
        },
        {
          new:
            true,
        }
      );

    if (
      !claimed
    ) {
      return {
        success:
          false,

        toolName,

        action,

        message:
          "This Admin AI action has already been confirmed, rejected, expired or claimed by another request.",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | EXECUTE EXACT STORED INPUT
    |--------------------------------------------------------------------------
    |
    | Never accept replacement args from confirmation request.
    |
    |--------------------------------------------------------------------------
    */

    const storedArgs =
      safeObject(
        claimed.input
      );

    let result:
      InternalExecutionResult;

    try {
      result =
        await executeToolInternally(
          toolName,
          storedArgs
        );
    } catch (
      error
    ) {
      result = {
        success:
          false,

        message:
          error instanceof
            Error
            ? error.message
            : "Confirmed Admin AI action failed.",

        targetType:
          claimed.targetType ||
          "none",

        targetId:
          claimed.targetId
            ? String(
                claimed.targetId
              )
            : null,

        targetLabel:
          claimed.targetLabel ||
          "",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Authorization remains consumed even if execution fails.
    |
    | Admin must explicitly request/confirm again for a retry.
    |
    |--------------------------------------------------------------------------
    */

    await finishActionLog(
      {
        actionLogId:
          String(
            claimed._id
          ),

        result,
      }
    );

    return {
      success:
        result.success,

      toolName,

      action,

      requiresConfirmation:
        true,

      confirmationRequired:
        false,

      actionLogId:
        String(
          claimed._id
        ),

      message:
        result.message,

      data:
        result.data,

      error:
        result.success
          ? undefined
          : result.message,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI confirmation execution error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to execute confirmed Admin AI action.",

      error:
        error instanceof
          Error
          ? error.message
          : "Unknown confirmation execution error.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| REJECT PENDING ACTION
|--------------------------------------------------------------------------
*/

export async function rejectAdminAIAction(
  input:
    RejectAdminAIActionInput
): Promise<
  AdminAIToolExecutionResult
> {
  try {
    await connectDB();

    if (
      !mongoose.Types.ObjectId.isValid(
        input.adminId
      ) ||
      !mongoose.Types.ObjectId.isValid(
        input.actionLogId
      ) ||
      !isAdminRole(
        input.adminRole
      )
    ) {
      return {
        success:
          false,

        message:
          "Invalid Admin AI rejection request.",
      };
    }

    const rejected:
      any =
      await AdminAIActionLog.findOneAndUpdate(
        {
          _id:
            input.actionLogId,

          adminId:
            input.adminId,

          status:
            "requested",

          requiresConfirmation:
            true,

          confirmedByAdmin:
            false,
        },
        {
          $set: {
            status:
              "rejected",

            rejectedAt:
              new Date(),

            confirmedByAdmin:
              false,
          },
        },
        {
          new:
            true,
        }
      );

    if (
      !rejected
    ) {
      return {
        success:
          false,

        message:
          "Pending Admin AI action was not found or can no longer be rejected.",
      };
    }

    return {
      success:
        true,

      toolName:
        isAdminAIToolName(
          rejected.toolName
        )
          ? rejected.toolName
          : undefined,

      action:
        rejected.action,

      actionLogId:
        String(
          rejected._id
        ),

      requiresConfirmation:
        true,

      confirmationRequired:
        false,

      message:
        "Admin AI action rejected. No change was made.",
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN Admin AI rejection error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to reject Admin AI action.",

      error:
        error instanceof
          Error
          ? error.message
          : "Unknown rejection error.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| GET PENDING CONFIRMATION
|--------------------------------------------------------------------------
*/

export async function getPendingAdminAIConfirmation({
  adminId,
  conversationId,
}: {
  adminId:
    string;

  conversationId?:
    string | null;
}) {
  try {
    await connectDB();

    if (
      !mongoose.Types.ObjectId.isValid(
        adminId
      )
    ) {
      return null;
    }

    const query:
      Record<
        string,
        unknown
      > = {
      adminId,

      requiresConfirmation:
        true,

      confirmedByAdmin:
        false,

      status:
        "requested",

      confirmationRequestedAt: {
        $gte:
          new Date(
            Date.now() -
              CONFIRMATION_MAX_AGE_MS
          ),
      },
    };

    if (
      conversationId &&
      mongoose.Types.ObjectId.isValid(
        conversationId
      )
    ) {
      query.conversationId =
        conversationId;
    }

    const pending:
      any =
      await AdminAIActionLog.findOne(
        query
      )
        .sort(
          {
            confirmationRequestedAt:
              -1,
          }
        )
        .lean();

    if (
      !pending
    ) {
      return null;
    }

    return {
      actionLogId:
        String(
          pending._id
        ),

      action:
        pending.action,

      toolName:
        pending.toolName,

      input:
        pending.input,

      targetType:
        pending.targetType,

      targetId:
        pending.targetId
          ? String(
              pending.targetId
            )
          : null,

      targetLabel:
        pending.targetLabel,

      confirmationRequestedAt:
        pending
          .confirmationRequestedAt,

      expiresAt:
        new Date(
          new Date(
            pending
              .confirmationRequestedAt
          ).getTime() +
            CONFIRMATION_MAX_AGE_MS
        ),
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN pending Admin AI confirmation lookup error:",
      error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| EXPIRE OLD CONFIRMATIONS
|--------------------------------------------------------------------------
*/

export async function expireOldAdminAIConfirmations() {
  try {
    await connectDB();

    const cutoff =
      new Date(
        Date.now() -
          CONFIRMATION_MAX_AGE_MS
      );

    const result =
      await AdminAIActionLog.updateMany(
        {
          requiresConfirmation:
            true,

          confirmedByAdmin:
            false,

          status:
            "requested",

          confirmationRequestedAt: {
            $lt:
              cutoff,
          },
        },
        {
          $set: {
            status:
              "expired",

            expiredAt:
              new Date(),
          },
        }
      );

    return {
      success:
        true,

      expiredCount:
        result.modifiedCount,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN old Admin AI confirmation expiry error:",
      error
    );

    return {
      success:
        false,

      expiredCount:
        0,
    };
  }
}