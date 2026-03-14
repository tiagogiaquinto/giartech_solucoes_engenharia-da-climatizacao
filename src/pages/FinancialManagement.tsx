import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, Calendar, ListFilter as Filter, Download, Plus, FileText, CreditCard, AlertCircle, CheckCircle2, Clock, CreditCard as Edit, Trash2, Package, RefreshCw, Repeat, CheckSquare, Square } from 'lucide-react'
import { supabase, bulkDelete } from '../lib/supabase'
import { Link } from 'react-router-dom'
import FinanceEntryModal from '../components/FinanceEntryModal'
import RecurrenceCalendarModal from '../components/RecurrenceCalendarModal'
import { formatDateSafe } from '../utils/format'

interface FinanceEntry {
  id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  status: 'recebido' | 'pago' | 'a_receber' | 'a_pagar'
  data: string
  data_vencimento?: string
  customer_id?: string
  recorrente?: boolean
  frequencia_recorrencia?: 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  data_fim_recorrencia?: string
  created_at: string
}

interface FinancialMetrics {
  totalReceitas: number
  totalDespesas: number
  saldo: number
  contasReceber: number
  contasPagar: number
  receitasMes: number
  despesasMes: number
  valorEstoque: number
}

const FinancialManagement = () => {
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    contasReceber: 0,
    contasPagar: 0,
    receitasMes: 0,
    despesasMes: 0,
    valorEstoque: 0
  })
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')
  const [filterRecurrence, setFilterRecurrence] = useState<'all' | 'recorrente' | 'nao_recorrente'>('all')
  const [sortField, setSortField] = useState<'data' | 'data_vencimento' | 'valor' | 'created_at'>('data_vencimento')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [categories, setCategories] = useState<any[]>([])
  const itemsPerPage = 15
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | undefined>(undefined)
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false)
  const [generatingRecurrences, setGeneratingRecurrences] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    loadFinancialData()
    loadCategories()

    const channel = supabase
      .channel('finance_entries_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'finance_entries'
      }, () => {
        loadFinancialData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    loadFinancialData()
  }, [sortField, sortOrder])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadFinancialData = async (forceRefresh = false) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('finance_entries')
        .select('*')
        .order(sortField, { ascending: sortOrder === 'asc' })

      if (error) throw error

      console.log('Loaded finance entries:', data?.length)
      setEntries(data || [])
      await calculateMetrics(data || [])
    } catch (error) {
      console.error('Error loading financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, descricao: string) => {
    if (!confirm(`Tem certeza que deseja excluir o lançamento "${descricao}"?\n\nEsta ação é irreversível e terá efeito cascata em registros relacionados.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('finance_entries')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Lançamento excluído com sucesso!')
      setSelectedIds(new Set())
      await loadFinancialData()
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Erro ao excluir lançamento. Verifique se não há registros relacionados.')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedEntries.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedEntries.map(e => e.id)))
    }
  }

  const toggleSelectEntry = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    setShowBulkDeleteConfirm(true)
  }

  const confirmBulkDelete = async () => {
    try {
      setBulkDeleting(true)
      setShowBulkDeleteConfirm(false)

      const idsArray = Array.from(selectedIds)
      const result = await bulkDelete('finance_entries', idsArray, 100)

      if (result.success.length > 0) {
        alert(`✅ Exclusão concluída!\n\n✅ Sucesso: ${result.success.length} lançamento(s)\n${result.failed.length > 0 ? `❌ Falhou: ${result.failed.length} lançamento(s)` : ''}`)
      }

      if (result.failed.length > 0) {
        console.error('Failed deletions:', result.failed)
      }

      setSelectedIds(new Set())
      await loadFinancialData()
    } catch (error) {
      console.error('Error bulk deleting:', error)
      alert('Erro ao excluir lançamentos em massa.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleGenerateRecurrences = async () => {
    if (!confirm('Deseja gerar todos os lançamentos recorrentes para os próximos 12 meses?\n\nIsso criará automaticamente os lançamentos futuros baseados nas suas recorrências ativas.')) {
      return
    }

    try {
      setGeneratingRecurrences(true)

      const { data, error } = await supabase.rpc('regenerate_all_recurrences')

      if (error) throw error

      const result = data as {
        success: boolean
        recurrences_processed: number
        total_generated: number
        total_errors: number
        months_ahead: number
      }

      if (result.success) {
        alert(`✅ Geração concluída!\n\n📊 Recorrências processadas: ${result.recurrences_processed}\n✨ Lançamentos criados: ${result.total_generated}\n❌ Erros: ${result.total_errors}\n📅 Meses gerados: ${result.months_ahead}`)
        await loadFinancialData()
      } else {
        alert('Erro ao gerar recorrências.')
      }
    } catch (error) {
      console.error('Error generating recurrences:', error)
      alert('Erro ao gerar recorrências. Tente novamente.')
    } finally {
      setGeneratingRecurrences(false)
    }
  }

  const calculateMetrics = async (data: FinanceEntry[]) => {
    const totalReceitas = data
      .filter(e => e.tipo === 'receita' && (e.status === 'recebido'))
      .reduce((sum, e) => sum + Number(e.valor), 0)

    const totalDespesas = data
      .filter(e => e.tipo === 'despesa' && (e.status === 'pago'))
      .reduce((sum, e) => sum + Number(e.valor), 0)

    const contasReceber = data
      .filter(e => e.tipo === 'receita' && e.status === 'a_receber')
      .reduce((sum, e) => sum + Number(e.valor), 0)

    const contasPagar = data
      .filter(e => e.tipo === 'despesa' && e.status === 'a_pagar')
      .reduce((sum, e) => sum + Number(e.valor), 0)

    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    const receitasMes = data
      .filter(e => {
        const dataEntry = new Date(e.data)
        return e.tipo === 'receita' &&
               e.status === 'recebido' &&
               dataEntry.getMonth() === mesAtual &&
               dataEntry.getFullYear() === anoAtual
      })
      .reduce((sum, e) => sum + Number(e.valor), 0)

    const despesasMes = data
      .filter(e => {
        const dataEntry = new Date(e.data)
        return e.tipo === 'despesa' &&
               e.status === 'pago' &&
               dataEntry.getMonth() === mesAtual &&
               dataEntry.getFullYear() === anoAtual
      })
      .reduce((sum, e) => sum + Number(e.valor), 0)

    let valorEstoque = 0
    try {
      const { data: inventoryData, error } = await supabase
        .from('inventory_items')
        .select('quantity, unit_price')
        .eq('active', true)

      if (!error && inventoryData) {
        valorEstoque = inventoryData.reduce((sum, item) => {
          return sum + (Number(item.quantity || 0) * Number(item.unit_price || 0))
        }, 0)
      }
    } catch (error) {
      console.error('Error calculating inventory value:', error)
    }

    setMetrics({
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      contasReceber,
      contasPagar,
      receitasMes,
      despesasMes,
      valorEstoque
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recebido':
      case 'pago':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'a_receber':
      case 'a_pagar':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      recebido: 'Recebido',
      pago: 'Pago',
      a_receber: 'A Receber',
      a_pagar: 'A Pagar'
    }
    return statusMap[status] || status
  }

  const getTipoText = (tipo: string) => {
    return tipo === 'receita' ? 'Income' : 'Expense'
  }

  const filteredEntries = entries.filter(entry => {
    const matchesType = filterType === 'all' || entry.tipo === filterType
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus

    const matchesSearch = !filterSearch ||
      entry.descricao?.toLowerCase().includes(filterSearch.toLowerCase())

    const matchesCategory = filterCategory === 'all' ||
      (entry as any).categoria === filterCategory ||
      (entry as any).category === filterCategory

    // Usar data_vencimento para filtros (mais relevante para recorrências)
    const dateToFilter = (entry as any).data_vencimento || entry.data
    const entryDate = new Date(dateToFilter)
    const matchesMonth = !filterMonth || entryDate.getMonth() + 1 === parseInt(filterMonth)
    const matchesYear = !filterYear || entryDate.getFullYear() === parseInt(filterYear)

    const matchesDateRange = (!filterDateStart || dateToFilter >= filterDateStart) &&
                             (!filterDateEnd || dateToFilter <= filterDateEnd)

    const matchesRecurrence = filterRecurrence === 'all' ||
      (filterRecurrence === 'recorrente' && (entry as any).is_recurring === true) ||
      (filterRecurrence === 'nao_recorrente' && !(entry as any).is_recurring)

    return matchesType && matchesStatus && matchesSearch && matchesCategory &&
           matchesMonth && matchesYear && matchesDateRange && matchesRecurrence
  })

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage)
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            Gestão Financeira
          </h1>
          <p className="text-gray-600 mt-1">Receitas, despesas e DRE</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateRecurrences}
            disabled={generatingRecurrences}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              generatingRecurrences
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {generatingRecurrences ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Repeat className="h-4 w-4" />
                Gerar Recorrências
              </>
            )}
          </button>
          <Link
            to="/financial-integration"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Ver Dashboard Financeiro
          </Link>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8" />
            <span className="text-sm font-medium opacity-90">Receitas</span>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.totalReceitas)}</div>
          <div className="text-sm opacity-90 mt-1">
            {formatCurrency(metrics.receitasMes)} este mês
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="h-8 w-8" />
            <span className="text-sm font-medium opacity-90">Despesas</span>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.totalDespesas)}</div>
          <div className="text-sm opacity-90 mt-1">
            {formatCurrency(metrics.despesasMes)} este mês
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8" />
            <span className="text-sm font-medium opacity-90">Saldo</span>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.saldo)}</div>
          <div className="text-sm opacity-90 mt-1">
            Resultado líquido
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8" />
            <span className="text-sm font-medium opacity-90">Pendências</span>
          </div>
          <div className="text-3xl font-bold">
            {formatCurrency(metrics.contasReceber + metrics.contasPagar)}
          </div>
          <div className="text-sm opacity-90 mt-1">
            ↑ {formatCurrency(metrics.contasReceber)} | ↓ {formatCurrency(metrics.contasPagar)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Package className="h-8 w-8" />
            <span className="text-sm font-medium opacity-90">Estoque</span>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.valorEstoque)}</div>
          <div className="text-sm opacity-90 mt-1">
            Valor total em materiais
          </div>
        </motion.div>
      </div>

      {/* Filtros Avançados */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRecurrenceModal(true)}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Calendar className="h-4 w-4" />
              Calendário de Recorrências
            </button>
            <button
              onClick={() => {
                setFilterType('all')
                setFilterStatus('all')
                setFilterSearch('')
                setFilterCategory('all')
                setFilterMonth('')
                setFilterYear('')
                setFilterDateStart('')
                setFilterDateEnd('')
                setFilterRecurrence('all')
                setSortField('data')
                setSortOrder('desc')
                setCurrentPage(1)
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={filterSearch}
            onChange={(e) => {
              setFilterSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as any)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="recebido">Recebido</option>
            <option value="pago">Pago</option>
            <option value="a_receber">A Receber</option>
            <option value="a_pagar">A Pagar</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os meses</option>
            <option value="1">Janeiro</option>
            <option value="2">Fevereiro</option>
            <option value="3">Março</option>
            <option value="4">Abril</option>
            <option value="5">Maio</option>
            <option value="6">Junho</option>
            <option value="7">Julho</option>
            <option value="8">Agosto</option>
            <option value="9">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>

          <select
            value={filterYear}
            onChange={(e) => {
              setFilterYear(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os anos</option>
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <input
            type="date"
            value={filterDateStart}
            onChange={(e) => {
              setFilterDateStart(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Data início"
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={filterDateEnd}
            onChange={(e) => {
              setFilterDateEnd(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Data fim"
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filterRecurrence}
            onChange={(e) => {
              setFilterRecurrence(e.target.value as any)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gradient-to-r from-purple-50 to-blue-50"
          >
            <option value="all">Todos os lançamentos</option>
            <option value="recorrente">🔄 Apenas Recorrentes</option>
            <option value="nao_recorrente">📌 Apenas Únicos</option>
          </select>
        </div>

        {/* Ordenação */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="data_vencimento">Data de Vencimento</option>
              <option value="data">Data de Lançamento</option>
              <option value="valor">Valor</option>
              <option value="created_at">Data de Criação</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder('asc')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortOrder === 'asc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ↑ Crescente
              </button>
              <button
                onClick={() => setSortOrder('desc')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortOrder === 'desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ↓ Decrescente
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {paginatedEntries.length} de {filteredEntries.length} lançamentos
        </div>
      </div>

      {/* Lançamentos */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Lançamentos</h2>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedIds.size} selecionado(s)
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {bulkDeleting ? 'Excluindo...' : 'Excluir Selecionados'}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadFinancialData(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                title="Atualizar dados"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
              <button
                onClick={() => {
                  setEditingEntryId(undefined)
                  setShowEntryModal(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Lançamento
              </button>
            </div>
          </div>
        </div>

        {/* Seleção Global */}
        {paginatedEntries.length > 0 && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {selectedIds.size === paginatedEntries.length ? (
                <CheckSquare className="h-5 w-5 text-blue-600" />
              ) : (
                <Square className="h-5 w-5" />
              )}
              <span>Selecionar todos desta página</span>
            </button>
          </div>
        )}

        {/* Lista de Lançamentos */}
        <div className="space-y-2">
          {paginatedEntries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleSelectEntry(entry.id)}
                  className="flex-shrink-0"
                >
                  {selectedIds.has(entry.id) ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                <div className={`p-3 rounded-lg ${
                  entry.tipo === 'receita'
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}>
                  <FileText className={`h-5 w-5 ${
                    entry.tipo === 'receita'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {entry.descricao}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      entry.tipo === 'receita'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {getTipoText(entry.tipo)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(entry.status)}
                    <span className="text-sm text-gray-600">
                      {getStatusText(entry.status)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      entry.tipo === 'receita'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {entry.tipo === 'receita' ? '+' : '-'} {formatCurrency(Number(entry.valor))}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 justify-end">
                      <Calendar className="h-3 w-3" />
                      {(entry.status === 'recebido' || entry.status === 'pago')
                        ? formatDateSafe(entry.data)
                        : formatDateSafe((entry as any).data_vencimento || entry.data)
                      }
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                      {(entry.status === 'recebido' || entry.status === 'pago')
                        ? 'Pago em'
                        : 'Vence em'
                      }
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingEntryId(entry.id)
                        setShowEntryModal(true)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Editar lançamento"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id, entry.descricao)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum lançamento encontrado</p>
          </div>
        )}

        {/* Paginação */}
        {filteredEntries.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Última Sincronização */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">Última Sincronização</p>
            <p className="text-xs text-blue-700">Agora</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            Plano Atual: Premium
          </span>
        </div>
      </div>

      {/* Finance Entry Modal */}
      <FinanceEntryModal
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false)
          setEditingEntryId(undefined)
        }}
        onSave={async () => {
          setShowEntryModal(false)
          setEditingEntryId(undefined)
          await loadFinancialData()
        }}
        entryId={editingEntryId}
      />

      {/* Recurrence Calendar Modal */}
      <RecurrenceCalendarModal
        isOpen={showRecurrenceModal}
        onClose={() => setShowRecurrenceModal(false)}
      />

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Exclusão em Massa
                </h3>
                <p className="text-sm text-gray-600">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                Você está prestes a excluir <strong>{selectedIds.size} lançamento(s)</strong>.
              </p>
              <p className="text-sm text-yellow-800 mt-2">
                Esta ação terá efeito cascata em registros relacionados e não poderá ser desfeita.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBulkDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Confirmar Exclusão
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default FinancialManagement
