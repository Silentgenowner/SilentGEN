import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| LEDGER TYPES
|--------------------------------------------------------------------------
*/

export type LedgerType =
  | "customer"
  | "supplier"
  | "sales"
  | "purchase"
  | "expense"
  | "gst_input"
  | "gst_output"
  | "cash"
  | "bank"
  | "other";

/*
|--------------------------------------------------------------------------
| BALANCE TYPE
|--------------------------------------------------------------------------
*/

export type LedgerBalanceType =
  | "debit"
  | "credit";

/*
|--------------------------------------------------------------------------
| INTERFACE
|--------------------------------------------------------------------------
*/

export interface ILedger
  extends Document {
  name: string;

  ledgerType: LedgerType;

  phone?: string;

  email?: string;

  gstNumber?: string;

  address?: string;

  openingBalance: number;

  balanceType:
    LedgerBalanceType;

  currentBalance: number;

  isActive: boolean;

  isDeleted: boolean;

  deletedAt?:
    | Date
    | null;

  createdAt: Date;

  updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| SCHEMA
|--------------------------------------------------------------------------
*/

const LedgerSchema =
  new Schema<ILedger>(
    {
      /*
      |--------------------------------------------------------------------------
      | NAME
      |--------------------------------------------------------------------------
      */

      name: {
        type:
          String,

        required: [
          true,
          "Ledger name is required.",
        ],

        trim:
          true,

        maxlength:
          150,

        index:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | LEDGER TYPE
      |--------------------------------------------------------------------------
      */

      ledgerType: {
        type:
          String,

        required:
          true,

        enum: [
          "customer",
          "supplier",
          "sales",
          "purchase",
          "expense",
          "gst_input",
          "gst_output",
          "cash",
          "bank",
          "other",
        ],

        index:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | CONTACT
      |--------------------------------------------------------------------------
      */

      phone: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      email: {
        type:
          String,

        trim:
          true,

        lowercase:
          true,

        default:
          "",
      },

      /*
      |--------------------------------------------------------------------------
      | GST
      |--------------------------------------------------------------------------
      */

      gstNumber: {
        type:
          String,

        trim:
          true,

        uppercase:
          true,

        default:
          "",
      },

      /*
      |--------------------------------------------------------------------------
      | ADDRESS
      |--------------------------------------------------------------------------
      */

      address: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      /*
      |--------------------------------------------------------------------------
      | OPENING BALANCE
      |--------------------------------------------------------------------------
      */

      openingBalance: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      /*
      |--------------------------------------------------------------------------
      | BALANCE TYPE
      |--------------------------------------------------------------------------
      */

      balanceType: {
        type:
          String,

        enum: [
          "debit",
          "credit",
        ],

        default:
          "debit",
      },

      /*
      |--------------------------------------------------------------------------
      | CURRENT BALANCE
      |--------------------------------------------------------------------------
      */

      currentBalance: {
        type:
          Number,

        default:
          0,
      },

      /*
      |--------------------------------------------------------------------------
      | STATUS
      |--------------------------------------------------------------------------
      */

      isActive: {
        type:
          Boolean,

        default:
          true,

        index:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | SOFT DELETE
      |--------------------------------------------------------------------------
      */

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
| LEDGER TYPE + NAME
|--------------------------------------------------------------------------
|
| Customer / Supplier / Expense ledger lists.
|
|--------------------------------------------------------------------------
*/

LedgerSchema.index({
  ledgerType:
    1,

  name:
    1,
});

/*
|--------------------------------------------------------------------------
| ACTIVE + TYPE + NAME
|--------------------------------------------------------------------------
|
| Common dropdown/list query:
| active customer/supplier/cash/bank ledgers.
|
|--------------------------------------------------------------------------
*/

LedgerSchema.index({
  ledgerType:
    1,

  isActive:
    1,

  isDeleted:
    1,

  name:
    1,
});

/*
|--------------------------------------------------------------------------
| SOFT DELETE + ACTIVE
|--------------------------------------------------------------------------
*/

LedgerSchema.index({
  isDeleted:
    1,

  isActive:
    1,
});

/*
|--------------------------------------------------------------------------
| LEDGER TYPE + CURRENT BALANCE
|--------------------------------------------------------------------------
|
| Receivable / payable reports.
|
|--------------------------------------------------------------------------
*/

LedgerSchema.index({
  ledgerType:
    1,

  currentBalance:
    1,
});

/*
|--------------------------------------------------------------------------
| ACTIVE TYPE + CURRENT BALANCE
|--------------------------------------------------------------------------
|
| Useful for customer receivable and supplier payable reports.
|
|--------------------------------------------------------------------------
*/

LedgerSchema.index({
  ledgerType:
    1,

  isActive:
    1,

  isDeleted:
    1,

  currentBalance:
    1,
});

/*
|--------------------------------------------------------------------------
| GST NUMBER
|--------------------------------------------------------------------------
*/

LedgerSchema.index({
  gstNumber:
    1,
});

/*
|--------------------------------------------------------------------------
| PHONE
|--------------------------------------------------------------------------
*/

LedgerSchema.index({
  phone:
    1,
});

/*
|--------------------------------------------------------------------------
| EMAIL
|--------------------------------------------------------------------------
*/

LedgerSchema.index({
  email:
    1,
});

/*
|--------------------------------------------------------------------------
| CREATED AT
|--------------------------------------------------------------------------
*/

LedgerSchema.index({
  createdAt:
    -1,
});

/*
|--------------------------------------------------------------------------
| PRE SAVE
|--------------------------------------------------------------------------
|
| Opening balance rule:
|
| Debit  = positive balance
| Credit = negative balance
|
|--------------------------------------------------------------------------
*/

LedgerSchema.pre(
  "save",
  function () {
    if (
      this.isNew
    ) {
      const openingBalance =
        Number(
          this.openingBalance ||
            0
        );

      this.currentBalance =
        this.balanceType ===
        "credit"
          ? -Math.abs(
              openingBalance
            )
          : Math.abs(
              openingBalance
            );
    }

    if (
      !Number.isFinite(
        this.currentBalance
      )
    ) {
      this.currentBalance =
        0;
    }
  }
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const Ledger:
  Model<ILedger> =
  mongoose.models.Ledger ||
  mongoose.model<ILedger>(
    "Ledger",

    LedgerSchema
  );

export default Ledger;