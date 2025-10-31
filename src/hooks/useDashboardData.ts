import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDashboardData() {
  const [metrics, setMetrics] = useState({
    total_service_orders: 0,
    orders_completed: 0,
    total_clients: 0,
    total_inventory_items: 0,
    total_inventory_quantity: 0
  })

  const [financial, setFinancial] = useState({
    total_income_paid: 0,
    total_expenses_paid: 0,
    total_pending: 0
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [activeOrders, setActiveOrders] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)

      // Buscar métricas
      const { data: ordersData } = await supabase
        .from('service_orders')
        .select('status')

      const { data: clientsData } = await supabase
        .from('customers')
        .select('id')

      const { data: inventoryData } = await supabase
        .from('inventory_items')
        .select('quantity')

      // Buscar dados financeiros
      const { data: incomeData } = await supabase
        .from('finance_entries')
        .select('amount')
        .eq('type', 'receita')
        .eq('status', 'pago')

      const { data: expensesData } = await supabase
        .from('finance_entries')
        .select('amount')
        .eq('type', 'despesa')
        .eq('status', 'pago')

      // Calcular totais
      const totalIncome = incomeData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
      const totalExpenses = expensesData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
      const totalInventory = inventoryData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0

      setMetrics({
        total_service_orders: ordersData?.length || 0,
        orders_completed: ordersData?.filter(o => o.status === 'concluida')?.length || 0,
        total_clients: clientsData?.length || 0,
        total_inventory_items: inventoryData?.length || 0,
        total_inventory_quantity: totalInventory
      })

      setFinancial({
        total_income_paid: totalIncome,
        total_expenses_paid: totalExpenses,
        total_pending: 0
      })

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calcular lucro e margem
  const profit = (financial.total_income_paid || 0) - (financial.total_expenses_paid || 0)
  const profitMargin = financial.total_income_paid > 0
    ? ((profit / financial.total_income_paid) * 100)
    : 0

  return {
    metrics,
    financial,
    recentTransactions,
    activeOrders,
    loading,
    error,
    refresh: loadData,
    profit,
    profitMargin
  }
}
