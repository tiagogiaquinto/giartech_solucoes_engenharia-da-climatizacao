import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Phone, Mail, Search, Plus, X, Save, Users, Send, Clock, Check, CheckCheck, Ban, Tag, ListFilter as Filter, MoveVertical as MoreVertical, Trash2, CreditCard as Edit, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'

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
  created_at: string
}

interface Message {
  id: string
  contact_id: string
  message_type: string
  content: string
  direction: 'inbound' | 'outbound'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  created_at: string
}

const WhatsAppCRM = () => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'accounts'>('contacts')
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null)

  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const { data: contactsData, error: contactsError } = await supabase
        .from('wpp_contacts')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: accountsData, error: accountsError } = await supabase
        .from('wpp_accounts')
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
        .from('wpp_contacts')
        .insert([{
          account_id: defaultAccount.id,
          name: newContact.name,
          phone: newContact.phone,
          email: newContact.email || null,
          notes: newContact.notes || null
        }])

      if (error) throw error

      await loadData()
      setShowAddModal(false)
      setNewContact({ name: '', phone: '', email: '', notes: '' })
    } catch (error) {
      console.error('Error creating contact:', error)
      alert('Erro ao criar contato')
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return

    try {
      const { error } = await supabase
        .from('wpp_contacts')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Erro ao excluir contato')
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800'
      case 'disconnected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado'
      case 'disconnected': return 'Desconectado'
      case 'pending': return 'Pendente'
      default: return 'Desconhecido'
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="h-6 w-6 mr-2 text-green-500" />
              WhatsApp CRM
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie contas e contatos
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Contato
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-md border border-gray-100"
      >
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'contacts'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Contatos ({filteredContacts.length})
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'accounts'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Phone className="h-4 w-4 inline mr-2" />
            Contas ({accounts.length})
          </button>
        </div>

        {/* Search Bar */}
        {activeTab === 'contacts' && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar contatos..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-green-500"></div>
              <p className="text-gray-600 mt-2">Carregando...</p>
            </div>
          ) : activeTab === 'contacts' ? (
            <div className="space-y-3">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600">
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {contact.phone}
                            </div>
                            {contact.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {contact.email}
                              </div>
                            )}
                          </div>
                          {contact.notes && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{contact.notes}</p>
                          )}
                          {contact.last_message_at && (
                            <div className="flex items-center text-xs text-gray-500 mt-2">
                              <Clock className="h-3 w-3 mr-1" />
                              Última mensagem: {new Date(contact.last_message_at).toLocaleString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        {contact.is_blocked && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs flex items-center">
                            <Ban className="h-3 w-3 mr-1" />
                            Bloqueado
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum contato encontrado</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Adicionar primeiro contato
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Phone className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{account.name}</h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <p className="text-sm text-gray-600">{account.phone}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                              {getStatusText(account.status)}
                            </span>
                          </div>
                          {account.last_connection && (
                            <p className="text-xs text-gray-500 mt-1">
                              Última conexão: {new Date(account.last_connection).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                      {account.is_active && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Ativo
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma conta conectada</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Novo Contato</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nome do contato"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={newContact.notes}
                  onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Informações adicionais"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateContact}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default WhatsAppCRM
