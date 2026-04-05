import React, { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Home, Mail, AlertTriangle } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { supabase } from '../lib/supabase'

interface AccessDenied403Props {
  moduleCode?: string
}

const AccessDenied403: React.FC<AccessDenied403Props> = ({ moduleCode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, redirectPath } = useUser()
  const loggedRef = useRef(false)

  const route = (location.state as { attemptedRoute?: string })?.attemptedRoute ?? location.pathname

  useEffect(() => {
    if (loggedRef.current) return
    loggedRef.current = true

    if (!user) return

    supabase.from('security_audit_logs').insert({
      user_id: user.id,
      user_email: user.email ?? '',
      user_name: user.full_name ?? user.name ?? '',
      route_attempted: route,
      module_code: moduleCode ?? null,
      user_agent: navigator.userAgent
    }).then()
  }, [user, route, moduleCode])

  const handleGoHome = () => navigate(redirectPath ?? '/')

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060a12 0%, #0a1628 50%, #060c1a 100%)' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #1d4ed8 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #1e3a8a 0%, transparent 70%)' }} />

        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: '#3b82f6',
              opacity: Math.random() * 0.4 + 0.1
            }}
            animate={{ opacity: [0.1, 0.5, 0.1], scale: [1, 1.5, 1] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}

        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}>

        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 120 }}>

          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />

          <div className="relative w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(30,58,138,0.8) 0%, rgba(29,78,216,0.6) 100%)',
              border: '1px solid rgba(59,130,246,0.4)',
              boxShadow: '0 0 40px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
            }}>
            <Shield
              className="w-14 h-14"
              style={{ color: '#60a5fa', filter: 'drop-shadow(0 0 12px rgba(96,165,250,0.8))' }}
            />
          </div>
        </motion.div>

        <motion.div
          className="mb-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}>
          <AlertTriangle className="inline w-3 h-3 mr-1.5 -mt-0.5" />
          Erro 403 — Acesso Negado
        </motion.div>

        <motion.h1
          className="text-4xl font-bold mb-4 mt-4"
          style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}>
          Acesso Restrito
        </motion.h1>

        <motion.p
          className="text-base leading-relaxed mb-8"
          style={{ color: '#94a3b8' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}>
          Você não possui as permissões necessárias para visualizar esta área.
          <br />
          Se acredita que isso é um erro, entre em contato com o Administrador do sistema.
        </motion.p>

        {route && (
          <motion.div
            className="w-full mb-8 px-4 py-3 rounded-xl text-sm font-mono"
            style={{
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(30,41,59,0.8)',
              color: '#64748b'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}>
            <span style={{ color: '#475569' }}>Rota bloqueada: </span>
            <span style={{ color: '#ef4444' }}>{route}</span>
          </motion.div>
        )}

        <motion.div
          className="flex flex-col sm:flex-row gap-3 w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}>

          <button
            onClick={handleGoHome}
            className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
              border: '1px solid rgba(59,130,246,0.3)'
            }}>
            <Home className="w-4 h-4" />
            Voltar para o Início
          </button>

          <a
            href="mailto:diretor.giartechsolucoes@gmail.com"
            className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(30,41,59,0.6)',
              color: '#94a3b8',
              border: '1px solid rgba(51,65,85,0.6)'
            }}>
            <Mail className="w-4 h-4" />
            Contatar Administrador
          </a>
        </motion.div>

        <motion.div
          className="mt-10 flex items-center gap-2 text-xs"
          style={{ color: '#334155' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Esta tentativa de acesso foi registrada para auditoria de segurança
        </motion.div>
      </motion.div>
    </div>
  )
}

export default AccessDenied403
