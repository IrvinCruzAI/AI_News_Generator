/**
 * Simple in-memory cache with TTL
 * Reduces duplicate API calls
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    // Return cached if still valid
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`[Cache] Hit: ${key}`);
      return cached.data;
    }

    // Fetch fresh data
    console.log(`[Cache] Miss: ${key}`);
    const data = await fetcher();
    
    // Store in cache
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clean up old entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new Cache();

// Run cleanup every 10 minutes
setInterval(() => cache.cleanup(), 10 * 60 * 1000);
