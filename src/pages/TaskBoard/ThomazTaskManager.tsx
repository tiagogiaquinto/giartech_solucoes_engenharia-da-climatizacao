import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, ChevronRight, Bell } from 'lucide-react'
import { Task } from './types'
import { supabase } from '../../lib/supabase'

interface Insight {
  id: string
  type: 'blocked' | 'overdue' | 'summary'
  message: string
  taskId?: string
  taskTitle?: string
  action?: string
}

function buildInsights(tasks: Task[]): Insight[] {
  const insights: Insight[] = []

  const blockedOld = tasks.filter(t => {
    if (t.column_id !== 'blocked' || !t.blocked_since) return false
    const days = Math.floor((Date.now() - new Date(t.blocked_since).getTime()) / 86400000)
    return days >= 2
  })

  blockedOld.forEach(t => {
    const days = Math.floor((Date.now() - new Date(t.blocked_since!).getTime()) / 86400000)
    if (!t.thomaz_notified) {
      insights.push({
        id: `blocked_${t.id}`,
        type: 'blocked',
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
    const urgentFirst = overdueToday.sort((a, b) => {
      const order = { urgent: 0, high: 1, normal: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    })
    insights.push({
      id: 'overdue_today',
      type: 'overdue',
      message: `Você tem ${overdueToday.length} tarefa${overdueToday.length > 1 ? 's' : ''} vencendo hoje. Recomendo focar na de maior prioridade: "${urgentFirst[0].title}".`,
      taskId: urgentFirst[0].id,
      taskTitle: urgentFirst[0].title,
      action: 'abrir',
    })
  }

  return insights.slice(0, 3)
}

interface Props {
  tasks: Task[]
  onOpenTask: (id: string) => void
  onUpdateTask: (id: string, payload: Partial<Task>) => void
}

export function ThomazTaskManager({ tasks, onOpenTask, onUpdateTask }: Props) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [notifying, setNotifying] = useState<string | null>(null)

  useEffect(() => {
    const fresh = buildInsights(tasks).filter(i => !dismissed.has(i.id))
    setInsights(fresh)
  }, [tasks, dismissed])

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]))
  }, [])

  const handleNotify = useCallback(async (insight: Insight) => {
    if (!insight.taskId) return
    setNotifying(insight.taskId)

    await supabase
      .from('project_task_comments')
      .insert({
        task_id: insight.taskId,
        author_name: 'Thomaz AI',
        body: `Olá! Identifiquei que esta tarefa está bloqueada há mais de 2 dias. Por favor, atualize o status ou adicione um comentário explicando o bloqueio.`,
        is_thomaz: true,
      })

    await supabase
      .from('project_tasks')
      .update({ thomaz_notified: true })
      .eq('id', insight.taskId)

    setTimeout(() => {
      setNotifying(null)
      dismiss(insight.id)
    }, 1200)
  }, [dismiss])

  const visible = insights.filter(i => !dismissed.has(i.id))
  if (visible.length === 0) return null

  return (
    <div className="mb-4 space-y-2">
      <AnimatePresence>
        {visible.map(insight => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-xl px-4 py-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 mt-0.5 shadow">
              <Bot className="h-4 w-4 text-white" />
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
            <button onClick={() => dismiss(insight.id)} className="shrink-0 text-gray-300 hover:text-gray-500 transition mt-0.5">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
