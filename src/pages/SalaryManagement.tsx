import React, { useState } from 'react'
import { DollarSign, TrendingDown, BarChart3, Users } from 'lucide-react'
import SalaryPaymentManager from '../components/SalaryPaymentManager'
import SalaryAdvanceManager from '../components/SalaryAdvanceManager'
import SalaryReports from '../components/SalaryReports'
import EmployeeSalaryEditor from '../components/EmployeeSalaryEditor'

const SalaryManagement = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'advances' | 'employees' | 'reports'>('payments')

  const tabs = [
    { id: 'payments' as const, label: 'Pagamentos', icon: DollarSign },
    { id: 'advances' as const, label: 'Vales/Adiantamentos', icon: TrendingDown },
    { id: 'employees' as const, label: 'Editar Salários', icon: Users },
    { id: 'reports' as const, label: 'Relatórios', icon: BarChart3 }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'payments' && <SalaryPaymentManager />}
          {activeTab === 'advances' && <SalaryAdvanceManager />}
          {activeTab === 'employees' && <EmployeeSalaryEditor />}
          {activeTab === 'reports' && <SalaryReports />}
        </div>
      </div>
    </div>
  )
}

export default SalaryManagement
