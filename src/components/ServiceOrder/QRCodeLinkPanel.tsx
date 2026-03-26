import React, { useState, useEffect } from 'react'
import { QrCode, Link2, CheckCircle2, AlertCircle, Loader2, X, Scan, Copy, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Equipment {
  id: string
  name: string
  model?: string
  brand?: string
  qr_code_token?: string
}

interface QRCodeLinkPanelProps {
  osId: string
  customerId?: string
  technicianName?: string
  onClose?: () => void
}

export function QRCodeLinkPanel({ osId, customerId, technicianName, onClose }: QRCodeLinkPanelProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string>('')
  const [tokenInput, setTokenInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingEquipments, setLoadingEquipments] = useState(true)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  const BASE_URL = window.location.origin

  useEffect(() => {
    if (!customerId) { setLoadingEquipments(false); return }
    supabase
      .from('customer_equipment')
      .select('id, name, model, brand, qr_code_token')
      .eq('customer_id', customerId)
      .then(({ data }) => {
        setEquipments(data || [])
        if (data?.length === 1) setSelectedEquipment(data[0].id)
        setLoadingEquipments(false)
      })
  }, [customerId])

  function generateNewToken() {
    const uuid = crypto.randomUUID()
    setTokenInput(uuid)
  }

  async function handleLink() {
    if (!selectedEquipment || !tokenInput) return
    setLoading(true)
    setResult(null)

    const { data, error } = await supabase.rpc('link_qr_code_to_equipment', {
      p_equipment_id: selectedEquipment,
      p_qr_token: tokenInput,
      p_technician_name: technicianName || null,
      p_os_id: osId || null,
    })

    if (error || !data?.success) {
      setResult({ success: false, message: data?.error || error?.message || 'Erro ao vincular' })
    } else {
      const link = `${BASE_URL}/care/${tokenInput}`
      setGeneratedLink(link)
      setResult({ success: true, message: 'QR Code vinculado com sucesso!' })
      setEquipments(prev =>
        prev.map(e => e.id === selectedEquipment ? { ...e, qr_code_token: tokenInput } : e)
      )
    }
    setLoading(false)
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link)
  }

  const selectedEq = equipments.find(e => e.id === selectedEquipment)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center">
            <QrCode className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Adesivagem de Equipamento</p>
            <p className="text-xs text-slate-400">Vincule o QR Code ao equipamento desta OS</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">

        {loadingEquipments ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : equipments.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
            <p className="text-sm text-gray-600">Nenhum equipamento vinculado a este cliente.</p>
            <p className="text-xs text-gray-400">Cadastre o equipamento no perfil do cliente primeiro.</p>
          </div>
        ) : (
          <>
            {/* Seleção de Equipamento */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Equipamento</label>
              <div className="space-y-2">
                {equipments.map(eq => (
                  <label
                    key={eq.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedEquipment === eq.id
                        ? 'border-teal-400 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="equipment"
                      value={eq.id}
                      checked={selectedEquipment === eq.id}
                      onChange={() => {
                        setSelectedEquipment(eq.id)
                        setResult(null)
                        setGeneratedLink(null)
                        if (eq.qr_code_token) setTokenInput(eq.qr_code_token)
                        else setTokenInput('')
                      }}
                      className="accent-teal-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{eq.name}</p>
                      {(eq.brand || eq.model) && (
                        <p className="text-xs text-gray-500">{[eq.brand, eq.model].filter(Boolean).join(' · ')}</p>
                      )}
                    </div>
                    {eq.qr_code_token && (
                      <span className="text-[10px] bg-teal-100 text-teal-700 font-semibold px-2 py-0.5 rounded-full shrink-0">
                        QR Ativo
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Token do Adesivo */}
            {selectedEquipment && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  ID do Adesivo (Token QR)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    placeholder="Cole aqui o token do adesivo ou gere um novo"
                    className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 font-mono"
                  />
                  <button
                    onClick={generateNewToken}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl transition shrink-0"
                  >
                    <Scan className="h-3.5 w-3.5" />
                    Gerar
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Use o ID impresso no adesivo físico ou gere um novo para imprimir.
                </p>
              </div>
            )}

            {/* Preview do Link */}
            {tokenInput && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 font-semibold mb-1">URL do Portal Care:</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-700 font-mono flex-1 truncate">
                    {BASE_URL}/care/{tokenInput}
                  </p>
                  <button
                    onClick={() => copyLink(`${BASE_URL}/care/${tokenInput}`)}
                    className="text-gray-400 hover:text-gray-600 transition shrink-0"
                    title="Copiar link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Resultado */}
            {result && (
              <div className={`flex items-start gap-2 rounded-xl p-3 ${
                result.success ? 'bg-teal-50 border border-teal-200' : 'bg-red-50 border border-red-200'
              }`}>
                {result.success
                  ? <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                  : <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                }
                <p className={`text-xs font-medium ${result.success ? 'text-teal-700' : 'text-red-700'}`}>
                  {result.message}
                </p>
                {result.success && generatedLink && (
                  <a
                    href={generatedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto shrink-0 text-teal-600 hover:text-teal-800 transition"
                    title="Abrir portal"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Botão de Vincular */}
            <button
              onClick={handleLink}
              disabled={!selectedEquipment || !tokenInput || loading}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Link2 className="h-4 w-4" />
              }
              {loading ? 'Vinculando...' : 'Vincular QR Code ao Equipamento'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
