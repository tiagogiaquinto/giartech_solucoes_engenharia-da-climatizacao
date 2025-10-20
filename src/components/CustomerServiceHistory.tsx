import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, DollarSign, FileText, TrendingUp, Package, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface CustomerServiceHistoryProps {
  customerId: string
}

interface ServiceOrder {
  id: string
  order_number: string
  service_type: string
  description: string
  status: string
  service_date?: string
  completion_date?: string
  created_at: string
  total_cost: number
  total_additional_costs: number
  estimated_hours: number
  actual_hours: number
}

const CustomerServiceHistory = ({ customerId }: CustomerServiceHistoryProps) => {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'cancelled'>('all')
  const navigate = useNavigate()

  useEffect(() => {
    loadHistory()
  }, [customerId, filter])

  const loadHistory = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('service_orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('service_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Concluído', icon: CheckCircle, color: 'green' }
      case 'in_progress':
        return { label: 'Em Andamento', icon: Clock, color: 'blue' }
      case 'pending':
        return { label: 'Pendente', icon: AlertCircle, color: 'yellow' }
      case 'cancelled':
        return { label: 'Cancelado', icon: XCircle, color: 'red' }
      default:
        return { label: status, icon: AlertCircle, color: 'gray' }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const totalSpent = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (Number(o.total_cost) || 0) + (Number(o.total_additional_costs) || 0), 0)

  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'completed').length

  if (loading) {
    return <div className="text-center py-8">Carregando histórico...</div>
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total de Serviços</p>
              <p className="text-3xl font-bold">{totalOrders}</p>
            </div>
            <FileText className="h-12 w-12 text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Concluídos</p>
              <p className="text-3xl font-bold">{completedOrders}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Total Investido</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
            <DollarSign className="h-12 w-12 text-purple-200 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Filtrar:</span>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Concluídos
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'in_progress'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Em Andamento
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'cancelled'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Cancelados
        </button>
      </div>

      {/* Lista de Serviços */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">Nenhum serviço encontrado</p>
          <p className="text-sm text-gray-500 mt-1">
            {filter === 'all'
              ? 'Este cliente ainda não possui histórico de serviços'
              : `Nenhum serviço com status "${getStatusInfo(filter).label}"`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status)
            const StatusIcon = statusInfo.icon
            const totalValue = (Number(order.total_cost) || 0) + (Number(order.total_additional_costs) || 0)

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/service-order/${order.id}`)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-${statusInfo.color}-100 rounded-lg`}>
                      <StatusIcon className={`h-6 w-6 text-${statusInfo.color}-600`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-lg font-semibold text-gray-900">OS #{order.order_number}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{order.service_type}</p>
                      {order.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{order.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                    {Number(order.total_additional_costs) > 0 && (
                      <p className="text-xs text-gray-500">
                        + {formatCurrency(order.total_additional_costs)} (custos extras)
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Data do Serviço</p>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(order.service_date || order.created_at)}
                    </p>
                  </div>

                  {order.completion_date && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Conclusão</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {formatDate(order.completion_date)}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Horas Estimadas</p>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {order.estimated_hours || 0}h
                    </p>
                  </div>

                  {order.actual_hours > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Horas Reais</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {order.actual_hours}h
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomerServiceHistory
