import { Schema, model, models } from "mongoose";

const AddressSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
    },

    pincode: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    area: {
      type: String,
      required: true,
    },

    house: {
      type: String,
      required: true,
    },

    landmark: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Address =
  models.Address || model("Address", AddressSchema);

export default Address;
