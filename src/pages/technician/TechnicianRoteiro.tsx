import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Clock,
  Phone,
  ChevronRight,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Navigation,
  Wrench,
  Flag
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'
import OSExecutionDrawer from '../../components/technician/OSExecutionDrawer'
import BottomDrawerFinalizacaoOS from '../../components/technician/BottomDrawerFinalizacaoOS'

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

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  in_progress: { label: 'Em Execução', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  completed: { label: 'Concluída', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
  on_hold: { label: 'Pausada', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  pausado: { label: 'Pausada', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' }
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-600',
  low: 'bg-gray-400'
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Normal',
  low: 'Baixa'
}

const TechnicianRoteiro = () => {
  const { user } = useUser()
  const [orders, setOrders] = useState<ServiceOrderCard[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrderCard | null>(null)
  const [finalizingOrder, setFinalizingOrder] = useState<ServiceOrderCard | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

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
      const authId = user?.id

      let query = supabase
        .from('v_technician_service_orders')
        .select('*')
        .or(`scheduled_at.gte.${todayStr},service_date.gte.${todayStr},status.in.(pending,in_progress)`)
        .order('scheduled_at', { ascending: true })

      if (authId) {
        query = query.or(
          `assigned_employee_auth_id.eq.${authId},technician_id.eq.${authId}`
        )
      }

      const { data, error } = await query

      if (error || !data) {
        let fallbackQuery = supabase
          .from('service_orders')
          .select(`
            id, order_number, status, priority, title, description,
            client_name, client_phone, client_address, client_city,
            scheduled_at, scheduled_time, due_date,
            equipment, brand, model, progress_percent
          `)
          .or(`scheduled_at.gte.${todayStr},status.in.(pending,in_progress)`)
          .order('scheduled_at', { ascending: true })

        if (authId) {
          fallbackQuery = fallbackQuery.or(`technician_id.eq.${authId}`)
        }

        const { data: fallback } = await fallbackQuery
        setOrders(fallback || [])
      } else {
        setOrders(data)
      }
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadOrders() }, [user])

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length
  const completedCount = orders.filter(o => o.status === 'completed').length

  const handleFinished = () => {
    setSelectedOrder(null)
    setFinalizingOrder(null)
    setShowSuccess(true)
    loadOrders()
    setTimeout(() => setShowSuccess(false), 3500)
  }

  const formatTime = (dateStr?: string, timeStr?: string) => {
    if (timeStr) return timeStr
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch { return null }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-[#f0f4f8]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Carregando roteiro...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 pt-5 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Roteiro</h1>
            <p className="text-sm text-gray-400 capitalize mt-0.5">{today}</p>
          </div>
          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-5 h-5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Pendentes', count: pendingCount, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
            { label: 'Em Execução', count: inProgressCount, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
            { label: 'Concluídas', count: completedCount, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' }
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-3 text-center`}>
              <p className={`text-2xl font-bold ${s.text}`}>{s.count}</p>
              <p className={`text-[11px] font-semibold ${s.text} opacity-80 mt-0.5`}>{s.label}</p>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-600 text-white rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold text-sm">OS finalizada com sucesso!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center mt-4"
          >
            <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">Roteiro vazio</h3>
            <p className="text-gray-400 text-sm">Nenhuma OS agendada para hoje</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, index) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const time = formatTime(order.scheduled_at, order.scheduled_time)
              const priorityColor = PRIORITY_COLORS[order.priority] || 'bg-blue-600'
              const isCompleted = order.status === 'completed'
              const isInProgress = order.status === 'in_progress'

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className={`h-1.5 w-full ${priorityColor}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />
                          <span className={`text-xs font-bold ${status.text}`}>{status.label}</span>
                          <span className="text-xs text-gray-400">OS #{order.order_number}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {order.client_name || 'Cliente não informado'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {time && (
                          <div className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-xl flex-shrink-0">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs font-bold text-gray-700">{time}</span>
                          </div>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      </div>
                    </div>

                    {order.equipment && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                        <Wrench className="w-3.5 h-3.5 text-gray-400" />
                        <span>{order.equipment}{order.brand ? ` — ${order.brand}` : ''}</span>
                      </div>
                    )}

                    {order.client_address && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{order.client_address}</span>
                      </div>
                    )}

                    {order.client_phone && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 mb-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{order.client_phone}</span>
                      </div>
                    )}

                    {order.progress_percent !== undefined && order.progress_percent > 0 && (
                      <div className="mt-2 mb-3">
                        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                          <span>Progresso</span>
                          <span className="font-bold">{order.progress_percent}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${order.progress_percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${order.progress_percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                          isCompleted
                            ? 'bg-gray-100 text-gray-600'
                            : isInProgress
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isCompleted ? (
                          <><CheckCircle2 className="w-4 h-4" /> Ver Detalhes</>
                        ) : isInProgress ? (
                          <><Wrench className="w-4 h-4" /> Continuar</>
                        ) : (
                          <><Navigation className="w-4 h-4" /> Iniciar OS</>
                        )}
                      </button>

                      {!isCompleted && (
                        <button
                          onClick={() => setFinalizingOrder(order)}
                          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
                        >
                          <Flag className="w-4 h-4" />
                          Finalizar
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <OSExecutionDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onFinished={handleFinished}
      />

      <BottomDrawerFinalizacaoOS
        order={finalizingOrder}
        onClose={() => setFinalizingOrder(null)}
        onFinished={handleFinished}
      />
    </>
  )
}

export default TechnicianRoteiro
