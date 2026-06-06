import { buildApp } from "./app.js";
import { env } from "./env.js";
import { prisma } from "./db.js";
import { startScheduler } from "./scheduler.js";

const app = buildApp();

async function main() {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`API listening on ${env.APP_BASE_URL} (port ${env.PORT})`);
  if (env.SCHEDULER_ENABLED) {
    startScheduler(app.log);
  }
}

main().catch((err) => {
  app.log.error(err);
  process.exit(1);
});

// Graceful shutdown
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, shutting down…`);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
