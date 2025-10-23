import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X, Trash2, Plus, HelpCircle } from 'lucide-react'
import { chatbotService, ChatMessage, ChatConversation } from '../services/chatbotService'

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('🤖 AIChatbot montado e ativo!')
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id)
    }
  }, [currentConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    const convs = await chatbotService.getConversations()
    setConversations(convs)
    if (convs.length > 0 && !currentConversation) {
      setCurrentConversation(convs[0])
    }
  }

  const loadMessages = async (conversationId: string) => {
    const msgs = await chatbotService.getMessages(conversationId)
    setMessages(msgs)
  }

  const handleNewConversation = async () => {
    const newConv = await chatbotService.createConversation()
    if (newConv) {
      setConversations([newConv, ...conversations])
      setCurrentConversation(newConv)
      setMessages([])
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || isLoading) return

    const userMsg = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    setMessages(prev => [...prev, {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMsg,
      created_at: new Date().toISOString()
    }])

    try {
      const response = await chatbotService.sendMessage(currentConversation.id, userMsg)

      if (response) {
        await loadMessages(currentConversation.id)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm('Deseja deletar esta conversa?')) return

    const success = await chatbotService.deleteConversation(convId)
    if (success) {
      const updatedConvs = conversations.filter(c => c.id !== convId)
      setConversations(updatedConvs)

      if (currentConversation?.id === convId) {
        setCurrentConversation(updatedConvs[0] || null)
        setMessages([])
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          console.log('🤖 Botão do chat clicado!')
          setIsOpen(true)
        }}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        style={{ zIndex: 9999 }}
        title="Assistente IA"
      >
        <MessageCircle size={24} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200" style={{ zIndex: 9999 }}>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <div>
            <h3 className="font-semibold">Assistente IA</h3>
            <p className="text-xs text-blue-100">Online</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-blue-800 rounded p-1 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-24 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <button
            onClick={handleNewConversation}
            className="w-full p-3 hover:bg-gray-200 border-b border-gray-200 flex items-center justify-center"
            title="Nova conversa"
          >
            <Plus size={18} />
          </button>

          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setCurrentConversation(conv)}
              className={`w-full p-3 hover:bg-gray-200 border-b border-gray-200 flex flex-col items-center gap-1 transition-colors ${
                currentConversation?.id === conv.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
              }`}
              title={conv.title}
            >
              <MessageCircle size={16} className="text-gray-600" />
              <span className="text-[10px] text-gray-500 text-center truncate w-full">
                {new Date(conv.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteConversation(conv.id)
                }}
                className="text-red-500 hover:text-red-700 mt-1"
              >
                <Trash2 size={12} />
              </button>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <HelpCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-sm mb-2">👋 Olá! Sou seu assistente inteligente.</p>
                <p className="text-xs text-gray-400 mb-4">Pergunte-me sobre:</p>
                <div className="text-xs text-left space-y-1 bg-gray-50 p-3 rounded">
                  <p>• Ordens de serviço abertas</p>
                  <p>• Estoque de materiais</p>
                  <p>• Agenda do dia</p>
                  <p>• Informações de clientes</p>
                  <p>• Resumo financeiro</p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${
                    msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                disabled={!currentConversation || isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !currentConversation || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              Digite "ajuda" para ver comandos disponíveis
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
