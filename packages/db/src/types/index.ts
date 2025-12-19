export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./db.types.js";

// Import helpers for type extraction
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./db.types.js";

// Table row types
export type Property = Tables<"properties">;
export type GeoBucket = Tables<"geo_buckets">;
export type LocationAlias = Tables<"location_aliases">;

// Insert types
export type PropertyInsert = TablesInsert<"properties">;
export type GeoBucketInsert = TablesInsert<"geo_buckets">;
export type LocationAliasInsert = TablesInsert<"location_aliases">;

// Update types
export type PropertyUpdate = TablesUpdate<"properties">;
export type GeoBucketUpdate = TablesUpdate<"geo_buckets">;
export type LocationAliasUpdate = TablesUpdate<"location_aliases">;

// Function return types from database
export type SearchPropertiesResult =
  Database["public"]["Functions"]["search_properties_by_location"]["Returns"][number];
export type BucketStatsResult =
  Database["public"]["Functions"]["get_bucket_stats"]["Returns"][number];

// Extended types for API responses (with coordinates extracted)
export interface PropertyWithCoordinates extends Omit<Property, "location"> {
  lat: number;
  lng: number;
}

export interface BucketStats {
  total_buckets: number;
  total_properties: number;
  avg_properties_per_bucket: number;
  max_properties_per_bucket: number;
  min_properties_per_bucket: number;
}
