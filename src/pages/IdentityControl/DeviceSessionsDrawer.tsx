import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Monitor, Smartphone, Globe, Wifi, WifiOff,
  LogOut, RefreshCw, Shield, CheckCircle, AlertCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AnyProfile } from './types'

interface Session {
  id: string
  device_label: string
  user_agent: string | null
  ip_address: string | null
  created_at: string
  last_seen_at: string
  is_active: boolean
}

interface Props {
  profile: AnyProfile
  onClose: () => void
}

function getDeviceIcon(ua: string | null) {
  if (!ua) return Monitor
  const u = ua.toLowerCase()
  if (u.includes('mobile') || u.includes('android') || u.includes('iphone')) return Smartphone
  return Monitor
}

function parseDeviceLabel(ua: string | null): string {
  if (!ua) return 'Dispositivo desconhecido'
  if (ua.toLowerCase().includes('chrome')) return 'Chrome'
  if (ua.toLowerCase().includes('firefox')) return 'Firefox'
  if (ua.toLowerCase().includes('safari') && !ua.toLowerCase().includes('chrome')) return 'Safari'
  if (ua.toLowerCase().includes('edge')) return 'Edge'
  return 'Navegador'
}

export const DeviceSessionsDrawer: React.FC<Props> = ({ profile, onClose }) => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => { loadSessions() }, [profile.id])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.rpc('iam_get_portal_sessions', {
        p_portal_account_id: profile.id,
      })
      setSessions(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const revokeOne = async (sessionId: string) => {
    setRevoking(sessionId)
    try {
      const { error } = await supabase.rpc('iam_revoke_portal_session', { p_session_id: sessionId })
      if (error) throw error
      setSessions(s => s.filter(x => x.id !== sessionId))
      showToast('success', 'Sessão encerrada.')
    } catch {
      showToast('error', 'Erro ao encerrar sessão.')
    }
    setRevoking(null)
  }

  const revokeAll = async () => {
    setRevokingAll(true)
    try {
      const { error } = await supabase.rpc('iam_revoke_all_portal_sessions', {
        p_portal_account_id: profile.id,
      })
      if (error) throw error
      setSessions([])
      showToast('success', 'Todas as sessões encerradas.')
    } catch {
      showToast('error', 'Erro ao encerrar sessões.')
    }
    setRevokingAll(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="fixed right-0 top-0 bottom-0 z-[60] w-full max-w-md flex flex-col"
        style={{
          background: 'linear-gradient(160deg, rgba(8,15,31,0.99) 0%, rgba(10,20,42,0.99) 100%)',
          borderLeft: '1px solid rgba(59,130,246,0.18)',
          backdropFilter: 'blur(24px)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(59,130,246,0.12)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.5), rgba(14,165,233,0.5))', border: '1px solid rgba(59,130,246,0.3)' }}>
              <Shield size={16} className="text-blue-300" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Gestão de Dispositivos</h2>
              <p className="text-gray-500 text-xs truncate max-w-[200px]">{profile.full_name || profile.email}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 rounded-xl animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <WifiOff size={36} className="text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm font-medium">Nenhuma sessão ativa</p>
              <p className="text-gray-600 text-xs mt-1">Este usuário não está logado em nenhum dispositivo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 text-xs">
                  {sessions.length} {sessions.length === 1 ? 'sessão ativa' : 'sessões ativas'}
                </p>
                <button
                  onClick={revokeAll}
                  disabled={revokingAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                  style={{
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#f87171',
                  }}
                >
                  {revokingAll
                    ? <RefreshCw size={11} className="animate-spin" />
                    : <LogOut size={11} />
                  }
                  Deslogar de tudo
                </button>
              </div>

              {sessions.map((sess, i) => {
                const DeviceIcon = getDeviceIcon(sess.user_agent)
                const deviceName = sess.device_label !== 'Navegador'
                  ? sess.device_label
                  : parseDeviceLabel(sess.user_agent)
                const lastSeen = formatDistanceToNow(new Date(sess.last_seen_at), {
                  addSuffix: true,
                  locale: ptBR,
                })
                const isRecent = new Date(sess.last_seen_at) > new Date(Date.now() - 15 * 60 * 1000)

                return (
                  <motion.div
                    key={sess.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isRecent ? 'rgba(74,222,128,0.2)' : 'rgba(59,130,246,0.12)'}`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{
                          background: isRecent ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isRecent ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                        <DeviceIcon size={16} style={{ color: isRecent ? '#4ade80' : '#6b7280' }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium">{deviceName}</p>
                          {isRecent && (
                            <span className="flex items-center gap-1 text-xs"
                              style={{ color: '#4ade80' }}>
                              <Wifi size={9} />
                              online
                            </span>
                          )}
                        </div>
                        {sess.ip_address && (
                          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                            <Globe size={9} />
                            {sess.ip_address}
                          </p>
                        )}
                        <p className="text-gray-600 text-xs mt-1">Visto {lastSeen}</p>
                        {sess.user_agent && (
                          <p className="text-gray-700 text-xs mt-0.5 truncate" title={sess.user_agent}>
                            {sess.user_agent.substring(0, 60)}...
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => revokeOne(sess.id)}
                        disabled={revoking === sess.id}
                        title="Encerrar esta sessão"
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:brightness-110 disabled:opacity-50"
                        style={{
                          background: 'rgba(239,68,68,0.12)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: '#f87171',
                        }}
                      >
                        {revoking === sess.id
                          ? <RefreshCw size={12} className="animate-spin" />
                          : <LogOut size={12} />
                        }
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(59,130,246,0.1)' }}>
          <button
            onClick={loadSessions}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <RefreshCw size={12} />
            Atualizar lista
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[70] flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              background: toast.type === 'success' ? 'rgba(5,46,22,0.96)' : 'rgba(69,10,10,0.96)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
              color: toast.type === 'success' ? '#86efac' : '#fca5a5',
              backdropFilter: 'blur(16px)',
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
