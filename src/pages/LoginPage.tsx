import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, AlertCircle,
  Building2, Wrench, UserCheck, Briefcase, ChevronRight, ArrowLeft, Sun, Moon
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { useNavigate } from 'react-router-dom'

type AccessType = 'admin' | 'technician' | 'client' | 'partner'
type Theme = 'dark' | 'light'

interface AccessOption {
  id: AccessType
  label: string
  description: string
  icon: React.ReactNode
  colorDark: string
  colorLight: string
  iconBgDark: string
  iconBgLight: string
}

const ACCESS_OPTIONS: AccessOption[] = [
  {
    id: 'admin',
    label: 'Administrativo',
    description: 'Diretores, gerentes e equipe administrativa',
    icon: <Building2 className="w-6 h-6" />,
    colorDark: 'text-blue-400',
    colorLight: 'text-blue-600',
    iconBgDark: 'bg-blue-500/15',
    iconBgLight: 'bg-blue-50',
  },
  {
    id: 'partner',
    label: 'Parceiro',
    description: 'Parceiros comerciais e revendedores',
    icon: <Briefcase className="w-6 h-6" />,
    colorDark: 'text-orange-400',
    colorLight: 'text-orange-600',
    iconBgDark: 'bg-orange-500/15',
    iconBgLight: 'bg-orange-50',
  },
  {
    id: 'client',
    label: 'Cliente',
    description: 'Clientes para acompanhamento de servicos',
    icon: <UserCheck className="w-6 h-6" />,
    colorDark: 'text-amber-400',
    colorLight: 'text-amber-600',
    iconBgDark: 'bg-amber-500/15',
    iconBgLight: 'bg-amber-50',
  },
  {
    id: 'technician',
    label: 'Tecnico',
    description: 'Tecnicos de campo e executores de ordens de servico',
    icon: <Wrench className="w-6 h-6" />,
    colorDark: 'text-emerald-400',
    colorLight: 'text-emerald-600',
    iconBgDark: 'bg-emerald-500/15',
    iconBgLight: 'bg-emerald-50',
  },
]

const getRedirectPath = (role: string): string => {
  switch (role) {
    case 'technician': return '/tecnico'
    case 'viewer': return '/portal/dashboard'
    default: return '/'
  }
}

const GiartechLogo = ({ size = 80 }: { size?: number }) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0"  y="36" width="18" height="28" rx="5" transform="rotate(-35 10 44)"  fill="#ff8149" />
    <rect x="26" y="22" width="18" height="38" rx="5" transform="rotate(-35 35 36)" fill="#00d1ff" />
    <rect x="52" y="4"  width="18" height="52" rx="5" transform="rotate(-35 61 24)" fill="#0062f6" />
  </svg>
)

const LoginPage = () => {
  const { login, user, profile, isLoading } = useUser()
  const navigate = useNavigate()
  const [accessType, setAccessType] = useState<AccessType | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [splashDone, setSplashDone] = useState(false)
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('login-theme')
    return (saved === 'light' || saved === 'dark') ? saved : 'dark'
  })

  const dark = theme === 'dark'

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!isLoading && user && profile) {
      navigate(getRedirectPath(profile.role), { replace: true })
    }
  }, [user, profile, isLoading, navigate])

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('login-theme', next)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError('E-mail ou senha incorretos.')
      } else if (msg.includes('Email not confirmed')) {
        setError('E-mail nao confirmado. Verifique sua caixa de entrada.')
      } else {
        setError(msg || 'Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAccess = (type: AccessType) => {
    if (type === 'client') {
      window.location.assign('/portal/login?tipo=cliente')
      return
    }
    if (type === 'partner') {
      window.location.assign('/portal/login?tipo=parceiro')
      return
    }
    setAccessType(type)
    setError('')
    setEmail('')
    setPassword('')
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-[#0a0f1a]' : 'bg-slate-100'}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    )
  }

  const selectedOption = ACCESS_OPTIONS.find(o => o.id === accessType)

  const bg = dark
    ? 'bg-[#0e1219]'
    : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100'

  const cardBg = dark
    ? 'bg-white/[0.04] border-white/[0.08] shadow-2xl'
    : 'bg-white border-slate-200 shadow-xl'

  const optionBg = dark
    ? { normal: 'rgba(255,255,255,0.05)', hover: 'rgba(255,255,255,0.09)' }
    : { normal: 'rgba(241,245,249,1)', hover: 'rgba(226,232,240,1)' }

  const textPrimary   = dark ? 'text-white'    : 'text-slate-800'
  const textSecondary = dark ? 'text-gray-500' : 'text-slate-500'
  const textMuted     = dark ? 'text-gray-700' : 'text-slate-400'
  const optionBorder  = dark ? 'border border-white/10 hover:border-white/20' : 'border border-slate-200 hover:border-blue-300'
  const labelText     = dark ? 'text-gray-500' : 'text-slate-500'
  const inputClass    = dark
    ? 'bg-white/5 border-white/8 text-white placeholder-gray-700 focus:border-blue-500/50 focus:bg-white/7'
    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:bg-white'
  const dividerColor  = dark ? 'bg-white/8' : 'bg-slate-200'
  const iconToggle    = dark ? 'text-gray-500 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700'

  return (
    <motion.div
      className={`min-h-screen flex items-center justify-center p-4 overflow-hidden relative transition-colors duration-500 ${bg}`}
      animate={{ backgroundColor: dark ? '#0e1219' : undefined }}
    >
      {dark && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-80 -right-80 w-[800px] h-[800px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(0,98,246,0.10) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-80 -left-80 w-[800px] h-[800px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(0,209,255,0.07) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(255,129,73,0.05) 0%, transparent 70%)' }} />
        </div>
      )}
      {!dark && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-60 -right-60 w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(0,98,246,0.07) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(0,209,255,0.05) 0%, transparent 70%)' }} />
        </div>
      )}

      <button
        onClick={toggleTheme}
        className={`absolute top-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${iconToggle} ${dark ? 'bg-white/8 hover:bg-white/14' : 'bg-white hover:bg-slate-100 shadow-sm border border-slate-200'}`}
        aria-label="Alternar tema"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence mode="wait">
        {!splashDone ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.35 }}
            className="text-center z-10"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative mb-8 inline-block"
            >
              <GiartechLogo size={80} />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl blur-2xl"
                style={{ background: 'linear-gradient(135deg, #0062f6, #00d1ff)' }}
              />
            </motion.div>
            <motion.h1
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`text-4xl font-bold mb-1 tracking-tight ${textPrimary}`}
              style={{ fontFamily: 'Questrial, Inter, sans-serif' }}
            >
              Giartech
            </motion.h1>
            <motion.p
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm"
              style={{ color: dark ? 'rgba(0,209,255,0.65)' : '#0062f6' }}
            >
              Solucoes
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="flex justify-center gap-2 mt-10"
            >
              {[0, 0.15, 0.3].map((d, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: d }}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#0062f6' }}
                />
              ))}
            </motion.div>
          </motion.div>
        ) : !accessType ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="w-full max-w-md z-10"
          >
            <div className="text-center mb-8">
              <div className="inline-flex mb-4">
                <GiartechLogo size={44} />
              </div>
              <h1 className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'Questrial, Inter, sans-serif' }}>
                Como deseja acessar?
              </h1>
              <p className={`text-sm mt-1 ${textSecondary}`}>Selecione o tipo de acesso para continuar</p>
            </div>

            <div className="space-y-3">
              {ACCESS_OPTIONS.map((option) => (
                <motion.button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectAccess(option.id)}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 group ${optionBorder}`}
                  style={{ background: optionBg.normal }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = optionBg.hover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = optionBg.normal }}
                >
                  <div className={`flex-shrink-0 w-12 h-12 ${dark ? option.iconBgDark : option.iconBgLight} rounded-xl flex items-center justify-center ${dark ? option.colorDark : option.colorLight}`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${textPrimary}`}>{option.label}</p>
                    <p className={`text-xs mt-0.5 truncate ${textSecondary}`}>{option.description}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${dark ? 'text-gray-500 group-hover:text-gray-300' : 'text-slate-400 group-hover:text-slate-600'}`} />
                </motion.button>
              ))}
            </div>

            <p className={`text-center text-xs mt-6 ${textMuted}`}>
              Acesso restrito a usuarios cadastrados pela empresa.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="w-full max-w-sm z-10"
          >
            <div className="flex items-center gap-3 mb-7">
              <button
                onClick={() => { setAccessType(null); setError('') }}
                className={`flex items-center gap-1.5 transition-colors text-sm ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <div className={`h-px flex-1 ${dividerColor}`} />
              {selectedOption && (
                <span className={`text-xs font-medium ${dark ? selectedOption.colorDark : selectedOption.colorLight}`}>
                  {selectedOption.label}
                </span>
              )}
            </div>

            <div className="text-center mb-7">
              {selectedOption && (
                <div className={`inline-flex w-14 h-14 ${dark ? selectedOption.iconBgDark : selectedOption.iconBgLight} rounded-2xl items-center justify-center mb-3 ${dark ? selectedOption.colorDark : selectedOption.colorLight}`}>
                  {React.cloneElement(selectedOption.icon as React.ReactElement, { className: 'w-7 h-7' })}
                </div>
              )}
              <h1 className={`text-xl font-bold ${textPrimary}`}>Bem-vindo</h1>
              <p className={`text-sm mt-0.5 ${textSecondary}`}>
                {accessType === 'technician'
                  ? 'Acesse sua conta de tecnico'
                  : 'Acesse o painel administrativo'}
              </p>
            </div>

            <div className={`backdrop-blur-xl border rounded-3xl p-6 ${cardBg}`}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-3.5 py-3 rounded-xl text-sm"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelText}`}>
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${dark ? 'text-gray-600' : 'text-slate-400'}`} />
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none transition-all ${inputClass}`}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelText}`}>
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${dark ? 'text-gray-600' : 'text-slate-400'}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-3 border rounded-xl text-sm focus:outline-none transition-all ${inputClass}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${dark ? 'text-gray-600 hover:text-gray-400' : 'text-slate-400 hover:text-slate-600'}`}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 mt-1"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Entrando...
                    </>
                  ) : 'Entrar'}
                </motion.button>
              </form>
            </div>

            <p className={`text-center text-xs mt-5 ${textMuted}`}>
              Acesso restrito a usuarios cadastrados pela empresa.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default LoginPage
