import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, CheckCircle2, Clock, AlertCircle, Calendar,
  Shield, ShieldAlert, ShieldOff, MapPin, Wrench, RefreshCw,
  User, FileText, Package, X, ChevronRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'

interface ServiceItem {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  completed: boolean
  completed_at: string | null
  warranty_info: string
}

interface HistoryEntry {
  os_id: string
  order_number: string
  title: string
  service_type: string
  status: string
  created_at: string
  scheduled_at: string | null
  completed_at: string | null
  technician_name: string
  total_value: number
  warranty_period: number | null
  warranty_type: string
  warranty_end_date: string | null
  warranty_status: string
  relatorio_tecnico: string
  services_performed: ServiceItem[]
  address_label: string
  address_full: string
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  aberto:       { label: 'Aberto',       color: 'bg-blue-100 text-blue-700',     icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  concluido:    { label: 'Concluído',    color: 'bg-green-100 text-green-700',   icon: CheckCircle2 },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-100 text-red-700',       icon: AlertCircle },
  aguardando:   { label: 'Aguardando',   color: 'bg-gray-100 text-gray-600',     icon: Clock },
  pausado:      { label: 'Pausado',      color: 'bg-orange-100 text-orange-700', icon: Clock },
}

const WARRANTY_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  vigente:      { label: 'Garantia vigente',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: Shield },
  vencendo:     { label: 'Vencendo em breve', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: ShieldAlert },
  vencida:      { label: 'Garantia vencida',  color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       icon: ShieldOff },
  sem_garantia: { label: 'Sem garantia',      color: 'text-gray-400',   bg: 'bg-gray-50 border-gray-200',     icon: ShieldOff },
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function WarrantyBadge({ status, endDate }: { status: string; endDate: string | null }) {
  const info = WARRANTY_MAP[status] || WARRANTY_MAP.sem_garantia
  const Icon = info.icon
  if (status === 'sem_garantia') return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-semibold ${info.bg} ${info.color}`}>
      <Icon size={11} />
      {info.label}
      {endDate && ` até ${formatDate(endDate)}`}
    </span>
  )
}

interface OSDetailModalProps {
  entry: HistoryEntry
  onClose: () => void
}

function OSDetailModal({ entry, onClose }: OSDetailModalProps) {
  const status = STATUS_MAP[entry.status] || STATUS_MAP.aberto
  const StatusIcon = status.icon
  const warranty = WARRANTY_MAP[entry.warranty_status] || WARRANTY_MAP.sem_garantia
  const WarrantyIcon = warranty.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-gray-400">{entry.order_number}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                <StatusIcon size={10} />
                {status.label}
              </span>
              <WarrantyBadge status={entry.warranty_status} endDate={entry.warranty_end_date} />
            </div>
            <p className="font-bold text-gray-900 text-base leading-snug">{entry.title}</p>
            {entry.service_type && (
              <p className="text-xs text-gray-500 mt-0.5">{entry.service_type}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Data de abertura</p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(entry.created_at)}</p>
            </div>
            {entry.completed_at && (
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Concluído em</p>
                <p className="text-sm font-semibold text-green-700">{formatDate(entry.completed_at)}</p>
              </div>
            )}
            {entry.technician_name && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Técnico responsável</p>
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <User size={13} className="text-gray-400" /> {entry.technician_name}
                </p>
              </div>
            )}
            {entry.total_value > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Valor total</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(entry.total_value)}</p>
              </div>
            )}
          </div>

          {entry.address_full && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <MapPin size={12} /> Local do serviço
              </p>
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
                <MapPin size={15} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  {entry.address_label && (
                    <p className="text-xs font-semibold text-gray-500 mb-0.5">{entry.address_label}</p>
                  )}
                  <p className="text-sm text-gray-700">{entry.address_full}</p>
                </div>
              </div>
            </div>
          )}

          {entry.services_performed?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Wrench size={12} /> Serviços realizados ({entry.services_performed.length})
              </p>
              <div className="space-y-2">
                {entry.services_performed.map((svc, i) => (
                  <div key={svc.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${svc.completed ? 'bg-green-100' : 'bg-gray-200'}`}>
                      {svc.completed
                        ? <CheckCircle2 size={12} className="text-green-600" />
                        : <Clock size={12} className="text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{svc.name}</p>
                      {svc.description && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{svc.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                        {svc.quantity > 1 && <span>{svc.quantity}{svc.unit ? ` ${svc.unit}` : ''}</span>}
                        {svc.completed_at && (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 size={10} /> {formatDate(svc.completed_at)}
                          </span>
                        )}
                        {svc.warranty_info && (
                          <span className="text-blue-600 flex items-center gap-1">
                            <Shield size={10} /> {svc.warranty_info}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(entry.warranty_period || entry.warranty_end_date) && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Shield size={12} /> Garantia do serviço
              </p>
              <div className={`p-4 rounded-xl border ${warranty.bg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <WarrantyIcon size={16} className={warranty.color} />
                  <span className={`text-sm font-bold ${warranty.color}`}>{warranty.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {entry.warranty_period && (
                    <div>
                      <p className="text-xs text-gray-500">Prazo</p>
                      <p className="font-semibold text-gray-800">{entry.warranty_period} {entry.warranty_type || 'dias'}</p>
                    </div>
                  )}
                  {entry.warranty_end_date && (
                    <div>
                      <p className="text-xs text-gray-500">Válida até</p>
                      <p className="font-semibold text-gray-800">{formatDate(entry.warranty_end_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {entry.relatorio_tecnico && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <FileText size={12} /> Relatório técnico
              </p>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{entry.relatorio_tecnico}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function CustomerPortalHistory() {
  const { portalUser } = usePortal()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | 'concluido' | 'em_andamento'>('todos')
  const [selected, setSelected] = useState<HistoryEntry | null>(null)

  useEffect(() => {
    if (portalUser?.linked_customer_id) loadHistory()
  }, [portalUser])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_customer_portal_history', {
        p_customer_id: portalUser!.linked_customer_id
      })
      if (!error && data) setHistory(data)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'todos'
    ? history
    : history.filter(h => h.status === filter)

  const warrantyActive = history.filter(h => h.warranty_status === 'vigente').length
  const warrantyExpiring = history.filter(h => h.warranty_status === 'vencendo').length
  const completed = history.filter(h => h.status === 'concluido').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Manutenções</h1>
          <p className="text-gray-500 text-sm mt-1">Serviços realizados, garantias e relatórios técnicos</p>
        </div>
        <button onClick={loadHistory} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Concluídos', value: completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Garantias ativas', value: warrantyActive, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Vencendo em breve', value: warrantyExpiring, icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={`${s.bg} rounded-2xl p-4`}>
              <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center mb-2 shadow-sm">
                <Icon size={17} className={s.color} />
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 leading-tight mt-0.5">{s.label}</p>
            </div>
          )
        })}
      </div>

      {warrantyExpiring > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3">
          <ShieldAlert size={20} className="text-orange-600 shrink-0" />
          <p className="text-sm text-orange-800">
            <strong>{warrantyExpiring} garantia{warrantyExpiring > 1 ? 's' : ''}</strong> vence{warrantyExpiring > 1 ? 'm' : ''} nos próximos 30 dias.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {(['todos', 'concluido', 'em_andamento'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'todos' ? 'Todos' : f === 'concluido' ? 'Concluídos' : 'Em andamento'}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${filter === f ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
              {f === 'todos' ? history.length : history.filter(h => h.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Package size={44} className="mx-auto mb-3 opacity-25" />
          <p className="font-medium text-gray-500">Nenhum serviço encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => {
            const status = STATUS_MAP[entry.status] || STATUS_MAP.aberto
            const StatusIcon = status.icon
            return (
              <motion.button
                key={entry.os_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(entry)}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-gray-400">{entry.order_number}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                        <StatusIcon size={10} />
                        {status.label}
                      </span>
                      <WarrantyBadge status={entry.warranty_status} endDate={entry.warranty_end_date} />
                    </div>
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{entry.title}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(entry.created_at)}</span>
                      {entry.completed_at && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 size={11} /> {formatDate(entry.completed_at)}
                        </span>
                      )}
                      {entry.technician_name && (
                        <span className="flex items-center gap-1"><User size={11} /> {entry.technician_name}</span>
                      )}
                      {entry.total_value > 0 && (
                        <span className="font-semibold text-gray-600">{formatCurrency(entry.total_value)}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <OSDetailModal entry={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
