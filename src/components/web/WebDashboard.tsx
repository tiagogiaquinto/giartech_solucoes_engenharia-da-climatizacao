import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, FolderOpen, Clock, Plus, CheckCircle, AlertCircle, X, Save, Mail, Phone, Calendar, FileText, Send, DollarSign, ArrowUp, ArrowDown, ChevronRight, RefreshCw, Package, PieChart, Info, Flag, MessageCircle } from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { Link } from 'react-router-dom'
import { useDashboardData } from '../../hooks/useDashboardData'
import ThomazContextualAssistant from '../ThomazContextualAssistant'
import { formatDateSafe } from '../utils/format'
import { GoalsProgressWidget } from '../GoalsProgressWidget'

interface WebDashboardProps {
  onPremiumFeature: (feature: string) => void
}

const WebDashboard: React.FC<WebDashboardProps> = ({ onPremiumFeature }) => {
  const { user, isPremium } = useUser()
  const { metrics, financial, recentTransactions, activeOrders, osCostBreakdown, financialClosingSummary, recentClosings, loading, error, refresh, profit, profitMargin } = useDashboardData()
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

      {/* Goals Progress Widget */}
      <GoalsProgressWidget compact={true} />

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

              <div className={`rounded-xl p-4 ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Lucro</h3>
                  {profit >= 0
                    ? <TrendingUp className="h-5 w-5 text-green-500" />
                    : <ArrowDown className="h-5 w-5 text-red-500" />
                  }
                </div>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit < 0 ? '-' : ''}R$ {Math.abs(profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {profit < 0 && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">Despesas acima das receitas</p>
                )}
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
                        {formatDateSafe(transaction.data)}
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
                  <span>Criado: {formatDateSafe(order.created_at)}</span>
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

      {/* OS Cost Breakdown Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Composição de Custo/Lucro (OS Concluídas)</h2>
          </div>
          <Link to="/financial-analysis" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
            Análise completa <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {!osCostBreakdown ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Info className="h-10 w-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium">Nenhuma OS concluída com dados de custo ainda.</p>
            <p className="text-xs mt-1">Adicione valores de Mão de Obra e Materiais em uma OS concluída para ver os gráficos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visual bar breakdown */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-4">Distribuição do Faturamento</h3>
              {(() => {
                const total = osCostBreakdown.total_faturamento || 1
                const segments = [
                  { label: 'Lucro Líquido', value: osCostBreakdown.total_margem_liquida, color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50' },
                  { label: 'Impostos', value: osCostBreakdown.total_impostos, color: 'bg-red-400', textColor: 'text-red-700', bg: 'bg-red-50' },
                  { label: 'Materiais', value: osCostBreakdown.total_custo_materiais, color: 'bg-amber-400', textColor: 'text-amber-700', bg: 'bg-amber-50' },
                  { label: 'Mão de Obra', value: osCostBreakdown.total_custo_mao_obra, color: 'bg-blue-400', textColor: 'text-blue-700', bg: 'bg-blue-50' },
                  { label: 'Outros Custos', value: osCostBreakdown.total_custo_extras, color: 'bg-gray-400', textColor: 'text-gray-700', bg: 'bg-gray-50' },
                ]
                return (
                  <div className="space-y-3">
                    {/* Stacked bar */}
                    <div className="flex h-8 rounded-lg overflow-hidden gap-0.5">
                      {segments.filter(s => s.value > 0).map((seg, i) => (
                        <div
                          key={i}
                          className={`${seg.color} transition-all`}
                          style={{ width: `${Math.max((seg.value / total) * 100, 1)}%` }}
                          title={`${seg.label}: R$ ${seg.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        />
                      ))}
                      {segments.every(s => s.value === 0) && (
                        <div className="bg-gray-200 w-full" />
                      )}
                    </div>
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {segments.map((seg, i) => (
                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${seg.bg}`}>
                          <div className={`w-3 h-3 rounded-full ${seg.color} flex-shrink-0`} />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 truncate">{seg.label}</p>
                            <p className={`text-sm font-semibold ${seg.textColor}`}>
                              {total > 0 ? `${((seg.value / total) * 100).toFixed(1)}%` : '0%'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* KPI summary */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Resumo das OS Concluídas</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">Faturamento Total</p>
                  <p className="text-lg font-bold text-emerald-700">
                    R$ {osCostBreakdown.total_faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">Margem Média</p>
                  <p className="text-lg font-bold text-blue-700">
                    {osCostBreakdown.margem_media_pct.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">OS com Custo</p>
                  <p className="text-lg font-bold text-amber-700">
                    {osCostBreakdown.os_com_custo}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">OS sem Custo</p>
                  <p className="text-lg font-bold text-gray-600">
                    {osCostBreakdown.os_sem_custo}
                    {osCostBreakdown.os_sem_custo > 0 && (
                      <span className="text-xs text-orange-500 ml-1">preencher</span>
                    )}
                  </p>
                </div>
              </div>
              {osCostBreakdown.os_sem_custo > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                  <strong>{osCostBreakdown.os_sem_custo} OS</strong> ainda sem custo preenchido. Adicione Mão de Obra e Materiais para ver o lucro real.
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Financial Closings Panel */}
      {financialClosingSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">Fechamentos Financeiros Automáticos</h2>
              {financialClosingSummary.pendentes_notificacao > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">
                  {financialClosingSummary.pendentes_notificacao} pendente{financialClosingSummary.pendentes_notificacao > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <Link to="/cfo-dashboard" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
              Dashboard CFO <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* KPIs de Fechamento */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Fechamentos</p>
              <p className="text-2xl font-bold text-emerald-700">{financialClosingSummary.total_fechamentos}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Lucro Acumulado</p>
              <p className="text-2xl font-bold text-blue-700">
                R$ {Number(financialClosingSummary.lucro_total).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-teal-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Margem Média</p>
              <p className="text-2xl font-bold text-teal-700">
                {Number(financialClosingSummary.margem_media_pct).toFixed(1)}%
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Lucro (30 dias)</p>
              <p className="text-2xl font-bold text-amber-700">
                R$ {Number(financialClosingSummary.lucro_30d).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Últimos Fechamentos */}
          {recentClosings.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Últimos Fechamentos</h3>
              <div className="space-y-2">
                {recentClosings.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${Number(c.percentual_margem) >= 30 ? 'bg-emerald-500' : Number(c.percentual_margem) >= 10 ? 'bg-amber-400' : 'bg-red-400'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">OS #{c.order_number} — {c.customer_name}</p>
                        <p className="text-xs text-gray-500">{formatDateSafe(c.closed_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500">Faturamento</p>
                        <p className="text-sm font-medium text-gray-800">R$ {Number(c.valor_bruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Lucro Líquido</p>
                        <p className={`text-sm font-bold ${Number(c.margem_liquida) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          R$ {Number(c.margem_liquida).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${Number(c.percentual_margem) >= 30 ? 'bg-emerald-100 text-emerald-700' : Number(c.percentual_margem) >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {Number(c.percentual_margem).toFixed(1)}%
                      </div>
                      {c.notification_status === 'queued' && (
                        <div title="Aguardando envio WhatsApp" className="text-orange-400">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                      )}
                      {c.notification_status === 'sent' && (
                        <div title="Notificado no WhatsApp" className="text-emerald-500">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

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