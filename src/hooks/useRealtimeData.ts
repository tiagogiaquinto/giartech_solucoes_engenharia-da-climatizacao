import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeSubscriptionOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
  onChange?: (payload: any) => void
}

export function useRealtimeSubscription(options: RealtimeSubscriptionOptions) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const channelName = `${options.table}-changes-${Date.now()}`

    const newChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: options.event || '*',
          schema: 'public',
          table: options.table,
          filter: options.filter
        } as any,
        (payload: any) => {
          console.log(`Realtime event on ${options.table}:`, payload)

          // Call specific handlers
          if (payload.eventType === 'INSERT' && options.onInsert) {
            options.onInsert(payload.new)
          } else if (payload.eventType === 'UPDATE' && options.onUpdate) {
            options.onUpdate(payload.new)
          } else if (payload.eventType === 'DELETE' && options.onDelete) {
            options.onDelete(payload.old)
          }

          // Call general handler
          if (options.onChange) {
            options.onChange(payload)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true)
          console.log(`✅ Subscribed to ${options.table}`)
        }
      })

    setChannel(newChannel)

    return () => {
      console.log(`🔌 Unsubscribing from ${options.table}`)
      newChannel.unsubscribe()
      setIsSubscribed(false)
    }
  }, [options.table, options.event, options.filter])

  return { isSubscribed, channel }
}

// Hook específico para dashboard em tempo real
export function useRealtimeDashboard() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Subscribe to service orders changes
  useRealtimeSubscription({
    table: 'service_orders',
    onChange: () => {
      setLastUpdate(new Date())
    }
  })

  // Subscribe to finance entries changes
  useRealtimeSubscription({
    table: 'finance_entries',
    onChange: () => {
      setLastUpdate(new Date())
    }
  })

  // Subscribe to inventory changes
  useRealtimeSubscription({
    table: 'inventory_items',
    onChange: () => {
      setLastUpdate(new Date())
    }
  })

  return { lastUpdate }
}

// Hook genérico para qualquer tabela
export function useRealtimeTable<T = any>(
  tableName: string,
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: fetchedData, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setData(fetchedData || [])
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error)
    } finally {
      setLoading(false)
    }
  }, [tableName])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtimeSubscription({
    table: tableName,
    onChange: () => {
      loadData()
    }
  })

  return { data, loading, reload: loadData }
}

// Hook para estatísticas em tempo real
export function useRealtimeStats() {
  const [stats, setStats] = useState({
    totalServiceOrders: 0,
    pendingServiceOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    lowStockItems: 0
  })

  const loadStats = useCallback(async () => {
    try {
      // Carregar OSs
      const { count: totalSO } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })

      const { count: pendingSO } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_progress'])

      // Carregar receitas
      const { data: revenueData } = await supabase
        .from('finance_entries')
        .select('amount')
        .eq('type', 'income')
        .eq('status', 'paid')

      const totalRev = revenueData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0

      // Carregar pagamentos pendentes
      const { data: pendingData } = await supabase
        .from('finance_entries')
        .select('amount')
        .eq('type', 'income')
        .eq('status', 'pending')

      const pendingPay = pendingData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0

      // Carregar estoque baixo
      const { count: lowStock } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .lte('quantity', 'minimum_stock')

      setStats({
        totalServiceOrders: totalSO || 0,
        pendingServiceOrders: pendingSO || 0,
        totalRevenue: totalRev,
        pendingPayments: pendingPay,
        lowStockItems: lowStock || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Subscribe to changes
  useRealtimeSubscription({
    table: 'service_orders',
    onChange: loadStats
  })

  useRealtimeSubscription({
    table: 'finance_entries',
    onChange: loadStats
  })

  useRealtimeSubscription({
    table: 'inventory_items',
    onChange: loadStats
  })

  return stats
}
