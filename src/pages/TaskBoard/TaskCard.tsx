import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Calendar, CheckSquare, User } from 'lucide-react'
import { Task, PRIORITY_CONFIG } from './types'

function isOverdue(dueDate?: string) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
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
  onDragStart: (e: React.DragEvent, taskId: string) => void
}

export function TaskCard({ task, onClick, onDragStart }: TaskCardProps) {
  const prio = PRIORITY_CONFIG[task.priority]
  const overdue = isOverdue(task.due_date)
  const ref = useRef<HTMLDivElement>(null)

  const blockedDays = task.blocked_since
    ? Math.floor((Date.now() - new Date(task.blocked_since).getTime()) / 86400000)
    : 0

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      draggable
      onDragStart={(e) => onDragStart(e as any, task.id)}
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-3.5 cursor-grab active:cursor-grabbing select-none group hover:border-gray-300 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
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
        <p className="text-xs text-gray-500 line-clamp-2 mb-2.5 leading-relaxed">{task.description}</p>
      )}

      {task.category && (
        <span className="inline-block text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 mb-2">
          {task.category}
        </span>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          {task.assignee_name ? (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
              {initials(task.assignee_name)}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-3 w-3 text-gray-400" />
            </div>
          )}
          {task.assignee_name && (
            <span className="text-xs text-gray-500 max-w-[80px] truncate">{task.assignee_name}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(task.subtasks_total ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CheckSquare className="h-3 w-3" />
              <span>{task.subtasks_done}/{task.subtasks_total}</span>
            </div>
          )}

          {task.due_date && (
            <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
              <Calendar className="h-3 w-3" />
              <span className={overdue ? 'animate-pulse' : ''}>{formatDate(task.due_date)}</span>
            </div>
          )}
        </div>
      </div>

      {(task.subtasks_total ?? 0) > 0 && (
        <div className="mt-2.5">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all"
              style={{ width: `${Math.round(((task.subtasks_done ?? 0) / (task.subtasks_total ?? 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}
