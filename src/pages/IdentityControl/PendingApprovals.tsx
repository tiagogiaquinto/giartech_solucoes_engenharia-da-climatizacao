import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Check, X, Building2, HeartHandshake, Phone,
  FileText, MessageSquare, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PendingRequest {
  id: string
  full_name: string
  email: string
  phone: string | null
  document: string | null
  requested_role: 'cliente' | 'parceiro'
  company_name: string | null
  message: string | null
  status: string
  created_at: string
}

interface Props {
  onApproved: () => void
}

export const PendingApprovals: React.FC<Props> = ({ onApproved }) => {
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.rpc('iam_get_pending_approvals')
      setRequests(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const approve = async (id: string) => {
    setProcessing(id)
    try {
      const { error } = await supabase.rpc('iam_approve_request', { p_request_id: id })
      if (error) throw error
      showToast('success', 'Acesso aprovado. Conta criada com senha padrão GS@2026.')
      setRequests(r => r.filter(x => x.id !== id))
      onApproved()
    } catch (e: any) {
      showToast('error', e.message || 'Erro ao aprovar.')
    }
    setProcessing(null)
  }

  const reject = async (id: string) => {
    setProcessing(id)
    try {
      const { error } = await supabase.rpc('iam_reject_request', {
        p_request_id: id,
        p_reason: rejectReason || 'Solicitação não aprovada pelo administrador.',
      })
      if (error) throw error
      showToast('success', 'Solicitação recusada.')
      setRequests(r => r.filter(x => x.id !== id))
      setRejectId(null)
      setRejectReason('')
    } catch (e: any) {
      showToast('error', e.message || 'Erro ao recusar.')
    }
    setProcessing(null)
  }

  if (requests.length === 0 && !loading) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(140deg, rgba(251,146,60,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(251,146,60,0.25)',
        }}
      >
        {/* Header */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.3)' }}>
              <Bell size={15} className="text-orange-400" />
            </div>
            <div className="text-left">
              <p className="text-orange-300 font-semibold text-sm">
                Solicitações Pendentes de Acesso
              </p>
              <p className="text-orange-400/60 text-xs">
                {requests.length} {requests.length === 1 ? 'cadastro aguarda' : 'cadastros aguardam'} aprovação
              </p>
            </div>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(251,146,60,0.3)', color: '#fb923c' }}>
              {requests.length}
            </span>
          </div>
          {expanded ? <ChevronUp size={16} className="text-orange-400/60" /> : <ChevronDown size={16} className="text-orange-400/60" />}
        </button>

        {/* List */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {loading ? (
                  <div className="py-6 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                    <RefreshCw size={13} className="animate-spin" />
                    Carregando...
                  </div>
                ) : (
                  requests.map((req, i) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl p-4"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(251,146,60,0.15)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Role icon */}
                        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                          style={{
                            background: req.requested_role === 'parceiro'
                              ? 'rgba(74,222,128,0.15)' : 'rgba(103,232,249,0.15)',
                            border: req.requested_role === 'parceiro'
                              ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(103,232,249,0.25)',
                          }}>
                          {req.requested_role === 'parceiro'
                            ? <HeartHandshake size={16} className="text-emerald-400" />
                            : <Building2 size={16} className="text-cyan-400" />
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-semibold text-sm">{req.full_name}</p>
                            <span className="px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{
                                background: req.requested_role === 'parceiro'
                                  ? 'rgba(74,222,128,0.15)' : 'rgba(103,232,249,0.15)',
                                color: req.requested_role === 'parceiro' ? '#6ee7b7' : '#67e8f9',
                              }}>
                              {req.requested_role === 'parceiro' ? 'Parceiro' : 'Cliente'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs mt-0.5">{req.email}</p>

                          <div className="flex flex-wrap gap-3 mt-2">
                            {req.phone && (
                              <span className="flex items-center gap-1 text-gray-500 text-xs">
                                <Phone size={10} />{req.phone}
                              </span>
                            )}
                            {req.document && (
                              <span className="flex items-center gap-1 text-gray-500 text-xs">
                                <FileText size={10} />{req.document}
                              </span>
                            )}
                            {req.company_name && (
                              <span className="flex items-center gap-1 text-gray-500 text-xs">
                                <Building2 size={10} />{req.company_name}
                              </span>
                            )}
                          </div>

                          {req.message && (
                            <p className="mt-2 text-gray-400/70 text-xs flex items-start gap-1">
                              <MessageSquare size={10} className="mt-0.5 flex-shrink-0" />
                              {req.message}
                            </p>
                          )}

                          <p className="text-gray-600 text-xs mt-2">
                            Solicitado {format(new Date(req.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      {/* Reject reason input */}
                      <AnimatePresence>
                        {rejectId === req.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 overflow-hidden"
                          >
                            <textarea
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              placeholder="Motivo da recusa (opcional)..."
                              rows={2}
                              className="w-full rounded-lg px-3 py-2 text-xs text-white resize-none outline-none"
                              style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(239,68,68,0.3)',
                              }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => approve(req.id)}
                          disabled={processing === req.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                          style={{
                            background: 'rgba(34,197,94,0.2)',
                            border: '1px solid rgba(34,197,94,0.3)',
                            color: '#4ade80',
                          }}
                        >
                          {processing === req.id
                            ? <RefreshCw size={11} className="animate-spin" />
                            : <Check size={11} />
                          }
                          Aprovar
                        </button>

                        {rejectId === req.id ? (
                          <>
                            <button
                              onClick={() => reject(req.id)}
                              disabled={processing === req.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                              style={{
                                background: 'rgba(239,68,68,0.2)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: '#f87171',
                              }}
                            >
                              <X size={11} />
                              Confirmar recusa
                            </button>
                            <button
                              onClick={() => { setRejectId(null); setRejectReason('') }}
                              className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setRejectId(req.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:brightness-110"
                            style={{
                              background: 'rgba(239,68,68,0.12)',
                              border: '1px solid rgba(239,68,68,0.2)',
                              color: '#f87171',
                            }}
                          >
                            <X size={11} />
                            Recusar
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            {toast.type === 'success' ? <Check size={15} /> : <X size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
