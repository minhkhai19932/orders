export interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus =
  | "CANCELLED"
  | "DELIVERED"
  | "PENDING"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "RETURNED";

export type PaymentStatus = "PREPAID" | "PAID" | "UNPAID";

export interface Customer {
  customerId: string;
  name: string;
  phone: string;
  email: string;
}

export interface Pricing {
  subTotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  currency: string;
}

export interface Address {
  receiverName: string;
  receiverPhone: string;
  fullAddress: string;
}
export interface Shipper {
  shipperId: string;
  name: string;
  phone: string;
  vehicleType: string;
}

export interface Shipping {
  shippingOrderCode: string;
  status: string;
  address: Address;
  shipper: Shipper;
  estimatedDeliveryTime: string;
  deliveredAt: string;
  failedReason: string;
}

export interface Order {
  id: string;
  orderCode: string;
  customer: Customer;
  items: OrderItem[];
  pricing: Pricing;
  shipping: Shipping;
  orderStatus: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}
