import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, AlertCircle,
  Building2, Wrench, UserCheck, Briefcase, ChevronRight, ArrowLeft
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { useNavigate } from 'react-router-dom'

type AccessType = 'admin' | 'technician' | 'client' | 'partner'

interface AccessOption {
  id: AccessType
  label: string
  description: string
  icon: React.ReactNode
  color: string
  borderColor: string
  iconBg: string
}

const ACCESS_OPTIONS: AccessOption[] = [
  {
    id: 'admin',
    label: 'Administrativo',
    description: 'Diretores, gerentes e equipe administrativa',
    icon: <Building2 className="w-6 h-6" />,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40 hover:border-blue-400',
    iconBg: 'bg-blue-500/15',
  },
  {
    id: 'partner',
    label: 'Parceiro',
    description: 'Parceiros comerciais e revendedores',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'text-orange-400',
    borderColor: 'border-orange-500/40 hover:border-orange-400',
    iconBg: 'bg-orange-500/15',
  },
  {
    id: 'client',
    label: 'Cliente',
    description: 'Clientes para acompanhamento de servicos',
    icon: <UserCheck className="w-6 h-6" />,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40 hover:border-amber-400',
    iconBg: 'bg-amber-500/15',
  },
  {
    id: 'technician',
    label: 'Tecnico',
    description: 'Tecnicos de campo e executores de ordens de servico',
    icon: <Wrench className="w-6 h-6" />,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400',
    iconBg: 'bg-emerald-500/15',
  },
]

const getRedirectPath = (role: string): string => {
  switch (role) {
    case 'technician': return '/tecnico'
    case 'viewer': return '/portal/dashboard'
    default: return '/'
  }
}

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

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!isLoading && user && profile) {
      navigate(getRedirectPath(profile.role), { replace: true })
    }
  }, [user, profile, isLoading, navigate])

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
      navigate('/portal/login?tipo=cliente')
      return
    }
    if (type === 'partner') {
      navigate('/portal/login?tipo=parceiro')
      return
    }
    setAccessType(type)
    setError('')
    setEmail('')
    setPassword('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    )
  }

  const selectedOption = ACCESS_OPTIONS.find(o => o.id === accessType)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative"
      style={{ background: '#0e1219' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-80 -right-80 w-[800px] h-[800px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,98,246,0.10) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-80 -left-80 w-[800px] h-[800px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,209,255,0.07) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,129,73,0.05) 0%, transparent 70%)' }} />
      </div>

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
              <svg width="80" height="64" viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0"  y="36" width="18" height="28" rx="5" transform="rotate(-35 10 44)"  fill="#ff8149" />
                <rect x="26" y="22" width="18" height="38" rx="5" transform="rotate(-35 35 36)" fill="#00d1ff" />
                <rect x="52" y="4"  width="18" height="52" rx="5" transform="rotate(-35 61 24)" fill="#0062f6" />
              </svg>
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
              className="text-4xl font-bold text-white mb-1 tracking-tight"
              style={{ fontFamily: 'Questrial, Inter, sans-serif' }}
            >
              Giartech
            </motion.h1>
            <motion.p
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm"
              style={{ color: 'rgba(0,209,255,0.65)' }}
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
                <svg width="44" height="36" viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0"  y="36" width="18" height="28" rx="5" transform="rotate(-35 10 44)"  fill="#ff8149" />
                  <rect x="26" y="22" width="18" height="38" rx="5" transform="rotate(-35 35 36)" fill="#00d1ff" />
                  <rect x="52" y="4"  width="18" height="52" rx="5" transform="rotate(-35 61 24)" fill="#0062f6" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Questrial, Inter, sans-serif' }}>Como deseja acessar?</h1>
              <p className="text-gray-500 text-sm mt-1">Selecione o tipo de acesso para continuar</p>
            </div>

            <div className="space-y-3">
              {ACCESS_OPTIONS.map((option, idx) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectAccess(option.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 group border border-white/10 hover:border-white/20"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                >
                  <div className={`flex-shrink-0 w-12 h-12 ${option.iconBg} rounded-xl flex items-center justify-center ${option.color}`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{option.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{option.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-gray-700 mt-6">
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
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <div className="h-px flex-1 bg-white/8" />
              {selectedOption && (
                <span className={`text-xs font-medium ${selectedOption.color}`}>
                  {selectedOption.label}
                </span>
              )}
            </div>

            <div className="text-center mb-7">
              {selectedOption && (
                <div className={`inline-flex w-14 h-14 ${selectedOption.iconBg} rounded-2xl items-center justify-center mb-3 ${selectedOption.color}`}>
                  {React.cloneElement(selectedOption.icon as React.ReactElement, { className: 'w-7 h-7' })}
                </div>
              )}
              <h1 className="text-xl font-bold text-white">Bem-vindo</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {accessType === 'technician'
                  ? 'Acesse sua conta de tecnico'
                  : 'Acesse o painel administrativo'}
              </p>

            </div>

            <div className="bg-white/4 backdrop-blur-xl border border-white/8 rounded-3xl p-6 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-3 rounded-xl text-sm"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
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
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/8 rounded-xl text-white placeholder-gray-700 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/7 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
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

            <p className="text-center text-xs text-gray-700 mt-5">
              Acesso restrito a usuarios cadastrados pela empresa.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LoginPage
