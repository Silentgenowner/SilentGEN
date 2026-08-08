export type CartTotals = {
  subtotal: number;
  shipping: number;
  grandTotal: number;
  totalItems: number;
};

export function calculateCartTotals(
  items: Array<{ price?: number; quantity?: number }>
): CartTotals {
  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;

    return sum + price * quantity;
  }, 0);

  const totalItems = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;

    return sum + quantity;
  }, 0);

  const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + shipping;

  return {
    subtotal,
    shipping,
    grandTotal,
    totalItems,
  };
}
