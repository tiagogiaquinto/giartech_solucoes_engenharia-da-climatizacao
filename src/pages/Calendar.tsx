import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Users, MapPin, X, Save, CircleCheck as CheckCircle, CircleAlert as AlertCircle, CreditCard as Edit, Trash2, ArrowRight, Flag, List, LayoutGrid, ChartGantt as GanttChart, GitBranch } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { getAgendaEvents, createAgendaEvent, updateAgendaEvent, deleteAgendaEvent, type AgendaEvent } from '../lib/supabase'
import { mapAgendaEventToCalendarEvent, mapCalendarEventToAgendaEvent, expandMultiDayEvents, type CalendarEvent } from '../utils/calendarHelpers'

interface CalendarProps {
  onPremiumFeature?: (feature: string) => void
}

type Event = CalendarEvent

const Calendar: React.FC<CalendarProps> = ({ onPremiumFeature }) => {
  const { isPremium } = useUser()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'calendar' | 'list' | 'board' | 'timeline' | 'gantt'>('calendar')
  const [calendarView, setCalendarView] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('monthly')
  const [showEventModal, setShowEventModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  // Carregar eventos do banco de dados
  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading agenda events...')

      const agendaEvents = await getAgendaEvents()
      console.log(`📥 Received ${agendaEvents.length} events from database`)

      const calendarEvents = agendaEvents
        .map(mapAgendaEventToCalendarEvent)
        .filter(event => event !== null)
      console.log(`📅 Mapped ${calendarEvents.length} calendar events`)

      // Expandir eventos multi-dia para aparecerem em todos os dias
      const expandedEvents = expandMultiDayEvents(calendarEvents)
      console.log(`📊 Expanded to ${expandedEvents.length} events (multi-day)`)

      setEvents(expandedEvents)
      console.log('✅ Events loaded successfully')
    } catch (error) {
      console.error('❌ Error loading events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    endDate: '',
    endTime: '',
    type: 'pessoal' as Event['type'],
    priority: 'medium' as Event['priority'],
    status: 'a_fazer' as Event['status'],
    location: '',
    assignedTo: '',
    description: ''
  })

  // Obter data de amanhã
  function getTomorrowDate() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ]

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Dias do mês anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({ date, isCurrentMonth: true })
    }
    
    // Completar com dias do próximo mês
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({ date: nextDate, isCurrentMonth: false })
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateString)
  }

  // Obter eventos para hoje
  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0]
    return events
      .filter(event => event.date === today)
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  // Obter eventos para amanhã
  const getTomorrowEvents = () => {
    const tomorrow = getTomorrowDate()
    return events
      .filter(event => event.date === tomorrow)
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setNewEvent(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }))
    
    // Check if user can create events
    if (!isPremium && events.length >= 3) {
      onPremiumFeature && onPremiumFeature('Eventos Ilimitados')
      return
    }
    
    setShowEventModal(true)
  }

  const handleCreateEvent = async () => {
    if (newEvent.title && newEvent.date && newEvent.time) {
      try {
        const agendaEventData = mapCalendarEventToAgendaEvent(newEvent) as any
        await createAgendaEvent(agendaEventData)
        await loadEvents()

        setNewEvent({
          title: '',
          date: '',
          time: '',
          endDate: '',
          endTime: '',
          type: 'pessoal',
          priority: 'medium',
          status: 'a_fazer',
          location: '',
          assignedTo: '',
          description: ''
        })
        setShowEventModal(false)
      } catch (error) {
        console.error('Error creating event:', error)
        alert('Erro ao criar evento. Verifique os campos de data e hora.')
      }
    } else {
      alert('Por favor, preencha título, data e horário de início.')
    }
  }

  const handleUpdateEvent = async () => {
    if (showEditModal) {
      try {
        const updates = mapCalendarEventToAgendaEvent(showEditModal)
        await updateAgendaEvent(showEditModal.id, updates)
        await loadEvents()
        setShowEditModal(null)
      } catch (error) {
        console.error('Error updating event:', error)
        alert('Erro ao atualizar evento')
      }
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        await deleteAgendaEvent(id)
        await loadEvents()
        setShowEditModal(null)
      } catch (error) {
        console.error('Error deleting event:', error)
        alert('Erro ao excluir evento')
      }
    }
  }

  const handleCompleteTask = async (id: string) => {
    try {
      await updateAgendaEvent(id, { status: 'feito' })
      await loadEvents()
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Erro ao completar tarefa')
    }
  }

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'pessoal': return 'bg-purple-600'
      case 'networking': return 'bg-blue-500'
      case 'financeiro': return 'bg-green-500'
      case 'cobrar': return 'bg-yellow-500'
      case 'pagar': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getEventTypeText = (type: Event['type']) => {
    switch (type) {
      case 'pessoal': return 'Pessoal'
      case 'networking': return 'Networking'
      case 'financeiro': return 'Financeiro'
      case 'operacional': return 'Operacional'
      case 'cobrar': return 'Cobrar'
      case 'pagar': return 'Pagar'
      default: return 'Evento'
    }
  }

  const getPriorityColor = (priority: Event['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: Event['priority']) => {
    switch (priority) {
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return 'Normal'
    }
  }

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'a_fazer': return 'bg-yellow-100 text-yellow-800'
      case 'em_andamento': return 'bg-blue-100 text-blue-800'
      case 'feito': return 'bg-green-100 text-green-800'
      case 'cancelado': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Event['status']) => {
    switch (status) {
      case 'a_fazer': return 'A Fazer'
      case 'em_andamento': return 'Em Andamento'
      case 'feito': return 'Concluído'
      case 'cancelado': return 'Cancelado'
      default: return 'Desconhecido'
    }
  }

  const renderMonthlyView = () => {
    const days = getDaysInMonth(currentDate)

    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, index) => (
          <div key={`weekday-${index}`} className="p-2 text-center font-semibold text-gray-600 bg-gray-50 text-xs">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day.date)
          const isToday = day.date.toDateString() === new Date().toDateString()
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(day.date)}
              className={`min-h-[70px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                !day.isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'
              } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
            >
              <div className={`text-xs font-medium mb-1 ${
                isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowEditModal(event)
                    }}
                    className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity ${getEventTypeColor(event.type)}`}
                  >
                    {event.time} {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeeklyView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }
    
    return (
      <div className="space-y-2">
        {/* Week Header */}
        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
            <div key={day} className="p-2 text-center font-semibold text-gray-600 bg-gray-50 text-xs">
              {day}
            </div>
          ))}
        </div>
        
        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDate(day)
            const isToday = day.toDateString() === new Date().toDateString()
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded text-white truncate ${getEventTypeColor(event.type)}`}
                    >
                      {event.time} {event.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDailyView = () => {
    const dayEvents = getEventsForDate(currentDate)
    const hours = Array.from({ length: 24 }, (_, i) => i)
    
    return (
      <div className="space-y-2">
        {/* Day Header */}
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <h3 className="font-semibold text-gray-900">
            {currentDate.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </h3>
          <p className="text-sm text-gray-600">{dayEvents.length} eventos agendados</p>
        </div>
        
        {/* Time Slots */}
        <div className="max-h-96 overflow-y-auto space-y-1">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              const eventHour = parseInt(event.time.split(':')[0])
              return eventHour === hour
            })
            
            return (
              <div key={hour} className="flex border-b border-gray-100 pb-2">
                <div className="w-16 text-xs text-gray-500 pt-1">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 min-h-[40px]">
                  {hourEvents.length > 0 ? (
                    <div className="space-y-1">
                      {hourEvents.map(event => (
                        <div
                          key={event.id}
                          className={`p-2 rounded text-white text-xs ${getEventTypeColor(event.type)}`}
                          onClick={() => setShowEditModal(event)}
                        >
                          <div className="font-medium">{event.title}</div>
                          <div className="opacity-80">{event.time}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div 
                      className="h-full hover:bg-gray-50 rounded cursor-pointer flex items-center justify-center text-gray-400 text-xs"
                      onClick={() => {
                        const newDate = new Date(currentDate)
                        newDate.setHours(hour, 0, 0, 0)
                        handleDateClick(newDate)
                      }}
                    >
                      Clique para adicionar evento
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.time.localeCompare(b.time)
    })

    return (
      <div className="divide-y divide-gray-200">
        {sortedEvents.length > 0 ? (
          sortedEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setShowEditModal(event)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`w-1 h-16 rounded-full ${getEventTypeColor(event.type)}`} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                        {getPriorityText(event.priority)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {getStatusText(event.status)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {new Date(event.date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.time}
                      </div>
                      {event.customer && (
                        <div className="flex items-center font-medium text-blue-600">
                          <User className="h-3 w-3 mr-1" />
                          {event.customer.nome_fantasia || event.customer.nome_razao}
                          {event.customer.telefone && ` • ${event.customer.telefone}`}
                        </div>
                      )}
                      {event.employee && (
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {event.employee.name}
                        </div>
                      )}
                      {event.service_order && (
                        <div className="flex items-center text-purple-600 font-medium">
                          <FileText className="h-3 w-3 mr-1" />
                          OS #{event.service_order.order_number}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-2">{event.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs text-white ${getEventTypeColor(event.type)}`}>
                    {getEventTypeText(event.type)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <List className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum evento cadastrado</p>
          </div>
        )}
      </div>
    )
  }

  const handleDragStart = (e: React.DragEvent, event: Event) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', JSON.stringify(event))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: Event['status']) => {
    e.preventDefault()
    try {
      const eventData = JSON.parse(e.dataTransfer.getData('text/html')) as Event
      if (eventData.status === targetStatus) return

      const updatedEvent: Event = { ...eventData, status: targetStatus }
      const agendaEvent = mapCalendarEventToAgendaEvent(updatedEvent)
      await updateAgendaEvent(eventData.id, agendaEvent)

      await loadEvents()
    } catch (error) {
      console.error('Error updating event status:', error)
    }
  }

  const renderBoardView = () => {
    const columns = [
      { status: 'a_fazer' as Event['status'], title: 'A Fazer', color: 'border-yellow-400', bgColor: 'bg-yellow-50' },
      { status: 'em_andamento' as Event['status'], title: 'Em Andamento', color: 'border-blue-400', bgColor: 'bg-blue-50' },
      { status: 'feito' as Event['status'], title: 'Concluído', color: 'border-green-400', bgColor: 'bg-green-50' },
      { status: 'cancelado' as Event['status'], title: 'Cancelado', color: 'border-gray-400', bgColor: 'bg-gray-50' }
    ]

    return (
      <div className="grid grid-cols-4 gap-4 p-4">
        {columns.map((column) => {
          const columnEvents = events.filter(e => e.status === column.status)
          return (
            <div
              key={column.status}
              className={`border-t-4 ${column.color} ${column.bgColor} rounded-lg min-h-[500px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="p-3 border-b border-gray-200 bg-white">
                <h3 className="font-medium text-gray-900 flex items-center justify-between">
                  {column.title}
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                    {columnEvents.length}
                  </span>
                </h3>
              </div>
              <div className="p-2 space-y-2 max-h-[450px] overflow-y-auto">
                {columnEvents.map((event) => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, event)}
                    className="bg-white p-3 rounded-lg shadow-sm hover:shadow-lg transition-all cursor-move border border-gray-200 hover:border-blue-300 active:opacity-50"
                    onDoubleClick={() => setShowEditModal(event)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900 flex-1">{event.title}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ml-2 ${getPriorityColor(event.priority)}`}>
                        <Flag className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        <Clock className="h-3 w-3 ml-2 mr-1" />
                        {event.time}
                      </div>
                      {event.customer && (
                        <>
                          <div className="flex items-center font-medium text-blue-600">
                            <User className="h-3 w-3 mr-1" />
                            <span className="truncate">{event.customer.nome_fantasia || event.customer.nome_razao}</span>
                          </div>
                          {event.customer.telefone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              <span className="truncate">{event.customer.telefone}</span>
                            </div>
                          )}
                          {event.customer.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              <span className="truncate">{event.customer.email}</span>
                            </div>
                          )}
                        </>
                      )}
                      {event.employee && (
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          <span className="truncate">{event.employee.name}</span>
                        </div>
                      )}
                      {event.service_order && (
                        <div className="flex items-center text-purple-600 font-medium">
                          <FileText className="h-3 w-3 mr-1" />
                          <span>OS #{event.service_order.order_number}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                    <div className={`mt-2 w-full h-1 rounded-full ${getEventTypeColor(event.type)}`} />
                    <div className="mt-2 text-xs text-gray-500 italic">
                      Arraste para mover ou clique 2x para editar
                    </div>
                  </div>
                ))}
                {columnEvents.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs border-2 border-dashed border-gray-300 rounded-lg">
                    <p>Arraste tarefas aqui</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderTimelineView = () => {
    const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date))
    const groupedByDate = sortedEvents.reduce((acc, event) => {
      const date = event.date
      if (!acc[date]) acc[date] = []
      acc[date].push(event)
      return acc
    }, {} as Record<string, Event[]>)

    return (
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(groupedByDate).map(([date, dateEvents]) => (
          <div key={date} className="flex">
            <div className="w-24 flex-shrink-0">
              <div className="sticky top-0 pt-1">
                <div className="text-xs font-medium text-gray-900">
                  {new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                </div>
              </div>
            </div>
            <div className="flex-1 border-l-2 border-gray-200 pl-4 pb-4">
              <div className="space-y-2">
                {dateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="relative bg-white p-3 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    style={{ borderLeftColor: getEventTypeColor(event.type).replace('bg-', '').replace('500', '') }}
                    onClick={() => setShowEditModal(event)}
                  >
                    <div className="absolute -left-[29px] top-4 w-3 h-3 rounded-full bg-white border-2"
                         style={{ borderColor: getEventTypeColor(event.type).replace('bg-', '').replace('500', '') }} />
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-900">{event.title}</h4>
                        <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600 flex-wrap">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {event.time}
                          </div>
                          {event.customer && (
                            <div className="flex items-center font-medium text-blue-600">
                              <User className="h-3 w-3 mr-1" />
                              {event.customer.nome_fantasia || event.customer.nome_razao}
                            </div>
                          )}
                          {event.employee && (
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {event.employee.name}
                            </div>
                          )}
                          {event.service_order && (
                            <div className="flex items-center text-purple-600 font-medium">
                              <FileText className="h-3 w-3 mr-1" />
                              OS #{event.service_order.order_number}
                            </div>
                          )}
                        </div>
                        {event.customer && (event.customer.telefone || event.customer.email) && (
                          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                            {event.customer.telefone && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {event.customer.telefone}
                              </div>
                            )}
                            {event.customer.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {event.customer.email}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                          {getPriorityText(event.priority)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                          {getStatusText(event.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {Object.keys(groupedByDate).length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum evento na linha do tempo</p>
          </div>
        )}
      </div>
    )
  }

  const renderGanttView = () => {
    const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date))
    const allDates = sortedEvents.map(e => e.date)
    const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => new Date(d).getTime()))) : new Date()
    const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => new Date(d).getTime()))) : new Date()

    const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const days = Array.from({ length: Math.max(daysDiff, 7) }, (_, i) => {
      const date = new Date(minDate)
      date.setDate(minDate.getDate() + i)
      return date
    })

    return (
      <div className="p-4">
        <div className="overflow-x-auto">
          {/* Header com datas */}
          <div className="flex mb-2 min-w-max">
            <div className="w-48 flex-shrink-0" />
            <div className="flex flex-1">
              {days.map((day, i) => (
                <div key={i} className="flex-1 min-w-[60px] text-center border-l border-gray-200 px-1">
                  <div className="text-xs font-medium text-gray-900">
                    {day.getDate()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Linhas de tarefas */}
          <div className="space-y-2">
            {sortedEvents.map((event) => {
              const eventDate = new Date(event.date)
              const dayIndex = Math.floor((eventDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))

              return (
                <div key={event.id} className="flex items-center hover:bg-gray-50 rounded transition-colors">
                  <div className="w-48 flex-shrink-0 pr-2">
                    <div className="text-sm font-medium text-gray-900 truncate">{event.title}</div>
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                  <div className="flex flex-1 relative h-12">
                    {days.map((_, i) => (
                      <div key={i} className="flex-1 min-w-[60px] border-l border-gray-200" />
                    ))}
                    <div
                      className={`absolute h-8 top-2 rounded cursor-pointer ${getEventTypeColor(event.type)} hover:opacity-80 transition-opacity`}
                      style={{
                        left: `${(dayIndex / days.length) * 100}%`,
                        width: `${(1 / days.length) * 100}%`
                      }}
                      onClick={() => setShowEditModal(event)}
                    >
                      <div className="px-2 py-1 text-white text-xs truncate">
                        {event.title}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {sortedEvents.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <GanttChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma tarefa para visualizar</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderBiWeeklyView = () => {
    const startOfPeriod = new Date(currentDate)
    startOfPeriod.setDate(currentDate.getDate() - currentDate.getDay())
    
    const weeks = []
    for (let week = 0; week < 2; week++) {
      const weekStart = new Date(startOfPeriod)
      weekStart.setDate(startOfPeriod.getDate() + (week * 7))
      
      const weekDays = []
      for (let day = 0; day < 7; day++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + day)
        weekDays.push(date)
      }
      weeks.push(weekDays)
    }
    
    return (
      <div className="space-y-4">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex}>
            <div className="text-xs font-medium text-gray-700 mb-2">
              Semana {weekIndex + 1} - {week[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} a {week[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
            </div>
            
            {/* Week Header */}
            <div className="grid grid-cols-7 gap-1">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                <div key={`day-${weekIndex}-${index}`} className="p-1 text-center font-semibold text-gray-600 bg-gray-50 text-xs">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                const dayEvents = getEventsForDate(day)
                const isToday = day.toDateString() === new Date().toDateString()
                
                return (
                  <div
                    key={dayIndex}
                    onClick={() => handleDateClick(day)}
                    className={`min-h-[60px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 1).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-0.5 rounded text-white truncate ${getEventTypeColor(event.type)}`}
                        >
                          {event.time}
                        </div>
                      ))}
                      {dayEvents.length > 1 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 1}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-3 space-y-4">
      {/* Header Compacto para App */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              Agenda
            </h1>
            <p className="text-xs text-gray-600">
              Gerencie seus compromissos
            </p>
          </div>
          <button
            onClick={() => {
              if (!isPremium && events.length >= 3) {
                onPremiumFeature && onPremiumFeature('Eventos Ilimitados')
                return
              }
              setShowEventModal(true)
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* Seletor de Visualizações Principais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
      >
        {/* Seleção de Visualização Principal */}
        <div className="flex justify-center mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-2 rounded-md transition-all text-xs font-medium flex items-center gap-1 ${
                view === 'calendar'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Calendário
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 rounded-md transition-all text-xs font-medium flex items-center gap-1 ${
                view === 'list'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              onClick={() => setView('board')}
              className={`px-3 py-2 rounded-md transition-all text-xs font-medium flex items-center gap-1 ${
                view === 'board'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Quadro
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-3 py-2 rounded-md transition-all text-xs font-medium flex items-center gap-1 ${
                view === 'timeline'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Linha
            </button>
            <button
              onClick={() => setView('gantt')}
              className={`px-3 py-2 rounded-md transition-all text-xs font-medium flex items-center gap-1 ${
                view === 'gantt'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <GanttChart className="h-3.5 w-3.5" />
              Gantt
            </button>
          </div>
        </div>

        {/* Seleção de Período do Calendário */}
        {view === 'calendar' && (
          <div className="flex justify-center mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setCalendarView(viewType)}
                  className={`px-3 py-1.5 rounded-md transition-colors text-xs font-medium ${
                    calendarView === viewType
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {viewType === 'daily' ? 'Dia' :
                   viewType === 'weekly' ? 'Sem' :
                   viewType === 'biweekly' ? 'Quinz' : 'Mês'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controles do Calendário */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {/* Nome do Mês Reduzido */}
          <h2 className="text-base font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Visualização Renderizada */}
        <div className="bg-white rounded-lg border border-gray-200">
          {view === 'calendar' && (
            <>
              {calendarView === 'monthly' && renderMonthlyView()}
              {calendarView === 'weekly' && renderWeeklyView()}
              {calendarView === 'biweekly' && renderBiWeeklyView()}
              {calendarView === 'daily' && renderDailyView()}
            </>
          )}
          {view === 'list' && renderListView()}
          {view === 'board' && renderBoardView()}
          {view === 'timeline' && renderTimelineView()}
          {view === 'gantt' && renderGanttView()}
        </div>
        
        {/* Visualization Info */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-700 flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {view === 'calendar' && 'Visualização em Calendário com múltiplos períodos'}
            {view === 'list' && 'Visualização em Lista organizada por data'}
            {view === 'board' && 'Visualização em Quadro Kanban por status'}
            {view === 'timeline' && 'Visualização em Linha do Tempo cronológica'}
            {view === 'gantt' && 'Visualização em Gráfico de Gantt'}
          </p>
        </div>

        {/* Lista de Compromissos do Mês Atual */}
        {view === 'calendar' && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <List className="h-4 w-4 mr-2 text-blue-500" />
              Compromissos do Mês
            </h3>
            <div className="space-y-2">
              {events
                .filter(event => {
                  const eventDate = new Date(event.date)
                  return eventDate.getMonth() === currentDate.getMonth() &&
                         eventDate.getFullYear() === currentDate.getFullYear()
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(event => (
                  <div
                    key={event.id}
                    onClick={() => setShowEditModal(event)}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`}></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(event.date).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </span>
                            {event.assignedTo && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.assignedTo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                          {getStatusText(event.status)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                          {getPriorityText(event.priority)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              {events.filter(event => {
                const eventDate = new Date(event.date)
                return eventDate.getMonth() === currentDate.getMonth() &&
                       eventDate.getFullYear() === currentDate.getFullYear()
              }).length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                  <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhum compromisso neste mês</p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Tarefas Pendentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-500" />
          Tarefas Pendentes
        </h2>
        
        {/* Tarefas de Hoje */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1 text-blue-500" />
              Hoje ({getTodayEvents().length})
            </h3>
            <span className="text-xs text-gray-500">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          
          {getTodayEvents().length > 0 ? (
            <div className="space-y-2">
              {getTodayEvents().map(event => (
                <div 
                  key={event.id}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`}></div>
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                        {getPriorityText(event.priority)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {getStatusText(event.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-3 w-3 mr-1 text-gray-400" />
                      {event.time}
                    </div>
                    {event.assignedTo && (
                      <div className="flex items-center text-gray-600">
                        <Users className="h-3 w-3 mr-1 text-gray-400" />
                        {event.assignedTo}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center text-gray-600 col-span-2 truncate">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {event.status !== 'feito' && (
                      <button
                        onClick={() => handleCompleteTask(event.id)}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs flex items-center"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Concluir
                      </button>
                    )}
                    <button
                      onClick={() => setShowEditModal(event)}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs flex items-center"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">Nenhuma tarefa para hoje</p>
            </div>
          )}
        </div>
        
        {/* Tarefas de Amanhã */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1 text-purple-500" />
              Amanhã ({getTomorrowEvents().length})
            </h3>
            <span className="text-xs text-gray-500">
              {new Date(getTomorrowDate()).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          
          {getTomorrowEvents().length > 0 ? (
            <div className="space-y-2">
              {getTomorrowEvents().map(event => (
                <div 
                  key={event.id}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`}></div>
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                        {getPriorityText(event.priority)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-3 w-3 mr-1 text-gray-400" />
                      {event.time}
                    </div>
                    {event.assignedTo && (
                      <div className="flex items-center text-gray-600">
                        <Users className="h-3 w-3 mr-1 text-gray-400" />
                        {event.assignedTo}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center text-gray-600 col-span-2 truncate">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowEditModal(event)}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs flex items-center"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs flex items-center"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">Nenhuma tarefa para amanhã</p>
            </div>
          )}
        </div>
        
        {/* Todas as Tarefas Link */}
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center mx-auto">
            <span>Ver todas as tarefas</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </motion.div>

      {/* Event Modal Otimizado para App */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div>
                <h2 className="text-2xl font-bold">Novo Compromisso</h2>
                <p className="text-blue-100 text-sm mt-1">Adicionar evento à agenda</p>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título do Compromisso <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Reunião com cliente"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value, endDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Término
                  </label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Término
                  </label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Compromisso
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value as Event['type']})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pessoal">Pessoal</option>
                    <option value="networking">Networking</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="operacional">Operacional</option>
                    <option value="cobrar">Cobrar</option>
                    <option value="pagar">Pagar</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({...newEvent, priority: e.target.value as Event['priority']})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável
                </label>
                <input
                  type="text"
                  value={newEvent.assignedTo}
                  onChange={(e) => setNewEvent({...newEvent, assignedTo: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Local do evento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Detalhes do compromisso..."
                />
              </div>
            </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowEventModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEvent}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                Salvar Compromisso
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div>
                <h2 className="text-2xl font-bold">Editar Compromisso</h2>
                <p className="text-blue-100 text-sm mt-1">Atualizar informações do evento</p>
              </div>
              <button
                onClick={() => setShowEditModal(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={showEditModal.title}
                  onChange={(e) => setShowEditModal({...showEditModal, title: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do evento"
                />
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={showEditModal.date}
                      onChange={(e) => setShowEditModal({...showEditModal, date: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário de Início
                    </label>
                    <input
                      type="time"
                      value={showEditModal.time}
                      onChange={(e) => setShowEditModal({...showEditModal, time: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Término
                    </label>
                    <input
                      type="date"
                      value={showEditModal.endDate || showEditModal.date}
                      onChange={(e) => setShowEditModal({...showEditModal, endDate: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário de Término
                    </label>
                    <input
                      type="time"
                      value={showEditModal.endTime || showEditModal.time}
                      onChange={(e) => setShowEditModal({...showEditModal, endTime: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={showEditModal.type}
                    onChange={(e) => setShowEditModal({...showEditModal, type: e.target.value as Event['type']})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pessoal">Pessoal</option>
                    <option value="networking">Networking</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="operacional">Operacional</option>
                    <option value="cobrar">Cobrar</option>
                    <option value="pagar">Pagar</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={showEditModal.priority}
                    onChange={(e) => setShowEditModal({...showEditModal, priority: e.target.value as Event['priority']})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={showEditModal.status}
                  onChange={(e) => setShowEditModal({...showEditModal, status: e.target.value as Event['status']})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="a_fazer">A Fazer</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="feito">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável
                </label>
                <input
                  type="text"
                  value={showEditModal.assignedTo || ''}
                  onChange={(e) => setShowEditModal({...showEditModal, assignedTo: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local
                </label>
                <input
                  type="text"
                  value={showEditModal.location || ''}
                  onChange={(e) => setShowEditModal({...showEditModal, location: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Local do evento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={showEditModal.description || ''}
                  onChange={(e) => setShowEditModal({...showEditModal, description: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Detalhes do evento"
                />
              </div>
            </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => handleDeleteEvent(showEditModal.id)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Excluir
              </button>
              <button
                onClick={() => setShowEditModal(null)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateEvent}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                Atualizar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Calendar