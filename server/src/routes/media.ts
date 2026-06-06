import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { authenticate } from "../plugins/authenticate.js";
import {
  isStorageConfigured,
  mediaKindFor,
  uploadBuffer,
} from "../lib/storage.js";

const MAX_BYTES = 100 * 1024 * 1024; // 100MB

export async function mediaRoutes(app: FastifyInstance) {
  /** Upload one media file (multipart) → stored on R2, returns a Media row. */
  app.post(
    "/api/media",
    { preHandler: authenticate },
    async (request, reply) => {
      if (!isStorageConfigured()) {
        return reply
          .code(503)
          .send({ error: "Media storage is not configured on the server yet" });
      }

      const file = await request.file({ limits: { fileSize: MAX_BYTES } });
      if (!file) return reply.code(400).send({ error: "No file uploaded" });

      const kind = mediaKindFor(file.mimetype);
      if (!kind) {
        return reply
          .code(415)
          .send({ error: `Unsupported media type: ${file.mimetype}` });
      }

      const buffer = await file.toBuffer();
      if (file.file.truncated) {
        return reply.code(413).send({ error: "File too large (max 100MB)" });
      }

      const { key, publicUrl } = await uploadBuffer(buffer, file.mimetype);

      const media = await prisma.media.create({
        data: {
          userId: request.userId!,
          kind,
          r2Key: key,
          publicUrl,
          mimeType: file.mimetype,
        },
      });

      return reply.code(201).send({ media });
    }
  );
}
