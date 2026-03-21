import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Send,
  Bell,
  CheckCheck,
  Check,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2
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
}

interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
  is_mine: boolean
}

const NOTIFICATION_ICONS: Record<string, { icon: typeof Bell; bg: string; color: string }> = {
  alert: { icon: AlertTriangle, bg: 'bg-red-100', color: 'text-red-600' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-100', color: 'text-amber-600' },
  success: { icon: CheckCircle2, bg: 'bg-green-100', color: 'text-green-600' },
  info: { icon: Info, bg: 'bg-blue-100', color: 'text-blue-600' },
  default: { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-600' }
}

const TechnicianChat = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()

    const notificationsChannel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications(prev => [newNotif, ...prev])
        }
      )
      .subscribe()

    const messagesChannel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'internal_messages' },
        (payload) => {
          const newMsg = payload.new as any
          setMessages(prev => [...prev, {
            ...newMsg,
            is_mine: newMsg.sender_id === user?.id
          }])
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notificationsChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      setNotifications(notifData || [])

      const { data: msgData } = await supabase
        .from('internal_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100)

      if (msgData) {
        setMessages(msgData.map((m: any) => ({
          ...m,
          is_mine: m.sender_id === user?.id
        })))
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 100)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)

    try {
      const { error } = await supabase
        .from('internal_messages')
        .insert({
          sender_id: user?.id,
          sender_name: user?.name || 'Tecnico',
          content: newMessage.trim(),
          channel: 'general'
        })

      if (!error) {
        setNewMessage('')
        inputRef.current?.focus()
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

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
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comunicacao</h1>
            <p className="text-sm text-gray-500">
              {activeTab === 'notifications'
                ? `${unreadCount} nao lidas`
                : `${messages.length} mensagens`}
            </p>
          </div>
          {activeTab === 'notifications' && unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 font-semibold active:opacity-70"
            >
              Marcar todas lidas
            </button>
          )}
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'notifications'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <Bell className="w-5 h-5" />
            Avisos
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'messages'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            Chat
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'notifications' ? (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full overflow-y-auto p-4 space-y-3"
            >
              {notifications.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Sem notificacoes</h3>
                  <p className="text-gray-500">Voce esta em dia!</p>
                </div>
              ) : (
                notifications.map((notif, index) => {
                  const iconConfig = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.default
                  const Icon = iconConfig.icon

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
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconConfig.bg}`}>
                          <Icon className={`w-6 h-6 ${iconConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-bold truncate ${
                              !notif.is_read ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notif.title}
                            </h4>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {formatTime(notif.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Sem mensagens</h3>
                    <p className="text-gray-500">Inicie uma conversa com a equipe!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] ${msg.is_mine ? '' : 'flex gap-2'}`}>
                          {!msg.is_mine && showAvatar && (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-blue-600">
                                {msg.sender_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {!msg.is_mine && !showAvatar && <div className="w-8" />}

                          <div>
                            {!msg.is_mine && showAvatar && (
                              <p className="text-xs font-semibold text-gray-500 mb-1 ml-1">
                                {msg.sender_name}
                              </p>
                            )}
                            <div className={`px-4 py-3 ${
                              msg.is_mine
                                ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                                : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm'
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${
                                msg.is_mine ? 'text-blue-200' : 'text-gray-400'
                              }`}>
                                <span className="text-[10px]">{formatMessageTime(msg.created_at)}</span>
                                {msg.is_mine && <CheckCheck className="w-3 h-3" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default TechnicianChat
