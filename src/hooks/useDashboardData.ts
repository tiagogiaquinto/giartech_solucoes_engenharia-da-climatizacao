import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface BusinessKPIs {
  // Ordens de Serviço
  total_completed_orders: number;
  orders_in_progress: number;
  cancelled_orders: number;
  total_revenue: number;
  avg_order_value: number;
  conversion_rate: number;

  // Clientes (com separação PF/PJ)
  total_customers: number;
  total_customers_pj: number;
  total_customers_pf: number;
  active_customers: number;

  // Estoque
  materials_in_stock: number;
  total_stock_quantity: number;
  total_inventory_cost: number;
  total_inventory_value: number;
  potential_profit: number;

  // Financeiro
  total_income: number;
  total_expenses: number;
  accounts_receivable: number;
  accounts_payable: number;

  // Funcionários
  active_employees: number;
  total_payroll: number;

  // Lucro
  net_profit: number;
  profit_margin: number;
}

export interface DashboardMetrics {
  total_service_orders: number;
  orders_pending: number;
  orders_in_progress: number;
  orders_completed: number;
  total_clients: number;
  total_services: number;
  total_inventory_items: number;
  total_inventory_quantity: number;
  total_projects: number;
  total_users: number;
}

export interface DashboardFinancial {
  total_income_paid: number;
  total_income_pending: number;
  total_expense_paid: number;
  total_expense_pending: number;
  accounts_receivable_count: number;
  accounts_receivable_value: number;
  accounts_payable_count: number;
  accounts_payable_value: number;
  total_transactions: number;
  inventory_cost_value: number;
  inventory_sale_value: number;
  inventory_potential_profit: number;
  inventory_profit_margin: number;
}

export interface RecentTransaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  status: string;
  data: string;
  forma_pagamento?: string;
  created_at: string;
  customer_id?: string;
}

export interface ActiveServiceOrder {
  id: string;
  order_number: string;
  status: string;
  customer_id: string;
  final_total: number;
  created_at: string;
}

export interface DashboardData {
  kpis: BusinessKPIs | null;
  metrics: DashboardMetrics | null;
  financial: DashboardFinancial | null;
  recentTransactions: RecentTransaction[];
  activeOrders: ActiveServiceOrder[];
  loading: boolean;
  error: string | null;
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    kpis: null,
    metrics: null,
    financial: null,
    recentTransactions: [],
    activeOrders: [],
    loading: true,
    error: null,
  });

  const fetchDashboardData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Buscar KPIs da view principal
      const { data: kpisData, error: kpisError } = await supabase
        .from('v_business_kpis')
        .select('*')
        .maybeSingle();

      if (kpisError) throw kpisError;

      // Buscar transações recentes
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('finance_entries')
        .select('*')
        .order('data', { ascending: false })
        .limit(20);

      if (transactionsError) throw transactionsError;

      // Buscar ordens de serviço ativas
      const { data: ordersData, error: ordersError } = await supabase
        .from('service_orders')
        .select('id, order_number, status, customer_id, final_total, created_at')
        .in('status', ['pending', 'in_progress', 'scheduled'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;

      // Converter KPIs para métricas e financeiro (compatibilidade)
      const metrics: DashboardMetrics = {
        total_service_orders: (kpisData?.total_completed_orders || 0) + (kpisData?.orders_in_progress || 0),
        orders_pending: 0,
        orders_in_progress: kpisData?.orders_in_progress || 0,
        orders_completed: kpisData?.total_completed_orders || 0,
        total_clients: kpisData?.total_customers || 0,
        total_services: 0,
        total_inventory_items: kpisData?.materials_in_stock || 0,
        total_inventory_quantity: kpisData?.total_stock_quantity || 0,
        total_projects: 0,
        total_users: kpisData?.active_employees || 0,
      };

      const financial: DashboardFinancial = {
        total_income_paid: kpisData?.total_income || 0,
        total_income_pending: kpisData?.accounts_receivable || 0,
        total_expense_paid: kpisData?.total_expenses || 0,
        total_expense_pending: kpisData?.accounts_payable || 0,
        accounts_receivable_count: 0,
        accounts_receivable_value: kpisData?.accounts_receivable || 0,
        accounts_payable_count: 0,
        accounts_payable_value: kpisData?.accounts_payable || 0,
        total_transactions: 0,
        inventory_cost_value: kpisData?.total_inventory_cost || 0,
        inventory_sale_value: kpisData?.total_inventory_value || 0,
        inventory_potential_profit: kpisData?.potential_profit || 0,
        inventory_profit_margin: 0,
      };

      setData({
        kpis: kpisData,
        metrics,
        financial,
        recentTransactions: transactionsData || [],
        activeOrders: ordersData || [],
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar dados do dashboard',
      }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refresh = () => {
    fetchDashboardData();
  };

  const calculateProfit = (): number => {
    if (!data.kpis) return 0;
    return data.kpis.net_profit;
  };

  const calculateProfitMargin = (): number => {
    if (!data.kpis) return 0;
    return data.kpis.profit_margin;
  };

  return {
    ...data,
    refresh,
    profit: calculateProfit(),
    profitMargin: calculateProfitMargin(),
  };
};
