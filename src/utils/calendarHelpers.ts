export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type?: string
  priority?: string
  status?: string
  assignedTo?: string
  location?: string
  description?: string
  customer?: {
    id: string
    nome_razao: string
    nome_fantasia?: string
    email?: string
    telefone?: string
    celular?: string
    tipo_pessoa: string
    cpf?: string
    cnpj?: string
  }
  employee?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  service_order?: {
    id: string
    order_number: string
    status: string
  }
  [key: string]: any
}

export const mapAgendaEventToCalendarEvent = (event: any): CalendarEvent => {
  // Priorizar start_date, mas aceitar start_time como fallback
  const startDate = event.start_date || event.start_time
  const endDate = event.end_date || event.start_date || event.start_time

  if (!startDate) {
    console.error('Event without start date:', event)
    return null as any
  }

  const startDateTime = new Date(startDate)
  const endDateTime = new Date(endDate)

  return {
    id: event.id,
    title: event.title || 'Sem título',
    start: startDateTime,
    end: endDateTime,
    // Adicionar compatibilidade com Calendar.tsx que usa date e time
    date: startDateTime.toISOString().split('T')[0],
    time: startDateTime.toTimeString().substring(0, 5),
    type: event.event_type || 'pessoal',
    priority: event.priority || 'medium',
    status: event.status || 'scheduled',
    assignedTo: event.employee_id,
    location: event.location || '',
    description: event.description || event.notes || '',
    customer: event.customer || null,
    employee: event.employee || null,
    service_order: event.service_order || null
  }
}

export const mapCalendarEventToAgendaEvent = (event: CalendarEvent) => {
  return {
    title: event.title,
    start_date: event.start.toISOString(),
    end_date: event.end.toISOString(),
    event_type: event.type || 'pessoal',
    priority: event.priority || 'medium',
    status: event.status || 'scheduled',
    employee_id: event.assignedTo,
    location: event.location,
    description: event.description
  }
}

export const expandMultiDayEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  const expanded: CalendarEvent[] = []

  events.forEach(event => {
    const start = new Date(event.start)
    const end = new Date(event.end)

    // Se o evento é de um único dia ou menos de 24h
    if (isSameDay(start, end)) {
      expanded.push(event)
      return
    }

    // Se é multi-dia, criar uma entrada para cada dia
    const currentDate = new Date(start)
    while (currentDate <= end) {
      expanded.push({
        ...event,
        start: new Date(currentDate),
        end: isSameDay(currentDate, end) ? new Date(end) : new Date(currentDate.setHours(23, 59, 59))
      })
      currentDate.setDate(currentDate.getDate() + 1)
      currentDate.setHours(0, 0, 0, 0)
    }
  })

  return expanded
}

export const getWeekDays = () => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const getMonthDays = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  return {
    firstDay,
    lastDay,
    daysInMonth: lastDay.getDate(),
    startingDayOfWeek: firstDay.getDay()
  }
}

export const formatEventTime = (date: Date) => {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export const isToday = (date: Date) => {
  const today = new Date()
  return isSameDay(date, today)
}

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}
