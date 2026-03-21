import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, MessageCircle, Calendar, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

const navItems = [
  { id: 'home', path: '/tecnico', icon: Home, label: 'Roteiro' },
  { id: 'chat', path: '/tecnico/chat', icon: MessageCircle, label: 'Chat' },
  { id: 'agenda', path: '/tecnico/agenda', icon: Calendar, label: 'Agenda' },
  { id: 'perfil', path: '/tecnico/perfil', icon: User, label: 'Perfil' }
]

const TechnicianBottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasNewMessage, setHasNewMessage] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    loadUnreadCount()

    const notificationsChannel = supabase
      .channel(`notifications-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          setUnreadCount(prev => prev + 1)
          pulseChat()
        }
      )
      .subscribe()

    const messagesChannel = supabase
      .channel(`messages-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'internal_messages' },
        () => {
          if (location.pathname !== '/tecnico/chat') {
            pulseChat()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notificationsChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [location.pathname, user?.id])

  const loadUnreadCount = async () => {
    if (!user?.id) return
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('user_id', user.id)

      setUnreadCount(count || 0)
    } catch (err) {
      console.error('Erro ao carregar notificacoes:', err)
    }
  }

  const pulseChat = () => {
    setHasNewMessage(true)
    setTimeout(() => setHasNewMessage(false), 3000)
  }

  const isActive = (path: string) => {
    if (path === '/tecnico') {
      return location.pathname === '/tecnico' || location.pathname === '/tecnico/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] safe-area-bottom">
      <div className="flex items-center justify-around h-[68px] max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.path)
          const Icon = item.icon
          const showBadge = item.id === 'chat' && unreadCount > 0
          const isPulsing = item.id === 'chat' && hasNewMessage

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-2 transition-all active:scale-90"
            >
              {active && (
                <motion.div
                  layoutId="technicianNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-blue-600 rounded-b-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <div className="relative">
                <motion.div
                  animate={isPulsing ? {
                    scale: [1, 1.2, 1],
                    transition: { repeat: Infinity, duration: 0.6 }
                  } : {}}
                >
                  <Icon
                    className={`w-6 h-6 mb-1 transition-all duration-200 ${
                      active ? 'text-blue-600' : 'text-gray-400'
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </motion.div>

                <AnimatePresence>
                  {showBadge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <span className="text-[10px] font-bold text-white px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isPulsing && !showBadge && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-full"
                  />
                )}
              </div>

              <span
                className={`text-[11px] font-semibold transition-colors duration-200 ${
                  active ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default TechnicianBottomNav
