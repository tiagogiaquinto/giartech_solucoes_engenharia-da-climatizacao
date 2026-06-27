# PROMPT — PAINEL DE CONFIGURAÇÃO DO THOMAZ AI
# Cole no Bolt.new e execute sem perguntar

## OBJETIVO
Criar uma tela completa de configuração do Thomaz AI acessível em:
Settings → Thomaz AI (ou via ícone de engrenagem no próprio widget do Thomaz)

O banco já tem tudo pronto:
- `thomaz_settings` — 24 configurações em 4 grupos
- `notification_rules` — 23 regras de notificação configuráveis
- `thomaz_get_config()` — retorna tudo em JSON organizado
- `thomaz_save_setting(key, value)` — salva qualquer config
- `thomaz_save_notification_rule(id, updates)` — salva config de notificação

---

## CRIAR O ARQUIVO: src/components/thomaz/ThomazConfigPanel.tsx

```tsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Settings, Brain, Bell, DollarSign, Wrench, Monitor,
  ToggleLeft, ToggleRight, Save, RefreshCw, ChevronDown, ChevronUp,
  Clock, AlertTriangle, Package, Calendar, TrendingUp, Target,
  MessageSquare, CheckSquare, Lightbulb, BarChart3, User, Zap
} from 'lucide-react'

// ============================================================
// TIPOS
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
// MAPA DE ÍCONES POR CATEGORIA
// ============================================================
const NOTIF_ICONS: Record<string, any> = {
  agenda_vaga:            Calendar,
  backup_falhou:          AlertTriangle,
  budget_approved:        DollarSign,
  churn_risco:            User,
  conta_vencer:           Clock,
  deadline_warning:       AlertTriangle,
  dica_gestao:            Lightbulb,
  estoque_alerta:         Package,
  estoque_zerado:         Package,
  internal_message:       MessageSquare,
  lead_captured:          Target,
  low_stock:              Package,
  margem_critica:         TrendingUp,
  oportunidade:           Target,
  os_atrasada:            Clock,
  payment_received:       DollarSign,
  portal_service_request: Monitor,
  resumo_semanal:         BarChart3,
  service_order_completed:CheckSquare,
  service_order_created:  Wrench,
  system_error:           AlertTriangle,
  task_atrasada:          CheckSquare,
}

// Labels em português
const NOTIF_LABELS: Record<string, string> = {
  agenda_vaga:            'Dias vagos na agenda',
  backup_falhou:          'Backup não realizado',
  budget_approved:        'Orçamento aprovado',
  churn_risco:            'Cliente em risco de churn',
  conta_vencer:           'Conta a vencer',
  deadline_warning:       'Prazo se aproximando',
  dica_gestao:            'Dica de gestão',
  estoque_alerta:         'Estoque em alerta',
  estoque_zerado:         'Item zerado no estoque',
  internal_message:       'Nova mensagem no chat',
  lead_captured:          'Lead capturado',
  low_stock:              'Estoque baixo',
  margem_critica:         'Margem abaixo do mínimo',
  oportunidade:           'Oportunidade detectada',
  os_atrasada:            'OS atrasada',
  payment_received:       'Pagamento recebido',
  portal_service_request: 'Solicitação pelo portal',
  resumo_semanal:         'Resumo semanal',
  service_order_completed:'OS concluída',
  service_order_created:  'Nova OS criada',
  system_error:           'Erro crítico de sistema',
  task_atrasada:          'Task atrasada',
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
// COMPONENTE TOGGLE
// ============================================================
const Toggle = ({
  value, onChange, size = 'md'
}: { value: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'md' }) => {
  const w = size === 'sm' ? 'w-8 h-4' : 'w-11 h-6'
  const t = size === 'sm' ? 'w-3 h-3 top-0.5' : 'w-5 h-5 top-0.5'
  const on = size === 'sm' ? 'translate-x-4' : 'translate-x-5'

  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex ${w} rounded-full transition-colors duration-200 focus:outline-none ${
        value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
      role="switch"
      aria-checked={value}
    >
      <span className={`absolute left-0.5 ${t} rounded-full bg-white shadow transition-transform duration-200 ${
        value ? on : 'translate-x-0'
      }`} />
    </button>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function ThomazConfigPanel({ onClose }: { onClose?: () => void }) {
  const [config, setConfig] = useState<ThomazConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'geral' | 'notificacoes' | 'financeiro' | 'operacional' | 'icone'>('geral')
  const [expandedNotif, setExpandedNotif] = useState<string | null>(null)

  // Carregar config do banco
  const loadConfig = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('thomaz_get_config')
    if (!error && data) setConfig(data as ThomazConfig)
    setLoading(false)
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  // Salvar configuração geral
  const saveSetting = async (key: string, value: any) => {
    setSaving(key)
    const { error } = await supabase.rpc('thomaz_save_setting', {
      p_key: key,
      p_value: value
    })
    setSaving(null)
    if (!error) {
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    }
  }

  // Salvar notificação
  const saveNotifRule = async (id: string, updates: Partial<NotificationRule>) => {
    setSaving(id)
    const { error } = await supabase.rpc('thomaz_save_notification_rule', {
      p_id: id,
      p_updates: updates
    })
    setSaving(null)
    if (!error) {
      setSaved(id)
      setTimeout(() => setSaved(null), 2000)
      // Atualizar estado local
      setConfig(prev => {
        if (!prev) return prev
        return {
          ...prev,
          notificacoes: prev.notificacoes.map(n =>
            n.id === id ? { ...n, ...updates } : n
          )
        }
      })
    }
  }

  // Update local de notificação
  const updateNotif = (id: string, field: keyof NotificationRule, value: any) => {
    setConfig(prev => {
      if (!prev) return prev
      return {
        ...prev,
        notificacoes: prev.notificacoes.map(n =>
          n.id === id ? { ...n, [field]: value } : n
        )
      }
    })
  }

  // Update local de setting
  const updateSetting = (section: keyof ThomazConfig, key: string, value: any) => {
    setConfig(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [section]: { ...(prev[section] as any), [key]: value }
      }
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      <span className="ml-3 text-gray-500">Carregando configurações...</span>
    </div>
  )

  if (!config) return null

  const tabs = [
    { id: 'geral',         label: 'Geral',          icon: Brain },
    { id: 'notificacoes',  label: 'Notificações',   icon: Bell },
    { id: 'financeiro',    label: 'Financeiro',     icon: DollarSign },
    { id: 'operacional',   label: 'Operacional',    icon: Wrench },
    { id: 'icone',         label: 'Ícone',          icon: Monitor },
  ] as const

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Configurações do Thomaz AI</h2>
            <p className="text-xs text-gray-500">Personalize o comportamento e as notificações</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadConfig}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'notificacoes' && (
                <span className="ml-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 rounded-full">
                  {config.notificacoes?.length || 0}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Conteúdo */}
      <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">

        {/* ABA GERAL */}
        {activeTab === 'geral' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Comportamento principal</p>

            {[
              { key: 'thomaz_ativo', label: 'Thomaz ativo', desc: 'Liga ou desliga o assistente completamente', field: 'enabled', section: 'geral' },
              { key: 'alertas_proativos', label: 'Alertas proativos', desc: 'Thomaz detecta problemas e alerta sem ser perguntado', field: 'enabled', section: 'geral' },
              { key: 'analise_auto', label: 'Análise automática', desc: `Analisa dados do sistema a cada ${config.geral.analise_auto?.intervalo_min || 30} min`, field: 'enabled', section: 'geral' },
              { key: 'aprendizado_ativo', label: 'Aprendizado ativo', desc: 'Thomaz aprende com seus feedbacks e respostas', field: 'enabled', section: 'geral' },
              { key: 'memoria_sessao', label: 'Memória de sessão', desc: `Lembra o contexto das conversas por ${config.geral.memoria_sessao?.horas || 24}h`, field: 'enabled', section: 'geral' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  {saving === item.key && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                  {saved === item.key && <span className="text-xs text-green-500">Salvo</span>}
                  <Toggle
                    value={config.geral[item.key]?.[item.field] ?? true}
                    onChange={async (v) => {
                      const newVal = { ...config.geral[item.key], [item.field]: v }
                      updateSetting('geral', item.key, newVal)
                      await saveSetting(item.key, newVal)
                    }}
                  />
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide pt-2">Interface do chat</p>

            {[
              { key: 'chat_sidebar', label: 'Chat na sidebar', desc: 'Exibe o chat completo do Thomaz na lateral', field: 'enabled' },
              { key: 'raciocinio_visivel', label: 'Mostrar raciocínio', desc: 'Exibe os 7 passos do raciocínio ao responder', field: 'enabled' },
              { key: 'confianca_visivel', label: 'Mostrar confiança', desc: 'Exibe o percentual de confiança nas respostas', field: 'enabled' },
              { key: 'feedback_botoes', label: 'Botões de feedback', desc: 'Exibe 👍👎 para o Thomaz aprender', field: 'enabled' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
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
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Modo de operação</p>
              <p className="text-xs text-gray-500 mb-3">Como o Thomaz reage e comunica situações</p>
              <div className="flex gap-2">
                {['conservador', 'equilibrado', 'agressivo'].map(modo => (
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
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400'
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

        {/* ABA NOTIFICAÇÕES */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
              {config.notificacoes?.length} tipos de notificação — clique para expandir e configurar
            </p>

            {(config.notificacoes || []).map(notif => {
              const Icon = NOTIF_ICONS[notif.category] || Bell
              const isExpanded = expandedNotif === notif.id
              const label = NOTIF_LABELS[notif.category] || notif.name

              return (
                <div
                  key={notif.id}
                  className={`rounded-xl border transition-all ${
                    notif.is_active
                      ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60'
                  }`}
                >
                  {/* Linha principal */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => setExpandedNotif(isExpanded ? null : notif.id)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      notif.is_active ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Icon className={`w-4 h-4 ${notif.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          notif.priority >= 9 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                          notif.priority >= 7 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          P{notif.priority}
                        </span>
                        {notif.show_overlay && <span className="text-xs text-gray-400">Ícone</span>}
                        {notif.show_sidebar && <span className="text-xs text-gray-400">Sidebar</span>}
                        {notif.thomaz_enabled && <span className="text-xs text-blue-500">Thomaz</span>}
                        <span className="text-xs text-gray-400">
                          cooldown: {COOLDOWN_OPTIONS.find(c => c.value === notif.cooldown_min)?.label || notif.cooldown_min + 'min'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {saving === notif.id && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                      {saved === notif.id && <span className="text-xs text-green-500">✓</span>}
                      <Toggle
                        value={notif.is_active}
                        size="sm"
                        onChange={async (v) => {
                          updateNotif(notif.id, 'is_active', v)
                          await saveNotifRule(notif.id, { is_active: v })
                        }}
                      />
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expansão */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700 space-y-3 mt-2">

                      {/* Onde aparece */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Onde aparece</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'show_overlay', label: 'Ícone flutuante' },
                            { key: 'show_sidebar', label: 'Sidebar chat' },
                            { key: 'thomaz_enabled', label: 'Thomaz analisa' },
                          ].map(opt => (
                            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notif[opt.key as keyof NotificationRule] as boolean}
                                onChange={async (e) => {
                                  const updates = { [opt.key]: e.target.checked }
                                  updateNotif(notif.id, opt.key as any, e.target.checked)
                                  await saveNotifRule(notif.id, updates as any)
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-600 dark:text-gray-400">{opt.label}</span>
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
                          className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 py-2 px-3"
                        >
                          {COOLDOWN_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                          Esta notificação não aparece mais de uma vez por {COOLDOWN_OPTIONS.find(c => c.value === notif.cooldown_min)?.label}
                        </p>
                      </div>

                      {/* Prioridade */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Prioridade (1 = baixa, 10 = crítica)</p>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={1} max={10}
                            value={notif.priority}
                            onChange={(e) => updateNotif(notif.id, 'priority', Number(e.target.value))}
                            onMouseUp={async (e) => {
                              const v = Number((e.target as HTMLInputElement).value)
                              await saveNotifRule(notif.id, { priority: v })
                            }}
                            className="flex-1"
                          />
                          <span className={`text-sm font-bold w-6 text-center ${
                            notif.priority >= 9 ? 'text-red-500' :
                            notif.priority >= 7 ? 'text-orange-500' : 'text-gray-500'
                          }`}>{notif.priority}</span>
                        </div>
                      </div>

                      {/* Threshold (se aplicável) */}
                      {notif.threshold_value !== null && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">
                            {notif.category === 'agenda_vaga' ? 'Alertar quando vago por (dias)' :
                             notif.category === 'churn_risco' ? 'Alertar após (dias sem OS)' :
                             notif.category === 'conta_vencer' ? 'Alertar com (dias de antecedência)' :
                             notif.category === 'margem_critica' ? 'Alertar abaixo de (%)' :
                             'Limite para disparo'}
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={notif.threshold_value || 0}
                              onChange={(e) => updateNotif(notif.id, 'threshold_value', Number(e.target.value))}
                              onBlur={async (e) => {
                                await saveNotifRule(notif.id, { threshold_value: Number(e.target.value) })
                              }}
                              className="w-24 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 py-2 px-3"
                            />
                            <span className="text-xs text-gray-400">
                              {notif.category === 'margem_critica' ? '%' :
                               notif.category.includes('dias') ? 'dias' : ''}
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

        {/* ABA FINANCEIRO */}
        {activeTab === 'financeiro' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Metas e alertas financeiros</p>
            <p className="text-xs text-gray-500">O Thomaz usa esses valores para avaliar a saúde financeira e disparar alertas.</p>

            {[
              { key: 'margem_minima', label: 'Margem mínima saudável', desc: 'Abaixo disso o Thomaz alerta em vermelho', field: 'percentual', suffix: '%', type: 'number', section: 'financeiro' },
              { key: 'margem_alerta', label: 'Margem de alerta', desc: 'Abaixo disso o Thomaz alerta em amarelo', field: 'percentual', suffix: '%', type: 'number', section: 'financeiro' },
              { key: 'caixa_minimo', label: 'Caixa mínimo', desc: 'Abaixo desse saldo o Thomaz alerta', field: 'valor', suffix: 'R$', prefix: true, type: 'number', section: 'financeiro' },
              { key: 'ticket_medio_meta', label: 'Ticket médio meta', desc: 'Meta de ticket médio por OS', field: 'valor', suffix: 'R$', prefix: true, type: 'number', section: 'financeiro' },
              { key: 'valor_orcamento_critico', label: 'Valor de orçamento crítico', desc: 'OS com valor acima desse exigem atenção especial', field: 'valor', suffix: 'R$', prefix: true, type: 'number', section: 'financeiro' },
            ].map(item => (
              <div key={item.key} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.prefix && <span className="text-sm text-gray-400">R$</span>}
                    <input
                      type="number"
                      value={config.financeiro[item.key]?.[item.field] ?? 0}
                      onChange={(e) => updateSetting('financeiro', item.key, { ...config.financeiro[item.key], [item.field]: Number(e.target.value) })}
                      onBlur={async (e) => {
                        const newVal = { ...config.financeiro[item.key], [item.field]: Number(e.target.value) }
                        await saveSetting(item.key, newVal)
                      }}
                      className="w-28 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-2 px-3 text-right"
                    />
                    {!item.prefix && <span className="text-sm text-gray-400">{item.suffix}</span>}
                    {saving === item.key && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                    {saved === item.key && <span className="text-xs text-green-500">✓</span>}
                  </div>
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide pt-2">Simulação fiscal</p>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Simulação IBS/CBS ativa</p>
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
              {[
                { key: 'ibs_aliquota', label: 'Alíquota IBS', field: 'percentual' },
                { key: 'cbs_aliquota', label: 'Alíquota CBS', field: 'percentual' },
              ].map(item => (
                <div key={item.key} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={config.financeiro[item.key]?.[item.field] ?? 0}
                      onChange={(e) => updateSetting('financeiro', item.key, { [item.field]: Number(e.target.value) })}
                      onBlur={async (e) => {
                        await saveSetting(item.key, { [item.field]: Number(e.target.value) })
                      }}
                      className="w-20 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-2 px-3 text-right"
                    />
                    <span className="text-sm text-gray-400">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA OPERACIONAL */}
        {activeTab === 'operacional' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Limites operacionais para alertas</p>
            <p className="text-xs text-gray-500">O Thomaz usa esses valores para identificar gargalos e riscos operacionais.</p>

            {[
              { key: 'os_parada_dias',    label: 'OS parada por (dias)', desc: 'Alertar quando uma OS fica sem movimentação por mais que X dias', field: 'dias', suffix: 'dias' },
              { key: 'churn_dias',         label: 'Risco de churn após (dias)', desc: 'Alertar quando um cliente fica sem OS por mais que X dias', field: 'dias', suffix: 'dias' },
              { key: 'estoque_critico_pct',label: 'Estoque crítico (%)', desc: 'Alertar quando o estoque cai abaixo de X% do mínimo', field: 'percentual', suffix: '%' },
              { key: 'agenda_dias_vagos',  label: 'Agenda vaga por (dias)', desc: 'Alertar quando há X dias consecutivos sem agenda', field: 'dias', suffix: 'dias' },
            ].map(item => (
              <div key={item.key} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={config.operacional[item.key]?.[item.field] ?? 0}
                      onChange={(e) => updateSetting('operacional', item.key, { ...config.operacional[item.key], [item.field]: Number(e.target.value) })}
                      onBlur={async (e) => {
                        const newVal = { ...config.operacional[item.key], [item.field]: Number(e.target.value) }
                        await saveSetting(item.key, newVal)
                      }}
                      className="w-20 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-2 px-3 text-right"
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

        {/* ABA ÍCONE */}
        {activeTab === 'icone' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Posição do ícone flutuante</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'bottom-right', label: 'Inferior direito', icon: '↘' },
                { value: 'bottom-left',  label: 'Inferior esquerdo', icon: '↙' },
                { value: 'top-right',    label: 'Superior direito', icon: '↗' },
                { value: 'top-left',     label: 'Superior esquerdo', icon: '↖' },
              ].map(pos => (
                <button
                  key={pos.value}
                  onClick={async () => {
                    const newVal = { ...config.icone.posicao, posicao: pos.value }
                    updateSetting('icone', 'posicao', newVal)
                    await saveSetting('icone_posicao', newVal)
                  }}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    config.icone.posicao?.posicao === pos.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <span className="text-2xl">{pos.icon}</span>
                  <p className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">{pos.label}</p>
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide pt-2">Tamanho do ícone</p>

            <div className="flex gap-3">
              {[
                { value: 'pequeno', label: 'Pequeno', size: 'w-8 h-8' },
                { value: 'medio',   label: 'Médio',   size: 'w-11 h-11' },
                { value: 'grande',  label: 'Grande',  size: 'w-14 h-14' },
              ].map(sz => (
                <button
                  key={sz.value}
                  onClick={async () => {
                    const newVal = { tamanho: sz.value }
                    updateSetting('icone', 'tamanho', newVal)
                    await saveSetting('icone_tamanho', newVal)
                  }}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    config.icone.tamanho?.tamanho === sz.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className={`${sz.size} rounded-full bg-blue-600 flex items-center justify-center`}>
                    <Zap className="text-white" style={{ width: sz.value === 'pequeno' ? 12 : sz.value === 'medio' ? 16 : 20, height: sz.value === 'pequeno' ? 12 : sz.value === 'medio' ? 16 : 20 }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{sz.label}</span>
                </button>
              ))}
            </div>

            {/* Offset */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { key: 'offset_x', label: 'Distância horizontal', desc: 'da borda esquerda/direita' },
                { key: 'offset_y', label: 'Distância vertical', desc: 'da borda superior/inferior' },
              ].map(off => (
                <div key={off.key} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{off.label}</p>
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
                      className="w-20 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-2 px-3 text-right"
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
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
        <p className="text-xs text-gray-400 text-center">
          Alterações são salvas automaticamente ao modificar cada campo
        </p>
      </div>
    </div>
  )
}

export default ThomazConfigPanel
```

---

## INTEGRAR O PAINEL NAS ROTAS

Adicionar em `src/App.tsx` ou onde estão as rotas principais:

```tsx
import ThomazConfigPanel from '@/components/thomaz/ThomazConfigPanel'

// Na lista de rotas:
{ path: '/thomaz/config', element: <ThomazConfigPanel /> }
// ou como modal em Settings
```

## ADICIONAR LINK NAS CONFIGURAÇÕES DO SISTEMA

No menu de Settings ou na tela de configurações, adicionar:

```tsx
<Link to="/thomaz/config" className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
    <Brain className="w-5 h-5 text-blue-600" />
  </div>
  <div>
    <p className="text-sm font-medium text-gray-900 dark:text-white">Thomaz AI</p>
    <p className="text-xs text-gray-500">Comportamento, notificações e posição do ícone</p>
  </div>
  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
</Link>
```

## ADICIONAR BOTÃO DE CONFIGURAÇÃO NO WIDGET DO THOMAZ

No componente `GiartechNotificationHub.tsx` ou equivalente, adicionar no header do popup:

```tsx
import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'

// No header do popup do Thomaz:
<Link
  to="/thomaz/config"
  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
  title="Configurar Thomaz"
  onClick={() => setIsOpen(false)}
>
  <Settings className="w-4 h-4 text-gray-500" />
</Link>
```

---

## BANCO — JÁ ESTÁ PRONTO (não precisa criar nada)

As seguintes funções já existem e funcionam:
- `thomaz_get_config()` — retorna toda a config organizada por seção
- `thomaz_save_setting(key, value)` — salva qualquer configuração
- `thomaz_save_notification_rule(id, updates)` — salva configuração de notificação

As seguintes tabelas já têm todos os dados:
- `thomaz_settings` — 24 configurações
- `notification_rules` — 23 regras com todos os campos (is_active, thomaz_enabled, show_overlay, show_sidebar, cooldown_min, threshold_value, priority)
