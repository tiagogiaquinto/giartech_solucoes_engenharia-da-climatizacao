import React, { useState } from 'react'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ClipboardList, Plus, Search, ListFilter as Filter, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, X, User, Calendar, CreditCard as Edit, Eye, Copy, PlayCircle, Trash2, Smartphone } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { getServiceOrders, createServiceOrder, updateServiceOrder, deleteServiceOrder, type ServiceOrder } from '../lib/supabase'
import ServiceOrderModal from '../components/ServiceOrderModal'
import { cache } from '../utils/cache'
import { getServiceOrderStatusLabel, getPriorityLabel } from '../utils/databaseMappers'


const ServiceOrders = () => {
  const { isAdmin } = useUser()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | undefined>(undefined)

  // Load service orders from database
  useEffect(() => {
    loadServiceOrders()
  }, [])

  // Detect edit parameter and open modal
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      setEditingOrderId(editId)
      setShowOrderModal(true)
      // Remove the parameter from URL
      setSearchParams({})
    }
  }, [searchParams])

  const loadServiceOrders = async () => {
    try {
      setLoading(true)
      const data = await getServiceOrders()
      setOrders(data || [])
      setError(null)
    } catch (err) {
      console.error('Error loading service orders:', err)
      setError('Erro ao carregar ordens de serviço')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (order: ServiceOrder) => {
    try {
      if (confirm(`Deseja duplicar a OS ${order.order_number}?`)) {
        const newOrder = {
          ...order,
          id: undefined,
          order_number: `${order.order_number}-COPIA`,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        await createServiceOrder(newOrder as any)
        await loadServiceOrders()
        alert('OS duplicada com sucesso!')
      }
    } catch (err) {
      console.error('Error duplicating order:', err)
      alert('Erro ao duplicar OS')
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      // Atualizar UI imediatamente (otimista)
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() }
          : order
      ))

      // Atualizar no banco em background
      await updateServiceOrder(orderId, {
        status: newStatus as any,
        updated_at: new Date().toISOString()
      })

      cache.invalidate('service_orders_v2')
    } catch (err) {
      console.error('Error updating status:', err)
      alert(`Erro ao atualizar status: ${err}`)
      // Reverter em caso de erro
      await loadServiceOrders()
    }
  }

  const handleExecute = async (order: ServiceOrder) => {
    try {
      const newStatus = order.status === 'pending' ? 'in_progress' :
                       order.status === 'in_progress' ? 'completed' : order.status

      if (confirm(`Deseja ${newStatus === 'in_progress' ? 'iniciar' : 'concluir'} a OS ${order.order_number}?`)) {
        // Atualizar UI imediatamente
        setOrders(prev => prev.map(o =>
          o.id === order.id
            ? { ...o, status: newStatus, updated_at: new Date().toISOString() }
            : o
        ))

        // Atualizar no banco em background
        await updateServiceOrder(order.id, {
          status: newStatus,
          updated_at: new Date().toISOString()
        })

        cache.invalidate('service_orders_v2')
        alert(`OS ${newStatus === 'in_progress' ? 'iniciada' : 'concluída'} com sucesso!`)
      }
    } catch (err) {
      console.error('Error executing order:', err)
      alert('Erro ao executar ação')
      await loadServiceOrders()
    }
  }

  const handleDeleteClick = (order: ServiceOrder) => {
    setOrderToDelete(order)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return

    try {
      setDeleting(true)

      // Remover da UI imediatamente para melhor UX
      setOrders(prev => prev.filter(o => o.id !== orderToDelete.id))

      // Deletar do banco de dados
      await deleteServiceOrder(orderToDelete.id)

      // Invalidar cache
      cache.invalidate('service_orders_v2')

      setShowDeleteModal(false)
      setOrderToDelete(null)
      alert('Ordem de serviço excluída com sucesso!')
    } catch (err: any) {
      console.error('Error deleting order:', err)
      // Recarregar lista em caso de erro
      await loadServiceOrders()
      alert(`Erro ao excluir ordem de serviço: ${err?.message || 'Erro desconhecido'}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setOrderToDelete(null)
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.service_type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cotacao':
      case 'orcamento':
      case 'quote':
      case 'budget': return 'bg-purple-100 text-purple-800'
      case 'pending':
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
      case 'em_andamento': return 'bg-blue-100 text-blue-800'
      case 'on_hold':
      case 'pausado':
      case 'pausada': return 'bg-orange-100 text-orange-800'
      case 'completed':
      case 'concluido':
      case 'concluida': return 'bg-green-100 text-green-800'
      case 'cancelled':
      case 'cancelado':
      case 'cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    return getServiceOrderStatusLabel(status)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return 'Desconhecida'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'in_progress': return <AlertCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
        <button
          onClick={() => {
            setEditingOrderId(undefined)
            setShowOrderModal(true)
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Nova OS</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por número, cliente ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="cotacao">Cotação</option>
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Andamento</option>
                <option value="on_hold">Pausado</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Carregando ordens...</span>
        </div>
      ) : (
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <ClipboardList className="h-5 w-5 text-white mx-auto mb-0.5" />
                      <span className="text-xs font-bold text-white/90">{order.order_number}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        OS-{order.order_number}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{order.service_type || 'Sem descrição'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                    {getPriorityText(order.priority)}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(order.status)}`}
                  >
                    <option value="cotacao">Cotação</option>
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="on_hold">Pausado</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Cliente</h4>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{order.client_name}</p>
                  </div>
                  <p className="text-xs text-gray-600 ml-6">{order.client_phone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Responsável</h4>
                  <p className="text-sm text-gray-900">{order.assigned_to}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Prazo</h4>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {order.due_date
                        ? new Date(order.due_date).toLocaleDateString('pt-BR')
                        : order.service_date
                          ? new Date(order.service_date).toLocaleDateString('pt-BR')
                          : 'Não definido'
                      }
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Valor Total</h4>
                  <div className="flex items-center space-x-2">
                    <p className="text-lg font-bold text-green-600">
                      {order.total_value || order.final_total
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(order.final_total || order.total_value || 0))
                        : 'R$ 0,00'
                      }
                    </p>
                  </div>
                  {order.custo_total && (
                    <p className="text-xs text-gray-500">
                      Lucro: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(order.lucro_total || 0))}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 line-clamp-1">{order.description}</p>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/service-orders/${order.id}/mobile`)
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Abrir no App Mobile (Técnico)"
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/service-orders/${order.id}/view`)
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Visualizar OS"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingOrderId(order.id)
                      setShowOrderModal(true)
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar OS"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExecute(order)
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title={order.status === 'pending' ? 'Iniciar OS' : order.status === 'in_progress' ? 'Concluir OS' : 'OS Concluída'}
                    disabled={order.status === 'completed'}
                  >
                    <PlayCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicate(order)
                    }}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Duplicar OS"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(order)
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir OS"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-10 shadow-md border border-gray-100 text-center">
            <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma ordem encontrada</h3>
            <p className="text-gray-600 mb-6">Não encontramos ordens de serviço com os filtros selecionados.</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedStatus('all')
                setSelectedPriority('all')
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Excluir Ordem de Serviço</h3>
                    <p className="text-red-100 text-sm">Esta ação não pode ser desfeita</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-900 font-semibold mb-2">
                      Você está prestes a excluir a seguinte OS:
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="text-red-800">
                        <span className="font-bold">Número:</span> {orderToDelete?.order_number}
                      </p>
                      <p className="text-red-800">
                        <span className="font-bold">Cliente:</span> {orderToDelete?.client_name}
                      </p>
                      <p className="text-red-800">
                        <span className="font-bold">Serviço:</span> {orderToDelete?.service_type}
                      </p>
                      <p className="text-red-800">
                        <span className="font-bold">Valor:</span> R$ {((orderToDelete as any)?.total_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-900 font-semibold mb-1">
                      ⚠️ Atenção!
                    </p>
                    <p className="text-yellow-800 text-sm">
                      Ao excluir esta OS, todos os dados relacionados serão permanentemente removidos do sistema. Esta ação é irreversível.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-center mb-6 font-medium">
                Tem certeza que deseja continuar?
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      Confirmar Exclusão
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ServiceOrderModal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false)
          setEditingOrderId(undefined)
        }}
        onSave={() => {
          loadServiceOrders()
          setShowOrderModal(false)
          setEditingOrderId(undefined)
        }}
        orderId={editingOrderId}
      />
    </div>
  )
}

export default ServiceOrders