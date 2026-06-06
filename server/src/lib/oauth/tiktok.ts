import { env } from "../../env.js";
import {
  type ConnectedAccountData,
  type OAuthProvider,
  OAuthConfigError,
  fetchJson,
} from "./types.js";

const AUTHORIZE = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN = "https://open.tiktokapis.com/v2/oauth/token/";
const USER_INFO = "https://open.tiktokapis.com/v2/user/info/";

// Posting + the read scopes for analytics (follower count, per-video stats).
const SCOPES = [
  "user.info.basic",
  "user.info.stats",
  "video.publish",
  "video.list",
];

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
  scope: string;
}

interface UserInfoResponse {
  data: {
    user: {
      open_id: string;
      display_name?: string;
      avatar_url?: string;
    };
  };
}

export const tiktokProvider: OAuthProvider = {
  platform: "tiktok",

  isConfigured() {
    return Boolean(
      env.TIKTOK_CLIENT_KEY &&
        env.TIKTOK_CLIENT_SECRET &&
        env.TIKTOK_REDIRECT_URI
    );
  },

  buildAuthUrl(state) {
    if (!this.isConfigured()) throw new OAuthConfigError("TikTok");
    const params = new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY!,
      redirect_uri: env.TIKTOK_REDIRECT_URI!,
      state,
      scope: SCOPES.join(","),
      response_type: "code",
    });
    return `${AUTHORIZE}?${params.toString()}`;
  },

  async exchangeCode(code) {
    if (!this.isConfigured()) throw new OAuthConfigError("TikTok");

    const token = await fetchJson<TokenResponse>(TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: env.TIKTOK_CLIENT_KEY!,
        client_secret: env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: env.TIKTOK_REDIRECT_URI!,
      }).toString(),
    });

    const info = await fetchJson<UserInfoResponse>(
      `${USER_INFO}?` +
        new URLSearchParams({
          fields: "open_id,display_name,avatar_url",
        }).toString(),
      { headers: { Authorization: `Bearer ${token.access_token}` } }
    );

    const user = info.data.user;
    return {
      platform: "tiktok",
      externalId: token.open_id,
      username: user.display_name,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
      scopes: token.scope ? token.scope.split(",") : SCOPES,
    } satisfies ConnectedAccountData;
  },
};
