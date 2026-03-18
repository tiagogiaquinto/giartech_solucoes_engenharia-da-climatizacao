import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface OSChatPanelProps {
  serviceOrderId: string
  serviceOrderTitle?: string
  currentUserName?: string
  currentUserRole?: 'admin' | 'manager' | 'funcionario' | 'tecnico'
}

interface Message {
  id: string
  sender_name: string
  sender_role: string
  content: string
  created_at: string
}

const CURRENT_USER_ID = '00000000-0000-0000-0000-000000000001'

export function OSChatPanel({
  serviceOrderId,
  serviceOrderTitle = '',
  currentUserName = 'Administrador',
  currentUserRole = 'admin'
}: OSChatPanelProps) {
  const [channelId, setChannelId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    initChannel()
    return () => subscriptionRef.current?.unsubscribe()
  }, [serviceOrderId])

  useEffect(() => {
    if (expanded) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, expanded])

  const initChannel = async () => {
    setLoading(true)
    try {
      const { data: chId } = await supabase.rpc('get_or_create_os_chat_channel', {
        p_os_id: serviceOrderId,
        p_os_title: serviceOrderTitle
      })
      setChannelId(chId)
      const { data } = await supabase
        .from('corp_chat_messages')
        .select('id, sender_name, sender_role, content, created_at')
        .eq('channel_id', chId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(50)
      setMessages(data || [])
      subscribeChannel(chId)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const subscribeChannel = (chId: string) => {
    subscriptionRef.current = supabase
      .channel(`os_chat_${chId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'corp_chat_messages',
        filter: `channel_id=eq.${chId}`
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new as Message]
        })
      })
      .subscribe()
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !channelId || sending) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')
    try {
      await supabase.from('corp_chat_messages').insert({
        channel_id: channelId,
        sender_id: CURRENT_USER_ID,
        sender_name: currentUserName,
        sender_role: currentUserRole,
        message_type: 'text',
        content
      })
    } catch (err) {
      console.error(err)
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-blue-100 text-blue-700',
    manager: 'bg-orange-100 text-orange-700',
    funcionario: 'bg-gray-100 text-gray-700',
    tecnico: 'bg-green-100 text-green-700',
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Chat Interno da OS</span>
          {messages.length > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              {messages.length}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="bg-white">
          <div className="max-h-64 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-blue-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">
                <MessageSquare size={24} className="mx-auto mb-1.5 opacity-30" />
                <p>Nenhuma mensagem ainda</p>
              </div>
            ) : (
              messages.map(msg => {
                const isOwn = msg.sender_name === currentUserName
                return (
                  <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ROLE_COLORS[msg.sender_role] || 'bg-gray-100 text-gray-700'}`}>
                      {msg.sender_name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isOwn && (
                        <span className="text-xs text-gray-500 mb-0.5 px-1">{msg.sender_name}</span>
                      )}
                      <div className={`px-3 py-2 rounded-xl text-xs ${isOwn ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                      <span className="text-xs text-gray-400 mt-0.5 px-1">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
              placeholder="Mensagem interna..."
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
