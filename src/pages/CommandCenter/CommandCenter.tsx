import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageSquare, CheckSquare, Megaphone, Zap, Users,
  LayoutPanelLeft, LayoutPanelTop, Columns
} from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import ChannelChatPanel from './ChannelChatPanel'
import TaskListPanel from './TaskListPanel'
import BroadcastComposer from './BroadcastComposer'

type Layout = 'split' | 'chat-focus' | 'tasks-focus'

const LAYOUT_OPTIONS: { id: Layout; label: string; Icon: React.ElementType }[] = [
  { id: 'split',       label: 'Dividido',       Icon: Columns },
  { id: 'chat-focus',  label: 'Chat',            Icon: MessageSquare },
  { id: 'tasks-focus', label: 'Tarefas',         Icon: CheckSquare },
]

export default function CommandCenter() {
  const { profile } = useUser()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'admin' || profile?.user_type === 'admin'

  const [layout, setLayout] = useState<Layout>('split')
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [taskRefreshKey, setTaskRefreshKey] = useState(0)
  const [broadcastSentCount, setBroadcastSentCount] = useState(0)

  const handleTaskCreated = useCallback(() => {
    setTaskRefreshKey(k => k + 1)
  }, [])

  const handleBroadcastSent = useCallback(() => {
    setBroadcastSentCount(k => k + 1)
  }, [])

  const showChat  = layout === 'split' || layout === 'chat-focus'
  const showTasks = layout === 'split' || layout === 'tasks-focus'

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">

      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Centro de Operações</h1>
            <p className="text-xs text-gray-400">Chat + Tarefas em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowBroadcast(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', boxShadow: '0 2px 8px rgba(15,23,42,0.2)' }}>
              <Megaphone className="w-3.5 h-3.5" />
              Broadcast
              {broadcastSentCount > 0 && (
                <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {broadcastSentCount}
                </span>
              )}
            </button>
          )}

          <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1">
            {LAYOUT_OPTIONS.map(opt => {
              const Icon = opt.Icon
              const active = layout === opt.id
              return (
                <button key={opt.id} onClick={() => setLayout(opt.id)}
                  title={opt.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">

        {showChat && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`bg-white border-r border-gray-100 overflow-hidden flex flex-col ${
              layout === 'split' ? 'flex-1' : 'w-full'
            }`}>
            <ChannelChatPanel
              onOpenBroadcast={() => setShowBroadcast(true)}
              onTaskCreated={handleTaskCreated}
            />
          </motion.div>
        )}

        {layout === 'split' && (
          <div className="w-px bg-gray-100 flex-shrink-0" />
        )}

        {showTasks && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`bg-white overflow-hidden flex flex-col ${
              layout === 'split' ? 'w-80 flex-shrink-0' : 'w-full'
            }`}>
            <TaskListPanel
              refreshKey={taskRefreshKey}
              onNavigateToBoard={() => navigate('/task-board')}
            />
          </motion.div>
        )}
      </div>

      {showBroadcast && (
        <BroadcastComposer
          onClose={() => setShowBroadcast(false)}
          onSent={handleBroadcastSent}
        />
      )}
    </div>
  )
}
