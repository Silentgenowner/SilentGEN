import { Schema, model, models, Types } from "mongoose";

const comboOfferSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    products: {
      type: [{ type: Schema.Types.ObjectId, ref: "Product", required: true }],
      validate: {
        validator: (products: Types.ObjectId[]) =>
          Array.isArray(products) &&
          products.length === 2 &&
          new Set(products.map((product) => product.toString())).size === 2,
        message: "A combo must contain exactly two different products.",
      },
    },
    originalPrice: { type: Number, required: true, min: 0 },
    comboPrice: { type: Number, required: true, min: 0 },
    savings: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    offerText: { type: String, trim: true, maxlength: 240, default: "" },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

comboOfferSchema.index({ products: 1 });
comboOfferSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

export const ComboOffer = models.ComboOffer || model("ComboOffer", comboOfferSchema);
