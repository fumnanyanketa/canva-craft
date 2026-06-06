import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../env.js";
import type { Platform } from "@prisma/client";

/**
 * The OAuth callback is a top-level browser redirect, so it can't carry our
 * Bearer token. We instead encode *who* started the flow into a short-lived,
 * signed `state` param. The signature is the CSRF defense.
 */
interface StatePayload {
  userId: string;
  platform: Platform;
  nonce: string;
}

export function signState(userId: string, platform: Platform): string {
  const payload: StatePayload = {
    userId,
    platform,
    nonce: randomBytes(8).toString("hex"),
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "10m" });
}

export function verifyState(state: string): StatePayload {
  return jwt.verify(state, env.JWT_SECRET) as StatePayload;
}
