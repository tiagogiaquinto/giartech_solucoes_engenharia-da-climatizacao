import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, CheckCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface TaskNotification {
  id: string
  task_id: string
  task_title: string
  assigned_by_name: string
  message: string
  created_at: string
}

interface AssignmentToastProps {
  currentUserId?: string
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.connect(ctx.destination)

    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)
      osc.connect(gainNode)
      osc.start(ctx.currentTime + i * 0.1)
      osc.stop(ctx.currentTime + i * 0.1 + 0.12)
    })
  } catch {
  }
}

export function AssignmentToast({ currentUserId }: AssignmentToastProps) {
  const [notifications, setNotifications] = useState<TaskNotification[]>([])

  const fetchPending = useCallback(async () => {
    if (!currentUserId) return
    const { data } = await supabase
      .from('task_notifications')
      .select('id, task_id, task_title, assigned_by_name, message, created_at')
      .eq('recipient_user_id', currentUserId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data && data.length > 0) {
      setNotifications(data)
      playNotificationSound()
    }
  }, [currentUserId])

  useEffect(() => {
    if (!currentUserId) return

    fetchPending()

    const channel = supabase
      .channel(`task_notifications_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_notifications',
          filter: `recipient_user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const n = payload.new as TaskNotification
          setNotifications(prev => [n, ...prev].slice(0, 5))
          playNotificationSound()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, fetchPending])

  const dismiss = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase.from('task_notifications').update({ read: true }).eq('id', id)
  }, [])

  const dismissAll = useCallback(async () => {
    const ids = notifications.map(n => n.id)
    setNotifications([])
    for (const id of ids) {
      await supabase.from('task_notifications').update({ read: true }).eq('id', id)
    }
  }, [notifications])

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[990] flex flex-col gap-2 items-end">
      <AnimatePresence>
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28, delay: i * 0.04 }}
            className="bg-white rounded-2xl border-2 border-blue-300 shadow-2xl overflow-hidden"
            style={{ maxWidth: 360 }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Bell className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-xs font-bold text-white">Nova Tarefa Atribuida</span>
              </div>
              <button onClick={() => dismiss(n.id)} className="text-white/60 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-gray-800 mb-0.5 truncate">{n.task_title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {notifications.length > 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={dismissAll}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow hover:bg-gray-50 transition"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Marcar todas como lidas
        </motion.button>
      )}
    </div>
  )
}
