import type { createClient } from "@/lib/supabase/client";

// Cache configuration following existing patterns
const CACHE_KEYS = {
  USER_PROFILE: "user_profile",
  CATEGORIES: "categories",
  TASK_STATS: "task_stats",
  TASKS_ALL: "tasks_all",
} as const;

const CACHE_TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
} as const;

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = CACHE_TTL.MEDIUM): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache key for user-specific data
  getUserKey(userId: string, key: string): string {
    return `${userId}:${key}`;
  }
}

export const memoryCache = new MemoryCache();

// Enhanced caching utilities following existing patterns
export const cacheUtils = {
  // ✅ Enhanced profile caching with proper async handling
  async getCachedProfile(userId: string) {
    const cacheKey = memoryCache.getUserKey(userId, CACHE_KEYS.USER_PROFILE);
    const cached = memoryCache.get(cacheKey);

    if (cached) {
      return { data: cached, fromCache: true };
    }

    return { data: null, fromCache: false };
  },

  setCachedProfile(userId: string, profile: any) {
    const cacheKey = memoryCache.getUserKey(userId, CACHE_KEYS.USER_PROFILE);
    memoryCache.set(cacheKey, profile, CACHE_TTL.LONG);
  },

  // Cache all tasks (our single source)
  getCachedAllTasks(userId: string) {
    const cacheKey = memoryCache.getUserKey(userId, CACHE_KEYS.TASKS_ALL);
    return memoryCache.get(cacheKey);
  },

  setCachedAllTasks(userId: string, tasks: any[]) {
    const cacheKey = memoryCache.getUserKey(userId, CACHE_KEYS.TASKS_ALL);
    memoryCache.set(cacheKey, tasks, CACHE_TTL.SHORT);
  },

  // Cache categories with shorter TTL
  async getCachedCategories(userId: string) {
    const cacheKey = memoryCache.getUserKey(userId, CACHE_KEYS.CATEGORIES);
    return memoryCache.get(cacheKey);
  },

  setCachedCategories(userId: string, categories: any[]) {
    const cacheKey = memoryCache.getUserKey(userId, CACHE_KEYS.CATEGORIES);
    memoryCache.set(cacheKey, categories, CACHE_TTL.MEDIUM);
  },

  // Updated to use our single source cache
  getCachedTaskStats(userId: string) {
    return this.getCachedAllTasks(userId);
  },

  setCachedTaskStats(userId: string, stats: any) {
    this.setCachedAllTasks(userId, stats);
  },

  // ✅ Enhanced cache invalidation
  invalidateUserCache(userId: string) {
    memoryCache.invalidate(memoryCache.getUserKey(userId, CACHE_KEYS.USER_PROFILE));
    memoryCache.invalidate(memoryCache.getUserKey(userId, CACHE_KEYS.CATEGORIES));
    memoryCache.invalidate(memoryCache.getUserKey(userId, CACHE_KEYS.TASK_STATS));
    memoryCache.invalidate(memoryCache.getUserKey(userId, CACHE_KEYS.TASKS_ALL));
  },
};

// Query optimization utilities (kept your existing logic)
export const queryOptimization = {
  // Debounce search queries
  debounceSearch: (callback: Function, delay = 300) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback.apply(null, args), delay);
    };
  },

  // Batch multiple queries
  batchQueries: async (queries: Promise<any>[]) => {
    try {
      const results = await Promise.allSettled(queries);
      return results.map((result) => (result.status === "fulfilled" ? result.value : null));
    } catch (error) {
      console.error("Batch query error:", error);
      return [];
    }
  },

  // Optimize Supabase queries with select optimization
  optimizeTaskQuery: (supabase: ReturnType<typeof createClient>) => {
    return supabase.from("tasks").select(`
        id,
        title,
        description,
        is_completed,
        priority,
        due_date,
        created_at,
        updated_at,
        category:categories(id, name, color),
        subtasks(id, title, is_completed)
      `);
  },
};
