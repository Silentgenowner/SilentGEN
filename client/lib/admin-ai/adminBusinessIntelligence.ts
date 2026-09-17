import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import Product from "@/models/Product";
import Order from "@/models/Order";

import {
  getAdminDemandIntelligencePackage,
  type DemandSnapshotComparison,
  type ProductDemandTrend,
} from "@/lib/ai/learning/demandSnapshotService";

/*
|--------------------------------------------------------------------------
| SILENTGEN ADMIN BUSINESS INTELLIGENCE
|--------------------------------------------------------------------------
|
| Purpose:
|
| Give Admin AI a compact, reliable business intelligence layer based on:
|
| - customer behaviour
| - real Order DB business data
| - live inventory
| - historical demand
| - demand trends
| - conversion performance
| - returns / cancellations / exchanges
|
| IMPORTANT:
|
| This layer provides recommendations only.
|
| It must NOT directly:
|
| - change stock
| - change prices
| - discount products
| - delete products
| - cancel orders
|
| Those require separate admin tools + permissions + confirmation.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| PERIOD
|--------------------------------------------------------------------------
*/

export type AdminBusinessPeriod =
  | "daily"
  | "weekly"
  | "monthly";

/*
|--------------------------------------------------------------------------
| PRIORITY
|--------------------------------------------------------------------------
*/

export type AdminBusinessPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

/*
|--------------------------------------------------------------------------
| ACTION TYPE
|--------------------------------------------------------------------------
*/

export type AdminBusinessActionType =
  | "restock"
  | "reduce_purchase"
  | "promote"
  | "discount_review"
  | "price_review"
  | "product_content_review"
  | "size_stock_review"
  | "color_stock_review"
  | "category_focus"
  | "conversion_review"
  | "return_investigation"
  | "inventory_balance"
  | "watch"
  | "no_action";

/*
|--------------------------------------------------------------------------
| ADMIN RECOMMENDATION
|--------------------------------------------------------------------------
*/

export type AdminBusinessRecommendation = {
  id:
    string;

  priority:
    AdminBusinessPriority;

  actionType:
    AdminBusinessActionType;

  title:
    string;

  message:
    string;

  reason:
    string;

  expectedImpact:
    string;

  productId?:
    string | null;

  productName?:
    string;

  sku?:
    string;

  category?:
    string;

  size?:
    string;

  color?:
    string;

  demandScore?:
    number;

  opportunityScore?:
    number;

  riskScore?:
    number;

  currentStock?:
    number;

  suggestedAction:
    string;

  requiresHumanReview:
    boolean;
};

/*
|--------------------------------------------------------------------------
| LIVE PRODUCT
|--------------------------------------------------------------------------
*/

export type AdminLiveProductContext = {
  productId:
    string;

  name:
    string;

  sku:
    string;

  category:
    string;

  subCategory:
    string;

  brand:
    string;

  gender:
    string;

  price:
    number;

  mrp:
    number;

  discount:
    number;

  stock:
    number;

  lowStockLimit:
    number;

  sold:
    number;

  status:
    string;

  sizes:
    string[];

  colors:
    string[];

  featured:
    boolean;

  bestSeller:
    boolean;

  trending:
    boolean;

  newArrival:
    boolean;
};

/*
|--------------------------------------------------------------------------
| DATA SOURCE STATUS
|--------------------------------------------------------------------------
*/

export type AdminBusinessDataSourceStatus =
  | "available"
  | "unavailable";

/*
|--------------------------------------------------------------------------
| RESULT
|--------------------------------------------------------------------------
*/

export type AdminBusinessIntelligenceResult = {
  success:
    boolean;

  message:
    string;

  period:
    AdminBusinessPeriod;

  generatedAt:
    Date;

  staleData:
    boolean;

  dataSources: {
    customerBehaviour:
      AdminBusinessDataSourceStatus;

    orders:
      AdminBusinessDataSourceStatus;
  };

  summary: {
    /*
    |--------------------------------------------------------------------------
    | CUSTOMER BEHAVIOUR
    |--------------------------------------------------------------------------
    */

    totalEvents:
      number;

    views:
      number;

    cartAdds:
      number;

    wishlistAdds:
      number;

    searches:
      number;

    /*
    |--------------------------------------------------------------------------
    | REAL ORDER DB
    |--------------------------------------------------------------------------
    |
    | purchases = number of real orders placed in the selected period.
    |
    | unitsPurchased = total quantity of order items placed in that period.
    |
    | revenue = operational net order value for orders from that period,
    | excluding orders whose CURRENT status is Cancelled or Refunded.
    |
    | grossOrderValue = all order value created in the period before excluding
    | cancellations / refunded orders.
    |
    | paidRevenue = value of currently Paid orders that are not Cancelled or
    | Refunded.
    |
    |--------------------------------------------------------------------------
    */

    purchases:
      number;

    ordersPlaced:
      number;

    unitsPurchased:
      number;

    revenue:
      number;

    grossOrderValue:
      number;

    paidRevenue:
      number;

    averageOrderValue:
      number;

    returns:
      number;

    cancellations:
      number;

    exchanges:
      number;

    cancelledOrderValue:
      number;

    /*
    |--------------------------------------------------------------------------
    | CROSS-SOURCE CONVERSION
    |--------------------------------------------------------------------------
    */

    viewToPurchaseRate:
      number;

    cartToPurchaseRate:
      number;
  };

  salesTrend: {
    purchasesChange:
      number;

    purchasesDirection:
      string;

    revenueChange:
      number;

    revenueDirection:
      string;

    cancellationsChange:
      number;

    cancellationsDirection:
      string;

    returnsChange:
      number;

    returnsDirection:
      string;

    exchangesChange:
      number;

    exchangesDirection:
      string;

    viewsChange:
      number;

    viewsDirection:
      string;

    cartAddsChange:
      number;

    cartAddsDirection:
      string;

    conversionChange:
      number;

    conversionDirection:
      string;
  };

  topDemandProducts:
    any[];

  risingProducts:
    ProductDemandTrend[];

  fallingProducts:
    ProductDemandTrend[];

  urgentRestock:
    any[];

  slowMovingProducts:
    any[];

  conversionOpportunities:
    any[];

  returnRiskProducts:
    any[];

  topCategories:
    any[];

  topColors:
    any[];

  topSizes:
    any[];

  recommendations:
    AdminBusinessRecommendation[];
};

/*
|--------------------------------------------------------------------------
| REAL ORDER METRICS
|--------------------------------------------------------------------------
*/

type AdminOrderMetrics = {
  ordersPlaced:
    number;

  unitsPurchased:
    number;

  grossOrderValue:
    number;

  revenue:
    number;

  paidRevenue:
    number;

  averageOrderValue:
    number;

  cancellations:
    number;

  cancelledOrderValue:
    number;

  returns:
    number;

  exchanges:
    number;
};

type AdminOrderIntelligence = {
  current:
    AdminOrderMetrics;

  previous:
    AdminOrderMetrics;

  currentStart:
    Date;

  currentEnd:
    Date;

  previousStart:
    Date;

  previousEnd:
    Date;
};

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_RECOMMENDATIONS =
  50;

const MAX_PRODUCT_CONTEXT =
  100;

const HIGH_STOCK_THRESHOLD =
  40;

const LOW_CONVERSION_RATE =
  2;

const HIGH_RETURN_RATE =
  20;

/*
|--------------------------------------------------------------------------
| NUMBER
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| INTEGER
|--------------------------------------------------------------------------
*/

function safeInteger(
  value:
    unknown
) {
  return Math.max(
    0,
    Math.floor(
      safeNumber(
        value
      )
    )
  );
}

/*
|--------------------------------------------------------------------------
| STRING
|--------------------------------------------------------------------------
*/

function cleanString(
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
    .replace(
      /\s+/g,
      " "
    );
}

/*
|--------------------------------------------------------------------------
| STRING ARRAY
|--------------------------------------------------------------------------
*/

function stringArray(
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

  return value
    .map(
      (
        item
      ) =>
        cleanString(
          item
        )
    )
    .filter(
      Boolean
    );
}

/*
|--------------------------------------------------------------------------
| RECOMMENDATION ID
|--------------------------------------------------------------------------
*/

function createRecommendationId(
  prefix:
    string,
  value?:
    unknown
) {
  const suffix =
    String(
      value ||
      new mongoose.Types.ObjectId()
    )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        ""
      )
      .slice(
        0,
        60
      );

  return `${prefix}_${suffix}`;
}

/*
|--------------------------------------------------------------------------
| PRIORITY SCORE
|--------------------------------------------------------------------------
*/

function priorityWeight(
  priority:
    AdminBusinessPriority
) {
  switch (
    priority
  ) {
    case "critical":
      return 4;

    case "high":
      return 3;

    case "medium":
      return 2;

    case "low":
    default:
      return 1;
  }
}

/*
|--------------------------------------------------------------------------
| PERIOD
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| EMPTY ORDER METRICS
|--------------------------------------------------------------------------
*/

function emptyOrderMetrics():
  AdminOrderMetrics {
  return {
    ordersPlaced:
      0,

    unitsPurchased:
      0,

    grossOrderValue:
      0,

    revenue:
      0,

    paidRevenue:
      0,

    averageOrderValue:
      0,

    cancellations:
      0,

    cancelledOrderValue:
      0,

    returns:
      0,

    exchanges:
      0,
  };
}

/*
|--------------------------------------------------------------------------
| PERIOD DAYS
|--------------------------------------------------------------------------
|
| These windows intentionally use rolling periods:
|
| daily   = last 1 day
| weekly  = last 7 days
| monthly = last 30 days
|
| The previous comparison window has the exact same duration.
|
|--------------------------------------------------------------------------
*/

function getPeriodDays(
  period:
    AdminBusinessPeriod
) {
  switch (
    period
  ) {
    case "daily":
      return 1;

    case "monthly":
      return 30;

    case "weekly":
    default:
      return 7;
  }
}

/*
|--------------------------------------------------------------------------
| PERIOD RANGE
|--------------------------------------------------------------------------
*/

function getOrderPeriodRange(
  period:
    AdminBusinessPeriod
) {
  const currentEnd =
    new Date();

  const durationMs =
    getPeriodDays(
      period
    ) *
    24 *
    60 *
    60 *
    1000;

  const currentStart =
    new Date(
      currentEnd.getTime() -
        durationMs
    );

  const previousEnd =
    new Date(
      currentStart
    );

  const previousStart =
    new Date(
      previousEnd.getTime() -
        durationMs
    );

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
}

/*
|--------------------------------------------------------------------------
| RATE
|--------------------------------------------------------------------------
*/

function percentageRate(
  numerator:
    unknown,
  denominator:
    unknown
) {
  const top =
    safeNumber(
      numerator
    );

  const bottom =
    safeNumber(
      denominator
    );

  if (
    bottom <= 0
  ) {
    return 0;
  }

  return Number(
    (
      (
        top /
        bottom
      ) *
      100
    ).toFixed(
      2
    )
  );
}

/*
|--------------------------------------------------------------------------
| PERCENTAGE CHANGE
|--------------------------------------------------------------------------
*/

function calculatePercentageChange(
  current:
    unknown,
  previous:
    unknown
) {
  const currentValue =
    safeNumber(
      current
    );

  const previousValue =
    safeNumber(
      previous
    );

  if (
    previousValue ===
    0
  ) {
    if (
      currentValue ===
      0
    ) {
      return 0;
    }

    return 100;
  }

  return Number(
    (
      (
        (
          currentValue -
          previousValue
        ) /
        Math.abs(
          previousValue
        )
      ) *
      100
    ).toFixed(
      2
    )
  );
}

/*
|--------------------------------------------------------------------------
| TREND DIRECTION
|--------------------------------------------------------------------------
*/

function getTrendDirection(
  current:
    unknown,
  previous:
    unknown
) {
  const currentValue =
    safeNumber(
      current
    );

  const previousValue =
    safeNumber(
      previous
    );

  if (
    currentValue >
    previousValue
  ) {
    return "up";
  }

  if (
    currentValue <
    previousValue
  ) {
    return "down";
  }

  return "flat";
}
/*
|--------------------------------------------------------------------------
| MONEY
|--------------------------------------------------------------------------
*/

function roundMoney(
  value:
    unknown
) {
  return Number(
    Math.max(
      0,
      safeNumber(
        value
      )
    ).toFixed(
      2
    )
  );
}

/*
|--------------------------------------------------------------------------
| REAL CREATED ORDER METRICS
|--------------------------------------------------------------------------
|
| Source of truth:
|
| MongoDB Order collection.
|
| Period ownership:
|
| createdAt
|
| This gives:
|
| - orders placed
| - units purchased
| - gross order value
| - operational revenue
| - paid revenue
| - average order value
|
|--------------------------------------------------------------------------
*/

async function getCreatedOrderMetrics(
  start:
    Date,
  end:
    Date
) {
  const rows:
    any[] =
    await Order.aggregate(
      [
        /*
        |--------------------------------------------------------------------------
        | ORDERS CREATED IN PERIOD
        |--------------------------------------------------------------------------
        */

        {
          $match: {
            createdAt: {
              $gte:
                start,

              $lt:
                end,
            },
          },
        },

        /*
        |--------------------------------------------------------------------------
        | ORDER QUANTITY
        |--------------------------------------------------------------------------
        */

        {
          $addFields: {
            intelligenceUnitCount: {
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
                    $convert: {
                      input:
                        "$$item.quantity",

                      to:
                        "double",

                      onError:
                        0,

                      onNull:
                        0,
                    },
                  },
                },
              },
            },

            intelligenceTotalAmount: {
              $convert: {
                input:
                  "$totalAmount",

                to:
                  "double",

                onError:
                  0,

                onNull:
                  0,
              },
            },
          },
        },

        /*
        |--------------------------------------------------------------------------
        | GROUP
        |--------------------------------------------------------------------------
        */

        {
          $group: {
            _id:
              null,

            /*
            |--------------------------------------------------------------------------
            | ALL REAL ORDERS PLACED
            |--------------------------------------------------------------------------
            */

            ordersPlaced: {
              $sum:
                1,
            },

            unitsPurchased: {
              $sum:
                "$intelligenceUnitCount",
            },

            /*
            |--------------------------------------------------------------------------
            | GROSS ORDER VALUE
            |--------------------------------------------------------------------------
            |
            | Includes orders that were later cancelled/refunded.
            |
            |--------------------------------------------------------------------------
            */

            grossOrderValue: {
              $sum:
                "$intelligenceTotalAmount",
            },

            /*
            |--------------------------------------------------------------------------
            | OPERATIONAL REVENUE
            |--------------------------------------------------------------------------
            |
            | Excludes orders whose CURRENT status is:
            |
            | Cancelled
            | Refunded
            |
            | COD Pending orders may still count as operational sales because the
            | order is commercially active.
            |
            |--------------------------------------------------------------------------
            */

            revenue: {
              $sum: {
                $cond: [
                  {
                    $not: [
                      {
                        $in: [
                          "$orderStatus",
                          [
                            "Cancelled",
                            "Refunded",
                          ],
                        ],
                      },
                    ],
                  },

                  "$intelligenceTotalAmount",

                  0,
                ],
              },
            },

            /*
            |--------------------------------------------------------------------------
            | PAID REVENUE
            |--------------------------------------------------------------------------
            */

            paidRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [
                          "$paymentStatus",
                          "Paid",
                        ],
                      },

                      {
                        $not: [
                          {
                            $in: [
                              "$orderStatus",
                              [
                                "Cancelled",
                                "Refunded",
                              ],
                            ],
                          },
                        ],
                      },
                    ],
                  },

                  "$intelligenceTotalAmount",

                  0,
                ],
              },
            },

            /*
            |--------------------------------------------------------------------------
            | ACTIVE REVENUE ORDER COUNT
            |--------------------------------------------------------------------------
            |
            | Used only for average order value.
            |
            |--------------------------------------------------------------------------
            */

            revenueOrderCount: {
              $sum: {
                $cond: [
                  {
                    $not: [
                      {
                        $in: [
                          "$orderStatus",
                          [
                            "Cancelled",
                            "Refunded",
                          ],
                        ],
                      },
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

  const row =
    rows[0] ||
    {};

  const ordersPlaced =
    safeInteger(
      row.ordersPlaced
    );

  const unitsPurchased =
    safeInteger(
      row.unitsPurchased
    );

  const grossOrderValue =
    roundMoney(
      row.grossOrderValue
    );

  const revenue =
    roundMoney(
      row.revenue
    );

  const paidRevenue =
    roundMoney(
      row.paidRevenue
    );

  const revenueOrderCount =
    safeInteger(
      row.revenueOrderCount
    );

  const averageOrderValue =
    revenueOrderCount >
    0
      ? roundMoney(
          revenue /
            revenueOrderCount
        )
      : 0;

  return {
    ordersPlaced,

    unitsPurchased,

    grossOrderValue,

    revenue,

    paidRevenue,

    averageOrderValue,
  };
}

/*
|--------------------------------------------------------------------------
| REAL CANCELLATION METRICS
|--------------------------------------------------------------------------
|
| Cancellation belongs to cancelledAt.
|
| This is deliberately NOT based only on order.createdAt.
|
| Example:
|
| Order created last month
| Customer cancels today
|
| Today's cancellation report must include it.
|
|--------------------------------------------------------------------------
*/

async function getCancellationMetrics(
  start:
    Date,
  end:
    Date
) {
  const rows:
    any[] =
    await Order.aggregate(
      [
        {
          $match: {
            $or: [
              /*
              |--------------------------------------------------------------------------
              | CANONICAL
              |--------------------------------------------------------------------------
              */

              {
                cancelledAt: {
                  $gte:
                    start,

                  $lt:
                    end,
                },
              },

              /*
              |--------------------------------------------------------------------------
              | LEGACY FALLBACK
              |--------------------------------------------------------------------------
              |
              | Older cancelled orders may not have cancelledAt.
              |
              |--------------------------------------------------------------------------
              */

              {
                $and: [
                  {
                    orderStatus:
                      "Cancelled",
                  },

                  {
                    $or: [
                      {
                        cancelledAt: {
                          $exists:
                            false,
                        },
                      },

                      {
                        cancelledAt:
                          null,
                      },
                    ],
                  },

                  {
                    updatedAt: {
                      $gte:
                        start,

                      $lt:
                        end,
                    },
                  },
                ],
              },
            ],
          },
        },

        {
          $group: {
            _id:
              null,

            cancellations: {
              $sum:
                1,
            },

            cancelledOrderValue: {
              $sum: {
                $convert: {
                  input:
                    "$totalAmount",

                  to:
                    "double",

                  onError:
                    0,

                  onNull:
                    0,
                },
              },
            },
          },
        },
      ]
    );

  const row =
    rows[0] ||
    {};

  return {
    cancellations:
      safeInteger(
        row.cancellations
      ),

    cancelledOrderValue:
      roundMoney(
        row.cancelledOrderValue
      ),
  };
}

/*
|--------------------------------------------------------------------------
| REAL RETURN REQUEST COUNT
|--------------------------------------------------------------------------
|
| Source:
|
| returnRequest.requestedAt
|
| Count = real order-level return requests.
|
|--------------------------------------------------------------------------
*/

async function getReturnRequestCount(
  start:
    Date,
  end:
    Date
) {
  const count =
    await Order.countDocuments(
      {
        "returnRequest.requestedAt": {
          $gte:
            start,

          $lt:
            end,
        },
      }
    );

  return safeInteger(
    count
  );
}

/*
|--------------------------------------------------------------------------
| REAL EXCHANGE REQUEST COUNT
|--------------------------------------------------------------------------
|
| Source:
|
| exchangeRequest.requestedAt
|
|--------------------------------------------------------------------------
*/

async function getExchangeRequestCount(
  start:
    Date,
  end:
    Date
) {
  const count =
    await Order.countDocuments(
      {
        "exchangeRequest.requestedAt": {
          $gte:
            start,

          $lt:
            end,
        },
      }
    );

  return safeInteger(
    count
  );
}

/*
|--------------------------------------------------------------------------
| ORDER METRICS FOR ONE PERIOD
|--------------------------------------------------------------------------
*/

async function getOrderMetricsForRange(
  start:
    Date,
  end:
    Date
):
  Promise<
    AdminOrderMetrics
  > {
  const [
    created,
    cancellation,
    returns,
    exchanges,
  ] =
    await Promise.all(
      [
        getCreatedOrderMetrics(
          start,
          end
        ),

        getCancellationMetrics(
          start,
          end
        ),

        getReturnRequestCount(
          start,
          end
        ),

        getExchangeRequestCount(
          start,
          end
        ),
      ]
    );

  return {
    ordersPlaced:
      created.ordersPlaced,

    unitsPurchased:
      created.unitsPurchased,

    grossOrderValue:
      created.grossOrderValue,

    revenue:
      created.revenue,

    paidRevenue:
      created.paidRevenue,

    averageOrderValue:
      created.averageOrderValue,

    cancellations:
      cancellation.cancellations,

    cancelledOrderValue:
      cancellation
        .cancelledOrderValue,

    returns,

    exchanges,
  };
}

/*
|--------------------------------------------------------------------------
| ORDER BUSINESS INTELLIGENCE
|--------------------------------------------------------------------------
|
| Current + previous equivalent period.
|
|--------------------------------------------------------------------------
*/

async function getAdminOrderIntelligence(
  period:
    AdminBusinessPeriod
):
  Promise<
    AdminOrderIntelligence
  > {
  const {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  } =
    getOrderPeriodRange(
      period
    );

  const [
    current,
    previous,
  ] =
    await Promise.all(
      [
        getOrderMetricsForRange(
          currentStart,
          currentEnd
        ),

        getOrderMetricsForRange(
          previousStart,
          previousEnd
        ),
      ]
    );

  return {
    current,

    previous,

    currentStart,

    currentEnd,

    previousStart,

    previousEnd,
  };
}

/*
|--------------------------------------------------------------------------
| LIVE PRODUCT MAP
|--------------------------------------------------------------------------
*/

async function getLiveProductMap(
  productIds:
    string[]
) {
  const validIds =
    Array.from(
      new Set(
        productIds.filter(
          (
            id
          ) =>
            mongoose.Types.ObjectId.isValid(
              id
            )
        )
      )
    )
      .slice(
        0,
        MAX_PRODUCT_CONTEXT
      );

  if (
    validIds.length ===
    0
  ) {
    return new Map<
      string,
      AdminLiveProductContext
    >();
  }

  const products:
    any[] =
    await Product.find(
      {
        _id: {
          $in:
            validIds,
        },

        isDeleted: {
          $ne:
            true,
        },
      }
    )
      .select(
        [
          "_id",
          "name",
          "sku",
          "category",
          "subCategory",
          "brand",
          "gender",
          "price",
          "mrp",
          "discount",
          "stock",
          "lowStockLimit",
          "sold",
          "status",
          "sizes",
          "colors",
          "featured",
          "bestSeller",
          "trending",
          "newArrival",
        ].join(
          " "
        )
      )
      .lean();

  const map =
    new Map<
      string,
      AdminLiveProductContext
    >();

  for (
    const product of
    products
  ) {
    const id =
      String(
        product._id
      );

    map.set(
      id,
      {
        productId:
          id,

        name:
          cleanString(
            product.name
          ),

        sku:
          cleanString(
            product.sku
          ),

        category:
          cleanString(
            product.category
          ),

        subCategory:
          cleanString(
            product.subCategory
          ),

        brand:
          cleanString(
            product.brand
          ),

        gender:
          cleanString(
            product.gender
          ),

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

        stock:
          safeInteger(
            product.stock
          ),

        lowStockLimit:
          safeInteger(
            product.lowStockLimit
          ) ||
          5,

        sold:
          safeInteger(
            product.sold
          ),

        status:
          cleanString(
            product.status
          ),

        sizes:
          stringArray(
            product.sizes
          ),

        colors:
          stringArray(
            product.colors
          ),

        featured:
          product.featured ===
          true,

        bestSeller:
          product.bestSeller ===
          true,

        trending:
          product.trending ===
          true,

        newArrival:
          product.newArrival ===
          true,
      }
    );
  }

  return map;
}

/*
|--------------------------------------------------------------------------
| COLLECT PRODUCT IDS
|--------------------------------------------------------------------------
*/

function collectProductIds(
  intelligence:
    any
) {
  const ids =
    new Set<string>();

  const groups = [
    intelligence
      ?.topDemandProducts,

    intelligence
      ?.urgentRestock,

    intelligence
      ?.conversionOpportunities,

    intelligence
      ?.slowMovingProducts,

    intelligence
      ?.returnRiskProducts,

    intelligence
      ?.comparison
      ?.risingProducts,

    intelligence
      ?.comparison
      ?.fallingProducts,

    intelligence
      ?.comparison
      ?.newDemandProducts,
  ];

  for (
    const group of
    groups
  ) {
    if (
      !Array.isArray(
        group
      )
    ) {
      continue;
    }

    for (
      const item of
      group
    ) {
      const id =
        cleanString(
          item?.productId
        );

      if (
        id &&
        mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        ids.add(
          id
        );
      }
    }
  }

  return Array.from(
    ids
  );
}

/*
|--------------------------------------------------------------------------
| ADD UNIQUE RECOMMENDATION
|--------------------------------------------------------------------------
*/

function addRecommendation(
  recommendations:
    AdminBusinessRecommendation[],
  recommendation:
    AdminBusinessRecommendation
) {
  const duplicate =
    recommendations.some(
      (
        current
      ) =>
        current.actionType ===
          recommendation.actionType &&
        (
          current.productId ||
          ""
        ) ===
          (
            recommendation.productId ||
            ""
          ) &&
        (
          current.size ||
          ""
        ) ===
          (
            recommendation.size ||
            ""
          ) &&
        (
          current.color ||
          ""
        ) ===
          (
            recommendation.color ||
            ""
          )
    );

  if (
    duplicate
  ) {
    return;
  }

  recommendations.push(
    recommendation
  );
}
/*
|--------------------------------------------------------------------------
| RESTOCK RECOMMENDATIONS
|--------------------------------------------------------------------------
*/

function addRestockRecommendations({
  intelligence,
  liveProducts,
  recommendations,
}: {
  intelligence:
    any;

  liveProducts:
    Map<
      string,
      AdminLiveProductContext
    >;

  recommendations:
    AdminBusinessRecommendation[];
}) {
  const products =
    Array.isArray(
      intelligence
        ?.urgentRestock
    )
      ? intelligence
          .urgentRestock
      : [];

  for (
    const item of
    products
  ) {
    const productId =
      cleanString(
        item?.productId
      );

    const live =
      liveProducts.get(
        productId
      );

    if (
      !live
    ) {
      continue;
    }

    const demandScore =
      safeNumber(
        item
          ?.normalizedDemandScore
      );

    const outOfStock =
      live.stock <=
      0;

    const critical =
      outOfStock ||
      (
        live.stock <=
          live.lowStockLimit &&
        demandScore >=
          60
      );

    addRecommendation(
      recommendations,
      {
        id:
          createRecommendationId(
            "restock",
            productId
          ),

        priority:
          critical
            ? "critical"
            : "high",

        actionType:
          "restock",

        title:
          outOfStock
            ? `Restock out-of-stock product: ${live.name}`
            : `Restock priority: ${live.name}`,

        message:
          `${live.name} has strong customer demand while live stock is ${live.stock}. Demand score is ${demandScore}/100.`,

        reason:
          "Recent customer behaviour shows buying intent while available inventory is low.",

        expectedImpact:
          "Reducing stock-outs can help prevent lost sales and improve product availability.",

        productId,

        productName:
          live.name,

        sku:
          live.sku,

        category:
          live.category,

        demandScore,

        currentStock:
          live.stock,

        opportunityScore:
          safeNumber(
            item
              ?.opportunityScore
          ),

        riskScore:
          safeNumber(
            item
              ?.riskScore
          ),

        suggestedAction:
          "Review supplier lead time and recent sales velocity, then replenish stock based on actual procurement constraints.",

        requiresHumanReview:
          true,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| RISING DEMAND
|--------------------------------------------------------------------------
*/

function addRisingDemandRecommendations({
  comparison,
  liveProducts,
  recommendations,
}: {
  comparison:
    DemandSnapshotComparison | null;

  liveProducts:
    Map<
      string,
      AdminLiveProductContext
    >;

  recommendations:
    AdminBusinessRecommendation[];
}) {
  const rising =
    Array.isArray(
      comparison
        ?.risingProducts
    )
      ? comparison!
          .risingProducts
      : [];

  for (
    const trend of
    rising.slice(
      0,
      15
    )
  ) {
    const live =
      liveProducts.get(
        trend.productId
      );

    if (
      !live
    ) {
      continue;
    }

    if (
      trend.percentageChange <
      15
    ) {
      continue;
    }

    const lowStock =
      live.stock <=
      Math.max(
        live.lowStockLimit,
        10
      );

    addRecommendation(
      recommendations,
      {
        id:
          createRecommendationId(
            "rising",
            trend.productId
          ),

        priority:
          lowStock
            ? "high"
            : "medium",

        actionType:
          lowStock
            ? "restock"
            : "watch",

        title:
          `Demand rising: ${live.name}`,

        message:
          `${live.name} demand increased by ${trend.percentageChange}% compared with the previous period.`,

        reason:
          `Demand score moved from ${trend.previousDemandScore} to ${trend.currentDemandScore}.`,

        expectedImpact:
          lowStock
            ? "Early restocking may reduce future stock-out risk."
            : "Monitoring continued momentum can improve purchasing and merchandising decisions.",

        productId:
          trend.productId,

        productName:
          live.name,

        sku:
          live.sku,

        category:
          live.category,

        demandScore:
          trend
            .currentDemandScore,

        currentStock:
          live.stock,

        suggestedAction:
          lowStock
            ? "Review stock replenishment now because demand is rising and inventory is limited."
            : "Keep this product visible and monitor the next demand period before making a large stock commitment.",

        requiresHumanReview:
          true,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| SLOW MOVING
|--------------------------------------------------------------------------
*/

function addSlowMovingRecommendations({
  intelligence,
  liveProducts,
  recommendations,
}: {
  intelligence:
    any;

  liveProducts:
    Map<
      string,
      AdminLiveProductContext
    >;

  recommendations:
    AdminBusinessRecommendation[];
}) {
  const products =
    Array.isArray(
      intelligence
        ?.slowMovingProducts
    )
      ? intelligence
          .slowMovingProducts
      : [];

  for (
    const item of
    products
  ) {
    const productId =
      cleanString(
        item?.productId
      );

    const live =
      liveProducts.get(
        productId
      );

    if (
      !live
    ) {
      continue;
    }

    const views =
      safeInteger(
        item
          ?.events
          ?.views
      );

    const purchases =
      safeInteger(
        item
          ?.events
          ?.purchases
      );

    if (
      live.stock <
      15
    ) {
      continue;
    }

    const severe =
      live.stock >=
        HIGH_STOCK_THRESHOLD &&
      purchases ===
        0;

    addRecommendation(
      recommendations,
      {
        id:
          createRecommendationId(
            "slow",
            productId
          ),

        priority:
          severe
            ? "high"
            : "medium",

        actionType:
          severe
            ? "reduce_purchase"
            : "promote",

        title:
          `Slow-moving inventory: ${live.name}`,

        message:
          `${live.name} currently has ${live.stock} units available, ${views} recent views and ${purchases} demand-layer purchases in the selected period.`,

        reason:
          "Inventory is stronger than the recent measured customer demand for this product.",

        expectedImpact:
          "Reducing future purchasing or improving merchandising may lower dead-stock risk.",

        productId,

        productName:
          live.name,

        sku:
          live.sku,

        category:
          live.category,

        demandScore:
          safeNumber(
            item
              ?.normalizedDemandScore
          ),

        currentStock:
          live.stock,

        opportunityScore:
          safeNumber(
            item
              ?.opportunityScore
          ),

        riskScore:
          safeNumber(
            item
              ?.riskScore
          ),

        suggestedAction:
          severe
            ? "Avoid additional purchasing until existing inventory improves. Review promotion, bundling or controlled discount options."
            : "Test stronger product placement or promotion before reducing price.",

        requiresHumanReview:
          true,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| CONVERSION OPPORTUNITIES
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Product-level conversion opportunity still comes from demand intelligence
| because that layer contains product-specific view/cart behaviour.
|
| The final overall Admin summary later uses real Order DB order counts.
|
|--------------------------------------------------------------------------
*/

function addConversionRecommendations({
  intelligence,
  liveProducts,
  recommendations,
}: {
  intelligence:
    any;

  liveProducts:
    Map<
      string,
      AdminLiveProductContext
    >;

  recommendations:
    AdminBusinessRecommendation[];
}) {
  const products =
    Array.isArray(
      intelligence
        ?.conversionOpportunities
    )
      ? intelligence
          .conversionOpportunities
      : [];

  for (
    const item of
    products
  ) {
    const productId =
      cleanString(
        item?.productId
      );

    const live =
      liveProducts.get(
        productId
      );

    if (
      !live
    ) {
      continue;
    }

    const views =
      safeInteger(
        item
          ?.events
          ?.views
      );

    const cartAdds =
      safeInteger(
        item
          ?.events
          ?.cartAdds
      );

    const purchases =
      safeInteger(
        item
          ?.events
          ?.purchases
      );

    const conversion =
      safeNumber(
        item
          ?.viewToPurchaseRate
      );

    const highInterest =
      views >=
        20 ||
      cartAdds >=
        5;

    if (
      !highInterest
    ) {
      continue;
    }

    addRecommendation(
      recommendations,
      {
        id:
          createRecommendationId(
            "conversion",
            productId
          ),

        priority:
          conversion <
            LOW_CONVERSION_RATE &&
          views >=
            30
            ? "high"
            : "medium",

        actionType:
          "conversion_review",

        title:
          `Improve conversion: ${live.name}`,

        message:
          `${live.name} has ${views} views and ${cartAdds} cart adds but only ${purchases} product-level purchase signals. View-to-purchase conversion is ${conversion}%.`,

        reason:
          "Customer interest is not converting into purchases at the expected rate.",

        expectedImpact:
          "Fixing conversion friction can increase sales without requiring additional traffic.",

        productId,

        productName:
          live.name,

        sku:
          live.sku,

        category:
          live.category,

        demandScore:
          safeNumber(
            item
              ?.normalizedDemandScore
          ),

        opportunityScore:
          safeNumber(
            item
              ?.opportunityScore
          ),

        currentStock:
          live.stock,

        suggestedAction:
          "Review product images, description clarity, size availability, color availability, price competitiveness, delivery expectations and offer strategy.",

        requiresHumanReview:
          true,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | PRICE REVIEW
    |--------------------------------------------------------------------------
    |
    | We do NOT automatically claim price is the problem.
    |
    |--------------------------------------------------------------------------
    */

    if (
      views >=
        40 &&
      cartAdds >=
        8 &&
      purchases <=
        2
    ) {
      addRecommendation(
        recommendations,
        {
          id:
            createRecommendationId(
              "price-review",
              productId
            ),

          priority:
            "medium",

          actionType:
            "price_review",

          title:
            `Review pricing: ${live.name}`,

          message:
            `${live.name} shows strong browsing/cart interest but weak purchase completion.`,

          reason:
            "Price may be one of several conversion factors, but behaviour alone cannot prove that pricing is the cause.",

          expectedImpact:
            "A pricing and offer review may identify friction without unnecessarily discounting a healthy product.",

          productId,

          productName:
            live.name,

          sku:
            live.sku,

          category:
            live.category,

          demandScore:
            safeNumber(
              item
                ?.normalizedDemandScore
            ),

          currentStock:
            live.stock,

          suggestedAction:
            "Compare current price, MRP, competitors, margins, size availability and shipping cost before changing price.",

          requiresHumanReview:
            true,
        }
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| RETURNS
|--------------------------------------------------------------------------
|
| Product-level return risk still comes from demand intelligence because this
| recommendation needs a productId.
|
| Overall return count in the final summary comes from the real Order DB.
|
|--------------------------------------------------------------------------
*/

function addReturnRiskRecommendations({
  intelligence,
  liveProducts,
  recommendations,
}: {
  intelligence:
    any;

  liveProducts:
    Map<
      string,
      AdminLiveProductContext
    >;

  recommendations:
    AdminBusinessRecommendation[];
}) {
  const products =
    Array.isArray(
      intelligence
        ?.returnRiskProducts
    )
      ? intelligence
          .returnRiskProducts
      : [];

  for (
    const item of
    products
  ) {
    const productId =
      cleanString(
        item?.productId
      );

    const live =
      liveProducts.get(
        productId
      );

    if (
      !live
    ) {
      continue;
    }

    const returnRate =
      safeNumber(
        item
          ?.returnRate
      );

    if (
      returnRate <
      10
    ) {
      continue;
    }

    addRecommendation(
      recommendations,
      {
        id:
          createRecommendationId(
            "return",
            productId
          ),

        priority:
          returnRate >=
            HIGH_RETURN_RATE
            ? "high"
            : "medium",

        actionType:
          "return_investigation",

        title:
          `Investigate returns: ${live.name}`,

        message:
          `${live.name} has a recent product-level return-request rate of ${returnRate}%.`,

        reason:
          "Elevated returns can reduce margin and may indicate expectation, size or quality problems.",

        expectedImpact:
          "Reducing preventable returns can improve margin, customer satisfaction and inventory efficiency.",

        productId,

        productName:
          live.name,

        sku:
          live.sku,

        category:
          live.category,

        riskScore:
          safeNumber(
            item
              ?.riskScore
          ),

        currentStock:
          live.stock,

        suggestedAction:
          "Review actual return reasons, sizing chart, images, description accuracy, quality issues and fulfilment errors before making changes.",

        requiresHumanReview:
          true,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| SIZE DEMAND
|--------------------------------------------------------------------------
*/

function addSizeRecommendations({
  intelligence,
  recommendations,
}: {
  intelligence:
    any;

  recommendations:
    AdminBusinessRecommendation[];
}) {
  const sizes =
    Array.isArray(
      intelligence
        ?.topSizes
    )
      ? intelligence
          .topSizes
      : [];

  for (
    const size of
    sizes.slice(
      0,
      5
    )
  ) {
    const value =
      cleanString(
        size?.value
      );

    if (
      !value
    ) {
      continue;
    }

    const purchases =
      safeInteger(
        size
          ?.purchases
      );

    const cartAdds =
      safeInteger(
        size
          ?.cartAdds
      );

    if (
      purchases <
        3 &&
      cartAdds <
        5
    ) {
      continue;
    }

    addRecommendation(
      recommendations,
      {
        id:
          createRecommendationId(
            "size",
            value
          ),

        priority:
          purchases >=
            10
            ? "high"
            : "medium",

        actionType:
          "size_stock_review",

        title:
          `Strong size demand: ${value}`,

        message:
          `Size ${value} generated ${cartAdds} cart adds and ${purchases} product-level purchase signals in the selected period.`,

        reason:
          "Customer behaviour indicates stronger demand for this size.",

        expectedImpact:
          "Better size-level stock allocation may reduce missed purchases.",

        size:
          value,

        demandScore:
          safeNumber(
            size
              ?.demandScore
          ),

        suggestedAction:
          `Review size ${value} inventory across high-demand products and prioritize replenishment where stock is weak.`,

        requiresHumanReview:
          true,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| COLOR DEMAND
|--------------------------------------------------------------------------
*/

function addColorRecommendations({
  intelligence,
  recommendations,
}: {
  intelligence:
    any;

  recommendations:
    AdminBusinessRecommendation[];
}) {
  const colors =
    Array.isArray(
      intelligence
        ?.topColors
    )
      ? intelligence
          .topColors
      : [];

  for (
    const color of
    colors.slice(
      0,
      5
    )
  ) {
    const value =
      cleanString(
        color?.value
      );

    if (
      !value
    ) {
      continue;
    }

    const purchases =
      safeInteger(
        color
          ?.purchases
      );

    const cartAdds =
      safeInteger(
        color
          ?.cartAdds
      );

    if (
      purchases <
        3 &&
      cartAdds <
        5
    ) {
      continue;
    }

    addRecommendation(
      recommendations,
      {
        id:
          createRecommendationId(
            "color",
            value
          ),

        priority:
          purchases >=
            10
            ? "high"
            : "medium",

        actionType:
          "color_stock_review",

        title:
          `Strong color demand: ${value}`,

        message:
          `${value} generated ${cartAdds} cart adds and ${purchases} product-level purchase signals in the selected period.`,

        reason:
          "Recent behaviour shows stronger customer preference for this color.",

        expectedImpact:
          "Aligning color availability with actual demand may improve conversion.",

        color:
          value,

        demandScore:
          safeNumber(
            color
              ?.demandScore
          ),

        suggestedAction:
          `Review ${value} variants across key products and prioritize stock where demand is high.`,

        requiresHumanReview:
          true,
      }
    );
  }
}
/*
|--------------------------------------------------------------------------
| CATEGORY DEMAND
|--------------------------------------------------------------------------
*/

function addCategoryRecommendations({
  intelligence,
  recommendations,
}: {
  intelligence:
    any;

  recommendations:
    AdminBusinessRecommendation[];
}) {
  const categories =
    Array.isArray(
      intelligence
        ?.topCategories
    )
      ? intelligence
          .topCategories
      : [];

  for (
    const category of
    categories.slice(
      0,
      5
    )
  ) {
    const name =
      cleanString(
        category?.category
      );

    if (
      !name
    ) {
      continue;
    }

    const purchases =
      safeInteger(
        category
          ?.purchases
      );

    const cartAdds =
      safeInteger(
        category
          ?.cartAdds
      );

    if (
      purchases <
        3 &&
      cartAdds <
        5
    ) {
      continue;
    }

    addRecommendation(
      recommendations,
      {
        id:
          createRecommendationId(
            "category",
            name
          ),

        priority:
          purchases >=
            15
            ? "high"
            : "medium",

        actionType:
          "category_focus",

        title:
          `Category opportunity: ${name}`,

        message:
          `${name} generated ${safeInteger(
            category
              ?.views
          )} views, ${cartAdds} cart adds and ${purchases} product-level purchase signals.`,

        reason:
          "This category is currently receiving meaningful customer demand.",

        expectedImpact:
          "Better assortment, availability and merchandising in a growing category may increase sales.",

        category:
          name,

        demandScore:
          safeNumber(
            category
              ?.demandScore
          ),

        suggestedAction:
          `Review best-performing products, sizes, colors and stock depth within ${name} before planning new inventory.`,

        requiresHumanReview:
          true,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| FALLING PRODUCT DEMAND
|--------------------------------------------------------------------------
*/

function addFallingDemandRecommendations({
  comparison,
  liveProducts,
  recommendations,
}: {
  comparison:
    DemandSnapshotComparison | null;

  liveProducts:
    Map<
      string,
      AdminLiveProductContext
    >;

  recommendations:
    AdminBusinessRecommendation[];
}) {
  const falling =
    Array.isArray(
      comparison
        ?.fallingProducts
    )
      ? comparison!
          .fallingProducts
      : [];

  for (
    const trend of
    falling.slice(
      0,
      15
    )
  ) {
    const live =
      liveProducts.get(
        trend.productId
      );

    if (
      !live
    ) {
      continue;
    }

    if (
      trend.percentageChange >
      -15
    ) {
      continue;
    }

    const highStock =
      live.stock >=
      20;

    addRecommendation(
      recommendations,
      {
        id:
          createRecommendationId(
            "falling",
            trend.productId
          ),

        priority:
          highStock
            ? "medium"
            : "low",

        actionType:
          highStock
            ? "inventory_balance"
            : "watch",

        title:
          `Demand falling: ${live.name}`,

        message:
          `${live.name} demand changed by ${trend.percentageChange}% versus the previous period.`,

        reason:
          `Demand score moved from ${trend.previousDemandScore} to ${trend.currentDemandScore}.`,

        expectedImpact:
          highStock
            ? "Reducing unnecessary replenishment can lower excess inventory risk."
            : "Monitoring may prevent overreacting to a short-term demand change.",

        productId:
          trend.productId,

        productName:
          live.name,

        sku:
          live.sku,

        category:
          live.category,

        demandScore:
          trend
            .currentDemandScore,

        currentStock:
          live.stock,

        suggestedAction:
          highStock
            ? "Reduce new purchasing until demand stabilizes and review promotion options for existing stock."
            : "Monitor another period before changing inventory strategy.",

        requiresHumanReview:
          true,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| SORT RECOMMENDATIONS
|--------------------------------------------------------------------------
*/

function sortRecommendations(
  recommendations:
    AdminBusinessRecommendation[]
) {
  return [
    ...recommendations,
  ]
    .sort(
      (
        first,
        second
      ) => {
        const priorityDifference =
          priorityWeight(
            second.priority
          ) -
          priorityWeight(
            first.priority
          );

        if (
          priorityDifference !==
          0
        ) {
          return priorityDifference;
        }

        const opportunityDifference =
          safeNumber(
            second
              .opportunityScore
          ) -
          safeNumber(
            first
              .opportunityScore
          );

        if (
          opportunityDifference !==
          0
        ) {
          return opportunityDifference;
        }

        return (
          safeNumber(
            second
              .demandScore
          ) -
          safeNumber(
            first
              .demandScore
          )
        );
      }
    )
    .slice(
      0,
      MAX_RECOMMENDATIONS
    );
}

/*
|--------------------------------------------------------------------------
| EMPTY RESULT
|--------------------------------------------------------------------------
*/

function createEmptyResult(
  period:
    AdminBusinessPeriod,
  message:
    string
):
  AdminBusinessIntelligenceResult {
  return {
    success:
      false,

    message,

    period,

    generatedAt:
      new Date(),

    staleData:
      false,

    dataSources: {
      customerBehaviour:
        "unavailable",

      orders:
        "unavailable",
    },

    summary: {
      totalEvents:
        0,

      views:
        0,

      cartAdds:
        0,

      wishlistAdds:
        0,

      searches:
        0,

      purchases:
        0,

      ordersPlaced:
        0,

      unitsPurchased:
        0,

      revenue:
        0,

      grossOrderValue:
        0,

      paidRevenue:
        0,

      averageOrderValue:
        0,

      returns:
        0,

      cancellations:
        0,

      exchanges:
        0,

      cancelledOrderValue:
        0,

      viewToPurchaseRate:
        0,

      cartToPurchaseRate:
        0,
    },

    salesTrend: {
      purchasesChange:
        0,

      purchasesDirection:
        "unknown",

      revenueChange:
        0,

      revenueDirection:
        "unknown",

      cancellationsChange:
        0,

      cancellationsDirection:
        "unknown",

      returnsChange:
        0,

      returnsDirection:
        "unknown",

      exchangesChange:
        0,

      exchangesDirection:
        "unknown",

      viewsChange:
        0,

      viewsDirection:
        "unknown",

      cartAddsChange:
        0,

      cartAddsDirection:
        "unknown",

      conversionChange:
        0,

      conversionDirection:
        "unknown",
    },

    topDemandProducts:
      [],

    risingProducts:
      [],

    fallingProducts:
      [],

    urgentRestock:
      [],

    slowMovingProducts:
      [],

    conversionOpportunities:
      [],

    returnRiskProducts:
      [],

    topCategories:
      [],

    topColors:
      [],

    topSizes:
      [],

    recommendations:
      [],
  };
}

/*
|--------------------------------------------------------------------------
| MAIN BUSINESS INTELLIGENCE
|--------------------------------------------------------------------------
*/

export async function getAdminBusinessIntelligence(
  requestedPeriod:
    AdminBusinessPeriod =
      "weekly"
):
  Promise<
    AdminBusinessIntelligenceResult
  > {
  const period =
    normalizePeriod(
      requestedPeriod
    );

  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | LOAD BOTH DATA SOURCES
    |--------------------------------------------------------------------------
    |
    | CustomerAIEvent / demand intelligence:
    |
    | - views
    | - search
    | - cart adds
    | - wishlist
    | - product-level demand
    |
    | Order collection:
    |
    | - real purchases
    | - revenue
    | - cancellations
    | - returns
    | - exchanges
    |
    |--------------------------------------------------------------------------
    */

    const [
      demandResult,
      orderResult,
    ] =
      await Promise.allSettled(
        [
          getAdminDemandIntelligencePackage(
            period
          ),

          getAdminOrderIntelligence(
            period
          ),
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | DEMAND SOURCE
    |--------------------------------------------------------------------------
    */

    const intelligence:
      any =
      demandResult.status ===
        "fulfilled" &&
      demandResult.value &&
      typeof demandResult.value ===
        "object"
        ? demandResult.value
        : null;

    const demandAvailable =
      Boolean(
        intelligence &&
        intelligence.success &&
        intelligence.summary
      );

    /*
    |--------------------------------------------------------------------------
    | ORDER SOURCE
    |--------------------------------------------------------------------------
    */

    const orderIntelligence:
      AdminOrderIntelligence =
      orderResult.status ===
        "fulfilled"
        ? orderResult.value
        : {
            current:
              emptyOrderMetrics(),

            previous:
              emptyOrderMetrics(),

            ...getOrderPeriodRange(
              period
            ),
          };

    const ordersAvailable =
      orderResult.status ===
      "fulfilled";

    /*
    |--------------------------------------------------------------------------
    | COMPLETE FAILURE
    |--------------------------------------------------------------------------
    |
    | Only fail the whole BI package when BOTH independent data sources fail.
    |
    | If behaviour intelligence fails but Order DB works, Admin AI should still
    | report real sales.
    |
    | If Order analytics fails but behaviour works, Admin AI may still report
    | demand while clearly marking orders as unavailable.
    |
    |--------------------------------------------------------------------------
    */

    if (
      !demandAvailable &&
      !ordersAvailable
    ) {
      return createEmptyResult(
        period,
        "Admin business intelligence is unavailable because customer behaviour and order analytics could not be loaded."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DEMAND FALLBACK
    |--------------------------------------------------------------------------
    */

    const behaviourSummary =
      demandAvailable
        ? intelligence.summary
        : {};

    const comparison:
      DemandSnapshotComparison | null =
      demandAvailable &&
      intelligence.comparison &&
      typeof intelligence.comparison ===
        "object"
        ? intelligence.comparison
        : null;

    const metrics =
      comparison
        ?.metrics;

    /*
    |--------------------------------------------------------------------------
    | BEHAVIOUR METRICS
    |--------------------------------------------------------------------------
    */

    const totalEvents =
      safeInteger(
        behaviourSummary
          ?.totalEvents
      );

    const views =
      safeInteger(
        behaviourSummary
          ?.productViews
      );

    const cartAdds =
      safeInteger(
        behaviourSummary
          ?.cartAdds
      );

    const wishlistAdds =
      safeInteger(
        behaviourSummary
          ?.wishlistAdds
      );

    const searches =
      safeInteger(
        behaviourSummary
          ?.searches
      );

    /*
    |--------------------------------------------------------------------------
    | REAL ORDER METRICS
    |--------------------------------------------------------------------------
    */

    const currentOrders =
      orderIntelligence.current;

    const previousOrders =
      orderIntelligence.previous;

    /*
    |--------------------------------------------------------------------------
    | CROSS-SOURCE CONVERSION
    |--------------------------------------------------------------------------
    |
    | Numerator:
    |   real Order DB orders placed.
    |
    | Denominator:
    |   real customer behaviour events.
    |
    |--------------------------------------------------------------------------
    */

    const viewToPurchaseRate =
      percentageRate(
        currentOrders
          .ordersPlaced,
        views
      );

    const cartToPurchaseRate =
      percentageRate(
        currentOrders
          .ordersPlaced,
        cartAdds
      );

    /*
    |--------------------------------------------------------------------------
    | CONVERSION TREND
    |--------------------------------------------------------------------------
    */

    const previousViews =
      safeInteger(
        metrics
          ?.productViews
          ?.previous
      );

    const previousCartAdds =
      safeInteger(
        metrics
          ?.cartAdds
          ?.previous
      );

    const previousViewToPurchaseRate =
      percentageRate(
        previousOrders
          .ordersPlaced,
        previousViews
      );

    /*
    |--------------------------------------------------------------------------
    | LIVE PRODUCT DATA
    |--------------------------------------------------------------------------
    */

    const liveProducts =
      demandAvailable
        ? await getLiveProductMap(
            collectProductIds(
              intelligence
            )
          )
        : new Map<
            string,
            AdminLiveProductContext
          >();

    /*
    |--------------------------------------------------------------------------
    | RECOMMENDATIONS
    |--------------------------------------------------------------------------
    */

    const recommendations:
      AdminBusinessRecommendation[] =
      [];

    if (
      demandAvailable
    ) {
      addRestockRecommendations(
        {
          intelligence,

          liveProducts,

          recommendations,
        }
      );

      addRisingDemandRecommendations(
        {
          comparison,

          liveProducts,

          recommendations,
        }
      );

      addSlowMovingRecommendations(
        {
          intelligence,

          liveProducts,

          recommendations,
        }
      );

      addConversionRecommendations(
        {
          intelligence,

          liveProducts,

          recommendations,
        }
      );

      addReturnRiskRecommendations(
        {
          intelligence,

          liveProducts,

          recommendations,
        }
      );

      addSizeRecommendations(
        {
          intelligence,

          recommendations,
        }
      );

      addColorRecommendations(
        {
          intelligence,

          recommendations,
        }
      );

      addCategoryRecommendations(
        {
          intelligence,

          recommendations,
        }
      );

      addFallingDemandRecommendations(
        {
          comparison,

          liveProducts,

          recommendations,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE MESSAGE
    |--------------------------------------------------------------------------
    */

    let message =
      "SilentGEN admin business intelligence generated successfully.";

    if (
      !demandAvailable &&
      ordersAvailable
    ) {
      message =
        "Order business intelligence generated successfully. Customer behaviour intelligence is currently unavailable.";
    } else if (
      demandAvailable &&
      !ordersAvailable
    ) {
      message =
        "Customer demand intelligence generated successfully. Real order analytics is currently unavailable.";
    }

    /*
    |--------------------------------------------------------------------------
    | RESULT
    |--------------------------------------------------------------------------
    */

    return {
      success:
        true,

      message,

      period,

      generatedAt:
        new Date(),

      staleData:
        demandAvailable
          ? intelligence.stale ===
            true
          : false,

      dataSources: {
        customerBehaviour:
          demandAvailable
            ? "available"
            : "unavailable",

        orders:
          ordersAvailable
            ? "available"
            : "unavailable",
      },

      summary: {
        /*
        |--------------------------------------------------------------------------
        | CUSTOMER BEHAVIOUR
        |--------------------------------------------------------------------------
        */

        totalEvents,

        views,

        cartAdds,

        wishlistAdds,

        searches,

        /*
        |--------------------------------------------------------------------------
        | REAL ORDER DB
        |--------------------------------------------------------------------------
        */

        purchases:
          currentOrders
            .ordersPlaced,

        ordersPlaced:
          currentOrders
            .ordersPlaced,

        unitsPurchased:
          currentOrders
            .unitsPurchased,

        revenue:
          currentOrders
            .revenue,

        grossOrderValue:
          currentOrders
            .grossOrderValue,

        paidRevenue:
          currentOrders
            .paidRevenue,

        averageOrderValue:
          currentOrders
            .averageOrderValue,

        returns:
          currentOrders
            .returns,

        cancellations:
          currentOrders
            .cancellations,

        exchanges:
          currentOrders
            .exchanges,

        cancelledOrderValue:
          currentOrders
            .cancelledOrderValue,

        /*
        |--------------------------------------------------------------------------
        | CROSS SOURCE
        |--------------------------------------------------------------------------
        */

        viewToPurchaseRate,

        cartToPurchaseRate,
      },

      salesTrend: {
        /*
        |--------------------------------------------------------------------------
        | REAL ORDER TRENDS
        |--------------------------------------------------------------------------
        */

        purchasesChange:
          calculatePercentageChange(
            currentOrders
              .ordersPlaced,
            previousOrders
              .ordersPlaced
          ),

        purchasesDirection:
          getTrendDirection(
            currentOrders
              .ordersPlaced,
            previousOrders
              .ordersPlaced
          ),

        revenueChange:
          calculatePercentageChange(
            currentOrders
              .revenue,
            previousOrders
              .revenue
          ),

        revenueDirection:
          getTrendDirection(
            currentOrders
              .revenue,
            previousOrders
              .revenue
          ),

        cancellationsChange:
          calculatePercentageChange(
            currentOrders
              .cancellations,
            previousOrders
              .cancellations
          ),

        cancellationsDirection:
          getTrendDirection(
            currentOrders
              .cancellations,
            previousOrders
              .cancellations
          ),

        returnsChange:
          calculatePercentageChange(
            currentOrders
              .returns,
            previousOrders
              .returns
          ),

        returnsDirection:
          getTrendDirection(
            currentOrders
              .returns,
            previousOrders
              .returns
          ),

        exchangesChange:
          calculatePercentageChange(
            currentOrders
              .exchanges,
            previousOrders
              .exchanges
          ),

        exchangesDirection:
          getTrendDirection(
            currentOrders
              .exchanges,
            previousOrders
              .exchanges
          ),

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER BEHAVIOUR TRENDS
        |--------------------------------------------------------------------------
        */

        viewsChange:
          demandAvailable
            ? safeNumber(
                metrics
                  ?.productViews
                  ?.percentageChange
              )
            : 0,

        viewsDirection:
          demandAvailable
            ? (
                cleanString(
                  metrics
                    ?.productViews
                    ?.direction
                ) ||
                "unknown"
              )
            : "unknown",

        cartAddsChange:
          demandAvailable
            ? safeNumber(
                metrics
                  ?.cartAdds
                  ?.percentageChange
              )
            : 0,

        cartAddsDirection:
          demandAvailable
            ? (
                cleanString(
                  metrics
                    ?.cartAdds
                    ?.direction
                ) ||
                "unknown"
              )
            : "unknown",

        conversionChange:
          calculatePercentageChange(
            viewToPurchaseRate,
            previousViewToPurchaseRate
          ),

        conversionDirection:
          getTrendDirection(
            viewToPurchaseRate,
            previousViewToPurchaseRate
          ),
      },

      topDemandProducts:
        demandAvailable &&
        Array.isArray(
          intelligence
            .topDemandProducts
        )
          ? intelligence
              .topDemandProducts
              .slice(
                0,
                20
              )
          : [],

      risingProducts:
        Array.isArray(
          comparison
            ?.risingProducts
        )
          ? comparison!
              .risingProducts
              .slice(
                0,
                20
              )
          : [],

      fallingProducts:
        Array.isArray(
          comparison
            ?.fallingProducts
        )
          ? comparison!
              .fallingProducts
              .slice(
                0,
                20
              )
          : [],

      urgentRestock:
        demandAvailable &&
        Array.isArray(
          intelligence
            .urgentRestock
        )
          ? intelligence
              .urgentRestock
              .slice(
                0,
                20
              )
          : [],

      slowMovingProducts:
        demandAvailable &&
        Array.isArray(
          intelligence
            .slowMovingProducts
        )
          ? intelligence
              .slowMovingProducts
              .slice(
                0,
                20
              )
          : [],

      conversionOpportunities:
        demandAvailable &&
        Array.isArray(
          intelligence
            .conversionOpportunities
        )
          ? intelligence
              .conversionOpportunities
              .slice(
                0,
                20
              )
          : [],

      returnRiskProducts:
        demandAvailable &&
        Array.isArray(
          intelligence
            .returnRiskProducts
        )
          ? intelligence
              .returnRiskProducts
              .slice(
                0,
                20
              )
          : [],

      topCategories:
        demandAvailable &&
        Array.isArray(
          intelligence
            .topCategories
        )
          ? intelligence
              .topCategories
              .slice(
                0,
                15
              )
          : [],

      topColors:
        demandAvailable &&
        Array.isArray(
          intelligence
            .topColors
        )
          ? intelligence
              .topColors
              .slice(
                0,
                15
              )
          : [],

      topSizes:
        demandAvailable &&
        Array.isArray(
          intelligence
            .topSizes
        )
          ? intelligence
              .topSizes
              .slice(
                0,
                15
              )
          : [],

      recommendations:
        sortRecommendations(
          recommendations
        ),
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN admin business intelligence error:",
      error
    );

    return createEmptyResult(
      period,
      "Unable to generate SilentGEN admin business intelligence."
    );
  }
}
/*
|--------------------------------------------------------------------------
| CRITICAL ADMIN RECOMMENDATIONS
|--------------------------------------------------------------------------
*/

export async function getCriticalAdminRecommendations(
  period:
    AdminBusinessPeriod =
      "weekly"
) {
  const intelligence =
    await getAdminBusinessIntelligence(
      period
    );

  return {
    success:
      intelligence.success,

    generatedAt:
      intelligence.generatedAt,

    staleData:
      intelligence.staleData,

    dataSources:
      intelligence.dataSources,

    recommendations:
      intelligence
        .recommendations
        .filter(
          (
            recommendation
          ) =>
            recommendation.priority ===
              "critical" ||
            recommendation.priority ===
              "high"
        ),
  };
}

/*
|--------------------------------------------------------------------------
| ADMIN SALES GROWTH SUMMARY
|--------------------------------------------------------------------------
|
| Compact payload for Admin AI.
|
| IMPORTANT:
|
| summary.purchases
| summary.revenue
| summary.returns
| summary.cancellations
| summary.exchanges
|
| now come from the real Order collection whenever order analytics is
| available.
|
|--------------------------------------------------------------------------
*/

export async function getAdminSalesGrowthSummary(
  period:
    AdminBusinessPeriod =
      "weekly"
) {
  const intelligence =
    await getAdminBusinessIntelligence(
      period
    );

  return {
    success:
      intelligence.success,

    message:
      intelligence.message,

    period:
      intelligence.period,

    generatedAt:
      intelligence.generatedAt,

    staleData:
      intelligence.staleData,

    dataSources:
      intelligence.dataSources,

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    summary:
      intelligence.summary,

    /*
    |--------------------------------------------------------------------------
    | SALES / BUSINESS TREND
    |--------------------------------------------------------------------------
    */

    salesTrend:
      intelligence.salesTrend,

    /*
    |--------------------------------------------------------------------------
    | PRIORITY RECOMMENDATIONS
    |--------------------------------------------------------------------------
    */

    recommendations:
      intelligence
        .recommendations
        .slice(
          0,
          20
        ),

    /*
    |--------------------------------------------------------------------------
    | INVENTORY
    |--------------------------------------------------------------------------
    */

    urgentRestock:
      intelligence
        .urgentRestock
        .slice(
          0,
          10
        ),

    slowMovingProducts:
      intelligence
        .slowMovingProducts
        .slice(
          0,
          10
        ),

    /*
    |--------------------------------------------------------------------------
    | DEMAND
    |--------------------------------------------------------------------------
    */

    topDemandProducts:
      intelligence
        .topDemandProducts
        .slice(
          0,
          10
        ),

    risingProducts:
      intelligence
        .risingProducts
        .slice(
          0,
          10
        ),

    fallingProducts:
      intelligence
        .fallingProducts
        .slice(
          0,
          10
        ),

    /*
    |--------------------------------------------------------------------------
    | CONVERSION
    |--------------------------------------------------------------------------
    */

    conversionOpportunities:
      intelligence
        .conversionOpportunities
        .slice(
          0,
          10
        ),

    /*
    |--------------------------------------------------------------------------
    | RETURN RISK
    |--------------------------------------------------------------------------
    */

    returnRiskProducts:
      intelligence
        .returnRiskProducts
        .slice(
          0,
          10
        ),

    /*
    |--------------------------------------------------------------------------
    | CATEGORY / VARIANT DEMAND
    |--------------------------------------------------------------------------
    */

    topCategories:
      intelligence
        .topCategories
        .slice(
          0,
          10
        ),

    topColors:
      intelligence
        .topColors
        .slice(
          0,
          10
        ),

    topSizes:
      intelligence
        .topSizes
        .slice(
          0,
          10
        ),
  };
}