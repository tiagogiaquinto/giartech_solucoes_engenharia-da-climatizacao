import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  Moon,
  Smartphone,
  HelpCircle,
  FileText,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  Award,
  Zap,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

interface TechnicianStats {
  total_os: number
  completed_os: number
  pending_os: number
  in_progress_os: number
  average_rating: number
  hours_worked: number
}

const TechnicianPerfil = () => {
  const navigate = useNavigate()
  const { user, signOut } = useUser()
  const [stats, setStats] = useState<TechnicianStats>({
    total_os: 0,
    completed_os: 0,
    pending_os: 0,
    in_progress_os: 0,
    average_rating: 4.8,
    hours_worked: 0
  })
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    loadStats()
  }, [user])

  const loadStats = async () => {
    if (!user?.employee_id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data: assignments } = await supabase
        .from('service_order_assignments')
        .select('service_order_id')
        .eq('employee_id', user.employee_id)

      const osIds = assignments?.map(a => a.service_order_id) ?? []

      if (osIds.length === 0) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('service_orders')
        .select('status, actual_hours')
        .in('id', osIds)

      if (data) {
        const completed = data.filter(d => ['completed', 'concluido'].includes(d.status)).length
        const pending = data.filter(d => ['pending', 'pendente'].includes(d.status)).length
        const inProgress = data.filter(d => ['in_progress', 'em_andamento'].includes(d.status)).length
        const totalHours = data.reduce((acc, d) => acc + (d.actual_hours || 0), 0)

        setStats({
          total_os: data.length,
          completed_os: completed,
          pending_os: pending,
          in_progress_os: inProgress,
          average_rating: 4.8,
          hours_worked: Math.round(totalHours * 10) / 10
        })
      }
    } catch (err) {
      console.error('Erro ao carregar estatisticas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/mobile/login')
  }

  const menuItems = [
    {
      icon: Bell,
      label: 'Notificacoes',
      description: 'Configurar alertas e avisos',
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onClick: () => navigate('/tecnico/chat')
    },
    {
      icon: Moon,
      label: 'Aparencia',
      description: 'Tema claro ou escuro',
      color: 'bg-gray-100',
      iconColor: 'text-gray-600',
      onClick: () => {}
    },
    {
      icon: Smartphone,
      label: 'Modo Offline',
      description: 'Trabalhar sem internet',
      color: 'bg-green-100',
      iconColor: 'text-green-600',
      onClick: () => {}
    },
    {
      icon: HelpCircle,
      label: 'Ajuda e Suporte',
      description: 'FAQ e atendimento',
      color: 'bg-amber-100',
      iconColor: 'text-amber-600',
      onClick: () => {}
    },
    {
      icon: FileText,
      label: 'Sobre o App',
      description: 'Versao 1.0.0',
      color: 'bg-gray-100',
      iconColor: 'text-gray-600',
      onClick: () => {}
    }
  ]

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'TC'

  const completionRate = stats.total_os > 0
    ? Math.round((stats.completed_os / stats.total_os) * 100)
    : 0

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <button
          onClick={loadStats}
          disabled={loading}
          className="p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-transform"
        >
          <RefreshCw className={`w-5 h-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/30"
      >
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{user?.name || 'Tecnico'}</h2>
            <p className="text-blue-100 text-sm truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Tecnico</span>
              </div>
              <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
                <Star className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-xs font-medium">{stats.average_rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total_os}</p>
          <p className="text-xs text-gray-500 font-medium">Total de OS</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-sm p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completed_os}</p>
          <p className="text-xs text-gray-500 font-medium">Concluidas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
          <p className="text-xs text-gray-500 font-medium">Taxa Conclusao</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-sm p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.hours_worked}h</p>
          <p className="text-xs text-gray-500 font-medium">Horas Trabalhadas</p>
        </motion.div>
      </div>

      {stats.total_os > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm p-4"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Distribuicao de Status</h3>
          <div className="flex gap-2 h-3 rounded-full overflow-hidden bg-gray-100">
            {stats.completed_os > 0 && (
              <div
                className="bg-green-500 rounded-full"
                style={{ width: `${(stats.completed_os / stats.total_os) * 100}%` }}
              />
            )}
            {stats.in_progress_os > 0 && (
              <div
                className="bg-blue-500 rounded-full"
                style={{ width: `${(stats.in_progress_os / stats.total_os) * 100}%` }}
              />
            )}
            {stats.pending_os > 0 && (
              <div
                className="bg-amber-500 rounded-full"
                style={{ width: `${(stats.pending_os / stats.total_os) * 100}%` }}
              />
            )}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-600">Concluidas ({stats.completed_os})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-gray-600">Em Execucao ({stats.in_progress_os})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-gray-600">Pendentes ({stats.pending_os})</span>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Configuracoes
        </h3>

        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0"
          >
            <div className={`w-11 h-11 ${item.color} rounded-xl flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.iconColor}`} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 py-4 rounded-2xl font-semibold active:scale-[0.98] transition-all"
      >
        <LogOut className="w-5 h-5" />
        Sair da Conta
      </motion.button>

      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md p-6 safe-area-bottom"
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Sair da conta?</h3>
              <p className="text-gray-500 text-center mb-6">
                Voce precisara fazer login novamente para acessar o sistema.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-semibold active:scale-[0.98] transition-all"
                >
                  Sair
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TechnicianPerfil
