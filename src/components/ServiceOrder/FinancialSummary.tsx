import React from 'react'
import { DollarSign, TrendingUp, Package, Users, AlertCircle } from 'lucide-react'

interface FinancialSummaryProps {
  subtotal: number
  desconto: number
  descontoPercentual: number
  custoTotal: number
  total: number
  lucroTotal: number
  margemLucro: number
  onDescontoChange: (valor: number, percentual: number) => void
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  subtotal,
  desconto,
  descontoPercentual,
  custoTotal,
  total,
  lucroTotal,
  margemLucro,
  onDescontoChange
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleDescontoValorChange = (valor: number) => {
    const percentual = subtotal > 0 ? (valor / subtotal) * 100 : 0
    onDescontoChange(valor, percentual)
  }

  const handleDescontoPercentualChange = (percentual: number) => {
    const valor = (subtotal * percentual) / 100
    onDescontoChange(valor, percentual)
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border-2 border-green-300 sticky top-4">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <DollarSign className="h-6 w-6 text-green-600" />
        Resumo Financeiro
      </h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-green-200">
          <span className="text-gray-700">Subtotal</span>
          <span className="font-semibold text-lg">{formatCurrency(subtotal)}</span>
        </div>

        <div className="bg-white rounded-lg p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">Desconto</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Valor (R$)</label>
              <input
                type="number"
                value={desconto.toFixed(2)}
                onChange={(e) => handleDescontoValorChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                min="0"
                max={subtotal}
                step="0.01"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Percentual (%)</label>
              <input
                type="number"
                value={descontoPercentual.toFixed(2)}
                onChange={(e) => handleDescontoPercentualChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {desconto > 0 && (
          <div className="flex justify-between items-center py-2 text-red-600">
            <span>Desconto Aplicado</span>
            <span className="font-semibold">- {formatCurrency(desconto)}</span>
          </div>
        )}

        <div className="flex justify-between items-center py-3 border-t-2 border-green-300">
          <span className="font-bold text-gray-900">TOTAL</span>
          <span className="font-bold text-2xl text-green-600">{formatCurrency(total)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-green-200">
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-700 font-medium">Custo Total</span>
            </div>
            <p className="font-bold text-red-700">{formatCurrency(custoTotal)}</p>
          </div>

          <div className="bg-green-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-700" />
              <span className="text-xs text-green-700 font-medium">Lucro</span>
            </div>
            <p className="font-bold text-green-700">{formatCurrency(lucroTotal)}</p>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${
          margemLucro < 20 ? 'bg-red-100 border-red-300' :
          margemLucro < 40 ? 'bg-yellow-100 border-yellow-300' :
          'bg-green-100 border-green-300'
        } border-2`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {margemLucro < 20 && <AlertCircle className="h-4 w-4 text-red-600" />}
                <span className="text-sm font-medium">Margem de Lucro</span>
              </div>
              <p className={`text-2xl font-bold ${
                margemLucro < 20 ? 'text-red-700' :
                margemLucro < 40 ? 'text-yellow-700' :
                'text-green-700'
              }`}>
                {margemLucro.toFixed(1)}%
              </p>
            </div>
            <div className="text-right text-xs">
              {margemLucro < 20 && (
                <span className="text-red-600 font-medium">⚠️ Margem baixa</span>
              )}
              {margemLucro >= 20 && margemLucro < 40 && (
                <span className="text-yellow-600 font-medium">⚡ Margem razoável</span>
              )}
              {margemLucro >= 40 && (
                <span className="text-green-600 font-medium">✅ Margem boa</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-xs text-blue-700">
            <strong>💡 Dica:</strong> Margem ideal entre 30-50% para serviços
          </p>
        </div>
      </div>
    </div>
  )
}
