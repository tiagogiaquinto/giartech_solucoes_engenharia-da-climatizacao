import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import { Task, PRIORITY_CONFIG } from './types'
import {
  startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval,
  format, isSameDay, isToday, parseISO
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CalendarViewProps {
  tasks: Task[]
  onOpenTask: (id: string) => void
}

export function CalendarView({ tasks, onOpenTask }: CalendarViewProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const days = useMemo(() =>
    eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) }),
    [weekStart]
  )

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {}
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      map[key] = tasks.filter(t => {
        if (!t.due_date) return false
        const taskDate = t.due_date.substring(0, 10)
        return taskDate === key
      })
    })
    return map
  }, [tasks, days])

  const unscheduled = useMemo(() =>
    tasks.filter(t => !t.due_date && t.column_id !== 'done'),
    [tasks]
  )

  const totalWeekTasks = days.reduce((acc, day) => {
    const key = format(day, 'yyyy-MM-dd')
    return acc + (tasksByDay[key]?.length || 0)
  }, 0)

  return (
    <div className="px-6 pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart(d => subWeeks(d, 1))}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition shadow-sm"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">
              {format(weekStart, "d 'de' MMMM", { locale: ptBR })} —{' '}
              {format(endOfWeek(weekStart, { weekStartsOn: 1 }), "d 'de' MMMM yyyy", { locale: ptBR })}
            </p>
            <p className="text-xs text-gray-400">{totalWeekTasks} tarefa{totalWeekTasks !== 1 ? 's' : ''} esta semana</p>
          </div>
          <button
            onClick={() => setWeekStart(d => addWeeks(d, 1))}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition shadow-sm"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
          >
            Hoje
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDay[key] || []
          const today = isToday(day)
          const dayLabel = format(day, 'EEE', { locale: ptBR })
          const dayNum = format(day, 'd')

          return (
            <div
              key={key}
              className={`rounded-2xl border min-h-[200px] flex flex-col transition-all ${
                today
                  ? 'border-blue-400 bg-blue-50/50 shadow-md'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className={`px-3 py-2 border-b flex items-center justify-between rounded-t-2xl ${today ? 'border-blue-200 bg-blue-100' : 'border-gray-100 bg-gray-50'}`}>
                <span className={`text-xs font-semibold uppercase tracking-wide ${today ? 'text-blue-700' : 'text-gray-500'}`}>
                  {dayLabel}
                </span>
                <span className={`text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                  today ? 'bg-blue-600 text-white' : 'text-gray-700'
                }`}>
                  {dayNum}
                </span>
              </div>

              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-64">
                {dayTasks.map(task => {
                  const pri = PRIORITY_CONFIG[task.priority]
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onOpenTask(task.id)}
                      className={`p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${pri.bg} ${pri.border} group`}
                    >
                      <p className={`text-xs font-semibold leading-tight ${pri.text} line-clamp-2`}>{task.title}</p>
                      {task.assignee_name && (
                        <div className="flex items-center gap-1 mt-1">
                          <User className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-500 truncate">{task.assignee_name}</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
                {dayTasks.length === 0 && (
                  <div className="flex items-center justify-center h-full py-4 text-gray-300 text-xs">
                    Livre
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {unscheduled.length > 0 && (
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-600">Sem prazo definido ({unscheduled.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map(task => {
              const pri = PRIORITY_CONFIG[task.priority]
              return (
                <button
                  key={task.id}
                  onClick={() => onOpenTask(task.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition hover:shadow-sm ${pri.bg} ${pri.text} ${pri.border}`}
                >
                  {task.title}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
