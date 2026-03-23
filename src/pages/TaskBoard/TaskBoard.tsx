import React, { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, LayoutGrid, Filter, User, AlertTriangle, Zap, Search } from 'lucide-react'
import { Task, COLUMNS, ColumnId, PRIORITY_CONFIG, Priority } from './types'
import { useTaskBoard } from './useTaskBoard'
import { TaskCard, TaskCardOverlay } from './TaskCard'
import { TaskDetailDrawer } from './TaskDetailDrawer'
import { ThomazTaskManager } from './ThomazTaskManager'

type FilterType = 'all' | 'mine' | 'financial' | 'urgent'

const FILTER_CONFIG: { id: FilterType; label: string; icon: React.ElementType }[] = [
  { id: 'all',       label: 'Todas',         icon: Zap },
  { id: 'mine',      label: 'Minhas Tarefas', icon: User },
  { id: 'financial', label: 'Financeiro',    icon: Filter },
  { id: 'urgent',    label: 'Urgentes',      icon: AlertTriangle },
]

interface NewTaskFormProps {
  onSave: (title: string, priority: Priority) => void
  onCancel: () => void
}

function NewTaskForm({ onSave, onCancel }: NewTaskFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [addingToColumn, setAddingToColumn] = useState<ColumnId | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overColumn, setOverColumn] = useState<ColumnId | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const applyFilters = useCallback((pool: Task[]) => {
    let result = pool
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.assignee_name || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      )
    }
    if (activeFilter === 'mine') result = result.filter(t => !!t.assignee_name)
    if (activeFilter === 'financial') result = result.filter(t => (t.category || '').toLowerCase().includes('financ'))
    if (activeFilter === 'urgent') result = result.filter(t => t.priority === 'urgent')
    return result
  }, [activeFilter, searchQuery])

  const columnTasks = useMemo(() => {
    const map: Record<ColumnId, Task[]> = { todo: [], in_progress: [], review: [], blocked: [], done: [] }
    applyFilters(tasks).forEach(t => {
      if (map[t.column_id]) map[t.column_id].push(t)
    })
    return map
  }, [tasks, applyFilters])

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    const task = tasks.find(t => t.id === active.id)
    if (task) setActiveTask(task)
  }, [tasks])

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    if (!over) { setOverColumn(null); return }
    const overId = over.id as string
    const isColumn = COLUMNS.some(c => c.id === overId)
    if (isColumn) {
      setOverColumn(overId as ColumnId)
      return
    }
    const overTask = tasks.find(t => t.id === overId)
    if (overTask) setOverColumn(overTask.column_id)
  }, [tasks])

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    setOverColumn(null)
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    const isTargetColumn = COLUMNS.some(c => c.id === overId)
    const targetColumn = isTargetColumn
      ? (overId as ColumnId)
      : tasks.find(t => t.id === overId)?.column_id

    if (targetColumn) {
      const currentTask = tasks.find(t => t.id === taskId)
      if (currentTask && currentTask.column_id !== targetColumn) {
        moveTask(taskId, targetColumn)
      }
    }
  }, [tasks, moveTask])

  const handleAddTask = useCallback(async (columnId: ColumnId, title: string, priority: Priority) => {
    await createTask({ title, priority, column_id: columnId, description: '', tags: [] })
    setAddingToColumn(null)
  }, [createTask])

  const handleDelete = useCallback((taskId: string) => {
    setSelectedTaskId(null)
    deleteTask(taskId)
  }, [deleteTask])

  const totalUrgent = useMemo(() => tasks.filter(t => t.priority === 'urgent' && t.column_id !== 'done').length, [tasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md">
                <LayoutGrid className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">Task Board</h1>
                  {totalUrgent > 0 && (
                    <span className="text-xs font-bold bg-red-100 text-red-700 border border-red-300 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {totalUrgent} urgente{totalUrgent > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tasks.filter(t => t.column_id !== 'done').length} ativas · {tasks.filter(t => t.column_id === 'done').length} concluídas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar tarefas..."
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-48"
                />
              </div>

              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                {FILTER_CONFIG.map(f => {
                  const Icon = f.icon
                  return (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                        activeFilter === f.id
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {f.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <ThomazTaskManager
            tasks={tasks}
            onOpenTask={setSelectedTaskId}
            onUpdateTask={updateTask}
          />
        </div>

        <div className="px-6 pb-6 overflow-x-auto">
          <div className="flex gap-4 min-w-max items-start">
            {COLUMNS.map(col => {
              const colTasks = columnTasks[col.id]
              const isOver = overColumn === col.id
              const taskIds = colTasks.map(t => t.id)

              return (
                <SortableContext
                  key={col.id}
                  id={col.id}
                  items={taskIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className={`w-72 flex flex-col rounded-2xl border-2 transition-all duration-200 ${
                      isOver
                        ? 'border-blue-400 shadow-xl scale-[1.01] bg-blue-50/60'
                        : 'border-gray-200 bg-white/70'
                    }`}
                    data-column-id={col.id}
                  >
                    <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${col.headerBg}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                        <span className={`text-sm font-bold ${col.color}`}>{col.label}</span>
                        <span className="text-xs font-semibold bg-white/80 text-gray-600 rounded-full px-2 py-0.5 border border-gray-200 shadow-sm min-w-[22px] text-center">
                          {colTasks.length}
                        </span>
                      </div>
                      <button
                        onClick={() => setAddingToColumn(col.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/70 hover:bg-white text-gray-500 hover:text-blue-600 transition border border-gray-200 shadow-sm"
                        title="Adicionar tarefa"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 p-3 space-y-2.5 min-h-[200px]">
                      <AnimatePresence>
                        {colTasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onClick={() => setSelectedTaskId(task.id)}
                          />
                        ))}
                      </AnimatePresence>

                      {addingToColumn === col.id && (
                        <NewTaskForm
                          onSave={(title, priority) => handleAddTask(col.id, title, priority)}
                          onCancel={() => setAddingToColumn(null)}
                        />
                      )}

                      {colTasks.length === 0 && addingToColumn !== col.id && (
                        <div
                          onClick={() => setAddingToColumn(col.id)}
                          className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl text-xs cursor-pointer transition-all ${
                            isOver
                              ? 'border-blue-400 bg-blue-50 text-blue-500'
                              : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
                          }`}
                        >
                          {isOver ? (
                            <span className="font-semibold">Soltar aqui</span>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mb-1 opacity-50" />
                              <span>Adicionar tarefa</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </SortableContext>
              )
            })}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask && <TaskCardOverlay task={activeTask} />}
      </DragOverlay>

      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={updateTask}
        onDelete={handleDelete}
      />
    </DndContext>
  )
}
