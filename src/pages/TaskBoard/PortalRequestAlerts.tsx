import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Inbox, ChevronDown, ChevronUp, RefreshCw, CheckCircle2,
  Clock, AlertTriangle, Flag, User, Calendar, ArrowRight,
  MessageSquarePlus, Eye, X
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AssignToTechnicianDrawer } from './AssignToTechnicianDrawer'

interface PortalRequest {
  id: string
  title: string
  description: string
  priority: 'baixa' | 'normal' | 'alta' | 'urgente'
  status: string
  created_at: string
  customer_id: string
  customer_name?: string
  photos?: string[]
  generated_os_id?: string | null
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  baixa:   { label: 'Baixa',   color: 'text-gray-600',   bg: 'bg-gray-50',    border: 'border-gray-200',  dot: 'bg-gray-400' },
  normal:  { label: 'Normal',  color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',  dot: 'bg-blue-500' },
  alta:    { label: 'Alta',    color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-300', dot: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-300',   dot: 'bg-red-500' },
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  aberto:       { label: 'Aberto',       color: 'text-blue-600 bg-blue-50 border-blue-200' },
  em_analise:   { label: 'Em Análise',   color: 'text-amber-600 bg-amber-50 border-amber-200' },
  aprovado:     { label: 'Aprovado',     color: 'text-green-600 bg-green-50 border-green-200' },
  em_andamento: { label: 'Em Andamento', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  concluido:    { label: 'Concluído',    color: 'text-gray-500 bg-gray-50 border-gray-200' },
  cancelado:    { label: 'Cancelado',    color: 'text-red-500 bg-red-50 border-red-200' },
}

function formatRelativeDate(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora mesmo'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  return `${days}d atrás`
}

interface RequestCardProps {
  request: PortalRequest
  onAssign: (request: PortalRequest) => void
  onUpdateStatus: (id: string, status: string) => void
}

function RequestCard({ request, onAssign, onUpdateStatus }: RequestCardProps) {
  const [expanded, setExpanded] = useState(false)
  const pCfg = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.normal
  const sCfg = STATUS_MAP[request.status] || STATUS_MAP.aberto
  const isPending = request.status === 'aberto' || request.status === 'em_analise'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`rounded-xl border-2 ${pCfg.border} bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md`}
    >
      {/* Priority stripe */}
      <div className={`h-1 ${pCfg.dot}`} />

      <div className="p-3">
        {/* Header row */}
        <div className="flex items-start gap-2">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${pCfg.dot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md border ${pCfg.color} ${pCfg.bg} ${pCfg.border}`}>
                {pCfg.label}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${sCfg.color}`}>
                {sCfg.label}
              </span>
              {isPending && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Aguardando
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">{request.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <User className="h-3 w-3" />
                {request.customer_name || 'Cliente'}
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Clock className="h-3 w-3" />
                {formatRelativeDate(request.created_at)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Expanded description */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {request.description && (
                <p className="mt-2 text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-2 border border-gray-100">
                  {request.description}
                </p>
              )}
              {request.photos && request.photos.length > 0 && (
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {request.photos.slice(0, 4).map((ph, i) => (
                    <img
                      key={i}
                      src={ph}
                      alt={`Foto ${i + 1}`}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition"
                      onClick={() => window.open(ph, '_blank')}
                    />
                  ))}
                  {request.photos.length > 4 && (
                    <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-semibold">
                      +{request.photos.length - 4}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-2.5">
          {isPending && (
            <>
              <button
                onClick={() => onAssign(request)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition flex-1 justify-center"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Direcionar para Técnico
              </button>
              <button
                onClick={() => onUpdateStatus(request.id, 'em_analise')}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition"
                title="Marcar como Em Análise"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {request.status === 'em_analise' && (
            <button
              onClick={() => onAssign(request)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition flex-1 justify-center"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Direcionar para Técnico
            </button>
          )}
          {request.generated_os_id && (
            <span className="text-[10px] font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              OS criada
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface PortalRequestAlertsProps {
  onRequestsCountChange?: (count: number) => void
}

export function PortalRequestAlerts({ onRequestsCountChange }: PortalRequestAlertsProps) {
  const [requests, setRequests] = useState<PortalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PortalRequest | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('portal_service_requests')
      .select(`
        id, title, description, priority, status, created_at,
        customer_id, photos, generated_os_id,
        customers!portal_service_requests_customer_id_fkey(name)
      `)
      .in('status', ['aberto', 'em_analise'])
      .order('created_at', { ascending: false })
      .limit(30)

    if (!error && data) {
      const mapped: PortalRequest[] = data.map((r: any) => ({
        ...r,
        customer_name: r.customers?.name || 'Cliente',
      }))
      setRequests(mapped)
      onRequestsCountChange?.(mapped.length)
    }
    setLoading(false)
  }, [onRequestsCountChange])

  useEffect(() => {
    fetchRequests()
    const channel = supabase
      .channel('portal-request-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_service_requests' }, fetchRequests)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchRequests])

  const handleUpdateStatus = useCallback(async (id: string, status: string) => {
    await supabase.from('portal_service_requests').update({ status }).eq('id', id)
    await fetchRequests()
  }, [fetchRequests])

  const pendingCount = requests.filter(r => r.status === 'aberto').length
  const urgentCount  = requests.filter(r => r.priority === 'urgente').length

  if (loading) {
    return (
      <div className="mb-4 bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2 shadow-sm">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        <span className="text-sm text-gray-500">Carregando solicitações do portal...</span>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4">
        {/* Header bar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 shadow-sm transition-all ${
            requests.length > 0
              ? 'bg-white border-amber-300 hover:border-amber-400'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              requests.length > 0 ? 'bg-amber-100' : 'bg-gray-100'
            }`}>
              <Inbox className={`h-4 w-4 ${requests.length > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-800">
                  Solicitações do Portal
                </span>
                {requests.length > 0 && (
                  <span className="text-xs font-bold bg-amber-500 text-white rounded-full px-2 py-0.5">
                    {requests.length}
                  </span>
                )}
                {urgentCount > 0 && (
                  <span className="text-xs font-bold bg-red-500 text-white rounded-full px-2 py-0.5 flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                {requests.length === 0
                  ? 'Nenhuma solicitação pendente'
                  : `${pendingCount} aberta${pendingCount !== 1 ? 's' : ''} · ${requests.length - pendingCount} em análise`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={e => { e.stopPropagation(); fetchRequests() }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              title="Atualizar"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            {collapsed
              ? <ChevronDown className="h-4 w-4 text-gray-500" />
              : <ChevronUp className="h-4 w-4 text-gray-500" />}
          </div>
        </button>

        {/* Cards list */}
        <AnimatePresence>
          {!collapsed && requests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                <AnimatePresence>
                  {requests.map(req => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onAssign={setSelectedRequest}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
          {!collapsed && requests.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-6 text-center"
            >
              <MessageSquarePlus className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">Sem solicitações pendentes</p>
              <p className="text-xs text-gray-400">As solicitações dos clientes via portal aparecem aqui</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Assign drawer */}
      {selectedRequest && (
        <AssignToTechnicianDrawer
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => {
            setSelectedRequest(null)
            fetchRequests()
          }}
        />
      )}
    </>
  )
}
