import type { FastifyBaseLogger } from "fastify";
import { prisma } from "./db.js";
import { publishPost } from "./services/publish.js";
import { snapshotDueAccounts } from "./services/analytics.js";

const TICK_MS = 60_000; // publish check every minute
const SNAPSHOT_MS = 60 * 60_000; // analytics snapshot check every hour

/**
 * Lightweight in-process scheduler: every minute, claim posts whose time has
 * come and publish them. Simple and dependency-free; graduate to a real queue
 * (BullMQ) if volume ever demands it.
 *
 * Run this in the API process (default) or as a separate worker process.
 */
export function startScheduler(log: FastifyBaseLogger) {
  let running = false;

  async function tick() {
    if (running) return; // never overlap ticks
    running = true;
    try {
      const due = await prisma.post.findMany({
        where: { status: "scheduled", scheduledAt: { lte: new Date() } },
        select: { id: true },
        take: 25,
      });
      for (const { id } of due) {
        log.info({ postId: id }, "Publishing scheduled post");
        try {
          await publishPost(id);
        } catch (err) {
          log.error({ err, postId: id }, "publishPost threw");
        }
      }
    } catch (err) {
      log.error({ err }, "scheduler tick failed");
    } finally {
      running = false;
    }
  }

  // Daily analytics snapshots, checked hourly (each account gets one row/day).
  async function snapshotTick() {
    try {
      await snapshotDueAccounts(log);
    } catch (err) {
      log.error({ err }, "analytics snapshot tick failed");
    }
  }

  const timer = setInterval(tick, TICK_MS);
  const snapshotTimer = setInterval(snapshotTick, SNAPSHOT_MS);
  // Don't keep the event loop alive solely for the timers.
  timer.unref?.();
  snapshotTimer.unref?.();
  log.info("Scheduler started (publish: 60s, analytics: hourly)");
  void tick(); // run once on boot
  void snapshotTick();

  return () => {
    clearInterval(timer);
    clearInterval(snapshotTimer);
  };
}
