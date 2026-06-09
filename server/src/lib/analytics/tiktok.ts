import { fetchJson } from "../http.js";
import type { PlatformSnapshot } from "./instagram.js";

const BASE = "https://open.tiktokapis.com/v2";

interface UserStatsResponse {
  data?: { user?: { follower_count?: number } };
}

interface VideoListResponse {
  data?: {
    videos?: {
      view_count?: number;
      like_count?: number;
      comment_count?: number;
      share_count?: number;
    }[];
  };
}

/**
 * Pull headline metrics for a TikTok account: follower count from the
 * Display API, plus recent-video totals as reach/engagement proxies
 * (TikTok has no account-level daily reach endpoint on the basic tier).
 */
export async function fetchTikTokSnapshot(
  accessToken: string
): Promise<PlatformSnapshot> {
  const snapshot: PlatformSnapshot = {
    followers: 0,
    reach: 0,
    impressions: 0,
    engagement: 0,
  };
  const auth = { Authorization: `Bearer ${accessToken}` };

  try {
    const u = await fetchJson<UserStatsResponse>(
      `${BASE}/user/info/?fields=follower_count`,
      { headers: auth }
    );
    snapshot.followers = u.data?.user?.follower_count ?? 0;
  } catch {
    /* keep 0 */
  }

  try {
    const v = await fetchJson<VideoListResponse>(
      `${BASE}/video/list/?fields=view_count,like_count,comment_count,share_count`,
      {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ max_count: 20 }),
      }
    );
    for (const video of v.data?.videos ?? []) {
      const views = video.view_count ?? 0;
      snapshot.reach += views;
      snapshot.impressions += views;
      snapshot.engagement +=
        (video.like_count ?? 0) +
        (video.comment_count ?? 0) +
        (video.share_count ?? 0);
    }
  } catch {
    /* keep 0 */
  }

  return snapshot;
}
