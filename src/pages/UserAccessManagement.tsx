import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Users, UserPlus, Search, Filter, RefreshCw, Check, X, AlertCircle, Eye, EyeOff, Lock, Key, Mail, Wrench, Building2, HeartHandshake as HeartHeartHandshake, ChevronDown, ToggleLeft, ToggleRight, Save, UserCog, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'

interface SystemUser {
  id: string
  source: 'staff' | 'portal'
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
  linked_id: string | null
}

interface Customer {
  id: string
  nome_razao: string
  email?: string
}

const STAFF_ROLES: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  super_admin: { label: 'Super Admin',    color: 'bg-rose-100 text-rose-700',   icon: Shield,    desc: 'Acesso total ao sistema' },
  admin:       { label: 'Administrador',  color: 'bg-blue-100 text-blue-700',   icon: Shield,    desc: 'Gestão completa' },
  manager:     { label: 'Gestor',         color: 'bg-cyan-100 text-cyan-700',   icon: UserCog,   desc: 'Módulos gerenciais' },
  technician:  { label: 'Técnico',        color: 'bg-green-100 text-green-700', icon: Wrench,    desc: 'App de campo' },
  sales:       { label: 'Vendas',         color: 'bg-amber-100 text-amber-700', icon: Users,     desc: 'Módulo comercial' },
  financial:   { label: 'Financeiro',     color: 'bg-teal-100 text-teal-700',   icon: Key,       desc: 'Módulo financeiro' },
  viewer:      { label: 'Visualizador',   color: 'bg-gray-100 text-gray-600',   icon: Eye,       desc: 'Leitura apenas' },
}

const PORTAL_ROLES: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  cliente:   { label: 'Cliente',  color: 'bg-blue-100 text-blue-700',   icon: Building2, desc: 'Portal do cliente' },
  parceiro:  { label: 'Parceiro', color: 'bg-green-100 text-green-700', icon: HeartHandshake, desc: 'Portal do parceiro' },
}

const ALL_ROLES = { ...STAFF_ROLES, ...PORTAL_ROLES }

const ACCESS_TYPE_TABS = [
  { key: 'all',         label: 'Todos',          icon: Users },
  { key: 'admin',       label: 'Administração',  icon: Shield,    roles: ['super_admin', 'admin', 'manager'] },
  { key: 'technician',  label: 'Técnicos',       icon: Wrench,    roles: ['technician'] },
  { key: 'cliente',     label: 'Clientes Portal',icon: Building2, roles: ['cliente'] },
  { key: 'parceiro',    label: 'Parceiros',      icon: HeartHandshake, roles: ['parceiro'] },
] as const

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function RoleBadge({ role }: { role: string }) {
  const info = ALL_ROLES[role]
  if (!info) return <span className="text-xs text-gray-400">{role}</span>
  const Icon = info.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${info.color}`}>
      <Icon size={10} />
      {info.label}
    </span>
  )
}

function AccessTypeIcon({ source, role }: { source: string; role: string }) {
  if (source === 'portal') {
    return role === 'parceiro'
      ? <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0"><HeartHandshake size={16} className="text-green-600" /></div>
      : <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><Building2 size={16} className="text-blue-600" /></div>
  }
  if (role === 'technician') return <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0"><Wrench size={16} className="text-green-600" /></div>
  if (role === 'super_admin' || role === 'admin') return <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0"><Shield size={16} className="text-rose-600" /></div>
  return <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><Users size={16} className="text-gray-500" /></div>
}

export default function UserAccessManagement() {
  const { isSuperAdmin, isAdmin } = useUser()
  const [users, setUsers] = useState<SystemUser[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [view, setView] = useState<'list' | 'create'>('list')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [editUser, setEditUser] = useState<SystemUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<{ email: string; password: string; portal: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: generatePassword(),
    role: 'technician' as string,
    customer_id: '',
  })
  const [showPw, setShowPw] = useState(false)
  const isPortalRole = form.role === 'cliente' || form.role === 'parceiro'

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, custRes] = await Promise.all([
        supabase.rpc('get_all_system_users'),
        supabase.from('customers').select('id, nome_razao, email').order('nome_razao').limit(200),
      ])
      if (usersRes.data) setUsers(usersRes.data)
      if (custRes.data) setCustomers(custRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const tabRoles = ACCESS_TYPE_TABS.find(t => t.key === activeTab)
  const filtered = users.filter(u => {
    if (tabRoles && tabRoles.key !== 'all' && 'roles' in tabRoles) {
      if (!(tabRoles.roles as readonly string[]).includes(u.role)) return false
    }
    if (filterStatus === 'active' && !u.is_active) return false
    if (filterStatus === 'inactive' && u.is_active) return false
    if (search) {
      const s = search.toLowerCase()
      return u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    }
    return true
  })

  const tabCount = (key: string) => {
    const t = ACCESS_TYPE_TABS.find(t => t.key === key)
    if (!t || !('roles' in t)) return users.length
    return users.filter(u => (t.roles as readonly string[]).includes(u.role)).length
  }

  const handleToggleActive = async (user: SystemUser) => {
    await supabase.rpc('toggle_user_active', {
      p_user_id: user.id,
      p_source: user.source,
      p_is_active: !user.is_active
    })
    await loadData()
  }

  const handleUpdateStaffRole = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      await supabase.rpc('update_auth_account', {
        p_user_id: editUser.id,
        p_role: editUser.role,
        p_name: editUser.full_name,
      })
      setEditUser(null)
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    setError(null)
    if (!form.email.trim()) { setError('E-mail é obrigatório'); return }
    if (!form.password || form.password.length < 6) { setError('Senha deve ter ao menos 6 caracteres'); return }

    setSaving(true)
    try {
      if (isPortalRole) {
        const res = await supabase.rpc('create_portal_account_full', {
          p_email: form.email.trim().toLowerCase(),
          p_full_name: form.full_name.trim(),
          p_password: form.password,
          p_role: form.role,
          p_customer_id: form.customer_id || null,
          p_partner_id: null,
        })
        if (res.error) throw res.error
        const data = res.data as any
        if (!data?.success) throw new Error(data?.error || 'Erro ao criar conta')
        setSuccess({ email: form.email.trim().toLowerCase(), password: form.password, portal: true })
      } else {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: form.email.trim().toLowerCase(),
            password: form.password,
            full_name: form.full_name.trim(),
            role: form.role,
          }),
        })
        const json = await resp.json()
        if (!resp.ok) throw new Error(json.error || 'Erro ao criar usuário')
        setSuccess({ email: form.email.trim().toLowerCase(), password: form.password, portal: false })
      }
      setForm({ full_name: '', email: '', password: generatePassword(), role: 'technician', customer_id: '' })
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar acesso')
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-500 text-sm">Apenas administradores podem gerenciar acessos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-sm">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Acessos</h1>
            <p className="text-sm text-gray-500">Administrador, técnico, cliente e parceiro</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw size={17} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setView(v => v === 'list' ? 'create' : 'list'); setSuccess(null); setError(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === 'create'
                ? 'bg-gray-900 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {view === 'create' ? <><X size={15} /> Cancelar</> : <><UserPlus size={15} /> Criar acesso</>}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {view === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Novo acesso ao sistema</h2>
              <p className="text-xs text-gray-500 mt-0.5">Escolha o tipo de acesso e preencha os dados</p>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center"
              >
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={26} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Acesso criado</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {success.portal ? 'Conta do portal criada.' : 'Conta do sistema criada.'} Compartilhe as credenciais abaixo.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-3 max-w-sm mx-auto mb-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">E-mail</p>
                    <p className="text-sm font-mono text-gray-800">{success.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Senha temporária</p>
                    <p className="text-sm font-mono font-bold bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 tracking-wider text-gray-800">{success.password}</p>
                  </div>
                  {success.portal && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <ExternalLink size={12} />
                      Login em: <strong>/portal/login</strong>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 max-w-sm mx-auto">
                  <button onClick={() => setSuccess(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Criar outro
                  </button>
                  <button onClick={() => setView('list')} className="flex-1 py-2.5 bg-blue-600 rounded-xl text-sm font-medium text-white hover:bg-blue-700">
                    Ver usuários
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="p-6 space-y-5 max-w-lg">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
                    <AlertCircle size={15} className="shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de acesso</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { role: 'admin',      label: 'Administrador', icon: Shield,    color: 'border-blue-400 bg-blue-50', desc: 'Painel completo' },
                      { role: 'technician', label: 'Técnico',       icon: Wrench,    color: 'border-green-400 bg-green-50', desc: 'App de campo' },
                      { role: 'cliente',    label: 'Cliente',       icon: Building2, color: 'border-cyan-400 bg-cyan-50', desc: 'Portal cliente' },
                      { role: 'parceiro',   label: 'Parceiro',      icon: HeartHandshake, color: 'border-teal-400 bg-teal-50', desc: 'Portal parceiro' },
                      { role: 'manager',    label: 'Gestor',        icon: UserCog,   color: 'border-gray-400 bg-gray-50', desc: 'Módulos gerenciais' },
                      { role: 'financial',  label: 'Financeiro',    icon: Key,       color: 'border-amber-400 bg-amber-50', desc: 'Módulo financeiro' },
                    ].map(({ role, label, icon: Icon, color, desc }) => (
                      <button
                        key={role}
                        onClick={() => setForm(f => ({ ...f, role }))}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                          form.role === role
                            ? `${color} shadow-sm`
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <Icon size={16} className={form.role === role ? 'text-gray-700' : 'text-gray-400'} />
                        <div>
                          <p className={`text-sm font-semibold ${form.role === role ? 'text-gray-900' : 'text-gray-600'}`}>{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Nome do usuário"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Senha temporária <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full pl-9 pr-28 py-2.5 border border-gray-200 rounded-xl text-sm font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button type="button" onClick={() => setForm(f => ({ ...f, password: generatePassword() }))} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg">
                        Gerar
                      </button>
                      <button type="button" onClick={() => setShowPw(p => !p)} className="p-1 hover:bg-gray-100 rounded-lg">
                        {showPw ? <EyeOff size={14} className="text-gray-400" /> : <Eye size={14} className="text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Copie antes de salvar — não será exibida novamente</p>
                </div>

                {isPortalRole && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Vincular a cliente {form.role === 'cliente' && <span className="text-gray-400 font-normal">(opcional)</span>}
                    </label>
                    <select
                      value={form.customer_id}
                      onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">— Selecionar cliente —</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.nome_razao}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      {form.role === 'cliente'
                        ? 'Vinculando ao cliente, o portal exibirá as OS e dados desse cliente.'
                        : 'Vinculando ao cliente parceiro, as indicações serão associadas.'}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving
                    ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Criando...</>
                    : <><UserPlus size={16} /> Criar acesso</>
                  }
                </button>
              </div>
            )}
          </motion.div>
        )}

        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm overflow-x-auto">
              {ACCESS_TYPE_TABS.map(tab => {
                const Icon = tab.icon
                const count = tabCount(tab.key)
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.key
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>{count}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3">
                <Filter size={14} className="text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                  className="py-2 text-sm bg-transparent focus:outline-none text-gray-700"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw size={28} className="animate-spin text-blue-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Users size={44} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(u => (
                  <motion.div
                    key={`${u.source}-${u.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
                  >
                    <AccessTypeIcon source={u.source} role={u.role} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {u.full_name || u.email}
                        </span>
                        <RoleBadge role={u.role} />
                        {u.source === 'portal' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Portal</span>
                        )}
                        {u.is_active ? (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center gap-1">
                            <Check size={9} /> Ativo
                          </span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center gap-1">
                            <X size={9} /> Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      {u.last_login_at && (
                        <p className="text-xs text-gray-300 mt-0.5">Último acesso: {formatDate(u.last_login_at)}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {u.source === 'staff' && u.role !== 'super_admin' && (
                        <button
                          onClick={() => setEditUser({ ...u })}
                          className="p-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors"
                          title="Editar papel"
                        >
                          <UserCog size={16} />
                        </button>
                      )}
                      {u.role !== 'super_admin' && (
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-2 rounded-xl transition-colors ${
                            u.is_active
                              ? 'hover:bg-red-50 hover:text-red-500 text-gray-400'
                              : 'hover:bg-green-50 hover:text-green-600 text-gray-400'
                          }`}
                          title={u.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {u.is_active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setEditUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Editar papel</h3>
                  <p className="text-xs text-gray-400">{editUser.email}</p>
                </div>
                <button onClick={() => setEditUser(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                  <input
                    type="text"
                    value={editUser.full_name}
                    onChange={e => setEditUser(u => u ? { ...u, full_name: e.target.value } : u)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Papel (role)</label>
                  <select
                    value={editUser.role}
                    onChange={e => setEditUser(u => u ? { ...u, role: e.target.value } : u)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(STAFF_ROLES).filter(([r]) => r !== 'super_admin').map(([r, info]) => (
                      <option key={r} value={r}>{info.label} — {info.desc}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-5 pt-0 flex gap-3">
                <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-xl hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateStaffRole}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Save size={14} />}
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
