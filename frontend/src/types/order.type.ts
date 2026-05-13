export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  _id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  shop: { _id: string; name: string } | string;
  user: { _id: string; name: string; email: string } | string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  shopId: string;
  items: CreateOrderItemPayload[];
  shippingAddress: string;
  note?: string;
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  note?: string;
}
