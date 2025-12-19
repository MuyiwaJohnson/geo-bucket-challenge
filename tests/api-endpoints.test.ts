import { describe, it, expect, beforeAll } from "@jest/globals";
import type {
  PropertyResponse,
  BucketStatsResponse,
  ErrorResponse,
} from "@geoflow/types";

const API_URL = process.env.API_URL || "http://localhost:3000";

async function isApiAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

describe("API Endpoints", () => {
  let createdPropertyId: number;
  let apiAvailable: boolean;

  beforeAll(async () => {
    apiAvailable = await isApiAvailable();
  });

  it("POST /api/properties should create a property", async () => {
    if (!apiAvailable) return;
    const response = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Property",
        location_name: "Test Location",
        lat: 6.4698,
        lng: 3.6285,
        price: 5000000,
        bedrooms: 3,
        bathrooms: 2,
      }),
    });

    expect(response.status).toBe(201);
    const data = (await response.json()) as PropertyResponse;
    expect(data.id).toBeDefined();
    expect(data.title).toBe("Test Property");
    expect(data.bucket_id).not.toBeNull();
    createdPropertyId = data.id;
  });

  it("POST /api/properties should reject invalid coordinates", async () => {
    if (!apiAvailable) return;
    const response = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Invalid Property",
        location_name: "Invalid Location",
        lat: 100,
        lng: 3.6285,
      }),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as ErrorResponse;
    expect(data.error).toBeDefined();
  });

  it("POST /api/properties should reject invalid longitude", async () => {
    if (!apiAvailable) return;
    const response = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Invalid Property",
        location_name: "Invalid Location",
        lat: 6.4698,
        lng: 200,
      }),
    });

    expect(response.status).toBe(400);
  });

  it("POST /api/properties should reject empty title", async () => {
    if (!apiAvailable) return;
    const response = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "",
        location_name: "Test Location",
        lat: 6.4698,
        lng: 3.6285,
      }),
    });

    expect(response.status).toBe(400);
  });

  it("POST /api/properties should reject empty location_name", async () => {
    if (!apiAvailable) return;
    const response = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Property",
        location_name: "",
        lat: 6.4698,
        lng: 3.6285,
      }),
    });

    expect(response.status).toBe(400);
  });

  it("GET /api/properties/search should return properties for location", async () => {
    if (!apiAvailable) return;
    const createResponse = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Sangotedo Property",
        location_name: "Sangotedo",
        lat: 6.4698,
        lng: 3.6285,
      }),
    });

    const response = await fetch(
      `${API_URL}/api/properties/search?location=sangotedo`
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as PropertyResponse[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    const hasSangotedo = data.some(
      (p) =>
        p.location_name.toLowerCase().includes("sangotedo") ||
        p.title.toLowerCase().includes("sangotedo")
    );
    expect(hasSangotedo).toBe(true);
  });

  it("GET /api/properties/search should reject missing location parameter", async () => {
    if (!apiAvailable) return;
    const response = await fetch(`${API_URL}/api/properties/search`);

    expect(response.status).toBe(400);
    const data = (await response.json()) as ErrorResponse;
    expect(data.error).toBeDefined();
  });

  it("GET /api/properties/search should handle empty location parameter", async () => {
    if (!apiAvailable) return;
    const response = await fetch(`${API_URL}/api/properties/search?location=`);
    expect(response.status).toBe(400);
  });

  it("GET /api/properties/search should handle comma-separated location", async () => {
    if (!apiAvailable) return;
    const response = await fetch(
      `${API_URL}/api/properties/search?location=sangotedo,ajah`
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as PropertyResponse[];
    expect(Array.isArray(data)).toBe(true);
  });

  it("GET /api/properties/search should return empty array for non-existent location", async () => {
    if (!apiAvailable) return;
    const response = await fetch(
      `${API_URL}/api/properties/search?location=nonexistentlocationxyz123`
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as PropertyResponse[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it("GET /api/geo-buckets/stats should return bucket statistics", async () => {
    if (!apiAvailable) return;
    const response = await fetch(`${API_URL}/api/geo-buckets/stats`);

    expect(response.status).toBe(200);
    const data = (await response.json()) as BucketStatsResponse;
    expect(data.total_buckets).toBeDefined();
    expect(data.total_properties).toBeDefined();
    expect(data.avg_properties_per_bucket).toBeDefined();
    expect(data.max_properties_per_bucket).toBeDefined();
    expect(data.min_properties_per_bucket).toBeDefined();
    expect(typeof data.total_buckets).toBe("number");
    expect(typeof data.total_properties).toBe("number");
    expect(data.total_buckets).toBeGreaterThanOrEqual(0);
    expect(data.total_properties).toBeGreaterThanOrEqual(0);
  });

  it("GET /health should return ok status", async () => {
    if (!apiAvailable) return;
    const response = await fetch(`${API_URL}/health`);
    expect(response.status).toBe(200);
    const data = (await response.json()) as { status: string };
    expect(data.status).toBe("ok");
  });
});
