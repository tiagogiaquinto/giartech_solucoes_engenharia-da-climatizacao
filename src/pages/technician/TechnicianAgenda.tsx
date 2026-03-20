import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  User,
  Wrench,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

interface AgendaEvent {
  id: string
  order_number?: string
  title?: string
  client_name?: string
  client_address?: string
  scheduled_at?: string
  scheduled_time?: string
  status: string
  priority?: string
  equipment?: string
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const TechnicianAgenda = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  useEffect(() => {
    loadEvents()
  }, [currentDate, user])

  const loadEvents = async () => {
    setLoading(true)
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
            scheduled_at,
            scheduled_time,
            status,
            priority,
            equipment
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

  const days = getDaysInMonth()
  const selectedEvents = getEventsForSelectedDate()

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <button
          onClick={() => loadEvents()}
          disabled={loading}
          className="p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-transform"
        >
          <RefreshCw className={`w-5 h-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
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

        <div className="grid grid-cols-7 gap-1 p-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}

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
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  isSelected(day)
                    ? 'bg-blue-600 text-white'
                    : isToday(day)
                    ? 'bg-blue-100 text-blue-700'
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
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          {selectedDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
          })}
        </h3>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : selectedEvents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">Sem agendamentos</h4>
            <p className="text-gray-500">Nenhuma OS para este dia</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {selectedEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/tecnico/os/${event.id}`)}
                  className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      event.status === 'completed' ? 'bg-green-100' :
                      event.status === 'in_progress' ? 'bg-blue-100' :
                      'bg-amber-100'
                    }`}>
                      {event.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : event.status === 'in_progress' ? (
                        <Wrench className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Clock className="w-6 h-6 text-amber-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900 truncate">
                          {event.client_name || 'Cliente'}
                        </h4>
                        <span className="text-sm font-semibold text-blue-600">
                          {formatTime(event.scheduled_at, event.scheduled_time)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mb-2">
                        OS #{event.order_number}
                      </p>

                      {event.equipment && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Wrench className="w-3 h-3" />
                          <span>{event.equipment}</span>
                        </div>
                      )}

                      {event.client_address && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.client_address}</span>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default TechnicianAgenda
