/**
 * WhatsApp CRM - Interface Completa
 *
 * Gerenciamento de conversas do WhatsApp integrado ao sistema
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  MessageCircle,
  Send,
  Search,
  Phone,
  FileText,
  Plus,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  User
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Card from '../components/Card'

interface WhatsAppConversation {
  id: string
  contact_name: string
  phone: string
  last_message: string
  last_message_date: Date
  unread_count: number
  status: 'open' | 'waiting' | 'closed'
  assigned_to?: string
}

interface WhatsAppMessage {
  id: string
  conversation_id: string
  content: string
  type: 'text' | 'image' | 'document'
  direction: 'inbound' | 'outbound'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  created_at: Date
}

export default function WhatsAppCRM() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          contact:customers(
            id,
            nome_razao,
            nome_fantasia,
            celular,
            telefone
          )
        `)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Mapear dados para o formato esperado
      const mappedData = (data || []).map((conv: any) => {
        const contactName = conv.contact?.nome_razao || conv.contact?.nome_fantasia || 'Contato sem cadastro'
        const contactPhone = conv.contact?.celular || conv.contact?.telefone || 'Número não disponível'

        return {
          id: conv.id,
          contact_name: contactName,
          phone: contactPhone,
          last_message: conv.last_message_preview || 'Sem mensagens',
          last_message_date: conv.last_message_at || new Date(),
          unread_count: conv.unread_count || 0,
          status: 'open' as const,
          assigned_to: undefined
        }
      })

      setConversations(mappedData)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: selectedConversation.id,
          content: newMessage,
          type: 'text',
          direction: 'outbound',
          status: 'sent'
        })
        .select()
        .single()

      if (error) throw error

      setMessages([...messages, data])
      setNewMessage('')

      // TODO: Chamar edge function para enviar via WhatsApp
      // await sendWhatsAppMessage(selectedConversation.phone, newMessage)
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  }

  const createServiceOrderFromChat = () => {
    if (!selectedConversation) return

    // Redirecionar para criação de OS com dados do cliente
    const phone = selectedConversation.phone
    window.location.href = `/service-orders/create?phone=${phone}`
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const filteredConversations = conversations.filter(conv =>
    (conv.contact_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.phone || '').includes(searchQuery)
  )

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3" />
      case 'delivered':
      case 'read':
        return <CheckCheck className="w-3 h-3" />
      case 'failed':
        return <Clock className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Sidebar - Lista de Conversas */}
      <Card className="w-1/3 flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-3">WhatsApp CRM</h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Carregando...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma conversa encontrada</p>
              <p className="text-sm mt-1">Aguardando mensagens...</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conv.contact_name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(conv.last_message_date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{conv.phone}</span>
                      {conv.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Área de Chat */}
      <Card className="flex-1 flex flex-col p-0 overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedConversation.contact_name}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedConversation.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={createServiceOrderFromChat}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Criar OS
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma mensagem ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.direction === 'outbound'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {msg.direction === 'outbound' && (
                            <span className="opacity-70">
                              {getMessageStatusIcon(msg.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                💡 Use templates rápidos ou crie uma OS diretamente da conversa
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Selecione uma conversa</p>
              <p className="text-sm mt-1">Escolha um contato para iniciar</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
