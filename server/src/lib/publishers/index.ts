import type { Platform } from "@prisma/client";
import type { Publisher } from "./types.js";
import { instagramPublisher } from "./instagram.js";
import { tiktokPublisher } from "./tiktok.js";

const publishers: Record<Platform, Publisher> = {
  instagram: instagramPublisher,
  tiktok: tiktokPublisher,
};

export function getPublisher(platform: Platform): Publisher {
  return publishers[platform];
}

export * from "./types.js";
