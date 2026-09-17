import mongoose from "mongoose";

import Order from "@/models/Order";

import {
  recordLearningBusinessEvent,
} from "@/lib/ai/learning/customerLearningEngine";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type SubmitExchangeRequestInput = {
  userId: string;

  orderId: string;

  reason: string;

  channel?:
    | "website_exchange_route"
    | "other";
};

export type SubmitExchangeRequestResult = {
  success: true;

  order: any;
};

/*
|--------------------------------------------------------------------------
| SERVICE ERROR
|--------------------------------------------------------------------------
*/

export class ExchangeRequestServiceError extends Error {
  status: number;

  constructor(
    message: string,
    status = 400
  ) {
    super(message);

    this.name =
      "ExchangeRequestServiceError";

    this.status =
      status;
  }
}

/*
|--------------------------------------------------------------------------
| CLEAN STRING
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
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
| SAFE NUMBER
|--------------------------------------------------------------------------
*/

function safeNumber(
  value: unknown
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return 0;
  }

  return parsed;
}

/*
|--------------------------------------------------------------------------
| SAFE QUANTITY
|--------------------------------------------------------------------------
*/

function safeQuantity(
  value: unknown
) {
  const parsed =
    Math.floor(
      safeNumber(
        value
      )
    );

  if (
    parsed <= 0
  ) {
    return 0;
  }

  return parsed;
}

/*
|--------------------------------------------------------------------------
| VALID OBJECT ID
|--------------------------------------------------------------------------
*/

function isValidObjectId(
  value: string
) {
  return mongoose.Types.ObjectId.isValid(
    value
  );
}

/*
|--------------------------------------------------------------------------
| BUILD EXCHANGE METADATA
|--------------------------------------------------------------------------
|
| One order exchange request = one intelligence event.
|
| Example:
|
| One order has 3 items.
|
| We still create only:
|
| 1 exchange_requested event.
|
|--------------------------------------------------------------------------
*/

function buildExchangeMetadata(
  order: any,
  reason: string,
  channel: string
) {
  const items =
    Array.isArray(
      order?.items
    )
      ? order.items
      : [];

  const productIds: string[] =
    [];

  const productNames: string[] =
    [];

  const originalVariants: string[] =
    [];

  let totalQuantity =
    0;

  /*
  |--------------------------------------------------------------------------
  | ORDER ITEMS
  |--------------------------------------------------------------------------
  */

  for (
    const item of items
  ) {
    /*
    |--------------------------------------------------------------------------
    | PRODUCT ID
    |--------------------------------------------------------------------------
    */

    const productId =
      String(
        item?.product?._id ||
          item?.product ||
          ""
      );

    if (
      productId &&
      isValidObjectId(
        productId
      )
    ) {
      productIds.push(
        productId
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT NAME
    |--------------------------------------------------------------------------
    */

    const productName =
      cleanString(
        item?.name
      );

    if (
      productName
    ) {
      productNames.push(
        productName
      );
    }

    /*
    |--------------------------------------------------------------------------
    | QUANTITY
    |--------------------------------------------------------------------------
    */

    const quantity =
      safeQuantity(
        item?.quantity
      );

    totalQuantity +=
      quantity;

    /*
    |--------------------------------------------------------------------------
    | ORIGINAL VARIANT
    |--------------------------------------------------------------------------
    |
    | These values belong to the originally purchased item.
    |
    | They are NOT replacement size/color.
    |
    |--------------------------------------------------------------------------
    */

    const color =
      cleanString(
        item?.color
      );

    const size =
      cleanString(
        item?.size
      );

    const variantParts =
      [
        productName,

        color
          ? `color:${color}`
          : "",

        size
          ? `size:${size}`
          : "",

        quantity > 0
          ? `qty:${quantity}`
          : "",
      ].filter(
        Boolean
      );

    if (
      variantParts.length >
      0
    ) {
      originalVariants.push(
        variantParts.join(
          " | "
        )
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | METADATA
  |--------------------------------------------------------------------------
  */

  return {
    context:
      "real_exchange_request",

    exchangeChannel:
      channel,

    reason,

    itemCount:
      items.length,

    totalQuantity,

    productIds:
      Array.from(
        new Set(
          productIds
        )
      ).slice(
        0,
        20
      ),

    productNames:
      Array.from(
        new Set(
          productNames
        )
      ).slice(
        0,
        20
      ),

    originalVariants:
      originalVariants.slice(
        0,
        20
      ),

    totalAmount:
      Math.max(
        safeNumber(
          order?.totalAmount
        ),
        0
      ),

    subtotal:
      Math.max(
        safeNumber(
          order?.subtotal
        ),
        0
      ),

    shippingCharge:
      Math.max(
        safeNumber(
          order?.shippingCharge
        ),
        0
      ),

    discount:
      Math.max(
        safeNumber(
          order?.discount
        ),
        0
      ),

    paymentMethod:
      cleanString(
        order?.paymentMethod
      ),

    paymentStatus:
      cleanString(
        order?.paymentStatus
      ),

    refundStatus:
      cleanString(
        order?.refundStatus
      ),

    orderStatus:
      cleanString(
        order?.orderStatus
      ),

    trackingNumberPresent:
      Boolean(
        cleanString(
          order?.trackingNumber
        )
      ),

    courierPartner:
      cleanString(
        order?.courierPartner
      ),
  };
}

/*
|--------------------------------------------------------------------------
| RECORD EXCHANGE LEARNING
|--------------------------------------------------------------------------
|
| This runs only after the real Exchange Request has been saved.
|
| Analytics failure must NOT make the real exchange request fail.
|
|--------------------------------------------------------------------------
*/

async function recordExchangeLearning({
  userId,
  orderId,
  order,
  reason,
  channel,
}: {
  userId: string;

  orderId: string;

  order: any;

  reason: string;

  channel: string;
}) {
  try {
    await recordLearningBusinessEvent(
      {
        eventType:
          "exchange_requested",

        source:
          "order",

        userId,

        sessionId:
          null,

        conversationId:
          null,

        /*
        |--------------------------------------------------------------------------
        | ORDER-LEVEL EVENT
        |--------------------------------------------------------------------------
        |
        | No single productId is used because an order can contain
        | multiple products.
        |
        |--------------------------------------------------------------------------
        */

        productId:
          null,

        orderId,

        metadata:
          buildExchangeMetadata(
            order,
            reason,
            channel
          ),

        hydrateProductSnapshot:
          false,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "EXCHANGE REQUEST LEARNING ERROR:",
      error
    );
  }
}

/*
|--------------------------------------------------------------------------
| SUBMIT EXCHANGE REQUEST
|--------------------------------------------------------------------------
*/

export async function submitExchangeRequest(
  input: SubmitExchangeRequestInput
): Promise<SubmitExchangeRequestResult> {
  /*
  |--------------------------------------------------------------------------
  | NORMALIZE
  |--------------------------------------------------------------------------
  */

  const userId =
    cleanString(
      input.userId
    );

  const orderId =
    cleanString(
      input.orderId
    );

  const reason =
    cleanString(
      input.reason
    );

  const channel =
    cleanString(
      input.channel
    ) ||
    "other";

  /*
  |--------------------------------------------------------------------------
  | USER VALIDATION
  |--------------------------------------------------------------------------
  */

  if (
    !userId ||
    !isValidObjectId(
      userId
    )
  ) {
    throw new ExchangeRequestServiceError(
      "Invalid customer account.",
      401
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ORDER ID VALIDATION
  |--------------------------------------------------------------------------
  */

  if (
    !orderId ||
    !isValidObjectId(
      orderId
    )
  ) {
    throw new ExchangeRequestServiceError(
      "Invalid order ID.",
      400
    );
  }

  /*
  |--------------------------------------------------------------------------
  | REASON VALIDATION
  |--------------------------------------------------------------------------
  */

  if (
    !reason
  ) {
    throw new ExchangeRequestServiceError(
      "Please provide a reason for the exchange.",
      400
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FIND CUSTOMER ORDER
  |--------------------------------------------------------------------------
  |
  | Order owner field is:
  |
  | user
  |
  | not userId.
  |
  |--------------------------------------------------------------------------
  */

  const existingOrder: any =
    await Order.findOne(
      {
        _id:
          orderId,

        user:
          userId,
      }
    );

  if (
    !existingOrder
  ) {
    throw new ExchangeRequestServiceError(
      "Order not found.",
      404
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ONLY DELIVERED ORDERS
  |--------------------------------------------------------------------------
  */

  if (
    existingOrder.orderStatus !==
    "Delivered"
  ) {
    throw new ExchangeRequestServiceError(
      "Only delivered orders can be exchanged.",
      409
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EXISTING EXCHANGE REQUEST
  |--------------------------------------------------------------------------
  |
  | Rejected exchange may be requested again.
  |
  |--------------------------------------------------------------------------
  */

  const existingExchangeStatus =
    cleanString(
      existingOrder
        ?.exchangeRequest
        ?.status
    );

  if (
    existingExchangeStatus &&
    existingExchangeStatus !==
      "Rejected"
  ) {
    throw new ExchangeRequestServiceError(
      `An exchange request already exists with status ${existingExchangeStatus}.`,
      409
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RETURN REQUEST CONFLICT
  |--------------------------------------------------------------------------
  |
  | Same order cannot have an active return and active exchange together.
  |
  |--------------------------------------------------------------------------
  */

  const existingReturnStatus =
    cleanString(
      existingOrder
        ?.returnRequest
        ?.status
    );

  if (
    existingReturnStatus &&
    existingReturnStatus !==
      "Rejected"
  ) {
    throw new ExchangeRequestServiceError(
      `A return request already exists with status ${existingReturnStatus}. Please complete or reject that request before creating an exchange request.`,
      409
    );
  }

  /*
  |--------------------------------------------------------------------------
  | REQUEST TIME
  |--------------------------------------------------------------------------
  */

  const requestedAt =
    new Date();

  /*
  |--------------------------------------------------------------------------
  | ATOMIC EXCHANGE REQUEST
  |--------------------------------------------------------------------------
  |
  | Atomic update protects against:
  |
  | - double click
  | - browser retry
  | - multiple tabs
  | - concurrent requests
  |
  |--------------------------------------------------------------------------
  */

  const updatedOrder: any =
    await Order.findOneAndUpdate(
      {
        _id:
          orderId,

        user:
          userId,

        orderStatus:
          "Delivered",

        /*
        |--------------------------------------------------------------------------
        | NO ACTIVE EXCHANGE + NO ACTIVE RETURN
        |--------------------------------------------------------------------------
        */

        $and: [
          {
            $or: [
              {
                "exchangeRequest.status": {
                  $exists:
                    false,
                },
              },

              {
                "exchangeRequest.status":
                  null,
              },

              {
                "exchangeRequest.status":
                  "",
              },

              {
                "exchangeRequest.status":
                  "Rejected",
              },
            ],
          },

          {
            $or: [
              {
                "returnRequest.status": {
                  $exists:
                    false,
                },
              },

              {
                "returnRequest.status":
                  null,
              },

              {
                "returnRequest.status":
                  "",
              },

              {
                "returnRequest.status":
                  "Rejected",
              },
            ],
          },
        ],
      },
      {
        /*
        |--------------------------------------------------------------------------
        | EXCHANGE REQUEST
        |--------------------------------------------------------------------------
        */

        $set: {
          exchangeRequest: {
            reason,

            status:
              "Pending",

            requestedAt,
          },

          orderStatus:
            "Exchange Requested",
        },

        /*
        |--------------------------------------------------------------------------
        | DELIVERY HISTORY
        |--------------------------------------------------------------------------
        */

        $push: {
          deliveryHistory: {
            status:
              "Exchange Requested",

            date:
              requestedAt,

            note:
              reason,
          },
        },
      },
      {
        new:
          true,

        runValidators:
          true,
      }
    );

  /*
  |--------------------------------------------------------------------------
  | ATOMIC UPDATE FAILED
  |--------------------------------------------------------------------------
  |
  | Another request may have modified the order between:
  |
  | initial read
  |
  | and
  |
  | atomic update.
  |
  |--------------------------------------------------------------------------
  */

  if (
    !updatedOrder
  ) {
    const latestOrder: any =
      await Order.findOne(
        {
          _id:
            orderId,

          user:
            userId,
        }
      );

    if (
      !latestOrder
    ) {
      throw new ExchangeRequestServiceError(
        "Order not found.",
        404
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LATEST EXCHANGE STATUS
    |--------------------------------------------------------------------------
    */

    const latestExchangeStatus =
      cleanString(
        latestOrder
          ?.exchangeRequest
          ?.status
      );

    if (
      latestExchangeStatus &&
      latestExchangeStatus !==
        "Rejected"
    ) {
      throw new ExchangeRequestServiceError(
        `An exchange request already exists with status ${latestExchangeStatus}.`,
        409
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LATEST RETURN STATUS
    |--------------------------------------------------------------------------
    */

    const latestReturnStatus =
      cleanString(
        latestOrder
          ?.returnRequest
          ?.status
      );

    if (
      latestReturnStatus &&
      latestReturnStatus !==
        "Rejected"
    ) {
      throw new ExchangeRequestServiceError(
        `A return request already exists with status ${latestReturnStatus}. Please complete or reject that request before creating an exchange request.`,
        409
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LATEST ORDER STATUS
    |--------------------------------------------------------------------------
    */

    const latestOrderStatus =
      cleanString(
        latestOrder.orderStatus
      );

    if (
      latestOrderStatus !==
      "Delivered"
    ) {
      throw new ExchangeRequestServiceError(
        `This order cannot be exchanged because its current status is ${latestOrderStatus || "unknown"}.`,
        409
      );
    }

    throw new ExchangeRequestServiceError(
      "Unable to submit exchange request. Please try again.",
      409
    );
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT INVENTORY RULE
  |--------------------------------------------------------------------------
  |
  | Exchange Request means only:
  |
  | Customer has REQUESTED an exchange.
  |
  | It does NOT mean:
  |
  | - original product returned to warehouse
  | - original stock should be restored
  | - replacement stock should be reserved
  | - replacement stock should be deducted
  | - sold count should change
  |
  | Those actions belong to the later approved/completed exchange workflow.
  |
  |--------------------------------------------------------------------------
  */

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT REFUND RULE
  |--------------------------------------------------------------------------
  |
  | Do not:
  |
  | refundStatus = Requested
  |
  | because an Exchange Request is not automatically a refund request.
  |
  |--------------------------------------------------------------------------
  */

  /*
  |--------------------------------------------------------------------------
  | REAL EXCHANGE LEARNING
  |--------------------------------------------------------------------------
  |
  | This code is reached only after the real DB update succeeded.
  |
  | Exactly one event is created:
  |
  | exchange_requested
  |
  |--------------------------------------------------------------------------
  */

  await recordExchangeLearning(
    {
      userId,

      orderId,

      order:
        updatedOrder,

      reason,

      channel,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | SUCCESS
  |--------------------------------------------------------------------------
  */

  return {
    success:
      true,

    order:
      updatedOrder,
  };
}