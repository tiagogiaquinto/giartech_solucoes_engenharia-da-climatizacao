import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Clock, CreditCard, MessageCircle, CheckCircle, AlertTriangle, Bell, ArrowRight, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotificationHub, HubAlert } from '../contexts/NotificationHubContext'

const SOUNDS = {
  chat: [
    [1046.5, 0.05, 0],
    [1318.5, 0.05, 0.07],
  ],
  critical: [
    [880, 0.12, 0],
    [659.25, 0.12, 0.15],
    [523.25, 0.18, 0.32],
  ],
  default: [
    [880, 0.08, 0],
    [1108.7, 0.08, 0.1],
  ],
}

function playSound(type: 'chat' | 'critical' | 'default') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const notes = SOUNDS[type]
    notes.forEach(([freq, gain, when]) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type === 'critical' ? 'square' : 'sine'
      osc.frequency.value = freq as number
      g.gain.value = gain as number
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (when as number) + 0.2)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(ctx.currentTime + (when as number))
      osc.stop(ctx.currentTime + (when as number) + 0.25)
    })
  } catch {}
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: React.ReactNode; sound: 'chat' | 'critical' | 'default' }> = {
  critical: {
    bg: 'bg-red-600',
    border: 'border-red-700',
    icon: <AlertTriangle className="h-5 w-5 text-white" />,
    sound: 'critical',
  },
  warning: {
    bg: 'bg-amber-500',
    border: 'border-amber-600',
    icon: <AlertTriangle className="h-5 w-5 text-white" />,
    sound: 'default',
  },
  chat: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-600',
    icon: <MessageCircle className="h-5 w-5 text-white" />,
    sound: 'chat',
  },
  agenda: {
    bg: 'bg-blue-600',
    border: 'border-blue-700',
    icon: <Clock className="h-5 w-5 text-white" />,
    sound: 'default',
  },
  success: {
    bg: 'bg-teal-500',
    border: 'border-teal-600',
    icon: <CheckCircle className="h-5 w-5 text-white" />,
    sound: 'default',
  },
  info: {
    bg: 'bg-slate-700',
    border: 'border-slate-800',
    icon: <Bell className="h-5 w-5 text-white" />,
    sound: 'default',
  },
}

function AlertCard({ alert, onDismiss, onNavigate }: { alert: HubAlert; onDismiss: () => void; onNavigate?: () => void }) {
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info
  const isThomaz = !!alert.thomaz_interrupt

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`relative w-[360px] rounded-xl shadow-2xl border-2 overflow-hidden ${style.border} bg-white`}
    >
      <div className={`${style.bg} px-4 py-2.5 flex items-center gap-2.5`}>
        {style.icon}
        <span className="text-white font-semibold text-sm flex-1 leading-tight">{alert.title}</span>
        {!alert.sticky && (
          <button onClick={onDismiss} className="text-white/70 hover:text-white transition ml-1 shrink-0">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-4 py-3">
        {isThomaz ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 leading-snug">{alert.message}</p>
            {alert.thomaz_interrupt?.suggested_reply && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800 italic">
                "{alert.thomaz_interrupt.suggested_reply}"
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onNavigate}
                className="flex-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 transition"
              >
                Abrir Agora
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 transition"
              >
                Responder Depois
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-sm text-gray-700 leading-snug">{alert.message}</p>
            {alert.preview && (
              <p className="text-xs text-gray-500 italic line-clamp-2">"{alert.preview}"</p>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="flex gap-2">
                {alert.link && (
                  <button
                    onClick={onNavigate}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                  >
                    {alert.action_label || 'Ver'}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                {alert.sticky ? (
                  <button
                    onClick={onDismiss}
                    className="text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 rounded-lg px-2.5 py-1 transition"
                  >
                    Ciente
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function GiartechNotificationHub() {
  const { alerts, dismissAlert, dismissAll, markRead } = useNotificationHub()
  const navigate = useNavigate()
  const playedIds = useRef<Set<string>>(new Set())
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const handleDismiss = useCallback((id: string) => {
    markRead(id)
    dismissAlert(id)
    const t = timersRef.current.get(id)
    if (t) clearTimeout(t)
    timersRef.current.delete(id)
  }, [markRead, dismissAlert])

  const handleNavigate = useCallback((alert: HubAlert) => {
    markRead(alert.id)
    dismissAlert(alert.id)
    if (alert.link) navigate(alert.link)
  }, [markRead, dismissAlert, navigate])

  useEffect(() => {
    if (alerts.length === 0) return
    const newest = alerts[0]
    if (playedIds.current.has(newest.id)) return
    playedIds.current.add(newest.id)

    const style = SEVERITY_STYLES[newest.severity] || SEVERITY_STYLES.info
    playSound(style.sound)

    if (!newest.sticky) {
      const delay = newest.severity === 'chat' ? 5000 : 8000
      const timer = setTimeout(() => handleDismiss(newest.id), delay)
      timersRef.current.set(newest.id, timer)
    }
  }, [alerts, handleDismiss])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  const visibleAlerts = alerts.slice(0, 5)

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence mode="sync">
        {visibleAlerts.map(alert => (
          <div key={alert.id} className="pointer-events-auto">
            <AlertCard
              alert={alert}
              onDismiss={() => handleDismiss(alert.id)}
              onNavigate={() => handleNavigate(alert)}
            />
          </div>
        ))}
      </AnimatePresence>

      {alerts.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto"
        >
          <button
            onClick={dismissAll}
            className="flex items-center gap-1.5 text-xs font-medium bg-white/90 hover:bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow text-gray-600 hover:text-gray-800 transition"
          >
            <Trash2 className="h-3 w-3" />
            Limpar tudo ({alerts.length})
          </button>
        </motion.div>
      )}
    </div>
  )
}
