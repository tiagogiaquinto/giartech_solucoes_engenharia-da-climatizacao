import React from 'react';
import { TabContainer, TabItem } from '../components/TabContainer';
import { BarChart3, DollarSign, Activity, CreditCard, FolderKanban } from 'lucide-react';
import FinancialIntegration from './FinancialIntegration';
import FinancialManagement from './FinancialManagement';
import FinancialAnalysis from './FinancialAnalysis';
import BankAccounts from './BankAccounts';
import FinancialCategories from './FinancialCategories';

export default function FinanceiroConsolidado() {
  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      component: FinancialIntegration,
      description: 'Visão geral integrada do financeiro com KPIs principais'
    },
    {
      id: 'movimentacoes',
      label: 'Movimentações',
      icon: DollarSign,
      component: FinancialManagement,
      description: 'Gestão de receitas, despesas e fluxo de caixa'
    },
    {
      id: 'analise',
      label: 'Análise',
      icon: Activity,
      component: FinancialAnalysis,
      description: 'Análises avançadas: EBITDA, ROI, Margens e Indicadores'
    },
    {
      id: 'contas',
      label: 'Contas Bancárias',
      icon: CreditCard,
      component: BankAccounts,
      description: 'Gerenciamento de contas bancárias e saldos'
    },
    {
      id: 'categorias',
      label: 'Categorias',
      icon: FolderKanban,
      component: FinancialCategories,
      description: 'Organização de categorias e subcategorias financeiras'
    }
  ];

  return (
    <div className="h-full">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">💰 Centro Financeiro</h1>
        <p className="text-blue-100">
          Gestão completa do financeiro: dashboard, movimentações, análises e configurações
        </p>
      </div>

      <TabContainer tabs={tabs} defaultTab="dashboard" />
    </div>
  );
}
