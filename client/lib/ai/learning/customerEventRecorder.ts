import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import CustomerAIEvent, {
  type CustomerAIEventSource,
  type CustomerAIEventType,
} from "@/models/CustomerAIEvent";

import Product from "@/models/Product";

/*
|--------------------------------------------------------------------------
| CUSTOMER EVENT RECORDER
|--------------------------------------------------------------------------
|
| Central behaviour-event recorder for SilentGEN.
|
| IMPORTANT:
|
| - This is analytics / learning memory.
| - Product price / stock truth must still come from Product collection.
| - Event snapshots are historical context only.
| - Do not store sensitive customer information here.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_SESSION_ID_LENGTH =
  150;

const MAX_SEARCH_QUERY_LENGTH =
  300;

const MAX_TEXT_LENGTH =
  150;

const MAX_METADATA_KEYS =
  50;

const MAX_METADATA_STRING_LENGTH =
  500;

const MAX_QUANTITY =
  999;

/*
|--------------------------------------------------------------------------
| INPUT TYPES
|--------------------------------------------------------------------------
*/

export type RecordCustomerEventInput = {
  eventType:
    CustomerAIEventType;

  source?:
    CustomerAIEventSource;

  userId?:
    string | null;

  sessionId?:
    string | null;

  conversationId?:
    string | null;

  productId?:
    string | null;

  orderId?:
    string | null;

  category?:
    string | null;

  subCategory?:
    string | null;

  brand?:
    string | null;

  gender?:
    string | null;

  color?:
    string | null;

  size?:
    string | null;

  fit?:
    string | null;

  fabric?:
    string | null;

  price?:
    number | null;

  quantity?:
    number | null;

  searchQuery?:
    string | null;

  recommendationId?:
    string | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;

  /*
  |--------------------------------------------------------------------------
  | OPTIONAL PRODUCT SNAPSHOT
  |--------------------------------------------------------------------------
  |
  | true:
  | If productId exists, recorder loads live Product once and fills missing
  | analytics dimensions.
  |
  | false:
  | Recorder uses only explicitly supplied values.
  |
  |--------------------------------------------------------------------------
  */

  hydrateProductSnapshot?:
    boolean;
};

/*
|--------------------------------------------------------------------------
| RESULT
|--------------------------------------------------------------------------
*/

export type CustomerEventRecorderResult = {
  success:
    boolean;

  eventId?:
    string;

  message:
    string;
};

/*
|--------------------------------------------------------------------------
| PRODUCT SNAPSHOT
|--------------------------------------------------------------------------
*/

type ProductSnapshot = {
  productId:
    string;

  category:
    string;

  subCategory:
    string;

  brand:
    string;

  gender:
    string;

  color:
    string;

  size:
    string;

  fit:
    string;

  fabric:
    string;

  price:
    number | null;
};

/*
|--------------------------------------------------------------------------
| VALID EVENT TYPES
|--------------------------------------------------------------------------
*/

const EVENT_TYPES =
  new Set<CustomerAIEventType>([
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
  ]);

/*
|--------------------------------------------------------------------------
| VALID SOURCES
|--------------------------------------------------------------------------
*/

const EVENT_SOURCES =
  new Set<CustomerAIEventSource>([
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
  ]);

/*
|--------------------------------------------------------------------------
| CLEAN STRING
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

/*
|--------------------------------------------------------------------------
| NORMALIZE OBJECT ID
|--------------------------------------------------------------------------
*/

function normalizeObjectId(
  value:
    unknown
):
  string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const clean =
    value.trim();

  if (
    !mongoose.Types.ObjectId.isValid(
      clean
    )
  ) {
    return null;
  }

  return clean;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE SESSION ID
|--------------------------------------------------------------------------
*/

function normalizeSessionId(
  value:
    unknown
):
  string | null {
  const clean =
    cleanString(
      value,
      MAX_SESSION_ID_LENGTH
    );

  if (
    !clean
  ) {
    return null;
  }

  return clean;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE NUMBER
|--------------------------------------------------------------------------
*/

function normalizePrice(
  value:
    unknown
):
  number | null {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return null;
  }

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

/*
|--------------------------------------------------------------------------
| NORMALIZE QUANTITY
|--------------------------------------------------------------------------
*/

function normalizeQuantity(
  value:
    unknown
) {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return 1;
  }

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
    MAX_QUANTITY
  );
}

/*
|--------------------------------------------------------------------------
| SAFE METADATA VALUE
|--------------------------------------------------------------------------
*/

function sanitizeMetadataValue(
  value:
    unknown
):
  unknown {
  if (
    value ===
      null ||
    typeof value ===
      "boolean" ||
    typeof value ===
      "number"
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    return cleanString(
      value,
      MAX_METADATA_STRING_LENGTH
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
        30
      )
      .map(
        sanitizeMetadataValue
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

    const entries =
      Object.entries(
        value as
          Record<
            string,
            unknown
          >
      ).slice(
        0,
        30
      );

    for (
      const [
        key,
        nestedValue,
      ] of entries
    ) {
      const cleanKey =
        cleanString(
          key,
          100
        );

      if (
        !cleanKey
      ) {
        continue;
      }

      output[
        cleanKey
      ] =
        sanitizeMetadataValue(
          nestedValue
        );
    }

    return output;
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| SANITIZE METADATA
|--------------------------------------------------------------------------
|
| Never allow huge arbitrary payloads into analytics events.
|
|--------------------------------------------------------------------------
*/

function sanitizeMetadata(
  metadata:
    unknown
):
  Record<
    string,
    unknown
  > {
  if (
    !metadata ||
    typeof metadata !==
      "object" ||
    Array.isArray(
      metadata
    )
  ) {
    return {};
  }

  const output:
    Record<
      string,
      unknown
    > = {};

  const entries =
    Object.entries(
      metadata as
        Record<
          string,
          unknown
        >
    ).slice(
      0,
      MAX_METADATA_KEYS
    );

  for (
    const [
      key,
      value,
    ] of entries
  ) {
    const cleanKey =
      cleanString(
        key,
        100
      );

    if (
      !cleanKey
    ) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | DO NOT STORE COMMON SENSITIVE / SECRET FIELDS
    |--------------------------------------------------------------------------
    */

    const blockedKeys =
      new Set([
        "password",
        "otp",
        "token",
        "accesstoken",
        "refreshtoken",
        "authorization",
        "cookie",
        "secret",
        "apikey",
        "api_key",
      ]);

    if (
      blockedKeys.has(
        cleanKey
          .toLowerCase()
      )
    ) {
      continue;
    }

    output[
      cleanKey
    ] =
      sanitizeMetadataValue(
        value
      );
  }

  return output;
}

/*
|--------------------------------------------------------------------------
| GET PRODUCT SNAPSHOT
|--------------------------------------------------------------------------
*/

async function getProductSnapshot(
  productId:
    string
): Promise<
  ProductSnapshot | null
> {
  try {
    const product:
      any =
      await Product.findById(
        productId
      )
        .select(
          [
            "_id",
            "category",
            "subCategory",
            "brand",
            "gender",
            "fit",
            "fabric",
            "price",
          ].join(
            " "
          )
        )
        .lean();

    if (
      !product
    ) {
      return null;
    }

    return {
      productId:
        String(
          product._id
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

      /*
      |--------------------------------------------------------------------------
      | COLOR / SIZE
      |--------------------------------------------------------------------------
      |
      | Product-level arrays can contain many variants.
      |
      | We do NOT guess which one customer interacted with.
      |
      | Exact selected color/size must come from caller.
      |
      |--------------------------------------------------------------------------
      */

      color:
        "",

      size:
        "",

      fit:
        cleanString(
          product.fit
        ),

      fabric:
        cleanString(
          product.fabric
        ),

      price:
        normalizePrice(
          product.price
        ),
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN product snapshot load error:",
      error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| VALIDATE EVENT TYPE
|--------------------------------------------------------------------------
*/

function isValidEventType(
  value:
    unknown
): value is CustomerAIEventType {
  return (
    typeof value ===
      "string" &&
    EVENT_TYPES.has(
      value as
        CustomerAIEventType
    )
  );
}

/*
|--------------------------------------------------------------------------
| VALIDATE SOURCE
|--------------------------------------------------------------------------
*/

function normalizeSource(
  value:
    unknown
):
  CustomerAIEventSource {
  if (
    typeof value ===
      "string" &&
    EVENT_SOURCES.has(
      value as
        CustomerAIEventSource
    )
  ) {
    return value as
      CustomerAIEventSource;
  }

  return "website";
}

/*
|--------------------------------------------------------------------------
| EVENT NEEDS PRODUCT
|--------------------------------------------------------------------------
*/

function eventUsuallyNeedsProduct(
  eventType:
    CustomerAIEventType
) {
  return [
    "product_view",
    "product_like",
    "product_dislike",
    "product_click",
    "add_to_cart",
    "remove_from_cart",
    "cart_quantity_increase",
    "cart_quantity_decrease",
    "wishlist_add",
    "wishlist_remove",
    "product_purchased",
    "recommendation_shown",
    "recommendation_clicked",
  ].includes(
    eventType
  );
}

/*
|--------------------------------------------------------------------------
| RECORD CUSTOMER EVENT
|--------------------------------------------------------------------------
*/

export async function recordCustomerEvent(
  input:
    RecordCustomerEventInput
): Promise<
  CustomerEventRecorderResult
> {
  try {
    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | EVENT TYPE
    |--------------------------------------------------------------------------
    */

    if (
      !isValidEventType(
        input.eventType
      )
    ) {
      return {
        success:
          false,

        message:
          "Invalid customer event type.",
      };
    }

    const eventType =
      input.eventType;

    /*
    |--------------------------------------------------------------------------
    | IDS
    |--------------------------------------------------------------------------
    */

    const userId =
      normalizeObjectId(
        input.userId
      );

    const conversationId =
      normalizeObjectId(
        input.conversationId
      );

    const productId =
      normalizeObjectId(
        input.productId
      );

    const orderId =
      normalizeObjectId(
        input.orderId
      );

    const sessionId =
      normalizeSessionId(
        input.sessionId
      );

    /*
    |--------------------------------------------------------------------------
    | PRODUCT EVENT VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      eventUsuallyNeedsProduct(
        eventType
      ) &&
      input.productId &&
      !productId
    ) {
      return {
        success:
          false,

        message:
          "Invalid product id.",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH EVENT VALIDATION
    |--------------------------------------------------------------------------
    */

    const searchQuery =
      cleanString(
        input.searchQuery,
        MAX_SEARCH_QUERY_LENGTH
      );

    if (
      eventType ===
        "product_search" &&
      !searchQuery
    ) {
      return {
        success:
          false,

        message:
          "Search query is required for product search event.",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT SNAPSHOT
    |--------------------------------------------------------------------------
    */

    let snapshot:
      ProductSnapshot | null =
      null;

    if (
      productId &&
      input.hydrateProductSnapshot !==
        false
    ) {
      snapshot =
        await getProductSnapshot(
          productId
        );
    }

    /*
    |--------------------------------------------------------------------------
    | EXPLICIT CUSTOMER VARIANT ALWAYS WINS
    |--------------------------------------------------------------------------
    */

    const category =
      cleanString(
        input.category
      ) ||
      snapshot?.category ||
      "";

    const subCategory =
      cleanString(
        input.subCategory
      ) ||
      snapshot?.subCategory ||
      "";

    const brand =
      cleanString(
        input.brand
      ) ||
      snapshot?.brand ||
      "";

    const gender =
      cleanString(
        input.gender
      ) ||
      snapshot?.gender ||
      "";

    const color =
      cleanString(
        input.color
      );

    const size =
      cleanString(
        input.size
      );

    const fit =
      cleanString(
        input.fit
      ) ||
      snapshot?.fit ||
      "";

    const fabric =
      cleanString(
        input.fabric
      ) ||
      snapshot?.fabric ||
      "";

    const explicitPrice =
      normalizePrice(
        input.price
      );

    const price =
      explicitPrice !==
      null
        ? explicitPrice
        : snapshot?.price ??
          null;

    /*
    |--------------------------------------------------------------------------
    | CREATE EVENT
    |--------------------------------------------------------------------------
    */

    const event =
      await CustomerAIEvent.create(
        {
          userId:
            userId ||
            null,

          sessionId,

          conversationId:
            conversationId ||
            null,

          eventType,

          source:
            normalizeSource(
              input.source
            ),

          productId:
            productId ||
            null,

          orderId:
            orderId ||
            null,

          category,

          subCategory,

          brand,

          gender,

          color,

          size,

          fit,

          fabric,

          price,

          quantity:
            normalizeQuantity(
              input.quantity
            ),

          searchQuery,

          recommendationId:
            cleanString(
              input.recommendationId,
              150
            ),

          metadata:
            sanitizeMetadata(
              input.metadata
            ),
        }
      );

    return {
      success:
        true,

      eventId:
        String(
          event._id
        ),

      message:
        "Customer behaviour event recorded successfully.",
    };
  } catch (
    error
  ) {
    console.error(
      "SilentGEN customer event recorder error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to record customer behaviour event.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| PRODUCT VIEW
|--------------------------------------------------------------------------
*/

export async function recordProductView(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "product_view",

      source:
        input.source ||
        "product_page",
    }
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT CLICK
|--------------------------------------------------------------------------
*/

export async function recordProductClick(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "product_click",
    }
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT LIKE
|--------------------------------------------------------------------------
*/

export async function recordProductLike(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "product_like",
    }
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT DISLIKE
|--------------------------------------------------------------------------
*/

export async function recordProductDislike(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "product_dislike",
    }
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT SEARCH
|--------------------------------------------------------------------------
*/

export async function recordProductSearch(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "product_search",
    }
  );
}

/*
|--------------------------------------------------------------------------
| ADD TO CART
|--------------------------------------------------------------------------
*/

export async function recordAddToCart(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "add_to_cart",

      source:
        input.source ||
        "cart",
    }
  );
}

/*
|--------------------------------------------------------------------------
| REMOVE FROM CART
|--------------------------------------------------------------------------
*/

export async function recordRemoveFromCart(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "remove_from_cart",

      source:
        input.source ||
        "cart",
    }
  );
}

/*
|--------------------------------------------------------------------------
| CART QUANTITY INCREASE
|--------------------------------------------------------------------------
*/

export async function recordCartQuantityIncrease(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "cart_quantity_increase",

      source:
        input.source ||
        "cart",
    }
  );
}

/*
|--------------------------------------------------------------------------
| CART QUANTITY DECREASE
|--------------------------------------------------------------------------
*/

export async function recordCartQuantityDecrease(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "cart_quantity_decrease",

      source:
        input.source ||
        "cart",
    }
  );
}

/*
|--------------------------------------------------------------------------
| WISHLIST ADD
|--------------------------------------------------------------------------
*/

export async function recordWishlistAdd(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "wishlist_add",

      source:
        input.source ||
        "wishlist",
    }
  );
}

/*
|--------------------------------------------------------------------------
| WISHLIST REMOVE
|--------------------------------------------------------------------------
*/

export async function recordWishlistRemove(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "wishlist_remove",

      source:
        input.source ||
        "wishlist",
    }
  );
}

/*
|--------------------------------------------------------------------------
| CHECKOUT STARTED
|--------------------------------------------------------------------------
*/

export async function recordCheckoutStarted(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "checkout_started",

      source:
        input.source ||
        "checkout",
    }
  );
}

/*
|--------------------------------------------------------------------------
| ORDER PLACED
|--------------------------------------------------------------------------
*/

export async function recordOrderPlaced(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "order_placed",

      source:
        input.source ||
        "order",
    }
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT PURCHASED
|--------------------------------------------------------------------------
*/

export async function recordProductPurchased(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "product_purchased",

      source:
        input.source ||
        "order",
    }
  );
}

/*
|--------------------------------------------------------------------------
| ORDER CANCELLED
|--------------------------------------------------------------------------
*/

export async function recordOrderCancelled(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "order_cancelled",

      source:
        input.source ||
        "order",
    }
  );
}

/*
|--------------------------------------------------------------------------
| RETURN REQUESTED
|--------------------------------------------------------------------------
*/

export async function recordReturnRequested(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "return_requested",

      source:
        input.source ||
        "order",
    }
  );
}

/*
|--------------------------------------------------------------------------
| EXCHANGE REQUESTED
|--------------------------------------------------------------------------
*/

export async function recordExchangeRequested(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "exchange_requested",

      source:
        input.source ||
        "order",
    }
  );
}

/*
|--------------------------------------------------------------------------
| RECOMMENDATION SHOWN
|--------------------------------------------------------------------------
*/

export async function recordRecommendationShown(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "recommendation_shown",

      source:
        input.source ||
        "ai",
    }
  );
}

/*
|--------------------------------------------------------------------------
| RECOMMENDATION CLICKED
|--------------------------------------------------------------------------
*/

export async function recordRecommendationClicked(
  input:
    Omit<
      RecordCustomerEventInput,
      "eventType"
    >
) {
  return recordCustomerEvent(
    {
      ...input,

      eventType:
        "recommendation_clicked",

      source:
        input.source ||
        "ai",
    }
  );
}

/*
|--------------------------------------------------------------------------
| RECORD MULTIPLE EVENTS
|--------------------------------------------------------------------------
|
| Useful for an order containing multiple products.
|
|--------------------------------------------------------------------------
*/

export async function recordCustomerEvents(
  events:
    RecordCustomerEventInput[]
) {
  const results:
    CustomerEventRecorderResult[] =
    [];

  for (
    const event of
    events.slice(
      0,
      100
    )
  ) {
    const result =
      await recordCustomerEvent(
        event
      );

    results.push(
      result
    );
  }

  const successCount =
    results.filter(
      (
        result
      ) =>
        result.success
    ).length;

  return {
    success:
      successCount ===
      results.length,

    successCount,

    failedCount:
      results.length -
      successCount,

    results,
  };
}

/*
|--------------------------------------------------------------------------
| CREATE ORDER PRODUCT EVENTS
|--------------------------------------------------------------------------
|
| Helper used after successful order placement.
|
| It records:
|
| 1. one order_placed event
| 2. one product_purchased event for each order item
|
|--------------------------------------------------------------------------
*/

export async function recordSuccessfulOrderBehaviour({
  userId,
  sessionId,
  conversationId,
  orderId,
  items,
  metadata,
}: {
  userId?:
    string | null;

  sessionId?:
    string | null;

  conversationId?:
    string | null;

  orderId:
    string;

  items:
    Array<{
      productId?:
        unknown;

      category?:
        unknown;

      subCategory?:
        unknown;

      brand?:
        unknown;

      gender?:
        unknown;

      color?:
        unknown;

      size?:
        unknown;

      fit?:
        unknown;

      fabric?:
        unknown;

      price?:
        unknown;

      quantity?:
        unknown;
    }>;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  const normalizedOrderId =
    normalizeObjectId(
      orderId
    );

  if (
    !normalizedOrderId
  ) {
    return {
      success:
        false,

      successCount:
        0,

      failedCount:
        1,

      message:
        "Invalid order id.",

      results:
        [],
    };
  }

  const events:
    RecordCustomerEventInput[] =
    [
      {
        eventType:
          "order_placed",

        source:
          "order",

        userId,

        sessionId,

        conversationId,

        orderId:
          normalizedOrderId,

        metadata,
      },
    ];

  for (
    const item of
    Array.isArray(
      items
    )
      ? items
      : []
  ) {
    const productId =
      normalizeObjectId(
        String(
          item.productId ||
            ""
        )
      );

    if (
      !productId
    ) {
      continue;
    }

    events.push(
      {
        eventType:
          "product_purchased",

        source:
          "order",

        userId,

        sessionId,

        conversationId,

        productId,

        orderId:
          normalizedOrderId,

        category:
          cleanString(
            item.category
          ),

        subCategory:
          cleanString(
            item.subCategory
          ),

        brand:
          cleanString(
            item.brand
          ),

        gender:
          cleanString(
            item.gender
          ),

        color:
          cleanString(
            item.color
          ),

        size:
          cleanString(
            item.size
          ),

        fit:
          cleanString(
            item.fit
          ),

        fabric:
          cleanString(
            item.fabric
          ),

        price:
          normalizePrice(
            item.price
          ),

        quantity:
          normalizeQuantity(
            item.quantity
          ),

        metadata,

        hydrateProductSnapshot:
          true,
      }
    );
  }

  const result =
    await recordCustomerEvents(
      events
    );

  return {
    ...result,

    message:
      result.failedCount ===
      0
        ? "Order behaviour recorded successfully."
        : "Order behaviour was recorded with some failures.",
  };
}

/*
|--------------------------------------------------------------------------
| FIRE-AND-FORGET RECORDER
|--------------------------------------------------------------------------
|
| Use this when analytics failure must NEVER break customer flow.
|
| Example:
|
| add to cart succeeds
| event logging fails
|
| Customer cart must still succeed.
|
|--------------------------------------------------------------------------
*/

export function recordCustomerEventSafely(
  input:
    RecordCustomerEventInput
) {
  void recordCustomerEvent(
    input
  ).catch(
    (
      error
    ) => {
      console.error(
        "SilentGEN background customer event error:",
        error
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| FIRE-AND-FORGET BATCH
|--------------------------------------------------------------------------
*/

export function recordCustomerEventsSafely(
  events:
    RecordCustomerEventInput[]
) {
  void recordCustomerEvents(
    events
  ).catch(
    (
      error
    ) => {
      console.error(
        "SilentGEN background customer events error:",
        error
      );
    }
  );
}