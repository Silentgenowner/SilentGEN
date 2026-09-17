import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| CUSTOMER DEMAND SNAPSHOT
|--------------------------------------------------------------------------
|
| Stores aggregated customer-demand intelligence for Admin AI.
|
| IMPORTANT:
|
| - This is aggregate business intelligence.
| - Do not store unnecessary individual customer details here.
| - Product collection remains source of truth for current stock/price.
| - Snapshot values are historical analytics for a defined period.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| SNAPSHOT PERIOD
|--------------------------------------------------------------------------
*/

export type CustomerDemandSnapshotPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "custom";

/*
|--------------------------------------------------------------------------
| DEMAND LEVEL
|--------------------------------------------------------------------------
*/

export type CustomerDemandLevel =
  | "very_high"
  | "high"
  | "medium"
  | "low"
  | "very_low";

/*
|--------------------------------------------------------------------------
| INVENTORY SIGNAL
|--------------------------------------------------------------------------
*/

export type CustomerDemandInventorySignal =
  | "urgent_restock"
  | "restock"
  | "healthy"
  | "slow_moving"
  | "overstock_risk"
  | "out_of_stock_demand"
  | "unknown";

/*
|--------------------------------------------------------------------------
| CONVERSION SIGNAL
|--------------------------------------------------------------------------
*/

export type CustomerDemandConversionSignal =
  | "excellent"
  | "good"
  | "average"
  | "weak"
  | "very_weak"
  | "insufficient_data";

/*
|--------------------------------------------------------------------------
| SUGGESTION TYPE
|--------------------------------------------------------------------------
*/

export type CustomerDemandSuggestionType =
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

/*
|--------------------------------------------------------------------------
| SUGGESTION PRIORITY
|--------------------------------------------------------------------------
*/

export type CustomerDemandSuggestionPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

export type CustomerDemandSnapshotSummary = {
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

/*
|--------------------------------------------------------------------------
| EVENT COUNTS
|--------------------------------------------------------------------------
*/

export type CustomerDemandSnapshotEventCounts = {
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
| PRODUCT METRIC
|--------------------------------------------------------------------------
*/

export type CustomerDemandSnapshotProduct = {
  productId:
    mongoose.Types.ObjectId;

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
    CustomerDemandSnapshotEventCounts;

  cartQuantity:
    number;

  purchasedQuantity:
    number;

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
    CustomerDemandLevel;

  inventorySignal:
    CustomerDemandInventorySignal;

  conversionSignal:
    CustomerDemandConversionSignal;

  opportunityScore:
    number;

  riskScore:
    number;

  reasons:
    string[];
};

/*
|--------------------------------------------------------------------------
| CATEGORY METRIC
|--------------------------------------------------------------------------
*/

export type CustomerDemandSnapshotCategory = {
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
| DIMENSION METRIC
|--------------------------------------------------------------------------
*/

export type CustomerDemandSnapshotDimension = {
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
| BUSINESS SUGGESTION
|--------------------------------------------------------------------------
*/

export type CustomerDemandSnapshotSuggestion = {
  type:
    CustomerDemandSuggestionType;

  priority:
    CustomerDemandSuggestionPriority;

  title:
    string;

  message:
    string;

  productId?:
    mongoose.Types.ObjectId | null;

  category?:
    string;

  value?:
    string;

  score?:
    number;
};

/*
|--------------------------------------------------------------------------
| DOCUMENT
|--------------------------------------------------------------------------
*/

export interface ICustomerDemandSnapshot
  extends Document {
  periodType:
    CustomerDemandSnapshotPeriod;

  periodDays:
    number;

  from:
    Date;

  to:
    Date;

  generatedAt:
    Date;

  summary:
    CustomerDemandSnapshotSummary;

  hotProducts:
    CustomerDemandSnapshotProduct[];

  slowProducts:
    CustomerDemandSnapshotProduct[];

  restockCandidates:
    CustomerDemandSnapshotProduct[];

  conversionOpportunities:
    CustomerDemandSnapshotProduct[];

  returnRiskProducts:
    CustomerDemandSnapshotProduct[];

  categories:
    CustomerDemandSnapshotCategory[];

  colors:
    CustomerDemandSnapshotDimension[];

  sizes:
    CustomerDemandSnapshotDimension[];

  suggestions:
    CustomerDemandSnapshotSuggestion[];

  source:
    "system"
    | "admin_ai"
    | "manual";

  version:
    number;

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

const MAX_TEXT =
  250;

const MAX_REASON =
  500;

const MAX_PRODUCTS =
  100;

const MAX_DIMENSIONS =
  100;

const MAX_SUGGESTIONS =
  100;

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(
  value:
    unknown,
  maxLength =
    MAX_TEXT
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
  return Math.max(
    0,
    Math.floor(
      safeNumber(
        value
      )
    )
  );
}

function safePercentage(
  value:
    unknown
) {
  return Math.max(
    0,
    Math.min(
      100,
      safeNumber(
        value
      )
    )
  );
}

function normalizePeriodDays(
  value:
    unknown
) {
  return Math.min(
    365,
    Math.max(
      1,
      safeInteger(
        value
      ) ||
        1
    )
  );
}

function normalizeReasons(
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
          item,
          MAX_REASON
        )
    )
    .filter(
      Boolean
    )
    .slice(
      0,
      20
    );
}

/*
|--------------------------------------------------------------------------
| EVENT COUNTS SCHEMA
|--------------------------------------------------------------------------
*/

const EventCountsSchema =
  new Schema<CustomerDemandSnapshotEventCounts>(
    {
      views: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      clicks: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      likes: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      dislikes: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      wishlistAdds: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      wishlistRemoves: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cartAdds: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cartRemoves: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cartQuantityIncreases: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cartQuantityDecreases: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      checkoutStarts: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      purchases: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      orderPlacements: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cancellations: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      returns: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      exchanges: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      recommendationShown: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      recommendationClicked: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      searches: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| PRODUCT SCHEMA
|--------------------------------------------------------------------------
*/

const ProductMetricSchema =
  new Schema<CustomerDemandSnapshotProduct>(
    {
      productId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Product",

        required:
          true,
      },

      name: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      sku: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      category: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      subCategory: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      brand: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      gender: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      price: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      mrp: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      discount: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      stock: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      sold: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      lowStockLimit: {
        type:
          Number,

        default:
          5,

        min:
          0,
      },

      status: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      thumbnail: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      events: {
        type:
          EventCountsSchema,

        required:
          true,

        default: () => ({
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
        }),
      },

      cartQuantity: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      purchasedQuantity: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      demandScore: {
        type:
          Number,

        default:
          0,
      },

      normalizedDemandScore: {
        type:
          Number,

        default:
          0,

        min:
          0,

        max:
          100,
      },

      viewToCartRate: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      viewToPurchaseRate: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cartToPurchaseRate: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      recommendationClickRate: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      returnRate: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cancellationRate: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      demandLevel: {
        type:
          String,

        enum: [
          "very_high",
          "high",
          "medium",
          "low",
          "very_low",
        ],

        default:
          "very_low",
      },

      inventorySignal: {
        type:
          String,

        enum: [
          "urgent_restock",
          "restock",
          "healthy",
          "slow_moving",
          "overstock_risk",
          "out_of_stock_demand",
          "unknown",
        ],

        default:
          "unknown",
      },

      conversionSignal: {
        type:
          String,

        enum: [
          "excellent",
          "good",
          "average",
          "weak",
          "very_weak",
          "insufficient_data",
        ],

        default:
          "insufficient_data",
      },

      opportunityScore: {
        type:
          Number,

        default:
          0,

        min:
          0,

        max:
          100,
      },

      riskScore: {
        type:
          Number,

        default:
          0,

        min:
          0,

        max:
          100,
      },

      reasons: {
        type: [
          String,
        ],

        default:
          [],
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| CATEGORY SCHEMA
|--------------------------------------------------------------------------
*/

const CategoryMetricSchema =
  new Schema<CustomerDemandSnapshotCategory>(
    {
      category: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      views: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      clicks: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      likes: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      wishlistAdds: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cartAdds: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      purchases: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cancellations: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      returns: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      demandScore: {
        type:
          Number,

        default:
          0,
      },

      viewToPurchaseRate: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      productCount: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| DIMENSION SCHEMA
|--------------------------------------------------------------------------
*/

const DimensionMetricSchema =
  new Schema<CustomerDemandSnapshotDimension>(
    {
      value: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      views: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cartAdds: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      purchases: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      likes: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      wishlistAdds: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      returns: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      demandScore: {
        type:
          Number,

        default:
          0,
      },

      conversionRate: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| SUGGESTION SCHEMA
|--------------------------------------------------------------------------
*/

const SuggestionSchema =
  new Schema<CustomerDemandSnapshotSuggestion>(
    {
      type: {
        type:
          String,

        required:
          true,

        enum: [
          "restock",
          "out_of_stock",
          "promote",
          "discount",
          "conversion",
          "inventory",
          "return_risk",
          "category_growth",
          "size_demand",
          "color_demand",
          "product_opportunity",
        ],
      },

      priority: {
        type:
          String,

        required:
          true,

        enum: [
          "critical",
          "high",
          "medium",
          "low",
        ],
      },

      title: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      message: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      productId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Product",

        default:
          null,
      },

      category: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      value: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      score: {
        type:
          Number,

        default:
          0,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| SUMMARY SCHEMA
|--------------------------------------------------------------------------
*/

const SummarySchema =
  new Schema<CustomerDemandSnapshotSummary>(
    {
      totalEvents: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      productViews: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      productClicks: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cartAdds: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      wishlistAdds: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      purchases: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cancellations: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      returns: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      exchanges: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      searches: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      uniqueProducts: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      overallViewToPurchaseRate: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      overallCartToPurchaseRate: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| MAIN SCHEMA
|--------------------------------------------------------------------------
*/

const CustomerDemandSnapshotSchema =
  new Schema<ICustomerDemandSnapshot>(
    {
      periodType: {
        type:
          String,

        required:
          true,

        enum: [
          "daily",
          "weekly",
          "monthly",
          "custom",
        ],

        default:
          "daily",
      },

      periodDays: {
        type:
          Number,

        required:
          true,

        min:
          1,

        max:
          365,

        default:
          1,
      },

      from: {
        type:
          Date,

        required:
          true,
      },

      to: {
        type:
          Date,

        required:
          true,
      },

      generatedAt: {
        type:
          Date,

        required:
          true,

        default:
          Date.now,
      },

      summary: {
        type:
          SummarySchema,

        required:
          true,

        default: () => ({
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
        }),
      },

      hotProducts: {
        type: [
          ProductMetricSchema,
        ],

        default:
          [],
      },

      slowProducts: {
        type: [
          ProductMetricSchema,
        ],

        default:
          [],
      },

      restockCandidates: {
        type: [
          ProductMetricSchema,
        ],

        default:
          [],
      },

      conversionOpportunities: {
        type: [
          ProductMetricSchema,
        ],

        default:
          [],
      },

      returnRiskProducts: {
        type: [
          ProductMetricSchema,
        ],

        default:
          [],
      },

      categories: {
        type: [
          CategoryMetricSchema,
        ],

        default:
          [],
      },

      colors: {
        type: [
          DimensionMetricSchema,
        ],

        default:
          [],
      },

      sizes: {
        type: [
          DimensionMetricSchema,
        ],

        default:
          [],
      },

      suggestions: {
        type: [
          SuggestionSchema,
        ],

        default:
          [],
      },

      source: {
        type:
          String,

        enum: [
          "system",
          "admin_ai",
          "manual",
        ],

        default:
          "system",
      },

      version: {
        type:
          Number,

        default:
          1,

        min:
          1,
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

CustomerDemandSnapshotSchema.pre(
  "validate",
  function () {
    this.periodDays =
      normalizePeriodDays(
        this.periodDays
      );

    /*
    |--------------------------------------------------------------------------
    | DATES
    |--------------------------------------------------------------------------
    */

    if (
      !(this.generatedAt instanceof Date) ||
      Number.isNaN(
        this.generatedAt.getTime()
      )
    ) {
      this.generatedAt =
        new Date();
    }

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    if (
      this.summary
    ) {
      this.summary.totalEvents =
        safeInteger(
          this.summary.totalEvents
        );

      this.summary.productViews =
        safeInteger(
          this.summary.productViews
        );

      this.summary.productClicks =
        safeInteger(
          this.summary.productClicks
        );

      this.summary.cartAdds =
        safeInteger(
          this.summary.cartAdds
        );

      this.summary.wishlistAdds =
        safeInteger(
          this.summary.wishlistAdds
        );

      this.summary.purchases =
        safeInteger(
          this.summary.purchases
        );

      this.summary.cancellations =
        safeInteger(
          this.summary.cancellations
        );

      this.summary.returns =
        safeInteger(
          this.summary.returns
        );

      this.summary.exchanges =
        safeInteger(
          this.summary.exchanges
        );

      this.summary.searches =
        safeInteger(
          this.summary.searches
        );

      this.summary.uniqueProducts =
        safeInteger(
          this.summary.uniqueProducts
        );

      this.summary.overallViewToPurchaseRate =
        safePercentage(
          this.summary
            .overallViewToPurchaseRate
        );

      this.summary.overallCartToPurchaseRate =
        safePercentage(
          this.summary
            .overallCartToPurchaseRate
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LIMIT PRODUCT ARRAYS
    |--------------------------------------------------------------------------
    */

    this.hotProducts =
      Array.isArray(
        this.hotProducts
      )
        ? this.hotProducts.slice(
            0,
            MAX_PRODUCTS
          )
        : [];

    this.slowProducts =
      Array.isArray(
        this.slowProducts
      )
        ? this.slowProducts.slice(
            0,
            MAX_PRODUCTS
          )
        : [];

    this.restockCandidates =
      Array.isArray(
        this.restockCandidates
      )
        ? this.restockCandidates.slice(
            0,
            MAX_PRODUCTS
          )
        : [];

    this.conversionOpportunities =
      Array.isArray(
        this.conversionOpportunities
      )
        ? this.conversionOpportunities.slice(
            0,
            MAX_PRODUCTS
          )
        : [];

    this.returnRiskProducts =
      Array.isArray(
        this.returnRiskProducts
      )
        ? this.returnRiskProducts.slice(
            0,
            MAX_PRODUCTS
          )
        : [];

    this.categories =
      Array.isArray(
        this.categories
      )
        ? this.categories.slice(
            0,
            MAX_DIMENSIONS
          )
        : [];

    this.colors =
      Array.isArray(
        this.colors
      )
        ? this.colors.slice(
            0,
            MAX_DIMENSIONS
          )
        : [];

    this.sizes =
      Array.isArray(
        this.sizes
      )
        ? this.sizes.slice(
            0,
            MAX_DIMENSIONS
          )
        : [];

    this.suggestions =
      Array.isArray(
        this.suggestions
      )
        ? this.suggestions.slice(
            0,
            MAX_SUGGESTIONS
          )
        : [];

    /*
    |--------------------------------------------------------------------------
    | CLEAN PRODUCT DATA
    |--------------------------------------------------------------------------
    */

    const productGroups = [
      this.hotProducts,
      this.slowProducts,
      this.restockCandidates,
      this.conversionOpportunities,
      this.returnRiskProducts,
    ];

    for (
      const products of
      productGroups
    ) {
      for (
        const product of
        products
      ) {
        product.name =
          cleanString(
            product.name
          );

        product.sku =
          cleanString(
            product.sku
          );

        product.category =
          cleanString(
            product.category
          );

        product.subCategory =
          cleanString(
            product.subCategory
          );

        product.brand =
          cleanString(
            product.brand
          );

        product.gender =
          cleanString(
            product.gender
          );

        product.status =
          cleanString(
            product.status
          );

        product.thumbnail =
          cleanString(
            product.thumbnail,
            1000
          );

        product.price =
          Math.max(
            0,
            safeNumber(
              product.price
            )
          );

        product.mrp =
          Math.max(
            0,
            safeNumber(
              product.mrp
            )
          );

        product.discount =
          Math.max(
            0,
            safeNumber(
              product.discount
            )
          );

        product.stock =
          safeInteger(
            product.stock
          );

        product.sold =
          safeInteger(
            product.sold
          );

        product.lowStockLimit =
          safeInteger(
            product.lowStockLimit
          );

        product.normalizedDemandScore =
          safePercentage(
            product
              .normalizedDemandScore
          );

        product.opportunityScore =
          safePercentage(
            product.opportunityScore
          );

        product.riskScore =
          safePercentage(
            product.riskScore
          );

        product.viewToCartRate =
          safePercentage(
            product.viewToCartRate
          );

        product.viewToPurchaseRate =
          safePercentage(
            product.viewToPurchaseRate
          );

        product.cartToPurchaseRate =
          safePercentage(
            product.cartToPurchaseRate
          );

        product.recommendationClickRate =
          safePercentage(
            product
              .recommendationClickRate
          );

        product.returnRate =
          safePercentage(
            product.returnRate
          );

        product.cancellationRate =
          safePercentage(
            product.cancellationRate
          );

        product.reasons =
          normalizeReasons(
            product.reasons
          );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | CLEAN CATEGORY DATA
    |--------------------------------------------------------------------------
    */

    for (
      const category of
      this.categories
    ) {
      category.category =
        cleanString(
          category.category
        );

      category.views =
        safeInteger(
          category.views
        );

      category.clicks =
        safeInteger(
          category.clicks
        );

      category.likes =
        safeInteger(
          category.likes
        );

      category.wishlistAdds =
        safeInteger(
          category.wishlistAdds
        );

      category.cartAdds =
        safeInteger(
          category.cartAdds
        );

      category.purchases =
        safeInteger(
          category.purchases
        );

      category.cancellations =
        safeInteger(
          category.cancellations
        );

      category.returns =
        safeInteger(
          category.returns
        );

      category.productCount =
        safeInteger(
          category.productCount
        );

      category.viewToPurchaseRate =
        safePercentage(
          category
            .viewToPurchaseRate
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CLEAN DIMENSIONS
    |--------------------------------------------------------------------------
    */

    for (
      const dimension of
      [
        ...this.colors,
        ...this.sizes,
      ]
    ) {
      dimension.value =
        cleanString(
          dimension.value
        );

      dimension.views =
        safeInteger(
          dimension.views
        );

      dimension.cartAdds =
        safeInteger(
          dimension.cartAdds
        );

      dimension.purchases =
        safeInteger(
          dimension.purchases
        );

      dimension.likes =
        safeInteger(
          dimension.likes
        );

      dimension.wishlistAdds =
        safeInteger(
          dimension.wishlistAdds
        );

      dimension.returns =
        safeInteger(
          dimension.returns
        );

      dimension.conversionRate =
        safePercentage(
          dimension.conversionRate
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CLEAN SUGGESTIONS
    |--------------------------------------------------------------------------
    */

    for (
      const suggestion of
      this.suggestions
    ) {
      suggestion.title =
        cleanString(
          suggestion.title,
          300
        );

      suggestion.message =
        cleanString(
          suggestion.message,
          1000
        );

      suggestion.category =
        cleanString(
          suggestion.category
        );

      suggestion.value =
        cleanString(
          suggestion.value
        );

      suggestion.score =
        safeNumber(
          suggestion.score
        );
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
| LATEST SNAPSHOT
|--------------------------------------------------------------------------
*/

CustomerDemandSnapshotSchema.index(
  {
    periodType:
      1,

    generatedAt:
      -1,
  },
  {
    name:
      "customer_demand_snapshot_period_generated",
  }
);

/*
|--------------------------------------------------------------------------
| PERIOD RANGE
|--------------------------------------------------------------------------
*/

CustomerDemandSnapshotSchema.index(
  {
    from:
      -1,

    to:
      -1,
  },
  {
    name:
      "customer_demand_snapshot_range",
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN AI LATEST
|--------------------------------------------------------------------------
*/

CustomerDemandSnapshotSchema.index(
  {
    source:
      1,

    generatedAt:
      -1,
  },
  {
    name:
      "customer_demand_snapshot_source_generated",
  }
);

/*
|--------------------------------------------------------------------------
| UNIQUE PERIOD SNAPSHOT
|--------------------------------------------------------------------------
|
| Prevent duplicate snapshot for exactly same period + range.
|
|--------------------------------------------------------------------------
*/

CustomerDemandSnapshotSchema.index(
  {
    periodType:
      1,

    from:
      1,

    to:
      1,
  },
  {
    unique:
      true,

    name:
      "customer_demand_snapshot_unique_period",
  }
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const CustomerDemandSnapshot =
  (
    mongoose.models
      .CustomerDemandSnapshot as
      Model<ICustomerDemandSnapshot>
  ) ||
  mongoose.model<ICustomerDemandSnapshot>(
    "CustomerDemandSnapshot",
    CustomerDemandSnapshotSchema
  );

export default CustomerDemandSnapshot;