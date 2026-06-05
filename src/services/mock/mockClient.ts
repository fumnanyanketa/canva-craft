import type { SocialClient } from "../client";
import type {
  BestTimeHeatmap,
  DateRange,
  MetricsResponse,
  NetworkId,
  NewPostInput,
  Post,
  Profile,
  TopPost,
} from "../types";
import {
  generateBestTime,
  generateMetrics,
  generateSeedPosts,
  generateTopPosts,
} from "./generators";

export const PROFILES: Profile[] = [
  {
    id: "p-aurora",
    name: "Aurora Coffee",
    handle: "@auroracoffee",
    color: "#E1306C",
    networks: ["instagram", "tiktok", "facebook", "x"],
  },
  {
    id: "p-northwind",
    name: "Northwind Studio",
    handle: "@northwind",
    color: "#0A66C2",
    networks: ["linkedin", "x", "youtube", "instagram"],
  },
  {
    id: "p-pixel",
    name: "Pixel Athletics",
    handle: "@pixelathletics",
    color: "#00C2BB",
    networks: ["instagram", "tiktok", "youtube", "facebook", "x"],
  },
];

const STORAGE_KEY = "metricool-lite:user-posts";

function loadUserPosts(): Post[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Post[]) : [];
  } catch {
    return [];
  }
}

function saveUserPosts(posts: Post[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

/** Simulate network latency so loading states are visible. */
function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockClient implements SocialClient {
  async getProfiles(): Promise<Profile[]> {
    return delay(PROFILES, 150);
  }

  async getMetrics(
    profileId: string,
    scope: NetworkId | "all",
    range: DateRange
  ): Promise<MetricsResponse> {
    return delay(generateMetrics(profileId, scope, range));
  }

  async getTopPosts(
    profileId: string,
    scope: NetworkId | "all",
    range: DateRange
  ): Promise<TopPost[]> {
    return delay(generateTopPosts(profileId, scope, range));
  }

  async getBestTime(
    profileId: string,
    scope: NetworkId | "all"
  ): Promise<BestTimeHeatmap> {
    return delay(generateBestTime(profileId, scope), 200);
  }

  async getPosts(profileId: string): Promise<Post[]> {
    const seeded = generateSeedPosts(profileId);
    const user = loadUserPosts().filter((p) => p.profileId === profileId);
    const all = [...seeded, ...user].sort(
      (a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)
    );
    return delay(all, 200);
  }

  async createPost(input: NewPostInput): Promise<Post> {
    const post: Post = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      profileId: input.profileId,
      networks: input.networks,
      caption: input.caption,
      media: input.media,
      scheduledAt: input.scheduledAt,
      status: input.status ?? "scheduled",
    };
    const user = loadUserPosts();
    user.push(post);
    saveUserPosts(user);
    return delay(post, 150);
  }

  async deletePost(_profileId: string, postId: string): Promise<void> {
    const user = loadUserPosts().filter((p) => p.id !== postId);
    saveUserPosts(user);
    return delay(undefined, 100);
  }
}
