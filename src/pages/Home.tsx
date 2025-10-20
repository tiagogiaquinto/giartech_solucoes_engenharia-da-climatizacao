import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  BarChart3, 
  Users, 
  Calendar, 
  DollarSign, 
  Package, 
  ClipboardList, 
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Globe
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'

const Home = () => {
  const { user, isPremium } = useUser()

  const quickActions = [
    {
      title: 'Nova Ordem de Serviço',
      description: 'Criar uma nova OS rapidamente',
      icon: ClipboardList,
      color: 'from-blue-500 to-cyan-500',
      path: '/service-orders/create'
    },
    {
      title: 'Gestão de Clientes',
      description: 'Adicionar ou editar clientes',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      path: '/client-management'
    },
    {
      title: 'Controle de Estoque',
      description: 'Verificar materiais disponíveis',
      icon: Package,
      color: 'from-purple-500 to-pink-500',
      path: '/inventory'
    },
    {
      title: 'Relatórios Financeiros',
      description: 'Acompanhar receitas e despesas',
      icon: DollarSign,
      color: 'from-orange-500 to-red-500',
      path: '/financial'
    },
    {
      title: 'Agenda de Trabalho',
      description: 'Organizar compromissos',
      icon: Calendar,
      color: 'from-indigo-500 to-purple-500',
      path: '/calendar'
    },
    {
      title: 'Chat da Equipe',
      description: 'Comunicar com a equipe',
      icon: MessageSquare,
      color: 'from-teal-500 to-cyan-500',
      path: '/chat'
    }
  ]

  const recentActivity = [
    {
      action: 'OS criada',
      item: 'OS-2024-001 - João Silva',
      time: '2 horas atrás',
      icon: ClipboardList,
      color: 'text-blue-500'
    },
    {
      action: 'Cliente adicionado',
      item: 'Empresa ABC Ltda',
      time: '4 horas atrás',
      icon: Users,
      color: 'text-green-500'
    },
    {
      action: 'Estoque atualizado',
      item: 'Ar Condicionado Split 12.000 BTUs',
      time: '1 dia atrás',
      icon: Package,
      color: 'text-purple-500'
    },
    {
      action: 'Pagamento recebido',
      item: 'R$ 850,00 - OS-2024-003',
      time: '2 dias atrás',
      icon: DollarSign,
      color: 'text-green-500'
    }
  ]

  const systemStats = [
    {
      title: 'Ordens Ativas',
      value: '8',
      icon: ClipboardList,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Clientes Cadastrados',
      value: '24',
      icon: Users,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Itens em Estoque',
      value: '156',
      icon: Package,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Faturamento Mensal',
      value: 'R$ 15.850',
      icon: DollarSign,
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bem-vindo, {user?.name}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Gerencie seu negócio de forma inteligente e eficiente
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <Zap className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="text-sm">Sistema Online</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-300" />
              <span className="text-sm">Dados Seguros</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-purple-300" />
              <span className="text-sm">Acesso Remoto</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Link
                to={action.path}
                className="block p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-lg transition-all duration-200 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{action.description}</p>
                <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                  <span className="text-sm font-medium">Acessar</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Atividade Recente</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                  <activity.icon className={`h-5 w-5 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.item}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Status do Sistema</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-gray-900">Todos os Serviços</span>
              </div>
              <span className="text-green-600 font-medium">Operacional</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-gray-900">Última Sincronização</span>
              </div>
              <span className="text-blue-600 font-medium">Agora</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="font-medium text-gray-900">Plano Atual</span>
              </div>
              <span className="text-purple-600 font-medium">
                {isPremium ? 'Premium' : 'Básico'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/departmental-dashboard"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all flex items-center justify-center"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              <span>Ver Dashboard Completo</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dicas Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Automatização</h3>
            <p className="text-sm text-gray-600">
              Use o sistema integrado para automatizar processos e economizar tempo
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Produtividade</h3>
            <p className="text-sm text-gray-600">
              Acompanhe métricas de desempenho no Dashboard Departamental
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Segurança</h3>
            <p className="text-sm text-gray-600">
              Seus dados estão protegidos com criptografia de ponta a ponta
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Home