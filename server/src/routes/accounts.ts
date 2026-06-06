import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { authenticate } from "../plugins/authenticate.js";
import { publicAccount } from "../services/accounts.js";
import { getProvider } from "../lib/oauth/index.js";
import type { Platform } from "@prisma/client";

export async function accountRoutes(app: FastifyInstance) {
  /** List the current user's connected accounts (token-free). */
  app.get(
    "/api/accounts",
    { preHandler: authenticate },
    async (request) => {
      const accounts = await prisma.connectedAccount.findMany({
        where: { userId: request.userId },
        orderBy: { createdAt: "asc" },
      });

      // Surface which platforms the server is even able to offer.
      const available = (["instagram", "tiktok"] as Platform[]).map((p) => ({
        platform: p,
        configured: getProvider(p).isConfigured(),
      }));

      return { accounts: accounts.map(publicAccount), available };
    }
  );

  /** Disconnect an account (only if it belongs to the caller). */
  app.delete<{ Params: { id: string } }>(
    "/api/accounts/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const account = await prisma.connectedAccount.findUnique({
        where: { id: request.params.id },
      });
      if (!account || account.userId !== request.userId) {
        return reply.code(404).send({ error: "Account not found" });
      }
      await prisma.connectedAccount.delete({ where: { id: account.id } });
      return { ok: true };
    }
  );
}
