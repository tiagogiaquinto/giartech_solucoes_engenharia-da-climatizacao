import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Activity, ChartPie as PieChart, ChartBar as BarChart3, Target, Zap, RefreshCw, Calendar, Download, ArrowUp, ArrowDown, Minus, ChartLine as LineChart, ChartBar as BarChart } from 'lucide-react'
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Period {
  id: string
  period_name: string
  period_type: string
  start_date: string
  end_date: string
  fiscal_year: number
}

interface FinancialIndicators {
  ebitda: number
  ebitda_margin: number
  gross_margin: number
  operating_margin: number
  net_margin: number
  working_capital: number
  current_ratio: number
  roi: number
  operating_cash_flow: number
  net_cash_flow: number
}

interface FinancialSummary {
  total_revenue: number
  total_expenses: number
  net_result: number
  cash_inflow: number
  cash_outflow: number
  net_cash_flow: number
  accounts_receivable: number
  accounts_payable: number
}

const FinancialAnalysis = () => {
  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [comparisonPeriod, setComparisonPeriod] = useState<Period | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [comparisonMode, setComparisonMode] = useState<boolean>(false)
  const [indicators, setIndicators] = useState<FinancialIndicators>({
    ebitda: 0,
    ebitda_margin: 0,
    gross_margin: 0,
    operating_margin: 0,
    net_margin: 0,
    working_capital: 0,
    current_ratio: 0,
    roi: 0,
    operating_cash_flow: 0,
    net_cash_flow: 0
  })
  const [comparisonIndicators, setComparisonIndicators] = useState<FinancialIndicators | null>(null)
  const [comparisonSummary, setComparisonSummary] = useState<FinancialSummary | null>(null)
  const [summary, setSummary] = useState<FinancialSummary>({
    total_revenue: 0,
    total_expenses: 0,
    net_result: 0,
    cash_inflow: 0,
    cash_outflow: 0,
    net_cash_flow: 0,
    accounts_receivable: 0,
    accounts_payable: 0
  })
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    loadPeriods()
    loadMonthlyData()
  }, [])

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      filterPeriodByMonthYear()
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (comparisonMode && comparisonPeriod) {
      calculateComparisonIndicators()
    }
  }, [comparisonMode, comparisonPeriod])

  useEffect(() => {
    if (selectedPeriod) {
      calculateIndicators()
    }
  }, [selectedPeriod])

  const loadPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_periods')
        .select('*')
        .eq('period_type', 'monthly')
        .order('start_date', { ascending: false })

      if (error) throw error

      setPeriods(data || [])

      if (data && data.length > 0) {
        const years = [...new Set(data.map(p => p.fiscal_year))].sort((a, b) => b - a)
        setAvailableYears(years)

        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0')

        setSelectedYear(currentYear.toString())
        setSelectedMonth(currentMonth)

        const currentPeriod = data.find(p =>
          p.fiscal_year === currentYear &&
          p.start_date.startsWith(`${currentYear}-${currentMonth}`)
        )
        setSelectedPeriod(currentPeriod || data[0])
      }
    } catch (error) {
      console.error('Error loading periods:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPeriodByMonthYear = () => {
    if (!selectedMonth || !selectedYear) return

    const filtered = periods.find(p =>
      p.fiscal_year === parseInt(selectedYear) &&
      p.start_date.startsWith(`${selectedYear}-${selectedMonth}`)
    )

    if (filtered) {
      setSelectedPeriod(filtered)
    }
  }

  const calculateComparisonIndicators = async () => {
    if (!comparisonPeriod) return

    try {
      const [ebitdaData, roiData, summaryData, marginData, workingCapitalData] = await Promise.all([
        supabase.rpc('calculate_ebitda', {
          p_period_id: comparisonPeriod.id,
          p_start_date: comparisonPeriod.start_date,
          p_end_date: comparisonPeriod.end_date
        }),
        supabase.rpc('calculate_roi', {
          p_period_id: comparisonPeriod.id,
          p_start_date: comparisonPeriod.start_date,
          p_end_date: comparisonPeriod.end_date
        }),
        supabase
          .from('v_consolidated_financial_summary')
          .select('*')
          .eq('period_id', comparisonPeriod.id)
          .maybeSingle(),
        supabase
          .from('v_margin_analysis')
          .select('*')
          .eq('period_id', comparisonPeriod.id)
          .maybeSingle(),
        supabase.rpc('calculate_working_capital_consolidated', {
          p_period_id: comparisonPeriod.id
        })
      ])

      setComparisonIndicators({
        ebitda: ebitdaData.data?.[0]?.ebitda || 0,
        ebitda_margin: ebitdaData.data?.[0]?.ebitda_margin || 0,
        gross_margin: marginData.data?.gross_margin_percent || 0,
        operating_margin: marginData.data?.operating_margin_percent || 0,
        net_margin: 0,
        working_capital: workingCapitalData.data?.[0]?.working_capital || 0,
        current_ratio: workingCapitalData.data?.[0]?.current_ratio || 0,
        roi: roiData.data?.[0]?.roi_percent || 0,
        operating_cash_flow: summaryData.data?.net_cash_flow || 0,
        net_cash_flow: summaryData.data?.net_cash_flow || 0
      })

      setComparisonSummary({
        total_revenue: summaryData.data?.total_revenue || 0,
        total_expenses: summaryData.data?.total_expenses || 0,
        net_result: (summaryData.data?.total_revenue || 0) - (summaryData.data?.total_expenses || 0),
        cash_inflow: summaryData.data?.total_revenue || 0,
        cash_outflow: summaryData.data?.total_expenses || 0,
        net_cash_flow: summaryData.data?.net_cash_flow || 0,
        accounts_receivable: summaryData.data?.accounts_receivable || 0,
        accounts_payable: summaryData.data?.accounts_payable || 0
      })
    } catch (error) {
      console.error('Error calculating comparison indicators:', error)
    }
  }

  const loadMonthlyData = async () => {
    try {
      const { data, error} = await supabase
        .from('financial_periods')
        .select('*')
        .eq('period_type', 'monthly')
        .order('start_date', { ascending: true })
        .limit(12)

      if (error) throw error

      const dataWithSummary = await Promise.all((data || []).map(async (period) => {
        // Usar dados consolidados de todos os departamentos
        const { data: summaryData } = await supabase
          .from('v_consolidated_financial_summary')
          .select('*')
          .eq('period_id', period.id)
          .maybeSingle()

        return {
          ...period,
          ...summaryData
        }
      }))

      setMonthlyData(dataWithSummary)
    } catch (error) {
      console.error('Error loading monthly data:', error)
    }
  }

  const calculateIndicators = async () => {
    if (!selectedPeriod) return

    try {
      setCalculating(true)

      const [ebitdaData, roiData, summaryData, marginData, workingCapitalData] = await Promise.all([
        supabase.rpc('calculate_ebitda', {
          p_period_id: selectedPeriod.id,
          p_start_date: selectedPeriod.start_date,
          p_end_date: selectedPeriod.end_date
        }),
        supabase.rpc('calculate_roi', {
          p_period_id: selectedPeriod.id,
          p_start_date: selectedPeriod.start_date,
          p_end_date: selectedPeriod.end_date
        }),
        // Usar dados consolidados de todos os departamentos
        supabase
          .from('v_consolidated_financial_summary')
          .select('*')
          .eq('period_id', selectedPeriod.id)
          .maybeSingle(),
        supabase
          .from('v_margin_analysis')
          .select('*')
          .eq('period_id', selectedPeriod.id)
          .maybeSingle(),
        // Usar cálculo consolidado de capital de giro
        supabase.rpc('calculate_working_capital_consolidated', {
          p_period_id: selectedPeriod.id
        })
      ])

      setIndicators({
        ebitda: ebitdaData.data?.[0]?.ebitda || 0,
        ebitda_margin: ebitdaData.data?.[0]?.ebitda_margin || 0,
        gross_margin: marginData.data?.gross_margin_percent || 0,
        operating_margin: marginData.data?.operating_margin_percent || 0,
        net_margin: 0,
        working_capital: workingCapitalData.data?.[0]?.working_capital || 0,
        current_ratio: workingCapitalData.data?.[0]?.current_ratio || 0,
        roi: roiData.data?.[0]?.roi_percent || 0,
        operating_cash_flow: summaryData.data?.net_cash_flow || 0,
        net_cash_flow: summaryData.data?.net_cash_flow || 0
      })

      setSummary({
        total_revenue: summaryData.data?.total_revenue || 0,
        total_expenses: summaryData.data?.total_expenses || 0,
        net_result: summaryData.data?.net_result || 0,
        cash_inflow: summaryData.data?.cash_inflow || 0,
        cash_outflow: summaryData.data?.cash_outflow || 0,
        net_cash_flow: summaryData.data?.net_cash_flow || 0,
        accounts_receivable: summaryData.data?.accounts_receivable || 0,
        accounts_payable: summaryData.data?.accounts_payable || 0
      })
    } catch (error) {
      console.error('Error calculating indicators:', error)
    } finally {
      setCalculating(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (value < 0) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getIndicatorColor = (value: number, type: 'margin' | 'ratio' | 'currency') => {
    if (type === 'margin' || type === 'ratio') {
      if (value >= 20) return 'text-green-600'
      if (value >= 10) return 'text-blue-600'
      if (value >= 0) return 'text-yellow-600'
      return 'text-red-600'
    }
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  // Gráfico de Evolução Mensal
  const revenueExpenseChart = {
    labels: monthlyData.map(d => d.period_name?.split('/')[0] || ''),
    datasets: [
      {
        label: 'Receitas',
        data: monthlyData.map(d => d.total_revenue || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Despesas',
        data: monthlyData.map(d => d.total_expenses || 0),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  // Gráfico de Resultado Líquido
  const netResultChart = {
    labels: monthlyData.map(d => d.period_name?.split('/')[0] || ''),
    datasets: [
      {
        label: 'Resultado Líquido',
        data: monthlyData.map(d => d.net_result || 0),
        backgroundColor: monthlyData.map(d =>
          (d.net_result || 0) >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: monthlyData.map(d =>
          (d.net_result || 0) >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 2
      }
    ]
  }

  // Gráfico de Fluxo de Caixa
  const cashFlowChart = {
    labels: monthlyData.map(d => d.period_name?.split('/')[0] || ''),
    datasets: [
      {
        label: 'Entradas',
        data: monthlyData.map(d => d.cash_inflow || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      },
      {
        label: 'Saídas',
        data: monthlyData.map(d => d.cash_outflow || 0),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 2
      }
    ]
  }

  // Gráfico de Distribuição de Receitas vs Despesas
  const distributionChart = {
    labels: ['Receitas', 'Despesas'],
    datasets: [{
      data: [summary.total_revenue, summary.total_expenses],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2
    }]
  }

  // Gráfico de Contas a Receber/Pagar
  const accountsChart = {
    labels: ['A Receber', 'A Pagar'],
    datasets: [{
      data: [summary.accounts_receivable, summary.accounts_payable],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 146, 60, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(251, 146, 60)'
      ],
      borderWidth: 2
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            label += formatCurrency(context.parsed.y || context.parsed)
            return label
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatCurrency(value)
        }
      }
    }
  }

  const ComparisonCard = ({
    title,
    value,
    comparisonValue,
    icon: Icon,
    type = 'currency',
    description
  }: {
    title: string
    value: number
    comparisonValue?: number
    icon: any
    type?: 'currency' | 'percent' | 'ratio'
    description?: string
  }) => {
    const difference = comparisonValue !== undefined ? value - comparisonValue : 0
    const percentChange = comparisonValue !== undefined && comparisonValue !== 0
      ? ((value - comparisonValue) / Math.abs(comparisonValue)) * 100
      : 0
    const isPositive = difference > 0
    const isNegative = difference < 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {type === 'currency' ? formatCurrency(value) :
               type === 'percent' ? `${value.toFixed(2)}%` :
               value.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">Período Atual</p>
          </div>
          {comparisonValue !== undefined && (
            <>
              <div className="border-t pt-3">
                <p className="text-lg font-semibold text-gray-700">
                  {type === 'currency' ? formatCurrency(comparisonValue) :
                   type === 'percent' ? `${comparisonValue.toFixed(2)}%` :
                   comparisonValue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Período de Comparação</p>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-lg ${
                isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                {isPositive ? (
                  <ArrowUp className="h-4 w-4 text-green-600" />
                ) : isNegative ? (
                  <ArrowDown className="h-4 w-4 text-red-600" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-600" />
                )}
                <span className={`text-sm font-medium ${
                  isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-700'
                }`}>
                  {Math.abs(percentChange).toFixed(2)}% {isPositive ? 'aumento' : isNegative ? 'redução' : 'sem mudança'}
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  const IndicatorCard = ({
    title,
    value,
    icon: Icon,
    type = 'currency',
    description
  }: {
    title: string
    value: number
    icon: any
    type?: 'currency' | 'percent' | 'ratio'
    description?: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {getTrendIcon(value)}
      </div>
      <div className={`text-3xl font-bold ${getIndicatorColor(value, type === 'percent' ? 'margin' : type)}`}>
        {type === 'currency' && formatCurrency(value)}
        {type === 'percent' && formatPercent(value)}
        {type === 'ratio' && value.toFixed(2)}
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando análise financeira...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="h-10 w-10 text-blue-600" />
              Análise Financeira Avançada
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Dados consolidados: Ordens de Serviço, Estoque, Compras, Folha, Equipamentos e Lançamentos
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/financial"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard Integrado
            </Link>
            <button
              onClick={calculateIndicators}
              disabled={calculating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
              Recalcular
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Seletor de Período Avançado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Título */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Seleção de Período</h3>
              </div>
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  comparisonMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {comparisonMode ? 'Modo Comparação Ativo' : 'Ativar Comparação'}
              </button>
            </div>

            {/* Seletores de Mês e Ano */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Período Principal */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Período Principal
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mês</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="01">Janeiro</option>
                      <option value="02">Fevereiro</option>
                      <option value="03">Março</option>
                      <option value="04">Abril</option>
                      <option value="05">Maio</option>
                      <option value="06">Junho</option>
                      <option value="07">Julho</option>
                      <option value="08">Agosto</option>
                      <option value="09">Setembro</option>
                      <option value="10">Outubro</option>
                      <option value="11">Novembro</option>
                      <option value="12">Dezembro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ano</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedPeriod && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    Analisando: <span className="font-semibold text-blue-700">{selectedPeriod.period_name}</span>
                  </div>
                )}
              </div>

              {/* Período de Comparação */}
              {comparisonMode && (
                <div className="space-y-4 border-l-2 border-blue-200 pl-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Comparar Com
                  </label>
                  <select
                    value={comparisonPeriod?.id || ''}
                    onChange={(e) => {
                      const period = periods.find(p => p.id === e.target.value)
                      setComparisonPeriod(period || null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um período</option>
                    {periods
                      .filter(p => p.id !== selectedPeriod?.id)
                      .map(period => (
                        <option key={period.id} value={period.id}>
                          {period.period_name}
                        </option>
                      ))}
                  </select>
                  {comparisonPeriod && (
                    <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                      Comparando com: <span className="font-semibold text-green-700">{comparisonPeriod.period_name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Indicadores Principais */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
            Indicadores de Rentabilidade
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <IndicatorCard
              title="EBITDA"
              value={indicators.ebitda}
              icon={Zap}
              type="currency"
              description="Lucro operacional"
            />
            <IndicatorCard
              title="Margem EBITDA"
              value={indicators.ebitda_margin}
              icon={TrendingUp}
              type="percent"
              description="% sobre receita"
            />
            <IndicatorCard
              title="Margem Bruta"
              value={indicators.gross_margin}
              icon={PieChart}
              type="percent"
              description="Receita - Custos"
            />
            <IndicatorCard
              title="Margem Operacional"
              value={indicators.operating_margin}
              icon={BarChart3}
              type="percent"
              description="Eficiência operacional"
            />
          </div>
        </div>

        {/* Capital de Giro e Performance */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-blue-600" />
            Capital de Giro e Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <IndicatorCard
              title="Capital de Giro"
              value={indicators.working_capital}
              icon={Activity}
              type="currency"
              description="Recursos para operação"
            />
            <IndicatorCard
              title="Liquidez Corrente"
              value={indicators.current_ratio}
              icon={TrendingUp}
              type="ratio"
              description="Capacidade de pagamento"
            />
            <IndicatorCard
              title="ROI"
              value={indicators.roi}
              icon={Target}
              type="percent"
              description="Retorno do investimento"
            />
            <IndicatorCard
              title="Fluxo de Caixa"
              value={indicators.net_cash_flow}
              icon={DollarSign}
              type="currency"
              description="Variação do caixa"
            />
          </div>
        </div>

        {/* Gráficos Dinâmicos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução Mensal */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-600" />
              Evolução de Receitas e Despesas
            </h3>
            <div className="h-80">
              <Line data={revenueExpenseChart} options={chartOptions} />
            </div>
          </div>

          {/* Resultado Líquido */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart className="h-5 w-5 text-green-600" />
              Resultado Líquido Mensal
            </h3>
            <div className="h-80">
              <Bar data={netResultChart} options={chartOptions} />
            </div>
          </div>

          {/* Fluxo de Caixa */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Fluxo de Caixa (Entradas vs Saídas)
            </h3>
            <div className="h-80">
              <Bar data={cashFlowChart} options={chartOptions} />
            </div>
          </div>

          {/* Distribuição */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-orange-600" />
              Distribuição do Período
            </h3>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={distributionChart}
                options={{
                  ...chartOptions,
                  scales: undefined
                }}
              />
            </div>
          </div>
        </div>

        {/* Contas a Receber/Pagar */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="h-6 w-6 text-indigo-600" />
            Contas a Receber vs A Pagar
          </h3>
          <div className="h-96 flex items-center justify-center">
            <Pie
              data={accountsChart}
              options={{
                ...chartOptions,
                scales: undefined
              }}
            />
          </div>
        </div>

        {/* Guia Explicativo */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-blue-100 rounded-xl">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-900 mb-4">
                Sobre os Indicadores Financeiros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p className="font-semibold mb-2">📊 EBITDA</p>
                  <p>Mede o desempenho operacional antes de custos financeiros e contábeis</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">📈 Margens</p>
                  <p>Indicam a eficiência na conversão de receita em lucro</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">💰 Capital de Giro</p>
                  <p>Recursos disponíveis para as operações do dia a dia</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">🎯 ROI</p>
                  <p>Eficiência dos investimentos realizados pela empresa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinancialAnalysis
