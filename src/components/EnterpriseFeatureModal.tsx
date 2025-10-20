import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Zap, Shield, Users, BarChart3, Star, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

interface EnterpriseFeatureModalProps {
  isOpen: boolean
  feature: string
  onClose: () => void
}

const EnterpriseFeatureModal: React.FC<EnterpriseFeatureModalProps> = ({ isOpen, feature, onClose }) => {
  const enterpriseFeatures = [
    {
      icon: BarChart3,
      title: 'Analytics Avançados',
      description: 'Relatórios detalhados, dashboards personalizados e análise preditiva'
    },
    {
      icon: Users,
      title: 'Usuários Ilimitados',
      description: 'Adicione toda sua equipe sem limites ou custos adicionais'
    },
    {
      icon: Shield,
      title: 'Segurança Enterprise',
      description: 'Criptografia avançada, autenticação em dois fatores e logs de auditoria'
    },
    {
      icon: Zap,
      title: 'Integrações Avançadas',
      description: 'API personalizada e conexão com sistemas ERP, CRM e contábeis'
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white rounded-t-2xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4"
                >
                  <Lock className="h-8 w-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Recurso Enterprise</h2>
                <p className="text-purple-100">
                  {feature ? `"${feature}" está disponível apenas no plano Enterprise` : 'Desbloqueie recursos avançados com o plano Enterprise'}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Enterprise Features */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  O que você ganha com o Enterprise
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enterpriseFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Enterprise Benefits */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefícios Exclusivos</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <Star className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                    Gerente de conta dedicado
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Star className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                    Suporte 24/7 por telefone, email e chat
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Star className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                    SLA garantido com 99.9% de uptime
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Star className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                    Treinamento personalizado para sua equipe
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link
                  to="/pricing"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  <Crown className="h-5 w-5 mr-2 text-yellow-300" />
                  Ver Plano Enterprise
                </Link>
                <p className="text-sm text-gray-500 mt-2">
                  Entre em contato para uma demonstração personalizada
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default EnterpriseFeatureModal