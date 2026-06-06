import type { Platform } from "@prisma/client";

/** Normalized result of an OAuth connection, ready to persist. */
export interface ConnectedAccountData {
  platform: Platform;
  externalId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
  /** Instagram only: the linked Facebook Page id used for publishing. */
  metaPageId?: string;
}

/** A pluggable OAuth provider — one per platform. */
export interface OAuthProvider {
  platform: Platform;
  /** Whether the required client credentials are configured. */
  isConfigured(): boolean;
  /** Build the platform authorize URL the user's browser is sent to. */
  buildAuthUrl(state: string): string;
  /** Exchange the returned code for tokens + account identity. */
  exchangeCode(code: string): Promise<ConnectedAccountData>;
}

/** Thrown when a platform's credentials aren't configured yet. */
export class OAuthConfigError extends Error {
  constructor(platform: string) {
    super(`${platform} OAuth is not configured on this server`);
    this.name = "OAuthConfigError";
  }
}

/** Thrown when a platform API call fails; carries context for logging. */
export class OAuthApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = "OAuthApiError";
  }
}

/** GET/POST helper that throws OAuthApiError on non-2xx with the body attached. */
export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new OAuthApiError(
      `Request to ${url} failed with ${res.status}`,
      res.status,
      body
    );
  }
  return body as T;
}
