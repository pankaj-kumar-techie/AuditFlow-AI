// Simple in-memory cache to speed up PDF downloads
// In production with multiple instances, use Redis or a Database.
const auditCache = new Map<string, any>();

export function cacheAudit(url: string, data: any) {
  const domain = new URL(url).hostname;
  auditCache.set(domain, { data, timestamp: Date.now() });
  
  // Cleanup old cache entries (older than 10 mins)
  const tenMins = 10 * 60 * 1000;
  for (const [key, value] of auditCache.entries()) {
    if (Date.now() - value.timestamp > tenMins) {
      auditCache.delete(key);
    }
  }
}

export function getCachedAudit(url: string) {
  const domain = new URL(url).hostname;
  const entry = auditCache.get(domain);
  if (entry && (Date.now() - entry.timestamp < 10 * 60 * 1000)) {
    return entry.data;
  }
  return null;
}
