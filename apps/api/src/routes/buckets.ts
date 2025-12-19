import { FastifyInstance } from "fastify";
import { getBucketStats } from "@geoflow/db/functions.js";
import type { BucketStatsResponse } from "@geoflow/types";

export async function bucketsRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/geo-buckets/stats",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              total_buckets: { type: "number" },
              total_properties: { type: "number" },
              avg_properties_per_bucket: { type: "number" },
              max_properties_per_bucket: { type: "number" },
              min_properties_per_bucket: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const stats = await getBucketStats();

        const response: BucketStatsResponse = {
          total_buckets: stats.total_buckets,
          total_properties: stats.total_properties,
          avg_properties_per_bucket: Number(stats.avg_properties_per_bucket),
          max_properties_per_bucket: stats.max_properties_per_bucket,
          min_properties_per_bucket: stats.min_properties_per_bucket,
        };

        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(500).send({
            error: "Internal Server Error",
            message: error.message,
            statusCode: 500,
          });
        }
        throw error;
      }
    }
  );
}
