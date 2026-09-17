import mongoose, {
  Schema,
  Document,
  models,
  model,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| ORDER STATUS TYPE
|--------------------------------------------------------------------------
*/

export type OrderStatus =
  | "Placed"
  | "Confirmed"
  | "Packed"
  | "Shipped"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled"
  | "Return Requested"
  | "Returned"
  | "Exchange Requested"
  | "Refunded";

/*
|--------------------------------------------------------------------------
| PAYMENT STATUS TYPE
|--------------------------------------------------------------------------
*/

export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded";

/*
|--------------------------------------------------------------------------
| REFUND STATUS TYPE
|--------------------------------------------------------------------------
*/

export type RefundStatus =
  | "None"
  | "Requested"
  | "Processing"
  | "Completed";

/*
|--------------------------------------------------------------------------
| REQUEST STATUS
|--------------------------------------------------------------------------
*/

export type RequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Completed";

/*
|--------------------------------------------------------------------------
| ORDER ITEM
|--------------------------------------------------------------------------
*/

export interface IOrderItem {
  product:
    mongoose.Types.ObjectId;

  sku:
    string;

  name:
    string;

  image:
    string;

  price:
    number;

  quantity:
    number;

  size?:
    string;

  color?:
    string;
}

/*
|--------------------------------------------------------------------------
| ADDRESS
|--------------------------------------------------------------------------
*/

export interface IAddress {
  fullName:
    string;

  mobile:
    string;

  address:
    string;

  area:
    string;

  city:
    string;

  state:
    string;

  country:
    string;

  pincode:
    string;

  landmark?:
    string;
}

/*
|--------------------------------------------------------------------------
| DELIVERY HISTORY
|--------------------------------------------------------------------------
*/

export interface IDeliveryHistory {
  status:
    OrderStatus;

  date:
    Date;

  note?:
    string;
}

/*
|--------------------------------------------------------------------------
| RETURN REQUEST
|--------------------------------------------------------------------------
*/

export interface IReturnRequest {
  reason:
    string;

  image?:
    string;

  status:
    RequestStatus;

  requestedAt:
    Date;

  approvedAt?:
    Date | null;

  rejectedAt?:
    Date | null;

  completedAt?:
    Date | null;
}

/*
|--------------------------------------------------------------------------
| EXCHANGE REQUEST
|--------------------------------------------------------------------------
*/

export interface IExchangeRequest {
  reason:
    string;

  status:
    RequestStatus;

  requestedAt:
    Date;

  /*
  |--------------------------------------------------------------------------
  | FUTURE REPLACEMENT VARIANT
  |--------------------------------------------------------------------------
  |
  | These fields are intentionally optional.
  |
  | Current AI exchange flow does NOT guess or write these yet.
  |
  | Later, when customer selects a replacement variant, these fields can be
  | safely used without another schema redesign.
  |
  */

  requestedSize?:
    string;

  requestedColor?:
    string;

  approvedAt?:
    Date | null;

  rejectedAt?:
    Date | null;

  completedAt?:
    Date | null;
}

/*
|--------------------------------------------------------------------------
| ORDER
|--------------------------------------------------------------------------
*/

export interface IOrder
  extends Document {
  user:
    mongoose.Types.ObjectId;

  items:
    IOrderItem[];

  shippingAddress:
    IAddress;

  paymentMethod:
    | "COD"
    | "ONLINE";

  paymentStatus:
    PaymentStatus;

  orderStatus:
    OrderStatus;

  deliveryHistory:
    IDeliveryHistory[];

  subtotal:
    number;

  shippingCharge:
    number;

  discount:
    number;

  totalAmount:
    number;

  trackingNumber?:
    string;

  courierPartner?:
    string;

  returnRequest?:
    IReturnRequest;

  exchangeRequest?:
    IExchangeRequest;

  refundStatus:
    RefundStatus;

  deliveredAt?:
    Date | null;

  cancelReason?:
    string;

  cancelledAt?:
    Date | null;

  invoiceNo?:
    string;

  invoiceUrl?:
    string;

  createdAt:
    Date;

  updatedAt:
    Date;
}

/*
|--------------------------------------------------------------------------
| ORDER ITEM SCHEMA
|--------------------------------------------------------------------------
*/

const OrderItemSchema =
  new Schema<IOrderItem>(
    {
      product: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Product",

        required:
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

      name: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      image: {
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

        required:
          true,

        min:
          0,
      },

      quantity: {
        type:
          Number,

        required:
          true,

        min:
          1,
      },

      size: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      color: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| ADDRESS SCHEMA
|--------------------------------------------------------------------------
*/

const AddressSchema =
  new Schema<IAddress>(
    {
      fullName: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      mobile: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      address: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      area: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      city: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      state: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      country: {
        type:
          String,

        default:
          "India",

        trim:
          true,
      },

      pincode: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      landmark: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| DELIVERY HISTORY SCHEMA
|--------------------------------------------------------------------------
*/

const DeliveryHistorySchema =
  new Schema<IDeliveryHistory>(
    {
      status: {
        type:
          String,

        enum: [
          "Placed",
          "Confirmed",
          "Packed",
          "Shipped",
          "Out For Delivery",
          "Delivered",
          "Cancelled",
          "Return Requested",
          "Returned",
          "Exchange Requested",
          "Refunded",
        ],

        required:
          true,
      },

      date: {
        type:
          Date,

        default:
          Date.now,
      },

      note: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| RETURN REQUEST SCHEMA
|--------------------------------------------------------------------------
*/

const ReturnRequestSchema =
  new Schema<IReturnRequest>(
    {
      reason: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      image: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      status: {
        type:
          String,

        enum: [
          "Pending",
          "Approved",
          "Rejected",
          "Completed",
        ],

        default:
          "Pending",
      },

      requestedAt: {
        type:
          Date,

        default:
          Date.now,
      },

      approvedAt: {
        type:
          Date,

        default:
          null,
      },

      rejectedAt: {
        type:
          Date,

        default:
          null,
      },

      completedAt: {
        type:
          Date,

        default:
          null,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| EXCHANGE REQUEST SCHEMA
|--------------------------------------------------------------------------
*/

const ExchangeRequestSchema =
  new Schema<IExchangeRequest>(
    {
      reason: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      status: {
        type:
          String,

        enum: [
          "Pending",
          "Approved",
          "Rejected",
          "Completed",
        ],

        default:
          "Pending",
      },

      requestedAt: {
        type:
          Date,

        default:
          Date.now,
      },

      /*
      |--------------------------------------------------------------------------
      | REQUESTED REPLACEMENT VARIANT
      |--------------------------------------------------------------------------
      |
      | Present in schema now so future admin/customer exchange fulfillment
      | does not require another data migration.
      |
      */

      requestedSize: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      requestedColor: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      approvedAt: {
        type:
          Date,

        default:
          null,
      },

      rejectedAt: {
        type:
          Date,

        default:
          null,
      },

      completedAt: {
        type:
          Date,

        default:
          null,
      },
    },
    {
      _id:
        false,
    }
  );

/*
|--------------------------------------------------------------------------
| ORDER SCHEMA
|--------------------------------------------------------------------------
*/

const OrderSchema =
  new Schema<IOrder>(
    {
      /*
      |--------------------------------------------------------------------------
      | CUSTOMER
      |--------------------------------------------------------------------------
      */

      user: {
        type:
          Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | PRODUCTS
      |--------------------------------------------------------------------------
      */

      items: {
        type: [
          OrderItemSchema,
        ],

        required:
          true,

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | SHIPPING ADDRESS
      |--------------------------------------------------------------------------
      */

      shippingAddress: {
        type:
          AddressSchema,

        required:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | PAYMENT METHOD
      |--------------------------------------------------------------------------
      */

      paymentMethod: {
        type:
          String,

        enum: [
          "COD",
          "ONLINE",
        ],

        default:
          "COD",
      },

      /*
      |--------------------------------------------------------------------------
      | PAYMENT STATUS
      |--------------------------------------------------------------------------
      */

      paymentStatus: {
        type:
          String,

        enum: [
          "Pending",
          "Paid",
          "Failed",
          "Refunded",
        ],

        default:
          "Pending",
      },

      /*
      |--------------------------------------------------------------------------
      | ORDER STATUS
      |--------------------------------------------------------------------------
      */

      orderStatus: {
        type:
          String,

        enum: [
          "Placed",
          "Confirmed",
          "Packed",
          "Shipped",
          "Out For Delivery",
          "Delivered",
          "Cancelled",
          "Return Requested",
          "Returned",
          "Exchange Requested",
          "Refunded",
        ],

        default:
          "Placed",
      },

      /*
      |--------------------------------------------------------------------------
      | DELIVERY HISTORY
      |--------------------------------------------------------------------------
      */

      deliveryHistory: {
        type: [
          DeliveryHistorySchema,
        ],

        default:
          [],
      },

      /*
      |--------------------------------------------------------------------------
      | PRICE
      |--------------------------------------------------------------------------
      */

      subtotal: {
        type:
          Number,

        required:
          true,

        min:
          0,
      },

      shippingCharge: {
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

      totalAmount: {
        type:
          Number,

        required:
          true,

        min:
          0,
      },

      /*
      |--------------------------------------------------------------------------
      | SHIPPING / TRACKING
      |--------------------------------------------------------------------------
      */

      trackingNumber: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      courierPartner: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | RETURN REQUEST
      |--------------------------------------------------------------------------
      */

      returnRequest: {
        type:
          ReturnRequestSchema,

        default:
          undefined,
      },

      /*
      |--------------------------------------------------------------------------
      | EXCHANGE REQUEST
      |--------------------------------------------------------------------------
      */

      exchangeRequest: {
        type:
          ExchangeRequestSchema,

        default:
          undefined,
      },

      /*
      |--------------------------------------------------------------------------
      | REFUND
      |--------------------------------------------------------------------------
      */

      refundStatus: {
        type:
          String,

        enum: [
          "None",
          "Requested",
          "Processing",
          "Completed",
        ],

        default:
          "None",
      },

      /*
      |--------------------------------------------------------------------------
      | DELIVERY
      |--------------------------------------------------------------------------
      */

      deliveredAt: {
        type:
          Date,

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | CANCELLATION
      |--------------------------------------------------------------------------
      */

      cancelReason: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      cancelledAt: {
        type:
          Date,

        default:
          null,
      },

      /*
      |--------------------------------------------------------------------------
      | INVOICE
      |--------------------------------------------------------------------------
      |
      | orderTools.ts already exposes invoiceNo and invoiceUrl.
      |
      */

      invoiceNo: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },

      invoiceUrl: {
        type:
          String,

        default:
          "",

        trim:
          true,
      },
    },
    {
      timestamps:
        true,
    }
  );

/*
|--------------------------------------------------------------------------
| VALIDATE ORDER ITEMS
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Mongoose 9 middleware is callbackless here.
| Do NOT add "next".
|
|--------------------------------------------------------------------------
*/

OrderSchema.pre(
  "validate",
  function () {
    if (
      !Array.isArray(
        this.items
      ) ||
      this.items.length ===
        0
    ) {
      this.invalidate(
        "items",
        "Order must contain at least one product."
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| AUTO DELIVERED AT
|--------------------------------------------------------------------------
*/

OrderSchema.pre(
  "save",
  function () {
    if (
      this.orderStatus ===
        "Delivered" &&
      !this.deliveredAt
    ) {
      this.deliveredAt =
        new Date();
    }
  }
);

/*
|--------------------------------------------------------------------------
| DATABASE INDEXES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CUSTOMER ORDER HISTORY
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  user:
    1,

  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| CUSTOMER + ORDER STATUS
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  user:
    1,

  orderStatus:
    1,

  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| ORDER STATUS
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  orderStatus:
    1,

  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| PAYMENT STATUS
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  paymentStatus:
    1,

  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| REFUND STATUS
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  refundStatus:
    1,

  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| NEWEST ORDERS
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| TRACKING
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  trackingNumber:
    1,
});

/*
|--------------------------------------------------------------------------
| PRODUCT ORDER HISTORY
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  "items.product":
    1,

  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| RETURN REQUEST STATUS
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  "returnRequest.status":
    1,

  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| EXCHANGE REQUEST STATUS
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  "exchangeRequest.status":
    1,

  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| CUSTOMER RETURN REQUESTS
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  user:
    1,

  "returnRequest.status":
    1,

  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| CUSTOMER EXCHANGE REQUESTS
|--------------------------------------------------------------------------
*/

OrderSchema.index({
  user:
    1,

  "exchangeRequest.status":
    1,

  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const Order =
  models.Order ||
  model<IOrder>(
    "Order",
    OrderSchema
  );

export default Order;