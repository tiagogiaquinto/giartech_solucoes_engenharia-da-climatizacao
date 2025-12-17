import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Users, Eye, Calendar, TrendingUp, Download,
  BarChart3, Clock, Shield, Search, Filter, FileText
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatDateSafe } from '../utils/format'

interface ActivityLog {
  id: string
  user_email: string
  user_id: string
  activity_type: string
  module_code: string
  action_description: string
  created_at: string
  success: boolean
}

interface UserMetrics {
  user_id: string
  user_email: string
  user_name: string
  total_activities: number
  total_logins: number
  modules_accessed: string[]
  last_activity: string
}

const AuditDashboard = () => {
  const { currentUser, isAdmin } = useAuth()
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [userMetrics, setUserMetrics] = useState<UserMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActivity, setFilterActivity] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 50

  useEffect(() => {
    if (isAdmin) {
      loadAuditData()
    }
  }, [isAdmin, dateRange])

  const loadAuditData = async () => {
    try {
      setLoading(true)

      const { data: logs } = await supabase
        .from('user_activity_log')
        .select('*')
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(500)

      if (logs) {
        setActivityLogs(logs)
      }

      const { data: metrics } = await supabase.rpc('get_user_activity_report', {
        p_start_date: `${dateRange.start}T00:00:00`,
        p_end_date: `${dateRange.end}T23:59:59`
      })

      if (metrics) {
        setUserMetrics(metrics)
      }
    } catch (error) {
      console.error('Error loading audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch =
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module_code?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterActivity === 'all' ? true :
      log.activity_type === filterActivity

    return matchesSearch && matchesFilter
  })

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  )

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  const totalActivities = activityLogs.length
  const totalLogins = activityLogs.filter(log => log.activity_type === 'login').length
  const uniqueUsers = new Set(activityLogs.map(log => log.user_id)).size
  const avgActivitiesPerUser = uniqueUsers > 0 ? Math.round(totalActivities / uniqueUsers) : 0

  const activityTypes = Array.from(new Set(activityLogs.map(log => log.activity_type)))

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'login': return 'bg-green-100 text-green-800'
      case 'logout': return 'bg-gray-100 text-gray-800'
      case 'create': return 'bg-blue-100 text-blue-800'
      case 'update': return 'bg-yellow-100 text-yellow-800'
      case 'delete': return 'bg-red-100 text-red-800'
      case 'view': return 'bg-purple-100 text-purple-800'
      case 'export': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const exportToCSV = () => {
    const headers = ['Data/Hora', 'Usuário', 'Tipo', 'Módulo', 'Descrição', 'Status']
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.user_email || 'N/A',
      log.activity_type,
      log.module_code || 'N/A',
      log.action_description || 'N/A',
      log.success ? 'Sucesso' : 'Falha'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `auditoria_${dateRange.start}_${dateRange.end}.csv`
    link.click()
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores podem acessar o dashboard de auditoria.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Auditoria</h1>
              <p className="text-gray-600">Monitore todas as atividades do sistema</p>
            </div>
          </div>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{totalActivities}</h3>
            <p className="text-sm text-gray-600">Total de Atividades</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{uniqueUsers}</h3>
            <p className="text-sm text-gray-600">Usuários Ativos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-400 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{totalLogins}</h3>
            <p className="text-sm text-gray-600">Total de Logins</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{avgActivitiesPerUser}</h3>
            <p className="text-sm text-gray-600">Média por Usuário</p>
          </motion.div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por usuário, ação ou módulo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterActivity}
                  onChange={(e) => setFilterActivity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas as Atividades</option>
                  {activityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Módulo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-gray-600">Carregando...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Nenhuma atividade encontrada no período selecionado
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user_email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(log.activity_type)}`}>
                          {log.activity_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.module_code || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {log.action_description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.success ? (
                          <span className="text-green-600 text-sm">✓ Sucesso</span>
                        ) : (
                          <span className="text-red-600 text-sm">✗ Falha</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditDashboard
