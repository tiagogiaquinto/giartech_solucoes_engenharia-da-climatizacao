import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  Package,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Loader,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Home,
  RotateCcw
} from 'lucide-react'
import ThomazAdvancedService from '../services/thomazAdvancedService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  typing?: boolean
}

interface QuickAction {
  icon: React.ReactNode
  label: string
  query: string
  color: string
}

export function ThomazSuperChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [thomazService, setThomazService] = useState<ThomazAdvancedService | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickActions: QuickAction[] = [
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'OSs Abertas',
      query: 'Mostre as ordens de serviço abertas',
      color: 'bg-blue-500'
    },
    {
      icon: <Package className="w-4 h-4" />,
      label: 'Estoque Baixo',
      query: 'Quais itens estão com estoque baixo?',
      color: 'bg-orange-500'
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: 'Agenda Hoje',
      query: 'Compromissos de hoje',
      color: 'bg-purple-500'
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: 'Resumo Financeiro',
      query: 'Mostre o resumo financeiro do mês',
      color: 'bg-green-500'
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Estatísticas',
      query: 'Estatísticas gerais do sistema',
      color: 'bg-indigo-500'
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: 'Funcionários',
      query: 'Liste os funcionários ativos',
      color: 'bg-pink-500'
    }
  ]

  useEffect(() => {
    if (isOpen && !thomazService) {
      initializeThomazService()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const initializeThomazService = async () => {
    const service = new ThomazAdvancedService()
    setThomazService(service)

    // Obter saudação inicial
    const greeting = await service.getInitialGreeting()

    setMessages([
      {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }
    ])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const simulateTyping = async (text: string) => {
    setIsTyping(true)

    // Calcular tempo de digitação baseado no tamanho do texto
    const words = text.split(' ').length
    const typingTime = Math.min(words * 50, 2000) // Max 2 segundos

    await new Promise(resolve => setTimeout(resolve, typingTime))

    setIsTyping(false)
  }

  const handleResetChat = async () => {
    setMessages([])
    setInputMessage('')
    setIsLoading(true)

    // Reinicializar serviço
    const service = new ThomazAdvancedService()
    setThomazService(service)

    try {
      const greeting = await service.getInitialGreeting()
      const welcomeMessage: Message = {
        id: `msg_${Date.now()}_welcome`,
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    } catch (error) {
      console.error('Erro ao reiniciar chat:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim()

    if (!textToSend || !thomazService) return

    setInputMessage('')

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Simular digitação
      await simulateTyping(textToSend)

      // Processar com o Thomaz Super Service
      const response = await thomazService.processMessage(textToSend)

      // Adicionar resposta do Thomaz
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Erro ao processar mensagem:', error)

      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Desculpe, tive um problema ao processar sua solicitação. 😅\n\nPode tentar novamente?',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (query: string) => {
    setInputMessage(query)
    handleSendMessage(query)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Poderia adicionar um toast aqui
  }

  const formatMessageContent = (content: string) => {
    // Processar markdown básico
    return content
      .split('\n')
      .map((line, idx) => {
        // Títulos
        if (line.startsWith('**') && line.endsWith('**')) {
          const text = line.slice(2, -2)
          return <div key={idx} className="font-bold text-lg mb-2">{text}</div>
        }

        // Subtítulos
        if (line.startsWith('•') || line.startsWith('-')) {
          return <div key={idx} className="ml-4 my-1">• {line.slice(1).trim()}</div>
        }

        // Linhas normais
        if (line.trim()) {
          return <div key={idx} className="my-1">{line}</div>
        }

        return <div key={idx} className="h-2"></div>
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
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:shadow-blue-500/50 transition-all"
      >
        <Bot className="w-8 h-8" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full"
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
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
              <p className="text-xs text-blue-100">Consultor Sênior - Especialista em Gestão</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetChat}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                title="Reiniciar conversa"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions - Removido para deixar mais natural */}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-gradient-to-br from-purple-600 to-blue-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              <div className={`flex-1 ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none'
                      : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {formatMessageContent(message.content)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1 px-2">
                  <span className="text-xs text-gray-500">
                    {format(message.timestamp, 'HH:mm', { locale: ptBR })}
                  </span>

                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copiar"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Útil"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Não útil"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-2xl rounded-bl-none p-3">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
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
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Conversa criptografada e segura • Dados em tempo real
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ThomazSuperChat
