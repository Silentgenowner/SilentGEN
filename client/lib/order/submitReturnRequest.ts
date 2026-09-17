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

export type SubmitReturnRequestInput = {
  userId:
    string;

  orderId:
    string;

  reason:
    string;

  image?:
    string | null;

  channel?:
    "website_dynamic_route" |
    "website_flat_route" |
    "other";
};

export type SubmitReturnRequestResult = {
  success:
    true;

  order:
    any;
};

/*
|--------------------------------------------------------------------------
| SERVICE ERROR
|--------------------------------------------------------------------------
*/

export class ReturnRequestServiceError
  extends Error {
  status:
    number;

  constructor(
    message:
      string,
    status =
      400
  ) {
    super(
      message
    );

    this.name =
      "ReturnRequestServiceError";

    this.status =
      status;
  }
}

/*
|--------------------------------------------------------------------------
| HELPERS
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

function safeNumber(
  value:
    unknown
) {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return 0;
  }

  return parsed;
}

function safeQuantity(
  value:
    unknown
) {
  const parsed =
    Math.floor(
      safeNumber(
        value
      )
    );

  if (
    parsed <=
    0
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
  value:
    string
) {
  return mongoose.Types.ObjectId.isValid(
    value
  );
}

/*
|--------------------------------------------------------------------------
| BUILD RETURN METADATA
|--------------------------------------------------------------------------
|
| One order return request = one analytics event.
|
| Product details remain metadata.
|
|--------------------------------------------------------------------------
*/

function buildReturnMetadata(
  order:
    any,
  reason:
    string,
  channel:
    string
) {
  const items =
    Array.isArray(
      order?.items
    )
      ? order.items
      : [];

  const productIds:
    string[] =
    [];

  const productNames:
    string[] =
    [];

  const variants:
    string[] =
    [];

  let totalQuantity =
    0;

  for (
    const item of
    items
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
    | VARIANT
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

    const parts =
      [
        productName,

        color
          ? `color:${color}`
          : "",

        size
          ? `size:${size}`
          : "",

        quantity >
          0
          ? `qty:${quantity}`
          : "",
      ].filter(
        Boolean
      );

    if (
      parts.length >
      0
    ) {
      variants.push(
        parts.join(
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
      "real_return_request",

    returnChannel:
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

    variants:
      variants.slice(
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
  };
}

/*
|--------------------------------------------------------------------------
| RECORD RETURN LEARNING
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This happens only AFTER MongoDB successfully creates the return request.
|
|--------------------------------------------------------------------------
*/

async function recordReturnLearning({
  userId,
  orderId,
  order,
  reason,
  channel,
}: {
  userId:
    string;

  orderId:
    string;

  order:
    any;

  reason:
    string;

  channel:
    string;
}) {
  try {
    await recordLearningBusinessEvent(
      {
        eventType:
          "return_requested",

        source:
          "order",

        userId,

        sessionId:
          null,

        conversationId:
          null,

        /*
        |--------------------------------------------------------------------------
        | ORDER LEVEL EVENT
        |--------------------------------------------------------------------------
        |
        | Deliberately no single productId.
        |
        | Example:
        |
        | 1 order containing 3 products
        |
        | must still become:
        |
        | 1 return_requested event
        |
        |--------------------------------------------------------------------------
        */

        productId:
          null,

        orderId,

        metadata:
          buildReturnMetadata(
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
    /*
    |--------------------------------------------------------------------------
    | ANALYTICS FAILURE MUST NOT BREAK RETURN
    |--------------------------------------------------------------------------
    */

    console.error(
      "RETURN REQUEST LEARNING ERROR:",
      error
    );
  }
}

/*
|--------------------------------------------------------------------------
| SUBMIT RETURN REQUEST
|--------------------------------------------------------------------------
*/

export async function submitReturnRequest(
  input:
    SubmitReturnRequestInput
): Promise<
  SubmitReturnRequestResult
> {
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

  const image =
    cleanString(
      input.image
    );

  const channel =
    cleanString(
      input.channel
    ) ||
    "other";

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER ID
  |--------------------------------------------------------------------------
  */

  if (
    !userId ||
    !isValidObjectId(
      userId
    )
  ) {
    throw new ReturnRequestServiceError(
      "Invalid customer account.",
      401
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ORDER ID
  |--------------------------------------------------------------------------
  */

  if (
    !orderId ||
    !isValidObjectId(
      orderId
    )
  ) {
    throw new ReturnRequestServiceError(
      "Invalid order id.",
      400
    );
  }

  /*
  |--------------------------------------------------------------------------
  | REASON
  |--------------------------------------------------------------------------
  */

  if (
    !reason
  ) {
    throw new ReturnRequestServiceError(
      "Please provide a reason for the return.",
      400
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PRE-FLIGHT ORDER CHECK
  |--------------------------------------------------------------------------
  |
  | Used for clear customer-facing error messages.
  |
  |--------------------------------------------------------------------------
  */

  const existingOrder:
    any =
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
    throw new ReturnRequestServiceError(
      "Order not found.",
      404
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ONLY DELIVERED ORDER
  |--------------------------------------------------------------------------
  */

  if (
    existingOrder.orderStatus !==
    "Delivered"
  ) {
    throw new ReturnRequestServiceError(
      "Only delivered orders can be returned.",
      409
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EXISTING RETURN REQUEST
  |--------------------------------------------------------------------------
  |
  | A rejected previous request may be submitted again.
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
    throw new ReturnRequestServiceError(
      `A return request already exists with status ${existingReturnStatus}.`,
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
  | ATOMIC RETURN REQUEST
  |--------------------------------------------------------------------------
  |
  | This is intentionally atomic.
  |
  | It prevents duplicate return requests caused by:
  |
  | - double click
  | - browser retry
  | - two tabs
  | - concurrent requests
  |
  |--------------------------------------------------------------------------
  */

  const updatedOrder:
    any =
    await Order.findOneAndUpdate(
      {
        _id:
          orderId,

        user:
          userId,

        orderStatus:
          "Delivered",

        $or: [
          {
            "returnRequest.status": {
              $exists:
                false,
            },
          },

          {
            "returnRequest.status":
              "Rejected",
          },
        ],
      },
      {
        $set: {
          returnRequest: {
            reason,

            image,

            status:
              "Pending",

            requestedAt,
          },

          orderStatus:
            "Return Requested",
        },

        $push: {
          deliveryHistory: {
            status:
              "Return Requested",

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
  | CONCURRENT / DUPLICATE REQUEST
  |--------------------------------------------------------------------------
  |
  | The pre-flight read may have passed, but another request may have updated
  | the order before our atomic update.
  |
  |--------------------------------------------------------------------------
  */

  if (
    !updatedOrder
  ) {
    const latestOrder:
      any =
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
      throw new ReturnRequestServiceError(
        "Order not found.",
        404
      );
    }

    const latestStatus =
      cleanString(
        latestOrder.orderStatus
      );

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
      throw new ReturnRequestServiceError(
        `A return request already exists with status ${latestReturnStatus}.`,
        409
      );
    }

    if (
      latestStatus !==
      "Delivered"
    ) {
      throw new ReturnRequestServiceError(
        `This order cannot be returned because its current status is ${latestStatus || "unknown"}.`,
        409
      );
    }

    throw new ReturnRequestServiceError(
      "Unable to submit return request. Please try again.",
      409
    );
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT BUSINESS RULE
  |--------------------------------------------------------------------------
  |
  | DO NOT:
  |
  | - restore inventory here
  | - reduce sold count here
  | - mark refund Requested here
  | - mark payment Refunded here
  |
  | This is only a REQUEST.
  |
  | Physical return completion is a separate business stage.
  |
  |--------------------------------------------------------------------------
  */

  /*
  |--------------------------------------------------------------------------
  | LEARNING
  |--------------------------------------------------------------------------
  |
  | Only a successfully persisted real request reaches this block.
  |
  |--------------------------------------------------------------------------
  */

  await recordReturnLearning(
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