import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Key, Lock, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface AccessRestrictionModalProps {
  isOpen: boolean
  onClose: () => void
  requiredRole: 'admin' | 'premium' | 'enterprise'
}

const AccessRestrictionModal: React.FC<AccessRestrictionModalProps> = ({ 
  isOpen, 
  onClose, 
  requiredRole 
}) => {
  const getRoleInfo = () => {
    switch (requiredRole) {
      case 'admin':
        return {
          title: 'Acesso Restrito',
          description: 'Esta funcionalidade está disponível apenas para administradores do sistema.',
          icon: Shield,
          color: 'red',
          buttonText: 'Entendi'
        }
      case 'premium':
        return {
          title: 'Recurso Premium',
          description: 'Esta funcionalidade está disponível apenas para assinantes do plano Premium.',
          icon: Key,
          color: 'blue',
          buttonText: 'Ver Planos'
        }
      case 'enterprise':
        return {
          title: 'Recurso Enterprise',
          description: 'Esta funcionalidade está disponível apenas para assinantes do plano Enterprise.',
          icon: Lock,
          color: 'purple',
          buttonText: 'Ver Planos'
        }
      default:
        return {
          title: 'Acesso Restrito',
          description: 'Você não tem permissão para acessar esta funcionalidade.',
          icon: AlertTriangle,
          color: 'yellow',
          buttonText: 'Entendi'
        }
    }
  }

  const roleInfo = getRoleInfo()

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
            className="relative bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            {/* Header */}
            <div className={`relative bg-${roleInfo.color}-600 p-6 text-white rounded-t-xl`}>
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
                  <roleInfo.icon className="h-8 w-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">{roleInfo.title}</h2>
                <p className="text-white/80">
                  {roleInfo.description}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {requiredRole === 'admin' ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-6">
                    Entre em contato com o administrador do sistema para solicitar acesso a esta funcionalidade.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {roleInfo.buttonText}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-6">
                    Faça upgrade do seu plano para desbloquear esta e outras funcionalidades avançadas.
                  </p>
                  <Link
                    to="/pricing"
                    className={`inline-block px-6 py-3 bg-${roleInfo.color}-600 text-white font-semibold rounded-lg hover:bg-${roleInfo.color}-700 transition-colors`}
                  >
                    {roleInfo.buttonText}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AccessRestrictionModal