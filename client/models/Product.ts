import { Schema, model, models } from "mongoose";

const ProductSchema = new Schema(
  {
    // ===========================
    // Basic Information
    // ===========================

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    // ===========================
    // Category
    // ===========================

    category: {
      type: String,
      required: true,
      trim: true,
    },

    subCategory: {
      type: String,
      default: "",
      trim: true,
    },

    brand: {
      type: String,
      default: "SilentGEN",
      trim: true,
    },

    // ===========================
    // Product Details
    // ===========================

    gender: {
      type: String,
      enum: ["Men", "Women", "Kids", "Unisex"],
      default: "Unisex",
    },

    fabric: {
      type: String,
      default: "",
    },

    fit: {
      type: String,
      default: "",
    },

    gsm: {
      type: Number,
      default: 0,
      min: 0,
    },

    weight: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===========================
    // Pricing
    // ===========================

    mrp: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ===========================
    // Inventory
    // ===========================

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    lowStockLimit: {
      type: Number,
      default: 5,
      min: 0,
    },

    sold: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===========================
    // Images
    // ===========================

    thumbnail: {
      type: String,
      default: "",
    },

    images: [
      {
        type: String,
      },
    ],

    // ===========================
    // Variants
    // ===========================

    sizes: [
      {
        type: String,
      },
    ],

    colors: [
      {
        type: String,
      },
    ],

    // ===========================
    // Search
    // ===========================

    tags: [
      {
        type: String,
      },
    ],

    // ===========================
    // Product Flags
    // ===========================

    featured: {
      type: Boolean,
      default: false,
    },

    bestSeller: {
      type: Boolean,
      default: false,
    },

    newArrival: {
      type: Boolean,
      default: false,
    },

    trending: {
      type: Boolean,
      default: false,
    },

    // ===========================
    // Product Status
    // ===========================

    status: {
      type: String,
      enum: [
        "Active",
        "Draft",
        "Out of Stock",
        "Archived",
      ],
      default: "Active",
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    // ===========================
    // Reviews
    // ===========================

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===========================
    // Soft Delete
    // ===========================

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // ===========================
    // SEO
    // ===========================

    seoTitle: {
      type: String,
      default: "",
      trim: true,
    },

    seoDescription: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({
  name: "text",
  sku: "text",
  category: "text",
  brand: "text",
  tags: "text",
});

const Product =
  models.Product || model("Product", ProductSchema);

export default Product;
