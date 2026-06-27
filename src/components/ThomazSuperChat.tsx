import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Loader,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Key used by overlay to pass initial context ─────────────────────────────
export const THOMAZ_CONTEXT_KEY = 'thomaz_overlay_context'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: number
  suggestions?: string[]
  alertas?: any[]
  acoes?: any[]
  pergunta_original?: string
}

async function callThomazRaciocinar(
  pergunta: string,
  sessionId: string,
  userId?: string
): Promise<{ resposta_direta: string; sugestoes?: string[]; confianca_final?: number; alertas?: any[]; acoes?: any[] }> {
  const { data, error } = await supabase.rpc('thomaz_raciocinar', {
    pergunta,
    p_session: sessionId,
    p_user_id: userId || null
  })
  if (error) throw error
  return data || { resposta_direta: 'Não foi possível analisar.' }
}

export function ThomazSuperChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sessionId = useRef(`chat_${Date.now()}`)
  const { user } = useUser()

  // ─── Open with context from overlay ────────────────────────────────────────
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === THOMAZ_CONTEXT_KEY && e.newValue) {
        try {
          const ctx = JSON.parse(e.newValue)
          if (ctx.origem === 'overlay') {
            setMessages([
              {
                id: `ctx_user_${Date.now()}`,
                role: 'user',
                content: ctx.pergunta,
                timestamp: new Date()
              },
              {
                id: `ctx_thomaz_${Date.now()}`,
                role: 'assistant',
                content: ctx.resposta,
                timestamp: new Date(),
                suggestions: ctx.sugestoes
              }
            ])
            setIsOpen(true)
            localStorage.removeItem(THOMAZ_CONTEXT_KEY)
          }
        } catch {}
      }
    }

    window.addEventListener('storage', handleStorageEvent)

    // Same-tab: custom event
    const handleCustom = (e: CustomEvent) => {
      const ctx = e.detail
      if (ctx?.origem === 'overlay') {
        setMessages([
          {
            id: `ctx_user_${Date.now()}`,
            role: 'user',
            content: ctx.pergunta,
            timestamp: new Date()
          },
          {
            id: `ctx_thomaz_${Date.now()}`,
            role: 'assistant',
            content: ctx.resposta,
            timestamp: new Date(),
            suggestions: ctx.sugestoes
          }
        ])
        setIsOpen(true)
      }
    }

    window.addEventListener('thomaz:openWithContext' as any, handleCustom)
    return () => {
      window.removeEventListener('storage', handleStorageEvent)
      window.removeEventListener('thomaz:openWithContext' as any, handleCustom)
    }
  }, [])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      sendWelcome()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus()
  }, [isOpen])

  const sendWelcome = async () => {
    setIsLoading(true)
    try {
      const hour = new Date().getHours()
      const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
      const result = await callThomazRaciocinar(greeting, sessionId.current, user?.id)
      setMessages([{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: result.resposta_direta,
        timestamp: new Date(),
        suggestions: result.sugestoes
      }])
    } catch {
      setMessages([{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'Olá! Sou o Thomaz, seu assistente inteligente. Como posso ajudar?',
        timestamp: new Date(),
        suggestions: ['Como estão as finanças?', 'Ordens de serviço pendentes', 'Estoque crítico']
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetChat = async () => {
    setMessages([])
    sessionId.current = `chat_${Date.now()}`
    setInputMessage('')
    await sendWelcome()
  }

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim()
    if (!textToSend || isLoading) return

    setInputMessage('')

    const userMsg: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setIsTyping(true)

    try {
      const words = textToSend.split(' ').length
      await new Promise(r => setTimeout(r, Math.min(words * 50, 1500)))
      setIsTyping(false)

      const result = await callThomazRaciocinar(textToSend, sessionId.current, user?.id)

      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: result.resposta_direta,
        timestamp: new Date(),
        confidence: result.confianca_final,
        suggestions: result.sugestoes,
        alertas: result.alertas,
        acoes: result.acoes,
        pergunta_original: textToSend
      }])
    } catch {
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Desculpe, tive um problema ao processar sua solicitação. Pode tentar novamente?',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const sendFeedback = async (message: Message, feedback: 'positivo' | 'negativo') => {
    try {
      await supabase.rpc('thomaz_aprender', {
        p_topic: 'chat_feedback',
        p_pergunta: message.pergunta_original || message.content,
        p_resposta: message.content,
        p_feedback: feedback
      })
    } catch {}
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((line, idx) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={idx} className="font-bold text-lg mb-2">{line.slice(2, -2)}</div>
      }
      if (line.startsWith('•') || line.startsWith('-')) {
        return <div key={idx} className="ml-4 my-1">• {line.slice(1).trim()}</div>
      }
      if (line.trim()) return <div key={idx} className="my-1">{line}</div>
      return <div key={idx} className="h-2" />
    })
  }

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:shadow-blue-500/50 transition-all"
      >
        <Bot className="w-8 h-8" />
        <motion.div
          animate={{ scale: [0.8, 1, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
        />
      </motion.button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 w-[450px] h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-7 h-7 text-blue-600" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
              />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                Thomaz
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </h3>
              <p className="text-xs text-blue-100">Consultor Sênior — Dados em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <button
                onClick={handleResetChat}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                title="Reiniciar conversa"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-700 to-blue-500'
              }`}>
                {message.role === 'user'
                  ? <User className="w-5 h-5 text-white" />
                  : <Bot className="w-5 h-5 text-white" />
                }
              </div>

              <div className={`flex-1 ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{formatContent(message.content)}</div>
                </div>

                <div className="flex items-center gap-2 mt-1 px-2">
                  <span className="text-xs text-gray-500">
                    {format(message.timestamp, 'HH:mm', { locale: ptBR })}
                  </span>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => copyToClipboard(message.content)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Copiar">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button onClick={() => sendFeedback(message, 'positivo')} className="p-1 text-gray-400 hover:text-green-600 transition-colors" title="Útil"><ThumbsUp className="w-3 h-3" /></button>
                      <button onClick={() => sendFeedback(message, 'negativo')} className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Não útil"><ThumbsDown className="w-3 h-3" /></button>
                      {message.confidence !== undefined && (
                        <span className="text-[10px] text-gray-400 ml-1">{Math.round(message.confidence * 100)}%</span>
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'assistant' && message.alertas && message.alertas.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {message.alertas.slice(0, 3).map((alerta: any, i: number) => (
                      <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
                        alerta.nivel_risco === 'critico' ? 'bg-red-50 text-red-700 border border-red-200' :
                        alerta.nivel_risco === 'atencao' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{alerta.mensagem_humana || alerta.title || alerta.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {message.role === 'assistant' && message.acoes && message.acoes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.acoes.slice(0, 3).map((acao: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg">
                        <span className="font-semibold shrink-0">{i + 1}.</span>
                        <span>{acao.acao || acao.title || acao.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(suggestion)}
                        className="text-xs px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-2xl rounded-bl-none p-3">
                <div className="flex gap-1">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <motion.div key={i} animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay }} className="w-2 h-2 bg-gray-400 rounded-full" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              placeholder="Fale comigo naturalmente..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50 text-base"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center"
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Dados em tempo real • Análise inteligente do negócio
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ThomazSuperChat
