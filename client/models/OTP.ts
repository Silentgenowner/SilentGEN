import mongoose, { Schema, models, model } from "mongoose";

const OTPSchema = new Schema(
  {
    mobile: {
      type: String,
      required: true,
    },

    otp: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

OTPSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

const OTP = models.OTP || model("OTP", OTPSchema);

export default OTP;
