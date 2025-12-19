import { FastifyInstance } from "fastify";
import { createProperty } from "@geoflow/db/functions.js";
import { createPropertySchema } from "../lib/validation.js";
import type { CreatePropertyRequest, PropertyResponse } from "@geoflow/types";

export async function propertiesRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: CreatePropertyRequest;
  }>(
    "/api/properties",
    {
      schema: {
        body: {
          type: "object",
          required: ["title", "location_name", "lat", "lng"],
          properties: {
            title: { type: "string" },
            location_name: { type: "string" },
            lat: { type: "number", minimum: -90, maximum: 90 },
            lng: { type: "number", minimum: -180, maximum: 180 },
            price: { type: "number" },
            bedrooms: { type: "integer", minimum: 0 },
            bathrooms: { type: "integer", minimum: 0 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "number" },
              title: { type: "string" },
              location_name: { type: "string" },
              lat: { type: "number" },
              lng: { type: "number" },
              price: { type: ["number", "null"] },
              bedrooms: { type: ["number", "null"] },
              bathrooms: { type: ["number", "null"] },
              bucket_id: { type: ["number", "null"] },
              created_at: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const validated = createPropertySchema.parse(request.body);
        const property = await createProperty(validated);

        const response: PropertyResponse = {
          id: property.id,
          title: property.title,
          location_name: property.location_name,
          lat: property.lat,
          lng: property.lng,
          price: property.price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          bucket_id: property.bucket_id,
          created_at: property.created_at ?? new Date().toISOString(),
        };

        return reply.code(201).send(response);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({
            error: "Validation Error",
            message: error.message,
            statusCode: 400,
          });
        }
        throw error;
      }
    }
  );
}
