import { AgendaEvent } from '../lib/supabase'

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  endDate?: string
  endTime?: string
  type: 'pessoal' | 'networking' | 'financeiro' | 'cobrar' | 'pagar' | 'operacional'
  priority: 'low' | 'medium' | 'high'
  status: 'a_fazer' | 'em_andamento' | 'feito' | 'cancelado'
  assignedTo?: string
  location?: string
  description?: string
  color?: string
}

export const eventTypeColors = {
  pessoal: '#8b5cf6',
  networking: '#3b82f6',
  financeiro: '#10b981',
  cobrar: '#f59e0b',
  pagar: '#ef4444',
  operacional: '#06b6d4'
}

export const eventTypeLabels = {
  pessoal: 'Pessoal',
  networking: 'Networking',
  financeiro: 'Financeiro',
  cobrar: 'Cobrar',
  pagar: 'Pagar',
  operacional: 'Operacional'
}

const statusUIToDb = {
  'a_fazer': 'scheduled',
  'em_andamento': 'in_progress',
  'feito': 'completed',
  'cancelado': 'cancelled'
} as const

const statusDbToUI = {
  'scheduled': 'a_fazer',
  'in_progress': 'em_andamento',
  'confirmed': 'em_andamento',
  'completed': 'feito',
  'cancelled': 'cancelado'
} as const

// Mapeamento de tipos da UI (português) para o banco (inglês)
const typeUIToDb = {
  'pessoal': 'meeting',
  'networking': 'meeting',
  'financeiro': 'task',
  'operacional': 'task',
  'cobrar': 'reminder',
  'pagar': 'reminder'
} as const

// Mapeamento de tipos do banco (inglês) para a UI (português)
const typeDbToUI = {
  'meeting': 'pessoal',
  'task': 'operacional',
  'service_order': 'operacional',
  'appointment': 'pessoal',
  'reminder': 'cobrar',
  'other': 'pessoal'
} as const

// Converter AgendaEvent do banco para CalendarEvent da UI
export const mapAgendaEventToCalendarEvent = (agendaEvent: AgendaEvent): CalendarEvent => {
  const startDate = new Date(agendaEvent.start_date)

  // Usar o timezone local do navegador para extrair data/hora de início
  const year = startDate.getFullYear()
  const month = String(startDate.getMonth() + 1).padStart(2, '0')
  const day = String(startDate.getDate()).padStart(2, '0')
  const hours = String(startDate.getHours()).padStart(2, '0')
  const minutes = String(startDate.getMinutes()).padStart(2, '0')

  const date = `${year}-${month}-${day}`
  const time = `${hours}:${minutes}`

  // Extrair data/hora de término se existir
  let endDate: string | undefined
  let endTime: string | undefined
  if (agendaEvent.end_date) {
    const endDateTime = new Date(agendaEvent.end_date)
    const endYear = endDateTime.getFullYear()
    const endMonth = String(endDateTime.getMonth() + 1).padStart(2, '0')
    const endDay = String(endDateTime.getDate()).padStart(2, '0')
    const endHours = String(endDateTime.getHours()).padStart(2, '0')
    const endMinutes = String(endDateTime.getMinutes()).padStart(2, '0')

    endDate = `${endYear}-${endMonth}-${endDay}`
    endTime = `${endHours}:${endMinutes}`
  }

  const dbType = agendaEvent.event_type as keyof typeof typeDbToUI
  const uiType = typeDbToUI[dbType] || 'pessoal'
  const dbStatus = agendaEvent.status as keyof typeof statusDbToUI

  return {
    id: agendaEvent.id,
    title: agendaEvent.title || 'Sem título',
    date: date,
    time: time,
    endDate: endDate,
    endTime: endTime,
    type: uiType,
    priority: (agendaEvent.priority || 'medium') as CalendarEvent['priority'],
    status: statusDbToUI[dbStatus] || 'a_fazer',
    assignedTo: agendaEvent.employee_id,
    location: agendaEvent.location,
    description: agendaEvent.description || agendaEvent.notes,
    color: eventTypeColors[uiType] || eventTypeColors.pessoal
  }
}

// Converter CalendarEvent da UI para AgendaEvent do banco
export const mapCalendarEventToAgendaEvent = (calendarEvent: Partial<CalendarEvent>): Partial<AgendaEvent> => {
  const uiStatus = calendarEvent.status as keyof typeof statusUIToDb

  // Combinar data e hora para criar start_date
  let startDateTime: string
  if (calendarEvent.date && calendarEvent.time) {
    const [year, month, day] = calendarEvent.date.split('-').map(Number)
    const [hours, minutes] = calendarEvent.time.split(':').map(Number)
    const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
    startDateTime = localDate.toISOString()
  } else {
    startDateTime = new Date().toISOString()
  }

  // Combinar endDate e endTime para criar end_date
  let endDateTime: string
  if (calendarEvent.endDate && calendarEvent.endTime) {
    const [year, month, day] = calendarEvent.endDate.split('-').map(Number)
    const [hours, minutes] = calendarEvent.endTime.split(':').map(Number)
    const localEndDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
    endDateTime = localEndDate.toISOString()
  } else {
    // Se não tiver end date/time, usar start date + 1 hora
    const defaultEnd = new Date(startDateTime)
    defaultEnd.setHours(defaultEnd.getHours() + 1)
    endDateTime = defaultEnd.toISOString()
  }

  // Validar se assignedTo é UUID válido, senão enviar null
  const isValidUUID = (str: string | undefined) => {
    if (!str) return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Mapear tipo da UI para o banco
  const uiType = calendarEvent.type as keyof typeof typeUIToDb
  const dbType = uiType ? typeUIToDb[uiType] : 'meeting'

  return {
    title: calendarEvent.title || calendarEvent.description || 'Sem título',
    description: calendarEvent.description,
    start_date: startDateTime,
    end_date: endDateTime,
    all_day: false,
    event_type: dbType,
    status: uiStatus ? statusUIToDb[uiStatus] : 'scheduled',
    priority: calendarEvent.priority,
    employee_id: isValidUUID(calendarEvent.assignedTo) ? calendarEvent.assignedTo : null,
    location: calendarEvent.location,
    notes: calendarEvent.description
  }
}

// Função para verificar se um evento ocorre em uma data específica
export const eventOccursOnDate = (event: CalendarEvent, targetDate: string): boolean => {
  const target = new Date(targetDate + 'T00:00:00')
  const eventStart = new Date(event.date + 'T00:00:00')

  if (!event.endDate) {
    // Evento de um único dia
    return event.date === targetDate
  }

  const eventEnd = new Date(event.endDate + 'T00:00:00')

  // Verifica se a data alvo está entre início e fim (inclusive)
  return target >= eventStart && target <= eventEnd
}

// Função para expandir eventos multi-dia em eventos individuais por dia
export const expandMultiDayEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  const expandedEvents: CalendarEvent[] = []

  events.forEach(event => {
    if (!event.endDate || event.date === event.endDate) {
      // Evento de um único dia
      expandedEvents.push(event)
    } else {
      // Evento multi-dia - criar uma entrada para cada dia
      const startDate = new Date(event.date + 'T00:00:00')
      const endDate = new Date(event.endDate + 'T00:00:00')

      let currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]

        expandedEvents.push({
          ...event,
          date: dateStr,
          // Marcar visualmente que é multi-dia
          title: event.title + (currentDate.getTime() === startDate.getTime() ? ' 🏁' :
                 currentDate.getTime() === endDate.getTime() ? ' 🏁' : ' ⏳')
        })

        currentDate.setDate(currentDate.getDate() + 1)
      }
    }
  })

  return expandedEvents
}
