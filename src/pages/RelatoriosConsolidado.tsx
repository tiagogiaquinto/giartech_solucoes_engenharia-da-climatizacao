import React from 'react';
import { TabContainer, TabItem } from '../components/TabContainer';
import { PieChart, FileText, Sliders, History } from 'lucide-react';
import Reports from './Reports';
import ReportsAdvanced from './ReportsAdvanced';

function CustomReports() {
  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
        <Sliders className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Relatórios Customizados</h2>
        <p className="text-gray-600 mb-6">
          Crie relatórios personalizados com os dados que você precisa
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

function ReportsHistory() {
  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
        <History className="h-16 w-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Histórico de Relatórios</h2>
        <p className="text-gray-600 mb-6">
          Acesse relatórios gerados anteriormente e baixe novamente
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

export default function RelatoriosConsolidado() {
  const tabs: TabItem[] = [
    {
      id: 'dashboards',
      label: 'Dashboards',
      icon: PieChart,
      component: Reports,
      description: 'Relatórios visuais interativos com gráficos e análises'
    },
    {
      id: 'pdfs',
      label: 'PDFs Profissionais',
      icon: FileText,
      component: ReportsAdvanced,
      description: 'Relatórios em PDF para impressão e apresentações'
    },
    {
      id: 'customizados',
      label: 'Customizados',
      icon: Sliders,
      component: CustomReports,
      description: 'Crie relatórios personalizados com seus próprios filtros'
    },
    {
      id: 'historico',
      label: 'Histórico',
      icon: History,
      component: ReportsHistory,
      description: 'Histórico de relatórios gerados anteriormente'
    }
  ];

  return (
    <div className="h-full">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">📄 Relatórios</h1>
        <p className="text-emerald-100">
          Todos os relatórios e análises em um único lugar
        </p>
      </div>

      <TabContainer tabs={tabs} defaultTab="dashboards" />
    </div>
  );
}
