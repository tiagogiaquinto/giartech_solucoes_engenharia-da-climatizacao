import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare, Circle, CheckCircle2, Plus, Loader2, ChevronRight,
  Calendar, User, Tag, AlertCircle, Clock
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { MiniTask, PRIORITY_BADGE } from './types'

interface Props {
  refreshKey: number
  onNavigateToBoard: () => void
}

const COLUMN_LABELS: Record<string, { label: string; dot: string }> = {
  todo:        { label: 'Para Fazer',   dot: 'bg-gray-400' },
  in_progress: { label: 'Em Andamento', dot: 'bg-blue-500' },
  review:      { label: 'Em Revisão',   dot: 'bg-amber-400' },
  blocked:     { label: 'Bloqueado',    dot: 'bg-red-500' },
  done:        { label: 'Concluído',    dot: 'bg-teal-500' },
}

function formatDue(d?: string) {
  if (!d) return null
  const date = new Date(d)
  const today = new Date()
  const diff = Math.ceil((date.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { text: `${Math.abs(diff)}d atraso`, cls: 'text-red-500' }
  if (diff === 0) return { text: 'Hoje', cls: 'text-amber-500' }
  if (diff === 1) return { text: 'Amanhã', cls: 'text-amber-400' }
  return { text: `${diff}d`, cls: 'text-gray-400' }
}

export default function TaskListPanel({ refreshKey, onNavigateToBoard }: Props) {
  const [tasks, setTasks] = useState<MiniTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'mine' | 'urgent' | 'done'>('all')
  const [completing, setCompleting] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('project_tasks')
      .select('id, title, column_id, priority, assignee_name, due_date, tags, subtasks_total:project_task_subtasks(count)')
      .not('column_id', 'eq', 'done')
      .order('position', { ascending: true })
      .limit(50)

    setTasks((data || []).map((t: any) => ({
      ...t,
      subtasks_total: t.subtasks_total?.[0]?.count || 0,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  useEffect(() => {
    const channel = supabase
      .channel('cmd-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  async function completeTask(id: string) {
    setCompleting(id)
    await supabase.from('project_tasks').update({ column_id: 'done', updated_at: new Date().toISOString() }).eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
    setCompleting(null)
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return
    setAdding(true)
    const { data: pos } = await supabase.from('project_tasks').select('position').eq('column_id', 'todo').order('position', { ascending: false }).limit(1)
    const nextPos = (pos?.[0]?.position || 0) + 1
    await supabase.from('project_tasks').insert({
      title: newTaskTitle.trim(),
      assignee_name: newTaskAssignee.trim() || null,
      column_id: 'todo',
      priority: 'normal',
      tags: [],
      position: nextPos,
      thomaz_notified: false,
    })
    setNewTaskTitle('')
    setNewTaskAssignee('')
    setShowAddForm(false)
    setAdding(false)
  }

  const filtered = tasks.filter(t => {
    if (filter === 'urgent') return t.priority === 'urgent' || t.priority === 'high'
    if (filter === 'done') return t.column_id === 'done'
    return true
  })

  const stats = {
    total: tasks.length,
    urgent: tasks.filter(t => t.priority === 'urgent').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-gray-900">Central de Tarefas</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddForm(s => !s)}
              className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={onNavigateToBoard}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition">
              Board
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Pendentes', value: stats.total, cls: 'bg-blue-50 text-blue-700' },
            { label: 'Urgentes',  value: stats.urgent, cls: 'bg-red-50 text-red-600' },
            { label: 'Atrasadas', value: stats.overdue, cls: 'bg-amber-50 text-amber-600' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-2 text-center ${s.cls}`}>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] font-medium opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([
            { id: 'all',    label: 'Todas' },
            { id: 'urgent', label: 'Urgentes' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                filter === f.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-gray-100 bg-blue-50 px-4 py-3 flex-shrink-0">
            <p className="text-xs font-semibold text-blue-700 mb-2">Nova Tarefa Rápida</p>
            <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Título da tarefa"
              className="w-full px-3 py-2 border border-blue-200 rounded-xl text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              onKeyDown={e => e.key === 'Enter' && addTask()}
            />
            <input value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)}
              placeholder="Responsável (opcional)"
              className="w-full px-3 py-2 border border-blue-200 rounded-xl text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <div className="flex gap-2">
              <button onClick={addTask} disabled={!newTaskTitle.trim() || adding}
                className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-50 hover:bg-blue-700 transition">
                {adding ? '...' : 'Adicionar'}
              </button>
              <button onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <CheckCircle2 className="w-10 h-10 text-teal-300 mb-3" />
            <p className="text-sm text-gray-400 font-medium">Tudo em dia!</p>
            <p className="text-xs text-gray-300 mt-1">Nenhuma tarefa pendente</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(task => {
              const col = COLUMN_LABELS[task.column_id] || { label: task.column_id, dot: 'bg-gray-300' }
              const prio = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.normal
              const due = formatDue(task.due_date)
              const isCompleting = completing === task.id

              return (
                <motion.div key={task.id} layout exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">

                  <button onClick={() => completeTask(task.id)} className="mt-0.5 flex-shrink-0">
                    {isCompleting
                      ? <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                      : <Circle className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{task.title}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${prio.cls}`}>
                        {prio.label}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                        {col.label}
                      </span>
                      {task.assignee_name && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <User className="w-2.5 h-2.5" />
                          {task.assignee_name}
                        </span>
                      )}
                      {due && (
                        <span className={`flex items-center gap-1 text-[10px] font-medium ${due.cls}`}>
                          <Clock className="w-2.5 h-2.5" />
                          {due.text}
                        </span>
                      )}
                      {task.tags?.includes('via-chat') && (
                        <span className="text-[10px] text-emerald-500 font-semibold">via chat</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
