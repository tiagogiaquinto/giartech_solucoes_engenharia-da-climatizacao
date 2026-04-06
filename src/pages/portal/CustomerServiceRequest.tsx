import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, CheckCircle2, Clock, AlertCircle,
  MessageSquarePlus, Loader2, Image as ImageIcon, RefreshCw,
  ChevronRight, Calendar, Flag, Eye
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'

interface ServiceRequest {
  id: string
  title: string
  description: string
  priority: string
  status: string
  created_at: string
  photos: string[]
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  aberto:       { label: 'Aberto',       color: 'bg-blue-100 text-blue-700',   icon: Clock },
  em_analise:   { label: 'Em Análise',   color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  aprovado:     { label: 'Aprovado',     color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  em_andamento: { label: 'Em Andamento', color: 'bg-cyan-100 text-cyan-700',   icon: Clock },
  concluido:    { label: 'Concluído',    color: 'bg-gray-100 text-gray-600',   icon: CheckCircle2 },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-100 text-red-700',     icon: AlertCircle },
}

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  baixa:   { label: 'Baixa',   color: 'bg-gray-100 text-gray-600' },
  normal:  { label: 'Normal',  color: 'bg-blue-100 text-blue-700' },
  alta:    { label: 'Alta',    color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface RequestDetailModalProps {
  request: ServiceRequest
  onClose: () => void
}

function RequestDetailModal({ request, onClose }: RequestDetailModalProps) {
  const status = STATUS_MAP[request.status] || STATUS_MAP.aberto
  const StatusIcon = status.icon
  const priority = PRIORITY_MAP[request.priority] || PRIORITY_MAP.normal
  const [viewPhoto, setViewPhoto] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                <StatusIcon size={10} />
                {status.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priority.color}`}>
                {priority.label}
              </span>
            </div>
            <p className="font-bold text-gray-900 text-base leading-snug">{request.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar size={11} /> {formatDate(request.created_at)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Descrição do problema</p>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{request.description}</p>
            </div>
          </div>

          {request.photos?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Fotos anexadas ({request.photos.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {request.photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setViewPhoto(p)}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                  >
                    <img src={p} className="w-full h-full object-cover" alt={`Foto ${i + 1}`} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Eye size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-700 font-medium">
              Nossa equipe está analisando sua solicitação. Entraremos em contato em breve.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {viewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
            onClick={() => setViewPhoto(null)}
          >
            <button
              onClick={() => setViewPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
            <img
              src={viewPhoto}
              className="max-w-full max-h-full rounded-xl object-contain"
              alt="Foto ampliada"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function CustomerServiceRequest() {
  const { portalUser } = usePortal()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({ title: '', description: '', priority: 'normal' })
  const [selected, setSelected] = useState<ServiceRequest | null>(null)

  useEffect(() => {
    if (!portalUser) return
    loadRequests()

    const ch = supabase
      .channel(`portal-service-requests-${portalUser.account_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'portal_service_requests',
        filter: `portal_account_id=eq.${portalUser.account_id}`,
      }, () => { loadRequests() })
      .subscribe()

    return () => { ch.unsubscribe() }
  }, [portalUser?.account_id])

  const loadRequests = async () => {
    if (!portalUser) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('portal_service_requests')
        .select('*')
        .eq('portal_account_id', portalUser.account_id)
        .order('created_at', { ascending: false })
      setRequests(data || [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPhotos(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!portalUser) return
    setSubmitting(true)
    try {
      await supabase.from('portal_service_requests').insert({
        portal_account_id: portalUser.account_id,
        customer_id: portalUser.linked_customer_id,
        title: form.title,
        description: form.description,
        priority: form.priority,
        photos,
      })
      setSuccess(true)
      setForm({ title: '', description: '', priority: 'normal' })
      setPhotos([])
      setShowForm(false)
      loadRequests()
      setTimeout(() => setSuccess(false), 5000)
    } finally {
      setSubmitting(false)
    }
  }

  const openCount = requests.filter(r => r.status === 'aberto' || r.status === 'em_analise').length
  const activeCount = requests.filter(r => r.status === 'aprovado' || r.status === 'em_andamento').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitar Serviço</h1>
          <p className="text-gray-500 text-sm mt-0.5">Abra um ticket para nova solicitação</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadRequests} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw size={18} className="text-gray-500" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {showForm ? <><X size={15} /> Cancelar</> : <><Plus size={15} /> Nova Solicitação</>}
          </button>
        </div>
      </div>

      {requests.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: requests.length, color: 'bg-gray-50 text-gray-700' },
            { label: 'Em análise', value: openCount, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Em andamento', value: activeCount, color: 'bg-green-50 text-green-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl"
          >
            <CheckCircle2 size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Solicitação enviada com sucesso!</p>
              <p className="text-sm text-green-600">Nossa equipe analisará em breve e entrará em contato.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <MessageSquarePlus size={18} className="text-blue-600" />
                <h3 className="font-bold text-blue-900">Nova Solicitação de Serviço</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-blue-100 transition-colors">
                <X size={16} className="text-blue-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Ar condicionado com defeito"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descrição do problema <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Descreva o problema com o máximo de detalhes possível..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridade</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'baixa', label: 'Baixa', active: 'border-gray-400 bg-gray-50' },
                    { value: 'normal', label: 'Normal', active: 'border-blue-400 bg-blue-50' },
                    { value: 'alta', label: 'Alta', active: 'border-orange-400 bg-orange-50' },
                    { value: 'urgente', label: 'Urgente', active: 'border-red-400 bg-red-50' },
                  ].map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                      className={`py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                        form.priority === p.value
                          ? `${p.active} shadow-sm text-gray-800`
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fotos do problema <span className="text-gray-400 font-normal">(opcional, até 5)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative w-20 h-20">
                      <img src={photo} className="w-full h-full object-cover rounded-xl border border-gray-200" alt="" />
                      <button
                        type="button"
                        onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <ImageIcon size={18} className="text-gray-400" />
                      <span className="text-xs text-gray-400">Foto</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Minhas Solicitações</h2>
          {requests.length > 0 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">{requests.length}</span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquarePlus size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Nenhuma solicitação ainda</p>
            <p className="text-xs text-gray-400 mt-1">Clique em "Nova Solicitação" para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {requests.map(req => {
              const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.aberto
              const StatusIcon = statusInfo.icon
              const priorityInfo = PRIORITY_MAP[req.priority] || PRIORITY_MAP.normal
              return (
                <button
                  key={req.id}
                  onClick={() => setSelected(req)}
                  className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          <StatusIcon size={10} />
                          {statusInfo.label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{req.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{req.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {req.photos?.length > 0 && (
                        <div className="flex -space-x-1">
                          {req.photos.slice(0, 2).map((p, i) => (
                            <img key={i} src={p} className="w-8 h-8 object-cover rounded-lg border-2 border-white" alt="" />
                          ))}
                          {req.photos.length > 2 && (
                            <div className="w-8 h-8 bg-gray-200 rounded-lg border-2 border-white flex items-center justify-center text-xs text-gray-500 font-bold">
                              +{req.photos.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <RequestDetailModal request={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
