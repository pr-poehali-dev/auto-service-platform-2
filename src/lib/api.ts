import func2url from "../../backend/func2url.json";

const URLS = func2url as Record<string, string>;

async function request<T>(fn: string, method = "GET", body?: unknown, params?: Record<string, string>): Promise<T> {
  let url = URLS[fn];
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url = `${url}?${qs}`;
  }
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return JSON.parse(text) as T;
}

export interface Car {
  id: number;
  vin: string;
  brand: string;
  model: string;
  year: number;
  client_name: string;
  client_phone?: string;
  color: string;
  notes?: string;
  created_at?: string;
}

export interface Article {
  id: number;
  article: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  status: "in_stock" | "out_of_stock" | "low_stock";
  notes?: string;
  shop_url?: string;
}

export interface Order {
  id: number;
  order_number: string;
  client_name: string;
  car_id?: number;
  car_label?: string;
  amount: number;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: number;
  article_id: number;
  qty: number;
  article: string;
  name: string;
  brand: string;
  price: number;
}

export interface VinInfo {
  vin: string;
  make?: string;
  make_display?: string;
  model?: string;
  year?: string;
  series?: string;
  vehicle_type?: string;
  cylinders?: string;
  displacement?: string;
  fuel_type?: string;
  drive_type?: string;
  transmission?: string;
  body_class?: string;
  manufacturer?: string;
  plant_country?: string;
  error_code?: string;
  error_text?: string;
  valid: boolean;
  autodoc_url: string;
}

export const api = {
  cars: {
    list: () => request<{ cars: Car[] }>("cars"),
    add: (data: Omit<Car, "id" | "created_at">) => request<{ id: number; ok: boolean }>("cars", "POST", data),
    decodeVin: (vin: string) => request<VinInfo>("cars", "GET", undefined, { action: "decode", vin }),
  },
  articles: {
    list: (q?: string) => request<{ articles: Article[] }>("articles", "GET", undefined, q ? { q } : undefined),
    add: (data: Omit<Article, "id" | "status">) => request<{ id: number; ok: boolean }>("articles", "POST", data),
    update: (data: Partial<Article> & { id: number }) => request<{ ok: boolean }>("articles", "PUT", data),
  },
  orders: {
    list: () => request<{ orders: Order[] }>("orders"),
    add: (data: Omit<Order, "id" | "order_number" | "created_at" | "updated_at">) =>
      request<{ id: number; order_number: string; ok: boolean }>("orders", "POST", data),
    update: (data: Partial<Order> & { id: number }) => request<{ ok: boolean }>("orders", "PUT", data),
  },
  cart: {
    list: () => request<{ items: CartItem[]; total: number }>("cart"),
    add: (article_id: number) => request<{ ok: boolean }>("cart", "POST", { article_id }),
    update: (id: number, qty: number) => request<{ ok: boolean }>("cart", "PUT", { id, qty }),
    remove: (id: number) => request<{ ok: boolean }>("cart", "DELETE", undefined, { id: String(id) }),
  },
};