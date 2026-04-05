import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ClipboardList, Plus, Search, SlidersHorizontal, Clock, CheckCircle2, AlertCircle,
  X, User, Calendar, FileEdit as Edit2, Eye, Copy, PlayCircle, Trash2, Smartphone,
  FileText, Printer, ChevronDown, TrendingUp, DollarSign, BarChart2, Filter,
  RefreshCw, ArrowUpRight, Download, CheckSquare, ArrowRight, ArrowUpDown,
  AlertTriangle, XCircle, PauseCircle, FileQuestion, Target, Zap, ChevronUp
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { getServiceOrders, createServiceOrder, updateServiceOrder, deleteServiceOrder, type ServiceOrder } from '../lib/supabase'
import { ServiceOrderModalOptimized } from '../components/ServiceOrderModalOptimized'
import { cache } from '../utils/cache'
import { GamificationToggle } from '../components/ServiceOrder/GamificationToggle'
import { formatDateSafe } from '../utils/format'
import DocumentGeneratorButton from '../components/DocumentGeneratorButton'
import OSPrintPreviewModal from '../components/OSPrintPreviewModal'

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; ring: string }> = {
  cotacao:      { label: 'Cotação',      dot: 'bg-sky-400',     badge: 'bg-sky-50 text-sky-700 ring-sky-200',          ring: 'ring-sky-300' },
  orcamento:    { label: 'Orçamento',    dot: 'bg-sky-400',     badge: 'bg-sky-50 text-sky-700 ring-sky-200',          ring: 'ring-sky-300' },
  pending:      { label: 'Pendente',     dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200',    ring: 'ring-amber-300' },
  pendente:     { label: 'Pendente',     dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200',    ring: 'ring-amber-300' },
  in_progress:  { label: 'Em Andamento', dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 ring-blue-200',       ring: 'ring-blue-300' },
  em_andamento: { label: 'Em Andamento', dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 ring-blue-200',       ring: 'ring-blue-300' },
  on_hold:      { label: 'Pausado',      dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 ring-orange-200', ring: 'ring-orange-300' },
  pausado:      { label: 'Pausado',      dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 ring-orange-200', ring: 'ring-orange-300' },
  completed:    { label: 'Concluída',    dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', ring: 'ring-emerald-300' },
  concluida:    { label: 'Concluída',    dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', ring: 'ring-emerald-300' },
  cancelled:    { label: 'Cancelada',    dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 ring-red-200',          ring: 'ring-red-300' },
  cancelado:    { label: 'Cancelada',    dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 ring-red-200',          ring: 'ring-red-300' },
}

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  high:   { label: 'Alta',   cls: 'bg-red-50 text-red-700 ring-red-200' },
  medium: { label: 'Média',  cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  low:    { label: 'Baixa',  cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
}

type SortField = 'created_at' | 'due_date' | 'total_value' | 'order_number' | 'client_name'
type SortDir = 'asc' | 'desc'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function isOverdue(order: ServiceOrder): boolean {
  if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'concluida' || order.status === 'cancelado') return false
  const d = order.due_date || order.service_date
  if (!d) return false
  return new Date(d + 'T23:59:59') < new Date()
}

function getDaysUntilDue(order: ServiceOrder): number | null {
  const d = order.due_date || order.service_date
  if (!d) return null
  const diff = new Date(d + 'T12:00:00').getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function BulkActionsBar({
  selectedIds,
  onClearSelection,
  onBulkStatus,
  onBulkDelete,
}: {
  selectedIds: Set<string>
  onClearSelection: () => void
  onBulkStatus: (status: string) => void
  onBulkDelete: () => void
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)

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
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-3 py-1.5 transition"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Alterar status
          <ChevronDown className="h-3 w-3" />
        </button>
        <AnimatePresence>
          {showStatusMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              className="absolute bottom-full mb-2 left-0 bg-white rounded-xl border border-gray-200 shadow-xl py-1 min-w-[180px]"
            >
              {[
                { value: 'cotacao', label: 'Cotação', dot: 'bg-sky-400' },
                { value: 'pending', label: 'Pendente', dot: 'bg-amber-400' },
                { value: 'in_progress', label: 'Em Andamento', dot: 'bg-blue-500' },
                { value: 'on_hold', label: 'Pausado', dot: 'bg-orange-400' },
                { value: 'completed', label: 'Concluída', dot: 'bg-emerald-500' },
                { value: 'cancelled', label: 'Cancelada', dot: 'bg-red-400' },
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => { onBulkStatus(s.value); setShowStatusMenu(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  {s.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={onBulkDelete}
        className="flex items-center gap-1.5 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-xl px-3 py-1.5 transition"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Excluir
      </button>

      <button onClick={onClearSelection} className="text-gray-400 hover:text-white transition ml-1">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

function SortButton({
  field, label, sortField, sortDir, onChange,
}: {
  field: SortField; label: string; sortField: SortField; sortDir: SortDir; onChange: (f: SortField) => void
}) {
  const active = sortField === field
  return (
    <button
      onClick={() => onChange(field)}
      className={`flex items-center gap-1 text-xs font-medium transition ${active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${active ? (sortDir === 'asc' ? 'rotate-180' : '') : 'opacity-40'}`} />
    </button>
  )
}

const ServiceOrders = () => {
  const { isAdmin } = useUser()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchTerm, setSearchTerm]           = useState('')
  const [selectedStatus, setSelectedStatus]   = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedResponsible, setSelectedResponsible] = useState('')
  const [dueDateFrom, setDueDateFrom]         = useState('')
  const [dueDateTo, setDueDateTo]             = useState('')
  const [valueMin, setValueMin]               = useState('')
  const [valueMax, setValueMax]               = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [sortField, setSortField]             = useState<SortField>('created_at')
  const [sortDir, setSortDir]                 = useState<SortDir>('desc')
  const [orders, setOrders]                   = useState<ServiceOrder[]>([])
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [orderToDelete, setOrderToDelete]     = useState<ServiceOrder | null>(null)
  const [deleting, setDeleting]               = useState(false)
  const [showOrderModal, setShowOrderModal]   = useState(false)
  const [editingOrderId, setEditingOrderId]   = useState<string | undefined>(undefined)
  const [showFilters, setShowFilters]         = useState(false)
  const [printOrderId, setPrintOrderId]       = useState<string | null>(null)
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll]             = useState(false)
  const [showStats, setShowStats]             = useState(true)

  useEffect(() => { loadServiceOrders() }, [])

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      setEditingOrderId(editId)
      setShowOrderModal(true)
      setSearchParams({})
    }
  }, [searchParams])

  const loadServiceOrders = async () => {
    try {
      setLoading(true)
      const data = await getServiceOrders()
      setOrders(data || [])
      setError(null)
    } catch (err) {
      console.error('Error loading service orders:', err)
      setError('Erro ao carregar ordens de serviço')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const responsibles = useMemo(() => {
    const set = new Set<string>()
    orders.forEach(o => { if (o.assigned_to) set.add(o.assigned_to) })
    return Array.from(set).sort()
  }, [orders])

  const hasActiveFilters = selectedStatus !== 'all' || selectedPriority !== 'all' || selectedResponsible || dueDateFrom || dueDateTo || valueMin || valueMax || showOverdueOnly

  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      const q = searchTerm.toLowerCase()
      const matchSearch = !q ||
        order.order_number?.toLowerCase().includes(q) ||
        order.client_name?.toLowerCase().includes(q) ||
        order.service_type?.toLowerCase().includes(q) ||
        order.assigned_to?.toLowerCase().includes(q)
      const matchStatus   = selectedStatus === 'all' || order.status === selectedStatus
      const matchPriority = selectedPriority === 'all' || order.priority === selectedPriority
      const matchResponsible = !selectedResponsible || order.assigned_to === selectedResponsible
      const orderDate = order.due_date || order.service_date || ''
      const matchDateFrom = !dueDateFrom || orderDate >= dueDateFrom
      const matchDateTo   = !dueDateTo   || orderDate <= dueDateTo
      const tv = Number(order.final_total || order.total_value || 0)
      const matchValueMin = !valueMin || tv >= Number(valueMin)
      const matchValueMax = !valueMax || tv <= Number(valueMax)
      const matchOverdue = !showOverdueOnly || isOverdue(order)
      return matchSearch && matchStatus && matchPriority && matchResponsible && matchDateFrom && matchDateTo && matchValueMin && matchValueMax && matchOverdue
    })

    result = [...result].sort((a, b) => {
      let va: any, vb: any
      if (sortField === 'total_value') {
        va = Number(a.final_total || a.total_value || 0)
        vb = Number(b.final_total || b.total_value || 0)
      } else if (sortField === 'due_date') {
        va = a.due_date || a.service_date || ''
        vb = b.due_date || b.service_date || ''
      } else if (sortField === 'order_number') {
        va = a.order_number || ''
        vb = b.order_number || ''
      } else if (sortField === 'client_name') {
        va = a.client_name || ''
        vb = b.client_name || ''
      } else {
        va = a.created_at || ''
        vb = b.created_at || ''
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [orders, searchTerm, selectedStatus, selectedPriority, selectedResponsible, dueDateFrom, dueDateTo, valueMin, valueMax, showOverdueOnly, sortField, sortDir])

  const handleSortField = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev }
      setSortDir('desc')
      return field
    })
  }, [])

  const handleDuplicate = async (order: ServiceOrder) => {
    if (!confirm(`Deseja duplicar a OS ${order.order_number}?`)) return
    try {
      await createServiceOrder({ ...order, id: undefined, order_number: `${order.order_number}-COPIA`, status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
      await loadServiceOrders()
    } catch { alert('Erro ao duplicar OS') }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any, updated_at: new Date().toISOString() } : o))
    try {
      await updateServiceOrder(orderId, { status: newStatus as any, updated_at: new Date().toISOString() })
      cache.invalidate('service_orders_v2')
    } catch (err) {
      alert(`Erro ao atualizar status: ${err}`)
      await loadServiceOrders()
    }
  }

  const handleExecute = async (order: ServiceOrder) => {
    const newStatus = order.status === 'pending' ? 'in_progress' : order.status === 'in_progress' ? 'completed' : order.status
    if (!confirm(`Deseja ${newStatus === 'in_progress' ? 'iniciar' : 'concluir'} a OS ${order.order_number}?`)) return
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o))
    try {
      await updateServiceOrder(order.id, { status: newStatus, updated_at: new Date().toISOString() })
      cache.invalidate('service_orders_v2')
    } catch {
      alert('Erro ao executar ação')
      await loadServiceOrders()
    }
  }

  const handleDeleteClick  = (order: ServiceOrder) => { setOrderToDelete(order); setShowDeleteModal(true) }
  const handleCancelDelete = () => { setShowDeleteModal(false); setOrderToDelete(null) }

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return
    try {
      setDeleting(true)
      setOrders(prev => prev.filter(o => o.id !== orderToDelete.id))
      await deleteServiceOrder(orderToDelete.id)
      cache.invalidate('service_orders_v2')
      setShowDeleteModal(false)
      setOrderToDelete(null)
    } catch (err: any) {
      await loadServiceOrders()
      alert(`Erro ao excluir: ${err?.message || 'Erro desconhecido'}`)
    } finally { setDeleting(false) }
  }

  const toggleSelectId = useCallback((id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedIds(new Set())
      setSelectAll(false)
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)))
      setSelectAll(true)
    }
  }, [selectAll, filteredOrders])

  const handleBulkStatus = useCallback(async (status: string) => {
    for (const id of selectedIds) {
      await updateServiceOrder(id, { status: status as any, updated_at: new Date().toISOString() })
    }
    setOrders(prev => prev.map(o => selectedIds.has(o.id) ? { ...o, status: status as any } : o))
    setSelectedIds(new Set())
    setSelectAll(false)
    cache.invalidate('service_orders_v2')
  }, [selectedIds])

  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`Excluir ${selectedIds.size} OS permanentemente?`)) return
    for (const id of selectedIds) await deleteServiceOrder(id)
    setOrders(prev => prev.filter(o => !selectedIds.has(o.id)))
    setSelectedIds(new Set())
    setSelectAll(false)
    cache.invalidate('service_orders_v2')
  }, [selectedIds])

  const handleExportCSV = useCallback(() => {
    const rows = [
      ['OS', 'Status', 'Prioridade', 'Cliente', 'Serviço', 'Responsável', 'Prazo', 'Valor', 'Criado em'],
      ...filteredOrders.map(o => [
        `OS-${o.order_number}`,
        STATUS_CONFIG[o.status]?.label || o.status,
        PRIORITY_CONFIG[o.priority]?.label || o.priority || '',
        o.client_name || '',
        o.service_type || '',
        o.assigned_to || '',
        o.due_date || o.service_date || '',
        String(Number(o.final_total || o.total_value || 0).toFixed(2)),
        o.created_at ? new Date(o.created_at).toLocaleDateString('pt-BR') : '',
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ordens_servico_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredOrders])

  const clearFilters = () => {
    setSelectedStatus('all')
    setSelectedPriority('all')
    setSelectedResponsible('')
    setDueDateFrom('')
    setDueDateTo('')
    setValueMin('')
    setValueMax('')
    setShowOverdueOnly(false)
  }

  // KPI counts
  const countByStatus = (s: string) => orders.filter(o => o.status === s).length
  const totalValue    = orders.reduce((s, o) => s + Number(o.total_value || o.final_total || 0), 0)
  const pending       = countByStatus('pending')
  const inProgress    = countByStatus('in_progress')
  const completed     = countByStatus('completed')
  const overdueCount  = orders.filter(isOverdue).length

  const st = (status: string) => STATUS_CONFIG[status] || { label: status, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 ring-gray-200', ring: 'ring-gray-300' }
  const pr = (priority: string) => PRIORITY_CONFIG[priority] || { label: priority, cls: 'bg-gray-100 text-gray-600 ring-gray-200' }

  return (
    <div className="space-y-4 pb-24">

      {/* ── PAGE HEADER ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ordens de Serviço</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} ordens cadastradas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={loadServiceOrders}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/service-orders-kanban')}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <BarChart2 className="h-4 w-4" />
            Kanban
          </button>
          <button
            onClick={() => { setEditingOrderId(undefined); setShowOrderModal(true) }}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nova OS
          </button>
        </div>
      </div>

      {/* ── KPI STRIP ────────────────────────────────── */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                { label: 'Pendentes',     value: pending,    icon: <Clock className="h-4 w-4" />,          color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100', onClick: () => setSelectedStatus('pending') },
                { label: 'Em Andamento',  value: inProgress, icon: <PlayCircle className="h-4 w-4" />,     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100',  onClick: () => setSelectedStatus('in_progress') },
                { label: 'Concluídas',    value: completed,  icon: <CheckCircle2 className="h-4 w-4" />,   color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-100',onClick: () => setSelectedStatus('completed') },
                { label: 'Atrasadas',     value: overdueCount, icon: <AlertTriangle className="h-4 w-4" />, color: overdueCount > 0 ? 'text-red-600' : 'text-gray-400', bg: overdueCount > 0 ? 'bg-red-50' : 'bg-gray-50', border: overdueCount > 0 ? 'border-red-100' : 'border-gray-100', onClick: () => setShowOverdueOnly(true) },
                { label: 'Faturamento',   value: fmt(totalValue), icon: <DollarSign className="h-4 w-4" />, color: 'text-gray-700', bg: 'bg-white', border: 'border-gray-100', onClick: () => {} },
              ].map((k, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={k.onClick}
                  className={`${k.bg} ${k.border} border rounded-xl p-3 text-left hover:shadow-md transition-all group`}
                >
                  <div className={`${k.color} flex items-center gap-1.5 text-xs font-medium mb-1.5`}>
                    {k.icon}
                    {k.label}
                  </div>
                  <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setShowStats(!showStats)}
        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition -mt-1"
      >
        <TrendingUp className="h-3 w-3" />
        {showStats ? 'Ocultar métricas' : 'Ver métricas'}
      </button>

      {/* ── SEARCH & FILTERS ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, cliente, serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-transparent outline-none bg-gray-50"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            <SortButton field="created_at"   label="Data"         sortField={sortField} sortDir={sortDir} onChange={handleSortField} />
            <span className="text-gray-200">|</span>
            <SortButton field="due_date"     label="Prazo"        sortField={sortField} sortDir={sortDir} onChange={handleSortField} />
            <span className="text-gray-200">|</span>
            <SortButton field="total_value"  label="Valor"        sortField={sortField} sortDir={sortDir} onChange={handleSortField} />
            <span className="text-gray-200">|</span>
            <SortButton field="client_name"  label="Cliente"      sortField={sortField} sortDir={sortDir} onChange={handleSortField} />
          </div>

          {showOverdueOnly && (
            <button
              onClick={() => setShowOverdueOnly(false)}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Só atrasadas
              <X className="h-3 w-3" />
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${showFilters || hasActiveFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
            {hasActiveFilters && (
              <span className={`ml-1 w-2 h-2 rounded-full ${showFilters ? 'bg-white' : 'bg-blue-500'} shrink-0`} />
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:ring-2 focus:ring-gray-300 outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="cotacao">Cotação</option>
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="on_hold">Pausado</option>
                      <option value="completed">Concluída</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Prioridade</label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:ring-2 focus:ring-gray-300 outline-none"
                    >
                      <option value="all">Todas</option>
                      <option value="high">Alta</option>
                      <option value="medium">Média</option>
                      <option value="low">Baixa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Responsável</label>
                    <select
                      value={selectedResponsible}
                      onChange={(e) => setSelectedResponsible(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:ring-2 focus:ring-gray-300 outline-none"
                    >
                      <option value="">Todos</option>
                      {responsibles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Prazo de</label>
                    <input
                      type="date"
                      value={dueDateFrom}
                      onChange={e => setDueDateFrom(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:ring-2 focus:ring-gray-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Prazo até</label>
                    <input
                      type="date"
                      value={dueDateTo}
                      onChange={e => setDueDateTo(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:ring-2 focus:ring-gray-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Valor mín. (R$)</label>
                    <input
                      type="number"
                      value={valueMin}
                      onChange={e => setValueMin(e.target.value)}
                      placeholder="0"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:ring-2 focus:ring-gray-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Valor máx. (R$)</label>
                    <input
                      type="number"
                      value={valueMax}
                      onChange={e => setValueMax(e.target.value)}
                      placeholder="Sem limite"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:ring-2 focus:ring-gray-300 outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOverdueOnly}
                        onChange={e => setShowOverdueOnly(e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700">Somente atrasadas</span>
                    </label>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {filteredOrders.length} de {orders.length} ordens
                    </span>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 font-medium"
                    >
                      Limpar todos os filtros
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SELECT ALL / COUNT BAR ────────────────────── */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              onClick={handleSelectAll}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                selectAll ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {selectAll && <CheckSquare className="h-3 w-3" />}
            </button>
            <span className="text-xs text-gray-500">
              {selectAll ? `${filteredOrders.length} selecionadas` : 'Selecionar todas'}
            </span>
          </label>
          <div className="flex items-center gap-3">
            {filteredOrders.length !== orders.length && (
              <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5 font-medium">
                {filteredOrders.length} de {orders.length}
              </span>
            )}
            {selectedIds.size > 0 && (
              <span className="text-xs text-gray-500 font-medium">
                {selectedIds.size} selecionada{selectedIds.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── ERROR ────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── LIST ─────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Carregando ordens...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center"
        >
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">Nenhuma ordem encontrada</h3>
          <p className="text-sm text-gray-500 mb-5">Tente ajustar os filtros ou criar uma nova OS.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => { setSearchTerm(''); clearFilters() }}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Limpar filtros
            </button>
            <button
              onClick={() => { setEditingOrderId(undefined); setShowOrderModal(true) }}
              className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova OS
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order, index) => {
            const s    = st(order.status)
            const p    = pr(order.priority)
            const tv   = Number(order.final_total || order.total_value || 0)
            const over = isOverdue(order)
            const days = getDaysUntilDue(order)
            const isSelected = selectedIds.has(order.id)

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden ${
                  isSelected ? 'border-blue-300 ring-2 ring-blue-200' : over ? 'border-red-200 hover:border-red-300' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`h-0.5 w-full ${over ? 'bg-red-400' : s.dot}`} />

                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelectId(order.id)}
                        className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 hover:border-blue-400 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isSelected && <CheckSquare className="h-3 w-3" />}
                      </button>

                      <div className="shrink-0 w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                        <ClipboardList className="h-[18px] w-[18px] text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900">OS-{order.order_number}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${s.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                          {order.priority && order.priority !== 'medium' && (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${p.cls}`}>
                              {p.label}
                            </span>
                          )}
                          {over && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 ring-1 ring-red-300 animate-pulse">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Atrasada
                            </span>
                          )}
                          {!over && days !== null && days <= 3 && days >= 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 ring-1 ring-amber-300">
                              <Clock className="h-2.5 w-2.5" />
                              {days === 0 ? 'Vence hoje' : `${days}d`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">{order.service_type || 'Sem descrição'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-base font-bold text-gray-900">{fmt(tv)}</p>
                        {(order as any).lucro_total > 0 && (
                          <p className="text-xs text-emerald-600 flex items-center gap-0.5 justify-end">
                            <TrendingUp className="h-3 w-3" />
                            {fmt(Number((order as any).lucro_total))}
                          </p>
                        )}
                      </div>

                      <select
                        value={order.status}
                        onChange={(e) => { e.stopPropagation(); handleStatusChange(order.id, e.target.value) }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-xl border-0 ring-1 cursor-pointer outline-none focus:ring-2 ${s.badge} ${s.ring}`}
                      >
                        <option value="cotacao">Cotação</option>
                        <option value="pending">Pendente</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="on_hold">Pausado</option>
                        <option value="completed">Concluído</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Cliente</p>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <p className="text-sm text-gray-800 font-medium truncate">{order.client_name || '—'}</p>
                      </div>
                      {order.client_phone && <p className="text-xs text-gray-500 ml-5 truncate">{order.client_phone}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Responsável</p>
                      <p className="text-sm text-gray-800 truncate">{order.assigned_to || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Prazo</p>
                      <div className="flex items-center gap-1.5">
                        <Calendar className={`h-3.5 w-3.5 shrink-0 ${over ? 'text-red-500' : 'text-gray-400'}`} />
                        <p className={`text-sm ${over ? 'text-red-600 font-semibold' : 'text-gray-800'}`}>
                          {order.due_date ? formatDateSafe(order.due_date) : order.service_date ? formatDateSafe(order.service_date) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="sm:hidden">
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Valor</p>
                      <p className="text-sm font-bold text-gray-900">{fmt(tv)}</p>
                    </div>
                  </div>

                  {/* Gamification inline */}
                  <div className="mb-3">
                    <GamificationToggle
                      serviceOrderId={order.id}
                      customerId={order.client_id}
                      status={order.status}
                      totalValue={order.total_value || 0}
                      orderNumber={order.order_number}
                      onUpdate={loadServiceOrders}
                      variant="inline"
                    />
                  </div>

                  {/* Row 3: description + action bar */}
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 truncate flex-1">{order.description || ''}</p>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => navigate(`/service-orders/${order.id}/view`)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setEditingOrderId(order.id); setShowOrderModal(true) }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPrintOrderId(order.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Imprimir OS"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleExecute(order)}
                        disabled={order.status === 'completed'}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={order.status === 'pending' ? 'Iniciar OS' : order.status === 'in_progress' ? 'Concluir OS' : 'Concluída'}
                      >
                        <PlayCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/service-orders/${order.id}/mobile`)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="App Técnico"
                      >
                        <Smartphone className="h-4 w-4" />
                      </button>
                      <DocumentGeneratorButton
                        templateType="service_order"
                        data={{ serviceOrder: order, customer: order.customer, company: { name: 'GiarTech' } }}
                        label=""
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      />
                      <button
                        onClick={() => handleDuplicate(order)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(order)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── DELETE MODAL ─────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Excluir Ordem de Serviço</h3>
                  <p className="text-red-200 text-xs">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm space-y-1.5">
                  <p className="font-semibold text-red-800 mb-2">Você vai excluir:</p>
                  <p className="text-red-700"><span className="font-medium">OS:</span> {orderToDelete?.order_number}</p>
                  <p className="text-red-700"><span className="font-medium">Cliente:</span> {orderToDelete?.client_name}</p>
                  <p className="text-red-700"><span className="font-medium">Serviço:</span> {orderToDelete?.service_type}</p>
                </div>
                <p className="text-sm text-gray-600 text-center">Todos os dados relacionados serão removidos permanentemente.</p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCancelDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {deleting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Excluindo...</>
                    ) : (
                      <><Trash2 className="h-4 w-4" />Confirmar Exclusão</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PRINT MODAL ──────────────────────────────── */}
      {printOrderId && (
        <OSPrintPreviewModal
          orderId={printOrderId}
          onClose={() => setPrintOrderId(null)}
        />
      )}

      {/* ── OS MODAL ─────────────────────────────────── */}
      <ServiceOrderModalOptimized
        isOpen={showOrderModal}
        onClose={() => { setShowOrderModal(false); setEditingOrderId(undefined) }}
        onSave={() => { loadServiceOrders(); setShowOrderModal(false); setEditingOrderId(undefined) }}
        serviceOrderId={editingOrderId || null}
      />

      {/* ── BULK ACTIONS BAR ─────────────────────────── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <BulkActionsBar
            selectedIds={selectedIds}
            onClearSelection={() => { setSelectedIds(new Set()); setSelectAll(false) }}
            onBulkStatus={handleBulkStatus}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default ServiceOrders
