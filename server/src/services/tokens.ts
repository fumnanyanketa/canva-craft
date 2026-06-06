import type { ConnectedAccount } from "@prisma/client";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { decrypt, encrypt } from "../lib/crypto.js";
import { fetchJson } from "../lib/http.js";

interface TikTokRefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Return a usable access token for an account, refreshing first if it's expired.
 * Instagram Page tokens don't expire; TikTok access tokens do (~24h).
 */
export async function ensureValidAccessToken(
  account: ConnectedAccount
): Promise<string> {
  if (account.platform === "instagram") {
    return decrypt(account.accessTokenEnc);
  }

  // TikTok: refresh if within 60s of expiry and we have a refresh token.
  const expired =
    account.expiresAt && account.expiresAt.getTime() - 60_000 < Date.now();
  if (!expired || !account.refreshTokenEnc) {
    return decrypt(account.accessTokenEnc);
  }

  if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET) {
    return decrypt(account.accessTokenEnc);
  }

  const refreshed = await fetchJson<TikTokRefreshResponse>(
    "https://open.tiktokapis.com/v2/oauth/token/",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: env.TIKTOK_CLIENT_KEY,
        client_secret: env.TIKTOK_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: decrypt(account.refreshTokenEnc),
      }).toString(),
    }
  );

  await prisma.connectedAccount.update({
    where: { id: account.id },
    data: {
      accessTokenEnc: encrypt(refreshed.access_token),
      refreshTokenEnc: encrypt(refreshed.refresh_token),
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
    },
  });

  return refreshed.access_token;
}
