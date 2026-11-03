import { env } from "cloudflare:workers";

export function database() {
  if (!env.DB) throw new Error("The shared community database is not connected yet.");
  return env.DB;
}

export async function jsonBody<T>(request: Request): Promise<T | null> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 8_000) return null;
  try { return await request.json() as T; }
  catch { return null; }
}

let lastCleanupHour = -1;
export async function allowWrite(request: Request, action: string, maxPerMinute: number) {
  const db = database();
  const address = request.headers.get("cf-connecting-ip") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address));
  const fingerprint = [...new Uint8Array(digest)].slice(0, 12).map((x) => x.toString(16).padStart(2, "0")).join("");
  const now = Date.now();
  const bucket = Math.floor(now / 60_000);
  const scope = `${action}:${fingerprint}`;
  const row = await db.prepare(`
    INSERT INTO rate_limits (scope, bucket, hits, updated_at) VALUES (?, ?, 1, ?)
    ON CONFLICT(scope) DO UPDATE SET
      hits = CASE WHEN rate_limits.bucket = excluded.bucket THEN rate_limits.hits + 1 ELSE 1 END,
      bucket = excluded.bucket,
      updated_at = excluded.updated_at
    RETURNING hits
  `).bind(scope, bucket, now).first<{ hits: number }>();
  const hour = Math.floor(now / 3_600_000);
  if (hour !== lastCleanupHour) {
    lastCleanupHour = hour;
    await db.prepare("DELETE FROM rate_limits WHERE updated_at < ?").bind(now - 86_400_000).run();
  }
  return (row?.hits ?? maxPerMinute + 1) <= maxPerMinute;
}

export function validClientId(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 100;
}
