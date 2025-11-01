import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

const MobileAgenda = () => {
  const { user } = useUser()
  const [events, setEvents] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [user, selectedDate])

  const loadEvents = async () => {
    if (!user?.employee_id) return

    try {
      setLoading(true)

      const dateStr = selectedDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('agenda_events')
        .select(`
          *,
          service_orders (
            order_number,
            customers (name)
          )
        `)
        .eq('employee_id', user.employee_id)
        .gte('event_date', dateStr)
        .lte('event_date', dateStr)
        .order('start_time', { ascending: true })

      setEvents(data || [])
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const isToday = () => {
    const today = new Date()
    return selectedDate.toDateString() === today.toDateString()
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      service: 'bg-blue-500',
      meeting: 'bg-purple-500',
      maintenance: 'bg-orange-500',
      training: 'bg-green-500',
      other: 'bg-gray-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      service: 'Serviço',
      meeting: 'Reunião',
      maintenance: 'Manutenção',
      training: 'Treinamento',
      other: 'Outro'
    }
    return labels[type] || type
  }

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-600" />
    if (status === 'cancelled') return <AlertCircle className="w-5 h-5 text-red-600" />
    return <Clock className="w-5 h-5 text-blue-600" />
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Minha Agenda</h1>
        <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
          {events.length}
        </div>
      </div>

      {/* Date Navigator */}
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {selectedDate.getDate()}
            </p>
            <p className="text-sm text-gray-600">
              {selectedDate.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <p className="text-xs text-blue-600 font-semibold">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
            </p>
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {isToday() && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <p className="text-sm font-semibold text-blue-700">
              📅 Hoje - {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}

        {!isToday() && (
          <button
            onClick={() => setSelectedDate(new Date())}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Voltar para Hoje
          </button>
        )}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Carregando eventos...</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <CalendarIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum evento</h3>
          <p className="text-gray-600">
            Você não tem eventos agendados para esta data
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-lg"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                      getEventTypeColor(event.event_type)
                    }`}>
                      {getEventTypeLabel(event.event_type)}
                    </span>
                    {getStatusIcon(event.status)}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 text-blue-600 font-semibold mb-3 bg-blue-50 rounded-xl p-3">
                <Clock className="w-5 h-5" />
                <span>
                  {event.start_time?.substring(0, 5)}
                  {event.end_time && ` - ${event.end_time.substring(0, 5)}`}
                </span>
              </div>

              {/* Additional Info */}
              <div className="space-y-2">
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}

                {event.service_orders && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      OS #{event.service_orders.order_number} - {event.service_orders.customers?.name}
                    </span>
                  </div>
                )}

                {event.notes && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-900">
                      <span className="font-semibold">Observações:</span> {event.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              {event.status === 'completed' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                    ✅ Concluído
                  </span>
                </div>
              )}
              {event.status === 'cancelled' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                    ❌ Cancelado
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MobileAgenda
