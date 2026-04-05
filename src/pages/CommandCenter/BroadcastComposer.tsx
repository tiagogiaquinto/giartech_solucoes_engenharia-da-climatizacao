import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Megaphone, Send, Clock, Users, AlertTriangle, Info, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

interface Props {
  onClose: () => void
  onSent: () => void
}

const PRIORITY_OPTIONS = [
  { value: 'info',    label: 'Informativo', Icon: Info,          cls: 'border-blue-300 bg-blue-50 text-blue-700' },
  { value: 'warning', label: 'Atenção',     Icon: AlertTriangle, cls: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'urgent',  label: 'Urgente',     Icon: Zap,           cls: 'border-red-300 bg-red-50 text-red-700' },
]

const TARGET_OPTIONS = [
  { value: 'all',         label: 'Todos os Portais' },
  { value: 'technicians', label: 'Técnicos' },
  { value: 'admin',       label: 'Administrativo' },
  { value: 'partners',    label: 'Parceiros' },
  { value: 'customers',   label: 'Clientes' },
]

export default function BroadcastComposer({ onClose, onSent }: Props) {
  const { profile } = useUser()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'info' | 'warning' | 'urgent'>('info')
  const [target, setTarget] = useState('all')
  const [expiresHours, setExpiresHours] = useState<number | ''>('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!content.trim()) return
    setSending(true)
    try {
      await supabase.rpc('send_broadcast', {
        p_content:       content.trim(),
        p_title:         title.trim(),
        p_priority:      priority,
        p_target:        target,
        p_expires_hours: expiresHours !== '' ? Number(expiresHours) : null,
        p_sender_name:   profile?.full_name || 'Administrador',
      })
      onSent()
      onClose()
    } finally {
      setSending(false)
    }
  }

  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === priority)!

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}>

        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>

          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Mensagem em Broadcast</h2>
                <p className="text-xs text-white/60">Enviado a todos os portais selecionados</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/15 rounded-lg transition">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="p-5 space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Título (opcional)</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Reunião Geral às 08h"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mensagem *</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Digite o aviso aqui..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Prioridade</label>
                <div className="flex flex-col gap-1.5">
                  {PRIORITY_OPTIONS.map(opt => {
                    const Icon = opt.Icon
                    const active = priority === opt.value
                    return (
                      <button key={opt.value} onClick={() => setPriority(opt.value as any)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          active ? opt.cls + ' shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                        <Icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Destino</label>
                  <select value={target} onChange={e => setTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {TARGET_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Expira em (horas)
                  </label>
                  <input
                    type="number"
                    value={expiresHours}
                    onChange={e => setExpiresHours(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 24"
                    min={1}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Deixe vazio para não expirar</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <Users className="w-3 h-3 inline mr-1" />
                    Destinatários
                  </label>
                  <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-2">
                    {TARGET_OPTIONS.find(t => t.value === target)?.label}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-xl px-4 py-3 border flex items-start gap-2 text-xs ${
              priority === 'info' ? 'bg-blue-50 border-blue-100 text-blue-700' :
              priority === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
              'bg-red-50 border-red-100 text-red-700'
            }`}>
              <selectedPriority.Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Este aviso aparecerá no topo de todos os portais configurados e no canal Geral GiarTech.</span>
            </div>
          </div>

          <div className="px-5 pb-5">
            <button onClick={handleSend} disabled={!content.trim() || sending}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', boxShadow: '0 4px 14px rgba(15,23,42,0.3)' }}>
              {sending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className="w-4 h-4" />}
              {sending ? 'Enviando...' : 'Enviar Broadcast'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
