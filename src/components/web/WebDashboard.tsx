import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, FolderOpen, Clock, Plus, CircleCheck as CheckCircle, CircleAlert as AlertCircle, X, Save, Mail, Phone, Calendar, FileText, Send, DollarSign, ArrowUp, ArrowDown, ChevronRight, RefreshCw, Package } from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { Link } from 'react-router-dom'
import { useDashboardData } from '../../hooks/useDashboardData'
import ThomazContextualAssistant from '../ThomazContextualAssistant'

interface WebDashboardProps {
  onPremiumFeature?: (feature: string) => void
}

const WebDashboard: React.FC<WebDashboardProps> = ({ onPremiumFeature = () => {} }) => {
  const { user, isPremium } = useUser()
  const { metrics, financial, recentTransactions, activeOrders, loading, error, refresh, profit, profitMargin } = useDashboardData()
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Revisar código do projeto mobile', completed: false, priority: 'high' },
    { id: 2, title: 'Reunião com cliente às 14h', completed: true, priority: 'medium' },
    { id: 3, title: 'Atualizar documentação', completed: false, priority: 'low' },
    { id: 4, title: 'Deploy da versão 2.1', completed: false, priority: 'high' }
  ])

  const stats = [
    {
      title: 'Ordens de Serviço',
      value: metrics?.total_service_orders?.toString() || '0',
      change: `${metrics?.orders_completed || 0} concluídas`,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Clientes',
      value: metrics?.total_clients?.toString() || '0',
      change: 'Total cadastrados',
      icon: Users,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Faturamento',
      value: `R$ ${((financial?.total_income_paid || 0) / 1000).toFixed(1)}k`,
      change: `Lucro: ${profitMargin.toFixed(1)}%`,
      icon: DollarSign,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Estoque',
      value: metrics?.total_inventory_items?.toString() || '0',
      change: `${metrics?.total_inventory_quantity || 0} itens`,
      icon: Package,
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Thomaz Sugestões Contextuais */}
      <ThomazContextualAssistant context="dashboard" />

      {/* Header para Web */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta, {user?.name}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Aqui está um resumo dos seus projetos e atividades
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              isPremium 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isPremium ? '👑 Premium' : 'Plano Básico'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid para Web */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-green-600 text-sm font-medium">
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Financial Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Resumo Financeiro</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/financial-integration"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              Ver detalhes
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Receitas</h3>
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {(financial?.total_income_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Despesas</h3>
                  <DollarSign className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-600">
                  R$ {(financial?.total_expense_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Lucro</h3>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Lucro Estoque</h3>
                  <Package className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {(financial?.inventory_potential_profit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Margem: {(financial?.inventory_profit_margin || 0).toFixed(1)}%
                </p>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">A Receber</h3>
                  <ArrowDown className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {(financial?.total_income_pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <h3 className="text-sm font-medium text-gray-700 mb-3">Transações Recentes</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.descricao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${transaction.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.tipo === 'receita' ? '+' : '-'} R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
        )}
      </motion.div>

      {/* Active Service Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Ordens de Serviço Ativas</h2>
          <Link
            to="/service-orders"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            Ver todas
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">{metrics?.orders_completed || 0}</div>
            <p className="text-sm text-gray-600">Concluídas</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">{metrics?.orders_in_progress || 0}</div>
            <p className="text-sm text-gray-600">Em Progresso</p>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-1">{metrics?.orders_pending || 0}</div>
            <p className="text-sm text-gray-600">Pendentes</p>
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-700 mb-3">OSs Recentes</h3>
        <div className="space-y-3">
          {activeOrders.length > 0 ? (
            activeOrders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to={`/service-orders/${order.id}`}
                className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">OS #{order.order_number}</h4>
                    <p className="text-sm text-gray-600 mt-1">ID: {order.customer_id || 'Cliente não informado'}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status === 'pending' ? 'Pendente' :
                     order.status === 'in_progress' ? 'Em andamento' :
                     order.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Criado: {new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                  <span className="font-semibold text-blue-600">R$ {order.final_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma OS ativa no momento</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/projects" className="flex flex-col items-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all">
            <FolderOpen className="h-8 w-8 text-blue-500 mb-3" />
            <span className="text-sm font-medium text-gray-700">Novo Projeto</span>
          </Link>
          
          <Link to="/client-management" className="flex flex-col items-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all">
            <Users className="h-8 w-8 text-green-500 mb-3" />
            <span className="text-sm font-medium text-gray-700">Novo Cliente</span>
          </Link>
          
          <Link to="/financial" className="flex flex-col items-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all">
            <DollarSign className="h-8 w-8 text-purple-500 mb-3" />
            <span className="text-sm font-medium text-gray-700">Nova Transação</span>
          </Link>
          
          <Link to="/reports" className="flex flex-col items-center p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl hover:shadow-md transition-all">
            <FileText className="h-8 w-8 text-orange-500 mb-3" />
            <span className="text-sm font-medium text-gray-700">Relatórios</span>
          </Link>
        </div>
      </motion.div>

      {/* Tasks Section para Web */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Tarefas Recentes
            </h2>
            <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-2 rounded-lg hover:shadow-lg transition-all">
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border transition-all ${
                  task.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <button
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {task.completed && <CheckCircle className="h-3 w-3" />}
                  </button>
                  <span className={`flex-1 ${
                    task.completed ? 'text-green-600 line-through' : 'text-gray-900'
                  }`}>
                    {task.title}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Atividade Recente
          </h2>
          
          <div className="space-y-4">
            {[
              { action: 'Projeto criado', item: 'App Mobile v2.0', time: '2 horas atrás', icon: FolderOpen, color: 'text-blue-500' },
              { action: 'Tarefa concluída', item: 'Revisão de código', time: '4 horas atrás', icon: CheckCircle, color: 'text-green-500' },
              { action: 'Reunião agendada', item: 'Cliente ABC Corp', time: '1 dia atrás', icon: Calendar, color: 'text-purple-500' },
              { action: 'Relatório gerado', item: 'Performance mensal', time: '2 dias atrás', icon: FileText, color: 'text-orange-500' },
              { action: 'Pagamento recebido', item: 'Fatura #1234', time: '3 dias atrás', icon: DollarSign, color: 'text-green-500' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center`}>
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
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
      </div>
    </div>
  )
}

export default WebDashboard