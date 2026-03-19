import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  Plus,
  Trash2,
  ClipboardList,
  ChevronRight,
  Lock
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'
import { formatDateSafe } from '../../utils/format'

interface ChecklistItem {
  id: string
  os_id: string
  description: string
  is_completed: boolean
  position: number
  updated_at: string
}

interface ServiceOrder {
  id: string
  order_number: string
  status: string
  priority: string
  scheduled_date?: string
  description?: string
  progress_percent: number
  customers?: {
    name: string
    phone?: string
    customer_addresses?: { street: string; number: string; city: string }[]
  }
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-gray-400'
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Normal',
  low: 'Baixa'
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Execução',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  on_hold: 'Pausada'
}

const DEFAULT_TASKS = [
  'Verificar equipamentos e ferramentas necessárias',
  'Apresentar-se ao cliente e confirmar o serviço',
  'Executar o serviço conforme especificações',
  'Testar e validar o resultado',
  'Limpar e organizar o local de trabalho',
  'Coletar assinatura do cliente'
]

export default function MobileOSExecution() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()

  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)

  const canEdit = user?.role === 'technician' || user?.role === 'admin' || user?.role === 'super_admin' || user?.isTechnician || user?.isAdmin || user?.isSuperAdmin

  const progress = items.length > 0
    ? Math.round((items.filter(i => i.is_completed).length / items.length) * 100)
    : 0

  const allDone = items.length > 0 && progress === 100

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      const [{ data: osData }, { data: checklistData }] = await Promise.all([
        supabase
          .from('service_orders')
          .select(`
            id, order_number, status, priority, scheduled_date, description, progress_percent,
            customers (name, phone, customer_addresses (street, number, city))
          `)
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('os_checklist_items')
          .select('*')
          .eq('os_id', id)
          .order('position', { ascending: true })
      ])

      if (osData) setOrder(osData as ServiceOrder)

      if (checklistData && checklistData.length > 0) {
        setItems(checklistData as ChecklistItem[])
      } else {
        await createDefaultChecklist(id)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  const createDefaultChecklist = async (osId: string) => {
    const inserts = DEFAULT_TASKS.map((description, position) => ({
      os_id: osId,
      description,
      is_completed: false,
      position
    }))

    const { data } = await supabase
      .from('os_checklist_items')
      .insert(inserts)
      .select()

    if (data) setItems(data as ChecklistItem[])
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`os-checklist-${id}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'os_checklist_items', filter: `os_id=eq.${id}` },
        (payload: any) => {
          if (payload.eventType === 'UPDATE') {
            setItems(prev =>
              prev.map(item => item.id === payload.new.id ? { ...item, ...payload.new } : item)
            )
          } else if (payload.eventType === 'INSERT') {
            setItems(prev => [...prev, payload.new as ChecklistItem].sort((a, b) => a.position - b.position))
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'service_orders', filter: `id=eq.${id}` },
        (payload: any) => {
          setOrder(prev => prev ? { ...prev, progress_percent: payload.new.progress_percent, status: payload.new.status } : prev)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  const toggleItem = async (item: ChecklistItem) => {
    if (!canEdit || togglingId) return
    setTogglingId(item.id)

    setItems(prev =>
      prev.map(i => i.id === item.id ? { ...i, is_completed: !i.is_completed } : i)
    )

    await supabase
      .from('os_checklist_items')
      .update({ is_completed: !item.is_completed })
      .eq('id', item.id)

    setTogglingId(null)
  }

  const addTask = async () => {
    if (!newTaskText.trim() || !id || !canEdit) return
    const position = items.length

    const { data } = await supabase
      .from('os_checklist_items')
      .insert({ os_id: id, description: newTaskText.trim(), is_completed: false, position })
      .select()
      .maybeSingle()

    if (data) setItems(prev => [...prev, data as ChecklistItem])
    setNewTaskText('')
    setShowAddTask(false)
  }

  const deleteItem = async (itemId: string) => {
    if (!canEdit) return
    setItems(prev => prev.filter(i => i.id !== itemId))
    await supabase.from('os_checklist_items').delete().eq('id', itemId)
  }

  const finalizeOS = async () => {
    if (!allDone || !id || finishing) return
    setFinishing(true)

    await supabase
      .from('service_orders')
      .update({ status: 'completed', progress_percent: 100 })
      .eq('id', id)

    setShowSuccessOverlay(true)
    setTimeout(() => navigate('/mobile/orders'), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Carregando OS...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">OS não encontrada</h3>
          <button onClick={() => navigate('/mobile/orders')} className="mt-4 text-blue-600 font-semibold">
            Voltar para lista
          </button>
        </div>
      </div>
    )
  }

  const customer = (order.customers as any)
  const address = customer?.customer_addresses?.[0]

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-green-600 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <CheckCircle2 className="w-24 h-24 text-white mb-6" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">OS Finalizada!</h2>
            <p className="text-green-100 text-lg">Ordem de serviço concluída com sucesso.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 pt-4 pb-6 px-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/mobile/orders')}
            className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg truncate">
              OS #{order.order_number}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${PRIORITY_COLORS[order.priority] || 'bg-blue-500'}`}>
                {PRIORITY_LABELS[order.priority] || order.priority}
              </span>
              <span className="text-blue-100 text-xs">
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-semibold text-sm">Progresso</span>
            <span className="text-white font-bold text-xl">{progress}%</span>
          </div>
          <div className="h-3 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${allDone ? 'bg-green-400' : 'bg-white'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-blue-100 text-xs">
              {items.filter(i => i.is_completed).length} de {items.length} tarefas
            </span>
            {allDone && (
              <span className="text-green-300 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Tudo concluído!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* OS Info Card */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4 space-y-2">
        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="truncate">{customer?.name || 'Cliente não informado'}</span>
        </div>
        {address && (
          <div className="flex items-start gap-2 text-gray-500 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span>{address.street}, {address.number} — {address.city}</span>
          </div>
        )}
        {order.scheduled_date && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Agendada para {formatDateSafe(order.scheduled_date)}</span>
          </div>
        )}
        {order.description && (
          <p className="text-gray-600 text-sm border-t border-gray-100 pt-2 mt-2 leading-relaxed">
            {order.description}
          </p>
        )}
      </div>

      {/* Checklist */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-800 font-bold text-base">Tarefas</h2>
          {canEdit && (
            <button
              onClick={() => setShowAddTask(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          )}
        </div>

        {/* Add Task Input */}
        <AnimatePresence>
          {showAddTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 overflow-hidden"
            >
              <div className="bg-white rounded-2xl p-3 shadow-sm flex gap-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="Descreva a nova tarefa..."
                  autoFocus
                  className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none"
                />
                <button
                  onClick={addTask}
                  disabled={!newTaskText.trim()}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform"
                >
                  OK
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!canEdit && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
            <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-amber-700 text-xs">Somente técnicos e administradores podem alterar o checklist.</p>
          </div>
        )}

        <div className="space-y-2">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.04 }}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden ${
                  item.is_completed ? 'opacity-80' : ''
                }`}
              >
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleItem(item)}
                    disabled={!canEdit || togglingId === item.id}
                    className="flex-shrink-0 active:scale-90 transition-transform disabled:cursor-not-allowed"
                  >
                    {item.is_completed ? (
                      <CheckCircle2 className="w-7 h-7 text-green-500" />
                    ) : (
                      <Circle className={`w-7 h-7 ${canEdit ? 'text-gray-300' : 'text-gray-200'}`} />
                    )}
                  </button>

                  <span
                    className={`flex-1 text-sm leading-relaxed ${
                      item.is_completed
                        ? 'text-gray-400 line-through'
                        : 'text-gray-800 font-medium'
                    }`}
                  >
                    {item.description}
                  </span>

                  {canEdit && !item.is_completed && (
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-gray-300 active:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
        {!allDone && items.length > 0 && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-amber-600 text-xs">
              Complete todas as {items.length} tarefas para finalizar a OS.
            </p>
          </div>
        )}

        <motion.button
          onClick={finalizeOS}
          disabled={!allDone || finishing || !canEdit}
          whileTap={allDone && canEdit ? { scale: 0.97 } : {}}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
            allDone && canEdit
              ? 'bg-green-600 text-white shadow-lg shadow-green-200 active:bg-green-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {finishing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : allDone ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Finalizar Ordem de Serviço
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              {progress}% concluído — {items.length - items.filter(i => i.is_completed).length} tarefa(s) restante(s)
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
