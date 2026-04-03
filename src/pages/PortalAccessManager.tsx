import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, HeartHandshake, UserPlus, Search, RefreshCw, Check, X,
  AlertCircle, Eye, EyeOff, Lock, Mail, Key, ExternalLink, ToggleLeft,
  ToggleRight, Crown, Filter, Copy, CheckCheck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'

interface PortalUser {
  id: string
  source: 'portal'
  email: string
  full_name: string
  role: 'cliente' | 'parceiro'
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

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function PortalAccessManager() {
  const { isSuperAdmin } = useUser()

  const [users, setUsers] = useState<PortalUser[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'create'>('list')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'cliente' | 'parceiro'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ email: string; password: string; role: string } | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: generatePassword(),
    role: 'cliente' as 'cliente' | 'parceiro',
    customer_id: '',
  })
  const [showPw, setShowPw] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, custRes] = await Promise.all([
        supabase.rpc('get_all_system_users'),
        supabase.from('customers').select('id, nome_razao, email').order('nome_razao').limit(300),
      ])
      if (usersRes.data) {
        setUsers((usersRes.data as any[]).filter(u => u.source === 'portal') as PortalUser[])
      }
      if (custRes.data) setCustomers(custRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = users.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false
    if (filterStatus === 'active' && !u.is_active) return false
    if (filterStatus === 'inactive' && u.is_active) return false
    if (search) {
      const s = search.toLowerCase()
      return u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    }
    return true
  })

  const countRole = (r: 'cliente' | 'parceiro') => users.filter(u => u.role === r).length

  const handleToggleActive = async (user: PortalUser) => {
    await supabase.rpc('toggle_user_active', {
      p_user_id: user.id,
      p_source: 'portal',
      p_is_active: !user.is_active,
    })
    await loadData()
  }

  const handleCreate = async () => {
    setError(null)
    if (!form.email.trim()) { setError('E-mail é obrigatório'); return }
    if (!form.password || form.password.length < 6) { setError('Senha deve ter ao menos 6 caracteres'); return }
    if (!form.full_name.trim()) { setError('Nome é obrigatório'); return }

    setSaving(true)
    try {
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
      setSuccess({ email: form.email.trim().toLowerCase(), password: form.password, role: form.role })
      setForm({ full_name: '', email: '', password: generatePassword(), role: 'cliente', customer_id: '' })
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar acesso')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 text-sm">Apenas o diretor pode gerenciar acessos ao portal.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
            <Crown size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Acessos ao Portal</h1>
            <p className="text-sm text-gray-500">Gerencie clientes e parceiros com acesso externo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Atualizar">
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
            {view === 'create' ? <><X size={15} /> Cancelar</> : <><UserPlus size={15} /> Novo acesso</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total no portal', value: users.length, color: 'bg-blue-50 text-blue-700', icon: Building2 },
          { label: 'Clientes ativos', value: users.filter(u => u.role === 'cliente' && u.is_active).length, color: 'bg-cyan-50 text-cyan-700', icon: Building2 },
          { label: 'Parceiros', value: countRole('parceiro'), color: 'bg-teal-50 text-teal-700', icon: HeartHandshake },
          { label: 'Inativos', value: users.filter(u => !u.is_active).length, color: 'bg-gray-50 text-gray-600', icon: Lock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`${color} rounded-2xl p-4 flex items-center gap-3`}>
            <Icon size={20} className="shrink-0 opacity-70" />
            <div>
              <p className="text-2xl font-bold leading-none">{value}</p>
              <p className="text-xs mt-0.5 opacity-70">{label}</p>
            </div>
          </div>
        ))}
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
              <h2 className="font-semibold text-gray-900">Criar novo acesso ao portal</h2>
              <p className="text-xs text-gray-500 mt-0.5">O acesso será válido em <strong>/portal/login</strong></p>
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
                  {success.role === 'cliente' ? 'Cliente' : 'Parceiro'} cadastrado com sucesso. Compartilhe as credenciais abaixo.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-3 max-w-sm mx-auto mb-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">E-mail</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-gray-800 flex-1 truncate">{success.email}</p>
                      <button
                        onClick={() => copyToClipboard(success.email, 'email')}
                        className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors shrink-0"
                      >
                        {copied === 'email' ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Senha temporária</p>
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <p className="text-sm font-mono font-bold tracking-wider text-gray-800 flex-1">{success.password}</p>
                      <button
                        onClick={() => copyToClipboard(success.password, 'password')}
                        className="p-1 hover:bg-amber-100 rounded-lg text-amber-700 transition-colors shrink-0"
                      >
                        {copied === 'password' ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-600 pt-1">
                    <ExternalLink size={12} />
                    Login em: <strong>/portal/login</strong>
                  </div>
                </div>
                <div className="flex gap-3 max-w-sm mx-auto">
                  <button
                    onClick={() => { setSuccess(null); setForm({ full_name: '', email: '', password: generatePassword(), role: 'cliente', customer_id: '' }) }}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Criar outro
                  </button>
                  <button onClick={() => setView('list')} className="flex-1 py-2.5 bg-blue-600 rounded-xl text-sm font-medium text-white hover:bg-blue-700">
                    Ver lista
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
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        role: 'cliente' as const,
                        label: 'Cliente',
                        icon: Building2,
                        desc: 'Acessa OS, documentos e histórico',
                        color: 'border-blue-400 bg-blue-50',
                      },
                      {
                        role: 'parceiro' as const,
                        label: 'Parceiro',
                        icon: HeartHandshake,
                        desc: 'Visualiza indicações e comissões',
                        color: 'border-teal-400 bg-teal-50',
                      },
                    ].map(({ role, label, icon: Icon, desc, color }) => (
                      <button
                        key={role}
                        onClick={() => setForm(f => ({ ...f, role }))}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                          form.role === role ? `${color} shadow-sm` : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <Icon size={20} className={form.role === role ? 'text-gray-700' : 'text-gray-400'} />
                        <div>
                          <p className={`text-sm font-semibold ${form.role === role ? 'text-gray-900' : 'text-gray-600'}`}>{label}</p>
                          <p className="text-xs text-gray-400 leading-tight mt-0.5">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nome completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder={form.role === 'cliente' ? 'Nome do cliente' : 'Nome do parceiro'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    E-mail de acesso <span className="text-red-500">*</span>
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
                  <p className="text-xs text-gray-400 mt-1">Copie antes de salvar — a senha não será exibida novamente</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vincular a cliente cadastrado <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <select
                    value={form.customer_id}
                    onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">— Não vincular —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.nome_razao}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    {form.role === 'cliente'
                      ? 'Vinculando ao cadastro, o portal exibirá as OS e dados desse cliente.'
                      : 'Vinculando, as indicações serão associadas a este cadastro.'}
                  </p>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving
                    ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Criando...</>
                    : <><UserPlus size={16} /> Criar acesso ao portal</>}
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
            <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
              {[
                { key: 'all', label: 'Todos', count: users.length },
                { key: 'cliente', label: 'Clientes', count: countRole('cliente') },
                { key: 'parceiro', label: 'Parceiros', count: countRole('parceiro') },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterRole(tab.key as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterRole === tab.key
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    filterRole === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{tab.count}</span>
                </button>
              ))}
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
              <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <Building2 size={44} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium text-gray-500">Nenhum acesso encontrado</p>
                <p className="text-sm mt-1">Clique em "Novo acesso" para criar o primeiro</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(u => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      u.role === 'parceiro' ? 'bg-teal-100' : 'bg-blue-100'
                    }`}>
                      {u.role === 'parceiro'
                        ? <HeartHandshake size={18} className="text-teal-600" />
                        : <Building2 size={18} className="text-blue-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {u.full_name || u.email}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'parceiro'
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role === 'parceiro'
                            ? <><HeartHandshake size={9} /> Parceiro</>
                            : <><Building2 size={9} /> Cliente</>}
                        </span>
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
                      {u.last_login_at ? (
                        <p className="text-xs text-gray-300 mt-0.5">Último acesso: {formatDate(u.last_login_at)}</p>
                      ) : (
                        <p className="text-xs text-gray-300 mt-0.5">Nunca acessou — Criado em {formatDate(u.created_at)}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`p-2 rounded-xl transition-colors ${
                        u.is_active
                          ? 'hover:bg-red-50 hover:text-red-500 text-gray-400'
                          : 'hover:bg-green-50 hover:text-green-600 text-gray-400'
                      }`}
                      title={u.is_active ? 'Desativar acesso' : 'Ativar acesso'}
                    >
                      {u.is_active
                        ? <ToggleRight size={20} className="text-green-500" />
                        : <ToggleLeft size={20} />}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
