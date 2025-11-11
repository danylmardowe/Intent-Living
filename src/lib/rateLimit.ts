// ✅ src/lib/rateLimit.ts
const buckets = new Map<string, { tokens: number; updated: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const entry = buckets.get(key) ?? { tokens: limit, updated: now };
  const elapsed = now - entry.updated;

  if (elapsed > windowMs) {
    entry.tokens = limit;
    entry.updated = now;
  }

  if (entry.tokens <= 0) {
    buckets.set(key, entry);
    return { allowed: false, remaining: 0, resetMs: windowMs - elapsed };
  }

  entry.tokens -= 1;
  entry.updated = now;
  buckets.set(key, entry);
  return { allowed: true, remaining: entry.tokens, resetMs: windowMs - elapsed };
}
