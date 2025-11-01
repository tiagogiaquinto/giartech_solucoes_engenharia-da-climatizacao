import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  Calendar,
  ClipboardList,
  BookOpen,
  MapPin,
  User,
  LogOut,
  Settings
} from 'lucide-react'
import { useUser } from '../../contexts/UserContext'

const MobileLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useUser()
  const [showProfile, setShowProfile] = useState(false)

  const mainTabs = [
    { id: 'home', label: 'Início', icon: Home, path: '/mobile' },
    { id: 'agenda', label: 'Agenda', icon: Calendar, path: '/mobile/agenda' },
    { id: 'orders', label: 'OS', icon: ClipboardList, path: '/mobile/orders' },
    { id: 'library', label: 'Biblioteca', icon: BookOpen, path: '/mobile/library' },
    { id: 'routes', label: 'Rotas', icon: MapPin, path: '/mobile/routes' }
  ]

  const isActiveTab = (path: string) => {
    if (path === '/mobile') {
      return location.pathname === '/mobile'
    }
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white sticky top-0 z-30 shadow-xl">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm">Olá, {user?.name?.split(' ')[0] || 'Técnico'}</p>
              <p className="text-xs text-blue-100">{user?.role || 'Equipe Externa'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Profile Dropdown */}
      {showProfile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 right-4 bg-white rounded-2xl shadow-2xl z-40 overflow-hidden"
        >
          <div className="p-4 border-b">
            <p className="font-bold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                setShowProfile(false)
                navigate('/mobile/profile')
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
            >
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-gray-900">Meu Perfil</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3 text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold">Sair</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Click outside to close */}
      {showProfile && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowProfile(false)}
        />
      )}

      {/* Main Content */}
      <div className="p-4">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-30">
        <div className="flex items-center justify-around px-2 py-3">
          {mainTabs.map((tab) => {
            const isActive = isActiveTab(tab.path)
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all flex-1"
              >
                <motion.div
                  className={`relative ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  <tab.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                    />
                  )}
                </motion.div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MobileLayout
