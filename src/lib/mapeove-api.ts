import { ApiResponse, Business, Category } from "@/types/mapeove";

const API_BASE = "/api";

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  const json: ApiResponse<Category[]> = await res.json();
  if (!json.success) throw new Error(json.error || "Error al cargar categorias");
  return json.data;
}

export async function fetchBusinesses(params?: {
  category?: string;
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
}): Promise<{ businesses: Business[]; pagination?: ApiResponse<Business[]>["pagination"] }> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.q) searchParams.set("q", params.q);
  if (params?.lat !== undefined) searchParams.set("lat", String(params.lat));
  if (params?.lng !== undefined) searchParams.set("lng", String(params.lng));
  if (params?.radius) searchParams.set("radius", String(params.radius));
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(`${API_BASE}/businesses?${searchParams.toString()}`);
  const json: ApiResponse<Business[]> = await res.json();
  if (!json.success) throw new Error(json.error || "Error al cargar negocios");
  return { businesses: json.data, pagination: json.pagination };
}

export async function fetchBusinessById(id: string, lat?: number, lng?: number): Promise<Business> {
  const params = new URLSearchParams();
  if (lat !== undefined) params.set("lat", String(lat));
  if (lng !== undefined) params.set("lng", String(lng));

  const res = await fetch(`${API_BASE}/businesses/${id}?${params.toString()}`);
  const json: ApiResponse<Business> = await res.json();
  if (!json.success) throw new Error(json.error || "Error al cargar negocio");
  return json.data;
}

export async function searchBusinesses(q: string, lat?: number, lng?: number): Promise<Business[]> {
  const params = new URLSearchParams({ q });
  if (lat !== undefined) params.set("lat", String(lat));
  if (lng !== undefined) params.set("lng", String(lng));

  const res = await fetch(`${API_BASE}/businesses/search?${params.toString()}`);
  const json: ApiResponse<Business[]> = await res.json();
  if (!json.success) throw new Error(json.error || "Error al buscar negocios");
  return json.data;
}
