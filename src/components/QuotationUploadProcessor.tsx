import React, { useState, useRef } from 'react'
import {
  Upload, FileText, Loader2, CheckCircle, AlertTriangle,
  Package, TrendingUp, TrendingDown, X, ChevronDown, ChevronUp,
  Sparkles, RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

interface ExtractedItem {
  id: string
  description: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  match_status: 'matched' | 'new_item' | 'unmatched' | 'ignored'
  match_confidence: number
  current_avg_cost: number
  price_change_pct: number
  matched_inventory_id: string | null
}

interface ExtractionResult {
  extraction_id: string
  supplier: string
  quote_date: string
  confidence: number
  items_extracted: number
  proposals_created: number
  items: ExtractedItem[]
}

interface QuotationUploadProcessorProps {
  serviceOrderId: string
  onExtractionComplete?: (result: ExtractionResult) => void
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function QuotationUploadProcessor({
  serviceOrderId,
  onExtractionComplete
}: QuotationUploadProcessorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [marginThreshold, setMarginThreshold] = useState(20)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const processFile = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use PDF, Word, TXT ou imagens.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.')
      return
    }

    setProcessing(true)
    setResult(null)

    try {
      const base64 = await fileToBase64(file)

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/process-quotation-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            service_order_id: serviceOrderId,
            file_content_base64: base64,
            file_name: file.name,
            file_type: file.type,
            margin_threshold: marginThreshold
          })
        }
      )

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Erro ao processar documento')

      setResult(data)
      onExtractionComplete?.(data)
      toast.success(`${data.items_extracted} iten(s) extraído(s) da cotação!`)
    } catch (error: any) {
      toast.error('Erro ao processar cotação: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const getMatchBadge = (item: ExtractedItem) => {
    if (item.match_status === 'matched') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle size={10} /> Encontrado no estoque
        </span>
      )
    }
    if (item.match_status === 'new_item') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <Package size={10} /> Novo item
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Sem correspondência
      </span>
    )
  }

  const getPriceChangeIcon = (pct: number) => {
    if (pct > 5) return <TrendingUp size={14} className="text-red-500" />
    if (pct < -5) return <TrendingDown size={14} className="text-green-500" />
    return null
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="border border-dashed border-amber-300 rounded-xl bg-amber-50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            Leitura Inteligente de Cotacao (IA)
          </span>
          {result && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-200 text-amber-800">
              {result.items_extracted} itens extraidos
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-amber-600" /> : <ChevronDown size={16} className="text-amber-600" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-amber-700">
            Anexe a cotacao do fornecedor (PDF, Word, imagem ou TXT) e a IA extrai
            automaticamente os itens, atualiza o estoque e alerta sobre mudancas de margem.
          </p>

          <div className="flex items-center gap-3">
            <label className="text-xs text-amber-700 whitespace-nowrap">Margem minima (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={marginThreshold}
              onChange={e => setMarginThreshold(Number(e.target.value))}
              className="w-20 px-2 py-1 text-xs border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !processing && fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all
              ${isDragging ? 'border-amber-500 bg-amber-100' : 'border-amber-300 bg-white hover:border-amber-400 hover:bg-amber-50'}
              ${processing ? 'cursor-not-allowed opacity-70' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,image/*"
              onChange={handleFileChange}
              disabled={processing}
            />
            {processing ? (
              <>
                <Loader2 size={28} className="text-amber-500 animate-spin" />
                <p className="text-sm font-medium text-amber-700">Processando com IA...</p>
                <p className="text-xs text-amber-500">Extraindo itens da cotacao</p>
              </>
            ) : (
              <>
                <Upload size={28} className="text-amber-400" />
                <p className="text-sm font-medium text-amber-700">
                  Arraste ou clique para enviar cotacao
                </p>
                <p className="text-xs text-amber-500">PDF, Word, imagem ou TXT - max 10MB</p>
              </>
            )}
          </div>

          {result && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3 p-3 bg-white rounded-xl border border-amber-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm font-semibold text-gray-800">Extracao concluida</span>
                  </div>
                  <p className="text-xs text-gray-500">Fornecedor: <span className="font-medium text-gray-700">{result.supplier}</span></p>
                  {result.quote_date && (
                    <p className="text-xs text-gray-500">
                      Data: <span className="font-medium text-gray-700">
                        {new Date(result.quote_date).toLocaleDateString('pt-BR')}
                      </span>
                    </p>
                  )}
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p><span className="font-semibold text-gray-700">{result.items_extracted}</span> itens</p>
                  <p><span className="font-semibold text-amber-600">{result.proposals_created}</span> propostas</p>
                  <p>Confianca: {Math.round(result.confidence * 100)}%</p>
                </div>
              </div>

              {result.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-800">Itens extraidos:</p>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {result.items.map(item => (
                      <div key={item.id} className="flex items-start gap-2 p-2.5 bg-white rounded-lg border border-gray-100 text-xs">
                        <FileText size={14} className="text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{item.description}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {getMatchBadge(item)}
                            <span className="text-gray-500">
                              {item.quantity} {item.unit} x {formatCurrency(item.unit_cost)}
                            </span>
                          </div>
                          {item.match_status === 'matched' && item.price_change_pct !== 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {getPriceChangeIcon(item.price_change_pct)}
                              <span className={`${Math.abs(item.price_change_pct) > 5 ? (item.price_change_pct > 0 ? 'text-red-600' : 'text-green-600') : 'text-gray-500'}`}>
                                {item.price_change_pct > 0 ? '+' : ''}{item.price_change_pct.toFixed(1)}% vs custo atual ({formatCurrency(item.current_avg_cost)})
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-700 shrink-0">{formatCurrency(item.total_cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.proposals_created > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-100 rounded-lg text-xs text-amber-800">
                  <AlertTriangle size={14} />
                  <span>
                    <strong>{result.proposals_created}</strong> proposta(s) de atualizacao de preco aguardando aprovacao do diretor.
                  </span>
                </div>
              )}

              <button
                onClick={() => { setResult(null); fileInputRef.current?.click() }}
                className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 transition-colors"
              >
                <RefreshCw size={12} /> Processar outra cotacao
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
