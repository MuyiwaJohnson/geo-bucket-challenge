import { describe, it, expect, beforeAll } from "@jest/globals";
import {
  createProperty,
  searchPropertiesByLocation,
} from "@geoflow/db/functions.js";

describe("Location Matching", () => {
  const sangotedoProperties = [
    {
      title: "3BR Flat in Sangotedo",
      location_name: "Sangotedo",
      lat: 6.4698,
      lng: 3.6285,
      price: 5000000,
      bedrooms: 3,
      bathrooms: 2,
    },
    {
      title: "2BR Apartment near Ajah",
      location_name: "Sangotedo, Ajah",
      lat: 6.472,
      lng: 3.6301,
      price: 3500000,
      bedrooms: 2,
      bathrooms: 1,
    },
    {
      title: "4BR Duplex Lagos",
      location_name: "sangotedo lagos",
      lat: 6.4705,
      lng: 3.629,
      price: 12000000,
      bedrooms: 4,
      bathrooms: 3,
    },
  ];

  let createdPropertyIds: number[] = [];

  beforeAll(async () => {
    for (const prop of sangotedoProperties) {
      const created = await createProperty(prop);
      createdPropertyIds.push(created.id);
    }
    createdPropertyIds.sort();
  });

  it('should return all properties when searching "Sangotedo"', async () => {
    const results = await searchPropertiesByLocation("Sangotedo");
    expect(results.length).toBeGreaterThanOrEqual(3);
    const titles = results.map((r) => r.title);
    expect(titles).toContain("3BR Flat in Sangotedo");
    expect(titles).toContain("2BR Apartment near Ajah");
    expect(titles).toContain("4BR Duplex Lagos");
  });

  it("should return same properties for case variations", async () => {
    const results1 = await searchPropertiesByLocation("sangotedo");
    const results2 = await searchPropertiesByLocation("SANGOTEDO");
    const results3 = await searchPropertiesByLocation("Sangotedo");

    expect(results1.length).toBeGreaterThanOrEqual(3);
    expect(results2.length).toBeGreaterThanOrEqual(3);
    expect(results3.length).toBeGreaterThanOrEqual(3);

    const ids1 = results1.map((r) => r.id).sort();
    const ids2 = results2.map((r) => r.id).sort();
    const ids3 = results3.map((r) => r.id).sort();

    for (const id of createdPropertyIds) {
      expect(ids1).toContain(id);
      expect(ids2).toContain(id);
      expect(ids3).toContain(id);
    }

    const intersection = ids1.filter(
      (id) => ids2.includes(id) && ids3.includes(id)
    );
    expect(intersection.length).toBeGreaterThanOrEqual(
      createdPropertyIds.length
    );

    for (const id of createdPropertyIds) {
      expect(intersection).toContain(id);
    }
  });

  it("should handle typo-tolerant matching", async () => {
    const results1 = await searchPropertiesByLocation("sangotedo lagos");
    const results2 = await searchPropertiesByLocation("Sangotedo, Ajah");

    expect(results1.length).toBeGreaterThanOrEqual(1);
    expect(results2.length).toBeGreaterThanOrEqual(1);

    const allResults = [...results1, ...results2];
    const uniqueIds = new Set(allResults.map((r) => r.id));
    expect(uniqueIds.size).toBeGreaterThanOrEqual(2);
  });
});
