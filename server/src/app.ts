import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";

export function buildApp() {
  const app = Fastify({
    logger: { level: env.NODE_ENV === "development" ? "info" : "warn" },
  });

  app.register(cors, {
    origin: env.WEB_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  });

  app.register(healthRoutes);
  app.register(authRoutes);

  return app;
}
