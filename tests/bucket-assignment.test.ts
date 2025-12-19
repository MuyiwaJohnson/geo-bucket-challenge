import { describe, it, expect } from "@jest/globals";
import { createProperty } from "@geoflow/db/functions.js";
import { supabase } from "@geoflow/db/client.js";

describe("Bucket Assignment", () => {
  it("should assign properties with same coordinates to same bucket", async () => {
    const lat = 6.4698;
    const lng = 3.6285;

    const prop1 = await createProperty({
      title: "Property 1",
      location_name: "Test Location 1",
      lat,
      lng,
    });

    const prop2 = await createProperty({
      title: "Property 2",
      location_name: "Test Location 2",
      lat,
      lng,
    });

    expect(prop1.bucket_id).toBe(prop2.bucket_id);
    expect(prop1.bucket_id).not.toBeNull();
  });

  it("should assign properties within 500m to same bucket", async () => {
    const prop1 = await createProperty({
      title: "Property Close 1",
      location_name: "Close Location 1",
      lat: 6.4698,
      lng: 3.6285,
    });

    const prop2 = await createProperty({
      title: "Property Close 2",
      location_name: "Close Location 2",
      lat: 6.47,
      lng: 3.6286,
    });

    expect(prop1.bucket_id).toBe(prop2.bucket_id);
  });

  it("should assign properties far apart to different buckets", async () => {
    const prop1 = await createProperty({
      title: "Property Far 1",
      location_name: "Far Location 1",
      lat: 6.4698,
      lng: 3.6285,
    });

    const prop2 = await createProperty({
      title: "Property Far 2",
      location_name: "Far Location 2",
      lat: 6.48,
      lng: 3.64,
    });

    expect(prop1.bucket_id).not.toBe(prop2.bucket_id);
    expect(prop1.bucket_id).not.toBeNull();
    expect(prop2.bucket_id).not.toBeNull();
  });

  it("should create bucket automatically when none exists", async () => {
    const uniqueLat = 6.5 + Math.random() * 0.01;
    const uniqueLng = 3.6 + Math.random() * 0.01;

    const prop = await createProperty({
      title: "New Bucket Property",
      location_name: "New Location",
      lat: uniqueLat,
      lng: uniqueLng,
    });

    expect(prop.bucket_id).not.toBeNull();

    if (prop.bucket_id === null) {
      throw new Error("bucket_id should not be null");
    }

    const { data: bucket } = await supabase
      .from("geo_buckets")
      .select("*")
      .eq("id", prop.bucket_id)
      .single();

    expect(bucket).not.toBeNull();
    expect(bucket?.bucket_key).toBeDefined();
  });
});
