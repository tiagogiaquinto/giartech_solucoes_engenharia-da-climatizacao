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
    <div className="bg-white border border-[rgba(0,98,246,0.12)] rounded-xl">
      {/* Header - Progress Bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#191919]">
              {steps[currentStep]?.title}
            </h2>
            <p className="text-xs text-[#8a95a8] mt-0.5">
              {steps[currentStep]?.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#0062f6]">
              {currentStep + 1}/{totalSteps}
            </div>
            <div className="text-[10px] text-[#8a95a8] mt-0.5">
              {progress.toFixed(0)}% concluído
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-1.5 bg-[rgba(0,98,246,0.1)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-[#0062f6] rounded-full"
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mt-5">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => idx <= currentStep && onStepChange(idx)}
                disabled={idx > currentStep}
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  idx <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                    idx < currentStep
                      ? 'bg-[#eafff8] border-[rgba(0,196,154,0.4)] text-[#0a6b4a]'
                      : idx === currentStep
                      ? 'bg-[#0062f6] border-[#0062f6] text-white ring-4 ring-[rgba(0,98,246,0.15)]'
                      : 'bg-white border-[rgba(0,98,246,0.15)] text-[#8a95a8]'
                  }`}
                >
                  {idx < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={`text-[10px] font-medium ${
                      idx === currentStep
                        ? 'text-[#0062f6]'
                        : idx < currentStep
                        ? 'text-[#0a6b4a]'
                        : 'text-[#8a95a8]'
                    }`}
                  >
                    {step.title}
                  </div>
                  {!step.isValid && idx === currentStep && (
                    <div className="text-[10px] text-red-600 mt-0.5">
                      {validationErrors.length} erro(s)
                    </div>
                  )}
                  {step.hasWarnings && idx === currentStep && (
                    <div className="text-[10px] text-[#ff8149] mt-0.5">
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
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-red-900">Erro</div>
                  <div className="text-xs text-red-700">{error}</div>
                </div>
              </motion.div>
            ))}

            {validationWarnings.map((warning, idx) => (
              <motion.div
                key={`warning-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (validationErrors.length + idx) * 0.05 }}
                className="flex items-start gap-3 p-3 bg-[#fff3ee] border border-[rgba(255,129,73,0.3)] rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-[#ff8149] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-[#cc5a2a]">Aviso</div>
                  <div className="text-xs text-[#cc5a2a]">{warning}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="px-6 py-4 bg-[#f4f7ff] border-t border-[rgba(0,98,246,0.08)] rounded-b-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-4 py-2 border border-[rgba(0,98,246,0.2)] rounded-lg text-[#4a5568] hover:bg-white hover:text-[#0062f6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <button
            onClick={onSave}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 border border-[rgba(0,98,246,0.2)] rounded-lg text-[#4a5568] hover:bg-white hover:text-[#0062f6] disabled:opacity-40 transition-colors text-sm"
            title="Ctrl+Enter para salvar rascunho"
          >
            <Save className="w-4 h-4" />
            Salvar Rascunho
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[10px] text-[#8a95a8] hidden md:block">
            <kbd className="px-1.5 py-0.5 bg-white border border-[rgba(0,98,246,0.15)] rounded text-[10px]">Ctrl+Enter</kbd> Salvar |
            <kbd className="px-1.5 py-0.5 bg-white border border-[rgba(0,98,246,0.15)] rounded text-[10px] ml-1.5">Alt+→</kbd> Próximo
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed || isLoading}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-medium text-sm transition-all ${
              !canProceed || isLoading
                ? 'bg-[rgba(0,98,246,0.1)] text-[rgba(0,98,246,0.4)] cursor-not-allowed'
                : currentStep === totalSteps - 1
                ? 'bg-[#0a6b4a] text-white hover:bg-[#085c3f]'
                : 'bg-[#0062f6] text-white hover:bg-[#0052d6]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processando...
              </>
            ) : currentStep === totalSteps - 1 ? (
              <>
                <Check className="w-4 h-4" />
                Finalizar OS
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
