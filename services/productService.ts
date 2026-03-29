import API from "./api";

export type Product = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  location: string;
  farmer?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type NewProduct = Omit<Product, "_id" | "createdAt" | "updatedAt">;

export async function getProducts(): Promise<Product[]> {
  const res = await API.get<Product[]>("/api/products");
  return res.data;
}

export async function createProduct(data: NewProduct): Promise<Product> {
  const res = await API.post<Product>("/api/products", data);
  return res.data;
}
