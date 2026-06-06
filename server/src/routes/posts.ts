import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate } from "../plugins/authenticate.js";
import { createPost, listPosts } from "../services/posts.js";

const createSchema = z.object({
  caption: z.string().min(1).max(2200),
  mediaId: z.string().optional(),
  scheduledAt: z.coerce.date(),
  accountIds: z.array(z.string()).min(1, "Pick at least one account"),
});

export async function postRoutes(app: FastifyInstance) {
  app.get("/api/posts", { preHandler: authenticate }, async (request) => {
    return { posts: await listPosts(request.userId!) };
  });

  app.post("/api/posts", { preHandler: authenticate }, async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }
    try {
      const post = await createPost({
        userId: request.userId!,
        ...parsed.data,
      });
      return reply.code(201).send({ post });
    } catch (err) {
      return reply
        .code(400)
        .send({ error: err instanceof Error ? err.message : "Invalid request" });
    }
  });

  app.delete<{ Params: { id: string } }>(
    "/api/posts/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const post = await prisma.post.findUnique({
        where: { id: request.params.id },
      });
      if (!post || post.userId !== request.userId) {
        return reply.code(404).send({ error: "Post not found" });
      }
      // Don't allow deleting something already published.
      if (post.status === "published" || post.status === "publishing") {
        return reply
          .code(409)
          .send({ error: "Cannot delete a post that is already publishing" });
      }
      await prisma.post.delete({ where: { id: post.id } });
      return { ok: true };
    }
  );
}
