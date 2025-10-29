import React from 'react';
import { TabContainer, TabItem } from '../components/TabContainer';
import { Shield, Target, AlertTriangle } from 'lucide-react';
import CreditScoring from './CreditScoring';

function FinancialTargets() {
  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
        <Target className="h-16 w-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Metas Financeiras</h2>
        <p className="text-gray-600 mb-6">
          Sistema de acompanhamento de metas e targets estratégicos
        </p>
        <div className="inline-block bg-white rounded-lg px-6 py-3 shadow-md">
          <p className="text-sm text-gray-600">
            Em desenvolvimento - Disponível em breve
          </p>
        </div>
      </div>
    </div>
  );
}

function FinancialAlerts() {
  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Alertas Críticos</h2>
        <p className="text-gray-600 mb-6">
          Sistema de monitoramento de alertas e problemas que precisam atenção
        </p>
        <div className="inline-block bg-white rounded-lg px-6 py-3 shadow-md">
          <p className="text-sm text-gray-600">
            Em desenvolvimento - Disponível em breve
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ExecutivoConsolidado() {
  const tabs: TabItem[] = [
    {
      id: 'credit-scoring',
      label: 'Credit Scoring',
      icon: Shield,
      component: CreditScoring,
      description: 'Análise de risco e crédito de clientes com score automatizado'
    },
    {
      id: 'metas',
      label: 'Metas & Targets',
      icon: Target,
      component: FinancialTargets,
      description: 'Acompanhamento de objetivos e metas financeiras estratégicas'
    },
    {
      id: 'alertas',
      label: 'Alertas Críticos',
      icon: AlertTriangle,
      component: FinancialAlerts,
      description: 'Problemas e situações que requerem atenção imediata'
    }
  ];

  return (
    <div className="h-full">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">📊 Consolidado Executivo</h1>
        <p className="text-blue-100">
          Análises estratégicas complementares: Credit Scoring, Metas e Alertas
        </p>
      </div>

      <TabContainer tabs={tabs} defaultTab="credit-scoring" />
    </div>
  );
}
