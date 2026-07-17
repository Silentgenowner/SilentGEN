import { Schema, model, models } from "mongoose";

const CartItemSchema = new Schema({
  productId: {
    type: Number,
    required: true,
  },

  name: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  quantity: {
    type: Number,
    default: 1,
  },
});

const CartSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },

    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

export default models.Cart || model("Cart", CartSchema);
