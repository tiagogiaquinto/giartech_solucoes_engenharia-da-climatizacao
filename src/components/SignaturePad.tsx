import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Check, RotateCcw, Download, Pen } from 'lucide-react'

interface SignaturePadProps {
  onSave: (signature: string) => void
  onClose: () => void
  customerName?: string
}

export default function SignaturePad({ onSave, onClose, customerName }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar canvas
    canvas.width = 600
    canvas.height = 300

    // Configurar estilo do pincel
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Fundo branco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    setContext(ctx)
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return

    setIsDrawing(true)
    setIsEmpty(false)

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    context.lineTo(x, y)
    context.stroke()
  }

  const stopDrawing = () => {
    if (!context) return
    setIsDrawing(false)
    context.closePath()
  }

  const clear = () => {
    if (!context || !canvasRef.current) return

    const canvas = canvasRef.current
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const save = () => {
    if (!canvasRef.current || isEmpty) return

    // Converter canvas para base64
    const signatureData = canvasRef.current.toDataURL('image/png')
    onSave(signatureData)
  }

  const download = () => {
    if (!canvasRef.current || isEmpty) return

    const link = document.createElement('a')
    link.download = `assinatura-${customerName || 'cliente'}-${Date.now()}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Pen className="h-6 w-6" />
                Assinatura Digital
              </h2>
              {customerName && (
                <p className="text-blue-100 mt-1">Cliente: {customerName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4">
            <p className="text-center text-sm text-gray-600 mb-3">
              Por favor, assine abaixo usando mouse/dedo
            </p>

            <div className="bg-white rounded-lg shadow-inner overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-auto cursor-crosshair touch-none"
                style={{ maxHeight: '300px' }}
              />
            </div>

            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-lg">Assine aqui</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Ao assinar, você confirma o recebimento do serviço conforme especificado</p>
            <p className="mt-1">Data: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <button
            onClick={clear}
            disabled={isEmpty}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={download}
              disabled={isEmpty}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-4 w-4" />
              Baixar
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={save}
              disabled={isEmpty}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="h-4 w-4" />
              Confirmar Assinatura
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
