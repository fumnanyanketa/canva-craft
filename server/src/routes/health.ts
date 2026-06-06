import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => {
    let db = "unknown";
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = "up";
    } catch {
      db = "down";
    }
    return { status: "ok", db, uptime: process.uptime() };
  });
}
