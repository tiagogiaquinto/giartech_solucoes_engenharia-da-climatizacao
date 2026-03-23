import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import { useNotificationHub } from '../contexts/NotificationHubContext'

const CRITICAL_EMAIL_KEY = 'thomaz_last_critical_email_check'
const CHECK_INTERVAL = 90000

const CRITICAL_KEYWORDS = [
  'urgente', 'reclamação', 'reclamando', 'insatisfeito', 'cancelar', 'cancelamento',
  'problema', 'errado', 'prejudicado', 'processo', 'juizado', 'reembolso',
  'critical', 'complaint', 'urgent', 'cancel', 'refund', 'lawsuit',
]

function hasCriticalKeyword(text: string): boolean {
  const lower = (text || '').toLowerCase()
  return CRITICAL_KEYWORDS.some(k => lower.includes(k))
}

export function useThomazInterrupt() {
  const { user } = useUser()
  const { addAlert } = useNotificationHub()
  const checkedEmailIds = useRef<Set<string>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!user) return

    const checkCriticalEmails = async () => {
      try {
        const since = new Date(Date.now() - CHECK_INTERVAL * 2).toISOString()
        const { data } = await supabase
          .from('emails')
          .select('id, subject, from_email, from_name, body_text, received_at')
          .eq('folder', 'inbox')
          .gte('received_at', since)
          .order('received_at', { ascending: false })
          .limit(10)

        if (!data) return

        for (const email of data) {
          if (checkedEmailIds.current.has(email.id)) continue
          checkedEmailIds.current.add(email.id)

          const isCritical = hasCriticalKeyword(email.subject) || hasCriticalKeyword(email.body_text)
          if (!isCritical) continue

          const senderName = email.from_name || email.from_email?.split('@')[0] || 'Cliente'
          addAlert({
            severity: 'critical',
            title: 'Thomaz — E-mail Urgente Detectado',
            message: `${senderName} enviou um e-mail que pode ser crítico. Deseja que eu abra agora ou responda com um prazo padrão?`,
            link: '/email-inbox',
            action_label: 'Abrir E-mail',
            sticky: true,
            source: 'thomaz',
            thomaz_interrupt: {
              context: `email_critico_de_${senderName}`,
              client_name: senderName,
              suggested_reply: `Olá ${senderName}, recebemos sua mensagem e nossa equipe entrará em contato em até 2 horas úteis.`,
            },
            preview: email.subject,
          })
        }
      } catch {}
    }

    checkCriticalEmails()
    intervalRef.current = setInterval(checkCriticalEmails, CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user, addAlert])
}
