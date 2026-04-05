import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, X, AlertTriangle, LogOut } from 'lucide-react'
import { useImpersonation } from '../contexts/ImpersonationContext'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const ImpersonationBar: React.FC = () => {
  const { session, isImpersonating, endImpersonation, loading } = useImpersonation()

  const elapsed = session
    ? formatDistanceToNow(new Date(session.startedAt), { addSuffix: false, locale: ptBR })
    : ''

  return (
    <AnimatePresence>
      {isImpersonating && session && (
        <motion.div
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-2.5"
          style={{
            background: 'linear-gradient(90deg, #92400e 0%, #b45309 50%, #92400e 100%)',
            backgroundSize: '200% 100%',
            borderBottom: '1px solid rgba(251,191,36,0.4)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-amber-900/60 rounded-full px-2.5 py-1">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Eye size={13} className="text-amber-300" />
              </motion.div>
              <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">Modo Visualização</span>
            </div>
            <span className="text-amber-100 text-sm">
              Você está vendo o sistema como{' '}
              <span className="font-semibold text-white">{session.targetName || session.targetEmail}</span>
              <span className="text-amber-300 ml-1">({session.targetRole})</span>
            </span>
            <span className="text-amber-400/70 text-xs hidden sm:inline">· há {elapsed}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-amber-300/70 text-xs">
              <AlertTriangle size={11} />
              <span>Esta sessão não é auditada pelo usuário</span>
            </div>
            <button
              onClick={endImpersonation}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(251,191,36,0.4)',
                color: '#fde68a',
              }}
            >
              <LogOut size={12} />
              Sair da Visualização
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
