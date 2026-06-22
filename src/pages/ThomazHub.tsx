import React, { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, BarChart2, MessageSquare, Activity } from 'lucide-react'
import { supabase } from '../lib/supabase'

const ThomazChat = lazy(() => import('./ThomazChat'))
const ThomazMetrics = lazy(() => import('./ThomazMetrics'))

type Tab = 'chat' | 'metrics'

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
)

const ThomazHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [conversationCount, setConversationCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      const { count } = await supabase
        .from('thomaz_conversations')
        .select('id', { count: 'exact', head: true })
        .then(res => ({ count: res.count ?? 0 }))
        .catch(() => ({ count: 0 }))
      setConversationCount(count)
    }
    fetchCounts()
  }, [])

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'chat', label: 'Thomaz AI', icon: MessageSquare, desc: 'Consultor empresarial' },
    { id: 'metrics', label: 'Métricas', icon: BarChart2, desc: 'Performance da IA' },
  ]

  return (
    <div className="space-y-0 min-h-screen -mx-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 mb-6 -mx-5 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Thomaz AI
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {conversationCount} conversas registradas
              </span>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Online
              </span>
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'chat' && <ThomazChat />}
              {activeTab === 'metrics' && <ThomazMetrics />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ThomazHub
