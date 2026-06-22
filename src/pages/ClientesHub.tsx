import React, { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserCog, Building2, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'

const CadastroClientesParceiros = lazy(() => import('./CadastroClientesParceiros'))
const ClientManagement = lazy(() => import('./ClientManagement'))

type Tab = 'cadastro' | 'legado'

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
)

const ClientesHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('cadastro')
  const [clientCount, setClientCount] = useState(0)
  const [partnerCount, setPartnerCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      const [clientRes, partnerRes] = await Promise.allSettled([
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('tipo', 'cliente'),
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('tipo', 'parceiro'),
      ])
      if (clientRes.status === 'fulfilled') setClientCount(clientRes.value.count ?? 0)
      if (partnerRes.status === 'fulfilled') setPartnerCount(partnerRes.value.count ?? 0)
    }
    fetchCounts()
  }, [])

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'cadastro', label: 'Clientes e Parceiros', icon: UserCog, desc: 'Cadastro completo PF/PJ' },
    { id: 'legado', label: 'Base Legada', icon: Users, desc: 'Clientes do sistema anterior' },
  ]

  return (
    <div className="space-y-0 min-h-screen -mx-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 mb-6 -mx-5 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Clientes & Parceiros
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {clientCount} clientes cadastrados
              </span>
              {partnerCount > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {partnerCount} parceiros
                </span>
              )}
            </div>
          </div>

          {/* Tab switcher */}
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1 shrink-0">
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
            initial={{ opacity: 0, x: activeTab === 'cadastro' ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'cadastro' ? 12 : -12 }}
            transition={{ duration: 0.18 }}
          >
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'cadastro' && <CadastroClientesParceiros />}
              {activeTab === 'legado' && <ClientManagement />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ClientesHub
