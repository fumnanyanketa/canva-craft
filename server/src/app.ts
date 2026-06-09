import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { oauthRoutes } from "./routes/oauth.js";
import { accountRoutes } from "./routes/accounts.js";
import { mediaRoutes } from "./routes/media.js";
import { postRoutes } from "./routes/posts.js";
import { analyticsRoutes } from "./routes/analytics.js";

export function buildApp() {
  const app = Fastify({
    logger: { level: env.NODE_ENV === "development" ? "info" : "warn" },
  });

  app.register(cors, {
    origin: env.WEB_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  });
  app.register(multipart);

  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(oauthRoutes);
  app.register(accountRoutes);
  app.register(mediaRoutes);
  app.register(postRoutes);
  app.register(analyticsRoutes);

  return app;
}
