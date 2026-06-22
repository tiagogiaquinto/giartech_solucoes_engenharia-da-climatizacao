import React, { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Users, BarChart2, Heart, Smartphone, Zap, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

const CRMEsteiraIntegrada = lazy(() => import('./CRMEsteiraIntegrada'))
const CRMLeads = lazy(() => import('./CRMLeads'))
const CustomerRFM = lazy(() => import('./CustomerRFM'))
const PosVenda = lazy(() => import('./PosVenda'))
const WhatsAppCRM = lazy(() => import('./WhatsAppCRM'))

type Tab = 'esteira' | 'leads' | 'rfm' | 'pos-venda' | 'whatsapp'

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
)

const CRMHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('esteira')
  const [leadsCount, setLeadsCount] = useState(0)
  const [urgentFollowUps, setUrgentFollowUps] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      const [leadsRes, followRes] = await Promise.allSettled([
        supabase
          .from('crm_opportunities')
          .select('id', { count: 'exact', head: true })
          .neq('stage', 'fechado_ganho')
          .neq('stage', 'fechado_perdido'),
        supabase
          .from('crm_opportunities')
          .select('id', { count: 'exact', head: true })
          .lte('proximo_contato', new Date().toISOString().split('T')[0])
          .neq('stage', 'fechado_ganho')
          .neq('stage', 'fechado_perdido'),
      ])
      if (leadsRes.status === 'fulfilled') setLeadsCount(leadsRes.value.count ?? 0)
      if (followRes.status === 'fulfilled') setUrgentFollowUps(followRes.value.count ?? 0)
    }
    fetchCounts()
  }, [])

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'esteira', label: 'Pipeline CRM', icon: Target, desc: 'Oportunidades e pipeline' },
    { id: 'leads', label: 'Leads', icon: Users, desc: 'Captação de leads' },
    { id: 'rfm', label: 'Análise RFM', icon: BarChart2, desc: 'Segmentação de clientes' },
    { id: 'pos-venda', label: 'Pós-Venda', icon: Heart, desc: 'Fidelização' },
    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone, desc: 'Mensagens e templates' },
  ]

  return (
    <div className="space-y-0 min-h-screen -mx-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 mb-6 -mx-5 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              CRM & Relacionamento
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {leadsCount} oportunidades ativas
              </span>
              {urgentFollowUps > 0 && (
                <span className="text-xs text-red-600 font-medium flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                  <Zap className="h-3 w-3" />
                  {urgentFollowUps} follow-up{urgentFollowUps !== 1 ? 's' : ''} pendente{urgentFollowUps !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Tab switcher */}
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1 shrink-0 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.icon === Target ? 'Pipeline' : tab.label.split(' ')[0]}</span>
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
              {activeTab === 'esteira' && <CRMEsteiraIntegrada />}
              {activeTab === 'leads' && <CRMLeads />}
              {activeTab === 'rfm' && <CustomerRFM />}
              {activeTab === 'pos-venda' && <PosVenda />}
              {activeTab === 'whatsapp' && <WhatsAppCRM />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CRMHub
