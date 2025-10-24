import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface CalculationPanelProps {
  subtotal: number
  discount: number
  total: number
  costMaterials: number
  costLabor: number
  totalCost: number
  profit: number
  margin: number
  className?: string
}

export const RealtimeCalculationPanel = ({
  subtotal,
  discount,
  total,
  costMaterials,
  costLabor,
  totalCost,
  profit,
  margin,
  className = ''
}: CalculationPanelProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return 'text-green-600'
    if (margin >= 15) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMarginBgColor = (margin: number) => {
    if (margin >= 30) return 'bg-green-50 border-green-200'
    if (margin >= 15) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getMarginIcon = (margin: number) => {
    if (margin >= 30) return <CheckCircle className="w-5 h-5" />
    if (margin >= 15) return <Info className="w-5 h-5" />
    return <AlertTriangle className="w-5 h-5" />
  }

  const getMarginMessage = (margin: number) => {
    if (margin >= 30) return 'Margem excelente!'
    if (margin >= 15) return 'Margem adequada'
    return 'Margem baixa - Atenção!'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white border border-gray-200 rounded-lg p-6 shadow-lg ${className}`}
    >
      <div className="flex items-center gap-2 mb-4 pb-4 border-b">
        <DollarSign className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Análise Financeira</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Desconto</span>
              <span className="font-medium text-red-600">- {formatCurrency(discount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Custos</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Materiais</span>
              <span className="font-medium text-gray-900">{formatCurrency(costMaterials)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Mão de Obra</span>
              <span className="font-medium text-gray-900">{formatCurrency(costLabor)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold text-gray-700">Custo Total</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>

        <motion.div
          key={margin}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className={`p-4 rounded-lg border-2 ${getMarginBgColor(margin)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={getMarginColor(margin)}>
                {getMarginIcon(margin)}
              </div>
              <span className="font-semibold text-gray-900">Lucro</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(profit)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{getMarginMessage(margin)}</span>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${getMarginColor(margin)}`}>
                {margin.toFixed(1)}%
              </div>
              {margin >= 15 ? (
                <TrendingUp className={`w-5 h-5 ${getMarginColor(margin)}`} />
              ) : (
                <TrendingDown className={`w-5 h-5 ${getMarginColor(margin)}`} />
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-current/20">
            <div className="flex gap-2 text-xs">
              <div className="flex-1">
                <div className="text-gray-600 mb-1">Distribuição</div>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200">
                  <div
                    className="bg-blue-500"
                    style={{ width: `${total > 0 ? (costMaterials / total) * 100 : 0}%` }}
                    title="Materiais"
                  />
                  <div
                    className="bg-purple-500"
                    style={{ width: `${total > 0 ? (costLabor / total) * 100 : 0}%` }}
                    title="Mão de Obra"
                  />
                  <div
                    className="bg-green-500"
                    style={{ width: `${total > 0 ? (profit / total) * 100 : 0}%` }}
                    title="Lucro"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {margin < 15 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <div className="font-semibold mb-1">Margem Abaixo do Recomendado</div>
                <p className="text-xs">
                  Considere aumentar o valor ou reduzir custos. Margem ideal: 30% ou mais.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {margin >= 30 && profit > 1000 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3"
          >
            <div className="flex gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <div className="font-semibold mb-1">Excelente Negócio!</div>
                <p className="text-xs">
                  Margem saudável e lucro acima da média. Continue assim!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
