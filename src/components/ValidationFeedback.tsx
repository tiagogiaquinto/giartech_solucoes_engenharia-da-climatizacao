import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Info, XCircle, Lightbulb } from 'lucide-react'

interface ValidationMessage {
  field: string
  message: string
  type: 'error' | 'warning' | 'info' | 'success'
  suggestion?: string
}

interface ValidationFeedbackProps {
  messages: ValidationMessage[]
  showFieldNames?: boolean
  className?: string
  compact?: boolean
}

export const ValidationFeedback = ({
  messages,
  showFieldNames = false,
  className = '',
  compact = false
}: ValidationFeedbackProps) => {
  if (messages.length === 0) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5" />
      case 'warning':
        return <AlertCircle className="w-5 h-5" />
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'info':
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'success':
        return 'text-green-600'
      case 'info':
      default:
        return 'text-blue-600'
    }
  }

  const getLabel = (type: string) => {
    const labels: Record<string, string> = {
      error: 'Erro',
      warning: 'Aviso',
      success: 'Sucesso',
      info: 'Informação'
    }
    return labels[type] || type
  }

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      customer_id: 'Cliente',
      description: 'Descrição',
      scheduled_at: 'Data Agendada',
      prazo_execucao_dias: 'Prazo de Execução',
      total_value: 'Valor Total',
      profit_margin: 'Margem de Lucro',
      service_items: 'Serviços',
      materials: 'Materiais',
      labor: 'Mão de Obra',
      geral: 'Geral'
    }
    return labels[field] || field
  }

  if (compact) {
    // Versão compacta - apenas ícones e contadores
    const errorCount = messages.filter(m => m.type === 'error').length
    const warningCount = messages.filter(m => m.type === 'warning').length
    const infoCount = messages.filter(m => m.type === 'info').length

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {errorCount > 0 && (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{errorCount}</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{warningCount}</span>
          </div>
        )}
        {infoCount > 0 && (
          <div className="flex items-center gap-1 text-blue-600">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">{infoCount}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <AnimatePresence>
        {messages.map((msg, index) => (
          <motion.div
            key={`${msg.field}-${msg.type}-${index}`}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`border-2 rounded-lg overflow-hidden ${getColor(msg.type)}`}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 mt-0.5 ${getIconColor(msg.type)}`}>
                  {getIcon(msg.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">
                      {getLabel(msg.type)}
                    </span>
                    {showFieldNames && msg.field !== 'geral' && (
                      <>
                        <span className="text-xs">•</span>
                        <span className="text-xs font-medium opacity-75">
                          {getFieldLabel(msg.field)}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-sm font-medium">
                    {msg.message}
                  </p>

                  {msg.suggestion && (
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-75" />
                        <p className="text-sm opacity-90">
                          {msg.suggestion}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Componente auxiliar para feedback inline em campos
interface InlineValidationProps {
  error?: string
  warning?: string
  success?: string
  info?: string
  className?: string
}

export const InlineValidation = ({
  error,
  warning,
  success,
  info,
  className = ''
}: InlineValidationProps) => {
  const message = error || warning || success || info
  const type = error ? 'error' : warning ? 'warning' : success ? 'success' : 'info'

  if (!message) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`mt-1 ${className}`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`flex-shrink-0 mt-0.5 ${
            type === 'error'
              ? 'text-red-600'
              : type === 'warning'
              ? 'text-yellow-600'
              : type === 'success'
              ? 'text-green-600'
              : 'text-blue-600'
          }`}
        >
          {type === 'error' && <XCircle className="w-4 h-4" />}
          {type === 'warning' && <AlertCircle className="w-4 h-4" />}
          {type === 'success' && <CheckCircle className="w-4 h-4" />}
          {type === 'info' && <Info className="w-4 h-4" />}
        </div>
        <p
          className={`text-sm ${
            type === 'error'
              ? 'text-red-700'
              : type === 'warning'
              ? 'text-yellow-700'
              : type === 'success'
              ? 'text-green-700'
              : 'text-blue-700'
          }`}
        >
          {message}
        </p>
      </div>
    </motion.div>
  )
}

// Componente para checklist de validação
interface ValidationChecklistProps {
  items: Array<{
    label: string
    isValid: boolean
    message?: string
  }>
  title?: string
  className?: string
}

export const ValidationChecklist = ({
  items,
  title = 'Checklist de Validação',
  className = ''
}: ValidationChecklistProps) => {
  const completedCount = items.filter(item => item.isValid).length
  const progress = (completedCount / items.length) * 100

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <div className="text-sm text-gray-600">
          {completedCount}/{items.length}
        </div>
      </div>

      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full ${
              progress === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
          />
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3"
          >
            <div className="flex-shrink-0 mt-1">
              {item.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <div
                className={`text-sm font-medium ${
                  item.isValid ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}
              >
                {item.label}
              </div>
              {item.message && !item.isValid && (
                <div className="text-xs text-gray-600 mt-1">{item.message}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
