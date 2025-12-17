import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Users, Plus, Edit2, Trash2, Save, X, Check, AlertCircle,
  Eye, Lock, Key, Activity, Calendar, Settings, Search, Filter
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, type UserAccount, type ModulePermission } from '../contexts/AuthContext'

interface SystemModule {
  module_code: string
  module_name: string
  module_description: string
  icon: string
  is_active: boolean
}

const UserAccessManagement = () => {
  const { currentUser, isAdmin } = useAuth()
  const [users, setUsers] = useState<UserAccount[]>([])
  const [modules, setModules] = useState<SystemModule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
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
            return {
              ...user,
              module_permissions: perms?.module_permissions || []
            }
          })
        )
        setUsers(usersWithPermissions)
      }

      if (modulesResult.data) {
        setModules(modulesResult.data)
      }
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
          await supabase
            .from('user_module_permissions')
            .upsert({
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
      alert('Permissões atualizadas com sucesso!')
    } catch (error) {
      console.error('Error saving permissions:', error)
      alert('Erro ao salvar permissões')
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

    setSelectedUser({
      ...selectedUser,
      module_permissions: updatedPermissions
    })
  }

  const getPermissionValue = (moduleCode: string, permissionType: keyof ModulePermission): boolean => {
    if (!selectedUser) return false
    const perm = selectedUser.module_permissions.find(p => p.module_code === moduleCode)
    return perm ? perm[permissionType] as boolean : false
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Acessos</h1>
              <p className="text-gray-600">Gerencie usuários e permissões</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Carregando...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      user.access_level === 'admin' ? 'bg-purple-100 text-purple-600' :
                      user.access_level === 'manager' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.access_level === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.access_level === 'manager' ? 'bg-blue-100 text-blue-800' :
                          user.access_level === 'user' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.access_level.toUpperCase()}
                        </span>
                        {user.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
                            <X className="h-3 w-3" />
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          {user.module_permissions.length} módulos com acesso
                        </span>
                        {user.last_login_at && (
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Último acesso: {new Date(user.last_login_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEditUser(user)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Editar Permissões</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showEditModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Editar Permissões</h2>
                      <p className="text-gray-600">{selectedUser.full_name} - {selectedUser.email}</p>
                    </div>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  <div className="space-y-4">
                    {modules.map((module) => (
                      <div key={module.module_code} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{module.module_name}</h3>
                            <p className="text-sm text-gray-600">{module.module_description}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {['can_view', 'can_create', 'can_edit', 'can_delete', 'can_approve', 'can_export'].map((perm) => (
                            <label key={perm} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={getPermissionValue(module.module_code, perm as keyof ModulePermission)}
                                onChange={() => togglePermission(module.module_code, perm as keyof ModulePermission)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {perm.replace('can_', '').replace('_', ' ').charAt(0).toUpperCase() + perm.replace('can_', '').replace('_', ' ').slice(1)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePermissions}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Salvar Permissões</span>
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
