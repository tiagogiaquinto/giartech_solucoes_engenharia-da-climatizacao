import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  QrCode, Search, Copy, ExternalLink, Link2, CheckCircle2,
  AlertCircle, Loader2, RefreshCw, Scan, X, ChevronRight,
  Clock, User, Package
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface EquipmentWithQR {
  id: string
  name: string
  model?: string
  brand?: string
  serial_number?: string
  location?: string
  qr_code_token?: string
  qr_code_linked_at?: string
  qr_code_linked_by?: string
  customer_name?: string
  customer_id: string
  asset_health?: string
}

const BASE_URL = window.location.origin

export default function QRCodeManager() {
  const [equipments, setEquipments] = useState<EquipmentWithQR[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'linked' | 'unlinked'>('all')
  const [linking, setLinking] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('customer_equipment')
      .select(`
        id, name, model, brand, serial_number, location,
        qr_code_token, qr_code_linked_at, qr_code_linked_by,
        asset_health, customer_id,
        customers!inner(name)
      `)
      .order('name', { ascending: true })

    setEquipments(
      (data || []).map((e: any) => ({
        ...e,
        customer_name: e.customers?.name,
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function copyLink(token: string, id: string) {
    await navigator.clipboard.writeText(`${BASE_URL}/care/${token}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    showToast('Link copiado!')
  }

  async function generateAndLink(equipment: EquipmentWithQR) {
    const token = crypto.randomUUID()
    setLinking(equipment.id)

    const { data, error } = await supabase.rpc('link_qr_code_to_equipment', {
      p_equipment_id: equipment.id,
      p_qr_token: token,
      p_technician_name: null,
      p_os_id: null,
    })

    if (!error && data?.success) {
      showToast(`QR Code gerado para ${equipment.name}!`)
      await load()
    } else {
      showToast(data?.error || 'Erro ao gerar QR Code')
    }
    setLinking(null)
  }

  async function unlinkQR(equipment: EquipmentWithQR) {
    if (!confirm(`Remover QR Code de ${equipment.name}? O link atual deixará de funcionar.`)) return

    await supabase
      .from('customer_equipment')
      .update({ qr_code_token: null, qr_code_linked_at: null, qr_code_linked_by: null })
      .eq('id', equipment.id)

    showToast('QR Code removido')
    await load()
  }

  const filtered = equipments.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || e.name.toLowerCase().includes(q)
      || (e.customer_name || '').toLowerCase().includes(q)
      || (e.model || '').toLowerCase().includes(q)
      || (e.brand || '').toLowerCase().includes(q)

    const matchFilter =
      filter === 'all' ||
      (filter === 'linked' && !!e.qr_code_token) ||
      (filter === 'unlinked' && !e.qr_code_token)

    return matchSearch && matchFilter
  })

  const linkedCount = equipments.filter(e => !!e.qr_code_token).length

  function healthDot(health?: string) {
    if (health === 'critical') return 'bg-red-400'
    if (health === 'warning') return 'bg-yellow-400'
    return 'bg-emerald-400'
  }

  function formatDate(dt?: string) {
    if (!dt) return ''
    return new Date(dt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-4 right-4 z-50 bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg"
        >
          {toast}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            Gerenciamento de QR Codes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Vincule adesivos QR Code aos equipamentos para o portal Giartech Care.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-3 py-2 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Equipamentos', value: equipments.length, color: 'bg-slate-100 text-slate-700' },
          { label: 'Com QR Code', value: linkedCount, color: 'bg-teal-50 text-teal-700' },
          { label: 'Sem QR Code', value: equipments.length - linkedCount, color: 'bg-amber-50 text-amber-700' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl p-4 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium opacity-80 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por equipamento, cliente ou modelo..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['all', 'linked', 'unlinked'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'linked' ? 'Com QR' : 'Sem QR'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Package className="h-12 w-12 text-gray-200 mx-auto" />
          <p className="text-gray-400 text-sm">Nenhum equipamento encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(eq => (
            <motion.div
              key={eq.id}
              layout
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="flex items-center gap-4 p-4">
                {/* Indicador de saúde */}
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${healthDot(eq.asset_health)}`} />

                {/* Info do equipamento */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{eq.name}</p>
                    {eq.qr_code_token && (
                      <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">
                        QR Ativo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {eq.customer_name && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        {eq.customer_name}
                      </span>
                    )}
                    {(eq.brand || eq.model) && (
                      <span className="text-xs text-gray-400">
                        {[eq.brand, eq.model].filter(Boolean).join(' · ')}
                      </span>
                    )}
                    {eq.qr_code_linked_at && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(eq.qr_code_linked_at)}
                        {eq.qr_code_linked_by && ` · ${eq.qr_code_linked_by}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0">
                  {eq.qr_code_token ? (
                    <>
                      <button
                        onClick={() => copyLink(eq.qr_code_token!, eq.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg transition"
                        title="Copiar link"
                      >
                        {copiedId === eq.id ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedId === eq.id ? 'Copiado!' : 'Copiar Link'}
                      </button>
                      <a
                        href={`${BASE_URL}/care/${eq.qr_code_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-50"
                        title="Abrir portal"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => unlinkQR(eq)}
                        className="text-gray-300 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50"
                        title="Remover QR Code"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => generateAndLink(eq)}
                      disabled={linking === eq.id}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition"
                    >
                      {linking === eq.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Scan className="h-3.5 w-3.5" />
                      }
                      Gerar QR Code
                    </button>
                  )}
                </div>
              </div>

              {/* Link expandido quando tem token */}
              {eq.qr_code_token && (
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <Link2 className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-[11px] text-gray-500 font-mono truncate flex-1">
                      {BASE_URL}/care/{eq.qr_code_token}
                    </span>
                    <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Instrução de uso */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <QrCode className="h-4 w-4 text-blue-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-blue-800">Como funciona a adesivagem</p>
            <ol className="text-xs text-blue-700 space-y-0.5 list-decimal list-inside">
              <li>Gere um QR Code para o equipamento (ou use o ID do adesivo físico)</li>
              <li>Copie o link e gere o QR Code em qualquer gerador online</li>
              <li>Imprima o adesivo e cole na máquina ao finalizar a OS</li>
              <li>O cliente escaneia e acessa o portal Giartech Care com histórico completo</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
