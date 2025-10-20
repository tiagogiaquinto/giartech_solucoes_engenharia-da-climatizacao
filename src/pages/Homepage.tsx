import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Zap, Shield, Users, X } from 'lucide-react'

const Homepage = () => {
  const navigate = useNavigate()
  const [showSkipButton, setShowSkipButton] = useState(true)

  const handleSkip = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Skip Button */}
      {showSkipButton && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={handleSkip}
          className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors z-20"
        >
          <X className="h-5 w-5 text-white" />
        </motion.button>
      )}

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Logo Principal */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="mb-12"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl"
            >
              <span className="text-4xl font-bold text-white">GT</span>
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full flex items-center justify-center"
            >
              <Sparkles className="h-4 w-4 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Título Principal */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl md:text-6xl font-bold mb-6"
        >
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            GiarTech
          </span>
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed"
        >
          Plataforma empresarial completa para
          <br />
          <span className="font-semibold text-gray-800">gestão inteligente de projetos</span>
        </motion.p>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {[
            { icon: Zap, label: 'Rápido', color: 'from-yellow-400 to-orange-500' },
            { icon: Shield, label: 'Seguro', color: 'from-green-400 to-emerald-500' },
            { icon: Users, label: 'Colaborativo', color: 'from-blue-400 to-cyan-500' },
            { icon: Sparkles, label: 'Inteligente', color: 'from-purple-400 to-pink-500' }
          ].map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700">{feature.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-col items-center space-y-4"
        >
          <Link
            to="/login"
            className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <span className="mr-3">GIARTECH Gestão Integrada</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          </Link>
          
          <button 
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            Acessar Plataforma
          </button>
        </motion.div>

        {/* Version Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-sm text-gray-500 mt-8"
        >
          Versão 2.0 • Premium Edition
        </motion.p>
      </div>
    </div>
  )
}

export default Homepage