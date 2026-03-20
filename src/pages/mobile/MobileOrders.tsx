import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ClipboardList,
  Calendar,
  MapPin,
  Clock,
  Search,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  Navigation,
  Phone,
  ChevronRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'
import { formatDateSafe } from '../../utils/format'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: 'text-amber-700', bg: 'bg-amber-100' },
  assigned: { label: 'Atribuída', color: 'text-blue-700', bg: 'bg-blue-100' },
  in_progress: { label: 'Em Execução', color: 'text-blue-700', bg: 'bg-blue-100' },
  em_andamento: { label: 'Em Execução', color: 'text-blue-700', bg: 'bg-blue-100' },
  aguardando_material: { label: 'Aguard. Material', color: 'text-orange-700', bg: 'bg-orange-100' },
  aguardando_aprovacao: { label: 'Aguard. Aprovação', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  completed: { label: 'Concluída', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  concluido: { label: 'Concluída', color: 'text-emerald-700', bg: 'bg-emerald-100' }
}

const MobileOrders = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadOrders()
  }, [user])

  useEffect(() => {
    filterOrders()
  }, [orders, filter, searchTerm])

  const loadOrders = async () => {
    if (!user?.employee_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data: assignments } = await supabase
        .from('service_order_assignments')
        .select('service_order_id, status, assigned_at')
        .eq('employee_id', user.employee_id)
        .order('assigned_at', { ascending: false })

      if (!assignments?.length) {
        setOrders([])
        setLoading(false)
        return
      }

      const osIds = assignments.map(a => a.service_order_id)

      const { data: osData } = await supabase
        .from('v_service_orders_technician')
        .select('*')
        .in('id', osIds)

      const merged = assignments.map(assignment => {
        const os = osData?.find(o => o.id === assignment.service_order_id)
        return {
          ...assignment,
          service_order: os
        }
      }).filter(a => a.service_order)

      setOrders(merged)
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    if (filter === 'pending') {
      filtered = filtered.filter(o => ['pending', 'assigned', 'aguardando_material', 'aguardando_aprovacao'].includes(o.status))
    } else if (filter === 'in_progress') {
      filtered = filtered.filter(o => ['in_progress', 'em_andamento'].includes(o.status))
    } else if (filter === 'completed') {
      filtered = filtered.filter(o => ['completed', 'concluido'].includes(o.status))
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(o =>
        o.service_order?.order_number?.toLowerCase().includes(term) ||
        o.service_order?.client_name?.toLowerCase().includes(term) ||
        o.service_order?.customer_name?.toLowerCase().includes(term)
      )
    }

    setFilteredOrders(filtered)
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

  const getStatusIcon = (status: string) => {
    if (['pending', 'assigned', 'aguardando_material', 'aguardando_aprovacao'].includes(status)) return <AlertCircle className="w-4 h-4" />
    if (['in_progress', 'em_andamento'].includes(status)) return <PlayCircle className="w-4 h-4" />
    if (['completed', 'concluido'].includes(status)) return <CheckCircle className="w-4 h-4" />
    return <ClipboardList className="w-4 h-4" />
  }

  const getPriorityColor = (priority: string) => {
    if (priority === 'urgent') return 'border-l-red-500'
    if (priority === 'high') return 'border-l-orange-500'
    return 'border-l-blue-500'
  }

  const pendingCount = orders.filter(o => ['pending', 'assigned', 'aguardando_material', 'aguardando_aprovacao'].includes(o.status)).length
  const inProgressCount = orders.filter(o => ['in_progress', 'em_andamento'].includes(o.status)).length
  const completedCount = orders.filter(o => ['completed', 'concluido'].includes(o.status)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando ordens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Minhas Ordens</h1>
        <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
          {filteredOrders.length}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por OS ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { id: 'all', label: 'Todas', count: orders.length },
          { id: 'pending', label: 'Pendentes', count: pendingCount },
          { id: 'in_progress', label: 'Executando', count: inProgressCount },
          { id: 'completed', label: 'Concluídas', count: completedCount }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
              filter === f.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {searchTerm ? 'Nenhum resultado' : 'Nenhuma OS encontrada'}
          </h3>
          <p className="text-sm text-gray-500">
            {searchTerm ? 'Tente buscar por outro termo' : 'Você não tem ordens atribuídas.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((assignment, index) => {
            const os = assignment.service_order
            const statusConf = STATUS_CONFIG[assignment.status] || STATUS_CONFIG.pending
            const clientName = os.client_name || os.customer_name || 'Cliente'
            const clientPhone = os.client_phone || os.customer_phone_from_customer
            const clientAddress = os.client_address || os.formatted_address
            const clientCity = os.client_city

            return (
              <motion.div
                key={assignment.service_order_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 ${getPriorityColor(os.priority)}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">OS #{os.order_number}</span>
                        {os.priority === 'urgent' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white">
                            URGENTE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 font-medium truncate">{clientName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 ${statusConf.bg} ${statusConf.color}`}>
                      {getStatusIcon(assignment.status)}
                      {statusConf.label}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500">
                    {os.service_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDateSafe(os.service_date)}</span>
                      </div>
                    )}
                    {clientAddress && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{clientAddress}{clientCity && `, ${clientCity}`}</span>
                      </div>
                    )}
                  </div>

                  {os.progress_percent > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-500">Progresso</span>
                        <span className="text-[10px] font-bold text-gray-700">{Math.round(os.progress_percent)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${os.progress_percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(os.progress_percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 pt-0 flex gap-2">
                  {clientAddress && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openGPS(clientAddress, clientCity || '')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>GPS</span>
                    </motion.button>
                  )}

                  {clientPhone && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => callClient(clientPhone)}
                      className="w-11 h-11 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-xl"
                    >
                      <Phone className="w-4 h-4" />
                    </motion.button>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/mobile/orders/${os.id}/execute`)}
                    className="w-11 h-11 flex items-center justify-center bg-gray-100 text-gray-700 rounded-xl"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MobileOrders
