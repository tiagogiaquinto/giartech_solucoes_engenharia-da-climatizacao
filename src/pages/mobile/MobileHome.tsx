import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Navigation,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Phone,
  ChevronRight,
  Zap,
  RefreshCw,
  Play
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

interface TodayOS {
  id: string
  order_number: string
  status: string
  priority: string
  client_name: string
  client_phone: string
  client_address: string
  client_city: string
  scheduled_time: string
  title: string
  description: string
  progress_percent: number
  checklist_total: number
  checklist_done: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: 'text-amber-700', bg: 'bg-amber-100' },
  in_progress: { label: 'Em Execução', color: 'text-blue-700', bg: 'bg-blue-100' },
  em_andamento: { label: 'Em Execução', color: 'text-blue-700', bg: 'bg-blue-100' },
  aguardando_material: { label: 'Aguard. Material', color: 'text-orange-700', bg: 'bg-orange-100' },
  aguardando_aprovacao: { label: 'Aguard. Aprovação', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  completed: { label: 'Concluída', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  concluido: { label: 'Concluída', color: 'text-emerald-700', bg: 'bg-emerald-100' }
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: 'URGENTE', color: 'bg-red-500 text-white' },
  high: { label: 'Alta', color: 'bg-orange-500 text-white' },
  normal: { label: 'Normal', color: 'bg-gray-200 text-gray-700' },
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-500' }
}

const MobileHome = () => {
  const navigate = useNavigate()
  const { user, isTechnician } = useUser()
  const [todayOrders, setTodayOrders] = useState<TodayOS[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadTodayRoute()
  }, [user])

  const loadTodayRoute = async () => {
    if (!user?.employee_id) {
      setLoading(false)
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: assignments } = await supabase
        .from('service_order_assignments')
        .select('service_order_id')
        .eq('employee_id', user.employee_id)
        .in('status', ['pending', 'in_progress', 'assigned'])

      if (!assignments?.length) {
        setTodayOrders([])
        setLoading(false)
        return
      }

      const osIds = assignments.map(a => a.service_order_id)

      const { data: orders } = await supabase
        .from('v_service_orders_technician')
        .select('*')
        .in('id', osIds)
        .or(`service_date.eq.${today},scheduled_at.gte.${today}T00:00:00,scheduled_at.lte.${today}T23:59:59`)
        .order('scheduled_time', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false })

      const ordersWithChecklist = await Promise.all(
        (orders || []).map(async (order) => {
          const { count: total } = await supabase
            .from('os_checklist_items')
            .select('*', { count: 'exact', head: true })
            .eq('os_id', order.id)

          const { count: done } = await supabase
            .from('os_checklist_items')
            .select('*', { count: 'exact', head: true })
            .eq('os_id', order.id)
            .eq('is_completed', true)

          return {
            ...order,
            checklist_total: total || 0,
            checklist_done: done || 0
          }
        })
      )

      setTodayOrders(ordersWithChecklist)
    } catch (err) {
      console.error('Error loading today route:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTodayRoute()
    setRefreshing(false)
  }

  const openGPS = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }

  const callClient = (phone: string) => {
    if (!phone) return
    const cleaned = phone.replace(/\D/g, '')
    window.open(`tel:${cleaned}`, '_self')
  }

  const completedCount = todayOrders.filter(o => ['completed', 'concluido'].includes(o.status)).length
  const inProgressCount = todayOrders.filter(o => ['in_progress', 'em_andamento'].includes(o.status)).length
  const pendingCount = todayOrders.filter(o => ['pending', 'aguardando_material', 'aguardando_aprovacao'].includes(o.status)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando roteiro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Header Card - Day Route Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#0f1e3d] to-[#0a3d6b] rounded-2xl p-5 text-white shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-0.5">Meu Roteiro</p>
            <h1 className="text-xl font-bold">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9, rotate: 180 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-[10px] text-blue-200 font-medium">Pendentes</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-cyan-300">{inProgressCount}</p>
            <p className="text-[10px] text-blue-200 font-medium">Executando</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-300">{completedCount}</p>
            <p className="text-[10px] text-blue-200 font-medium">Concluídas</p>
          </div>
        </div>
      </motion.div>

      {/* Orders List */}
      {todayOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhuma OS para hoje</h3>
          <p className="text-sm text-gray-500">
            Seu roteiro de hoje está vazio. Aproveite para revisar pendências.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {todayOrders.map((order, index) => {
              const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const priorityConf = PRIORITY_CONFIG[order.priority] || PRIORITY_CONFIG.normal
              const checklistProgress = order.checklist_total > 0
                ? Math.round((order.checklist_done / order.checklist_total) * 100)
                : 0

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-gray-900">OS #{order.order_number}</span>
                          {order.priority === 'urgent' && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${priorityConf.color}`}>
                              {priorityConf.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 font-medium truncate">
                          {order.client_name || 'Cliente não informado'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold shrink-0 ${statusConf.bg} ${statusConf.color}`}>
                        {statusConf.label}
                      </span>
                    </div>

                    {order.scheduled_time && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{order.scheduled_time.substring(0, 5)}</span>
                      </div>
                    )}
                  </div>

                  {/* Checklist Progress */}
                  {order.checklist_total > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-gray-700">Checklist</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {order.checklist_done}/{order.checklist_total}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${checklistProgress}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`h-full rounded-full ${
                            checklistProgress === 100
                              ? 'bg-emerald-500'
                              : checklistProgress > 50
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {order.client_address && (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-600 leading-tight">
                          {order.client_address}
                          {order.client_city && `, ${order.client_city}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="p-3 flex gap-2">
                    {/* GPS Button - Primary */}
                    {order.client_address && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openGPS(order.client_address, order.client_city || '')}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-3 font-semibold shadow-md"
                      >
                        <Navigation className="w-5 h-5" />
                        <span>Ver no GPS</span>
                      </motion.button>
                    )}

                    {/* Call Button */}
                    {order.client_phone && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => callClient(order.client_phone)}
                        className="w-12 h-12 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-xl"
                      >
                        <Phone className="w-5 h-5" />
                      </motion.button>
                    )}

                    {/* Execute/View Button */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/mobile/orders/${order.id}/execute`)}
                      className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-700 rounded-xl"
                    >
                      {['in_progress', 'em_andamento'].includes(order.status) ? (
                        <Play className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Urgent Alert if any */}
      {todayOrders.some(o => o.priority === 'urgent') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-800 text-sm">Atenção: OS Urgente</p>
            <p className="text-xs text-red-600">Você possui ordens com prioridade urgente no roteiro de hoje.</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default MobileHome
