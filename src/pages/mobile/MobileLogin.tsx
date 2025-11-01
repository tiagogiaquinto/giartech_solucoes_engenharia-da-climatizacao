import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Zap,
  Shield,
  Smartphone
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

const MobileLogin = () => {
  const navigate = useNavigate()
  const { login } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'splash' | 'login'>('splash')

  useEffect(() => {
    // Splash screen inicial
    const timer = setTimeout(() => {
      setStep('login')
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Buscar usuário por email
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        throw new Error('Usuário não encontrado')
      }

      // Buscar funcionário vinculado
      const { data: employeeData } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userData.user_id)
        .single()

      // Simular login (em produção, usar auth real)
      login({
        user_id: userData.user_id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        employee_id: employeeData?.id
      })

      // Animação de sucesso
      await new Promise(resolve => setTimeout(resolve, 800))

      // Redirecionar para mobile
      navigate('/mobile')

    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Email ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
        />
      </div>

      <AnimatePresence mode="wait">
        {/* Splash Screen */}
        {step === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="text-center z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
              }}
              className="relative mb-8"
            >
              <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Zap className="w-16 h-16 text-blue-600" />
                </motion.div>
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
                className="absolute -inset-4 bg-white/20 rounded-full blur-xl"
              />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-2"
            >
              Giartech
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-blue-100 text-lg"
            >
              Sistema Integrado Mobile
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 flex items-center justify-center gap-2"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-3 h-3 bg-white rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-3 h-3 bg-white rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="w-3 h-3 bg-white rounded-full"
              />
            </motion.div>
          </motion.div>
        )}

        {/* Login Screen */}
        {step === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-md z-10"
          >
            {/* Logo Card */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4">
                <Zap className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Bem-vindo de volta!
              </h1>
              <p className="text-blue-100">
                Acesse sua conta para continuar
              </p>
            </motion.div>

            {/* Login Card */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8"
            >
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-base"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-14 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-4 bg-red-50 border-2 border-red-200 rounded-2xl"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-600 font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Features */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center mb-4 font-semibold">
                  Recursos do App Mobile
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Interface Otimizada</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium">Acesso Rápido</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Experiência Premium</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="font-medium">100% Seguro</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-blue-100 text-sm mt-6"
            >
              © 2025 Giartech. Todos os direitos reservados.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileLogin
