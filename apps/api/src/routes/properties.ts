import { FastifyInstance } from "fastify";
import { createProperty } from "@geoflow/db/functions.js";
import { createPropertySchema } from "../lib/validation.js";
import type { CreatePropertyRequest, PropertyResponse } from "@geoflow/types";
import { supabase } from "@geoflow/db/client.js";

const propertyResponseSchema = {
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
    created_at: { type: ["string", "null"] },
  },
};

function parsePropertyLocation(location: unknown): {
  lat: number;
  lng: number;
} {
  const locationStr = String(location);
  const locationMatch = locationStr.match(/POINT\(([\d.]+)\s+([\d.]+)\)/);
  const lng = locationMatch?.[1] ? parseFloat(locationMatch[1]) : 0;
  const lat = locationMatch?.[2] ? parseFloat(locationMatch[2]) : 0;
  return { lat, lng };
}

export async function propertiesRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/properties",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: propertyResponseSchema,
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        const response: PropertyResponse[] = (data || []).map((item) => {
          const { lat, lng } = parsePropertyLocation(item.location);
          return {
            id: item.id,
            title: item.title,
            location_name: item.location_name,
            lat,
            lng,
            price: item.price,
            bedrooms: item.bedrooms,
            bathrooms: item.bathrooms,
            bucket_id: item.bucket_id,
            created_at: item.created_at
              ? new Date(item.created_at).toISOString()
              : null,
          };
        });

        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(500).send({
            error: "Internal Server Error",
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  fastify.get<{
    Params: { id: string };
  }>(
    "/api/properties/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: propertyResponseSchema,
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const id = parseInt(request.params.id);
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          return reply.code(404).send({
            error: "Not Found",
            message: "Property not found",
          });
        }

        const { lat, lng } = parsePropertyLocation(data.location);

        const response: PropertyResponse = {
          id: data.id,
          title: data.title,
          location_name: data.location_name,
          lat,
          lng,
          price: data.price,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          bucket_id: data.bucket_id,
          created_at: data.created_at
            ? new Date(data.created_at).toISOString()
            : null,
        };

        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(500).send({
            error: "Internal Server Error",
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

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
          201: propertyResponseSchema,
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

  fastify.put<{
    Params: { id: string };
    Body: Partial<CreatePropertyRequest>;
  }>(
    "/api/properties/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
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
          200: propertyResponseSchema,
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const id = parseInt(request.params.id);
        const updateData: Record<string, unknown> = {};

        if (request.body.title !== undefined)
          updateData.title = request.body.title;
        if (request.body.location_name !== undefined)
          updateData.location_name = request.body.location_name;
        if (request.body.price !== undefined)
          updateData.price = request.body.price;
        if (request.body.bedrooms !== undefined)
          updateData.bedrooms = request.body.bedrooms;
        if (request.body.bathrooms !== undefined)
          updateData.bathrooms = request.body.bathrooms;

        if (request.body.lat !== undefined && request.body.lng !== undefined) {
          const { assignPropertyToBucket } =
            await import("@geoflow/db/functions.js");
          const locationName = request.body.location_name || "";
          const bucketId = await assignPropertyToBucket(
            request.body.lat,
            request.body.lng,
            locationName
          );
          updateData.location =
            `POINT(${request.body.lng} ${request.body.lat})` as unknown;
          updateData.bucket_id = bucketId;
        }

        const { data, error } = await supabase
          .from("properties")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error || !data) {
          return reply.code(404).send({
            error: "Not Found",
            message: "Property not found",
          });
        }

        const { lat, lng } = parsePropertyLocation(data.location);

        const response: PropertyResponse = {
          id: data.id,
          title: data.title,
          location_name: data.location_name,
          lat,
          lng,
          price: data.price,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          bucket_id: data.bucket_id,
          created_at: data.created_at
            ? new Date(data.created_at).toISOString()
            : null,
        };

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

  fastify.delete<{
    Params: { id: string };
  }>(
    "/api/properties/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          204: {},
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const id = parseInt(request.params.id);
        const { error } = await supabase
          .from("properties")
          .delete()
          .eq("id", id);

        if (error) {
          return reply.code(404).send({
            error: "Not Found",
            message: "Property not found",
          });
        }

        return reply.code(204).send();
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(500).send({
            error: "Internal Server Error",
            message: error.message,
          });
        }
        throw error;
      }
    }
  );
}
