import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Plus, Search, Hash, User, Users, MessageSquare,
  ClipboardList, Loader2, X, ChevronRight, MoreVertical,
  Paperclip, CheckCheck, Clock
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Channel {
  id: string
  channel_type: 'direct' | 'os' | 'group'
  name: string
  service_order_id: string | null
  last_message_at: string | null
  created_at: string
  unread_count?: number
  last_message?: string
}

interface Message {
  id: string
  channel_id: string
  sender_id: string | null
  sender_name: string
  sender_role: string
  message_type: string
  content: string
  file_url: string
  file_name: string
  reply_to_id: string | null
  is_deleted: boolean
  created_at: string
}

interface NewChannelForm {
  type: 'direct' | 'group'
  name: string
  memberName: string
}

const CURRENT_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Administrador',
  role: 'admin' as const
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-purple-100 text-purple-700',
  funcionario: 'bg-gray-100 text-gray-700',
  tecnico: 'bg-green-100 text-green-700',
}

export default function InternalChat() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchChannels, setSearchChannels] = useState('')
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelForm, setNewChannelForm] = useState<NewChannelForm>({ type: 'direct', name: '', memberName: '' })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel.id)
      subscribeToChannel(activeChannel.id)
    }
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [activeChannel?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChannels = async () => {
    setLoadingChannels(true)
    try {
      const { data } = await supabase
        .from('corp_chat_channels')
        .select('*')
        .eq('is_active', true)
        .order('last_message_at', { ascending: false, nullsFirst: false })
      setChannels(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingChannels(false)
    }
  }

  const loadMessages = async (channelId: string) => {
    setLoadingMessages(true)
    try {
      const { data } = await supabase
        .from('corp_chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100)
      setMessages(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMessages(false)
    }
  }

  const subscribeToChannel = (channelId: string) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }
    subscriptionRef.current = supabase
      .channel(`corp_chat_${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'corp_chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannel || sending) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')
    try {
      await supabase.from('corp_chat_messages').insert({
        channel_id: activeChannel.id,
        sender_id: CURRENT_USER.id,
        sender_name: CURRENT_USER.name,
        sender_role: CURRENT_USER.role,
        message_type: 'text',
        content
      })
      await supabase
        .from('corp_chat_channels')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', activeChannel.id)
    } catch (err) {
      console.error(err)
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  const createChannel = async () => {
    const { type, name, memberName } = newChannelForm
    if (!name && type === 'group') return
    try {
      const channelName = type === 'direct'
        ? `DM: ${memberName || 'Novo contato'}`
        : name
      const { data } = await supabase
        .from('corp_chat_channels')
        .insert({ channel_type: type, name: channelName, created_by: CURRENT_USER.id })
        .select()
        .single()
      if (data) {
        await supabase.from('corp_chat_members').insert({
          channel_id: data.id,
          user_id: CURRENT_USER.id,
          user_name: CURRENT_USER.name,
          user_role: 'admin'
        })
        setChannels(prev => [data, ...prev])
        setActiveChannel(data)
        setShowNewChannel(false)
        setNewChannelForm({ type: 'direct', name: '', memberName: '' })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (d: string) => {
    const date = new Date(d)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'Hoje'
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
    return date.toLocaleDateString('pt-BR')
  }

  const filteredChannels = channels.filter(ch =>
    !searchChannels || ch.name.toLowerCase().includes(searchChannels.toLowerCase())
  )

  const getChannelIcon = (type: string) => {
    if (type === 'direct') return <User size={16} className="text-gray-400" />
    if (type === 'os') return <ClipboardList size={16} className="text-blue-500" />
    return <Hash size={16} className="text-gray-400" />
  }

  let prevDate = ''

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar - Channels */}
      <div className="w-72 flex flex-col border-r border-gray-100 bg-gray-50">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Chat Corporativo</h2>
            <button
              onClick={() => setShowNewChannel(true)}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              title="Novo canal"
            >
              <Plus size={16} className="text-gray-500" />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchChannels}
              onChange={e => setSearchChannels(e.target.value)}
              placeholder="Buscar canal..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loadingChannels ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
              <p>Nenhum canal ainda</p>
            </div>
          ) : (
            filteredChannels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  activeChannel?.id === channel.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
              >
                <div className="shrink-0">{getChannelIcon(channel.channel_type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{channel.name}</p>
                  {channel.last_message_at && (
                    <p className="text-xs text-gray-400 truncate">
                      {formatTime(channel.last_message_at)}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {activeChannel ? (
          <>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white">
              <div className="shrink-0">{getChannelIcon(activeChannel.channel_type)}</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{activeChannel.name}</h3>
                <p className="text-xs text-gray-400 capitalize">{activeChannel.channel_type === 'os' ? 'Canal da OS' : activeChannel.channel_type === 'direct' ? 'Mensagem Direta' : 'Grupo'}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-1">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-xs mt-1">Seja o primeiro a escrever!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const msgDate = formatDate(msg.created_at)
                  const showDate = msgDate !== prevDate
                  prevDate = msgDate
                  const isOwn = msg.sender_id === CURRENT_USER.id

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="flex items-center gap-2 my-4">
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-xs text-gray-400 font-medium px-2">{msgDate}</span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                      )}
                      <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          ROLE_COLORS[msg.sender_role] || 'bg-gray-100 text-gray-700'
                        }`}>
                          {msg.sender_name.charAt(0).toUpperCase()}
                        </div>
                        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                          {!isOwn && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-xs font-semibold text-gray-700">{msg.sender_name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${ROLE_COLORS[msg.sender_role] || 'bg-gray-100 text-gray-500'}`}>
                                {msg.sender_role}
                              </span>
                            </div>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-tr-sm'
                              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white">
              <div className="flex items-end gap-3">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="w-full bg-transparent text-sm text-gray-800 resize-none focus:outline-none placeholder-gray-400"
                    placeholder={`Mensagem em ${activeChannel.name}...`}
                    style={{ maxHeight: '120px', overflowY: 'auto' }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center shrink-0 transition-colors"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 px-1">Enter para enviar, Shift+Enter para nova linha</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Selecione um canal</p>
              <p className="text-sm mt-1">Escolha um canal na lista ao lado para comecar</p>
            </div>
          </div>
        )}
      </div>

      {/* New channel modal */}
      <AnimatePresence>
        {showNewChannel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Novo Canal</h3>
                <button onClick={() => setShowNewChannel(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {(['direct', 'group'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setNewChannelForm(f => ({ ...f, type }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors text-sm font-medium ${
                        newChannelForm.type === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {type === 'direct' ? <User size={20} /> : <Users size={20} />}
                      {type === 'direct' ? 'Mensagem Direta' : 'Grupo'}
                    </button>
                  ))}
                </div>
                {newChannelForm.type === 'direct' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do destinatario</label>
                    <input
                      type="text" value={newChannelForm.memberName}
                      onChange={e => setNewChannelForm(f => ({ ...f, memberName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do funcionario"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do grupo</label>
                    <input
                      type="text" value={newChannelForm.name}
                      onChange={e => setNewChannelForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Equipe Tecnica"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowNewChannel(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={createChannel} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    Criar Canal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
