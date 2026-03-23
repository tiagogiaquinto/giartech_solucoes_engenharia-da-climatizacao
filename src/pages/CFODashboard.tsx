import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target, Award,
  Activity, BarChart3, PieChart as PieChartIcon, RefreshCw, Download,
  Bell, CheckCircle, XCircle, Clock, Calendar, ArrowUpRight, ArrowDownRight,
  Users, Package, FileText, Briefcase, Shield, Zap
} from 'lucide-react'
import MarginAlertPanel from '../components/MarginAlertPanel'
import OSProfitabilityWidget from '../components/OSProfitabilityWidget'
import PMOCSchedulePanel from '../components/PMOCSchedulePanel'
import { supabase } from '../lib/supabase'
import { InteractiveKPICard } from '../components/InteractiveKPICard'
import { useNavigate } from 'react-router-dom'
import { formatDateSafe } from '../utils/format'
import { Bar, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

type PeriodFilter = 'day' | 'week' | 'month' | 'quarter'

interface CFOKPIs {
  total_revenue: number
  total_expenses: number
  net_profit: number
  profit_margin: number
  ebitda: number
  ebitda_margin: number
  gross_margin: number
  operating_margin: number
  accounts_receivable: number
  accounts_payable: number
  net_working_capital: number
  total_customers: number
  total_customers_pj: number
  total_customers_pf: number
  active_customers: number
  customer_retention_rate: number
  avg_customer_ltv: number
  total_completed_orders: number
  orders_in_progress: number
  avg_order_value: number
  total_revenue_from_orders: number
  avg_profit_per_order: number
  total_inventory_cost: number
  total_inventory_value: number
  potential_profit: number
  inventory_turnover: number
  roi_percentage: number
  payback_period_days: number
  break_even_point: number
  operational_efficiency: number
}

interface FinancialAlert {
  id: string
  alert_type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  current_value: number
  threshold_value: number
  created_at: string
  is_active: boolean
}

interface CustomerIntelligence {
  customer_id: string
  customer_name: string
  customer_type: string
  credit_score: number
  risk_score: number
  abc_classification: string
  total_revenue: number
  total_orders: number
  avg_order_value: number
  last_purchase_date: string
  churn_probability: number
}

interface PeriodKPIs {
  periodo_inicio: string
  periodo_fim: string
  faturamento_bruto: number
  total_impostos: number
  aliquota_impostos: number
  custo_materiais: number
  custo_mao_obra: number
  custo_extras: number
  custo_total_pessoal: number
  total_despesas_fixas: number
  lucro_liquido: number
  ebitda: number
  ebitda_margem: number
  margem_liquida_pct: number
  qtd_os_fechadas: number
  qtd_clientes_atendidos: number
  ticket_medio: number
}

interface CashFlowEntry {
  id: string
  description: string
  amount: number
  type: 'entrada' | 'saida'
  category: string
  reference_date: string
  dia: string
  semana: string
  mes: string
  trimestre: string
}

interface FinancialIntelligenceSummary {
  revenue: number
  expenses: number
  ebitda: number
  ebitdaMargin: number
  chartLabels: string[]
  chartEntradas: number[]
  chartSaidas: number[]
}

const PERIOD_COLUMN: Record<PeriodFilter, string> = {
  day: 'dia',
  week: 'semana',
  month: 'mes',
  quarter: 'trimestre',
}

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  day: 'Hoje',
  week: 'Esta Semana',
  month: 'Este Mês',
  quarter: 'Este Trimestre',
}

const getPeriodStartISO = (filter: PeriodFilter): string => {
  const now = new Date()
  if (filter === 'day') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  }
  if (filter === 'week') {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(now.getFullYear(), now.getMonth(), diff).toISOString()
  }
  if (filter === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  }
  const q = Math.floor(now.getMonth() / 3)
  return new Date(now.getFullYear(), q * 3, 1).toISOString()
}

const getDateRange = (period: 'month' | 'quarter' | 'year' | 'custom', customStart?: string, customEnd?: string) => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

  if (period === 'custom' && customStart && customEnd) return { start: customStart, end: customEnd }
  if (period === 'month') {
    return { start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), end: fmt(now) }
  }
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3)
    return { start: fmt(new Date(now.getFullYear(), q * 3, 1)), end: fmt(now) }
  }
  return { start: fmt(new Date(now.getFullYear(), 0, 1)), end: fmt(now) }
}

const formatChartLabel = (iso: string, filter: PeriodFilter): string => {
  const d = new Date(iso)
  if (filter === 'day') return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (filter === 'week') return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
  if (filter === 'month') return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `T${Math.floor(d.getMonth() / 3) + 1}/${d.getFullYear()}`
}

const CFODashboard = () => {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState<CFOKPIs | null>(null)
  const [periodKpis, setPeriodKpis] = useState<PeriodKPIs | null>(null)
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [marginAlerts, setMarginAlerts] = useState<any[]>([])
  const [topCustomers, setTopCustomers] = useState<CustomerIntelligence[]>([])
  const [loading, setLoading] = useState(true)
  const [intelligenceLoading, setIntelligenceLoading] = useState(false)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month')
  const [intelligence, setIntelligence] = useState<FinancialIntelligenceSummary | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    loadCFOData()
    const interval = setInterval(loadCFOData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedPeriod, customStart, customEnd])

  useEffect(() => {
    loadFinancialIntelligence()
  }, [periodFilter])

  const loadFinancialIntelligence = useCallback(async () => {
    setIntelligenceLoading(true)
    try {
      const col = PERIOD_COLUMN[periodFilter]
      const periodStart = getPeriodStartISO(periodFilter)

      const { data, error } = await supabase
        .from('v_financial_intelligence')
        .select('*')
        .gte(col, periodStart)
        .order('reference_date', { ascending: true })

      if (error) throw error

      const entries: CashFlowEntry[] = data || []

      const revenue = entries.filter(e => e.type === 'entrada').reduce((s, e) => s + Number(e.amount), 0)
      const expenses = entries.filter(e => e.type === 'saida').reduce((s, e) => s + Number(e.amount), 0)
      const opEx = expenses
      const ebitda = revenue - opEx
      const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0

      const grouped: Record<string, { entrada: number; saida: number }> = {}
      entries.forEach(e => {
        const key = e[col as keyof CashFlowEntry] as string
        if (!grouped[key]) grouped[key] = { entrada: 0, saida: 0 }
        if (e.type === 'entrada') grouped[key].entrada += Number(e.amount)
        else grouped[key].saida += Number(e.amount)
      })

      const sortedKeys = Object.keys(grouped).sort()
      const chartLabels = sortedKeys.map(k => formatChartLabel(k, periodFilter))
      const chartEntradas = sortedKeys.map(k => grouped[k].entrada)
      const chartSaidas = sortedKeys.map(k => grouped[k].saida)

      setIntelligence({ revenue, expenses, ebitda, ebitdaMargin, chartLabels, chartEntradas, chartSaidas })
    } catch (err) {
      console.error('Erro ao carregar inteligência financeira:', err)
    } finally {
      setIntelligenceLoading(false)
    }
  }, [periodFilter])

  const loadCFOData = async () => {
    try {
      setLoading(true)
      const { start, end } = getDateRange(
        selectedPeriod === 'custom' ? 'custom' : selectedPeriod,
        customStart || undefined,
        customEnd || undefined
      )

      const [periodRes, alertsRes, customersRes, kpisRes, marginAlertsRes] = await Promise.all([
        supabase.rpc('get_cfo_kpis_period', { p_start_date: start, p_end_date: end }),
        supabase.from('financial_alerts').select('*').eq('is_active', true)
          .order('severity', { ascending: true }).order('created_at', { ascending: false }).limit(10),
        supabase.from('v_customer_intelligence').select('*').order('total_revenue', { ascending: false }).limit(10),
        supabase.from('v_cfo_kpis').select('*').maybeSingle(),
        supabase.from('margin_alerts').select('*').eq('is_dismissed', false)
          .order('created_at', { ascending: false }).limit(20)
      ])

      if (periodRes.data) setPeriodKpis(periodRes.data as PeriodKPIs)
      setAlerts(alertsRes.data || [])
      setTopCustomers(customersRes.data || [])
      if (kpisRes.data) setKpis(kpisRes.data)
      setMarginAlerts(marginAlertsRes.data || [])
      setLastUpdated(new Date())
    } catch (error: any) {
      console.error('Erro ao carregar dados CFO:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default: return <Bell className="h-5 w-5 text-blue-600" />
    }
  }

  const getABCColor = (classification: string) => {
    switch (classification) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300'
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'C': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: 'Alto Risco', color: 'text-red-600' }
    if (score >= 40) return { label: 'Risco Médio', color: 'text-yellow-600' }
    return { label: 'Baixo Risco', color: 'text-green-600' }
  }

  const financialHealthMetrics = [
    { label: 'Margem Bruta', value: kpis?.gross_margin || 0, target: 60, color: 'rgb(34, 197, 94)' },
    { label: 'Margem Operacional', value: kpis?.operating_margin || 0, target: 40, color: 'rgb(59, 130, 246)' },
    { label: 'Margem Líquida', value: kpis?.profit_margin || 0, target: 30, color: 'rgb(249, 115, 22)' },
    { label: 'Margem EBITDA', value: kpis?.ebitda_margin || 0, target: 35, color: 'rgb(20, 184, 166)' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-[1800px] mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">Dashboard CFO</h1>
            <p className="text-gray-500 text-sm">Inteligência Financeira Executiva</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              {(['month', 'quarter', 'year', 'custom'] as const).map(p => (
                <button key={p} onClick={() => setSelectedPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedPeriod === p ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  {p === 'month' ? 'Mês' : p === 'quarter' ? 'Trimestre' : p === 'year' ? 'Ano' : 'Período'}
                </button>
              ))}
            </div>
            {selectedPeriod === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                <span className="text-gray-500 text-sm">até</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
              </div>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Atualizado {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button onClick={loadCFOData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Executive KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <InteractiveKPICard
            title="Receita Total"
            value={formatCurrency(kpis?.total_revenue || 0)}
            subtitle={`Lucro: ${formatCurrency(kpis?.net_profit || 0)}`}
            icon={DollarSign}
            color="from-green-500 to-emerald-600"
            trend={{ value: kpis?.profit_margin || 0, label: 'Margem de lucro' }}
            onClick={() => navigate('/financeiro')}
            details={[
              { label: 'Despesas', value: formatCurrency(kpis?.total_expenses || 0) },
              { label: 'Lucro Líquido', value: formatCurrency(kpis?.net_profit || 0) },
              { label: 'Margem', value: formatPercent(kpis?.profit_margin || 0) }
            ]}
          />
          <InteractiveKPICard
            title="EBITDA"
            value={formatCurrency(kpis?.ebitda || 0)}
            subtitle={`Margem: ${formatPercent(kpis?.ebitda_margin || 0)}`}
            icon={TrendingUp}
            color="from-blue-500 to-cyan-600"
            trend={{ value: kpis?.ebitda_margin || 0, label: 'Margem EBITDA' }}
            onClick={() => navigate('/financeiro')}
            details={[
              { label: 'Margem Bruta', value: formatPercent(kpis?.gross_margin || 0) },
              { label: 'Margem Operacional', value: formatPercent(kpis?.operating_margin || 0) },
              { label: 'Margem EBITDA', value: formatPercent(kpis?.ebitda_margin || 0) }
            ]}
          />
          <InteractiveKPICard
            title="ROI"
            value={formatPercent(kpis?.roi_percentage || 0)}
            subtitle={`Break-even: ${formatCurrency(kpis?.break_even_point || 0)}`}
            icon={Target}
            color="from-teal-500 to-cyan-600"
            trend={{ value: kpis?.roi_percentage || 0, label: 'Retorno sobre investimento' }}
            onClick={() => navigate('/financeiro')}
            details={[
              { label: 'Break-even', value: formatCurrency(kpis?.break_even_point || 0) },
              { label: 'Payback', value: `${kpis?.payback_period_days || 0} dias` },
              { label: 'ROI', value: formatPercent(kpis?.roi_percentage || 0) }
            ]}
          />
          <InteractiveKPICard
            title="Capital de Giro"
            value={formatCurrency(kpis?.net_working_capital || 0)}
            subtitle={`Eficiência: ${formatPercent(kpis?.operational_efficiency || 0)}`}
            icon={Activity}
            color="from-orange-500 to-red-600"
            trend={{ value: kpis?.operational_efficiency || 0, label: 'Eficiência operacional' }}
            onClick={() => navigate('/financeiro')}
            details={[
              { label: 'A Receber', value: formatCurrency(kpis?.accounts_receivable || 0) },
              { label: 'A Pagar', value: formatCurrency(kpis?.accounts_payable || 0) },
              { label: 'Capital Líquido', value: formatCurrency(kpis?.net_working_capital || 0) }
            ]}
          />
        </div>

        {/* ─── FINANCIAL INTELLIGENCE PANEL ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          {/* Panel header with period filter */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Inteligência Financeira</h2>
                <p className="text-sm text-gray-500">Dados em tempo real — {PERIOD_LABELS[periodFilter]}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {(['day', 'week', 'month', 'quarter'] as PeriodFilter[]).map(f => (
                <button key={f} onClick={() => setPeriodFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    periodFilter === f
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}>
                  {f === 'day' ? 'Dia' : f === 'week' ? 'Semana' : f === 'month' ? 'Mês' : 'Trimestre'}
                </button>
              ))}
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100">
            {[
              {
                label: 'Receita',
                value: formatCurrency(intelligence?.revenue ?? 0),
                sub: 'Entradas no período',
                color: 'text-emerald-600',
                bg: 'bg-white'
              },
              {
                label: 'Despesas',
                value: formatCurrency(intelligence?.expenses ?? 0),
                sub: 'Saídas no período',
                color: 'text-red-500',
                bg: 'bg-white'
              },
              {
                label: 'EBITDA',
                value: formatCurrency(intelligence?.ebitda ?? 0),
                sub: `Margem ${(intelligence?.ebitdaMargin ?? 0).toFixed(1)}%`,
                color: (intelligence?.ebitda ?? 0) >= 0 ? 'text-blue-600' : 'text-red-500',
                bg: 'bg-white'
              },
              {
                label: 'Saldo',
                value: formatCurrency((intelligence?.revenue ?? 0) - (intelligence?.expenses ?? 0)),
                sub: 'Resultado líquido',
                color: ((intelligence?.revenue ?? 0) - (intelligence?.expenses ?? 0)) >= 0 ? 'text-teal-600' : 'text-red-500',
                bg: 'bg-white'
              }
            ].map(kpi => (
              <div key={kpi.label} className={`${kpi.bg} px-5 py-4 flex flex-col gap-0.5`}>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</span>
                <span className={`text-2xl font-bold ${kpi.color} ${intelligenceLoading ? 'opacity-40' : ''}`}>
                  {intelligenceLoading ? '...' : kpi.value}
                </span>
                <span className="text-xs text-gray-400">{kpi.sub}</span>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="px-6 py-5">
            {intelligenceLoading ? (
              <div className="h-52 flex items-center justify-center text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm">Carregando dados...</span>
              </div>
            ) : !intelligence || intelligence.chartLabels.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-gray-400 gap-2">
                <BarChart3 className="h-8 w-8 opacity-30" />
                <span className="text-sm">Nenhuma movimentação no período selecionado</span>
                <span className="text-xs text-gray-300">As OS concluídas geram entradas automaticamente</span>
              </div>
            ) : (
              <div className="h-52">
                <Bar
                  data={{
                    labels: intelligence.chartLabels,
                    datasets: [
                      {
                        label: 'Entradas',
                        data: intelligence.chartEntradas,
                        backgroundColor: 'rgba(16, 185, 129, 0.75)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1,
                        borderRadius: 4,
                      },
                      {
                        label: 'Saídas',
                        data: intelligence.chartSaidas,
                        backgroundColor: 'rgba(239, 68, 68, 0.65)',
                        borderColor: 'rgb(239, 68, 68)',
                        borderWidth: 1,
                        borderRadius: 4,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top', labels: { font: { size: 11 } } },
                      tooltip: {
                        callbacks: {
                          label: ctx => `R$ ${Number(ctx.raw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: v => `R$ ${Number(v).toLocaleString('pt-BR', { notation: 'compact' })}`
                        },
                        grid: { color: 'rgba(0,0,0,0.04)' }
                      },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Period KPIs - Real-time from RPC */}
        {periodKpis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">KPIs do Período</h2>
                  <p className="text-sm text-gray-600">
                    {new Date(periodKpis.periodo_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} — {new Date(periodKpis.periodo_fim + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${periodKpis.lucro_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {periodKpis.lucro_liquido >= 0
                    ? <TrendingUp className="inline h-5 w-5 mr-1" />
                    : <TrendingDown className="inline h-5 w-5 mr-1" />}
                  {formatCurrency(periodKpis.lucro_liquido)}
                </span>
                <span className="text-sm text-gray-500">lucro líquido</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Faturamento Bruto', value: formatCurrency(periodKpis.faturamento_bruto), sub: `${periodKpis.qtd_os_fechadas} OS fechadas`, bg: 'from-green-50 to-emerald-50', border: 'border-green-100', sub_color: 'text-green-600' },
                { label: 'EBITDA', value: formatCurrency(periodKpis.ebitda), sub: `Margem: ${(periodKpis.ebitda_margem || 0).toFixed(1)}%`, bg: 'from-blue-50 to-cyan-50', border: 'border-blue-100', sub_color: 'text-blue-600' },
                { label: 'Margem Líquida', value: `${(periodKpis.margem_liquida_pct || 0).toFixed(1)}%`, sub: `Ticket médio: ${formatCurrency(periodKpis.ticket_medio)}`, bg: 'from-orange-50 to-amber-50', border: 'border-orange-100', sub_color: 'text-orange-600' },
                { label: 'Clientes Atendidos', value: String(periodKpis.qtd_clientes_atendidos), sub: 'Volume de atendimento', bg: 'from-slate-50 to-gray-50', border: 'border-gray-200', sub_color: 'text-gray-600' }
              ].map(card => (
                <div key={card.label} className={`bg-gradient-to-br ${card.bg} rounded-xl p-4 border ${card.border}`}>
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                  <p className={`text-xs ${card.sub_color} mt-1`}>{card.sub}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Composição dos Custos</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Impostos', value: periodKpis.total_impostos, color: 'text-red-600', sub: `${(periodKpis.aliquota_impostos || 0).toFixed(1)}% s/ fat.` },
                  { label: 'Materiais', value: periodKpis.custo_materiais, color: 'text-orange-600', sub: periodKpis.faturamento_bruto > 0 ? `${((periodKpis.custo_materiais / periodKpis.faturamento_bruto) * 100).toFixed(1)}% s/ fat.` : '0.0%' },
                  { label: 'Mão de Obra', value: periodKpis.custo_mao_obra, color: 'text-blue-600', sub: periodKpis.faturamento_bruto > 0 ? `${((periodKpis.custo_mao_obra / periodKpis.faturamento_bruto) * 100).toFixed(1)}% s/ fat.` : '0.0%' },
                  { label: 'Pessoal (RH)', value: periodKpis.custo_total_pessoal, color: 'text-slate-600', sub: 'Salários + encargos' },
                  { label: 'Desp. Fixas', value: periodKpis.total_despesas_fixas, color: 'text-gray-600', sub: 'Contas e contratos' }
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className={`text-base font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                ))}
              </div>

              {periodKpis.faturamento_bruto > 0 && (
                <div className="mt-5">
                  <div className="flex h-6 rounded-full overflow-hidden text-xs">
                    {[
                      { pct: (periodKpis.total_impostos / periodKpis.faturamento_bruto) * 100, color: 'bg-red-400', label: 'Impostos' },
                      { pct: (periodKpis.custo_materiais / periodKpis.faturamento_bruto) * 100, color: 'bg-orange-400', label: 'Materiais' },
                      { pct: (periodKpis.custo_mao_obra / periodKpis.faturamento_bruto) * 100, color: 'bg-blue-400', label: 'MO' },
                      { pct: (periodKpis.custo_total_pessoal / periodKpis.faturamento_bruto) * 100, color: 'bg-slate-400', label: 'Pessoal' },
                      { pct: (periodKpis.total_despesas_fixas / periodKpis.faturamento_bruto) * 100, color: 'bg-gray-400', label: 'Fixas' },
                      { pct: Math.max((periodKpis.lucro_liquido / periodKpis.faturamento_bruto) * 100, 0), color: 'bg-green-400', label: 'Lucro' },
                    ].map((seg, i) => seg.pct > 0 && (
                      <div key={i} title={`${seg.label}: ${seg.pct.toFixed(1)}%`}
                        className={`${seg.color} flex items-center justify-center text-white font-medium transition-all`}
                        style={{ width: `${Math.min(seg.pct, 100)}%` }}>
                        {seg.pct > 5 && `${seg.pct.toFixed(0)}%`}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 flex-wrap mt-2">
                    {[
                      { color: 'bg-red-400', label: 'Impostos' },
                      { color: 'bg-orange-400', label: 'Materiais' },
                      { color: 'bg-blue-400', label: 'Mão de Obra' },
                      { color: 'bg-slate-400', label: 'Pessoal RH' },
                      { color: 'bg-gray-400', label: 'Desp. Fixas' },
                      { color: 'bg-green-400', label: 'Lucro Líquido' },
                    ].map((leg, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-sm ${leg.color}`} />
                        <span className="text-xs text-gray-600">{leg.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Alertas Financeiros */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Alertas Financeiros</h2>
                  <p className="text-sm text-gray-600">{alerts.length} alertas ativos</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-xl border ${getSeverityColor(alert.severity)}`}>
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <span className="text-xs opacity-70">{formatDateSafe(alert.created_at)}</span>
                    </div>
                    <p className="text-sm opacity-90">{alert.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <span>Atual: {formatCurrency(alert.current_value)}</span>
                      <span>Limite: {formatCurrency(alert.threshold_value)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Alertas de Margem */}
        {marginAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-orange-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Alertas de Custo x Margem</h2>
                  <p className="text-sm text-gray-600">Cotacoes processadas pela IA detectaram impactos</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-bold rounded-full">
                {marginAlerts.length} alertas
              </span>
            </div>
            <div className="space-y-3">
              {marginAlerts.map((alert: any) => (
                <div key={alert.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-800'
                    : alert.severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <span className="text-xs opacity-70 shrink-0">{formatDateSafe(alert.created_at)}</span>
                    </div>
                    <p className="text-xs opacity-90">{alert.description}</p>
                    {alert.suggested_price > 0 && (
                      <p className="text-xs font-semibold mt-1">
                        Preco sugerido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(alert.suggested_price)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.from('margin_alerts').update({ is_dismissed: true, dismissed_at: new Date().toISOString() }).eq('id', alert.id)
                      setMarginAlerts(prev => prev.filter(a => a.id !== alert.id))
                    }}
                    className="p-1 rounded-lg hover:bg-black/10 transition-colors shrink-0">
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Análise de Margens + Saúde Financeira */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Análise de Margens</h2>
                <p className="text-sm text-gray-600">Indicadores de rentabilidade</p>
              </div>
              <BarChart3 className="h-6 w-6 text-gray-400" />
            </div>
            <div className="space-y-4">
              {financialHealthMetrics.map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                    <span className="text-sm font-bold" style={{ color: metric.color }}>
                      {formatPercent(metric.value)}
                    </span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="absolute h-full transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%`, backgroundColor: metric.color }} />
                    <div className="absolute h-full border-r-2 border-gray-400"
                      style={{ left: `${(metric.target / 100) * 100}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Meta: {metric.target}%</span>
                    <span className={`text-xs font-medium ${metric.value >= metric.target ? 'text-green-600' : 'text-orange-600'}`}>
                      {metric.value >= metric.target ? 'Acima da meta' : 'Abaixo da meta'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Saúde Financeira</h2>
                <p className="text-sm text-gray-600">Indicadores comparativos</p>
              </div>
              <Shield className="h-6 w-6 text-gray-400" />
            </div>
            <div className="h-80">
              <Radar
                data={{
                  labels: financialHealthMetrics.map(m => m.label),
                  datasets: [
                    {
                      label: 'Atual',
                      data: financialHealthMetrics.map(m => m.value),
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderColor: 'rgb(59, 130, 246)',
                      borderWidth: 2,
                      pointBackgroundColor: 'rgb(59, 130, 246)',
                      pointBorderColor: '#fff'
                    },
                    {
                      label: 'Meta',
                      data: financialHealthMetrics.map(m => m.target),
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      borderColor: 'rgb(34, 197, 94)',
                      borderWidth: 2,
                      pointBackgroundColor: 'rgb(34, 197, 94)',
                      pointBorderColor: '#fff'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { r: { beginAtZero: true, max: 70, ticks: { stepSize: 10 } } }
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Inteligência de Clientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Inteligência de Clientes</h2>
                <p className="text-sm text-gray-600">Top 10 clientes por receita</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Cliente', 'Tipo', 'Classificação', 'Receita', 'Pedidos', 'Ticket Médio', 'Score', 'Risco'].map(h => (
                    <th key={h} className={`py-3 px-4 text-sm font-semibold text-gray-700 ${['Receita', 'Pedidos', 'Ticket Médio'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer, index) => {
                  const riskLevel = getRiskLevel(customer.risk_score)
                  return (
                    <tr key={customer.customer_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{customer.customer_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{customer.customer_type}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getABCColor(customer.abc_classification)}`}>
                          {customer.abc_classification}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-green-600">{formatCurrency(customer.total_revenue)}</td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900">{customer.total_orders}</td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900">{formatCurrency(customer.avg_order_value)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 to-blue-600"
                              style={{ width: `${(customer.credit_score / 1000) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{customer.credit_score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium ${riskLevel.color}`}>{riskLevel.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Métricas Operacionais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <Package className="h-8 w-8 text-green-200" />
              <span className="text-sm font-medium text-green-100">Estoque</span>
            </div>
            <h3 className="text-3xl font-bold mb-2">{formatCurrency(kpis?.total_inventory_value || 0)}</h3>
            <p className="text-green-100 text-sm mb-4">Valor Total</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-green-100 mb-1">Lucro Potencial</p>
                <p className="text-lg font-bold">{formatCurrency(kpis?.potential_profit || 0)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-green-100 mb-1">Giro</p>
                <p className="text-lg font-bold">{(kpis?.inventory_turnover || 0).toFixed(1)}x</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 to-cyan-700 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-200" />
              <span className="text-sm font-medium text-blue-100">Clientes</span>
            </div>
            <h3 className="text-3xl font-bold mb-2">{kpis?.total_customers || 0}</h3>
            <p className="text-blue-100 text-sm mb-4">Total de Clientes</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-blue-100 mb-1">Pessoa Jurídica</p>
                <p className="text-lg font-bold">{kpis?.total_customers_pj || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-blue-100 mb-1">Pessoa Física</p>
                <p className="text-lg font-bold">{kpis?.total_customers_pf || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-slate-300" />
              <span className="text-sm font-medium text-slate-300">Ordens de Serviço</span>
            </div>
            <h3 className="text-3xl font-bold mb-2">{kpis?.total_completed_orders || 0}</h3>
            <p className="text-slate-300 text-sm mb-4">Concluídas</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-slate-300 mb-1">Ticket Médio</p>
                <p className="text-lg font-bold">{formatCurrency(kpis?.avg_order_value || 0)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-slate-300 mb-1">Em Progresso</p>
                <p className="text-lg font-bold">{kpis?.orders_in_progress || 0}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <MarginAlertPanel />
          <OSProfitabilityWidget />
        </div>
        <div className="mt-6">
          <PMOCSchedulePanel />
        </div>
      </div>
    </div>
  )
}

export default CFODashboard
