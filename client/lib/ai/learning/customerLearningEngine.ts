import mongoose from "mongoose";

import {
  buildCustomerPreferenceLearningInput,
  detectCustomerLearningSignals,
  type CustomerLearningSignal,
  type CustomerLearningSignalResult,
} from "@/lib/ai/learning/customerLearningSignals";

import {
  getCustomerLearningProfile,
  learnCustomerPreferences,
  recordCustomerProductEvent,
  type CustomerLearningResult,
  type CustomerProductLearningEvent,
} from "@/lib/ai/learning/customerLearning";

import {
  recordCustomerEvent,
  recordCustomerEventSafely,
  type CustomerEventRecorderResult,
  type RecordCustomerEventInput,
} from "@/lib/ai/learning/customerEventRecorder";

import type {
  CustomerAIEventSource,
  CustomerAIEventType,
} from "@/models/CustomerAIEvent";

/*
|--------------------------------------------------------------------------
| SILENTGEN CUSTOMER LEARNING ENGINE
|--------------------------------------------------------------------------
|
| Controlled customer learning + aggregate behaviour intelligence.
|
| IMPORTANT:
|
| 1. Chat messages learn explicit shopping preferences only.
| 2. Chat messages DO NOT create fake product_view events.
| 3. Real product views must call learnProductViewSafely().
| 4. Real search/cart/wishlist/order behaviour is recorded separately.
| 5. Customer profile memory and aggregate Admin intelligence stay separate.
| 6. Analytics failure must never break customer-facing actions.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_MESSAGE_LENGTH =
  4000;

const MAX_SESSION_ID_LENGTH =
  150;

const MAX_SOURCE_CONTEXT_LENGTH =
  200;

const MAX_METADATA_KEYS =
  30;

/*
|--------------------------------------------------------------------------
| CHAT LEARNING INPUT
|--------------------------------------------------------------------------
*/

export type LearnFromCustomerMessageInput = {
  userId?:
    string | null;

  sessionId?:
    string | null;

  conversationId?:
    string | null;

  message:
    string;

  source?:
    CustomerAIEventSource;

  /*
  |--------------------------------------------------------------------------
  | CURRENT PRODUCT
  |--------------------------------------------------------------------------
  |
  | Kept for compatibility/context.
  |
  | IMPORTANT:
  |
  | Merely chatting while currentProductId exists MUST NOT be counted as
  | another product view.
  |
  |--------------------------------------------------------------------------
  */

  currentProductId?:
    string | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;
};

/*
|--------------------------------------------------------------------------
| CHAT LEARNING RESULT
|--------------------------------------------------------------------------
*/

export type LearnFromCustomerMessageResult = {
  success:
    boolean;

  learned:
    boolean;

  message:
    string;

  signals:
    CustomerLearningSignal[];

  detection:
    CustomerLearningSignalResult;

  preferenceResult:
    CustomerLearningResult | null;

  /*
  |--------------------------------------------------------------------------
  | ANALYTICS RESULT
  |--------------------------------------------------------------------------
  |
  | Chat preference learning no longer generates product_view analytics.
  | Therefore this will normally be null.
  |
  |--------------------------------------------------------------------------
  */

  analyticsResult:
    CustomerEventRecorderResult | null;
};

/*
|--------------------------------------------------------------------------
| PRODUCT BEHAVIOUR INPUT
|--------------------------------------------------------------------------
*/

export type LearnFromProductBehaviourInput = {
  userId?:
    string | null;

  sessionId?:
    string | null;

  conversationId?:
    string | null;

  productId:
    string;

  behaviour:
    CustomerProductLearningEvent;

  source?:
    CustomerAIEventSource;

  color?:
    string | null;

  size?:
    string | null;

  quantity?:
    number | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;
};

/*
|--------------------------------------------------------------------------
| PRODUCT BEHAVIOUR RESULT
|--------------------------------------------------------------------------
*/

export type LearnFromProductBehaviourResult = {
  success:
    boolean;

  message:
    string;

  profileLearning:
    CustomerLearningResult | null;

  analytics:
    CustomerEventRecorderResult | null;
};

/*
|--------------------------------------------------------------------------
| GENERAL BUSINESS EVENT INPUT
|--------------------------------------------------------------------------
*/

export type RecordLearningBusinessEventInput = {
  eventType:
    CustomerAIEventType;

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

  source?:
    CustomerAIEventSource;

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

  hydrateProductSnapshot?:
    boolean;
};

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
| NORMALIZE USER ID
|--------------------------------------------------------------------------
*/

function normalizeUserId(
  value:
    unknown
) {
  return normalizeObjectId(
    value
  );
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

  return clean ||
    null;
}

/*
|--------------------------------------------------------------------------
| SANITIZE LEARNING METADATA
|--------------------------------------------------------------------------
*/

function sanitizeMetadata(
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

  const object =
    value as
      Record<
        string,
        unknown
      >;

  const output:
    Record<
      string,
      unknown
    > = {};

  const blocked =
    new Set(
      [
        "password",
        "otp",
        "token",
        "authorization",
        "cookie",
        "secret",
        "apikey",
        "api_key",
        "accesstoken",
        "refreshtoken",
        "creditcard",
        "cvv",
      ]
    );

  for (
    const [
      key,
      item,
    ] of Object.entries(
      object
    ).slice(
      0,
      MAX_METADATA_KEYS
    )
  ) {
    const normalizedKey =
      key
        .trim()
        .slice(
          0,
          100
        );

    if (
      !normalizedKey
    ) {
      continue;
    }

    if (
      blocked.has(
        normalizedKey.toLowerCase()
      )
    ) {
      continue;
    }

    if (
      item ===
        null ||
      typeof item ===
        "boolean" ||
      typeof item ===
        "number"
    ) {
      output[
        normalizedKey
      ] =
        item;

      continue;
    }

    if (
      typeof item ===
      "string"
    ) {
      output[
        normalizedKey
      ] =
        item
          .trim()
          .slice(
            0,
            300
          );

      continue;
    }

    if (
      Array.isArray(
        item
      )
    ) {
      output[
        normalizedKey
      ] =
        item
          .slice(
            0,
            20
          )
          .map(
            (
              current
            ) => {
              if (
                current ===
                  null ||
                typeof current ===
                  "boolean" ||
                typeof current ===
                  "number"
              ) {
                return current;
              }

              if (
                typeof current ===
                "string"
              ) {
                return current
                  .trim()
                  .slice(
                    0,
                    200
                  );
              }

              return null;
            }
          )
          .filter(
            (
              current
            ) =>
              current !==
              null
          );
    }
  }

  return output;
}

/*
|--------------------------------------------------------------------------
| MAP PRODUCT BEHAVIOUR TO BUSINESS EVENT
|--------------------------------------------------------------------------
*/

function mapProductBehaviourToEvent(
  behaviour:
    CustomerProductLearningEvent
):
  CustomerAIEventType {
  switch (
    behaviour
  ) {
    case "liked":
      return "product_like";

    case "disliked":
      return "product_dislike";

    case "viewed":
    default:
      return "product_view";
  }
}

/*
|--------------------------------------------------------------------------
| LEARN FROM CUSTOMER MESSAGE
|--------------------------------------------------------------------------
|
| This function learns EXPLICIT customer preferences.
|
| Example:
|
| "I prefer black oversized t-shirts and my size is XL."
|
| IMPORTANT:
|
| We intentionally DO NOT create product_view here.
|
| A customer can send multiple AI messages while remaining on one product
| page. Counting each message as another view would corrupt Admin analytics.
|
|--------------------------------------------------------------------------
*/

export async function learnFromCustomerMessage(
  input:
    LearnFromCustomerMessageInput
): Promise<
  LearnFromCustomerMessageResult
> {
  const message =
    cleanString(
      input.message,
      MAX_MESSAGE_LENGTH
    );

  const detection =
    detectCustomerLearningSignals(
      message
    );

  /*
  |--------------------------------------------------------------------------
  | EMPTY MESSAGE
  |--------------------------------------------------------------------------
  */

  if (
    !message
  ) {
    return {
      success:
        true,

      learned:
        false,

      message:
        "Empty customer message. Nothing learned.",

      signals:
        [],

      detection,

      preferenceResult:
        null,

      analyticsResult:
        null,
    };
  }

  const userId =
    normalizeUserId(
      input.userId
    );

  /*
  |--------------------------------------------------------------------------
  | NO PRODUCT VIEW ANALYTICS HERE
  |--------------------------------------------------------------------------
  |
  | sessionId / conversationId / currentProductId remain accepted in the
  | public API for compatibility and context, but chat itself is not treated
  | as a product-view event.
  |
  |--------------------------------------------------------------------------
  */

  /*
  |--------------------------------------------------------------------------
  | GUEST CUSTOMER
  |--------------------------------------------------------------------------
  |
  | Long-term profile learning requires authenticated customer.
  |
  | We still detect signals so the current AI interaction can understand
  | explicit shopping preferences, but nothing is permanently written into
  | the customer's personal style profile.
  |
  |--------------------------------------------------------------------------
  */

  if (
    !userId
  ) {
    return {
      success:
        true,

      learned:
        false,

      message:
        detection.shouldLearn
          ? "Safe shopping preference detected, but long-term learning requires a logged-in customer."
          : "No long-term customer preference learned.",

      signals:
        detection.signals,

      detection,

      preferenceResult:
        null,

      analyticsResult:
        null,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | BUILD SAFE PREFERENCE INPUT
  |--------------------------------------------------------------------------
  */

  const learning =
    buildCustomerPreferenceLearningInput(
      message
    );

  if (
    !learning.shouldLearn ||
    !learning.learningInput
  ) {
    return {
      success:
        true,

      learned:
        false,

      message:
        "No safe explicit long-term shopping preference detected.",

      signals:
        detection.signals,

      detection,

      preferenceResult:
        null,

      analyticsResult:
        null,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | RESPECT PERSONALIZATION SETTING
  |--------------------------------------------------------------------------
  */

  const currentProfile =
    await getCustomerLearningProfile(
      userId
    );

  if (
    currentProfile.success &&
    currentProfile.profile &&
    currentProfile.profile
      .personalizationEnabled ===
      false
  ) {
    return {
      success:
        true,

      learned:
        false,

      message:
        "Customer personalization is disabled. No preference was learned.",

      signals:
        detection.signals,

      detection,

      preferenceResult:
        currentProfile,

      analyticsResult:
        null,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE EXPLICIT CUSTOMER PREFERENCES
  |--------------------------------------------------------------------------
  */

  const preferenceResult =
    await learnCustomerPreferences(
      userId,
      learning.learningInput
    );

  return {
    success:
      preferenceResult.success,

    learned:
      preferenceResult.success,

    message:
      preferenceResult.success
        ? "Customer shopping preferences learned successfully."
        : preferenceResult.message,

    signals:
      detection.signals,

    detection,

    preferenceResult,

    analyticsResult:
      null,
  };
}

/*
|--------------------------------------------------------------------------
| SAFE BACKGROUND CHAT LEARNING
|--------------------------------------------------------------------------
|
| Learning must never break the AI response.
|
|--------------------------------------------------------------------------
*/

export function learnFromCustomerMessageSafely(
  input:
    LearnFromCustomerMessageInput
) {
  void learnFromCustomerMessage(
    input
  ).catch(
    (
      error
    ) => {
      console.error(
        "SilentGEN background customer learning error:",
        error
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| LEARN FROM PRODUCT BEHAVIOUR
|--------------------------------------------------------------------------
|
| Real product behaviour has TWO possible destinations:
|
| 1. Aggregate CustomerAIEvent
|    Used by Admin demand/business intelligence.
|
| 2. Authenticated customer's AIStyleProfile
|    Used for personalized recommendations when personalization is enabled.
|
|--------------------------------------------------------------------------
*/

export async function learnFromProductBehaviour(
  input:
    LearnFromProductBehaviourInput
): Promise<
  LearnFromProductBehaviourResult
> {
  const productId =
    normalizeObjectId(
      input.productId
    );

  if (
    !productId
  ) {
    return {
      success:
        false,

      message:
        "Invalid product id.",

      profileLearning:
        null,

      analytics:
        null,
    };
  }

  const userId =
    normalizeUserId(
      input.userId
    );

  const sessionId =
    normalizeSessionId(
      input.sessionId
    );

  const conversationId =
    normalizeObjectId(
      input.conversationId
    );

  /*
  |--------------------------------------------------------------------------
  | AGGREGATE BUSINESS ANALYTICS
  |--------------------------------------------------------------------------
  |
  | This is independent of long-term profile personalization.
  |
  | Guest behaviour may still contribute to aggregate demand intelligence.
  |
  |--------------------------------------------------------------------------
  */

  const analytics =
    await recordCustomerEvent(
      {
        eventType:
          mapProductBehaviourToEvent(
            input.behaviour
          ),

        source:
          input.source ||
          "website",

        userId,

        sessionId,

        conversationId,

        productId,

        color:
          input.color,

        size:
          input.size,

        quantity:
          input.quantity,

        metadata:
          sanitizeMetadata(
            input.metadata
          ),

        hydrateProductSnapshot:
          true,
      }
    );

  /*
  |--------------------------------------------------------------------------
  | GUEST CUSTOMER
  |--------------------------------------------------------------------------
  */

  if (
    !userId
  ) {
    return {
      success:
        analytics.success,

      message:
        "Anonymous product behaviour recorded for aggregate demand intelligence.",

      profileLearning:
        null,

      analytics,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | RESPECT PERSONALIZATION
  |--------------------------------------------------------------------------
  |
  | Aggregate analytics can continue, but personal product-memory must not be
  | expanded when the customer disabled personalization.
  |
  |--------------------------------------------------------------------------
  */

  const currentProfile =
    await getCustomerLearningProfile(
      userId
    );

  if (
    currentProfile.success &&
    currentProfile.profile &&
    currentProfile.profile
      .personalizationEnabled ===
      false
  ) {
    return {
      success:
        analytics.success,

      message:
        analytics.success
          ? "Product behaviour recorded for aggregate intelligence. Personalization is disabled, so personal behaviour memory was not updated."
          : "Personalization is disabled and aggregate behaviour recording failed.",

      profileLearning:
        currentProfile,

      analytics,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | PERSONAL PRODUCT MEMORY
  |--------------------------------------------------------------------------
  */

  const profileLearning =
    await recordCustomerProductEvent(
      userId,
      {
        type:
          input.behaviour,

        productId,
      }
    );

  return {
    success:
      analytics.success &&
      profileLearning.success,

    message:
      analytics.success &&
      profileLearning.success
        ? "Customer product behaviour learned successfully."
        : "Customer product behaviour was recorded with some learning errors.",

    profileLearning,

    analytics,
  };
}

/*
|--------------------------------------------------------------------------
| SAFE PRODUCT BEHAVIOUR LEARNING
|--------------------------------------------------------------------------
*/

export function learnFromProductBehaviourSafely(
  input:
    LearnFromProductBehaviourInput
) {
  void learnFromProductBehaviour(
    input
  ).catch(
    (
      error
    ) => {
      console.error(
        "SilentGEN background product behaviour learning error:",
        error
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| RECORD BUSINESS INTELLIGENCE EVENT
|--------------------------------------------------------------------------
|
| Used by:
|
| - product pages
| - search
| - cart
| - wishlist
| - orders
| - return / exchange
| - AI tools
| - recommendations
|
|--------------------------------------------------------------------------
*/

export async function recordLearningBusinessEvent(
  input:
    RecordLearningBusinessEventInput
) {
  const event:
    RecordCustomerEventInput = {
    eventType:
      input.eventType,

    source:
      input.source ||
      "website",

    userId:
      normalizeUserId(
        input.userId
      ),

    sessionId:
      normalizeSessionId(
        input.sessionId
      ),

    conversationId:
      normalizeObjectId(
        input.conversationId
      ),

    productId:
      normalizeObjectId(
        input.productId
      ),

    orderId:
      normalizeObjectId(
        input.orderId
      ),

    category:
      input.category,

    subCategory:
      input.subCategory,

    brand:
      input.brand,

    gender:
      input.gender,

    color:
      input.color,

    size:
      input.size,

    fit:
      input.fit,

    fabric:
      input.fabric,

    price:
      input.price,

    quantity:
      input.quantity,

    searchQuery:
      input.searchQuery,

    recommendationId:
      input.recommendationId,

    metadata:
      sanitizeMetadata(
        input.metadata
      ),

    hydrateProductSnapshot:
      input.hydrateProductSnapshot !==
      false,
  };

  return recordCustomerEvent(
    event
  );
}

/*
|--------------------------------------------------------------------------
| SAFE BUSINESS EVENT
|--------------------------------------------------------------------------
*/

export function recordLearningBusinessEventSafely(
  input:
    RecordLearningBusinessEventInput
) {
  recordCustomerEventSafely(
    {
      eventType:
        input.eventType,

      source:
        input.source ||
        "website",

      userId:
        normalizeUserId(
          input.userId
        ),

      sessionId:
        normalizeSessionId(
          input.sessionId
        ),

      conversationId:
        normalizeObjectId(
          input.conversationId
        ),

      productId:
        normalizeObjectId(
          input.productId
        ),

      orderId:
        normalizeObjectId(
          input.orderId
        ),

      category:
        input.category,

      subCategory:
        input.subCategory,

      brand:
        input.brand,

      gender:
        input.gender,

      color:
        input.color,

      size:
        input.size,

      fit:
        input.fit,

      fabric:
        input.fabric,

      price:
        input.price,

      quantity:
        input.quantity,

      searchQuery:
        input.searchQuery,

      recommendationId:
        input.recommendationId,

      metadata:
        sanitizeMetadata(
          input.metadata
        ),

      hydrateProductSnapshot:
        input.hydrateProductSnapshot !==
        false,
    }
  );
}

/*
|--------------------------------------------------------------------------
| REAL PRODUCT VIEW
|--------------------------------------------------------------------------
|
| Call this from the actual product-view flow.
|
| Do NOT call once per AI message.
|
|--------------------------------------------------------------------------
*/

export function learnProductViewSafely({
  userId,
  sessionId,
  conversationId,
  productId,
  source,
  color,
  size,
  metadata,
}: {
  userId?:
    string | null;

  sessionId?:
    string | null;

  conversationId?:
    string | null;

  productId:
    string;

  source?:
    CustomerAIEventSource;

  color?:
    string | null;

  size?:
    string | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  learnFromProductBehaviourSafely(
    {
      userId,

      sessionId,

      conversationId,

      productId,

      behaviour:
        "viewed",

      source:
        source ||
        "product_page",

      color,

      size,

      metadata: {
        ...sanitizeMetadata(
          metadata
        ),

        context:
          cleanString(
            "real_product_view",
            MAX_SOURCE_CONTEXT_LENGTH
          ),
      },
    }
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT LIKE
|--------------------------------------------------------------------------
*/

export function learnProductLikeSafely({
  userId,
  sessionId,
  conversationId,
  productId,
  source,
  color,
  size,
  metadata,
}: {
  userId?:
    string | null;

  sessionId?:
    string | null;

  conversationId?:
    string | null;

  productId:
    string;

  source?:
    CustomerAIEventSource;

  color?:
    string | null;

  size?:
    string | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  learnFromProductBehaviourSafely(
    {
      userId,

      sessionId,

      conversationId,

      productId,

      behaviour:
        "liked",

      source:
        source ||
        "website",

      color,

      size,

      metadata,
    }
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT DISLIKE
|--------------------------------------------------------------------------
*/

export function learnProductDislikeSafely({
  userId,
  sessionId,
  conversationId,
  productId,
  source,
  color,
  size,
  metadata,
}: {
  userId?:
    string | null;

  sessionId?:
    string | null;

  conversationId?:
    string | null;

  productId:
    string;

  source?:
    CustomerAIEventSource;

  color?:
    string | null;

  size?:
    string | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  learnFromProductBehaviourSafely(
    {
      userId,

      sessionId,

      conversationId,

      productId,

      behaviour:
        "disliked",

      source:
        source ||
        "website",

      color,

      size,

      metadata,
    }
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT SEARCH
|--------------------------------------------------------------------------
*/

export function recordSearchLearningSafely({
  userId,
  sessionId,
  conversationId,
  searchQuery,
  source,
  metadata,
}: {
  userId?:
    string | null;

  sessionId?:
    string | null;

  conversationId?:
    string | null;

  searchQuery:
    string;

  source?:
    CustomerAIEventSource;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  const cleanSearchQuery =
    cleanString(
      searchQuery,
      300
    );

  if (
    !cleanSearchQuery
  ) {
    return;
  }

  recordLearningBusinessEventSafely(
    {
      eventType:
        "product_search",

      source:
        source ||
        "website",

      userId,

      sessionId,

      conversationId,

      searchQuery:
        cleanSearchQuery,

      metadata,

      hydrateProductSnapshot:
        false,
    }
  );
}

/*
|--------------------------------------------------------------------------
| ADD TO CART
|--------------------------------------------------------------------------
*/

export function recordAddToCartLearningSafely({
  userId,
  sessionId,
  conversationId,
  productId,
  color,
  size,
  quantity,
  source,
  metadata,
}: {
  userId?:
    string | null;

  sessionId?:
    string | null;

  conversationId?:
    string | null;

  productId:
    string;

  color?:
    string | null;

  size?:
    string | null;

  quantity?:
    number | null;

  source?:
    CustomerAIEventSource;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  recordLearningBusinessEventSafely(
    {
      eventType:
        "add_to_cart",

      source:
        source ||
        "cart",

      userId,

      sessionId,

      conversationId,

      productId,

      color,

      size,

      quantity,

      metadata,
    }
  );
}

/*
|--------------------------------------------------------------------------
| WISHLIST ADD
|--------------------------------------------------------------------------
*/

export function recordWishlistLearningSafely({
  userId,
  sessionId,
  conversationId,
  productId,
  source,
  metadata,
}: {
  userId?:
    string | null;

  sessionId?:
    string | null;

  conversationId?:
    string | null;

  productId:
    string;

  source?:
    CustomerAIEventSource;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  recordLearningBusinessEventSafely(
    {
      eventType:
        "wishlist_add",

      source:
        source ||
        "wishlist",

      userId,

      sessionId,

      conversationId,

      productId,

      metadata,
    }
  );
}

/*
|--------------------------------------------------------------------------
| PURCHASE
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This should only be called after a real order has been successfully created.
|
|--------------------------------------------------------------------------
*/

export function recordPurchaseLearningSafely({
  userId,
  sessionId,
  conversationId,
  productId,
  orderId,
  color,
  size,
  quantity,
  price,
  metadata,
}: {
  userId?:
    string | null;

  sessionId?:
    string | null;

  conversationId?:
    string | null;

  productId:
    string;

  orderId:
    string;

  color?:
    string | null;

  size?:
    string | null;

  quantity?:
    number | null;

  price?:
    number | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  recordLearningBusinessEventSafely(
    {
      eventType:
        "product_purchased",

      source:
        "order",

      userId,

      sessionId,

      conversationId,

      productId,

      orderId,

      color,

      size,

      quantity,

      price,

      metadata,
    }
  );
}

/*
|--------------------------------------------------------------------------
| RETURN REQUEST
|--------------------------------------------------------------------------
|
| Call only after the real return request has succeeded.
|
|--------------------------------------------------------------------------
*/

export function recordReturnLearningSafely({
  userId,
  productId,
  orderId,
  color,
  size,
  quantity,
  metadata,
}: {
  userId?:
    string | null;

  productId?:
    string | null;

  orderId:
    string;

  color?:
    string | null;

  size?:
    string | null;

  quantity?:
    number | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  recordLearningBusinessEventSafely(
    {
      eventType:
        "return_requested",

      source:
        "order",

      userId,

      productId,

      orderId,

      color,

      size,

      quantity,

      metadata,
    }
  );
}

/*
|--------------------------------------------------------------------------
| EXCHANGE REQUEST
|--------------------------------------------------------------------------
|
| Call only after the real exchange request has succeeded.
|
|--------------------------------------------------------------------------
*/

export function recordExchangeLearningSafely({
  userId,
  productId,
  orderId,
  color,
  size,
  quantity,
  metadata,
}: {
  userId?:
    string | null;

  productId?:
    string | null;

  orderId:
    string;

  color?:
    string | null;

  size?:
    string | null;

  quantity?:
    number | null;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  recordLearningBusinessEventSafely(
    {
      eventType:
        "exchange_requested",

      source:
        "order",

      userId,

      productId,

      orderId,

      color,

      size,

      quantity,

      metadata,
    }
  );
}

/*
|--------------------------------------------------------------------------
| ORDER CANCELLATION
|--------------------------------------------------------------------------
|
| Call only after the real cancellation succeeds.
|
|--------------------------------------------------------------------------
*/

export function recordCancellationLearningSafely({
  userId,
  productId,
  orderId,
  metadata,
}: {
  userId?:
    string | null;

  productId?:
    string | null;

  orderId:
    string;

  metadata?:
    Record<
      string,
      unknown
    > | null;
}) {
  recordLearningBusinessEventSafely(
    {
      eventType:
        "order_cancelled",

      source:
        "order",

      userId,

      productId,

      orderId,

      metadata,
    }
  );
}