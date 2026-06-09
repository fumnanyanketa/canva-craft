import { useAuthStore, type AuthUser } from "@/store/useAuthStore";

/**
 * HTTP client for the Metricool Lite backend (server/).
 *
 * This is the real-mode counterpart of the mock SocialClient: every call here
 * hits the Fastify API, which owns accounts, media, scheduled posts, and the
 * publisher pipeline.
 */

const BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const e = (body as { error: unknown }).error;
    if (typeof e === "string") return e;
    // Zod fieldErrors: { field: ["msg"] } — surface the first message.
    if (e && typeof e === "object") {
      const first = Object.values(e as Record<string, unknown>)[0];
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    }
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Is the API running and VITE_API_URL correct?",
      0
    );
  }

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }

  if (!res.ok) {
    // An expired/invalid session anywhere → drop back to the login screen.
    if (res.status === 401 && token) {
      useAuthStore.getState().logout();
    }
    throw new ApiError(
      messageFrom(body, `Request failed (${res.status})`),
      res.status,
      body
    );
  }
  return body as T;
}

// ---------- Server payload types ----------

export type ApiPlatform = "instagram" | "tiktok";

export interface ApiAccount {
  id: string;
  platform: ApiPlatform;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ApiAvailability {
  platform: ApiPlatform;
  configured: boolean;
}

export interface ApiMedia {
  id: string;
  kind: "image" | "video";
  publicUrl: string;
  mimeType: string;
}

export interface ApiPostTarget {
  id: string;
  status: "pending" | "publishing" | "published" | "failed";
  externalPostId?: string | null;
  error?: string | null;
  account: { id: string; platform: ApiPlatform; username?: string | null };
}

export interface ApiPost {
  id: string;
  caption: string;
  scheduledAt: string;
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  media?: ApiMedia | null;
  targets: ApiPostTarget[];
}

export interface ApiAnalyticsPoint {
  date: string;
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
}

export interface ApiAccountAnalytics {
  account: ApiAccount;
  series: ApiAnalyticsPoint[];
}

// ---------- Endpoints ----------

export const api = {
  register: (email: string, password: string, name?: string) =>
    request<{ token: string; user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getAccounts: () =>
    request<{ accounts: ApiAccount[]; available: ApiAvailability[] }>(
      "/api/accounts"
    ),

  disconnectAccount: (id: string) =>
    request<{ ok: true }>(`/api/accounts/${id}`, { method: "DELETE" }),

  oauthStart: (platform: ApiPlatform) =>
    request<{ url: string }>(`/api/oauth/${platform}/start`),

  uploadMedia: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ media: ApiMedia }>("/api/media", {
      method: "POST",
      body: form,
    });
  },

  listPosts: () => request<{ posts: ApiPost[] }>("/api/posts"),

  createPost: (input: {
    caption: string;
    scheduledAt: string;
    accountIds: string[];
    mediaId?: string;
  }) =>
    request<{ post: ApiPost }>("/api/posts", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  deletePost: (id: string) =>
    request<{ ok: true }>(`/api/posts/${id}`, { method: "DELETE" }),

  getAnalytics: (days = 28) =>
    request<{ accounts: ApiAccountAnalytics[] }>(
      `/api/analytics?days=${days}`
    ),
};
