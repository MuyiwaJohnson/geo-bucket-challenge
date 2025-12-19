import { FastifyInstance } from "fastify";
import { searchPropertiesByLocation } from "@geoflow/db/functions.js";
import { searchQuerySchema } from "../lib/validation.js";
import type { SearchQueryParams, PropertyResponse } from "@geoflow/types";

export async function searchRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: SearchQueryParams;
  }>(
    "/api/properties/search",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["location"],
          properties: {
            location: { type: "string" },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
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
    },
    async (request, reply) => {
      try {
        const validated = searchQuerySchema.parse(request.query);
        const properties = await searchPropertiesByLocation(validated.location);

        const response: PropertyResponse[] = properties.map((p) => ({
          id: p.id,
          title: p.title,
          location_name: p.location_name,
          lat: p.lat,
          lng: p.lng,
          price: p.price,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          bucket_id: p.bucket_id,
          created_at: p.created_at ?? new Date().toISOString(),
        }));

        return reply.code(200).send(response);
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
