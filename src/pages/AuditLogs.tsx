import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, FileText, User, Clock, ListFilter as Filter, Download, Search, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Circle as XCircle, CreditCard as Edit, Plus, Trash2, Calendar, Database } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

interface AuditLog {
  id: string
  table_name: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  record_id: string
  old_data: any
  new_data: any
  changed_fields: any[]
  user_id: string
  user_email: string
  created_at: string
}

interface AuditSummary {
  table_name: string
  total_operations: number
  inserts: number
  updates: number
  deletes: number
  last_activity: string
}

const tableLabels: Record<string, string> = {
  customers: 'Clientes',
  service_orders: 'Ordens de Serviço',
  agenda: 'Agenda',
  finance_entries: 'Lançamentos Financeiros',
  employees: 'Funcionários',
  materials: 'Materiais',
  service_catalog: 'Catálogo de Serviços',
  user_profiles: 'Perfis de Usuários'
}

const operationIcons = {
  INSERT: <Plus className="w-4 h-4" />,
  UPDATE: <Edit className="w-4 h-4" />,
  DELETE: <Trash2 className="w-4 h-4" />
}

const operationColors = {
  INSERT: 'bg-green-100 text-green-700 border-green-200',
  UPDATE: 'bg-blue-100 text-blue-700 border-blue-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200'
}

const operationLabels = {
  INSERT: 'Criação',
  UPDATE: 'Edição',
  DELETE: 'Exclusão'
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [summary, setSummary] = useState<AuditSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const [filters, setFilters] = useState({
    table: '',
    operation: '',
    user: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })

  useEffect(() => {
    loadAuditData()
  }, [filters])

  const loadAuditData = async () => {
    setLoading(true)
    try {
      let logsQuery = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filters.table) {
        logsQuery = logsQuery.eq('table_name', filters.table)
      }
      if (filters.operation) {
        logsQuery = logsQuery.eq('operation', filters.operation)
      }
      if (filters.user) {
        logsQuery = logsQuery.ilike('user_email', `%${filters.user}%`)
      }
      if (filters.dateFrom) {
        logsQuery = logsQuery.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        logsQuery = logsQuery.lte('created_at', filters.dateTo)
      }

      const { data: logsData } = await logsQuery
      const { data: summaryData } = await supabase
        .from('audit_summary_by_table')
        .select('*')

      setLogs(logsData || [])
      setSummary(summaryData || [])
    } catch (error) {
      console.error('Error loading audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Data/Hora', 'Tabela', 'Operação', 'Usuário', 'ID do Registro']
    const rows = logs.map(log => [
      format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
      tableLabels[log.table_name] || log.table_name,
      operationLabels[log.operation],
      log.user_email || 'Sistema',
      log.record_id
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`
    a.click()
  }

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'UPDATE': return <AlertCircle className="w-5 h-5 text-blue-600" />
      case 'DELETE': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Auditoria do Sistema
          </h1>
          <p className="text-gray-600 mt-1">
            Rastreamento completo de todas as operações no sistema
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Resumo por Tabela */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((item) => (
          <motion.div
            key={item.table_name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                {tableLabels[item.table_name] || item.table_name}
              </h3>
              <Database className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">{item.total_operations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Criações:</span>
                <span className="font-semibold text-green-600">{item.inserts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Edições:</span>
                <span className="font-semibold text-blue-600">{item.updates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Exclusões:</span>
                <span className="font-semibold text-red-600">{item.deletes}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tabela
            </label>
            <select
              value={filters.table}
              onChange={(e) => setFilters({ ...filters, table: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              {Object.entries(tableLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operação
            </label>
            <select
              value={filters.operation}
              onChange={(e) => setFilters({ ...filters, operation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              <option value="INSERT">Criação</option>
              <option value="UPDATE">Edição</option>
              <option value="DELETE">Exclusão</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuário
            </label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              placeholder="Email do usuário"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Últimas Atividades ({logs.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tabela
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalhes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                      {tableLabels[log.table_name] || log.table_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${operationColors[log.operation]}`}>
                      {operationIcons[log.operation]}
                      {operationLabels[log.operation]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {log.user_email || 'Sistema'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.operation === 'UPDATE' && log.changed_fields && (
                      <span className="text-blue-600">
                        {log.changed_fields.length} campo(s) alterado(s)
                      </span>
                    )}
                    {log.operation === 'INSERT' && (
                      <span className="text-green-600">Novo registro</span>
                    )}
                    {log.operation === 'DELETE' && (
                      <span className="text-red-600">Registro excluído</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h2 className="text-2xl font-bold">Detalhes da Auditoria</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Operação
                    </label>
                    <span className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border ${operationColors[selectedLog.operation]}`}>
                      {operationIcons[selectedLog.operation]}
                      {operationLabels[selectedLog.operation]}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Tabela
                    </label>
                    <p className="text-gray-900 font-medium">
                      {tableLabels[selectedLog.table_name] || selectedLog.table_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Usuário
                    </label>
                    <p className="text-gray-900">{selectedLog.user_email || 'Sistema'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Data/Hora
                    </label>
                    <p className="text-gray-900">
                      {format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </p>
                  </div>
                </div>

                {/* Campos Alterados (UPDATE) */}
                {selectedLog.operation === 'UPDATE' && selectedLog.changed_fields && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Campos Alterados
                    </h3>
                    <div className="space-y-3">
                      {selectedLog.changed_fields.map((field: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="font-medium text-gray-900 mb-2">{field.field}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs text-red-600 font-medium">ANTES:</span>
                              <pre className="mt-1 text-sm text-gray-700 bg-white p-2 rounded border border-red-200">
                                {JSON.stringify(field.old_value, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <span className="text-xs text-green-600 font-medium">DEPOIS:</span>
                              <pre className="mt-1 text-sm text-gray-700 bg-white p-2 rounded border border-green-200">
                                {JSON.stringify(field.new_value, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dados Completos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLog.old_data && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Dados Anteriores
                      </h3>
                      <pre className="text-xs bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
                        {JSON.stringify(selectedLog.old_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.new_data && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Dados Novos
                      </h3>
                      <pre className="text-xs bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
                        {JSON.stringify(selectedLog.new_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
