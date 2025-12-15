import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  History,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TestTube,
  Copy,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Briefcase,
  Star,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Settings
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AutomationTemplate {
  id: string
  category: string
  name: string
  description: string
  icon: string
  trigger_type: string
  default_conditions: any
  default_actions: any[]
  variables: string[]
  is_popular: boolean
  usage_count: number
  estimated_time_saved_minutes: number
  tags: string[]
}

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_conditions: any
  actions: any[]
  is_active: boolean
  test_mode: boolean
  priority: number
  execution_count: number
  last_executed_at: string | null
  retry_on_failure: boolean
  max_retries: number
  template_id: string | null
  created_at: string
}

interface Analytics {
  total_rules: number
  active_rules: number
  total_executions: number
  success_rate: number
  avg_execution_time_ms: number
  total_time_saved_hours: number
}

const categoryIcons: Record<string, any> = {
  vendas: DollarSign,
  financeiro: TrendingUp,
  tecnico: Package,
  rh: Users,
  operacional: Briefcase
}

const categoryColors: Record<string, string> = {
  vendas: 'blue',
  financeiro: 'green',
  tecnico: 'orange',
  rh: 'purple',
  operacional: 'pink'
}

export default function AutomationsEnhanced() {
  const [templates, setTemplates] = useState<AutomationTemplate[]>([])
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'templates' | 'rules' | 'analytics'>('templates')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const toast = useToast()

  const [formData, setFormData] = useState({
    name: '',
    custom_variables: {}
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadTemplates(),
        loadRules(),
        loadAnalytics()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_templates')
        .select('*')
        .order('is_popular', { ascending: false })
        .order('usage_count', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('priority', { ascending: false })

      if (error) throw error
      setRules(data || [])
    } catch (error) {
      console.error('Error loading rules:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_automation_analytics')

      if (error) throw error
      if (data && data.length > 0) {
        setAnalytics(data[0])
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleCreateFromTemplate = async (template: AutomationTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      custom_variables: {}
    })
    setShowModal(true)
  }

  const handleSaveAutomation = async () => {
    try {
      if (!selectedTemplate || !formData.name) {
        toast.error('Preencha o nome da automação')
        return
      }

      const { data, error } = await supabase
        .rpc('create_automation_from_template', {
          p_template_id: selectedTemplate.id,
          p_name: formData.name,
          p_custom_variables: formData.custom_variables
        })

      if (error) throw error

      toast.success('Automação criada! Configure e ative quando pronto.')
      setShowModal(false)
      setSelectedTemplate(null)
      loadRules()
    } catch (error) {
      console.error('Error creating automation:', error)
      toast.error('Erro ao criar automação')
    }
  }

  const handleTestAutomation = async (ruleId: string) => {
    try {
      toast.info('Testando automação...')

      const { data, error } = await supabase
        .rpc('test_automation_rule', {
          p_rule_id: ruleId
        })

      if (error) throw error

      setTestResults(data)
      toast.success(data.message || 'Teste concluído!')
    } catch (error) {
      console.error('Error testing automation:', error)
      toast.error('Erro ao testar automação')
    }
  }

  const toggleRule = async (ruleId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active: !currentState })
        .eq('id', ruleId)

      if (error) throw error

      toast.success(currentState ? 'Automação pausada' : 'Automação ativada')
      loadRules()
    } catch (error) {
      console.error('Error toggling rule:', error)
      toast.error('Erro ao alterar status')
    }
  }

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Deseja realmente excluir esta automação?')) return

    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', ruleId)

      if (error) throw error

      toast.success('Automação excluída')
      loadRules()
    } catch (error) {
      console.error('Error deleting rule:', error)
      toast.error('Erro ao excluir automação')
    }
  }

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))]

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            Automações Inteligentes
          </h1>
          <p className="text-gray-600 mt-1">Automatize tarefas e economize tempo</p>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Automações Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.active_rules}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.success_rate || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Execuções</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_executions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tempo Economizado</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_time_saved_hours || 0}h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setView('templates')}
          className={`px-6 py-3 font-medium transition-colors ${
            view === 'templates'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Templates
          </div>
        </button>
        <button
          onClick={() => setView('rules')}
          className={`px-6 py-3 font-medium transition-colors ${
            view === 'rules'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Minhas Automações ({rules.length})
          </div>
        </button>
      </div>

      {view === 'templates' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'Todos' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const CategoryIcon = categoryIcons[template.category] || Briefcase
              const color = categoryColors[template.category] || 'gray'

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:border-blue-300 transition-all cursor-pointer group"
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-${color}-100 rounded-lg`}>
                      <CategoryIcon className={`h-6 w-6 text-${color}-600`} />
                    </div>
                    {template.is_popular && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Popular
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Economiza {template.estimated_time_saved_minutes}min
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Usado {template.usage_count}x
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 group-hover:scale-105 transform">
                      <Plus className="h-4 w-4" />
                      Usar Template
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum template encontrado</p>
            </div>
          )}
        </div>
      )}

      {view === 'rules' && (
        <div className="space-y-4">
          {rules.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{rule.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      rule.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {rule.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                    {rule.test_mode && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                        Modo Teste
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{rule.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {rule.execution_count} execuções
                    </div>
                    {rule.last_executed_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Última: {format(new Date(rule.last_executed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                    )}
                    {rule.retry_on_failure && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Retry ativo
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestAutomation(rule.id)}
                    className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                    title="Testar automação"
                  >
                    <TestTube className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleRule(rule.id, rule.is_active)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      rule.is_active
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {rule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {rules.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhuma automação criada ainda</p>
              <button
                onClick={() => setView('templates')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Star className="h-5 w-5" />
                Ver Templates
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Criar Automação</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Selecionado
                </label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedTemplate.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Automação *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Follow-up Pós-Venda Giartech"
                />
              </div>

              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variáveis Disponíveis
                  </label>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables.map((variable) => (
                        <span
                          key={variable}
                          className="px-3 py-1 bg-white text-blue-600 rounded-full text-sm font-mono"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Estas variáveis serão substituídas automaticamente pelos dados reais
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Atenção</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      A automação será criada em modo INATIVO. Configure os detalhes e teste antes de ativar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAutomation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Criar Automação
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {testResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-lg w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TestTube className="h-6 w-6 text-purple-600" />
                Resultado do Teste
              </h2>
              <button
                onClick={() => setTestResults(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {testResults.simulation && (
                <>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900">
                      ✅ {testResults.simulation.affected_records} registros atendem às condições
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Ações a executar</p>
                      <p className="text-2xl font-bold text-gray-900">{testResults.simulation.actions_to_execute}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Tempo estimado</p>
                      <p className="text-2xl font-bold text-gray-900">{testResults.simulation.estimated_execution_time_seconds}s</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    {testResults.message}
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => setTestResults(null)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fechar
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
