// cache.ts
// In-memory cache for audit results.
// In multi-instance production: replace with Redis.
// TTL: 10 minutes (enough to serve repeated PDF downloads without re-running APIs).

interface CacheEntry {
  data: any;
  timestamp: number;
}

const auditCache = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export function cacheAudit(url: string, data: any): void {
  const domain = new URL(url).hostname;

  // Prune stale entries on every write
  for (const [key, entry] of auditCache.entries()) {
    if (Date.now() - entry.timestamp > TTL_MS) auditCache.delete(key);
  }

  auditCache.set(domain, { data, timestamp: Date.now() });
}

export function getCachedAudit(url: string): any | null {
  const domain = new URL(url).hostname;
  const entry = auditCache.get(domain);
  if (entry && Date.now() - entry.timestamp < TTL_MS) return entry.data;
  return null;
}

export function invalidateCache(url: string): void {
  auditCache.delete(new URL(url).hostname);
}