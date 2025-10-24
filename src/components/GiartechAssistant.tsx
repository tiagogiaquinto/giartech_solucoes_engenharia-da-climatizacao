import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Minimize2, Maximize2, Sparkles, TrendingUp, DollarSign, Package, Users, FileText, Calendar } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  intent?: string
}

export function GiartechAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId] = useState(crypto.randomUUID())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Mensagem de boas-vindas
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '👋 Olá! Sou o **Assistente Giartech**, sua inteligência corporativa.\n\nPosso ajudá-lo com:\n\n💰 **Financeiro** - Receitas, despesas, DRE e análises\n🔧 **Ordens de Serviço** - Status, análises e insights\n📦 **Estoque** - Inventário e alertas\n👥 **Clientes** - CRM e base de dados\n👨‍💼 **Equipe** - Colaboradores e performance\n📊 **Indicadores** - KPIs e dashboards\n📅 **Agenda** - Compromissos e eventos\n\nComo posso ajudá-lo hoje?',
        timestamp: new Date().toISOString()
      }])
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMsg = inputMessage.trim()
    setInputMessage('')

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Chamar API do Assistente Giartech
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/giartech-assistant`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: userMsg,
          conversationId,
          userId: 'current-user'
        })
      })

      const data = await response.json()

      if (data.success && data.response) {
        // Adicionar resposta do assistente
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp,
          intent: data.intent
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Erro ao processar mensagem')
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const quickQuestions = [
    { icon: DollarSign, text: 'Como está o financeiro?', color: 'text-green-600' },
    { icon: TrendingUp, text: 'Quantas OSs temos hoje?', color: 'text-blue-600' },
    { icon: Calendar, text: 'O que tenho na agenda hoje?', color: 'text-indigo-600' },
    { icon: Package, text: 'Qual o status do estoque?', color: 'text-orange-600' }
  ]

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question)
  }

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'financial': return '💰'
      case 'serviceOrders': return '🔧'
      case 'inventory': return '📦'
      case 'clients': return '👥'
      case 'employees': return '👨‍💼'
      case 'analytics': return '📊'
      case 'calendar': return '📅'
      default: return '🤖'
    }
  }

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group"
      >
        <div className="relative">
          <Sparkles className="h-7 w-7 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></span>
        </div>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Assistente Giartech
        </div>
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col ${
        isMinimized
          ? 'bottom-6 right-6 w-80 h-16'
          : 'bottom-6 right-6 w-[450px] h-[650px]'
      }`}
      style={{ maxHeight: 'calc(100vh - 100px)' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          </div>
          <div>
            <h3 className="font-bold text-sm">Assistente Giartech</h3>
            <p className="text-xs text-blue-100">Inteligência Corporativa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' && message.intent && (
                    <div className="text-xs text-gray-500 mb-1">
                      {getIntentIcon(message.intent)} {message.intent}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content.split('\n').map((line, i) => {
                      // Processar markdown básico
                      let processedLine = line
                      // Negrito
                      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      // Itálico
                      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>')

                      return (
                        <span key={i}>
                          <span dangerouslySetInnerHTML={{ __html: processedLine }} />
                          {i < message.content.split('\n').length - 1 && <br />}
                        </span>
                      )
                    })}
                  </div>
                  <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-500 mb-2 font-medium">Perguntas rápidas:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(q.text)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-left transition-colors border border-gray-200"
                  >
                    <q.icon className={`h-4 w-4 ${q.color} flex-shrink-0`} />
                    <span className="text-gray-700 line-clamp-2">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Digite sua pergunta..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Powered by Giartech Intelligence
            </p>
          </div>
        </>
      )}
    </motion.div>
  )
}
