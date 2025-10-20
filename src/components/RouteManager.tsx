import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, MapPin, Clock, User, Car, Play, Pause, CheckCircle, XCircle, Navigation, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface RouteManagerProps {
  onRouteSelect?: (routeId: string) => void
}

interface Route {
  id: string
  route_name: string
  route_date: string
  assigned_employee_id?: string
  employee_name?: string
  vehicle_id?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  start_time?: string
  end_time?: string
  total_distance_km: number
  estimated_duration_minutes: number
  actual_duration_minutes: number
  notes?: string
  stop_count?: number
}

interface RouteStop {
  id: string
  route_id: string
  service_order_id?: string
  stop_order: number
  customer_name: string
  address: string
  latitude?: number
  longitude?: number
  estimated_arrival?: string
  actual_arrival?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  notes?: string
}

interface Employee {
  id: string
  name: string
}

const RouteManager = ({ onRouteSelect }: RouteManagerProps) => {
  const [routes, setRoutes] = useState<Route[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewRoute, setShowNewRoute] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [routeStops, setRouteStops] = useState<RouteStop[]>([])

  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'in_progress' | 'completed'>('today')

  const [newRoute, setNewRoute] = useState({
    route_name: '',
    route_date: new Date().toISOString().split('T')[0],
    assigned_employee_id: '',
    vehicle_id: '',
    estimated_duration_minutes: 0,
    notes: ''
  })

  useEffect(() => {
    loadRoutes()
    loadEmployees()
  }, [filter])

  const loadRoutes = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('routes')
        .select(`
          *,
          route_stops(count)
        `)
        .order('route_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        query = query.eq('route_date', today)
      } else if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      const routesWithEmployees = await Promise.all(
        (data || []).map(async (route: any) => {
          let employeeName = 'Não atribuído'

          if (route.assigned_employee_id) {
            const { data: emp } = await supabase
              .from('employees')
              .select('name')
              .eq('id', route.assigned_employee_id)
              .single()

            if (emp) employeeName = emp.name
          }

          return {
            ...route,
            employee_name: employeeName,
            stop_count: route.route_stops?.[0]?.count || 0
          }
        })
      )

      setRoutes(routesWithEmployees)
    } catch (error) {
      console.error('Error loading routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, name')
        .eq('active', true)
        .order('name')

      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadRouteStops = async (routeId: string) => {
    try {
      const { data, error } = await supabase
        .from('route_stops')
        .select('*')
        .eq('route_id', routeId)
        .order('stop_order')

      if (error) throw error
      setRouteStops(data || [])
    } catch (error) {
      console.error('Error loading stops:', error)
    }
  }

  const handleCreateRoute = async () => {
    if (!newRoute.route_name) {
      alert('Nome da rota é obrigatório!')
      return
    }

    try {
      const { error } = await supabase
        .from('routes')
        .insert([newRoute])

      if (error) throw error

      await loadRoutes()
      setNewRoute({
        route_name: '',
        route_date: new Date().toISOString().split('T')[0],
        assigned_employee_id: '',
        vehicle_id: '',
        estimated_duration_minutes: 0,
        notes: ''
      })
      setShowNewRoute(false)
    } catch (error) {
      console.error('Error creating route:', error)
      alert('Erro ao criar rota!')
    }
  }

  const handleUpdateStatus = async (routeId: string, status: string) => {
    try {
      const updates: any = { status }

      if (status === 'in_progress' && !routes.find(r => r.id === routeId)?.start_time) {
        updates.start_time = new Date().toISOString()
      }

      if (status === 'completed') {
        updates.end_time = new Date().toISOString()

        const route = routes.find(r => r.id === routeId)
        if (route?.start_time) {
          const start = new Date(route.start_time)
          const end = new Date()
          updates.actual_duration_minutes = Math.round((end.getTime() - start.getTime()) / 60000)
        }
      }

      const { error } = await supabase
        .from('routes')
        .update(updates)
        .eq('id', routeId)

      if (error) throw error

      await loadRoutes()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Erro ao atualizar status!')
    }
  }

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Deseja realmente excluir esta rota?')) return

    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId)

      if (error) throw error
      await loadRoutes()
    } catch (error) {
      console.error('Error deleting route:', error)
      alert('Erro ao excluir rota!')
    }
  }

  const handleSelectRoute = (routeId: string) => {
    setSelectedRoute(routeId === selectedRoute ? null : routeId)
    if (routeId !== selectedRoute) {
      loadRouteStops(routeId)
      if (onRouteSelect) onRouteSelect(routeId)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendente', icon: Clock, color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' }
      case 'in_progress':
        return { label: 'Em Andamento', icon: Play, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' }
      case 'completed':
        return { label: 'Concluída', icon: CheckCircle, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' }
      case 'cancelled':
        return { label: 'Cancelada', icon: XCircle, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' }
      default:
        return { label: status, icon: Clock, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatTime = (dateTime?: string) => {
    if (!dateTime) return '-'
    return new Date(dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
  }

  if (loading) {
    return <div className="text-center py-8">Carregando rotas...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Gestão de Rotas</h2>
            <p className="text-blue-100 text-sm">Planeje e acompanhe as rotas da equipe</p>
          </div>
          <button
            onClick={() => setShowNewRoute(!showNewRoute)}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 transition-colors font-semibold"
          >
            <Plus className="h-5 w-5" />
            Nova Rota
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium">Filtrar:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'today'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'in_progress'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            Em Andamento
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            Concluídas
          </button>
        </div>
      </div>

      {/* Formulário Nova Rota */}
      <AnimatePresence>
        {showNewRoute && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              Nova Rota
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Rota *
                </label>
                <input
                  type="text"
                  value={newRoute.route_name}
                  onChange={(e) => setNewRoute({ ...newRoute, route_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Rota Centro - Manhã"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={newRoute.route_date}
                  onChange={(e) => setNewRoute({ ...newRoute, route_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funcionário
                </label>
                <select
                  value={newRoute.assigned_employee_id}
                  onChange={(e) => setNewRoute({ ...newRoute, assigned_employee_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Veículo/Placa
                </label>
                <input
                  type="text"
                  value={newRoute.vehicle_id}
                  onChange={(e) => setNewRoute({ ...newRoute, vehicle_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: ABC-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duração Estimada (minutos)
                </label>
                <input
                  type="number"
                  value={newRoute.estimated_duration_minutes}
                  onChange={(e) => setNewRoute({ ...newRoute, estimated_duration_minutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={newRoute.notes}
                  onChange={(e) => setNewRoute({ ...newRoute, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Observações sobre a rota..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewRoute(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRoute}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Rota
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Rotas */}
      {routes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Navigation className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">Nenhuma rota encontrada</p>
          <p className="text-sm text-gray-500 mt-1">Clique em "Nova Rota" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => {
            const statusInfo = getStatusInfo(route.status)
            const StatusIcon = statusInfo.icon
            const isSelected = selectedRoute === route.id

            return (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <div
                  onClick={() => handleSelectRoute(route.id)}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{route.route_name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Data:
                          </span>
                          <p className="font-medium">{formatDate(route.route_date)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Responsável:
                          </span>
                          <p className="font-medium">{route.employee_name}</p>
                        </div>
                        {route.vehicle_id && (
                          <div>
                            <span className="text-gray-500 flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              Veículo:
                            </span>
                            <p className="font-medium">{route.vehicle_id}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Paradas:
                          </span>
                          <p className="font-medium">{route.stop_count}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Distância:
                          </span>
                          <p className="font-medium">{route.total_distance_km} km</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {route.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateStatus(route.id, 'in_progress')
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Iniciar rota"
                        >
                          <Play className="h-5 w-5" />
                        </button>
                      )}
                      {route.status === 'in_progress' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateStatus(route.id, 'completed')
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Concluir rota"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRoute(route.id)
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir rota"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Paradas da Rota */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 bg-gray-50 p-6"
                    >
                      <h5 className="font-semibold mb-4">Paradas da Rota ({routeStops.length})</h5>
                      {routeStops.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhuma parada adicionada ainda</p>
                      ) : (
                        <div className="space-y-3">
                          {routeStops.map((stop, index) => (
                            <div key={stop.id} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <h6 className="font-medium text-gray-900">{stop.customer_name}</h6>
                                  <p className="text-sm text-gray-600 mt-1">{stop.address}</p>
                                  {stop.notes && (
                                    <p className="text-xs text-gray-500 mt-2">{stop.notes}</p>
                                  )}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusInfo(stop.status).bgColor} ${getStatusInfo(stop.status).textColor}`}>
                                  {getStatusInfo(stop.status).label}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RouteManager
