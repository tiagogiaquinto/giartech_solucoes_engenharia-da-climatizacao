import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  X,
  MapPin,
  Navigation,
  Phone,
  CheckCircle2,
  Circle,
  Camera,
  Trash2,
  Plus,
  ArrowLeft,
  Wrench,
  Clock,
  ChevronRight,
  AlertTriangle,
  Lock,
  Image as ImageIcon,
  PenLine,
  RotateCcw
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

interface OSOrder {
  id: string
  order_number: string
  status: string
  priority: string
  title?: string
  description?: string
  client_name?: string
  client_phone?: string
  client_address?: string
  client_city?: string
  scheduled_at?: string
  scheduled_time?: string
  equipment?: string
  brand?: string
  model?: string
  progress_percent?: number
}

interface ChecklistItem {
  id: string
  os_id: string
  description: string
  is_completed: boolean
  position: number
}

interface CapturedPhoto {
  id: string
  type: 'before' | 'after'
  dataUrl: string
}

interface OSExecutionDrawerProps {
  order: OSOrder | null
  onClose: () => void
  onFinished: () => void
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-600',
  low: 'bg-gray-400'
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Normal',
  low: 'Baixa'
}

const DEFAULT_TASKS = [
  'Verificar ferramentas e equipamentos necessários',
  'Apresentar-se ao cliente e confirmar o serviço',
  'Executar o serviço conforme especificações',
  'Testar e validar o resultado final',
  'Limpar e organizar o local de trabalho',
  'Coletar assinatura do cliente'
]

type TabId = 'info' | 'checklist' | 'fotos' | 'assinatura'

const TABS: { id: TabId; label: string; icon: typeof Wrench }[] = [
  { id: 'info', label: 'Detalhes', icon: Wrench },
  { id: 'checklist', label: 'Tarefas', icon: CheckCircle2 },
  { id: 'fotos', label: 'Fotos', icon: Camera },
  { id: 'assinatura', label: 'Assinatura', icon: PenLine }
]

export default function OSExecutionDrawer({ order, onClose, onFinished }: OSExecutionDrawerProps) {
  const { user } = useUser()
  const [tab, setTab] = useState<TabId>('info')
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const [newTaskText, setNewTaskText] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [loadingChecklist, setLoadingChecklist] = useState(true)
  const [hasSigned, setHasSigned] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const progress = items.length > 0
    ? Math.round((items.filter(i => i.is_completed).length / items.length) * 100)
    : 0
  const allDone = items.length > 0 && progress === 100
  const beforePhotos = photos.filter(p => p.type === 'before')
  const afterPhotos = photos.filter(p => p.type === 'after')

  const loadChecklist = useCallback(async () => {
    if (!order) return
    setLoadingChecklist(true)
    try {
      const { data } = await supabase
        .from('os_checklist_items')
        .select('*')
        .eq('os_id', order.id)
        .order('position', { ascending: true })

      if (data && data.length > 0) {
        setItems(data as ChecklistItem[])
      } else {
        const inserts = DEFAULT_TASKS.map((description, position) => ({
          os_id: order.id,
          description,
          is_completed: false,
          position
        }))
        const { data: created } = await supabase
          .from('os_checklist_items')
          .insert(inserts)
          .select()
        if (created) setItems(created as ChecklistItem[])
      }
    } finally {
      setLoadingChecklist(false)
    }
  }, [order])

  useEffect(() => {
    if (order) {
      setTab('info')
      setPhotos([])
      setHasSigned(false)
      setNewTaskText('')
      setShowAddTask(false)
      loadChecklist()
    }
  }, [order, loadChecklist])

  const toggleItem = async (item: ChecklistItem) => {
    if (togglingId) return
    setTogglingId(item.id)
    const newVal = !item.is_completed
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_completed: newVal } : i))
    await supabase
      .from('os_checklist_items')
      .update({ is_completed: newVal })
      .eq('id', item.id)
    setTogglingId(null)
  }

  const addTask = async () => {
    if (!newTaskText.trim() || !order) return
    const position = items.length
    const { data } = await supabase
      .from('os_checklist_items')
      .insert({ os_id: order.id, description: newTaskText.trim(), is_completed: false, position })
      .select()
      .maybeSingle()
    if (data) setItems(prev => [...prev, data as ChecklistItem])
    setNewTaskText('')
    setShowAddTask(false)
  }

  const deleteItem = async (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId))
    await supabase.from('os_checklist_items').delete().eq('id', itemId)
  }

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setPhotos(prev => [...prev, { id: crypto.randomUUID(), type, dataUrl }])
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removePhoto = (id: string) => setPhotos(prev => prev.filter(p => p.id !== id))

  const getCanvasPos = (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    isDrawing.current = true
    lastPos.current = getCanvasPos(e)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing.current || !lastPos.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getCanvasPos(e)
    if (!pos) return
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
    setHasSigned(true)
  }

  const endDraw = () => { isDrawing.current = false; lastPos.current = null }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSigned(false)
  }

  const openInMaps = () => {
    if (!order?.client_address) return
    const q = order.client_city ? `${order.client_address}, ${order.client_city}` : order.client_address
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank')
  }

  const finalizeOS = async () => {
    if (!allDone || !order || finishing) return
    setFinishing(true)
    await supabase
      .from('service_orders')
      .update({ status: 'completed', progress_percent: 100 })
      .eq('id', order.id)
    setFinishing(false)
    onFinished()
  }

  const priorityColor = PRIORITY_COLORS[order?.priority || 'medium'] || 'bg-blue-600'
  const priorityLabel = PRIORITY_LABELS[order?.priority || 'medium'] || 'Normal'

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
              if (info.offset.y > 120) onClose()
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] shadow-2xl flex flex-col"
            style={{ maxHeight: '94vh', height: '94vh' }}
          >
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0">
              <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </div>

            <div className="px-4 pb-3 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${priorityColor}`}>
                      {priorityLabel}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">OS #{order.order_number}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 truncate">
                    {order.client_name || 'Cliente não informado'}
                  </h2>
                  {order.equipment && (
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5" />
                      {order.equipment}{order.brand ? ` — ${order.brand}` : ''}{order.model ? ` ${order.model}` : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-gray-100 text-gray-500 active:scale-90 transition-transform ml-3"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3 bg-gray-100 rounded-2xl h-2.5 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${allDone ? 'bg-green-500' : 'bg-blue-600'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{items.filter(i => i.is_completed).length}/{items.length} tarefas</span>
                <span className={allDone ? 'text-green-600 font-bold' : 'font-semibold'}>{progress}%</span>
              </div>
            </div>

            <div className="flex border-b border-gray-100 flex-shrink-0 px-2">
              {TABS.map(t => {
                const Icon = t.icon
                const active = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                      active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-semibold">{t.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {tab === 'info' && (
                <div className="p-4 space-y-3">
                  {order.client_address && (
                    <div className="bg-blue-50 rounded-2xl p-4">
                      <p className="text-xs text-blue-500 font-semibold uppercase mb-2">Endereço</p>
                      <p className="text-gray-800 font-medium text-sm mb-3">
                        {order.client_address}{order.client_city ? `, ${order.client_city}` : ''}
                      </p>
                      <button
                        onClick={openInMaps}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-blue-200"
                      >
                        <Navigation className="w-5 h-5" />
                        Abrir no GPS
                      </button>
                    </div>
                  )}

                  {order.client_phone && (
                    <a
                      href={`tel:${order.client_phone}`}
                      className="flex items-center gap-3 bg-green-50 rounded-2xl p-4 active:scale-[0.98] transition-transform"
                    >
                      <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-green-600 font-semibold">Ligar para cliente</p>
                        <p className="text-gray-800 font-bold">{order.client_phone}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-green-400 ml-auto" />
                    </a>
                  )}

                  {order.scheduled_time && (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Horário agendado</p>
                        <p className="text-gray-800 font-bold">{order.scheduled_time}</p>
                      </div>
                    </div>
                  )}

                  {order.description && (
                    <div className="bg-amber-50 rounded-2xl p-4">
                      <p className="text-xs text-amber-600 font-semibold uppercase mb-2">Descrição do Serviço</p>
                      <p className="text-gray-700 text-sm leading-relaxed">{order.description}</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'checklist' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">Checklist</h3>
                    <button
                      onClick={() => setShowAddTask(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAddTask && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-gray-50 rounded-2xl p-3 flex gap-2 border border-gray-200">
                          <input
                            type="text"
                            value={newTaskText}
                            onChange={e => setNewTaskText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTask()}
                            placeholder="Descreva a nova tarefa..."
                            autoFocus
                            className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
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

                  {loadingChecklist ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`bg-white rounded-2xl border transition-colors ${
                            item.is_completed ? 'border-green-200 bg-green-50' : 'border-gray-100 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3 p-4">
                            <button
                              onClick={() => toggleItem(item)}
                              disabled={togglingId === item.id}
                              className="flex-shrink-0 active:scale-90 transition-transform"
                            >
                              {item.is_completed ? (
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                              ) : (
                                <Circle className="w-8 h-8 text-gray-300" />
                              )}
                            </button>
                            <span
                              className={`flex-1 text-sm leading-relaxed ${
                                item.is_completed ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'
                              }`}
                            >
                              {item.description}
                            </span>
                            {!item.is_completed && (
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-1.5 text-gray-200 active:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'fotos' && (
                <div className="p-4 space-y-4">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handlePhotoCapture(e, photoInputRef.current?.dataset.photoType as 'before' | 'after' || 'before')}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">Fotos Antes</h3>
                        <p className="text-xs text-gray-400">Registre a condição inicial</p>
                      </div>
                      <button
                        onClick={() => {
                          if (photoInputRef.current) {
                            photoInputRef.current.dataset.photoType = 'before'
                            photoInputRef.current.click()
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                      >
                        <Camera className="w-4 h-4" />
                        Capturar
                      </button>
                    </div>
                    {beforePhotos.length === 0 ? (
                      <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center">
                        <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Nenhuma foto "antes" capturada</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {beforePhotos.map(p => (
                          <div key={p.id} className="relative rounded-2xl overflow-hidden aspect-square">
                            <img src={p.dataUrl} alt="antes" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removePhoto(p.id)}
                              className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-xl flex items-center justify-center"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-gray-100" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">Fotos Depois</h3>
                        <p className="text-xs text-gray-400">Registre o resultado final</p>
                      </div>
                      <button
                        onClick={() => {
                          if (photoInputRef.current) {
                            photoInputRef.current.dataset.photoType = 'after'
                            photoInputRef.current.click()
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                      >
                        <Camera className="w-4 h-4" />
                        Capturar
                      </button>
                    </div>
                    {afterPhotos.length === 0 ? (
                      <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center">
                        <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Nenhuma foto "depois" capturada</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {afterPhotos.map(p => (
                          <div key={p.id} className="relative rounded-2xl overflow-hidden aspect-square">
                            <img src={p.dataUrl} alt="depois" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removePhoto(p.id)}
                              className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-xl flex items-center justify-center"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'assinatura' && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">Assinatura do Cliente</h3>
                      <p className="text-xs text-gray-400">Peça ao cliente para assinar abaixo</p>
                    </div>
                    <button
                      onClick={clearSignature}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Limpar
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={360}
                      height={220}
                      className="w-full touch-none"
                      style={{ background: 'white' }}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                  </div>

                  {!hasSigned && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      <PenLine className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <p className="text-amber-700 text-xs">Use o dedo para assinar na área acima</p>
                    </div>
                  )}

                  {hasSigned && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <p className="text-green-700 text-xs font-medium">Assinatura registrada</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="p-4 flex-shrink-0 bg-white border-t border-gray-100"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              {!allDone && (
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-amber-600 text-xs">
                    Complete {items.length - items.filter(i => i.is_completed).length} tarefa(s) restante(s) para finalizar
                  </p>
                </div>
              )}
              <motion.button
                onClick={finalizeOS}
                disabled={!allDone || finishing}
                whileTap={allDone ? { scale: 0.97 } : {}}
                className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  allDone
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
                    {progress}% concluído
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
