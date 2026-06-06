import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { env } from "../env.js";

/**
 * Authenticated symmetric encryption for OAuth tokens at rest (AES-256-GCM).
 *
 * Format stored in the DB: base64(iv).base64(authTag).base64(ciphertext)
 * The key comes from TOKEN_ENCRYPTION_KEY (a base64-encoded 32-byte value).
 */

const KEY = Buffer.from(env.TOKEN_ENCRYPTION_KEY, "base64");

if (KEY.length !== 32) {
  throw new Error(
    `TOKEN_ENCRYPTION_KEY must decode to 32 bytes (got ${KEY.length}). ` +
      `Generate one with: openssl rand -base64 32`
  );
}

const IV_LENGTH = 12; // GCM standard nonce size

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted payload");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    KEY,
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
