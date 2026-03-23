import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, LayoutGrid, Filter, User, AlertTriangle, Zap } from 'lucide-react'
import { Task, COLUMNS, ColumnId, PRIORITY_CONFIG, Priority } from './types'
import { useTaskBoard } from './useTaskBoard'
import { TaskCard } from './TaskCard'
import { TaskDetailDrawer } from './TaskDetailDrawer'
import { ThomazTaskManager } from './ThomazTaskManager'

type FilterType = 'all' | 'mine' | 'financial' | 'urgent'

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'Todas',
  mine: 'Minhas Tarefas',
  financial: 'Financeiro',
  urgent: 'Urgentes',
}

interface NewTaskFormProps {
  columnId: ColumnId
  onSave: (title: string, priority: Priority) => void
  onCancel: () => void
}

function NewTaskForm({ columnId, onSave, onCancel }: NewTaskFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl border-2 border-blue-300 p-3 shadow-md"
    >
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && title.trim()) onSave(title.trim(), priority)
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="Título da tarefa..."
        className="w-full text-sm font-medium text-gray-800 placeholder-gray-400 outline-none mb-2"
      />
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Priority)}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button
          onClick={() => title.trim() && onSave(title.trim(), priority)}
          className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 transition"
        >
          Adicionar
        </button>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition">
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

export default function TaskBoard() {
  const { tasks, loading, moveTask, createTask, updateTask, deleteTask } = useTaskBoard()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [addingToColumn, setAddingToColumn] = useState<ColumnId | null>(null)
  const [dragOver, setDragOver] = useState<ColumnId | null>(null)
  const draggingId = useRef<string | null>(null)

  const filteredTasks = useCallback((columnId: ColumnId) => {
    let pool = tasks.filter(t => t.column_id === columnId)
    if (activeFilter === 'mine') pool = pool.filter(t => t.assignee_name)
    if (activeFilter === 'financial') pool = pool.filter(t => (t.category || '').toLowerCase().includes('financ'))
    if (activeFilter === 'urgent') pool = pool.filter(t => t.priority === 'urgent')
    return pool
  }, [tasks, activeFilter])

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    draggingId.current = taskId
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, columnId: ColumnId) => {
    e.preventDefault()
    const id = draggingId.current
    if (id) moveTask(id, columnId)
    draggingId.current = null
    setDragOver(null)
  }, [moveTask])

  const handleAddTask = useCallback(async (columnId: ColumnId, title: string, priority: Priority) => {
    await createTask({ title, priority, column_id: columnId, description: '', tags: [] })
    setAddingToColumn(null)
  }, [createTask])

  const handleDelete = useCallback((taskId: string) => {
    setSelectedTaskId(null)
    deleteTask(taskId)
  }, [deleteTask])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Task Board</h1>
              <p className="text-xs text-gray-500">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} no total</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {(Object.keys(FILTER_LABELS) as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  activeFilter === f
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {f === 'mine' && <User className="h-3 w-3" />}
                {f === 'financial' && <Filter className="h-3 w-3" />}
                {f === 'urgent' && <AlertTriangle className="h-3 w-3" />}
                {f === 'all' && <Zap className="h-3 w-3" />}
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <ThomazTaskManager
          tasks={tasks}
          onOpenTask={setSelectedTaskId}
          onUpdateTask={updateTask}
        />
      </div>

      <div className="px-6 pb-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map(col => {
            const colTasks = filteredTasks(col.id)
            const isDragTarget = dragOver === col.id

            return (
              <div
                key={col.id}
                className={`w-72 flex flex-col rounded-2xl border transition-all ${
                  isDragTarget ? 'border-blue-400 shadow-lg bg-blue-50/40 scale-[1.01]' : 'border-gray-200 bg-white/60'
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, col.id)}
              >
                <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${col.headerBg}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <span className={`text-sm font-bold ${col.color}`}>{col.label}</span>
                    <span className="text-xs font-medium bg-white/70 text-gray-500 rounded-full px-2 py-0.5 border border-gray-200">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setAddingToColumn(col.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/70 hover:bg-white text-gray-500 hover:text-gray-700 transition border border-gray-200"
                    title="Adicionar tarefa"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 p-3 space-y-2.5 min-h-[120px]">
                  <AnimatePresence>
                    {colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTaskId(task.id)}
                        onDragStart={handleDragStart}
                      />
                    ))}
                  </AnimatePresence>

                  {addingToColumn === col.id && (
                    <NewTaskForm
                      columnId={col.id}
                      onSave={(title, priority) => handleAddTask(col.id, title, priority)}
                      onCancel={() => setAddingToColumn(null)}
                    />
                  )}

                  {colTasks.length === 0 && addingToColumn !== col.id && (
                    <div
                      onClick={() => setAddingToColumn(col.id)}
                      className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs cursor-pointer hover:border-gray-300 hover:text-gray-500 transition"
                    >
                      + Adicionar tarefa
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={updateTask}
        onDelete={handleDelete}
      />
    </div>
  )
}
