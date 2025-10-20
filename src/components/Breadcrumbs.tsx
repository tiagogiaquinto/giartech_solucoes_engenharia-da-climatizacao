import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'

const Breadcrumbs = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  const breadcrumbNames: { [key: string]: string } = {
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    projects: 'Projetos',
    settings: 'Configurações',
    profile: 'Perfil',
    calendar: 'Agenda',
    monitoring: 'Monitoramento',
    inventory: 'Estoque',
    'service-orders': 'Ordens de Serviço',
    'service-orders-integrated': 'OS Integrado',
    'financial': 'Integração Financeira',
    'access-management': 'Gestão de Acessos',
    'client-management': 'Gestão de Clientes',
    'visual-customization': 'Personalização Visual'
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 backdrop-blur-sm border-b border-gray-100/50 px-4 py-2"
    >
      <div className="flex items-center space-x-2 text-sm max-w-7xl mx-auto">
        <Link
          to="/"
          className="flex items-center text-gray-500 hover:text-blue-600 transition-colors p-1.5 rounded-md hover:bg-blue-50"
        >
          <Home className="h-3.5 w-3.5" />
        </Link>

        {pathnames.map((pathname, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1

          return (
            <React.Fragment key={pathname}>
              <ChevronRight className="h-3 w-3 text-gray-400" />
              {isLast ? (
                <span className="text-gray-900 font-medium px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-xs border border-blue-100">
                  {breadcrumbNames[pathname] || pathname}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded text-xs hover:bg-blue-50"
                >
                  {breadcrumbNames[pathname] || pathname}
                </Link>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </motion.nav>
  )
}

export default Breadcrumbs