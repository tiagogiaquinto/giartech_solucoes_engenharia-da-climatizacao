import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  BarChart3, 
  Wrench,
  Calendar,
  DollarSign,
  Shield,
  Users,
  Palette,
  Monitor,
  Package,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react'

const WebSidebar = () => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigationItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Visão geral dos projetos'
    },
    {
      id: 'analytics',
      path: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
      description: 'Relatórios e análises'
    },
    {
      id: 'service-orders-integrated',
      path: '/service-orders-integrated',
      icon: Wrench,
      label: 'OS Integrado',
      description: 'Sistema integrado de OS'
    },
    {
      id: 'calendar',
      path: '/calendar',
      icon: Calendar,
      label: 'Agenda',
      description: 'Compromissos e eventos'
    },
    {
      id: 'financial',
      path: '/financial',
      icon: DollarSign,
      label: 'Financeiro',
      description: 'Integração financeira'
    },
    {
      id: 'client-management',
      path: '/client-management',
      icon: Users,
      label: 'Clientes',
      description: 'Gestão de clientes PF/PJ'
    },
    {
      id: 'access-management',
      path: '/access-management',
      icon: Shield,
      label: 'Acessos',
      description: 'Controle de permissões'
    },
    {
      id: 'monitoring',
      path: '/monitoring',
      icon: Monitor,
      label: 'Monitoramento',
      description: 'Configurar monitoramento'
    },
    {
      id: 'inventory',
      path: '/inventory',
      icon: Package,
      label: 'Estoque',
      description: 'Materiais e produtos'
    },
    {
      id: 'service-orders',
      path: '/service-orders',
      icon: ClipboardList,
      label: 'Ordens de Serviço',
      description: 'Gestão de OS'
    },
    {
      id: 'visual-customization',
      path: '/visual-customization',
      icon: Palette,
      label: 'Personalização',
      description: 'Temas e cores'
    },
    {
      id: 'settings',
      path: '/settings',
      icon: Settings,
      label: 'Configurações',
      description: 'Preferências do sistema'
    }
  ]

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0, width: isCollapsed ? 80 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GT</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">GiarTech</h1>
                <p className="text-xs text-gray-500">Sistema Integrado</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {/* Home Link */}
          <Link
            to="/"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <span className="font-medium">Início</span>
                <p className="text-xs text-gray-500 truncate">Página inicial</p>
              </div>
            )}
          </Link>

          {/* Divider */}
          <div className="border-t border-gray-200 my-3"></div>

          {/* Navigation Items */}
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{item.label}</span>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  </div>
                )}

                {/* Active Indicator */}
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="activeSidebarTab"
                    className="w-1 h-6 bg-blue-600 rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="text-center">
            <p className="text-xs text-gray-500">GiarTech v2.0</p>
            <p className="text-xs text-gray-400">Premium Edition</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default WebSidebar