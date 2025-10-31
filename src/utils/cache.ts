export const getCache = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

export const setCache = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export const cache = { 
  get: getCache, 
  set: setCache,
  invalidate: (key: string) => localStorage.removeItem(key),
  invalidatePattern: (pattern: string) => {},
  getOrFetch: async (key: string, fn: () => Promise<any>) => {
    const cached = getCache(key)
    if (cached) return cached
    const data = await fn()
    setCache(key, data)
    return data
  }
}
