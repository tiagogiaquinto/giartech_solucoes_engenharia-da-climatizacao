import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Zap, Star, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PremiumBannerProps {
  feature?: string
}

const PremiumBanner: React.FC<PremiumBannerProps> = ({ feature }) => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="fixed bottom-20 left-0 right-0 z-30 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl overflow-hidden">
            <div className="relative p-4 md:p-6">
              {/* Close Button */}
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex flex-col md:flex-row items-center">
                {/* Icon */}
                <div className="mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Crown className="h-6 w-6 text-yellow-300" />
                  </div>
                </div>
                
                {/* Content */}
                <div className="text-center md:text-left flex-1 md:mr-6">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {feature 
                      ? `Desbloqueie "${feature}" com o plano Premium!` 
                      : 'Atualize para o plano Premium!'}
                  </h3>
                  <p className="text-white/80 text-sm">
                    Acesse recursos avançados, usuários ilimitados e suporte prioritário por apenas R$49,90/mês.
                  </p>
                </div>
                
                {/* CTA */}
                <div className="mt-4 md:mt-0">
                  <Link
                    to="/pricing"
                    className="inline-flex items-center px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Star className="h-4 w-4 mr-2 text-yellow-500" />
                    <span>Ver Planos</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-white/20">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 10, ease: "linear" }}
                onAnimationComplete={() => setIsVisible(false)}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PremiumBanner