import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Check, Zap, Shield, Users, BarChart3, Star, Clock, FileText, Code, Database, Globe } from 'lucide-react'

interface PremiumModalProps {
  isOpen: boolean
  feature: string
  onClose: () => void
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, feature, onClose }) => {
  const premiumFeatures = [
    {
      icon: BarChart3,
      title: 'Analytics Avançados',
      description: 'Relatórios detalhados e insights em tempo real'
    },
    {
      icon: Users,
      title: 'Colaboração Ilimitada',
      description: 'Adicione quantos membros quiser ao seu time'
    },
    {
      icon: Shield,
      title: 'Segurança Enterprise',
      description: 'Criptografia avançada e backup automático'
    },
    {
      icon: Zap,
      title: 'Automações',
      description: 'Fluxos de trabalho automatizados e integrações'
    }
  ]

  const plans = [
    {
      name: 'Básico',
      price: 'Grátis',
      features: [
        'Até 5 ordens de serviço',
        'Gestão básica de estoque',
        'Catálogo de serviços limitado',
        'Suporte por email',
        'Acesso a 1 usuário',
        'Backup manual',
        'Relatórios básicos'
      ],
      current: true
    },
    {
      name: 'Premium',
      price: 'R$ 99,00/mês',
      features: [
        'Ordens de serviço ilimitadas',
        'Gestão completa de estoque',
        'Catálogo de serviços completo',
        'Suporte prioritário',
        'Até 5 usuários',
        'Backup automático',
        'Analytics avançados',
        'Personalização visual',
        'Modo offline no app',
        'Integrações básicas'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'R$ 200,00/mês',
      features: [
        'Tudo do Premium',
        'Usuários ilimitados',
        'API de integração',
        'Suporte dedicado 24/7',
        'SLA garantido',
        'Dashboards personalizados',
        'Gestão financeira avançada',
        'Controle de acesso granular',
        'Monitoramento em tempo real',
        'Relatórios customizados',
        'Treinamento da equipe',
        'Ambiente de homologação'
      ]
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white rounded-t-3xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4"
                >
                  <Crown className="h-8 w-8 text-yellow-300" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-2">Recurso Premium</h2>
                <p className="text-blue-100">
                  {feature ? `"${feature}" está disponível apenas no plano Premium` : 'Desbloqueie todo o potencial da plataforma'}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Premium Features */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  O que você ganha com o Premium
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {premiumFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Pricing Plans */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Escolha seu plano
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan, index) => (
                    <motion.div
                      key={plan.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                        plan.popular
                          ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-purple-50 shadow-lg scale-105'
                          : plan.current
                          ? 'border-gray-300 bg-gray-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                            <Star className="h-4 w-4 mr-1" />
                            Mais Popular
                          </div>
                        </div>
                      )}

                      {plan.current && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gray-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                            Plano Atual
                          </div>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                        <div className="text-3xl font-bold text-gray-900">{plan.price}</div>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                          plan.current
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : plan.popular
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                        disabled={plan.current}
                      >
                        {plan.current ? 'Plano Atual' : 'Fazer Upgrade'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Começar Teste Grátis de 14 dias
                </motion.button>
                <p className="text-sm text-gray-500 mt-2">
                  Sem compromisso • Cancele a qualquer momento
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default PremiumModal