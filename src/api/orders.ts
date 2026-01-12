import { request } from "./backendSite/http";
import type { Order, OrderItem, OrderStatus } from "../types/order";

export interface CreateOrderPayload {
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface UpdateOrderPayload {
  customerName?: string;
  customerEmail?: string;
  items?: OrderItem[];
  total?: number;
  status?: OrderStatus;
  orderCode: string;
}

export type PatchOrderStatusPayload = {
  orderStatus: "cancelled";
};

export async function listOrders(): Promise<Order[]> {
  return request<Order[]>("/orders", {
    method: "GET",
  });
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateOrder(payload: UpdateOrderPayload): Promise<Order> {
  console.log("payload", payload);
  return request<Order>(`/orders/${payload.orderCode}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteOrder(orderCode: string): Promise<void> {
  await request<void>(`/orders/by-code/${orderCode}`, {
    method: "DELETE",
  });
}

export async function patchOrderStatus(
  orderCode: string,
  payload: PatchOrderStatusPayload
): Promise<Order> {
  return request<Order>(`/orders/by-code/${orderCode}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
