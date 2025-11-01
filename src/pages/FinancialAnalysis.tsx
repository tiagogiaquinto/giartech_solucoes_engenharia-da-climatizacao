import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, TrendingDown, DollarSign, Calendar, PieChart, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface FinancialSummary {
  receitas_recebidas: string
  receitas_a_receber: string
  receitas_total: string
  despesas_pagas: string
  despesas_a_pagar: string
  despesas_total: string
  saldo_realizado: string
  saldo_previsto: string
  total_lancamentos_receita: number
  total_lancamentos_despesa: number
}

interface MonthlyTrend {
  mes: string
  mes_nome: string
  receitas: string
  despesas: string
  saldo: string
  qtd_receitas: number
  qtd_despesas: number
}

interface CategorySummary {
  categoria: string
  tipo: string
  total: string
  quantidade: number
  percentual: string
}

const FinancialAnalysis = () => {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([])
  const [categories, setCategories] = useState<CategorySummary[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar resumo financeiro
      const { data: summaryData, error: summaryError } = await supabase
        .from('v_financial_summary')
        .select('*')
        .single()

      if (summaryError) throw summaryError
      setSummary(summaryData)

      // Carregar tendência mensal (últimos 12 meses)
      const { data: trendData, error: trendError } = await supabase
        .from('v_financial_monthly_trend')
        .select('*')
        .order('mes', { ascending: false })
        .limit(12)

      if (trendError) throw trendError
      setMonthlyTrend(trendData?.reverse() || [])

      // Carregar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('v_financial_categories_summary')
        .select('*')
        .order('total', { ascending: false })
        .limit(10)

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Não há dados financeiros disponíveis.</p>
        </div>
      </div>
    )
  }

  const chartData = monthlyTrend.map(m => ({
    name: m.mes_nome,
    receitas: parseFloat(m.receitas),
    despesas: parseFloat(m.despesas),
    saldo: parseFloat(m.saldo)
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análise Financeira</h1>
          <p className="text-gray-600 mt-1">Visão completa da saúde financeira</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Atualizar Dados
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas Totais */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded">
              {summary.total_lancamentos_receita} lançamentos
            </span>
          </div>
          <p className="text-sm text-green-700 font-medium mb-1">Receitas Totais</p>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(summary.receitas_total)}</p>
          <div className="mt-3 text-xs text-green-600">
            <div className="flex justify-between">
              <span>Recebidas:</span>
              <span className="font-semibold">{formatCurrency(summary.receitas_recebidas)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>A Receber:</span>
              <span className="font-semibold">{formatCurrency(summary.receitas_a_receber)}</span>
            </div>
          </div>
        </div>

        {/* Despesas Totais */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-red-700 bg-red-200 px-2 py-1 rounded">
              {summary.total_lancamentos_despesa} lançamentos
            </span>
          </div>
          <p className="text-sm text-red-700 font-medium mb-1">Despesas Totais</p>
          <p className="text-2xl font-bold text-red-900">{formatCurrency(summary.despesas_total)}</p>
          <div className="mt-3 text-xs text-red-600">
            <div className="flex justify-between">
              <span>Pagas:</span>
              <span className="font-semibold">{formatCurrency(summary.despesas_pagas)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>A Pagar:</span>
              <span className="font-semibold">{formatCurrency(summary.despesas_a_pagar)}</span>
            </div>
          </div>
        </div>

        {/* Saldo Realizado */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-blue-700 font-medium mb-1">Saldo Realizado</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(summary.saldo_realizado)}</p>
          <div className="mt-3 text-xs text-blue-600">
            <p>Receitas recebidas - Despesas pagas</p>
          </div>
        </div>

        {/* Saldo Previsto */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-purple-700 font-medium mb-1">Saldo Previsto</p>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(summary.saldo_previsto)}</p>
          <div className="mt-3 text-xs text-purple-600">
            <p>Incluindo valores a receber/pagar</p>
          </div>
        </div>
      </div>

      {/* Gráfico de Tendência Mensal */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Tendência Mensal</h2>
        </div>
        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(value)}
                />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="#10b981" />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" />
                <Bar dataKey="saldo" name="Saldo" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Sem dados para exibir</p>
        )}
      </div>

      {/* Tabela de Categorias */}
      {categories.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Top 10 Categorias</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Qtd</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">% do Total</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{cat.categoria || 'Sem categoria'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        cat.tipo === 'receita'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cat.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(cat.total)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-center">
                      {cat.quantidade}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {parseFloat(cat.percentual).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinancialAnalysis
