import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from './UserContext'

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'chat' | 'agenda' | 'success'

export interface HubAlert {
  id: string
  severity: AlertSeverity
  title: string
  message: string
  link?: string
  action_label?: string
  category?: string
  avatar?: string
  sender_name?: string
  preview?: string
  sticky?: boolean
  created_at: string
  source?: 'notification' | 'chat' | 'whatsapp' | 'thomaz'
  thomaz_interrupt?: {
    context: string
    suggested_reply?: string
    os_id?: string
    client_name?: string
  }
}

interface NotificationHubCtx {
  alerts: HubAlert[]
  unread: number
  dismissAlert: (id: string) => void
  dismissAll: () => void
  markRead: (id: string) => void
  addAlert: (alert: Omit<HubAlert, 'id' | 'created_at'>) => void
}

const NotificationHubContext = createContext<NotificationHubCtx>({
  alerts: [],
  unread: 0,
  dismissAlert: () => {},
  dismissAll: () => {},
  markRead: () => {},
  addAlert: () => {},
})

export const useNotificationHub = () => useContext(NotificationHubContext)

const AGENDA_SHOWN_KEY = 'giartech_agenda_popup_date'

function mapNotifToAlert(n: any): HubAlert {
  const cat = (n.category || '').toLowerCase()
  let severity: AlertSeverity = 'info'
  let sticky = false

  if (cat.includes('payment') || cat.includes('pagamento') || cat.includes('vencimento') || n.type === 'error') {
    severity = 'critical'
    sticky = true
  } else if (cat.includes('chat') || cat.includes('whatsapp') || cat.includes('message') || cat.includes('mensagem')) {
    severity = 'chat'
  } else if (cat.includes('agenda') || cat.includes('calendar')) {
    severity = 'agenda'
  } else if (n.type === 'warning') {
    severity = 'warning'
  } else if (n.type === 'success') {
    severity = 'success'
  }

  if (n.priority >= 8) {
    severity = 'critical'
    sticky = true
  }

  return {
    id: n.id,
    severity,
    title: n.title,
    message: n.message,
    link: n.link,
    action_label: n.action_label,
    category: n.category,
    sticky,
    created_at: n.created_at,
    source: 'notification',
  }
}

export function NotificationHubProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<HubAlert[]>([])
  const [unread, setUnread] = useState(0)
  const { user } = useUser()
  const channelRef = useRef<any>(null)
  const readIds = useRef<Set<string>>(new Set())

  const addAlert = useCallback((alert: Omit<HubAlert, 'id' | 'created_at'>) => {
    const id = `local_${Date.now()}_${Math.random()}`
    const newAlert: HubAlert = { ...alert, id, created_at: new Date().toISOString() }
    setAlerts(prev => [newAlert, ...prev].slice(0, 20))
    setUnread(n => n + 1)
  }, [])

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    setUnread(n => Math.max(0, n - 1))
  }, [])

  const dismissAll = useCallback(() => {
    setAlerts([])
    setUnread(0)
  }, [])

  const markRead = useCallback((id: string) => {
    readIds.current.add(id)
    setUnread(n => Math.max(0, n - 1))
    if (!id.startsWith('local_')) {
      supabase.rpc('mark_notification_as_read', { p_notification_id: id }).then(() => {})
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const today = new Date().toDateString()
    const lastAgendaShown = localStorage.getItem(AGENDA_SHOWN_KEY)

    const checkAgenda = async () => {
      if (lastAgendaShown !== today) {
        const { data } = await supabase
          .from('agenda_events')
          .select('id, title, start_time, event_type')
          .gte('start_time', new Date().toISOString().split('T')[0])
          .lte('start_time', new Date().toISOString().split('T')[0] + 'T23:59:59')
          .neq('status', 'cancelado')
          .limit(5)

        if (data && data.length > 0) {
          const names = data.slice(0, 3).map((e: any) => e.title).join(', ')
          setAlerts(prev => [{
            id: `agenda_${today}`,
            severity: 'agenda',
            title: `Agenda do Dia — ${data.length} evento${data.length > 1 ? 's' : ''}`,
            message: names + (data.length > 3 ? ` e mais ${data.length - 3}...` : ''),
            link: '/agenda',
            action_label: 'Ver Agenda',
            sticky: false,
            created_at: new Date().toISOString(),
            source: 'notification',
          }, ...prev])
          setUnread(n => n + 1)
          localStorage.setItem(AGENDA_SHOWN_KEY, today)
        }
      }
    }

    const checkOverdueOS = async () => {
      const { data } = await supabase
        .from('service_orders')
        .select('id, order_number, client_name, execution_deadline')
        .lte('execution_deadline', new Date().toISOString().split('T')[0])
        .in('status', ['pending', 'aberto', 'em_andamento', 'in_progress'])
        .limit(5)

      if (data && data.length > 0) {
        data.forEach((os: any) => {
          setAlerts(prev => [{
            id: `overdue_os_${os.id}`,
            severity: 'critical',
            title: `OS ${os.order_number} — Prazo Vencido`,
            message: `Cliente: ${os.client_name || 'N/A'} · Prazo: ${os.execution_deadline ? new Date(os.execution_deadline).toLocaleDateString('pt-BR') : '—'}`,
            link: `/service-orders/${os.id}/view`,
            action_label: 'Ir para OS',
            sticky: true,
            created_at: new Date().toISOString(),
            source: 'notification',
          }, ...prev.filter(a => a.id !== `overdue_os_${os.id}`)].slice(0, 20))
        })
        setUnread(n => n + data.length)
      }
    }

    checkAgenda()
    checkOverdueOS()

    const channel = supabase
      .channel('notification_hub_global')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        const n = payload.new as any
        if (readIds.current.has(n.id)) return
        const alert = mapNotifToAlert(n)
        setAlerts(prev => [alert, ...prev].slice(0, 20))
        setUnread(count => count + 1)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [user])

  return (
    <NotificationHubContext.Provider value={{ alerts, unread, dismissAlert, dismissAll, markRead, addAlert }}>
      {children}
    </NotificationHubContext.Provider>
  )
}
