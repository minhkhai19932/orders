export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
}
