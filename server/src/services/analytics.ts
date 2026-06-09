import type { ConnectedAccount } from "@prisma/client";
import type { FastifyBaseLogger } from "fastify";
import { prisma } from "../db.js";
import { fetchInstagramSnapshot } from "../lib/analytics/instagram.js";
import { fetchTikTokSnapshot } from "../lib/analytics/tiktok.js";
import { ensureValidAccessToken } from "./tokens.js";

/** UTC midnight of "today" — one snapshot row per account per day. */
function todayUtc(): Date {
  return new Date(new Date().toISOString().slice(0, 10));
}

/** Fetch and store today's metrics for one account. */
export async function snapshotAccount(account: ConnectedAccount): Promise<void> {
  const accessToken = await ensureValidAccessToken(account);
  const metrics =
    account.platform === "instagram"
      ? await fetchInstagramSnapshot(accessToken, account.externalId)
      : await fetchTikTokSnapshot(accessToken);

  const capturedFor = todayUtc();
  await prisma.analyticsSnapshot.upsert({
    where: { accountId_capturedFor: { accountId: account.id, capturedFor } },
    create: { accountId: account.id, capturedFor, ...metrics },
    update: metrics,
  });
}

/**
 * Snapshot every connected account that doesn't have a row for today yet.
 * Per-account failures are logged and skipped — one bad token must never
 * stall the rest.
 */
export async function snapshotDueAccounts(log: FastifyBaseLogger): Promise<void> {
  const capturedFor = todayUtc();
  const due = await prisma.connectedAccount.findMany({
    where: { snapshots: { none: { capturedFor } } },
  });

  for (const account of due) {
    try {
      await snapshotAccount(account);
      log.info(
        { accountId: account.id, platform: account.platform },
        "Analytics snapshot stored"
      );
    } catch (err) {
      log.warn(
        { err, accountId: account.id, platform: account.platform },
        "Analytics snapshot failed"
      );
    }
  }
}

/** Per-account daily series for the last N days, for the dashboard. */
export async function getAnalytics(userId: string, days: number) {
  const since = new Date(todayUtc().getTime() - (days - 1) * 86_400_000);
  const accounts = await prisma.connectedAccount.findMany({
    where: { userId },
    include: {
      snapshots: {
        where: { capturedFor: { gte: since } },
        orderBy: { capturedFor: "asc" },
      },
    },
  });

  return accounts.map((a) => ({
    account: {
      id: a.id,
      platform: a.platform,
      username: a.username,
      displayName: a.displayName,
      avatarUrl: a.avatarUrl,
      expiresAt: a.expiresAt,
      createdAt: a.createdAt,
    },
    series: a.snapshots.map((s) => ({
      date: s.capturedFor.toISOString().slice(0, 10),
      followers: s.followers,
      reach: s.reach,
      impressions: s.impressions,
      engagement: s.engagement,
    })),
  }));
}
