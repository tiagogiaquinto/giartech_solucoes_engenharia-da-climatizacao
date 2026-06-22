import React, { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, BarChart2, TrendingUp, Calendar, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

const RelatoriosConsolidado = lazy(() => import('./RelatoriosConsolidado'))
const WeeklyReport = lazy(() => import('./WeeklyReport'))
const ExecutiveDashboard = lazy(() => import('./ExecutiveDashboard'))

type Tab = 'relatorios' | 'semanal' | 'executivo'

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
)

const RelatoriosHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('relatorios')
  const [weeklyCount, setWeeklyCount] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      const { count } = await supabase
        .from('weekly_reports')
        .select('id', { count: 'exact', head: true })
        .limit(1)
        .maybeSingle()
        .then(() => ({ count: 0 }))
        .catch(() => ({ count: 0 }))
      setWeeklyCount(count ?? 0)
    }
    fetchStats()
  }, [])

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string; badge?: number }[] = [
    { id: 'relatorios', label: 'Relatórios', icon: FileText, desc: 'Dashboards e PDFs' },
    { id: 'semanal', label: 'Relatório Semanal', icon: BarChart2, desc: 'Resumo automático' },
    { id: 'executivo', label: 'Dashboard Executivo', icon: TrendingUp, desc: 'DRE e análises' },
  ]

  return (
    <div className="space-y-0 min-h-screen -mx-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 mb-6 -mx-5 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Relatórios & Dashboards
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Análises em tempo real
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Relatórios automáticos semanais
              </span>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1 shrink-0 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'relatorios' && <RelatoriosConsolidado />}
              {activeTab === 'semanal' && <WeeklyReport />}
              {activeTab === 'executivo' && <ExecutiveDashboard />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default RelatoriosHub
