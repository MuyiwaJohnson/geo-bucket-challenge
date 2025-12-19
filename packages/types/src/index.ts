export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CreatePropertyRequest {
  title: string;
  location_name: string;
  lat: number;
  lng: number;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export interface PropertyResponse {
  id: number;
  title: string;
  location_name: string;
  lat: number;
  lng: number;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  bucket_id: number | null;
  created_at: string | null;
}

export interface SearchQueryParams {
  location: string;
}

export interface BucketStatsResponse {
  total_buckets: number;
  total_properties: number;
  avg_properties_per_bucket: number;
  max_properties_per_bucket: number;
  min_properties_per_bucket: number;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
}
