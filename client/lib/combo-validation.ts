import { isValidObjectId } from "mongoose";
import { ComboOffer } from "@/models/ComboOffer";
import Product from "@/models/Product";

type ComboPayload = {
  name?: unknown;
  productIds?: unknown;
  comboPrice?: unknown;
  offerText?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  isActive?: unknown;
};

function asOptionalDate(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error(`${field} must be a valid date.`);
  return date;
}

export async function buildComboData(payload: ComboPayload, excludeComboId?: string) {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const productIds = Array.isArray(payload.productIds) ? payload.productIds.map(String) : [];
  const comboPrice = Number(payload.comboPrice);
  const offerText = typeof payload.offerText === "string" ? payload.offerText.trim() : "";
  const startsAt = asOptionalDate(payload.startsAt, "Start date");
  const endsAt = asOptionalDate(payload.endsAt, "End date");
  const isActive = typeof payload.isActive === "boolean" ? payload.isActive : true;

  if (!name) throw new Error("Combo name is required.");
  if (productIds.length !== 2 || new Set(productIds).size !== 2 || !productIds.every(isValidObjectId)) {
    throw new Error("Select exactly two different products.");
  }
  if (!Number.isFinite(comboPrice) || comboPrice < 0) throw new Error("Combo price must be a valid non-negative number.");
  if (startsAt && endsAt && startsAt > endsAt) throw new Error("End date must be after the start date.");

  const products = await Product.find({ _id: { $in: productIds } }).select("price status").lean();
  if (products.length !== 2) throw new Error("One or both selected products no longer exist.");
  if (products.some((product: { status?: string }) => product.status === "Archived")) {
    throw new Error("Archived products cannot be added to a combo.");
  }

  const originalPrice = products.reduce((total: number, product: { price?: number }) => total + Number(product.price || 0), 0);
  if (comboPrice > originalPrice) throw new Error("Combo price cannot be greater than the two products' selling price.");

  const duplicateQuery = { products: { $all: productIds, $size: 2 } } as Record<string, unknown>;
  if (excludeComboId) duplicateQuery._id = { $ne: excludeComboId };
  if (await ComboOffer.exists(duplicateQuery)) throw new Error("A combo for these two products already exists.");

  const savings = Number((originalPrice - comboPrice).toFixed(2));
  const discountPercent = originalPrice === 0 ? 0 : Number(((savings / originalPrice) * 100).toFixed(2));
  return { name, products: productIds, originalPrice, comboPrice, savings, discountPercent, offerText, startsAt, endsAt, isActive };
}
