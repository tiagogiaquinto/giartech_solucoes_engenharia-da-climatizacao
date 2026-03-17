import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Users, FileEdit as Edit2, Save, X, Check, AlertCircle, Eye, EyeOff, Lock, Key, Activity, Search, Filter, UserPlus, RefreshCw, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, type UserAccount, type ModulePermission } from '../contexts/AuthContext'

interface SystemModule {
  module_code: string
  module_name: string
  module_description: string
  icon: string
  is_active: boolean
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  technician: 'Técnico',
  sales: 'Vendas',
  financial: 'Financeiro',
  viewer: 'Visualizador',
}

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const UserAccessManagement = () => {
  const { currentUser, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'create'>('users')
  const [users, setUsers] = useState<UserAccount[]>([])
  const [modules, setModules] = useState<SystemModule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    password: generatePassword(),
    role: 'viewer',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<{ email: string; password: string } | null>(null)

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersResult, modulesResult] = await Promise.all([
        supabase.from('user_accounts').select('*').is('deleted_at', null).order('full_name'),
        supabase.from('system_modules').select('*').eq('is_active', true).order('display_order')
      ])

      if (usersResult.data) {
        const usersWithPermissions = await Promise.all(
          usersResult.data.map(async (user) => {
            const { data: perms } = await supabase.rpc('get_user_permissions', { p_user_id: user.id })
            return { ...user, module_permissions: perms?.module_permissions || [] }
          })
        )
        setUsers(usersWithPermissions)
      }

      if (modulesResult.data) setModules(modulesResult.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: UserAccount) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return
    try {
      for (const module of modules) {
        const existingPerm = selectedUser.module_permissions.find(p => p.module_code === module.module_code)
        if (existingPerm) {
          await supabase.from('user_module_permissions').upsert({
            user_id: selectedUser.id,
            module_code: module.module_code,
            can_view: existingPerm.can_view,
            can_create: existingPerm.can_create,
            can_edit: existingPerm.can_edit,
            can_delete: existingPerm.can_delete,
            can_approve: existingPerm.can_approve,
            can_export: existingPerm.can_export,
            granted_by: currentUser?.id,
            updated_at: new Date().toISOString()
          })
        }
      }
      await loadData()
      setShowEditModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error saving permissions:', error)
    }
  }

  const togglePermission = (moduleCode: string, permissionType: keyof ModulePermission) => {
    if (!selectedUser) return
    const updatedPermissions = [...selectedUser.module_permissions]
    const permIndex = updatedPermissions.findIndex(p => p.module_code === moduleCode)

    if (permIndex >= 0) {
      updatedPermissions[permIndex] = {
        ...updatedPermissions[permIndex],
        [permissionType]: !updatedPermissions[permIndex][permissionType]
      }
    } else {
      const module = modules.find(m => m.module_code === moduleCode)
      updatedPermissions.push({
        module_code: moduleCode,
        module_name: module?.module_name || moduleCode,
        can_view: permissionType === 'can_view',
        can_create: permissionType === 'can_create',
        can_edit: permissionType === 'can_edit',
        can_delete: permissionType === 'can_delete',
        can_approve: permissionType === 'can_approve',
        can_export: permissionType === 'can_export'
      })
    }
    setSelectedUser({ ...selectedUser, module_permissions: updatedPermissions })
  }

  const getPermissionValue = (moduleCode: string, permissionType: keyof ModulePermission): boolean => {
    if (!selectedUser) return false
    const perm = selectedUser.module_permissions.find(p => p.module_code === moduleCode)
    return perm ? perm[permissionType] as boolean : false
  }

  const handleCreateAccount = async () => {
    setCreateError(null)
    if (!createForm.email.trim()) { setCreateError('E-mail obrigatório'); return }
    if (!createForm.password || createForm.password.length < 6) { setCreateError('Senha deve ter ao menos 6 caracteres'); return }

    setCreateSaving(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: createForm.email.trim().toLowerCase(),
          password: createForm.password,
          full_name: createForm.full_name.trim(),
          role: createForm.role,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao criar usuário')

      setCreateSuccess({ email: createForm.email.trim().toLowerCase(), password: createForm.password })
      setCreateForm({ full_name: '', email: '', password: generatePassword(), role: 'viewer' })
      await loadData()
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar conta')
    } finally {
      setCreateSaving(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? user.is_active :
      !user.is_active
    return matchesSearch && matchesStatus
  })

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Acessos</h1>
              <p className="text-sm text-gray-500">Gerencie usuários, logins e permissões do sistema</p>
            </div>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" />
            Usuários e Permissões
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>{users.length}</span>
          </button>
          <button
            onClick={() => { setActiveTab('create'); setCreateSuccess(null); setCreateError(null) }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Criar Acesso
          </button>
        </div>

        {/* Tab: Users & Permissions */}
        {activeTab === 'users' && (
          <div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <span className="ml-3 text-gray-600 text-sm">Carregando...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhum usuário encontrado</p>
                <button
                  onClick={() => { setActiveTab('create'); setCreateSuccess(null) }}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <UserPlus className="h-4 w-4" /> Criar primeiro acesso
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          user.access_level === 'admin' ? 'bg-blue-100 text-blue-600' :
                          user.access_level === 'manager' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{user.full_name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                              user.access_level === 'admin' ? 'bg-blue-100 text-blue-700' :
                              user.access_level === 'manager' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {user.access_level?.toUpperCase()}
                            </span>
                            {user.is_active ? (
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium flex items-center gap-1">
                                <Check className="h-2.5 w-2.5" /> Ativo
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium flex items-center gap-1">
                                <X className="h-2.5 w-2.5" /> Inativo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Key className="h-3 w-3" />
                              {user.module_permissions.length} módulos
                            </span>
                            {user.last_login_at && (
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {new Date(user.last_login_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="flex-shrink-0 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-sm"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Permissões
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Create Access */}
        {activeTab === 'create' && (
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              {createSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center"
                >
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Acesso criado com sucesso!</h3>
                  <p className="text-sm text-gray-500 mb-6">Compartilhe as credenciais abaixo com o usuário.</p>

                  <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-6 border border-gray-200">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">E-mail de acesso</p>
                      <p className="text-sm font-medium text-gray-800 font-mono">{createSuccess.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Senha temporária</p>
                      <p className="text-sm font-medium text-gray-800 font-mono bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200 tracking-wider">{createSuccess.password}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mb-5">O usuário deve acessar o sistema com estas credenciais e poderá alterar a senha em <strong>Configurações &gt; Perfil</strong>.</p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCreateSuccess(null)}
                      className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Criar outro acesso
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="flex-1 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      Ver usuários
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100"
                >
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">Criar novo acesso ao sistema</h2>
                        <p className="text-xs text-gray-500">Defina o e-mail e senha temporária do usuário</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {createError && (
                      <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {createError}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={createForm.full_name}
                          onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                          placeholder="Ex: Daiani Allini Ferreira"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        E-mail de acesso <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          value={createForm.email}
                          onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="email@exemplo.com"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Senha temporária <span className="text-red-500">*</span>
                        <span className="ml-1.5 text-xs text-gray-400 font-normal">— o usuário altera no perfil após o primeiro acesso</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={createForm.password}
                          onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                          className="w-full pl-9 pr-24 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono tracking-wider"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCreateForm(f => ({ ...f, password: generatePassword() }))}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                            title="Gerar nova senha"
                          >
                            Gerar
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPassword(p => !p)}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Copie e compartilhe esta senha com o usuário antes de salvar</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nível de acesso</label>
                      <select
                        value={createForm.role}
                        onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        {Object.entries(ROLE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      onClick={handleCreateAccount}
                      disabled={createSaving}
                      className="w-full py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {createSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <><UserPlus className="h-4 w-4" />Criar acesso ao sistema</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Edit Permissions Modal */}
        <AnimatePresence>
          {showEditModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Editar Permissões</h2>
                      <p className="text-sm text-gray-500">{selectedUser.full_name} — {selectedUser.email}</p>
                    </div>
                    <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                  <div className="space-y-3">
                    {modules.map((module) => (
                      <div key={module.module_code} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="mb-3">
                          <h3 className="font-medium text-gray-900 text-sm">{module.module_name}</h3>
                          <p className="text-xs text-gray-500">{module.module_description}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['can_view', 'can_create', 'can_edit', 'can_delete', 'can_approve', 'can_export'].map((perm) => (
                            <label key={perm} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={getPermissionValue(module.module_code, perm as keyof ModulePermission)}
                                onChange={() => togglePermission(module.module_code, perm as keyof ModulePermission)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700">
                                {perm === 'can_view' ? 'Visualizar' :
                                 perm === 'can_create' ? 'Criar' :
                                 perm === 'can_edit' ? 'Editar' :
                                 perm === 'can_delete' ? 'Excluir' :
                                 perm === 'can_approve' ? 'Aprovar' : 'Exportar'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePermissions}
                    className="px-5 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Salvar Permissões
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default UserAccessManagement
