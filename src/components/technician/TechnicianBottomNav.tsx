import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, MessageCircle, Calendar, User } from 'lucide-react'

const navItems = [
  { id: 'home', path: '/tecnico', icon: Home, label: 'Roteiro' },
  { id: 'chat', path: '/tecnico/chat', icon: MessageCircle, label: 'Chat' },
  { id: 'agenda', path: '/tecnico/agenda', icon: Calendar, label: 'Agenda' },
  { id: 'perfil', path: '/tecnico/perfil', icon: User, label: 'Perfil' }
]

const TechnicianBottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/tecnico') {
      return location.pathname === '/tecnico' || location.pathname === '/tecnico/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.path)
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-2 transition-all active:scale-95"
            >
              {active && (
                <motion.div
                  layoutId="technicianNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-b-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                className={`w-6 h-6 mb-1 transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors ${
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
