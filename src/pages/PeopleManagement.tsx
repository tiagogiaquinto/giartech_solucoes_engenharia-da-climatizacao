import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Lock,
  Unlock,
  Crown,
  User as UserIcon,
  Key,
  Eye,
  EyeOff,
  Save,
  X,
  Check,
  MapPin,
  CreditCard,
  Car,
  AlertTriangle,
  FileText,
  Building,
  Clock
} from 'lucide-react'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, type Employee, type EmployeeDocument } from '../lib/database-services'
import { EmployeeDocumentUpload } from '../components/EmployeeDocumentUpload'
import { maskCPF, maskPhone, maskCEP, validateCPF, validateEmail, unmask } from '../utils/masks'
import { useUser } from '../contexts/UserContext'

interface UserAccess {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'technician' | 'external'
  status: 'active' | 'inactive' | 'pending'
  lastLogin: string
  department?: string
  permissions: string[]
}

interface Role {
  id: string
  name: string
  description: string
  level: number
  permissions: string[]
  color: string
  icon: any
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

const PeopleManagement = () => {
  const { isAdmin } = useUser()
  const [activeMainTab, setActiveMainTab] = useState<'employees' | 'users' | 'access'>('employees')
  const [activeSubTab, setActiveSubTab] = useState<'personal' | 'address' | 'bank' | 'license' | 'emergency' | 'documents'>('personal')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [loadingCEP, setLoadingCEP] = useState(false)

  // Users
  const [users, setUsers] = useState<UserAccess[]>([
    {
      id: '1',
      name: 'Admin Sistema',
      email: 'admin@giartech.com',
      role: 'admin',
      status: 'active',
      lastLogin: new Date().toISOString(),
      department: 'Administração',
      permissions: ['all']
    },
    {
      id: '2',
      name: 'Carlos Gerente',
      email: 'carlos@giartech.com',
      role: 'manager',
      status: 'active',
      lastLogin: new Date(Date.now() - 3600000).toISOString(),
      department: 'Operações',
      permissions: ['manage_orders', 'manage_clients', 'view_financial']
    },
    {
      id: '3',
      name: 'Ana Técnica',
      email: 'ana@giartech.com',
      role: 'technician',
      status: 'active',
      lastLogin: new Date(Date.now() - 7200000).toISOString(),
      department: 'Campo',
      permissions: ['view_orders', 'view_clients']
    }
  ])
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccess | null>(null)

  // Roles & Permissions
  const [permissions] = useState<Permission[]>([
    { id: 'view_dashboard', name: 'Visualizar Dashboard', description: 'Acesso ao painel principal', category: 'Dashboard' },
    { id: 'manage_orders', name: 'Gerenciar OS', description: 'Criar, editar e excluir ordens de serviço', category: 'OS' },
    { id: 'view_orders', name: 'Visualizar OS', description: 'Apenas visualizar ordens de serviço', category: 'OS' },
    { id: 'manage_clients', name: 'Gerenciar Clientes', description: 'Cadastrar e editar clientes', category: 'Clientes' },
    { id: 'view_clients', name: 'Visualizar Clientes', description: 'Apenas visualizar dados de clientes', category: 'Clientes' },
    { id: 'manage_inventory', name: 'Gerenciar Estoque', description: 'Controle total do estoque', category: 'Estoque' },
    { id: 'view_inventory', name: 'Visualizar Estoque', description: 'Consultar estoque', category: 'Estoque' },
    { id: 'manage_financial', name: 'Gerenciar Financeiro', description: 'Acesso total ao financeiro', category: 'Financeiro' },
    { id: 'view_financial', name: 'Visualizar Financeiro', description: 'Relatórios financeiros', category: 'Financeiro' },
    { id: 'manage_users', name: 'Gerenciar Usuários', description: 'Administrar contas', category: 'Admin' },
    { id: 'system_settings', name: 'Configurações', description: 'Alterar configurações', category: 'Admin' }
  ])

  const [roles] = useState<Role[]>([
    {
      id: 'admin',
      name: 'Administrador',
      description: 'Acesso total ao sistema',
      level: 10,
      permissions: permissions.map(p => p.id),
      color: 'from-red-500 to-rose-600',
      icon: Crown
    },
    {
      id: 'manager',
      name: 'Gerente',
      description: 'Gestão de operações e equipe',
      level: 8,
      permissions: ['view_dashboard', 'manage_orders', 'manage_clients', 'manage_inventory', 'view_financial'],
      color: 'from-blue-500 to-indigo-600',
      icon: Shield
    },
    {
      id: 'technician',
      name: 'Técnico',
      description: 'Execução de serviços',
      level: 5,
      permissions: ['view_dashboard', 'view_orders', 'view_clients', 'view_inventory'],
      color: 'from-green-500 to-emerald-600',
      icon: UserIcon
    },
    {
      id: 'external',
      name: 'Externo',
      description: 'Acesso limitado',
      level: 3,
      permissions: ['view_dashboard', 'view_orders'],
      color: 'from-gray-500 to-slate-600',
      icon: Key
    }
  ])

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedRoleDetails, setSelectedRoleDetails] = useState<Role | null>(null)

  const [loading, setLoading] = useState(true)

  const [employeeFormData, setEmployeeFormData] = useState<Partial<Employee>>({
    name: '',
    email: '',
    phone: '',
    role: '',
    salary: 0,
    active: true,
    cpf: '',
    rg: '',
    birth_date: '',
    admission_date: '',
    department: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zip_code: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    bank_account_type: 'checking',
    pix_key: '',
    driver_license_number: '',
    driver_license_category: '',
    driver_license_expiry: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  })

  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'technician' as 'admin' | 'manager' | 'technician' | 'external',
    department: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
    permissions: [] as string[]
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  // Employee handlers
  const handleOpenEmployeeModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setEmployeeFormData(employee)
    } else {
      setEditingEmployee(null)
      setEmployeeFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        salary: 0,
        active: true,
        cpf: '',
        rg: '',
        birth_date: '',
        admission_date: '',
        department: '',
        address_street: '',
        address_number: '',
        address_complement: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
        address_zip_code: '',
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        bank_account_type: 'checking',
        pix_key: '',
        driver_license_number: '',
        driver_license_category: '',
        driver_license_expiry: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
      })
    }
    setActiveSubTab('personal')
    setShowEmployeeModal(true)
  }

  const handleSaveEmployee = async () => {
    try {
      if (!employeeFormData.name || !employeeFormData.email) {
        alert('Nome e email são obrigatórios')
        return
      }

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id!, employeeFormData)
      } else {
        await createEmployee(employeeFormData as Employee)
      }

      await loadEmployees()
      setShowEmployeeModal(false)
      alert('Funcionário salvo com sucesso!')
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('Erro ao salvar funcionário')
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      try {
        await deleteEmployee(id)
        await loadEmployees()
        alert('Funcionário excluído com sucesso!')
      } catch (error) {
        console.error('Error deleting employee:', error)
        alert('Erro ao excluir funcionário')
      }
    }
  }

  // User handlers
  const handleOpenUserModal = (user?: UserAccess) => {
    if (user) {
      setEditingUser(user)
      setUserFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        status: user.status,
        permissions: user.permissions
      })
    } else {
      setEditingUser(null)
      setUserFormData({
        name: '',
        email: '',
        role: 'technician',
        department: '',
        status: 'active',
        permissions: []
      })
    }
    setShowUserModal(true)
  }

  const handleSaveUser = () => {
    if (!userFormData.name || !userFormData.email) {
      alert('Nome e email são obrigatórios')
      return
    }

    if (editingUser) {
      setUsers(users.map(u =>
        u.id === editingUser.id
          ? { ...u, ...userFormData, lastLogin: u.lastLogin }
          : u
      ))
    } else {
      const newUser: UserAccess = {
        id: Date.now().toString(),
        ...userFormData,
        lastLogin: new Date().toISOString()
      }
      setUsers([...users, newUser])
    }

    setShowUserModal(false)
    alert('Usuário salvo com sucesso!')
  }

  const handleDeleteUser = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter(u => u.id !== id))
      alert('Usuário excluído com sucesso!')
    }
  }

  const handleToggleUserStatus = (id: string) => {
    setUsers(users.map(u =>
      u.id === id
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ))
  }

  // Filters
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.cpf?.includes(searchTerm)
    const matchesStatus = selectedStatus === 'all' ||
                         (selectedStatus === 'active' ? emp.active : !emp.active)
    return matchesSearch && matchesStatus
  })

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadgeColor = (role: string) => {
    const roleObj = roles.find(r => r.id === role)
    return roleObj?.color || 'from-gray-500 to-gray-600'
  }

  const getRoleIcon = (role: string) => {
    const roleObj = roles.find(r => r.id === role)
    return roleObj?.icon || UserIcon
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Agora mesmo'
    if (diffMins < 60) return `Há ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Há ${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    return `Há ${diffDays}d`
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
              Gestão de Pessoas
            </h1>
            <p className="text-gray-600 mt-2">Gerenciamento completo de funcionários, usuários e acessos</p>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => {
              setActiveMainTab('employees')
              setSearchTerm('')
              setSelectedRole('all')
              setSelectedStatus('all')
            }}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeMainTab === 'employees'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Briefcase className="h-5 w-5" />
            Funcionários
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeMainTab === 'employees' ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {employees.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveMainTab('users')
              setSearchTerm('')
              setSelectedRole('all')
              setSelectedStatus('all')
            }}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeMainTab === 'users'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UserIcon className="h-5 w-5" />
            Usuários do Sistema
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeMainTab === 'users' ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {users.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveMainTab('access')
              setSearchTerm('')
              setSelectedRole('all')
              setSelectedStatus('all')
            }}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeMainTab === 'access'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Shield className="h-5 w-5" />
            Perfis de Acesso
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeMainTab === 'access' ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {roles.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* EMPLOYEES TAB */}
        {activeMainTab === 'employees' && (
          <motion.div
            key="employees"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>

                <button
                  onClick={() => handleOpenEmployeeModal()}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                >
                  <Plus className="h-5 w-5" />
                  Novo Funcionário
                </button>
              </div>
            </div>

            {/* Employee List */}
            <div className="grid gap-4">
              {loading ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Carregando funcionários...</p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum funcionário encontrado</h3>
                  <p className="text-gray-600 mb-6">Comece adicionando seu primeiro funcionário</p>
                  <button
                    onClick={() => handleOpenEmployeeModal()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2 font-medium"
                  >
                    <Plus className="h-5 w-5" />
                    Adicionar Funcionário
                  </button>
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                          {employee.name?.[0]?.toUpperCase() || 'F'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              employee.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {employee.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            {employee.email && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{employee.email}</span>
                              </div>
                            )}
                            {employee.phone && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{employee.phone}</span>
                              </div>
                            )}
                            {employee.department && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span>{employee.department}</span>
                              </div>
                            )}
                            {employee.role && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Briefcase className="h-4 w-4 text-gray-400" />
                                <span>{employee.role}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleOpenEmployeeModal(employee)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id!)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* USERS TAB */}
        {activeMainTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar usuários por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Todos os perfis</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                  <option value="pending">Pendentes</option>
                </select>

                <button
                  onClick={() => handleOpenUserModal()}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                >
                  <UserPlus className="h-5 w-5" />
                  Novo Usuário
                </button>
              </div>
            </div>

            {/* User List */}
            <div className="grid gap-4">
              {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                  <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum usuário encontrado</h3>
                  <p className="text-gray-600">Ajuste os filtros ou adicione um novo usuário</p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role)
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-14 h-14 bg-gradient-to-br ${getRoleBadgeColor(user.role)} rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                            <RoleIcon className="h-7 w-7" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : user.status === 'inactive'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.status === 'active' ? 'Ativo' : user.status === 'inactive' ? 'Inativo' : 'Pendente'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{user.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 bg-gradient-to-r ${getRoleBadgeColor(user.role)} text-white rounded-md text-xs font-medium`}>
                                  {roles.find(r => r.id === user.role)?.name}
                                </span>
                              </div>
                              {user.department && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Building className="h-4 w-4 text-gray-400" />
                                  <span>{user.department}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{formatDate(user.lastLogin)}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {user.permissions.slice(0, 3).map(perm => (
                                <span key={perm} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {permissions.find(p => p.id === perm)?.name || perm}
                                </span>
                              ))}
                              {user.permissions.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{user.permissions.length - 3} mais
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.status === 'active'
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.status === 'active' ? 'Desativar' : 'Ativar'}
                          >
                            {user.status === 'active' ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}

        {/* ACCESS TAB */}
        {activeMainTab === 'access' && (
          <motion.div
            key="access"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Perfis de Acesso do Sistema</h2>
              <p className="text-gray-600 mb-6">
                Configure os níveis de acesso e permissões para cada tipo de usuário
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {roles.map((role) => {
                  const RoleIcon = role.icon
                  return (
                    <motion.div
                      key={role.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedRoleDetails(role)
                        setShowRoleModal(true)
                      }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                          <RoleIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{role.name}</h3>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          Nível {role.level}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-medium">Permissões:</span>
                          <span className="text-gray-900 font-bold">{role.permissions.length}</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 4).map(permId => (
                            <span key={permId} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {permissions.find(p => p.id === permId)?.name}
                            </span>
                          ))}
                          {role.permissions.length > 4 && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                              +{role.permissions.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Permission Categories */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Todas as Permissões</h2>

              <div className="space-y-4">
                {Array.from(new Set(permissions.map(p => p.category))).map(category => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {permissions.filter(p => p.category === category).map(permission => (
                        <div key={permission.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Check className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{permission.name}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employee Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
                </h2>
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Sub tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                  { id: 'personal', label: 'Dados Pessoais', icon: UserIcon },
                  { id: 'address', label: 'Endereço', icon: MapPin },
                  { id: 'bank', label: 'Bancários', icon: CreditCard },
                  { id: 'license', label: 'CNH', icon: Car },
                  { id: 'emergency', label: 'Emergência', icon: AlertTriangle },
                  { id: 'documents', label: 'Documentos', icon: FileText }
                ].map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id as any)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeSubTab === tab.id
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Form content based on active sub tab - simplified version */}
              {activeSubTab === 'personal' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      value={employeeFormData.name || ''}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={employeeFormData.email || ''}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={employeeFormData.phone || ''}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: maskPhone(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                    <input
                      type="text"
                      value={employeeFormData.cpf || ''}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, cpf: maskCPF(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                    <input
                      type="text"
                      value={employeeFormData.role || ''}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <input
                      type="text"
                      value={employeeFormData.department || ''}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salário</label>
                    <input
                      type="number"
                      value={employeeFormData.salary || 0}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, salary: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={employeeFormData.active !== false}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">Funcionário Ativo</label>
                  </div>
                </div>
              )}

              {/* Other tabs would be similar - shortened for brevity */}
              {activeSubTab !== 'personal' && (
                <div className="text-center py-12 text-gray-500">
                  Conteúdo da aba {activeSubTab} (implementar conforme necessário)
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEmployee}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium"
              >
                <Save className="h-5 w-5" />
                Salvar Funcionário
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User Modal - Simplified */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl"
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso *</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => {
                      const selectedRole = e.target.value as any
                      const rolePerms = roles.find(r => r.id === selectedRole)?.permissions || []
                      setUserFormData({ ...userFormData, role: selectedRole, permissions: rolePerms })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                  <input
                    type="text"
                    value={userFormData.department}
                    onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissões</label>
                <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {userFormData.permissions.map(permId => (
                      <div key={permId} className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-gray-900">{permissions.find(p => p.id === permId)?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium"
              >
                <Save className="h-5 w-5" />
                Salvar Usuário
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Role Details Modal */}
      {showRoleModal && selectedRoleDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl"
          >
            <div className={`p-6 border-b border-gray-200 bg-gradient-to-r ${selectedRoleDetails.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <selectedRoleDetails.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedRoleDetails.name}</h2>
                    <p className="text-white/80">{selectedRoleDetails.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Permissões deste perfil:</h3>
              <div className="space-y-2">
                {selectedRoleDetails.permissions.map(permId => {
                  const perm = permissions.find(p => p.id === permId)
                  return perm ? (
                    <div key={permId} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{perm.name}</p>
                        <p className="text-sm text-gray-600">{perm.description}</p>
                      </div>
                    </div>
                  ) : null
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowRoleModal(false)}
                className="w-full px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default PeopleManagement
