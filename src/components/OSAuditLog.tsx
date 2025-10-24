import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, User, Clock, FileText, Edit, Trash2, Plus, X, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditEntry {
  id: string
  action: string
  entity_type: string
  user_name: string
  changes_summary: string
  old_values?: any
  new_values?: any
  created_at: string
}

interface OSAuditLogProps {
  serviceOrderId: string
  isOpen: boolean
  onClose: () => void
}

export const OSAuditLog = ({ serviceOrderId, isOpen, onClose }: OSAuditLogProps) => {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen && serviceOrderId) {
      loadAuditLog()
    }
  }, [isOpen, serviceOrderId])

  const loadAuditLog = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('service_order_audit_log')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAuditLog(data || [])
    } catch (err) {
      console.error('Erro ao carregar log de auditoria:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedEntries(newExpanded)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="w-4 h-4" />
      case 'updated':
        return <Edit className="w-4 h-4" />
      case 'deleted':
        return <Trash2 className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'updated':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'deleted':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: 'Criado',
      updated: 'Atualizado',
      deleted: 'Excluído',
      status_changed: 'Status Alterado'
    }
    return labels[action] || action
  }

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  const getChanges = (entry: AuditEntry) => {
    if (!entry.old_values || !entry.new_values) return []

    const changes: Array<{ field: string; old: any; new: any }> = []
    const newValues = entry.new_values
    const oldValues = entry.old_values

    Object.keys(newValues).forEach(key => {
      if (JSON.stringify(newValues[key]) !== JSON.stringify(oldValues[key])) {
        changes.push({
          field: key,
          old: oldValues[key],
          new: newValues[key]
        })
      }
    })

    return changes
  }

  const exportToCSV = () => {
    const headers = ['Data/Hora', 'Ação', 'Usuário', 'Descrição']
    const rows = auditLog.map(entry => [
      format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm'),
      getActionLabel(entry.action),
      entry.user_name || 'Sistema',
      entry.changes_summary
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `auditoria-os-${serviceOrderId}-${Date.now()}.csv`
    link.click()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Histórico de Auditoria</h2>
                <p className="text-sm text-blue-100 mt-1">
                  Todas as alterações e ações realizadas nesta OS
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{auditLog.length}</span> registros encontrados
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : auditLog.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Nenhum registro de auditoria</p>
                <p className="text-gray-500 text-sm mt-2">
                  As alterações aparecerão aqui automaticamente
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLog.map((entry, index) => {
                  const isExpanded = expandedEntries.has(entry.id)
                  const changes = getChanges(entry)

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${getActionColor(entry.action)}`}>
                            {getActionIcon(entry.action)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded border ${getActionColor(entry.action)}`}>
                                {getActionLabel(entry.action)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {entry.entity_type}
                              </span>
                            </div>

                            <p className="text-gray-900 font-medium mb-2">
                              {entry.changes_summary}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {entry.user_name || 'Sistema'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(entry.created_at)}
                              </span>
                            </div>

                            {changes.length > 0 && (
                              <button
                                onClick={() => toggleExpanded(entry.id)}
                                className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Ocultar detalhes
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Ver {changes.length} {changes.length === 1 ? 'mudança' : 'mudanças'}
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && changes.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-4 pt-4 border-t border-gray-200 overflow-hidden"
                            >
                              <div className="space-y-2">
                                {changes.map((change, idx) => (
                                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs font-semibold text-gray-700 mb-2 uppercase">
                                      {change.field.replace(/_/g, ' ')}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <div className="text-xs text-gray-500 mb-1">Antes</div>
                                        <div className="text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
                                          {String(change.old ?? 'vazio')}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500 mb-1">Depois</div>
                                        <div className="text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                                          {String(change.new ?? 'vazio')}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
