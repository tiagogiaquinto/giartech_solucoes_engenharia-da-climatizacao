import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, TrendingDown, CheckCircle2, RefreshCw, X,
  ExternalLink, Brain, ChevronDown, ChevronUp, DollarSign,
  Wrench, Package, ArrowRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface MarginAlert {
  id: string
  alert_type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  current_value: number
  threshold_value: number
  created_at: string
  is_active: boolean
  os_id: string | null
}

interface PrejuizoAnalysis {
  os_id: string
  os_numero: string
  os_titulo: string
  cliente: string
  faturamento: number
  custo_mao_obra: number
  custo_materiais: number
  custo_total: number
  lucro_bruto: number
  margem_pct: number
  preco_ideal_30pct: number
  health_status: string
  sugestoes: Array<{
    tipo: string
    titulo: string
    descricao: string
    acao: string
  }>
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PrejuizoDrawer({ osId, onClose }: { osId: string; onClose: () => void }) {
  const [analysis, setAnalysis] = useState<PrejuizoAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.rpc('analisar_prejuizo_os', { p_os_id: osId })
      .then(({ data }) => {
        setAnalysis(data as PrejuizoAnalysis)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [osId])

  const sugestaoIcon: Record<string, React.ReactNode> = {
    mao_obra: <Wrench className="w-4 h-4" />,
    materiais: <Package className="w-4 h-4" />,
    prejuizo_direto: <TrendingDown className="w-4 h-4" />,
    preco_baixo: <DollarSign className="w-4 h-4" />,
    sem_custo: <AlertTriangle className="w-4 h-4" />,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="mt-3 rounded-xl border border-blue-200 bg-blue-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-blue-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-blue-800">Análise Thomaz AI</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-blue-100 transition-colors">
          <X className="w-3.5 h-3.5 text-blue-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blue-600">Analisando...</span>
        </div>
      ) : !analysis || (analysis as any).error ? (
        <div className="px-4 py-6 text-center text-sm text-gray-500">Não foi possível carregar a análise.</div>
      ) : (
        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Faturamento', value: formatBRL(analysis.faturamento), color: 'text-green-700' },
              { label: 'Custo Total', value: formatBRL(analysis.custo_total), color: 'text-red-700' },
              { label: 'Lucro Bruto', value: formatBRL(analysis.lucro_bruto), color: analysis.lucro_bruto >= 0 ? 'text-emerald-700' : 'text-red-700' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-lg border border-blue-100 px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{item.label}</p>
                <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {analysis.preco_ideal_30pct > 0 && analysis.margem_pct < 30 && (
            <div className="bg-white rounded-lg border border-amber-200 px-3 py-2.5 flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                Preço mínimo para 30% de margem:{' '}
                <span className="font-bold text-amber-700">{formatBRL(analysis.preco_ideal_30pct)}</span>
              </div>
            </div>
          )}

          {analysis.sugestoes?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Sugestões</p>
              {analysis.sugestoes.map((s, i) => (
                <div key={i} className="bg-white rounded-lg border border-blue-100 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-blue-500">{sugestaoIcon[s.tipo] || <AlertTriangle className="w-4 h-4" />}</span>
                    <p className="text-xs font-bold text-gray-800">{s.titulo}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{s.descricao}</p>
                  <div className="flex items-start gap-1.5">
                    <ArrowRight className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 font-medium">{s.acao}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function MarginAlertPanel() {
  const [alerts, setAlerts] = useState<MarginAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissing, setDismissing] = useState<string | null>(null)
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('financial_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)
      setAlerts(data || [])
    } finally {
      setLoading(false)
    }
  }

  const dismiss = async (id: string) => {
    setDismissing(id)
    const { error } = await supabase
      .from('financial_alerts')
      .update({ is_active: false, resolved_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== id))
      if (expandedAnalysis === id) setExpandedAnalysis(null)
    }
    setDismissing(null)
  }

  const toggleAnalysis = (id: string) => {
    setExpandedAnalysis(prev => prev === id ? null : id)
  }

  const severityConfig = {
    critical: {
      bg: 'bg-red-50 border-red-200',
      borderL: 'border-l-red-400',
      icon: 'text-red-500',
      badge: 'bg-red-100 text-red-700',
      bar: 'bg-red-500',
      label: 'Crítico',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      borderL: 'border-l-amber-400',
      icon: 'text-amber-500',
      badge: 'bg-amber-100 text-amber-700',
      bar: 'bg-amber-500',
      label: 'Atenção',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      borderL: 'border-l-blue-400',
      icon: 'text-blue-500',
      badge: 'bg-blue-100 text-blue-700',
      bar: 'bg-blue-500',
      label: 'Info',
    },
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const warningCount = alerts.filter(a => a.severity === 'warning').length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            criticalCount > 0 ? 'bg-red-100' : warningCount > 0 ? 'bg-amber-100' : 'bg-green-100'
          }`}>
            {criticalCount > 0 || warningCount > 0 ? (
              <TrendingDown className={`w-5 h-5 ${criticalCount > 0 ? 'text-red-600' : 'text-amber-600'}`} />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Sentinela do Lucro</h3>
            <p className="text-xs text-gray-500">Alertas automáticos de margem por OS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
              {warningCount} atenção
            </span>
          )}
          <button onClick={load} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-10">
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-green-700">Todas as margens estão saudáveis</p>
          <p className="text-xs text-gray-400 mt-1">Alertas aparecem aqui quando a margem de uma OS cair abaixo de 30%</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="divide-y divide-gray-50">
            {alerts.map((alert, i) => {
              const cfg = severityConfig[alert.severity] || severityConfig.warning
              const marginPct = Math.min(100, Math.max(0, alert.current_value))
              const isExpanded = expandedAnalysis === alert.id
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className={`px-5 py-4 border-l-4 ${cfg.bg} ${cfg.borderL}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.icon}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm truncate">{alert.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{alert.description}</p>

                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">Margem atual</span>
                            <span className={`font-bold ${alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                              {alert.current_value.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${cfg.bar} transition-all duration-500`}
                              style={{ width: `${Math.max(2, marginPct)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                            <span>0%</span>
                            <span className="text-gray-500">Mín: {alert.threshold_value}%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {alert.os_id && (
                          <button
                            onClick={() => toggleAnalysis(alert.id)}
                            className={`mt-3 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                              isExpanded
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <Brain className="w-3.5 h-3.5" />
                            Analisar Prejuízo
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                            )}
                          </button>
                        )}

                        <AnimatePresence>
                          {isExpanded && alert.os_id && (
                            <PrejuizoDrawer
                              osId={alert.os_id}
                              onClose={() => setExpandedAnalysis(null)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {alert.os_id && (
                        <button
                          onClick={() => navigate(`/service-orders/${alert.os_id}`)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          title="Abrir OS"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      )}
                      <button
                        onClick={() => dismiss(alert.id)}
                        disabled={dismissing === alert.id}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        title="Dispensar alerta"
                      >
                        {dismissing === alert.id ? (
                          <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
