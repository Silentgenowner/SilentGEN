import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import CustomerAIEvent, {
  type CustomerAIEventType,
} from "@/models/CustomerAIEvent";

import Product from "@/models/Product";

/*
|--------------------------------------------------------------------------
| SILENTGEN DEMAND INTELLIGENCE
|--------------------------------------------------------------------------
|
| Converts customer behaviour into business intelligence.
|
| IMPORTANT:
|
| - Customer events show demand signals.
| - Product collection remains the live source of truth for:
|   price, stock, status, product details.
| - Historical event price is analytics-only.
| - Admin AI should use this output for recommendations.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_ANALYSIS_DAYS =
  30;

const MIN_ANALYSIS_DAYS =
  1;

const MAX_ANALYSIS_DAYS =
  365;

const DEFAULT_LIMIT =
  20;

const MAX_LIMIT =
  100;

/*
|--------------------------------------------------------------------------
| EVENT WEIGHTS
|--------------------------------------------------------------------------
|
| Stronger buying intent receives higher weight.
|
|--------------------------------------------------------------------------
*/

const EVENT_WEIGHTS:
  Record<
    CustomerAIEventType,
    number
  > = {
    product_view:
      1,

    product_like:
      4,

    product_dislike:
      -3,

    product_search:
      1,

    product_click:
      2,

    add_to_cart:
      7,

    remove_from_cart:
      -2,

    cart_quantity_increase:
      3,

    cart_quantity_decrease:
      -1,

    wishlist_add:
      5,

    wishlist_remove:
      -2,

    checkout_started:
      8,

    order_placed:
      10,

    order_cancelled:
      -8,

    return_requested:
      -7,

    exchange_requested:
      -3,

    product_purchased:
      15,

    recommendation_shown:
      0.25,

    recommendation_clicked:
      3,
  };

/*
|--------------------------------------------------------------------------
| INPUT
|--------------------------------------------------------------------------
*/

export type DemandIntelligenceInput = {
  days?:
    number;

  limit?:
    number;

  category?:
    string | null;

  productId?:
    string | null;

  includeInactiveProducts?:
    boolean;
};

/*
|--------------------------------------------------------------------------
| EVENT COUNTS
|--------------------------------------------------------------------------
*/

export type DemandEventCounts = {
  views:
    number;

  clicks:
    number;

  likes:
    number;

  dislikes:
    number;

  wishlistAdds:
    number;

  wishlistRemoves:
    number;

  cartAdds:
    number;

  cartRemoves:
    number;

  cartQuantityIncreases:
    number;

  cartQuantityDecreases:
    number;

  checkoutStarts:
    number;

  purchases:
    number;

  orderPlacements:
    number;

  cancellations:
    number;

  returns:
    number;

  exchanges:
    number;

  recommendationShown:
    number;

  recommendationClicked:
    number;

  searches:
    number;
};

/*
|--------------------------------------------------------------------------
| PRODUCT DEMAND METRIC
|--------------------------------------------------------------------------
*/

export type ProductDemandMetric = {
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

  sold:
    number;

  lowStockLimit:
    number;

  status:
    string;

  thumbnail:
    string;

  events:
    DemandEventCounts;

  quantities: {
    cart:
      number;

    purchased:
      number;
  };

  demandScore:
    number;

  normalizedDemandScore:
    number;

  viewToCartRate:
    number;

  viewToPurchaseRate:
    number;

  cartToPurchaseRate:
    number;

  recommendationClickRate:
    number;

  returnRate:
    number;

  cancellationRate:
    number;

  demandLevel:
    "very_high"
    | "high"
    | "medium"
    | "low"
    | "very_low";

  inventorySignal:
    "urgent_restock"
    | "restock"
    | "healthy"
    | "slow_moving"
    | "overstock_risk"
    | "out_of_stock_demand"
    | "unknown";

  conversionSignal:
    "excellent"
    | "good"
    | "average"
    | "weak"
    | "very_weak"
    | "insufficient_data";

  opportunityScore:
    number;

  riskScore:
    number;

  reasons:
    string[];
};

/*
|--------------------------------------------------------------------------
| DIMENSION METRIC
|--------------------------------------------------------------------------
*/

export type DemandDimensionMetric = {
  value:
    string;

  views:
    number;

  cartAdds:
    number;

  purchases:
    number;

  likes:
    number;

  wishlistAdds:
    number;

  returns:
    number;

  demandScore:
    number;

  conversionRate:
    number;
};

/*
|--------------------------------------------------------------------------
| CATEGORY METRIC
|--------------------------------------------------------------------------
*/

export type CategoryDemandMetric = {
  category:
    string;

  views:
    number;

  clicks:
    number;

  likes:
    number;

  wishlistAdds:
    number;

  cartAdds:
    number;

  purchases:
    number;

  cancellations:
    number;

  returns:
    number;

  demandScore:
    number;

  viewToPurchaseRate:
    number;

  productCount:
    number;
};

/*
|--------------------------------------------------------------------------
| BUSINESS SUGGESTION
|--------------------------------------------------------------------------
*/

export type DemandBusinessSuggestion = {
  type:
    | "restock"
    | "out_of_stock"
    | "promote"
    | "discount"
    | "conversion"
    | "inventory"
    | "return_risk"
    | "category_growth"
    | "size_demand"
    | "color_demand"
    | "product_opportunity";

  priority:
    "critical"
    | "high"
    | "medium"
    | "low";

  title:
    string;

  message:
    string;

  productId?:
    string;

  category?:
    string;

  value?:
    string;

  score?:
    number;
};

/*
|--------------------------------------------------------------------------
| RESULT
|--------------------------------------------------------------------------
*/

export type DemandIntelligenceResult = {
  success:
    boolean;

  message:
    string;

  period: {
    days:
      number;

    from:
      Date;

    to:
      Date;
  };

  summary: {
    totalEvents:
      number;

    productViews:
      number;

    productClicks:
      number;

    cartAdds:
      number;

    wishlistAdds:
      number;

    purchases:
      number;

    cancellations:
      number;

    returns:
      number;

    exchanges:
      number;

    searches:
      number;

    uniqueProducts:
      number;

    overallViewToPurchaseRate:
      number;

    overallCartToPurchaseRate:
      number;
  };

  hotProducts:
    ProductDemandMetric[];

  slowProducts:
    ProductDemandMetric[];

  restockCandidates:
    ProductDemandMetric[];

  conversionOpportunities:
    ProductDemandMetric[];

  returnRiskProducts:
    ProductDemandMetric[];

  categories:
    CategoryDemandMetric[];

  colors:
    DemandDimensionMetric[];

  sizes:
    DemandDimensionMetric[];

  suggestions:
    DemandBusinessSuggestion[];
};

/*
|--------------------------------------------------------------------------
| INTERNAL EVENT ROW
|--------------------------------------------------------------------------
*/

type EventAggregateRow = {
  _id:
    mongoose.Types.ObjectId | null;

  views?:
    number;

  clicks?:
    number;

  likes?:
    number;

  dislikes?:
    number;

  wishlistAdds?:
    number;

  wishlistRemoves?:
    number;

  cartAdds?:
    number;

  cartRemoves?:
    number;

  cartQuantityIncreases?:
    number;

  cartQuantityDecreases?:
    number;

  checkoutStarts?:
    number;

  purchases?:
    number;

  orderPlacements?:
    number;

  cancellations?:
    number;

  returns?:
    number;

  exchanges?:
    number;

  recommendationShown?:
    number;

  recommendationClicked?:
    number;

  searches?:
    number;

  cartQuantity?:
    number;

  purchasedQuantity?:
    number;

  weightedScore?:
    number;
};

/*
|--------------------------------------------------------------------------
| CLEAN STRING
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
| PERCENTAGE
|--------------------------------------------------------------------------
*/

function percentage(
  numerator:
    number,
  denominator:
    number
) {
  if (
    denominator <=
    0
  ) {
    return 0;
  }

  return Number(
    (
      (
        numerator /
        denominator
      ) *
      100
    ).toFixed(
      2
    )
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE DAYS
|--------------------------------------------------------------------------
*/

function normalizeDays(
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
    return DEFAULT_ANALYSIS_DAYS;
  }

  return Math.min(
    MAX_ANALYSIS_DAYS,
    Math.max(
      MIN_ANALYSIS_DAYS,
      Math.floor(
        number
      )
    )
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE LIMIT
|--------------------------------------------------------------------------
*/

function normalizeLimit(
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
    return DEFAULT_LIMIT;
  }

  return Math.min(
    MAX_LIMIT,
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
| EMPTY COUNTS
|--------------------------------------------------------------------------
*/

function emptyEventCounts():
  DemandEventCounts {
  return {
    views:
      0,

    clicks:
      0,

    likes:
      0,

    dislikes:
      0,

    wishlistAdds:
      0,

    wishlistRemoves:
      0,

    cartAdds:
      0,

    cartRemoves:
      0,

    cartQuantityIncreases:
      0,

    cartQuantityDecreases:
      0,

    checkoutStarts:
      0,

    purchases:
      0,

    orderPlacements:
      0,

    cancellations:
      0,

    returns:
      0,

    exchanges:
      0,

    recommendationShown:
      0,

    recommendationClicked:
      0,

    searches:
      0,
  };
}

/*
|--------------------------------------------------------------------------
| BUILD COUNTS
|--------------------------------------------------------------------------
*/

function buildCounts(
  row:
    EventAggregateRow | null
):
  DemandEventCounts {
  return {
    views:
      safeInteger(
        row?.views
      ),

    clicks:
      safeInteger(
        row?.clicks
      ),

    likes:
      safeInteger(
        row?.likes
      ),

    dislikes:
      safeInteger(
        row?.dislikes
      ),

    wishlistAdds:
      safeInteger(
        row?.wishlistAdds
      ),

    wishlistRemoves:
      safeInteger(
        row?.wishlistRemoves
      ),

    cartAdds:
      safeInteger(
        row?.cartAdds
      ),

    cartRemoves:
      safeInteger(
        row?.cartRemoves
      ),

    cartQuantityIncreases:
      safeInteger(
        row?.cartQuantityIncreases
      ),

    cartQuantityDecreases:
      safeInteger(
        row?.cartQuantityDecreases
      ),

    checkoutStarts:
      safeInteger(
        row?.checkoutStarts
      ),

    purchases:
      safeInteger(
        row?.purchases
      ),

    orderPlacements:
      safeInteger(
        row?.orderPlacements
      ),

    cancellations:
      safeInteger(
        row?.cancellations
      ),

    returns:
      safeInteger(
        row?.returns
      ),

    exchanges:
      safeInteger(
        row?.exchanges
      ),

    recommendationShown:
      safeInteger(
        row?.recommendationShown
      ),

    recommendationClicked:
      safeInteger(
        row?.recommendationClicked
      ),

    searches:
      safeInteger(
        row?.searches
      ),
  };
}

/*
|--------------------------------------------------------------------------
| DEMAND LEVEL
|--------------------------------------------------------------------------
*/

function getDemandLevel(
  normalizedScore:
    number
):
  ProductDemandMetric["demandLevel"] {
  if (
    normalizedScore >=
    80
  ) {
    return "very_high";
  }

  if (
    normalizedScore >=
    60
  ) {
    return "high";
  }

  if (
    normalizedScore >=
    35
  ) {
    return "medium";
  }

  if (
    normalizedScore >=
    15
  ) {
    return "low";
  }

  return "very_low";
}

/*
|--------------------------------------------------------------------------
| CONVERSION SIGNAL
|--------------------------------------------------------------------------
*/

function getConversionSignal(
  views:
    number,
  purchases:
    number
):
  ProductDemandMetric["conversionSignal"] {
  if (
    views <
    10
  ) {
    return "insufficient_data";
  }

  const rate =
    percentage(
      purchases,
      views
    );

  if (
    rate >=
    12
  ) {
    return "excellent";
  }

  if (
    rate >=
    7
  ) {
    return "good";
  }

  if (
    rate >=
    3
  ) {
    return "average";
  }

  if (
    rate >=
    1
  ) {
    return "weak";
  }

  return "very_weak";
}

/*
|--------------------------------------------------------------------------
| INVENTORY SIGNAL
|--------------------------------------------------------------------------
*/

function getInventorySignal({
  stock,
  lowStockLimit,
  demandScore,
  views,
  cartAdds,
  purchases,
}: {
  stock:
    number;

  lowStockLimit:
    number;

  demandScore:
    number;

  views:
    number;

  cartAdds:
    number;

  purchases:
    number;
}):
  ProductDemandMetric["inventorySignal"] {
  if (
    stock <=
      0 &&
    (
      demandScore >
        10 ||
      views >
        10 ||
      cartAdds >
        2
    )
  ) {
    return "out_of_stock_demand";
  }

  if (
    stock <=
      lowStockLimit &&
    (
      purchases >=
        3 ||
      cartAdds >=
        5
    )
  ) {
    return "urgent_restock";
  }

  if (
    stock <=
      lowStockLimit
  ) {
    return "restock";
  }

  if (
    stock >=
      50 &&
    views <=
      5 &&
    purchases ===
      0
  ) {
    return "overstock_risk";
  }

  if (
    stock >=
      20 &&
    views >=
      10 &&
    purchases ===
      0
  ) {
    return "slow_moving";
  }

  return "healthy";
}

/*
|--------------------------------------------------------------------------
| OPPORTUNITY SCORE
|--------------------------------------------------------------------------
*/

function calculateOpportunityScore({
  demandScore,
  views,
  cartAdds,
  wishlistAdds,
  purchases,
  stock,
}: {
  demandScore:
    number;

  views:
    number;

  cartAdds:
    number;

  wishlistAdds:
    number;

  purchases:
    number;

  stock:
    number;
}) {
  let score =
    Math.max(
      0,
      demandScore
    );

  if (
    views >=
      20 &&
    purchases ===
      0
  ) {
    score +=
      20;
  }

  if (
    cartAdds >=
      5 &&
    purchases <=
      1
  ) {
    score +=
      20;
  }

  if (
    wishlistAdds >=
      5 &&
    purchases <=
      1
  ) {
    score +=
      15;
  }

  if (
    stock <=
      5 &&
    demandScore >
      15
  ) {
    score +=
      25;
  }

  return Number(
    Math.min(
      100,
      score
    ).toFixed(
      2
    )
  );
}

/*
|--------------------------------------------------------------------------
| RISK SCORE
|--------------------------------------------------------------------------
*/

function calculateRiskScore({
  purchases,
  returns,
  cancellations,
  dislikes,
}: {
  purchases:
    number;

  returns:
    number;

  cancellations:
    number;

  dislikes:
    number;
}) {
  const returnRate =
    percentage(
      returns,
      purchases
    );

  const cancellationRate =
    percentage(
      cancellations,
      purchases +
        cancellations
    );

  let score =
    0;

  score +=
    Math.min(
      50,
      returnRate *
        2
    );

  score +=
    Math.min(
      30,
      cancellationRate
    );

  score +=
    Math.min(
      20,
      dislikes *
        2
    );

  return Number(
    Math.min(
      100,
      score
    ).toFixed(
      2
    )
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT REASONS
|--------------------------------------------------------------------------
*/

function buildProductReasons(
  metric:
    Omit<
      ProductDemandMetric,
      "reasons"
    >
) {
  const reasons:
    string[] =
    [];

  if (
    metric.inventorySignal ===
    "urgent_restock"
  ) {
    reasons.push(
      "High customer demand with critically low stock."
    );
  }

  if (
    metric.inventorySignal ===
    "out_of_stock_demand"
  ) {
    reasons.push(
      "Product is out of stock while customer demand is still active."
    );
  }

  if (
    metric.inventorySignal ===
    "overstock_risk"
  ) {
    reasons.push(
      "Inventory is high but recent customer interest is very low."
    );
  }

  if (
    metric.events.views >=
      20 &&
    metric.viewToPurchaseRate <
      2
  ) {
    reasons.push(
      "Product receives customer attention but purchase conversion is weak."
    );
  }

  if (
    metric.events.cartAdds >=
      5 &&
    metric.cartToPurchaseRate <
      25
  ) {
    reasons.push(
      "Customers add this product to cart but many do not complete the purchase."
    );
  }

  if (
    metric.events.wishlistAdds >=
      5 &&
    metric.events.purchases <=
      1
  ) {
    reasons.push(
      "Wishlist interest is strong but purchase conversion is low."
    );
  }

  if (
    metric.returnRate >=
      20 &&
    metric.events.purchases >=
      3
  ) {
    reasons.push(
      "Return rate is high and should be investigated."
    );
  }

  if (
    metric.events.likes >
    metric.events.dislikes *
      2
  ) {
    reasons.push(
      "Customer sentiment is strongly positive."
    );
  }

  if (
    reasons.length ===
    0
  ) {
    reasons.push(
      "No major business anomaly detected in the selected period."
    );
  }

  return reasons;
}

/*
|--------------------------------------------------------------------------
| EVENT SCORE EXPRESSION
|--------------------------------------------------------------------------
*/

function buildWeightedScoreExpression() {
  return {
    $sum: {
      $switch: {
        branches: [
          {
            case: {
              $eq: [
                "$eventType",
                "product_view",
              ],
            },

            then:
              EVENT_WEIGHTS.product_view,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "product_click",
              ],
            },

            then:
              EVENT_WEIGHTS.product_click,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "product_like",
              ],
            },

            then:
              EVENT_WEIGHTS.product_like,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "product_dislike",
              ],
            },

            then:
              EVENT_WEIGHTS.product_dislike,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "wishlist_add",
              ],
            },

            then:
              EVENT_WEIGHTS.wishlist_add,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "wishlist_remove",
              ],
            },

            then:
              EVENT_WEIGHTS.wishlist_remove,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "add_to_cart",
              ],
            },

            then:
              EVENT_WEIGHTS.add_to_cart,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "remove_from_cart",
              ],
            },

            then:
              EVENT_WEIGHTS.remove_from_cart,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "cart_quantity_increase",
              ],
            },

            then:
              EVENT_WEIGHTS.cart_quantity_increase,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "cart_quantity_decrease",
              ],
            },

            then:
              EVENT_WEIGHTS.cart_quantity_decrease,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "checkout_started",
              ],
            },

            then:
              EVENT_WEIGHTS.checkout_started,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "order_placed",
              ],
            },

            then:
              EVENT_WEIGHTS.order_placed,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "product_purchased",
              ],
            },

            then:
              EVENT_WEIGHTS.product_purchased,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "order_cancelled",
              ],
            },

            then:
              EVENT_WEIGHTS.order_cancelled,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "return_requested",
              ],
            },

            then:
              EVENT_WEIGHTS.return_requested,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "exchange_requested",
              ],
            },

            then:
              EVENT_WEIGHTS.exchange_requested,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "recommendation_shown",
              ],
            },

            then:
              EVENT_WEIGHTS.recommendation_shown,
          },
          {
            case: {
              $eq: [
                "$eventType",
                "recommendation_clicked",
              ],
            },

            then:
              EVENT_WEIGHTS.recommendation_clicked,
          },
        ],

        default:
          0,
      },
    },
  };
}

/*
|--------------------------------------------------------------------------
| CONDITIONAL COUNT
|--------------------------------------------------------------------------
*/

function conditionalCount(
  eventType:
    CustomerAIEventType
) {
  return {
    $sum: {
      $cond: [
        {
          $eq: [
            "$eventType",
            eventType,
          ],
        },
        1,
        0,
      ],
    },
  };
}

/*
|--------------------------------------------------------------------------
| CONDITIONAL QUANTITY
|--------------------------------------------------------------------------
*/

function conditionalQuantity(
  eventType:
    CustomerAIEventType
) {
  return {
    $sum: {
      $cond: [
        {
          $eq: [
            "$eventType",
            eventType,
          ],
        },
        {
          $ifNull: [
            "$quantity",
            1,
          ],
        },
        0,
      ],
    },
  };
}

/*
|--------------------------------------------------------------------------
| GET PRODUCT EVENT AGGREGATES
|--------------------------------------------------------------------------
*/

async function getProductEventAggregates({
  from,
  to,
  category,
  productId,
}: {
  from:
    Date;

  to:
    Date;

  category:
    string;

  productId:
    string | null;
}) {
  const match:
    Record<
      string,
      unknown
    > = {
    createdAt: {
      $gte:
        from,

      $lte:
        to,
    },

    productId: {
      $ne:
        null,
    },
  };

  if (
    category
  ) {
    match.category =
      category;
  }

  if (
    productId
  ) {
    match.productId =
      new mongoose.Types.ObjectId(
        productId
      );
  }

  return CustomerAIEvent.aggregate<EventAggregateRow>(
    [
      {
        $match:
          match,
      },
      {
        $group: {
          _id:
            "$productId",

          views:
            conditionalCount(
              "product_view"
            ),

          clicks:
            conditionalCount(
              "product_click"
            ),

          likes:
            conditionalCount(
              "product_like"
            ),

          dislikes:
            conditionalCount(
              "product_dislike"
            ),

          wishlistAdds:
            conditionalCount(
              "wishlist_add"
            ),

          wishlistRemoves:
            conditionalCount(
              "wishlist_remove"
            ),

          cartAdds:
            conditionalCount(
              "add_to_cart"
            ),

          cartRemoves:
            conditionalCount(
              "remove_from_cart"
            ),

          cartQuantityIncreases:
            conditionalCount(
              "cart_quantity_increase"
            ),

          cartQuantityDecreases:
            conditionalCount(
              "cart_quantity_decrease"
            ),

          checkoutStarts:
            conditionalCount(
              "checkout_started"
            ),

          purchases:
            conditionalCount(
              "product_purchased"
            ),

          orderPlacements:
            conditionalCount(
              "order_placed"
            ),

          cancellations:
            conditionalCount(
              "order_cancelled"
            ),

          returns:
            conditionalCount(
              "return_requested"
            ),

          exchanges:
            conditionalCount(
              "exchange_requested"
            ),

          recommendationShown:
            conditionalCount(
              "recommendation_shown"
            ),

          recommendationClicked:
            conditionalCount(
              "recommendation_clicked"
            ),

          searches:
            conditionalCount(
              "product_search"
            ),

          cartQuantity:
            conditionalQuantity(
              "add_to_cart"
            ),

          purchasedQuantity:
            conditionalQuantity(
              "product_purchased"
            ),

          weightedScore:
            buildWeightedScoreExpression(),
        },
      },
    ]
  );
}

/*
|--------------------------------------------------------------------------
| CATEGORY AGGREGATES
|--------------------------------------------------------------------------
*/

async function getCategoryMetrics({
  from,
  to,
}: {
  from:
    Date;

  to:
    Date;
}): Promise<
  CategoryDemandMetric[]
> {
  const rows:
    any[] =
    await CustomerAIEvent.aggregate(
      [
        {
          $match: {
            createdAt: {
              $gte:
                from,

              $lte:
                to,
            },

            category: {
              $nin: [
                "",
                null,
              ],
            },
          },
        },
        {
          $group: {
            _id:
              "$category",

            views:
              conditionalCount(
                "product_view"
              ),

            clicks:
              conditionalCount(
                "product_click"
              ),

            likes:
              conditionalCount(
                "product_like"
              ),

            wishlistAdds:
              conditionalCount(
                "wishlist_add"
              ),

            cartAdds:
              conditionalCount(
                "add_to_cart"
              ),

            purchases:
              conditionalCount(
                "product_purchased"
              ),

            cancellations:
              conditionalCount(
                "order_cancelled"
              ),

            returns:
              conditionalCount(
                "return_requested"
              ),

            products: {
              $addToSet:
                "$productId",
            },

            demandScore:
              buildWeightedScoreExpression(),
          },
        },
        {
          $sort: {
            demandScore:
              -1,
          },
        },
      ]
    );

  return rows.map(
    (
      row
    ) => ({
      category:
        cleanString(
          row._id
        ),

      views:
        safeInteger(
          row.views
        ),

      clicks:
        safeInteger(
          row.clicks
        ),

      likes:
        safeInteger(
          row.likes
        ),

      wishlistAdds:
        safeInteger(
          row.wishlistAdds
        ),

      cartAdds:
        safeInteger(
          row.cartAdds
        ),

      purchases:
        safeInteger(
          row.purchases
        ),

      cancellations:
        safeInteger(
          row.cancellations
        ),

      returns:
        safeInteger(
          row.returns
        ),

      demandScore:
        Number(
          Math.max(
            0,
            safeNumber(
              row.demandScore
            )
          ).toFixed(
            2
          )
        ),

      viewToPurchaseRate:
        percentage(
          safeInteger(
            row.purchases
          ),
          safeInteger(
            row.views
          )
        ),

      productCount:
        Array.isArray(
          row.products
        )
          ? row.products.filter(
              Boolean
            ).length
          : 0,
    })
  );
}

/*
|--------------------------------------------------------------------------
| DIMENSION METRICS
|--------------------------------------------------------------------------
*/

async function getDimensionMetrics(
  field:
    "color" | "size",
  from:
    Date,
  to:
    Date
): Promise<
  DemandDimensionMetric[]
> {
  const groupField =
    `$${field}`;

  const rows:
    any[] =
    await CustomerAIEvent.aggregate(
      [
        {
          $match: {
            createdAt: {
              $gte:
                from,

              $lte:
                to,
            },

            [field]: {
              $nin: [
                "",
                null,
              ],
            },
          },
        },
        {
          $group: {
            _id:
              groupField,

            views:
              conditionalCount(
                "product_view"
              ),

            cartAdds:
              conditionalCount(
                "add_to_cart"
              ),

            purchases:
              conditionalCount(
                "product_purchased"
              ),

            likes:
              conditionalCount(
                "product_like"
              ),

            wishlistAdds:
              conditionalCount(
                "wishlist_add"
              ),

            returns:
              conditionalCount(
                "return_requested"
              ),

            demandScore:
              buildWeightedScoreExpression(),
          },
        },
        {
          $sort: {
            demandScore:
              -1,
          },
        },
        {
          $limit:
            50,
        },
      ]
    );

  return rows
    .map(
      (
        row
      ) => {
        const views =
          safeInteger(
            row.views
          );

        const purchases =
          safeInteger(
            row.purchases
          );

        return {
          value:
            cleanString(
              row._id
            ),

          views,

          cartAdds:
            safeInteger(
              row.cartAdds
            ),

          purchases,

          likes:
            safeInteger(
              row.likes
            ),

          wishlistAdds:
            safeInteger(
              row.wishlistAdds
            ),

          returns:
            safeInteger(
              row.returns
            ),

          demandScore:
            Number(
              Math.max(
                0,
                safeNumber(
                  row.demandScore
                )
              ).toFixed(
                2
              )
            ),

          conversionRate:
            percentage(
              purchases,
              views
            ),
        };
      }
    )
    .filter(
      (
        item
      ) =>
        Boolean(
          item.value
        )
    );
}

/*
|--------------------------------------------------------------------------
| BUILD PRODUCT METRICS
|--------------------------------------------------------------------------
*/

async function buildProductMetrics({
  aggregates,
  includeInactiveProducts,
}: {
  aggregates:
    EventAggregateRow[];

  includeInactiveProducts:
    boolean;
}): Promise<
  ProductDemandMetric[]
> {
  const productIds =
    aggregates
      .map(
        (
          row
        ) =>
          row._id
      )
      .filter(
        (
          value
        ):
          value is
            mongoose.Types.ObjectId =>
          Boolean(
            value
          )
      );

  if (
    productIds.length ===
    0
  ) {
    return [];
  }

  const productFilter:
    Record<
      string,
      unknown
    > = {
    _id: {
      $in:
        productIds,
    },

    isDeleted: {
      $ne:
        true,
    },
  };

  if (
    !includeInactiveProducts
  ) {
    productFilter.status = {
      $nin: [
        "Archived",
        "Draft",
      ],
    };
  }

  const products:
    any[] =
    await Product.find(
      productFilter
    )
      .select(
        [
          "_id",
          "sku",
          "name",
          "category",
          "subCategory",
          "brand",
          "gender",
          "price",
          "mrp",
          "discount",
          "stock",
          "sold",
          "lowStockLimit",
          "status",
          "thumbnail",
        ].join(
          " "
        )
      )
      .lean();

  const productMap =
    new Map<
      string,
      any
    >();

  for (
    const product of
    products
  ) {
    productMap.set(
      String(
        product._id
      ),
      product
    );
  }

  const maxDemandScore =
    Math.max(
      1,
      ...aggregates.map(
        (
          row
        ) =>
          Math.max(
            0,
            safeNumber(
              row.weightedScore
            )
          )
      )
    );

  const metrics:
    ProductDemandMetric[] =
    [];

  for (
    const row of
    aggregates
  ) {
    if (
      !row._id
    ) {
      continue;
    }

    const productId =
      String(
        row._id
      );

    const product =
      productMap.get(
        productId
      );

    if (
      !product
    ) {
      continue;
    }

    const events =
      buildCounts(
        row
      );

    const demandScore =
      Number(
        Math.max(
          0,
          safeNumber(
            row.weightedScore
          )
        ).toFixed(
          2
        )
      );

    const normalizedDemandScore =
      Number(
        Math.min(
          100,
          (
            demandScore /
            maxDemandScore
          ) *
            100
        ).toFixed(
          2
        )
      );

    const stock =
      safeInteger(
        product.stock
      );

    const lowStockLimit =
      Math.max(
        0,
        safeInteger(
          product.lowStockLimit
        ) ||
          5
      );

    const viewToCartRate =
      percentage(
        events.cartAdds,
        events.views
      );

    const viewToPurchaseRate =
      percentage(
        events.purchases,
        events.views
      );

    const cartToPurchaseRate =
      percentage(
        events.purchases,
        events.cartAdds
      );

    const recommendationClickRate =
      percentage(
        events.recommendationClicked,
        events.recommendationShown
      );

    const returnRate =
      percentage(
        events.returns,
        events.purchases
      );

    const cancellationRate =
      percentage(
        events.cancellations,
        events.purchases +
          events.cancellations
      );

    const inventorySignal =
      getInventorySignal(
        {
          stock,

          lowStockLimit,

          demandScore,

          views:
            events.views,

          cartAdds:
            events.cartAdds,

          purchases:
            events.purchases,
        }
      );

    const conversionSignal =
      getConversionSignal(
        events.views,
        events.purchases
      );

    const opportunityScore =
      calculateOpportunityScore(
        {
          demandScore:
            normalizedDemandScore,

          views:
            events.views,

          cartAdds:
            events.cartAdds,

          wishlistAdds:
            events.wishlistAdds,

          purchases:
            events.purchases,

          stock,
        }
      );

    const riskScore =
      calculateRiskScore(
        {
          purchases:
            events.purchases,

          returns:
            events.returns,

          cancellations:
            events.cancellations,

          dislikes:
            events.dislikes,
        }
      );

    const baseMetric:
      Omit<
        ProductDemandMetric,
        "reasons"
      > = {
      productId,

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

      stock,

      sold:
        safeInteger(
          product.sold
        ),

      lowStockLimit,

      status:
        cleanString(
          product.status
        ),

      thumbnail:
        cleanString(
          product.thumbnail
        ),

      events,

      quantities: {
        cart:
          safeInteger(
            row.cartQuantity
          ),

        purchased:
          safeInteger(
            row.purchasedQuantity
          ),
      },

      demandScore,

      normalizedDemandScore,

      viewToCartRate,

      viewToPurchaseRate,

      cartToPurchaseRate,

      recommendationClickRate,

      returnRate,

      cancellationRate,

      demandLevel:
        getDemandLevel(
          normalizedDemandScore
        ),

      inventorySignal,

      conversionSignal,

      opportunityScore,

      riskScore,
    };

    metrics.push(
      {
        ...baseMetric,

        reasons:
          buildProductReasons(
            baseMetric
          ),
      }
    );
  }

  return metrics;
}

/*
|--------------------------------------------------------------------------
| BUILD SUGGESTIONS
|--------------------------------------------------------------------------
*/

function buildSuggestions({
  products,
  categories,
  colors,
  sizes,
}: {
  products:
    ProductDemandMetric[];

  categories:
    CategoryDemandMetric[];

  colors:
    DemandDimensionMetric[];

  sizes:
    DemandDimensionMetric[];
}) {
  const suggestions:
    DemandBusinessSuggestion[] =
    [];

  /*
  |--------------------------------------------------------------------------
  | PRODUCT RESTOCK
  |--------------------------------------------------------------------------
  */

  for (
    const product of
    products
  ) {
    if (
      product.inventorySignal ===
      "urgent_restock"
    ) {
      suggestions.push(
        {
          type:
            "restock",

          priority:
            "critical",

          title:
            `Urgent restock: ${product.name}`,

          message:
            `${product.name} has strong demand but only ${product.stock} units remain. Restock should be prioritized to avoid lost sales.`,

          productId:
            product.productId,

          score:
            product.normalizedDemandScore,
        }
      );
    }

    if (
      product.inventorySignal ===
      "out_of_stock_demand"
    ) {
      suggestions.push(
        {
          type:
            "out_of_stock",

          priority:
            "critical",

          title:
            `Demand exists for out-of-stock product: ${product.name}`,

          message:
            `${product.name} is out of stock while customers are still viewing, liking or adding it to cart. Replenishment may recover missed sales.`,

          productId:
            product.productId,

          score:
            product.normalizedDemandScore,
        }
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CONVERSION
  |--------------------------------------------------------------------------
  */

  for (
    const product of
    products
  ) {
    if (
      product.events.views >=
        20 &&
      product.viewToPurchaseRate <
        2
    ) {
      suggestions.push(
        {
          type:
            "conversion",

          priority:
            product.events.cartAdds >=
              5
              ? "high"
              : "medium",

          title:
            `Improve conversion: ${product.name}`,

          message:
            `${product.name} receives ${product.events.views} views but converts only ${product.viewToPurchaseRate}% into purchases. Review price, images, product information, size availability and offer strategy.`,

          productId:
            product.productId,

          score:
            product.opportunityScore,
        }
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SLOW MOVING / OVERSTOCK
  |--------------------------------------------------------------------------
  */

  for (
    const product of
    products
  ) {
    if (
      product.inventorySignal ===
        "overstock_risk" ||
      product.inventorySignal ===
        "slow_moving"
    ) {
      suggestions.push(
        {
          type:
            "inventory",

          priority:
            product.inventorySignal ===
            "overstock_risk"
              ? "high"
              : "medium",

          title:
            `Slow-moving inventory: ${product.name}`,

          message:
            `${product.name} has ${product.stock} units in stock but weak recent demand. Consider better placement, promotion, bundling or a controlled discount before adding more stock.`,

          productId:
            product.productId,

          score:
            product.opportunityScore,
        }
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RETURN RISK
  |--------------------------------------------------------------------------
  */

  for (
    const product of
    products
  ) {
    if (
      product.events.purchases >=
        3 &&
      product.returnRate >=
        20
    ) {
      suggestions.push(
        {
          type:
            "return_risk",

          priority:
            product.returnRate >=
              35
              ? "high"
              : "medium",

          title:
            `High return rate: ${product.name}`,

          message:
            `${product.name} has a ${product.returnRate}% return-request rate. Check sizing information, product description, quality expectations and product images.`,

          productId:
            product.productId,

          score:
            product.riskScore,
        }
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT OPPORTUNITIES
  |--------------------------------------------------------------------------
  */

  for (
    const product of
    products
      .filter(
        (
          item
        ) =>
          item.opportunityScore >=
          60
      )
      .slice(
        0,
        10
      )
  ) {
    suggestions.push(
      {
        type:
          "product_opportunity",

        priority:
          product.opportunityScore >=
            80
            ? "high"
            : "medium",

        title:
          `Sales opportunity: ${product.name}`,

        message:
          `${product.name} shows strong customer interest. Demand score is ${product.normalizedDemandScore}/100 and opportunity score is ${product.opportunityScore}/100.`,

        productId:
          product.productId,

        score:
          product.opportunityScore,
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY DEMAND
  |--------------------------------------------------------------------------
  */

  for (
    const category of
    categories.slice(
      0,
      5
    )
  ) {
    if (
      category.demandScore <=
      0
    ) {
      continue;
    }

    suggestions.push(
      {
        type:
          "category_growth",

        priority:
          category.purchases >=
            10
            ? "high"
            : "medium",

        title:
          `Strong category demand: ${category.category}`,

        message:
          `${category.category} generated ${category.views} views, ${category.cartAdds} cart adds and ${category.purchases} purchases during the selected period.`,

        category:
          category.category,

        score:
          category.demandScore,
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | COLOR DEMAND
  |--------------------------------------------------------------------------
  */

  for (
    const color of
    colors.slice(
      0,
      3
    )
  ) {
    if (
      color.demandScore <=
      0
    ) {
      continue;
    }

    suggestions.push(
      {
        type:
          "color_demand",

        priority:
          color.purchases >=
            10
            ? "high"
            : "medium",

        title:
          `Popular color: ${color.value}`,

        message:
          `${color.value} is showing strong customer demand with ${color.cartAdds} cart adds and ${color.purchases} purchases.`,

        value:
          color.value,

        score:
          color.demandScore,
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SIZE DEMAND
  |--------------------------------------------------------------------------
  */

  for (
    const size of
    sizes.slice(
      0,
      3
    )
  ) {
    if (
      size.demandScore <=
      0
    ) {
      continue;
    }

    suggestions.push(
      {
        type:
          "size_demand",

        priority:
          size.purchases >=
            10
            ? "high"
            : "medium",

        title:
          `Popular size: ${size.value}`,

        message:
          `Size ${size.value} is showing strong customer demand with ${size.cartAdds} cart adds and ${size.purchases} purchases.`,

        value:
          size.value,

        score:
          size.demandScore,
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SORT PRIORITY
  |--------------------------------------------------------------------------
  */

  const priorityWeight = {
    critical:
      4,

    high:
      3,

    medium:
      2,

    low:
      1,
  };

  return suggestions
    .sort(
      (
        first,
        second
      ) => {
        const priorityDifference =
          priorityWeight[
            second.priority
          ] -
          priorityWeight[
            first.priority
          ];

        if (
          priorityDifference !==
          0
        ) {
          return priorityDifference;
        }

        return (
          safeNumber(
            second.score
          ) -
          safeNumber(
            first.score
          )
        );
      }
    )
    .slice(
      0,
      50
    );
}

/*
|--------------------------------------------------------------------------
| MAIN DEMAND INTELLIGENCE
|--------------------------------------------------------------------------
*/

export async function getDemandIntelligence(
  input:
    DemandIntelligenceInput =
      {}
): Promise<
  DemandIntelligenceResult
> {
  const days =
    normalizeDays(
      input.days
    );

  const limit =
    normalizeLimit(
      input.limit
    );

  const to =
    new Date();

  const from =
    new Date(
      to.getTime() -
        days *
          24 *
          60 *
          60 *
          1000
    );

  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | OPTIONAL FILTERS
    |--------------------------------------------------------------------------
    */

    const category =
      cleanString(
        input.category
      );

    const productId =
      typeof input.productId ===
        "string" &&
      mongoose.Types.ObjectId.isValid(
        input.productId
      )
        ? input.productId
        : null;

    /*
    |--------------------------------------------------------------------------
    | PRODUCT AGGREGATES
    |--------------------------------------------------------------------------
    */

    const productAggregates =
      await getProductEventAggregates(
        {
          from,

          to,

          category,

          productId,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT METRICS
    |--------------------------------------------------------------------------
    */

    const products =
      await buildProductMetrics(
        {
          aggregates:
            productAggregates,

          includeInactiveProducts:
            input.includeInactiveProducts ===
            true,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | CATEGORY / COLOR / SIZE
    |--------------------------------------------------------------------------
    */

    const [
      categories,
      colors,
      sizes,
    ] =
      await Promise.all(
        [
          getCategoryMetrics(
            {
              from,
              to,
            }
          ),

          getDimensionMetrics(
            "color",
            from,
            to
          ),

          getDimensionMetrics(
            "size",
            from,
            to
          ),
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    const summaryRows:
      any[] =
      await CustomerAIEvent.aggregate(
        [
          {
            $match: {
              createdAt: {
                $gte:
                  from,

                $lte:
                  to,
              },
            },
          },
          {
            $group: {
              _id:
                null,

              totalEvents: {
                $sum:
                  1,
              },

              productViews:
                conditionalCount(
                  "product_view"
                ),

              productClicks:
                conditionalCount(
                  "product_click"
                ),

              cartAdds:
                conditionalCount(
                  "add_to_cart"
                ),

              wishlistAdds:
                conditionalCount(
                  "wishlist_add"
                ),

              purchases:
                conditionalCount(
                  "product_purchased"
                ),

              cancellations:
                conditionalCount(
                  "order_cancelled"
                ),

              returns:
                conditionalCount(
                  "return_requested"
                ),

              exchanges:
                conditionalCount(
                  "exchange_requested"
                ),

              searches:
                conditionalCount(
                  "product_search"
                ),

              uniqueProducts: {
                $addToSet:
                  "$productId",
              },
            },
          },
        ]
      );

    const summaryRow =
      summaryRows[0] ||
      {};

    const productViews =
      safeInteger(
        summaryRow.productViews
      );

    const cartAdds =
      safeInteger(
        summaryRow.cartAdds
      );

    const purchases =
      safeInteger(
        summaryRow.purchases
      );

    /*
    |--------------------------------------------------------------------------
    | HOT PRODUCTS
    |--------------------------------------------------------------------------
    */

    const hotProducts =
      [
        ...products,
      ]
        .sort(
          (
            first,
            second
          ) =>
            second.normalizedDemandScore -
            first.normalizedDemandScore
        )
        .slice(
          0,
          limit
        );

    /*
    |--------------------------------------------------------------------------
    | SLOW PRODUCTS
    |--------------------------------------------------------------------------
    */

    const slowProducts =
      products
        .filter(
          (
            product
          ) =>
            product.stock >
              0 &&
            (
              product.inventorySignal ===
                "slow_moving" ||
              product.inventorySignal ===
                "overstock_risk" ||
              (
                product.events.views >
                  0 &&
                product.events.purchases ===
                  0
              )
            )
        )
        .sort(
          (
            first,
            second
          ) =>
            second.stock -
            first.stock
        )
        .slice(
          0,
          limit
        );

    /*
    |--------------------------------------------------------------------------
    | RESTOCK
    |--------------------------------------------------------------------------
    */

    const restockCandidates =
      products
        .filter(
          (
            product
          ) =>
            [
              "urgent_restock",
              "restock",
              "out_of_stock_demand",
            ].includes(
              product.inventorySignal
            )
        )
        .sort(
          (
            first,
            second
          ) =>
            second.normalizedDemandScore -
            first.normalizedDemandScore
        )
        .slice(
          0,
          limit
        );

    /*
    |--------------------------------------------------------------------------
    | CONVERSION OPPORTUNITIES
    |--------------------------------------------------------------------------
    */

    const conversionOpportunities =
      products
        .filter(
          (
            product
          ) =>
            product.events.views >=
              10 &&
            (
              product.conversionSignal ===
                "weak" ||
              product.conversionSignal ===
                "very_weak" ||
              (
                product.events.cartAdds >=
                  3 &&
                product.cartToPurchaseRate <
                  30
              )
            )
        )
        .sort(
          (
            first,
            second
          ) =>
            second.opportunityScore -
            first.opportunityScore
        )
        .slice(
          0,
          limit
        );

    /*
    |--------------------------------------------------------------------------
    | RETURN RISK
    |--------------------------------------------------------------------------
    */

    const returnRiskProducts =
      products
        .filter(
          (
            product
          ) =>
            product.events.purchases >
              0 &&
            (
              product.returnRate >=
                15 ||
              product.riskScore >=
                40
            )
        )
        .sort(
          (
            first,
            second
          ) =>
            second.riskScore -
            first.riskScore
        )
        .slice(
          0,
          limit
        );

    /*
    |--------------------------------------------------------------------------
    | BUSINESS SUGGESTIONS
    |--------------------------------------------------------------------------
    */

    const suggestions =
      buildSuggestions(
        {
          products,

          categories,

          colors,

          sizes,
        }
      );

    return {
      success:
        true,

      message:
        "SilentGEN demand intelligence generated successfully.",

      period: {
        days,

        from,

        to,
      },

      summary: {
        totalEvents:
          safeInteger(
            summaryRow.totalEvents
          ),

        productViews,

        productClicks:
          safeInteger(
            summaryRow.productClicks
          ),

        cartAdds,

        wishlistAdds:
          safeInteger(
            summaryRow.wishlistAdds
          ),

        purchases,

        cancellations:
          safeInteger(
            summaryRow.cancellations
          ),

        returns:
          safeInteger(
            summaryRow.returns
          ),

        exchanges:
          safeInteger(
            summaryRow.exchanges
          ),

        searches:
          safeInteger(
            summaryRow.searches
          ),

        uniqueProducts:
          Array.isArray(
            summaryRow.uniqueProducts
          )
            ? summaryRow.uniqueProducts
                .filter(
                  Boolean
                )
                .length
            : 0,

        overallViewToPurchaseRate:
          percentage(
            purchases,
            productViews
          ),

        overallCartToPurchaseRate:
          percentage(
            purchases,
            cartAdds
          ),
      },

      hotProducts,

      slowProducts,

      restockCandidates,

      conversionOpportunities,

      returnRiskProducts,

      categories:
        categories.slice(
          0,
          limit
        ),

      colors:
        colors.slice(
          0,
          limit
        ),

      sizes:
        sizes.slice(
          0,
          limit
        ),

      suggestions,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN demand intelligence error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to generate SilentGEN demand intelligence.",

      period: {
        days,

        from,

        to,
      },

      summary: {
        totalEvents:
          0,

        productViews:
          0,

        productClicks:
          0,

        cartAdds:
          0,

        wishlistAdds:
          0,

        purchases:
          0,

        cancellations:
          0,

        returns:
          0,

        exchanges:
          0,

        searches:
          0,

        uniqueProducts:
          0,

        overallViewToPurchaseRate:
          0,

        overallCartToPurchaseRate:
          0,
      },

      hotProducts:
        [],

      slowProducts:
        [],

      restockCandidates:
        [],

      conversionOpportunities:
        [],

      returnRiskProducts:
        [],

      categories:
        [],

      colors:
        [],

      sizes:
        [],

      suggestions:
        [],
    };
  }
}

/*
|--------------------------------------------------------------------------
| ADMIN QUICK BUSINESS SUMMARY
|--------------------------------------------------------------------------
|
| Small payload designed specifically for Admin AI prompt/tool usage.
|
|--------------------------------------------------------------------------
*/

export async function getAdminDemandSummary(
  days =
    DEFAULT_ANALYSIS_DAYS
) {
  const intelligence =
    await getDemandIntelligence(
      {
        days,

        limit:
          10,
      }
    );

  return {
    success:
      intelligence.success,

    period:
      intelligence.period,

    summary:
      intelligence.summary,

    hotProducts:
      intelligence.hotProducts.slice(
        0,
        10
      ),

    slowProducts:
      intelligence.slowProducts.slice(
        0,
        10
      ),

    restockCandidates:
      intelligence.restockCandidates.slice(
        0,
        10
      ),

    conversionOpportunities:
      intelligence.conversionOpportunities.slice(
        0,
        10
      ),

    returnRiskProducts:
      intelligence.returnRiskProducts.slice(
        0,
        10
      ),

    topCategories:
      intelligence.categories.slice(
        0,
        10
      ),

    topColors:
      intelligence.colors.slice(
        0,
        10
      ),

    topSizes:
      intelligence.sizes.slice(
        0,
        10
      ),

    suggestions:
      intelligence.suggestions.slice(
        0,
        20
      ),
  };
}

/*
|--------------------------------------------------------------------------
| PRODUCT-SPECIFIC DEMAND
|--------------------------------------------------------------------------
*/

export async function getProductDemandIntelligence(
  productId:
    string,
  days =
    DEFAULT_ANALYSIS_DAYS
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      productId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid product id.",

      product:
        null,
    };
  }

  const intelligence =
    await getDemandIntelligence(
      {
        productId,

        days,

        limit:
          1,

        includeInactiveProducts:
          true,
      }
    );

  return {
    success:
      intelligence.success,

    message:
      intelligence.message,

    period:
      intelligence.period,

    product:
      intelligence.hotProducts[0] ||
      intelligence.slowProducts[0] ||
      intelligence.restockCandidates[0] ||
      intelligence.conversionOpportunities[0] ||
      null,
  };
}

/*
|--------------------------------------------------------------------------
| CATEGORY-SPECIFIC DEMAND
|--------------------------------------------------------------------------
*/

export async function getCategoryDemandIntelligence(
  category:
    string,
  days =
    DEFAULT_ANALYSIS_DAYS
) {
  const cleanCategory =
    cleanString(
      category
    );

  if (
    !cleanCategory
  ) {
    return {
      success:
        false,

      message:
        "Category is required.",
    };
  }

  return getDemandIntelligence(
    {
      category:
        cleanCategory,

      days,

      limit:
        25,
    }
  );
}