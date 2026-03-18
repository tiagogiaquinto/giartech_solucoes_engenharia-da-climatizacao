import React, { useRef, useState, useEffect } from 'react'
import { X, PenLine, Trash2, Check, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface OSSignatureModalProps {
  orderId: string
  orderNumber: string
  orderTitle: string
  onClose: () => void
  onSigned: () => void
}

export function OSSignatureModal({ orderId, orderNumber, orderTitle, onClose, onSigned }: OSSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [saving, setSaving] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
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
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    lastPos.current = getPos(e, canvas)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing || !lastPos.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    lastPos.current = null
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const saveSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return
    setSaving(true)
    try {
      const signatureData = canvas.toDataURL('image/png')
      await supabase
        .from('service_orders')
        .update({
          signature_data: signatureData,
          signature_date: new Date().toISOString()
        })
        .eq('id', orderId)
      onSigned()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Assinatura Digital</h3>
            <p className="text-xs text-gray-500">{orderNumber} - {orderTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Ao assinar abaixo, voce confirma que o servico foi executado conforme descrito
            e que esta de acordo com a conclusao desta ordem de servico.
          </p>

          <div className="relative">
            <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-gray-300 pointer-events-none">
              <PenLine size={12} /> Assine aqui
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={160}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-white cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={clearSignature}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Trash2 size={14} /> Limpar
            </button>
            <button
              onClick={saveSignature}
              disabled={!hasSignature || saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Salvando...' : 'Confirmar Assinatura'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
