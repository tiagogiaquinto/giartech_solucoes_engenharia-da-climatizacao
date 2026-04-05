import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Printer, QrCode } from 'lucide-react'

interface AssetLabelPrintProps {
  equipment: {
    id: string
    name: string
    brand?: string
    model?: string
    serial_number?: string
    location?: string
    qr_code_token: string
    customer_name?: string
  }
  onClose: () => void
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

function QRCanvas({ value, size }: { value: string; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current || !value) return
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(ref.current!, value, {
        width: size, margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
    })
  }, [value, size])
  return <canvas ref={ref} />
}

export default function AssetLabelPrint({ equipment, onClose }: AssetLabelPrintProps) {
  const [labelSize, setLabelSize] = useState<'thermal' | 'a4'>('thermal')
  const qrUrl = `${BASE_URL}/care/${equipment.qr_code_token}`

  const thermalDims = { width: '62mm', minHeight: '40mm' }
  const a4Dims     = { width: '90mm', minHeight: '55mm' }
  const dims = labelSize === 'thermal' ? thermalDims : a4Dims
  const qrSize = labelSize === 'thermal' ? 100 : 130

  function print() {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const canvases = document.querySelectorAll('.label-preview canvas')
    const canvas = canvases[0] as HTMLCanvasElement
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : ''

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Etiqueta — ${equipment.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; }
    .label {
      width: ${dims.width};
      min-height: ${dims.minHeight};
      border: 1.5px solid #0f172a;
      border-radius: 6px;
      padding: ${labelSize === 'thermal' ? '6px' : '10px'};
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: ${labelSize === 'thermal' ? '8px' : '12px'};
      background: #fff;
      page-break-inside: avoid;
      ${labelSize === 'a4' ? 'margin: 20mm auto;' : 'margin: 5mm auto;'}
    }
    .qr-col { flex-shrink: 0; }
    .qr-col img { display: block; width: ${labelSize === 'thermal' ? '72px' : '96px'}; height: ${labelSize === 'thermal' ? '72px' : '96px'}; }
    .info-col { flex: 1; min-width: 0; }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: ${labelSize === 'thermal' ? '3px' : '5px'};
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: #0f172a; flex-shrink: 0; }
    .company { font-size: ${labelSize === 'thermal' ? '7px' : '9px'}; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
    .name { font-size: ${labelSize === 'thermal' ? '10px' : '13px'}; font-weight: 800; color: #0f172a; line-height: 1.2; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .meta { font-size: ${labelSize === 'thermal' ? '7px' : '9px'}; color: #64748b; margin-bottom: 1px; }
    .meta strong { color: #334155; }
    .url { font-size: ${labelSize === 'thermal' ? '6px' : '8px'}; color: #94a3b8; font-family: monospace; margin-top: 3px; word-break: break-all; }
    .footer { text-align: center; margin-top: ${labelSize === 'thermal' ? '4px' : '6px'}; font-size: ${labelSize === 'thermal' ? '6px' : '7px'}; color: #94a3b8; letter-spacing: 0.05em; }
    @media print { @page { size: ${labelSize === 'thermal' ? '62mm 40mm' : 'A4'}; margin: 0; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="qr-col">
      <img src="${qrDataUrl}" alt="QR Code" />
    </div>
    <div class="info-col">
      <div class="brand-row">
        <div class="dot"></div>
        <span class="company">GiarTech Care</span>
      </div>
      <div class="name">${equipment.name}</div>
      ${equipment.brand || equipment.model ? `<div class="meta"><strong>${[equipment.brand, equipment.model].filter(Boolean).join(' · ')}</strong></div>` : ''}
      ${equipment.serial_number ? `<div class="meta">S/N: <strong>${equipment.serial_number}</strong></div>` : ''}
      ${equipment.customer_name ? `<div class="meta">Cliente: <strong>${equipment.customer_name}</strong></div>` : ''}
      ${equipment.location ? `<div class="meta">Local: <strong>${equipment.location}</strong></div>` : ''}
      <div class="url">${qrUrl}</div>
    </div>
  </div>
  <div class="footer">Escaneie para ver histórico · giartechsolucoes.com.br</div>
  <script>window.onload = () => { window.print(); window.close(); }<\/script>
</body>
</html>`)
    printWindow.document.close()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}>

        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}>

          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Gerar Etiqueta de Identificação</h2>
                <p className="text-xs text-gray-500">{equipment.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-4">

            <div className="flex gap-2">
              {([
                { id: 'thermal', label: 'Térmica (62×40mm)' },
                { id: 'a4',     label: 'Padrão (90×55mm)' },
              ] as const).map(opt => (
                <button key={opt.id} onClick={() => setLabelSize(opt.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    labelSize === opt.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="label-preview bg-gray-50 rounded-xl p-4 flex items-center justify-center">
              <div
                className="bg-white border-2 border-slate-900 rounded-lg flex items-center gap-3 shadow-sm"
                style={{
                  width: labelSize === 'thermal' ? '220px' : '280px',
                  minHeight: labelSize === 'thermal' ? '80px' : '110px',
                  padding: labelSize === 'thermal' ? '8px' : '12px',
                }}>

                <div className="flex-shrink-0">
                  <QRCanvas value={qrUrl} size={qrSize} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    <span className="text-[8px] font-bold tracking-widest uppercase text-slate-500">GiarTech Care</span>
                  </div>
                  <p className={`font-black text-slate-900 leading-tight truncate ${labelSize === 'thermal' ? 'text-[11px]' : 'text-[13px]'}`}>
                    {equipment.name}
                  </p>
                  {(equipment.brand || equipment.model) && (
                    <p className={`text-slate-600 font-semibold truncate ${labelSize === 'thermal' ? 'text-[8px]' : 'text-[10px]'}`}>
                      {[equipment.brand, equipment.model].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {equipment.serial_number && (
                    <p className={`text-slate-500 ${labelSize === 'thermal' ? 'text-[7px]' : 'text-[9px]'}`}>
                      S/N: {equipment.serial_number}
                    </p>
                  )}
                  {equipment.customer_name && (
                    <p className={`text-slate-500 truncate ${labelSize === 'thermal' ? 'text-[7px]' : 'text-[9px]'}`}>
                      {equipment.customer_name}
                    </p>
                  )}
                  <p className={`text-slate-400 font-mono break-all ${labelSize === 'thermal' ? 'text-[5px]' : 'text-[7px]'}`}>
                    {qrUrl}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700">
              <strong>Dica:</strong> Cole a etiqueta no equipamento ao finalizar a OS. O cliente escaneará para ver o histórico completo.
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={print}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(15,23,42,0.3)'
              }}>
              <Printer className="w-4 h-4" />
              Imprimir Etiqueta
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
