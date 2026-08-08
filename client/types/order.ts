export type OrderStatus =
  | "Placed"
  | "Confirmed"
  | "Packed"
  | "Shipped"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded";

export interface OrderUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
}

export interface OrderProduct {
  _id: string;
  name: string;
}

export interface OrderItem {
  product?: OrderProduct;

  name: string;

  image: string;

  quantity: number;

  price: number;

  size?: string;

  color?: string;
}

export interface ShippingAddress {
  fullName: string;

  mobile: string;

  address: string;

  area: string;

  city: string;

  state: string;

  country: string;

  pincode: string;

  landmark?: string;
}

export interface DeliveryHistory {
  status: string;

  date: string;

  note?: string;
}

export interface ReturnRequest {
  reason: string;

  status: string;

  requestedAt: string;
}

export interface ExchangeRequest {
  reason: string;

  status: string;

  requestedAt: string;
}

export interface Order {
  _id: string;

  user: OrderUser;

  items: OrderItem[];

  shippingAddress: ShippingAddress;

  paymentMethod: string;

  paymentStatus: PaymentStatus;

  orderStatus: OrderStatus;

  subtotal: number;

  shippingCharge: number;

  discount: number;

  totalAmount: number;

  trackingNumber?: string;

  courierPartner?: string;

  createdAt: string;

  deliveryHistory: DeliveryHistory[];

  returnRequest?: ReturnRequest;

  exchangeRequest?: ExchangeRequest;
}
