import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICartItem {
  productId: mongoose.Types.ObjectId;

  sku: string;

  name: string;

  brand: string;

  category: string;

  image: string;

  price: number;

  stock: number;

  status: string;

  quantity: number;

  size?: string;

  color?: string;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;

  items: ICartItem[];

  createdAt: Date;

  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sku: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      default: "Active",
      enum: [
        "Active",
        "Inactive",
        "Draft",
      ],
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    size: {
      type: String,
      default: "",
      trim: true,
    },

    color: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    items: {
      type: [CartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Cart: Model<ICart> =
  mongoose.models.Cart ||
  mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
