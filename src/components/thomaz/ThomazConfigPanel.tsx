import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Settings, Brain, Bell, DollarSign, Wrench, Monitor,
  RefreshCw, ChevronDown, ChevronUp,
  Clock, AlertTriangle, Package, Calendar, TrendingUp, Target,
  MessageSquare, CheckSquare, Lightbulb, BarChart3, User, Zap
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================
interface NotificationRule {
  id: string
  name: string
  category: string
  priority: number
  is_active: boolean
  icon: string
  thomaz_enabled: boolean
  show_overlay: boolean
  show_sidebar: boolean
  cooldown_min: number
  threshold_value: number | null
  event_type: string
}

interface ThomazConfig {
  geral: Record<string, any>
  icone: Record<string, any>
  financeiro: Record<string, any>
  operacional: Record<string, any>
  notificacoes: NotificationRule[]
}

// ============================================================
// ICON MAP
// ============================================================
const NOTIF_ICONS: Record<string, React.ElementType> = {
  agenda_vaga:             Calendar,
  backup_falhou:           AlertTriangle,
  budget_approved:         DollarSign,
  churn_risco:             User,
  conta_vencer:            Clock,
  deadline_warning:        AlertTriangle,
  dica_gestao:             Lightbulb,
  estoque_alerta:          Package,
  estoque_zerado:          Package,
  internal_message:        MessageSquare,
  lead_captured:           Target,
  low_stock:               Package,
  margem_critica:          TrendingUp,
  oportunidade:            Target,
  os_atrasada:             Clock,
  payment_received:        DollarSign,
  portal_service_request:  Monitor,
  resumo_semanal:          BarChart3,
  service_order_completed: CheckSquare,
  service_order_created:   Wrench,
  system_error:            AlertTriangle,
  task_atrasada:           CheckSquare,
}

const NOTIF_LABELS: Record<string, string> = {
  agenda_vaga:             'Dias vagos na agenda',
  backup_falhou:           'Backup não realizado',
  budget_approved:         'Orçamento aprovado',
  churn_risco:             'Cliente em risco de churn',
  conta_vencer:            'Conta a vencer',
  deadline_warning:        'Prazo se aproximando',
  dica_gestao:             'Dica de gestão',
  estoque_alerta:          'Estoque em alerta',
  estoque_zerado:          'Item zerado no estoque',
  internal_message:        'Nova mensagem no chat',
  lead_captured:           'Lead capturado',
  low_stock:               'Estoque baixo',
  margem_critica:          'Margem abaixo do mínimo',
  oportunidade:            'Oportunidade detectada',
  os_atrasada:             'OS atrasada',
  payment_received:        'Pagamento recebido',
  portal_service_request:  'Solicitação pelo portal',
  resumo_semanal:          'Resumo semanal',
  service_order_completed: 'OS concluída',
  service_order_created:   'Nova OS criada',
  system_error:            'Erro crítico de sistema',
  task_atrasada:           'Task atrasada',
}

const COOLDOWN_OPTIONS = [
  { value: 30,    label: '30 min' },
  { value: 60,    label: '1 hora' },
  { value: 120,   label: '2 horas' },
  { value: 240,   label: '4 horas' },
  { value: 360,   label: '6 horas' },
  { value: 480,   label: '8 horas' },
  { value: 720,   label: '12 horas' },
  { value: 1440,  label: '1 dia' },
  { value: 10080, label: '1 semana' },
]

// ============================================================
// TOGGLE
// ============================================================
function Toggle({
  value,
  onChange,
  size = 'md',
}: {
  value: boolean
  onChange: (v: boolean) => void
  size?: 'sm' | 'md'
}) {
  const wh = size === 'sm' ? 'w-8 h-[18px]' : 'w-11 h-6'
  const dot = size === 'sm' ? 'w-3 h-3 top-[3px]' : 'w-5 h-5 top-0.5'
  const translateOn = size === 'sm' ? 'translate-x-4' : 'translate-x-5'

  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex ${wh} rounded-full transition-colors duration-200 focus:outline-none ${
        value ? 'bg-blue-600' : 'bg-gray-300'
      }`}
      role="switch"
      aria-checked={value}
    >
      <span
        className={`absolute left-0.5 ${dot} rounded-full bg-white shadow transition-transform duration-200 ${
          value ? translateOn : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function ThomazConfigPanel({ onClose }: { onClose?: () => void }) {
  const [config, setConfig] = useState<ThomazConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'geral' | 'notificacoes' | 'financeiro' | 'operacional' | 'icone'>('geral')
  const [expandedNotif, setExpandedNotif] = useState<string | null>(null)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('thomaz_get_config')
    if (!error && data) setConfig(data as ThomazConfig)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const saveSetting = async (key: string, value: unknown) => {
    setSaving(key)
    const { error } = await supabase.rpc('thomaz_save_setting', {
      p_key: key,
      p_value: value,
    })
    setSaving(null)
    if (!error) {
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    }
  }

  const saveNotifRule = async (id: string, updates: Partial<NotificationRule>) => {
    setSaving(id)
    const { error } = await supabase.rpc('thomaz_save_notification_rule', {
      p_id: id,
      p_updates: updates,
    })
    setSaving(null)
    if (!error) {
      setSaved(id)
      setTimeout(() => setSaved(null), 2000)
      setConfig((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          notificacoes: prev.notificacoes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        }
      })
    }
  }

  const updateNotif = (id: string, field: keyof NotificationRule, value: unknown) => {
    setConfig((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        notificacoes: prev.notificacoes.map((n) =>
          n.id === id ? { ...n, [field]: value } : n
        ),
      }
    })
  }

  const updateSetting = (section: keyof ThomazConfig, key: string, value: unknown) => {
    setConfig((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [section]: { ...(prev[section] as Record<string, unknown>), [key]: value },
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-500">Carregando configurações...</span>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">Não foi possível carregar as configurações.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'geral' as const,        label: 'Geral',        icon: Brain },
    { id: 'notificacoes' as const, label: 'Notificações', icon: Bell },
    { id: 'financeiro' as const,   label: 'Financeiro',   icon: DollarSign },
    { id: 'operacional' as const,  label: 'Operacional',  icon: Wrench },
    { id: 'icone' as const,        label: 'Ícone',        icon: Monitor },
  ]

  return (
    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Configurações do Thomaz AI</h2>
            <p className="text-xs text-gray-500">Personalize o comportamento e as notificações</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadConfig}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'notificacoes' && (
                <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 rounded-full">
                  {config.notificacoes?.length ?? 0}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">

        {/* TAB: GERAL */}
        {activeTab === 'geral' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Comportamento principal</p>

            {(
              [
                { key: 'thomaz_ativo',     label: 'Thomaz ativo',         desc: 'Liga ou desliga o assistente completamente' },
                { key: 'alertas_proativos', label: 'Alertas proativos',   desc: 'Thomaz detecta problemas e alerta sem ser perguntado' },
                { key: 'analise_auto',     label: 'Análise automática',   desc: `Analisa dados do sistema a cada ${config.geral.analise_auto?.intervalo_min ?? 30} min` },
                { key: 'aprendizado_ativo', label: 'Aprendizado ativo',   desc: 'Thomaz aprende com seus feedbacks e respostas' },
                { key: 'memoria_sessao',   label: 'Memória de sessão',    desc: `Lembra o contexto das conversas por ${config.geral.memoria_sessao?.horas ?? 24}h` },
              ] as const
            ).map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  {saving === item.key && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                  {saved === item.key && <span className="text-xs text-green-500">Salvo</span>}
                  <Toggle
                    value={config.geral[item.key]?.enabled ?? true}
                    onChange={async (v) => {
                      const newVal = { ...config.geral[item.key], enabled: v }
                      updateSetting('geral', item.key, newVal)
                      await saveSetting(item.key, newVal)
                    }}
                  />
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide pt-2">Interface do chat</p>

            {(
              [
                { key: 'chat_sidebar',       label: 'Chat na sidebar',      desc: 'Exibe o chat completo do Thomaz na lateral' },
                { key: 'raciocinio_visivel', label: 'Mostrar raciocínio',   desc: 'Exibe os 7 passos do raciocínio ao responder' },
                { key: 'confianca_visivel',  label: 'Mostrar confiança',    desc: 'Exibe o percentual de confiança nas respostas' },
                { key: 'feedback_botoes',    label: 'Botões de feedback',   desc: 'Exibe 👍👎 para o Thomaz aprender' },
              ] as const
            ).map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  {saving === item.key && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                  {saved === item.key && <span className="text-xs text-green-500">Salvo</span>}
                  <Toggle
                    value={config.geral[item.key]?.enabled ?? true}
                    onChange={async (v) => {
                      const newVal = { ...config.geral[item.key], enabled: v }
                      updateSetting('geral', item.key, newVal)
                      await saveSetting(item.key, newVal)
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Modo de operação */}
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-sm font-medium text-gray-900 mb-1">Modo de operação</p>
              <p className="text-xs text-gray-500 mb-3">Como o Thomaz reage e comunica situações</p>
              <div className="flex gap-2">
                {(['conservador', 'equilibrado', 'agressivo'] as const).map((modo) => (
                  <button
                    key={modo}
                    onClick={async () => {
                      const newVal = { tipo: modo }
                      updateSetting('geral', 'modo_operacao', newVal)
                      await saveSetting('modo_operacao', newVal)
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors capitalize ${
                      config.geral.modo_operacao?.tipo === modo
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-600 hover:border-blue-400'
                    }`}
                  >
                    {modo === 'conservador' ? '🧘 Conservador' : modo === 'equilibrado' ? '⚖️ Equilibrado' : '⚡ Agressivo'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {config.geral.modo_operacao?.tipo === 'conservador'
                  ? 'Alerta apenas quando há certeza. Menos interrupções.'
                  : config.geral.modo_operacao?.tipo === 'agressivo'
                  ? 'Alerta constantemente. Máxima vigilância.'
                  : 'Equilíbrio entre silêncio e alerta. Recomendado.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB: NOTIFICAÇÕES */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
              {config.notificacoes?.length ?? 0} tipos de notificação — clique para expandir e configurar
            </p>

            {(config.notificacoes ?? []).map((notif) => {
              const Icon = NOTIF_ICONS[notif.category] ?? Bell
              const isExpanded = expandedNotif === notif.id
              const label = NOTIF_LABELS[notif.category] ?? notif.name

              return (
                <div
                  key={notif.id}
                  className={`rounded-xl border transition-all ${
                    notif.is_active
                      ? 'border-gray-200 bg-white'
                      : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  {/* Row */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => setExpandedNotif(isExpanded ? null : notif.id)}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        notif.is_active ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${notif.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            notif.priority >= 9
                              ? 'bg-red-100 text-red-700'
                              : notif.priority >= 7
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          P{notif.priority}
                        </span>
                        {notif.show_overlay && <span className="text-xs text-gray-400">Ícone</span>}
                        {notif.show_sidebar && <span className="text-xs text-gray-400">Sidebar</span>}
                        {notif.thomaz_enabled && <span className="text-xs text-blue-500">Thomaz</span>}
                        <span className="text-xs text-gray-400">
                          {COOLDOWN_OPTIONS.find((c) => c.value === notif.cooldown_min)?.label ?? `${notif.cooldown_min}min`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {saving === notif.id && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                      {saved === notif.id && <span className="text-xs text-green-500">✓</span>}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Toggle
                          value={notif.is_active}
                          size="sm"
                          onChange={async (v) => {
                            updateNotif(notif.id, 'is_active', v)
                            await saveNotifRule(notif.id, { is_active: v })
                          }}
                        />
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 space-y-4 pt-3">
                      {/* Where it appears */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Onde aparece</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              { field: 'show_overlay' as const, label: 'Ícone flutuante' },
                              { field: 'show_sidebar' as const, label: 'Sidebar chat' },
                              { field: 'thomaz_enabled' as const, label: 'Thomaz analisa' },
                            ]
                          ).map((opt) => (
                            <label key={opt.field} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notif[opt.field] as boolean}
                                onChange={async (e) => {
                                  updateNotif(notif.id, opt.field, e.target.checked)
                                  await saveNotifRule(notif.id, { [opt.field]: e.target.checked })
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-600">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Cooldown */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Frequência mínima</p>
                        <select
                          value={notif.cooldown_min}
                          onChange={async (e) => {
                            const v = Number(e.target.value)
                            updateNotif(notif.id, 'cooldown_min', v)
                            await saveNotifRule(notif.id, { cooldown_min: v })
                          }}
                          className="w-full text-xs rounded-lg border border-gray-200 bg-white text-gray-700 py-2 px-3"
                        >
                          {COOLDOWN_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                          Esta notificação não aparece mais de uma vez por{' '}
                          {COOLDOWN_OPTIONS.find((c) => c.value === notif.cooldown_min)?.label}
                        </p>
                      </div>

                      {/* Priority slider */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Prioridade (1 = baixa, 10 = crítica)
                        </p>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={notif.priority}
                            onChange={(e) => updateNotif(notif.id, 'priority', Number(e.target.value))}
                            onMouseUp={async (e) => {
                              const v = Number((e.target as HTMLInputElement).value)
                              await saveNotifRule(notif.id, { priority: v })
                            }}
                            className="flex-1"
                          />
                          <span
                            className={`text-sm font-bold w-6 text-center ${
                              notif.priority >= 9
                                ? 'text-red-500'
                                : notif.priority >= 7
                                ? 'text-orange-500'
                                : 'text-gray-500'
                            }`}
                          >
                            {notif.priority}
                          </span>
                        </div>
                      </div>

                      {/* Threshold */}
                      {notif.threshold_value !== null && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">
                            {notif.category === 'agenda_vaga'
                              ? 'Alertar quando vago por (dias)'
                              : notif.category === 'churn_risco'
                              ? 'Alertar após (dias sem OS)'
                              : notif.category === 'conta_vencer'
                              ? 'Alertar com (dias de antecedência)'
                              : notif.category === 'margem_critica'
                              ? 'Alertar abaixo de (%)'
                              : 'Limite para disparo'}
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={notif.threshold_value ?? 0}
                              onChange={(e) =>
                                updateNotif(notif.id, 'threshold_value', Number(e.target.value))
                              }
                              onBlur={async (e) => {
                                await saveNotifRule(notif.id, {
                                  threshold_value: Number(e.target.value),
                                })
                              }}
                              className="w-24 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 py-2 px-3"
                            />
                            <span className="text-xs text-gray-400">
                              {notif.category === 'margem_critica' ? '%' : 'dias'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* TAB: FINANCEIRO */}
        {activeTab === 'financeiro' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Metas e alertas financeiros</p>
            <p className="text-xs text-gray-500">
              O Thomaz usa esses valores para avaliar a saúde financeira e disparar alertas.
            </p>

            {(
              [
                { key: 'margem_minima',          label: 'Margem mínima saudável',       desc: 'Abaixo disso o Thomaz alerta em vermelho',         field: 'percentual', suffix: '%' },
                { key: 'margem_alerta',           label: 'Margem de alerta',             desc: 'Abaixo disso o Thomaz alerta em amarelo',          field: 'percentual', suffix: '%' },
                { key: 'caixa_minimo',            label: 'Caixa mínimo',                 desc: 'Abaixo desse saldo o Thomaz alerta',               field: 'valor',      suffix: 'R$', prefix: true },
                { key: 'ticket_medio_meta',       label: 'Ticket médio meta',            desc: 'Meta de ticket médio por OS',                      field: 'valor',      suffix: 'R$', prefix: true },
                { key: 'valor_orcamento_critico', label: 'Valor de orçamento crítico',   desc: 'OS com valor acima desse exigem atenção especial', field: 'valor',      suffix: 'R$', prefix: true },
              ] as const
            ).map((item) => (
              <div key={item.key} className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.prefix && <span className="text-sm text-gray-400">R$</span>}
                    <input
                      type="number"
                      value={(config.financeiro[item.key] as Record<string, number>)?.[item.field] ?? 0}
                      onChange={(e) =>
                        updateSetting('financeiro', item.key, {
                          ...config.financeiro[item.key],
                          [item.field]: Number(e.target.value),
                        })
                      }
                      onBlur={async (e) => {
                        const newVal = {
                          ...config.financeiro[item.key],
                          [item.field]: Number(e.target.value),
                        }
                        await saveSetting(item.key, newVal)
                      }}
                      className="w-28 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-900 py-2 px-3 text-right"
                    />
                    {!item.prefix && <span className="text-sm text-gray-400">{item.suffix}</span>}
                    {saving === item.key && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                    {saved === item.key && <span className="text-xs text-green-500">✓</span>}
                  </div>
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide pt-2">Simulação fiscal</p>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">Simulação IBS/CBS ativa</p>
                <p className="text-xs text-gray-500">Estima impacto da Reforma Tributária nas OS</p>
              </div>
              <Toggle
                value={config.financeiro.simulacao_ativa?.enabled ?? true}
                onChange={async (v) => {
                  const newVal = { ...config.financeiro.simulacao_ativa, enabled: v }
                  updateSetting('financeiro', 'simulacao_ativa', newVal)
                  await saveSetting('simulacao_ativa', newVal)
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { key: 'ibs_aliquota', label: 'Alíquota IBS', field: 'percentual' },
                  { key: 'cbs_aliquota', label: 'Alíquota CBS', field: 'percentual' },
                ] as const
              ).map((item) => (
                <div key={item.key} className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={(config.financeiro[item.key] as Record<string, number>)?.[item.field] ?? 0}
                      onChange={(e) =>
                        updateSetting('financeiro', item.key, {
                          [item.field]: Number(e.target.value),
                        })
                      }
                      onBlur={async (e) => {
                        await saveSetting(item.key, { [item.field]: Number(e.target.value) })
                      }}
                      className="w-20 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 py-2 px-3 text-right"
                    />
                    <span className="text-sm text-gray-400">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: OPERACIONAL */}
        {activeTab === 'operacional' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              Limites operacionais para alertas
            </p>
            <p className="text-xs text-gray-500">
              O Thomaz usa esses valores para identificar gargalos e riscos operacionais.
            </p>

            {(
              [
                { key: 'os_parada_dias',     label: 'OS parada por (dias)',         desc: 'Alertar quando uma OS fica sem movimentação por mais que X dias', field: 'dias',       suffix: 'dias' },
                { key: 'churn_dias',          label: 'Risco de churn após (dias)',   desc: 'Alertar quando um cliente fica sem OS por mais que X dias',       field: 'dias',       suffix: 'dias' },
                { key: 'estoque_critico_pct', label: 'Estoque crítico (%)',          desc: 'Alertar quando o estoque cai abaixo de X% do mínimo',             field: 'percentual', suffix: '%' },
                { key: 'agenda_dias_vagos',   label: 'Agenda vaga por (dias)',       desc: 'Alertar quando há X dias consecutivos sem agenda',                field: 'dias',       suffix: 'dias' },
              ] as const
            ).map((item) => (
              <div key={item.key} className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={(config.operacional[item.key] as Record<string, number>)?.[item.field] ?? 0}
                      onChange={(e) =>
                        updateSetting('operacional', item.key, {
                          ...config.operacional[item.key],
                          [item.field]: Number(e.target.value),
                        })
                      }
                      onBlur={async (e) => {
                        const newVal = {
                          ...config.operacional[item.key],
                          [item.field]: Number(e.target.value),
                        }
                        await saveSetting(item.key, newVal)
                      }}
                      className="w-20 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-900 py-2 px-3 text-right"
                    />
                    <span className="text-sm text-gray-400">{item.suffix}</span>
                    {saving === item.key && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                    {saved === item.key && <span className="text-xs text-green-500">✓</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: ÍCONE */}
        {activeTab === 'icone' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Posição do ícone flutuante</p>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: 'bottom-right', label: 'Inferior direito',    icon: '↘' },
                  { value: 'bottom-left',  label: 'Inferior esquerdo',   icon: '↙' },
                  { value: 'top-right',    label: 'Superior direito',    icon: '↗' },
                  { value: 'top-left',     label: 'Superior esquerdo',   icon: '↖' },
                ] as const
              ).map((pos) => (
                <button
                  key={pos.value}
                  onClick={async () => {
                    const newVal = { ...config.icone.posicao, posicao: pos.value }
                    updateSetting('icone', 'posicao', newVal)
                    await saveSetting('icone_posicao', newVal)
                  }}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    config.icone.posicao?.posicao === pos.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-2xl">{pos.icon}</span>
                  <p className="text-xs mt-1 font-medium text-gray-700">{pos.label}</p>
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide pt-2">Tamanho do ícone</p>

            <div className="flex gap-3">
              {(
                [
                  { value: 'pequeno', label: 'Pequeno', size: 'w-8 h-8',   iconSize: 12 },
                  { value: 'medio',   label: 'Médio',   size: 'w-11 h-11', iconSize: 16 },
                  { value: 'grande',  label: 'Grande',  size: 'w-14 h-14', iconSize: 20 },
                ] as const
              ).map((sz) => (
                <button
                  key={sz.value}
                  onClick={async () => {
                    const newVal = { tamanho: sz.value }
                    updateSetting('icone', 'tamanho', newVal)
                    await saveSetting('icone_tamanho', newVal)
                  }}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    config.icone.tamanho?.tamanho === sz.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div
                    className={`${sz.size} rounded-full bg-blue-600 flex items-center justify-center`}
                  >
                    <Zap className="text-white" style={{ width: sz.iconSize, height: sz.iconSize }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{sz.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {(
                [
                  { key: 'offset_x', label: 'Distância horizontal', desc: 'da borda esquerda/direita' },
                  { key: 'offset_y', label: 'Distância vertical',   desc: 'da borda superior/inferior' },
                ] as const
              ).map((off) => (
                <div key={off.key} className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">{off.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{off.desc}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={config.icone.posicao?.[off.key] ?? 24}
                      onChange={(e) => {
                        const newVal = { ...config.icone.posicao, [off.key]: Number(e.target.value) }
                        updateSetting('icone', 'posicao', newVal)
                      }}
                      onBlur={async (e) => {
                        const newVal = { ...config.icone.posicao, [off.key]: Number(e.target.value) }
                        await saveSetting('icone_posicao', newVal)
                      }}
                      className="w-20 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 py-2 px-3 text-right"
                    />
                    <span className="text-sm text-gray-400">px</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <p className="text-xs text-gray-400 text-center">
          Alterações são salvas automaticamente ao modificar cada campo
        </p>
      </div>
    </div>
  )
}

export default ThomazConfigPanel
