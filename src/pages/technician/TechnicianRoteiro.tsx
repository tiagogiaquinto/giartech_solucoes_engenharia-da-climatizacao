import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Clock,
  User,
  Phone,
  ChevronRight,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Wrench
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

interface ServiceOrderCard {
  id: string
  order_number: string
  status: string
  priority: string
  title?: string
  description?: string
  client_name?: string
  client_phone?: string
  client_address?: string
  client_city?: string
  scheduled_at?: string
  scheduled_time?: string
  due_date?: string
  equipment?: string
  brand?: string
  model?: string
  progress_percent?: number
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-700' },
  in_progress: { label: 'Em Execucao', bg: 'bg-blue-100', text: 'text-blue-700' },
  completed: { label: 'Concluida', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-700' },
  on_hold: { label: 'Pausada', bg: 'bg-gray-100', text: 'text-gray-700' },
  pausado: { label: 'Pausada', bg: 'bg-gray-100', text: 'text-gray-700' }
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Urgente', color: 'bg-red-500' },
  high: { label: 'Alta', color: 'bg-orange-500' },
  medium: { label: 'Normal', color: 'bg-blue-500' },
  low: { label: 'Baixa', color: 'bg-gray-400' }
}

const TechnicianRoteiro = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const [orders, setOrders] = useState<ServiceOrderCard[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  })

  const loadOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const todayStr = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('v_technician_service_orders')
        .select('*')
        .or(`scheduled_at.gte.${todayStr},service_date.gte.${todayStr},status.in.(pending,in_progress)`)
        .order('scheduled_at', { ascending: true })

      if (error) {
        const { data: fallbackData } = await supabase
          .from('service_orders')
          .select(`
            id,
            order_number,
            status,
            priority,
            title,
            description,
            client_name,
            client_phone,
            client_address,
            client_city,
            scheduled_at,
            scheduled_time,
            due_date,
            equipment,
            brand,
            model,
            progress_percent
          `)
          .or(`scheduled_at.gte.${todayStr},service_date.gte.${todayStr},status.in.(pending,in_progress)`)
          .order('scheduled_at', { ascending: true })

        setOrders(fallbackData || [])
      } else {
        setOrders(data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar OSs:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [user])

  const openInMaps = (address: string, city?: string) => {
    const query = city ? `${address}, ${city}` : address
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank')
  }

  const formatTime = (dateStr?: string, timeStr?: string) => {
    if (timeStr) return timeStr
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return null
    }
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length
  const completedCount = orders.filter(o => o.status === 'completed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Carregando roteiro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Roteiro</h1>
          <p className="text-sm text-gray-500 capitalize">{today}</p>
        </div>
        <button
          onClick={() => loadOrders(true)}
          disabled={refreshing}
          className="p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-transform"
        >
          <RefreshCw className={`w-5 h-5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-xs text-amber-600 font-medium">Pendentes</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{inProgressCount}</p>
          <p className="text-xs text-blue-600 font-medium">Em Execucao</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{completedCount}</p>
          <p className="text-xs text-green-600 font-medium">Concluidas</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma OS agendada</h3>
          <p className="text-gray-500">Seu roteiro esta vazio para hoje</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {orders.map((order, index) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const priority = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.medium
              const time = formatTime(order.scheduled_at, order.scheduled_time)

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden w-full"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${priority.color}`}>
                            {priority.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {order.client_name || 'Cliente nao informado'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          OS #{order.order_number}
                        </p>
                      </div>
                      {time && (
                        <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-xl">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-bold text-gray-700">{time}</span>
                        </div>
                      )}
                    </div>

                    {order.equipment && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Wrench className="w-4 h-4 text-gray-400" />
                        <span>{order.equipment} {order.brand && `- ${order.brand}`} {order.model && order.model}</span>
                      </div>
                    )}

                    {order.client_address && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openInMaps(order.client_address!, order.client_city)
                        }}
                        className="flex items-center gap-2 text-sm text-blue-600 mb-2 active:opacity-70"
                      >
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{order.client_address}</span>
                        <Navigation className="w-3 h-3" />
                      </button>
                    )}

                    {order.client_phone && (
                      <a
                        href={`tel:${order.client_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-sm text-green-600 mb-3"
                      >
                        <Phone className="w-4 h-4" />
                        <span>{order.client_phone}</span>
                      </a>
                    )}

                    {order.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {order.description}
                      </p>
                    )}

                    {order.progress_percent !== undefined && order.progress_percent > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Progresso</span>
                          <span className="font-bold text-gray-700">{order.progress_percent}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              order.progress_percent === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${order.progress_percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => navigate(`/tecnico/os/${order.id}`)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold active:scale-[0.98] transition-all"
                    >
                      {order.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Ver Detalhes
                        </>
                      ) : order.status === 'in_progress' ? (
                        <>
                          <Wrench className="w-5 h-5" />
                          Continuar Execucao
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-5 h-5" />
                          Iniciar OS
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default TechnicianRoteiro
