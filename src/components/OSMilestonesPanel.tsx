import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, CheckCircle2, Clock, AlertTriangle, Play,
  Calendar, MoreVertical, Pencil, Trash2, X, Check,
  ChevronDown, GripVertical, ArrowRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface Milestone {
  id: string
  service_order_id: string
  title: string | null
  etapa_nome: string | null
  description: string | null
  position: number | null
  ordem: number | null
  scheduled_at: string | null
  data_agendada: string | null
  actual_at: string | null
  data_conclusao: string | null
  status: string
  completed_by: string | null
  notes: string | null
  agenda_event_id: string | null
  created_at: string
}

interface OSMilestonesPanelProps {
  serviceOrderId: string
  readOnly?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  agendado:     { label: 'Agendado',     color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200',   icon: <Clock className="w-3.5 h-3.5" /> },
  em_andamento: { label: 'Em Andamento', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <Play className="w-3.5 h-3.5" /> },
  concluido:    { label: 'Concluído',    color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  atrasado:     { label: 'Atrasado',     color: 'text-red-700',   bg: 'bg-red-50 border-red-200',     icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  pendente:     { label: 'Pendente',     color: 'text-gray-600',  bg: 'bg-gray-50 border-gray-200',   icon: <Clock className="w-3.5 h-3.5" /> },
}

const QUICK_STAGES = [
  'Infraestrutura', 'Instalação', 'Montagem', 'Configuração',
  'Testes', 'Limpeza', 'Entrega', 'Treinamento'
]

function getTitle(m: Milestone) {
  return m.title || m.etapa_nome || 'Etapa'
}

function getScheduled(m: Milestone) {
  return m.scheduled_at || m.data_agendada
}

function getActual(m: Milestone) {
  return m.actual_at || m.data_conclusao
}

function resolveStatus(m: Milestone): string {
  const s = getScheduled(m)
  if (m.status === 'concluido') return 'concluido'
  if (s && isPast(new Date(s)) && m.status !== 'em_andamento') return 'atrasado'
  return m.status || 'agendado'
}

export default function OSMilestonesPanel({ serviceOrderId, readOnly = false }: OSMilestonesPanelProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completedBy, setCompletedBy] = useState('')
  const [completionNotes, setCompletionNotes] = useState('')

  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editDesc, setEditDesc] = useState('')

  useEffect(() => {
    load()
  }, [serviceOrderId])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('os_milestones')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('position', { ascending: true })
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: true })
      setMilestones(data || [])
    } finally {
      setLoading(false)
    }
  }

  const addMilestone = async () => {
    if (!newTitle.trim()) return
    const maxPos = milestones.length
    const { error } = await supabase.from('os_milestones').insert({
      service_order_id: serviceOrderId,
      title: newTitle.trim(),
      etapa_nome: newTitle.trim(),
      description: newDesc.trim() || null,
      scheduled_at: newDate ? new Date(newDate).toISOString() : null,
      data_agendada: newDate ? new Date(newDate).toISOString() : null,
      position: maxPos,
      ordem: maxPos,
      status: 'agendado',
    })
    if (!error) {
      setNewTitle('')
      setNewDate('')
      setNewDesc('')
      setShowAdd(false)
      load()
    }
  }

  const startEdit = (m: Milestone) => {
    setEditTitle(getTitle(m))
    setEditDate(getScheduled(m) ? format(new Date(getScheduled(m)!), "yyyy-MM-dd'T'HH:mm") : '')
    setEditDesc(m.description || '')
    setEditingId(m.id)
    setMenuOpenId(null)
  }

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('os_milestones').update({
      title: editTitle,
      etapa_nome: editTitle,
      description: editDesc || null,
      scheduled_at: editDate ? new Date(editDate).toISOString() : null,
      data_agendada: editDate ? new Date(editDate).toISOString() : null,
    }).eq('id', id)
    if (!error) {
      setEditingId(null)
      load()
    }
  }

  const deleteMilestone = async (id: string) => {
    if (!confirm('Remover esta etapa?')) return
    await supabase.from('os_milestones').delete().eq('id', id)
    setMenuOpenId(null)
    load()
  }

  const changeStatus = async (m: Milestone, status: string) => {
    if (status === 'concluido') {
      setCompletingId(m.id)
      setMenuOpenId(null)
      return
    }
    await supabase.from('os_milestones').update({ status }).eq('id', m.id)
    setMenuOpenId(null)
    load()
  }

  const confirmComplete = async () => {
    if (!completingId) return
    await supabase.rpc('complete_milestone', {
      p_milestone_id: completingId,
      p_completed_by: completedBy || null,
      p_notes: completionNotes || null,
    })
    setCompletingId(null)
    setCompletedBy('')
    setCompletionNotes('')
    load()
  }

  const reschedule = async (id: string, dateStr: string) => {
    if (!dateStr) return
    await supabase.rpc('reschedule_milestone', {
      p_milestone_id: id,
      p_new_date: new Date(dateStr).toISOString(),
    })
    setReschedulingId(null)
    load()
  }

  const completedCount = milestones.filter(m => m.status === 'concluido').length
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + progress */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-sm font-semibold text-gray-700">
              {completedCount}/{milestones.length} etapas concluídas
            </span>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
            />
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowAdd(true)}
            className="ml-4 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Etapa
          </button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-blue-800">Nova Etapa</span>
              <button onClick={() => setShowAdd(false)} className="text-blue-400 hover:text-blue-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick stage buttons */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_STAGES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewTitle(s)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors font-medium ${
                    newTitle === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Nome da etapa..."
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data Prevista</label>
                <input
                  type="datetime-local"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Observação</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Opcional..."
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">
                Cancelar
              </button>
              <button
                onClick={addMilestone}
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion modal */}
      <AnimatePresence>
        {completingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setCompletingId(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Concluir Etapa</h3>
                  <p className="text-sm text-gray-500">A data real de conclusão será registrada agora</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Concluído por</label>
                <input
                  type="text"
                  value={completedBy}
                  onChange={e => setCompletedBy(e.target.value)}
                  placeholder="Nome do técnico / responsável..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Observações finais</label>
                <textarea
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  rows={3}
                  placeholder="O que foi executado, materiais usados, próximos passos..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setCompletingId(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                  Cancelar
                </button>
                <button
                  onClick={confirmComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirmar Conclusão
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {milestones.length === 0 && !showAdd && (
        <div className="text-center py-10 text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma etapa cadastrada.</p>
          {!readOnly && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-3 text-blue-600 text-sm font-medium hover:underline"
            >
              Adicionar primeira etapa
            </button>
          )}
        </div>
      )}

      {/* Timeline list */}
      <div className="relative space-y-0">
        {milestones.length > 1 && (
          <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gray-100 z-0" />
        )}

        {milestones.map((m, idx) => {
          const status = resolveStatus(m)
          const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.agendado
          const scheduled = getScheduled(m)
          const actual = getActual(m)
          const isEditing = editingId === m.id
          const isRescheduling = reschedulingId === m.id
          const menuOpen = menuOpenId === m.id
          const isLast = idx === milestones.length - 1

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="relative flex gap-3 pb-4"
            >
              {/* Timeline dot */}
              <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                status === 'concluido'
                  ? 'bg-green-500 border-green-500 text-white'
                  : status === 'em_andamento'
                  ? 'bg-amber-400 border-amber-400 text-white'
                  : status === 'atrasado'
                  ? 'bg-red-100 border-red-400 text-red-600'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}>
                {status === 'concluido' ? <CheckCircle2 className="w-5 h-5" /> :
                 status === 'em_andamento' ? <Play className="w-4 h-4" /> :
                 status === 'atrasado' ? <AlertTriangle className="w-4 h-4" /> :
                 <span className="text-xs font-bold text-gray-500">{idx + 1}</span>}
              </div>

              {/* Card */}
              <div className={`flex-1 rounded-xl border p-3.5 transition-all ${cfg.bg} ${
                status === 'em_andamento' ? 'shadow-md' : 'shadow-sm'
              }`}>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Data Prevista</label>
                        <input
                          type="datetime-local"
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Observação</label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                      <button onClick={() => saveEdit(m.id)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Salvar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${
                            status === 'concluido' ? 'text-green-800' :
                            status === 'atrasado' ? 'text-red-800' :
                            status === 'em_andamento' ? 'text-amber-800' : 'text-gray-800'
                          }`}>
                            {getTitle(m)}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </div>

                        {m.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                          {scheduled && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className="font-medium">Previsto:</span>
                              <span className={status === 'atrasado' ? 'text-red-600 font-semibold' : ''}>
                                {format(new Date(scheduled), "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </span>
                              {isToday(new Date(scheduled)) && (
                                <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">HOJE</span>
                              )}
                            </span>
                          )}
                          {actual && (
                            <span className="flex items-center gap-1 text-green-700">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="font-medium">Executado:</span>
                              {format(new Date(actual), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          )}
                          {m.completed_by && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Por:</span> {m.completed_by}
                            </span>
                          )}
                        </div>

                        {m.notes && (
                          <p className="mt-1.5 text-xs text-gray-600 italic bg-white/60 rounded px-2 py-1">
                            {m.notes}
                          </p>
                        )}
                      </div>

                      {!readOnly && (
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => setMenuOpenId(menuOpen ? null : m.id)}
                            className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                            {menuOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-48 overflow-hidden"
                              >
                                <div className="p-1">
                                  <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status</p>
                                  {['agendado','em_andamento','concluido','atrasado'].map(s => (
                                    <button
                                      key={s}
                                      onClick={() => changeStatus(m, s)}
                                      className={`w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-2 ${
                                        status === s ? 'font-semibold text-blue-700' : 'text-gray-700'
                                      }`}
                                    >
                                      {STATUS_CONFIG[s]?.icon}
                                      {STATUS_CONFIG[s]?.label}
                                    </button>
                                  ))}
                                  <hr className="my-1 border-gray-100" />
                                  <button
                                    onClick={() => { setReschedulingId(m.id); setMenuOpenId(null) }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                    Reprogramar data
                                  </button>
                                  <button
                                    onClick={() => startEdit(m)}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => deleteMilestone(m.id)}
                                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Excluir
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Reschedule inline picker */}
                    <AnimatePresence>
                      {isRescheduling && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-current/10"
                        >
                          <p className="text-xs font-semibold text-gray-600 mb-2">Nova data prevista</p>
                          <div className="flex gap-2 items-center">
                            <input
                              type="datetime-local"
                              defaultValue={scheduled ? format(new Date(scheduled), "yyyy-MM-dd'T'HH:mm") : ''}
                              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                              id={`reschedule-${m.id}`}
                            />
                            <button
                              onClick={() => {
                                const el = document.getElementById(`reschedule-${m.id}`) as HTMLInputElement
                                reschedule(m.id, el?.value)
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              Aplicar
                            </button>
                            <button onClick={() => setReschedulingId(null)} className="px-2 py-1.5 text-gray-500 hover:text-gray-700">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Quick actions row for non-completed milestones */}
                    {!readOnly && status !== 'concluido' && (
                      <div className="mt-2 flex gap-2">
                        {status !== 'em_andamento' && (
                          <button
                            onClick={() => changeStatus(m, 'em_andamento')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            Iniciar
                          </button>
                        )}
                        <button
                          onClick={() => { setCompletingId(m.id); setMenuOpenId(null) }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Concluir
                        </button>
                        <button
                          onClick={() => { setReschedulingId(isRescheduling ? null : m.id) }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                          <Calendar className="w-3 h-3" />
                          Reprogramar
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Close dropdown on outside click */}
      {menuOpenId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
      )}
    </div>
  )
}
