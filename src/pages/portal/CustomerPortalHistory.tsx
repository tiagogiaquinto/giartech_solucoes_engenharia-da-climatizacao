import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, CheckCircle2, Clock, AlertCircle, Calendar,
  Shield, ShieldAlert, ShieldOff, ChevronDown, ChevronUp,
  MapPin, Wrench, RefreshCw, User, FileText, Package
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
  aberto:       { label: 'Aberto',       color: 'bg-blue-100 text-blue-700',   icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  concluido:    { label: 'Concluído',    color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-100 text-red-700',     icon: AlertCircle },
  aguardando:   { label: 'Aguardando',   color: 'bg-gray-100 text-gray-600',   icon: Clock },
  pausado:      { label: 'Pausado',      color: 'bg-orange-100 text-orange-700', icon: Clock },
}

const WARRANTY_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  vigente:     { label: 'Garantia vigente',   color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: Shield },
  vencendo:    { label: 'Garantia vencendo',  color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: ShieldAlert },
  vencida:     { label: 'Garantia vencida',   color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       icon: ShieldOff },
  sem_garantia:{ label: 'Sem garantia',       color: 'text-gray-400',   bg: 'bg-gray-50 border-gray-200',     icon: ShieldOff },
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function WarrantyBadge({ status, endDate }: { status: string; endDate: string | null }) {
  const info = WARRANTY_MAP[status] || WARRANTY_MAP.sem_garantia
  const Icon = info.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${info.bg} ${info.color}`}>
      <Icon size={12} />
      {info.label}
      {endDate && status !== 'sem_garantia' && ` até ${formatDate(endDate)}`}
    </span>
  )
}

function OSCard({ entry }: { entry: HistoryEntry }) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_MAP[entry.status] || STATUS_MAP.aberto
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-gray-400">{entry.order_number}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                <StatusIcon size={10} />
                {status.label}
              </span>
              <WarrantyBadge status={entry.warranty_status} endDate={entry.warranty_end_date} />
            </div>
            <p className="font-semibold text-gray-900">{entry.title}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {formatDate(entry.created_at)}
              </span>
              {entry.completed_at && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 size={11} /> Concluído em {formatDate(entry.completed_at)}
                </span>
              )}
              {entry.technician_name && (
                <span className="flex items-center gap-1">
                  <User size={11} /> {entry.technician_name}
                </span>
              )}
              {entry.address_full && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {entry.address_label || entry.address_full}
                </span>
              )}
              {entry.total_value > 0 && (
                <span className="font-semibold text-gray-600">{formatCurrency(entry.total_value)}</span>
              )}
            </div>
          </div>
          <div className="shrink-0 mt-1">
            {expanded
              ? <ChevronUp size={18} className="text-gray-400" />
              : <ChevronDown size={18} className="text-gray-400" />
            }
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-6 py-5 space-y-5">

              {entry.services_performed.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Wrench size={13} /> Serviços realizados
                  </h4>
                  <div className="space-y-2">
                    {entry.services_performed.map((svc, i) => (
                      <div key={svc.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${svc.completed ? 'bg-green-100' : 'bg-gray-200'}`}>
                          {svc.completed
                            ? <CheckCircle2 size={12} className="text-green-600" />
                            : <Clock size={12} className="text-gray-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{svc.name}</p>
                          {svc.description && (
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{svc.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            {svc.quantity > 1 && (
                              <span>{svc.quantity}{svc.unit ? ` ${svc.unit}` : ''}</span>
                            )}
                            {svc.completed_at && (
                              <span className="text-green-600">Concluído em {formatDate(svc.completed_at)}</span>
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

              {(entry.warranty_period || entry.warranty_end_date || entry.warranty_type) && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Shield size={13} /> Garantia do serviço
                  </h4>
                  <div className={`p-4 rounded-xl border ${WARRANTY_MAP[entry.warranty_status]?.bg || 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <WarrantyBadge status={entry.warranty_status} endDate={entry.warranty_end_date} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
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

              {entry.address_full && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <MapPin size={13} /> Local do serviço
                  </h4>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50">
                    <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      {entry.address_label && (
                        <p className="text-xs font-semibold text-gray-500">{entry.address_label}</p>
                      )}
                      <p className="text-sm text-gray-700">{entry.address_full}</p>
                    </div>
                  </div>
                </div>
              )}

              {entry.relatorio_tecnico && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <FileText size={13} /> Relatório técnico
                  </h4>
                  <div className="p-3 rounded-xl bg-gray-50">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {entry.relatorio_tecnico}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function CustomerPortalHistory() {
  const { portalUser } = usePortal()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | 'concluido' | 'em_andamento'>('todos')

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
          <p className="text-gray-500 text-sm mt-1">Todos os serviços realizados, garantias e relatórios</p>
        </div>
        <button
          onClick={loadHistory}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Serviços concluídos', value: completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Garantias ativas', value: warrantyActive, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Garantias vencendo', value: warrantyExpiring, icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-100' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          )
        })}
      </div>

      {warrantyExpiring > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3">
          <ShieldAlert size={20} className="text-orange-600 shrink-0" />
          <p className="text-sm text-orange-800">
            <strong>{warrantyExpiring} garantia{warrantyExpiring > 1 ? 's' : ''}</strong> vencem nos próximos 30 dias. Fique atento para acionar o suporte se necessário.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {(['todos', 'concluido', 'em_andamento'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'todos' ? 'Todos' : f === 'concluido' ? 'Concluídos' : 'Em andamento'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package size={44} className="mx-auto mb-3 opacity-25" />
          <p className="font-medium">Nenhum serviço encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <OSCard key={entry.os_id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
