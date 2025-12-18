import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  DollarSign
} from 'lucide-react'
import BudgetPDFEditor from '../components/BudgetPDFEditor'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BudgetData } from '../services/budgetPDFService'

interface Budget {
  id: string
  number: string
  customer_name: string
  customer_document: string
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
  total: number
  created_at: string
  valid_until: string
  data: BudgetData
}

export default function BudgetManagement() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showEditor, setShowEditor] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [readOnly, setReadOnly] = useState(false)

  useEffect(() => {
    loadBudgets()
  }, [])

  const loadBudgets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBudgets(data || [])
    } catch (error) {
      console.error('Error loading budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedBudget(null)
    setReadOnly(false)
    setShowEditor(true)
  }

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget)
    setReadOnly(false)
    setShowEditor(true)
  }

  const handleView = (budget: Budget) => {
    setSelectedBudget(budget)
    setReadOnly(true)
    setShowEditor(true)
  }

  const handleSave = async (data: BudgetData) => {
    try {
      if (selectedBudget) {
        const { error } = await supabase
          .from('budgets')
          .update({
            customer_name: data.customer.name,
            customer_document: data.customer.document,
            total: data.total,
            valid_until: data.validUntil,
            data: data,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedBudget.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert([{
            number: data.number,
            customer_name: data.customer.name,
            customer_document: data.customer.document,
            status: 'draft',
            total: data.total,
            valid_until: data.validUntil,
            data: data
          }])

        if (error) throw error
      }

      await loadBudgets()
      setShowEditor(false)
    } catch (error) {
      console.error('Error saving budget:', error)
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este orçamento?')) return

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadBudgets()
    } catch (error) {
      console.error('Error deleting budget:', error)
      alert('Erro ao excluir orçamento')
    }
  }

  const handleDuplicate = async (budget: Budget) => {
    try {
      const newData = {
        ...budget.data,
        number: `ORC-${Date.now()}`,
        date: new Date().toISOString()
      }

      const { error } = await supabase
        .from('budgets')
        .insert([{
          number: newData.number,
          customer_name: budget.customer_name,
          customer_document: budget.customer_document,
          status: 'draft',
          total: budget.total,
          valid_until: budget.valid_until,
          data: newData
        }])

      if (error) throw error
      await loadBudgets()
    } catch (error) {
      console.error('Error duplicating budget:', error)
      alert('Erro ao duplicar orçamento')
    }
  }

  const handleStatusChange = async (id: string, status: Budget['status']) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      await loadBudgets()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch =
      budget.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.customer_document.includes(searchTerm)

    const matchesStatus = statusFilter === 'all' || budget.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusConfig = (status: Budget['status']) => {
    const configs = {
      draft: {
        label: 'Rascunho',
        icon: Edit,
        color: 'text-gray-600',
        bg: 'bg-gray-100'
      },
      sent: {
        label: 'Enviado',
        icon: Send,
        color: 'text-blue-600',
        bg: 'bg-blue-100'
      },
      approved: {
        label: 'Aprovado',
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-100'
      },
      rejected: {
        label: 'Rejeitado',
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-100'
      },
      expired: {
        label: 'Expirado',
        icon: Clock,
        color: 'text-orange-600',
        bg: 'bg-orange-100'
      }
    }
    return configs[status]
  }

  const stats = {
    total: budgets.length,
    draft: budgets.filter(b => b.status === 'draft').length,
    sent: budgets.filter(b => b.status === 'sent').length,
    approved: budgets.filter(b => b.status === 'approved').length,
    totalValue: budgets.reduce((sum, b) => sum + b.total, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Gerenciamento de Orçamentos
              </h1>
              <p className="text-gray-600 mt-1">
                Crie, edite e gerencie orçamentos profissionais em PDF
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Novo Orçamento
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rascunhos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
              </div>
              <Edit className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Enviados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
              </div>
              <Send className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aprovados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-xl font-bold text-gray-900">
                  R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, cliente ou documento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="draft">Rascunho</option>
              <option value="sent">Enviado</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
              <option value="expired">Expirado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Budgets List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Carregando orçamentos...</p>
          </div>
        ) : filteredBudgets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum orçamento encontrado</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro orçamento'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Criar Orçamento
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBudgets.map(budget => {
              const statusConfig = getStatusConfig(budget.status)
              const StatusIcon = statusConfig.icon

              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {budget.number}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium">{budget.customer_name}</span>
                          <span>•</span>
                          <span>{budget.customer_document}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(budget.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-green-600">
                            R$ {budget.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(budget)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleEdit(budget)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleDuplicate(budget)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Duplicar"
                      >
                        <Copy className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      {budget.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(budget.id, 'sent')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Enviar
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <BudgetPDFEditor
            initialData={selectedBudget?.data}
            onSave={handleSave}
            onClose={() => setShowEditor(false)}
            readOnly={readOnly}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
