import { fetchJson, sleep } from "../http.js";
import {
  type Publisher,
  type PublishContext,
  type PublishResult,
  PublishError,
} from "./types.js";

const BASE = "https://open.tiktokapis.com/v2";

interface InitResponse {
  data: { publish_id: string };
  error: { code: string; message: string };
}
interface StatusResponse {
  data: { status: string; publicaly_available_post_id?: string[] };
  error: { code: string; message: string };
}

/**
 * TikTok Content Posting API via PULL_FROM_URL (TikTok fetches our R2 media).
 *
 * NOTE: until the app passes TikTok's audit, posts must be SELF_ONLY (private).
 * We default to that so unaudited apps work; flip to PUBLIC_TO_EVERYONE after
 * audit. PULL_FROM_URL also requires the media domain to be verified in the
 * TikTok developer portal.
 */
export const tiktokPublisher: Publisher = {
  platform: "tiktok",

  async publish(ctx: PublishContext): Promise<PublishResult> {
    if (!ctx.media || ctx.media.kind !== "video") {
      throw new PublishError("TikTok requires a video");
    }

    const init = await fetchJson<InitResponse>(`${BASE}/post/publish/video/init/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: ctx.caption,
          privacy_level: "SELF_ONLY",
          disable_comment: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: ctx.media.publicUrl,
        },
      }),
    });

    if (init.error && init.error.code !== "ok") {
      throw new PublishError(`TikTok init failed: ${init.error.message}`);
    }

    const publishId = init.data.publish_id;
    const externalId = await waitForPublish(publishId, ctx.accessToken);
    return { externalPostId: externalId ?? publishId };
  },
};

async function waitForPublish(
  publishId: string,
  accessToken: string,
  maxAttempts = 20
): Promise<string | undefined> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await fetchJson<StatusResponse>(
      `${BASE}/post/publish/status/fetch/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publish_id: publishId }),
      }
    );
    const s = status.data?.status;
    if (s === "PUBLISH_COMPLETE") {
      return status.data.publicaly_available_post_id?.[0];
    }
    if (s === "FAILED") {
      throw new PublishError(
        `TikTok publish failed: ${status.error?.message ?? "unknown"}`
      );
    }
    await sleep(3000);
  }
  throw new PublishError("TikTok publish timed out");
}
