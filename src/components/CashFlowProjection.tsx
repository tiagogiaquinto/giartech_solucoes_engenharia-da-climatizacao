/**
 * Projeção de Fluxo de Caixa
 *
 * Projeta os próximos 30 dias de fluxo de caixa
 */

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Card from './Card'

interface DailyProjection {
  date: Date
  entradas: number
  saidas: number
  saldo: number
  status: 'positive' | 'warning' | 'critical'
}

export default function CashFlowProjection() {
  const [projections, setProjections] = useState<DailyProjection[]>([])
  const [loading, setLoading] = useState(true)
  const [currentBalance, setCurrentBalance] = useState(0)

  useEffect(() => {
    loadProjections()
  }, [])

  const loadProjections = async () => {
    setLoading(true)
    try {
      // Saldo atual das contas
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('current_balance')

      const totalBalance = accounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0
      setCurrentBalance(totalBalance)

      // Projetar próximos 30 dias
      const dailyProjections: DailyProjection[] = []
      let runningBalance = totalBalance

      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)

        const dateStr = date.toISOString().split('T')[0]

        // Entradas previstas
        const { data: receitas } = await supabase
          .from('finance_entries')
          .select('amount')
          .eq('type', 'receita')
          .eq('status', 'pending')
          .eq('due_date', dateStr)

        const entradas = receitas?.reduce((sum, r) => sum + r.amount, 0) || 0

        // Saídas previstas
        const { data: despesas } = await supabase
          .from('finance_entries')
          .select('amount')
          .eq('type', 'despesa')
          .eq('status', 'pending')
          .eq('due_date', dateStr)

        const saidas = despesas?.reduce((sum, d) => sum + d.amount, 0) || 0

        runningBalance = runningBalance + entradas - saidas

        let status: 'positive' | 'warning' | 'critical' = 'positive'
        if (runningBalance < 0) {
          status = 'critical'
        } else if (runningBalance < 10000) {
          status = 'warning'
        }

        dailyProjections.push({
          date,
          entradas,
          saidas,
          saldo: runningBalance,
          status
        })
      }

      setProjections(dailyProjections)
    } catch (error) {
      console.error('Erro ao projetar fluxo:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short'
    }).format(date)
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">Carregando projeção...</div>
      </Card>
    )
  }

  const criticalDays = projections.filter(p => p.status === 'critical')
  const firstNegativeDay = criticalDays.length > 0 ? criticalDays[0] : null

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Projeção de Fluxo de Caixa - Próximos 30 Dias
      </h2>

      {/* Resumo e Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Saldo Atual</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(currentBalance)}</p>
        </div>

        <div className={`p-4 rounded-lg ${
          projections[29]?.saldo > currentBalance ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <p className={`text-sm font-medium ${
            projections[29]?.saldo > currentBalance ? 'text-green-600' : 'text-red-600'
          }`}>
            Saldo em 30 Dias
          </p>
          <p className={`text-2xl font-bold ${
            projections[29]?.saldo > currentBalance ? 'text-green-900' : 'text-red-900'
          }`}>
            {formatCurrency(projections[29]?.saldo || 0)}
          </p>
        </div>

        <div className={`p-4 rounded-lg ${
          criticalDays.length > 0 ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <p className={`text-sm font-medium ${
            criticalDays.length > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            Dias Críticos
          </p>
          <p className={`text-2xl font-bold ${
            criticalDays.length > 0 ? 'text-red-900' : 'text-green-900'
          }`}>
            {criticalDays.length}
          </p>
        </div>
      </div>

      {/* Alerta de Caixa Negativo */}
      {firstNegativeDay && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-bold text-red-900 mb-1">
                ⚠️ ALERTA: Caixa negativo previsto!
              </p>
              <p className="text-red-800">
                Seu saldo ficará negativo em <strong>{formatDate(firstNegativeDay.date)}</strong> ({Math.ceil((firstNegativeDay.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias).
              </p>
              <p className="text-red-700 mt-2 text-sm">
                💡 <strong>Sugestão:</strong> Antecipar recebíveis ou adiar {formatCurrency(Math.abs(firstNegativeDay.saldo))} em despesas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Projeção */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Data</th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">Entradas</th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">Saídas</th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">Saldo</th>
              <th className="text-center py-2 px-3 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {projections.slice(0, 14).map((proj, index) => (
              <tr
                key={index}
                className={`border-b border-gray-100 ${
                  proj.status === 'critical' ? 'bg-red-50' :
                  proj.status === 'warning' ? 'bg-yellow-50' : ''
                }`}
              >
                <td className="py-2 px-3 text-gray-900">{formatDate(proj.date)}</td>
                <td className="py-2 px-3 text-right text-green-600">
                  {proj.entradas > 0 ? formatCurrency(proj.entradas) : '-'}
                </td>
                <td className="py-2 px-3 text-right text-red-600">
                  {proj.saidas > 0 ? formatCurrency(proj.saidas) : '-'}
                </td>
                <td className="py-2 px-3 text-right font-medium text-gray-900">
                  {formatCurrency(proj.saldo)}
                </td>
                <td className="py-2 px-3 text-center">
                  {proj.status === 'positive' && '🟢'}
                  {proj.status === 'warning' && '🟡'}
                  {proj.status === 'critical' && '🔴'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        📊 Projeção baseada em contas a receber/pagar pendentes. Atualizar diariamente.
      </p>
    </Card>
  )
}
