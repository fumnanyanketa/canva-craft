import type { ConnectedAccount } from "@prisma/client";
import { prisma } from "../db.js";
import { decrypt, encrypt } from "../lib/crypto.js";
import type { ConnectedAccountData } from "../lib/oauth/types.js";

/** Persist (or refresh) a connected account, encrypting tokens at rest. */
export async function upsertConnectedAccount(
  userId: string,
  data: ConnectedAccountData
): Promise<ConnectedAccount> {
  const common = {
    userId,
    username: data.username,
    displayName: data.displayName,
    avatarUrl: data.avatarUrl,
    accessTokenEnc: encrypt(data.accessToken),
    refreshTokenEnc: data.refreshToken ? encrypt(data.refreshToken) : null,
    expiresAt: data.expiresAt ?? null,
    scopes: data.scopes,
    metaPageId: data.metaPageId ?? null,
  };

  return prisma.connectedAccount.upsert({
    where: {
      platform_externalId: {
        platform: data.platform,
        externalId: data.externalId,
      },
    },
    create: { platform: data.platform, externalId: data.externalId, ...common },
    update: common,
  });
}

/** Decrypt an account's access token for use in API calls. */
export function getAccessToken(account: ConnectedAccount): string {
  return decrypt(account.accessTokenEnc);
}

export function getRefreshToken(account: ConnectedAccount): string | null {
  return account.refreshTokenEnc ? decrypt(account.refreshTokenEnc) : null;
}

/** Public-safe view of an account (never leaks tokens). */
export function publicAccount(account: ConnectedAccount) {
  return {
    id: account.id,
    platform: account.platform,
    username: account.username,
    displayName: account.displayName,
    avatarUrl: account.avatarUrl,
    expiresAt: account.expiresAt,
    createdAt: account.createdAt,
  };
}
