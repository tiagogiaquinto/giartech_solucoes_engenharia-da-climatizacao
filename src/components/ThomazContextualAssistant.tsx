/**
 * Thomaz Contextual Assistant
 *
 * Fornece sugestões e alertas inteligentes baseados no contexto da página
 */

import React, { useEffect, useState } from 'react'
import { Brain, X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react'
import { supabase } from '../lib/supabase'

export interface ThomazSuggestion {
  id: string
  icon: React.ReactNode
  message: string
  priority: 'high' | 'medium' | 'low'
  action?: {
    label: string
    onClick: () => void
  }
}

interface ThomazContextualAssistantProps {
  context: 'dashboard' | 'os-create' | 'financial' | 'inventory' | 'clients'
  data?: any
}

export default function ThomazContextualAssistant({ context, data }: ThomazContextualAssistantProps) {
  const [suggestions, setSuggestions] = useState<ThomazSuggestion[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateSuggestions()
  }, [context, data])

  const generateSuggestions = async () => {
    setLoading(true)
    const newSuggestions: ThomazSuggestion[] = []

    try {
      switch (context) {
        case 'dashboard':
          await generateDashboardSuggestions(newSuggestions)
          break
        case 'os-create':
          await generateOSSuggestions(newSuggestions, data)
          break
        case 'financial':
          await generateFinancialSuggestions(newSuggestions)
          break
        case 'inventory':
          await generateInventorySuggestions(newSuggestions)
          break
        case 'clients':
          await generateClientsSuggestions(newSuggestions, data)
          break
      }

      setSuggestions(newSuggestions.filter(s => !dismissed.includes(s.id)))
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateDashboardSuggestions = async (suggestions: ThomazSuggestion[]) => {
    // Verificar margem do mês
    const { data: kpis } = await supabase
      .from('v_business_kpis')
      .select('*')
      .limit(1)
      .single()

    if (kpis && kpis.margem_percentual < 25) {
      suggestions.push({
        id: 'low-margin',
        icon: <TrendingDown className="w-5 h-5 text-red-600" />,
        message: `Sua margem está em ${kpis.margem_percentual.toFixed(1)}% (abaixo da meta de 25%). Quer que eu analise os custos?`,
        priority: 'high',
        action: {
          label: 'Analisar',
          onClick: () => window.location.href = '/financial-analysis'
        }
      })
    }

    // Verificar OSs atrasadas
    const { data: delayedOS } = await supabase
      .from('service_orders')
      .select('id')
      .lt('scheduled_date', new Date().toISOString())
      .in('status', ['pending', 'in_progress'])

    if (delayedOS && delayedOS.length > 0) {
      suggestions.push({
        id: 'delayed-os',
        icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
        message: `Detectei ${delayedOS.length} OS${delayedOS.length > 1 ? 's' : ''} atrasada${delayedOS.length > 1 ? 's' : ''}. Devo alertar os técnicos?`,
        priority: 'high',
        action: {
          label: 'Ver OSs',
          onClick: () => window.location.href = '/service-orders?filter=delayed'
        }
      })
    }

    // Verificar meta de faturamento
    if (kpis && kpis.receitas_mes > 0) {
      const metaMensal = 100000 // Configurável
      const percentualMeta = (kpis.receitas_mes / metaMensal) * 100

      if (percentualMeta < 100 && percentualMeta > 80) {
        suggestions.push({
          id: 'goal-progress',
          icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
          message: `Meta de faturamento: ${percentualMeta.toFixed(0)}% atingida. Faltam R$ ${(metaMensal - kpis.receitas_mes).toFixed(2)} para bater a meta!`,
          priority: 'medium'
        })
      }
    }
  }

  const generateOSSuggestions = async (suggestions: ThomazSuggestion[], clientId?: string) => {
    if (!clientId) return

    // Verificar histórico do cliente
    const { data: client } = await supabase
      .from('customers')
      .select('name')
      .eq('id', clientId)
      .single()

    const { data: history } = await supabase
      .from('service_orders')
      .select('status')
      .eq('client_id', clientId)

    if (history) {
      const totalOS = history.length
      const cancelledOS = history.filter(os => os.status === 'cancelled').length

      if (totalOS > 0 && (cancelledOS / totalOS) > 0.3) {
        suggestions.push({
          id: 'client-risk',
          icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
          message: `Cliente ${client?.name} tem ${((cancelledOS/totalOS)*100).toFixed(0)}% de cancelamentos. Sugiro 50% de entrada.`,
          priority: 'high'
        })
      }
    }

    // Verificar disponibilidade de técnicos
    const { data: todayOS } = await supabase
      .from('service_orders')
      .select('id')
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .lte('scheduled_date', new Date().toISOString().split('T')[0] + 'T23:59:59')

    if (todayOS && todayOS.length >= 5) {
      suggestions.push({
        id: 'busy-day',
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        message: `Hoje já tem ${todayOS.length} OSs agendadas. Considere agendar para outro dia.`,
        priority: 'medium'
      })
    }
  }

  const generateFinancialSuggestions = async (suggestions: ThomazSuggestion[]) => {
    // Contas a vencer esta semana
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const { data: upcomingBills } = await supabase
      .from('finance_entries')
      .select('id, description, amount')
      .eq('type', 'despesa')
      .eq('status', 'pending')
      .gte('due_date', new Date().toISOString())
      .lte('due_date', nextWeek.toISOString())

    if (upcomingBills && upcomingBills.length > 0) {
      const total = upcomingBills.reduce((sum, b) => sum + b.amount, 0)
      suggestions.push({
        id: 'upcoming-bills',
        icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
        message: `Você tem ${upcomingBills.length} conta${upcomingBills.length > 1 ? 's' : ''} vencendo esta semana (total: R$ ${total.toFixed(2)}).`,
        priority: 'high'
      })
    }

    // Verificar fluxo de caixa negativo próximo
    const { data: balance } = await supabase
      .from('bank_accounts')
      .select('current_balance')

    if (balance) {
      const totalBalance = balance.reduce((sum, acc) => sum + acc.current_balance, 0)

      if (upcomingBills && totalBalance < upcomingBills.reduce((sum, b) => sum + b.amount, 0)) {
        suggestions.push({
          id: 'negative-cash-flow',
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          message: `Saldo atual (R$ ${totalBalance.toFixed(2)}) insuficiente para contas da semana. Antecipar recebíveis?`,
          priority: 'high'
        })
      }
    }
  }

  const generateInventorySuggestions = async (suggestions: ThomazSuggestion[]) => {
    // Itens com estoque baixo
    const { data: lowStock } = await supabase
      .from('inventory_items')
      .select('name, current_stock, minimum_stock')
      .filter('current_stock', 'lt', 'minimum_stock')

    if (lowStock && lowStock.length > 0) {
      suggestions.push({
        id: 'low-stock',
        icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
        message: `${lowStock.length} ${lowStock.length > 1 ? 'itens estão' : 'item está'} com estoque abaixo do mínimo.`,
        priority: 'high',
        action: {
          label: 'Ver Itens',
          onClick: () => window.location.href = '/inventory?filter=low-stock'
        }
      })
    }

    // Itens sem movimentação há 90 dias
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: staleItems } = await supabase
      .from('inventory_items')
      .select('name')
      .lt('updated_at', ninetyDaysAgo.toISOString())
      .gt('current_stock', 0)

    if (staleItems && staleItems.length > 0) {
      suggestions.push({
        id: 'stale-inventory',
        icon: <Lightbulb className="w-5 h-5 text-blue-600" />,
        message: `${staleItems.length} ${staleItems.length > 1 ? 'itens' : 'item'} sem movimentação há 90+ dias. Considere promoção.`,
        priority: 'low'
      })
    }
  }

  const generateClientsSuggestions = async (suggestions: ThomazSuggestion[], clientId?: string) => {
    // Clientes sem compra há 60 dias
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const { data: inactiveClients } = await supabase
      .from('customers')
      .select('id, name')
      .lt('updated_at', sixtyDaysAgo.toISOString())

    if (inactiveClients && inactiveClients.length > 0) {
      suggestions.push({
        id: 'inactive-clients',
        icon: <Lightbulb className="w-5 h-5 text-blue-600" />,
        message: `${inactiveClients.length} cliente${inactiveClients.length > 1 ? 's' : ''} sem compra há 60+ dias. Fazer campanha de reativação?`,
        priority: 'medium'
      })
    }
  }

  const dismissSuggestion = (id: string) => {
    setDismissed([...dismissed, id])
    setSuggestions(suggestions.filter(s => s.id !== id))
  }

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 animate-pulse">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm text-blue-800">Thomaz analisando...</span>
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {suggestions.map(suggestion => (
        <div
          key={suggestion.id}
          className={`rounded-lg p-3 border ${
            suggestion.priority === 'high'
              ? 'bg-red-50 border-red-200'
              : suggestion.priority === 'medium'
              ? 'bg-orange-50 border-orange-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{suggestion.icon}</div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  suggestion.priority === 'high'
                    ? 'text-red-800'
                    : suggestion.priority === 'medium'
                    ? 'text-orange-800'
                    : 'text-blue-800'
                }`}
              >
                {suggestion.message}
              </p>

              {suggestion.action && (
                <button
                  onClick={suggestion.action.onClick}
                  className={`mt-2 text-xs font-medium px-3 py-1 rounded ${
                    suggestion.priority === 'high'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : suggestion.priority === 'medium'
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {suggestion.action.label}
                </button>
              )}
            </div>

            <button
              onClick={() => dismissSuggestion(suggestion.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
