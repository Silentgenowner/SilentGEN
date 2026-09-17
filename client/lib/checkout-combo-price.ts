import { ComboOffer } from "@/models/ComboOffer";

type CartLine = {
  productId: unknown;
  quantity: unknown;
  comboId?: unknown;
};

type ProductRecord = {
  _id: unknown;
  price: unknown;
};

type ComboRecord = {
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  products: unknown[];
  comboPrice: number;
};

export async function getCheckoutLinePrice(
  item: CartLine,
  cartItems: CartLine[],
  product: ProductRecord
) {
  const standardPrice =
    Number(product.price) || 0;

  const comboId =
    typeof item.comboId === "string"
      ? item.comboId
      : "";

  if (!comboId) {
    return standardPrice;
  }

  const combo =
    (await ComboOffer.findById(comboId)
      .lean()) as ComboRecord | null;

  const now = new Date();

  if (
    !combo ||
    !combo.isActive ||
    (combo.startsAt &&
      combo.startsAt > now) ||
    (combo.endsAt &&
      combo.endsAt < now)
  ) {
    throw new Error(
      "A combo offer in your cart has expired. Please refresh your cart."
    );
  }

  const comboProductIds: string[] =
    combo.products.map(
      (id: unknown) => String(id)
    );

  const comboLines =
    cartItems.filter(
      (line) =>
        String(line.comboId || "") ===
        comboId
    );

  const allComboProductsExist =
    comboLines.every((line) =>
      comboProductIds.includes(
        String(line.productId)
      )
    );

  const uniqueProductCount =
    new Set(
      comboLines.map((line) =>
        String(line.productId)
      )
    ).size;

  if (
    comboProductIds.length !== 2 ||
    comboLines.length !== 2 ||
    !allComboProductsExist ||
    uniqueProductCount !== 2
  ) {
    throw new Error(
      "Invalid combo items in cart. Please remove and add the combo again."
    );
  }

  const firstQuantity =
    Number(comboLines[0].quantity);

  const secondQuantity =
    Number(comboLines[1].quantity);

  if (
    !Number.isInteger(firstQuantity) ||
    firstQuantity < 1 ||
    firstQuantity !== secondQuantity ||
    !comboProductIds.includes(
      String(product._id)
    )
  ) {
    throw new Error(
      "Both products in a combo must have the same quantity."
    );
  }

  const ProductModel =
    (await import("@/models/Product"))
      .default;

  const products =
    (await ProductModel.find({
      _id: {
        $in: combo.products,
      },
    })
      .select("_id price")
      .lean()) as ProductRecord[];

  if (products.length !== 2) {
    throw new Error(
      "A product in this combo is no longer available."
    );
  }

  const orderedProducts =
    comboProductIds.map((id: string) => {
      const comboProduct =
        products.find(
          (candidate: ProductRecord) =>
            String(candidate._id) === id
        );

      if (!comboProduct) {
        throw new Error(
          "A product in this combo is no longer available."
        );
      }

      return comboProduct;
    });

  const originalPrice =
    orderedProducts.reduce(
      (
        total: number,
        comboProduct: ProductRecord
      ) =>
        total +
        (Number(comboProduct.price) || 0),
      0
    );

  const comboPrice =
    Number(combo.comboPrice);

  if (
    originalPrice <= 0 ||
    !Number.isFinite(comboPrice) ||
    comboPrice < 0 ||
    comboPrice > originalPrice
  ) {
    throw new Error(
      "This combo's price is no longer valid."
    );
  }

  const comboPaise = Math.round(
    comboPrice * 100
  );

  const firstLinePaise = Math.round(
    ((Number(orderedProducts[0].price) || 0) /
      originalPrice) *
      comboPaise
  );

  const firstProductId =
    comboProductIds[0];

  return String(product._id) ===
    firstProductId
    ? firstLinePaise / 100
    : (comboPaise - firstLinePaise) / 100;
}