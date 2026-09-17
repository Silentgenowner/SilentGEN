import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| TRANSACTION TYPE
|--------------------------------------------------------------------------
*/

export type AccountTransactionType =
  | "sales"
  | "purchase"
  | "expense"
  | "payment"
  | "receipt"
  | "journal"
  | "opening"
  | "gst"
  | "adjustment";

/*
|--------------------------------------------------------------------------
| REFERENCE TYPE
|--------------------------------------------------------------------------
*/

export type AccountReferenceType =
  | "sales_invoice"
  | "purchase"
  | "expense"
  | "manual"
  | "opening"
  | "other";

/*
|--------------------------------------------------------------------------
| PAYMENT MODE
|--------------------------------------------------------------------------
*/

export type AccountPaymentMode =
  | "cash"
  | "bank"
  | "upi"
  | "card"
  | "cheque"
  | "credit"
  | "other";

/*
|--------------------------------------------------------------------------
| INTERFACE
|--------------------------------------------------------------------------
*/

export interface IAccountTransaction
  extends Document {
  transactionNumber: string;

  transactionDate: Date;

  transactionType:
    AccountTransactionType;

  ledgerId:
    Types.ObjectId;

  contraLedgerId?:
    Types.ObjectId | null;

  debit: number;

  credit: number;

  amount: number;

  paymentMode:
    AccountPaymentMode;

  referenceType:
    AccountReferenceType;

  referenceId?:
    Types.ObjectId | null;

  referenceNumber?: string;

  narration?: string;

  gstAmount: number;

  cgst: number;

  sgst: number;

  igst: number;

  isDeleted: boolean;

  deletedAt?:
    Date | null;

  createdAt: Date;

  updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| SCHEMA
|--------------------------------------------------------------------------
*/

const AccountTransactionSchema =
  new Schema<IAccountTransaction>(
    {
      transactionNumber: {
        type: String,

        required: true,

        unique: true,

        trim: true,

        index: true,
      },

      transactionDate: {
        type: Date,

        required: true,

        default:
          Date.now,

        index: true,
      },

      transactionType: {
        type: String,

        required: true,

        enum: [
          "sales",
          "purchase",
          "expense",
          "payment",
          "receipt",
          "journal",
          "opening",
          "gst",
          "adjustment",
        ],

        index: true,
      },

      ledgerId: {
        type:
          Schema.Types
            .ObjectId,

        ref:
          "Ledger",

        required: true,

        index: true,
      },

      contraLedgerId: {
        type:
          Schema.Types
            .ObjectId,

        ref:
          "Ledger",

        default: null,
      },

      debit: {
        type: Number,

        default: 0,

        min: 0,
      },

      credit: {
        type: Number,

        default: 0,

        min: 0,
      },

      amount: {
        type: Number,

        required: true,

        min: 0,
      },

      paymentMode: {
        type: String,

        enum: [
          "cash",
          "bank",
          "upi",
          "card",
          "cheque",
          "credit",
          "other",
        ],

        default:
          "cash",

        index: true,
      },

      referenceType: {
        type: String,

        enum: [
          "sales_invoice",
          "purchase",
          "expense",
          "manual",
          "opening",
          "other",
        ],

        default:
          "manual",

        index: true,
      },

      referenceId: {
        type:
          Schema.Types
            .ObjectId,

        default: null,

        index: true,
      },

      referenceNumber: {
        type: String,

        trim: true,

        default: "",
      },

      narration: {
        type: String,

        trim: true,

        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | GST
      |--------------------------------------------------------------------------
      */

      gstAmount: {
        type: Number,

        default: 0,

        min: 0,
      },

      cgst: {
        type: Number,

        default: 0,

        min: 0,
      },

      sgst: {
        type: Number,

        default: 0,

        min: 0,
      },

      igst: {
        type: Number,

        default: 0,

        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | SOFT DELETE
      |--------------------------------------------------------------------------
      */

      isDeleted: {
        type: Boolean,

        default: false,

        index: true,
      },

      deletedAt: {
        type: Date,

        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

AccountTransactionSchema.pre(
  "validate",
  function () {
    const debit =
      Number(
        this.debit ||
          0
      );

    const credit =
      Number(
        this.credit ||
          0
      );

    if (
      debit > 0 &&
      credit > 0
    ) {
      throw new Error(
        "A transaction entry cannot contain both debit and credit."
      );
    }

    if (
      debit <= 0 &&
      credit <= 0
    ) {
      throw new Error(
        "Transaction must contain either debit or credit."
      );
    }

    this.amount =
      Math.max(
        debit,
        credit
      );
  }
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

AccountTransactionSchema.index({
  ledgerId: 1,
  transactionDate: -1,
});

AccountTransactionSchema.index({
  referenceType: 1,
  referenceId: 1,
});

AccountTransactionSchema.index({
  transactionType: 1,
  transactionDate: -1,
});

AccountTransactionSchema.index({
  isDeleted: 1,
  transactionDate: -1,
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const AccountTransaction:
  Model<IAccountTransaction> =
  mongoose.models
    .AccountTransaction ||
  mongoose.model<IAccountTransaction>(
    "AccountTransaction",
    AccountTransactionSchema
  );

export default AccountTransaction;