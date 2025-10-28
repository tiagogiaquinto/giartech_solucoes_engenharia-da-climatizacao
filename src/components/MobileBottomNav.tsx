import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, FileText, Plus, Bell, User } from 'lucide-react'

interface NavItem {
  icon: React.ReactNode
  label: string
  path: string
  badge?: number
}

export function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems: NavItem[] = [
    {
      icon: <Home className="h-6 w-6" />,
      label: 'Início',
      path: '/dashboard'
    },
    {
      icon: <FileText className="h-6 w-6" />,
      label: 'OSs',
      path: '/service-orders'
    },
    {
      icon: <Plus className="h-8 w-8" />,
      label: 'Criar',
      path: '/service-orders/create'
    },
    {
      icon: <Bell className="h-6 w-6" />,
      label: 'Alertas',
      path: '/notifications',
      badge: 3
    },
    {
      icon: <User className="h-6 w-6" />,
      label: 'Perfil',
      path: '/profile'
    }
  ]

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const active = isActive(item.path)
          const isCenter = index === 2

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 relative ${
                isCenter ? 'transform -translate-y-6' : ''
              }`}
            >
              {isCenter ? (
                // Centro - Botão especial
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-lg flex items-center justify-center text-white">
                  {item.icon}
                </div>
              ) : (
                // Outros itens
                <>
                  <div className={`relative ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                    {item.icon}
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${active ? 'text-blue-600' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
