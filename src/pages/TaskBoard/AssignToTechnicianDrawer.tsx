import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Search, ChevronRight, Wrench, Calendar,
  Clock, AlertTriangle, CheckCircle2, FileText, Loader2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Technician {
  id: string
  name: string
  cargo?: string
  department?: string
  photo_url?: string
}

interface PortalRequest {
  id: string
  title: string
  description: string
  priority: string
  status: string
  created_at: string
  customer_id: string
  customer_name?: string
  photos?: string[]
  generated_os_id?: string | null
}

const PRIORITY_LABEL: Record<string, string> = {
  baixa: 'Baixa', normal: 'Normal', alta: 'Alta', urgente: 'Urgente'
}

const OS_PRIORITY_MAP: Record<string, string> = {
  baixa: 'low', normal: 'normal', alta: 'high', urgente: 'urgent'
}

type ActionMode = 'task' | 'os'

interface AssignToTechnicianDrawerProps {
  request: PortalRequest
  onClose: () => void
  onSuccess: () => void
}

export function AssignToTechnicianDrawer({ request, onClose, onSuccess }: AssignToTechnicianDrawerProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [filtered, setFiltered] = useState<Technician[]>([])
  const [search, setSearch] = useState('')
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null)
  const [actionMode, setActionMode] = useState<ActionMode>('task')
  const [dueDate, setDueDate] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const fetchTechs = async () => {
      const { data } = await supabase
        .from('employees')
        .select('id, name, cargo, department, photo_url')
        .eq('active', true)
        .order('name')
      if (data) {
        setTechnicians(data)
        setFiltered(data)
      }
    }
    fetchTechs()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      q
        ? technicians.filter(t =>
            t.name.toLowerCase().includes(q) ||
            (t.cargo || '').toLowerCase().includes(q) ||
            (t.department || '').toLowerCase().includes(q)
          )
        : technicians
    )
  }, [search, technicians])

  const handleConfirm = useCallback(async () => {
    if (!selectedTech) return
    setSaving(true)
    try {
      if (actionMode === 'task') {
        // Create a task in the Kanban board assigned to the technician
        const { error } = await supabase.from('project_tasks').insert({
          title: `Atendimento Portal: ${request.title} — ${request.customer_name || 'Cliente'}`,
          description: [
            request.description || '',
            internalNote ? `\nObs: ${internalNote}` : '',
          ].join('').trim(),
          column_id: 'todo',
          priority: OS_PRIORITY_MAP[request.priority] || 'normal',
          category: 'solicitacao_portal',
          source: 'portal_request',
          source_id: request.id,
          source_customer_name: request.customer_name || 'Cliente',
          assignee_id: selectedTech.id,
          assignee_name: selectedTech.name,
          assignee_cargo: selectedTech.cargo || '',
          due_date: dueDate || null,
          tags: ['portal', 'solicitacao', 'direcionado'],
          assigned_by_name: 'Sistema',
          assigned_at: new Date().toISOString(),
        })
        if (error) throw error
      } else {
        // Create a full Service Order
        const osNumber = `OS-${Date.now().toString().slice(-6)}`
        const { data: osData, error: osError } = await supabase
          .from('service_orders')
          .insert({
            title: request.title,
            description: request.description || '',
            status: 'pending',
            priority: request.priority === 'urgente' ? 'high' : 'normal',
            client_id: request.customer_id,
            scheduled_date: dueDate || null,
            notes: internalNote || null,
            order_number: osNumber,
          })
          .select('id')
          .single()

        if (osError) throw osError

        // Link OS to portal request
        await supabase
          .from('portal_service_requests')
          .update({ generated_os_id: osData.id, status: 'em_andamento', attended_at: new Date().toISOString() })
          .eq('id', request.id)

        // Create task linked to the OS
        await supabase.from('project_tasks').insert({
          title: `OS #${osNumber}: ${request.title} — ${request.customer_name || 'Cliente'}`,
          description: request.description || '',
          column_id: 'todo',
          priority: OS_PRIORITY_MAP[request.priority] || 'normal',
          category: 'solicitacao_portal',
          source: 'portal_request',
          source_id: request.id,
          source_customer_name: request.customer_name || 'Cliente',
          assignee_id: selectedTech.id,
          assignee_name: selectedTech.name,
          assignee_cargo: selectedTech.cargo || '',
          due_date: dueDate || null,
          tags: ['portal', 'os_gerada'],
          assigned_by_name: 'Sistema',
          assigned_at: new Date().toISOString(),
        })
      }

      // Update request status to em_analise if still 'aberto'
      if (request.status === 'aberto') {
        await supabase
          .from('portal_service_requests')
          .update({ status: 'em_analise', attended_at: new Date().toISOString() })
          .eq('id', request.id)
      }

      setDone(true)
      setTimeout(onSuccess, 1400)
    } catch (err) {
      console.error('Erro ao direcionar solicitação:', err)
      setSaving(false)
    }
  }, [selectedTech, actionMode, request, dueDate, internalNote, onSuccess])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Done state */}
          {done && (
            <div className="flex flex-col items-center justify-center py-12 px-8 gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </motion.div>
              <p className="text-lg font-bold text-gray-800">Solicitação Direcionada!</p>
              <p className="text-sm text-gray-500 text-center">
                {selectedTech?.name} foi atribuído à solicitação de <strong>{request.customer_name}</strong>.
              </p>
            </div>
          )}

          {!done && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Direcionar para Técnico</h2>
                  <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{request.title}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Request summary */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-700 truncate">{request.title}</p>
                    <p className="text-[11px] text-amber-600">
                      {request.customer_name} · Prioridade: {PRIORITY_LABEL[request.priority] || request.priority}
                    </p>
                    {request.description && (
                      <p className="text-[11px] text-amber-600 mt-0.5 line-clamp-2">{request.description}</p>
                    )}
                  </div>
                </div>

                {/* Action mode */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">O que criar?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActionMode('task')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition ${
                        actionMode === 'task'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <FileText className="h-5 w-5" />
                      <span className="text-xs font-semibold">Somente Tarefa</span>
                      <span className="text-[10px] opacity-70">Cria no Kanban</span>
                    </button>
                    <button
                      onClick={() => setActionMode('os')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition ${
                        actionMode === 'os'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Wrench className="h-5 w-5" />
                      <span className="text-xs font-semibold">Gerar OS + Tarefa</span>
                      <span className="text-[10px] opacity-70">Ordem de Serviço</span>
                    </button>
                  </div>
                </div>

                {/* Technician search */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Selecionar Técnico</p>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar técnico..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                    {filtered.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">Nenhum técnico encontrado</p>
                    )}
                    {filtered.map(tech => (
                      <button
                        key={tech.id}
                        onClick={() => setSelectedTech(tech)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border-2 text-left transition ${
                          selectedTech?.id === tech.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                          {tech.photo_url
                            ? <img src={tech.photo_url} alt={tech.name} className="w-full h-full object-cover" />
                            : tech.name.charAt(0).toUpperCase()
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{tech.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{tech.cargo || tech.department || 'Técnico'}</p>
                        </div>
                        {selectedTech?.id === tech.id && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Prazo (opcional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                {/* Internal note */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    <FileText className="h-3 w-3 inline mr-1" />
                    Observação interna (opcional)
                  </label>
                  <textarea
                    value={internalNote}
                    onChange={e => setInternalNote(e.target.value)}
                    rows={2}
                    placeholder="Instruções ou contexto para o técnico..."
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedTech || saving}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                    : <><ChevronRight className="h-4 w-4" /> Confirmar</>
                  }
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
