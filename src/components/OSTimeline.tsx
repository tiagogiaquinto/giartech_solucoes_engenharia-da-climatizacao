import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  User,
  MessageSquare,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  XCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, formatDistance } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TimelineEntry {
  id: string
  old_status: string
  new_status: string
  changed_by_name: string
  comments?: string
  duration_in_status?: string
  notification_sent: boolean
  created_at: string
}

interface OSTimelineProps {
  serviceOrderId: string
  isOpen: boolean
  onClose: () => void
  currentStatus?: string
}

export const OSTimeline = ({
  serviceOrderId,
  isOpen,
  onClose,
  currentStatus
}: OSTimelineProps) => {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (isOpen && serviceOrderId) {
      loadTimeline()
    }
  }, [isOpen, serviceOrderId])

  const loadTimeline = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('service_order_status_history')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTimeline(data || [])
    } catch (err) {
      console.error('Erro ao carregar timeline:', err)
    } finally {
      setLoading(false)
    }
  }

  const addComment = async () => {
    if (!newComment.trim() || !currentStatus) return

    try {
      const { error } = await supabase
        .from('service_order_status_history')
        .insert({
          service_order_id: serviceOrderId,
          old_status: currentStatus,
          new_status: currentStatus,
          changed_by_name: 'Usuário',
          comments: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      loadTimeline()
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err)
      alert('Erro ao adicionar comentário')
    }
  }

  const exportTimeline = () => {
    const headers = ['Data/Hora', 'Status Anterior', 'Novo Status', 'Usuário', 'Tempo no Status', 'Comentários']
    const rows = timeline.map(entry => [
      format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm'),
      getStatusLabel(entry.old_status),
      getStatusLabel(entry.new_status),
      entry.changed_by_name || 'Sistema',
      entry.duration_in_status || '-',
      entry.comments || ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `timeline-os-${serviceOrderId}-${Date.now()}.csv`
    link.click()
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'paused': 'Pausada',
      'completed': 'Concluída',
      'cancelled': 'Cancelada',
      'aberta': 'Aberta',
      'em_andamento': 'Em Andamento',
      'pausada': 'Pausada',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada'
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'aberta':
        return <AlertCircle className="w-5 h-5" />
      case 'in_progress':
      case 'em_andamento':
        return <PlayCircle className="w-5 h-5" />
      case 'paused':
      case 'pausada':
        return <PauseCircle className="w-5 h-5" />
      case 'completed':
      case 'concluida':
        return <CheckCircle className="w-5 h-5" />
      case 'cancelled':
      case 'cancelada':
        return <XCircle className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'aberta':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'in_progress':
      case 'em_andamento':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'paused':
      case 'pausada':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'completed':
      case 'concluida':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'cancelled':
      case 'cancelada':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const formatDuration = (duration?: string) => {
    if (!duration) return null

    // Parse PostgreSQL interval format
    const match = duration.match(/(\d+):(\d+):(\d+)/)
    if (!match) return duration

    const [, hours, minutes] = match
    const h = parseInt(hours)
    const m = parseInt(minutes)

    if (h > 0) {
      return `${h}h ${m}min`
    }
    return `${m}min`
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
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Timeline da OS</h2>
                <p className="text-sm text-blue-100 mt-1">
                  Histórico completo de mudanças de status
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

          {/* Actions Bar */}
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{timeline.length}</span> eventos registrados
            </div>
            <button
              onClick={exportTimeline}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>

          {/* Timeline Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : timeline.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Nenhum histórico disponível</p>
                <p className="text-gray-500 text-sm mt-2">
                  Os eventos aparecerão aqui conforme a OS evoluir
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-6">
                  {timeline.map((entry, index) => {
                    const isStatusChange = entry.old_status !== entry.new_status
                    const isComment = !isStatusChange

                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative pl-20"
                      >
                        {/* Icon */}
                        <div
                          className={`absolute left-0 w-16 h-16 rounded-full border-4 border-white flex items-center justify-center shadow-lg ${
                            isComment
                              ? 'bg-purple-100 text-purple-600'
                              : getStatusColor(entry.new_status)
                          }`}
                        >
                          {isComment ? (
                            <MessageSquare className="w-6 h-6" />
                          ) : (
                            getStatusIcon(entry.new_status)
                          )}
                        </div>

                        {/* Content Card */}
                        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              {isStatusChange ? (
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getStatusColor(
                                      entry.old_status
                                    )}`}
                                  >
                                    {getStatusLabel(entry.old_status)}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getStatusColor(
                                      entry.new_status
                                    )}`}
                                  >
                                    {getStatusLabel(entry.new_status)}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-lg font-semibold text-gray-900 mb-2">
                                  Comentário Adicionado
                                </div>
                              )}

                              {entry.comments && (
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  {entry.comments}
                                </p>
                              )}

                              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {entry.changed_by_name || 'Sistema'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                    locale: ptBR
                                  })}
                                </span>
                                <span className="text-gray-500">
                                  {formatDistance(new Date(entry.created_at), new Date(), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </span>
                              </div>

                              {entry.duration_in_status && (
                                <div className="mt-2 text-sm text-blue-600 font-medium">
                                  ⏱️ Tempo no status anterior: {formatDuration(entry.duration_in_status)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Add Comment */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addComment()}
                placeholder="Adicionar comentário à timeline..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addComment}
                disabled={!newComment.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Adicionar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
