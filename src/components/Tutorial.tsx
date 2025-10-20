import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, Check, ClipboardList, Package, BarChart3, Settings, FileText } from 'lucide-react'

interface TutorialProps {
  isOpen: boolean
  onComplete: () => void
}

const Tutorial: React.FC<TutorialProps> = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: 'Bem-vindo ao Sistema OS!',
      description: 'Vamos fazer um tour rápido pelas principais funcionalidades do sistema.',
      image: <ClipboardList className="h-12 w-12 text-blue-500" />,
      highlight: null
    },
    {
      title: 'Ordens de Serviço',
      description: 'Crie, gerencie e acompanhe todas as suas ordens de serviço em um só lugar. Adicione fotos, materiais e acompanhe o status em tempo real.',
      image: <ClipboardList className="h-12 w-12 text-blue-500" />,
      highlight: 'service-orders'
    },
    {
      title: 'Estoque Integrado',
      description: 'Controle seu estoque de materiais com baixa automática quando uma OS é finalizada. Receba alertas de estoque mínimo.',
      image: <Package className="h-12 w-12 text-green-500" />,
      highlight: 'inventory'
    },
    {
      title: 'Catálogo de Serviços',
      description: 'Crie serviços pré-definidos com descrições, materiais necessários e valores para agilizar a criação de novas ordens.',
      image: <FileText className="h-12 w-12 text-purple-500" />,
      highlight: 'service-catalog'
    },
    {
      title: 'Relatórios Detalhados',
      description: 'Acompanhe o desempenho do seu negócio com relatórios detalhados e gráficos interativos.',
      image: <BarChart3 className="h-12 w-12 text-orange-500" />,
      highlight: 'reports'
    },
    {
      title: 'Controle de Acesso',
      description: 'Diferentes níveis de acesso para administradores, técnicos e funcionários externos, garantindo a segurança das informações.',
      image: <Settings className="h-12 w-12 text-gray-500" />,
      highlight: 'settings'
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipTutorial = () => {
    onComplete()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Tutorial Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-3xl">
              <button
                onClick={skipTutorial}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                <div className="flex justify-center mb-3">
                  {steps[currentStep].image}
                </div>
                <h2 className="text-xl font-bold">{steps[currentStep].title}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 text-center mb-6 leading-relaxed">
                {steps[currentStep].description}
              </p>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Progresso</span>
                  <span>{currentStep + 1} de {steps.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                    currentStep === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </button>

                <div className="flex space-x-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentStep
                          ? 'bg-blue-500 w-6'
                          : index < currentStep
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Concluir
                      <Check className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Próximo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              </div>

              {/* Skip Button */}
              <div className="text-center mt-4">
                <button
                  onClick={skipTutorial}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Pular tutorial
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Tutorial