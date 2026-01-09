import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'giartech-system'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      return result
    } catch (error: any) {
      lastError = error

      const isRateLimitError =
        error?.message?.includes('rate limit') ||
        error?.message?.includes('too many requests') ||
        error?.status === 429 ||
        error?.code === 'PGRST301'

      const isTimeoutError =
        error?.message?.includes('timeout') ||
        error?.message?.includes('aborted')

      if (attempt < maxRetries && (isRateLimitError || isTimeoutError)) {
        const backoffDelay = delayMs * Math.pow(2, attempt)
        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${backoffDelay}ms due to:`, error.message)
        await sleep(backoffDelay)
        continue
      }

      throw error
    }
  }

  throw lastError
}

export async function deleteWithRetry(
  table: string,
  id: string
): Promise<void> {
  await withRetry(async () => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw error
  })
}

export async function bulkDelete(
  table: string,
  ids: string[],
  delayBetweenDeletes: number = 100
): Promise<{ success: string[], failed: Array<{ id: string, error: string }> }> {
  const success: string[] = []
  const failed: Array<{ id: string, error: string }> = []

  for (let i = 0; i < ids.length; i++) {
    try {
      await deleteWithRetry(table, ids[i])
      success.push(ids[i])

      if (i < ids.length - 1 && delayBetweenDeletes > 0) {
        await sleep(delayBetweenDeletes)
      }
    } catch (error: any) {
      console.error(`Failed to delete ${table} with id ${ids[i]}:`, error)
      failed.push({
        id: ids[i],
        error: error.message || 'Unknown error'
      })
    }
  }

  return { success, failed }
}

export * from './database-services'
