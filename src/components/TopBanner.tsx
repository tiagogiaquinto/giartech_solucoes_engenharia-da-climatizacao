import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'

const TopBanner = () => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-50/95 to-cyan-50/95 backdrop-blur-sm border-b border-blue-100/30"
      >
        <div className="flex items-center justify-center px-2 py-1 max-w-7xl mx-auto text-center">
          {/* Centered Content */}
          <div className="flex flex-col items-center justify-center min-w-0">
            {/* Micro Logo */}
            <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center flex-shrink-0 mb-0.5">
              <span className="text-white font-bold text-xs">H</span>
            </div>
            
            {/* Compact Message */}
            <div className="text-center">
              <p className="text-xs text-blue-700">
                <span className="font-medium">HITACHI</span> - Ar Condicionado 
                <span className="font-semibold text-blue-800 mx-1">40% OFF</span>
              </p>
            </div>

            {/* Micro CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open('https://www.hitachi.com.br', '_blank')}
              className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center space-x-0.5 flex-shrink-0 mt-0.5"
            >
              <span>Ver</span>
              <ExternalLink className="h-2 w-2" />
            </motion.button>
          </div>

          {/* Micro Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-1 right-1 p-0.5 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
          >
            <X className="h-2.5 w-2.5 text-blue-600" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TopBanner