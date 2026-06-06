import { env } from "../../env.js";
import {
  type ConnectedAccountData,
  type OAuthProvider,
  OAuthApiError,
  OAuthConfigError,
  fetchJson,
} from "./types.js";

const GRAPH = "https://graph.facebook.com/v21.0";
const DIALOG = "https://www.facebook.com/v21.0/dialog/oauth";

// Posting + insights + the Page permissions needed to reach the IG account.
const SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
];

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

interface PagesResponse {
  data: { id: string; name: string; access_token: string }[];
}

interface IgAccountResponse {
  instagram_business_account?: {
    id: string;
    username?: string;
    profile_picture_url?: string;
  };
  id: string;
}

export const instagramProvider: OAuthProvider = {
  platform: "instagram",

  isConfigured() {
    return Boolean(
      env.META_APP_ID && env.META_APP_SECRET && env.META_REDIRECT_URI
    );
  },

  buildAuthUrl(state) {
    if (!this.isConfigured()) throw new OAuthConfigError("Instagram");
    const params = new URLSearchParams({
      client_id: env.META_APP_ID!,
      redirect_uri: env.META_REDIRECT_URI!,
      state,
      scope: SCOPES.join(","),
      response_type: "code",
    });
    return `${DIALOG}?${params.toString()}`;
  },

  async exchangeCode(code) {
    if (!this.isConfigured()) throw new OAuthConfigError("Instagram");

    // 1. code -> short-lived user token
    const shortLived = await fetchJson<TokenResponse>(
      `${GRAPH}/oauth/access_token?` +
        new URLSearchParams({
          client_id: env.META_APP_ID!,
          client_secret: env.META_APP_SECRET!,
          redirect_uri: env.META_REDIRECT_URI!,
          code,
        }).toString()
    );

    // 2. exchange for a long-lived user token (~60 days)
    const longLived = await fetchJson<TokenResponse>(
      `${GRAPH}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: env.META_APP_ID!,
          client_secret: env.META_APP_SECRET!,
          fb_exchange_token: shortLived.access_token,
        }).toString()
    );

    // 3. find a Page that has a linked Instagram Business account
    const pages = await fetchJson<PagesResponse>(
      `${GRAPH}/me/accounts?` +
        new URLSearchParams({
          access_token: longLived.access_token,
          fields: "id,name,access_token",
        }).toString()
    );

    for (const page of pages.data) {
      const ig = await fetchJson<IgAccountResponse>(
        `${GRAPH}/${page.id}?` +
          new URLSearchParams({
            fields:
              "instagram_business_account{id,username,profile_picture_url}",
            access_token: page.access_token,
          }).toString()
      );
      if (ig.instagram_business_account) {
        const acct = ig.instagram_business_account;
        return {
          platform: "instagram",
          externalId: acct.id,
          username: acct.username,
          displayName: acct.username,
          avatarUrl: acct.profile_picture_url,
          // Page tokens derived from a long-lived user token do not expire;
          // we store the Page token because publishing happens via the Page.
          accessToken: page.access_token,
          scopes: SCOPES,
          metaPageId: page.id,
        } satisfies ConnectedAccountData;
      }
    }

    throw new OAuthApiError(
      "No Instagram Business account was found. Make sure your Instagram is a " +
        "Business/Creator account linked to a Facebook Page."
    );
  },
};
