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
  [key: string]: any
}

export const mapAgendaEventToCalendarEvent = (event: any): CalendarEvent => event
export const mapCalendarEventToAgendaEvent = (event: CalendarEvent) => event
export const expandMultiDayEvents = (events: CalendarEvent[]) => events
export const getWeekDays = () => []
export const getMonthDays = () => []
export const formatEventTime = (date: Date) => ''
export const isToday = (date: Date) => false
export const isSameDay = (d1: Date, d2: Date) => false
