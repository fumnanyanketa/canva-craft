import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../env.js";

/**
 * Media storage on Cloudflare R2 (S3-compatible).
 *
 * Instagram's Content Publishing API must fetch the image/video from a *public*
 * URL, so we upload here first and hand the platform the resulting URL.
 */

export function isStorageConfigured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET &&
      env.R2_PUBLIC_URL
  );
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error("R2 storage is not configured on this server");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

export interface UploadResult {
  key: string;
  publicUrl: string;
}

export async function uploadBuffer(
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  const ext = EXT[contentType] ?? "bin";
  const key = `media/${randomUUID()}.${ext}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const base = env.R2_PUBLIC_URL!.replace(/\/$/, "");
  return { key, publicUrl: `${base}/${key}` };
}

export function mediaKindFor(contentType: string): "image" | "video" | null {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return null;
}
