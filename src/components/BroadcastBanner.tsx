import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Megaphone, AlertTriangle, Zap, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'

interface BroadcastMessage {
  id: string
  title: string
  content: string
  priority: 'info' | 'warning' | 'urgent'
  created_by_name: string
  created_at: string
}

const PRIORITY_STYLE = {
  info: {
    bg: 'from-blue-600 to-blue-700',
    text: 'text-white',
    sub: 'text-blue-100',
    close: 'bg-blue-500/30 hover:bg-blue-400/40',
    Icon: Info,
  },
  warning: {
    bg: 'from-amber-500 to-amber-600',
    text: 'text-white',
    sub: 'text-amber-100',
    close: 'bg-amber-400/30 hover:bg-amber-300/40',
    Icon: AlertTriangle,
  },
  urgent: {
    bg: 'from-red-600 to-red-700',
    text: 'text-white',
    sub: 'text-red-100',
    close: 'bg-red-500/30 hover:bg-red-400/40',
    Icon: Zap,
  },
}

const ANON_KEY = `broadcast_ack_${typeof window !== 'undefined' ? window.location.hostname : ''}`

export default function BroadcastBanner() {
  const { user } = useUser()
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([])
  const [dismissedLocal, setDismissedLocal] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    const uid = user?.id || null
    const { data } = await supabase.rpc('get_active_broadcasts', { p_user_id: uid })
    if (Array.isArray(data)) {
      const localDismissed = getLocalDismissed()
      setBroadcasts(data.filter((b: BroadcastMessage) => !localDismissed.has(b.id)))
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const channel = supabase
      .channel('broadcasts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcast_messages' }, load)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'broadcast_messages' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  function getLocalDismissed(): Set<string> {
    try {
      const raw = localStorage.getItem(ANON_KEY)
      if (raw) return new Set(JSON.parse(raw))
    } catch {}
    return new Set()
  }

  function saveLocalDismissed(id: string) {
    try {
      const current = getLocalDismissed()
      current.add(id)
      localStorage.setItem(ANON_KEY, JSON.stringify(Array.from(current)))
    } catch {}
  }

  async function dismiss(id: string) {
    setBroadcasts(prev => prev.filter(b => b.id !== id))
    setDismissedLocal(prev => new Set([...prev, id]))
    saveLocalDismissed(id)
    if (user?.id) {
      await supabase.rpc('mark_broadcast_read', { p_broadcast_id: id, p_user_id: user.id })
    } else {
      const anonId = getOrCreateAnonId()
      await supabase.rpc('mark_broadcast_read', { p_broadcast_id: id, p_user_id: anonId })
    }
  }

  function getOrCreateAnonId(): string {
    try {
      let id = localStorage.getItem('anon_user_id')
      if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem('anon_user_id', id)
      }
      return id
    } catch {
      return crypto.randomUUID()
    }
  }

  if (broadcasts.length === 0) return null

  const current = broadcasts[0]
  const style = PRIORITY_STYLE[current.priority] || PRIORITY_STYLE.info
  const Icon = style.Icon

  return (
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={{ y: -48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -48, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`w-full bg-gradient-to-r ${style.bg} z-[9999] print:hidden`}
        style={{ minHeight: 44 }}>
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
              <Icon className={`w-3.5 h-3.5 ${style.text}`} />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wide ${style.sub}`}>
              {current.created_by_name}
            </span>
          </div>

          <div className={`flex-1 text-sm font-medium ${style.text} min-w-0`}>
            {current.title && <span className="font-bold">{current.title}: </span>}
            <span className="opacity-95">{current.content}</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {broadcasts.length > 1 && (
              <span className={`text-xs font-semibold ${style.sub}`}>
                +{broadcasts.length - 1} aviso{broadcasts.length - 1 > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={() => dismiss(current.id)}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${style.close}`}>
              <X className={`w-3.5 h-3.5 ${style.text}`} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
