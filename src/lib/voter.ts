import { createHmac } from "node:crypto";

/** Salted (HMAC) hash of the visitor IP – the raw IP is never stored. */
export function voterHash(ip: string): string {
  const salt = process.env.SESSION_SECRET;
  if (!salt) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", salt).update(`vote:${ip}`).digest("hex");
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** UTC calendar day, e.g. "2026-10-13". */
export function voteDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
