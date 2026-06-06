import type { Platform } from "@prisma/client";
import type { OAuthProvider } from "./types.js";
import { instagramProvider } from "./instagram.js";
import { tiktokProvider } from "./tiktok.js";

const providers: Record<Platform, OAuthProvider> = {
  instagram: instagramProvider,
  tiktok: tiktokProvider,
};

export function getProvider(platform: Platform): OAuthProvider {
  return providers[platform];
}

export function isPlatform(value: string): value is Platform {
  return value === "instagram" || value === "tiktok";
}

export * from "./types.js";
