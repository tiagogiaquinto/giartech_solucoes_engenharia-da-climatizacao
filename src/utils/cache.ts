interface CacheItem<T> {
  data: T
  timestamp: number
  expiresIn: number
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map()
  private defaultTTL = 5 * 60 * 1000

  set<T>(key: string, data: T, expiresIn: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) return null

    const isExpired = Date.now() - item.timestamp > item.expiresIn

    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    Array.from(this.cache.keys()).forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    })
  }

  clear(): void {
    this.cache.clear()
  }

  getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expiresIn?: number
  ): Promise<T> {
    const cached = this.get<T>(key)

    if (cached !== null) {
      return Promise.resolve(cached)
    }

    return fetchFn().then(data => {
      this.set(key, data, expiresIn)
      return data
    })
  }
}

export const cache = new CacheManager()
