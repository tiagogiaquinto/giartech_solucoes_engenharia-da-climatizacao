import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Send,
  Bell,
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Wrench,
  Users,
  Hash
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  reference_id?: string
}

interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
  channel: string
  is_mine: boolean
}

interface ServiceOrderRef {
  id: string
  order_number: string
  client_name?: string
}

const NOTIFICATION_ICONS: Record<string, { icon: typeof Bell; bg: string; color: string }> = {
  alert: { icon: AlertTriangle, bg: 'bg-red-100', color: 'text-red-600' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-100', color: 'text-amber-600' },
  success: { icon: CheckCircle2, bg: 'bg-green-100', color: 'text-green-600' },
  info: { icon: Info, bg: 'bg-blue-100', color: 'text-blue-600' },
  default: { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-600' }
}

type Tab = 'avisos' | 'geral' | 'por_os'

const TechnicianChat = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<Tab>('avisos')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [generalMessages, setGeneralMessages] = useState<ChatMessage[]>([])
  const [osMessages, setOsMessages] = useState<ChatMessage[]>([])
  const [recentOrders, setRecentOrders] = useState<ServiceOrderRef[]>([])
  const [selectedOs, setSelectedOs] = useState<ServiceOrderRef | null>(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()

    const notifChannel = supabase
      .channel('tech-chat-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const n = payload.new as Notification
        setNotifications(prev => [n, ...prev])
      })
      .subscribe()

    const msgChannel = supabase
      .channel('tech-chat-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, (payload) => {
        const m = payload.new as any
        const msg: ChatMessage = { ...m, is_mine: m.sender_id === user?.id }
        if (m.channel === 'general') {
          setGeneralMessages(prev => [...prev, msg])
        } else if (m.channel && m.channel.startsWith('os_')) {
          setOsMessages(prev => [...prev, msg])
        }
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(notifChannel)
      supabase.removeChannel(msgChannel)
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [notifRes, generalRes, osRes, ordersRes] = await Promise.all([
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('internal_messages').select('*').eq('channel', 'general').order('created_at', { ascending: true }).limit(100),
        supabase.from('internal_messages').select('*').like('channel', 'os_%').order('created_at', { ascending: true }).limit(200),
        supabase.from('service_orders').select('id, order_number, client_name').in('status', ['pending', 'pendente', 'in_progress', 'em_andamento']).order('scheduled_at', { ascending: true }).limit(20)
      ])

      setNotifications(notifRes.data || [])
      setGeneralMessages((generalRes.data || []).map((m: any) => ({ ...m, is_mine: m.sender_id === user?.id })))
      setOsMessages((osRes.data || []).map((m: any) => ({ ...m, is_mine: m.sender_id === user?.id })))
      setRecentOrders(ordersRes.data || [])

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllAsRead = async () => {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ is_read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    const channel = activeTab === 'por_os' && selectedOs ? `os_${selectedOs.id}` : 'general'
    try {
      await supabase.from('internal_messages').insert({
        sender_id: user?.id,
        sender_name: user?.name || 'Tecnico',
        content: newMessage.trim(),
        channel
      })
      setNewMessage('')
      inputRef.current?.focus()
    } catch { /* noop */ } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000)
    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const formatMsgTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const unreadCount = notifications.filter(n => !n.is_read).length

  const currentMessages = activeTab === 'por_os' && selectedOs
    ? osMessages.filter(m => m.channel === `os_${selectedOs.id}`)
    : generalMessages

  const showChatInput = activeTab === 'geral' || (activeTab === 'por_os' && selectedOs)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-68px)]">
      <div className="p-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comunicacao</h1>
            <p className="text-sm text-gray-500">
              {activeTab === 'avisos' ? `${unreadCount} nao lidas` :
               activeTab === 'geral' ? `${generalMessages.length} mensagens` :
               selectedOs ? `OS #${selectedOs.order_number}` : 'Selecione uma OS'}
            </p>
          </div>
          {activeTab === 'avisos' && unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-sm text-blue-600 font-semibold active:opacity-70">
              Marcar lidas
            </button>
          )}
        </div>

        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-2xl">
          {([
            { id: 'avisos', label: 'Avisos', icon: Bell, badge: unreadCount },
            { id: 'geral', label: 'Geral', icon: Users, badge: 0 },
            { id: 'por_os', label: 'Por OS', icon: Wrench, badge: 0 }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'avisos' && (
            <motion.div
              key="avisos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full overflow-y-auto p-4 space-y-3"
            >
              {notifications.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Sem avisos</h3>
                  <p className="text-gray-500">Voce esta em dia!</p>
                </div>
              ) : notifications.map((notif, index) => {
                const cfg = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.default
                const Icon = cfg.icon
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => markAsRead(notif.id)}
                    className={`bg-white rounded-2xl shadow-sm p-4 cursor-pointer active:scale-[0.98] transition-all ${
                      !notif.is_read ? 'border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-bold truncate text-sm ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(notif.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">{notif.message}</p>
                      </div>
                      {!notif.is_read && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {(activeTab === 'geral' || activeTab === 'por_os') && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              {activeTab === 'por_os' && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {recentOrders.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">Nenhuma OS ativa no momento</p>
                    ) : recentOrders.map(os => (
                      <button
                        key={os.id}
                        onClick={() => setSelectedOs(os)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                          selectedOs?.id === os.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-white text-gray-700 border border-gray-200'
                        }`}
                      >
                        <Hash className="w-3 h-3" />
                        {os.order_number}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeTab === 'por_os' && !selectedOs ? (
                  <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                    <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione uma OS</h3>
                    <p className="text-gray-500">Escolha uma ordem acima para ver o chat</p>
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Sem mensagens</h3>
                    <p className="text-gray-500">Seja o primeiro a enviar!</p>
                  </div>
                ) : currentMessages.map((msg, index) => {
                  const showAvatar = index === 0 || currentMessages[index - 1].sender_id !== msg.sender_id
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01 }}
                      className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] ${msg.is_mine ? '' : 'flex gap-2'}`}>
                        {!msg.is_mine && (
                          <div className="w-8 h-8 flex-shrink-0">
                            {showAvatar && (
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">
                                  {msg.sender_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div>
                          {!msg.is_mine && showAvatar && (
                            <p className="text-xs font-semibold text-gray-500 mb-1 ml-1">{msg.sender_name}</p>
                          )}
                          <div className={`px-4 py-3 ${
                            msg.is_mine
                              ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                              : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${msg.is_mine ? 'text-blue-200' : 'text-gray-400'}`}>
                              <span className="text-[10px]">{formatMsgTime(msg.created_at)}</span>
                              {msg.is_mine && <CheckCheck className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {showChatInput && (
                <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-4 py-3.5 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-blue-600/30"
                    >
                      {sending ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default TechnicianChat
