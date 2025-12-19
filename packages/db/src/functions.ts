import { supabase } from "./client.js";
import type {
  PropertyWithCoordinates,
  BucketStats,
  Database,
} from "./types/index.js";

/**
 * Assign a property to a geo-bucket based on coordinates and location name
 * Creates a new bucket if none exists within 500m
 */
export async function assignPropertyToBucket(
  lat: number,
  lng: number,
  locationName: string
): Promise<number> {
  const { data, error } = await supabase.rpc("assign_property_to_bucket", {
    p_lat: lat,
    p_lng: lng,
    p_location_name: locationName,
  });

  if (error) {
    throw new Error(`Failed to assign property to bucket: ${error.message}`);
  }

  return data as Database["public"]["Functions"]["assign_property_to_bucket"]["Returns"];
}

/**
 * Search properties by location name (fuzzy matching)
 */
export async function searchPropertiesByLocation(
  location: string
): Promise<PropertyWithCoordinates[]> {
  const { data, error } = await supabase.rpc("search_properties_by_location", {
    p_location: location,
  });

  if (error) {
    throw new Error(`Failed to search properties: ${error.message}`);
  }

  return (data || []) as PropertyWithCoordinates[];
}

/**
 * Get statistics about geo-buckets
 */
export async function getBucketStats(): Promise<BucketStats> {
  const { data, error } = await supabase.rpc("get_bucket_stats");

  if (error) {
    throw new Error(`Failed to get bucket stats: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      total_buckets: 0,
      total_properties: 0,
      avg_properties_per_bucket: 0,
      max_properties_per_bucket: 0,
      min_properties_per_bucket: 0,
    };
  }

  const stats =
    data[0] as Database["public"]["Functions"]["get_bucket_stats"]["Returns"][number];
  return {
    total_buckets: stats.total_buckets,
    total_properties: stats.total_properties,
    avg_properties_per_bucket: Number(stats.avg_properties_per_bucket),
    max_properties_per_bucket: stats.max_properties_per_bucket,
    min_properties_per_bucket: stats.min_properties_per_bucket,
  };
}

/**
 * Create a property in the database
 */
export async function createProperty(property: {
  title: string;
  location_name: string;
  lat: number;
  lng: number;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
}): Promise<PropertyWithCoordinates> {
  const bucketId = await assignPropertyToBucket(
    property.lat,
    property.lng,
    property.location_name
  );

  const { data, error } = await supabase
    .from("properties")
    .insert({
      title: property.title,
      location_name: property.location_name,
      location: `POINT(${property.lng} ${property.lat})` as unknown,
      price: property.price ?? null,
      bedrooms: property.bedrooms ?? null,
      bathrooms: property.bathrooms ?? null,
      bucket_id: bucketId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create property: ${error.message}`);
  }

  const locationStr = String(data.location);
  const locationMatch = locationStr.match(/POINT\(([\d.]+)\s+([\d.]+)\)/);
  const lng = locationMatch?.[1] ? parseFloat(locationMatch[1]) : property.lng;
  const lat = locationMatch?.[2] ? parseFloat(locationMatch[2]) : property.lat;

  return {
    ...data,
    lat,
    lng,
  } as PropertyWithCoordinates;
}
