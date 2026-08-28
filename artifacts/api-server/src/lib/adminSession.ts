import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const ADMIN_COOKIE = "nl_admin";
export const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

function sessionSecret(): string | null {
  return process.env.SESSION_SECRET || null;
}

function signPayload(payload: string, key: string): string {
  return createHmac("sha256", key)
    .update(`newsletter-admin:${payload}`)
    .digest("base64url");
}

/** Returns null when SESSION_SECRET is missing (surface a 503, never sign with a fallback). */
export function createSessionToken(): string | null {
  const key = sessionSecret();
  if (!key) return null;
  const exp = String(Date.now() + SESSION_MAX_AGE_MS);
  return `${exp}.${signPayload(exp, key)}`;
}

export function isValidSessionToken(token: unknown): boolean {
  const key = sessionSecret();
  if (!key || typeof token !== "string") return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d{10,16}$/.test(exp)) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = signPayload(exp, key);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Constant-time comparison; hashing first hides the password length. */
export function passwordMatches(candidate: string, actual: string): boolean {
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(actual).digest();
  return timingSafeEqual(a, b);
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  if (!isValidSessionToken(cookies?.[ADMIN_COOKIE])) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function newUnsubscribeToken(): string {
  return randomBytes(24).toString("base64url");
}
