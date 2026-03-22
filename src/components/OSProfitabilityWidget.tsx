import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface OSProfitRow {
  os_id: string
  order_number: string
  os_title: string
  customer_name: string
  faturamento: number
  custo_total: number
  lucro_bruto: number
  margem_percentual: number
  health_status: 'healthy' | 'warning' | 'critical' | 'sem_valor'
  status: string
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

const healthConfig = {
  healthy: {
    label: 'Saudável',
    badge: 'bg-green-100 text-green-700',
    bar: 'bg-green-500',
    icon: <TrendingUp className="w-3.5 h-3.5 text-green-600" />,
  },
  warning: {
    label: 'Atenção',
    badge: 'bg-amber-100 text-amber-700',
    bar: 'bg-amber-500',
    icon: <Minus className="w-3.5 h-3.5 text-amber-600" />,
  },
  critical: {
    label: 'Crítico',
    badge: 'bg-red-100 text-red-700',
    bar: 'bg-red-500',
    icon: <TrendingDown className="w-3.5 h-3.5 text-red-600" />,
  },
  sem_valor: {
    label: 'Sem valor',
    badge: 'bg-gray-100 text-gray-500',
    bar: 'bg-gray-300',
    icon: <Minus className="w-3.5 h-3.5 text-gray-400" />,
  },
}

export default function OSProfitabilityWidget() {
  const [rows, setRows] = useState<OSProfitRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all')
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('v_os_profitability')
        .select('*')
        .not('health_status', 'eq', 'sem_valor')
        .order('margem_percentual', { ascending: true })
        .limit(30)
      setRows((data as OSProfitRow[]) || [])
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all' ? rows : rows.filter(r => r.health_status === filter)

  const summary = {
    critical: rows.filter(r => r.health_status === 'critical').length,
    warning: rows.filter(r => r.health_status === 'warning').length,
    healthy: rows.filter(r => r.health_status === 'healthy').length,
  }

  const avgMargin = rows.length > 0
    ? rows.reduce((acc, r) => acc + (r.margem_percentual || 0), 0) / rows.length
    : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Lucratividade por OS</h3>
            <p className="text-xs text-gray-500">
              Margem média: <span className={`font-bold ${avgMargin < 20 ? 'text-red-600' : avgMargin < 30 ? 'text-amber-600' : 'text-green-600'}`}>{avgMargin.toFixed(1)}%</span>
            </p>
          </div>
        </div>
        <button onClick={load} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2 flex-wrap">
        {([
          { key: 'all', label: `Todas (${rows.length})` },
          { key: 'critical', label: `Crítico (${summary.critical})` },
          { key: 'warning', label: `Atenção (${summary.warning})` },
          { key: 'healthy', label: `Saudável (${summary.healthy})` },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filter === tab.key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto max-h-96">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">Nenhuma OS encontrada para este filtro.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((row, i) => {
              const cfg = healthConfig[row.health_status] || healthConfig.sem_valor
              const barWidth = Math.min(100, Math.max(0, row.margem_percentual || 0))
              return (
                <motion.div
                  key={row.os_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {cfg.icon}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 truncate">{row.order_number || 'OS'}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{row.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${row.margem_percentual < 20 ? 'text-red-600' : row.margem_percentual < 30 ? 'text-amber-600' : 'text-green-600'}`}>
                          {row.margem_percentual?.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-gray-400">{formatBRL(row.lucro_bruto)}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/service-orders/${row.os_id}`)}
                        className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
                        title="Abrir OS"
                      >
                        <ExternalLink className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full ${cfg.bar} transition-all duration-500`}
                      style={{ width: `${Math.max(1, barWidth)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>{formatBRL(row.faturamento)} fat.</span>
                    <span>{formatBRL(row.custo_total)} custo</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
