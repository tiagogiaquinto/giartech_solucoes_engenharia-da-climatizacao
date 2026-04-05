import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Hash, Users, ChevronRight, Loader2, Megaphone,
  MessageSquare, Zap, CheckCheck, Plus, X
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../contexts/UserContext'
import { Channel, ChatMessage } from './types'

interface Props {
  onOpenBroadcast: () => void
  onTaskCreated: () => void
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(d: string) {
  const date = new Date(d)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Hoje'
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function groupByDay(messages: ChatMessage[]) {
  const groups: { day: string; messages: ChatMessage[] }[] = []
  let lastDay = ''
  for (const msg of messages) {
    const day = new Date(msg.created_at).toDateString()
    if (day !== lastDay) { groups.push({ day: formatDay(msg.created_at), messages: [] }); lastDay = day }
    groups[groups.length - 1].messages.push(msg)
  }
  return groups
}

const ROLE_BADGE: Record<string, string> = {
  admin:       'bg-blue-100 text-blue-700',
  manager:     'bg-blue-100 text-blue-700',
  tecnico:     'bg-emerald-100 text-emerald-700',
  technician:  'bg-emerald-100 text-emerald-700',
  funcionario: 'bg-gray-100 text-gray-600',
  comercial:   'bg-rose-100 text-rose-700',
}

const TASK_CMD_RE = /^\/tarefa(?:\s+@(\S+))?\s+(.+)$/i

export default function ChannelChatPanel({ onOpenBroadcast, onTaskCreated }: Props) {
  const { user, profile } = useUser()
  const isAdmin = profile?.role === 'admin' || profile?.user_type === 'admin'

  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [commandPreview, setCommandPreview] = useState<{ assignee: string; title: string } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<any>(null)

  const loadChannels = useCallback(async () => {
    setLoadingChannels(true)
    const { data } = await supabase
      .from('corp_chat_channels')
      .select('*')
      .eq('is_active', true)
      .order('last_message_at', { ascending: false, nullsFirst: false })
    setChannels(data || [])
    setLoadingChannels(false)
    if (!activeChannel && data && data.length > 0) {
      setActiveChannel(data[0])
    }
  }, [activeChannel])

  const loadMessages = useCallback(async (channelId: string) => {
    setLoadingMessages(true)
    const { data } = await supabase
      .from('corp_chat_messages')
      .select('*')
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(150)
    setMessages(data || [])
    setLoadingMessages(false)
  }, [])

  useEffect(() => { loadChannels() }, [])

  useEffect(() => {
    if (!activeChannel) return
    loadMessages(activeChannel.id)
    subRef.current?.unsubscribe()
    subRef.current = supabase
      .channel(`chat:${activeChannel.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'corp_chat_messages', filter: `channel_id=eq.${activeChannel.id}` },
        payload => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as ChatMessage]
          })
        })
      .subscribe()
    return () => { subRef.current?.unsubscribe() }
  }, [activeChannel?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const match = newMessage.match(TASK_CMD_RE)
    if (match) {
      setCommandPreview({ assignee: match[1] || '', title: match[2] || '' })
    } else {
      setCommandPreview(null)
    }
  }, [newMessage])

  async function handleSend() {
    if (!newMessage.trim() || !activeChannel) return

    const content = newMessage.trim()
    setNewMessage('')
    setSending(true)

    const taskMatch = content.match(TASK_CMD_RE)

    try {
      const senderName = profile?.full_name || user?.email || 'Usuário'
      const senderRole = profile?.role || profile?.user_type || 'funcionario'

      const { data: msgData } = await supabase
        .from('corp_chat_messages')
        .insert({
          channel_id: activeChannel.id,
          sender_id: user?.id || null,
          sender_name: senderName,
          sender_role: senderRole,
          message_type: taskMatch ? 'command' : 'text',
          content,
        })
        .select()
        .single()

      if (taskMatch) {
        const [, assignee, taskTitle] = taskMatch
        await supabase.rpc('create_task_from_chat', {
          p_title:         taskTitle.trim(),
          p_assignee_name: assignee || null,
          p_channel_id:    activeChannel.id,
          p_message_id:    msgData?.id || null,
          p_creator_name:  senderName,
        })

        await supabase.from('corp_chat_messages').insert({
          channel_id: activeChannel.id,
          sender_id: null,
          sender_name: 'Sistema',
          sender_role: 'system',
          message_type: 'system',
          content: `✅ Tarefa criada: "${taskTitle.trim()}"${assignee ? ` → atribuída a @${assignee}` : ''}`,
        })

        onTaskCreated()
      }

      await supabase
        .from('corp_chat_channels')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', activeChannel.id)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const senderName = profile?.full_name || user?.email || 'Usuário'

  return (
    <div className="flex h-full overflow-hidden">

      {showSidebar && (
        <motion.div
          initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
          className="flex flex-col border-r border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0"
          style={{ width: 220 }}>

          <div className="px-3 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Canais</p>
          </div>

          {isAdmin && (
            <div className="px-3 pt-2">
              <button onClick={onOpenBroadcast}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#fff' }}>
                <Megaphone className="w-3.5 h-3.5" />
                Broadcast
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-2 pt-2 pb-3 space-y-0.5">
            {loadingChannels ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
              </div>
            ) : channels.map(ch => {
              const isActive = activeChannel?.id === ch.id
              const isGroup = ch.channel_type === 'group'
              return (
                <button key={ch.id} onClick={() => setActiveChannel(ch)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-white shadow-sm text-gray-900 border border-gray-200/80'
                      : 'text-gray-600 hover:bg-white/70 hover:text-gray-800'
                  }`}>
                  <span className={`text-gray-400 ${isActive ? 'text-blue-600' : ''}`}>
                    {isGroup ? <Users className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-xs font-medium truncate flex-1">{ch.name}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-gray-300" />}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowSidebar(s => !s)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
              <MessageSquare className="w-4 h-4" />
            </button>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {activeChannel ? activeChannel.name : 'Selecione um canal'}
              </p>
              {activeChannel && (
                <p className="text-xs text-gray-400">
                  {activeChannel.channel_type === 'group' ? 'Canal de grupo' : 'Mensagem direta'}
                </p>
              )}
            </div>
          </div>
          {isAdmin && (
            <button onClick={onOpenBroadcast}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300 transition">
              <Megaphone className="w-3.5 h-3.5" />
              Broadcast
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {loadingMessages ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 font-medium">Nenhuma mensagem ainda</p>
              <p className="text-xs text-gray-300 mt-1">Seja o primeiro a enviar uma mensagem</p>
            </div>
          ) : (
            groupByDay(messages).map(group => (
              <div key={group.day}>
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{group.day}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                {group.messages.map(msg => {
                  const isMine = msg.sender_id === user?.id || msg.sender_name === senderName
                  const isSystem = msg.message_type === 'system'
                  const isCommand = msg.message_type === 'command'
                  const isBroadcast = msg.message_type === 'broadcast'

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-1">
                        <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-0.5">
                          {msg.content}
                        </span>
                      </div>
                    )
                  }

                  if (isBroadcast) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 max-w-sm">
                          <Megaphone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-blue-700">{msg.content}</span>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={msg.id} className={`flex gap-2.5 group ${isMine ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white mt-0.5 ${
                        isMine ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        {msg.sender_name.charAt(0).toUpperCase()}
                      </div>
                      <div className={`max-w-[70%] space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-semibold text-gray-700">{msg.sender_name}</span>
                          {msg.sender_role && msg.sender_role !== 'system' && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_BADGE[msg.sender_role] || 'bg-gray-100 text-gray-500'}`}>
                              {msg.sender_role}
                            </span>
                          )}
                        </div>
                        <div className={`rounded-2xl px-3 py-2 text-sm ${
                          isMine
                            ? 'text-white rounded-tr-sm'
                            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                        } ${isCommand ? 'border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-800' : ''}`}
                          style={isMine && !isCommand ? {
                            background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)'
                          } : undefined}>
                          {isCommand && <Zap className="w-3 h-3 inline mr-1 text-emerald-500" />}
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                          {isMine && <CheckCheck className="w-3 h-3 text-gray-300" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <AnimatePresence>
          {commandPreview && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-4 border-t border-emerald-100 bg-emerald-50">
              <div className="flex items-center gap-2 py-2">
                <Zap className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-emerald-700">
                  <strong>Criar tarefa:</strong> "{commandPreview.title}"
                  {commandPreview.assignee && <> → <strong>@{commandPreview.assignee}</strong></>}
                </span>
                <button onClick={() => setNewMessage('')} className="ml-auto text-emerald-400 hover:text-emerald-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
          {isAdmin && (
            <p className="text-[10px] text-gray-400 mb-2">
              Dica: use <code className="bg-gray-100 px-1 rounded text-emerald-600">/tarefa @nome Título da tarefa</code> para criar uma tarefa diretamente
            </p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeChannel ? `Mensagem em ${activeChannel.name}...` : 'Selecione um canal'}
              disabled={!activeChannel || sending}
              rows={1}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              style={{ maxHeight: 120, overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || !activeChannel || sending}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)' }}>
              {sending
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
