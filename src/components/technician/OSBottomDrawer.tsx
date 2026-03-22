import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  MapPin,
  Navigation,
  Phone,
  Wrench,
  CheckCircle2,
  Circle,
  Clock,
  CheckCheck,
  ChevronDown,
  AlertCircle,
  PenLine
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

interface ServiceOrder {
  id: string
  order_number?: string
  title?: string
  client_name?: string
  client_address?: string
  client_city?: string
  client_phone?: string
  scheduled_at?: string
  scheduled_time?: string
  status: string
  equipment?: string
  brand?: string
  model?: string
  description?: string
  location_detail?: string
}

interface ChecklistItem {
  id: string
  description: string
  is_completed: boolean
  order_index: number
}

interface OSBottomDrawerProps {
  order: ServiceOrder | null
  onClose: () => void
  onFinished: () => void
  readOnly?: boolean
}

const DEFAULT_CHECKLIST = [
  'Verificar equipamento e identificar problema',
  'Checar instalacao eletrica e tensao',
  'Inspecionar filtros e componentes internos',
  'Realizar limpeza geral do equipamento',
  'Executar servico conforme solicitado',
  'Testar funcionamento apos servico'
]

const OSBottomDrawer = ({ order, onClose, onFinished, readOnly = false }: OSBottomDrawerProps) => {
  const { user } = useUser()
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [savingItem, setSavingItem] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signatureSaved, setSignatureSaved] = useState(false)

  useEffect(() => {
    if (order?.id) {
      loadChecklist()
    } else {
      setChecklistItems([])
    }
  }, [order?.id])

  const loadChecklist = async () => {
    if (!order?.id) return
    setLoadingChecklist(true)
    try {
      const { data, error } = await supabase
        .from('os_checklist_items')
        .select('*')
        .eq('service_order_id', order.id)
        .order('order_index', { ascending: true })

      if (!error && data && data.length > 0) {
        setChecklistItems(data.map(item => ({
          id: item.id,
          description: item.description || item.title || '',
          is_completed: item.is_completed || item.checked || false,
          order_index: item.order_index || 0
        })))
      } else {
        const defaults = DEFAULT_CHECKLIST.map((desc, i) => ({
          id: `default_${i}`,
          description: desc,
          is_completed: false,
          order_index: i
        }))
        setChecklistItems(defaults)
      }
    } catch {
      const defaults = DEFAULT_CHECKLIST.map((desc, i) => ({
        id: `default_${i}`,
        description: desc,
        is_completed: false,
        order_index: i
      }))
      setChecklistItems(defaults)
    } finally {
      setLoadingChecklist(false)
    }
  }

  const toggleItem = async (item: ChecklistItem) => {
    if (readOnly || savingItem) return

    const newValue = !item.is_completed
    setChecklistItems(prev =>
      prev.map(c => c.id === item.id ? { ...c, is_completed: newValue } : c)
    )

    if (item.id.startsWith('default_')) return

    setSavingItem(item.id)
    try {
      await supabase
        .from('os_checklist_items')
        .update({ is_completed: newValue, checked: newValue })
        .eq('id', item.id)
    } catch {
      setChecklistItems(prev =>
        prev.map(c => c.id === item.id ? { ...c, is_completed: !newValue } : c)
      )
    } finally {
      setSavingItem(null)
    }
  }

  const completedCount = checklistItems.filter(i => i.is_completed).length
  const totalCount = checklistItems.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isComplete = progressPercent === 100

  const openInMaps = () => {
    if (!order?.client_address) return
    const q = order.client_city ? `${order.client_address}, ${order.client_city}` : order.client_address
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank')
  }

  const formatTime = (dateStr?: string, timeStr?: string) => {
    if (timeStr) return timeStr
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch { return null }
  }

  const startSignature = () => {
    if (signatureCanvasRef.current) {
      const ctx = signatureCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height)
        setHasSignature(false)
      }
    }
    setShowSignatureModal(true)
  }

  const getCanvasPos = (canvas: HTMLCanvasElement, e: React.TouchEvent | React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY
    }
  }

  const onDrawStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getCanvasPos(canvas, e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    setIsDrawing(true)
    setHasSignature(true)
  }

  const onDrawMove = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getCanvasPos(canvas, e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const onDrawEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleFinish = async () => {
    if (!isComplete || !hasSignature || finishing) return
    setFinishing(true)
    try {
      const canvas = signatureCanvasRef.current
      const signatureData = canvas ? canvas.toDataURL('image/png') : null

      if (signatureData && order?.id) {
        await supabase.from('os_signatures').upsert({
          service_order_id: order.id,
          signature_data: signatureData,
          signed_by: 'client',
          signed_at: new Date().toISOString()
        }, { onConflict: 'service_order_id' })
      }

      if (order?.id) {
        await supabase.from('service_orders').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress_percent: 100
        }).eq('id', order.id)
      }

      setSignatureSaved(true)
      setTimeout(() => {
        setShowSignatureModal(false)
        onFinished()
      }, 1200)
    } catch (err) {
      console.error('Erro ao finalizar OS:', err)
    } finally {
      setFinishing(false)
    }
  }

  const time = order ? formatTime(order.scheduled_at, order.scheduled_time) : null

  return (
    <>
      <AnimatePresence>
        {order && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl"
              style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
            >
              <div className="flex items-center justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              <div className="px-5 py-3 flex-shrink-0 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                        OS #{order.order_number}
                      </span>
                      {time && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{time}</span>
                        </div>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 truncate">
                      {order.client_name || 'Cliente nao informado'}
                    </h2>
                    {order.client_address && (
                      <button
                        onClick={openInMaps}
                        className="flex items-center gap-1.5 text-xs text-blue-600 mt-1 active:opacity-70"
                      >
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{order.client_address}{order.client_city ? `, ${order.client_city}` : ''}</span>
                        <Navigation className="w-3 h-3 flex-shrink-0" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {order.client_address && (
                      <button
                        onClick={openInMaps}
                        className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 active:scale-90 transition-transform"
                      >
                        <Navigation className="w-5 h-5" />
                      </button>
                    )}
                    {order.client_phone && (
                      <a
                        href={`tel:${order.client_phone}`}
                        className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-600/30 active:scale-90 transition-transform"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                    <button
                      onClick={onClose}
                      className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {(order.equipment || order.location_detail || order.description) && (
                <div className="px-5 py-3 flex-shrink-0 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {order.equipment && (
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {order.equipment}{order.brand ? ` — ${order.brand}` : ''}{order.model ? ` ${order.model}` : ''}
                        </p>
                      )}
                      {order.location_detail && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          <MapPin className="w-3 h-3 inline mr-1" />{order.location_detail}
                        </p>
                      )}
                      {order.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{order.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">Checklist de Execucao</h3>
                    <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-gray-500'}`}>
                      {completedCount}/{totalCount}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>Progresso</span>
                      <span className={`font-bold ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>{progressPercent}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.4 }}
                        className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                      />
                    </div>
                  </div>

                  {loadingChecklist ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2 pb-4">
                      {checklistItems.map((item, index) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04 }}
                          onClick={() => toggleItem(item)}
                          disabled={readOnly || savingItem === item.id}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98] ${
                            item.is_completed
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-white border border-gray-100 shadow-sm'
                          } ${readOnly ? 'cursor-default' : ''}`}
                        >
                          <div className="flex-shrink-0">
                            {savingItem === item.id ? (
                              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : item.is_completed ? (
                              <CheckCircle2 className="w-6 h-6 text-green-500" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-300" />
                            )}
                          </div>
                          <span className={`text-sm flex-1 text-left leading-snug ${
                            item.is_completed ? 'text-green-700 line-through' : 'text-gray-700'
                          }`}>
                            {item.description}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!readOnly && (
                <div className="px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
                  {!isComplete && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-3">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="text-xs text-amber-700">
                        Conclua todos os {totalCount} itens do checklist para finalizar
                      </p>
                    </div>
                  )}
                  <button
                    onClick={startSignature}
                    disabled={!isComplete}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${
                      isComplete
                        ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <PenLine className="w-5 h-5" />
                    Finalizar e Colher Assinatura
                  </button>
                </div>
              )}

              {readOnly && (
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <CheckCheck className="w-4 h-4" />
                    <span className="text-sm font-medium">Modo somente leitura</span>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSignatureModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[60] flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="bg-white rounded-t-3xl w-full max-w-lg p-6"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Assinatura do Cliente</h3>
                  <p className="text-sm text-gray-400">Solicite ao cliente que assine abaixo</p>
                </div>
                {!signatureSaved && (
                  <button
                    onClick={() => setShowSignatureModal(false)}
                    className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center active:scale-90"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>

              {signatureSaved ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">OS Finalizada!</h4>
                  <p className="text-gray-500 text-sm">Assinatura registrada com sucesso</p>
                </motion.div>
              ) : (
                <>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden mb-4 bg-gray-50">
                    <canvas
                      ref={signatureCanvasRef}
                      width={600}
                      height={200}
                      className="w-full h-[180px] touch-none cursor-crosshair"
                      onMouseDown={onDrawStart}
                      onMouseMove={onDrawMove}
                      onMouseUp={onDrawEnd}
                      onMouseLeave={onDrawEnd}
                      onTouchStart={onDrawStart}
                      onTouchMove={onDrawMove}
                      onTouchEnd={onDrawEnd}
                    />
                    {!hasSignature && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ position: 'relative', marginTop: '-180px', height: '180px' }}>
                        <p className="text-gray-400 text-sm">Assine aqui</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={clearSignature}
                      className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold active:scale-[0.98] transition-all"
                    >
                      Limpar
                    </button>
                    <button
                      onClick={handleFinish}
                      disabled={!hasSignature || finishing}
                      className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-semibold active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-600/30"
                    >
                      {finishing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Confirmar
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default OSBottomDrawer
