import React, { useState, useCallback, useMemo, useRef } from 'react'
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
import {
  Plus, X, LayoutGrid, Filter, User, AlertTriangle, Zap, Search, List,
  CalendarDays, BarChart2, Download, CheckSquare, Square, Trash2,
  ArrowRight, Tag, Clock, ChevronDown, SlidersHorizontal, RefreshCw,
  TrendingUp, Users, Target
} from 'lucide-react'
import { Task, COLUMNS, ColumnId, PRIORITY_CONFIG, Priority } from './types'
import { useTaskBoard } from './useTaskBoard'
import { TaskCard, TaskCardOverlay } from './TaskCard'
import { TaskDetailDrawer } from './TaskDetailDrawer'
import { ThomazTaskManager } from './ThomazTaskManager'
import { ThomazTaskChat } from './ThomazTaskChat'
import { TeamWorkloadPanel } from './TeamWorkloadPanel'
import { AssignmentToast } from './AssignmentToast'
import { ListView } from './ListView'
import { CalendarView } from './CalendarView'
import { GanttView } from './GanttView'

type FilterType = 'all' | 'mine' | 'financial' | 'urgent'
type ViewMode = 'kanban' | 'list' | 'calendar' | 'gantt'
type SortMode = 'created' | 'due_date' | 'priority' | 'title'

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: 'kanban',   label: 'Kanban',     icon: LayoutGrid },
  { id: 'list',     label: 'Lista',      icon: List },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays },
  { id: 'gantt',    label: 'Gantt',      icon: BarChart2 },
]

const FILTER_CONFIG: { id: FilterType; label: string; icon: React.ElementType }[] = [
  { id: 'all',       label: 'Todas',         icon: Zap },
  { id: 'mine',      label: 'Minhas',        icon: User },
  { id: 'financial', label: 'Financeiro',    icon: Filter },
  { id: 'urgent',    label: 'Urgentes',      icon: AlertTriangle },
]

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

interface NewTaskFormProps {
  onSave: (title: string, priority: Priority, category?: string) => void
  onCancel: () => void
}

function NewTaskForm({ onSave, onCancel }: NewTaskFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [category, setCategory] = useState('')
  const [expanded, setExpanded] = useState(false)

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
          if (e.key === 'Enter' && title.trim()) onSave(title.trim(), priority, category || undefined)
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="Título da tarefa..."
        className="w-full text-sm font-medium text-gray-800 placeholder-gray-400 outline-none mb-2"
      />

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-2">
          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Categoria (ex: Marketing, Dev)..."
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300 mb-1.5"
          />
        </motion.div>
      )}

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
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-400 hover:text-gray-600 transition flex items-center gap-0.5"
          title="Mais opções"
        >
          <Tag className="h-3 w-3" />
        </button>
        <button
          onClick={() => title.trim() && onSave(title.trim(), priority, category || undefined)}
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

function TaskBoardStats({ tasks }: { tasks: Task[] }) {
  const active   = tasks.filter(t => t.column_id !== 'done').length
  const done     = tasks.filter(t => t.column_id === 'done').length
  const overdue  = tasks.filter(t => t.due_date && t.column_id !== 'done' && new Date(t.due_date + 'T12:00:00') < new Date()).length
  const noAssign = tasks.filter(t => !t.assignee_id && t.column_id !== 'done').length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      {[
        { label: 'Ativas', value: active, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <Target className="h-3.5 w-3.5" /> },
        { label: 'Concluídas', value: done, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', icon: <CheckSquare className="h-3.5 w-3.5" /> },
        { label: 'Atrasadas', value: overdue, color: overdue > 0 ? 'text-red-600' : 'text-gray-500', bg: overdue > 0 ? 'bg-red-50' : 'bg-gray-50', border: overdue > 0 ? 'border-red-100' : 'border-gray-100', icon: <Clock className="h-3.5 w-3.5" /> },
        { label: 'Sem responsável', value: noAssign, color: noAssign > 0 ? 'text-amber-600' : 'text-gray-500', bg: noAssign > 0 ? 'bg-amber-50' : 'bg-gray-50', border: noAssign > 0 ? 'border-amber-100' : 'border-gray-100', icon: <Users className="h-3.5 w-3.5" /> },
      ].map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`${s.bg} ${s.border} border rounded-xl px-3 py-2.5 flex items-center gap-2.5`}
        >
          <span className={s.color}>{s.icon}</span>
          <div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function BulkActionsBar({
  selectedIds,
  onClearSelection,
  onMoveSelected,
  onDeleteSelected,
}: {
  selectedIds: Set<string>
  onClearSelection: () => void
  onMoveSelected: (col: ColumnId) => void
  onDeleteSelected: () => void
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false)

  if (selectedIds.size === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 border border-gray-700"
    >
      <span className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
        <CheckSquare className="h-4 w-4 text-blue-400" />
        {selectedIds.size} selecionada{selectedIds.size > 1 ? 's' : ''}
      </span>
      <div className="w-px h-5 bg-gray-700" />

      <div className="relative">
        <button
          onClick={() => setShowMoveMenu(!showMoveMenu)}
          className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-3 py-1.5 transition"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Mover para
          <ChevronDown className="h-3 w-3" />
        </button>
        <AnimatePresence>
          {showMoveMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              className="absolute bottom-full mb-2 left-0 bg-white rounded-xl border border-gray-200 shadow-xl py-1 min-w-[160px]"
            >
              {COLUMNS.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onMoveSelected(c.id); setShowMoveMenu(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <span className={`w-2 h-2 rounded-full ${c.dotColor}`} />
                  {c.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={onDeleteSelected}
        className="flex items-center gap-1.5 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-xl px-3 py-1.5 transition"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Excluir
      </button>

      <button
        onClick={onClearSelection}
        className="text-gray-400 hover:text-white transition ml-1"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export default function TaskBoard() {
  const { tasks, loading, moveTask, createTask, updateTask, deleteTask, refetch } = useTaskBoard()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [addingToColumn, setAddingToColumn] = useState<ColumnId | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overColumn, setOverColumn] = useState<ColumnId | null>(null)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortMode, setSortMode] = useState<SortMode>('created')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDueDateFrom, setFilterDueDateFrom] = useState('')
  const [filterDueDateTo, setFilterDueDateTo] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const workloadPanelRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const categories = useMemo(() => {
    const cats = new Set<string>()
    tasks.forEach(t => { if (t.category) cats.add(t.category) })
    return Array.from(cats).sort()
  }, [tasks])

  const hasActiveAdvancedFilters = filterCategory || filterDueDateFrom || filterDueDateTo

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
    if (selectedMember) result = result.filter(t => t.assignee_name === selectedMember)
    if (filterCategory) result = result.filter(t => t.category === filterCategory)
    if (filterDueDateFrom) result = result.filter(t => t.due_date && t.due_date >= filterDueDateFrom)
    if (filterDueDateTo) result = result.filter(t => t.due_date && t.due_date <= filterDueDateTo)
    return result
  }, [activeFilter, searchQuery, selectedMember, filterCategory, filterDueDateFrom, filterDueDateTo])

  const applySorting = useCallback((pool: Task[]) => {
    return [...pool].sort((a, b) => {
      if (sortMode === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (sortMode === 'due_date') {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      }
      if (sortMode === 'title') return a.title.localeCompare(b.title)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [sortMode])

  const filteredAndSorted = useMemo(() => applySorting(applyFilters(tasks)), [tasks, applyFilters, applySorting])

  const columnTasks = useMemo(() => {
    const map: Record<ColumnId, Task[]> = { todo: [], in_progress: [], review: [], blocked: [], done: [] }
    filteredAndSorted.forEach(t => {
      if (map[t.column_id]) map[t.column_id].push(t)
    })
    return map
  }, [filteredAndSorted])

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    const task = tasks.find(t => t.id === active.id)
    if (task) setActiveTask(task)
  }, [tasks])

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    if (!over) { setOverColumn(null); return }
    const overId = over.id as string
    const isColumn = COLUMNS.some(c => c.id === overId)
    if (isColumn) { setOverColumn(overId as ColumnId); return }
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
      if (currentTask && currentTask.column_id !== targetColumn) moveTask(taskId, targetColumn)
    }
  }, [tasks, moveTask])

  const handleAddTask = useCallback(async (columnId: ColumnId, title: string, priority: Priority, category?: string) => {
    await createTask({ title, priority, column_id: columnId, description: '', tags: [], category })
    setAddingToColumn(null)
  }, [createTask])

  const handleDelete = useCallback((taskId: string) => {
    setSelectedTaskId(null)
    setSelectedIds(prev => { const n = new Set(prev); n.delete(taskId); return n })
    deleteTask(taskId)
  }, [deleteTask])

  const toggleSelect = useCallback((taskId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }, [])

  const handleBulkMove = useCallback(async (col: ColumnId) => {
    for (const id of selectedIds) await moveTask(id, col)
    setSelectedIds(new Set())
  }, [selectedIds, moveTask])

  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`Excluir ${selectedIds.size} tarefa(s)?`)) return
    for (const id of selectedIds) await deleteTask(id)
    setSelectedIds(new Set())
  }, [selectedIds, deleteTask])

  const handleExportCSV = useCallback(() => {
    const rows = [
      ['Título', 'Coluna', 'Prioridade', 'Responsável', 'Categoria', 'Prazo', 'Criado em'],
      ...filteredAndSorted.map(t => [
        t.title,
        COLUMNS.find(c => c.id === t.column_id)?.label || t.column_id,
        PRIORITY_CONFIG[t.priority].label,
        t.assignee_name || '',
        t.category || '',
        t.due_date || '',
        new Date(t.created_at).toLocaleDateString('pt-BR'),
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tarefas_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredAndSorted])

  const totalUrgent = useMemo(() => tasks.filter(t => t.priority === 'urgent' && t.column_id !== 'done').length, [tasks])
  const totalOverdue = useMemo(() => tasks.filter(t => t.due_date && t.column_id !== 'done' && new Date(t.due_date + 'T12:00:00') < new Date()).length, [tasks])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="text-sm text-gray-500">Carregando tarefas...</p>
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

          {/* ── HEADER ─────────────────────────────────── */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md">
                <LayoutGrid className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">Central de Tarefas</h1>
                  {totalUrgent > 0 && (
                    <span className="text-xs font-bold bg-red-100 text-red-700 border border-red-300 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {totalUrgent} urgente{totalUrgent > 1 ? 's' : ''}
                    </span>
                  )}
                  {totalOverdue > 0 && (
                    <span className="text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {totalOverdue} atrasada{totalOverdue > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tasks.filter(t => t.column_id !== 'done').length} ativas · {tasks.filter(t => t.column_id === 'done').length} concluídas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-40"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={sortMode}
                onChange={e => setSortMode(e.target.value as SortMode)}
                className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-600"
              >
                <option value="created">Mais recentes</option>
                <option value="due_date">Por prazo</option>
                <option value="priority">Por prioridade</option>
                <option value="title">Por título</option>
              </select>

              {/* Advanced filters toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ${
                  showAdvancedFilters || hasActiveAdvancedFilters
                    ? 'bg-blue-600 text-white border-blue-600 shadow'
                    : 'bg-white text-gray-500 border-gray-200 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="h-3 w-3" />
                Filtros
                {hasActiveAdvancedFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />
                )}
              </button>

              {/* View modes */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                {VIEW_MODES.map(v => {
                  const Icon = v.icon
                  return (
                    <button
                      key={v.id}
                      onClick={() => setViewMode(v.id)}
                      title={v.label}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                        viewMode === v.id
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      <span className="hidden lg:inline">{v.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Team filter (kanban only) */}
              {viewMode === 'kanban' && (
                <TeamWorkloadPanel
                  tasks={tasks}
                  selectedMember={selectedMember}
                  onSelectMember={setSelectedMember}
                />
              )}

              {/* Quick filters (kanban only) */}
              {viewMode === 'kanban' && (
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                  {FILTER_CONFIG.map(f => {
                    const Icon = f.icon
                    return (
                      <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                          activeFilter === f.id
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="hidden md:inline">{f.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Export + Refresh */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-sm transition"
                  title="Exportar CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">CSV</span>
                </button>
                <button
                  onClick={refetch}
                  className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-600 shadow-sm transition"
                  title="Atualizar"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── ADVANCED FILTERS ────────────────────────── */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filtros Avançados</span>
                    {hasActiveAdvancedFilters && (
                      <button
                        onClick={() => { setFilterCategory(''); setFilterDueDateFrom(''); setFilterDueDateTo('') }}
                        className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Categoria</label>
                      <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        <option value="">Todas as categorias</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Prazo — De</label>
                      <input
                        type="date"
                        value={filterDueDateFrom}
                        onChange={e => setFilterDueDateFrom(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Prazo — Até</label>
                      <input
                        type="date"
                        value={filterDueDateTo}
                        onChange={e => setFilterDueDateTo(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── ACTIVE MEMBER FILTER ────────────────────── */}
          {selectedMember && (
            <div className="mb-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
              <User className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">
                Mostrando tarefas de: <span className="font-bold">{selectedMember}</span>
              </span>
              <button onClick={() => setSelectedMember(null)} className="ml-auto text-blue-400 hover:text-blue-600 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── STATS STRIP ─────────────────────────────── */}
          <AnimatePresence>
            {showStats && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TaskBoardStats tasks={tasks} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition"
            >
              <TrendingUp className="h-3 w-3" />
              {showStats ? 'Ocultar métricas' : 'Ver métricas'}
            </button>
            {filteredAndSorted.length !== tasks.length && (
              <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5 font-medium">
                {filteredAndSorted.length} de {tasks.length} tarefas
              </span>
            )}
          </div>

          <ThomazTaskManager
            tasks={tasks}
            onOpenTask={setSelectedTaskId}
            onUpdateTask={updateTask}
            onViewTeam={() => {}}
          />
        </div>

        {/* ── VIEWS ──────────────────────────────────────── */}
        {viewMode === 'list' && (
          <ListView tasks={filteredAndSorted} onOpenTask={setSelectedTaskId} />
        )}
        {viewMode === 'calendar' && (
          <CalendarView tasks={filteredAndSorted} onOpenTask={setSelectedTaskId} />
        )}
        {viewMode === 'gantt' && (
          <GanttView tasks={filteredAndSorted} onOpenTask={setSelectedTaskId} />
        )}

        {viewMode === 'kanban' && (
          <div className="px-6 pb-20 overflow-x-auto">
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
                        <div className="flex items-center gap-1">
                          {selectedIds.size > 0 && (
                            <button
                              onClick={() => {
                                const colIds = colTasks.map(t => t.id)
                                const allSelected = colIds.every(id => selectedIds.has(id))
                                setSelectedIds(prev => {
                                  const next = new Set(prev)
                                  colIds.forEach(id => allSelected ? next.delete(id) : next.add(id))
                                  return next
                                })
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/70 hover:bg-white text-gray-400 hover:text-blue-600 transition border border-gray-200 shadow-sm"
                              title="Selecionar coluna"
                            >
                              <CheckSquare className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => setAddingToColumn(col.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/70 hover:bg-white text-gray-500 hover:text-blue-600 transition border border-gray-200 shadow-sm"
                            title="Adicionar tarefa"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 p-3 space-y-2.5 min-h-[200px]">
                        <AnimatePresence>
                          {colTasks.map(task => (
                            <div key={task.id} className="relative group/card">
                              <div
                                className={`absolute -left-1 top-1/2 -translate-y-1/2 z-10 transition-opacity ${
                                  selectedIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
                                }`}
                              >
                                <button
                                  onClick={e => { e.stopPropagation(); toggleSelect(task.id) }}
                                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                    selectedIds.has(task.id)
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white border-gray-300 hover:border-blue-400'
                                  }`}
                                >
                                  {selectedIds.has(task.id) && <CheckSquare className="h-2.5 w-2.5" />}
                                </button>
                              </div>
                              <div className={`transition-all ${selectedIds.has(task.id) ? 'ring-2 ring-blue-400 ring-offset-1 rounded-xl' : ''}`}>
                                <TaskCard
                                  task={task}
                                  onClick={() => setSelectedTaskId(task.id)}
                                />
                              </div>
                            </div>
                          ))}
                        </AnimatePresence>

                        {addingToColumn === col.id && (
                          <NewTaskForm
                            onSave={(title, priority, category) => handleAddTask(col.id, title, priority, category)}
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
        )}
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

      <AssignmentToast />

      {/* ── BULK ACTIONS BAR ─────────────────────────── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <BulkActionsBar
            selectedIds={selectedIds}
            onClearSelection={() => setSelectedIds(new Set())}
            onMoveSelected={handleBulkMove}
            onDeleteSelected={handleBulkDelete}
          />
        )}
      </AnimatePresence>

      <ThomazTaskChat
        tasks={tasks}
        onCreateTask={createTask}
        onUpdateTask={updateTask}
        onOpenTask={setSelectedTaskId}
      />
    </DndContext>
  )
}
