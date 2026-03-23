import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, ChevronRight, Bell, AlertTriangle, DollarSign, Clock } from 'lucide-react'
import { Task } from './types'
import { supabase } from '../../lib/supabase'

interface Insight {
  id: string
  type: 'blocked' | 'overdue' | 'billing' | 'summary'
  severity: 'critical' | 'warning' | 'info'
  message: string
  taskId?: string
  taskTitle?: string
  osNumber?: string
  action?: string
}

interface UnbilledOS {
  id: string
  order_number: string
  client_name: string
  completed_at: string
  actual_value?: number
}

function buildTaskInsights(tasks: Task[]): Insight[] {
  const insights: Insight[] = []

  const blockedOld = tasks.filter(t => {
    if (t.column_id !== 'blocked' || !t.blocked_since) return false
    const hours = (Date.now() - new Date(t.blocked_since).getTime()) / 3600000
    return hours >= 48
  })

  blockedOld.forEach(t => {
    const days = Math.floor((Date.now() - new Date(t.blocked_since!).getTime()) / 86400000)
    if (!t.thomaz_notified) {
      insights.push({
        id: `blocked_${t.id}`,
        type: 'blocked',
        severity: 'warning',
        message: `A tarefa "${t.title}" está bloqueada há ${days} dia${days > 1 ? 's' : ''}. Quer que eu notifique o responsável${t.assignee_name ? ` (${t.assignee_name})` : ''}?`,
        taskId: t.id,
        taskTitle: t.title,
        action: 'notificar',
      })
    }
  })

  const today = new Date().toDateString()
  const overdueToday = tasks.filter(t => {
    if (!t.due_date || t.column_id === 'done') return false
    return new Date(t.due_date + 'T12:00:00').toDateString() === today
  })

  if (overdueToday.length > 0) {
    const urgentFirst = [...overdueToday].sort((a, b) => {
      const order = { urgent: 0, high: 1, normal: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    })
    insights.push({
      id: 'overdue_today',
      type: 'overdue',
      severity: 'warning',
      message: `Você tem ${overdueToday.length} tarefa${overdueToday.length > 1 ? 's' : ''} vencendo hoje. Recomendo focar na de maior prioridade: "${urgentFirst[0].title}".`,
      taskId: urgentFirst[0].id,
      taskTitle: urgentFirst[0].title,
      action: 'abrir',
    })
  }

  return insights
}

const SEVERITY_STYLES: Record<Insight['severity'], { bg: string; border: string; dot: string; iconBg: string }> = {
  critical: {
    bg: 'bg-gradient-to-r from-red-50 to-orange-50',
    border: 'border-red-300',
    dot: 'bg-red-500',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-700',
  },
  warning: {
    bg: 'bg-gradient-to-r from-blue-50 to-slate-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-700',
  },
  info: {
    bg: 'bg-gradient-to-r from-slate-50 to-gray-50',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
    iconBg: 'bg-gradient-to-br from-gray-500 to-gray-700',
  },
}

interface Props {
  tasks: Task[]
  onOpenTask: (id: string) => void
  onUpdateTask: (id: string, payload: Partial<Task>) => void
}

export function ThomazTaskManager({ tasks, onOpenTask, onUpdateTask }: Props) {
  const [taskInsights, setTaskInsights] = useState<Insight[]>([])
  const [billingInsights, setBillingInsights] = useState<Insight[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [notifying, setNotifying] = useState<string | null>(null)
  const [criticalOpen, setCriticalOpen] = useState(false)
  const [criticalInsight, setCriticalInsight] = useState<Insight | null>(null)

  useEffect(() => {
    const fresh = buildTaskInsights(tasks).filter(i => !dismissed.has(i.id))
    setTaskInsights(fresh)
  }, [tasks, dismissed])

  useEffect(() => {
    const fetchUnbilled = async () => {
      const cutoff = new Date(Date.now() - 48 * 3600000).toISOString()
      const { data } = await supabase
        .from('service_orders')
        .select('id, order_number, client_name, completed_at, actual_value')
        .eq('status', 'completed')
        .lt('completed_at', cutoff)
        .is('invoice_issued', null)
        .order('completed_at', { ascending: true })
        .limit(5)

      if (data && data.length > 0) {
        const newInsights: Insight[] = data.map((os: UnbilledOS) => {
          const hoursAgo = Math.floor((Date.now() - new Date(os.completed_at).getTime()) / 3600000)
          const daysAgo = Math.floor(hoursAgo / 24)
          const timeLabel = daysAgo >= 1 ? `${daysAgo} dia${daysAgo > 1 ? 's' : ''}` : `${hoursAgo}h`
          const valueLabel = os.actual_value
            ? ` (R$ ${Number(os.actual_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
            : ''

          return {
            id: `billing_${os.id}`,
            type: 'billing' as const,
            severity: 'critical' as const,
            message: `A OS ${os.order_number} (${os.client_name}) foi finalizada há ${timeLabel} e o faturamento ainda não foi iniciado${valueLabel}. O atraso no envio do boleto pode afetar o fluxo de caixa.`,
            osNumber: os.order_number,
            action: 'faturar',
          }
        })

        const fresh = newInsights.filter(i => !dismissed.has(i.id))
        setBillingInsights(fresh)

        if (fresh.length > 0 && !dismissed.has(fresh[0].id)) {
          setCriticalInsight(fresh[0])
          setCriticalOpen(true)
        }
      }
    }

    fetchUnbilled()
    const interval = setInterval(fetchUnbilled, 5 * 60000)
    return () => clearInterval(interval)
  }, [dismissed])

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]))
    if (criticalInsight?.id === id) setCriticalOpen(false)
  }, [criticalInsight])

  const handleNotify = useCallback(async (insight: Insight) => {
    if (!insight.taskId) return
    setNotifying(insight.taskId)

    await supabase
      .from('project_task_comments')
      .insert({
        task_id: insight.taskId,
        author_name: 'Thomaz AI',
        body: 'Olá! Identifiquei que esta tarefa está bloqueada há mais de 48 horas. Por favor, atualize o status ou adicione um comentário explicando o bloqueio para que possamos agir.',
        is_thomaz: true,
      })

    await supabase
      .from('project_tasks')
      .update({ thomaz_notified: true })
      .eq('id', insight.taskId)

    onUpdateTask(insight.taskId, { thomaz_notified: true })

    setTimeout(() => {
      setNotifying(null)
      dismiss(insight.id)
    }, 1200)
  }, [dismiss, onUpdateTask])

  const allInsights = [...billingInsights, ...taskInsights].filter(i => !dismissed.has(i.id))
  const inlineInsights = allInsights.filter(i => i.severity !== 'critical')

  return (
    <>
      <AnimatePresence>
        {criticalOpen && criticalInsight && !dismissed.has(criticalInsight.id) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[980]"
              onClick={() => setCriticalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[981] w-[480px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border-2 border-red-300 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-500 to-orange-500 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Thomaz AI — Alerta Critico</p>
                    <p className="text-xs text-red-100">Acao imediata recomendada</p>
                  </div>
                </div>
                <button
                  onClick={() => setCriticalOpen(false)}
                  className="text-white/70 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">{criticalInsight.message}</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700 font-medium">
                    OS nao faturada impacta diretamente o fluxo de caixa e pode gerar inadimplencia.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => dismiss(criticalInsight.id)}
                    className="flex-1 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 transition flex items-center justify-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Iniciar Faturamento
                  </button>
                  <button
                    onClick={() => dismiss(criticalInsight.id)}
                    className="px-4 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    Ignorar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {inlineInsights.length > 0 && (
        <div className="mb-4 space-y-2">
          <AnimatePresence>
            {inlineInsights.map(insight => {
              const s = SEVERITY_STYLES[insight.severity]
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className={`flex items-start gap-3 border rounded-xl px-4 py-3 ${s.bg} ${s.border}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow ${s.iconBg}`}>
                    {insight.type === 'billing'
                      ? <DollarSign className="h-4 w-4 text-white" />
                      : insight.type === 'overdue'
                        ? <Clock className="h-4 w-4 text-white" />
                        : <Bot className="h-4 w-4 text-white" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{insight.message}</p>
                    {insight.action && (
                      <div className="flex gap-2 mt-2">
                        {insight.action === 'notificar' && (
                          <button
                            onClick={() => handleNotify(insight)}
                            disabled={notifying === insight.taskId}
                            className="flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 transition disabled:opacity-60"
                          >
                            <Bell className="h-3 w-3" />
                            {notifying === insight.taskId ? 'Notificando...' : 'Notificar Responsável'}
                          </button>
                        )}
                        {insight.taskId && (
                          <button
                            onClick={() => { onOpenTask(insight.taskId!); dismiss(insight.id) }}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 rounded-lg px-3 py-1.5 transition"
                          >
                            <ChevronRight className="h-3 w-3" />
                            {insight.action === 'abrir' ? 'Abrir Tarefa' : 'Ver Tarefa'}
                          </button>
                        )}
                        <button
                          onClick={() => dismiss(insight.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 px-2 transition"
                        >
                          Ignorar
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(insight.id)}
                    className="shrink-0 text-gray-300 hover:text-gray-500 transition mt-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}
