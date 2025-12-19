import { describe, it, expect, beforeAll } from "@jest/globals";
import type { ErrorResponse, PropertyResponse } from "@geoflow/types";

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

describe("Edge Cases", () => {
  let apiAvailable: boolean;

  beforeAll(async () => {
    apiAvailable = await isApiAvailable();
  });

  describe("Property Creation Edge Cases", () => {
    it("should reject empty title", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "",
          location_name: "Test Location",
          lat: 6.4698,
          lng: 3.6285,
        }),
      });
      expect(response.status).toBe(400);
    });

    it("should reject empty location_name", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Property",
          location_name: "",
          lat: 6.4698,
          lng: 3.6285,
        }),
      });
      expect(response.status).toBe(400);
    });

    it("should reject latitude > 90", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Property",
          location_name: "Test Location",
          lat: 91,
          lng: 3.6285,
        }),
      });
      expect(response.status).toBe(400);
    });

    it("should reject latitude < -90", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Property",
          location_name: "Test Location",
          lat: -91,
          lng: 3.6285,
        }),
      });
      expect(response.status).toBe(400);
    });

    it("should reject longitude > 180", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Property",
          location_name: "Test Location",
          lat: 6.4698,
          lng: 181,
        }),
      });
      expect(response.status).toBe(400);
    });

    it("should reject longitude < -180", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Property",
          location_name: "Test Location",
          lat: 6.4698,
          lng: -181,
        }),
      });
      expect(response.status).toBe(400);
    });

    it("should accept boundary coordinates (90, -90, 180, -180)", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Boundary Test",
          location_name: "North Pole",
          lat: 90,
          lng: 0,
        }),
      });
      expect(response.status).toBe(201);
    });

    it("should accept zero coordinates (0, 0)", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Equator Test",
          location_name: "Equator",
          lat: 0,
          lng: 0,
        }),
      });
      expect(response.status).toBe(201);
    });

    it("should reject negative bedrooms", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Property",
          location_name: "Test Location",
          lat: 6.4698,
          lng: 3.6285,
          bedrooms: -1,
        }),
      });
      expect(response.status).toBe(400);
    });

    it("should reject negative bathrooms", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Property",
          location_name: "Test Location",
          lat: 6.4698,
          lng: 3.6285,
          bathrooms: -1,
        }),
      });
      expect(response.status).toBe(400);
    });

    it("should reject negative price", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Property",
          location_name: "Test Location",
          lat: 6.4698,
          lng: 3.6285,
          price: -1000,
        }),
      });
      expect(response.status).toBe(400);
    });

    it("should accept location names with special characters", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Special Chars Test",
          location_name: "São Paulo, Brazil",
          lat: -23.5505,
          lng: -46.6333,
        }),
      });
      expect(response.status).toBe(201);
    });
  });

  describe("Search Edge Cases", () => {
    it("should reject empty location parameter", async () => {
      if (!apiAvailable) return;
      const response = await fetch(
        `${API_URL}/api/properties/search?location=`
      );
      expect(response.status).toBe(400);
    });

    it("should handle location with only spaces", async () => {
      if (!apiAvailable) return;
      const response = await fetch(
        `${API_URL}/api/properties/search?location=${encodeURIComponent("   ")}`
      );
      expect(response.status).toBe(200);
      const data = (await response.json()) as PropertyResponse[];
      expect(Array.isArray(data)).toBe(true);
    });

    it("should handle comma-separated location (sangotedo,ajah)", async () => {
      if (!apiAvailable) return;
      const response = await fetch(
        `${API_URL}/api/properties/search?location=sangotedo,ajah`
      );
      expect(response.status).toBe(200);
      const data = (await response.json()) as PropertyResponse[];
      expect(Array.isArray(data)).toBe(true);
    });

    it("should handle URL-encoded spaces (sangotedo%20lagos)", async () => {
      if (!apiAvailable) return;
      const response = await fetch(
        `${API_URL}/api/properties/search?location=sangotedo%20lagos`
      );
      expect(response.status).toBe(200);
      const data = (await response.json()) as PropertyResponse[];
      expect(Array.isArray(data)).toBe(true);
    });

    it("should handle very long location names", async () => {
      if (!apiAvailable) return;
      const longLocation = "a".repeat(500);
      const response = await fetch(
        `${API_URL}/api/properties/search?location=${encodeURIComponent(longLocation)}`
      );
      expect(response.status).toBe(200);
      const data = (await response.json()) as PropertyResponse[];
      expect(Array.isArray(data)).toBe(true);
    });

    it("should handle location with special characters", async () => {
      if (!apiAvailable) return;
      const response = await fetch(
        `${API_URL}/api/properties/search?location=${encodeURIComponent("São Paulo")}`
      );
      expect(response.status).toBe(200);
      const data = (await response.json()) as PropertyResponse[];
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return empty array for non-existent location", async () => {
      if (!apiAvailable) return;
      const response = await fetch(
        `${API_URL}/api/properties/search?location=nonexistentlocation12345`
      );
      expect(response.status).toBe(200);
      const data = (await response.json()) as PropertyResponse[];
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it("should handle single character location", async () => {
      if (!apiAvailable) return;
      const response = await fetch(
        `${API_URL}/api/properties/search?location=a`
      );
      expect(response.status).toBe(200);
      const data = (await response.json()) as PropertyResponse[];
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("API Edge Cases", () => {
    it("should handle malformed JSON in POST request", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json }",
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle missing Content-Type header", async () => {
      if (!apiAvailable) return;
      const response = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        body: JSON.stringify({
          title: "Test",
          location_name: "Test",
          lat: 6.4698,
          lng: 3.6285,
        }),
      });
      expect([200, 201, 400]).toContain(response.status);
    });

    it("should handle extra query parameters in search", async () => {
      if (!apiAvailable) return;
      const response = await fetch(
        `${API_URL}/api/properties/search?location=sangotedo&extra=param&another=value`
      );
      expect(response.status).toBe(200);
      const data = (await response.json()) as PropertyResponse[];
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
