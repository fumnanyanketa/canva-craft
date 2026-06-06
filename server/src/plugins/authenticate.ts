import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyToken } from "../lib/auth.js";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

/**
 * preHandler guard: require a valid Bearer token and attach `request.userId`.
 * Use on any route that needs an authenticated app user.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Missing or invalid Authorization header" });
  }
  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    request.userId = payload.sub;
  } catch {
    return reply.code(401).send({ error: "Invalid or expired token" });
  }
}
