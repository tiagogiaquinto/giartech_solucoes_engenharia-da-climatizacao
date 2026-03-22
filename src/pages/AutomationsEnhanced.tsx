import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, CheckCircle2, Clock, Play, Pause, Plus, Trash2, History,
  TrendingUp, Package, DollarSign, Users, Briefcase, Search,
  AlertTriangle, XCircle, RefreshCw, Info, ChevronRight,
  FileText, Bell, ShoppingCart, Star, Target
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

interface NativeAutomation {
  id: string
  trigger: string
  description: string
  action: string
  category: string
  icon: any
  color: string
  alwaysOn: boolean
}

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger_type: string
  is_active: boolean
  execution_count: number
  last_executed_at: string | null
  created_at: string
}

interface AutomationLog {
  id: string
  rule_id: string | null
  trigger_event: string
  status: string
  executed_at: string
  error_message: string | null
  automation_rules?: { name: string } | null
}

const NATIVE_AUTOMATIONS: NativeAutomation[] = [
  {
    id: 'os_complete_finance',
    trigger: 'OS Finalizada',
    description: 'Quando uma OS é concluída, um lançamento financeiro de receita é criado automaticamente com o valor da OS.',
    action: 'Cria lançamento de receita',
    category: 'financeiro',
    icon: DollarSign,
    color: 'green',
    alwaysOn: true,
  },
  {
    id: 'os_assigned_notify',
    trigger: 'OS Atribuída ao Técnico',
    description: 'Quando um técnico é designado para uma OS, ele recebe uma notificação imediata com os detalhes do atendimento.',
    action: 'Notifica o técnico designado',
    category: 'tecnico',
    icon: Bell,
    color: 'blue',
    alwaysOn: true,
  },
  {
    id: 'customer_created_notify',
    trigger: 'Novo Cliente Cadastrado',
    description: 'Quando um novo cliente é cadastrado no sistema, a equipe recebe um alerta para realizar o primeiro contato.',
    action: 'Alerta equipe comercial',
    category: 'vendas',
    icon: Users,
    color: 'blue',
    alwaysOn: true,
  },
  {
    id: 'crm_won_create_os',
    trigger: 'Oportunidade CRM Ganha',
    description: 'Quando uma oportunidade no CRM é marcada como "Fechado Ganho", uma OS em rascunho é criada automaticamente para o cliente.',
    action: 'Cria OS em rascunho',
    category: 'vendas',
    icon: Target,
    color: 'blue',
    alwaysOn: true,
  },
  {
    id: 'stock_low_purchase',
    trigger: 'Estoque Abaixo do Mínimo',
    description: 'Quando o estoque de um material cai abaixo do mínimo configurado, um pedido de compra em rascunho é criado e a equipe é notificada.',
    action: 'Cria pedido de compra + notifica',
    category: 'operacional',
    icon: ShoppingCart,
    color: 'orange',
    alwaysOn: true,
  },
  {
    id: 'finance_overdue_notify',
    trigger: 'Lançamento Marcado como Vencido',
    description: 'Quando um lançamento financeiro tem seu status alterado para vencido, a equipe administrativa recebe um alerta imediato.',
    action: 'Alerta equipe financeira',
    category: 'financeiro',
    icon: AlertTriangle,
    color: 'red',
    alwaysOn: true,
  },
  {
    id: 'crm_stage_sync',
    trigger: 'Mudança de Etapa no CRM',
    description: 'Quando o estágio de uma oportunidade CRM muda, a OS vinculada é atualizada automaticamente com o novo status.',
    action: 'Sincroniza status da OS',
    category: 'vendas',
    icon: RefreshCw,
    color: 'blue',
    alwaysOn: true,
  },
  {
    id: 'os_stage_history',
    trigger: 'Mudança de Status de OS',
    description: 'Toda mudança de status ou etapa de uma OS é registrada no histórico com timestamp, criando rastreabilidade completa.',
    action: 'Registra no histórico da OS',
    category: 'operacional',
    icon: History,
    color: 'gray',
    alwaysOn: true,
  },
]

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  financeiro: { label: 'Financeiro', color: 'text-green-700', bg: 'bg-green-100 border-green-200', icon: DollarSign },
  vendas: { label: 'Vendas / CRM', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200', icon: TrendingUp },
  tecnico: { label: 'Técnico', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200', icon: Package },
  rh: { label: 'RH', color: 'text-violet-700', bg: 'bg-violet-100 border-violet-200', icon: Users },
  operacional: { label: 'Operacional', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200', icon: Briefcase },
}

const TRIGGER_LABELS: Record<string, string> = {
  service_order_created: 'OS Criada',
  service_order_completed: 'OS Concluída',
  payment_received: 'Pagamento Recebido',
  payment_overdue: 'Pagamento Vencido',
  stock_low: 'Estoque Baixo',
  customer_created: 'Novo Cliente',
  proposal_sent: 'Proposta Enviada',
  lead_inactive: 'Lead Inativo',
  contract_expiring: 'Contrato Expirando',
  technician_on_route: 'Técnico em Rota',
  scheduled_monthly: 'Mensal Agendado',
  employee_birthday: 'Aniversário Funcionário',
}

export default function AutomationsEnhanced() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'native' | 'rules' | 'logs'>('native')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadRules(), loadLogs()])
    } finally {
      setLoading(false)
    }
  }

  const loadRules = async () => {
    const { data } = await supabase
      .from('automation_rules')
      .select('id, name, description, trigger_type, is_active, execution_count, last_executed_at, created_at')
      .order('created_at', { ascending: false })
    setRules(data || [])
  }

  const loadLogs = async () => {
    const { data } = await supabase
      .from('automation_logs')
      .select('id, rule_id, trigger_event, status, executed_at, error_message, automation_rules(name)')
      .order('executed_at', { ascending: false })
      .limit(50)
    setLogs(data || [])
  }

  const toggleRule = async (rule: AutomationRule) => {
    setTogglingId(rule.id)
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id)
      if (error) throw error
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
      toast.success(rule.is_active ? 'Automação pausada' : 'Automação ativada')
    } catch {
      toast.error('Erro ao atualizar automação')
    } finally {
      setTogglingId(null)
    }
  }

  const deleteRule = async (id: string) => {
    if (!confirm('Excluir esta automação?')) return
    const { error } = await supabase.from('automation_rules').delete().eq('id', id)
    if (!error) {
      setRules(prev => prev.filter(r => r.id !== id))
      toast.success('Automação excluída')
    }
  }

  const filteredNative = NATIVE_AUTOMATIONS.filter(a => {
    const matchCat = categoryFilter === 'all' || a.category === categoryFilter
    const matchSearch = !search ||
      a.trigger.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.action.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const filteredRules = rules.filter(r =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const activeRules = rules.filter(r => r.is_active).length
  const totalExecutions = rules.reduce((a, r) => a + (r.execution_count || 0), 0)
  const successLogs = logs.filter(l => l.status === 'success').length
  const successRate = logs.length > 0 ? Math.round((successLogs / logs.length) * 100) : 100

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-7 h-7 text-blue-600" />
            Automações
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Regras automáticas que eliminam trabalho manual da equipe
          </p>
        </div>
        <button
          onClick={() => setTab('rules')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Regra
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Nativas Ativas', value: NATIVE_AUTOMATIONS.length, icon: CheckCircle2, color: 'green', sub: 'sempre ligadas' },
          { label: 'Regras Ativas', value: activeRules, icon: Zap, color: 'blue', sub: `de ${rules.length} criadas` },
          { label: 'Execuções', value: totalExecutions, icon: Play, color: 'gray', sub: 'total acumulado' },
          { label: 'Taxa de Sucesso', value: `${successRate}%`, icon: Star, color: 'amber', sub: 'últimas execuções' },
        ].map(card => {
          const Icon = card.icon
          const colors: Record<string, string> = {
            green: 'bg-green-50 border-green-200 text-green-700',
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
            gray: 'bg-gray-50 border-gray-200 text-gray-700',
            amber: 'bg-amber-50 border-amber-200 text-amber-700',
          }
          const iconColors: Record<string, string> = {
            green: 'text-green-600', blue: 'text-blue-600', gray: 'text-gray-500', amber: 'text-amber-600'
          }
          return (
            <div key={card.label} className={`rounded-2xl border p-4 ${colors[card.color]}`}>
              <div className="flex items-start justify-between mb-2">
                <Icon className={`w-5 h-5 ${iconColors[card.color]}`} />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs font-semibold mt-0.5">{card.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        {[
          { id: 'native', label: 'Automações Nativas', count: NATIVE_AUTOMATIONS.length },
          { id: 'rules', label: 'Regras Configuráveis', count: rules.length },
          { id: 'logs', label: 'Histórico', count: logs.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar automações..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {tab === 'native' && (
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'financeiro', 'vendas', 'tecnico', 'operacional'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'Todos' : CATEGORY_CONFIG[cat]?.label || cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'native' && (
          <motion.div key="native" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Automações Nativas — Sempre Ativas</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Estas automações são implementadas diretamente no banco de dados via triggers PostgreSQL. Elas executam instantaneamente, sem depender de conexão com internet ou serviços externos, e nunca falham silenciosamente.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {filteredNative.map((auto, i) => {
                const Icon = auto.icon
                const cat = CATEGORY_CONFIG[auto.category]
                return (
                  <motion.div
                    key={auto.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cat?.bg}`}>
                          <Icon className={`w-5 h-5 ${cat?.color}`} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{auto.trigger}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cat?.bg} ${cat?.color}`}>
                            {cat?.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-100 px-2.5 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-green-700">Ativa</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{auto.description}</p>

                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-700">{auto.action}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {tab === 'rules' && (
          <motion.div key="rules" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Regras Configuráveis</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Automações criadas manualmente com triggers e ações personalizadas. Podem ser ativadas, pausadas e ajustadas a qualquer momento.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhuma regra configurada</p>
                <p className="text-sm text-gray-400 mt-1">Crie regras personalizadas para seu fluxo de trabalho</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRules.map((rule, i) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                            rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${rule.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {rule.is_active ? 'Ativa' : 'Pausada'}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900">{rule.name}</h3>
                        {rule.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{rule.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            {rule.execution_count || 0} execuções
                          </span>
                          {rule.last_executed_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(rule.last_executed_at).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleRule(rule)}
                          disabled={togglingId === rule.id}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            rule.is_active
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                        >
                          {togglingId === rule.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : rule.is_active ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhuma execução registrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex items-center gap-4"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      log.status === 'success' ? 'bg-green-100' :
                      log.status === 'failed' ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      {log.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : log.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {(log.automation_rules as any)?.name || TRIGGER_LABELS[log.trigger_event] || log.trigger_event}
                      </p>
                      {log.error_message && (
                        <p className="text-xs text-red-500 truncate mt-0.5">{log.error_message}</p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        log.status === 'success' ? 'bg-green-100 text-green-700' :
                        log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {log.status === 'success' ? 'Sucesso' : log.status === 'failed' ? 'Falha' : 'Pendente'}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.executed_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
