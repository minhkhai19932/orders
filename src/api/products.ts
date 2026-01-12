import { request } from "./backendSite/http";
import type { Product } from "../types/product";

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  stock: number;
  status?: "ACTIVE" | "INACTIVE";
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: "ACTIVE" | "INACTIVE";
}

export async function listProducts(): Promise<Product[]> {
  return request<Product[]>("/products", {
    method: "GET",
  });
}

export async function createProduct(
  payload: CreateProductPayload
): Promise<Product> {
  return request<Product>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload
): Promise<Product> {
  return request<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await request<void>(`/products/${id}`, {
    method: "DELETE",
  });
}
