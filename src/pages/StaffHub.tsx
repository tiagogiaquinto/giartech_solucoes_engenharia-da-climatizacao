import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Search, Crown, Shield, RefreshCw, Briefcase, Mail, Phone, ToggleLeft, ToggleRight, FileEdit as Edit2, Trash2, AlertCircle, Check, Clock, Star, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import { useNavigate } from 'react-router-dom'
import { EmployeeDetailDrawer } from '../components/EmployeeDetailDrawer'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  active: boolean
  photo_url: string | null
  salary: number
  weekly_hours: number
  overtime_bank: number
  contract_type: string
  gamification_points: number
  gamification_medals: string[]
  admission_date: string | null
  created_at: string
}

interface AuthUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
}

type MainView = 'employees' | 'users'
type UserSubTab = 'list' | 'create'

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

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
  super_admin: 'bg-blue-100 text-blue-700',
}

function formatDate(d: string | null): string {
  if (!d) return 'Nunca'
  return new Date(d).toLocaleDateString('pt-BR')
}

interface ToastState { message: string; type: 'success' | 'error' }

const StaffHub: React.FC = () => {
  const { isSuperAdmin } = useUser()
  const navigate = useNavigate()

  const [mainView, setMainView] = useState<MainView>('employees')
  const [userSubTab, setUserSubTab] = useState<UserSubTab>('list')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null | 'new'>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: generatePassword(), role: 'viewer' })
  const [showPassword, setShowPassword] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<{ email: string; password: string } | null>(null)

  useEffect(() => {
    if (!isSuperAdmin) { navigate('/'); return }
    loadAll()
  }, [isSuperAdmin])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [{ data: emps }, { data: users }] = await Promise.all([
        supabase.from('employees').select('*').order('name'),
        supabase.from('auth_accounts').select('*').neq('role', 'super_admin').order('created_at', { ascending: false })
      ])
      setEmployees(emps || [])
      setAuthUsers(users || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openEmployee = (id: string | 'new') => {
    setSelectedEmployeeId(id)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedEmployeeId(null)
  }

  const onSaved = () => {
    loadAll()
    closeDrawer()
    showToast('Funcionário salvo com sucesso!')
  }

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (error) throw error
      setEmployees(prev => prev.filter(e => e.id !== id))
      showToast('Funcionário removido.')
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover', 'error')
    } finally {
      setConfirmDelete(null)
    }
  }

  const toggleUserActive = async (userId: string, current: boolean) => {
    try {
      const { error } = await supabase.from('auth_accounts').update({ is_active: !current }).eq('id', userId)
      if (error) throw error
      setAuthUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !current } : u))
      showToast(!current ? 'Usuário ativado.' : 'Usuário desativado.')
    } catch (err) {
      console.error(err)
    }
  }

  const changeUserRole = async (userId: string, role: string) => {
    try {
      await supabase.from('auth_accounts').update({ role }).eq('id', userId)
      setAuthUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    } catch (err) { console.error(err) }
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
      await loadAll()
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar conta')
    } finally {
      setCreateSaving(false)
    }
  }

  const filteredEmployees = employees.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || e.email?.toLowerCase().includes(searchQuery.toLowerCase()) || e.role?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? e.active : !e.active)
    return matchSearch && matchStatus
  })

  const filteredUsers = authUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = [
    { label: 'Funcionários', value: employees.length, sub: `${employees.filter(e => e.active).length} ativos`, color: 'text-blue-600' },
    { label: 'Contas de Sistema', value: authUsers.length, sub: `${authUsers.filter(u => u.is_active).length} ativos`, color: 'text-emerald-600' },
    { label: 'Banco de Horas', value: `${employees.reduce((s, e) => s + (e.overtime_bank || 0), 0).toFixed(0)}h`, sub: 'total acumulado', color: 'text-amber-600' },
    { label: 'Pontos de Gamif.', value: employees.reduce((s, e) => s + (e.gamification_points || 0), 0), sub: 'total da equipe', color: 'text-rose-500' },
  ]

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
            className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium border bg-white ${toast.type === 'success' ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}`}
          >
            {toast.type === 'success' ? <Check className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm delete */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null) }}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Remover Funcionário</h3>
              <p className="text-sm text-gray-500 text-center mb-5">Esta ação não pode ser desfeita. O funcionário será removido permanentemente.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={() => deleteEmployee(confirmDelete)} className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium">Remover</button>
              </div>
            </motion.div>
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
            <h1 className="text-2xl font-bold text-gray-900">Hub de Gestão de Equipe</h1>
            <p className="text-sm text-gray-500">Ficha completa, permissões e engajamento</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
          {mainView === 'employees' && (
            <button onClick={() => openEmployee('new')} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors">
              <UserPlus className="h-4 w-4" /> Novo Funcionário
            </button>
          )}
          {mainView === 'users' && userSubTab === 'list' && (
            <button onClick={() => { setUserSubTab('create'); setCreateSuccess(null); setCreateError(null) }} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors">
              <UserPlus className="h-4 w-4" /> Criar Acesso
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* View switcher + Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {([
            { id: 'employees', label: 'Funcionários', icon: Users },
            { id: 'users', label: 'Contas de Sistema', icon: Shield },
          ] as const).map(v => {
            const Icon = v.icon
            return (
              <button key={v.id} onClick={() => { setMainView(v.id); setUserSubTab('list') }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mainView === v.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <Icon className="h-4 w-4" />{v.label}
              </button>
            )
          })}
        </div>

        {mainView === 'users' && (
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button onClick={() => setUserSubTab('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${userSubTab === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Users className="h-3.5 w-3.5" /> Contas Ativas
            </button>
            <button onClick={() => { setUserSubTab('create'); setCreateSuccess(null); setCreateError(null) }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${userSubTab === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <UserPlus className="h-3.5 w-3.5" /> Criar Acesso
            </button>
          </div>
        )}

        {(mainView === 'employees' || (mainView === 'users' && userSubTab === 'list')) && (
          <div className="relative flex-1">
            <input
              type="text" placeholder="Buscar por nome, cargo ou e-mail..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        )}

        {mainView === 'employees' && (
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : 'Inativos'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500">Carregando equipe...</p>
        </div>
      ) : mainView === 'employees' ? (
        /* EMPLOYEES GRID */
        filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhum funcionário encontrado</p>
            <button onClick={() => openEmployee('new')} className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
              Adicionar primeiro funcionário
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(emp => (
              <motion.div key={emp.id} layout
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => openEmployee(emp.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {emp.photo_url ? (
                        <img src={emp.photo_url} alt={emp.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {emp.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${emp.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{emp.name}</p>
                      <p className="text-xs text-gray-500 truncate">{emp.role || 'Sem cargo'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); openEmployee(emp.id) }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(emp.id) }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  {emp.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="h-3 w-3 flex-shrink-0" /><span className="truncate">{emp.email}</span>
                    </div>
                  )}
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="h-3 w-3 flex-shrink-0" />{emp.phone}
                    </div>
                  )}
                  {emp.department && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Briefcase className="h-3 w-3 flex-shrink-0" />{emp.department}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {emp.salary > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        R$ {emp.salary.toLocaleString('pt-BR')}
                      </span>
                    )}
                    {(emp.overtime_bank || 0) > 0 && (
                      <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="h-3 w-3" />{emp.overtime_bank}h
                      </span>
                    )}
                  </div>
                  {(emp.gamification_points || 0) > 0 && (
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" />{emp.gamification_points}
                    </span>
                  )}
                </div>

                {Array.isArray(emp.gamification_medals) && emp.gamification_medals.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {emp.gamification_medals.map((m: string) => {
                      const icons: Record<string, string> = { star: '⭐', performance: '🏆', punctuality: '⏰', quality: '💎', teamwork: '🤝', innovation: '💡' }
                      return <span key={m} className="text-sm">{icons[m] || '🏅'}</span>
                    })}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )
      ) : mainView === 'users' && userSubTab === 'list' ? (
        /* SYSTEM USERS TABLE */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {filteredUsers.length === 0 ? (
            <div className="p-16 text-center">
              <Shield className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhuma conta de sistema encontrada</p>
              <button onClick={() => { setUserSubTab('create'); setCreateSuccess(null); setCreateError(null) }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 mx-auto"
              >
                <UserPlus className="h-4 w-4" /> Criar primeiro acesso
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map(user => (
                <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${user.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{user.full_name || user.email}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" />Último: {formatDate(user.last_login)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={user.role}
                      onChange={e => changeUserRole(user.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'super_admin').map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => toggleUserActive(user.id, user.is_active)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${user.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                    >
                      {user.is_active ? <><ToggleRight className="h-4 w-4" />Ativo</> : <><ToggleLeft className="h-4 w-4" />Inativo</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : mainView === 'users' && userSubTab === 'create' ? (
        /* CREATE ACCESS FORM */
        <div className="max-w-xl">
          <AnimatePresence mode="wait">
            {createSuccess ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center"
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
                <p className="text-xs text-gray-400 mb-5">O usuário pode alterar a senha em <strong>Configurações &gt; Perfil</strong> após o primeiro acesso.</p>
                <div className="flex gap-3">
                  <button onClick={() => setCreateSuccess(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-xl hover:bg-gray-50 font-medium">
                    Criar outro acesso
                  </button>
                  <button onClick={() => setUserSubTab('list')} className="flex-1 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 font-medium">
                    Ver contas
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200"
              >
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Criar novo acesso ao sistema</h2>
                    <p className="text-xs text-gray-500">Defina e-mail e senha temporária do usuário</p>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {createError && (
                    <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />{createError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" value={createForm.full_name}
                        onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                        placeholder="Ex: Daiani Allini"
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="email" value={createForm.email}
                        onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Senha temporária <span className="text-red-500">*</span>
                      <span className="ml-1.5 text-xs text-gray-400 font-normal">— usuário altera no perfil após o 1º acesso</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} value={createForm.password}
                        onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full pl-9 pr-24 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono tracking-wider"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button type="button" onClick={() => setCreateForm(f => ({ ...f, password: generatePassword() }))}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                        >Gerar</button>
                        <button type="button" onClick={() => setShowPassword(p => !p)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                          {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">Copie e compartilhe esta senha antes de salvar</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nível de acesso</label>
                    <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'super_admin').map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                  <button onClick={() => setUserSubTab('list')}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-xl hover:bg-gray-50 font-medium"
                  >Cancelar</button>
                  <button onClick={handleCreateAccount} disabled={createSaving}
                    className="flex-1 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {createSaving
                      ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      : <><UserPlus className="h-4 w-4" />Criar acesso</>
                    }
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}

      {/* Drawer */}
      {drawerOpen && (
        <EmployeeDetailDrawer
          employeeId={selectedEmployeeId === 'new' ? null : selectedEmployeeId}
          onClose={closeDrawer}
          onSaved={onSaved}
        />
      )}

    </div>
  )
}

export default StaffHub
