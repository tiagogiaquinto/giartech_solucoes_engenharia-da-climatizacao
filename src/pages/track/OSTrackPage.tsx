import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  CheckCircle, Clock, Wrench, FileText, AlertTriangle,
  Loader2, MessageCircle, ThumbsUp, ChevronRight, MapPin,
  CalendarDays, RefreshCw, Phone
} from 'lucide-react'

interface OSTrackData {
  found: boolean
  order_number?: string
  client_name?: string
  service_type?: string
  description?: string
  status?: string
  priority?: string
  service_date?: string
  due_date?: string
  completed_at?: string
  created_at?: string
  updated_at?: string
  notes?: string
  estimated_value?: number | null
  total_value?: number | null
  items?: Array<{ service_name: string; quantity: number; unit: string }>
  approved_at?: string | null
}

const COMPANY_NAME = 'Giartech Soluções'
const COMPANY_PHONE = '5511555525600'

type StepKey = 'criada' | 'orcamento' | 'execucao' | 'aguardando' | 'concluida'

interface Step {
  key: StepKey
  label: string
  icon: React.ReactNode
  statuses: string[]
}

const STEPS: Step[] = [
  {
    key: 'criada',
    label: 'OS Criada',
    icon: <FileText className="h-4 w-4" />,
    statuses: ['pending', 'pendente']
  },
  {
    key: 'orcamento',
    label: 'Em Orçamento',
    icon: <FileText className="h-4 w-4" />,
    statuses: ['orcamento', 'budget', 'cotacao', 'quote']
  },
  {
    key: 'execucao',
    label: 'Em Execução',
    icon: <Wrench className="h-4 w-4" />,
    statuses: ['in_progress', 'em_andamento', 'em_execucao']
  },
  {
    key: 'aguardando',
    label: 'Aguardando Peças',
    icon: <Clock className="h-4 w-4" />,
    statuses: ['aguardando_pecas', 'on_hold', 'pausado']
  },
  {
    key: 'concluida',
    label: 'Concluída',
    icon: <CheckCircle className="h-4 w-4" />,
    statuses: ['concluido', 'concluida', 'completed']
  }
]

function getActiveStep(status?: string): number {
  if (!status) return 0
  const norm = status.toLowerCase()

  if (['concluido', 'concluida', 'completed'].includes(norm)) return 4
  if (['in_progress', 'em_andamento', 'em_execucao'].includes(norm)) return 2
  if (['aguardando_pecas', 'on_hold', 'pausado'].includes(norm)) return 3
  if (['orcamento', 'budget', 'cotacao', 'quote'].includes(norm)) return 1
  return 0
}

function isOrcamento(status?: string): boolean {
  return ['orcamento', 'budget', 'cotacao', 'quote'].includes((status || '').toLowerCase())
}

function isConcluida(status?: string): boolean {
  return ['concluido', 'concluida', 'completed'].includes((status || '').toLowerCase())
}

function isCancelada(status?: string): boolean {
  return ['cancelado', 'cancelled', 'canceled'].includes((status || '').toLowerCase())
}

function formatDate(d?: string | null): string {
  if (!d) return 'N/D'
  const date = new Date(d)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(d?: string | null): string {
  if (!d) return 'N/D'
  const date = new Date(d)
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function maskClientName(name?: string): string {
  if (!name) return 'Cliente'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

function formatCurrency(val?: number | null): string {
  if (val === null || val === undefined) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function statusLabel(status?: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente', pendente: 'Pendente',
    in_progress: 'Em Andamento', em_andamento: 'Em Andamento',
    orcamento: 'Aguardando Aprovação', budget: 'Aguardando Aprovação',
    cotacao: 'Em Cotação', quote: 'Em Cotação',
    aguardando_pecas: 'Aguardando Peças',
    on_hold: 'Pausado', pausado: 'Pausado',
    concluido: 'Concluído', concluida: 'Concluída', completed: 'Concluído',
    cancelado: 'Cancelado', cancelled: 'Cancelado'
  }
  return map[(status || '').toLowerCase()] || status || 'Em Atendimento'
}

export default function OSTrackPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<OSTrackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [approvingBudget, setApprovingBudget] = useState(false)
  const [budgetApproved, setBudgetApproved] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (silent = false) => {
    if (!token) { setLoading(false); return }
    if (!silent) setLoading(true)
    else setRefreshing(true)

    const { data: result } = await supabase.rpc('get_os_tracking_public', { p_token: token })
    setData(result as OSTrackData || { found: false })

    if (!silent) setLoading(false)
    else setRefreshing(false)
  }

  useEffect(() => { load() }, [token])

  const handleApproveBudget = async () => {
    if (!token || !data?.found) return
    setApprovingBudget(true)
    try {
      const { data: osRow } = await supabase
        .from('service_orders')
        .select('id, order_number')
        .eq('track_token', token)
        .maybeSingle()

      if (osRow) {
        await supabase
          .from('service_orders')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', osRow.id)

        await supabase.from('system_events').insert({
          event_type: 'ORCAMENTO_APROVADO',
          payload: {
            os_id: osRow.id,
            order_number: osRow.order_number,
            aprovado_via: 'track_page',
            aprovado_em: new Date().toISOString()
          }
        })

        setBudgetApproved(true)
        setTimeout(() => load(true), 1500)
      }
    } catch {
      // silently fail
    }
    setApprovingBudget(false)
  }

  const openWhatsApp = () => {
    const msg = encodeURIComponent(
      `Olá, estou consultando a OS *#${data?.order_number || ''}* e gostaria de falar com um atendente.`
    )
    window.open(`https://wa.me/${COMPANY_PHONE}?text=${msg}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F567D] to-[#0a3d5a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-white animate-spin mx-auto" />
          <p className="text-blue-200 text-sm">Carregando sua OS...</p>
        </div>
      </div>
    )
  }

  if (!data || !data.found) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F567D] to-[#0a3d5a] flex items-center justify-center p-5">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-10 w-10 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">OS não encontrada</h1>
            <p className="text-blue-200 text-sm mt-2">
              Este link de rastreio não corresponde a nenhuma Ordem de Serviço ativa.
            </p>
          </div>
          <button
            onClick={openWhatsApp}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-2xl transition-colors shadow-lg"
          >
            <MessageCircle className="h-5 w-5" />
            Falar com a {COMPANY_NAME}
          </button>
        </div>
      </div>
    )
  }

  const activeStep = getActiveStep(data.status)
  const cancelled = isCancelada(data.status)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0F567D] to-[#0c4a6e] px-5 pt-10 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <span className="text-white/80 text-sm font-semibold">{COMPANY_NAME}</span>
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          <div className="mb-1">
            <span className="text-blue-200 text-xs font-semibold uppercase tracking-widest">
              Acompanhamento de Serviço
            </span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">
            OS #{data.order_number}
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Olá, {maskClientName(data.client_name)}
          </p>

          {/* Status badge */}
          {cancelled ? (
            <div className="mt-4 inline-flex items-center gap-2 bg-red-500/20 border border-red-400/40 text-red-200 text-sm font-semibold px-4 py-2 rounded-full">
              <AlertTriangle className="h-4 w-4" />
              Cancelada
            </div>
          ) : (
            <div className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full ${
              isConcluida(data.status)
                ? 'bg-green-500/20 border border-green-400/40 text-green-200'
                : 'bg-white/15 border border-white/25 text-white'
            }`}>
              {isConcluida(data.status)
                ? <CheckCircle className="h-4 w-4" />
                : <Clock className="h-4 w-4 animate-pulse" />
              }
              {statusLabel(data.status)}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 pb-32 max-w-lg mx-auto w-full space-y-4">

        {/* Stepper */}
        {!cancelled && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Progresso do Serviço
            </h2>
            <div className="space-y-0">
              {STEPS.filter(s => {
                if (s.key === 'aguardando') {
                  return ['aguardando_pecas', 'on_hold', 'pausado'].includes((data.status || '').toLowerCase())
                }
                if (s.key === 'orcamento') {
                  return ['orcamento', 'budget', 'cotacao', 'quote'].includes((data.status || '').toLowerCase())
                    || activeStep > 1
                }
                return true
              }).map((step, idx, arr) => {
                const stepIndex = STEPS.findIndex(s => s.key === step.key)
                const done = stepIndex < activeStep
                const current = stepIndex === activeStep
                const isLast = idx === arr.length - 1

                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                        done
                          ? 'bg-[#0F567D] text-white'
                          : current
                          ? 'bg-[#0F567D] text-white ring-4 ring-[#0F567D]/20'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {done ? <CheckCircle className="h-4 w-4" /> : step.icon}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-8 mt-0.5 transition-colors ${
                          done ? 'bg-[#0F567D]' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                    <div className="pt-1 pb-8 min-w-0">
                      <p className={`text-sm font-semibold ${
                        done ? 'text-[#0F567D]' : current ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {current && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Última atualização: {formatDateTime(data.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Aprovação de Orçamento CTA */}
        {isOrcamento(data.status) && !budgetApproved && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Orçamento Disponível</h3>
                <p className="text-gray-600 text-xs mt-0.5">
                  O orçamento para o seu serviço está pronto. Aprove para darmos início à execução.
                </p>
              </div>
            </div>
            {data.estimated_value && (
              <div className="bg-white rounded-xl p-3 mb-4 border border-amber-200">
                <p className="text-xs text-gray-500 font-medium">Valor estimado</p>
                <p className="text-2xl font-black text-gray-900">
                  {formatCurrency(data.estimated_value)}
                </p>
              </div>
            )}
            <button
              onClick={handleApproveBudget}
              disabled={approvingBudget}
              className="w-full flex items-center justify-center gap-2 bg-[#0F567D] hover:bg-[#0c4a6e] active:scale-95 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-60"
            >
              {approvingBudget
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <ThumbsUp className="h-5 w-5" />
              }
              {approvingBudget ? 'Processando...' : 'Aprovar Orçamento'}
            </button>
          </div>
        )}

        {budgetApproved && (
          <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-5 shadow-sm text-center">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <h3 className="font-bold text-green-800 text-sm">Orçamento Aprovado!</h3>
            <p className="text-green-700 text-xs mt-1">
              Sua aprovação foi registrada. Entraremos em contato em breve para agendar a execução.
            </p>
          </div>
        )}

        {/* Detalhes do Serviço */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Detalhes do Serviço
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Wrench className="h-4 w-4 text-[#0F567D]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Tipo de Serviço</p>
                <p className="text-sm font-semibold text-gray-900">{data.service_type}</p>
              </div>
            </div>

            {data.description && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-[#0F567D]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Descrição</p>
                  <p className="text-sm text-gray-700">{data.description}</p>
                </div>
              </div>
            )}

            {data.service_date && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-[#0F567D]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Data do Serviço</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(data.service_date)}</p>
                </div>
              </div>
            )}

            {data.due_date && !isConcluida(data.status) && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Prazo Previsto</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(data.due_date)}</p>
                </div>
              </div>
            )}

            {isConcluida(data.status) && data.completed_at && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Concluída em</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDateTime(data.completed_at)}</p>
                </div>
              </div>
            )}

            {isConcluida(data.status) && data.total_value && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                  <ChevronRight className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Valor Total</p>
                  <p className="text-sm font-bold text-green-700">{formatCurrency(data.total_value)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Serviços realizados */}
        {data.items && data.items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Serviços / Itens
            </h2>
            <div className="space-y-2">
              {data.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm text-gray-700 font-medium">{item.service_name}</p>
                  <span className="text-xs text-gray-400 ml-3 shrink-0">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notas ao cliente */}
        {data.notes && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-[#0F567D] uppercase tracking-widest mb-1">Observação</p>
            <p className="text-sm text-blue-900">{data.notes}</p>
          </div>
        )}

        {/* Rodapé */}
        <div className="text-center py-2">
          <p className="text-gray-400 text-xs">
            OS aberta em {formatDate(data.created_at)}<br />
            <span className="text-gray-500 font-medium">{COMPANY_NAME}</span>
          </p>
        </div>
      </div>

      {/* Botão flutuante WhatsApp */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <button
            onClick={openWhatsApp}
            className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-2xl shadow-green-900/20 text-base"
          >
            <MessageCircle className="h-6 w-6" />
            Falar com Atendente
          </button>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Phone className="h-3 w-3 text-gray-400" />
            <p className="text-gray-400 text-xs text-center">
              Atendimento via WhatsApp · Resposta em minutos
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
