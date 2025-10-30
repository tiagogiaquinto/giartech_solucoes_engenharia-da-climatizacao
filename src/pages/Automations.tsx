import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  AlertTriangle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_conditions: any
  actions: any[]
  is_active: boolean
  priority: number
  execution_count: number
  last_executed_at: string | null
  created_at: string
}

interface AutomationLog {
  id: string
  rule_id: string
  trigger_event: string
  status: string
  actions_executed: number
  actions_failed: number
  error_message: string | null
  executed_at: string
}

export default function Automations() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'service_order_created',
    actions: [] as any[],
    priority: 1
  })
  const toast = useToast()

  useEffect(() => {
    loadRules()
  }, [])

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
      toast.error('Erro ao carregar regras')
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async (ruleId: string) => {
    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .eq('rule_id', ruleId)
        .order('executed_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setLogs(data || [])
      setShowLogs(true)
    } catch (error) {
      console.error('Error loading logs:', error)
      toast.error('Erro ao carregar histórico')
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

  const handleSaveAutomation = async () => {
    try {
      if (!formData.name || !formData.description) {
        toast.error('Preencha nome e descrição')
        return
      }

      const { error } = await supabase
        .from('automation_rules')
        .insert({
          name: formData.name,
          description: formData.description,
          trigger_type: formData.trigger_type,
          trigger_conditions: {},
          actions: formData.actions.length > 0 ? formData.actions : [
            { type: 'notification', config: { message: 'Automação executada' } }
          ],
          is_active: true,
          priority: formData.priority,
          execution_count: 0
        })

      if (error) throw error

      toast.success('Automação criada com sucesso!')
      setShowModal(false)
      setFormData({
        name: '',
        description: '',
        trigger_type: 'service_order_created',
        actions: [],
        priority: 1
      })
      loadRules()
    } catch (error: any) {
      console.error('Error saving automation:', error)
      toast.error('Erro ao salvar: ' + error.message)
    }
  }

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      service_order_created: 'OS Criada',
      service_order_completed: 'OS Concluída',
      payment_received: 'Pagamento Recebido',
      payment_overdue: 'Pagamento Atrasado',
      stock_low: 'Estoque Baixo',
      customer_created: 'Cliente Cadastrado',
      custom_date: 'Data Específica'
    }
    return labels[type] || type
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'running':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automações e Workflows</h1>
          <p className="text-gray-600 mt-1">Configure regras automáticas para seu negócio</p>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus className="h-4 w-4" />
          Nova Automação
        </button>
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {rules.map((rule) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    rule.is_active ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Zap className={`h-5 w-5 ${
                      rule.is_active ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRule(rule.id, rule.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    rule.is_active
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  title={rule.is_active ? 'Pausar' : 'Ativar'}
                >
                  {rule.is_active ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => loadLogs(rule.id)}
                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Ver Histórico"
                >
                  <History className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <span className="text-xs text-gray-500">Gatilho</span>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {getTriggerLabel(rule.trigger_type)}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Prioridade</span>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {rule.priority}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Execuções</span>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {rule.execution_count}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Última Execução</span>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {rule.last_executed_at
                    ? format(new Date(rule.last_executed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                    : 'Nunca'
                  }
                </p>
              </div>
            </div>

            {/* Actions Preview */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500 mb-2 block">Ações Configuradas</span>
              <div className="flex flex-wrap gap-2">
                {rule.actions.map((action: any, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {action.type === 'notification' ? '🔔 Notificação' :
                     action.type === 'email' ? '📧 Email' :
                     action.type === 'webhook' ? '🔗 Webhook' : action.type}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma Automação Configurada
          </h3>
          <p className="text-gray-600 mb-4">
            Crie sua primeira automação para começar a otimizar seus processos
          </p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-4 w-4" />
            Criar Primeira Automação
          </button>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Histórico de Execuções
                </h2>
                <button
                  onClick={() => setShowLogs(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
              {logs.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  Nenhuma execução registrada
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {log.status === 'success' && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {log.status === 'failed' && (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          {log.status === 'running' && (
                            <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {log.trigger_event}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status === 'success' ? 'Sucesso' :
                           log.status === 'failed' ? 'Falhou' :
                           log.status === 'running' ? 'Executando' : 'Pendente'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {format(new Date(log.executed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span>
                          {log.actions_executed} ações executadas
                        </span>
                        {log.actions_failed > 0 && (
                          <span className="text-red-600">
                            {log.actions_failed} falharam
                          </span>
                        )}
                      </div>

                      {log.error_message && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                          {log.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Nova Automação
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Automação *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Notificar OS Concluída"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descreva o que esta automação faz"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gatilho (Quando Executar)
                  </label>
                  <select
                    value={formData.trigger_type}
                    onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="service_order_created">Quando OS for Criada</option>
                    <option value="service_order_completed">Quando OS for Concluída</option>
                    <option value="payment_received">Quando Pagamento for Recebido</option>
                    <option value="payment_overdue">Quando Pagamento Atrasar</option>
                    <option value="stock_low">Quando Estoque Baixo</option>
                    <option value="customer_created">Quando Cliente for Cadastrado</option>
                    <option value="custom_date">Em Data Específica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">Baixa</option>
                    <option value="5">Média</option>
                    <option value="10">Alta</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Ação Padrão</p>
                      <p>Esta automação criará uma notificação quando for acionada. Você poderá adicionar mais ações após criar a automação.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAutomation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Automação
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
