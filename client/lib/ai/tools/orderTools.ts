import mongoose from "mongoose";

import Order from "@/models/Order";
import Product from "@/models/Product";

import {
  isShiprocketConfigured,
  trackShiprocketAWB,
} from "@/lib/shiprocket/client";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type GetOrderInput = {
  orderId: string;
};

export type CancelOrderInput = {
  orderId: string;

  reason:
    | string
    | null;

  confirmed: boolean;
};

export type ReturnOrderInput = {
  orderId: string;

  reason: string;

  confirmed: boolean;
};

export type ExchangeOrderInput = {
  orderId: string;

  reason: string;

  confirmed: boolean;
};

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_REASON_LENGTH =
  1000;

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
| CLEAN REASON
|--------------------------------------------------------------------------
*/

function cleanReason(
  value: unknown
) {
  return cleanString(
    value
  ).slice(
    0,
    MAX_REASON_LENGTH
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE VALUE
|--------------------------------------------------------------------------
*/

function normalizeValue(
  value: unknown
) {
  return cleanString(
    value
  ).toLowerCase();
}

/*
|--------------------------------------------------------------------------
| VALID OBJECT ID
|--------------------------------------------------------------------------
*/

function validId(
  value: string
) {
  return (
    Boolean(
      value
    ) &&
    mongoose.Types.ObjectId.isValid(
      value
    )
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
| USER ORDER FILTER
|--------------------------------------------------------------------------
|
| Order model uses:
|
| user: ObjectId
|
|--------------------------------------------------------------------------
*/

function userOrderFilter(
  orderId: string,
  userId: string
) {
  return {
    _id:
      orderId,

    user:
      userId,
  };
}

/*
|--------------------------------------------------------------------------
| LOGIN REQUIRED
|--------------------------------------------------------------------------
*/

function loginRequired(
  message: string
) {
  return {
    success:
      false,

    requiresLogin:
      true,

    message,
  };
}

/*
|--------------------------------------------------------------------------
| ACTIVE REQUEST
|--------------------------------------------------------------------------
*/

function hasActiveRequest(
  request:
    any
) {
  const status =
    cleanString(
      request?.status
    );

  if (!status) {
    return false;
  }

  return ![
    "Rejected",
    "Cancelled",
  ].includes(
    status
  );
}

/*
|--------------------------------------------------------------------------
| ORDER IMAGE
|--------------------------------------------------------------------------
*/

function getImage(
  item: any
) {
  return String(
    item?.image ||
      item?.product?.thumbnail ||
      item?.product?.images?.[0] ||
      ""
  );
}

/*
|--------------------------------------------------------------------------
| SERIALIZE RETURN REQUEST
|--------------------------------------------------------------------------
*/

function serializeReturnRequest(
  request:
    any
) {
  if (
    !request ||
    !cleanString(
      request.status
    )
  ) {
    return null;
  }

  return {
    reason:
      cleanString(
        request.reason
      ),

    status:
      cleanString(
        request.status
      ),

    requestedAt:
      request.requestedAt ||
      null,

    approvedAt:
      request.approvedAt ||
      null,

    rejectedAt:
      request.rejectedAt ||
      null,

    completedAt:
      request.completedAt ||
      null,
  };
}

/*
|--------------------------------------------------------------------------
| SERIALIZE EXCHANGE REQUEST
|--------------------------------------------------------------------------
*/

function serializeExchangeRequest(
  request:
    any
) {
  if (
    !request ||
    !cleanString(
      request.status
    )
  ) {
    return null;
  }

  return {
    reason:
      cleanString(
        request.reason
      ),

    status:
      cleanString(
        request.status
      ),

    requestedAt:
      request.requestedAt ||
      null,

    approvedAt:
      request.approvedAt ||
      null,

    rejectedAt:
      request.rejectedAt ||
      null,

    completedAt:
      request.completedAt ||
      null,

    /*
    |--------------------------------------------------------------------------
    | FUTURE EXCHANGE VARIANT SUPPORT
    |--------------------------------------------------------------------------
    |
    | These are safely exposed if Order.ts later adds them.
    |
    */

    requestedSize:
      cleanString(
        request.requestedSize
      ),

    requestedColor:
      cleanString(
        request.requestedColor
      ),
  };
}

/*
|--------------------------------------------------------------------------
| SERIALIZE ORDER
|--------------------------------------------------------------------------
*/

function serializeOrder(
  raw: any
) {
  const items =
    Array.isArray(
      raw?.items
    )
      ? raw.items.map(
          (
            item: any
          ) => ({
            productId:
              String(
                item?.product?._id ||
                  item?.product ||
                  ""
              ),

            name:
              String(
                item?.name ||
                  item?.product?.name ||
                  ""
              ),

            sku:
              String(
                item?.sku ||
                  item?.product?.sku ||
                  ""
              ),

            image:
              getImage(
                item
              ),

            quantity:
              safeQuantity(
                item?.quantity
              ),

            price:
              Math.max(
                safeNumber(
                  item?.price
                ),
                0
              ),

            size:
              cleanString(
                item?.size
              ),

            color:
              cleanString(
                item?.color
              ),
          })
        )
      : [];

  const deliveryHistory =
    Array.isArray(
      raw?.deliveryHistory
    )
      ? raw.deliveryHistory.map(
          (
            entry: any
          ) => ({
            status:
              cleanString(
                entry?.status
              ),

            date:
              entry?.date ||
              entry?.createdAt ||
              null,

            note:
              cleanString(
                entry?.note
              ),
          })
        )
      : [];

  const orderStatus =
    cleanString(
      raw?.orderStatus
    );

  const returnRequest =
    serializeReturnRequest(
      raw?.returnRequest
    );

  const exchangeRequest =
    serializeExchangeRequest(
      raw?.exchangeRequest
    );

  const activeReturn =
    hasActiveRequest(
      returnRequest
    );

  const activeExchange =
    hasActiveRequest(
      exchangeRequest
    );

  return {
    id:
      String(
        raw?._id ||
          ""
      ),

    orderId:
      String(
        raw?._id ||
          ""
      ),

    items,

    shippingAddress:
      raw?.shippingAddress ||
      null,

    paymentMethod:
      cleanString(
        raw?.paymentMethod
      ),

    paymentStatus:
      cleanString(
        raw?.paymentStatus
      ),

    orderStatus,

    refundStatus:
      cleanString(
        raw?.refundStatus
      ),

    subtotal:
      Math.max(
        safeNumber(
          raw?.subtotal
        ),
        0
      ),

    shippingCharge:
      Math.max(
        safeNumber(
          raw?.shippingCharge
        ),
        0
      ),

    discount:
      Math.max(
        safeNumber(
          raw?.discount
        ),
        0
      ),

    totalAmount:
      Math.max(
        safeNumber(
          raw?.totalAmount
        ),
        0
      ),

    trackingNumber:
      cleanString(
        raw?.trackingNumber ||
          raw?.awbCode
      ),

    courierPartner:
      cleanString(
        raw?.courierPartner
      ),

    deliveryHistory,

    returnRequest,

    exchangeRequest,

    deliveredAt:
      raw?.deliveredAt ||
      null,

    cancelReason:
      cleanString(
        raw?.cancelReason
      ),

    cancelledAt:
      raw?.cancelledAt ||
      null,

    invoiceNo:
      cleanString(
        raw?.invoiceNo
      ),

    invoiceUrl:
      cleanString(
        raw?.invoiceUrl
      ),

    createdAt:
      raw?.createdAt ||
      null,

    updatedAt:
      raw?.updatedAt ||
      null,

    canCancel:
      [
        "Placed",
        "Confirmed",
      ].includes(
        orderStatus
      ),

    canReturn:
      orderStatus ===
        "Delivered" &&
      !activeReturn &&
      !activeExchange,

    canExchange:
      orderStatus ===
        "Delivered" &&
      !activeReturn &&
      !activeExchange,

    url:
      `/account/orders/${String(
        raw?._id ||
          ""
      )}`,
  };
}

/*
|--------------------------------------------------------------------------
| FIND COLOR VARIANT
|--------------------------------------------------------------------------
*/

function findColorVariant(
  product: any,
  color: string
) {
  if (
    !color ||
    !Array.isArray(
      product?.colorVariants
    )
  ) {
    return null;
  }

  const normalizedColor =
    normalizeValue(
      color
    );

  return (
    product.colorVariants.find(
      (
        variant: any
      ) =>
        normalizeValue(
          variant?.color
        ) ===
        normalizedColor
    ) ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| FIND SIZE STOCK
|--------------------------------------------------------------------------
*/

function findSizeStockEntry(
  sizeStocks: unknown,
  size: string
) {
  if (
    !size ||
    !Array.isArray(
      sizeStocks
    )
  ) {
    return null;
  }

  const normalizedSize =
    normalizeValue(
      size
    );

  return (
    sizeStocks.find(
      (
        entry: any
      ) =>
        normalizeValue(
          entry?.size
        ) ===
        normalizedSize
    ) ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| RESTORE EXACT PRODUCT INVENTORY
|--------------------------------------------------------------------------
|
| Used when an order is successfully cancelled.
|
| Priority:
|
| 1. color + size stock
| 2. color-level stock
| 3. product-level size stock
| 4. global product stock
|
|--------------------------------------------------------------------------
*/

async function restoreOrderItemInventory(
  item: any,
  session:
    mongoose.ClientSession
) {
  const productId =
    String(
      item?.product?._id ||
        item?.product ||
        ""
    );

  if (
    !productId ||
    !validId(
      productId
    )
  ) {
    throw new Error(
      "Order contains an invalid product reference."
    );
  }

  const quantity =
    safeQuantity(
      item?.quantity
    );

  if (
    quantity <= 0
  ) {
    throw new Error(
      "Order contains an invalid product quantity."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD PRODUCT
  |--------------------------------------------------------------------------
  |
  | Soft-deleted products are intentionally allowed here because stock from
  | an already-created order still needs to be restored correctly.
  |
  */

  const product:
    any =
    await Product.findById(
      productId
    ).session(
      session
    );

  if (!product) {
    throw new Error(
      `Unable to restore inventory because product ${productId} no longer exists.`
    );
  }

  const size =
    cleanString(
      item?.size
    );

  const color =
    cleanString(
      item?.color
    );

  let restored =
    false;

  /*
  |--------------------------------------------------------------------------
  | COLOR VARIANT
  |--------------------------------------------------------------------------
  */

  if (color) {
    const colorVariant =
      findColorVariant(
        product,
        color
      );

    if (
      colorVariant
    ) {
      /*
      |--------------------------------------------------------------------------
      | COLOR + SIZE STOCK
      |--------------------------------------------------------------------------
      */

      if (
        size &&
        Array.isArray(
          colorVariant.sizeStocks
        ) &&
        colorVariant
          .sizeStocks
          .length >
          0
      ) {
        const sizeStock =
          findSizeStockEntry(
            colorVariant.sizeStocks,
            size
          );

        if (
          sizeStock
        ) {
          sizeStock.stock =
            Math.max(
              safeNumber(
                sizeStock.stock
              ),
              0
            ) +
            quantity;

          restored =
            true;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | COLOR LEVEL STOCK
      |--------------------------------------------------------------------------
      */

      if (
        !restored &&
        (
          typeof colorVariant.stock ===
            "number" ||
          !Array.isArray(
            colorVariant.sizeStocks
          ) ||
          colorVariant
            .sizeStocks
            .length ===
            0
        )
      ) {
        colorVariant.stock =
          Math.max(
            safeNumber(
              colorVariant.stock
            ),
            0
          ) +
          quantity;

        restored =
          true;
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT SIZE STOCK
  |--------------------------------------------------------------------------
  */

  if (
    !restored &&
    size &&
    Array.isArray(
      product.sizeStocks
    ) &&
    product.sizeStocks.length >
      0
  ) {
    const sizeStock =
      findSizeStockEntry(
        product.sizeStocks,
        size
      );

    if (
      sizeStock
    ) {
      sizeStock.stock =
        Math.max(
          safeNumber(
            sizeStock.stock
          ),
          0
        ) +
        quantity;

      restored =
        true;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | GLOBAL STOCK FALLBACK
  |--------------------------------------------------------------------------
  */

  if (
    !restored
  ) {
    product.stock =
      Math.max(
        safeNumber(
          product.stock
        ),
        0
      ) +
      quantity;
  }

  /*
  |--------------------------------------------------------------------------
  | SOLD COUNT
  |--------------------------------------------------------------------------
  */

  product.sold =
    Math.max(
      safeNumber(
        product.sold
      ) -
        quantity,
      0
    );

  /*
  |--------------------------------------------------------------------------
  | SAVE PRODUCT
  |--------------------------------------------------------------------------
  |
  | Product model pre-save inventory normalization remains authoritative.
  |
  */

  await product.save({
    session,
  });
}

/*
|--------------------------------------------------------------------------
| GET ORDERS
|--------------------------------------------------------------------------
*/

export async function getAIOrders(
  userId:
    | string
    | null,
  limit =
    10
) {
  if (
    !userId
  ) {
    return loginRequired(
      "Please login to view your orders."
    );
  }

  if (
    !validId(
      userId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid customer account.",

      orders:
        [],
    };
  }

  const safeLimit =
    Math.min(
      Math.max(
        Math.floor(
          Number(
            limit
          ) ||
            10
        ),
        1
      ),
      20
    );

  const orders =
    await Order.find({
      user:
        userId,
    })
      .sort({
        createdAt:
          -1,
      })
      .limit(
        safeLimit
      )
      .lean();

  return {
    success:
      true,

    count:
      orders.length,

    orders:
      orders.map(
        serializeOrder
      ),

    message:
      orders.length > 0
        ? "Orders loaded successfully."
        : "You do not have any orders yet.",
  };
}

/*
|--------------------------------------------------------------------------
| GET SINGLE ORDER
|--------------------------------------------------------------------------
*/

export async function getAIOrder(
  userId:
    | string
    | null,
  input:
    GetOrderInput
) {
  if (
    !userId
  ) {
    return loginRequired(
      "Please login to view this order."
    );
  }

  const orderId =
    cleanString(
      input.orderId
    );

  if (
    !validId(
      userId
    ) ||
    !validId(
      orderId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid order id.",
    };
  }

  const order =
    await Order.findOne(
      userOrderFilter(
        orderId,
        userId
      )
    ).lean();

  if (
    !order
  ) {
    return {
      success:
        false,

      message:
        "Order not found.",
    };
  }

  return {
    success:
      true,

    order:
      serializeOrder(
        order
      ),
  };
}

/*
|--------------------------------------------------------------------------
| TRACK ORDER
|--------------------------------------------------------------------------
*/

export async function trackAIOrder(
  userId:
    | string
    | null,
  input:
    GetOrderInput
) {
  const orderResult =
    await getAIOrder(
      userId,
      input
    );

  if (
    !orderResult.success ||
    !(
      "order" in
      orderResult
    ) ||
    !orderResult.order
  ) {
    return orderResult;
  }

  const order =
    orderResult.order;

  const awb =
    cleanString(
      order.trackingNumber
    );

  /*
  |--------------------------------------------------------------------------
  | NO AWB
  |--------------------------------------------------------------------------
  */

  if (!awb) {
    return {
      success:
        true,

      liveTracking:
        false,

      shiprocketConfigured:
        isShiprocketConfigured(),

      order,

      tracking:
        null,

      message:
        order.orderStatus ===
        "Placed"
          ? "Your order has been placed. Tracking will become available after shipment is assigned."
          : "Tracking number has not been assigned yet.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SHIPROCKET NOT CONFIGURED
  |--------------------------------------------------------------------------
  */

  if (
    !isShiprocketConfigured()
  ) {
    return {
      success:
        true,

      liveTracking:
        false,

      shiprocketConfigured:
        false,

      order,

      tracking: {
        awb,

        courier:
          order.courierPartner,

        status:
          order.orderStatus,

        localStatus:
          order.orderStatus,

        history:
          order.deliveryHistory,
      },

      message:
        "Live Shiprocket tracking is not configured. Showing the latest SilentGEN order status.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | LIVE SHIPROCKET TRACKING
  |--------------------------------------------------------------------------
  */

  try {
    const shiprocket =
      await trackShiprocketAWB(
        awb
      );

    if (
      !shiprocket.success
    ) {
      return {
        success:
          true,

        liveTracking:
          false,

        shiprocketConfigured:
          true,

        order,

        tracking: {
          awb,

          courier:
            order.courierPartner,

          status:
            order.orderStatus,

          localStatus:
            order.orderStatus,

          history:
            order.deliveryHistory,
        },

        shiprocketError:
          shiprocket.message,

        message:
          "Live tracking is temporarily unavailable. Showing the latest SilentGEN order status.",
      };
    }

    return {
      success:
        true,

      liveTracking:
        true,

      shiprocketConfigured:
        true,

      order,

      tracking: {
        awb,

        courier:
          order.courierPartner,

        status:
          order.orderStatus,

        localStatus:
          order.orderStatus,

        history:
          order.deliveryHistory,

        shiprocket:
          shiprocket.data,
      },

      message:
        "Live Shiprocket tracking loaded successfully.",
    };
  } catch (
    error
  ) {
    console.error(
      "AI Shiprocket Tracking Error:",
      error
    );

    return {
      success:
        true,

      liveTracking:
        false,

      shiprocketConfigured:
        true,

      order,

      tracking: {
        awb,

        courier:
          order.courierPartner,

        status:
          order.orderStatus,

        localStatus:
          order.orderStatus,

        history:
          order.deliveryHistory,
      },

      shiprocketError:
        error instanceof
        Error
          ? error.message
          : "Shiprocket tracking failed.",

      message:
        "Live tracking is temporarily unavailable. Showing the latest SilentGEN order status.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL ORDER
|--------------------------------------------------------------------------
*/

export async function cancelAIOrder(
  userId:
    | string
    | null,
  input:
    CancelOrderInput
) {
  if (
    !userId
  ) {
    return loginRequired(
      "Please login to cancel an order."
    );
  }

  const orderId =
    cleanString(
      input.orderId
    );

  const requestedReason =
    cleanReason(
      input.reason
    );

  if (
    !validId(
      userId
    ) ||
    !validId(
      orderId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid order id.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRMATION GATE
  |--------------------------------------------------------------------------
  |
  | chat/route.ts performs the stronger server-side pending-action check.
  |
  | This is a second safety layer.
  |
  */

  if (
    input.confirmed !==
    true
  ) {
    return {
      success:
        false,

      confirmationRequired:
        true,

      action:
        "cancel_order",

      orderId,

      reason:
        requestedReason ||
        null,

      message:
        "Please confirm that you want to cancel this order.",
    };
  }

  const session =
    await mongoose.startSession();

  try {
    let finalOrder:
      any =
      null;

    await session.withTransaction(
      async () => {
        /*
        |--------------------------------------------------------------------------
        | LOAD ORDER INSIDE TRANSACTION
        |--------------------------------------------------------------------------
        */

        const order:
          any =
          await Order.findOne(
            userOrderFilter(
              orderId,
              userId
            )
          ).session(
            session
          );

        if (
          !order
        ) {
          throw new Error(
            "ORDER_NOT_FOUND"
          );
        }

        const currentStatus =
          cleanString(
            order.orderStatus
          );

        /*
        |--------------------------------------------------------------------------
        | ALREADY CANCELLED
        |--------------------------------------------------------------------------
        */

        if (
          currentStatus ===
          "Cancelled"
        ) {
          throw new Error(
            "ORDER_ALREADY_CANCELLED"
          );
        }

        /*
        |--------------------------------------------------------------------------
        | CANCELLATION STATUS ELIGIBILITY
        |--------------------------------------------------------------------------
        */

        if (
          ![
            "Placed",
            "Confirmed",
          ].includes(
            currentStatus
          )
        ) {
          throw new Error(
            `ORDER_NOT_CANCELLABLE:${currentStatus}`
          );
        }

        /*
        |--------------------------------------------------------------------------
        | RESTORE INVENTORY
        |--------------------------------------------------------------------------
        */

        if (
          !Array.isArray(
            order.items
          ) ||
          order.items.length ===
            0
        ) {
          throw new Error(
            "ORDER_HAS_NO_ITEMS"
          );
        }

        for (
          const item of
          order.items
        ) {
          await restoreOrderItemInventory(
            item,
            session
          );
        }

        const reason =
          requestedReason ||
          "Cancelled by customer through SilentGEN AI";

        /*
        |--------------------------------------------------------------------------
        | ORDER STATUS
        |--------------------------------------------------------------------------
        */

        order.orderStatus =
          "Cancelled";

        order.cancelReason =
          reason;

        order.cancelledAt =
          new Date();

        /*
        |--------------------------------------------------------------------------
        | PAID ORDER REFUND
        |--------------------------------------------------------------------------
        |
        | Cancellation does NOT mean refund is already completed.
        |
        */

        if (
          cleanString(
            order.paymentStatus
          ) ===
          "Paid"
        ) {
          order.refundStatus =
            "Requested";
        }

        /*
        |--------------------------------------------------------------------------
        | DELIVERY HISTORY
        |--------------------------------------------------------------------------
        */

        if (
          !Array.isArray(
            order.deliveryHistory
          )
        ) {
          order.deliveryHistory =
            [];
        }

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

        await order.save({
          session,
        });

        finalOrder =
          order.toObject();
      }
    );

    if (
      !finalOrder
    ) {
      return {
        success:
          false,

        message:
          "Unable to cancel order.",
      };
    }

    return {
      success:
        true,

      action:
        "cancel_order",

      actionCompleted:
        true,

      confirmationRequired:
        false,

      orderId,

      reason:
        cleanString(
          finalOrder.cancelReason
        ),

      order:
        serializeOrder(
          finalOrder
        ),

      /*
      |--------------------------------------------------------------------------
      | SHIPROCKET
      |--------------------------------------------------------------------------
      |
      | We intentionally do NOT call an unverified Shiprocket cancellation API
      | from here.
      |
      */

      shiprocketActionRequired:
        Boolean(
          cleanString(
            finalOrder.trackingNumber ||
              finalOrder.awbCode
          )
        ),

      message:
        cleanString(
          finalOrder.paymentStatus
        ) ===
        "Paid"
          ? "Order cancelled successfully and inventory restored. Refund has been marked as requested; actual refund completion depends on the payment process."
          : "Order cancelled successfully and inventory restored.",
    };
  } catch (
    error
  ) {
    const errorMessage =
      error instanceof
      Error
        ? error.message
        : "";

    if (
      errorMessage ===
      "ORDER_NOT_FOUND"
    ) {
      return {
        success:
          false,

        message:
          "Order not found.",
      };
    }

    if (
      errorMessage ===
      "ORDER_ALREADY_CANCELLED"
    ) {
      return {
        success:
          false,

        message:
          "This order is already cancelled.",
      };
    }

    if (
      errorMessage ===
      "ORDER_HAS_NO_ITEMS"
    ) {
      return {
        success:
          false,

        message:
          "This order does not contain valid items and cannot be cancelled automatically.",
      };
    }

    if (
      errorMessage.startsWith(
        "ORDER_NOT_CANCELLABLE:"
      )
    ) {
      const status =
        errorMessage
          .slice(
            "ORDER_NOT_CANCELLABLE:"
              .length
          ) ||
        "unknown";

      return {
        success:
          false,

        message:
          `This order cannot be cancelled because its current status is ${status}.`,
      };
    }

    console.error(
      "AI Cancel Order Error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to cancel this order right now. Please try again.",
    };
  } finally {
    await session.endSession();
  }
}

/*
|--------------------------------------------------------------------------
| RETURN REQUEST
|--------------------------------------------------------------------------
*/

export async function requestAIReturn(
  userId:
    | string
    | null,
  input:
    ReturnOrderInput
) {
  if (
    !userId
  ) {
    return loginRequired(
      "Please login to request a return."
    );
  }

  const orderId =
    cleanString(
      input.orderId
    );

  const reason =
    cleanReason(
      input.reason
    );

  if (
    !validId(
      userId
    ) ||
    !validId(
      orderId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid order id.",
    };
  }

  if (
    !reason
  ) {
    return {
      success:
        false,

      message:
        "Please provide a reason for the return.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRMATION
  |--------------------------------------------------------------------------
  */

  if (
    input.confirmed !==
    true
  ) {
    return {
      success:
        false,

      confirmationRequired:
        true,

      action:
        "request_return",

      orderId,

      reason,

      message:
        "Please confirm that you want to submit this return request.",
    };
  }

  const session =
    await mongoose.startSession();

  try {
    let finalOrder:
      any =
      null;

    await session.withTransaction(
      async () => {
        const order:
          any =
          await Order.findOne(
            userOrderFilter(
              orderId,
              userId
            )
          ).session(
            session
          );

        if (
          !order
        ) {
          throw new Error(
            "ORDER_NOT_FOUND"
          );
        }

        /*
        |--------------------------------------------------------------------------
        | DELIVERED ONLY
        |--------------------------------------------------------------------------
        */

        if (
          cleanString(
            order.orderStatus
          ) !==
          "Delivered"
        ) {
          throw new Error(
            "RETURN_NOT_DELIVERED"
          );
        }

        /*
        |--------------------------------------------------------------------------
        | EXISTING RETURN
        |--------------------------------------------------------------------------
        */

        if (
          hasActiveRequest(
            order.returnRequest
          )
        ) {
          throw new Error(
            `RETURN_ALREADY_EXISTS:${cleanString(
              order.returnRequest
                ?.status
            )}`
          );
        }

        /*
        |--------------------------------------------------------------------------
        | BLOCK WHEN EXCHANGE ALREADY ACTIVE
        |--------------------------------------------------------------------------
        */

        if (
          hasActiveRequest(
            order.exchangeRequest
          )
        ) {
          throw new Error(
            `ACTIVE_EXCHANGE_EXISTS:${cleanString(
              order.exchangeRequest
                ?.status
            )}`
          );
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE RETURN REQUEST
        |--------------------------------------------------------------------------
        |
        | Stock is NOT restored here.
        |
        */

        order.returnRequest =
          {
            reason,

            status:
              "Pending",

            requestedAt:
              new Date(),
          };

        order.orderStatus =
          "Return Requested";

        if (
          !Array.isArray(
            order.deliveryHistory
          )
        ) {
          order.deliveryHistory =
            [];
        }

        order.deliveryHistory.push(
          {
            status:
              "Return Requested",

            date:
              new Date(),

            note:
              reason,
          }
        );

        await order.save({
          session,
        });

        finalOrder =
          order.toObject();
      }
    );

    if (
      !finalOrder
    ) {
      return {
        success:
          false,

        message:
          "Unable to submit return request.",
      };
    }

    return {
      success:
        true,

      action:
        "request_return",

      actionCompleted:
        true,

      confirmationRequired:
        false,

      orderId,

      reason,

      order:
        serializeOrder(
          finalOrder
        ),

      message:
        "Return request submitted successfully.",
    };
  } catch (
    error
  ) {
    const errorMessage =
      error instanceof
      Error
        ? error.message
        : "";

    if (
      errorMessage ===
      "ORDER_NOT_FOUND"
    ) {
      return {
        success:
          false,

        message:
          "Order not found.",
      };
    }

    if (
      errorMessage ===
      "RETURN_NOT_DELIVERED"
    ) {
      return {
        success:
          false,

        message:
          "Return can only be requested after the order is delivered.",
      };
    }

    if (
      errorMessage.startsWith(
        "RETURN_ALREADY_EXISTS:"
      )
    ) {
      const status =
        errorMessage
          .slice(
            "RETURN_ALREADY_EXISTS:"
              .length
          ) ||
        "active";

      return {
        success:
          false,

        message:
          `A return request already exists with status ${status}.`,
      };
    }

    if (
      errorMessage.startsWith(
        "ACTIVE_EXCHANGE_EXISTS:"
      )
    ) {
      const status =
        errorMessage
          .slice(
            "ACTIVE_EXCHANGE_EXISTS:"
              .length
          ) ||
        "active";

      return {
        success:
          false,

        message:
          `A return cannot be requested while an exchange request is active with status ${status}.`,
      };
    }

    console.error(
      "AI Return Request Error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to submit this return request right now. Please try again.",
    };
  } finally {
    await session.endSession();
  }
}

/*
|--------------------------------------------------------------------------
| EXCHANGE REQUEST
|--------------------------------------------------------------------------
*/

export async function requestAIExchange(
  userId:
    | string
    | null,
  input:
    ExchangeOrderInput
) {
  if (
    !userId
  ) {
    return loginRequired(
      "Please login to request an exchange."
    );
  }

  const orderId =
    cleanString(
      input.orderId
    );

  const reason =
    cleanReason(
      input.reason
    );

  if (
    !validId(
      userId
    ) ||
    !validId(
      orderId
    )
  ) {
    return {
      success:
        false,

      message:
        "Invalid order id.",
    };
  }

  if (
    !reason
  ) {
    return {
      success:
        false,

      message:
        "Please provide a reason for the exchange.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRMATION
  |--------------------------------------------------------------------------
  */

  if (
    input.confirmed !==
    true
  ) {
    return {
      success:
        false,

      confirmationRequired:
        true,

      action:
        "request_exchange",

      orderId,

      reason,

      message:
        "Please confirm that you want to submit this exchange request.",
    };
  }

  const session =
    await mongoose.startSession();

  try {
    let finalOrder:
      any =
      null;

    await session.withTransaction(
      async () => {
        const order:
          any =
          await Order.findOne(
            userOrderFilter(
              orderId,
              userId
            )
          ).session(
            session
          );

        if (
          !order
        ) {
          throw new Error(
            "ORDER_NOT_FOUND"
          );
        }

        /*
        |--------------------------------------------------------------------------
        | DELIVERED ONLY
        |--------------------------------------------------------------------------
        */

        if (
          cleanString(
            order.orderStatus
          ) !==
          "Delivered"
        ) {
          throw new Error(
            "EXCHANGE_NOT_DELIVERED"
          );
        }

        /*
        |--------------------------------------------------------------------------
        | EXISTING EXCHANGE
        |--------------------------------------------------------------------------
        */

        if (
          hasActiveRequest(
            order.exchangeRequest
          )
        ) {
          throw new Error(
            `EXCHANGE_ALREADY_EXISTS:${cleanString(
              order.exchangeRequest
                ?.status
            )}`
          );
        }

        /*
        |--------------------------------------------------------------------------
        | BLOCK WHEN RETURN ALREADY ACTIVE
        |--------------------------------------------------------------------------
        */

        if (
          hasActiveRequest(
            order.returnRequest
          )
        ) {
          throw new Error(
            `ACTIVE_RETURN_EXISTS:${cleanString(
              order.returnRequest
                ?.status
            )}`
          );
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE EXCHANGE REQUEST
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | No replacement inventory is deducted here.
        |
        | Replacement size/color will be added after Order.ts is updated.
        |
        */

        order.exchangeRequest =
          {
            reason,

            status:
              "Pending",

            requestedAt:
              new Date(),
          };

        order.orderStatus =
          "Exchange Requested";

        if (
          !Array.isArray(
            order.deliveryHistory
          )
        ) {
          order.deliveryHistory =
            [];
        }

        order.deliveryHistory.push(
          {
            status:
              "Exchange Requested",

            date:
              new Date(),

            note:
              reason,
          }
        );

        await order.save({
          session,
        });

        finalOrder =
          order.toObject();
      }
    );

    if (
      !finalOrder
    ) {
      return {
        success:
          false,

        message:
          "Unable to submit exchange request.",
      };
    }

    return {
      success:
        true,

      action:
        "request_exchange",

      actionCompleted:
        true,

      confirmationRequired:
        false,

      orderId,

      reason,

      order:
        serializeOrder(
          finalOrder
        ),

      message:
        "Exchange request submitted successfully.",
    };
  } catch (
    error
  ) {
    const errorMessage =
      error instanceof
      Error
        ? error.message
        : "";

    if (
      errorMessage ===
      "ORDER_NOT_FOUND"
    ) {
      return {
        success:
          false,

        message:
          "Order not found.",
      };
    }

    if (
      errorMessage ===
      "EXCHANGE_NOT_DELIVERED"
    ) {
      return {
        success:
          false,

        message:
          "Exchange can only be requested after the order is delivered.",
      };
    }

    if (
      errorMessage.startsWith(
        "EXCHANGE_ALREADY_EXISTS:"
      )
    ) {
      const status =
        errorMessage
          .slice(
            "EXCHANGE_ALREADY_EXISTS:"
              .length
          ) ||
        "active";

      return {
        success:
          false,

        message:
          `An exchange request already exists with status ${status}.`,
      };
    }

    if (
      errorMessage.startsWith(
        "ACTIVE_RETURN_EXISTS:"
      )
    ) {
      const status =
        errorMessage
          .slice(
            "ACTIVE_RETURN_EXISTS:"
              .length
          ) ||
        "active";

      return {
        success:
          false,

        message:
          `An exchange cannot be requested while a return request is active with status ${status}.`,
      };
    }

    console.error(
      "AI Exchange Request Error:",
      error
    );

    return {
      success:
        false,

      message:
        "Unable to submit this exchange request right now. Please try again.",
    };
  } finally {
    await session.endSession();
  }
}