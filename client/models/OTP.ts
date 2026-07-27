import { Schema, model, models } from "mongoose";

const OTPSchema = new Schema(
  {
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    otp: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: {
        expires: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

const OTP =
  models.OTP || model("OTP", OTPSchema);

export default OTP;
