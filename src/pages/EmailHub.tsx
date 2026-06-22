import React, { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Settings, Inbox, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'

const EmailInbox = lazy(() => import('./EmailInbox'))
const EmailSettings = lazy(() => import('./EmailSettings'))

type Tab = 'inbox' | 'settings'

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
)

const EmailHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('inbox')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      const { count } = await supabase
        .from('emails')
        .select('id', { count: 'exact', head: true })
        .eq('folder', 'inbox')
        .eq('is_read', false)
        .then(res => ({ count: res.count ?? 0 }))
        .catch(() => ({ count: 0 }))
      setUnreadCount(count)
    }
    fetchCounts()
  }, [])

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'inbox', label: 'Caixa de Entrada', icon: Inbox, desc: 'Emails recebidos e enviados' },
    { id: 'settings', label: 'Configurações', icon: Settings, desc: 'SMTP / IMAP' },
  ]

  return (
    <div className="space-y-0 min-h-screen -mx-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 mb-6 -mx-5 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Email Corporativo
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Inbox className="h-3 w-3" />
                {unreadCount > 0 ? `${unreadCount} não lido${unreadCount !== 1 ? 's' : ''}` : 'Sem emails não lidos'}
              </span>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1 shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.id === 'inbox' && unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {unreadCount}
                  </span>
                )}
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
            initial={{ opacity: 0, x: activeTab === 'inbox' ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'inbox' ? 12 : -12 }}
            transition={{ duration: 0.18 }}
          >
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'inbox' && <EmailInbox />}
              {activeTab === 'settings' && <EmailSettings />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default EmailHub
