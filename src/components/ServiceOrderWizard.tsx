import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Wrench,
  Package,
  Users,
  DollarSign,
  FileText,
  AlertCircle,
  Save
} from 'lucide-react'

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  isComplete: boolean
  isValid: boolean
  hasWarnings: boolean
}

interface ServiceOrderWizardProps {
  currentStep: number
  totalSteps: number
  onStepChange: (step: number) => void
  onSave: () => void
  onComplete: () => void
  canProceed: boolean
  validationErrors: string[]
  validationWarnings: string[]
  isLoading?: boolean
}

export const ServiceOrderWizard = ({
  currentStep,
  totalSteps,
  onStepChange,
  onSave,
  onComplete,
  canProceed,
  validationErrors = [],
  validationWarnings = [],
  isLoading = false
}: ServiceOrderWizardProps) => {
  const [steps, setSteps] = useState<WizardStep[]>([
    {
      id: 'basics',
      title: 'Dados Básicos',
      description: 'Cliente e descrição',
      icon: <User className="w-5 h-5" />,
      isComplete: false,
      isValid: true,
      hasWarnings: false
    },
    {
      id: 'services',
      title: 'Serviços',
      description: 'Selecione os serviços',
      icon: <Wrench className="w-5 h-5" />,
      isComplete: false,
      isValid: true,
      hasWarnings: false
    },
    {
      id: 'materials',
      title: 'Materiais',
      description: 'Adicione materiais',
      icon: <Package className="w-5 h-5" />,
      isComplete: false,
      isValid: true,
      hasWarnings: false
    },
    {
      id: 'team',
      title: 'Mão de Obra',
      description: 'Equipe e executores',
      icon: <Users className="w-5 h-5" />,
      isComplete: false,
      isValid: true,
      hasWarnings: false
    },
    {
      id: 'payment',
      title: 'Pagamento',
      description: 'Valores e condições',
      icon: <DollarSign className="w-5 h-5" />,
      isComplete: false,
      isValid: true,
      hasWarnings: false
    },
    {
      id: 'summary',
      title: 'Resumo',
      description: 'Revise e finalize',
      icon: <FileText className="w-5 h-5" />,
      isComplete: false,
      isValid: true,
      hasWarnings: false
    }
  ])

  useEffect(() => {
    // Atualizar validação do step atual
    setSteps(prev => prev.map((step, idx) => ({
      ...step,
      isValid: idx === currentStep ? validationErrors.length === 0 : step.isValid,
      hasWarnings: idx === currentStep ? validationWarnings.length > 0 : step.hasWarnings,
      isComplete: idx < currentStep
    })))
  }, [currentStep, validationErrors, validationWarnings])

  const progress = ((currentStep + 1) / totalSteps) * 100

  const handleNext = () => {
    if (canProceed && currentStep < totalSteps - 1) {
      onStepChange(currentStep + 1)
    } else if (currentStep === totalSteps - 1) {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1)
    }
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      onSave()
    } else if (e.key === 'ArrowRight' && e.altKey && canProceed) {
      e.preventDefault()
      handleNext()
    } else if (e.key === 'ArrowLeft' && e.altKey) {
      e.preventDefault()
      handlePrevious()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [currentStep, canProceed])

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
      {/* Header - Progress Bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {steps[currentStep]?.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {steps[currentStep]?.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {currentStep + 1}/{totalSteps}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {progress.toFixed(0)}% concluído
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => idx <= currentStep && onStepChange(idx)}
                disabled={idx > currentStep}
                className={`flex flex-col items-center gap-2 transition-all ${
                  idx <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    idx < currentStep
                      ? 'bg-green-500 border-green-500 text-white'
                      : idx === currentStep
                      ? 'bg-blue-500 border-blue-500 text-white ring-4 ring-blue-100'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {idx < currentStep ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={`text-xs font-medium ${
                      idx === currentStep
                        ? 'text-blue-600'
                        : idx < currentStep
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </div>
                  {!step.isValid && idx === currentStep && (
                    <div className="text-xs text-red-600 mt-1">
                      {validationErrors.length} erro(s)
                    </div>
                  )}
                  {step.hasWarnings && idx === currentStep && (
                    <div className="text-xs text-yellow-600 mt-1">
                      {validationWarnings.length} aviso(s)
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      <AnimatePresence>
        {(validationErrors.length > 0 || validationWarnings.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pb-4 space-y-2"
          >
            {validationErrors.map((error, idx) => (
              <motion.div
                key={`error-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-900">Erro</div>
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </motion.div>
            ))}

            {validationWarnings.map((warning, idx) => (
              <motion.div
                key={`warning-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (validationErrors.length + idx) * 0.05 }}
                className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-yellow-900">Aviso</div>
                  <div className="text-sm text-yellow-700">{warning}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          <button
            onClick={onSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            title="Ctrl+Enter para salvar rascunho"
          >
            <Save className="w-5 h-5" />
            Salvar Rascunho
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Keyboard Shortcuts Info */}
          <div className="text-xs text-gray-500 hidden md:block">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+Enter</kbd> Salvar |
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs ml-2">Alt+→</kbd> Próximo
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed || isLoading}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
              !canProceed || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : currentStep === totalSteps - 1
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processando...
              </>
            ) : currentStep === totalSteps - 1 ? (
              <>
                <Check className="w-5 h-5" />
                Finalizar OS
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
