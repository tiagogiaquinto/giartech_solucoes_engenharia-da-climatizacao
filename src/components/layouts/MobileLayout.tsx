import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Calendar,
  MessageSquare,
  User,
  LogOut,
  Settings,
  Bell,
  X,
  ChevronRight
} from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { supabase } from '../../lib/supabase'

const TAB_COLORS: Record<string, { active: string; bg: string; dot: string }> = {
  home:    { active: 'text-[#0f567d]',   bg: 'bg-[#e8f4fb]',   dot: 'bg-[#0f567d]'   },
  agenda:  { active: 'text-emerald-600', bg: 'bg-emerald-50',  dot: 'bg-emerald-500'  },
  chat:    { active: 'text-rose-600',    bg: 'bg-rose-50',     dot: 'bg-rose-500'     },
  profile: { active: 'text-slate-700',   bg: 'bg-slate-100',   dot: 'bg-slate-500'    }
}

const haptic = (type: 'light' | 'medium' = 'light') => {
  if (!navigator.vibrate) return
  navigator.vibrate(type === 'light' ? 10 : 20)
}

const MobileLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useUser()
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadChats, setUnreadChats] = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const mainTabs = [
    { id: 'home',    label: 'Início',  icon: Home,          path: '/mobile' },
    { id: 'agenda',  label: 'Agenda',  icon: Calendar,      path: '/mobile/agenda' },
    { id: 'chat',    label: 'Chat',    icon: MessageSquare, path: '/mobile/chat' },
    { id: 'profile', label: 'Perfil',  icon: User,          path: '/mobile/profile' }
  ]

  useEffect(() => {
    if (!user?.user_id) return
    loadCounts()
    setupRealtime()
    return () => {
      realtimeRef.current?.unsubscribe()
    }
  }, [user?.user_id])

  const loadCounts = async () => {
    if (!user?.user_id) return
    try {
      const [notifRes, chatRes] = await Promise.all([
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.user_id)
          .eq('read', false),
        supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('read', false)
          .neq('sender_id', user.user_id)
      ])
      setUnreadNotifs(notifRes.count || 0)
      setUnreadChats(chatRes.count || 0)
    } catch {
      /* silent */
    }
  }

  const loadNotifications = async () => {
    if (!user?.user_id) return
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10)
      setNotifications(data || [])
    } catch {
      /* silent */
    }
  }

  const setupRealtime = () => {
    realtimeRef.current?.unsubscribe()
    realtimeRef.current = supabase
      .channel(`mobile-badge-${user?.user_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.user_id}`
      }, () => {
        haptic('medium')
        loadCounts()
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        loadCounts()
      })
      .subscribe()
  }

  const markNotificationsRead = async () => {
    if (!user?.user_id) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.user_id)
      .eq('read', false)
    setUnreadNotifs(0)
    setNotifications([])
  }

  const isActiveTab = (path: string) => {
    if (path === '/mobile') return location.pathname === '/mobile'
    return location.pathname.startsWith(path)
  }

  const handleTabPress = (path: string) => {
    haptic('light')
    navigate(path)
  }

  const handleLogout = async () => {
    haptic('medium')
    setShowProfile(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNotifOpen = () => {
    haptic('light')
    loadNotifications()
    setShowNotifications(true)
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-[72px]">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f1e3d] to-[#0a3d6b] text-white sticky top-0 z-30 shadow-xl">
        <div className="h-0.5 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500" />
        <div className="flex items-center justify-between px-4 py-3">
          <motion.div
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">
                {user?.name?.split(' ').slice(0, 2).join(' ') || 'Técnico'}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-[11px] text-blue-200 truncate">
                  {user?.role === 'technician' ? 'Técnico de Campo' : user?.role || 'Online'}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleNotifOpen}
              className="relative p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10"
            >
              <Bell className="w-5 h-5" />
              <AnimatePresence>
                {unreadNotifs > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#0f1e3d] px-0.5"
                  >
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => { haptic('light'); setShowProfile(true) }}
              className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-white/10"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Profile Sheet */}
      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowProfile(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 overflow-hidden shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />

              <div className="bg-gradient-to-r from-[#0f1e3d] to-[#0a3d6b] px-6 py-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-base truncate">{user?.name}</p>
                  <p className="text-sm text-blue-200 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-[10px] text-white font-semibold uppercase tracking-wide">
                    {user?.role === 'technician' ? 'Técnico de Campo' : user?.role}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <button
                  onClick={() => { haptic('light'); setShowProfile(false); navigate('/mobile/profile') }}
                  className="w-full px-4 py-4 text-left bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">Meu Perfil</p>
                    <p className="text-xs text-gray-500">Ver e editar informações</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-4 text-left bg-red-50 hover:bg-red-100 rounded-2xl transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-600 text-sm">Sair do Aplicativo</p>
                    <p className="text-xs text-red-400">Encerrar sessão</p>
                  </div>
                </button>
              </div>

              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notifications Sheet */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 flex flex-col max-h-[75vh] shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 shrink-0" />
              <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900">Notificações</h3>
                  {unreadNotifs > 0 && (
                    <p className="text-xs text-gray-500">{unreadNotifs} não lidas</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={markNotificationsRead}
                      className="text-xs text-blue-600 font-semibold px-3 py-1.5 bg-blue-50 rounded-full"
                    >
                      Marcar todas
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-semibold text-gray-500">Tudo em dia!</p>
                    <p className="text-sm text-gray-400 mt-1">Nenhuma notificação pendente.</p>
                  </div>
                ) : (
                  notifications.map((notif, i) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-blue-50 rounded-2xl p-4 border border-blue-100"
                    >
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">{notif.title}</p>
                      <p className="text-xs text-gray-600 mb-1.5">{notif.message}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(notif.created_at).toLocaleString('pt-BR')}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="h-4 shrink-0" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <div className="p-4">
        <Outlet />
      </div>

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-safe">
          {mainTabs.map((tab) => {
            const active = isActiveTab(tab.path)
            const colors = TAB_COLORS[tab.id]
            const badge = tab.id === 'chat' ? unreadChats : 0

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabPress(tab.path)}
                whileTap={{ scale: 0.88 }}
                className="relative flex flex-col items-center gap-1 flex-1 py-1.5 rounded-xl"
              >
                {/* Active pill background */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="bottomNavActive"
                      className={`absolute inset-0 ${colors.bg} rounded-xl`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon with badge */}
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: active ? 1.12 : 1,
                      y: active ? -1 : 0
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <tab.icon
                      className={`w-[22px] h-[22px] transition-colors ${active ? colors.active : 'text-gray-400'}`}
                      strokeWidth={active ? 2.5 : 1.8}
                      fill={active ? 'currentColor' : 'none'}
                      fillOpacity={active ? 0.12 : 0}
                    />
                  </motion.div>

                  {/* Badge */}
                  <AnimatePresence>
                    {badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2 -right-2.5 min-w-[17px] h-[17px] bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white px-0.5"
                      >
                        {badge > 9 ? '9+' : badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] font-semibold transition-colors ${active ? colors.active : 'text-gray-400'}`}
                >
                  {tab.label}
                </span>

                {/* Active dot indicator */}
                {active && (
                  <motion.div
                    layoutId="bottomNavDot"
                    className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${colors.dot}`}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default MobileLayout
