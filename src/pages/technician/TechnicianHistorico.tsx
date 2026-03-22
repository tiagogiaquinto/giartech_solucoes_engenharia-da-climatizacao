import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, MapPin, Wrench, RefreshCw, History, ChevronRight, ChevronLeft, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'
import OSBottomDrawer from '../../components/technician/OSBottomDrawer'

interface CompletedOrder {
  id: string
  order_number: string
  status: string
  title?: string
  client_name?: string
  client_address?: string
  client_city?: string
  equipment?: string
  brand?: string
  scheduled_at?: string
  completed_at?: string
  progress_percent?: number
  description?: string
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const TechnicianHistorico = () => {
  const { user } = useUser()
  const [orders, setOrders] = useState<CompletedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null)
  const [filterDate, setFilterDate] = useState(new Date())

  useEffect(() => { loadHistory() }, [user, filterDate])

  const loadHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const startOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1)
      const endOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0, 23, 59, 59)

      const authId = user?.id

      let query = supabase
        .from('service_orders')
        .select(`
          id, order_number, status, title,
          client_name, client_address, client_city,
          equipment, brand, scheduled_at, completed_at, progress_percent, description
        `)
        .in('status', ['completed', 'concluido'])
        .gte('completed_at', startOfMonth.toISOString())
        .lte('completed_at', endOfMonth.toISOString())
        .order('completed_at', { ascending: false })
        .limit(100)

      if (authId) {
        query = query.eq('technician_id', authId)
      }

      const { data, error } = await query

      if (!error && data) {
        setOrders(data)
      } else {
        const fallback = await supabase
          .from('service_orders')
          .select(`
            id, order_number, status, title,
            client_name, client_address, client_city,
            equipment, brand, scheduled_at, completed_at, progress_percent, description
          `)
          .in('status', ['completed', 'concluido'])
          .gte('completed_at', startOfMonth.toISOString())
          .lte('completed_at', endOfMonth.toISOString())
          .order('completed_at', { ascending: false })
          .limit(100)
        setOrders(fallback.data || [])
      }
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const previousMonth = () => {
    setFilterDate(new Date(filterDate.getFullYear(), filterDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    const next = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 1)
    if (next <= new Date()) setFilterDate(next)
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return filterDate.getMonth() === now.getMonth() && filterDate.getFullYear() === now.getFullYear()
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return null }
  }

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch { return null }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Carregando historico...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 pt-5 pb-28 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historico</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {orders.length} OS {orders.length === 1 ? 'concluida' : 'concluidas'}
            </p>
          </div>
          <button
            onClick={() => loadHistory(true)}
            disabled={refreshing}
            className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-5 h-5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-xl active:scale-90 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-gray-900">
              {MONTHS[filterDate.getMonth()]} {filterDate.getFullYear()}
            </span>
          </div>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth()}
            className="p-2 hover:bg-gray-100 rounded-xl active:scale-90 transition-all disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center mt-4"
          >
            <History className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">Sem historico</h3>
            <p className="text-gray-400 text-sm">
              Nenhuma OS concluida em {MONTHS[filterDate.getMonth()]}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {orders.map((order, index) => {
                const completedDate = formatDate(order.completed_at || order.scheduled_at)
                const completedTime = formatTime(order.completed_at)

                return (
                  <motion.button
                    key={order.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform"
                  >
                    <div className="h-1.5 w-full bg-green-500" />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            <span className="text-xs font-bold text-green-700">Concluida</span>
                            <span className="text-xs text-gray-400">OS #{order.order_number}</span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 truncate">
                            {order.client_name || 'Cliente nao informado'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {completedDate && (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-xl">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-[11px] font-bold text-gray-600">{completedDate}</span>
                              </div>
                              {completedTime && (
                                <span className="text-[10px] text-gray-400 mt-0.5">{completedTime}</span>
                              )}
                            </div>
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                      </div>

                      {order.equipment && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                          <Wrench className="w-3.5 h-3.5 text-gray-400" />
                          <span>{order.equipment}{order.brand ? ` - ${order.brand}` : ''}</span>
                        </div>
                      )}

                      {order.client_address && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">
                            {order.client_address}{order.client_city ? `, ${order.client_city}` : ''}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">Toque para ver detalhes (somente leitura)</span>
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
        readOnly
        onClose={() => setSelectedOrder(null)}
        onFinished={() => setSelectedOrder(null)}
      />
    </>
  )
}

export default TechnicianHistorico
