import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, MapPin, User, Wrench, PenTool, RotateCcw, Send, ChevronUp, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'
import { generateVisitReportPDF } from '../../utils/generateVisitReportPDF'

interface ChecklistItem {
  id: string
  description: string
  is_completed: boolean
}

interface OSOrder {
  id: string
  order_number: string
  title?: string
  client_name?: string
  client_address?: string
  client_city?: string
  equipment?: string
  brand?: string
  model?: string
  status: string
}

interface BottomDrawerFinalizacaoOSProps {
  order: OSOrder | null
  onClose: () => void
  onFinished: () => void
}

const SignaturePad = ({
  label,
  canvasRef,
  onClear
}: {
  label: string
  canvasRef: React.RefObject<HTMLCanvasElement>
  onClear: () => void
}) => {
  const isDrawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const getPos = (e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) => {
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

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    isDrawing.current = true
    lastPos.current = getPos(e, canvas)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const stopDraw = () => { isDrawing.current = false }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <PenTool className="w-4 h-4 text-blue-600" />
          {label}
        </p>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar
        </button>
      </div>
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full h-[120px] cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
      <p className="text-[10px] text-gray-400 text-center">Assine acima com o dedo ou caneta</p>
    </div>
  )
}

const BottomDrawerFinalizacaoOS = ({ order, onClose, onFinished }: BottomDrawerFinalizacaoOSProps) => {
  const { user } = useUser()
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [clientName, setClientName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const techSigRef = useRef<HTMLCanvasElement>(null)
  const clientSigRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!order) return
    setClientName('')
    setSubmitError('')
    setChecklist([])
    loadChecklist(order.id)
  }, [order?.id])

  const loadChecklist = async (osId: string) => {
    try {
      const { data } = await supabase
        .from('os_checklist_items')
        .select('id, description, is_completed')
        .eq('os_id', osId)
        .order('created_at', { ascending: true })
      setChecklist(data || [])
    } catch {
      /* noop */
    }
  }

  const clearCanvas = useCallback((ref: React.RefObject<HTMLCanvasElement>) => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const isCanvasEmpty = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return true
    const ctx = canvas.getContext('2d')
    if (!ctx) return true
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    return !data.some(v => v !== 0)
  }

  const getSignatureDataURL = (canvas: HTMLCanvasElement | null) => {
    if (!canvas || isCanvasEmpty(canvas)) return null
    return canvas.toDataURL('image/png')
  }

  const handleSubmit = async () => {
    if (!order || !user) return
    if (!clientName.trim()) {
      setSubmitError('Informe o nome do responsável pelo recebimento.')
      return
    }
    if (isCanvasEmpty(techSigRef.current)) {
      setSubmitError('A assinatura do técnico é obrigatória.')
      return
    }
    if (isCanvasEmpty(clientSigRef.current)) {
      setSubmitError('A assinatura do cliente é obrigatória.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const techSig = getSignatureDataURL(techSigRef.current)
      const clientSig = getSignatureDataURL(clientSigRef.current)

      const { error: completionError } = await supabase
        .from('os_completion_data')
        .upsert({
          os_id: order.id,
          technician_signature: techSig,
          client_name: clientName.trim(),
          client_signature: clientSig,
          completed_at: new Date().toISOString(),
          submitted_by: user.id
        }, { onConflict: 'os_id' })

      if (completionError) throw completionError

      const { error: statusError } = await supabase
        .from('service_orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (statusError) throw statusError

      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'OS Finalizada',
          message: `A OS #${order.order_number} foi concluída pelo técnico. Cliente: ${clientName.trim()}.`,
          type: 'success',
          is_read: false,
          related_table: 'service_orders',
          related_id: order.id
        })

      try {
        await generateVisitReportPDF({
          order_number: order.order_number,
          customer_name: order.client_name || clientName.trim(),
          customer_address: order.client_address,
          customer_city: order.client_city,
          technician_name: user.email || 'Técnico',
          completed_at: new Date().toISOString(),
          equipment: order.equipment,
          brand: order.brand,
          model: order.model,
          checklist_items: checklist,
          tech_signature: techSig || undefined,
          client_signature: clientSig || undefined,
          client_signer_name: clientName.trim(),
        })
      } catch {
        /* PDF generation is best-effort — don't block finalization */
      }

      onFinished()
    } catch (err) {
      setSubmitError('Erro ao finalizar OS. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const completedTasks = checklist.filter(c => c.is_completed)
  const totalTasks = checklist.length

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
          >
            <div className="w-full max-w-[600px] bg-white rounded-t-3xl shadow-2xl max-h-[93dvh] flex flex-col">
              <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Finalizar OS</h2>
                      <p className="text-xs text-gray-400">OS #{order.order_number}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Resumo Técnico</p>
                  {order.title && (
                    <div className="flex items-start gap-2">
                      <Wrench className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-gray-800">{order.title}</p>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{order.client_name || 'Cliente não informado'}</p>
                  </div>
                  {order.client_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        {order.client_address}
                        {order.client_city ? `, ${order.client_city}` : ''}
                      </p>
                    </div>
                  )}
                  {order.equipment && (
                    <div className="flex items-start gap-2">
                      <Wrench className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        {order.equipment}
                        {order.brand ? ` — ${order.brand}` : ''}
                        {order.model ? ` ${order.model}` : ''}
                      </p>
                    </div>
                  )}
                  {totalTasks > 0 && (
                    <div className="pt-1 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500">Tarefas</p>
                        <span className="text-xs font-bold text-gray-700">
                          {completedTasks.length}/{totalTasks} concluídas
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0}%` }}
                        />
                      </div>
                      {completedTasks.length < totalTasks && (
                        <p className="text-[11px] text-amber-600 font-medium mt-1.5 flex items-center gap-1">
                          <ChevronUp className="w-3 h-3" />
                          {totalTasks - completedTasks.length} tarefa(s) pendente(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">
                    Nome do Responsável pelo Recebimento
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Nome completo de quem recebe o serviço"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <SignaturePad
                  label="Assinatura do Técnico"
                  canvasRef={techSigRef}
                  onClear={() => clearCanvas(techSigRef)}
                />

                <SignaturePad
                  label="Assinatura do Cliente"
                  canvasRef={clientSigRef}
                  onClear={() => clearCanvas(clientSigRef)}
                />

                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-medium"
                    >
                      {submitError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pb-2">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-green-600/20"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Confirmar Conclusão
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default BottomDrawerFinalizacaoOS
