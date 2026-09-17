import { LRUCache } from 'lru-cache';

// Global cache for authorization data, user sessions, and config.
// 5-minute TTL by default to ensure fast response, yet responsive to revocations.
const DEFAULT_TTL = 1000 * 60 * 5; 

export const cache = new LRUCache<string, any>({
  max: 5000,
  ttl: DEFAULT_TTL,
});

/**
 * Helper to fetch data with a cache wrapper.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL
): Promise<T> {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached as T;
  }

  const data = await fetcher();
  
  // We don't cache null/undefined errors to avoid poisoning, 
  // unless we specifically want negative caching. Here we allow caching nulls if the fetcher returns null.
  if (data !== undefined) {
    cache.set(key, data, { ttl: ttlMs });
  }
  
  return data;
}

export function invalidateCache(keyPrefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
}
