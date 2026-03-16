import React from 'react'
import {
  FileText, CheckCircle, XCircle, Clock, Wrench, ShoppingCart,
  Calendar, TrendingUp, AlertTriangle, Repeat, ArrowRight, DollarSign
} from 'lucide-react'

interface TimelineEntry {
  service_order_id: string
  order_number: string
  description: string | null
  status: string
  pipeline_stage: string | null
  total_value: number
  scheduled_at: string | null
  completed_at: string | null
  created_at: string
  os_sequence: number
  days_since_previous_os: number | null
  crm_opportunity_title: string | null
  crm_status: string | null
  agenda_event_count: number
  materials_count: number
  purchase_requests_count: number
}

interface RecurrenceData {
  total_os: number
  first_os: string | null
  last_os: string | null
  avg_days_between_services: number
  recurrence_label: string
  next_expected_service: string | null
  most_common_service: string | null
  total_revenue: number
  avg_ticket: number
}

interface CustomerTimelineProps {
  timeline: TimelineEntry[]
  recurrence: RecurrenceData | null
}

const STATUS_STYLES: Record<string, { dot: string; label: string; icon: React.ReactNode }> = {
  aberta: { dot: 'bg-blue-500', label: 'Aberta', icon: <Clock className="h-3.5 w-3.5" /> },
  agendada: { dot: 'bg-amber-400', label: 'Agendada', icon: <Calendar className="h-3.5 w-3.5" /> },
  em_andamento: { dot: 'bg-orange-500', label: 'Em Andamento', icon: <Wrench className="h-3.5 w-3.5" /> },
  concluida: { dot: 'bg-green-500', label: 'Concluída', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  concluido: { dot: 'bg-green-500', label: 'Concluída', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  cancelada: { dot: 'bg-red-400', label: 'Cancelada', icon: <XCircle className="h-3.5 w-3.5" /> },
  cancelado: { dot: 'bg-red-400', label: 'Cancelada', icon: <XCircle className="h-3.5 w-3.5" /> },
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const formatDate = (d: string | null) => {
  if (!d) return null
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatGap = (days: number | null) => {
  if (!days || days <= 0) return null
  if (days < 7) return `${Math.round(days)} dias`
  if (days < 30) return `${Math.round(days / 7)} sem.`
  if (days < 365) return `${Math.round(days / 30)} mes.`
  return `${(days / 365).toFixed(1)} anos`
}

export const CustomerTimeline: React.FC<CustomerTimelineProps> = ({ timeline, recurrence }) => {
  const entries = timeline || []

  return (
    <div className="space-y-6">
      {/* Recurrence Card */}
      {recurrence && recurrence.total_os > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Frequência</span>
            </div>
            <p className="text-xl font-bold text-blue-800">{recurrence.recurrence_label}</p>
            {recurrence.avg_days_between_services > 0 && (
              <p className="text-xs text-blue-500 mt-0.5">
                Média de {Math.round(recurrence.avg_days_between_services)} dias entre OS
              </p>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Receita Total</span>
            </div>
            <p className="text-xl font-bold text-green-800">{formatCurrency(recurrence.total_revenue)}</p>
            <p className="text-xs text-green-500 mt-0.5">Ticket médio: {formatCurrency(recurrence.avg_ticket)}</p>
          </div>

          {recurrence.next_expected_service && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Próx. Serviço</span>
              </div>
              <p className="text-lg font-bold text-amber-800">{formatDate(recurrence.next_expected_service)}</p>
              <p className="text-xs text-amber-500 mt-0.5">Estimativa baseada no histórico</p>
            </div>
          )}

          {recurrence.most_common_service && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Mais Solicitado</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 line-clamp-2">{recurrence.most_common_service}</p>
            </div>
          )}
        </div>
      )}

      {/* Alert: client due for service */}
      {recurrence?.next_expected_service && new Date(recurrence.next_expected_service) <= new Date() && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Cliente pode precisar de atendimento</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Com base no histórico ({recurrence.recurrence_label}), o próximo serviço era esperado em {formatDate(recurrence.next_expected_service)}.
            </p>
          </div>
        </div>
      )}

      {/* Timeline entries */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Nenhum histórico encontrado</p>
          <p className="text-sm mt-1">As OS deste cliente aparecerão aqui</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-0">
            {entries.map((entry, idx) => {
              const style = STATUS_STYLES[entry.status] || STATUS_STYLES['aberta']
              const isLast = idx === entries.length - 1
              const displayDate = entry.completed_at || entry.scheduled_at || entry.created_at

              return (
                <div key={entry.service_order_id} className="relative pl-12">
                  {/* Timeline dot */}
                  <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full ${style.dot} border-2 border-white shadow`} />

                  {/* Gap indicator between entries */}
                  {entry.days_since_previous_os && entry.days_since_previous_os > 0 && (
                    <div className="flex items-center gap-1 mb-2 text-xs text-gray-400">
                      <ArrowRight className="h-3 w-3" />
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        {formatGap(entry.days_since_previous_os)} depois
                      </span>
                    </div>
                  )}

                  {/* Entry card */}
                  <div className={`mb-4 bg-white rounded-xl border shadow-sm p-4 ${isLast ? '' : ''}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-500">
                            #{entry.os_sequence}
                          </span>
                          <span className="font-semibold text-gray-800 text-sm">
                            {entry.order_number}
                          </span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.status.includes('conclu') ? 'bg-green-100 text-green-700' :
                            entry.status.includes('cancel') ? 'bg-red-100 text-red-700' :
                            entry.status === 'em_andamento' ? 'bg-orange-100 text-orange-700' :
                            entry.status === 'agendada' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {style.icon} {style.label}
                          </span>
                        </div>

                        {entry.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{entry.description}</p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                          {displayDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(displayDate)}
                            </span>
                          )}
                          {entry.materials_count > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {entry.materials_count} materiais
                            </span>
                          )}
                          {entry.purchase_requests_count > 0 && (
                            <span className="flex items-center gap-1 text-amber-500">
                              <ShoppingCart className="h-3 w-3" />
                              {entry.purchase_requests_count} req. compra
                            </span>
                          )}
                          {entry.crm_opportunity_title && (
                            <span className="flex items-center gap-1 text-blue-500">
                              <TrendingUp className="h-3 w-3" />
                              CRM vinculado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900">{formatCurrency(entry.total_value)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
