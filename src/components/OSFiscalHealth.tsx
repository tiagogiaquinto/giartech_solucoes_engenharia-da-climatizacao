import React, { useState } from 'react'
import {
  DollarSign, TrendingUp, AlertTriangle, ChevronDown, ChevronUp,
  FileBarChart, Shield, CheckCircle
} from 'lucide-react'
import { calcFiscal, RegimeTributario, REGIME_LABELS } from '../utils/fiscalEngine'

interface OSFiscalHealthProps {
  totalValue: number
  custoMateriais?: number
  custoMaoObra?: number
  regime?: RegimeTributario
  onRegimeChange?: (r: RegimeTributario) => void
  issPct?: number
  compact?: boolean
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const pctColor = (pct: number) =>
  pct >= 30 ? 'text-green-700' : pct >= 15 ? 'text-amber-600' : 'text-red-700'

const pctBg = (pct: number) =>
  pct >= 30 ? 'bg-green-500' : pct >= 15 ? 'bg-amber-400' : 'bg-red-500'

export const OSFiscalHealth: React.FC<OSFiscalHealthProps> = ({
  totalValue,
  custoMateriais = 0,
  custoMaoObra = 0,
  regime = 'lucro_presumido',
  onRegimeChange,
  issPct = 5,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(!compact)
  const f = calcFiscal(totalValue, custoMateriais, custoMaoObra, issPct, regime)

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800 text-sm">Saúde Financeira da OS</p>
            <p className="text-xs text-gray-500">{REGIME_LABELS[regime]}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500">Lucro Líquido</p>
            <p className={`font-bold text-base ${pctColor(f.margemLiquida)}`}>
              {fmt(f.lucroLiquido)}
            </p>
          </div>
          {compact && (
            expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-5 space-y-4">
          {/* Regime Selector */}
          {onRegimeChange && (
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(Object.keys(REGIME_LABELS) as RegimeTributario[]).map(r => (
                <button
                  key={r}
                  onClick={() => onRegimeChange(r)}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                    regime === r
                      ? 'bg-white shadow text-gray-800'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {r === 'lucro_presumido' ? 'L. Presumido' :
                   r === 'simples_nacional' ? 'Simples' : 'L. Real'}
                </button>
              ))}
            </div>
          )}

          {/* Main waterfall */}
          <div className="space-y-2.5">
            {/* Valor Bruto */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-700">Valor Bruto</span>
              </div>
              <span className="font-semibold text-gray-900">{fmt(f.valorBruto)}</span>
            </div>

            {/* Tax deductions */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5 mb-2">
                <FileBarChart className="h-3.5 w-3.5" />
                Retenção de Impostos ({f.totalImpostosPct}%)
              </p>
              {[
                { label: `PIS (0.65%)`, val: f.pis },
                { label: `COFINS (3%)`, val: f.cofins },
                { label: `ISS (${issPct}%)`, val: f.iss },
                { label: regime !== 'simples_nacional' ? `IRPJ (4.8% pres.)` : null, val: f.irpj },
                { label: regime !== 'simples_nacional' ? `CSLL (2.88% pres.)` : null, val: f.csll },
              ].filter(i => i.label && i.val > 0).map(i => (
                <div key={i.label!} className="flex justify-between text-xs">
                  <span className="text-red-500">{i.label}</span>
                  <span className="text-red-600 font-medium">- {fmt(i.val)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold border-t border-red-200 pt-1.5 mt-1.5">
                <span className="text-red-700">Total Impostos</span>
                <span className="text-red-700">- {fmt(f.totalImpostos)}</span>
              </div>
            </div>

            {/* Cost deductions */}
            {(f.custoMateriais > 0 || f.custoMaoObra > 0) && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold text-orange-600 mb-2">Custos Operacionais</p>
                {f.custoMateriais > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-500">Materiais</span>
                    <span className="text-orange-600 font-medium">- {fmt(f.custoMateriais)}</span>
                  </div>
                )}
                {f.custoMaoObra > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-500">Mão de Obra</span>
                    <span className="text-orange-600 font-medium">- {fmt(f.custoMaoObra)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t-2 border-dashed border-gray-200 pt-2" />

            {/* Net Profit */}
            <div className={`rounded-xl p-4 ${
              f.margemLiquida >= 30 ? 'bg-green-50 border border-green-200' :
              f.margemLiquida >= 15 ? 'bg-amber-50 border border-amber-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {f.margemLiquida >= 30
                    ? <CheckCircle className="h-4 w-4 text-green-600" />
                    : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                  <span className="text-sm font-semibold text-gray-800">Lucro Real da OS</span>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${pctColor(f.margemLiquida)}`}>
                    {fmt(f.lucroLiquido)}
                  </p>
                  <p className={`text-xs font-medium ${pctColor(f.margemLiquida)}`}>
                    Margem: {f.margemLiquida.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pctBg(f.margemLiquida)}`}
                  style={{ width: `${Math.min(100, Math.max(0, f.margemLiquida))}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1.5 text-gray-500">
                <span>0%</span>
                <span className={
                  f.margemLiquida >= 30 ? 'text-green-600 font-medium' :
                  f.margemLiquida >= 15 ? 'text-amber-500 font-medium' :
                  'text-red-500 font-medium'
                }>
                  {f.margemLiquida >= 30 ? 'Margem saudável' :
                   f.margemLiquida >= 15 ? 'Margem razoável' :
                   'Margem baixa'}
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="text-center bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Impostos</p>
                <p className="text-sm font-bold text-red-600">{f.totalImpostosPct}%</p>
              </div>
              <div className="text-center bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Custos</p>
                <p className="text-sm font-bold text-orange-600">
                  {f.valorBruto > 0
                    ? ((((f.custoMateriais + f.custoMaoObra) / f.valorBruto) * 100)).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
              <div className="text-center bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Margem</p>
                <p className={`text-sm font-bold ${pctColor(f.margemLiquida)}`}>
                  {f.margemLiquida.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
