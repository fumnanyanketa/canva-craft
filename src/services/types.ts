/**
 * Domain types for Metricool Lite.
 *
 * These types are deliberately transport-agnostic: the mock client produces
 * them today, and a future real-API client (services/real) must produce the
 * exact same shapes so the UI never changes.
 */

export type NetworkId =
  | "instagram"
  | "x"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "youtube";

export interface Profile {
  id: string;
  name: string;
  handle: string;
  /** Tailwind-friendly accent color (hex) used for the avatar fallback. */
  color: string;
  /** Networks this brand has "connected". */
  networks: NetworkId[];
}

/** A single point in a time series (one per day). */
export interface MetricPoint {
  /** ISO date (yyyy-MM-dd). */
  date: string;
  followers: number;
  /** New followers gained that day (can be negative). */
  followersDelta: number;
  reach: number;
  impressions: number;
  engagement: number;
  posts: number;
}

/** A KPI summary value with comparison against the previous period. */
export interface MetricSummary {
  value: number;
  /** Percentage change vs the previous equivalent period. */
  changePct: number;
}

export interface MetricsResponse {
  /** "all" rollup or a specific network. */
  scope: NetworkId | "all";
  range: { from: string; to: string };
  series: MetricPoint[];
  summary: {
    followers: MetricSummary;
    reach: MetricSummary;
    engagementRate: MetricSummary;
    posts: MetricSummary;
  };
  /** Follower share per network, for the breakdown donut. */
  networkBreakdown: { network: NetworkId; value: number }[];
}

export type PostStatus = "scheduled" | "published" | "draft";

export interface Post {
  id: string;
  profileId: string;
  networks: NetworkId[];
  caption: string;
  /** Placeholder color/emoji standing in for media. */
  media?: { kind: "image" | "video"; tone: string };
  /** ISO datetime. */
  scheduledAt: string;
  status: PostStatus;
  metrics?: { likes: number; comments: number; shares: number };
}

export interface TopPost {
  id: string;
  network: NetworkId;
  caption: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

/** 7 rows (Mon..Sun) x 24 cols (hours), values 0..100 engagement intensity. */
export type BestTimeHeatmap = number[][];

export interface DateRange {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
}

/** Draft used by the composer when creating a post. */
export interface NewPostInput {
  profileId: string;
  networks: NetworkId[];
  caption: string;
  scheduledAt: string;
  media?: { kind: "image" | "video"; tone: string };
  status?: PostStatus;
}
