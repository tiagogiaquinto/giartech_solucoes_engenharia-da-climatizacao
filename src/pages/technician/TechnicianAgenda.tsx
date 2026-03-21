import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Wrench,
  CheckCircle2,
  RefreshCw,
  Navigation,
  Phone
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

interface AgendaEvent {
  id: string
  order_number?: string
  title?: string
  client_name?: string
  client_address?: string
  client_city?: string
  client_phone?: string
  scheduled_at?: string
  scheduled_time?: string
  status: string
  priority?: string
  equipment?: string
  brand?: string
  model?: string
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  pending: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  in_progress: { label: 'Em Execucao', bg: 'bg-blue-100', text: 'text-blue-700', icon: Wrench },
  completed: { label: 'Concluida', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-700', icon: Clock },
  pausado: { label: 'Pausada', bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock }
}

const TechnicianAgenda = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [currentDate, user])

  const loadEvents = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('v_technician_service_orders')
        .select('*')
        .gte('scheduled_at', startOfMonth.toISOString())
        .lte('scheduled_at', endOfMonth.toISOString())
        .order('scheduled_at', { ascending: true })

      if (error) {
        const { data: fallbackData } = await supabase
          .from('service_orders')
          .select(`
            id,
            order_number,
            title,
            client_name,
            client_address,
            client_city,
            client_phone,
            scheduled_at,
            scheduled_time,
            status,
            priority,
            equipment,
            brand,
            model
          `)
          .gte('scheduled_at', startOfMonth.toISOString())
          .lte('scheduled_at', endOfMonth.toISOString())
          .order('scheduled_at', { ascending: true })

        setEvents(fallbackData || [])
      } else {
        setEvents(data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []

    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0]

    return events.filter(e => {
      if (!e.scheduled_at) return false
      return e.scheduled_at.startsWith(dateStr)
    })
  }

  const getEventsForSelectedDate = () => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    return events.filter(e => {
      if (!e.scheduled_at) return false
      return e.scheduled_at.startsWith(dateStr)
    })
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    )
  }

  const selectDay = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
  }

  const formatTime = (dateStr?: string, timeStr?: string) => {
    if (timeStr) return timeStr
    if (!dateStr) return '--:--'
    try {
      return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '--:--'
    }
  }

  const openInMaps = (address: string, city?: string) => {
    const query = city ? `${address}, ${city}` : address
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank')
  }

  const days = getDaysInMonth()
  const selectedEvents = getEventsForSelectedDate()

  const pendingCount = events.filter(e => e.status === 'pending').length
  const inProgressCount = events.filter(e => e.status === 'in_progress').length
  const completedCount = events.filter(e => e.status === 'completed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Carregando agenda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500">{events.length} servicos neste mes</p>
        </div>
        <button
          onClick={() => loadEvents(true)}
          disabled={refreshing}
          className="p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-transform"
        >
          <RefreshCw className={`w-5 h-5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-xs text-amber-600 font-medium">Pendentes</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{inProgressCount}</p>
          <p className="text-xs text-blue-600 font-medium">Em Execucao</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{completedCount}</p>
          <p className="text-xs text-green-600 font-medium">Concluidas</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-xl active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-xl active:scale-95 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 px-2 pt-2">
          {WEEKDAYS.map((day, i) => (
            <div key={i} className="text-center text-xs font-semibold text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 p-2 pb-4">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const dayEvents = getEventsForDay(day)
            const hasEvents = dayEvents.length > 0
            const hasPending = dayEvents.some(e => e.status === 'pending')
            const hasInProgress = dayEvents.some(e => e.status === 'in_progress')

            return (
              <button
                key={day}
                onClick={() => selectDay(day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-90 ${
                  isSelected(day)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : isToday(day)
                    ? 'bg-blue-100 text-blue-700 font-bold'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span className={`text-sm font-semibold ${
                  isSelected(day) ? 'text-white' : ''
                }`}>
                  {day}
                </span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasPending && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isSelected(day) ? 'bg-white' : 'bg-amber-500'
                      }`} />
                    )}
                    {hasInProgress && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isSelected(day) ? 'bg-white' : 'bg-blue-500'
                      }`} />
                    )}
                    {!hasPending && !hasInProgress && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isSelected(day) ? 'bg-white' : 'bg-green-500'
                      }`} />
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3 capitalize">
          {selectedDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
          })}
        </h3>

        {selectedEvents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-900 mb-2">Sem agendamentos</h4>
            <p className="text-gray-500">Nenhuma OS para este dia</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {selectedEvents.map((event, index) => {
                const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.pending
                const StatusIcon = statusConfig.icon
                const time = formatTime(event.scheduled_at, event.scheduled_time)

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden w-full"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {event.client_name || 'Cliente nao informado'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            OS #{event.order_number}
                          </p>
                        </div>
                        {time && (
                          <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-xl">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-bold text-gray-700">{time}</span>
                          </div>
                        )}
                      </div>

                      {event.equipment && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Wrench className="w-4 h-4 text-gray-400" />
                          <span>{event.equipment} {event.brand && `- ${event.brand}`} {event.model && event.model}</span>
                        </div>
                      )}

                      {event.client_address && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openInMaps(event.client_address!, event.client_city)
                          }}
                          className="flex items-center gap-2 text-sm text-blue-600 mb-2 active:opacity-70"
                        >
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{event.client_address}</span>
                          <Navigation className="w-3 h-3" />
                        </button>
                      )}

                      {event.client_phone && (
                        <a
                          href={`tel:${event.client_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 text-sm text-green-600 mb-3"
                        >
                          <Phone className="w-4 h-4" />
                          <span>{event.client_phone}</span>
                        </a>
                      )}

                      <button
                        onClick={() => navigate(`/tecnico/os/${event.id}`)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold active:scale-[0.98] transition-all"
                      >
                        <StatusIcon className="w-5 h-5" />
                        {event.status === 'completed' ? 'Ver Detalhes' :
                         event.status === 'in_progress' ? 'Continuar Execucao' :
                         'Iniciar OS'}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default TechnicianAgenda
