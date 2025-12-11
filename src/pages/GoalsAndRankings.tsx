import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, Trophy, TrendingUp, Users, Award, Star, Zap,
  Calendar, DollarSign, Percent, Medal, Crown, Gift,
  Plus, Edit2, Save, X, RefreshCw, ChevronRight, Sparkles,
  Check, AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface CompanyGoal {
  id: string
  period_type: string
  start_date: string
  end_date: string
  target_amount: number
  bonus_pool: number
  achieved_amount: number
  progress_percentage: number
  status_label: string
  total_employees: number
  notes: string
}

interface EmployeeGoal {
  id: string
  employee_id: string
  employee_name: string
  role: string
  target_amount: number
  achieved_amount: number
  progress_percentage: number
  bonus_percentage: number
  super_bonus_percentage: number
  bonus_earned: number
  status_label: string
  is_active: boolean
}

interface RankingEntry {
  position: number
  employee_id: string
  employee_name: string
  role: string
  total_orders: number
  total_revenue: number
  avg_order_value: number
  position_label: string
}

interface Achievement {
  id: string
  employee_name: string
  achievement_type: string
  badge_level: string
  title: string
  description: string
  earned_date: string
  points: number
}

interface RankingConfig {
  id: string
  ranking_type: string
  period: string
  first_place_prize: string
  second_place_prize: string
  third_place_prize: string
  first_place_value: number
  second_place_value: number
  third_place_value: number
}

interface Employee {
  id: string
  name: string
  role: string
}

const GoalsAndRankings = () => {
  const [activeTab, setActiveTab] = useState<'supermeta' | 'individual' | 'rankings' | 'conquistas'>('supermeta')
  const [loading, setLoading] = useState(true)

  const [companyGoal, setCompanyGoal] = useState<CompanyGoal | null>(null)
  const [employeeGoals, setEmployeeGoals] = useState<EmployeeGoal[]>([])
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [rankingConfigs, setRankingConfigs] = useState<RankingConfig[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  const [showNewGoalModal, setShowNewGoalModal] = useState(false)
  const [showNewIndividualModal, setShowNewIndividualModal] = useState(false)
  const [showEditPrizeModal, setShowEditPrizeModal] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<RankingConfig | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [newGoalForm, setNewGoalForm] = useState({
    period_type: 'mensal',
    start_date: '',
    end_date: '',
    target_amount: '',
    bonus_pool: '',
    notes: ''
  })

  const [newIndividualForm, setNewIndividualForm] = useState({
    employee_id: '',
    target_amount: '',
    bonus_percentage: '5',
    super_bonus_percentage: '10'
  })

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const loadAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadCompanyGoal(),
        loadEmployeeGoals(),
        loadRankings(),
        loadAchievements(),
        loadRankingConfigs(),
        loadEmployees()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showToast('Erro ao carregar dados', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadCompanyGoal = async () => {
    const { data } = await supabase
      .from('v_current_company_goal')
      .select('*')
      .maybeSingle()

    if (data) setCompanyGoal(data)
  }

  const loadEmployeeGoals = async () => {
    const { data } = await supabase
      .from('v_current_individual_goals')
      .select('*')
      .order('progress_percentage', { ascending: false })

    if (data) setEmployeeGoals(data)
  }

  const loadRankings = async () => {
    const { data } = await supabase
      .from('v_sales_ranking')
      .select('*')

    if (data) setRankings(data)
  }

  const loadAchievements = async () => {
    const { data } = await supabase
      .from('employee_achievements')
      .select(`
        *,
        employees(name)
      `)
      .order('earned_date', { ascending: false })
      .limit(50)

    if (data) {
      setAchievements(data.map(a => ({
        ...a,
        employee_name: a.employees?.name || 'Desconhecido'
      })))
    }
  }

  const loadRankingConfigs = async () => {
    const { data } = await supabase
      .from('rankings_config')
      .select('*')
      .eq('active', true)

    if (data) setRankingConfigs(data)
  }

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, name, role')
      .eq('active', true)
      .order('name')

    if (data) setEmployees(data)
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  const updateGoalProgress = async () => {
    try {
      await supabase.rpc('update_employee_goal_achievement')
      await loadAllData()
      showToast('Progresso atualizado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error)
      showToast('Erro ao atualizar progresso', 'error')
    }
  }

  const createCompanyGoal = async () => {
    try {
      const { error } = await supabase
        .from('company_goals')
        .insert({
          period_type: newGoalForm.period_type,
          start_date: newGoalForm.start_date,
          end_date: newGoalForm.end_date,
          target_amount: parseFloat(newGoalForm.target_amount),
          bonus_pool: parseFloat(newGoalForm.bonus_pool),
          notes: newGoalForm.notes,
          status: 'ativa'
        })

      if (error) throw error

      showToast('Supermeta criada com sucesso!', 'success')
      setShowNewGoalModal(false)
      setNewGoalForm({
        period_type: 'mensal',
        start_date: '',
        end_date: '',
        target_amount: '',
        bonus_pool: '',
        notes: ''
      })
      await loadCompanyGoal()
    } catch (error) {
      console.error('Erro ao criar supermeta:', error)
      showToast('Erro ao criar supermeta', 'error')
    }
  }

  const createIndividualGoal = async () => {
    try {
      if (!companyGoal) {
        showToast('Crie uma supermeta primeiro!', 'error')
        return
      }

      const { error } = await supabase
        .from('employee_goals')
        .insert({
          employee_id: newIndividualForm.employee_id,
          company_goal_id: companyGoal.id,
          target_amount: parseFloat(newIndividualForm.target_amount),
          bonus_percentage: parseFloat(newIndividualForm.bonus_percentage),
          super_bonus_percentage: parseFloat(newIndividualForm.super_bonus_percentage),
          status: 'ativa'
        })

      if (error) throw error

      showToast('Meta individual criada com sucesso!', 'success')
      setShowNewIndividualModal(false)
      setNewIndividualForm({
        employee_id: '',
        target_amount: '',
        bonus_percentage: '5',
        super_bonus_percentage: '10'
      })
      await loadEmployeeGoals()
    } catch (error) {
      console.error('Erro ao criar meta individual:', error)
      showToast('Erro ao criar meta individual', 'error')
    }
  }

  const updateRankingConfig = async () => {
    try {
      if (!selectedConfig) return

      const { error } = await supabase
        .from('rankings_config')
        .update({
          first_place_prize: selectedConfig.first_place_prize,
          second_place_prize: selectedConfig.second_place_prize,
          third_place_prize: selectedConfig.third_place_prize,
          first_place_value: selectedConfig.first_place_value,
          second_place_value: selectedConfig.second_place_value,
          third_place_value: selectedConfig.third_place_value
        })
        .eq('id', selectedConfig.id)

      if (error) throw error

      showToast('Premiações atualizadas com sucesso!', 'success')
      setShowEditPrizeModal(false)
      await loadRankingConfigs()
    } catch (error) {
      console.error('Erro ao atualizar premiações:', error)
      showToast('Erro ao atualizar premiações', 'error')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const getBadgeColor = (level: string) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800 border-orange-300',
      prata: 'bg-gray-100 text-gray-800 border-gray-300',
      ouro: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      diamante: 'bg-blue-100 text-blue-800 border-blue-300',
      lendario: 'bg-purple-100 text-purple-800 border-purple-300'
    }
    return colors[level as keyof typeof colors] || colors.bronze
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-600'
    if (percentage >= 80) return 'bg-blue-600'
    if (percentage >= 50) return 'bg-yellow-600'
    return 'bg-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Trophy className="h-10 w-10 text-yellow-600" />
              Metas & Rankings
            </h1>
            <p className="text-gray-600 mt-2">Sistema de metas, bônus e gamificação</p>
          </div>
          <button
            onClick={updateGoalProgress}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg"
          >
            <RefreshCw className="h-5 w-5" />
            Atualizar Progresso
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-2">
          <div className="flex gap-2">
            {[
              { id: 'supermeta', label: 'Supermeta', icon: Target },
              { id: 'individual', label: 'Metas Individuais', icon: Users },
              { id: 'rankings', label: 'Rankings', icon: Trophy },
              { id: 'conquistas', label: 'Conquistas', icon: Award }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'supermeta' && (
            <motion.div
              key="supermeta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {companyGoal ? (
                <>
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                          <Target className="h-8 w-8" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold">Supermeta da Empresa</h2>
                          <p className="text-purple-100">
                            {companyGoal.period_type.charAt(0).toUpperCase() + companyGoal.period_type.slice(1)} • {companyGoal.total_employees} colaboradores
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-purple-100">Pool de Bônus</p>
                        <p className="text-3xl font-bold">{formatCurrency(companyGoal.bonus_pool)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                        <p className="text-sm text-purple-100 mb-1">Meta</p>
                        <p className="text-2xl font-bold">{formatCurrency(companyGoal.target_amount)}</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                        <p className="text-sm text-purple-100 mb-1">Alcançado</p>
                        <p className="text-2xl font-bold">{formatCurrency(companyGoal.achieved_amount)}</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                        <p className="text-sm text-purple-100 mb-1">Progresso</p>
                        <p className="text-2xl font-bold">{companyGoal.progress_percentage.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso da Meta</span>
                        <span className="font-bold">{companyGoal.status_label}</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-4">
                        <div
                          className="bg-white h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${Math.min(100, companyGoal.progress_percentage)}%` }}
                        >
                          {companyGoal.progress_percentage >= 10 && (
                            <span className="text-xs font-bold text-purple-600">
                              {companyGoal.progress_percentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {companyGoal.notes && (
                      <div className="mt-6 bg-white/10 rounded-xl p-4 backdrop-blur">
                        <p className="text-sm text-purple-100">{companyGoal.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Gift className="h-6 w-6 text-purple-600" />
                      Distribuição do Bônus
                    </h3>
                    <p className="text-gray-600 mb-4">
                      O bônus de {formatCurrency(companyGoal.bonus_pool)} será distribuído proporcionalmente entre os colaboradores que atingirem suas metas individuais.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Total de Colaboradores</p>
                        <p className="text-2xl font-bold text-green-700">{companyGoal.total_employees}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Estimativa por Pessoa</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(companyGoal.bonus_pool / Math.max(1, companyGoal.total_employees))}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                        <p className="text-sm text-gray-600 mb-1">Período</p>
                        <p className="text-lg font-bold text-purple-700">{companyGoal.period_type}</p>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                        <p className="text-sm text-gray-600 mb-1">Status</p>
                        <p className="text-lg font-bold text-yellow-700">{companyGoal.status_label}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
                  <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma Supermeta Ativa</h3>
                  <p className="text-gray-600 mb-6">Crie uma supermeta para a empresa e motive toda a equipe!</p>
                  <button
                    onClick={() => setShowNewGoalModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-5 w-5" />
                    Criar Supermeta
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'individual' && (
            <motion.div
              key="individual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total de Metas</p>
                      <p className="text-3xl font-bold text-gray-900">{employeeGoals.length}</p>
                    </div>
                    <Users className="h-10 w-10 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Metas Atingidas</p>
                      <p className="text-3xl font-bold text-green-600">
                        {employeeGoals.filter(g => g.status_label === 'Atingida').length}
                      </p>
                    </div>
                    <Trophy className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Próximas</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {employeeGoals.filter(g => g.status_label === 'Perto').length}
                      </p>
                    </div>
                    <Zap className="h-10 w-10 text-yellow-600" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Bônus Total</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {formatCurrency(employeeGoals.reduce((sum, g) => sum + g.bonus_earned, 0))}
                      </p>
                    </div>
                    <DollarSign className="h-10 w-10 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Metas Individuais</h3>
                  <button
                    onClick={() => setShowNewIndividualModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nova Meta
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {employeeGoals.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhuma meta individual criada ainda</p>
                    </div>
                  ) : (
                    employeeGoals.map((goal) => (
                      <div key={goal.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">{goal.employee_name}</h4>
                            <p className="text-sm text-gray-600">{goal.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Bônus Ganho</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(goal.bonus_earned)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Meta</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(goal.target_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Alcançado</p>
                            <p className="font-semibold text-blue-600">{formatCurrency(goal.achieved_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              goal.status_label === 'Atingida' ? 'bg-green-100 text-green-800' :
                              goal.status_label === 'Perto' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {goal.status_label}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Progresso</span>
                            <span className="font-bold">{goal.progress_percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`${getProgressColor(goal.progress_percentage)} h-3 rounded-full transition-all duration-500`}
                              style={{ width: `${Math.min(100, goal.progress_percentage)}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Bônus: {goal.bonus_percentage}%</span>
                            <span>Super Bônus: {goal.super_bonus_percentage}%</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'rankings' && (
            <motion.div
              key="rankings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rankingConfigs.map((config) => (
                  <div key={config.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 capitalize">
                        Ranking de {config.ranking_type.replace('_', ' ')}
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedConfig(config)
                          setShowEditPrizeModal(true)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Medal className="h-6 w-6 text-yellow-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">1º Lugar</p>
                          <p className="text-xs text-gray-600">{config.first_place_prize}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <Medal className="h-6 w-6 text-gray-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">2º Lugar</p>
                          <p className="text-xs text-gray-600">{config.second_place_prize}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <Medal className="h-6 w-6 text-orange-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">3º Lugar</p>
                          <p className="text-xs text-gray-600">{config.third_place_prize}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Ranking de Vendas - Mês Atual</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posição</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colaborador</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">OSs</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receita Total</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ticket Médio</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rankings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Nenhum dado de ranking disponível</p>
                          </td>
                        </tr>
                      ) : (
                        rankings.map((entry) => (
                          <tr
                            key={entry.employee_id}
                            className={`hover:bg-gray-50 ${
                              entry.position <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {entry.position === 1 && <Crown className="h-5 w-5 text-yellow-600" />}
                                {entry.position === 2 && <Medal className="h-5 w-5 text-gray-600" />}
                                {entry.position === 3 && <Medal className="h-5 w-5 text-orange-600" />}
                                <span className="text-lg font-bold text-gray-900">{entry.position_label}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="font-semibold text-gray-900">{entry.employee_name}</p>
                                <p className="text-sm text-gray-600">{entry.role}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {entry.total_orders}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-lg font-bold text-green-600">
                                {formatCurrency(entry.total_revenue)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-gray-900 font-medium">
                                {formatCurrency(entry.avg_order_value)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'conquistas' && (
            <motion.div
              key="conquistas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-yellow-600" />
                  Conquistas Recentes
                </h3>
                {achievements.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma conquista registrada ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-6 rounded-xl border-2 ${getBadgeColor(achievement.badge_level)} transition-all hover:scale-105`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                            <Star className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{achievement.title}</p>
                            <p className="text-xs opacity-75">{achievement.employee_name}</p>
                          </div>
                        </div>
                        <p className="text-sm mb-3">{achievement.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium capitalize">{achievement.badge_level}</span>
                          <span className="font-bold">{achievement.points} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showNewGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Criar Supermeta</h2>
              <button onClick={() => setShowNewGoalModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                <select
                  value={newGoalForm.period_type}
                  onChange={(e) => setNewGoalForm({ ...newGoalForm, period_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                  <input
                    type="date"
                    value={newGoalForm.start_date}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, start_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                  <input
                    type="date"
                    value={newGoalForm.end_date}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, end_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor da Meta (R$)</label>
                  <input
                    type="number"
                    value={newGoalForm.target_amount}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, target_amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="100000.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pool de Bônus (R$)</label>
                  <input
                    type="number"
                    value={newGoalForm.bonus_pool}
                    onChange={(e) => setNewGoalForm({ ...newGoalForm, bonus_pool: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="5000.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  value={newGoalForm.notes}
                  onChange={(e) => setNewGoalForm({ ...newGoalForm, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Notas sobre a meta..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewGoalModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={createCompanyGoal}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Criar Supermeta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewIndividualModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Criar Meta Individual</h2>
              <button onClick={() => setShowNewIndividualModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Funcionário</label>
                <select
                  value={newIndividualForm.employee_id}
                  onChange={(e) => setNewIndividualForm({ ...newIndividualForm, employee_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um funcionário</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor da Meta (R$)</label>
                <input
                  type="number"
                  value={newIndividualForm.target_amount}
                  onChange={(e) => setNewIndividualForm({ ...newIndividualForm, target_amount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="15000.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bônus (%)</label>
                  <input
                    type="number"
                    value={newIndividualForm.bonus_percentage}
                    onChange={(e) => setNewIndividualForm({ ...newIndividualForm, bonus_percentage: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Super Bônus (%)</label>
                  <input
                    type="number"
                    value={newIndividualForm.super_bonus_percentage}
                    onChange={(e) => setNewIndividualForm({ ...newIndividualForm, super_bonus_percentage: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-900">
                  Bônus: {newIndividualForm.bonus_percentage}% ao atingir 100% da meta
                  <br />
                  Super Bônus: {newIndividualForm.super_bonus_percentage}% ao superar 110% da meta
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewIndividualModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={createIndividualGoal}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Criar Meta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditPrizeModal && selectedConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Editar Premiações</h2>
              <button onClick={() => setShowEditPrizeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">1º Lugar - Premiação</label>
                <input
                  type="text"
                  value={selectedConfig.first_place_prize}
                  onChange={(e) => setSelectedConfig({ ...selectedConfig, first_place_prize: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">1º Lugar - Valor (R$)</label>
                <input
                  type="number"
                  value={selectedConfig.first_place_value}
                  onChange={(e) => setSelectedConfig({ ...selectedConfig, first_place_value: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2º Lugar - Premiação</label>
                <input
                  type="text"
                  value={selectedConfig.second_place_prize}
                  onChange={(e) => setSelectedConfig({ ...selectedConfig, second_place_prize: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2º Lugar - Valor (R$)</label>
                <input
                  type="number"
                  value={selectedConfig.second_place_value}
                  onChange={(e) => setSelectedConfig({ ...selectedConfig, second_place_value: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">3º Lugar - Premiação</label>
                <input
                  type="text"
                  value={selectedConfig.third_place_prize}
                  onChange={(e) => setSelectedConfig({ ...selectedConfig, third_place_prize: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">3º Lugar - Valor (R$)</label>
                <input
                  type="number"
                  value={selectedConfig.third_place_value}
                  onChange={(e) => setSelectedConfig({ ...selectedConfig, third_place_value: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditPrizeModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateRankingConfig}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalsAndRankings
