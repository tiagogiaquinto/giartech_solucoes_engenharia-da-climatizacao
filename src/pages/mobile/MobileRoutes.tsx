import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin,
  Navigation,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle,
  Play,
  Pause,
  Square,
  Map as MapIcon
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

const MobileRoutes = () => {
  const { user } = useUser()
  const [activeRoute, setActiveRoute] = useState<any>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    loadRoutes()
    loadActiveRoute()
  }, [user])

  useEffect(() => {
    let watchId: number

    if (tracking) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      )
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [tracking])

  const loadRoutes = async () => {
    if (!user?.employee_id) return

    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('route_tracking')
        .select('*')
        .eq('employee_id', user.employee_id)
        .gte('route_date', today)
        .order('created_at', { ascending: false })

      setRoutes(data || [])
    } catch (err) {
      console.error('Error loading routes:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadActiveRoute = async () => {
    if (!user?.employee_id) return

    try {
      const { data, error } = await supabase
        .from('route_tracking')
        .select('*')
        .eq('employee_id', user.employee_id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setActiveRoute(data)
        setTracking(true)
      }
    } catch (err) {
      // No active route
    }
  }

  const startRoute = async () => {
    if (!user?.employee_id) return

    try {
      const { data, error } = await supabase
        .from('route_tracking')
        .insert({
          employee_id: user.employee_id,
          route_date: new Date().toISOString().split('T')[0],
          start_time: new Date().toISOString(),
          status: 'in_progress',
          route_points: currentPosition ? [currentPosition] : []
        })
        .select()
        .single()

      if (data) {
        setActiveRoute(data)
        setTracking(true)
      }
    } catch (err) {
      console.error('Error starting route:', err)
    }
  }

  const pauseRoute = async () => {
    setTracking(false)
  }

  const resumeRoute = async () => {
    setTracking(true)
  }

  const endRoute = async () => {
    if (!activeRoute) return

    try {
      const { error } = await supabase
        .from('route_tracking')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', activeRoute.id)

      setActiveRoute(null)
      setTracking(false)
      loadRoutes()
    } catch (err) {
      console.error('Error ending route:', err)
    }
  }

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    window.open(url, '_blank')
  }

  const calculateDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Rotas</h1>
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-green-600" />
          {tracking && (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>

      {/* Active Route Card */}
      {activeRoute ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-green-100">Rota Ativa</p>
                <p className="text-xl font-bold">Em Andamento</p>
              </div>
            </div>
            {tracking && (
              <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">Rastreando</span>
              </div>
            )}
          </div>

          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-green-100 mb-1">Iniciado</p>
                <p className="text-lg font-bold">
                  {new Date(activeRoute.start_time).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-100 mb-1">Duração</p>
                <p className="text-lg font-bold">
                  {calculateDuration(activeRoute.start_time)}
                </p>
              </div>
            </div>
          </div>

          {currentPosition && (
            <button
              onClick={() => openInMaps(currentPosition.lat, currentPosition.lng)}
              className="w-full bg-white text-green-700 px-4 py-3 rounded-xl font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <MapIcon className="w-5 h-5" />
              Ver no Mapa
            </button>
          )}

          <div className="grid grid-cols-3 gap-2">
            {tracking ? (
              <button
                onClick={pauseRoute}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Pause className="w-5 h-5" />
                Pausar
              </button>
            ) : (
              <button
                onClick={resumeRoute}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Retomar
              </button>
            )}
            <button
              onClick={endRoute}
              className="col-span-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Nenhuma rota ativa
          </h3>
          <p className="text-gray-600 mb-6">
            Inicie uma nova rota para começar o rastreamento
          </p>
          <button
            onClick={startRoute}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-2xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" />
            Iniciar Nova Rota
          </button>
        </motion.div>
      )}

      {/* Routes History */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Histórico de Rotas</h2>
        {routes.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
            <MapIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma rota registrada</h3>
            <p className="text-gray-600">
              Suas rotas completadas aparecerão aqui
            </p>
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                        route.status === 'completed' ? 'bg-green-500' :
                        route.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {route.status === 'completed' ? '✓ Concluída' :
                         route.status === 'in_progress' ? '▶ Em Andamento' : 'Pausada'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(route.route_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <MapIcon className="w-6 h-6 text-gray-400" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600 font-medium">Início</span>
                    </div>
                    <p className="font-bold text-gray-900">
                      {new Date(route.start_time).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {route.end_time && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-gray-600" />
                        <span className="text-xs text-gray-600 font-medium">Término</span>
                      </div>
                      <p className="font-bold text-gray-900">
                        {new Date(route.end_time).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {route.end_time && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>Duração: <span className="font-bold text-gray-900">
                        {calculateDuration(route.start_time, route.end_time)}
                      </span></span>
                    </div>
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
