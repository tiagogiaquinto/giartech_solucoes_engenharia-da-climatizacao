import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  X,
  Navigation,
  Phone,
  CheckCircle2,
  Circle,
  Camera,
  X as RemoveIcon,
  Wrench,
  Clock,
  ChevronRight,
  AlertTriangle,
  Lock,
  Image as ImageIcon,
  PenLine,
  RotateCcw,
  FileText,
  Save,
  CheckCheck
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
  technician_notes?: string
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
  persisted?: boolean
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

type TabId = 'info' | 'checklist' | 'fotos' | 'notas' | 'assinatura'

const TABS: { id: TabId; label: string; icon: typeof Wrench }[] = [
  { id: 'info', label: 'Detalhes', icon: Wrench },
  { id: 'checklist', label: 'Tarefas', icon: CheckCircle2 },
  { id: 'fotos', label: 'Fotos', icon: Camera },
  { id: 'notas', label: 'Notas', icon: FileText },
  { id: 'assinatura', label: 'Assinatura', icon: PenLine }
]

export default function OSExecutionDrawer({ order, onClose, onFinished }: OSExecutionDrawerProps) {
  const { user } = useUser()
  const [tab, setTab] = useState<TabId>('info')
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [loadingChecklist, setLoadingChecklist] = useState(true)
  const [hasSigned, setHasSigned] = useState(false)
  const [techNotes, setTechNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [photosSaving, setPhotosSaving] = useState(false)
  const [signatureSaving, setSignatureSaving] = useState(false)
  const [signatureSaved, setSignatureSaved] = useState(false)
  const [loadingPhotos, setLoadingPhotos] = useState(true)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const loadPhotos = useCallback(async () => {
    if (!order) return
    setLoadingPhotos(true)
    try {
      const { data } = await supabase
        .from('os_execution_photos')
        .select('id, photo_type, data_url')
        .eq('os_id', order.id)
        .order('created_at', { ascending: true })

      if (data) {
        setPhotos(data.map(p => ({
          id: p.id,
          type: p.photo_type as 'before' | 'after',
          dataUrl: p.data_url || '',
          persisted: true
        })))
      }
    } finally {
      setLoadingPhotos(false)
    }
  }, [order])

  const loadSignature = useCallback(async () => {
    if (!order) return
    const { data } = await supabase
      .from('os_signatures')
      .select('signature_png')
      .eq('os_id', order.id)
      .maybeSingle()

    if (data?.signature_png && canvasRef.current) {
      const img = new Image()
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx && canvasRef.current) {
          ctx.drawImage(img, 0, 0)
          setHasSigned(true)
          setSignatureSaved(true)
        }
      }
      img.src = data.signature_png
    }
  }, [order])

  useEffect(() => {
    if (order) {
      setTab('info')
      setPhotos([])
      setHasSigned(false)
      setSignatureSaved(false)
      setNotesSaved(false)
      setTechNotes(order.technician_notes || '')
      loadChecklist()
      loadPhotos()
    }
  }, [order, loadChecklist, loadPhotos])

  useEffect(() => {
    if (tab === 'assinatura' && order) {
      setTimeout(() => loadSignature(), 100)
    }
  }, [tab, order, loadSignature])

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

  const saveNotesDebounced = (value: string) => {
    setTechNotes(value)
    setNotesSaved(false)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      if (!order) return
      setNotesSaving(true)
      await supabase
        .from('service_orders')
        .update({ technician_notes: value })
        .eq('id', order.id)
      setNotesSaving(false)
      setNotesSaved(true)
    }, 1000)
  }

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0]
    if (!file || !order || !user) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      const tempId = crypto.randomUUID()
      setPhotos(prev => [...prev, { id: tempId, type, dataUrl, persisted: false }])
      setPhotosSaving(true)
      const { data } = await supabase
        .from('os_execution_photos')
        .insert({ os_id: order.id, photo_type: type, data_url: dataUrl, taken_by: user.id })
        .select('id')
        .maybeSingle()
      setPhotosSaving(false)
      if (data?.id) {
        setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id, persisted: true } : p))
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removePhoto = async (id: string) => {
    const photo = photos.find(p => p.id === id)
    setPhotos(prev => prev.filter(p => p.id !== id))
    if (photo?.persisted) {
      await supabase.from('os_execution_photos').delete().eq('id', id)
    }
  }

  const getCanvasPos = (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      }
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY
    }
  }

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    isDrawing.current = true
    lastPos.current = getCanvasPos(e)
    setSignatureSaved(false)
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
    setSignatureSaved(false)
  }

  const saveSignature = async () => {
    if (!hasSigned || !order || !user || signatureSaving) return
    const canvas = canvasRef.current
    if (!canvas) return
    setSignatureSaving(true)
    const png = canvas.toDataURL('image/png')
    await supabase
      .from('os_signatures')
      .upsert({ os_id: order.id, signature_png: png, signed_by: user.id, signed_at: new Date().toISOString() }, { onConflict: 'os_id' })
    setSignatureSaving(false)
    setSignatureSaved(true)
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

            <div className="flex border-b border-gray-100 flex-shrink-0 overflow-x-auto px-1">
              {TABS.map(t => {
                const Icon = t.icon
                const active = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-shrink-0 flex flex-col items-center py-2 px-3 gap-0.5 transition-colors ${
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

              {/* ── INFO TAB ── */}
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

              {/* ── CHECKLIST TAB — read + toggle only, no add/delete ── */}
              {tab === 'checklist' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-800">Checklist de Execução</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {items.filter(i => i.is_completed).length}/{items.length}
                    </span>
                  </div>

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
                          <button
                            onClick={() => toggleItem(item)}
                            disabled={togglingId === item.id}
                            className="w-full flex items-center gap-3 p-4 active:scale-[0.98] transition-transform text-left"
                          >
                            {item.is_completed ? (
                              <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle className="w-8 h-8 text-gray-300 flex-shrink-0" />
                            )}
                            <span
                              className={`flex-1 text-sm leading-relaxed ${
                                item.is_completed ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'
                              }`}
                            >
                              {item.description}
                            </span>
                            {togglingId === item.id && (
                              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                            )}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── FOTOS TAB ── */}
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

                  {photosSaving && (
                    <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-blue-600 font-medium">Salvando foto...</span>
                    </div>
                  )}

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
                    {loadingPhotos ? (
                      <div className="h-20 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : beforePhotos.length === 0 ? (
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
                              <RemoveIcon className="w-4 h-4 text-white" />
                            </button>
                            {!p.persisted && (
                              <div className="absolute bottom-2 left-2 bg-black/50 rounded-lg px-1.5 py-0.5">
                                <span className="text-white text-[10px]">salvando...</span>
                              </div>
                            )}
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
                              <RemoveIcon className="w-4 h-4 text-white" />
                            </button>
                            {!p.persisted && (
                              <div className="absolute bottom-2 left-2 bg-black/50 rounded-lg px-1.5 py-0.5">
                                <span className="text-white text-[10px]">salvando...</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── NOTAS DO TÉCNICO TAB ── */}
              {tab === 'notas' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">Observações do Técnico</h3>
                      <p className="text-xs text-gray-400">Registre detalhes da execução, problemas encontrados etc.</p>
                    </div>
                    {notesSaving && (
                      <div className="flex items-center gap-1 text-blue-500">
                        <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">salvando</span>
                      </div>
                    )}
                    {notesSaved && !notesSaving && (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCheck className="w-4 h-4" />
                        <span className="text-xs font-medium">salvo</span>
                      </div>
                    )}
                  </div>

                  <textarea
                    value={techNotes}
                    onChange={e => saveNotesDebounced(e.target.value)}
                    placeholder="Descreva o que foi realizado, peças utilizadas, problemas encontrados, recomendações para o cliente..."
                    rows={10}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none leading-relaxed"
                  />

                  <p className="text-xs text-gray-400 text-right">{techNotes.length} caracteres</p>
                </div>
              )}

              {/* ── ASSINATURA TAB ── */}
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

                  {hasSigned && !signatureSaved && (
                    <button
                      onClick={saveSignature}
                      disabled={signatureSaving}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-60"
                    >
                      {signatureSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {signatureSaving ? 'Salvando...' : 'Salvar Assinatura'}
                    </button>
                  )}

                  {signatureSaved && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <p className="text-green-700 text-xs font-medium">Assinatura salva com sucesso</p>
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
