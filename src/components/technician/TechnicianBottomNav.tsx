import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, History, MessageCircle, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

const navItems = [
  { id: 'agenda', path: '/tecnico', icon: CalendarDays, label: 'Agenda' },
  { id: 'historico', path: '/tecnico/historico', icon: History, label: 'Histórico' },
  { id: 'chat', path: '/tecnico/chat', icon: MessageCircle, label: 'Chat' },
  { id: 'perfil', path: '/tecnico/perfil', icon: User, label: 'Perfil' }
]

const TechnicianBottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const [unreadCount, setUnreadCount] = useState(0)
  const [pulsingHome, setPulsingHome] = useState(false)
  const [pulsingChat, setPulsingChat] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    loadUnreadCount()

    const notificationsChannel = supabase
      .channel(`nav-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          setUnreadCount(prev => prev + 1)
          triggerPulse('chat')
        }
      )
      .subscribe()

    const messagesChannel = supabase
      .channel(`nav-messages-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'internal_messages' },
        () => {
          if (!location.pathname.startsWith('/tecnico/chat')) {
            triggerPulse('chat')
          }
        }
      )
      .subscribe()

    const newOSChannel = supabase
      .channel(`nav-new-os-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_order_assignments' },
        () => {
          if (location.pathname !== '/tecnico') {
            triggerPulse('home')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notificationsChannel)
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(newOSChannel)
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
    } catch {
      /* noop */
    }
  }

  const triggerPulse = (target: 'home' | 'chat') => {
    if (target === 'home') {
      setPulsingHome(true)
      setTimeout(() => setPulsingHome(false), 4000)
    } else {
      setPulsingChat(true)
      setTimeout(() => setPulsingChat(false), 3000)
    }
  }

  const isActive = (path: string) => {
    if (path === '/tecnico') {
      return location.pathname === '/tecnico' || location.pathname === '/tecnico/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav
      className="sticky bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-[68px] px-1">
        {navItems.map((item) => {
          const active = isActive(item.path)
          const Icon = item.icon
          const showChatBadge = item.id === 'chat' && unreadCount > 0
          const isPulsingChat = item.id === 'chat' && pulsingChat && !active
          const isPulsingHome = item.id === 'agenda' && pulsingHome && !active

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-2 transition-all active:scale-90"
            >
              {active && (
                <motion.div
                  layoutId="techBottomIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-blue-600 rounded-b-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <div className="relative mb-0.5">
                <motion.div
                  animate={
                    isPulsingChat || isPulsingHome
                      ? { scale: [1, 1.25, 1], transition: { repeat: Infinity, duration: 0.5 } }
                      : {}
                  }
                >
                  <Icon
                    className={`w-[22px] h-[22px] transition-all duration-200 ${
                      active ? 'text-blue-600' : 'text-gray-400'
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </motion.div>

                <AnimatePresence>
                  {showChatBadge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <span className="text-[10px] font-bold text-white px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {(isPulsingHome || isPulsingChat) && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full bg-blue-400 pointer-events-none"
                  />
                )}
              </div>

              <span
                className={`text-[10px] font-semibold leading-none transition-colors duration-200 ${
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
