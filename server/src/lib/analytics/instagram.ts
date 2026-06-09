import { fetchJson } from "../http.js";

const GRAPH = "https://graph.facebook.com/v21.0";

export interface PlatformSnapshot {
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
}

interface FollowersResponse {
  followers_count?: number;
}

interface InsightsResponse {
  data?: {
    name: string;
    values?: { value: number }[];
    total_value?: { value: number };
  }[];
}

/**
 * Pull today's headline metrics for an IG Business account.
 *
 * Each metric is fetched defensively: Meta periodically renames/retires
 * insight metrics across Graph versions, so a missing metric records 0
 * rather than failing the whole snapshot.
 */
export async function fetchInstagramSnapshot(
  accessToken: string,
  igUserId: string
): Promise<PlatformSnapshot> {
  const snapshot: PlatformSnapshot = {
    followers: 0,
    reach: 0,
    impressions: 0,
    engagement: 0,
  };

  try {
    const f = await fetchJson<FollowersResponse>(
      `${GRAPH}/${igUserId}?` +
        new URLSearchParams({
          fields: "followers_count",
          access_token: accessToken,
        }).toString()
    );
    snapshot.followers = f.followers_count ?? 0;
  } catch {
    /* keep 0 */
  }

  try {
    const r = await fetchJson<InsightsResponse>(
      `${GRAPH}/${igUserId}/insights?` +
        new URLSearchParams({
          metric: "reach",
          period: "day",
          access_token: accessToken,
        }).toString()
    );
    const values = r.data?.find((m) => m.name === "reach")?.values;
    snapshot.reach = values?.[values.length - 1]?.value ?? 0;
    snapshot.impressions = snapshot.reach; // impressions metric retired in newer Graph versions
  } catch {
    /* keep 0 */
  }

  try {
    const e = await fetchJson<InsightsResponse>(
      `${GRAPH}/${igUserId}/insights?` +
        new URLSearchParams({
          metric: "accounts_engaged",
          period: "day",
          metric_type: "total_value",
          access_token: accessToken,
        }).toString()
    );
    snapshot.engagement =
      e.data?.find((m) => m.name === "accounts_engaged")?.total_value?.value ??
      0;
  } catch {
    /* keep 0 */
  }

  return snapshot;
}
