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

export type PurchasePaymentStatus =
  | "unpaid"
  | "partial"
  | "paid";

/*
|--------------------------------------------------------------------------
| PURCHASE STATUS
|--------------------------------------------------------------------------
*/

export type PurchaseStatus =
  | "draft"
  | "issued"
  | "cancelled";

/*
|--------------------------------------------------------------------------
| GST TYPE
|--------------------------------------------------------------------------
*/

export type PurchaseGstType =
  | "intra_state"
  | "inter_state"
  | "none";

/*
|--------------------------------------------------------------------------
| PURCHASE ITEM
|--------------------------------------------------------------------------
*/

export type PurchaseItem = {
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
| PURCHASE BILL INTERFACE
|--------------------------------------------------------------------------
*/

export interface IPurchaseBill
  extends Document {
  purchaseNumber:
    string;

  supplierInvoiceNumber:
    string;

  purchaseDate:
    Date;

  dueDate?:
    | Date
    | null;

  supplierLedgerId:
    Types.ObjectId;

  supplierName:
    string;

  supplierPhone:
    string;

  supplierEmail:
    string;

  supplierGstNumber:
    string;

  billingAddress:
    string;

  placeOfSupply:
    string;

  gstType:
    PurchaseGstType;

  items:
    PurchaseItem[];

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
    PurchasePaymentStatus;

  status:
    PurchaseStatus;

  notes:
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
| PURCHASE ITEM SCHEMA
|--------------------------------------------------------------------------
*/

const PurchaseItemSchema =
  new Schema<PurchaseItem>(
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
| PURCHASE BILL SCHEMA
|--------------------------------------------------------------------------
*/

const PurchaseBillSchema =
  new Schema<IPurchaseBill>(
    {
      purchaseNumber: {
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

      supplierInvoiceNumber: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      purchaseDate: {
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

      supplierLedgerId: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Ledger",

        required:
          true,

        index:
          true,
      },

      supplierName: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      supplierPhone: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      supplierEmail: {
        type:
          String,

        trim:
          true,

        lowercase:
          true,

        default:
          "",
      },

      supplierGstNumber: {
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
          PurchaseItemSchema,
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
| SUPPLIER + DATE
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  supplierLedgerId:
    1,

  purchaseDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| STATUS + PAYMENT STATUS + DATE
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  status:
    1,

  paymentStatus:
    1,

  purchaseDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| ACTIVE / DELETED + DATE
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  isDeleted:
    1,

  purchaseDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| STATUS + DATE
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  status:
    1,

  purchaseDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| PAYMENT STATUS + DATE
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  paymentStatus:
    1,

  purchaseDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| ACCOUNTING POSTED + DATE
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  accountingPosted:
    1,

  purchaseDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| SUPPLIER GSTIN + DATE
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  supplierGstNumber:
    1,

  purchaseDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| GST TYPE + DATE
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  gstType:
    1,

  purchaseDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| SUPPLIER INVOICE NUMBER
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  supplierInvoiceNumber:
    1,
});

/*
|--------------------------------------------------------------------------
| HSN CODE
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  "items.hsnCode":
    1,
});

/*
|--------------------------------------------------------------------------
| PRODUCT + DATE
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  "items.productId":
    1,

  purchaseDate:
    -1,
});

/*
|--------------------------------------------------------------------------
| CREATED AT
|--------------------------------------------------------------------------
*/

PurchaseBillSchema.index({
  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const PurchaseBill:
  Model<IPurchaseBill> =
  mongoose.models
    .PurchaseBill ||
  mongoose.model<IPurchaseBill>(
    "PurchaseBill",

    PurchaseBillSchema
  );

export default PurchaseBill;