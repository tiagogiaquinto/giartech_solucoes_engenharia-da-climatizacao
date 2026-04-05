import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { AlertTriangle, Calendar, CheckSquare, User, GripVertical, Briefcase } from 'lucide-react'
import { Task, PRIORITY_CONFIG } from './types'

function isOverdue(dueDate?: string) {
  if (!dueDate) return false
  return new Date(dueDate + 'T12:00:00') < new Date()
}

function formatDate(d?: string) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

interface TaskCardProps {
  task: Task
  onClick: () => void
  overlay?: boolean
}

export function TaskCard({ task, onClick, overlay = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task } })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: overlay ? 999 : undefined,
  }

  const prio = PRIORITY_CONFIG[task.priority]
  const overdue = isOverdue(task.due_date)

  const blockedDays = task.blocked_since
    ? Math.floor((Date.now() - new Date(task.blocked_since).getTime()) / 86400000)
    : 0

  const subtaskPct = (task.subtasks_total ?? 0) > 0
    ? Math.round(((task.subtasks_done ?? 0) / (task.subtasks_total ?? 1)) * 100)
    : 0

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={onClick}
        className={`bg-white rounded-xl border p-3.5 select-none group transition-all
          ${overlay ? 'shadow-2xl border-blue-400 scale-[1.03] rotate-1' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}
        `}
      >
        <div className="flex items-start gap-2 mb-2">
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-sm font-semibold text-gray-800 leading-snug flex-1 group-hover:text-blue-700 transition-colors">
                {task.title}
              </p>
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${prio.bg} ${prio.text} ${prio.border}`}>
                {prio.label}
              </span>
            </div>

            {task.column_id === 'blocked' && blockedDays >= 1 && (
              <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1 mb-2">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Bloqueado há {blockedDays} dia{blockedDays > 1 ? 's' : ''}</span>
              </div>
            )}

            {task.description && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">{task.description}</p>
            )}

            {task.category && (
              <span className="inline-block text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 mb-2">
                {task.category}
              </span>
            )}

            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1.5 min-w-0">
                {task.assignee_name ? (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0">
                    {initials(task.assignee_name)}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User className="h-3 w-3 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0">
                  {task.assignee_name && (
                    <span className="text-xs text-gray-500 block truncate max-w-[90px]">{task.assignee_name}</span>
                  )}
                  {task.assignee_cargo && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-blue-600 truncate max-w-[90px]">
                      <Briefcase className="h-2 w-2 shrink-0" />
                      {task.assignee_cargo}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(task.subtasks_total ?? 0) > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <CheckSquare className="h-3 w-3" />
                    <span>{task.subtasks_done}/{task.subtasks_total}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                    <Calendar className="h-3 w-3" />
                    <span className={overdue ? 'animate-pulse' : ''}>{formatDate(task.due_date)}</span>
                  </div>
                )}
              </div>
            </div>

            {(task.subtasks_total ?? 0) > 0 && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-400">{subtaskPct}% concluído</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subtaskPct}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${subtaskPct === 100 ? 'bg-teal-500' : 'bg-blue-500'}`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TaskCardOverlay({ task }: { task: Task }) {
  return <TaskCard task={task} onClick={() => {}} overlay />
}
