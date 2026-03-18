import React from 'react'
import { NavLink, useNavigate, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, MessageSquarePlus, Building2,
  Users, LogOut, ChevronRight, BarChart2, History, Package
} from 'lucide-react'
import { usePortal } from '../../contexts/PortalContext'
import { Loader2 } from 'lucide-react'

interface PortalLayoutProps {
  children: React.ReactNode
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { portalUser, isLoading, isAuthenticated, logout } = usePortal()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />
  }

  const isCliente = portalUser?.role === 'cliente'

  const clienteLinks = [
    { to: '/portal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/portal/inventario', icon: Package, label: 'Inventário' },
    { to: '/portal/documentos', icon: FileText, label: 'Documentos' },
    { to: '/portal/solicitar', icon: MessageSquarePlus, label: 'Solicitar Serviço' },
  ]

  const parceiroLinks = [
    { to: '/portal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/portal/indicacoes', icon: BarChart2, label: 'Indicações' },
    { to: '/portal/historico', icon: History, label: 'Histórico' },
  ]

  const links = isCliente ? clienteLinks : parceiroLinks

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCliente ? 'bg-blue-100' : 'bg-green-100'}`}>
              {isCliente
                ? <Building2 size={20} className="text-blue-600" />
                : <Users size={20} className="text-green-600" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {isCliente ? 'Portal Cliente' : 'Portal Parceiro'}
              </p>
              <p className="text-sm font-semibold text-gray-800 truncate">{portalUser?.full_name}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? (isCliente ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700')
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => { logout(); navigate('/portal/login') }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
