import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Users, FileText, Calendar, Settings, DollarSign, Sparkles } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    link: string;
  };
  role?: string[];
}

const onboardingSteps: Record<string, OnboardingStep[]> = {
  admin: [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Sistema Giartech!',
      description: 'Como administrador, você tem acesso completo a todas as funcionalidades. Vamos conhecer as principais áreas.',
      icon: <Sparkles className="w-12 h-12" />,
    },
    {
      id: 'team',
      title: 'Gestão de Pessoas',
      description: 'Gerencie sua equipe, convide novos usuários e defina permissões de acesso.',
      icon: <Users className="w-12 h-12" />,
      action: {
        label: 'Ir para Gestão de Pessoas',
        link: '/people-management',
      },
    },
    {
      id: 'orders',
      title: 'Ordens de Serviço',
      description: 'Crie, acompanhe e gerencie ordens de serviço. O coração do sistema está aqui.',
      icon: <FileText className="w-12 h-12" />,
      action: {
        label: 'Ver Ordens de Serviço',
        link: '/service-orders',
      },
    },
    {
      id: 'finance',
      title: 'Financeiro',
      description: 'Controle completo de receitas, despesas, fluxo de caixa e análises financeiras.',
      icon: <DollarSign className="w-12 h-12" />,
      action: {
        label: 'Acessar Financeiro',
        link: '/financial-management',
      },
    },
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Personalize o sistema, configure notificações e ajuste preferências da empresa.',
      icon: <Settings className="w-12 h-12" />,
      action: {
        label: 'Ir para Configurações',
        link: '/settings',
      },
    },
  ],
  technician: [
    {
      id: 'welcome',
      title: 'Bem-vindo, Técnico!',
      description: 'Sua área de trabalho está otimizada para visualizar e executar ordens de serviço.',
      icon: <Sparkles className="w-12 h-12" />,
    },
    {
      id: 'my-orders',
      title: 'Minhas Ordens de Serviço',
      description: 'Veja as OSs atribuídas a você, atualize status e registre atividades realizadas.',
      icon: <FileText className="w-12 h-12" />,
      action: {
        label: 'Ver Minhas OSs',
        link: '/service-orders',
      },
    },
    {
      id: 'calendar',
      title: 'Agenda',
      description: 'Consulte seus agendamentos, horários e compromissos do dia.',
      icon: <Calendar className="w-12 h-12" />,
      action: {
        label: 'Ver Agenda',
        link: '/calendar',
      },
    },
  ],
  user: [
    {
      id: 'welcome',
      title: 'Bem-vindo!',
      description: 'Você pode visualizar ordens de serviço, acessar relatórios e acompanhar o trabalho da equipe.',
      icon: <Sparkles className="w-12 h-12" />,
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Veja indicadores e métricas importantes do sistema em tempo real.',
      icon: <FileText className="w-12 h-12" />,
      action: {
        label: 'Ir para Dashboard',
        link: '/dashboard',
      },
    },
  ],
};

interface OnboardingFlowProps {
  userRole?: string;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ userRole = 'user' }) => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage<boolean>(
    `onboarding_${userRole}`,
    false
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const steps = onboardingSteps[userRole] || onboardingSteps.user;

  useEffect(() => {
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenOnboarding]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setHasSeenOnboarding(true);
    setIsVisible(false);
  };

  const handleSkip = () => {
    setHasSeenOnboarding(true);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-8 md:p-12">
                <div className="flex justify-between items-start mb-8">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Passo {currentStep + 1} de {steps.length}
                  </div>
                  <button
                    onClick={handleSkip}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    Pular tutorial
                  </button>
                </div>

                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="mb-8"
                >
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white">
                      {currentStepData.icon}
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                    {currentStepData.title}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 text-center leading-relaxed max-w-xl mx-auto">
                    {currentStepData.description}
                  </p>

                  {currentStepData.action && (
                    <div className="mt-6 flex justify-center">
                      <a
                        href={currentStepData.action.link}
                        onClick={handleComplete}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {currentStepData.action.label}
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </motion.div>

                <div className="flex items-center gap-3">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrevious}
                      className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Anterior
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        <Check className="w-5 h-5" />
                        Começar
                      </>
                    ) : (
                      <>
                        Próximo
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
