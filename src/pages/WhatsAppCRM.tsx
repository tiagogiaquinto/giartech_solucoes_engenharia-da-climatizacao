import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Phone, Mail, Search, Plus, X, Save, Users, Send, Clock, Check, CheckCheck, Ban, Tag, Settings, Image, Paperclip, Smile, MoreVertical, Trash2, Edit as EditIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WhatsAppAccount {
  id: string
  name: string
  phone: string
  status: 'connected' | 'disconnected' | 'pending'
  last_connection: string | null
  is_active: boolean
}

interface WhatsAppContact {
  id: string
  account_id: string
  name: string
  phone: string
  email: string | null
  avatar_url: string | null
  is_blocked: boolean
  notes: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  created_at: string
}

interface Message {
  id: string
  contact_id: string
  message_type: 'text' | 'image' | 'document'
  content: string
  direction: 'inbound' | 'outbound'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  created_at: string
}

const WhatsAppCRM = () => {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  // Modals
  const [showAddContactModal, setShowAddContactModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<WhatsAppAccount | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  })

  const [accountForm, setAccountForm] = useState({
    name: '',
    phone: ''
  })

  const messageTemplates = [
    { id: 1, title: 'Saudação', text: 'Olá! Tudo bem? Como posso ajudar você hoje?' },
    { id: 2, title: 'Agradecimento', text: 'Muito obrigado pelo contato! Estamos à disposição.' },
    { id: 3, title: 'Orçamento', text: 'Enviando o orçamento solicitado. Por favor, verifique os detalhes.' },
    { id: 4, title: 'Confirmação', text: 'Confirmado! Estaremos no local no horário combinado.' },
    { id: 5, title: 'Acompanhamento', text: 'Olá! Gostaria de saber se precisa de mais alguma informação sobre nosso serviço.' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id)
    }
  }, [selectedContact])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const { data: contactsData, error: contactsError } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false })

      const { data: accountsData, error: accountsError } = await supabase
        .from('whatsapp_accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (contactsError) throw contactsError
      if (accountsError) throw accountsError

      setContacts(contactsData || [])
      setAccounts(accountsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Marcar como lido
      await supabase
        .from('whatsapp_contacts')
        .update({ unread_count: 0 })
        .eq('id', contactId)

      loadData()
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return

    try {
      setSending(true)

      const newMessage = {
        contact_id: selectedContact.id,
        message_type: 'text',
        content: messageText.trim(),
        direction: 'outbound',
        status: 'sent',
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('whatsapp_messages')
        .insert([newMessage])

      if (error) throw error

      // Atualizar última mensagem do contato
      await supabase
        .from('whatsapp_contacts')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: messageText.trim().substring(0, 100)
        })
        .eq('id', selectedContact.id)

      setMessageText('')
      await loadMessages(selectedContact.id)
      await loadData()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const handleCreateContact = async () => {
    if (!newContact.name || !newContact.phone) {
      alert('Nome e telefone são obrigatórios')
      return
    }

    try {
      const defaultAccount = accounts.find(a => a.is_active)

      if (!defaultAccount) {
        alert('Nenhuma conta do WhatsApp ativa encontrada!')
        return
      }

      const { error } = await supabase
        .from('whatsapp_contacts')
        .insert([{
          account_id: defaultAccount.id,
          name: newContact.name,
          phone: newContact.phone,
          email: newContact.email || null,
          notes: newContact.notes || null
        }])

      if (error) throw error

      await loadData()
      setShowAddContactModal(false)
      setNewContact({ name: '', phone: '', email: '', notes: '' })
      alert('Contato criado com sucesso!')
    } catch (error) {
      console.error('Error creating contact:', error)
      alert('Erro ao criar contato')
    }
  }

  const handleEditAccount = (account: WhatsAppAccount) => {
    setEditingAccount(account)
    setAccountForm({
      name: account.name,
      phone: account.phone
    })
    setShowEditAccountModal(true)
  }

  const handleUpdateAccount = async () => {
    if (!accountForm.name || !accountForm.phone) {
      alert('Nome e telefone são obrigatórios')
      return
    }

    if (!editingAccount) return

    try {
      const { error } = await supabase
        .from('whatsapp_accounts')
        .update({
          name: accountForm.name,
          phone: accountForm.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAccount.id)

      if (error) throw error

      await loadData()
      setShowEditAccountModal(false)
      setEditingAccount(null)
      alert('Conta atualizada com sucesso!')
    } catch (error) {
      console.error('Error updating account:', error)
      alert('Erro ao atualizar conta')
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return

    try {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadData()
      if (selectedContact?.id === id) {
        setSelectedContact(null)
      }
      alert('Contato excluído com sucesso!')
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Erro ao excluir contato')
    }
  }

  const handleUseTemplate = (template: { text: string }) => {
    setMessageText(template.text)
    setShowTemplatesModal(false)
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  )

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      })
    } catch {
      return 'há alguns instantes'
    }
  }

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Check className="h-3 w-3 text-gray-400" />
      case 'delivered': return <CheckCheck className="h-3 w-3 text-gray-400" />
      case 'read': return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'failed': return <X className="h-3 w-3 text-red-500" />
      default: return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">WhatsApp CRM</h1>
              <p className="text-sm text-green-100">Sistema de Atendimento Integrado</p>
            </div>
          </div>
          <button
            onClick={() => accounts.length > 0 && handleEditAccount(accounts[0])}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configurar Conta
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Lista de Contatos */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar contatos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowAddContactModal(true)}
              className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo Contato
            </button>
          </div>

          {/* Lista de Contatos */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-green-500"></div>
              </div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedContact?.id === contact.id
                      ? 'bg-green-50 border-l-4 border-l-green-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
                          {contact.last_message_at && (
                            <span className="text-xs text-gray-500">
                              {formatTime(contact.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{contact.phone}</p>
                        {contact.last_message_preview && (
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {contact.last_message_preview}
                          </p>
                        )}
                      </div>
                    </div>
                    {contact.unread_count > 0 && (
                      <span className="bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {contact.unread_count}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Users className="h-16 w-16 mb-4" />
                <p>Nenhum contato encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Área de Chat */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedContact ? (
            <>
              {/* Header do Chat */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">{selectedContact.name}</h2>
                      <p className="text-sm text-gray-600">{selectedContact.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(selectedContact.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.direction === 'outbound'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={`text-xs ${message.direction === 'outbound' ? 'text-green-100' : 'text-gray-500'}`}>
                            {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {message.direction === 'outbound' && getMessageStatusIcon(message.status)}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageCircle className="h-16 w-16 mb-4" />
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-sm">Envie a primeira mensagem para iniciar a conversa</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTemplatesModal(true)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Templates"
                  >
                    <Tag className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="h-24 w-24 mb-4" />
              <h3 className="text-xl font-semibold mb-2">WhatsApp CRM</h3>
              <p>Selecione um contato para iniciar uma conversa</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Adicionar Contato */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Novo Contato</h2>
              <button onClick={() => setShowAddContactModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Nome do contato"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="5535999999999"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  placeholder="Notas sobre o contato..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddContactModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateContact}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Editar Conta */}
      {showEditAccountModal && editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Configurar Conta WhatsApp</h2>
              <button onClick={() => setShowEditAccountModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta *</label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="Ex: Atendimento Principal"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número WhatsApp *</label>
                <input
                  type="tel"
                  value={accountForm.phone}
                  onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                  placeholder="5535999999999"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: Código do país + DDD + número (sem espaços)
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Importante:</strong> Este número será usado para enviar e receber mensagens no CRM.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditAccountModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateAccount}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Templates */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Templates de Mensagens</h2>
              <button onClick={() => setShowTemplatesModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messageTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleUseTemplate(template)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{template.title}</h3>
                  <p className="text-sm text-gray-600">{template.text}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default WhatsAppCRM
