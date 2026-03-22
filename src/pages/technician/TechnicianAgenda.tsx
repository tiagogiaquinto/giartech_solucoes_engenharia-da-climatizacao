import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, MapPin, Navigation, Phone, Wrench,
  RefreshCw, AlertCircle, PlayCircle, CheckCircle2, Calendar
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'
import OSBottomDrawer from '../../components/technician/OSBottomDrawer'

interface AgendaOrder {
  id: string
  order_number?: string
  title?: string
  client_name?: string
  client_address?: string
  client_city?: string
  client_phone?: string
  scheduled_at?: string
  scheduled_time?: string
  status: string
  priority?: string
  equipment?: string
  brand?: string
  model?: string
  description?: string
  notes?: string
  access_note?: string
  location?: string
  technician_id?: string
}

const PRIORITY_CONFIG: Record<string, { dot: string; label: string }> = {
  urgente: { dot: 'bg-red-500', label: 'Urgente' },
  urgent:  { dot: 'bg-red-500', label: 'Urgente' },
  alta:    { dot: 'bg-orange-500', label: 'Alta' },
  high:    { dot: 'bg-orange-500', label: 'Alta' },
  normal:  { dot: 'bg-blue-400', label: 'Normal' },
  baixa:   { dot: 'bg-gray-300', label: 'Baixa' },
  low:     { dot: 'bg-gray-300', label: 'Baixa' },
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  pendente: 'Pendente',
  in_progress: 'Em Execução',
  em_andamento: 'Em Execução',
  aberta: 'Aberta',
  open: 'Aberta',
}

const isActiveStatus = (s: string) =>
  ['pending', 'pendente', 'in_progress', 'em_andamento', 'aberta', 'open'].includes(s)

const TechnicianAgenda = () => {
  const { user } = useUser()
  const [orders, setOrders] = useState<AgendaOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<AgendaOrder | null>(null)

  const today = new Date()
  const todayStr = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  })

  useEffect(() => {
    load()
  }, [user])

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const todayDate = new Date()
      const startOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate(), 0, 0, 0)
      const endOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate(), 23, 59, 59)

      let query = supabase
        .from('v_technician_app_data')
        .select('*')
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .order('scheduled_at', { ascending: true })

      if (user?.id) {
        query = query.eq('technician_id', user.id)
      }

      const { data, error } = await query

      if (!error && data) {
        setOrders(data.filter(o => isActiveStatus(o.status)))
      } else {
        let fallbackQuery = supabase
          .from('v_technician_app_data')
          .select('*')
          .order('scheduled_at', { ascending: true })
          .limit(20)

        if (user?.id) {
          fallbackQuery = fallbackQuery.eq('technician_id', user.id)
        }

        const { data: fb } = await fallbackQuery
        setOrders((fb || []).filter(o => isActiveStatus(o.status)))
      }
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatTime = (dateStr?: string, timeStr?: string) => {
    if (timeStr) return timeStr
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch { return null }
  }

  const openInMaps = (address: string, city?: string) => {
    const query = city ? `${address}, ${city}` : address
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank')
  }

  const pendingCount = orders.filter(o => ['pending', 'pendente'].includes(o.status)).length
  const inProgressCount = orders.filter(o => ['in_progress', 'em_andamento'].includes(o.status)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Carregando agenda...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 pt-5 pb-28 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agenda de Hoje</h1>
            <p className="text-sm text-gray-400 capitalize mt-0.5">{todayStr}</p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-5 h-5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700 leading-none">{pendingCount}</p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">Pendentes</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700 leading-none">{inProgressCount}</p>
              <p className="text-xs text-blue-600 font-medium mt-0.5">Em Execução</p>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center mt-4"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">Tudo em dia!</h3>
            <p className="text-gray-400 text-sm">Nenhuma OS para agora</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {orders.length} {orders.length === 1 ? 'atendimento' : 'atendimentos'} hoje
            </p>

            <AnimatePresence>
              {orders.map((order, index) => {
                const time = formatTime(order.scheduled_at, order.scheduled_time)
                const priority = PRIORITY_CONFIG[order.priority || 'normal'] || PRIORITY_CONFIG.normal
                const isInProgress = ['in_progress', 'em_andamento'].includes(order.status)

                return (
                  <motion.button
                    key={order.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform"
                  >
                    <div className={`h-1.5 w-full ${isInProgress ? 'bg-blue-500' : 'bg-amber-400'}`} />

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${priority.dot}`} />
                            <span className={`text-xs font-semibold ${isInProgress ? 'text-blue-600' : 'text-amber-600'}`}>
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                            <span className="text-xs text-gray-400">OS #{order.order_number}</span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 truncate">
                            {order.client_name || 'Cliente não informado'}
                          </h3>
                          {order.equipment && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                              <Wrench className="w-3.5 h-3.5 text-gray-400" />
                              <span>{order.equipment}{order.brand ? ` — ${order.brand}` : ''}</span>
                            </div>
                          )}
                        </div>

                        {time && (
                          <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-xl flex-shrink-0">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-sm font-bold text-gray-700">{time}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {order.client_address && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openInMaps(order.client_address!, order.client_city)
                            }}
                            className="flex items-center gap-2 text-xs text-blue-600 active:opacity-70 w-full"
                          >
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{order.client_address}{order.client_city ? `, ${order.client_city}` : ''}</span>
                            <Navigation className="w-3 h-3 flex-shrink-0" />
                          </button>
                        )}

                        {order.client_phone && (
                          <a
                            href={`tel:${order.client_phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 text-xs text-green-600"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{order.client_phone}</span>
                          </a>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Toque para abrir a OS</span>
                        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${
                          isInProgress
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isInProgress ? (
                            <><PlayCircle className="w-3.5 h-3.5" /> Continuar</>
                          ) : (
                            <><CheckCircle2 className="w-3.5 h-3.5" /> Iniciar</>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <OSBottomDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onFinished={() => {
          setSelectedOrder(null)
          load()
        }}
      />
    </>
  )
}

export default TechnicianAgenda
