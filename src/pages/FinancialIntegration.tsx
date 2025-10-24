import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, Users, ChartPie as PieChart, ChartBar as BarChart3, Calendar, Download, ListFilter as Filter, ChevronDown, ChevronUp, FileText, Table, ChartLine as LineChart, CircleAlert as AlertCircle, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import KPIDashboard from '../components/KPIDashboard'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface FinanceEntry {
  id: string
  codigo: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  status: 'recebido' | 'pago' | 'a_receber' | 'a_pagar'
  data: string
  categoria_id?: string
  customer_id?: string
  created_at: string
}

interface Category {
  id: string
  nome: string
  natureza: 'receita' | 'despesa'
  dre_grupo: string
}

interface DREData {
  receitas: { categoria: string; valor: number; percentual: number }[]
  despesas: { categoria: string; valor: number; percentual: number }[]
  totalReceitas: number
  totalDespesas: number
  lucroOperacional: number
  margemOperacional: number
}

interface BankAccount {
  id: string
  account_name: string
  bank_name: string
  balance: number
  is_default: boolean
  total_transactions: number
  total_receitas: number
  total_despesas: number
  saldo_calculado: number
}

const FinancialIntegration = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dre' | 'cashflow' | 'reports' | 'kpis'>('overview')
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [periodFilter, setPeriodFilter] = useState<'month' | 'quarter' | 'year' | 'all'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [metrics, setMetrics] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    lucro: 0,
    custoFolha: 0,
    receitasMes: 0,
    despesasMes: 0,
    lucroMes: 0,
    contasReceber: 0,
    contasPagar: 0,
    margemLucro: 0,
    ticketMedio: 0,
    valorEstoque: 0,
    valorVendaEstoque: 0,
    lucroEstoque: 0
  })

  const [dreData, setDreData] = useState<DREData>({
    receitas: [],
    despesas: [],
    totalReceitas: 0,
    totalDespesas: 0,
    lucroOperacional: 0,
    margemOperacional: 0
  })

  const [cashflowData, setCashflowData] = useState<{
    labels: string[]
    receitas: number[]
    despesas: number[]
    saldo: number[]
  }>({
    labels: [],
    receitas: [],
    despesas: [],
    saldo: []
  })

  useEffect(() => {
    loadAllData()
  }, [periodFilter])

  const loadAllData = async () => {
    try {
      setLoading(true)

      const [entriesResult, categoriesResult, staffResult, materialsResult, bankAccountsResult] = await Promise.all([
        supabase.from('finance_entries').select('*').order('data', { ascending: false }),
        supabase.from('financial_categories').select('*'),
        supabase.from('employees').select('id, name, salary'),
        supabase.from('inventory_items').select('unit_cost, unit_price, quantity').eq('active', true),
        supabase.rpc('get_bank_accounts_with_transactions')
      ])

      if (entriesResult.error) throw entriesResult.error
      if (categoriesResult.error) throw categoriesResult.error
      if (staffResult.error) throw staffResult.error
      if (materialsResult.error) throw materialsResult.error
      if (bankAccountsResult.error) {
        console.error('Erro ao carregar contas bancárias:', bankAccountsResult.error)
      }

      const entriesData = entriesResult.data || []
      const categoriesData = categoriesResult.data || []
      const staffData = staffResult.data || []
      const materialsData = materialsResult.data || []
      const bankAccountsData = bankAccountsResult.data || []

      console.log('📊 Contas bancárias carregadas:', bankAccountsData)

      setEntries(entriesData)
      setCategories(categoriesData)
      setStaff(staffData)
      setMaterials(materialsData)
      setBankAccounts(bankAccountsData)

      calculateMetrics(entriesData, staffData, materialsData)
      calculateDRE(entriesData, categoriesData, staffData)
      calculateCashflow(entriesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (data: FinanceEntry[], staffData: any[], materialsData: any[]) => {
    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    const totalRecebido = data
      .filter(e => e.tipo === 'receita' && e.status === 'recebido')
      .reduce((sum, e) => sum + Number(e.valor), 0)

    const totalPago = data
      .filter(e => e.tipo === 'despesa' && e.status === 'pago')
      .reduce((sum, e) => sum + Number(e.valor), 0)

    const custoFolha = staffData.reduce((sum, s) => sum + Number(s.salary || 0), 0)

    const contasReceber = data
      .filter(e => e.tipo === 'receita' && e.status === 'a_receber')
      .reduce((sum, e) => sum + Number(e.valor), 0)

    const contasPagar = data
      .filter(e => e.tipo === 'despesa' && e.status === 'a_pagar')
      .reduce((sum, e) => sum + Number(e.valor), 0)

    const receitasMes = data
      .filter(e => {
        const dataEntry = new Date(e.data)
        return e.tipo === 'receita' && e.status === 'recebido' &&
          dataEntry.getMonth() === mesAtual && dataEntry.getFullYear() === anoAtual
      })
      .reduce((sum, e) => sum + Number(e.valor), 0)

    const despesasMes = data
      .filter(e => {
        const dataEntry = new Date(e.data)
        return e.tipo === 'despesa' && e.status === 'pago' &&
          dataEntry.getMonth() === mesAtual && dataEntry.getFullYear() === anoAtual
      })
      .reduce((sum, e) => sum + Number(e.valor), 0)

    const receitasCount = data.filter(e => e.tipo === 'receita' && e.status === 'recebido').length
    const ticketMedio = receitasCount > 0 ? totalRecebido / receitasCount : 0

    const valorEstoque = materialsData.reduce((sum, m) => sum + (Number(m.unit_cost || 0) * Number(m.quantity || 0)), 0)
    const valorVendaEstoque = materialsData.reduce((sum, m) => sum + (Number(m.unit_price || 0) * Number(m.quantity || 0)), 0)
    const lucroEstoque = valorVendaEstoque - valorEstoque

    const lucro = totalRecebido - totalPago
    const margemLucro = totalRecebido > 0 ? (lucro / totalRecebido) * 100 : 0

    setMetrics({
      totalReceitas: totalRecebido,
      totalDespesas: totalPago,
      lucro,
      custoFolha,
      receitasMes,
      despesasMes,
      lucroMes: receitasMes - despesasMes,
      contasReceber,
      contasPagar,
      margemLucro,
      ticketMedio,
      valorEstoque,
      valorVendaEstoque,
      lucroEstoque
    })
  }

  const calculateDRE = (data: FinanceEntry[], categoriesData: Category[], staffData: any[]) => {
    const receitasPorCategoria: Record<string, { valor: number; grupo: string }> = {}
    const despesasPorCategoria: Record<string, { valor: number; grupo: string }> = {}

    data.forEach(entry => {
      if (entry.categoria_id) {
        const categoria = categoriesData.find(c => c.id === entry.categoria_id)
        if (categoria) {
          if (entry.tipo === 'receita' && entry.status === 'recebido') {
            const key = categoria.dre_grupo || categoria.nome
            if (!receitasPorCategoria[key]) {
              receitasPorCategoria[key] = { valor: 0, grupo: categoria.dre_grupo }
            }
            receitasPorCategoria[key].valor += Number(entry.valor)
          } else if (entry.tipo === 'despesa' && entry.status === 'pago') {
            const key = categoria.dre_grupo || categoria.nome
            if (!despesasPorCategoria[key]) {
              despesasPorCategoria[key] = { valor: 0, grupo: categoria.dre_grupo }
            }
            despesasPorCategoria[key].valor += Number(entry.valor)
          }
        }
      }
    })

    const custoFolha = staffData.reduce((sum, s) => sum + Number(s.salary || 0), 0)
    if (custoFolha > 0) {
      despesasPorCategoria['Folha de Pagamento'] = { valor: custoFolha, grupo: 'Despesas Operacionais' }
    }

    const totalReceitas = Object.values(receitasPorCategoria).reduce((sum, v) => sum + v.valor, 0)
    const totalDespesas = Object.values(despesasPorCategoria).reduce((sum, v) => sum + v.valor, 0)

    const receitasArray = Object.entries(receitasPorCategoria)
      .map(([nome, data]) => ({
        categoria: nome,
        valor: data.valor,
        percentual: totalReceitas > 0 ? (data.valor / totalReceitas) * 100 : 0
      }))
      .sort((a, b) => b.valor - a.valor)

    const despesasArray = Object.entries(despesasPorCategoria)
      .map(([nome, data]) => ({
        categoria: nome,
        valor: data.valor,
        percentual: totalDespesas > 0 ? (data.valor / totalDespesas) * 100 : 0
      }))
      .sort((a, b) => b.valor - a.valor)

    const lucroOperacional = totalReceitas - totalDespesas
    const margemOperacional = totalReceitas > 0 ? (lucroOperacional / totalReceitas) * 100 : 0

    setDreData({
      receitas: receitasArray,
      despesas: despesasArray,
      totalReceitas,
      totalDespesas,
      lucroOperacional,
      margemOperacional
    })
  }

  const calculateCashflow = (data: FinanceEntry[]) => {
    const hoje = new Date()
    const meses: string[] = []
    const receitas: number[] = []
    const despesas: number[] = []
    const saldo: number[] = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const mesNome = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      meses.push(mesNome)

      const receitasMes = data
        .filter(e => {
          const dataEntry = new Date(e.data)
          return e.tipo === 'receita' && e.status === 'recebido' &&
            dataEntry.getMonth() === date.getMonth() &&
            dataEntry.getFullYear() === date.getFullYear()
        })
        .reduce((sum, e) => sum + Number(e.valor), 0)

      const despesasMes = data
        .filter(e => {
          const dataEntry = new Date(e.data)
          return e.tipo === 'despesa' && e.status === 'pago' &&
            dataEntry.getMonth() === date.getMonth() &&
            dataEntry.getFullYear() === date.getFullYear()
        })
        .reduce((sum, e) => sum + Number(e.valor), 0)

      receitas.push(receitasMes)
      despesas.push(despesasMes)
      saldo.push(receitasMes - despesasMes)
    }

    setCashflowData({ labels: meses, receitas, despesas, saldo })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatPercent = (value: number) => {
    return value.toFixed(1) + '%'
  }

  const exportToCSV = () => {
    let csv = ''

    if (activeTab === 'dre') {
      csv = 'DRE - Demonstrativo de Resultados\n\n'
      csv += 'RECEITAS\n'
      csv += 'Categoria,Valor,Percentual\n'
      dreData.receitas.forEach(r => {
        csv += `${r.categoria},${r.valor},${r.percentual.toFixed(2)}%\n`
      })
      csv += `\nTOTAL RECEITAS,${dreData.totalReceitas}\n\n`

      csv += 'DESPESAS\n'
      csv += 'Categoria,Valor,Percentual\n'
      dreData.despesas.forEach(d => {
        csv += `${d.categoria},${d.valor},${d.percentual.toFixed(2)}%\n`
      })
      csv += `\nTOTAL DESPESAS,${dreData.totalDespesas}\n\n`
      csv += `LUCRO OPERACIONAL,${dreData.lucroOperacional}\n`
      csv += `MARGEM OPERACIONAL,${dreData.margemOperacional.toFixed(2)}%\n`
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            Dashboard Financeiro Completo
          </h1>
          <p className="text-gray-600 mt-1">Relatórios financeiros e análises em tempo real</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'kpis', label: 'KPIs e OKRs', icon: TrendingUp },
          { id: 'dre', label: 'DRE', icon: FileText },
          { id: 'cashflow', label: 'Fluxo de Caixa', icon: LineChart },
          { id: 'reports', label: 'Relatórios', icon: Table }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 bg-white/20 rounded-lg"><ArrowUpRight className="h-5 w-5" /></div>
                <TrendingUp className="h-4 w-4 opacity-80" />
              </div>
              <p className="text-green-100 text-xs font-medium mb-1">Total Receitas</p>
              <h2 className="text-2xl font-bold">{formatCurrency(metrics.totalReceitas)}</h2>
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-green-100">Mês: {formatCurrency(metrics.receitasMes)}</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 bg-white/20 rounded-lg"><ArrowDownRight className="h-5 w-5" /></div>
                <TrendingDown className="h-4 w-4 opacity-80" />
              </div>
              <p className="text-red-100 text-xs font-medium mb-1">Total Despesas</p>
              <h2 className="text-2xl font-bold">{formatCurrency(metrics.totalDespesas)}</h2>
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-red-100">Mês: {formatCurrency(metrics.despesasMes)}</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`bg-gradient-to-br ${metrics.lucro >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-lg p-4 text-white shadow-lg`}>
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 bg-white/20 rounded-lg"><Wallet className="h-5 w-5" /></div>
                <DollarSign className="h-4 w-4 opacity-80" />
              </div>
              <p className="text-blue-100 text-xs font-medium mb-1">Lucro Líquido</p>
              <h2 className="text-2xl font-bold">{formatCurrency(metrics.lucro)}</h2>
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-blue-100">Margem: {formatPercent(metrics.margemLucro)}</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 bg-white/20 rounded-lg"><Users className="h-5 w-5" /></div>
              </div>
              <p className="text-purple-100 text-xs font-medium mb-1">Custo Folha</p>
              <h2 className="text-2xl font-bold">{formatCurrency(metrics.custoFolha)}</h2>
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-purple-100">{staff.length} funcionários</p>
              </div>
            </motion.div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                Contas Bancárias
              </h3>
              <span className="text-sm text-gray-500">{bankAccounts.length} conta(s)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {bankAccounts.map((account, index) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative rounded-lg p-3 border-2 transition-all hover:shadow-md ${
                    account.saldo_calculado >= 0
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                  }`}
                >
                  {account.is_default && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">Principal</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className={`h-4 w-4 ${account.saldo_calculado >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <h4 className="font-semibold text-sm text-gray-900 truncate">{account.bank_name}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 truncate">{account.account_name}</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Saldo:</span>
                      <span className={`text-sm font-bold ${
                        account.saldo_calculado >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(Number(account.saldo_calculado))}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-gray-200">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-green-600">Receitas:</span>
                        <span className="font-medium text-green-700">{formatCurrency(Number(account.total_receitas))}</span>
                      </div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-red-600">Despesas:</span>
                        <span className="font-medium text-red-700">{formatCurrency(Number(account.total_despesas))}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Transações:</span>
                        <span className="font-medium text-gray-700">{account.total_transactions}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {bankAccounts.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-400">
                  <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma conta bancária cadastrada</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 bg-white/20 rounded-lg"><Package className="h-5 w-5" /></div>
              </div>
              <p className="text-amber-100 text-xs font-medium mb-1">Investido em Estoque</p>
              <h2 className="text-2xl font-bold">{formatCurrency(metrics.valorEstoque)}</h2>
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-amber-100">Venda: {formatCurrency(metrics.valorVendaEstoque)}</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 bg-white/20 rounded-lg"><TrendingUp className="h-5 w-5" /></div>
              </div>
              <p className="text-emerald-100 text-xs font-medium mb-1">Lucro Potencial Estoque</p>
              <h2 className="text-2xl font-bold">{formatCurrency(metrics.lucroEstoque)}</h2>
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-emerald-100">Margem: {formatPercent(metrics.valorEstoque > 0 ? (metrics.lucroEstoque / metrics.valorEstoque) * 100 : 0)}</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 bg-white/20 rounded-lg"><Package className="h-5 w-5" /></div>
              </div>
              <p className="text-cyan-100 text-xs font-medium mb-1">Itens em Estoque</p>
              <h2 className="text-2xl font-bold">{materials.length}</h2>
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-cyan-100">Produtos disponíveis</p>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Contas a Receber</h3>
              <div className="text-3xl font-bold text-green-600 mb-4">{formatCurrency(metrics.contasReceber)}</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {entries.filter(e => e.tipo === 'receita' && e.status === 'a_receber').slice(0, 5).map(entry => (
                  <div key={entry.id} className="p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{entry.descricao}</p>
                        <p className="text-xs text-gray-500">{new Date(entry.data).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <p className="font-bold text-green-600">{formatCurrency(Number(entry.valor))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Contas a Pagar</h3>
              <div className="text-3xl font-bold text-red-600 mb-4">{formatCurrency(metrics.contasPagar)}</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {entries.filter(e => e.tipo === 'despesa' && e.status === 'a_pagar').slice(0, 5).map(entry => (
                  <div key={entry.id} className="p-3 bg-red-50 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{entry.descricao}</p>
                        <p className="text-xs text-gray-500">{new Date(entry.data).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <p className="font-bold text-red-600">{formatCurrency(Number(entry.valor))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'dre' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">DRE - Demonstrativo de Resultados</h2>
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-700">RECEITAS</h3>
                  <span className="text-2xl font-bold text-green-700">{formatCurrency(dreData.totalReceitas)}</span>
                </div>
                <div className="space-y-2">
                  {dreData.receitas.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.categoria}</p>
                        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.percentual}%` }} />
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(item.valor)}</p>
                        <p className="text-sm text-gray-500">{formatPercent(item.percentual)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-red-700">DESPESAS</h3>
                  <span className="text-2xl font-bold text-red-700">{formatCurrency(dreData.totalDespesas)}</span>
                </div>
                <div className="space-y-2">
                  {dreData.despesas.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.categoria}</p>
                        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${item.percentual}%` }} />
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(item.valor)}</p>
                        <p className="text-sm text-gray-500">{formatPercent(item.percentual)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-6 rounded-xl ${dreData.lucroOperacional >= 0 ? 'bg-blue-50 border-2 border-blue-200' : 'bg-orange-50 border-2 border-orange-200'}`}>
                    <p className="text-sm font-medium text-gray-600 mb-2">Lucro Operacional</p>
                    <p className={`text-4xl font-bold ${dreData.lucroOperacional >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      {formatCurrency(dreData.lucroOperacional)}
                    </p>
                  </div>
                  <div className={`p-6 rounded-xl ${dreData.margemOperacional >= 0 ? 'bg-blue-50 border-2 border-blue-200' : 'bg-orange-50 border-2 border-orange-200'}`}>
                    <p className="text-sm font-medium text-gray-600 mb-2">Margem Operacional</p>
                    <p className={`text-4xl font-bold ${dreData.margemOperacional >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      {formatPercent(dreData.margemOperacional)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-2xl font-bold mb-6">Fluxo de Caixa - Últimos 6 Meses</h2>
          <div className="h-96">
            <Line
              data={{
                labels: cashflowData.labels,
                datasets: [
                  {
                    label: 'Receitas',
                    data: cashflowData.receitas,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.4
                  },
                  {
                    label: 'Despesas',
                    data: cashflowData.despesas,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                  },
                  {
                    label: 'Saldo',
                    data: cashflowData.saldo,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => formatCurrency(Number(value))
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'kpis' && (
        <KPIDashboard />
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-semibold mb-2">Ticket Médio</h3>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(metrics.ticketMedio)}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-semibold mb-2">Margem de Lucro</h3>
              <p className="text-3xl font-bold text-green-600">{formatPercent(metrics.margemLucro)}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-semibold mb-2">Lucro do Mês</h3>
              <p className={`text-3xl font-bold ${metrics.lucroMes >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.lucroMes)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Últimos Lançamentos</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Descrição</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tipo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.slice(0, 10).map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{new Date(entry.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-sm font-mono">{entry.codigo}</td>
                      <td className="px-4 py-3 text-sm">{entry.descricao}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          entry.tipo === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {entry.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          entry.status === 'recebido' || entry.status === 'pago'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {formatCurrency(Number(entry.valor))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinancialIntegration
