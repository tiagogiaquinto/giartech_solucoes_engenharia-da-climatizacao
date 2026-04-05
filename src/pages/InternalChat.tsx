import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Plus, Search, Hash, User, Users, MessageSquare, ClipboardList, Loader2, X, MoreHorizontal, Paperclip, Smile, Reply, Pin, Pencil, Trash2, Bell, BellOff, Settings, ChevronDown, Image as ImageIcon, FileText, AtSign, Mic, PhoneCall, Video, CheckCheck, Check, EyeOff, Crown, Shield, Wrench, Star, Info, LayoutGrid, ArrowLeft, AlertCircle, Copy, ThumbsUp, Heart, Laugh, Zap, BookOpen, Volume2, VolumeX, Download, ExternalLink, RefreshCw, UserPlus, LogOut, Globe } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/* ─── Types ─────────────────────────────────────────────────────── */
interface Channel {
  id: string
  channel_type: 'direct' | 'os' | 'group'
  name: string
  description?: string
  avatar_emoji?: string
  service_order_id: string | null
  last_message_at: string | null
  created_at: string
  unread_count?: number
  last_message?: string
  is_muted?: boolean
  member_count?: number
  pinned_message_id?: string | null
}

interface Message {
  id: string
  channel_id: string
  sender_id: string | null
  sender_name: string
  sender_role: string
  message_type: 'text' | 'image' | 'file' | 'system'
  content: string
  file_url?: string
  file_name?: string
  reply_to_id: string | null
  is_deleted: boolean
  is_edited?: boolean
  is_pinned?: boolean
  reactions?: Record<string, string[]>
  mentions?: string[]
  metadata?: any
  created_at: string
}

interface Reaction {
  id: string
  message_id: string
  user_name: string
  emoji: string
}

interface TypingUser {
  user_name: string
  updated_at: string
}

/* ─── Constants ──────────────────────────────────────────────────── */
const CURRENT_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Administrador',
  role: 'admin' as const,
}

const ROLE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700', icon: Crown },
  manager: { label: 'Gerente', color: 'bg-amber-100 text-amber-700', icon: Shield },
  funcionario: { label: 'Funcionário', color: 'bg-slate-100 text-slate-600', icon: User },
  tecnico: { label: 'Técnico', color: 'bg-emerald-100 text-emerald-700', icon: Wrench },
}

const CHANNEL_EMOJIS = ['💬', '🔧', '📋', '🚀', '⚡', '🎯', '📊', '🛠️', '🌟', '🔔']

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥', '👏']

const EMOJI_PICKER_LIST = [
  '😀','😂','😍','🤔','😎','🤩','😅','🥳',
  '👍','👎','❤️','🔥','🎉','✅','⚠️','💡',
  '🚀','⚡','🎯','💪','🙌','👏','🤝','💬',
]

function formatMsgTime(d: string) {
  const date = new Date(d)
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return `Ontem ${format(date, 'HH:mm')}`
  return format(date, 'dd/MM HH:mm', { locale: ptBR })
}

function formatDateDivider(d: string) {
  const date = new Date(d)
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
}

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function getRoleGradient(role: string) {
  const map: Record<string, string> = {
    admin: 'from-blue-500 to-blue-700',
    manager: 'from-amber-500 to-orange-600',
    funcionario: 'from-slate-400 to-slate-600',
    tecnico: 'from-emerald-500 to-teal-600',
  }
  return map[role] || 'from-slate-400 to-slate-600'
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function InternalChat() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingMsg, setEditingMsg] = useState<Message | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchChannels, setSearchChannels] = useState('')
  const [searchMessages, setSearchMessages] = useState('')
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [showEmojiInput, setShowEmojiInput] = useState(false)
  const [showChannelInfo, setShowChannelInfo] = useState(false)
  const [showMsgMenu, setShowMsgMenu] = useState<string | null>(null)
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([])
  const [showPinnedBanner, setShowPinnedBanner] = useState(false)
  const [newChannelForm, setNewChannelForm] = useState({
    type: 'group' as 'direct' | 'group',
    name: '',
    memberName: '',
    description: '',
    emoji: '💬',
  })
  const [sidebarTab, setSidebarTab] = useState<'channels' | 'direct' | 'os'>('channels')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const channelSubRef = useRef<any>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { loadChannels() }, [])

  useEffect(() => {
    if (!activeChannel) return
    loadMessages(activeChannel.id)
    loadReactions(activeChannel.id)
    subscribeToChannel(activeChannel.id)
    markAsRead(activeChannel.id)
    return () => { channelSubRef.current?.unsubscribe() }
  }, [activeChannel?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (activeChannel) {
      const pinned = messages.filter(m => m.is_pinned)
      setPinnedMessages(pinned)
    }
  }, [messages, activeChannel])

  const loadChannels = async () => {
    setLoadingChannels(true)
    try {
      const { data } = await supabase
        .from('corp_chat_channels')
        .select('*')
        .eq('is_active', true)
        .order('last_message_at', { ascending: false, nullsFirst: false })
      setChannels(data || [])
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
        .limit(200)
      setMessages(data || [])
    } finally {
      setLoadingMessages(false)
    }
  }

  const loadReactions = async (channelId: string) => {
    const { data } = await supabase
      .from('corp_chat_reactions')
      .select('*')
      .eq('channel_id', channelId)
    setReactions(data || [])
  }

  const subscribeToChannel = (channelId: string) => {
    channelSubRef.current?.unsubscribe()
    channelSubRef.current = supabase
      .channel(`premium_chat_${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'corp_chat_messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new as Message])
        setUnreadCounts(prev => ({ ...prev, [channelId]: 0 }))
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'corp_chat_messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new as Message } : m))
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'corp_chat_reactions',
        filter: `channel_id=eq.${channelId}`
      }, () => { loadReactions(channelId) })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'corp_chat_typing',
        filter: `channel_id=eq.${channelId}`
      }, async () => {
        const { data } = await supabase
          .from('corp_chat_typing')
          .select('user_name, updated_at')
          .eq('channel_id', channelId)
          .neq('user_name', CURRENT_USER.name)
          .gt('updated_at', new Date(Date.now() - 5000).toISOString())
        setTypingUsers(data || [])
      })
      .subscribe()
  }

  const markAsRead = async (channelId: string) => {
    setUnreadCounts(prev => ({ ...prev, [channelId]: 0 }))
    await supabase.from('corp_chat_read_receipts')
      .upsert({
        channel_id: channelId,
        user_id: CURRENT_USER.id,
        user_name: CURRENT_USER.name,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'channel_id,user_id' })
  }

  const sendTypingIndicator = useCallback(async () => {
    if (!activeChannel) return
    await supabase.from('corp_chat_typing')
      .upsert({
        channel_id: activeChannel.id,
        user_id: CURRENT_USER.id,
        user_name: CURRENT_USER.name,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'channel_id,user_id' })
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(async () => {
      await supabase.from('corp_chat_typing')
        .delete()
        .eq('channel_id', activeChannel.id)
        .eq('user_name', CURRENT_USER.name)
    }, 4000)
  }, [activeChannel])

  const sendMessage = async () => {
    const content = newMessage.trim()
    if (!content || !activeChannel || sending) return
    setSending(true)
    setNewMessage('')
    setReplyTo(null)
    textareaRef.current?.focus()
    try {
      await supabase.from('corp_chat_messages').insert({
        channel_id: activeChannel.id,
        sender_id: CURRENT_USER.id,
        sender_name: CURRENT_USER.name,
        sender_role: CURRENT_USER.role,
        message_type: 'text',
        content,
        reply_to_id: replyTo?.id || null,
        mentions: extractMentions(content),
      })
      await supabase.from('corp_chat_channels')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', activeChannel.id)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      await supabase.from('corp_chat_typing')
        .delete()
        .eq('channel_id', activeChannel.id)
        .eq('user_name', CURRENT_USER.name)
    } catch {
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  const saveEditedMessage = async () => {
    if (!editingMsg || !editContent.trim()) return
    await supabase.from('corp_chat_messages')
      .update({ content: editContent.trim(), is_edited: true })
      .eq('id', editingMsg.id)
    setEditingMsg(null)
    setEditContent('')
  }

  const deleteMessage = async (id: string) => {
    await supabase.from('corp_chat_messages').update({ is_deleted: true }).eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
    setShowMsgMenu(null)
  }

  const pinMessage = async (msg: Message) => {
    await supabase.from('corp_chat_messages').update({ is_pinned: !msg.is_pinned }).eq('id', msg.id)
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: !m.is_pinned } : m))
    setShowMsgMenu(null)
  }

  const toggleReaction = async (messageId: string, emoji: string) => {
    const existing = reactions.find(r => r.message_id === messageId && r.emoji === emoji && r.user_name === CURRENT_USER.name)
    if (existing) {
      await supabase.from('corp_chat_reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('corp_chat_reactions').insert({
        message_id: messageId,
        channel_id: activeChannel!.id,
        user_id: CURRENT_USER.id,
        user_name: CURRENT_USER.name,
        emoji,
      })
    }
    setShowEmojiPicker(null)
  }

  const createChannel = async () => {
    const { type, name, memberName, description, emoji } = newChannelForm
    const channelName = type === 'direct' ? `DM: ${memberName || 'Novo'}` : name
    if (!channelName.trim()) return
    const { data } = await supabase
      .from('corp_chat_channels')
      .insert({
        channel_type: type,
        name: channelName,
        description,
        avatar_emoji: emoji,
        created_by: CURRENT_USER.id,
      })
      .select()
      .maybeSingle()
    if (data) {
      await supabase.from('corp_chat_members').insert({
        channel_id: data.id,
        user_id: CURRENT_USER.id,
        user_name: CURRENT_USER.name,
        user_role: 'admin',
      })
      await supabase.from('corp_chat_messages').insert({
        channel_id: data.id,
        sender_name: 'Sistema',
        sender_role: 'admin',
        message_type: 'system',
        content: `Canal "${channelName}" criado por ${CURRENT_USER.name}.`,
      })
      setChannels(prev => [data, ...prev])
      setActiveChannel(data)
      setShowNewChannel(false)
      setNewChannelForm({ type: 'group', name: '', memberName: '', description: '', emoji: '💬' })
    }
  }

  const extractMentions = (text: string) => {
    return (text.match(/@(\w+)/g) || []).map(m => m.slice(1))
  }

  const getMessageReactions = (messageId: string) => {
    const msgReactions = reactions.filter(r => r.message_id === messageId)
    const grouped: Record<string, { count: number; users: string[]; mine: boolean }> = {}
    msgReactions.forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [], mine: false }
      grouped[r.emoji].count++
      grouped[r.emoji].users.push(r.user_name)
      if (r.user_name === CURRENT_USER.name) grouped[r.emoji].mine = true
    })
    return grouped
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    sendTypingIndicator()
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 128) + 'px'
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    setShowMsgMenu(null)
  }

  const filteredChannels = channels.filter(ch => {
    const matchSearch = !searchChannels || ch.name.toLowerCase().includes(searchChannels.toLowerCase())
    if (sidebarTab === 'direct') return ch.channel_type === 'direct' && matchSearch
    if (sidebarTab === 'os') return ch.channel_type === 'os' && matchSearch
    return ch.channel_type === 'group' && matchSearch
  })

  const filteredMessages = searchMessages
    ? messages.filter(m => m.content.toLowerCase().includes(searchMessages.toLowerCase()))
    : messages

  const getChannelIcon = (type: string, emoji?: string, size = 16) => {
    if (emoji) return <span style={{ fontSize: size }}>{emoji}</span>
    if (type === 'direct') return <User size={size} className="text-slate-400" />
    if (type === 'os') return <ClipboardList size={size} className="text-sky-500" />
    return <Hash size={size} className="text-slate-400" />
  }

  let prevDate = ''

  /* ── Sidebar ─────────────────────────────────────────────────── */
  return (
    <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 flex flex-col bg-slate-900/90 backdrop-blur border-r border-white/5">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                <MessageSquare size={15} className="text-white" />
              </div>
              <span className="font-bold text-white text-sm">Chat Corporativo</span>
            </div>
            <button
              onClick={() => setShowNewChannel(true)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              title="Novo canal"
            >
              <Plus size={14} className="text-slate-300" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchChannels}
              onChange={e => setSearchChannels(e.target.value)}
              placeholder="Buscar canal..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-0.5 px-3 pt-3 pb-2">
          {(['channels', 'direct', 'os'] as const).map(tab => {
            const labels = { channels: 'Grupos', direct: 'Direto', os: 'OS' }
            return (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                  sidebarTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 scrollbar-thin">
          {loadingChannels ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={18} className="animate-spin text-blue-400" />
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-10">
              <Hash size={24} className="mx-auto mb-2 text-slate-700" />
              <p className="text-xs text-slate-600">Nenhum canal</p>
              <button
                onClick={() => setShowNewChannel(true)}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Criar canal
              </button>
            </div>
          ) : filteredChannels.map(ch => {
            const isActive = activeChannel?.id === ch.id
            const unread = unreadCounts[ch.id] || 0
            return (
              <button
                key={ch.id}
                onClick={() => { setActiveChannel(ch); setShowChannelInfo(false) }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base ${
                  isActive ? 'bg-blue-500/30' : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  {getChannelIcon(ch.channel_type, ch.avatar_emoji, 16)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold truncate ${isActive ? 'text-blue-200' : 'text-slate-300 group-hover:text-white'}`}>
                      {ch.name}
                    </span>
                    {unread > 0 && (
                      <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-tight">
                        {unread}
                      </span>
                    )}
                  </div>
                  {ch.last_message_at && (
                    <p className="text-[10px] text-slate-600 truncate">
                      {format(new Date(ch.last_message_at), 'HH:mm')}
                      {ch.member_count && ch.member_count > 1 && ` · ${ch.member_count} membros`}
                    </p>
                  )}
                </div>
                {ch.is_muted && <BellOff size={10} className="text-slate-600 shrink-0" />}
              </button>
            )
          })}
        </div>

        {/* Online status */}
        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white">
                {getInitials(CURRENT_USER.name)}
              </div>
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{CURRENT_USER.name}</p>
              <p className="text-[10px] text-emerald-400">Online</p>
            </div>
            <button className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors">
              <Settings size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Chat Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeChannel ? (
          <>
            {/* Top bar */}
            <div className="shrink-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center">
                {getChannelIcon(activeChannel.channel_type, activeChannel.avatar_emoji, 16)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 leading-tight">{activeChannel.name}</h3>
                <p className="text-[10px] text-slate-400 truncate">
                  {activeChannel.description || (activeChannel.channel_type === 'direct' ? 'Conversa direta' : activeChannel.channel_type === 'os' ? 'Canal de OS' : 'Canal de grupo')}
                  {typingUsers.length > 0 && (
                    <span className="text-blue-500 ml-1">
                      · {typingUsers.map(u => u.user_name).join(', ')} {typingUsers.length === 1 ? 'está' : 'estão'} digitando...
                    </span>
                  )}
                </p>
              </div>

              {/* Pinned banner toggle */}
              {pinnedMessages.length > 0 && (
                <button
                  onClick={() => setShowPinnedBanner(!showPinnedBanner)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Pin size={11} />
                  {pinnedMessages.length} fixad{pinnedMessages.length > 1 ? 'as' : 'a'}
                </button>
              )}

              {/* Search messages */}
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchMessages}
                  onChange={e => setSearchMessages(e.target.value)}
                  placeholder="Buscar mensagens..."
                  className="pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:w-52 transition-all"
                />
              </div>

              <button
                onClick={() => setShowChannelInfo(!showChannelInfo)}
                className={`p-2 rounded-lg transition-colors ${showChannelInfo ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-400 hover:text-slate-600'}`}
              >
                <Info size={16} />
              </button>
            </div>

            {/* Pinned messages banner */}
            <AnimatePresence>
              {showPinnedBanner && pinnedMessages.length > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-b border-amber-100 bg-amber-50"
                >
                  <div className="px-5 py-2 space-y-1">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1">
                      <Pin size={10} /> Mensagens Fixadas
                    </p>
                    {pinnedMessages.slice(0, 3).map(m => (
                      <div key={m.id} className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-amber-700">{m.sender_name}:</span>
                        <span className="text-xs text-amber-800 truncate">{m.content}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 flex overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0.5">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-blue-400" />
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center mb-3">
                      <MessageSquare size={28} className="text-blue-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-slate-400 mt-1">Inicie a conversa!</p>
                  </div>
                ) : (
                  filteredMessages.map((msg, idx) => {
                    const msgDate = formatDateDivider(msg.created_at)
                    const showDivider = msgDate !== prevDate
                    prevDate = msgDate
                    const isOwn = msg.sender_id === CURRENT_USER.id
                    const isSystem = msg.message_type === 'system'
                    const msgReactions = getMessageReactions(msg.id)
                    const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null

                    if (isSystem) {
                      return (
                        <React.Fragment key={msg.id}>
                          {showDivider && <DateDivider label={msgDate} />}
                          <div className="flex items-center gap-2 py-1.5">
                            <div className="flex-1 h-px bg-slate-100" />
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{msg.content}</span>
                            <div className="flex-1 h-px bg-slate-100" />
                          </div>
                        </React.Fragment>
                      )
                    }

                    const prevMsg = idx > 0 ? filteredMessages[idx - 1] : null
                    const isGrouped = prevMsg && !showDivider &&
                      prevMsg.sender_id === msg.sender_id &&
                      new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 3 * 60 * 1000

                    return (
                      <React.Fragment key={msg.id}>
                        {showDivider && <DateDivider label={msgDate} />}
                        <div
                          className={`flex gap-2.5 group relative ${isOwn ? 'flex-row-reverse' : ''} ${isGrouped ? 'mt-0.5' : 'mt-2'}`}
                        >
                          {/* Avatar */}
                          {!isGrouped ? (
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getRoleGradient(msg.sender_role)} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm`}>
                              {getInitials(msg.sender_name)}
                            </div>
                          ) : (
                            <div className="w-8 shrink-0" />
                          )}

                          <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            {/* Sender name */}
                            {!isGrouped && !isOwn && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-xs font-semibold text-slate-700">{msg.sender_name}</span>
                                {ROLE_META[msg.sender_role] && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${ROLE_META[msg.sender_role].color}`}>
                                    {ROLE_META[msg.sender_role].label}
                                  </span>
                                )}
                                {msg.is_pinned && <Pin size={10} className="text-amber-500" />}
                              </div>
                            )}

                            {/* Reply preview */}
                            {replyMsg && (
                              <div className={`flex items-start gap-1.5 mb-1 px-2.5 py-1.5 rounded-lg border-l-2 max-w-full ${
                                isOwn ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-300'
                              }`}>
                                <Reply size={10} className="text-slate-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold text-slate-600 truncate">{replyMsg.sender_name}</p>
                                  <p className="text-[10px] text-slate-500 truncate">{replyMsg.content}</p>
                                </div>
                              </div>
                            )}

                            {/* Edit mode */}
                            {editingMsg?.id === msg.id ? (
                              <div className="flex flex-col gap-2 w-64">
                                <textarea
                                  value={editContent}
                                  onChange={e => setEditContent(e.target.value)}
                                  rows={2}
                                  autoFocus
                                  className="w-full px-3 py-2 text-sm bg-white border-2 border-blue-400 rounded-xl resize-none focus:outline-none"
                                />
                                <div className="flex gap-2">
                                  <button onClick={saveEditedMessage} className="flex-1 py-1 text-xs bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                    Salvar
                                  </button>
                                  <button onClick={() => setEditingMsg(null)} className="flex-1 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                  isOwn
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                                }`}
                              >
                                {msg.content}
                              </div>
                            )}

                            {/* Meta row */}
                            <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                              <span className="text-[10px] text-slate-400">{formatMsgTime(msg.created_at)}</span>
                              {msg.is_edited && <span className="text-[9px] text-slate-400">(editado)</span>}
                              {isOwn && <CheckCheck size={12} className="text-blue-400" />}
                            </div>

                            {/* Reactions */}
                            {Object.entries(msgReactions).length > 0 && (
                              <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                                {Object.entries(msgReactions).map(([emoji, data]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(msg.id, emoji)}
                                    title={data.users.join(', ')}
                                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                                      data.mine
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    <span>{emoji}</span>
                                    <span className="text-[10px] font-semibold">{data.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Hover actions */}
                          <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full pl-1' : 'right-0 translate-x-full pr-1'} flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                            {/* Quick reactions */}
                            {QUICK_REACTIONS.slice(0, 4).map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(msg.id, emoji)}
                                className="p-1 rounded-lg bg-white shadow border border-slate-100 hover:bg-slate-50 text-sm transition-all hover:scale-110"
                              >
                                {emoji}
                              </button>
                            ))}

                            {/* More emoji */}
                            <div className="relative">
                              <button
                                onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                                className="p-1.5 rounded-lg bg-white shadow border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <Smile size={14} />
                              </button>
                              <AnimatePresence>
                                {showEmojiPicker === msg.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`absolute top-8 z-20 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 w-56 ${isOwn ? 'right-0' : 'left-0'}`}
                                  >
                                    <div className="grid grid-cols-8 gap-0.5">
                                      {EMOJI_PICKER_LIST.map(e => (
                                        <button
                                          key={e}
                                          onClick={() => toggleReaction(msg.id, e)}
                                          className="p-1 rounded-lg hover:bg-slate-50 text-base transition-all hover:scale-125"
                                        >
                                          {e}
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <button
                              onClick={() => { setReplyTo(msg); textareaRef.current?.focus() }}
                              className="p-1.5 rounded-lg bg-white shadow border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                              title="Responder"
                            >
                              <Reply size={14} />
                            </button>

                            {/* Message menu */}
                            <div className="relative">
                              <button
                                onClick={() => setShowMsgMenu(showMsgMenu === msg.id ? null : msg.id)}
                                className="p-1.5 rounded-lg bg-white shadow border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <MoreHorizontal size={14} />
                              </button>
                              <AnimatePresence>
                                {showMsgMenu === msg.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`absolute top-8 z-20 bg-white rounded-xl shadow-xl border border-slate-100 py-1 w-44 ${isOwn ? 'right-0' : 'left-0'}`}
                                  >
                                    {[
                                      { icon: Reply, label: 'Responder', action: () => { setReplyTo(msg); setShowMsgMenu(null); textareaRef.current?.focus() } },
                                      { icon: Copy, label: 'Copiar', action: () => copyMessage(msg.content) },
                                      { icon: Pin, label: msg.is_pinned ? 'Desafixar' : 'Fixar', action: () => pinMessage(msg) },
                                      ...(isOwn ? [
                                        { icon: Pencil, label: 'Editar', action: () => { setEditingMsg(msg); setEditContent(msg.content); setShowMsgMenu(null) } },
                                        { icon: Trash2, label: 'Excluir', action: () => deleteMessage(msg.id), danger: true },
                                      ] : []),
                                    ].map(({ icon: Icon, label, action, danger }: any) => (
                                      <button
                                        key={label}
                                        onClick={action}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${danger ? 'text-red-500' : 'text-slate-700'}`}
                                      >
                                        <Icon size={13} />
                                        {label}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    )
                  })
                )}

                {/* Typing indicator */}
                <AnimatePresence>
                  {typingUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 py-1"
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {typingUsers.map(u => u.user_name).join(', ')} {typingUsers.length === 1 ? 'está' : 'estão'} digitando...
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Channel info panel */}
              <AnimatePresence>
                {showChannelInfo && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 256, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="shrink-0 border-l border-slate-100 bg-slate-50 overflow-hidden"
                  >
                    <div className="w-64 h-full flex flex-col p-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-slate-700">Detalhes do Canal</p>
                        <button onClick={() => setShowChannelInfo(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400">
                          <X size={14} />
                        </button>
                      </div>

                      <div className="text-center mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-2xl mx-auto mb-2 shadow-sm">
                          {activeChannel.avatar_emoji || '💬'}
                        </div>
                        <p className="font-bold text-slate-800 text-sm">{activeChannel.name}</p>
                        {activeChannel.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{activeChannel.description}</p>
                        )}
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
                          <span className="text-slate-500">Tipo</span>
                          <span className="font-medium text-slate-700 capitalize">{activeChannel.channel_type}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
                          <span className="text-slate-500">Mensagens</span>
                          <span className="font-medium text-slate-700">{messages.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
                          <span className="text-slate-500">Fixadas</span>
                          <span className="font-medium text-slate-700">{pinnedMessages.length}</span>
                        </div>
                        {activeChannel.created_at && (
                          <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
                            <span className="text-slate-500">Criado em</span>
                            <span className="font-medium text-slate-700">
                              {format(new Date(activeChannel.created_at), 'dd/MM/yy', { locale: ptBR })}
                            </span>
                          </div>
                        )}
                      </div>

                      {pinnedMessages.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Pin size={9} /> Fixadas
                          </p>
                          <div className="space-y-1.5">
                            {pinnedMessages.map(m => (
                              <div key={m.id} className="p-2 bg-amber-50 border border-amber-100 rounded-xl">
                                <p className="text-[10px] font-semibold text-amber-700">{m.sender_name}</p>
                                <p className="text-xs text-amber-800 line-clamp-2 mt-0.5">{m.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input area */}
            <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3">
              {/* Reply banner */}
              <AnimatePresence>
                {replyTo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl overflow-hidden"
                  >
                    <Reply size={12} className="text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-blue-700">{replyTo.sender_name}</p>
                      <p className="text-xs text-blue-600 truncate">{replyTo.content}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="p-0.5 hover:bg-blue-100 rounded-md">
                      <X size={12} className="text-blue-400" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-end gap-2">
                {/* Attach */}
                <button className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors shrink-0" title="Anexar arquivo">
                  <Paperclip size={18} />
                </button>

                {/* Text input */}
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="w-full bg-transparent text-sm text-slate-800 resize-none focus:outline-none placeholder-slate-400 leading-relaxed"
                    placeholder={`Mensagem em ${activeChannel.name}...`}
                    style={{ maxHeight: '128px', overflowY: 'auto' }}
                  />
                </div>

                {/* Emoji */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowEmojiInput(!showEmojiInput)}
                    className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Emoji"
                  >
                    <Smile size={18} />
                  </button>
                  <AnimatePresence>
                    {showEmojiInput && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute bottom-10 right-0 z-20 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 w-56"
                      >
                        <div className="grid grid-cols-8 gap-0.5">
                          {EMOJI_PICKER_LIST.map(e => (
                            <button
                              key={e}
                              onClick={() => { setNewMessage(prev => prev + e); setShowEmojiInput(false); textareaRef.current?.focus() }}
                              className="p-1 rounded-lg hover:bg-slate-50 text-base transition-all hover:scale-125"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Send */}
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 shadow-md shadow-blue-200"
                >
                  {sending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} className="translate-x-0.5" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 pl-12">
                Enter para enviar · Shift+Enter para nova linha · @ para mencionar
              </p>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-5 shadow-inner">
                <MessageSquare size={36} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Chat Corporativo</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Selecione um canal na lista ou crie um novo para começar a colaborar com sua equipe.
              </p>
              <button
                onClick={() => setShowNewChannel(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
              >
                <Plus size={16} />
                Criar novo canal
              </button>

              {/* Feature chips */}
              <div className="mt-8 grid grid-cols-2 gap-2 text-left">
                {[
                  { icon: Smile, label: 'Reações com Emoji' },
                  { icon: Reply, label: 'Respostas em thread' },
                  { icon: Pin, label: 'Mensagens fixadas' },
                  { icon: CheckCheck, label: 'Confirmação de leitura' },
                  { icon: Pencil, label: 'Editar mensagens' },
                  { icon: Zap, label: 'Indicador de digitação' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-blue-100 shadow-sm">
                    <Icon size={13} className="text-blue-500 shrink-0" />
                    <span className="text-[10px] text-slate-600 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── New Channel Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showNewChannel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Novo Canal</h3>
                    <p className="text-blue-200 text-xs mt-0.5">Crie um espaço de colaboração</p>
                  </div>
                  <button
                    onClick={() => setShowNewChannel(false)}
                    className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X size={15} className="text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Type selector */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { type: 'group' as const, icon: Hash, label: 'Grupo', desc: 'Equipe ou departamento' },
                    { type: 'direct' as const, icon: User, label: 'Direto', desc: 'Mensagem privada' },
                  ]).map(({ type, icon: Icon, label, desc }) => (
                    <button
                      key={type}
                      onClick={() => setNewChannelForm(f => ({ ...f, type }))}
                      className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all ${
                        newChannelForm.type === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <Icon size={22} className={newChannelForm.type === type ? 'text-blue-600' : 'text-slate-400'} />
                      <span className={`text-sm font-bold ${newChannelForm.type === type ? 'text-blue-700' : 'text-slate-600'}`}>{label}</span>
                      <span className="text-[10px] text-slate-400">{desc}</span>
                    </button>
                  ))}
                </div>

                {/* Emoji picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Ícone do canal</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CHANNEL_EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setNewChannelForm(f => ({ ...f, emoji: e }))}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                          newChannelForm.emoji === e
                            ? 'bg-blue-100 border-2 border-blue-400 scale-110'
                            : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {newChannelForm.type === 'direct' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Destinatário</label>
                    <input
                      type="text"
                      value={newChannelForm.memberName}
                      onChange={e => setNewChannelForm(f => ({ ...f, memberName: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Nome do funcionário"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome do canal</label>
                      <input
                        type="text"
                        value={newChannelForm.name}
                        onChange={e => setNewChannelForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Ex: Equipe Técnica, Financeiro..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Descrição <span className="text-slate-400 font-normal">(opcional)</span></label>
                      <input
                        type="text"
                        value={newChannelForm.description}
                        onChange={e => setNewChannelForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Propósito do canal..."
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowNewChannel(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createChannel}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-blue-200"
                  >
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

/* ── Helper components ───────────────────────────────────────────── */
function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-3">
      <div className="flex-1 h-px bg-slate-100" />
      <span className="text-[10px] text-slate-400 font-semibold bg-white px-2 py-0.5 rounded-full border border-slate-100 capitalize">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}
