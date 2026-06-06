import { prisma } from "../db.js";
import { describeError } from "../lib/http.js";
import { getPublisher } from "../lib/publishers/index.js";
import { ensureValidAccessToken } from "./tokens.js";

/**
 * Publish one post to all its targets. Each target succeeds or fails
 * independently; the post is `published` if at least one target went out,
 * `failed` only if every target failed.
 */
export async function publishPost(postId: string): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { media: true, targets: { include: { account: true } } },
  });
  if (!post) return;

  await prisma.post.update({
    where: { id: post.id },
    data: { status: "publishing" },
  });

  let anySucceeded = false;

  for (const target of post.targets) {
    if (target.status === "published") {
      anySucceeded = true;
      continue;
    }
    await prisma.postTarget.update({
      where: { id: target.id },
      data: { status: "publishing", attempts: { increment: 1 } },
    });

    try {
      const accessToken = await ensureValidAccessToken(target.account);
      const result = await getPublisher(target.account.platform).publish({
        accessToken,
        externalAccountId: target.account.externalId,
        caption: post.caption,
        media: post.media
          ? { kind: post.media.kind, publicUrl: post.media.publicUrl }
          : null,
      });

      await prisma.postTarget.update({
        where: { id: target.id },
        data: {
          status: "published",
          externalPostId: result.externalPostId,
          error: null,
          publishedAt: new Date(),
        },
      });
      anySucceeded = true;
    } catch (err) {
      await prisma.postTarget.update({
        where: { id: target.id },
        data: { status: "failed", error: describeError(err) },
      });
    }
  }

  await prisma.post.update({
    where: { id: post.id },
    data: { status: anySucceeded ? "published" : "failed" },
  });
}
