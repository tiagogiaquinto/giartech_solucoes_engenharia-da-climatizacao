import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode, ExternalLink, Copy, Check } from 'lucide-react'

interface OSTrackQRCodeProps {
  trackToken: string
  orderNumber?: string
  size?: number
  showCopyLink?: boolean
  className?: string
}

export function getTrackUrl(trackToken: string): string {
  const base = window.location.origin
  return `${base}/track/${trackToken}`
}

export default function OSTrackQRCode({
  trackToken,
  orderNumber,
  size = 120,
  showCopyLink = true,
  className = ''
}: OSTrackQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const trackUrl = getTrackUrl(trackToken)

  useEffect(() => {
    if (!canvasRef.current || !trackToken) return
    QRCode.toCanvas(canvasRef.current, trackUrl, {
      width: size,
      margin: 1,
      color: { dark: '#0F567D', light: '#FFFFFF' },
      errorCorrectionLevel: 'M'
    }).catch(() => {})
  }, [trackToken, trackUrl, size])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(trackUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!trackToken) return null

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100 inline-block">
        <canvas ref={canvasRef} width={size} height={size} />
      </div>
      {orderNumber && (
        <p className="text-xs text-gray-500 font-medium text-center">
          OS #{orderNumber}
        </p>
      )}
      {showCopyLink && (
        <div className="flex items-center gap-1.5">
          <a
            href={trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#0F567D] hover:underline font-medium"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir página
          </a>
          <span className="text-gray-300">·</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>
      )}
    </div>
  )
}

export function OSTrackQRCodePanel({ trackToken, orderNumber }: { trackToken: string; orderNumber?: string }) {
  const trackUrl = getTrackUrl(trackToken)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !trackToken) return
    QRCode.toCanvas(canvasRef.current, trackUrl, {
      width: 100,
      margin: 1,
      color: { dark: '#0F567D', light: '#FFFFFF' },
      errorCorrectionLevel: 'M'
    }).catch(() => {})
  }, [trackToken, trackUrl])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(trackUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
      <div className="bg-white rounded-lg p-1.5 shadow-sm border border-blue-100 shrink-0">
        <canvas ref={canvasRef} width={100} height={100} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <QrCode className="h-4 w-4 text-[#0F567D]" />
          <p className="text-sm font-bold text-[#0F567D]">QR Code do Cliente</p>
        </div>
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
          Compartilhe este código ou link com o cliente para que ele acompanhe o status da OS em tempo real, sem precisar de login.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs bg-[#0F567D] text-white px-3 py-1.5 rounded-lg hover:bg-[#0c4a6e] transition-colors font-medium"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver página
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>
      </div>
    </div>
  )
}
