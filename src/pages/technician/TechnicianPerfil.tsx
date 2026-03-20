import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  Moon,
  Smartphone,
  HelpCircle,
  FileText,
  Star,
  Award,
  TrendingUp,
  Clock
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

interface TechnicianStats {
  total_os: number
  completed_os: number
  average_rating: number
  hours_worked: number
}

const TechnicianPerfil = () => {
  const navigate = useNavigate()
  const { user, signOut } = useUser()
  const [stats, setStats] = useState<TechnicianStats>({
    total_os: 0,
    completed_os: 0,
    average_rating: 0,
    hours_worked: 0
  })
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    loadStats()
  }, [user])

  const loadStats = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('status, actual_hours')
        .or(`assigned_to.eq.${user?.employee_id}`)

      if (data) {
        const completed = data.filter(d => d.status === 'completed').length
        const totalHours = data.reduce((acc, d) => acc + (d.actual_hours || 0), 0)

        setStats({
          total_os: data.length,
          completed_os: completed,
          average_rating: 4.8,
          hours_worked: totalHours
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
    navigate('/login')
  }

  const menuItems = [
    {
      icon: Bell,
      label: 'Notificacoes',
      description: 'Configurar alertas',
      onClick: () => {}
    },
    {
      icon: Moon,
      label: 'Aparencia',
      description: 'Tema escuro',
      onClick: () => {}
    },
    {
      icon: Smartphone,
      label: 'Modo Offline',
      description: 'Sincronizacao automatica',
      onClick: () => {}
    },
    {
      icon: HelpCircle,
      label: 'Ajuda',
      description: 'FAQ e suporte',
      onClick: () => {}
    },
    {
      icon: FileText,
      label: 'Termos de Uso',
      description: 'Politica de privacidade',
      onClick: () => {}
    }
  ]

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'TC'

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user?.name || 'Tecnico'}</h2>
            <p className="text-blue-100 text-sm">{user?.email}</p>
            <div className="flex items-center gap-1 mt-2">
              <Shield className="w-4 h-4 text-blue-200" />
              <span className="text-sm text-blue-200">Tecnico de Campo</span>
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
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total OS</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total_os}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-sm p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Concluidas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completed_os}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">Avaliacao</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.average_rating.toFixed(1)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-sm p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Horas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.hours_worked}h</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-500 uppercase">
          Configuracoes
        </h3>

        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <item.icon className="w-5 h-5 text-gray-600" />
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
        transition={{ delay: 0.35 }}
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 py-4 rounded-2xl font-semibold active:scale-[0.98] transition-all"
      >
        <LogOut className="w-5 h-5" />
        Sair da Conta
      </motion.button>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl w-full max-w-md p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sair da conta?</h3>
            <p className="text-gray-500 mb-6">
              Voce precisara fazer login novamente para acessar o sistema.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold active:scale-[0.98] transition-all"
              >
                Sair
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default TechnicianPerfil
