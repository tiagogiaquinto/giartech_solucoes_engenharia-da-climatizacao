import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TRIGGER_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  service_order_created:        { label: 'OS criada',                  icon: '📋', color: 'blue' },
  service_order_completed:      { label: 'OS concluída',               icon: '✅', color: 'green' },
  service_order_status_changed: { label: 'Status da OS mudou',         icon: '🔄', color: 'purple' },
  payment_received:             { label: 'Pagamento recebido',         icon: '💰', color: 'green' },
  payment_overdue:              { label: 'Pagamento em atraso',        icon: '⚠️', color: 'red' },
  customer_created:             { label: 'Novo cliente',               icon: '👤', color: 'blue' },
  stock_low:                    { label: 'Estoque crítico',            icon: '📦', color: 'orange' },
  material_request_created:     { label: 'Solicitação de material',    icon: '🛒', color: 'orange' },
  scheduled:                    { label: 'Agendado',                   icon: '⏰', color: 'gray' },
}

const ACTION_LABELS: Record<string, string> = {
  notification:           '🔔 Notificação interna',
  send_notification:      '🔔 Notificação',
  send_alert:             '🚨 Alerta',
  create_task:            '✅ Criar task',
  create_finance_entry:   '💵 Lançamento financeiro',
  sync_finance:           '💵 Sincronizar financeiro',
  sync_agenda:            '📅 Sincronizar agenda',
  portal_notification:    '📱 Notificar portal cliente',
  thomaz_alert:           '🤖 Alerta do Thomaz',
  thomaz_report:          '📊 Relatório do Thomaz',
}

const COLOR_CLASSES: Record<string, { badge: string; border: string; header: string }> = {
  blue:   { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',   border: 'border-blue-200 dark:border-blue-800',   header: 'bg-blue-50 dark:bg-blue-900/20' },
  green:  { badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', border: 'border-green-200 dark:border-green-800', header: 'bg-green-50 dark:bg-green-900/20' },
  purple: { badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', header: 'bg-purple-50 dark:bg-purple-900/20' },
  red:    { badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',       border: 'border-red-200 dark:border-red-800',     header: 'bg-red-50 dark:bg-red-900/20' },
  orange: { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', header: 'bg-orange-50 dark:bg-orange-900/20' },
  gray:   { badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',      border: 'border-gray-200 dark:border-gray-700',   header: 'bg-gray-50 dark:bg-gray-800' },
}

interface Rule {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_conditions: Record<string, unknown>
  actions: Array<{ type: string; config?: Record<string, unknown> }>
  is_active: boolean
  priority: number
  execution_count: number
  last_executed_at: string | null
  schedule_type: string | null
  schedule_config: Record<string, unknown> | null
  retry_on_failure: boolean
  notify_on_failure: boolean
}

export default function WorkflowAutomation() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [toggling, setToggling] = useState<Set<string>>(new Set())

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .order('priority', { ascending: false })
      .order('execution_count', { ascending: false })

    if (!error && data) setRules(data as Rule[])
    setLoading(false)
  }

  async function toggleRule(rule: Rule) {
    if (toggling.has(rule.id)) return
    setToggling(prev => new Set(prev).add(rule.id))

    const { error } = await supabase
      .from('automation_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id)

    if (!error) {
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
    }
    setToggling(prev => { const s = new Set(prev); s.delete(rule.id); return s })
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function fmtDate(iso: string | null): string {
    if (!iso) return 'Nunca'
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / 3_600_000)
    if (h < 1) return 'Há menos de 1h'
    if (h < 24) return `Há ${h}h`
    const d = Math.floor(h / 24)
    return `Há ${d} dia${d > 1 ? 's' : ''}`
  }

  const filtered = rules.filter(r => {
    if (filter === 'active') return r.is_active
    if (filter === 'inactive') return !r.is_active
    return true
  })

  const byTrigger = filtered.reduce<Record<string, Rule[]>>((acc, r) => {
    const key = r.trigger_type || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const totalActive = rules.filter(r => r.is_active).length
  const totalExec = rules.reduce((s, r) => s + (r.execution_count || 0), 0)

  const triggerOrder = [
    'service_order_created', 'service_order_completed', 'service_order_status_changed',
    'payment_received', 'payment_overdue', 'customer_created',
    'stock_low', 'material_request_created', 'scheduled',
  ]
  const sortedTriggers = [
    ...triggerOrder.filter(t => byTrigger[t]),
    ...Object.keys(byTrigger).filter(t => !triggerOrder.includes(t)),
  ]

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            ⚡ Automações de Workflow
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Regras automáticas que orquestram as operações do sistema
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">Total de Regras</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{rules.length}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sortedTriggers.length} tipo{sortedTriggers.length !== 1 ? 's' : ''} de gatilho</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">Regras Ativas</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{totalActive}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{rules.length - totalActive} inativa{rules.length - totalActive !== 1 ? 's' : ''}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">Total de Execuções</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalExec.toLocaleString('pt-BR')}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">desde a ativação</div>
        </div>
      </div>

      {/* Fluxo visual */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Fluxo de Automação</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 font-medium">Evento do Sistema</span>
          <span className="text-gray-400">→</span>
          <span className="px-3 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 font-medium">Gatilho</span>
          <span className="text-gray-400">→</span>
          <span className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 font-medium">Condições</span>
          <span className="text-gray-400">→</span>
          <span className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 font-medium">Ações</span>
          <span className="text-gray-400">→</span>
          <span className="px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700 font-medium">Notificações</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {f === 'all' ? 'Todas' : f === 'active' ? 'Ativas' : 'Inativas'}
            <span className="ml-2 text-xs opacity-60">
              {f === 'all' ? rules.length : f === 'active' ? totalActive : rules.length - totalActive}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Grupos por gatilho */}
      {!loading && sortedTriggers.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          Nenhuma regra encontrada.
        </div>
      )}

      {!loading && sortedTriggers.map(triggerKey => {
        const meta = TRIGGER_LABELS[triggerKey] || { label: triggerKey, icon: '⚙️', color: 'gray' }
        const colors = COLOR_CLASSES[meta.color] || COLOR_CLASSES.gray
        const groupRules = byTrigger[triggerKey]

        return (
          <div key={triggerKey} className={`rounded-xl border ${colors.border} overflow-hidden`}>
            <div className={`${colors.header} px-5 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{meta.icon}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{meta.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                  {groupRules.length} regra{groupRules.length !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {groupRules.filter(r => r.is_active).length} ativa{groupRules.filter(r => r.is_active).length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {groupRules.map(rule => {
                const isExpanded = expanded.has(rule.id)
                const isToggling = toggling.has(rule.id)

                return (
                  <div key={rule.id} className="bg-white dark:bg-gray-800">
                    <div className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{rule.name}</span>
                          {rule.priority > 80 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">Alta prioridade</span>
                          )}
                          {rule.retry_on_failure && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">Retry</span>
                          )}
                        </div>
                        {rule.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{rule.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {rule.execution_count} execuç{rule.execution_count === 1 ? 'ão' : 'ões'}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Última: {fmtDate(rule.last_executed_at)}
                          </span>
                          {rule.actions?.length > 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {rule.actions.length} ação{rule.actions.length !== 1 ? 'ões' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => toggleExpand(rule.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                          {isExpanded ? '▲ menos' : '▼ detalhes'}
                        </button>

                        {/* Toggle switch */}
                        <button
                          onClick={() => toggleRule(rule)}
                          disabled={isToggling}
                          className={`relative inline-flex w-11 h-6 rounded-full transition-colors focus:outline-none ${
                            isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          } ${rule.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                          <span
                            className={`inline-block w-4 h-4 mt-1 ml-1 rounded-full bg-white shadow transform transition-transform ${
                              rule.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {isExpanded && (
                      <div className="px-5 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-700/50 pt-3">
                        {rule.actions?.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Sequência de ações</div>
                            <div className="space-y-1">
                              {rule.actions.map((action, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                                  <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-mono shrink-0">
                                    {i + 1}
                                  </span>
                                  <span>{ACTION_LABELS[action.type] || `⚙️ ${action.type}`}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {rule.schedule_type && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Agendamento</div>
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {rule.schedule_type}
                              {rule.schedule_config?.cron && ` — ${rule.schedule_config.cron}`}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-4 text-xs text-gray-400 dark:text-gray-500">
                          <span>Prioridade: {rule.priority}</span>
                          {rule.notify_on_failure && <span>🔔 Notificar em falha</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Nota informativa */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
        <strong>ℹ️ Sobre as automações:</strong> As regras são executadas automaticamente pelo backend do sistema. Ative ou desative conforme necessário. Alterações entram em vigor imediatamente.
      </div>
    </div>
  )
}
