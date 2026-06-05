import type { NetworkId } from "./types";

export interface NetworkMeta {
  id: NetworkId;
  label: string;
  /** Brand color (hex). */
  color: string;
}

export const NETWORKS: Record<NetworkId, NetworkMeta> = {
  instagram: { id: "instagram", label: "Instagram", color: "#E1306C" },
  x: { id: "x", label: "X", color: "#0f0f0f" },
  facebook: { id: "facebook", label: "Facebook", color: "#1877F2" },
  tiktok: { id: "tiktok", label: "TikTok", color: "#00C2BB" },
  linkedin: { id: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  youtube: { id: "youtube", label: "YouTube", color: "#FF0000" },
};

export const NETWORK_LIST = Object.values(NETWORKS);
