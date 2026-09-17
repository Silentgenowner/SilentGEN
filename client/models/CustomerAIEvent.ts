import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| CUSTOMER AI EVENT TYPES
|--------------------------------------------------------------------------
*/

export type CustomerAIEventType =
  | "product_view"
  | "product_like"
  | "product_dislike"
  | "product_search"
  | "product_click"
  | "add_to_cart"
  | "remove_from_cart"
  | "cart_quantity_increase"
  | "cart_quantity_decrease"
  | "wishlist_add"
  | "wishlist_remove"
  | "checkout_started"
  | "order_placed"
  | "order_cancelled"
  | "return_requested"
  | "exchange_requested"
  | "product_purchased"
  | "recommendation_shown"
  | "recommendation_clicked";

/*
|--------------------------------------------------------------------------
| EVENT SOURCE
|--------------------------------------------------------------------------
*/

export type CustomerAIEventSource =
  | "ai"
  | "website"
  | "product_page"
  | "shop"
  | "cart"
  | "wishlist"
  | "checkout"
  | "order"
  | "admin"
  | "system";

/*
|--------------------------------------------------------------------------
| DOCUMENT
|--------------------------------------------------------------------------
*/

export interface ICustomerAIEvent
  extends Document {
  userId?:
    Types.ObjectId | null;

  sessionId?:
    string | null;

  conversationId?:
    Types.ObjectId | null;

  eventType:
    CustomerAIEventType;

  source:
    CustomerAIEventSource;

  productId?:
    Types.ObjectId | null;

  orderId?:
    Types.ObjectId | null;

  category?:
    string;

  subCategory?:
    string;

  brand?:
    string;

  gender?:
    string;

  color?:
    string;

  size?:
    string;

  fit?:
    string;

  fabric?:
    string;

  price?:
    number | null;

  quantity?:
    number;

  searchQuery?:
    string;

  recommendationId?:
    string;

  metadata?:
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

const MAX_TEXT_LENGTH =
  150;

const MAX_SEARCH_LENGTH =
  300;

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(
  value:
    unknown,
  maxLength =
    MAX_TEXT_LENGTH
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

function normalizePositiveNumber(
  value:
    unknown
):
  number | null {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    ) ||
    number < 0
  ) {
    return null;
  }

  return number;
}

function normalizeQuantity(
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
    ) ||
    number <= 0
  ) {
    return 1;
  }

  return Math.min(
    Math.max(
      Math.floor(
        number
      ),
      1
    ),
    999
  );
}

/*
|--------------------------------------------------------------------------
| SCHEMA
|--------------------------------------------------------------------------
*/

const CustomerAIEventSchema =
  new Schema<ICustomerAIEvent>(
    {
      /*
      |--------------------------------------------------------------------------
      | CUSTOMER
      |--------------------------------------------------------------------------
      */

      userId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | SESSION
      |--------------------------------------------------------------------------
      */

      sessionId: {
        type:
          String,

        default:
          null,

        trim:
          true,

        maxlength:
          150,
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
          "AIConversation",

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | EVENT
      |--------------------------------------------------------------------------
      */

      eventType: {
        type:
          String,

        required:
          true,

        enum: [
          "product_view",
          "product_like",
          "product_dislike",
          "product_search",
          "product_click",
          "add_to_cart",
          "remove_from_cart",
          "cart_quantity_increase",
          "cart_quantity_decrease",
          "wishlist_add",
          "wishlist_remove",
          "checkout_started",
          "order_placed",
          "order_cancelled",
          "return_requested",
          "exchange_requested",
          "product_purchased",
          "recommendation_shown",
          "recommendation_clicked",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | SOURCE
      |--------------------------------------------------------------------------
      */

      source: {
        type:
          String,

        required:
          true,

        enum: [
          "ai",
          "website",
          "product_page",
          "shop",
          "cart",
          "wishlist",
          "checkout",
          "order",
          "admin",
          "system",
        ],

        default:
          "website",
      },

      /*
      |--------------------------------------------------------------------------
      | PRODUCT
      |--------------------------------------------------------------------------
      */

      productId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Product",

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | ORDER
      |--------------------------------------------------------------------------
      */

      orderId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Order",

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | PRODUCT DIMENSIONS
      |--------------------------------------------------------------------------
      |
      | These are snapshot dimensions for analytics.
      |
      | Live product truth still comes from Product collection.
      |
      |--------------------------------------------------------------------------
      */

      category: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TEXT_LENGTH,
      },

      subCategory: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TEXT_LENGTH,
      },

      brand: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TEXT_LENGTH,
      },

      gender: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TEXT_LENGTH,
      },

      color: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TEXT_LENGTH,
      },

      size: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TEXT_LENGTH,
      },

      fit: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TEXT_LENGTH,
      },

      fabric: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_TEXT_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | PRICE SNAPSHOT
      |--------------------------------------------------------------------------
      |
      | Used only for historical analytics.
      |
      | Current price must always come from Product.
      |
      |--------------------------------------------------------------------------
      */

      price: {
        type:
          Number,

        default:
          null,

        min:
          0,
      },

      /*
      |--------------------------------------------------------------------------
      | QUANTITY
      |--------------------------------------------------------------------------
      */

      quantity: {
        type:
          Number,

        default:
          1,

        min:
          1,

        max:
          999,
      },

      /*
      |--------------------------------------------------------------------------
      | SEARCH QUERY
      |--------------------------------------------------------------------------
      */

      searchQuery: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          MAX_SEARCH_LENGTH,
      },

      /*
      |--------------------------------------------------------------------------
      | RECOMMENDATION TRACKING
      |--------------------------------------------------------------------------
      */

      recommendationId: {
        type:
          String,

        default:
          "",

        trim:
          true,

        maxlength:
          150,
      },

      /*
      |--------------------------------------------------------------------------
      | EXTRA METADATA
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
| Mongoose 9 compatible.
|
|--------------------------------------------------------------------------
*/

CustomerAIEventSchema.pre(
  "validate",
  function () {
    this.sessionId =
      cleanString(
        this.sessionId,
        150
      ) ||
      null;

    this.category =
      cleanString(
        this.category
      );

    this.subCategory =
      cleanString(
        this.subCategory
      );

    this.brand =
      cleanString(
        this.brand
      );

    this.gender =
      cleanString(
        this.gender
      );

    this.color =
      cleanString(
        this.color
      );

    this.size =
      cleanString(
        this.size
      );

    this.fit =
      cleanString(
        this.fit
      );

    this.fabric =
      cleanString(
        this.fabric
      );

    this.searchQuery =
      cleanString(
        this.searchQuery,
        MAX_SEARCH_LENGTH
      );

    this.recommendationId =
      cleanString(
        this.recommendationId,
        150
      );

    this.price =
      normalizePositiveNumber(
        this.price
      );

    this.quantity =
      normalizeQuantity(
        this.quantity
      );

    if (
      !this.metadata ||
      typeof this.metadata !==
        "object" ||
      Array.isArray(
        this.metadata
      )
    ) {
      this.metadata =
        {};
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
| PRODUCT DEMAND
|--------------------------------------------------------------------------
*/

CustomerAIEventSchema.index(
  {
    productId:
      1,

    eventType:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "customer_ai_event_product_type_created",
  }
);

/*
|--------------------------------------------------------------------------
| CATEGORY DEMAND
|--------------------------------------------------------------------------
*/

CustomerAIEventSchema.index(
  {
    category:
      1,

    eventType:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "customer_ai_event_category_type_created",
  }
);

/*
|--------------------------------------------------------------------------
| CUSTOMER HISTORY
|--------------------------------------------------------------------------
*/

CustomerAIEventSchema.index(
  {
    userId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "customer_ai_event_user_created",
  }
);

/*
|--------------------------------------------------------------------------
| SESSION HISTORY
|--------------------------------------------------------------------------
*/

CustomerAIEventSchema.index(
  {
    sessionId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "customer_ai_event_session_created",
  }
);

/*
|--------------------------------------------------------------------------
| EVENT ANALYTICS
|--------------------------------------------------------------------------
*/

CustomerAIEventSchema.index(
  {
    eventType:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "customer_ai_event_type_created",
  }
);

/*
|--------------------------------------------------------------------------
| COLOR DEMAND
|--------------------------------------------------------------------------
*/

CustomerAIEventSchema.index(
  {
    color:
      1,

    eventType:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "customer_ai_event_color_type_created",
  }
);

/*
|--------------------------------------------------------------------------
| SIZE DEMAND
|--------------------------------------------------------------------------
*/

CustomerAIEventSchema.index(
  {
    size:
      1,

    eventType:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "customer_ai_event_size_type_created",
  }
);

/*
|--------------------------------------------------------------------------
| SEARCH INTELLIGENCE
|--------------------------------------------------------------------------
*/

CustomerAIEventSchema.index(
  {
    searchQuery:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "customer_ai_event_search_created",

    partialFilterExpression: {
      eventType:
        "product_search",

      searchQuery: {
        $type:
          "string",
      },
    },
  }
);

/*
|--------------------------------------------------------------------------
| RECOMMENDATION PERFORMANCE
|--------------------------------------------------------------------------
*/

CustomerAIEventSchema.index(
  {
    recommendationId:
      1,

    eventType:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "customer_ai_event_recommendation_created",
  }
);

/*
|--------------------------------------------------------------------------
| BUSINESS INTELLIGENCE
|--------------------------------------------------------------------------
*/

CustomerAIEventSchema.index(
  {
    eventType:
      1,

    category:
      1,

    productId:
      1,

    createdAt:
      -1,
  },
  {
    name:
      "customer_ai_event_business_intelligence",
  }
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const CustomerAIEvent =
  (
    mongoose.models
      .CustomerAIEvent as
      Model<ICustomerAIEvent>
  ) ||
  mongoose.model<ICustomerAIEvent>(
    "CustomerAIEvent",
    CustomerAIEventSchema
  );

export default CustomerAIEvent;