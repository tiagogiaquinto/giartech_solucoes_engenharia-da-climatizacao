import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target,
  Activity, BarChart3, RefreshCw,
  Bell, XCircle, Calendar, ArrowUpRight, ArrowDownRight,
  Users, Package, FileText, Shield, ChevronDown, Filter
} from 'lucide-react'
import MarginAlertPanel from '../components/MarginAlertPanel'
import OSProfitabilityWidget from '../components/OSProfitabilityWidget'
import PMOCSchedulePanel from '../components/PMOCSchedulePanel'
import { supabase } from '../lib/supabase'
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
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler
)

type FilterMode = 'month' | 'quarter' | 'year' | 'custom'

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

interface GlobalKPIs {
  total_customers: number
  total_customers_pj: number
  total_customers_pf: number
  total_inventory_value: number
  potential_profit: number
  inventory_turnover: number
  orders_in_progress: number
  gross_margin: number
  operating_margin: number
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const pad = (n: number) => String(n).padStart(2, '0')
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const getDateRange = (
  mode: FilterMode,
  selectedYear: number,
  selectedMonth: number,
  selectedQuarter: number,
  customStart: string,
  customEnd: string
): { start: string; end: string; label: string } => {
  const now = new Date()

  if (mode === 'custom' && customStart && customEnd) {
    const s = new Date(customStart + 'T00:00:00')
    const e = new Date(customEnd + 'T00:00:00')
    return {
      start: customStart,
      end: customEnd,
      label: `${s.toLocaleDateString('pt-BR')} – ${e.toLocaleDateString('pt-BR')}`
    }
  }

  if (mode === 'month') {
    const first = new Date(selectedYear, selectedMonth, 1)
    const last = new Date(selectedYear, selectedMonth + 1, 0)
    const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth()
    return {
      start: fmt(first),
      end: isCurrentMonth ? fmt(now) : fmt(last),
      label: `${MONTHS[selectedMonth]} ${selectedYear}`
    }
  }

  if (mode === 'quarter') {
    const qStart = selectedQuarter * 3
    const first = new Date(selectedYear, qStart, 1)
    const last = new Date(selectedYear, qStart + 3, 0)
    const isCurrentQ = selectedYear === now.getFullYear() && Math.floor(now.getMonth() / 3) === selectedQuarter
    return {
      start: fmt(first),
      end: isCurrentQ ? fmt(now) : fmt(last),
      label: `T${selectedQuarter + 1}/${selectedYear}`
    }
  }

  return {
    start: `${selectedYear}-01-01`,
    end: selectedYear === now.getFullYear() ? fmt(now) : `${selectedYear}-12-31`,
    label: `Ano ${selectedYear}`
  }
}

const CFODashboard = () => {
  const navigate = useNavigate()
  const now = new Date()

  const [filterMode, setFilterMode] = useState<FilterMode>('month')
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(now.getMonth() / 3))
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const [periodKpis, setPeriodKpis] = useState<PeriodKPIs | null>(null)
  const [globalKpis, setGlobalKpis] = useState<GlobalKPIs | null>(null)
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [marginAlerts, setMarginAlerts] = useState<any[]>([])
  const [topCustomers, setTopCustomers] = useState<CustomerIntelligence[]>([])
  const [cashFlow, setCashFlow] = useState<{ labels: string[]; entradas: number[]; saidas: number[] } | null>(null)

  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const dateRange = getDateRange(filterMode, selectedYear, selectedMonth, selectedQuarter, customStart, customEnd)

  const availableYears = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  const loadData = useCallback(async () => {
    if (filterMode === 'custom' && (!customStart || !customEnd)) return
    setLoading(true)
    try {
      const { start, end } = getDateRange(filterMode, selectedYear, selectedMonth, selectedQuarter, customStart, customEnd)

      const [periodRes, alertsRes, customersRes, kpisRes, marginAlertsRes, cashFlowRes] = await Promise.all([
        supabase.rpc('get_cfo_kpis_period', { p_start_date: start, p_end_date: end }),
        supabase.from('financial_alerts').select('*').eq('is_active', true)
          .order('severity', { ascending: true }).order('created_at', { ascending: false }).limit(10),
        supabase.from('v_customer_intelligence').select('*').order('total_revenue', { ascending: false }).limit(10),
        supabase.from('v_cfo_kpis').select('*').maybeSingle(),
        supabase.from('margin_alerts').select('*').eq('is_dismissed', false)
          .order('created_at', { ascending: false }).limit(20),
        supabase.from('v_financial_intelligence').select('*')
          .gte('reference_date', start)
          .lte('reference_date', end)
          .order('reference_date', { ascending: true })
      ])

      if (periodRes.data) setPeriodKpis(periodRes.data as PeriodKPIs)
      setAlerts(alertsRes.data || [])
      setTopCustomers(customersRes.data || [])

      if (kpisRes.data) {
        setGlobalKpis({
          total_customers: kpisRes.data.total_customers || 0,
          total_customers_pj: kpisRes.data.total_customers_pj || 0,
          total_customers_pf: kpisRes.data.total_customers_pf || 0,
          total_inventory_value: kpisRes.data.total_inventory_value || 0,
          potential_profit: kpisRes.data.potential_profit || 0,
          inventory_turnover: kpisRes.data.inventory_turnover || 0,
          orders_in_progress: kpisRes.data.orders_in_progress || 0,
          gross_margin: kpisRes.data.gross_margin || 0,
          operating_margin: kpisRes.data.operating_margin || 0,
        })
      }

      setMarginAlerts(marginAlertsRes.data || [])

      const entries: CashFlowEntry[] = cashFlowRes.data || []
      const grouped: Record<string, { entrada: number; saida: number }> = {}
      entries.forEach(e => {
        const key = e.reference_date?.slice(0, 10) || ''
        if (!grouped[key]) grouped[key] = { entrada: 0, saida: 0 }
        if (e.type === 'entrada') grouped[key].entrada += Number(e.amount)
        else grouped[key].saida += Number(e.amount)
      })
      const sortedKeys = Object.keys(grouped).sort()
      setCashFlow({
        labels: sortedKeys.map(k => {
          const d = new Date(k + 'T00:00:00')
          return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        }),
        entradas: sortedKeys.map(k => grouped[k].entrada),
        saidas: sortedKeys.map(k => grouped[k].saida),
      })

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Erro ao carregar dados CFO:', error)
    } finally {
      setLoading(false)
    }
  }, [filterMode, selectedYear, selectedMonth, selectedQuarter, customStart, customEnd])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadData])

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number | null | undefined, withSign = true) => {
    if (value === null || value === undefined || isNaN(value)) return '0,0%'
    const sign = withSign && value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'bg-red-50 text-red-800 border-red-200'
    if (severity === 'warning') return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    return 'bg-blue-50 text-blue-800 border-blue-200'
  }

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') return <XCircle className="h-5 w-5 text-red-600 shrink-0" />
    if (severity === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
    return <Bell className="h-5 w-5 text-blue-600 shrink-0" />
  }

  const getABCColor = (c: string) => {
    if (c === 'A') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (c === 'B') return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-orange-100 text-orange-800 border-orange-200'
  }

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: 'Alto Risco', color: 'text-red-600' }
    if (score >= 40) return { label: 'Médio', color: 'text-yellow-600' }
    return { label: 'Baixo', color: 'text-emerald-600' }
  }

  const p = periodKpis

  const marginMetrics = [
    { label: 'Margem Bruta', value: globalKpis?.gross_margin || 0, target: 60, color: 'rgb(34, 197, 94)' },
    { label: 'Margem Operacional', value: globalKpis?.operating_margin || 0, target: 40, color: 'rgb(59, 130, 246)' },
    { label: 'Margem Líquida', value: p?.margem_liquida_pct || 0, target: 30, color: 'rgb(249, 115, 22)' },
    { label: 'Margem EBITDA', value: p?.ebitda_margem || 0, target: 35, color: 'rgb(20, 184, 166)' }
  ]

  const totalCustos = p ? (p.total_impostos + p.custo_materiais + p.custo_mao_obra + p.custo_total_pessoal + p.total_despesas_fixas) : 0
  const saldo = p ? (p.faturamento_bruto - totalCustos) : 0
  const receitas = cashFlow?.entradas.reduce((a, b) => a + b, 0) || 0
  const despesas = cashFlow?.saidas.reduce((a, b) => a + b, 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-[1800px] mx-auto px-6 py-8 space-y-8">

        {/* ─── HEADER ─── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">Dashboard CFO</h1>
            <p className="text-gray-500 text-sm">
              Inteligência Financeira Executiva
              {!loading && <span className="ml-2 text-blue-600 font-medium">— {dateRange.label}</span>}
            </p>
          </div>

          {/* ─── FILTROS AVANÇADOS ─── */}
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar por</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {(['month', 'quarter', 'year', 'custom'] as FilterMode[]).map(m => (
                  <button key={m} onClick={() => setFilterMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterMode === m
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {m === 'month' ? 'Mês' : m === 'quarter' ? 'Trimestre' : m === 'year' ? 'Ano' : 'Personalizado'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {filterMode !== 'custom' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Ano:</span>
                    <div className="relative">
                      <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                        className="pl-2 pr-6 py-1 text-sm border border-gray-200 rounded-lg bg-white appearance-none cursor-pointer">
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {filterMode === 'month' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Mês:</span>
                    <div className="relative">
                      <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                        className="pl-2 pr-6 py-1 text-sm border border-gray-200 rounded-lg bg-white appearance-none cursor-pointer">
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {filterMode === 'quarter' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Trimestre:</span>
                    <div className="relative">
                      <select value={selectedQuarter} onChange={e => setSelectedQuarter(Number(e.target.value))}
                        className="pl-2 pr-6 py-1 text-sm border border-gray-200 rounded-lg bg-white appearance-none cursor-pointer">
                        {[0, 1, 2, 3].map(q => <option key={q} value={q}>T{q + 1}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {filterMode === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white" />
                    <span className="text-gray-400 text-xs">até</span>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white" />
                  </div>
                )}

                <button onClick={loadData}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Aplicar
                </button>
              </div>

              {lastUpdated && (
                <p className="text-xs text-gray-400 text-right -mt-1">
                  Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── BADGE DO PERÍODO ─── */}
        <div className="flex items-center gap-3 py-2 px-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 font-medium w-fit">
          <Calendar className="h-4 w-4 text-blue-500" />
          Exibindo dados de: <span className="font-bold">{dateRange.label}</span>
          {p && (
            <span className="text-blue-500 font-normal">
              ({p.qtd_os_fechadas} OS • {p.qtd_clientes_atendidos} clientes atendidos)
            </span>
          )}
        </div>

        {/* ─── KPI CARDS DO PERÍODO ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: 'Faturamento Bruto',
              value: formatCurrency(p?.faturamento_bruto),
              sub: `Lucro: ${formatCurrency(p?.lucro_liquido)}`,
              trend: p?.margem_liquida_pct || 0,
              trendLabel: 'Margem líquida',
              icon: DollarSign,
              gradient: 'from-emerald-500 to-green-600',
              details: [
                { label: 'EBITDA', val: formatCurrency(p?.ebitda) },
                { label: 'Margem EBITDA', val: formatPercent(p?.ebitda_margem, false) },
                { label: 'Ticket Médio', val: formatCurrency(p?.ticket_medio) },
              ],
              onClick: () => navigate('/financeiro')
            },
            {
              title: 'EBITDA',
              value: formatCurrency(p?.ebitda),
              sub: `Margem: ${formatPercent(p?.ebitda_margem, false)}`,
              trend: p?.ebitda_margem || 0,
              trendLabel: 'Margem EBITDA',
              icon: TrendingUp,
              gradient: 'from-blue-500 to-cyan-600',
              details: [
                { label: 'Impostos', val: formatCurrency(p?.total_impostos) },
                { label: 'Custo Mat.', val: formatCurrency(p?.custo_materiais) },
                { label: 'Mão de Obra', val: formatCurrency(p?.custo_mao_obra) },
              ],
              onClick: () => navigate('/financeiro')
            },
            {
              title: 'Lucro Líquido',
              value: formatCurrency(p?.lucro_liquido),
              sub: `Margem: ${formatPercent(p?.margem_liquida_pct, false)}`,
              trend: p?.margem_liquida_pct || 0,
              trendLabel: 'Margem líquida',
              icon: Target,
              gradient: 'from-teal-500 to-cyan-600',
              details: [
                { label: 'Desp. Fixas', val: formatCurrency(p?.total_despesas_fixas) },
                { label: 'Custo Pessoal', val: formatCurrency(p?.custo_total_pessoal) },
                { label: 'Extras', val: formatCurrency(p?.custo_extras) },
              ],
              onClick: () => navigate('/financeiro')
            },
            {
              title: 'Fluxo de Caixa',
              value: formatCurrency(receitas - despesas),
              sub: `Receitas: ${formatCurrency(receitas)}`,
              trend: receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0,
              trendLabel: 'do faturamento',
              icon: Activity,
              gradient: 'from-orange-500 to-red-500',
              details: [
                { label: 'Entradas', val: formatCurrency(receitas) },
                { label: 'Saídas', val: formatCurrency(despesas) },
                { label: 'Saldo', val: formatCurrency(receitas - despesas) },
              ],
              onClick: () => navigate('/financeiro')
            }
          ].map(card => {
            const trend = card.trend || 0
            const positive = trend >= 0
            return (
              <motion.div key={card.title}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
                onClick={card.onClick}
                className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 cursor-pointer transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {formatPercent(trend, false)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold mb-1 ${loading ? 'opacity-40' : ''}`}>
                  {loading ? '...' : card.value}
                </p>
                <p className="text-xs text-gray-400 mb-4">{card.sub}</p>
                <div className="border-t border-gray-100 pt-3 space-y-1">
                  {card.details.map(d => (
                    <div key={d.label} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{d.label}</span>
                      <span className="font-semibold text-gray-700">{loading ? '–' : d.val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ─── GRÁFICO FLUXO DE CAIXA ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Fluxo de Caixa</h2>
                <p className="text-sm text-gray-500">{dateRange.label} — Entradas vs Saídas</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />Entradas: <strong>{formatCurrency(receitas)}</strong></span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Saídas: <strong>{formatCurrency(despesas)}</strong></span>
            </div>
          </div>

          <div className="px-6 py-5">
            {loading ? (
              <div className="h-56 flex items-center justify-center text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : !cashFlow || cashFlow.labels.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-gray-400 gap-2">
                <BarChart3 className="h-8 w-8 opacity-30" />
                <span className="text-sm">Nenhuma movimentação no per��odo selecionado</span>
              </div>
            ) : (
              <div className="h-56">
                <Bar
                  data={{
                    labels: cashFlow.labels,
                    datasets: [
                      {
                        label: 'Entradas',
                        data: cashFlow.entradas,
                        backgroundColor: 'rgba(16, 185, 129, 0.75)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1,
                        borderRadius: 4,
                      },
                      {
                        label: 'Saídas',
                        data: cashFlow.saidas,
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
                        ticks: { callback: v => `R$ ${Number(v).toLocaleString('pt-BR', { notation: 'compact' })}` },
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

        {/* ─── KPIs DO PERÍODO (Detalhamento) ─── */}
        {p && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">KPIs do Período</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(p.periodo_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} — {new Date(p.periodo_fim + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.lucro_liquido >= 0
                  ? <TrendingUp className="h-5 w-5 text-emerald-600" />
                  : <TrendingDown className="h-5 w-5 text-red-600" />}
                <span className={`text-xl font-bold ${p.lucro_liquido >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(p.lucro_liquido)}
                </span>
                <span className="text-sm text-gray-500">lucro líquido</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Faturamento Bruto', value: formatCurrency(p.faturamento_bruto), sub: `${p.qtd_os_fechadas} OS fechadas`, bg: 'from-emerald-50 to-green-50', border: 'border-emerald-100', sc: 'text-emerald-600' },
                { label: 'EBITDA', value: formatCurrency(p.ebitda), sub: `Margem: ${formatPercent(p.ebitda_margem, false)}`, bg: 'from-blue-50 to-cyan-50', border: 'border-blue-100', sc: 'text-blue-600' },
                { label: 'Margem Líquida', value: formatPercent(p.margem_liquida_pct, false), sub: `Ticket médio: ${formatCurrency(p.ticket_medio)}`, bg: 'from-orange-50 to-amber-50', border: 'border-orange-100', sc: 'text-orange-600' },
                { label: 'Clientes Atendidos', value: String(p.qtd_clientes_atendidos), sub: 'No período selecionado', bg: 'from-slate-50 to-gray-50', border: 'border-gray-200', sc: 'text-gray-600' }
              ].map(c => (
                <div key={c.label} className={`bg-gradient-to-br ${c.bg} rounded-xl p-4 border ${c.border}`}>
                  <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                  <p className="text-xl font-bold text-gray-900">{c.value}</p>
                  <p className={`text-xs ${c.sc} mt-1`}>{c.sub}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Composição dos Custos</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                {[
                  { label: 'Impostos', value: p.total_impostos, color: 'text-red-600', sub: `${formatPercent(p.aliquota_impostos, false)} s/ fat.` },
                  { label: 'Materiais', value: p.custo_materiais, color: 'text-orange-600', sub: p.faturamento_bruto > 0 ? `${((p.custo_materiais / p.faturamento_bruto) * 100).toFixed(1)}% s/ fat.` : '—' },
                  { label: 'Mão de Obra', value: p.custo_mao_obra, color: 'text-blue-600', sub: p.faturamento_bruto > 0 ? `${((p.custo_mao_obra / p.faturamento_bruto) * 100).toFixed(1)}% s/ fat.` : '—' },
                  { label: 'Pessoal (RH)', value: p.custo_total_pessoal, color: 'text-slate-600', sub: 'Salários + encargos' },
                  { label: 'Desp. Fixas', value: p.total_despesas_fixas, color: 'text-gray-600', sub: 'Contas e contratos' }
                ].map(item => (
                  <div key={item.label} className="text-center bg-gray-50 rounded-xl py-3 px-2">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className={`text-base font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                ))}
              </div>

              {p.faturamento_bruto > 0 && (
                <>
                  <div className="flex h-7 rounded-full overflow-hidden text-xs">
                    {[
                      { pct: (p.total_impostos / p.faturamento_bruto) * 100, color: 'bg-red-400', label: 'Impostos' },
                      { pct: (p.custo_materiais / p.faturamento_bruto) * 100, color: 'bg-orange-400', label: 'Materiais' },
                      { pct: (p.custo_mao_obra / p.faturamento_bruto) * 100, color: 'bg-blue-400', label: 'MO' },
                      { pct: (p.custo_total_pessoal / p.faturamento_bruto) * 100, color: 'bg-slate-400', label: 'Pessoal' },
                      { pct: (p.total_despesas_fixas / p.faturamento_bruto) * 100, color: 'bg-gray-400', label: 'Fixas' },
                      { pct: Math.max((p.lucro_liquido / p.faturamento_bruto) * 100, 0), color: 'bg-emerald-400', label: 'Lucro' },
                    ].map((seg, i) => seg.pct > 0 && (
                      <div key={i} title={`${seg.label}: ${seg.pct.toFixed(1)}%`}
                        className={`${seg.color} flex items-center justify-center text-white font-medium`}
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
                      { color: 'bg-emerald-400', label: 'Lucro Líquido' },
                    ].map((leg, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-sm ${leg.color}`} />
                        <span className="text-xs text-gray-600">{leg.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── ALERTAS FINANCEIROS ─── */}
        {alerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Alertas Financeiros</h2>
                <p className="text-sm text-gray-500">{alerts.length} alertas ativos</p>
              </div>
            </div>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-xl border ${getSeverityColor(alert.severity)}`}>
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <span className="text-xs opacity-60">{formatDateSafe(alert.created_at)}</span>
                    </div>
                    <p className="text-sm opacity-90">{alert.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs opacity-80">
                      <span>Atual: {formatCurrency(alert.current_value)}</span>
                      <span>Limite: {formatCurrency(alert.threshold_value)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── ALERTAS DE MARGEM ─── */}
        {marginAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Alertas de Custo x Margem</h2>
                  <p className="text-sm text-gray-500">Cotações processadas pela IA</p>
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
                        Preço sugerido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(alert.suggested_price)}
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

        {/* ─── ANÁLISE DE MARGENS + RADAR ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Análise de Margens</h2>
                <p className="text-sm text-gray-500">Período: {dateRange.label}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-gray-300" />
            </div>
            <div className="space-y-5">
              {marginMetrics.map(metric => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                    <span className="text-sm font-bold" style={{ color: metric.color }}>
                      {formatPercent(metric.value, false)}
                    </span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="absolute h-full transition-all duration-700 rounded-full"
                      style={{ width: `${Math.min(Math.max((metric.value / metric.target) * 100, 0), 100)}%`, backgroundColor: metric.color }} />
                    <div className="absolute h-full border-r-2 border-gray-400 border-dashed"
                      style={{ left: `${Math.min((metric.target / 100) * 100, 99)}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">Meta: {metric.target}%</span>
                    <span className={`text-xs font-medium ${metric.value >= metric.target ? 'text-emerald-600' : 'text-orange-500'}`}>
                      {metric.value >= metric.target ? 'Acima da meta' : 'Abaixo da meta'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Saúde Financeira</h2>
                <p className="text-sm text-gray-500">Atual vs Meta</p>
              </div>
              <Shield className="h-6 w-6 text-gray-300" />
            </div>
            <div className="h-72">
              <Radar
                data={{
                  labels: marginMetrics.map(m => m.label),
                  datasets: [
                    {
                      label: 'Atual',
                      data: marginMetrics.map(m => m.value),
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      borderColor: 'rgb(59, 130, 246)',
                      borderWidth: 2,
                      pointBackgroundColor: 'rgb(59, 130, 246)',
                      pointBorderColor: '#fff'
                    },
                    {
                      label: 'Meta',
                      data: marginMetrics.map(m => m.target),
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
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

        {/* ─── INTELIGÊNCIA DE CLIENTES ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Inteligência de Clientes</h2>
              <p className="text-sm text-gray-500">Top 10 clientes por receita total</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['#', 'Cliente', 'Tipo', 'ABC', 'Receita', 'Pedidos', 'Ticket Médio', 'Score', 'Risco'].map(h => (
                    <th key={h} className={`py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide ${['Receita', 'Pedidos', 'Ticket Médio'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer, index) => {
                  const riskLevel = getRiskLevel(customer.risk_score)
                  return (
                    <tr key={customer.customer_id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm font-medium text-gray-900">{customer.customer_name}</td>
                      <td className="py-3 px-3 text-xs text-gray-500">{customer.customer_type}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getABCColor(customer.abc_classification)}`}>
                          {customer.abc_classification}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-bold text-emerald-600">{formatCurrency(customer.total_revenue)}</td>
                      <td className="py-3 px-3 text-right text-sm text-gray-700">{customer.total_orders}</td>
                      <td className="py-3 px-3 text-right text-sm text-gray-700">{formatCurrency(customer.avg_order_value)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                              style={{ width: `${(customer.credit_score / 1000) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{customer.credit_score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs font-semibold ${riskLevel.color}`}>{riskLevel.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ─── MÉTRICAS OPERACIONAIS (dados globais) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <Package className="h-8 w-8 text-green-200" />
              <span className="text-xs font-medium text-green-100 bg-white/10 px-2 py-1 rounded-full">Estoque atual</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatCurrency(globalKpis?.total_inventory_value || 0)}</h3>
            <p className="text-green-100 text-sm mb-4">Valor em estoque</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-green-100 mb-1">Lucro Potencial</p>
                <p className="text-lg font-bold">{formatCurrency(globalKpis?.potential_profit || 0)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-green-100 mb-1">Giro</p>
                <p className="text-lg font-bold">{(globalKpis?.inventory_turnover || 0).toFixed(1)}x</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 to-cyan-700 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-200" />
              <span className="text-xs font-medium text-blue-100 bg-white/10 px-2 py-1 rounded-full">Base total</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{globalKpis?.total_customers || 0}</h3>
            <p className="text-blue-100 text-sm mb-4">Clientes cadastrados</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-blue-100 mb-1">Pessoa Jurídica</p>
                <p className="text-lg font-bold">{globalKpis?.total_customers_pj || 0}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-blue-100 mb-1">Pessoa Física</p>
                <p className="text-lg font-bold">{globalKpis?.total_customers_pf || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-slate-300" />
              <span className="text-xs font-medium text-slate-300 bg-white/10 px-2 py-1 rounded-full">Período</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{p?.qtd_os_fechadas || 0}</h3>
            <p className="text-slate-300 text-sm mb-4">OS fechadas no período</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-slate-300 mb-1">Ticket Médio</p>
                <p className="text-lg font-bold">{formatCurrency(p?.ticket_medio || 0)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-slate-300 mb-1">Em Progresso</p>
                <p className="text-lg font-bold">{globalKpis?.orders_in_progress || 0}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarginAlertPanel />
          <OSProfitabilityWidget />
        </div>
        <div>
          <PMOCSchedulePanel />
        </div>
      </div>
    </div>
  )
}

export default CFODashboard
