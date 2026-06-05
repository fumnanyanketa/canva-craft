import type {
  BestTimeHeatmap,
  DateRange,
  MetricsResponse,
  NetworkId,
  NewPostInput,
  Post,
  Profile,
  TopPost,
} from "./types";

/**
 * The single seam between the UI and any data source.
 *
 * Today this is implemented by `mock/mockClient`. To go live, add
 * `real/realClient` implementing this same interface (hitting Instagram/X/etc.
 * APIs) and swap the export in `services/index.ts` — nothing else changes.
 */
export interface SocialClient {
  getProfiles(): Promise<Profile[]>;

  getMetrics(
    profileId: string,
    scope: NetworkId | "all",
    range: DateRange
  ): Promise<MetricsResponse>;

  getTopPosts(
    profileId: string,
    scope: NetworkId | "all",
    range: DateRange
  ): Promise<TopPost[]>;

  getBestTime(
    profileId: string,
    scope: NetworkId | "all"
  ): Promise<BestTimeHeatmap>;

  /** Scheduled/published posts for the calendar (seed + user-created). */
  getPosts(profileId: string): Promise<Post[]>;

  createPost(input: NewPostInput): Promise<Post>;

  deletePost(profileId: string, postId: string): Promise<void>;
}
