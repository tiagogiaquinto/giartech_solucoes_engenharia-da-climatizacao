import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ClipboardList,
  Calendar,
  MapPin,
  Clock,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  PlayCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

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
    if (!user?.employee_id) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('service_order_assignments')
        .select(`
          *,
          service_orders (
            id,
            order_number,
            status,
            scheduled_date,
            priority,
            customers (
              name,
              phone,
              customer_addresses (street, number, city)
            )
          )
        `)
        .eq('employee_id', user.employee_id)
        .order('assigned_at', { ascending: false })

      setOrders(data || [])
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    if (filter !== 'all') {
      filtered = filtered.filter(o => o.status === filter)
    }

    if (searchTerm) {
      filtered = filtered.filter(o =>
        o.service_orders.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.service_orders.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredOrders(filtered)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      in_progress: 'Em Execução',
      completed: 'Concluída',
      cancelled: 'Cancelada'
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: string) => {
    if (status === 'pending') return <AlertCircle className="w-5 h-5" />
    if (status === 'in_progress') return <PlayCircle className="w-5 h-5" />
    if (status === 'completed') return <CheckCircle className="w-5 h-5" />
    return <ClipboardList className="w-5 h-5" />
  }

  const getPriorityColor = (priority: string) => {
    if (priority === 'urgent') return 'border-l-red-500'
    if (priority === 'high') return 'border-l-orange-500'
    return 'border-l-blue-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando ordens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Minhas OS</h1>
        <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
          {filteredOrders.length}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por OS ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-base"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {[
          { id: 'all', label: 'Todas', count: orders.length },
          { id: 'pending', label: 'Pendentes', count: orders.filter(o => o.status === 'pending').length },
          { id: 'in_progress', label: 'Em Execução', count: orders.filter(o => o.status === 'in_progress').length },
          { id: 'completed', label: 'Concluídas', count: orders.filter(o => o.status === 'completed').length }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              filter === f.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <ClipboardList className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchTerm ? 'Nenhum resultado' : 'Nenhuma OS encontrada'}
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Tente buscar por outro termo'
              : 'Você não tem ordens de serviço atribuídas no momento'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((assignment: any) => {
            const order = assignment.service_orders
            const customer = order.customers

            return (
              <motion.button
                key={assignment.id}
                onClick={() => navigate(`/service-orders/${order.id}/mobile`)}
                whileTap={{ scale: 0.98 }}
                className={`w-full bg-white rounded-2xl p-5 shadow-lg text-left border-l-4 ${
                  getPriorityColor(order.priority)
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900 text-lg">
                        OS #{order.order_number}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 ${
                        getStatusColor(assignment.status)
                      }`}>
                        {getStatusIcon(assignment.status)}
                        {getStatusLabel(assignment.status)}
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold text-base">
                      {customer?.name}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mt-3">
                  {order.scheduled_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Agendado: {new Date(order.scheduled_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}

                  {customer?.customer_addresses?.[0] && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">
                        {customer.customer_addresses[0].street}, {customer.customer_addresses[0].number} - {customer.customer_addresses[0].city}
                      </span>
                    </div>
                  )}

                  {assignment.assigned_at && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        Atribuída em {new Date(assignment.assigned_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Priority Badge */}
                {order.priority && order.priority !== 'normal' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      order.priority === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : order.priority === 'high'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.priority === 'urgent' ? '🔥 URGENTE' :
                       order.priority === 'high' ? '⚡ ALTA PRIORIDADE' : 'NORMAL'}
                    </span>
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MobileOrders
