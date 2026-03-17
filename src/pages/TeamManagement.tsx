import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Shield, Save, X, Check,
  Mail, Eye, EyeOff, AlertCircle, Crown,
  RefreshCw, ChevronDown, ChevronUp, Lock,
  ToggleLeft, ToggleRight, Clock, BadgeCheck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import { useNavigate } from 'react-router-dom'

const MODULE_GROUPS = [
  {
    group: 'Operacional',
    color: 'blue',
    modules: [
      { code: 'agenda', label: 'Agenda' },
      { code: 'service_orders', label: 'Ordens de Serviço' },
      { code: 'rotas', label: 'Rotas' },
      { code: 'catalogo', label: 'Catálogo de Serviços' },
    ]
  },
  {
    group: 'Comercial',
    color: 'emerald',
    modules: [
      { code: 'clientes', label: 'Clientes' },
      { code: 'crm', label: 'CRM Profissional' },
      { code: 'mensagens_crm', label: 'Mensagens do CRM' },
      { code: 'gamificacao', label: 'Gamificação' },
      { code: 'metas', label: 'Metas & Rankings' },
    ]
  },
  {
    group: 'Financeiro',
    color: 'amber',
    modules: [
      { code: 'financeiro', label: 'Financeiro' },
      { code: 'salarios', label: 'Gestão de Salários' },
      { code: 'compras', label: 'Compras' },
      { code: 'fornecedores', label: 'Fornecedores' },
    ]
  },
  {
    group: 'Estoque & Recursos',
    color: 'orange',
    modules: [
      { code: 'estoque', label: 'Estoque' },
    ]
  },
  {
    group: 'Documentos & Relatórios',
    color: 'sky',
    modules: [
      { code: 'documentos', label: 'Centro de Documentos' },
      { code: 'relatorios', label: 'Relatórios' },
      { code: 'templates', label: 'Templates de Documentos' },
      { code: 'biblioteca', label: 'Biblioteca Digital' },
    ]
  },
  {
    group: 'Administração',
    color: 'rose',
    modules: [
      { code: 'dashboard', label: 'Dashboard CFO' },
      { code: 'automacoes', label: 'Automações' },
      { code: 'thomaz', label: 'Thomaz AI' },
      { code: 'email', label: 'Email Corporativo' },
      { code: 'pessoas', label: 'Gestão de Pessoas' },
      { code: 'auditoria', label: 'Auditoria' },
      { code: 'configuracoes', label: 'Configurações' },
    ]
  },
]

const ALL_MODULES = MODULE_GROUPS.flatMap(g => g.modules)

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  technician: 'Técnico',
  sales: 'Vendas',
  financial: 'Financeiro',
  viewer: 'Visualizador',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-emerald-100 text-emerald-700',
  technician: 'bg-orange-100 text-orange-700',
  sales: 'bg-green-100 text-green-700',
  financial: 'bg-amber-100 text-amber-700',
  viewer: 'bg-gray-100 text-gray-600',
}

const GROUP_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    badge: 'bg-blue-600',    text: 'text-blue-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-600', text: 'text-emerald-700' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-600',   text: 'text-amber-700' },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  badge: 'bg-orange-600',  text: 'text-orange-700' },
  sky:     { bg: 'bg-sky-50',     border: 'border-sky-200',     badge: 'bg-sky-600',     text: 'text-sky-700' },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    badge: 'bg-rose-600',    text: 'text-rose-700' },
}

type AccessLevel = 'none' | 'read' | 'full'

interface SensitivePerms {
  can_view_profit: boolean
  can_apply_discount: boolean
  can_adjust_stock: boolean
}

interface ModulePerm {
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

interface TeamMember {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  last_login: string | null
  permissions: Record<string, ModulePerm>
  sensitive: SensitivePerms
}

function getAccessLevel(p: ModulePerm): AccessLevel {
  if (!p.can_view) return 'none'
  if (p.can_create || p.can_edit) return 'full'
  return 'read'
}

function applyAccessLevel(level: AccessLevel): ModulePerm {
  if (level === 'none') return { can_view: false, can_create: false, can_edit: false, can_delete: false }
  if (level === 'read') return { can_view: true, can_create: false, can_edit: false, can_delete: false }
  return { can_view: true, can_create: true, can_edit: true, can_delete: false }
}

function formatDate(d: string | null): string {
  if (!d) return 'Nunca'
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface ToastState { message: string; type: 'success' | 'error' }

const TeamManagement: React.FC = () => {
  const { isSuperAdmin } = useUser()
  const navigate = useNavigate()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteData, setInviteData] = useState({ email: '', full_name: '', password: '', role: 'viewer' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [localPerms, setLocalPerms] = useState<Record<string, Record<string, ModulePerm>>>({})
  const [localSensitive, setLocalSensitive] = useState<Record<string, SensitivePerms>>({})
  const [toast, setToast] = useState<ToastState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isSuperAdmin) { navigate('/'); return }
    loadMembers()
  }, [isSuperAdmin])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadMembers = async () => {
    setLoading(true)
    try {
      const { data: profiles, error } = await supabase
        .from('auth_accounts')
        .select('*')
        .neq('role', 'super_admin')
        .order('created_at', { ascending: false })

      if (error) throw error

      const memberList: TeamMember[] = []
      const lp: typeof localPerms = {}
      const ls: typeof localSensitive = {}

      for (const p of profiles || []) {
        const [{ data: perms }, { data: sens }] = await Promise.all([
          supabase.from('module_permissions').select('module_code, can_view, can_create, can_edit, can_delete').eq('user_id', p.id),
          supabase.from('sensitive_permissions').select('*').eq('user_id', p.id).maybeSingle()
        ])

        const permMap: Record<string, ModulePerm> = {}
        for (const m of ALL_MODULES) {
          const found = perms?.find(px => px.module_code === m.code)
          permMap[m.code] = found
            ? { can_view: found.can_view, can_create: found.can_create, can_edit: found.can_edit, can_delete: found.can_delete }
            : { can_view: true, can_create: true, can_edit: true, can_delete: false }
        }

        const sensData: SensitivePerms = {
          can_view_profit: sens?.can_view_profit ?? false,
          can_apply_discount: sens?.can_apply_discount ?? false,
          can_adjust_stock: sens?.can_adjust_stock ?? false,
        }

        const member: TeamMember = {
          id: p.id, email: p.email, full_name: p.full_name, role: p.role,
          is_active: p.is_active, created_at: p.created_at, last_login: p.last_login,
          permissions: permMap, sensitive: sensData
        }
        memberList.push(member)
        lp[p.id] = { ...permMap }
        ls[p.id] = { ...sensData }
      }

      setMembers(memberList)
      setLocalPerms(lp)
      setLocalSensitive(ls)
    } catch (err) {
      console.error('Error loading members:', err)
    } finally {
      setLoading(false)
    }
  }

  const setAccessLevel = (userId: string, moduleCode: string, level: AccessLevel) => {
    setLocalPerms(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [moduleCode]: applyAccessLevel(level) }
    }))
  }

  const setAllAccess = (userId: string, level: AccessLevel) => {
    setLocalPerms(prev => {
      const updated = { ...prev[userId] }
      ALL_MODULES.forEach(m => { updated[m.code] = applyAccessLevel(level) })
      return { ...prev, [userId]: updated }
    })
  }

  const toggleSensitive = (userId: string, field: keyof SensitivePerms) => {
    setLocalSensitive(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: !prev[userId][field] }
    }))
  }

  const savePermissions = async (userId: string) => {
    setSaving(userId)
    try {
      const perms = localPerms[userId]
      const sens = localSensitive[userId]

      const upsertRows = ALL_MODULES.map(m => ({
        user_id: userId, module_code: m.code,
        can_view: perms[m.code].can_view, can_create: perms[m.code].can_create,
        can_edit: perms[m.code].can_edit, can_delete: perms[m.code].can_delete
      }))

      const [{ error: permsError }, { error: sensError }] = await Promise.all([
        supabase.from('module_permissions').upsert(upsertRows, { onConflict: 'user_id,module_code' }),
        supabase.from('sensitive_permissions').upsert({
          user_id: userId, ...sens
        }, { onConflict: 'user_id' })
      ])

      if (permsError) throw permsError
      if (sensError) throw sensError

      setMembers(prev => prev.map(m => m.id === userId ? { ...m, permissions: perms, sensitive: sens } : m))
      showToast('Permissões salvas com sucesso!')
    } catch (err) {
      console.error('Error saving permissions:', err)
      showToast('Erro ao salvar permissões', 'error')
    } finally {
      setSaving(null)
    }
  }

  const toggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase.from('auth_accounts').update({ is_active: !currentActive }).eq('id', userId)
      if (error) throw error
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, is_active: !currentActive } : m))
      showToast(!currentActive ? 'Usuário ativado.' : 'Usuário desativado.')
    } catch (err) {
      console.error(err)
    }
  }

  const changeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('auth_accounts').update({ role: newRole }).eq('id', userId)
      if (error) throw error
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m))
    } catch (err) {
      console.error(err)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    setInviteLoading(true)
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: inviteData.password,
        options: { data: { full_name: inviteData.full_name } }
      })
      if (signUpError) throw signUpError

      const userId = signUpData.user?.id
      if (userId) {
        await supabase.from('auth_accounts').upsert({
          id: userId, email: inviteData.email,
          full_name: inviteData.full_name, role: inviteData.role, is_active: true
        }, { onConflict: 'id' })

        const defaultPerms = ALL_MODULES.map(m => ({
          user_id: userId, module_code: m.code,
          can_view: true, can_create: true, can_edit: true, can_delete: false
        }))
        await supabase.from('module_permissions').upsert(defaultPerms, { onConflict: 'user_id,module_code' })
        await supabase.from('sensitive_permissions').upsert({
          user_id: userId, can_view_profit: false, can_apply_discount: false, can_adjust_stock: false
        }, { onConflict: 'user_id' })
      }

      setInviteSuccess(`Usuário ${inviteData.email} cadastrado com sucesso!`)
      setInviteData({ email: '', full_name: '', password: '', role: 'viewer' })
      loadMembers()
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setInviteError('Este e-mail já está cadastrado.')
      } else {
        setInviteError(msg || 'Erro ao cadastrar usuário')
      }
    } finally {
      setInviteLoading(false)
    }
  }

  const filteredMembers = members.filter(m =>
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isSuperAdmin) return null

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-white border border-green-200 text-green-700'
                : 'bg-white border border-red-200 text-red-700'
            }`}
          >
            {toast.type === 'success'
              ? <Check className="h-4 w-4 text-green-500" />
              : <AlertCircle className="h-4 w-4 text-red-500" />
            }
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Equipe</h1>
            <p className="text-sm text-gray-500">Controle granular de acesso e permissões</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadMembers} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
          <button
            onClick={() => { setShowInviteModal(true); setInviteError(''); setInviteSuccess('') }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" /> Adicionar Usuário
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: members.length, color: 'text-gray-900' },
          { label: 'Ativos', value: members.filter(m => m.is_active).length, color: 'text-emerald-600' },
          { label: 'Inativos', value: members.filter(m => !m.is_active).length, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Members List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500">Carregando usuários...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhum usuário encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Adicione o primeiro membro da equipe</p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="mt-5 px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
          >
            Adicionar usuário
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map(member => {
            const isExpanded = expandedUser === member.id
            const perms = localPerms[member.id] || member.permissions
            const sens = localSensitive[member.id] || member.sensitive
            const roleColor = ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-600'

            return (
              <motion.div key={member.id} layout className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                {/* Member Row */}
                <div className="flex items-center gap-4 p-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {(member.full_name?.[0] || member.email[0]).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${member.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{member.full_name || member.email}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${roleColor}`}>
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />{member.email}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{formatDate(member.last_login)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={member.role}
                      onChange={e => changeRole(member.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'super_admin').map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => toggleActive(member.id, member.is_active)}
                      title={member.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        member.is_active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {member.is_active
                        ? <><ToggleRight className="h-4 w-4" /> Ativo</>
                        : <><ToggleLeft className="h-4 w-4" /> Inativo</>
                      }
                    </button>

                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : member.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        isExpanded
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Permissões
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Permissions Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 bg-gray-50/80 p-5 space-y-5">

                        {/* Bulk controls */}
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            Controle de Módulos
                          </p>
                          <div className="flex gap-2">
                            {(['none', 'read', 'full'] as AccessLevel[]).map(level => (
                              <button
                                key={level}
                                onClick={() => setAllAccess(member.id, level)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                                  level === 'none'
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : level === 'read'
                                    ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                {level === 'none' ? 'Bloquear Tudo' : level === 'read' ? 'Somente Leitura' : 'Acesso Total'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Module Groups */}
                        <div className="space-y-4">
                          {MODULE_GROUPS.map(group => {
                            const colors = GROUP_COLORS[group.color]
                            return (
                              <div key={group.group} className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className={`w-2 h-2 rounded-full ${colors.badge}`} />
                                  <p className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{group.group}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {group.modules.map(mod => {
                                    const p = perms[mod.code] || applyAccessLevel('full')
                                    const level = getAccessLevel(p)
                                    return (
                                      <div key={mod.code} className="bg-white rounded-lg border border-gray-200/80 p-3 shadow-sm">
                                        <p className="text-sm font-medium text-gray-800 mb-2.5">{mod.label}</p>
                                        <div className="flex gap-1">
                                          {(['none', 'read', 'full'] as AccessLevel[]).map(l => (
                                            <button
                                              key={l}
                                              onClick={() => setAccessLevel(member.id, mod.code, l)}
                                              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                                                level === l
                                                  ? l === 'none'
                                                    ? 'bg-red-500 text-white shadow-sm'
                                                    : l === 'read'
                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                    : 'bg-emerald-500 text-white shadow-sm'
                                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                              }`}
                                            >
                                              {l === 'none' ? 'Sem' : l === 'read' ? 'Leitura' : 'Total'}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Sensitive Permissions */}
                        <div className="rounded-xl border border-gray-300 bg-white p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Lock className="h-4 w-4 text-gray-600" />
                            <p className="text-sm font-semibold text-gray-800">Permissões Sensíveis</p>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-1">Campos críticos</span>
                          </div>
                          <div className="space-y-3">
                            {[
                              { key: 'can_view_profit' as const, label: 'Visualizar Lucro Real e Impostos', module: 'Financeiro', icon: '💰' },
                              { key: 'can_apply_discount' as const, label: 'Aplicar Descontos em OS', module: 'Ordens de Serviço', icon: '🏷️' },
                              { key: 'can_adjust_stock' as const, label: 'Ajustar Saldo de Estoque', module: 'Estoque', icon: '📦' },
                            ].map(item => (
                              <div key={item.key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{item.icon} {item.label}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">Módulo: {item.module}</p>
                                </div>
                                <button
                                  onClick={() => toggleSensitive(member.id, item.key)}
                                  className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                                    sens[item.key] ? 'bg-emerald-500' : 'bg-gray-300'
                                  }`}
                                >
                                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                    sens[item.key] ? 'translate-x-5' : 'translate-x-0'
                                  }`} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Save button */}
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => savePermissions(member.id)}
                            disabled={saving === member.id}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
                          >
                            {saving === member.id ? (
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <BadgeCheck className="h-4 w-4" />
                            )}
                            {saving === member.id ? 'Salvando...' : 'Salvar Alterações'}
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowInviteModal(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Novo Usuário</h3>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {inviteSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-7 w-7 text-emerald-600" />
                    </div>
                    <p className="text-emerald-700 font-semibold text-lg">Usuário cadastrado!</p>
                    <p className="text-gray-500 text-sm mt-1">{inviteSuccess}</p>
                    <button
                      onClick={() => { setShowInviteModal(false); setInviteSuccess('') }}
                      className="mt-5 px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Fechar
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInvite} className="space-y-4">
                    {inviteError && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {inviteError}
                      </div>
                    )}

                    {[
                      { label: 'Nome Completo', type: 'text', key: 'full_name', placeholder: 'João da Silva' },
                      { label: 'E-mail', type: 'email', key: 'email', placeholder: 'funcionario@empresa.com' },
                      { label: 'Senha Inicial', type: 'password', key: 'password', placeholder: 'Mínimo 6 caracteres' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                        <input
                          type={field.type}
                          required
                          minLength={field.type === 'password' ? 6 : undefined}
                          value={(inviteData as any)[field.key]}
                          onChange={e => setInviteData(d => ({ ...d, [field.key]: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Perfil de Acesso</label>
                      <select
                        value={inviteData.role}
                        onChange={e => setInviteData(d => ({ ...d, role: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'super_admin').map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">
                      O usuário terá acesso total a todos os módulos por padrão. Você poderá ajustar as permissões individualmente após o cadastro.
                    </p>

                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowInviteModal(false)}
                        className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={inviteLoading}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg font-semibold flex items-center justify-center gap-2"
                      >
                        {inviteLoading ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        {inviteLoading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TeamManagement
