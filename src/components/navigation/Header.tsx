import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Search, Bell, User, Menu, X, Crown } from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { motion, AnimatePresence } from 'framer-motion'
import { NotificationCenter } from '../NotificationCenter'

const Header = () => {
  const { user, isPremium } = useUser()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Dashboard'
    if (path.includes('/service-orders')) {
      if (path.includes('/create')) return 'Nova Ordem de Serviço'
      if (path.includes('/')) return 'Detalhes da OS'
      return 'Ordens de Serviço'
    }
    if (path.includes('/inventory')) {
      if (path.includes('/create')) return 'Novo Item'
      if (path.includes('/')) return 'Detalhes do Item'
      return 'Estoque'
    }
    if (path.includes('/service-catalog')) {
      if (path.includes('/create')) return 'Novo Serviço'
      if (path.includes('/')) return 'Detalhes do Serviço'
      return 'Catálogo de Serviços'
    }
    if (path === '/reports') return 'Relatórios'
    if (path === '/settings') return 'Configurações'
    if (path === '/users') return 'Usuários'
    if (path === '/client-management') return 'Gestão de Clientes'
    if (path === '/financial') return 'Integração Financeira'
    if (path === '/visual-customization') return 'Personalização Visual'
    if (path === '/access-codes') return 'Gestão de Acesso'
    
    return 'Sistema de OS'
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm ml-64">
      <div className="h-16 px-4 flex items-center justify-between">
        
        <h1 className="text-lg font-semibold text-gray-900">
          {getPageTitle()}
        </h1>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-64 pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <NotificationCenter />

          <button 
            className="flex items-center space-x-2"
            onClick={() => navigate('/profile')}
          >
            {user?.avatar ? (
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
                {isPremium && (
                  <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-3 h-3 border border-white">
                    <Crown className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <User className="h-4 w-4" />
              </div>
            )}
            
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu - Removed */}
      <AnimatePresence>
        {false && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-t border-gray-100 shadow-lg"
          >
            <nav className="py-4">
              {[
                { path: '/', label: 'Dashboard' },
                { path: '/service-orders', label: 'Ordens de Serviço' },
                { path: '/inventory', label: 'Estoque' },
                { path: '/service-catalog', label: 'Catálogo de Serviços' },
                { path: '/reports', label: 'Relatórios' },
                { path: '/settings', label: 'Configurações' },
                { path: '/pricing', label: 'Planos e Preços' }
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full px-6 py-3 text-left ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              {/* Upgrade Button */}
              {!isPremium && (
                <div className="px-6 py-3">
                  <Link
                    to="/pricing"
                    className="w-full block text-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg"
                  >
                    Fazer Upgrade
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header