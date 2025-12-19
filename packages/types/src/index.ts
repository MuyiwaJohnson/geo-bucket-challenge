// Coordinate types
export interface Coordinates {
  lat: number;
  lng: number;
}

// Property creation request
export interface CreatePropertyRequest {
  title: string;
  location_name: string;
  lat: number;
  lng: number;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
}

// Property response
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
  created_at: string | null; // Can be null from database, but will have default in practice
}

// Search query parameters
export interface SearchQueryParams {
  location: string;
}

// Bucket stats response
export interface BucketStatsResponse {
  total_buckets: number;
  total_properties: number;
  avg_properties_per_bucket: number;
  max_properties_per_bucket: number;
  min_properties_per_bucket: number;
}

// API error response
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

