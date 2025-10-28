/**
 * DRE Comparativo
 *
 * Compara DRE entre períodos (mês atual vs anterior, ano vs ano)
 */

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Card from './Card'

interface DREData {
  period: string
  receitas: number
  custos_variaveis: number
  margem_contribuicao: number
  custos_fixos: number
  lucro_operacional: number
  impostos: number
  lucro_liquido: number
}

interface DREComparison {
  current: DREData
  previous: DREData
}

export default function DREComparative() {
  const [data, setData] = useState<DREComparison | null>(null)
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDREData()
  }, [period])

  const loadDREData = async () => {
    setLoading(true)
    try {
      // Período atual
      const currentDate = new Date()
      const currentPeriod = period === 'month'
        ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        : `${currentDate.getFullYear()}`

      // Período anterior
      const previousDate = new Date(currentDate)
      if (period === 'month') {
        previousDate.setMonth(previousDate.getMonth() - 1)
      } else {
        previousDate.setFullYear(previousDate.getFullYear() - 1)
      }
      const previousPeriod = period === 'month'
        ? `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`
        : `${previousDate.getFullYear()}`

      // Buscar dados do período atual
      const currentData = await fetchDREForPeriod(currentPeriod)
      const previousData = await fetchDREForPeriod(previousPeriod)

      setData({
        current: currentData,
        previous: previousData
      })
    } catch (error) {
      console.error('Erro ao carregar DRE:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDREForPeriod = async (period: string): Promise<DREData> => {
    const startDate = period.length === 7
      ? `${period}-01`
      : `${period}-01-01`

    const endDate = period.length === 7
      ? `${period}-31`
      : `${period}-12-31`

    // Receitas
    const { data: receitas } = await supabase
      .from('finance_entries')
      .select('amount')
      .eq('type', 'receita')
      .gte('due_date', startDate)
      .lte('due_date', endDate)

    const totalReceitas = receitas?.reduce((sum, r) => sum + r.amount, 0) || 0

    // Despesas (custos variáveis)
    const { data: custosVar } = await supabase
      .from('finance_entries')
      .select('amount')
      .eq('type', 'despesa')
      .in('category', ['Materiais', 'Combustível', 'Comissões'])
      .gte('due_date', startDate)
      .lte('due_date', endDate)

    const totalCustosVar = custosVar?.reduce((sum, c) => sum + c.amount, 0) || 0

    // Custos fixos
    const { data: custosFixos } = await supabase
      .from('finance_entries')
      .select('amount')
      .eq('type', 'despesa')
      .in('category', ['Aluguel', 'Salários', 'Energia', 'Água', 'Internet'])
      .gte('due_date', startDate)
      .lte('due_date', endDate)

    const totalCustosFixos = custosFixos?.reduce((sum, c) => sum + c.amount, 0) || 0

    const margemContribuicao = totalReceitas - totalCustosVar
    const lucroOperacional = margemContribuicao - totalCustosFixos
    const impostos = totalReceitas * 0.08 // Simples Nacional aprox
    const lucroLiquido = lucroOperacional - impostos

    return {
      period,
      receitas: totalReceitas,
      custos_variaveis: totalCustosVar,
      margem_contribuicao: margemContribuicao,
      custos_fixos: totalCustosFixos,
      lucro_operacional: lucroOperacional,
      impostos,
      lucro_liquido: lucroLiquido
    }
  }

  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">Carregando DRE...</div>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Não há dados disponíveis</p>
      </Card>
    )
  }

  const rows = [
    { label: 'Receitas', current: data.current.receitas, previous: data.previous.receitas },
    { label: 'Custos Variáveis', current: data.current.custos_variaveis, previous: data.previous.custos_variaveis },
    { label: 'Margem de Contribuição', current: data.current.margem_contribuicao, previous: data.previous.margem_contribuicao },
    { label: 'Custos Fixos', current: data.current.custos_fixos, previous: data.previous.custos_fixos },
    { label: 'Lucro Operacional', current: data.current.lucro_operacional, previous: data.previous.lucro_operacional },
    { label: 'Impostos', current: data.current.impostos, previous: data.previous.impostos },
    { label: 'Lucro Líquido', current: data.current.lucro_liquido, previous: data.previous.lucro_liquido }
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">DRE Comparativo</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium ${
              period === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-lg font-medium ${
              period === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Indicador</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Período Atual</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Período Anterior</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Variação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const variation = calculateVariation(row.current, row.previous)
              const isPositive = variation > 0
              const isNegativeIndicator = row.label.includes('Custo') || row.label.includes('Impostos')

              return (
                <tr
                  key={index}
                  className={`border-b border-gray-100 ${
                    row.label === 'Lucro Líquido' ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-gray-900">{row.label}</td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {formatCurrency(row.current)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatCurrency(row.previous)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isPositive && !isNegativeIndicator && (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      )}
                      {isPositive && isNegativeIndicator && (
                        <TrendingUp className="w-4 h-4 text-red-600" />
                      )}
                      {!isPositive && variation !== 0 && !isNegativeIndicator && (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      {!isPositive && variation !== 0 && isNegativeIndicator && (
                        <TrendingDown className="w-4 h-4 text-green-600" />
                      )}
                      <span
                        className={`font-medium ${
                          isNegativeIndicator
                            ? isPositive ? 'text-red-600' : 'text-green-600'
                            : isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Alertas */}
      {data.current.lucro_liquido < 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">
            ⚠️ Alerta: Lucro líquido negativo! Revisar custos urgentemente.
          </p>
        </div>
      )}

      {calculateVariation(data.current.custos_variaveis, data.previous.custos_variaveis) > 20 && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800 font-medium">
            💡 Custos variáveis subiram {calculateVariation(data.current.custos_variaveis, data.previous.custos_variaveis).toFixed(0)}%. Investigar fornecedores.
          </p>
        </div>
      )}
    </Card>
  )
}
