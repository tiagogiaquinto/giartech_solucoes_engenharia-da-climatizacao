import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Clock, User, MapPin, DollarSign, Calendar, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, CirclePlay as PlayCircle, Circle as XCircle, Plus, ListFilter as Filter, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ServiceOrder {
  id: string
  customer_id?: string
  status?: string
  description?: string
  scheduled_at?: string
  opened_at: string
  closed_at?: string
  total_value?: number
  customer?: {
    nome_razao: string
    telefone?: string
  }
}

const ServiceOrdersKanban = () => {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    loadServiceOrders()
  }, [])

  const loadServiceOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(nome_razao, telefone)
        `)
        .order('opened_at', { ascending: false })

      if (error) throw error

      setServiceOrders(data || [])
    } catch (error) {
      console.error('Error loading service orders:', error)
      setServiceOrders([])
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      id: 'aberta',
      title: 'Abertas',
      icon: AlertCircle,
      color: 'bg-yellow-500',
      borderColor: 'border-yellow-400',
      bgColor: 'bg-yellow-50'
    },
    {
      id: 'em_andamento',
      title: 'Em Andamento',
      icon: PlayCircle,
      color: 'bg-blue-500',
      borderColor: 'border-blue-400',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'concluida',
      title: 'Concluídas',
      icon: CheckCircle2,
      color: 'bg-green-500',
      borderColor: 'border-green-400',
      bgColor: 'bg-green-50'
    },
    {
      id: 'cancelada',
      title: 'Canceladas',
      icon: XCircle,
      color: 'bg-gray-500',
      borderColor: 'border-gray-400',
      bgColor: 'bg-gray-50'
    }
  ]

  const getOrdersByStatus = (status: string) => {
    return serviceOrders.filter(order => {
      const orderStatus = order.status || 'aberta'
      const matchesStatus = orderStatus === status
      const matchesSearch = !searchTerm ||
        order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.nome_razao?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = !statusFilter || orderStatus === statusFilter

      return matchesStatus && matchesSearch && matchesFilter
    })
  }

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não agendado'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysOpen = (openedAt: string) => {
    const opened = new Date(openedAt)
    const now = new Date()
    const diff = Math.floor((now.getTime() - opened.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ordens de serviço...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-blue-500" />
              Ordens de Serviço
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {serviceOrders.length} ordens de serviço cadastradas
            </p>
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova OS
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const orders = getOrdersByStatus(column.id)
          const Icon = column.icon

          return (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className={`${column.bgColor} border-t-4 ${column.borderColor} rounded-t-xl p-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${column.color.replace('bg-', 'text-')}`} />
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  </div>
                  <span className="bg-white text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                    {orders.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 bg-gray-50 rounded-b-xl p-2 space-y-2 min-h-[400px]">
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Nenhuma ordem
                  </div>
                ) : (
                  orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {/* Cliente */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {order.customer?.nome_razao || 'Cliente não informado'}
                          </h4>
                          {order.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {order.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Informações */}
                      <div className="space-y-1.5">
                        {order.scheduled_at && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(order.scheduled_at)}</span>
                          </div>
                        )}

                        {order.customer?.telefone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <User className="h-3 w-3" />
                            <span>{order.customer.telefone}</span>
                          </div>
                        )}

                        {order.total_value !== undefined && order.total_value > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-medium">{formatCurrency(order.total_value)}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{getDaysOpen(order.opened_at)} dias aberta</span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats Footer */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {columns.map((column) => {
            const orders = getOrdersByStatus(column.id)
            const totalValue = orders.reduce((sum, order) => sum + (order.total_value || 0), 0)

            return (
              <div key={column.id} className="text-center">
                <div className={`text-2xl font-bold ${column.color.replace('bg-', 'text-')}`}>
                  {orders.length}
                </div>
                <div className="text-sm text-gray-600">{column.title}</div>
                {totalValue > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(totalValue)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ServiceOrdersKanban
