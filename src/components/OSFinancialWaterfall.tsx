import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Package, Users, Receipt, RefreshCw } from 'lucide-react'
import { loadFiscalConfig, calcFiscal, REGIME_LABELS, type FiscalConfig, type RegimeTributario } from '../utils/fiscalEngine'
import { FiscalConfigPanel } from './FiscalConfigPanel'

interface OSFinancialWaterfallProps {
  orderId: string
  grossValue: number
  materialsTotal: number
  laborTotal: number
  regime?: RegimeTributario
  showConfig?: boolean
  isAdmin?: boolean
}

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

interface WaterfallRow {
  label: string
  value: number
  running: number
  type: 'start' | 'deduct' | 'result'
  icon: React.ReactNode
  subRows?: Array<{ label: string; value: number; pctOfGross: number }>
  pctOfGross?: number
  color: string
  bgColor: string
}

export function OSFinancialWaterfall({
  orderId,
  grossValue,
  materialsTotal,
  laborTotal,
  regime: regimeProp,
  showConfig = false,
  isAdmin = false,
}: OSFinancialWaterfallProps) {
  const [config, setConfig] = useState<FiscalConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadFiscalConfig().then(cfg => {
      setConfig(cfg)
      setLoading(false)
    })
  }, [])

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Calculando...</span>
      </div>
    )
  }

  const regime = regimeProp || config.regime_tributario
  const breakdown = calcFiscal(grossValue, materialsTotal, laborTotal, config.iss_pct, regime, config)

  const margin = breakdown.margemLiquida
  const marginColor =
    margin >= config.margem_boa_pct ? 'text-emerald-700' :
    margin >= config.margem_alerta_pct ? 'text-amber-600' : 'text-red-600'
  const marginBg =
    margin >= config.margem_boa_pct ? 'bg-emerald-50 border-emerald-200' :
    margin >= config.margem_alerta_pct ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  const rows: WaterfallRow[] = [
    {
      label: 'Valor Bruto (Serviços)',
      value: grossValue,
      running: grossValue,
      type: 'start',
      icon: <Receipt className="h-4 w-4" />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      pctOfGross: 100,
    },
    {
      label: 'Impostos',
      value: -breakdown.totalImpostos,
      running: grossValue - breakdown.totalImpostos,
      type: 'deduct',
      icon: <Receipt className="h-4 w-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      pctOfGross: breakdown.totalImpostosPct,
      subRows: [
        { label: `ISS (${config.iss_pct}%)`, value: -breakdown.iss, pctOfGross: breakdown.iss > 0 ? (breakdown.iss / grossValue) * 100 : 0 },
        { label: `PIS (${config.pis_pct}%)`, value: -breakdown.pis, pctOfGross: breakdown.pis > 0 ? (breakdown.pis / grossValue) * 100 : 0 },
        { label: `COFINS (${config.cofins_pct}%)`, value: -breakdown.cofins, pctOfGross: breakdown.cofins > 0 ? (breakdown.cofins / grossValue) * 100 : 0 },
        { label: `IRPJ (${config.irpj_pct}%)`, value: -breakdown.irpj, pctOfGross: breakdown.irpj > 0 ? (breakdown.irpj / grossValue) * 100 : 0 },
        { label: `CSLL (${config.csll_pct}%)`, value: -breakdown.csll, pctOfGross: breakdown.csll > 0 ? (breakdown.csll / grossValue) * 100 : 0 },
      ].filter(r => r.value !== 0),
    },
    {
      label: 'Custo de Materiais',
      value: -materialsTotal,
      running: grossValue - breakdown.totalImpostos - materialsTotal,
      type: 'deduct',
      icon: <Package className="h-4 w-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      pctOfGross: grossValue > 0 ? (materialsTotal / grossValue) * 100 : 0,
    },
    {
      label: 'Custo de Mão de Obra',
      value: -laborTotal,
      running: breakdown.lucroLiquido,
      type: 'deduct',
      icon: <Users className="h-4 w-4" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      pctOfGross: grossValue > 0 ? (laborTotal / grossValue) * 100 : 0,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Waterfall Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Demonstração de Resultado da OS</p>
              <p className="text-xs text-gray-500">{REGIME_LABELS[regime]}</p>
            </div>
          </div>
          {grossValue === 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
              Adicione serviços para calcular
            </span>
          )}
        </div>

        <div className="divide-y divide-gray-50">
          {rows.map((row, idx) => (
            <div key={idx}>
              <button
                className={`w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors ${row.bgColor} border-l-4 ${
                  idx === 0 ? 'border-l-blue-500' :
                  row.label.includes('Impostos') ? 'border-l-red-400' :
                  row.label.includes('Material') ? 'border-l-orange-400' :
                  'border-l-amber-400'
                }`}
                onClick={() => row.subRows && setExpanded(e => ({ ...e, [idx]: !e[idx] }))}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={row.color}>{row.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{row.label}</p>
                      {row.pctOfGross !== undefined && grossValue > 0 && (
                        <p className="text-xs text-gray-500">
                          {row.type === 'start' ? '100% do bruto' : `${row.pctOfGross.toFixed(1)}% do bruto`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${row.color}`}>
                      {row.type === 'start' ? fmt(row.value) : row.value === 0 ? '—' : `- ${fmt(Math.abs(row.value))}`}
                    </p>
                    {row.type !== 'start' && (
                      <p className="text-xs text-gray-500">Restante: {fmt(row.running)}</p>
                    )}
                  </div>
                </div>
              </button>

              {row.subRows && expanded[idx] && (
                <div className="pl-10 pr-5 py-2 bg-white space-y-1 border-l-4 border-l-red-200">
                  {row.subRows.map((sub, si) => (
                    <div key={si} className="flex items-center justify-between py-1">
                      <p className="text-xs text-gray-600">{sub.label}</p>
                      <div className="text-right">
                        <p className="text-xs font-medium text-red-600">- {fmt(Math.abs(sub.value))}</p>
                        <p className="text-xs text-gray-400">{sub.pctOfGross.toFixed(2)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Net Profit result row */}
        <div className={`px-5 py-4 border-t-2 border-gray-200 ${marginBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {margin >= config.margem_alerta_pct ? (
                <TrendingUp className={`h-5 w-5 ${marginColor}`} />
              ) : (
                <TrendingDown className={`h-5 w-5 ${marginColor}`} />
              )}
              <div>
                <p className="text-sm font-bold text-gray-900">Lucro Líquido Real</p>
                <p className="text-xs text-gray-500">
                  Após impostos + materiais + mão de obra
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${marginColor}`}>
                {fmt(breakdown.lucroLiquido)}
              </p>
              <p className={`text-sm font-semibold ${marginColor}`}>
                Margem: {breakdown.margemLiquida.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Margin progress bar */}
          {grossValue > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    margin >= config.margem_boa_pct ? 'bg-emerald-500' :
                    margin >= config.margem_alerta_pct ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, margin))}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                <span>0%</span>
                <span className={`font-medium ${marginColor}`}>
                  {margin >= config.margem_boa_pct
                    ? 'Margem saudável'
                    : margin >= config.margem_alerta_pct
                    ? 'Margem razoável'
                    : 'Margem baixa — revise custos'}
                </span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick KPIs */}
      {grossValue > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Faturamento Bruto', value: fmt(grossValue), color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Carga Tributária', value: `${breakdown.totalImpostosPct.toFixed(1)}%`, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Total de Custos', value: fmt(materialsTotal + laborTotal), color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Margem Líquida', value: `${breakdown.margemLiquida.toFixed(1)}%`, color: marginColor, bg: marginBg.split(' ')[0] },
          ].map((kpi, i) => (
            <div key={i} className={`${kpi.bg} rounded-xl p-4 border border-gray-200`}>
              <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
              <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Margin alert */}
      {grossValue > 0 && margin < config.margem_alerta_pct && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-semibold">Margem crítica detectada ({breakdown.margemLiquida.toFixed(1)}%)</p>
            <p className="mt-0.5">
              Sua margem está abaixo de {config.margem_alerta_pct}%. Verifique os custos de materiais e mão de obra ou
              ajuste o valor do serviço.
            </p>
          </div>
        </div>
      )}

      {/* Fiscal Config Panel (admin only or when showConfig) */}
      {(showConfig || isAdmin) && (
        <FiscalConfigPanel readOnly={!isAdmin} />
      )}
    </div>
  )
}
