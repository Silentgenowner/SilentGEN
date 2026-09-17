/*
|--------------------------------------------------------------------------
| CART TOTALS TYPE
|--------------------------------------------------------------------------
*/

export type CartTotals = {
  subtotal: number;
  shipping: number;
  grandTotal: number;
  totalItems: number;
};

/*
|--------------------------------------------------------------------------
| CART ITEM TYPE
|--------------------------------------------------------------------------
*/

type CartTotalItem = {
  price?: unknown;
  quantity?: unknown;
};

/*
|--------------------------------------------------------------------------
| SHIPPING SETTINGS
|--------------------------------------------------------------------------
|
| Orders with subtotal >= ₹999 get free shipping.
| Orders below ₹999 have ₹99 shipping.
| Empty cart has ₹0 shipping.
|
|--------------------------------------------------------------------------
*/

const FREE_SHIPPING_THRESHOLD = 999;

const STANDARD_SHIPPING = 99;

/*
|--------------------------------------------------------------------------
| CALCULATE CART TOTALS
|--------------------------------------------------------------------------
*/

export function calculateCartTotals(
  items: CartTotalItem[] = []
): CartTotals {
  /*
  |--------------------------------------------------------------------------
  | SAFETY
  |--------------------------------------------------------------------------
  */

  if (!Array.isArray(items) || items.length === 0) {
    return {
      subtotal: 0,
      shipping: 0,
      grandTotal: 0,
      totalItems: 0,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SUBTOTAL + TOTAL ITEMS
  |--------------------------------------------------------------------------
  */

  let subtotal = 0;

  let totalItems = 0;

  for (const item of items) {
    /*
    |--------------------------------------------------------------------------
    | SAFE PRICE
    |--------------------------------------------------------------------------
    */

    const rawPrice = Number(item?.price);

    const price =
      Number.isFinite(rawPrice) &&
      rawPrice >= 0
        ? rawPrice
        : 0;

    /*
    |--------------------------------------------------------------------------
    | SAFE QUANTITY
    |--------------------------------------------------------------------------
    */

    const rawQuantity =
      Number(item?.quantity);

    const quantity =
      Number.isFinite(rawQuantity) &&
      Number.isInteger(rawQuantity) &&
      rawQuantity > 0
        ? rawQuantity
        : 0;

    /*
    |--------------------------------------------------------------------------
    | CALCULATE
    |--------------------------------------------------------------------------
    */

    subtotal +=
      price * quantity;

    totalItems += quantity;
  }

  /*
  |--------------------------------------------------------------------------
  | ROUND SUBTOTAL
  |--------------------------------------------------------------------------
  |
  | Prevents floating-point currency issues.
  |
  |--------------------------------------------------------------------------
  */

  subtotal =
    Math.round(
      (subtotal + Number.EPSILON) *
        100
    ) / 100;

  /*
  |--------------------------------------------------------------------------
  | SHIPPING
  |--------------------------------------------------------------------------
  */

  let shipping = 0;

  /*
  | Empty cart
  */

  if (
    subtotal === 0 ||
    totalItems === 0
  ) {
    shipping = 0;
  }

  /*
  | Free shipping
  */

  else if (
    subtotal >=
    FREE_SHIPPING_THRESHOLD
  ) {
    shipping = 0;
  }

  /*
  | Standard shipping
  */

  else {
    shipping =
      STANDARD_SHIPPING;
  }

  /*
  |--------------------------------------------------------------------------
  | GRAND TOTAL
  |--------------------------------------------------------------------------
  */

  const grandTotal =
    Math.round(
      (subtotal + shipping + Number.EPSILON) *
        100
    ) / 100;

  /*
  |--------------------------------------------------------------------------
  | FINAL RESULT
  |--------------------------------------------------------------------------
  */

  return {
    subtotal,
    shipping,
    grandTotal,
    totalItems,
  };
}