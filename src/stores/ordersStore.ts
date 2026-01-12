import { create } from "zustand";
import type { Order } from "../types/order";
import type {
  CreateOrderPayload,
  UpdateOrderPayload,
  PatchOrderStatusPayload,
} from "../api/orders";
import {
  listOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  patchOrderStatus,
} from "../api/orders";

interface OrdersState {
  items: Order[];
  loading: boolean;
  error: string | null;
}

interface OrdersActions {
  fetchList: () => Promise<void>;
  createOne: (payload: CreateOrderPayload) => Promise<void>;
  updateOne: (id: string, payload: UpdateOrderPayload) => Promise<void>;
  deleteOne: (orderCode: string) => Promise<void>;
  cancelOrder: (orderCode: string) => Promise<void>;
}

type OrdersStore = OrdersState & OrdersActions;

export const useOrdersStore = create<OrdersStore>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchList: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await listOrders();
      set({ items: orders, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch orders",
        loading: false,
      });
    }
  },

  createOne: async (payload: CreateOrderPayload) => {
    set({ loading: true, error: null });
    try {
      await createOrder(payload);
      const orders = await listOrders();
      set({ items: orders, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create order",
        loading: false,
      });
      throw error;
    }
  },

  updateOne: async (id: string, payload: UpdateOrderPayload) => {
    set({ loading: true, error: null });
    try {
      const updatedOrder = await updateOrder(id, payload);
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? updatedOrder : item
        ),
        loading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update order",
        loading: false,
      });
      throw error;
    }
  },

  deleteOne: async (orderCode: string) => {
    set({ loading: true, error: null });
    try {
      await deleteOrder(orderCode);
      const orders = await listOrders();
      set({ items: orders, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete order",
        loading: false,
      });
      throw error;
    }
  },

  cancelOrder: async (orderCode: string) => {
    set({ loading: true, error: null });
    try {
      const payload: PatchOrderStatusPayload = { orderStatus: "cancelled" };
      await patchOrderStatus(orderCode, payload);
      const orders = await listOrders();
      set({ items: orders, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to cancel order",
        loading: false,
      });
      throw error;
    }
  },
}));
