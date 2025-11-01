import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Star,
  Award,
  Zap
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

const MobileHome = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const [stats, setStats] = useState({
    pendingOrders: 0,
    inProgressOrders: 0,
    completedToday: 0,
    todayEvents: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [todayEvents, setTodayEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user?.employee_id) return

    try {
      setLoading(true)

      const today = new Date().toISOString().split('T')[0]

      // Stats
      const [pendingRes, inProgressRes, completedRes, eventsRes] = await Promise.all([
        supabase
          .from('service_order_assignments')
          .select('service_order_id')
          .eq('employee_id', user.employee_id)
          .eq('status', 'pending'),

        supabase
          .from('service_order_assignments')
          .select('service_order_id')
          .eq('employee_id', user.employee_id)
          .eq('status', 'in_progress'),

        supabase
          .from('service_order_assignments')
          .select('service_order_id')
          .eq('employee_id', user.employee_id)
          .eq('status', 'completed')
          .gte('completed_at', today),

        supabase
          .from('agenda_events')
          .select('*')
          .eq('employee_id', user.employee_id)
          .gte('event_date', today)
          .lte('event_date', today)
      ])

      setStats({
        pendingOrders: pendingRes.data?.length || 0,
        inProgressOrders: inProgressRes.data?.length || 0,
        completedToday: completedRes.data?.length || 0,
        todayEvents: eventsRes.data?.length || 0
      })

      // Recent orders
      const ordersRes = await supabase
        .from('service_order_assignments')
        .select(`
          *,
          service_orders (
            id,
            order_number,
            status,
            scheduled_date,
            customers (name)
          )
        `)
        .eq('employee_id', user.employee_id)
        .in('status', ['pending', 'in_progress'])
        .order('assigned_at', { ascending: false })
        .limit(5)

      setRecentOrders(ordersRes.data || [])
      setTodayEvents(eventsRes.data || [])

    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Bem-vindo, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-blue-100">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Star className="w-8 h-8 text-yellow-300" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Concluídas Hoje</span>
            </div>
            <p className="text-3xl font-bold">{stats.completedToday}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Em Andamento</span>
            </div>
            <p className="text-3xl font-bold">{stats.inProgressOrders}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          onClick={() => navigate('/mobile/orders')}
          whileTap={{ scale: 0.95 }}
          className="bg-white rounded-2xl p-6 shadow-lg text-left"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingOrders}</p>
          <p className="text-sm text-gray-600 font-medium">OS Pendentes</p>
        </motion.button>

        <motion.button
          onClick={() => navigate('/mobile/agenda')}
          whileTap={{ scale: 0.95 }}
          className="bg-white rounded-2xl p-6 shadow-lg text-left"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.todayEvents}</p>
          <p className="text-sm text-gray-600 font-medium">Eventos Hoje</p>
        </motion.button>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Minhas OS</h2>
            <button
              onClick={() => navigate('/mobile/orders')}
              className="text-blue-600 font-semibold text-sm"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((assignment: any) => (
              <motion.button
                key={assignment.id}
                onClick={() => navigate(`/service-orders/${assignment.service_orders.id}/mobile`)}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white rounded-2xl p-4 shadow-lg text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900 text-lg">
                        OS #{assignment.service_orders.order_number}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                        getStatusColor(assignment.status)
                      }`}>
                        {getStatusLabel(assignment.status)}
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {assignment.service_orders.customers?.name}
                    </p>
                  </div>
                  <ClipboardList className="w-6 h-6 text-gray-400 flex-shrink-0" />
                </div>
                {assignment.service_orders.scheduled_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(assignment.service_orders.scheduled_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Agenda de Hoje</h2>
            <button
              onClick={() => navigate('/mobile/agenda')}
              className="text-blue-600 font-semibold text-sm"
            >
              Ver agenda
            </button>
          </div>
          <div className="space-y-3">
            {todayEvents.map((event: any) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl p-4 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    {event.start_time && (
                      <p className="text-sm text-blue-600 font-semibold mt-2">
                        {event.start_time.substring(0, 5)}
                        {event.end_time && ` - ${event.end_time.substring(0, 5)}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentOrders.length === 0 && todayEvents.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Tudo em dia!</h3>
          <p className="text-gray-600">
            Você não tem ordens de serviço ou eventos pendentes no momento.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          onClick={() => navigate('/mobile/library')}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl text-left"
        >
          <Award className="w-8 h-8 mb-3" />
          <p className="font-bold text-lg">Biblioteca</p>
          <p className="text-sm text-purple-100">Manuais e docs</p>
        </motion.button>

        <motion.button
          onClick={() => navigate('/mobile/routes')}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-xl text-left"
        >
          <TrendingUp className="w-8 h-8 mb-3" />
          <p className="font-bold text-lg">Minhas Rotas</p>
          <p className="text-sm text-green-100">Rastreamento</p>
        </motion.button>
      </div>
    </div>
  )
}

export default MobileHome
