import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone } from 'lucide-react'

const BottomBanner = () => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-green-50/95 to-emerald-50/95 backdrop-blur-sm border-t border-green-100/30"
      >
        <div className="flex items-center justify-center px-2 py-2 max-w-7xl mx-auto text-center">
          {/* Centered Content */}
          <div className="flex flex-col items-center justify-center min-w-0">
            {/* Micro Logo */}
            <div className="w-4 h-4 bg-green-600 rounded-sm flex items-center justify-center flex-shrink-0 mb-0.5">
              <span className="text-white font-bold text-xs">CR</span>
            </div>
            
            {/* Compact Message */}
            <div className="text-center">
              <p className="text-xs text-green-700">
                <span className="font-medium">CLIMA RIO</span> - Materiais 
                <span className="font-semibold text-green-800 mx-1">Entrega Rápida</span>
              </p>
            </div>

            {/* Micro CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open('tel:(21)99999-8888', '_self')}
              className="bg-green-600 text-white px-1.5 py-0.5 rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center space-x-0.5 flex-shrink-0 mt-0.5"
            >
              <Phone className="h-2 w-2" />
              <span>Ligar</span>
            </motion.button>
          </div>

          {/* Micro Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-1 right-1 p-0.5 hover:bg-green-100 rounded transition-colors flex-shrink-0"
          >
            <X className="h-2.5 w-2.5 text-green-600" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default BottomBanner