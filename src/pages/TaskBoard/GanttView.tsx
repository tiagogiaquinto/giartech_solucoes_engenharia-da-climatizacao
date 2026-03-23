import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays, User } from 'lucide-react'
import { Task, PRIORITY_CONFIG } from './types'
import {
  startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval,
  format, isToday, differenceInDays, isWithinInterval, parseISO,
  startOfDay, endOfDay
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GanttViewProps {
  tasks: Task[]
  onOpenTask: (id: string) => void
}

export function GanttView({ tasks, onOpenTask }: GanttViewProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  const monthStart = useMemo(() => startOfMonth(month), [month])
  const monthEnd = useMemo(() => endOfMonth(month), [month])
  const days = useMemo(() =>
    eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  )

  const ganttTasks = useMemo(() => {
    return tasks
      .filter(t => t.column_id !== 'done' || t.due_date)
      .filter(t => t.due_date)
      .map(t => {
        const startDate = t.created_at
          ? startOfDay(new Date(t.created_at))
          : monthStart
        const endDate = t.due_date
          ? endOfDay(new Date(t.due_date))
          : monthEnd

        const clampedStart = startDate < monthStart ? monthStart : startDate
        const clampedEnd = endDate > monthEnd ? monthEnd : endDate

        if (clampedStart > monthEnd || clampedEnd < monthStart) return null

        const totalDays = days.length
        const offsetDays = differenceInDays(clampedStart, monthStart)
        const durationDays = differenceInDays(clampedEnd, clampedStart) + 1

        const leftPct = (offsetDays / totalDays) * 100
        const widthPct = Math.max((durationDays / totalDays) * 100, 2)

        return {
          ...t,
          leftPct,
          widthPct,
          startDate,
          endDate,
        }
      })
      .filter(Boolean) as (Task & { leftPct: number; widthPct: number; startDate: Date; endDate: Date })[]
  }, [tasks, days, monthStart, monthEnd])

  const todayOffsetPct = useMemo(() => {
    const today = new Date()
    if (today < monthStart || today > monthEnd) return null
    return (differenceInDays(today, monthStart) / days.length) * 100
  }, [monthStart, monthEnd, days])

  const weekMarkers = useMemo(() => {
    const markers: { label: string; pct: number }[] = []
    days.forEach((day, idx) => {
      if (idx === 0 || day.getDay() === 1) {
        markers.push({
          label: format(day, 'd', { locale: ptBR }),
          pct: (idx / days.length) * 100,
        })
      }
    })
    return markers
  }, [days])

  return (
    <div className="px-6 pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonth(m => subMonths(m, 1))}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition shadow-sm"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div className="text-center min-w-[200px]">
            <p className="text-sm font-bold text-gray-800 capitalize">
              {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-xs text-gray-400">{ganttTasks.length} tarefa{ganttTasks.length !== 1 ? 's' : ''} com prazo</p>
          </div>
          <button
            onClick={() => setMonth(m => addMonths(m, 1))}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition shadow-sm"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
          >
            Mês Atual
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span>Em andamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-400" />
            <span>Atrasado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-300" />
            <span>Pendente</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex">
          <div className="w-56 shrink-0 border-r border-gray-200 bg-gray-50">
            <div className="px-4 py-3 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarefa</span>
            </div>
            {ganttTasks.map(task => (
              <div
                key={task.id}
                onClick={() => onOpenTask(task.id)}
                className="px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition flex flex-col justify-center h-14"
              >
                <p className="text-xs font-semibold text-gray-800 line-clamp-1">{task.title}</p>
                {task.assignee_name && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <User className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                    <span className="text-[10px] text-gray-500 truncate">{task.assignee_name}</span>
                  </div>
                )}
              </div>
            ))}
            {ganttTasks.length === 0 && (
              <div className="px-4 py-8 text-xs text-gray-400 text-center">
                Nenhuma tarefa com prazo neste mês
              </div>
            )}
          </div>

          <div className="flex-1 overflow-x-auto">
            <div className="relative" style={{ minWidth: '600px' }}>
              <div className="flex border-b border-gray-200 bg-gray-50">
                {weekMarkers.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full flex flex-col"
                    style={{ left: `${m.pct}%` }}
                  >
                    <div className="border-l border-gray-200 h-full absolute top-0" />
                    <span className="text-[10px] text-gray-400 px-1 pt-2 relative">{m.label}</span>
                  </div>
                ))}
                <div className="h-10 w-full" />
              </div>

              <div className="relative">
                {todayOffsetPct !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-blue-500 z-10"
                    style={{ left: `${todayOffsetPct}%` }}
                  >
                    <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                )}

                {ganttTasks.map(task => {
                  const pri = PRIORITY_CONFIG[task.priority]
                  const isLate = task.endDate < new Date() && task.column_id !== 'done'
                  const isActive = task.column_id === 'in_progress'

                  let barClass = 'bg-gray-300'
                  if (isLate) barClass = 'bg-red-400'
                  else if (isActive) barClass = 'bg-blue-500'

                  return (
                    <div
                      key={task.id}
                      className="relative h-14 border-b border-gray-100 flex items-center"
                    >
                      <motion.div
                        initial={{ scaleX: 0, originX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.05, duration: 0.4, ease: 'easeOut' }}
                        style={{
                          left: `${task.leftPct}%`,
                          width: `${task.widthPct}%`,
                        }}
                        onClick={() => onOpenTask(task.id)}
                        className={`absolute h-7 rounded-full ${barClass} cursor-pointer hover:brightness-110 transition shadow-sm flex items-center px-2 overflow-hidden`}
                        title={task.title}
                      >
                        <span className="text-white text-[10px] font-semibold truncate">{task.title}</span>
                      </motion.div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {tasks.filter(t => !t.due_date && t.column_id !== 'done').length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
          <span>{tasks.filter(t => !t.due_date && t.column_id !== 'done').length} tarefa(s) sem prazo definido — não aparecem no Gantt.</span>
        </div>
      )}
    </div>
  )
}
