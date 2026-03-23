import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, User, Tag, ChevronUp, ChevronDown, Filter } from 'lucide-react'
import { Task, COLUMNS, PRIORITY_CONFIG, ColumnId, Priority } from './types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ListViewProps {
  tasks: Task[]
  onOpenTask: (id: string) => void
}

type SortField = 'title' | 'priority' | 'due_date' | 'column_id' | 'assignee_name'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

export function ListView({ tasks, onOpenTask }: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [colFilter, setColFilter] = useState<ColumnId | 'all'>('all')
  const [priFilter, setPriFilter] = useState<Priority | 'all'>('all')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    let list = tasks
    if (colFilter !== 'all') list = list.filter(t => t.column_id === colFilter)
    if (priFilter !== 'all') list = list.filter(t => t.priority === priFilter)

    return [...list].sort((a, b) => {
      let cmp = 0
      if (sortField === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      else if (sortField === 'due_date') {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity
        cmp = da - db
      } else if (sortField === 'column_id') cmp = a.column_id.localeCompare(b.column_id)
      else if (sortField === 'assignee_name') cmp = (a.assignee_name || '').localeCompare(b.assignee_name || '')
      else cmp = a.title.localeCompare(b.title)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [tasks, sortField, sortDir, colFilter, priFilter])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-25" />
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-blue-600" /> : <ChevronDown className="h-3 w-3 text-blue-600" />
  }

  const colConfig = Object.fromEntries(COLUMNS.map(c => [c.id, c]))

  return (
    <div className="px-6 pb-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-medium">Filtros:</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ id: 'all', label: 'Todas colunas' }, ...COLUMNS.map(c => ({ id: c.id, label: c.label }))].map(item => (
            <button
              key={item.id}
              onClick={() => setColFilter(item.id as ColumnId | 'all')}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                colFilter === item.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ id: 'all', label: 'Todas prioridades' }, ...Object.entries(PRIORITY_CONFIG).map(([k, v]) => ({ id: k, label: v.label }))].map(item => (
            <button
              key={item.id}
              onClick={() => setPriFilter(item.id as Priority | 'all')}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                priFilter === item.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-gray-400">{sorted.length} tarefa{sorted.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {([
                { field: 'title', label: 'Tarefa', w: 'w-auto' },
                { field: 'priority', label: 'Prioridade', w: 'w-28' },
                { field: 'column_id', label: 'Status', w: 'w-32' },
                { field: 'assignee_name', label: 'Responsável', w: 'w-36' },
                { field: 'due_date', label: 'Prazo', w: 'w-28' },
              ] as { field: SortField; label: string; w: string }[]).map(col => (
                <th
                  key={col.field}
                  onClick={() => handleSort(col.field)}
                  className={`${col.w} text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 cursor-pointer hover:text-blue-600 select-none`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon field={col.field} />
                  </div>
                </th>
              ))}
              <th className="w-20 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Progresso</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((task, idx) => {
              const col = colConfig[task.column_id]
              const pri = PRIORITY_CONFIG[task.priority]
              const pct = task.subtasks_total
                ? Math.round((task.subtasks_done || 0) / task.subtasks_total * 100)
                : null
              const isOverdue = task.due_date && task.column_id !== 'done' && new Date(task.due_date) < new Date()

              return (
                <motion.tr
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => onOpenTask(task.id)}
                  className="border-b border-gray-100 hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {task.column_id === 'done'
                        ? <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" />
                        : <Circle className="h-4 w-4 text-gray-300 shrink-0 group-hover:text-blue-400 transition" />
                      }
                      <div>
                        <p className={`font-medium text-gray-900 leading-tight ${task.column_id === 'done' ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </p>
                        {task.category && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Tag className="h-2.5 w-2.5 text-gray-400" />
                            <span className="text-xs text-gray-400">{task.category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${pri.bg} ${pri.text} ${pri.border}`}>
                      {pri.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${col?.dotColor}`} />
                      <span className={`text-xs font-medium ${col?.color}`}>{col?.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {task.assignee_name ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[9px] font-bold shrink-0">
                          {task.assignee_name[0].toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-700 truncate max-w-[100px]">{task.assignee_name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-300">
                        <User className="h-3.5 w-3.5" />
                        <span className="text-xs">—</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {task.due_date ? (
                      <div className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                        <Clock className="h-3 w-3 shrink-0" />
                        {format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pct !== null ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-teal-500' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{task.subtasks_done}/{task.subtasks_total}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckCircle2 className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Nenhuma tarefa encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
