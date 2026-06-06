import { fetchJson, sleep } from "../http.js";
import {
  type Publisher,
  type PublishContext,
  type PublishResult,
  PublishError,
} from "./types.js";

const GRAPH = "https://graph.facebook.com/v21.0";

interface ContainerResponse {
  id: string;
}
interface StatusResponse {
  status_code: "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED";
}

/**
 * Instagram Content Publishing is two steps:
 *   1) create a media container from a public URL
 *   2) publish that container
 * Video/Reels containers process asynchronously, so we poll until FINISHED.
 */
export const instagramPublisher: Publisher = {
  platform: "instagram",

  async publish(ctx: PublishContext): Promise<PublishResult> {
    if (!ctx.media) {
      throw new PublishError("Instagram requires an image or video");
    }
    const igUser = ctx.externalAccountId;
    const isVideo = ctx.media.kind === "video";

    // 1) create container
    const containerParams = new URLSearchParams({
      caption: ctx.caption,
      access_token: ctx.accessToken,
    });
    if (isVideo) {
      containerParams.set("media_type", "REELS");
      containerParams.set("video_url", ctx.media.publicUrl);
    } else {
      containerParams.set("image_url", ctx.media.publicUrl);
    }

    const container = await fetchJson<ContainerResponse>(
      `${GRAPH}/${igUser}/media`,
      { method: "POST", body: containerParams }
    );

    // 2) wait for video processing to finish (images are ready immediately)
    if (isVideo) {
      await waitForContainer(container.id, ctx.accessToken);
    }

    // 3) publish
    const published = await fetchJson<ContainerResponse>(
      `${GRAPH}/${igUser}/media_publish`,
      {
        method: "POST",
        body: new URLSearchParams({
          creation_id: container.id,
          access_token: ctx.accessToken,
        }),
      }
    );

    return { externalPostId: published.id };
  },
};

async function waitForContainer(
  creationId: string,
  accessToken: string,
  maxAttempts = 20
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await fetchJson<StatusResponse>(
      `${GRAPH}/${creationId}?` +
        new URLSearchParams({
          fields: "status_code",
          access_token: accessToken,
        }).toString()
    );
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new PublishError(`Instagram media processing ${status.status_code}`);
    }
    await sleep(3000);
  }
  throw new PublishError("Instagram media processing timed out");
}
