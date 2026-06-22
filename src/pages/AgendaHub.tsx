import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, LayoutGrid, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import Calendar from './Calendar'
import TaskBoard from './TaskBoard/TaskBoard'
import { supabase } from '../lib/supabase'

type Tab = 'agenda' | 'tarefas'

interface AgendaHubProps {
  onPremiumFeature?: (feature: string) => void
  onEnterpriseFeature?: (feature: string) => void
}

const AgendaHub: React.FC<AgendaHubProps> = ({ onPremiumFeature, onEnterpriseFeature }) => {
  const [activeTab, setActiveTab] = useState<Tab>('agenda')
  const [agendaCount, setAgendaCount] = useState(0)
  const [taskCount, setTaskCount] = useState(0)
  const [urgentCount, setUrgentCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      const today = new Date().toISOString().split('T')[0]

      const [agendaRes, taskRes, urgentRes] = await Promise.allSettled([
        supabase.from('agenda_events')
          .select('id', { count: 'exact', head: true })
          .gte('date', today),
        supabase.from('tasks')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'done'),
        supabase.from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('priority', 'urgent')
          .neq('status', 'done'),
      ])

      if (agendaRes.status === 'fulfilled') setAgendaCount(agendaRes.value.count ?? 0)
      if (taskRes.status === 'fulfilled') setTaskCount(taskRes.value.count ?? 0)
      if (urgentRes.status === 'fulfilled') setUrgentCount(urgentRes.value.count ?? 0)
    }

    fetchCounts()
  }, [])

  const tabs: { id: Tab; label: string; count: number; icon: React.ElementType; desc: string }[] = [
    { id: 'agenda', label: 'Agenda', count: agendaCount, icon: CalendarDays, desc: 'eventos futuros' },
    { id: 'tarefas', label: 'Central de Tarefas', count: taskCount, icon: LayoutGrid, desc: 'tarefas abertas' },
  ]

  return (
    <div className="space-y-0 min-h-screen -mx-1">
      {/* ── Unified Header ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 mb-6 -mx-5 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Title + quick stats */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {activeTab === 'agenda'
                ? <CalendarDays className="h-5 w-5 text-blue-600" />
                : <LayoutGrid className="h-5 w-5 text-indigo-600" />}
              Agenda & Tarefas
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {agendaCount} eventos futuros
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {taskCount} tarefas abertas
              </span>
              {urgentCount > 0 && (
                <span className="text-xs text-red-600 font-medium flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                  <Zap className="h-3 w-3" />
                  {urgentCount} urgente{urgentCount !== 1 ? 's' : ''}
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
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                  activeTab === tab.id
                    ? tab.id === 'agenda' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-200 text-gray-500'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="px-1">
        <AnimatePresence mode="wait">
          {activeTab === 'agenda' ? (
            <motion.div
              key="agenda"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
            >
              <Calendar onPremiumFeature={onPremiumFeature} />
            </motion.div>
          ) : (
            <motion.div
              key="tarefas"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              <TaskBoard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AgendaHub
