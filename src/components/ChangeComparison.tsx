import { motion } from 'framer-motion'
import { ArrowRight, AlertTriangle, Info, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface Change {
  field: string
  label: string
  oldValue: any
  newValue: any
  type: 'text' | 'number' | 'currency' | 'date' | 'status'
  impact?: 'positive' | 'negative' | 'neutral'
}

interface ChangeComparisonProps {
  changes: Change[]
  reason?: string
  showImpactAnalysis?: boolean
  onApprove?: () => void
  onReject?: () => void
}

export const ChangeComparison = ({
  changes,
  reason,
  showImpactAnalysis = true,
  onApprove,
  onReject
}: ChangeComparisonProps) => {
  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined || value === '') return 'Vazio'

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(Number(value))

      case 'number':
        return new Intl.NumberFormat('pt-BR').format(Number(value))

      case 'date':
        return new Date(value).toLocaleDateString('pt-BR')

      case 'status':
        const statusLabels: Record<string, string> = {
          'pending': 'Pendente',
          'in_progress': 'Em Andamento',
          'completed': 'Concluída',
          'cancelled': 'Cancelada'
        }
        return statusLabels[value] || value

      default:
        return String(value)
    }
  }

  const getImpactIcon = (impact?: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'positive':
        return 'border-green-200 bg-green-50'
      case 'negative':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const significantChanges = changes.filter(change => {
    if (change.type === 'currency' || change.type === 'number') {
      const diff = Math.abs(Number(change.newValue) - Number(change.oldValue))
      const oldVal = Number(change.oldValue) || 1
      const percentChange = (diff / oldVal) * 100
      return percentChange > 10
    }
    return true
  })

  const hasSignificantFinancialChange = significantChanges.some(
    c => c.type === 'currency' && c.impact === 'negative'
  )

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
      <div className={`p-6 ${hasSignificantFinancialChange ? 'bg-yellow-50 border-b-4 border-yellow-400' : 'bg-gray-50 border-b'}`}>
        <div className="flex items-start gap-4">
          {hasSignificantFinancialChange && (
            <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Comparação de Alterações
            </h3>
            {hasSignificantFinancialChange && (
              <p className="text-yellow-800 font-medium mb-2">
                ⚠️ Esta alteração possui impacto financeiro significativo
              </p>
            )}
            {reason && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 mt-3">
                <div className="text-sm font-semibold text-gray-700 mb-1">Justificativa:</div>
                <div className="text-gray-900">{reason}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y">
        {changes.map((change, index) => (
          <motion.div
            key={change.field}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-6 ${getImpactColor(change.impact)}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getImpactIcon(change.impact)}
              </div>

              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-3">{change.label}</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                      Antes
                    </div>
                    <div className="bg-white border-2 border-red-200 rounded-lg p-4">
                      <div className="text-lg font-semibold text-red-700">
                        {formatValue(change.oldValue, change.type)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                      Depois
                    </div>
                    <div className="bg-white border-2 border-green-200 rounded-lg p-4">
                      <div className="text-lg font-semibold text-green-700">
                        {formatValue(change.newValue, change.type)}
                      </div>
                    </div>
                  </div>
                </div>

                {(change.type === 'currency' || change.type === 'number') && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Diferença:</span>
                    {(() => {
                      const diff = Number(change.newValue) - Number(change.oldValue)
                      const percentChange = Number(change.oldValue) !== 0
                        ? ((diff / Number(change.oldValue)) * 100).toFixed(1)
                        : '∞'

                      return (
                        <span className={`font-semibold ${diff > 0 ? 'text-green-700' : diff < 0 ? 'text-red-700' : 'text-gray-700'}`}>
                          {diff > 0 ? '+' : ''}
                          {change.type === 'currency'
                            ? new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(Math.abs(diff))
                            : Math.abs(diff).toLocaleString('pt-BR')}
                          {percentChange !== '∞' && ` (${diff > 0 ? '+' : ''}${percentChange}%)`}
                        </span>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {showImpactAnalysis && significantChanges.length > 0 && (
        <div className="p-6 bg-gray-50 border-t">
          <h4 className="font-semibold text-gray-900 mb-3">Análise de Impacto</h4>
          <div className="space-y-2">
            {significantChanges.some(c => c.type === 'currency') && (
              <div className="flex items-start gap-2 text-sm">
                <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Impacto Financeiro: </span>
                  <span className="text-gray-700">
                    Alterações nos valores podem afetar o faturamento e margens de lucro
                  </span>
                </div>
              </div>
            )}

            {hasSignificantFinancialChange && (
              <div className="flex items-start gap-2 text-sm text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-lg p-3 mt-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Atenção: </span>
                  <span>
                    Alterações financeiras significativas podem requerer aprovação do cliente
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(onApprove || onReject) && (
        <div className="p-6 bg-gray-50 border-t flex items-center justify-end gap-3">
          {onReject && (
            <button
              onClick={onReject}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar Alteração
            </button>
          )}
          {onApprove && (
            <button
              onClick={onApprove}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirmar Alteração
            </button>
          )}
        </div>
      )}
    </div>
  )
}
