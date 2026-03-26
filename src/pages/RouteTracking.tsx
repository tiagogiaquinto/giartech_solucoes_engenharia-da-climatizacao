import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin,
  Navigation,
  Users,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Route,
  Zap,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import LiveTrackingMap, { TechnicianPosition, TrackingStop, computeETA } from '../components/LiveTrackingMap'
import RouteManager from '../components/RouteManager'

interface ArrivalLog {
  id: string
  event_type: string
  notes: string
  history_timestamp: string
  employees: { name: string } | null
  routes: { route_name: string } | null
}

interface RouteStopRow {
  id: string
  customer_name: string
  latitude: number | null
  longitude: number | null
  status: string
  service_order_id?: string
  route_id: string
}

interface LocRow {
  employee_id: string
  latitude: number
  longitude: number
  speed: number
  is_moving: boolean
  location_timestamp: string
  route_id?: string
  employees: { name: string; role: string } | null
  routes: { route_name: string; status: string } | null
}

export default function RouteTracking() {
  const [tab, setTab] = useState<'live' | 'manage'>('live')
  const [technicians, setTechnicians] = useState<TechnicianPosition[]>([])
  const [stops, setStops] = useState<TrackingStop[]>([])
  const [arrivals, setArrivals] = useState<ArrivalLog[]>([])
  const [stats, setStats] = useState({ active: 0, moving: 0, stopsTotal: 0, stopsCompleted: 0 })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const loadData = useCallback(async () => {
    try {
      const since = new Date(Date.now() - 30 * 60 * 1000).toISOString()

      const { data: locData } = await supabase
        .from('employee_locations')
        .select('employee_id, latitude, longitude, speed, is_moving, location_timestamp, route_id, employees(name, role), routes(route_name, status)')
        .gt('location_timestamp', since)
        .order('location_timestamp', { ascending: false })

      const latestMap = new Map<string, LocRow>()
      for (const row of (locData ?? []) as LocRow[]) {
        if (!latestMap.has(row.employee_id)) latestMap.set(row.employee_id, row)
      }

      const techPositions: TechnicianPosition[] = Array.from(latestMap.values()).map(r => ({
        employeeId: r.employee_id,
        name: r.employees?.name ?? 'Técnico',
        lat: r.latitude,
        lng: r.longitude,
        speed_kmh: r.speed ? r.speed * 3.6 : 0,
        updated_at: r.location_timestamp,
      }))
      setTechnicians(techPositions)

      const activeRouteIds = Array.from(latestMap.values())
        .filter(r => r.routes?.status === 'in_progress' && r.route_id)
        .map(r => r.route_id!)

      let trackingStops: TrackingStop[] = []
      if (activeRouteIds.length > 0) {
        const { data: stopsData } = await supabase
          .from('route_stops')
          .select('id, customer_name, latitude, longitude, status, service_order_id, route_id')
          .in('route_id', activeRouteIds)

        trackingStops = ((stopsData ?? []) as RouteStopRow[])
          .filter(s => s.latitude && s.longitude)
          .map(s => {
            const techRow = Array.from(latestMap.values()).find(t => t.route_id === s.route_id)
            const eta = techRow
              ? computeETA(techRow.latitude, techRow.longitude, s.latitude!, s.longitude!)
              : undefined
            return {
              id: s.service_order_id ?? s.id,
              label: s.customer_name,
              lat: s.latitude!,
              lng: s.longitude!,
              status: s.status as TrackingStop['status'],
              eta_minutes: eta,
            }
          })
      }
      setStops(trackingStops)

      const { data: arrivalData } = await supabase
        .from('route_history')
        .select('id, event_type, notes, history_timestamp, employees(name), routes(route_name)')
        .eq('event_type', 'arrival')
        .order('history_timestamp', { ascending: false })
        .limit(20)
      setArrivals((arrivalData ?? []) as unknown as ArrivalLog[])

      setStats({
        active: latestMap.size,
        moving: Array.from(latestMap.values()).filter(r => r.is_moving).length,
        stopsTotal: trackingStops.length,
        stopsCompleted: trackingStops.filter(s => s.status === 'completed').length,
      })
      setLastRefresh(new Date())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const statCards = [
    { label: 'Técnicos Ativos', value: stats.active, icon: <Users className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Em Movimento', value: stats.moving, icon: <Navigation className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Paradas Hoje', value: stats.stopsTotal, icon: <MapPin className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50' },
    { label: 'Concluídas', value: stats.stopsCompleted, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Route className="w-6 h-6 text-blue-600" />
            Rastreamento de Rotas
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Atualizado: {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setTab('live')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === 'live' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              Ao Vivo
            </button>
            <button
              onClick={() => setTab('manage')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === 'manage' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              Gerenciar
            </button>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {tab === 'manage' ? (
        <RouteManager />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(card => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                  {card.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live map */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  Mapa da Frota — Tempo Real
                </h2>
                {technicians.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {technicians.length} online
                  </span>
                )}
              </div>

              {technicians.length === 0 && stops.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Navigation className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Nenhum técnico em campo agora</p>
                  <p className="text-xs text-gray-400 mt-1">As posições aparecem quando as rotas são iniciadas no app do técnico</p>
                </div>
              ) : (
                <div className="h-96">
                  <LiveTrackingMap
                    technicians={technicians}
                    stops={stops}
                    height="100%"
                    zoom={12}
                    showGeofenceRings
                  />
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="space-y-4">
              {/* Technician list */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Técnicos em Campo
                  </h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {technicians.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-gray-400 text-center">Nenhum técnico ativo</p>
                  ) : (
                    technicians.map(tech => {
                      const mins = Math.floor((Date.now() - new Date(tech.updated_at).getTime()) / 60000)
                      const nextStop = stops.find(s => s.status !== 'completed')
                      return (
                        <div key={tech.employeeId} className="px-5 py-3.5 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 font-bold text-blue-700 text-sm">
                            {tech.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{tech.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs font-medium flex items-center gap-1 ${(tech.speed_kmh ?? 0) > 2 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                <Navigation className="w-3 h-3" />
                                {(tech.speed_kmh ?? 0) > 2 ? `${Math.round(tech.speed_kmh!)} km/h` : 'Parado'}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {mins < 1 ? 'agora' : `${mins} min atrás`}
                              </span>
                            </div>
                            {nextStop && (
                              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 truncate">
                                <Zap className="w-3 h-3 flex-shrink-0" />
                                Próx: {nextStop.label}
                                {nextStop.eta_minutes !== undefined && ` · ~${nextStop.eta_minutes} min`}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Arrival log */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    Chegadas Detectadas
                  </h2>
                </div>
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {arrivals.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-gray-400 text-center">Nenhuma chegada registrada</p>
                  ) : (
                    arrivals.map(log => (
                      <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                        <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{log.employees?.name ?? 'Técnico'}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {log.notes?.replace('Chegada automática detectada: ', '') ?? ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(log.history_timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* No stops tip */}
          {technicians.length > 0 && stops.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Rotas sem paradas cadastradas</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Vá até a aba "Gerenciar" para adicionar paradas às rotas ativas e ver os marcadores no mapa com ETA.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
