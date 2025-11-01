import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Calendar,
  ClipboardList,
  BookOpen,
  MapPin,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  Bell,
  Menu,
  X
} from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { supabase } from '../../lib/supabase'

const MobileLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useUser()
  const [showProfile, setShowProfile] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const mainTabs = [
    { id: 'home', label: 'Início', icon: Home, path: '/mobile', color: 'blue' },
    { id: 'agenda', label: 'Agenda', icon: Calendar, path: '/mobile/agenda', color: 'purple' },
    { id: 'orders', label: 'OS', icon: ClipboardList, path: '/mobile/orders', color: 'green' },
    { id: 'purchases', label: 'Compras', icon: ShoppingCart, path: '/mobile/purchases', color: 'orange' },
    { id: 'routes', label: 'Rotas', icon: MapPin, path: '/mobile/routes', color: 'red' }
  ]

  useEffect(() => {
    loadNotifications()
  }, [user])

  const loadNotifications = async () => {
    if (!user?.user_id) return

    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5)

      setNotifications(data || [])
      setUnreadCount(data?.length || 0)
    } catch (err) {
      console.error('Error loading notifications:', err)
    }
  }

  const isActiveTab = (path: string) => {
    if (path === '/mobile') {
      return location.pathname === '/mobile'
    }
    return location.pathname.startsWith(path)
  }

  const getTabColor = (tab: any) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600'
    }
    return colors[tab.color] || colors.blue
  }

  const handleLogout = () => {
    logout()
    navigate('/mobile/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 pb-24">
      {/* Premium Header */}
      <div className="relative">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white sticky top-0 z-30 shadow-2xl">
          {/* Decorative Top Bar */}
          <div className="h-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500" />

          <div className="flex items-center justify-between p-4">
            {/* User Info */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3 flex-1"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg"
              >
                <User className="w-6 h-6" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">
                  {user?.name?.split(' ')[0] || 'Técnico'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-xs text-blue-100">Online</p>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMenu(!showMenu)}
                className="relative p-2.5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors border border-white/10"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white"
                  >
                    {unreadCount}
                  </motion.div>
                )}
              </motion.button>

              {/* Settings */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowProfile(!showProfile)}
                className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors border border-white/10"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Dropdown */}
      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowProfile(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-20 right-4 bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-gray-100 w-80"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                    <User className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{user?.name}</p>
                    <p className="text-xs text-blue-100">{user?.role}</p>
                  </div>
                </div>
                <p className="text-sm text-blue-100">{user?.email}</p>
              </div>

              {/* Menu Items */}
              <div className="p-3">
                <button
                  onClick={() => {
                    setShowProfile(false)
                    navigate('/mobile/profile')
                  }}
                  className="w-full px-4 py-3.5 text-left hover:bg-gray-50 rounded-2xl transition-colors flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Meu Perfil</p>
                    <p className="text-xs text-gray-500">Ver e editar informações</p>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3.5 text-left hover:bg-red-50 rounded-2xl transition-colors flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-600">Sair</p>
                    <p className="text-xs text-red-400">Desconectar da conta</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notifications Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <h3 className="text-lg font-bold">Notificações</h3>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Sem notificações</p>
                    <p className="text-sm text-gray-400 mt-1">Você está em dia!</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100"
                    >
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(notif.created_at).toLocaleString('pt-BR')}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content with Premium Padding */}
      <div className="p-4">
        <Outlet />
      </div>

      {/* Premium Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        {/* Glass Effect Background */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl">
          <div className="flex items-center justify-around px-2 py-3">
            {mainTabs.map((tab) => {
              const isActive = isActiveTab(tab.path)
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  whileTap={{ scale: 0.9 }}
                  className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all flex-1"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 bg-gradient-to-br ${getTabColor(tab)} rounded-2xl opacity-10`}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  <motion.div
                    className={`relative ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <tab.icon
                      className="w-6 h-6"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r ${getTabColor(tab)} rounded-full`}
                      />
                    )}
                  </motion.div>

                  <span
                    className={`text-xs font-semibold transition-colors ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {tab.label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Decorative Bottom Bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      </div>
    </div>
  )
}

export default MobileLayout
