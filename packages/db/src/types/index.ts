export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./db.types.js";

import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./db.types.js";

export type Property = Tables<"properties">;
export type GeoBucket = Tables<"geo_buckets">;
export type LocationAlias = Tables<"location_aliases">;

export type PropertyInsert = TablesInsert<"properties">;
export type GeoBucketInsert = TablesInsert<"geo_buckets">;
export type LocationAliasInsert = TablesInsert<"location_aliases">;

export type PropertyUpdate = TablesUpdate<"properties">;
export type GeoBucketUpdate = TablesUpdate<"geo_buckets">;
export type LocationAliasUpdate = TablesUpdate<"location_aliases">;

export type SearchPropertiesResult =
  Database["public"]["Functions"]["search_properties_by_location"]["Returns"][number];
export type BucketStatsResult =
  Database["public"]["Functions"]["get_bucket_stats"]["Returns"][number];

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
