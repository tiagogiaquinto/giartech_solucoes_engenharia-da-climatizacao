import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Clock, User, DollarSign, Calendar, AlertCircle, CheckCircle2, PlayCircle, Circle as XCircle, Plus, Search, FileEdit as Edit2, MoreVertical, GripVertical, RefreshCw, Pause, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ServiceOrderModal from '../components/ServiceOrderModal'

interface ServiceOrder {
  id: string
  order_number?: string
  customer_id?: string
  status?: string
  description?: string
  scheduled_at?: string
  opened_at: string
  closed_at?: string
  total_value?: number
  customer?: {
    nome_razao: string
    telefone?: string
  }
}

const COLUMNS = [
  {
    id: 'cotacao',
    title: 'Cotações',
    icon: ClipboardList,
    accent: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    dot: 'bg-violet-500',
  },
  {
    id: 'aberta',
    title: 'Abertas',
    icon: AlertCircle,
    accent: '#f59e0b',
    bg: '#fffbeb',
    border: '#fcd34d',
    dot: 'bg-amber-500',
  },
  {
    id: 'em_andamento',
    title: 'Em Andamento',
    icon: PlayCircle,
    accent: '#3b82f6',
    bg: '#eff6ff',
    border: '#93c5fd',
    dot: 'bg-blue-500',
  },
  {
    id: 'pausada',
    title: 'Pausadas',
    icon: Pause,
    accent: '#6b7280',
    bg: '#f9fafb',
    border: '#d1d5db',
    dot: 'bg-gray-400',
  },
  {
    id: 'concluida',
    title: 'Concluídas',
    icon: CheckCircle2,
    accent: '#10b981',
    bg: '#ecfdf5',
    border: '#6ee7b7',
    dot: 'bg-emerald-500',
  },
  {
    id: 'cancelada',
    title: 'Canceladas',
    icon: XCircle,
    accent: '#ef4444',
    bg: '#fef2f2',
    border: '#fca5a5',
    dot: 'bg-red-400',
  },
]

const formatCurrency = (value?: number) =>
  value
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : null

const formatDate = (dateString?: string) => {
  if (!dateString) return null
  const d = new Date(dateString)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const getDaysOpen = (openedAt: string) => {
  const diff = Math.floor((Date.now() - new Date(openedAt).getTime()) / 86400000)
  return diff
}

const ServiceOrdersKanban = () => {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [creatingNew, setCreatingNew] = useState(false)
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
      const { data, error } = await supabase
        .from('service_orders')
        .select('id, order_number, customer_id, status, description, scheduled_at, opened_at, closed_at, total_value, customer:customers(nome_razao, telefone)')
        .order('opened_at', { ascending: false })
      if (error) throw error
      setServiceOrders(data || [])
    } catch (err) {
      console.error(err)
      setServiceOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setCreatingNew(false)
    setModalOpen(true)
    setMenuOpen(null)
  }

  const handleNew = () => {
    setEditingId(null)
    setCreatingNew(true)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingId(null)
    setCreatingNew(false)
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
      await supabase.from('service_orders').update({ status: newStatus }).eq('id', orderId)
    } catch (err) {
      console.error(err)
      loadServiceOrders()
    }
  }

  const getOrdersByStatus = (status: string) =>
    serviceOrders.filter(o => {
      const s = o.status || 'aberta'
      const matchStatus = s === status
      const matchSearch = !searchTerm ||
        o.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer?.nome_razao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchStatus && matchSearch
    })

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

  const totalOrders = serviceOrders.length

  return (
    <div className="p-4 space-y-4 min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              Kanban — Ordens de Serviço
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{totalOrders} ordens cadastradas</p>
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
          const orders = getOrdersByStatus(col.id)
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
                      const days = getDaysOpen(order.opened_at)
                      const isUrgent = days > 3 && col.id !== 'concluida' && col.id !== 'cancelada'

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
                                    {order.customer?.nome_razao || 'Cliente não informado'}
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
                              {order.scheduled_at && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span>{formatDate(order.scheduled_at)}</span>
                                </div>
                              )}
                              {order.customer?.telefone && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <User className="h-3 w-3 flex-shrink-0" />
                                  <span>{order.customer.telefone}</span>
                                </div>
                              )}
                              {formatCurrency(order.total_value) && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                                  <DollarSign className="h-3 w-3 flex-shrink-0" />
                                  <span>{formatCurrency(order.total_value)}</span>
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
            const orders = getOrdersByStatus(col.id)
            const total = orders.reduce((s, o) => s + (o.total_value || 0), 0)
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

      {(modalOpen) && (
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
