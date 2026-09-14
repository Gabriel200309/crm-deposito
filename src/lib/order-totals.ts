export type OrderItemLike = {
  quantity: number | string;
  unitPrice: number | string;
  discount?: number | string | null;
};

export function calculateItemSubtotal(item: OrderItemLike) {
  const qty = Number(item.quantity);
  const price = Number(item.unitPrice);
  const discount = Number(item.discount ?? 0);
  return qty * price - discount;
}

export function calculateOrderSubtotal(items: OrderItemLike[]) {
  return items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
}

export function calculateOrderTotal(
  items: OrderItemLike[],
  discount: number | string,
  freight: number | string,
) {
  return calculateOrderSubtotal(items) - Number(discount) + Number(freight);
}
