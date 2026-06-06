import type { MediaKind, Platform } from "@prisma/client";

/** Everything a publisher needs to push one post to one account. */
export interface PublishContext {
  /** A valid (refreshed if needed) access token for the target account. */
  accessToken: string;
  /** The platform's account id (IG user id / TikTok open_id). */
  externalAccountId: string;
  caption: string;
  media: {
    kind: MediaKind;
    publicUrl: string;
  } | null;
}

export interface PublishResult {
  /** The platform-assigned id of the published post (for later analytics). */
  externalPostId: string;
}

export interface Publisher {
  platform: Platform;
  publish(ctx: PublishContext): Promise<PublishResult>;
}

/** Raised for predictable, user-facing publish failures (bad media, etc.). */
export class PublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishError";
  }
}
