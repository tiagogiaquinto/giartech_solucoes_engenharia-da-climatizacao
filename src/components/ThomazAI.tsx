import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Sparkles,
  Brain,
  Zap,
  Check,
  Loader2,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  FileText,
  Users,
  Settings,
  MessageSquare
} from 'lucide-react'
import { ThomazSuperAdvancedService, ThomazConversationResult } from '../services/thomazSuperAdvancedService'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  thinking?: string
  confidence?: 'high' | 'medium' | 'low'
  sources?: any[]
  isStreaming?: boolean
}

interface ThomazAIProps {
  userId?: string
  userRole?: string
  companyId?: string
  userName?: string
}

export function ThomazAI({ userId, userRole = 'user', companyId, userName }: ThomazAIProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentThinking, setCurrentThinking] = useState<string>('')
  const [thomazService, setThomazService] = useState<ThomazSuperAdvancedService | null>(null)
  const [showSources, setShowSources] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeThomazService()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentThinking])

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputMessage])

  const initializeThomazService = async () => {
    const service = new ThomazSuperAdvancedService(userId, userRole, companyId)
    setThomazService(service)

    // Saudação contextual e inteligente
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
    const userName_display = userName || 'colega'

    const initialMessage = `${greeting}, ${userName_display}! 👋

Sou o **Thomaz**, a inteligência artificial da Giartech. Trabalho aqui como consultor empresarial e estou pronto para conversar sobre qualquer aspecto da nossa operação.

**Posso ajudar com:**
• Análise financeira e estratégica
• Processos operacionais e melhores práticas
• Geração de documentos e relatórios
• Consultas sobre clientes, ordens de serviço e projetos
• Insights sobre o negócio e oportunidades

**Como funciono:**
Tenho acesso profundo a toda nossa base de conhecimento, dados em tempo real e experiência em gestão empresarial. Penso, analiso e respondo como um consultor especializado.

O que precisa hoje? Pode conversar naturalmente comigo, como faria com qualquer colega de trabalho.`

    setMessages([{
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date(),
      confidence: 'high'
    }])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing || !thomazService) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsProcessing(true)
    setCurrentThinking('')

    try {
      // Simular raciocínio (thinking)
      const thinkingSteps = [
        'Analisando sua solicitação...',
        'Buscando informações relevantes...',
        'Consultando base de conhecimento...',
        'Processando dados em tempo real...',
        'Formulando resposta...'
      ]

      for (const step of thinkingSteps) {
        setCurrentThinking(step)
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Processar com Thomaz Super Advanced
      const result: ThomazConversationResult = await thomazService.processMessage(
        userMessage.content,
        messages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp }))
      )

      setCurrentThinking('')

      // Criar mensagem da resposta
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        confidence: result.confidenceLevel,
        sources: result.sources,
        thinking: thinkingSteps.join(' → ')
      }

      // Simular streaming da resposta (efeito de digitação)
      await streamMessage(assistantMessage)

    } catch (error) {
      console.error('Erro ao processar mensagem:', error)

      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'Desculpe, encontrei um problema ao processar sua solicitação. Poderia reformular ou tentar novamente?',
        timestamp: new Date(),
        confidence: 'low'
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
      setCurrentThinking('')
    }
  }

  const streamMessage = async (message: Message) => {
    const words = message.content.split(' ')
    let streamedContent = ''

    const streamingMessage: Message = {
      ...message,
      content: '',
      isStreaming: true
    }

    setMessages(prev => [...prev, streamingMessage])

    for (let i = 0; i < words.length; i++) {
      streamedContent += (i > 0 ? ' ' : '') + words[i]

      setMessages(prev => {
        const updated = [...prev]
        const lastIndex = updated.length - 1
        updated[lastIndex] = {
          ...updated[lastIndex],
          content: streamedContent
        }
        return updated
      })

      // Velocidade de streaming variável (mais rápido para palavras comuns)
      const delay = words[i].length > 8 ? 40 : 20
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    // Marcar como completo
    setMessages(prev => {
      const updated = [...prev]
      const lastIndex = updated.length - 1
      updated[lastIndex] = {
        ...updated[lastIndex],
        isStreaming: false
      }
      return updated
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getConfidenceLabel = (confidence?: string) => {
    switch (confidence) {
      case 'high': return 'Alta confiança'
      case 'medium': return 'Confiança média'
      case 'low': return 'Baixa confiança'
      default: return ''
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Thomaz AI</h1>
              <p className="text-sm text-gray-600">Consultor Empresarial • Giartech</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Inteligência Avançada</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.role === 'assistant' ? (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 ${message.role === 'user' ? 'max-w-2xl ml-auto' : 'max-w-3xl'}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    {/* Message text with markdown-like formatting */}
                    <div className="prose prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => {
                        // Bold text
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={i} className="font-semibold mb-2">{line.slice(2, -2)}</p>
                        }
                        // Bullet points
                        if (line.startsWith('•')) {
                          return <li key={i} className="ml-4">{line.slice(1).trim()}</li>
                        }
                        // Regular line
                        return line ? <p key={i} className="mb-2">{line}</p> : <br key={i} />
                      })}
                    </div>

                    {/* Streaming indicator */}
                    {message.isStreaming && (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="inline-block w-2 h-4 bg-blue-600 ml-1"
                      />
                    )}
                  </div>

                  {/* Metadata */}
                  {message.role === 'assistant' && !message.isStreaming && (
                    <div className="flex items-center gap-3 mt-2 px-2">
                      <span className="text-xs text-gray-500">
                        {format(message.timestamp, 'HH:mm', { locale: ptBR })}
                      </span>

                      {message.confidence && (
                        <div className={`flex items-center gap-1 text-xs ${getConfidenceColor(message.confidence)}`}>
                          <Check className="w-3 h-3" />
                          <span>{getConfidenceLabel(message.confidence)}</span>
                        </div>
                      )}

                      {message.sources && message.sources.length > 0 && (
                        <button
                          onClick={() => setShowSources(showSources === message.id ? null : message.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{message.sources.length} fontes</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${showSources === message.id ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Sources Dropdown */}
                  <AnimatePresence>
                    {showSources === message.id && message.sources && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <p className="text-xs font-semibold text-gray-700 mb-2">Fontes consultadas:</p>
                        <div className="space-y-2">
                          {message.sources.map((source, i) => (
                            <div key={i} className="text-xs text-gray-600 pl-3 border-l-2 border-blue-300">
                              {source.title || source.content?.substring(0, 100) + '...'}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking Indicator */}
          {currentThinking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="flex-1">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm italic">{currentThinking}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isProcessing}
                placeholder="Converse naturalmente com o Thomaz... (Enter para enviar, Shift+Enter para nova linha)"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-500 disabled:bg-gray-50 disabled:text-gray-500"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '150px' }}
              />

              {/* Character count */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {inputMessage.length}/2000
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isProcessing}
              className={`p-3 rounded-xl transition-all ${
                inputMessage.trim() && !isProcessing
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          {/* Hints */}
          <div className="flex items-center justify-between mt-3 px-2">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Inteligência contextual ativa
              </span>
              <span className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Raciocínio avançado
              </span>
            </div>

            <span className="text-xs text-gray-400">
              Thomaz AI v2.0 • Giartech
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
