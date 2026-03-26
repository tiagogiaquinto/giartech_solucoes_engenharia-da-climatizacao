import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Navigation,
  Clock,
  TrendingUp,
  CheckCircle,
  Play,
  Pause,
  Square,
  Map as MapIcon,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'
import LiveTrackingMap, { TrackingStop, TechnicianPosition, computeETA } from '../../components/LiveTrackingMap'

const PROXIMITY_M = 100

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const MobileRoutes = () => {
  const { user } = useUser()
  const [activeRoute, setActiveRoute] = useState<any>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [speed, setSpeed] = useState(0)
  const [pendingStops, setPendingStops] = useState<TrackingStop[]>([])
  const [mapExpanded, setMapExpanded] = useState(true)
  const [arrivedAt, setArrivedAt] = useState<string | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const triggeredRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    loadRoutes()
    loadActiveRoute()
  }, [user])

  useEffect(() => {
    if (!activeRoute?.id) return
    loadPendingStops(activeRoute.id)
  }, [activeRoute])

  const saveLocation = useCallback(async (lat: number, lng: number, spd: number) => {
    if (!user?.employee_id || !activeRoute?.id) return
    try {
      await supabase.from('employee_locations').insert({
        employee_id: user.employee_id,
        route_id: activeRoute.id,
        latitude: lat,
        longitude: lng,
        speed: spd,
        is_moving: spd > 1,
        location_timestamp: new Date().toISOString(),
      })
    } catch {
      // best-effort
    }
  }, [user?.employee_id, activeRoute?.id])

  const checkGeofence = useCallback(async (lat: number, lng: number) => {
    if (!user?.employee_id || !activeRoute?.id) return
    for (const stop of pendingStops) {
      if (triggeredRef.current.has(stop.id)) continue
      const dist = haversineM(lat, lng, stop.lat, stop.lng)
      if (dist <= PROXIMITY_M) {
        triggeredRef.current.add(stop.id)
        setArrivedAt(stop.label)
        setTimeout(() => setArrivedAt(null), 7000)
        try {
          await supabase.from('route_history').insert({
            route_id: activeRoute.id,
            employee_id: user.employee_id,
            latitude: lat,
            longitude: lng,
            event_type: 'arrival',
            notes: `Chegada automática detectada: ${stop.label}`,
          })
          await supabase
            .from('service_orders')
            .update({ status: 'in_progress', started_at: new Date().toISOString() })
            .eq('id', stop.id)
          setPendingStops(prev =>
            prev.map(s => s.id === stop.id ? { ...s, status: 'in_progress' as const } : s)
          )
        } catch {
          // best-effort
        }
      }
    }
  }, [pendingStops, user?.employee_id, activeRoute?.id])

  useEffect(() => {
    if (!tracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => {
          const { latitude: lat, longitude: lng, speed: spd } = pos.coords
          const kmh = spd ? spd * 3.6 : 0
          setCurrentPosition({ lat, lng })
          setSpeed(kmh)
          saveLocation(lat, lng, kmh)
          checkGeofence(lat, lng)
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 8000, timeout: 15000 }
      )
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [tracking, saveLocation, checkGeofence])

  const loadPendingStops = async (routeId: string) => {
    try {
      const { data } = await supabase
        .from('route_stops')
        .select('id, customer_name, address, latitude, longitude, status, service_order_id')
        .eq('route_id', routeId)
        .order('stop_order', { ascending: true })

      const stops: TrackingStop[] = (data || []).map((s: any) => ({
        id: s.service_order_id || s.id,
        label: s.customer_name,
        lat: s.latitude,
        lng: s.longitude,
        status: s.status,
        eta_minutes:
          currentPosition && s.latitude && s.longitude
            ? computeETA(currentPosition.lat, currentPosition.lng, s.latitude, s.longitude, speed > 5 ? speed : 30)
            : undefined,
      })).filter((s: TrackingStop) => s.lat && s.lng)

      setPendingStops(stops)
    } catch {
      // silent
    }
  }

  const loadRoutes = async () => {
    if (!user?.employee_id) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('routes')
        .select('*')
        .eq('assigned_employee_id', user.employee_id)
        .gte('route_date', today)
        .order('created_at', { ascending: false })
      setRoutes(data || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const loadActiveRoute = async () => {
    if (!user?.employee_id) return
    try {
      const { data } = await supabase
        .from('routes')
        .select('*')
        .eq('assigned_employee_id', user.employee_id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) { setActiveRoute(data); setTracking(true) }
    } catch { /* noop */ }
  }

  const startRoute = async () => {
    if (!user?.employee_id) return
    try {
      const today = new Date().toISOString().split('T')[0]
      let pos: { lat: number; lng: number } | null = null
      await new Promise<void>(resolve => {
        navigator.geolocation.getCurrentPosition(
          p => { pos = { lat: p.coords.latitude, lng: p.coords.longitude }; resolve() },
          () => resolve(),
          { enableHighAccuracy: true, timeout: 8000 }
        )
      })

      const { data } = await supabase
        .from('routes')
        .insert({
          route_name: `Rota ${today}`,
          route_date: today,
          assigned_employee_id: user.employee_id,
          status: 'in_progress',
          start_time: new Date().toISOString(),
        })
        .select()
        .single()

      if (data) {
        setActiveRoute(data)
        setTracking(true)
        if (pos) setCurrentPosition(pos)
        if (user.employee_id && pos) {
          await supabase.from('route_history').insert({
            route_id: data.id,
            employee_id: user.employee_id,
            latitude: (pos as any).lat,
            longitude: (pos as any).lng,
            event_type: 'start',
          })
        }
      }
    } catch { /* silent */ }
  }

  const pauseRoute = async () => {
    setTracking(false)
    if (activeRoute && user?.employee_id && currentPosition) {
      await supabase.from('route_history').insert({
        route_id: activeRoute.id,
        employee_id: user.employee_id,
        latitude: currentPosition.lat,
        longitude: currentPosition.lng,
        event_type: 'pause',
      })
    }
  }

  const resumeRoute = async () => {
    setTracking(true)
    if (activeRoute && user?.employee_id && currentPosition) {
      await supabase.from('route_history').insert({
        route_id: activeRoute.id,
        employee_id: user.employee_id,
        latitude: currentPosition.lat,
        longitude: currentPosition.lng,
        event_type: 'resume',
      })
    }
  }

  const endRoute = async () => {
    if (!activeRoute) return
    try {
      await supabase
        .from('routes')
        .update({ end_time: new Date().toISOString(), status: 'completed' })
        .eq('id', activeRoute.id)
      if (user?.employee_id && currentPosition) {
        await supabase.from('route_history').insert({
          route_id: activeRoute.id,
          employee_id: user.employee_id,
          latitude: currentPosition.lat,
          longitude: currentPosition.lng,
          event_type: 'stop',
        })
      }
      setActiveRoute(null)
      setTracking(false)
      setPendingStops([])
      triggeredRef.current.clear()
      loadRoutes()
    } catch { /* silent */ }
  }

  const calculateDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

  const techPoint: TechnicianPosition[] = currentPosition
    ? [{
        employeeId: user?.employee_id || 'me',
        name: user?.name || 'Eu',
        lat: currentPosition.lat,
        lng: currentPosition.lng,
        speed_kmh: speed,
        updated_at: new Date().toISOString(),
      }]
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando rotas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Rotas</h1>
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-green-600" />
          {tracking && <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />}
        </div>
      </div>

      {/* Geofence arrival banner */}
      <AnimatePresence>
        {arrivedAt && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-600 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg"
          >
            <Target className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Chegada detectada!</p>
              <p className="text-xs text-emerald-100">{arrivedAt} — OS atualizada para Em Atendimento</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeRoute ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-5 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-green-100">Rota Ativa</p>
                <p className="text-lg font-bold">{activeRoute.route_name || 'Em Andamento'}</p>
              </div>
            </div>
            {tracking && (
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                <span className="text-xs font-semibold">Rastreando</span>
              </div>
            )}
          </div>

          {/* Speed + duration */}
          <div className="bg-white/10 rounded-2xl p-3 mb-3 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-green-100 mb-0.5">Velocidade</p>
              <p className="font-bold text-base">{speed > 0 ? `${Math.round(speed)} km/h` : 'Parado'}</p>
            </div>
            <div>
              <p className="text-xs text-green-100 mb-0.5">Início</p>
              <p className="font-bold text-base">
                {new Date(activeRoute.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-100 mb-0.5">Duração</p>
              <p className="font-bold text-base">{calculateDuration(activeRoute.start_time)}</p>
            </div>
          </div>

          {/* ETA stops chips */}
          {pendingStops.filter(s => s.status !== 'completed').length > 0 && (
            <div className="bg-white/10 rounded-2xl px-3 py-2.5 mb-3">
              <p className="text-xs text-green-100 font-semibold mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Próximas Paradas
              </p>
              <div className="space-y-1.5">
                {pendingStops.filter(s => s.status !== 'completed').slice(0, 4).map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <span className="text-xs text-white truncate max-w-[60%]">
                      {i + 1}. {s.label}
                    </span>
                    {s.eta_minutes !== undefined && (
                      <span className="text-xs font-bold text-yellow-300">
                        ~{s.eta_minutes} min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live map */}
          {(currentPosition || pendingStops.length > 0) && (
            <div className="rounded-2xl overflow-hidden mb-3 bg-white/10">
              <button
                onClick={() => setMapExpanded(e => !e)}
                className="w-full flex items-center justify-between px-3 py-2 text-white/80 text-xs font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  <MapIcon className="w-3.5 h-3.5" /> Mapa ao Vivo
                </span>
                {mapExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {mapExpanded && (
                <div className="h-52">
                  <LiveTrackingMap
                    technicians={techPoint}
                    stops={pendingStops}
                    height="100%"
                    zoom={15}
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {tracking ? (
              <button
                onClick={pauseRoute}
                className="bg-yellow-500 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Pause className="w-5 h-5" />
                Pausar
              </button>
            ) : (
              <button
                onClick={resumeRoute}
                className="bg-blue-500 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Retomar
              </button>
            )}
            <button
              onClick={endRoute}
              className="col-span-2 bg-red-500 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5" />
              Finalizar Rota
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Navigation className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma rota ativa</h3>
          <p className="text-gray-600 mb-6">Inicie uma nova rota para começar o rastreamento</p>
          <button
            onClick={startRoute}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" />
            Iniciar Nova Rota
          </button>
        </motion.div>
      )}

      {/* Histórico */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Histórico de Rotas</h2>
        {routes.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
            <MapIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma rota registrada</h3>
            <p className="text-gray-600">Suas rotas completadas aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((route: any) => (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                        route.status === 'completed' ? 'bg-green-500' :
                        route.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        {route.status === 'completed' ? 'Concluída' :
                         route.status === 'in_progress' ? 'Em Andamento' : 'Pausada'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{route.route_name || `Rota ${route.route_date}`}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(route.route_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <MapIcon className="w-6 h-6 text-gray-300" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {route.start_time && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">Início</span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm">
                        {new Date(route.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                  {route.end_time && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">Término</span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm">
                        {new Date(route.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
                {route.start_time && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                    <TrendingUp className="w-4 h-4" />
                    <span>Duração: <span className="font-bold text-gray-800">{calculateDuration(route.start_time, route.end_time)}</span></span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileRoutes
