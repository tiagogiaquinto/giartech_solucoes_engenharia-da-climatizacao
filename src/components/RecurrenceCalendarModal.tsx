import { useState, useEffect } from 'react'
import { X, Calendar, TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface RecurrenceCalendarModalProps {
  isOpen: boolean
  onClose: () => void
}

interface RecurrenceData {
  recurrence_id: string
  descricao: string
  valor: number
  tipo: string
  categoria: string
  frequencia: string
  status: string
  cliente_fornecedor: string
  ocorrencias_ano_atual: number
  valor_total_ano: number
  meses_ativos_nomes: string
  meses_ativos: number[]
}

interface MonthlyData {
  mes: number
  mes_nome: string
  total_lancamentos: number
  valor_receitas: number
  valor_despesas: number
  saldo_previsto: number
  ja_gerados: number
  pendentes_geracao: number
}

interface YearOverview {
  total_recorrencias: number
  total_ocorrencias_ano: number
  receitas_totais_ano: number
  despesas_totais_ano: number
  saldo_previsto_ano: number
  media_mensal: number
  mes_maior_valor: string
  maior_valor_mes: number
}

export default function RecurrenceCalendarModal({ isOpen, onClose }: RecurrenceCalendarModalProps) {
  const [recurrences, setRecurrences] = useState<RecurrenceData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [yearOverview, setYearOverview] = useState<YearOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'calendar' | 'monthly' | 'overview'>('calendar')
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [filterFrequencia, setFilterFrequencia] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)

  useEffect(() => {
    if (isOpen) {
      loadRecurrenceData()
    }
  }, [isOpen, filterTipo, filterFrequencia])

  const loadRecurrenceData = async () => {
    try {
      setLoading(true)

      const [calendarRes, monthlyRes, overviewRes] = await Promise.all([
        supabase.from('v_recurrence_annual_calendar').select('*'),
        supabase.from('v_recurrence_monthly_summary').select('*').order('mes'),
        supabase.from('v_recurrence_year_overview').select('*').single()
      ])

      let calendarData = calendarRes.data || []

      if (filterTipo !== 'all') {
        calendarData = calendarData.filter((r: RecurrenceData) => r.tipo === filterTipo)
      }

      if (filterFrequencia !== 'all') {
        calendarData = calendarData.filter((r: RecurrenceData) => r.frequencia === filterFrequencia)
      }

      setRecurrences(calendarData)
      setMonthlyData(monthlyRes.data || [])
      setYearOverview(overviewRes.data)
    } catch (error) {
      console.error('Error loading recurrence data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const getMonthName = (monthNumber: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[monthNumber - 1]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Calendário de Recorrências</h2>
              <p className="text-blue-100 text-sm">Visualize todas as recorrências do ano</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2 p-4">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Calendário Anual
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Resumo Mensal
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Visão Geral
            </button>
          </div>

          <div className="flex gap-3 px-4 pb-4">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os tipos</option>
              <option value="entrada">Receitas</option>
              <option value="saida">Despesas</option>
            </select>

            <select
              value={filterFrequencia}
              onChange={(e) => setFilterFrequencia(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as frequências</option>
              <option value="mensal">Mensal</option>
              <option value="bimestral">Bimestral</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>

            <button
              onClick={() => {
                setFilterTipo('all')
                setFilterFrequencia('all')
              }}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'calendar' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-blue-900">
                        <span className="font-semibold">{recurrences.length}</span> recorrências encontradas
                      </div>
                      <div className="text-sm text-blue-700">
                        Total anual: {formatCurrency(recurrences.reduce((sum, r) => sum + (r.valor_total_ano || 0), 0))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {recurrences.map((rec) => (
                      <div
                        key={rec.recurrence_id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {rec.tipo === 'entrada' ? (
                                <TrendingUp className="h-5 w-5 text-green-600" />
                              ) : (
                                <TrendingDown className="h-5 w-5 text-red-600" />
                              )}
                              <h3 className="font-semibold text-gray-900">{rec.descricao}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                rec.tipo === 'entrada'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {rec.tipo === 'entrada' ? 'Receita' : 'Despesa'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-gray-600">Valor unitário:</span>
                                <p className="font-semibold text-gray-900">{formatCurrency(rec.valor)}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Frequência:</span>
                                <p className="font-semibold text-gray-900 capitalize">{rec.frequencia}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Ocorrências/ano:</span>
                                <p className="font-semibold text-gray-900">{rec.ocorrencias_ano_atual}x</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Total anual:</span>
                                <p className="font-semibold text-blue-600">{formatCurrency(rec.valor_total_ano)}</p>
                              </div>
                            </div>

                            {rec.cliente_fornecedor && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Cliente/Fornecedor:</span> {rec.cliente_fornecedor}
                              </div>
                            )}

                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <span className="text-sm font-medium text-gray-700">Meses ativos:</span>
                              <p className="text-sm text-gray-600 mt-1">{rec.meses_ativos_nomes}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {recurrences.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>Nenhuma recorrência encontrada com os filtros selecionados</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'monthly' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {monthlyData.map((month) => (
                      <div
                        key={month.mes}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center justify-between">
                          {month.mes_nome}
                          <span className="text-sm font-normal text-gray-500">
                            {month.total_lancamentos} lançamentos
                          </span>
                        </h3>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-green-600 flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              Receitas
                            </span>
                            <span className="font-semibold text-green-700">
                              {formatCurrency(month.valor_receitas)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-red-600 flex items-center gap-1">
                              <TrendingDown className="h-4 w-4" />
                              Despesas
                            </span>
                            <span className="font-semibold text-red-700">
                              {formatCurrency(month.valor_despesas)}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">Saldo previsto</span>
                              <span className={`font-bold ${
                                month.saldo_previsto >= 0 ? 'text-blue-600' : 'text-orange-600'
                              }`}>
                                {formatCurrency(month.saldo_previsto)}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 text-xs text-gray-500 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {month.ja_gerados} gerados
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {month.pendentes_geracao} pendentes
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'overview' && yearOverview && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                      <div className="text-blue-100 text-sm mb-1">Total de Recorrências</div>
                      <div className="text-3xl font-bold">{yearOverview.total_recorrencias}</div>
                      <div className="text-blue-100 text-xs mt-2">
                        {yearOverview.total_ocorrencias_ano} ocorrências no ano
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                      <div className="text-green-100 text-sm mb-1">Receitas Totais</div>
                      <div className="text-3xl font-bold">{formatCurrency(yearOverview.receitas_totais_ano)}</div>
                      <div className="text-green-100 text-xs mt-2">
                        Média: {formatCurrency(yearOverview.receitas_totais_ano / 12)}/mês
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6">
                      <div className="text-red-100 text-sm mb-1">Despesas Totais</div>
                      <div className="text-3xl font-bold">{formatCurrency(yearOverview.despesas_totais_ano)}</div>
                      <div className="text-red-100 text-xs mt-2">
                        Média: {formatCurrency(yearOverview.despesas_totais_ano / 12)}/mês
                      </div>
                    </div>

                    <div className={`bg-gradient-to-br ${
                      yearOverview.saldo_previsto_ano >= 0
                        ? 'from-purple-500 to-purple-600'
                        : 'from-orange-500 to-orange-600'
                    } text-white rounded-lg p-6`}>
                      <div className="text-purple-100 text-sm mb-1">Saldo Previsto</div>
                      <div className="text-3xl font-bold">{formatCurrency(yearOverview.saldo_previsto_ano)}</div>
                      <div className="text-purple-100 text-xs mt-2">
                        Média: {formatCurrency(yearOverview.media_mensal)}/mês
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Análise do Ano</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Mês com maior valor</span>
                          <span className="font-semibold text-gray-900">{yearOverview.mes_maior_valor}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Valor do pico</span>
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(yearOverview.maior_valor_mes)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Média mensal</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(yearOverview.media_mensal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Distribuição</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Receitas vs Despesas</span>
                            <span className="font-semibold">
                              {Math.round((yearOverview.receitas_totais_ano / (yearOverview.receitas_totais_ano + yearOverview.despesas_totais_ano)) * 100)}%
                              /
                              {Math.round((yearOverview.despesas_totais_ano / (yearOverview.receitas_totais_ano + yearOverview.despesas_totais_ano)) * 100)}%
                            </span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
                            <div
                              className="bg-green-500"
                              style={{
                                width: `${(yearOverview.receitas_totais_ano / (yearOverview.receitas_totais_ano + yearOverview.despesas_totais_ano)) * 100}%`
                              }}
                            />
                            <div
                              className="bg-red-500"
                              style={{
                                width: `${(yearOverview.despesas_totais_ano / (yearOverview.receitas_totais_ano + yearOverview.despesas_totais_ano)) * 100}%`
                              }}
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Margem</span>
                            <span className={`font-semibold ${
                              yearOverview.saldo_previsto_ano >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Math.round((yearOverview.saldo_previsto_ano / yearOverview.receitas_totais_ano) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
