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

const createDateFromLocalString = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0)
}

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getLocalTimeString = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export const mapAgendaEventToCalendarEvent = (event: any): CalendarEvent => {
  const startDate = event.start_date || event.start_time
  const endDate = event.end_date || event.start_date || event.start_time

  if (!startDate) {
    console.error('Event without start date:', event)
    return null as any
  }

  const startDateTime = new Date(startDate)
  const endDateTime = new Date(endDate)

  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    console.error('Invalid date in event:', event)
    return null as any
  }

  return {
    id: event.id,
    title: event.title || 'Sem título',
    start: startDateTime,
    end: endDateTime,
    date: getLocalDateString(startDateTime),
    time: getLocalTimeString(startDateTime),
    endDate: getLocalDateString(endDateTime),
    endTime: getLocalTimeString(endDateTime),
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

export const mapCalendarEventToAgendaEvent = (event: CalendarEvent | any) => {
  let startDate: Date
  let endDate: Date

  if (typeof event.start === 'string' || !event.start) {
    const dateStr = event.date || getLocalDateString(new Date())
    const timeStr = event.time || '00:00'
    startDate = createDateFromLocalString(dateStr, timeStr)

    const endDateStr = event.endDate || dateStr
    const endTimeStr = event.endTime || timeStr
    endDate = createDateFromLocalString(endDateStr, endTimeStr)
  } else {
    startDate = event.start instanceof Date ? event.start : new Date(event.start)
    endDate = event.end instanceof Date ? event.end : new Date(event.end)
  }

  if (isNaN(startDate.getTime())) {
    throw new Error('Data de início inválida')
  }
  if (isNaN(endDate.getTime())) {
    throw new Error('Data de término inválida')
  }

  if (endDate < startDate) {
    throw new Error('Data de término não pode ser anterior à data de início')
  }

  const isValidUUID = (value: any): boolean => {
    if (!value || typeof value !== 'string') return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
  }

  const agendaEvent: any = {
    title: event.title,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    event_type: event.type || 'pessoal',
    priority: event.priority || 'medium',
    status: event.status || 'scheduled'
  }

  if (isValidUUID(event.assignedTo)) {
    agendaEvent.employee_id = event.assignedTo
  }
  if (isValidUUID(event.customerId)) {
    agendaEvent.customer_id = event.customerId
  }
  if (isValidUUID(event.serviceOrderId)) {
    agendaEvent.service_order_id = event.serviceOrderId
  }

  if (event.location && event.location.trim()) {
    agendaEvent.location = event.location
  }
  if (event.description && event.description.trim()) {
    agendaEvent.description = event.description
  }

  return agendaEvent
}

export const expandMultiDayEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  const expanded: CalendarEvent[] = []

  events.forEach(event => {
    const start = new Date(event.start)
    const end = new Date(event.end)

    if (isSameDay(start, end)) {
      expanded.push({
        ...event,
        date: getLocalDateString(start),
        time: getLocalTimeString(start),
        endDate: getLocalDateString(end),
        endTime: getLocalTimeString(end)
      })
      return
    }

    const currentDate = new Date(start)
    while (currentDate <= end) {
      const isLastDay = isSameDay(currentDate, end)
      const dayEnd = isLastDay
        ? new Date(end)
        : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59)

      expanded.push({
        ...event,
        start: new Date(currentDate),
        end: dayEnd,
        date: getLocalDateString(currentDate),
        time: getLocalTimeString(currentDate),
        endDate: getLocalDateString(dayEnd),
        endTime: getLocalTimeString(dayEnd)
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
