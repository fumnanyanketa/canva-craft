import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";
import type {
  BestTimeHeatmap,
  DateRange,
  MetricPoint,
  MetricsResponse,
  NetworkId,
  Post,
  TopPost,
} from "../types";
import { rng } from "./seed";

/** Baseline scale per network so each brand/network feels distinct. */
const NETWORK_BASE: Record<NetworkId, number> = {
  instagram: 48000,
  x: 22000,
  facebook: 31000,
  tiktok: 65000,
  linkedin: 12000,
  youtube: 18000,
};

const PROFILE_MULT: Record<string, number> = {
  "p-aurora": 1,
  "p-northwind": 0.55,
  "p-pixel": 1.8,
};

const CAPTIONS = [
  "Behind the scenes of our latest launch 🚀",
  "5 tips to level up your morning routine",
  "We asked, you answered — community spotlight 💬",
  "New drop is live. Link in bio 🔗",
  "Throwback to where it all started ✨",
  "Quick how-to: get more from your workflow",
  "Meet the team making it all happen 👋",
  "Hot take: less is more. Agree?",
  "Weekend reading list 📚",
  "Big news coming next week. Stay tuned 👀",
  "Customer love that made our day ❤️",
  "A day in the life — full breakdown",
];

const TONES = ["#3b5bff", "#E1306C", "#00C2BB", "#FF8A00", "#7C3AED", "#10B981"];

function profileMult(profileId: string) {
  return PROFILE_MULT[profileId] ?? 1;
}

function scopeBase(scope: NetworkId | "all", profileId: string): number {
  const mult = profileMult(profileId);
  if (scope === "all") {
    return (
      Object.values(NETWORK_BASE).reduce((a, b) => a + b, 0) * mult * 0.6
    );
  }
  return NETWORK_BASE[scope] * mult;
}

/** Build a daily metric series with a gentle upward trend + weekly seasonality. */
export function generateSeries(
  profileId: string,
  scope: NetworkId | "all",
  range: DateRange
): MetricPoint[] {
  const r = rng(profileId, scope, "series");
  const from = parseISO(range.from);
  const to = parseISO(range.to);
  const days = eachDayOfInterval({ start: from, end: to });
  const base = scopeBase(scope, profileId);

  // Start followers somewhat below current so the line trends up.
  let followers = Math.round(base * (0.9 + r() * 0.05));
  const dailyGrowth = base * (0.0008 + r() * 0.0012);
  const engBase = 2.2 + r() * 3.5; // engagement-rate %

  return days.map((d) => {
    const dow = d.getDay(); // 0 Sun .. 6 Sat
    const weekend = dow === 0 || dow === 6;
    const seasonal = weekend ? 0.8 : 1 + (dow === 3 ? 0.15 : 0); // midweek bump
    const noise = 0.85 + r() * 0.3;

    const gained = Math.round(dailyGrowth * seasonal * noise);
    followers += gained;

    const reach = Math.round(base * (0.18 + r() * 0.12) * seasonal * noise);
    const impressions = Math.round(reach * (1.4 + r() * 0.6));
    const engagementRate = engBase * seasonal * (0.85 + r() * 0.3);
    const engagement = Math.round((reach * engagementRate) / 100);
    const posts = r() > (weekend ? 0.8 : 0.55) ? 1 + Math.floor(r() * 2) : 0;

    return {
      date: format(d, "yyyy-MM-dd"),
      followers,
      followersDelta: gained,
      reach,
      impressions,
      engagement,
      posts,
    } satisfies MetricPoint;
  });
}

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
}

export function generateMetrics(
  profileId: string,
  scope: NetworkId | "all",
  range: DateRange
): MetricsResponse {
  const series = generateSeries(profileId, scope, range);

  // Build the previous equivalent period for deltas.
  const from = parseISO(range.from);
  const to = parseISO(range.to);
  const span = differenceInCalendarDays(to, from);
  const prevRange: DateRange = {
    from: format(addDays(from, -(span + 1)), "yyyy-MM-dd"),
    to: format(addDays(from, -1), "yyyy-MM-dd"),
  };
  const prev = generateSeries(profileId, scope, prevRange);

  const reach = sum(series.map((p) => p.reach));
  const prevReach = sum(prev.map((p) => p.reach));
  const eng = sum(series.map((p) => p.engagement));
  const engRate = reach ? (eng / reach) * 100 : 0;
  const prevEng = sum(prev.map((p) => p.engagement));
  const prevEngRate = prevReach ? (prevEng / prevReach) * 100 : 0;
  const posts = sum(series.map((p) => p.posts));
  const prevPosts = sum(prev.map((p) => p.posts));

  const followersNow = series[series.length - 1]?.followers ?? 0;
  const followersStart = series[0]?.followers ?? followersNow;

  return {
    scope,
    range,
    series,
    summary: {
      followers: {
        value: followersNow,
        changePct: pctChange(followersNow, followersStart),
      },
      reach: { value: reach, changePct: pctChange(reach, prevReach) },
      engagementRate: {
        value: engRate,
        changePct: pctChange(engRate, prevEngRate),
      },
      posts: { value: posts, changePct: pctChange(posts, prevPosts) },
    },
    networkBreakdown: buildBreakdown(profileId, scope),
  };
}

function buildBreakdown(
  profileId: string,
  scope: NetworkId | "all"
): { network: NetworkId; value: number }[] {
  const networks: NetworkId[] =
    scope === "all"
      ? (Object.keys(NETWORK_BASE) as NetworkId[])
      : [scope];
  const mult = profileMult(profileId);
  return networks.map((n) => ({
    network: n,
    value: Math.round(NETWORK_BASE[n] * mult),
  }));
}

export function generateTopPosts(
  profileId: string,
  scope: NetworkId | "all",
  range: DateRange,
  count = 6
): TopPost[] {
  const r = rng(profileId, scope, "top", range.from, range.to);
  const networks: NetworkId[] =
    scope === "all"
      ? (Object.keys(NETWORK_BASE) as NetworkId[])
      : [scope];
  const from = parseISO(range.from);
  const to = parseISO(range.to);
  const span = Math.max(1, differenceInCalendarDays(to, from));

  const posts = Array.from({ length: count }).map((_, i) => {
    const network = networks[Math.floor(r() * networks.length)];
    const likes = Math.round(800 * profileMult(profileId) * (1 + r() * 6));
    const comments = Math.round(likes * (0.03 + r() * 0.08));
    const shares = Math.round(likes * (0.02 + r() * 0.05));
    const reach = likes * (8 + r() * 10);
    return {
      id: `top-${profileId}-${scope}-${i}`,
      network,
      caption: CAPTIONS[Math.floor(r() * CAPTIONS.length)],
      date: format(addDays(from, Math.floor(r() * span)), "yyyy-MM-dd"),
      likes,
      comments,
      shares,
      engagementRate: ((likes + comments + shares) / reach) * 100,
    } satisfies TopPost;
  });

  return posts.sort(
    (a, b) =>
      b.likes + b.comments + b.shares - (a.likes + a.comments + a.shares)
  );
}

export function generateBestTime(
  profileId: string,
  scope: NetworkId | "all"
): BestTimeHeatmap {
  const r = rng(profileId, scope, "besttime");
  // 7 rows Mon..Sun, 24 hours.
  return Array.from({ length: 7 }).map((_, day) =>
    Array.from({ length: 24 }).map((_, hour) => {
      // Peaks around 8-9am, 12-1pm, 7-9pm; weekends shifted later.
      const isWeekend = day >= 5;
      const peaks = isWeekend ? [11, 14, 21] : [8, 12, 19];
      let v = 8 + r() * 12;
      for (const p of peaks) {
        const dist = Math.abs(hour - p);
        v += Math.max(0, 60 - dist * 14) * (0.7 + r() * 0.6);
      }
      if (hour < 6) v *= 0.3;
      return Math.min(100, Math.round(v));
    })
  );
}

/** Deterministic seed of ~20 posts spread across past & future for the calendar. */
export function generateSeedPosts(profileId: string): Post[] {
  const r = rng(profileId, "posts");
  const networks: NetworkId[] = Object.keys(NETWORK_BASE) as NetworkId[];
  const today = new Date();
  const out: Post[] = [];

  for (let i = 0; i < 22; i++) {
    const offset = Math.floor(r() * 40) - 20; // -20..+19 days
    const date = addDays(today, offset);
    date.setHours(8 + Math.floor(r() * 12), r() > 0.5 ? 30 : 0, 0, 0);
    const past = offset < 0;
    const nets = [networks[Math.floor(r() * networks.length)]];
    if (r() > 0.6) {
      const extra = networks[Math.floor(r() * networks.length)];
      if (!nets.includes(extra)) nets.push(extra);
    }
    const likes = Math.round(500 * profileMult(profileId) * (1 + r() * 5));
    out.push({
      id: `seed-${profileId}-${i}`,
      profileId,
      networks: nets,
      caption: CAPTIONS[Math.floor(r() * CAPTIONS.length)],
      media: { kind: r() > 0.3 ? "image" : "video", tone: TONES[i % TONES.length] },
      scheduledAt: date.toISOString(),
      status: past ? "published" : "scheduled",
      metrics: past
        ? {
            likes,
            comments: Math.round(likes * 0.05),
            shares: Math.round(likes * 0.03),
          }
        : undefined,
    });
  }

  return out.sort(
    (a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)
  );
}

export { TONES, CAPTIONS };
