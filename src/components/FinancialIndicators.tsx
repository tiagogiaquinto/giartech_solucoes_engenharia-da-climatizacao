import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Period {
  id: string
  period_name: string
  period_type: string
  start_date: string
  end_date: string
}

interface IndicatorsData {
  ebitda: number
  ebitda_margin: number
  gross_margin: number
  operating_margin: number
  working_capital: number
  current_ratio: number
  roi: number
  net_cash_flow: number
}

const FinancialIndicators = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [periods, setPeriods] = useState<Period[]>([])
  const [indicators, setIndicators] = useState<IndicatorsData>({
    ebitda: 0,
    ebitda_margin: 0,
    gross_margin: 0,
    operating_margin: 0,
    working_capital: 0,
    current_ratio: 0,
    roi: 0,
    net_cash_flow: 0
  })
  const [calculating, setCalculating] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    loadPeriods()
  }, [])

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
        .order('start_date', { ascending: false })
        .limit(12)

      if (error) throw error

      setPeriods(data || [])
      if (data && data.length > 0) {
        const currentMonth = data.find(p => p.period_type === 'monthly')
        setSelectedPeriod(currentMonth || data[0])
      }
    } catch (error) {
      console.error('Error loading periods:', error)
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
        supabase
          .from('v_financial_summary')
          .select('*')
          .eq('period_id', selectedPeriod.id)
          .maybeSingle(),
        supabase
          .from('v_margin_analysis')
          .select('*')
          .eq('period_id', selectedPeriod.id)
          .maybeSingle(),
        supabase
          .from('v_working_capital')
          .select('*')
          .eq('period_id', selectedPeriod.id)
          .maybeSingle()
      ])

      setIndicators({
        ebitda: ebitdaData.data?.[0]?.ebitda || 0,
        ebitda_margin: ebitdaData.data?.[0]?.ebitda_margin || 0,
        gross_margin: marginData.data?.gross_margin_percent || 0,
        operating_margin: marginData.data?.operating_margin_percent || 0,
        working_capital: workingCapitalData.data?.working_capital || 0,
        current_ratio: workingCapitalData.data?.current_ratio || 0,
        roi: roiData.data?.[0]?.roi_percent || 0,
        net_cash_flow: summaryData.data?.net_cash_flow || 0
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
      currency: 'BRL'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-3 w-3 text-green-600" />
    if (value < 0) return <ArrowDown className="h-3 w-3 text-red-600" />
    return <Minus className="h-3 w-3 text-gray-400" />
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

  const IndicatorCard = ({
    title,
    value,
    icon: Icon,
    type = 'currency',
    compact = false
  }: {
    title: string
    value: number
    icon: any
    type?: 'currency' | 'percent' | 'ratio'
    compact?: boolean
  }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
          <h4 className="text-xs font-medium text-gray-600">{title}</h4>
        </div>
        {getTrendIcon(value)}
      </div>
      <div className={`font-bold ${getIndicatorColor(value, type === 'percent' ? 'margin' : type)} ${compact ? 'text-lg' : 'text-2xl'}`}>
        {type === 'currency' && formatCurrency(value)}
        {type === 'percent' && formatPercent(value)}
        {type === 'ratio' && value.toFixed(2)}
      </div>
    </div>
  )

  if (!expanded) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Indicadores Financeiros Avançados
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedPeriod ? `Período: ${selectedPeriod.period_name}` : 'Carregando...'}
            </p>
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Ver Análise Completa
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Análise Financeira Avançada
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Indicadores de performance e saúde financeira
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod?.id || ''}
            onChange={(e) => {
              const period = periods.find(p => p.id === e.target.value)
              setSelectedPeriod(period || null)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {periods.map(period => (
              <option key={period.id} value={period.id}>
                {period.period_name}
              </option>
            ))}
          </select>
          <button
            onClick={calculateIndicators}
            disabled={calculating}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setExpanded(false)}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            Minimizar
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Rentabilidade
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <IndicatorCard
              title="EBITDA"
              value={indicators.ebitda}
              icon={Zap}
              type="currency"
              compact
            />
            <IndicatorCard
              title="Margem EBITDA"
              value={indicators.ebitda_margin}
              icon={TrendingUp}
              type="percent"
              compact
            />
            <IndicatorCard
              title="Margem Bruta"
              value={indicators.gross_margin}
              icon={PieChart}
              type="percent"
              compact
            />
            <IndicatorCard
              title="Margem Operacional"
              value={indicators.operating_margin}
              icon={BarChart3}
              type="percent"
              compact
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Capital e Performance
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <IndicatorCard
              title="Capital de Giro"
              value={indicators.working_capital}
              icon={Activity}
              type="currency"
              compact
            />
            <IndicatorCard
              title="Liquidez Corrente"
              value={indicators.current_ratio}
              icon={TrendingUp}
              type="ratio"
              compact
            />
            <IndicatorCard
              title="ROI"
              value={indicators.roi}
              icon={Target}
              type="percent"
              compact
            />
            <IndicatorCard
              title="Fluxo de Caixa"
              value={indicators.net_cash_flow}
              icon={DollarSign}
              type="currency"
              compact
            />
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-800 space-y-1">
            <p><strong>EBITDA:</strong> Lucro operacional antes de juros, impostos, depreciação e amortização</p>
            <p><strong>Margens:</strong> Indicam eficiência na conversão de receita em lucro</p>
            <p><strong>Capital de Giro:</strong> Recursos disponíveis para operação diária</p>
            <p><strong>ROI:</strong> Retorno sobre investimento realizado</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default FinancialIndicators
