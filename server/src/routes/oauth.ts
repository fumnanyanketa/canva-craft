import type { FastifyInstance } from "fastify";
import { env } from "../env.js";
import { authenticate } from "../plugins/authenticate.js";
import {
  getProvider,
  isPlatform,
  OAuthConfigError,
} from "../lib/oauth/index.js";
import { signState, verifyState } from "../lib/oauth/state.js";
import { upsertConnectedAccount } from "../services/accounts.js";

export async function oauthRoutes(app: FastifyInstance) {
  /**
   * Start a connect flow. Authenticated: returns the authorize URL the
   * frontend should redirect the browser to.
   */
  app.get<{ Params: { platform: string } }>(
    "/api/oauth/:platform/start",
    { preHandler: authenticate },
    async (request, reply) => {
      const { platform } = request.params;
      if (!isPlatform(platform)) {
        return reply.code(400).send({ error: "Unknown platform" });
      }
      const provider = getProvider(platform);
      if (!provider.isConfigured()) {
        return reply.code(503).send({
          error: `${platform} is not configured on the server yet`,
        });
      }
      const state = signState(request.userId!, platform);
      return { url: provider.buildAuthUrl(state) };
    }
  );

  /**
   * OAuth callback (top-level browser redirect from the platform). Verifies the
   * signed state to recover which user initiated the flow, exchanges the code,
   * stores the account, then bounces back to the web app.
   */
  app.get<{
    Params: { platform: string };
    Querystring: { code?: string; state?: string; error?: string };
  }>("/api/oauth/:platform/callback", async (request, reply) => {
    const { platform } = request.params;
    const { code, state, error } = request.query;
    const redirectBack = (status: string) =>
      reply.redirect(
        `${env.WEB_ORIGIN}/settings/accounts?connect=${platform}&status=${status}`
      );

    if (!isPlatform(platform)) return reply.code(400).send({ error: "Unknown platform" });
    if (error) return redirectBack("denied");
    if (!code || !state) return redirectBack("error");

    let userId: string;
    try {
      const payload = verifyState(state);
      if (payload.platform !== platform) throw new Error("state mismatch");
      userId = payload.userId;
    } catch {
      return redirectBack("invalid_state");
    }

    try {
      const data = await getProvider(platform).exchangeCode(code);
      await upsertConnectedAccount(userId, data);
      return redirectBack("success");
    } catch (err) {
      if (err instanceof OAuthConfigError) return redirectBack("not_configured");
      request.log.error({ err }, `${platform} OAuth exchange failed`);
      return redirectBack("error");
    }
  });
}
