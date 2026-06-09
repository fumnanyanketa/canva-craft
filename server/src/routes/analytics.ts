import type { FastifyInstance } from "fastify";
import { authenticate } from "../plugins/authenticate.js";
import { getAnalytics } from "../services/analytics.js";

export async function analyticsRoutes(app: FastifyInstance) {
  /** Daily metric series per connected account for the last N days. */
  app.get<{ Querystring: { days?: string } }>(
    "/api/analytics",
    { preHandler: authenticate },
    async (request) => {
      const days = Math.min(
        90,
        Math.max(1, Number(request.query.days) || 28)
      );
      return { accounts: await getAnalytics(request.userId!, days) };
    }
  );
}
