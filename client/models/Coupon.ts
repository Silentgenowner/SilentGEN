import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export type CouponDiscountType =
  | "percentage"
  | "fixed";

export interface ICoupon
  extends Document {
  code: string;
  description: string;

  discountType:
    CouponDiscountType;

  discountValue: number;

  minimumOrderAmount: number;

  maximumDiscountAmount?: number;

  usageLimit?: number;

  usedCount: number;

  perUserLimit: number;

  startDate?: Date;

  expiryDate?: Date;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema =
  new Schema<ICoupon>(
    {
      code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
      },

      description: {
        type: String,
        trim: true,
        default: "",
      },

      discountType: {
        type: String,
        enum: [
          "percentage",
          "fixed",
        ],
        required: true,
        default:
          "percentage",
      },

      discountValue: {
        type: Number,
        required: true,
        min: 0,
      },

      minimumOrderAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      maximumDiscountAmount: {
        type: Number,
        default:
          undefined,
        min: 0,
      },

      usageLimit: {
        type: Number,
        default:
          undefined,
        min: 1,
      },

      usedCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      perUserLimit: {
        type: Number,
        default: 1,
        min: 1,
      },

      startDate: {
        type: Date,
        default:
          undefined,
      },

      expiryDate: {
        type: Date,
        default:
          undefined,
      },

      isActive: {
        type: Boolean,
        default: true,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

const Coupon =
  (mongoose.models
    .Coupon as
    | Model<ICoupon>
    | undefined) ||
  mongoose.model<ICoupon>(
    "Coupon",
    CouponSchema
  );

export default Coupon;