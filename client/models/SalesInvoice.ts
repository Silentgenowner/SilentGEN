import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| PAYMENT STATUS
|--------------------------------------------------------------------------
*/

export type SalesInvoicePaymentStatus =
  | "unpaid"
  | "partial"
  | "paid";

/*
|--------------------------------------------------------------------------
| INVOICE STATUS
|--------------------------------------------------------------------------
*/

export type SalesInvoiceStatus =
  | "draft"
  | "issued"
  | "cancelled";

/*
|--------------------------------------------------------------------------
| GST TYPE
|--------------------------------------------------------------------------
*/

export type SalesInvoiceGstType =
  | "intra_state"
  | "inter_state"
  | "none";

/*
|--------------------------------------------------------------------------
| ITEM
|--------------------------------------------------------------------------
*/

export type SalesInvoiceItem = {
  productId?:
    | Types.ObjectId
    | null;

  name:
    string;

  sku:
    string;

  hsnCode:
    string;

  quantity:
    number;

  rate:
    number;

  discountPercent:
    number;

  discountAmount:
    number;

  taxableAmount:
    number;

  gstRate:
    number;

  cgst:
    number;

  sgst:
    number;

  igst:
    number;

  total:
    number;
};

/*
|--------------------------------------------------------------------------
| INTERFACE
|--------------------------------------------------------------------------
*/

export interface ISalesInvoice
  extends Document {
  invoiceNumber:
    string;

  invoiceDate:
    Date;

  dueDate?:
    | Date
    | null;

  customerLedgerId:
    Types.ObjectId;

  customerName:
    string;

  customerPhone:
    string;

  customerEmail:
    string;

  customerGstNumber:
    string;

  billingAddress:
    string;

  placeOfSupply:
    string;

  gstType:
    SalesInvoiceGstType;

  items:
    SalesInvoiceItem[];

  subtotal:
    number;

  itemDiscount:
    number;

  additionalDiscount:
    number;

  taxableAmount:
    number;

  cgst:
    number;

  sgst:
    number;

  igst:
    number;

  totalGst:
    number;

  roundOff:
    number;

  grandTotal:
    number;

  paidAmount:
    number;

  dueAmount:
    number;

  paymentStatus:
    SalesInvoicePaymentStatus;

  status:
    SalesInvoiceStatus;

  notes:
    string;

  terms:
    string;

  accountingPosted:
    boolean;

  accountingTransactionIds:
    Types.ObjectId[];

  createdBy?:
    | Types.ObjectId
    | null;

  isDeleted:
    boolean;

  deletedAt?:
    | Date
    | null;

  createdAt:
    Date;

  updatedAt:
    Date;
}

/*
|--------------------------------------------------------------------------
| ITEM SCHEMA
|--------------------------------------------------------------------------
*/

const SalesInvoiceItemSchema =
  new Schema<SalesInvoiceItem>(
    {
      productId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Product",

        default:
          null,
      },

      name: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      sku: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      hsnCode: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      quantity: {
        type:
          Number,

        required:
          true,

        min:
          0.001,
      },

      rate: {
        type:
          Number,

        required:
          true,

        min:
          0,
      },

      discountPercent: {
        type:
          Number,

        default:
          0,

        min:
          0,

        max:
          100,
      },

      discountAmount: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      taxableAmount: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      gstRate: {
        type:
          Number,

        default:
          0,

        min:
          0,

        max:
          100,
      },

      cgst: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      sgst: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      igst: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      total: {
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
        true,
    }
  );

/*
|--------------------------------------------------------------------------
| INVOICE SCHEMA
|--------------------------------------------------------------------------
*/

const SalesInvoiceSchema =
  new Schema<ISalesInvoice>(
    {
      invoiceNumber: {
        type:
          String,

        required:
          true,

        unique:
          true,

        trim:
          true,

        index:
          true,
      },

      invoiceDate: {
        type:
          Date,

        required:
          true,

        default:
          Date.now,

        index:
          true,
      },

      dueDate: {
        type:
          Date,

        default:
          null,
      },

      customerLedgerId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Ledger",

        required:
          true,

        index:
          true,
      },

      customerName: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      customerPhone: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      customerEmail: {
        type:
          String,

        trim:
          true,

        lowercase:
          true,

        default:
          "",
      },

      customerGstNumber: {
        type:
          String,

        trim:
          true,

        uppercase:
          true,

        default:
          "",
      },

      billingAddress: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      placeOfSupply: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      gstType: {
        type:
          String,

        enum: [
          "intra_state",
          "inter_state",
          "none",
        ],

        default:
          "intra_state",
      },

      items: {
        type: [
          SalesInvoiceItemSchema,
        ],

        default:
          [],
      },

      subtotal: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      itemDiscount: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      additionalDiscount: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      taxableAmount: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      cgst: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      sgst: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      igst: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      totalGst: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      roundOff: {
        type:
          Number,

        default:
          0,
      },

      grandTotal: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      paidAmount: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      dueAmount: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      paymentStatus: {
        type:
          String,

        enum: [
          "unpaid",
          "partial",
          "paid",
        ],

        default:
          "unpaid",

        index:
          true,
      },

      status: {
        type:
          String,

        enum: [
          "draft",
          "issued",
          "cancelled",
        ],

        default:
          "issued",

        index:
          true,
      },

      notes: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      terms: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      accountingPosted: {
        type:
          Boolean,

        default:
          false,

        index:
          true,
      },

      accountingTransactionIds: [
        {
          type:
            Schema.Types.ObjectId,

          ref:
            "AccountTransaction",
        },
      ],

      createdBy: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Admin",

        default:
          null,
      },

      isDeleted: {
        type:
          Boolean,

        default:
          false,

        index:
          true,
      },

      deletedAt: {
        type:
          Date,

        default:
          null,
      },
    },
    {
      timestamps:
        true,
    }
  );

/*
|--------------------------------------------------------------------------
| DATABASE INDEXES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CUSTOMER + INVOICE DATE
|--------------------------------------------------------------------------
*/

SalesInvoiceSchema.index({
  customerLedgerId:
    1,

  invoiceDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| STATUS + PAYMENT STATUS + DATE
|--------------------------------------------------------------------------
*/

SalesInvoiceSchema.index({
  status:
    1,

  paymentStatus:
    1,

  invoiceDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| ACTIVE / DELETED + DATE
|--------------------------------------------------------------------------
*/

SalesInvoiceSchema.index({
  isDeleted:
    1,

  invoiceDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| STATUS + DATE
|--------------------------------------------------------------------------
*/

SalesInvoiceSchema.index({
  status:
    1,

  invoiceDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| PAYMENT STATUS + DATE
|--------------------------------------------------------------------------
*/

SalesInvoiceSchema.index({
  paymentStatus:
    1,

  invoiceDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| ACCOUNTING POSTED + DATE
|--------------------------------------------------------------------------
*/

SalesInvoiceSchema.index({
  accountingPosted:
    1,

  invoiceDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| CUSTOMER GSTIN + DATE
|--------------------------------------------------------------------------
|
| Useful for GSTIN-wise CA reports and B2B reports.
|
|--------------------------------------------------------------------------
*/

SalesInvoiceSchema.index({
  customerGstNumber:
    1,

  invoiceDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| GST TYPE + DATE
|--------------------------------------------------------------------------
|
| Useful for intra-state / inter-state GST reports.
|
|--------------------------------------------------------------------------
*/

SalesInvoiceSchema.index({
  gstType:
    1,

  invoiceDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| HSN CODE
|--------------------------------------------------------------------------
|
| Useful for HSN-wise GST summary.
|
|--------------------------------------------------------------------------
*/

SalesInvoiceSchema.index({
  "items.hsnCode":
    1,
});

/*
|--------------------------------------------------------------------------
| PRODUCT + DATE
|--------------------------------------------------------------------------
|
| Useful for product-wise sales history.
|
|--------------------------------------------------------------------------
*/

SalesInvoiceSchema.index({
  "items.productId":
    1,

  invoiceDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| CREATED AT
|--------------------------------------------------------------------------
*/

SalesInvoiceSchema.index({
  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const SalesInvoice:
  Model<ISalesInvoice> =
  mongoose.models
    .SalesInvoice ||
  mongoose.model<ISalesInvoice>(
    "SalesInvoice",

    SalesInvoiceSchema
  );

export default SalesInvoice;