import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  Filter,
  UserPlus,
  Zap,
  Activity
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

const OSDistribution = () => {
  const [unassignedOrders, setUnassignedOrders] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterUrgency, setFilterUrgency] = useState<string>('all')
  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Buscar OS não atribuídas ou aguardando atribuição
      const { data: ordersData, error: ordersError } = await supabase
        .from('service_orders')
        .select(`
          *,
          customers (name, phone),
          customer_addresses (street, number, city, state)
        `)
        .in('workflow_stage', ['new', 'awaiting_assignment'])
        .order('created_at', { ascending: false })

      // Buscar técnicos disponíveis com suas estatísticas
      const { data: techData, error: techError } = await supabase
        .from('employees')
        .select(`
          *,
          technician_availability (
            current_workload,
            max_workload,
            is_available
          ),
          service_order_assignments (
            status
          )
        `)
        .in('role', ['technician', 'field_technician'])
        .eq('active', true)

      if (ordersData) {
        setUnassignedOrders(ordersData)
      }

      if (techData) {
        // Processar dados dos técnicos
        const processedTechs = techData.map(tech => {
          const availability = tech.technician_availability?.[0]
          const assignments = tech.service_order_assignments || []
          const activeAssignments = assignments.filter(
            (a: any) => a.status === 'in_progress' || a.status === 'pending'
          ).length

          return {
            ...tech,
            current_workload: availability?.current_workload || activeAssignments,
            max_workload: availability?.max_workload || 5,
            is_available: availability?.is_available !== false,
            availability_percentage: ((availability?.current_workload || activeAssignments) / (availability?.max_workload || 5)) * 100
          }
        })

        setTechnicians(processedTechs.sort((a, b) => a.current_workload - b.current_workload))
      }

    } catch (err) {
      console.error('Error loading data:', err)
      showToast('Erro ao carregar dados', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDistribute = async (orderId: string, technicianId: string, manual = true) => {
    try {
      setAssigning(true)

      if (manual) {
        // Distribuição manual
        const { data, error } = await supabase.rpc('distribute_service_order', {
          p_service_order_id: orderId,
          p_technician_id: technicianId,
          p_notes: notes
        })

        if (error) throw error

        showToast('OS distribuída com sucesso!', 'success')
      } else {
        // Distribuição automática - adicionar à fila
        const order = unassignedOrders.find(o => o.id === orderId)

        const { error } = await supabase
          .from('os_assignments_queue')
          .insert({
            service_order_id: orderId,
            priority: order?.priority === 'urgent' ? 100 : order?.priority === 'high' ? 75 : 50,
            status: 'pending'
          })

        if (error) throw error

        showToast('OS adicionada à fila de distribuição automática', 'success')
      }

      setSelectedOrder(null)
      setSelectedTechnician('')
      setNotes('')
      loadData()

    } catch (err: any) {
      console.error('Error distributing OS:', err)
      showToast(err.message || 'Erro ao distribuir OS', 'error')
    } finally {
      setAssigning(false)
    }
  }

  const getUrgencyColor = (priority: string) => {
    if (priority === 'urgent') return 'bg-red-500'
    if (priority === 'high') return 'bg-orange-500'
    return 'bg-blue-500'
  }

  const getUrgencyLabel = (priority: string) => {
    if (priority === 'urgent') return '🔴 URGENTE'
    if (priority === 'high') return '🟠 ALTA'
    return '🟡 NORMAL'
  }

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500'
    if (percentage >= 60) return 'bg-orange-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const filteredOrders = unassignedOrders.filter(order => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesUrgency = filterUrgency === 'all' || order.priority === filterUrgency

    return matchesSearch && matchesUrgency
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando distribuição...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Distribuição de OS</h1>
          <p className="text-gray-600 mt-1">Gerencie a atribuição de ordens de serviço para técnicos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{filteredOrders.length}</p>
            <p className="text-sm text-gray-600">Aguardando</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-600">{technicians.filter(t => t.is_available).length}</p>
            <p className="text-sm text-gray-600">Disponíveis</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OS Não Atribuídas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-blue-600" />
                Ordens Não Atribuídas
              </h2>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por OS ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">Todas Prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="normal">Normal</option>
              </select>
            </div>

            {/* Lista de OS */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Tudo atribuído!</h3>
                  <p className="text-gray-600">Não há ordens de serviço aguardando atribuição.</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <motion.div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedOrder?.id === order.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900">OS #{order.order_number}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                            getUrgencyColor(order.priority)
                          }`}>
                            {getUrgencyLabel(order.priority)}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-700">{order.customers?.name}</p>
                        {order.customer_addresses?.[0] && (
                          <p className="text-sm text-gray-500 mt-1">
                            {order.customer_addresses[0].street}, {order.customer_addresses[0].number} - {order.customer_addresses[0].city}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {order.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{order.description}</p>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Técnicos Disponíveis */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-green-600" />
              Técnicos Disponíveis
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {technicians.map(tech => (
                <motion.div
                  key={tech.id}
                  onClick={() => setSelectedTechnician(tech.id)}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTechnician === tech.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  } ${!tech.is_available ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{tech.full_name}</p>
                      <p className="text-sm text-gray-500">{tech.role}</p>
                    </div>
                    {!tech.is_available && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                        Indisponível
                      </span>
                    )}
                  </div>

                  {/* Barra de Carga de Trabalho */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Carga de Trabalho</span>
                      <span>{tech.current_workload} / {tech.max_workload}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          getWorkloadColor(tech.availability_percentage)
                        }`}
                        style={{ width: `${Math.min(tech.availability_percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      <Activity className="w-4 h-4 inline mr-1" />
                      {tech.availability_percentage.toFixed(0)}% ocupado
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Ações de Distribuição */}
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white"
            >
              <h3 className="text-lg font-bold mb-4">Atribuir OS</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Observações</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre esta atribuição..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                  />
                </div>

                <button
                  onClick={() => handleDistribute(selectedOrder.id, selectedTechnician)}
                  disabled={!selectedTechnician || assigning}
                  className="w-full bg-white text-blue-600 px-4 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <>
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Atribuindo...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Atribuir Manualmente
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDistribute(selectedOrder.id, '', false)}
                  disabled={assigning}
                  className="w-full bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-lg font-bold hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Distribuir Automaticamente
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OSDistribution
