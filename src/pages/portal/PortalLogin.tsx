import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Eye, EyeOff, Building2, Briefcase, UserCheck, Wrench, ArrowLeft, Mail, Lock } from 'lucide-react'
import { usePortal } from '../../contexts/PortalContext'

type PortalType = 'cliente' | 'parceiro'
type NavType = 'cliente' | 'parceiro' | 'admin' | 'tecnico'

interface PortalConfig {
  tipo: PortalType
  label: string
  description: string
  icon: React.ReactNode
  color: string
  iconBg: string
  btnClass: string
  cardAccent: string
}

const PORTAL_CONFIG: Record<PortalType, PortalConfig> = {
  cliente: {
    tipo: 'cliente',
    label: 'Portal do Cliente',
    description: 'Acompanhe suas ordens de servico, documentos e historico',
    icon: <UserCheck size={28} />,
    color: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
    btnClass: 'bg-amber-500 hover:bg-amber-600',
    cardAccent: 'border-amber-500/20',
  },
  parceiro: {
    tipo: 'parceiro',
    label: 'Portal do Parceiro',
    description: 'Acesse indicacoes, comissoes e historico de negocios',
    icon: <Briefcase size={28} />,
    color: 'text-orange-500',
    iconBg: 'bg-orange-500/10',
    btnClass: 'bg-orange-500 hover:bg-orange-600',
    cardAccent: 'border-orange-500/20',
  },
}

interface NavTab {
  id: NavType
  label: string
  icon: React.ReactNode
  activeClass: string
  redirectTo?: string
}

const NAV_TABS: NavTab[] = [
  {
    id: 'admin',
    label: 'Administrativo',
    icon: <Building2 size={13} />,
    activeClass: 'bg-blue-500/15 text-blue-400 font-semibold',
    redirectTo: '/login',
  },
  {
    id: 'tecnico',
    label: 'Tecnico',
    icon: <Wrench size={13} />,
    activeClass: 'bg-emerald-500/15 text-emerald-400 font-semibold',
    redirectTo: '/login',
  },
  {
    id: 'cliente',
    label: 'Cliente',
    icon: <UserCheck size={13} />,
    activeClass: 'bg-amber-500/15 text-amber-400 font-semibold',
  },
  {
    id: 'parceiro',
    label: 'Parceiro',
    icon: <Briefcase size={13} />,
    activeClass: 'bg-orange-500/15 text-orange-400 font-semibold',
  },
]

export default function PortalLogin() {
  const [searchParams] = useSearchParams()
  const tipoParam = (searchParams.get('tipo') as PortalType) || 'cliente'
  const config = PORTAL_CONFIG[tipoParam] ?? PORTAL_CONFIG.cliente

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isAuthenticated, isLoading } = usePortal()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/portal/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/portal/dashboard')
    } catch (err: any) {
      setError(err.message || 'Credenciais invalidas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleNavTab = (tab: NavTab) => {
    if (tab.redirectTo) {
      navigate(tab.redirectTo)
      return
    }
    if (tab.id === 'cliente' || tab.id === 'parceiro') {
      navigate(`/portal/login?tipo=${tab.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-blue-700/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="w-full max-w-sm z-10"
      >
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors text-sm mb-7"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="text-center mb-7">
          <div className={`inline-flex w-16 h-16 ${config.iconBg} rounded-2xl items-center justify-center mb-3 ${config.color}`}>
            {config.icon}
          </div>
          <h1 className="text-2xl font-bold text-white">{config.label}</h1>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">{config.description}</p>
        </div>

        <div className={`bg-white/4 backdrop-blur-xl border ${config.cardAccent} border-white/8 rounded-3xl p-6 shadow-2xl`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-3 rounded-xl text-sm"
              >
                <span>{error}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/8 rounded-xl text-white placeholder-gray-700 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/7 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/8 rounded-xl text-white placeholder-gray-700 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/7 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className={`w-full py-3 px-4 ${config.btnClass} disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg mt-1`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Entrando...
                </>
              ) : `Entrar no ${config.label}`}
            </motion.button>
          </form>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1">
          {NAV_TABS.map((tab, idx) => (
            <React.Fragment key={tab.id}>
              {idx > 0 && <div className="w-px h-4 bg-white/10" />}
              <button
                onClick={() => handleNavTab(tab)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${
                  tipoParam === tab.id
                    ? tab.activeClass
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        <p className="text-center text-xs text-gray-700 mt-4">
          Acesso restrito. Contate a equipe comercial para cadastro.
        </p>
        <p className="text-center text-xs text-gray-600 mt-1">
          Senha padrao de primeiro acesso: <span className="text-gray-400 font-mono">GS2026</span>
        </p>
      </motion.div>
    </div>
  )
}
