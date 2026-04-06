import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Plus, Trash2, Save, ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle2, AlertCircle, Users, ToggleLeft as Toggle, RefreshCw, X, FileEdit as Edit3, Search, ShieldCheck, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

interface NotificationRule {
  id: string
  name: string
  description: string
  category: string
  event_type: string
  notification_type: 'info' | 'warning' | 'error' | 'success'
  priority: number
  is_active: boolean
  show_toast: boolean
  target_roles: string[]
  conditions: Record<string, any>
  created_at: string
  updated_at: string
}

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Proprietário', color: 'bg-amber-100 text-amber-800' },
  { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-800' },
  { value: 'manager', label: 'Gerente', color: 'bg-blue-100 text-blue-800' },
  { value: 'technician', label: 'Técnico', color: 'bg-teal-100 text-teal-800' },
  { value: 'employee', label: 'Funcionário', color: 'bg-gray-100 text-gray-700' },
]

const TYPE_OPTIONS = [
  { value: 'info', label: 'Informação', icon: Info, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  { value: 'warning', label: 'Aviso', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  { value: 'error', label: 'Urgente', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  { value: 'success', label: 'Sucesso', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
]

const CATEGORY_LABELS: Record<string, string> = {
  portal_service_request: 'Portal — Solicitação de Serviço',
  service_order_created: 'OS — Nova Criada',
  service_order_completed: 'OS — Concluída',
  payment_received: 'Financeiro — Pagamento Recebido',
  deadline_warning: 'OS — Prazo se Aproximando',
  low_stock: 'Estoque — Nível Crítico',
  internal_message: 'Chat — Nova Mensagem',
  lead_captured: 'CRM — Lead Capturado',
  budget_approved: 'Orçamento — Aprovado pelo Cliente',
  system_error: 'Sistema — Erro Crítico',
}

const EMPTY_RULE: Omit<NotificationRule, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  description: '',
  category: 'portal_service_request',
  event_type: 'insert',
  notification_type: 'info',
  priority: 5,
  is_active: true,
  show_toast: true,
  target_roles: ['admin', 'manager'],
  conditions: {},
}

function TypeBadge({ type }: { type: string }) {
  const opt = TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0]
  const Icon = opt.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${opt.bg} ${opt.color}`}>
      <Icon size={11} />
      {opt.label}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  const opt = ROLE_OPTIONS.find(r => r.value === role)
  if (!opt) return null
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${opt.color}`}>
      {opt.label}
    </span>
  )
}

function PriorityDots({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < value
              ? value >= 8 ? 'bg-red-500' : value >= 5 ? 'bg-yellow-500' : 'bg-blue-400'
              : 'bg-gray-200'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">{value}/10</span>
    </div>
  )
}

interface RuleFormProps {
  initial: Omit<NotificationRule, 'id' | 'created_at' | 'updated_at'>
  onSave: (data: Omit<NotificationRule, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onCancel: () => void
  saving: boolean
}

function RuleForm({ initial, onSave, onCancel, saving }: RuleFormProps) {
  const [form, setForm] = useState(initial)

  const toggleRole = (role: string) => {
    setForm(f => ({
      ...f,
      target_roles: f.target_roles.includes(role)
        ? f.target_roles.filter(r => r !== role)
        : [...f.target_roles, role],
    }))
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da Regra <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Nova Solicitação do Portal"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Explique quando esta regra dispara..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria / Evento</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(CATEGORY_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
            <option value="custom">Personalizado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Notificação</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map(opt => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, notification_type: opt.value as any }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.notification_type === opt.value
                      ? `${opt.bg} border-current ${opt.color}`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Icon size={14} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Prioridade: <span className="font-bold">{form.priority}/10</span>
            <span className="ml-1 text-xs text-gray-400">{form.priority >= 8 ? '(alta)' : form.priority >= 5 ? '(média)' : '(baixa)'}</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>1 — Baixa</span>
            <span>10 — Crítica</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 justify-center">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-6' : 'left-1'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Regra Ativa</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setForm(f => ({ ...f, show_toast: !f.show_toast }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.show_toast ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.show_toast ? 'left-6' : 'left-1'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Exibir Toast em Tempo Real</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users size={14} className="inline mr-1" />
          Notificar os seguintes perfis
        </label>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map(role => (
            <button
              key={role.value}
              type="button"
              onClick={() => toggleRole(role.value)}
              className={`px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                form.target_roles.includes(role.value)
                  ? `${role.color} border-transparent shadow-sm`
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
        {form.target_roles.length === 0 && (
          <p className="text-xs text-red-500 mt-1">Selecione ao menos um perfil.</p>
        )}
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={saving || !form.name || form.target_roles.length === 0}
          onClick={() => onSave(form)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
          Salvar Regra
        </button>
      </div>
    </div>
  )
}

export default function NotificationRules() {
  const toast = useToast()
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .order('priority', { ascending: false })
      if (error) throw error
      setRules((data || []).map(r => ({ ...r, target_roles: r.target_roles || [] })))
    } catch (err) {
      toast.error('Erro ao carregar regras')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (rule: NotificationRule) => {
    const updated = { ...rule, is_active: !rule.is_active }
    setRules(prev => prev.map(r => r.id === rule.id ? updated : r))
    try {
      const { error } = await supabase
        .from('notification_rules')
        .update({ is_active: updated.is_active })
        .eq('id', rule.id)
      if (error) throw error
      toast.success(updated.is_active ? 'Regra ativada' : 'Regra desativada')
    } catch {
      setRules(prev => prev.map(r => r.id === rule.id ? rule : r))
      toast.error('Erro ao atualizar')
    }
  }

  const saveRule = async (form: Omit<NotificationRule, 'id' | 'created_at' | 'updated_at'>) => {
    setSaving(true)
    try {
      if (editingRule) {
        const { error } = await supabase
          .from('notification_rules')
          .update(form)
          .eq('id', editingRule.id)
        if (error) throw error
        toast.success('Regra atualizada')
      } else {
        const { error } = await supabase
          .from('notification_rules')
          .insert(form)
        if (error) throw error
        toast.success('Regra criada')
      }
      setShowForm(false)
      setEditingRule(null)
      loadRules()
    } catch {
      toast.error('Erro ao salvar regra')
    } finally {
      setSaving(false)
    }
  }

  const deleteRule = async (id: string) => {
    if (!confirm('Excluir esta regra permanentemente?')) return
    try {
      const { error } = await supabase.from('notification_rules').delete().eq('id', id)
      if (error) throw error
      toast.success('Regra removida')
      loadRules()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const filtered = rules.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()) || (CATEGORY_LABELS[r.category] || r.category).toLowerCase().includes(search.toLowerCase())
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? r.is_active : !r.is_active)
    return matchSearch && matchActive
  })

  const activeCount = rules.filter(r => r.is_active).length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell size={18} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Regras de Alertas</h1>
          </div>
          <p className="text-sm text-gray-500 ml-11">
            Configure quais alertas são gerados, o tipo, a prioridade e para quais perfis são enviados.
          </p>
        </div>
        <button
          onClick={() => { setEditingRule(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nova Regra
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Regras', value: rules.length, color: 'bg-gray-50 text-gray-700', sub: 'configuradas' },
          { label: 'Ativas', value: activeCount, color: 'bg-green-50 text-green-700', sub: 'disparando alertas' },
          { label: 'Inativas', value: rules.length - activeCount, color: 'bg-gray-50 text-gray-500', sub: 'desabilitadas' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
            <p className="text-xs opacity-60">{s.sub}</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-blue-600" />
                <h3 className="font-bold text-blue-900 text-sm">
                  {editingRule ? 'Editar Regra' : 'Nova Regra de Alerta'}
                </h3>
              </div>
              <button onClick={() => { setShowForm(false); setEditingRule(null) }} className="p-1 rounded-lg hover:bg-blue-100">
                <X size={15} className="text-blue-600" />
              </button>
            </div>
            <div className="p-6">
              <RuleForm
                initial={editingRule ? {
                  name: editingRule.name,
                  description: editingRule.description,
                  category: editingRule.category,
                  event_type: editingRule.event_type,
                  notification_type: editingRule.notification_type,
                  priority: editingRule.priority,
                  is_active: editingRule.is_active,
                  show_toast: editingRule.show_toast,
                  target_roles: editingRule.target_roles,
                  conditions: editingRule.conditions,
                } : EMPTY_RULE}
                onSave={saveRule}
                onCancel={() => { setShowForm(false); setEditingRule(null) }}
                saving={saving}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar regras..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1">
            {[
              { val: 'all', label: 'Todas' },
              { val: 'active', label: 'Ativas' },
              { val: 'inactive', label: 'Inativas' },
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setFilterActive(f.val as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterActive === f.val
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={loadRules} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw size={15} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={22} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bell size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Nenhuma regra encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(rule => {
              const isExpanded = expandedId === rule.id
              return (
                <div key={rule.id} className={`transition-colors ${!rule.is_active ? 'opacity-60' : ''}`}>
                  <div className="px-6 py-4 flex items-center gap-4">
                    <button
                      onClick={() => toggleActive(rule)}
                      className={`relative shrink-0 w-10 h-5.5 rounded-full transition-colors ${rule.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
                      style={{ height: '22px', width: '40px' }}
                      title={rule.is_active ? 'Desativar' : 'Ativar'}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${rule.is_active ? 'left-5' : 'left-0.5'}`} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-gray-900">{rule.name}</span>
                        <TypeBadge type={rule.notification_type} />
                        {!rule.is_active && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">Inativa</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {CATEGORY_LABELS[rule.category] || rule.category}
                        {rule.description && <span className="text-gray-400"> — {rule.description}</span>}
                      </p>
                    </div>

                    <div className="hidden md:flex items-center gap-2 shrink-0">
                      <PriorityDots value={rule.priority} />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingRule(rule); setShowForm(true); setExpandedId(null) }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={14} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 border-t border-gray-50 pt-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Prioridade</p>
                              <PriorityDots value={rule.priority} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Toast Realtime</p>
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${rule.show_toast ? 'text-green-600' : 'text-gray-400'}`}>
                                <ShieldCheck size={12} />
                                {rule.show_toast ? 'Sim' : 'Não'}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Notifica os perfis</p>
                              <div className="flex flex-wrap gap-1">
                                {rule.target_roles.length === 0
                                  ? <span className="text-xs text-gray-400 italic">Nenhum perfil selecionado</span>
                                  : rule.target_roles.map(r => <RoleBadge key={r} role={r} />)
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
