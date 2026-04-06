import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, ChevronDown, ChevronUp, Check, X, Save, Loader2,
  RefreshCw, Eye, Plus, Trash2, AlertCircle, User, Search,
  Lock, Unlock, ToggleLeft, ToggleRight, Info
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface AuthUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
}

interface ModulePermission {
  id?: string
  user_id: string
  module_code: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

interface SensitivePermission {
  id?: string
  user_id: string
  can_view_profit: boolean
  can_apply_discount: boolean
  can_adjust_stock: boolean
}

const ALL_MODULES = [
  { code: 'dashboard',       label: 'Dashboard CFO',        group: 'Visão Geral' },
  { code: 'agenda',          label: 'Agenda',               group: 'Visão Geral' },
  { code: 'projetos',        label: 'Central de Tarefas',   group: 'Visão Geral' },
  { code: 'clientes',        label: 'Clientes e Parceiros', group: 'Comercial' },
  { code: 'crm',             label: 'CRM / Pós-Venda',      group: 'Comercial' },
  { code: 'mensagens_crm',   label: 'Mensagens CRM',        group: 'Comercial' },
  { code: 'gamificacao',     label: 'Gamificação',          group: 'Comercial' },
  { code: 'portal',          label: 'Portal Cliente',       group: 'Comercial' },
  { code: 'service_orders',  label: 'Ordens de Serviço',    group: 'Operacional' },
  { code: 'catalogo',        label: 'Catálogo de Serviços', group: 'Operacional' },
  { code: 'estoque',         label: 'Estoque / Materiais',  group: 'Operacional' },
  { code: 'compras',         label: 'Compras',              group: 'Operacional' },
  { code: 'fornecedores',    label: 'Fornecedores',         group: 'Operacional' },
  { code: 'rotas',           label: 'Rotas',                group: 'Operacional' },
  { code: 'financeiro',      label: 'Financeiro',           group: 'Financeiro' },
  { code: 'salarios',        label: 'Gestão de Salários',   group: 'Financeiro' },
  { code: 'metas',           label: 'Metas & Rankings',     group: 'Financeiro' },
  { code: 'relatorios',      label: 'Relatórios',           group: 'Relatórios' },
  { code: 'documentos',      label: 'Documentos',           group: 'Relatórios' },
  { code: 'biblioteca',      label: 'Biblioteca Digital',   group: 'Relatórios' },
  { code: 'email',           label: 'Email Corporativo',    group: 'Comunicação' },
  { code: 'chat',            label: 'Chat Corporativo',     group: 'Comunicação' },
  { code: 'thomaz',          label: 'Thomaz AI',            group: 'Comunicação' },
  { code: 'auditoria',       label: 'Auditoria',            group: 'Administração' },
  { code: 'configuracoes',   label: 'Configurações',        group: 'Administração' },
  { code: 'pessoas',         label: 'Hub de Equipe',        group: 'Administração' },
]

const GROUPS = Array.from(new Set(ALL_MODULES.map(m => m.group)))

const ROLE_PRESETS: Record<string, string[]> = {
  admin: ALL_MODULES.map(m => m.code),
  manager: ['dashboard', 'agenda', 'projetos', 'clientes', 'crm', 'mensagens_crm', 'gamificacao', 'portal', 'service_orders', 'catalogo', 'estoque', 'compras', 'fornecedores', 'rotas', 'financeiro', 'salarios', 'metas', 'relatorios', 'documentos', 'email', 'chat', 'thomaz'],
  technician: ['agenda', 'projetos', 'service_orders', 'catalogo', 'estoque', 'rotas', 'chat'],
  financial: ['dashboard', 'agenda', 'financeiro', 'salarios', 'metas', 'relatorios', 'compras', 'fornecedores', 'chat', 'thomaz'],
  sales: ['dashboard', 'agenda', 'clientes', 'crm', 'mensagens_crm', 'gamificacao', 'portal', 'service_orders', 'relatorios', 'email', 'chat'],
  viewer: ['dashboard', 'agenda'],
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Administrador', manager: 'Gerente',
  technician: 'Técnico', sales: 'Vendas', financial: 'Financeiro', viewer: 'Visualizador',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-700', manager: 'bg-emerald-100 text-emerald-700',
  technician: 'bg-orange-100 text-orange-700', sales: 'bg-green-100 text-green-700',
  financial: 'bg-amber-100 text-amber-700', viewer: 'bg-gray-100 text-gray-600',
  super_admin: 'bg-blue-100 text-blue-700',
}

function ToggleCell({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
        value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
      }`}
    >
      {value ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
    </button>
  )
}

interface UserPermissionEditorProps {
  user: AuthUser
  onClose: () => void
}

function UserPermissionEditor({ user, onClose }: UserPermissionEditorProps) {
  const [perms, setPerms] = useState<Record<string, ModulePermission>>({})
  const [sensitive, setSensitive] = useState<SensitivePermission>({
    user_id: user.id, can_view_profit: false, can_apply_discount: false, can_adjust_stock: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(GROUPS))

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: modPerms }, { data: sens }] = await Promise.all([
        supabase.from('module_permissions').select('*').eq('user_id', user.id),
        supabase.from('sensitive_permissions').select('*').eq('user_id', user.id).maybeSingle(),
      ])

      const map: Record<string, ModulePermission> = {}
      if (modPerms) {
        for (const p of modPerms) map[p.module_code] = p
      }
      // Fill defaults for modules not yet in DB
      for (const m of ALL_MODULES) {
        if (!map[m.code]) {
          map[m.code] = { user_id: user.id, module_code: m.code, can_view: false, can_create: false, can_edit: false, can_delete: false }
        }
      }
      setPerms(map)

      if (sens) setSensitive(sens)
      else setSensitive({ user_id: user.id, can_view_profit: false, can_apply_discount: false, can_adjust_stock: false })
      setLoading(false)
    }
    load()
  }, [user.id])

  const setPermField = (moduleCode: string, field: keyof Omit<ModulePermission, 'id' | 'user_id' | 'module_code'>, value: boolean) => {
    setPerms(prev => ({
      ...prev,
      [moduleCode]: { ...prev[moduleCode], [field]: value },
    }))
  }

  const applyPreset = (role: string) => {
    const allowed = new Set(ROLE_PRESETS[role] || [])
    const updated: Record<string, ModulePermission> = {}
    for (const m of ALL_MODULES) {
      const has = allowed.has(m.code)
      updated[m.code] = {
        ...(perms[m.code] || {}),
        user_id: user.id,
        module_code: m.code,
        can_view: has,
        can_create: has && role !== 'viewer',
        can_edit: has && role !== 'viewer',
        can_delete: has && (role === 'admin' || role === 'manager'),
      }
    }
    setPerms(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Upsert module permissions
      const rows = Object.values(perms).map(p => ({
        user_id: user.id,
        module_code: p.module_code,
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      }))
      await supabase.from('module_permissions').upsert(rows, { onConflict: 'user_id,module_code' })

      // Upsert sensitive permissions
      await supabase.from('sensitive_permissions').upsert({
        user_id: user.id,
        can_view_profit: sensitive.can_view_profit,
        can_apply_discount: sensitive.can_apply_discount,
        can_adjust_stock: sensitive.can_adjust_stock,
      }, { onConflict: 'user_id' })

      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* User info bar */}
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {(user.full_name?.[0] || user.email[0]).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{user.full_name || user.email}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
          {ROLE_LABELS[user.role] || user.role}
        </span>
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Aplicar predefinição de perfil</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ROLE_PRESETS).map(([role]) => (
            <button
              key={role}
              onClick={() => applyPreset(role)}
              className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all hover:shadow-sm ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600 border-gray-200'} border-current/20`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">
          Aplicar um preset preenche os módulos automaticamente. Você pode ajustar individualmente depois.
        </p>
      </div>

      {/* Module permissions table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] bg-gray-50 border-b border-gray-200 px-4 py-2.5 gap-2">
          <span className="text-xs font-semibold text-gray-600">Módulo</span>
          <span className="text-xs font-semibold text-gray-600 w-7 text-center">Ver</span>
          <span className="text-xs font-semibold text-gray-600 w-7 text-center">Criar</span>
          <span className="text-xs font-semibold text-gray-600 w-7 text-center">Editar</span>
          <span className="text-xs font-semibold text-gray-600 w-7 text-center">Excluir</span>
        </div>

        {GROUPS.map(group => {
          const groupModules = ALL_MODULES.filter(m => m.group === group)
          const expanded = expandedGroups.has(group)
          const enabledCount = groupModules.filter(m => perms[m.code]?.can_view).length

          return (
            <div key={group} className="border-b border-gray-100 last:border-0">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 transition text-left"
              >
                <span className="text-xs font-bold text-gray-700 flex-1">{group}</span>
                <span className="text-[10px] text-gray-400">{enabledCount}/{groupModules.length}</span>
                {expanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {groupModules.map(mod => {
                      const p = perms[mod.code]
                      if (!p) return null
                      return (
                        <div
                          key={mod.code}
                          className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-4 py-2 gap-2 border-t border-gray-50 hover:bg-blue-50/30 transition"
                        >
                          <span className={`text-xs font-medium ${p.can_view ? 'text-gray-800' : 'text-gray-400'}`}>
                            {mod.label}
                          </span>
                          <ToggleCell value={p.can_view}   onChange={v => setPermField(mod.code, 'can_view', v)} />
                          <ToggleCell value={p.can_create && p.can_view} onChange={v => setPermField(mod.code, 'can_create', v && p.can_view)} />
                          <ToggleCell value={p.can_edit && p.can_view}   onChange={v => setPermField(mod.code, 'can_edit', v && p.can_view)} />
                          <ToggleCell value={p.can_delete && p.can_view} onChange={v => setPermField(mod.code, 'can_delete', v && p.can_view)} />
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Sensitive permissions */}
      <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-600" />
          <p className="text-sm font-bold text-amber-700">Permissões Especiais</p>
        </div>
        {[
          { field: 'can_view_profit' as const, label: 'Ver margem e lucro das OS' },
          { field: 'can_apply_discount' as const, label: 'Aplicar descontos em orçamentos' },
          { field: 'can_adjust_stock' as const, label: 'Ajustar inventário manualmente' },
        ].map(({ field, label }) => (
          <label key={field} className="flex items-center gap-3 cursor-pointer">
            <button
              onClick={() => setSensitive(prev => ({ ...prev, [field]: !prev[field] }))}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                sensitive[field] ? 'bg-amber-500 text-white' : 'bg-white text-gray-300 border border-amber-200 hover:border-amber-300'
              }`}
            >
              {sensitive[field] ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
            <span className={`text-sm ${sensitive[field] ? 'text-amber-800 font-medium' : 'text-gray-500'}`}>{label}</span>
          </label>
        ))}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition flex items-center justify-center gap-2 ${
            savedOk ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60'
          }`}
        >
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
            : savedOk
              ? <><Check className="h-4 w-4" /> Salvo!</>
              : <><Save className="h-4 w-4" /> Salvar Permissões</>
          }
        </button>
      </div>
    </div>
  )
}

interface ModulePermissionsPanelProps {
  authUsers: AuthUser[]
}

export function ModulePermissionsPanel({ authUsers }: ModulePermissionsPanelProps) {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)

  const filtered = authUsers.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (selectedUser) {
    return (
      <div className="max-w-2xl">
        <button
          onClick={() => setSelectedUser(null)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-4 transition"
        >
          <ChevronDown className="h-4 w-4 rotate-90" />
          Voltar à lista de usuários
        </button>
        <UserPermissionEditor user={selectedUser} onClose={() => setSelectedUser(null)} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Selecione um usuário para configurar quais módulos do sistema ele pode acessar e com quais permissões (visualizar, criar, editar, excluir). Super Admins têm acesso irrestrito e não aparecem nesta lista.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <Shield className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <motion.button
              key={user.id}
              layout
              onClick={() => setSelectedUser(user)}
              className="w-full flex items-center gap-3 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm rounded-xl px-4 py-3 text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {(user.full_name?.[0] || user.email[0]).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.full_name || user.email}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <Shield className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
