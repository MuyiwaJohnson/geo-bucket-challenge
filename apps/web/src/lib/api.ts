import type {
  CreatePropertyRequest,
  PropertyResponse,
  BucketStatsResponse,
  ErrorResponse,
} from "@geoflow/types";

// Use relative URLs - Next.js API routes proxy to backend
// Backend API URL is hidden server-side only
const API_BASE = "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const error: ErrorResponse = await response.json();
      errorMessage =
        error.message ||
        error.error ||
        `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const api = {
  properties: {
    list: async (): Promise<PropertyResponse[]> => {
      const response = await fetch(`${API_BASE}/properties`);
      return handleResponse<PropertyResponse[]>(response);
    },
    get: async (id: number): Promise<PropertyResponse> => {
      const response = await fetch(`${API_BASE}/properties/${id}`);
      return handleResponse<PropertyResponse>(response);
    },
    create: async (data: CreatePropertyRequest): Promise<PropertyResponse> => {
      const response = await fetch(`${API_BASE}/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<PropertyResponse>(response);
    },
    update: async (
      id: number,
      data: Partial<CreatePropertyRequest>
    ): Promise<PropertyResponse> => {
      const response = await fetch(`${API_BASE}/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<PropertyResponse>(response);
    },
    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/properties/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete property");
      }
    },
  },
  search: {
    byLocation: async (location: string): Promise<PropertyResponse[]> => {
      const response = await fetch(
        `${API_BASE}/properties/search?location=${encodeURIComponent(location)}`
      );
      return handleResponse<PropertyResponse[]>(response);
    },
  },
  buckets: {
    stats: async (): Promise<BucketStatsResponse> => {
      const response = await fetch(`${API_BASE}/geo-buckets/stats`);
      return handleResponse<BucketStatsResponse>(response);
    },
  },
};
