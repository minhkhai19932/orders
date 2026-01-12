import { create } from "zustand";
import type { Product } from "../types/product";
import type {
  CreateProductPayload,
  UpdateProductPayload,
} from "../api/products";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/products";

interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

interface ProductsActions {
  fetchList: () => Promise<void>;
  createOne: (payload: CreateProductPayload) => Promise<void>;
  updateOne: (id: string, payload: UpdateProductPayload) => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
}

type ProductsStore = ProductsState & ProductsActions;

export const useProductsStore = create<ProductsStore>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchList: async () => {
    set({ loading: true, error: null });
    try {
      const products = await listProducts();
      set({ items: products, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
        loading: false,
      });
    }
  },

  createOne: async (payload: CreateProductPayload) => {
    set({ loading: true, error: null });
    try {
      const newProduct = await createProduct(payload);
      set((state) => ({
        items: [...state.items, newProduct],
        loading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create product",
        loading: false,
      });
      throw error;
    }
  },

  updateOne: async (id: string, payload: UpdateProductPayload) => {
    set({ loading: true, error: null });
    try {
      const updatedProduct = await updateProduct(id, payload);
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? updatedProduct : item
        ),
        loading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update product",
        loading: false,
      });
      throw error;
    }
  },

  deleteOne: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteProduct(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete product",
        loading: false,
      });
      throw error;
    }
  },
}));
