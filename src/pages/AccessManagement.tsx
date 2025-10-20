import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Check,
  X,
  Save,
  UserPlus,
  Key,
  Lock,
  Unlock,
  Crown,
  User,
  Building
} from 'lucide-react'

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface Role {
  id: string
  name: string
  description: string
  level: number
  permissions: string[]
  color: string
  isSystem: boolean
}

interface UserAccess {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  lastLogin: string
  isExternal: boolean
  department?: string
  permissions: string[]
}

const AccessManagement = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users')
  const [showUserModal, setShowUserModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccess | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  const [permissions] = useState<Permission[]>([
    { id: 'view_dashboard', name: 'Visualizar Dashboard', description: 'Acesso ao painel principal', category: 'Dashboard' },
    { id: 'manage_orders', name: 'Gerenciar OS', description: 'Criar, editar e excluir ordens de serviço', category: 'Ordens de Serviço' },
    { id: 'view_orders', name: 'Visualizar OS', description: 'Apenas visualizar ordens de serviço', category: 'Ordens de Serviço' },
    { id: 'manage_clients', name: 'Gerenciar Clientes', description: 'Cadastrar e editar clientes', category: 'Clientes' },
    { id: 'view_clients', name: 'Visualizar Clientes', description: 'Apenas visualizar dados de clientes', category: 'Clientes' },
    { id: 'manage_inventory', name: 'Gerenciar Estoque', description: 'Controle total do estoque', category: 'Estoque' },
    { id: 'view_inventory', name: 'Visualizar Estoque', description: 'Consultar estoque sem alterações', category: 'Estoque' },
    { id: 'manage_financial', name: 'Gerenciar Financeiro', description: 'Acesso total ao módulo financeiro', category: 'Financeiro' },
    { id: 'view_financial', name: 'Visualizar Financeiro', description: 'Relatórios financeiros básicos', category: 'Financeiro' },
    { id: 'manage_users', name: 'Gerenciar Usuários', description: 'Administrar contas de usuário', category: 'Administração' },
    { id: 'system_settings', name: 'Configurações do Sistema', description: 'Alterar configurações globais', category: 'Administração' }
  ])

  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'admin',
      name: 'Administrador',
      description: 'Acesso total ao sistema',
      level: 10,
      permissions: permissions.map(p => p.id),
      color: 'from-red-500 to-pink-500',
      isSystem: true
    },
    {
      id: 'manager',
      name: 'Gerente',
      description: 'Gestão de operações e equipe',
      level: 8,
      permissions: ['view_dashboard', 'manage_orders', 'manage_clients', 'manage_inventory', 'view_financial'],
      color: 'from-blue-500 to-cyan-500',
      isSystem: true
    },
    {
      id: 'technician',
      name: 'Técnico',
      description: 'Execução de serviços em campo',
      level: 5,
      permissions: ['view_dashboard', 'view_orders', 'view_clients', 'view_inventory'],
      color: 'from-green-500 to-emerald-500',
      isSystem: true
    },
    {
      id: 'external',
      name: 'Funcionário Externo',
      description: 'Acesso limitado para terceirizados',
      level: 3,
      permissions: ['view_orders', 'view_clients'],
      color: 'from-yellow-500 to-orange-500',
      isSystem: false
    }
  ])

  const [users, setUsers] = useState<UserAccess[]>([
    {
      id: 1,
      name: 'João Silva',
      email: 'joao@giartech.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-20T10:30:00',
      isExternal: false,
      department: 'TI',
      permissions: []
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria@giartech.com',
      role: 'manager',
      status: 'active',
      lastLogin: '2024-01-20T09:15:00',
      isExternal: false,
      department: 'Operações',
      permissions: []
    },
    {
      id: 3,
      name: 'Carlos Técnico',
      email: 'carlos@terceirizada.com',
      role: 'external',
      status: 'active',
      lastLogin: '2024-01-19T16:45:00',
      isExternal: true,
      permissions: ['view_orders']
    }
  ])

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    isExternal: false,
    permissions: [] as string[]
  })

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    level: 1,
    permissions: [] as string[]
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'inactive': return 'Inativo'
      case 'pending': return 'Pendente'
      default: return 'Desconhecido'
    }
  }

  const getRoleInfo = (roleId: string) => {
    return roles.find(r => r.id === roleId) || roles[0]
  }

  const handleCreateUser = () => {
    if (newUser.name.trim() && newUser.email.trim() && newUser.role) {
      const user: UserAccess = {
        id: Date.now(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'pending',
        lastLogin: '',
        isExternal: newUser.isExternal,
        department: newUser.department || undefined,
        permissions: newUser.permissions
      }
      
      setUsers([...users, user])
      setNewUser({ name: '', email: '', role: '', department: '', isExternal: false, permissions: [] })
      setShowUserModal(false)
      alert('Usuário criado com sucesso!')
    }
  }

  const handleCreateRole = () => {
    if (newRole.name.trim() && newRole.description.trim()) {
      const role: Role = {
        id: Date.now().toString(),
        name: newRole.name,
        description: newRole.description,
        level: newRole.level,
        permissions: newRole.permissions,
        color: 'from-gray-500 to-gray-600',
        isSystem: false
      }
      
      setRoles([...roles, role])
      setNewRole({ name: '', description: '', level: 1, permissions: [] })
      setShowRoleModal(false)
      alert('Perfil criado com sucesso!')
    }
  }

  const toggleUserStatus = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' as any }
        : user
    ))
  }

  const deleteUser = (userId: number) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter(user => user.id !== userId))
    }
  }

  const deleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (role?.isSystem) {
      alert('Não é possível excluir perfis do sistema')
      return
    }
    
    if (confirm('Tem certeza que deseja excluir este perfil?')) {
      setRoles(roles.filter(role => role.id !== roleId))
    }
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    externalUsers: users.filter(u => u.isExternal).length,
    totalRoles: roles.length
  }

  return (
    <div className="p-3 space-y-4">
      {/* Header Compacto para Mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              Gestão de Acesso
            </h1>
            <p className="text-xs text-gray-600">
              Controle de permissões e usuários
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 hover:shadow-lg transition-all text-xs"
            >
              <UserPlus className="h-3 w-3" />
              <span>Usuário</span>
            </button>
            <button
              onClick={() => setShowRoleModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 hover:shadow-lg transition-all text-xs"
            >
              <Plus className="h-3 w-3" />
              <span>Perfil</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Compactos */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Usuários', value: stats.totalUsers, color: 'from-blue-500 to-cyan-500', icon: Users },
          { label: 'Ativos', value: stats.activeUsers, color: 'from-green-500 to-emerald-500', icon: Check },
          { label: 'Externos', value: stats.externalUsers, color: 'from-yellow-500 to-orange-500', icon: Building },
          { label: 'Perfis', value: stats.totalRoles, color: 'from-purple-500 to-pink-500', icon: Shield }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-3 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{stat.value}</h3>
            <p className="text-xs text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs Compactos */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'users', label: 'Usuários', icon: Users },
            { id: 'roles', label: 'Perfis', icon: Shield },
            { id: 'permissions', label: 'Permissões', icon: Key }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-1 py-3 px-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="font-medium text-xs">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-3">
          {/* Usuários */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              {users.map((user, index) => {
                const roleInfo = getRoleInfo(user.role)
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          user.isExternal ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          {user.isExternal ? 
                            <Building className="h-5 w-5 text-yellow-600" /> : 
                            <User className="h-5 w-5 text-blue-600" />
                          }
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {getStatusText(user.status)}
                        </span>
                        {user.isExternal && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Ext
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                      <div>
                        <span className="text-gray-500">Perfil:</span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 bg-gradient-to-r ${roleInfo.color} rounded-full`}></div>
                          <span className="font-medium">{roleInfo.name}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Depto:</span>
                        <p className="font-medium">{user.department || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Último Acesso:</span>
                        <p className="font-medium">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Nível:</span>
                        <p className="font-medium">Nível {roleInfo.level}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-1 text-xs"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 text-xs ${
                          user.status === 'active' 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {user.status === 'active' ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        <span>{user.status === 'active' ? 'Desativar' : 'Ativar'}</span>
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Perfis de Acesso */}
          {activeTab === 'roles' && (
            <div className="space-y-3">
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${role.color} rounded-xl flex items-center justify-center`}>
                        {role.isSystem ? <Crown className="h-5 w-5 text-white" /> : <Shield className="h-5 w-5 text-white" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                          {role.name}
                          {role.isSystem && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Sistema
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-600">{role.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Nível</p>
                      <p className="text-lg font-bold text-gray-900">{role.level}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Permissões ({role.permissions.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map(permissionId => {
                        const permission = permissions.find(p => p.id === permissionId)
                        return permission ? (
                          <span key={permissionId} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {permission.name}
                          </span>
                        ) : null
                      })}
                      {role.permissions.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{role.permissions.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingRole(role)}
                      disabled={role.isSystem}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 text-xs ${
                        role.isSystem 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      <Edit className="h-3 w-3" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => deleteRole(role.id)}
                      disabled={role.isSystem}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 text-xs ${
                        role.isSystem 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Permissões */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([category, categoryPermissions], index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
                >
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{category}</h3>
                  <div className="space-y-2">
                    {categoryPermissions.map(permission => (
                      <div key={permission.id} className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 text-xs mb-1">{permission.name}</h4>
                        <p className="text-xs text-gray-600">{permission.description}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {permission.id}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Usuário */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-4 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Novo Usuário</h2>
                <button onClick={() => setShowUserModal(false)}>
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome do usuário"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um perfil</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Departamento (opcional)"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isExternal"
                    checked={newUser.isExternal}
                    onChange={(e) => setNewUser({...newUser, isExternal: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isExternal" className="text-sm text-gray-700">
                    Funcionário Externo
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg text-sm"
                >
                  <Save className="h-3 w-3 mr-1 inline" />
                  Criar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Novo Perfil */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRoleModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-4 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Novo Perfil</h2>
                <button onClick={() => setShowRoleModal(false)}>
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Perfil</label>
                    <input
                      type="text"
                      value={newRole.name}
                      onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do perfil"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newRole.level}
                      onChange={(e) => setNewRole({...newRole, level: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Descrição do perfil"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Permissões</label>
                  <div className="space-y-3">
                    {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                      <div key={category} className="border border-gray-200 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2 text-sm">{category}</h4>
                        <div className="space-y-1">
                          {categoryPermissions.map(permission => (
                            <label key={permission.id} className="flex items-start space-x-2">
                              <input
                                type="checkbox"
                                checked={newRole.permissions.includes(permission.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewRole({...newRole, permissions: [...newRole.permissions, permission.id]})
                                  } else {
                                    setNewRole({...newRole, permissions: newRole.permissions.filter(p => p !== permission.id)})
                                  }
                                }}
                                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                                <p className="text-xs text-gray-600">{permission.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateRole}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg text-sm"
                >
                  <Save className="h-3 w-3 mr-1 inline" />
                  Criar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AccessManagement