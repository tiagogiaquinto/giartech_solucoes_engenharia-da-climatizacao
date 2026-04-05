import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, HeartHandshake, UserPlus, Search, RefreshCw,
  Check, X, AlertCircle, Eye, EyeOff, Lock, Mail,
  ExternalLink, ToggleRight, ToggleLeft, Copy, CheckCheck, Filter
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface PortalUser {
  id: string
  email: string
  full_name: string
  role: 'cliente' | 'parceiro'
  is_active: boolean
  last_login_at: string | null
  created_at: string
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

interface Props {
  onCreated?: () => void
}

export const CreatePortalAccessPanel: React.FC<Props> = ({ onCreated }) => {
  const [users, setUsers] = useState<PortalUser[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [subView, setSubView] = useState<'list' | 'create'>('list')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'cliente' | 'parceiro'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ email: string; password: string; role: string } | null>(null)
  const [showPw, setShowPw] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: generatePassword(),
    role: 'cliente' as 'cliente' | 'parceiro',
    customer_id: '',
  })

  const loadData = useCallback(async () => {
    setLoadingList(true)
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
      setLoadingList(false)
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

  const handleToggleActive = async (u: PortalUser) => {
    await supabase.rpc('toggle_user_active', {
      p_user_id: u.id,
      p_source: 'portal',
      p_is_active: !u.is_active,
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
      onCreated?.()
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

  return (
    <div>
      {/* Sub-header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-white font-semibold text-base">Acessos ao Portal Externo</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Criar e gerenciar logins de clientes e parceiros em <span className="text-blue-400">/portal/login</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}
          >
            <RefreshCw size={13} className={loadingList ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setSubView(v => v === 'list' ? 'create' : 'list'); setSuccess(null); setError(null) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={subView === 'create'
              ? { background: 'rgba(255,255,255,0.08)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }
              : { background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', color: '#fff', border: 'none' }
            }
          >
            {subView === 'create'
              ? <><X size={14} /> Cancelar</>
              : <><UserPlus size={14} /> Novo acesso</>
            }
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total no portal', value: users.length, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
          { label: 'Clientes ativos', value: users.filter(u => u.role === 'cliente' && u.is_active).length, color: '#67e8f9', bg: 'rgba(103,232,249,0.1)', border: 'rgba(103,232,249,0.2)' },
          { label: 'Parceiros', value: countRole('parceiro'), color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)', border: 'rgba(110,231,183,0.2)' },
          { label: 'Inativos', value: users.filter(u => !u.is_active).length, color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Create form ── */}
        {subView === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.18)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
              <h3 className="text-white font-medium text-sm">Criar novo acesso ao portal</h3>
              <p className="text-gray-500 text-xs mt-0.5">O usuário fará login em <strong className="text-blue-400">/portal/login</strong></p>
            </div>

            {success ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <Check size={26} className="text-green-400" />
                </div>
                <h3 className="text-white text-lg font-bold mb-1">Acesso criado</h3>
                <p className="text-gray-400 text-sm mb-6">
                  {success.role === 'cliente' ? 'Cliente' : 'Parceiro'} cadastrado. Compartilhe as credenciais abaixo.
                </p>
                <div className="rounded-xl p-4 text-left space-y-3 max-w-sm mx-auto mb-6"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">E-mail</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-gray-200 flex-1 truncate">{success.email}</p>
                      <button onClick={() => copyToClipboard(success.email, 'email')}
                        className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-gray-400">
                        {copied === 'email' ? <CheckCheck size={13} className="text-green-400" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Senha temporária</p>
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                      <p className="text-sm font-mono font-bold tracking-wider text-amber-200 flex-1">{success.password}</p>
                      <button onClick={() => copyToClipboard(success.password, 'password')}
                        className="p-1 rounded-lg hover:bg-amber-400/20 text-amber-400">
                        {copied === 'password' ? <CheckCheck size={13} className="text-green-400" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-400 pt-1">
                    <ExternalLink size={11} />
                    Login em: <strong>/portal/login</strong>
                  </div>
                </div>
                <div className="flex gap-3 max-w-sm mx-auto">
                  <button
                    onClick={() => { setSuccess(null); setForm({ full_name: '', email: '', password: generatePassword(), role: 'cliente', customer_id: '' }) }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'transparent' }}
                  >
                    Criar outro
                  </button>
                  <button onClick={() => setSubView('list')}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                    Ver lista
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="p-5 space-y-4 max-w-lg">
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </div>
                )}

                {/* Role selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de acesso</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { role: 'cliente' as const, label: 'Cliente', icon: Building2, desc: 'Acessa OS, documentos e histórico', activeColor: '#60a5fa', activeBg: 'rgba(96,165,250,0.12)', activeBorder: 'rgba(96,165,250,0.35)' },
                      { role: 'parceiro' as const, label: 'Parceiro', icon: HeartHandshake, desc: 'Visualiza indicações e comissões', activeColor: '#6ee7b7', activeBg: 'rgba(110,231,183,0.12)', activeBorder: 'rgba(110,231,183,0.35)' },
                    ]).map(({ role, label, icon: Icon, desc, activeColor, activeBg, activeBorder }) => (
                      <button key={role} onClick={() => setForm(f => ({ ...f, role }))}
                        className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                        style={{
                          background: form.role === role ? activeBg : 'rgba(255,255,255,0.04)',
                          border: `2px solid ${form.role === role ? activeBorder : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        <Icon size={18} style={{ color: form.role === role ? activeColor : '#6b7280' }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: form.role === role ? '#fff' : '#9ca3af' }}>{label}</p>
                          <p className="text-xs text-gray-600 leading-tight mt-0.5">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Nome completo <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder={form.role === 'cliente' ? 'Nome do cliente' : 'Nome do parceiro'}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    E-mail de acesso <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-3 text-gray-500" />
                    <input type="email" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Senha temporária <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-3 text-gray-500" />
                    <input type={showPw ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full pl-10 pr-28 py-2.5 rounded-xl text-sm font-mono tracking-wider text-white outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                        className="px-2 py-1 text-xs rounded-lg text-gray-400 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.07)' }}>
                        Gerar
                      </button>
                      <button type="button" onClick={() => setShowPw(p => !p)}
                        className="p-1 rounded-lg hover:bg-white/10 text-gray-500">
                        {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Copie antes de salvar — não será exibida novamente</p>
                </div>

                {/* Link customer */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Vincular a cliente cadastrado <span className="text-gray-500 font-normal">(opcional)</span>
                  </label>
                  <select value={form.customer_id}
                    onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    <option value="" style={{ background: '#0d1117' }}>— Não vincular —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#0d1117' }}>{c.nome_razao}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    {form.role === 'cliente'
                      ? 'O portal exibirá as OS e dados desse cliente.'
                      : 'As indicações serão associadas a este cadastro.'}
                  </p>
                </div>

                <button onClick={handleCreate} disabled={saving}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', color: '#fff' }}
                >
                  {saving
                    ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Criando...</>
                    : <><UserPlus size={15} /> Criar acesso ao portal</>
                  }
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── List view ── */}
        {subView === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Tab + search filters */}
            <div className="flex gap-1 p-1 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
              {[
                { key: 'all', label: 'Todos', count: users.length },
                { key: 'cliente', label: 'Clientes', count: countRole('cliente') },
                { key: 'parceiro', label: 'Parceiros', count: countRole('parceiro') },
              ].map(tab => (
                <button key={tab.key} onClick={() => setFilterRole(tab.key as any)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: filterRole === tab.key ? 'rgba(29,78,216,0.55)' : 'transparent',
                    color: filterRole === tab.key ? '#93c5fd' : '#6b7280',
                    border: filterRole === tab.key ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                  }}>
                  {tab.label}
                  <span className="font-normal" style={{ color: filterRole === tab.key ? '#93c5fd80' : '#4b5563' }}>
                    ({tab.count})
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3.5 top-3 text-gray-500" />
                <input type="text" placeholder="Buscar por nome ou e-mail..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}
                />
              </div>
              <div className="flex items-center gap-1.5 px-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <Filter size={12} className="text-gray-500" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                  className="py-2 text-sm bg-transparent outline-none text-gray-300"
                  style={{ background: 'transparent' }}>
                  <option value="all" style={{ background: '#0d1117' }}>Todos</option>
                  <option value="active" style={{ background: '#0d1117' }}>Ativos</option>
                  <option value="inactive" style={{ background: '#0d1117' }}>Inativos</option>
                </select>
              </div>
            </div>

            {loadingList ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={24} className="animate-spin text-blue-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Building2 size={40} className="text-gray-700 mb-3" />
                <p className="text-gray-500 font-medium text-sm">Nenhum acesso encontrado</p>
                <p className="text-gray-600 text-xs mt-1">Clique em "Novo acesso" para criar o primeiro</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((u, i) => (
                  <motion.div key={u.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={u.role === 'parceiro'
                        ? { background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.2)' }
                        : { background: 'rgba(103,232,249,0.12)', border: '1px solid rgba(103,232,249,0.2)' }
                      }>
                      {u.role === 'parceiro'
                        ? <HeartHandshake size={17} className="text-emerald-400" />
                        : <Building2 size={17} className="text-cyan-400" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-white truncate">{u.full_name || u.email}</span>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium"
                          style={u.role === 'parceiro'
                            ? { background: 'rgba(110,231,183,0.12)', color: '#6ee7b7' }
                            : { background: 'rgba(103,232,249,0.12)', color: '#67e8f9' }
                          }>
                          {u.role === 'parceiro' ? 'Parceiro' : 'Cliente'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-xs"
                          style={u.is_active
                            ? { background: 'rgba(34,197,94,0.1)', color: '#4ade80' }
                            : { background: 'rgba(239,68,68,0.1)', color: '#f87171' }
                          }>
                          {u.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {u.last_login_at
                          ? `Último acesso: ${formatDate(u.last_login_at)}`
                          : `Nunca acessou — criado em ${formatDate(u.created_at)}`
                        }
                      </p>
                    </div>

                    <button onClick={() => handleToggleActive(u)}
                      title={u.is_active ? 'Desativar acesso' : 'Ativar acesso'}
                      className="p-1.5 rounded-xl transition-colors hover:bg-white/10">
                      {u.is_active
                        ? <ToggleRight size={22} className="text-green-400" />
                        : <ToggleLeft size={22} className="text-gray-600" />
                      }
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
