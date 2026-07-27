export interface ProductExcelRow {
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  price: number;
  salePrice?: number;
  stock: number;
  images?: string;
  colors?: string;
  sizes?: string;
  featured?: boolean | string | number;
  active?: boolean | string | number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateProductRow(
  row: ProductExcelRow,
  rowNumber: number
): ValidationResult {
  const errors: string[] = [];

  const sku = String(row.sku ?? "").trim();
  const name = String(row.name ?? "").trim();
  const category = String(row.category ?? "").trim();

  const price = Number(row.price);
  const salePrice = Number(row.salePrice ?? 0);
  const stock = Number(row.stock);

  // SKU
  if (!sku) {
    errors.push(`Row ${rowNumber}: SKU is required.`);
  } else if (sku.length > 100) {
    errors.push(`Row ${rowNumber}: SKU is too long.`);
  }

  // Name
  if (!name) {
    errors.push(`Row ${rowNumber}: Product name is required.`);
  } else if (name.length > 200) {
    errors.push(`Row ${rowNumber}: Product name is too long.`);
  }

  // Category
  if (!category) {
    errors.push(`Row ${rowNumber}: Category is required.`);
  }

  // Price
  if (Number.isNaN(price)) {
    errors.push(`Row ${rowNumber}: Price must be numeric.`);
  } else if (price < 0) {
    errors.push(`Row ${rowNumber}: Price cannot be negative.`);
  }

  // Sale Price
  if (Number.isNaN(salePrice)) {
    errors.push(`Row ${rowNumber}: Sale Price must be numeric.`);
  } else if (salePrice < 0) {
    errors.push(`Row ${rowNumber}: Sale Price cannot be negative.`);
  } else if (salePrice > price && price > 0) {
    errors.push(
      `Row ${rowNumber}: Sale Price cannot be greater than Price.`
    );
  }

  // Stock
  if (Number.isNaN(stock)) {
    errors.push(`Row ${rowNumber}: Stock must be numeric.`);
  } else if (stock < 0) {
    errors.push(`Row ${rowNumber}: Stock cannot be negative.`);
  }

  // Images
  if (row.images) {
    const images = String(row.images)
      .split(",")
      .map((img) => img.trim())
      .filter(Boolean);

    for (const image of images) {
      if (
        !image.startsWith("http://") &&
        !image.startsWith("https://")
      ) {
        errors.push(
          `Row ${rowNumber}: Invalid image URL (${image}).`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function normalizeBoolean(
  value: unknown,
  defaultValue = false
): boolean {
  if (typeof value === "boolean") return value;

  const str = String(value ?? "")
    .trim()
    .toLowerCase();

  if (["true", "1", "yes", "y"].includes(str)) return true;
  if (["false", "0", "no", "n"].includes(str)) return false;

  return defaultValue;
}

export function splitCommaValues(value: unknown): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
