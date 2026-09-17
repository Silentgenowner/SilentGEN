import connectDB from "@/lib/connectDB";

import CustomerDemandSnapshot, {
  type CustomerDemandSnapshotPeriod,
} from "@/models/CustomerDemandSnapshot";

import {
  getDemandIntelligence,
  type DemandIntelligenceResult,
  type ProductDemandMetric,
} from "@/lib/ai/learning/demandIntelligence";

/*
|--------------------------------------------------------------------------
| SILENTGEN DEMAND SNAPSHOT SERVICE
|--------------------------------------------------------------------------
|
| Converts live demand intelligence into persistent historical snapshots.
|
| Used by:
|
| - Admin AI
| - Admin dashboard
| - scheduled analytics
| - historical demand comparison
| - sales-growth suggestions
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DAILY_DAYS =
  1;

const WEEKLY_DAYS =
  7;

const MONTHLY_DAYS =
  30;

const DEFAULT_ADMIN_PERIOD:
  CustomerDemandSnapshotPeriod =
  "weekly";

const SNAPSHOT_STALE_AFTER_MS =
  60 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| SOURCE
|--------------------------------------------------------------------------
*/

export type DemandSnapshotSource =
  | "system"
  | "admin_ai"
  | "manual";

/*
|--------------------------------------------------------------------------
| CREATE INPUT
|--------------------------------------------------------------------------
*/

export type CreateDemandSnapshotInput = {
  periodType?:
    CustomerDemandSnapshotPeriod;

  days?:
    number;

  source?:
    DemandSnapshotSource;

  forceRefresh?:
    boolean;

  limit?:
    number;
};

/*
|--------------------------------------------------------------------------
| TREND DIRECTION
|--------------------------------------------------------------------------
*/

export type DemandTrendDirection =
  | "up"
  | "down"
  | "stable"
  | "new"
  | "unknown";

/*
|--------------------------------------------------------------------------
| TREND VALUE
|--------------------------------------------------------------------------
*/

export type DemandTrendMetric = {
  current:
    number;

  previous:
    number;

  absoluteChange:
    number;

  percentageChange:
    number;

  direction:
    DemandTrendDirection;
};

/*
|--------------------------------------------------------------------------
| PRODUCT TREND
|--------------------------------------------------------------------------
*/

export type ProductDemandTrend = {
  productId:
    string;

  name:
    string;

  sku:
    string;

  currentDemandScore:
    number;

  previousDemandScore:
    number;

  change:
    number;

  percentageChange:
    number;

  direction:
    DemandTrendDirection;

  currentPurchases:
    number;

  previousPurchases:
    number;

  currentViews:
    number;

  previousViews:
    number;

  currentStock:
    number;

  inventorySignal:
    string;
};

/*
|--------------------------------------------------------------------------
| SNAPSHOT COMPARISON
|--------------------------------------------------------------------------
*/

export type DemandSnapshotComparison = {
  success:
    boolean;

  message:
    string;

  currentSnapshotId:
    string | null;

  previousSnapshotId:
    string | null;

  periodType:
    CustomerDemandSnapshotPeriod;

  metrics: {
    totalEvents:
      DemandTrendMetric;

    productViews:
      DemandTrendMetric;

    cartAdds:
      DemandTrendMetric;

    wishlistAdds:
      DemandTrendMetric;

    purchases:
      DemandTrendMetric;

    cancellations:
      DemandTrendMetric;

    returns:
      DemandTrendMetric;

    exchanges:
      DemandTrendMetric;

    searches:
      DemandTrendMetric;

    viewToPurchaseRate:
      DemandTrendMetric;

    cartToPurchaseRate:
      DemandTrendMetric;
  } | null;

  risingProducts:
    ProductDemandTrend[];

  fallingProducts:
    ProductDemandTrend[];

  newDemandProducts:
    ProductDemandTrend[];
};

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
| ROUND
|--------------------------------------------------------------------------
*/

function round(
  value:
    number,
  decimals =
    2
) {
  const multiplier =
    10 **
    decimals;

  return (
    Math.round(
      value *
      multiplier
    ) /
    multiplier
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
    return WEEKLY_DAYS;
  }

  return Math.min(
    365,
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
| PERIOD DAYS
|--------------------------------------------------------------------------
*/

function getPeriodDays(
  periodType:
    CustomerDemandSnapshotPeriod,
  customDays?:
    number
) {
  switch (
    periodType
  ) {
    case "daily":
      return DAILY_DAYS;

    case "monthly":
      return MONTHLY_DAYS;

    case "custom":
      return normalizeDays(
        customDays
      );

    case "weekly":
    default:
      return WEEKLY_DAYS;
  }
}

/*
|--------------------------------------------------------------------------
| START OF DAY UTC
|--------------------------------------------------------------------------
*/

function startOfUtcDay(
  date:
    Date
) {
  const result =
    new Date(
      date
    );

  result.setUTCHours(
    0,
    0,
    0,
    0
  );

  return result;
}

/*
|--------------------------------------------------------------------------
| END OF DAY UTC
|--------------------------------------------------------------------------
*/

function endOfUtcDay(
  date:
    Date
) {
  const result =
    new Date(
      date
    );

  result.setUTCHours(
    23,
    59,
    59,
    999
  );

  return result;
}

/*
|--------------------------------------------------------------------------
| SNAPSHOT RANGE
|--------------------------------------------------------------------------
|
| Snapshot range is normalized to UTC days so repeated creation in the same
| business day updates the same snapshot instead of producing duplicates.
|
|--------------------------------------------------------------------------
*/

function getSnapshotRange(
  days:
    number
) {
  const now =
    new Date();

  const to =
    endOfUtcDay(
      now
    );

  const from =
    startOfUtcDay(
      new Date(
        to.getTime() -
          (
            days -
            1
          ) *
            24 *
            60 *
            60 *
            1000
      )
    );

  return {
    from,
    to,
  };
}

/*
|--------------------------------------------------------------------------
| OBJECT ID STRING
|--------------------------------------------------------------------------
*/

function idString(
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

  return String(
    value
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT ID FROM METRIC
|--------------------------------------------------------------------------
*/

function getMetricProductId(
  metric:
    ProductDemandMetric
) {
  return String(
    metric.productId ||
      ""
  );
}

/*
|--------------------------------------------------------------------------
| MAP PRODUCT FOR SNAPSHOT
|--------------------------------------------------------------------------
*/

function mapProductForSnapshot(
  product:
    ProductDemandMetric
) {
  return {
    productId:
      product.productId,

    name:
      product.name,

    sku:
      product.sku,

    category:
      product.category,

    subCategory:
      product.subCategory,

    brand:
      product.brand,

    gender:
      product.gender,

    price:
      product.price,

    mrp:
      product.mrp,

    discount:
      product.discount,

    stock:
      product.stock,

    sold:
      product.sold,

    lowStockLimit:
      product.lowStockLimit,

    status:
      product.status,

    thumbnail:
      product.thumbnail,

    events:
      product.events,

    cartQuantity:
      product.quantities.cart,

    purchasedQuantity:
      product.quantities.purchased,

    demandScore:
      product.demandScore,

    normalizedDemandScore:
      product.normalizedDemandScore,

    viewToCartRate:
      product.viewToCartRate,

    viewToPurchaseRate:
      product.viewToPurchaseRate,

    cartToPurchaseRate:
      product.cartToPurchaseRate,

    recommendationClickRate:
      product.recommendationClickRate,

    returnRate:
      product.returnRate,

    cancellationRate:
      product.cancellationRate,

    demandLevel:
      product.demandLevel,

    inventorySignal:
      product.inventorySignal,

    conversionSignal:
      product.conversionSignal,

    opportunityScore:
      product.opportunityScore,

    riskScore:
      product.riskScore,

    reasons:
      product.reasons,
  };
}

/*
|--------------------------------------------------------------------------
| MAP INTELLIGENCE TO SNAPSHOT
|--------------------------------------------------------------------------
*/

function mapIntelligenceForSnapshot(
  intelligence:
    DemandIntelligenceResult
) {
  return {
    summary:
      intelligence.summary,

    hotProducts:
      intelligence.hotProducts.map(
        mapProductForSnapshot
      ),

    slowProducts:
      intelligence.slowProducts.map(
        mapProductForSnapshot
      ),

    restockCandidates:
      intelligence.restockCandidates.map(
        mapProductForSnapshot
      ),

    conversionOpportunities:
      intelligence.conversionOpportunities.map(
        mapProductForSnapshot
      ),

    returnRiskProducts:
      intelligence.returnRiskProducts.map(
        mapProductForSnapshot
      ),

    categories:
      intelligence.categories,

    colors:
      intelligence.colors,

    sizes:
      intelligence.sizes,

    suggestions:
      intelligence.suggestions.map(
        (
          suggestion
        ) => ({
          type:
            suggestion.type,

          priority:
            suggestion.priority,

          title:
            suggestion.title,

          message:
            suggestion.message,

          productId:
            suggestion.productId ||
            null,

          category:
            suggestion.category ||
            "",

          value:
            suggestion.value ||
            "",

          score:
            safeNumber(
              suggestion.score
            ),
        })
      ),
  };
}

/*
|--------------------------------------------------------------------------
| SNAPSHOT FRESHNESS
|--------------------------------------------------------------------------
*/

function isSnapshotFresh(
  generatedAt:
    unknown
) {
  if (
    !generatedAt
  ) {
    return false;
  }

  const date =
    new Date(
      generatedAt as
        string | number | Date
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }

  return (
    Date.now() -
      date.getTime() <
    SNAPSHOT_STALE_AFTER_MS
  );
}

/*
|--------------------------------------------------------------------------
| CREATE / UPDATE SNAPSHOT
|--------------------------------------------------------------------------
*/

export async function createDemandSnapshot(
  input:
    CreateDemandSnapshotInput =
      {}
) {
  try {
    await connectDB();

    const periodType =
      input.periodType ||
      DEFAULT_ADMIN_PERIOD;

    const days =
      getPeriodDays(
        periodType,
        input.days
      );

    const source =
      input.source ||
      "system";

    const {
      from,
      to,
    } =
      getSnapshotRange(
        days
      );

    /*
    |--------------------------------------------------------------------------
    | EXISTING SNAPSHOT
    |--------------------------------------------------------------------------
    */

    const existing:
      any =
      await CustomerDemandSnapshot.findOne(
        {
          periodType,

          from,

          to,
        }
      );

    if (
      existing &&
      input.forceRefresh !==
        true &&
      isSnapshotFresh(
        existing.generatedAt
      )
    ) {
      return {
        success:
          true,

        created:
          false,

        refreshed:
          false,

        fromCache:
          true,

        message:
          "Fresh demand snapshot already exists.",

        snapshot:
          existing,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | LIVE INTELLIGENCE
    |--------------------------------------------------------------------------
    */

    const intelligence =
      await getDemandIntelligence(
        {
          days,

          limit:
            input.limit ||
            50,

          includeInactiveProducts:
            true,
        }
      );

    if (
      !intelligence.success
    ) {
      return {
        success:
          false,

        created:
          false,

        refreshed:
          false,

        fromCache:
          false,

        message:
          intelligence.message,

        snapshot:
          existing ||
          null,
      };
    }

    const snapshotData =
      mapIntelligenceForSnapshot(
        intelligence
      );

    /*
    |--------------------------------------------------------------------------
    | UPSERT
    |--------------------------------------------------------------------------
    */

    const snapshot:
      any =
      await CustomerDemandSnapshot.findOneAndUpdate(
        {
          periodType,

          from,

          to,
        },
        {
          $set: {
            periodDays:
              days,

            generatedAt:
              new Date(),

            summary:
              snapshotData.summary,

            hotProducts:
              snapshotData.hotProducts,

            slowProducts:
              snapshotData.slowProducts,

            restockCandidates:
              snapshotData.restockCandidates,

            conversionOpportunities:
              snapshotData
                .conversionOpportunities,

            returnRiskProducts:
              snapshotData
                .returnRiskProducts,

            categories:
              snapshotData.categories,

            colors:
              snapshotData.colors,

            sizes:
              snapshotData.sizes,

            suggestions:
              snapshotData.suggestions,

            source,

            version:
              Math.max(
                1,
                safeInteger(
                  existing?.version
                ) +
                  (
                    existing
                      ? 1
                      : 0
                  )
              ),
          },

          $setOnInsert: {
            periodType,

            from,

            to,
          },
        },
        {
          new:
            true,

          upsert:
            true,

          setDefaultsOnInsert:
            true,
        }
      );

    return {
      success:
        true,

      created:
        !existing,

      refreshed:
        Boolean(
          existing
        ),

      fromCache:
        false,

      message:
        existing
          ? "Demand snapshot refreshed successfully."
          : "Demand snapshot created successfully.",

      snapshot,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN demand snapshot creation error:",
      error
    );

    return {
      success:
        false,

      created:
        false,

      refreshed:
        false,

      fromCache:
        false,

      message:
        "Unable to create demand snapshot.",

      snapshot:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| CREATE DAILY SNAPSHOT
|--------------------------------------------------------------------------
*/

export async function createDailyDemandSnapshot(
  source:
    DemandSnapshotSource =
      "system",
  forceRefresh =
    false
) {
  return createDemandSnapshot(
    {
      periodType:
        "daily",

      source,

      forceRefresh,
    }
  );
}

/*
|--------------------------------------------------------------------------
| CREATE WEEKLY SNAPSHOT
|--------------------------------------------------------------------------
*/

export async function createWeeklyDemandSnapshot(
  source:
    DemandSnapshotSource =
      "system",
  forceRefresh =
    false
) {
  return createDemandSnapshot(
    {
      periodType:
        "weekly",

      source,

      forceRefresh,
    }
  );
}

/*
|--------------------------------------------------------------------------
| CREATE MONTHLY SNAPSHOT
|--------------------------------------------------------------------------
*/

export async function createMonthlyDemandSnapshot(
  source:
    DemandSnapshotSource =
      "system",
  forceRefresh =
    false
) {
  return createDemandSnapshot(
    {
      periodType:
        "monthly",

      source,

      forceRefresh,
    }
  );
}

/*
|--------------------------------------------------------------------------
| GET LATEST SNAPSHOT
|--------------------------------------------------------------------------
*/

export async function getLatestDemandSnapshot(
  periodType:
    CustomerDemandSnapshotPeriod =
      DEFAULT_ADMIN_PERIOD
) {
  try {
    await connectDB();

    const snapshot =
      await CustomerDemandSnapshot.findOne(
        {
          periodType,
        }
      )
        .sort(
          {
            generatedAt:
              -1,
          }
        )
        .lean();

    return {
      success:
        true,

      message:
        snapshot
          ? "Latest demand snapshot loaded successfully."
          : "No demand snapshot exists yet.",

      snapshot:
        snapshot ||
        null,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN latest demand snapshot error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to load latest demand snapshot.",

      snapshot:
        null,
    };
  }
}

/*
|--------------------------------------------------------------------------
| GET LATEST SNAPSHOT OR CREATE
|--------------------------------------------------------------------------
|
| Best function for Admin AI.
|
| 1. Get latest snapshot.
| 2. If fresh -> return it.
| 3. If missing/stale -> generate fresh snapshot.
|
|--------------------------------------------------------------------------
*/

export async function getLatestOrCreateDemandSnapshot(
  periodType:
    CustomerDemandSnapshotPeriod =
      DEFAULT_ADMIN_PERIOD,
  source:
    DemandSnapshotSource =
      "admin_ai"
) {
  const latest =
    await getLatestDemandSnapshot(
      periodType
    );

  if (
    latest.success &&
    latest.snapshot &&
    isSnapshotFresh(
      latest.snapshot.generatedAt
    )
  ) {
    return {
      success:
        true,

      fromCache:
        true,

      message:
        "Fresh demand snapshot loaded successfully.",

      snapshot:
        latest.snapshot,
    };
  }

  const fresh =
    await createDemandSnapshot(
      {
        periodType,

        source,

        forceRefresh:
          true,
      }
    );

  if (
    fresh.success &&
    fresh.snapshot
  ) {
    return {
      success:
        true,

      fromCache:
        false,

      message:
        fresh.message,

      snapshot:
        fresh.snapshot,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | STALE FALLBACK
  |--------------------------------------------------------------------------
  |
  | If fresh generation fails but an older snapshot exists, Admin AI can still
  | use it as long as it clearly treats it as historical/stale data.
  |
  |--------------------------------------------------------------------------
  */

  if (
    latest.snapshot
  ) {
    return {
      success:
        true,

      fromCache:
        true,

      stale:
        true,

      message:
        "Fresh demand generation failed. Returning latest available historical snapshot.",

      snapshot:
        latest.snapshot,
    };
  }

  return {
    success:
      false,

    fromCache:
      false,

    message:
      "No demand intelligence snapshot is currently available.",

    snapshot:
      null,
  };
}

/*
|--------------------------------------------------------------------------
| GET SNAPSHOT HISTORY
|--------------------------------------------------------------------------
*/

export async function getDemandSnapshotHistory({
  periodType =
    DEFAULT_ADMIN_PERIOD,
  limit =
    12,
}: {
  periodType?:
    CustomerDemandSnapshotPeriod;

  limit?:
    number;
} = {}) {
  try {
    await connectDB();

    const safeLimit =
      Math.min(
        100,
        Math.max(
          1,
          safeInteger(
            limit
          ) ||
            12
        )
      );

    const snapshots =
      await CustomerDemandSnapshot.find(
        {
          periodType,
        }
      )
        .sort(
          {
            generatedAt:
              -1,
          }
        )
        .limit(
          safeLimit
        )
        .lean();

    return {
      success:
        true,

      message:
        "Demand snapshot history loaded successfully.",

      snapshots,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN demand snapshot history error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to load demand snapshot history.",

      snapshots:
        [],
    };
  }
}

/*
|--------------------------------------------------------------------------
| TREND
|--------------------------------------------------------------------------
*/

function calculateTrend(
  current:
    unknown,
  previous:
    unknown
):
  DemandTrendMetric {
  const currentValue =
    safeNumber(
      current
    );

  const previousValue =
    safeNumber(
      previous
    );

  const absoluteChange =
    round(
      currentValue -
      previousValue
    );

  /*
  |--------------------------------------------------------------------------
  | NO PREVIOUS DATA
  |--------------------------------------------------------------------------
  */

  if (
    previousValue ===
      0
  ) {
    if (
      currentValue >
      0
    ) {
      return {
        current:
          currentValue,

        previous:
          previousValue,

        absoluteChange,

        percentageChange:
          100,

        direction:
          "new",
      };
    }

    return {
      current:
        currentValue,

      previous:
        previousValue,

      absoluteChange:
        0,

      percentageChange:
        0,

      direction:
        "stable",
    };
  }

  const percentageChange =
    round(
      (
        absoluteChange /
        Math.abs(
          previousValue
        )
      ) *
        100
    );

  let direction:
    DemandTrendDirection =
    "stable";

  if (
    percentageChange >
    2
  ) {
    direction =
      "up";
  } else if (
    percentageChange <
    -2
  ) {
    direction =
      "down";
  }

  return {
    current:
      currentValue,

    previous:
      previousValue,

    absoluteChange,

    percentageChange,

    direction,
  };
}

/*
|--------------------------------------------------------------------------
| GET SNAPSHOT PRODUCTS
|--------------------------------------------------------------------------
|
| hotProducts is the primary source.
|
| Other lists are merged because a product may appear only in a risk /
| conversion / stock bucket.
|
|--------------------------------------------------------------------------
*/

function getAllSnapshotProducts(
  snapshot:
    any
) {
  const map =
    new Map<
      string,
      any
    >();

  const groups = [
    snapshot?.hotProducts,
    snapshot?.slowProducts,
    snapshot?.restockCandidates,
    snapshot?.conversionOpportunities,
    snapshot?.returnRiskProducts,
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
      const product of
      group
    ) {
      const productId =
        idString(
          product?.productId
        );

      if (
        !productId
      ) {
        continue;
      }

      const existing =
        map.get(
          productId
        );

      /*
      |--------------------------------------------------------------------------
      | Prefer object with stronger demand data
      |--------------------------------------------------------------------------
      */

      if (
        !existing ||
        safeNumber(
          product?.normalizedDemandScore
        ) >
          safeNumber(
            existing
              ?.normalizedDemandScore
          )
      ) {
        map.set(
          productId,
          product
        );
      }
    }
  }

  return map;
}

/*
|--------------------------------------------------------------------------
| PRODUCT TREND
|--------------------------------------------------------------------------
*/

function buildProductTrend({
  currentProduct,
  previousProduct,
}: {
  currentProduct:
    any;

  previousProduct:
    any | null;
}):
  ProductDemandTrend {
  const currentScore =
    safeNumber(
      currentProduct
        ?.normalizedDemandScore
    );

  const previousScore =
    safeNumber(
      previousProduct
        ?.normalizedDemandScore
    );

  const change =
    round(
      currentScore -
      previousScore
    );

  let percentageChange =
    0;

  let direction:
    DemandTrendDirection =
    "stable";

  if (
    !previousProduct
  ) {
    direction =
      currentScore >
        0
        ? "new"
        : "unknown";

    percentageChange =
      currentScore >
        0
        ? 100
        : 0;
  } else if (
    previousScore ===
    0
  ) {
    if (
      currentScore >
      0
    ) {
      direction =
        "new";

      percentageChange =
        100;
    }
  } else {
    percentageChange =
      round(
        (
          change /
          Math.abs(
            previousScore
          )
        ) *
          100
      );

    if (
      percentageChange >
      2
    ) {
      direction =
        "up";
    } else if (
      percentageChange <
      -2
    ) {
      direction =
        "down";
    }
  }

  return {
    productId:
      idString(
        currentProduct
          ?.productId
      ),

    name:
      String(
        currentProduct
          ?.name ||
          ""
      ),

    sku:
      String(
        currentProduct
          ?.sku ||
          ""
      ),

    currentDemandScore:
      currentScore,

    previousDemandScore:
      previousScore,

    change,

    percentageChange,

    direction,

    currentPurchases:
      safeInteger(
        currentProduct
          ?.events
          ?.purchases
      ),

    previousPurchases:
      safeInteger(
        previousProduct
          ?.events
          ?.purchases
      ),

    currentViews:
      safeInteger(
        currentProduct
          ?.events
          ?.views
      ),

    previousViews:
      safeInteger(
        previousProduct
          ?.events
          ?.views
      ),

    currentStock:
      safeInteger(
        currentProduct
          ?.stock
      ),

    inventorySignal:
      String(
        currentProduct
          ?.inventorySignal ||
          "unknown"
      ),
  };
}

/*
|--------------------------------------------------------------------------
| COMPARE LATEST TWO SNAPSHOTS
|--------------------------------------------------------------------------
*/

export async function compareDemandSnapshots(
  periodType:
    CustomerDemandSnapshotPeriod =
      DEFAULT_ADMIN_PERIOD
): Promise<
  DemandSnapshotComparison
> {
  try {
    await connectDB();

    const snapshots:
      any[] =
      await CustomerDemandSnapshot.find(
        {
          periodType,
        }
      )
        .sort(
          {
            generatedAt:
              -1,
          }
        )
        .limit(
          2
        )
        .lean();

    const current =
      snapshots[0];

    const previous =
      snapshots[1];

    if (
      !current
    ) {
      return {
        success:
          false,

        message:
          "No demand snapshots are available for comparison.",

        currentSnapshotId:
          null,

        previousSnapshotId:
          null,

        periodType,

        metrics:
          null,

        risingProducts:
          [],

        fallingProducts:
          [],

        newDemandProducts:
          [],
      };
    }

    /*
    |--------------------------------------------------------------------------
    | FIRST SNAPSHOT
    |--------------------------------------------------------------------------
    */

    if (
      !previous
    ) {
      return {
        success:
          true,

        message:
          "Only one demand snapshot exists. More historical data is required for trend comparison.",

        currentSnapshotId:
          idString(
            current._id
          ),

        previousSnapshotId:
          null,

        periodType,

        metrics:
          null,

        risingProducts:
          [],

        fallingProducts:
          [],

        newDemandProducts:
          [],
      };
    }

    /*
    |--------------------------------------------------------------------------
    | SUMMARY TRENDS
    |--------------------------------------------------------------------------
    */

    const metrics = {
      totalEvents:
        calculateTrend(
          current
            ?.summary
            ?.totalEvents,

          previous
            ?.summary
            ?.totalEvents
        ),

      productViews:
        calculateTrend(
          current
            ?.summary
            ?.productViews,

          previous
            ?.summary
            ?.productViews
        ),

      cartAdds:
        calculateTrend(
          current
            ?.summary
            ?.cartAdds,

          previous
            ?.summary
            ?.cartAdds
        ),

      wishlistAdds:
        calculateTrend(
          current
            ?.summary
            ?.wishlistAdds,

          previous
            ?.summary
            ?.wishlistAdds
        ),

      purchases:
        calculateTrend(
          current
            ?.summary
            ?.purchases,

          previous
            ?.summary
            ?.purchases
        ),

      cancellations:
        calculateTrend(
          current
            ?.summary
            ?.cancellations,

          previous
            ?.summary
            ?.cancellations
        ),

      returns:
        calculateTrend(
          current
            ?.summary
            ?.returns,

          previous
            ?.summary
            ?.returns
        ),

      exchanges:
        calculateTrend(
          current
            ?.summary
            ?.exchanges,

          previous
            ?.summary
            ?.exchanges
        ),

      searches:
        calculateTrend(
          current
            ?.summary
            ?.searches,

          previous
            ?.summary
            ?.searches
        ),

      viewToPurchaseRate:
        calculateTrend(
          current
            ?.summary
            ?.overallViewToPurchaseRate,

          previous
            ?.summary
            ?.overallViewToPurchaseRate
        ),

      cartToPurchaseRate:
        calculateTrend(
          current
            ?.summary
            ?.overallCartToPurchaseRate,

          previous
            ?.summary
            ?.overallCartToPurchaseRate
        ),
    };

    /*
    |--------------------------------------------------------------------------
    | PRODUCT TRENDS
    |--------------------------------------------------------------------------
    */

    const currentProducts =
      getAllSnapshotProducts(
        current
      );

    const previousProducts =
      getAllSnapshotProducts(
        previous
      );

    const productTrends:
      ProductDemandTrend[] =
      [];

    for (
      const [
        productId,
        currentProduct,
      ] of currentProducts
    ) {
      const previousProduct =
        previousProducts.get(
          productId
        ) ||
        null;

      productTrends.push(
        buildProductTrend(
          {
            currentProduct,

            previousProduct,
          }
        )
      );
    }

    const risingProducts =
      productTrends
        .filter(
          (
            product
          ) =>
            product.direction ===
              "up"
        )
        .sort(
          (
            first,
            second
          ) =>
            second
              .percentageChange -
            first
              .percentageChange
        )
        .slice(
          0,
          20
        );

    const fallingProducts =
      productTrends
        .filter(
          (
            product
          ) =>
            product.direction ===
              "down"
        )
        .sort(
          (
            first,
            second
          ) =>
            first
              .percentageChange -
            second
              .percentageChange
        )
        .slice(
          0,
          20
        );

    const newDemandProducts =
      productTrends
        .filter(
          (
            product
          ) =>
            product.direction ===
              "new"
        )
        .sort(
          (
            first,
            second
          ) =>
            second
              .currentDemandScore -
            first
              .currentDemandScore
        )
        .slice(
          0,
          20
        );

    return {
      success:
        true,

      message:
        "Demand snapshots compared successfully.",

      currentSnapshotId:
        idString(
          current._id
        ),

      previousSnapshotId:
        idString(
          previous._id
        ),

      periodType,

      metrics,

      risingProducts,

      fallingProducts,

      newDemandProducts,
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN demand snapshot comparison error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to compare demand snapshots.",

      currentSnapshotId:
        null,

      previousSnapshotId:
        null,

      periodType,

      metrics:
        null,

      risingProducts:
        [],

      fallingProducts:
        [],

      newDemandProducts:
        [],
    };
  }
}

/*
|--------------------------------------------------------------------------
| ADMIN AI BUSINESS INTELLIGENCE PACKAGE
|--------------------------------------------------------------------------
|
| This is the main function Admin AI will use.
|
| Returns:
|
| - latest demand snapshot
| - trend comparison
| - urgent suggestions
| - top products
| - weak products
| - restock opportunities
| - return risks
|
|--------------------------------------------------------------------------
*/

export async function getAdminDemandIntelligencePackage(
  periodType:
    CustomerDemandSnapshotPeriod =
      DEFAULT_ADMIN_PERIOD
) {
  const [
    latest,
    comparison,
  ] =
    await Promise.all(
      [
        getLatestOrCreateDemandSnapshot(
          periodType,
          "admin_ai"
        ),

        compareDemandSnapshots(
          periodType
        ),
      ]
    );

  const snapshot:
    any =
    latest.snapshot;

  if (
    !snapshot
  ) {
    return {
      success:
        false,

      message:
        "Demand intelligence is currently unavailable.",

      periodType,

      snapshot:
        null,

      comparison,

      criticalSuggestions:
        [],

      highPrioritySuggestions:
        [],

      topDemandProducts:
        [],

      urgentRestock:
        [],

      conversionOpportunities:
        [],

      slowMovingProducts:
        [],

      returnRiskProducts:
        [],
    };
  }

  const suggestions =
    Array.isArray(
      snapshot.suggestions
    )
      ? snapshot.suggestions
      : [];

  const criticalSuggestions =
    suggestions.filter(
      (
        suggestion:
          any
      ) =>
        suggestion?.priority ===
        "critical"
    );

  const highPrioritySuggestions =
    suggestions.filter(
      (
        suggestion:
          any
      ) =>
        suggestion?.priority ===
        "high"
    );

  return {
    success:
      true,

    message:
      "Admin demand intelligence package generated successfully.",

    periodType,

    generatedAt:
      snapshot.generatedAt,

    stale:
      latest.stale ===
      true,

    snapshotId:
      idString(
        snapshot._id
      ),

    summary:
      snapshot.summary,

    comparison,

    criticalSuggestions:
      criticalSuggestions.slice(
        0,
        20
      ),

    highPrioritySuggestions:
      highPrioritySuggestions.slice(
        0,
        20
      ),

    topDemandProducts:
      (
        Array.isArray(
          snapshot.hotProducts
        )
          ? snapshot.hotProducts
          : []
      ).slice(
        0,
        20
      ),

    urgentRestock:
      (
        Array.isArray(
          snapshot.restockCandidates
        )
          ? snapshot.restockCandidates
          : []
      ).slice(
        0,
        20
      ),

    conversionOpportunities:
      (
        Array.isArray(
          snapshot
            .conversionOpportunities
        )
          ? snapshot
              .conversionOpportunities
          : []
      ).slice(
        0,
        20
      ),

    slowMovingProducts:
      (
        Array.isArray(
          snapshot.slowProducts
        )
          ? snapshot.slowProducts
          : []
      ).slice(
        0,
        20
      ),

    returnRiskProducts:
      (
        Array.isArray(
          snapshot.returnRiskProducts
        )
          ? snapshot.returnRiskProducts
          : []
      ).slice(
        0,
        20
      ),

    topCategories:
      (
        Array.isArray(
          snapshot.categories
        )
          ? snapshot.categories
          : []
      ).slice(
        0,
        15
      ),

    topColors:
      (
        Array.isArray(
          snapshot.colors
        )
          ? snapshot.colors
          : []
      ).slice(
        0,
        15
      ),

    topSizes:
      (
        Array.isArray(
          snapshot.sizes
        )
          ? snapshot.sizes
          : []
      ).slice(
        0,
        15
      ),
  };
}

/*
|--------------------------------------------------------------------------
| REFRESH ALL STANDARD SNAPSHOTS
|--------------------------------------------------------------------------
|
| Useful later for cron / scheduled job.
|
|--------------------------------------------------------------------------
*/

export async function refreshStandardDemandSnapshots(
  source:
    DemandSnapshotSource =
      "system"
) {
  const results =
    await Promise.allSettled(
      [
        createDailyDemandSnapshot(
          source,
          true
        ),

        createWeeklyDemandSnapshot(
          source,
          true
        ),

        createMonthlyDemandSnapshot(
          source,
          true
        ),
      ]
    );

  return {
    success:
      results.every(
        (
          result
        ) =>
          result.status ===
          "fulfilled" &&
          result.value.success
      ),

    daily:
      results[0].status ===
      "fulfilled"
        ? results[0].value
        : {
            success:
              false,

            message:
              "Daily snapshot generation failed.",
          },

    weekly:
      results[1].status ===
      "fulfilled"
        ? results[1].value
        : {
            success:
              false,

            message:
              "Weekly snapshot generation failed.",
          },

    monthly:
      results[2].status ===
      "fulfilled"
        ? results[2].value
        : {
            success:
              false,

            message:
              "Monthly snapshot generation failed.",
          },
  };
}