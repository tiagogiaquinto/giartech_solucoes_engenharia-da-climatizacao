import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const PROXIMITY_RADIUS_METERS = 100

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface ServiceOrderLocation {
  id: string
  order_number: string
  client_name?: string
  client_lat?: number | null
  client_lng?: number | null
  status: string
}

interface UseProximityDetectorOptions {
  employeeId: string | null
  onArrival?: (order: ServiceOrderLocation) => void
  enabled?: boolean
}

export function useProximityDetector({
  employeeId,
  onArrival,
  enabled = true,
}: UseProximityDetectorOptions) {
  const watchIdRef = useRef<number | null>(null)
  const alreadyTriggered = useRef<Set<string>>(new Set())
  const pendingOrders = useRef<ServiceOrderLocation[]>([])

  const loadPendingOrders = useCallback(async () => {
    if (!employeeId) return
    try {
      const { data } = await supabase
        .from('service_orders')
        .select('id, order_number, client_name, client_lat, client_lng, status')
        .in('status', ['pending', 'pendente', 'scheduled', 'agendado', 'in_progress', 'em_andamento'])
        .not('client_lat', 'is', null)
        .not('client_lng', 'is', null)

      pendingOrders.current = (data ?? []) as ServiceOrderLocation[]
    } catch {
      // silent
    }
  }, [employeeId])

  const checkProximity = useCallback(
    async (lat: number, lng: number) => {
      for (const order of pendingOrders.current) {
        if (alreadyTriggered.current.has(order.id)) continue
        if (!order.client_lat || !order.client_lng) continue

        const dist = haversineDistance(lat, lng, order.client_lat, order.client_lng)

        if (dist <= PROXIMITY_RADIUS_METERS) {
          alreadyTriggered.current.add(order.id)

          // Só muda para "em_atendimento" se ainda estiver pendente/agendado
          const isIdle = ['pending', 'pendente', 'scheduled', 'agendado'].includes(
            (order.status || '').toLowerCase()
          )
          if (isIdle) {
            await supabase
              .from('service_orders')
              .update({
                status: 'in_progress',
                started_at: new Date().toISOString(),
              })
              .eq('id', order.id)

            await supabase.from('notifications').insert({
              title: 'Chegada detectada',
              message: `Técnico chegou no local da OS #${order.order_number} — ${order.client_name || 'Cliente'}. Status atualizado para Em Atendimento.`,
              type: 'info',
              is_read: false,
              related_table: 'service_orders',
              related_id: order.id,
            })
          }

          onArrival?.(order)
        }
      }
    },
    [onArrival]
  )

  useEffect(() => {
    if (!enabled || !employeeId) return

    loadPendingOrders()

    const refreshInterval = setInterval(loadPendingOrders, 2 * 60 * 1000)

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => {
          checkProximity(pos.coords.latitude, pos.coords.longitude)
        },
        () => { /* permission denied or error — silent */ },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
      )
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      clearInterval(refreshInterval)
    }
  }, [enabled, employeeId, loadPendingOrders, checkProximity])
}
