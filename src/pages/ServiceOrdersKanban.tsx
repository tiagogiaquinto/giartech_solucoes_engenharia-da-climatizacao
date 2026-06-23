import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Clock, User, DollarSign, Calendar, AlertCircle, CheckCircle2, PlayCircle, XCircle, Plus, Search, FileEdit as Edit2, MoreVertical, GripVertical, RefreshCw, Pause, ChevronRight, FileQuestion } from 'lucide-react'
import { getServiceOrders, updateServiceOrder, type ServiceOrder } from '../lib/database-services'
import ServiceOrderModal from '../components/ServiceOrderModal'

// Maps any DB status variant to a canonical kanban column id
const normalizeStatus = (status?: string): string => {
  if (!status) return 'pending'
  const s = status.toLowerCase()
  if (s === 'cotacao' || s === 'cotação' || s === 'orcamento' || s === 'orçamento') return 'cotacao'
  if (s === 'pending' || s === 'pendente' || s === 'aberta' || s === 'open') return 'pending'
  if (s === 'in_progress' || s === 'em_andamento' || s === 'em andamento') return 'in_progress'
  if (s === 'on_hold' || s === 'pausado' || s === 'pausada') return 'on_hold'
  if (s === 'completed' || s === 'concluida' || s === 'concluído' || s === 'concluída' || s === 'done') return 'completed'
  if (s === 'cancelled' || s === 'cancelada' || s === 'cancelado') return 'cancelled'
  return s
}

const COLUMNS = [
  {
    id: 'cotacao',
    title: 'Cotações',
    dbValues: ['cotacao', 'cotação', 'orcamento', 'orçamento'],
    icon: FileQuestion,
    accent: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#c4b5fd',
  },
  {
    id: 'pending',
    title: 'Pendentes',
    dbValues: ['pending', 'pendente', 'aberta', 'open'],
    icon: AlertCircle,
    accent: '#f59e0b',
    bg: '#fffbeb',
    border: '#fcd34d',
  },
  {
    id: 'in_progress',
    title: 'Em Andamento',
    dbValues: ['in_progress', 'em_andamento', 'em andamento'],
    icon: PlayCircle,
    accent: '#3b82f6',
    bg: '#eff6ff',
    border: '#93c5fd',
  },
  {
    id: 'on_hold',
    title: 'Pausadas',
    dbValues: ['on_hold', 'pausado', 'pausada'],
    icon: Pause,
    accent: '#6b7280',
    bg: '#f9fafb',
    border: '#d1d5db',
  },
  {
    id: 'completed',
    title: 'Concluídas',
    dbValues: ['completed', 'concluida', 'concluído', 'concluída', 'done'],
    icon: CheckCircle2,
    accent: '#10b981',
    bg: '#ecfdf5',
    border: '#6ee7b7',
  },
  {
    id: 'cancelled',
    title: 'Canceladas',
    dbValues: ['cancelled', 'cancelada', 'cancelado'],
    icon: XCircle,
    accent: '#ef4444',
    bg: '#fef2f2',
    border: '#fca5a5',
  },
]

const formatCurrency = (value?: number) =>
  value
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : null

const formatDate = (dateString?: string) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const getDaysOpen = (createdAt?: string) => {
  if (!createdAt) return 0
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
}

const ServiceOrdersKanban = () => {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadServiceOrders()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadServiceOrders = async () => {
    try {
      setLoading(true)
      const data = await getServiceOrders()
      setServiceOrders(data || [])
    } catch (err) {
      console.error('Kanban load error:', err)
      setServiceOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setModalOpen(true)
    setMenuOpen(null)
  }

  const handleNew = () => {
    setEditingId(null)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingId(null)
  }

  const handleModalSave = () => {
    handleModalClose()
    loadServiceOrders()
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setServiceOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    )
    setMenuOpen(null)
    try {
      await updateServiceOrder(orderId, { status: newStatus, updated_at: new Date().toISOString() })
    } catch (err) {
      console.error(err)
      loadServiceOrders()
    }
  }

  const getOrdersByColumn = (colId: string) => {
    const col = COLUMNS.find(c => c.id === colId)
    if (!col) return []
    return serviceOrders.filter(o => {
      const canonical = normalizeStatus(o.status)
      const matchStatus = canonical === colId
      const matchSearch = !searchTerm ||
        o.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchStatus && matchSearch
    })
  }

  const handleDragStart = (id: string) => setDraggingId(id)
  const handleDragEnd = () => { setDraggingId(null); setDragOverCol(null) }
  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    setDragOverCol(colId)
  }
  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    if (draggingId) handleStatusChange(draggingId, colId)
    setDraggingId(null)
    setDragOverCol(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando ordens de serviço...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              Kanban — Ordens de Serviço
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{serviceOrders.length} ordens cadastradas</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadServiceOrders}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nova OS
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, descrição ou número..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 560 }}>
        {COLUMNS.map(col => {
          const orders = getOrdersByColumn(col.id)
          const Icon = col.icon
          const isDragTarget = dragOverCol === col.id

          return (
            <div
              key={col.id}
              className="flex-shrink-0 flex flex-col"
              style={{ width: 260 }}
              onDragOver={e => handleDragOver(e, col.id)}
              onDrop={e => handleDrop(e, col.id)}
            >
              <div
                className="rounded-t-xl px-3 py-2.5 flex items-center justify-between"
                style={{ background: col.bg, borderTop: `3px solid ${col.accent}` }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: col.accent }} />
                  <span className="font-semibold text-gray-800 text-sm">{col.title}</span>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: col.accent }}
                >
                  {orders.length}
                </span>
              </div>

              <div
                className={`flex-1 rounded-b-xl p-2 space-y-2 transition-colors duration-150 ${isDragTarget ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-gray-100'}`}
                style={{ minHeight: 480 }}
              >
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-gray-400 text-xs gap-1">
                    <ChevronRight className="h-4 w-4 opacity-40" />
                    Nenhuma ordem
                  </div>
                ) : (
                  <AnimatePresence>
                    {orders.map(order => {
                      const days = getDaysOpen(order.created_at)
                      const isUrgent = days > 3 && col.id !== 'completed' && col.id !== 'cancelled'
                      const value = order.final_total || order.total_value

                      return (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          draggable
                          onDragStart={() => handleDragStart(order.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white rounded-xl border shadow-sm group relative transition-shadow hover:shadow-md ${draggingId === order.id ? 'opacity-40' : ''} ${isUrgent ? 'border-amber-300' : 'border-gray-200'}`}
                        >
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <GripVertical className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 cursor-grab active:cursor-grabbing" />
                                <div className="min-w-0">
                                  {order.order_number && (
                                    <span className="text-[10px] font-mono text-gray-400 block">#{order.order_number}</span>
                                  )}
                                  <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                    {order.client_name || 'Cliente não informado'}
                                  </p>
                                </div>
                              </div>

                              <div className="relative flex-shrink-0" ref={menuOpen === order.id ? menuRef : undefined}>
                                <button
                                  onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === order.id ? null : order.id) }}
                                  className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                <AnimatePresence>
                                  {menuOpen === order.id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                      transition={{ duration: 0.12 }}
                                      className="absolute right-0 top-7 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[180px]"
                                    >
                                      <button
                                        onClick={() => handleEdit(order.id)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                        Editar OS
                                      </button>
                                      <div className="border-t border-gray-100 my-1" />
                                      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Mover para</p>
                                      {COLUMNS.filter(c => c.id !== col.id).map(c => {
                                        const CIcon = c.icon
                                        return (
                                          <button
                                            key={c.id}
                                            onClick={() => handleStatusChange(order.id, c.id)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                          >
                                            <CIcon className="h-3.5 w-3.5" style={{ color: c.accent }} />
                                            {c.title}
                                          </button>
                                        )
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            {order.description && (
                              <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                                {order.description}
                              </p>
                            )}

                            <div className="space-y-1">
                              {(order.due_date || order.service_date) && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span>{formatDate(order.due_date || order.service_date)}</span>
                                </div>
                              )}
                              {order.client_phone && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <User className="h-3 w-3 flex-shrink-0" />
                                  <span>{order.client_phone}</span>
                                </div>
                              )}
                              {formatCurrency(value) && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                                  <DollarSign className="h-3 w-3 flex-shrink-0" />
                                  <span>{formatCurrency(value)}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                              <div className={`flex items-center gap-1 text-xs ${isUrgent ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                                <Clock className="h-3 w-3" />
                                <span>{days}d</span>
                              </div>
                              <button
                                onClick={() => handleEdit(order.id)}
                                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Edit2 className="h-3 w-3" />
                                Editar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-6 justify-center">
          {COLUMNS.map(col => {
            const orders = getOrdersByColumn(col.id)
            const total = orders.reduce((s, o) => s + (o.final_total || o.total_value || 0), 0)
            return (
              <div key={col.id} className="text-center min-w-[80px]">
                <div className="text-2xl font-bold" style={{ color: col.accent }}>{orders.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">{col.title}</div>
                {total > 0 && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(total)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {modalOpen && (
        <ServiceOrderModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          orderId={editingId || undefined}
        />
      )}
    </div>
  )
}

export default ServiceOrdersKanban
