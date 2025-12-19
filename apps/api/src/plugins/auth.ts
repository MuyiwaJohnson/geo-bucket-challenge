import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@geoflow/db/types/db.types.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
    };
  }
}

export async function verifyAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.code(401).send({
      error: "Unauthorized",
      message: "Missing or invalid authorization header",
    });
    return;
  }

  const token = authHeader.substring(7);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    reply.code(500).send({
      error: "Internal Server Error",
      message: "Supabase configuration missing",
    });
    return;
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    reply.code(401).send({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
    return;
  }

  request.user = {
    id: user.id,
    email: user.email,
  };
}

export const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("authenticate", verifyAuth);
};

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}
