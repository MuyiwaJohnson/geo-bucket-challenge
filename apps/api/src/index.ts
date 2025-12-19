import Fastify from "fastify";
import cors from "@fastify/cors";
import env from "@fastify/env";
import { propertiesRoutes } from "./routes/properties.js";
import { searchRoutes } from "./routes/search.js";
import { bucketsRoutes } from "./routes/buckets.js";

const server = Fastify({
  logger: true,
});

await server.register(env, {
  confKey: "config",
  schema: {
    type: "object",
    required: ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"],
    properties: {
      SUPABASE_URL: { type: "string" },
      SUPABASE_SERVICE_KEY: { type: "string" },
      PORT: { type: "number", default: 3001 },
      HOST: { type: "string", default: "0.0.0.0" },
    },
  },
  dotenv: {
    path: ".env.local",
  },
});

await server.register(cors, {
  origin: true,
});

await server.register(propertiesRoutes);
await server.register(searchRoutes);
await server.register(bucketsRoutes);

server.get("/", async () => {
  return {
    name: "GeoFlow API",
    version: "1.0.0",
    description: "Geo-bucket property search API",
      endpoints: {
        health: "/health",
        listProperties: "GET /api/properties",
        getProperty: "GET /api/properties/:id",
        createProperty: "POST /api/properties",
        updateProperty: "PUT /api/properties/:id",
        deleteProperty: "DELETE /api/properties/:id",
        searchProperties: "GET /api/properties/search?location=<location>",
        bucketStats: "GET /api/geo-buckets/stats",
      },
  };
});

server.get("/health", async () => {
  return { status: "ok" };
});

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || "0.0.0.0";

try {
  await server.listen({ port, host });
  console.log(`🚀 Server listening on http://${host}:${port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
