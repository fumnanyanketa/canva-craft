import type { SocialClient } from "./client";
import { MockClient } from "./mock/mockClient";

/**
 * The active data client for the whole app.
 *
 * Mock today. To go live: implement `SocialClient` in `services/real/realClient`
 * and change this single line to `new RealClient()`. Hooks and UI are untouched.
 */
export const client: SocialClient = new MockClient();

export * from "./types";
export { NETWORKS, NETWORK_LIST } from "./networks";
export type { NetworkMeta } from "./networks";
