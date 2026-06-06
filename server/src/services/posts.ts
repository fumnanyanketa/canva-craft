import { prisma } from "../db.js";

export interface CreatePostInput {
  userId: string;
  caption: string;
  mediaId?: string;
  scheduledAt: Date;
  accountIds: string[];
}

/**
 * Create a post and fan it out into one PostTarget per connected account.
 * Validates that the media and accounts belong to the user.
 */
export async function createPost(input: CreatePostInput) {
  const accounts = await prisma.connectedAccount.findMany({
    where: { id: { in: input.accountIds }, userId: input.userId },
    select: { id: true },
  });
  if (accounts.length !== input.accountIds.length) {
    throw new Error("One or more accounts are invalid");
  }

  if (input.mediaId) {
    const media = await prisma.media.findFirst({
      where: { id: input.mediaId, userId: input.userId },
      select: { id: true },
    });
    if (!media) throw new Error("Invalid media");
  }

  return prisma.post.create({
    data: {
      userId: input.userId,
      caption: input.caption,
      mediaId: input.mediaId,
      scheduledAt: input.scheduledAt,
      status: "scheduled",
      targets: {
        create: accounts.map((a) => ({ accountId: a.id })),
      },
    },
    include: { targets: { include: { account: true } }, media: true },
  });
}

export async function listPosts(userId: string) {
  return prisma.post.findMany({
    where: { userId },
    orderBy: { scheduledAt: "asc" },
    include: {
      media: true,
      targets: {
        include: {
          account: {
            select: { id: true, platform: true, username: true },
          },
        },
      },
    },
  });
}
