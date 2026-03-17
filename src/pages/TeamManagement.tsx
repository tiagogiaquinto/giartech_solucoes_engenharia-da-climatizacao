import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Shield, Save, X, Check,
  Trash2, Mail, Eye, EyeOff, AlertCircle,
  ChevronDown, ChevronUp, Crown, RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import { useNavigate } from 'react-router-dom'

const ALL_MODULES = [
  { code: 'dashboard', label: 'Dashboard CFO' },
  { code: 'agenda', label: 'Agenda' },
  { code: 'clientes', label: 'Clientes' },
  { code: 'crm', label: 'CRM Profissional' },
  { code: 'mensagens_crm', label: 'Mensagens do CRM' },
  { code: 'gamificacao', label: 'Gamificação' },
  { code: 'fornecedores', label: 'Fornecedores' },
  { code: 'compras', label: 'Compras' },
  { code: 'service_orders', label: 'Ordens de Serviço' },
  { code: 'rotas', label: 'Rotas' },
  { code: 'financeiro', label: 'Financeiro' },
  { code: 'salarios', label: 'Gestão de Salários' },
  { code: 'metas', label: 'Metas & Rankings' },
  { code: 'documentos', label: 'Centro de Documentos' },
  { code: 'relatorios', label: 'Relatórios' },
  { code: 'catalogo', label: 'Catálogo de Serviços' },
  { code: 'estoque', label: 'Estoque' },
  { code: 'automacoes', label: 'Automações' },
  { code: 'thomaz', label: 'Thomaz AI' },
  { code: 'email', label: 'Email Corporativo' },
  { code: 'biblioteca', label: 'Biblioteca Digital' },
  { code: 'pessoas', label: 'Gestão de Pessoas' },
  { code: 'auditoria', label: 'Auditoria' },
  { code: 'templates', label: 'Templates de Documentos' },
  { code: 'configuracoes', label: 'Configurações' },
]

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  technician: 'Técnico',
  sales: 'Vendas',
  financial: 'Financeiro',
  viewer: 'Visualizador'
}

interface TeamMember {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  permissions: Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>
}

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
  const [localPerms, setLocalPerms] = useState<Record<string, Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>>>({})

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/')
      return
    }
    loadMembers()
  }, [isSuperAdmin])

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
      for (const p of profiles || []) {
        const { data: perms } = await supabase
          .from('module_permissions')
          .select('module_code, can_view, can_create, can_edit, can_delete')
          .eq('user_id', p.id)

        const permMap: TeamMember['permissions'] = {}
        for (const m of ALL_MODULES) {
          const found = perms?.find(px => px.module_code === m.code)
          permMap[m.code] = found
            ? { can_view: found.can_view, can_create: found.can_create, can_edit: found.can_edit, can_delete: found.can_delete }
            : { can_view: true, can_create: true, can_edit: true, can_delete: false }
        }

        memberList.push({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          role: p.role,
          is_active: p.is_active,
          created_at: p.created_at,
          permissions: permMap
        })
      }

      setMembers(memberList)
      const lp: typeof localPerms = {}
      memberList.forEach(m => { lp[m.id] = { ...m.permissions } })
      setLocalPerms(lp)
    } catch (err) {
      console.error('Error loading members:', err)
    } finally {
      setLoading(false)
    }
  }

  const togglePerm = (userId: string, moduleCode: string, field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete') => {
    setLocalPerms(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [moduleCode]: {
          ...prev[userId][moduleCode],
          [field]: !prev[userId][moduleCode][field]
        }
      }
    }))
  }

  const toggleAllView = (userId: string, value: boolean) => {
    setLocalPerms(prev => {
      const updated = { ...prev[userId] }
      ALL_MODULES.forEach(m => {
        updated[m.code] = { ...updated[m.code], can_view: value }
      })
      return { ...prev, [userId]: updated }
    })
  }

  const savePermissions = async (userId: string) => {
    setSaving(userId)
    try {
      const perms = localPerms[userId]
      const upsertRows = ALL_MODULES.map(m => ({
        user_id: userId,
        module_code: m.code,
        can_view: perms[m.code].can_view,
        can_create: perms[m.code].can_create,
        can_edit: perms[m.code].can_edit,
        can_delete: perms[m.code].can_delete
      }))

      const { error } = await supabase
        .from('module_permissions')
        .upsert(upsertRows, { onConflict: 'user_id,module_code' })

      if (error) throw error

      setMembers(prev => prev.map(m => m.id === userId ? { ...m, permissions: perms } : m))
    } catch (err) {
      console.error('Error saving permissions:', err)
      alert('Erro ao salvar permissões')
    } finally {
      setSaving(null)
    }
  }

  const toggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('auth_accounts')
        .update({ is_active: !currentActive })
        .eq('id', userId)

      if (error) throw error
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, is_active: !currentActive } : m))
    } catch (err) {
      console.error('Error toggling active:', err)
    }
  }

  const changeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('auth_accounts')
        .update({ role: newRole })
        .eq('id', userId)
      if (error) throw error
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m))
    } catch (err) {
      console.error('Error changing role:', err)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    setInviteLoading(true)
    try {
      const { data, error } = await supabase.auth.admin
        ? await (supabase.auth as any).admin.createUser({
            email: inviteData.email,
            password: inviteData.password,
            email_confirm: true,
            user_metadata: { full_name: inviteData.full_name }
          })
        : { data: null, error: { message: 'Admin API não disponível no cliente' } }

      if (error || !data?.user) {
        const fallbackSignUp = await supabase.auth.signUp({
          email: inviteData.email,
          password: inviteData.password,
          options: { data: { full_name: inviteData.full_name } }
        })
        if (fallbackSignUp.error) throw fallbackSignUp.error

        const userId = fallbackSignUp.data.user?.id
        if (userId) {
          await supabase.from('auth_accounts').upsert({
            id: userId,
            email: inviteData.email,
            full_name: inviteData.full_name,
            role: inviteData.role,
            is_active: true
          }, { onConflict: 'id' })

          const defaultPerms = ALL_MODULES.map(m => ({
            user_id: userId,
            module_code: m.code,
            can_view: true,
            can_create: true,
            can_edit: true,
            can_delete: false
          }))
          await supabase.from('module_permissions').upsert(defaultPerms, { onConflict: 'user_id,module_code' })
        }
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

  if (!isSuperAdmin) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Equipe</h1>
            <p className="text-sm text-gray-500">Controle total de acesso e permissões dos usuários</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadMembers}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
          <button
            onClick={() => { setShowInviteModal(true); setInviteError(''); setInviteSuccess('') }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Adicionar Usuário
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total de Usuários</p>
          <p className="text-2xl font-bold text-gray-900">{members.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Ativos</p>
          <p className="text-2xl font-bold text-green-600">{members.filter(m => m.is_active).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Inativos</p>
          <p className="text-2xl font-bold text-red-500">{members.filter(m => !m.is_active).length}</p>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum usuário cadastrado ainda.</p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Adicionar primeiro usuário
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => {
            const isExpanded = expandedUser === member.id
            const perms = localPerms[member.id] || member.permissions
            const allVisible = ALL_MODULES.every(m => perms[m.code]?.can_view)

            return (
              <motion.div
                key={member.id}
                layout
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Row */}
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {member.full_name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{member.full_name || member.email}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </p>
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
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        member.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {member.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {member.is_active ? 'Ativo' : 'Inativo'}
                    </button>

                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : member.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Shield className="h-3 w-3" />
                      Permissões
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50">
                        {/* Bulk toggle */}
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-medium text-gray-700">Controle de Módulos</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleAllView(member.id, true)}
                              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                              Habilitar Todos
                            </button>
                            <button
                              onClick={() => toggleAllView(member.id, false)}
                              className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                            >
                              Desabilitar Todos
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {ALL_MODULES.map(mod => {
                            const p = perms[mod.code] || { can_view: true, can_create: true, can_edit: true, can_delete: false }
                            return (
                              <div key={mod.code} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-gray-800">{mod.label}</p>
                                  <button
                                    onClick={() => togglePerm(member.id, mod.code, 'can_view')}
                                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                      p.can_view
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}
                                  >
                                    {p.can_view ? 'Visível' : 'Oculto'}
                                  </button>
                                </div>
                                {p.can_view && (
                                  <div className="flex gap-2 flex-wrap">
                                    {(['can_create', 'can_edit', 'can_delete'] as const).map(field => (
                                      <label key={field} className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={p[field]}
                                          onChange={() => togglePerm(member.id, mod.code, field)}
                                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                        />
                                        <span className="text-xs text-gray-600">
                                          {field === 'can_create' ? 'Criar' : field === 'can_edit' ? 'Editar' : 'Excluir'}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        <div className="flex justify-end mt-4">
                          <button
                            onClick={() => savePermissions(member.id)}
                            disabled={saving === member.id}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                          >
                            {saving === member.id ? (
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Salvar Permissões
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowInviteModal(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Adicionar Usuário</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {inviteSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-green-700 font-medium">{inviteSuccess}</p>
                  <button
                    onClick={() => { setShowInviteModal(false); setInviteSuccess('') }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={inviteData.full_name}
                      onChange={e => setInviteData(d => ({ ...d, full_name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="João da Silva"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      required
                      value={inviteData.email}
                      onChange={e => setInviteData(d => ({ ...d, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="funcionario@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha Inicial</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={inviteData.password}
                      onChange={e => setInviteData(d => ({ ...d, password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
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

                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                    O usuário receberá acesso a todos os módulos por padrão. Você poderá ajustar as permissões individuais após o cadastro.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      {inviteLoading ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      Cadastrar
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TeamManagement
