import { useState, useEffect } from 'react'
import { Mail, Send, Inbox, Archive, Star, Trash2, Reply, Forward, Paperclip, RefreshCw, Plus, Search, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

interface EmailMessage {
  id: string
  subject: string
  from_address: string
  from_name?: string
  body_html?: string
  body_text?: string
  direction: 'sent' | 'received' | 'draft'
  status: string
  is_read: boolean
  is_starred: boolean
  is_archived: boolean
  created_at: string
  sent_at?: string
  received_at?: string
}

const EmailInbox = () => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'inbox' | 'sent' | 'starred' | 'archived'>('inbox')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null)

  useEffect(() => {
    loadMessages()
  }, [filter])

  const loadMessages = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('email_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter === 'inbox') {
        query = query.eq('direction', 'received').eq('is_archived', false)
      } else if (filter === 'sent') {
        query = query.eq('direction', 'sent')
      } else if (filter === 'starred') {
        query = query.eq('is_starred', true)
      } else if (filter === 'archived') {
        query = query.eq('is_archived', true)
      }

      const { data, error } = await query

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncEmails = async () => {
    try {
      setSyncing(true)

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-imap-emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao sincronizar emails')
      }

      alert(result.message || 'Sincronização realizada com sucesso!')
      await loadMessages()
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error)
      alert(`Erro ao sincronizar emails: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from('email_messages')
        .update({ is_read: isRead, read_at: isRead ? new Date().toISOString() : null })
        .eq('id', id)

      if (error) throw error
      loadMessages()
    } catch (error) {
      console.error('Error updating message:', error)
    }
  }

  const handleToggleStar = async (id: string, isStarred: boolean) => {
    try {
      const { error } = await supabase
        .from('email_messages')
        .update({ is_starred: !isStarred })
        .eq('id', id)

      if (error) throw error
      loadMessages()
    } catch (error) {
      console.error('Error updating message:', error)
    }
  }

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_messages')
        .update({ is_archived: true })
        .eq('id', id)

      if (error) throw error
      loadMessages()
      setSelectedMessage(null)
    } catch (error) {
      console.error('Error archiving message:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta mensagem?')) return

    try {
      const { error } = await supabase
        .from('email_messages')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadMessages()
      setSelectedMessage(null)
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const filteredMessages = messages.filter(msg =>
    msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.from_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.from_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getFilterCount = (filterType: string) => {
    switch (filterType) {
      case 'inbox':
        return messages.filter(m => m.direction === 'received' && !m.is_archived).length
      case 'sent':
        return messages.filter(m => m.direction === 'sent').length
      case 'starred':
        return messages.filter(m => m.is_starred).length
      case 'archived':
        return messages.filter(m => m.is_archived).length
      default:
        return messages.length
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="mb-6">
            <Link
              to="/email/compose"
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="h-5 w-5" />
              Novo Email
            </Link>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setFilter('inbox')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left ${
                filter === 'inbox'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Inbox className="h-5 w-5" />
              <span>Caixa de Entrada</span>
              <span className="ml-auto text-sm font-medium">{getFilterCount('inbox')}</span>
            </button>

            <button
              onClick={() => setFilter('sent')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left ${
                filter === 'sent'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Send className="h-5 w-5" />
              <span>Enviados</span>
              <span className="ml-auto text-sm font-medium">{getFilterCount('sent')}</span>
            </button>

            <button
              onClick={() => setFilter('starred')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left ${
                filter === 'starred'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star className="h-5 w-5" />
              <span>Com Estrela</span>
              <span className="ml-auto text-sm font-medium">{getFilterCount('starred')}</span>
            </button>

            <button
              onClick={() => setFilter('archived')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left ${
                filter === 'archived'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Archive className="h-5 w-5" />
              <span>Arquivados</span>
              <span className="ml-auto text-sm font-medium">{getFilterCount('archived')}</span>
            </button>
          </nav>

          <div className="mt-6 pt-6 border-t">
            <Link
              to="/email/settings"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Configurações de Email
            </Link>
          </div>
        </div>

        {/* Lista de mensagens */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={loadMessages}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Atualizar"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={handleSyncEmails}
                disabled={syncing}
                className="px-3 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg flex items-center gap-2 font-medium transition-colors"
                title="Sincronizar emails do servidor"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 font-medium transition-colors"
                title="Voltar ao Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar ao Sistema
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Mail className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg">Nenhuma mensagem encontrada</p>
                <p className="text-sm mt-1">
                  {filter === 'inbox' && 'Sua caixa de entrada está vazia'}
                  {filter === 'sent' && 'Você ainda não enviou nenhum email'}
                  {filter === 'starred' && 'Nenhuma mensagem marcada com estrela'}
                  {filter === 'archived' && 'Nenhuma mensagem arquivada'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message)
                      if (!message.is_read && message.direction === 'received') {
                        handleMarkAsRead(message.id, true)
                      }
                    }}
                    className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
                      !message.is_read && message.direction === 'received' ? 'bg-blue-50' : 'bg-white'
                    } ${selectedMessage?.id === message.id ? 'border-l-4 border-blue-600' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleStar(message.id, message.is_starred)
                        }}
                        className="mt-1"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            message.is_starred
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${
                              !message.is_read && message.direction === 'received'
                                ? 'text-gray-900 font-semibold'
                                : 'text-gray-700'
                            }`}>
                              {message.direction === 'sent' ? 'Para: ' : ''}
                              {message.from_name || message.from_address}
                            </p>
                            <p className={`text-sm truncate ${
                              !message.is_read && message.direction === 'received'
                                ? 'text-gray-900 font-medium'
                                : 'text-gray-600'
                            }`}>
                              {message.subject}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(message.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {message.body_text?.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Visualização da mensagem */}
        {selectedMessage && (
          <div className="w-2/5 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold truncate">
                  {selectedMessage.subject}
                </h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => handleArchive(selectedMessage.id)}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Arquivar
                </button>
                <button
                  onClick={() => handleDelete(selectedMessage.id)}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>

              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium">De:</span>{' '}
                  <span className="text-gray-600">
                    {selectedMessage.from_name} &lt;{selectedMessage.from_address}&gt;
                  </span>
                </div>
                <div>
                  <span className="font-medium">Data:</span>{' '}
                  <span className="text-gray-600">
                    {new Date(selectedMessage.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedMessage.body_html ? (
                <div dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }} />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {selectedMessage.body_text}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailInbox
