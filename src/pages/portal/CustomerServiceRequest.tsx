import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Upload, X, CheckCircle2, Clock, AlertCircle,
  MessageSquarePlus, Loader2, Image as ImageIcon, RefreshCw
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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-700' },
  em_analise: { label: 'Em Analise', color: 'bg-yellow-100 text-yellow-700' },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700' },
  em_andamento: { label: 'Em Andamento', color: 'bg-purple-100 text-purple-700' },
  concluido: { label: 'Concluido', color: 'bg-gray-100 text-gray-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
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

  useEffect(() => {
    loadRequests()
  }, [portalUser])

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
    } catch (err) {
      console.error(err)
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
        photos: photos
      })
      setSuccess(true)
      setForm({ title: '', description: '', priority: 'normal' })
      setPhotos([])
      setShowForm(false)
      loadRequests()
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitar Servico</h1>
          <p className="text-gray-500 text-sm">Abra um ticket para nova solicitacao</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadRequests} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw size={18} className="text-gray-500" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus size={16} /> Nova Solicitacao
          </button>
        </div>
      </div>

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
              <p className="font-semibold text-green-800">Solicitacao enviada com sucesso!</p>
              <p className="text-sm text-green-600">Nossa equipe analisara em breve e entrar em contato.</p>
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
                <h3 className="font-bold text-blue-900">Nova Solicitacao de Servico</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-blue-100 transition-colors">
                <X size={16} className="text-blue-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Titulo <span className="text-red-500">*</span>
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
                  Descricao do Problema <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Descreva o problema com o maximo de detalhes possivel..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridade</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fotos do Problema (opcional)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative w-20 h-20">
                      <img src={photo} className="w-full h-full object-cover rounded-lg border border-gray-200" alt="" />
                      <button
                        type="button"
                        onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
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
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {submitting ? 'Enviando...' : 'Enviar Solicitacao'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Minhas Solicitacoes</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquarePlus size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma solicitacao ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {requests.map(req => {
              const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.aberto
              return (
                <div key={req.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                      </div>
                      <p className="font-semibold text-gray-900">{req.title}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                    </div>
                    {req.photos?.length > 0 && (
                      <div className="flex gap-1 shrink-0">
                        {req.photos.slice(0, 2).map((p, i) => (
                          <img key={i} src={p} className="w-10 h-10 object-cover rounded-lg" alt="" />
                        ))}
                        {req.photos.length > 2 && (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 font-bold">
                            +{req.photos.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
