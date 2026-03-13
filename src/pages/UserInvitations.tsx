import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Plus, X, Clock, CheckCircle, Circle as XCircle, AlertCircle, Send, Copy, MessageCircle, CheckSquare } from 'lucide-react'
import { getUserInvitations, createUserInvitation, cancelUserInvitation, expireOldInvitations, type UserInvitation } from '../lib/database-services'
import { useUser } from '../contexts/UserContext'
import { supabase } from '../lib/supabase'

const UserInvitations = () => {
  const { user } = useUser()
  const [invitations, setInvitations] = useState<UserInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    whatsapp: '',
    role: 'technician' as 'admin' | 'technician' | 'external',
    sendMethod: 'email' as 'email' | 'whatsapp' | 'both'
  })

  useEffect(() => {
    loadInvitations()
    expireOldInvitations()
  }, [])

  const loadInvitations = async () => {
    try {
      setLoading(true)
      const data = await getUserInvitations()
      setInvitations(data)
    } catch (error) {
      console.error('Error loading invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email) {
      alert('Por favor, insira um email')
      return
    }

    if ((formData.sendMethod === 'whatsapp' || formData.sendMethod === 'both') && !formData.whatsapp) {
      alert('Por favor, insira o WhatsApp para enviar o convite')
      return
    }

    try {
      setSending(true)

      // Criar convite no banco
      const invitation = await createUserInvitation({
        email: formData.email,
        role: formData.role,
        invited_by: user?.id
      })

      // Buscar dados da empresa
      const { data: companyData } = await supabase
        .from('company_settings')
        .select('name')
        .single()

      // Enviar convite via edge function
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: formData.email,
          token: invitation.token,
          role: formData.role,
          method: formData.sendMethod,
          whatsapp: formData.whatsapp,
          companyName: companyData?.name || 'Giartech Sistema'
        })
      })

      const result = await response.json()

      if (result.success) {
        let successMessage = 'Convite criado com sucesso!'
        if (result.results.email) successMessage += '\n✅ Email enviado'
        if (result.results.whatsapp) successMessage += '\n✅ WhatsApp enviado'

        alert(successMessage)
        await loadInvitations()
        setShowModal(false)
        setFormData({ email: '', whatsapp: '', role: 'technician', sendMethod: 'email' })
      } else {
        alert('Convite criado, mas houve erro no envio:\n' + result.results.errors.join('\n'))
      }
    } catch (error) {
      console.error('Error creating invitation:', error)
      alert('Erro ao criar convite. Verifique se o email já não foi convidado.')
    } finally {
      setSending(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return

    try {
      await cancelUserInvitation(id)
      await loadInvitations()
    } catch (error) {
      console.error('Error canceling invitation:', error)
      alert('Erro ao cancelar convite')
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/register?token=${token}`
    navigator.clipboard.writeText(link)
    alert('✅ Link copiado! Você pode enviar pelo WhatsApp manualmente.')
  }

  const sendViaWhatsApp = (token: string, email: string) => {
    const link = `${window.location.origin}/register?token=${token}`
    const message = encodeURIComponent(
      `🎉 Você foi convidado para acessar nosso sistema!\n\n` +
      `📧 Email: ${email}\n` +
      `🔗 Link de cadastro: ${link}\n\n` +
      `⏰ Válido por 7 dias`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'accepted': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'expired': return <XCircle className="h-5 w-5 text-red-600" />
      case 'cancelled': return <AlertCircle className="h-5 w-5 text-gray-600" />
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'accepted': return 'Aceito'
      case 'expired': return 'Expirado'
      case 'cancelled': return 'Cancelado'
      default: return 'Desconhecido'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'technician': return 'Técnico'
      case 'external': return 'Externo'
      default: return 'Usuário'
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'technician': return 'bg-blue-100 text-blue-800'
      case 'external': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const pendingCount = invitations.filter(i => i.status === 'pending').length
  const acceptedCount = invitations.filter(i => i.status === 'accepted').length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Mail className="h-8 w-8 text-blue-600" />
              Convites de Usuários
            </h1>
            <p className="text-gray-600 mt-2">Convide novos usuários via Email ou WhatsApp</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Novo Convite
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Convites</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{invitations.length}</p>
              </div>
              <Mail className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Aceitos</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{acceptedCount}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Carregando convites...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expira em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {invitations.map(invitation => (
                      <motion.tr
                        key={invitation.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {invitation.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(invitation.role)}`}>
                            {getRoleLabel(invitation.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(invitation.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                              {getStatusLabel(invitation.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invitation.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invitation.expires_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {invitation.status === 'pending' && invitation.token && (
                              <>
                                <button
                                  onClick={() => copyInviteLink(invitation.token!)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                  title="Copiar link do convite"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => sendViaWhatsApp(invitation.token!, invitation.email!)}
                                  className="text-green-600 hover:text-green-900 transition-colors"
                                  title="Enviar via WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleCancel(invitation.id!)}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                  title="Cancelar convite"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {invitations.length === 0 && (
              <div className="text-center py-12">
                <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Nenhum convite encontrado</p>
                <p className="text-gray-500 text-sm mt-2">Crie convites para novos usuários</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Send className="h-6 w-6 text-blue-600" />
                    Novo Convite
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email do Usuário *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="usuario@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Função no Sistema *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="technician">Técnico</option>
                    <option value="admin">Administrador</option>
                    <option value="external">Externo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Como enviar o convite? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="sendMethod"
                        value="email"
                        checked={formData.sendMethod === 'email'}
                        onChange={(e) => setFormData({ ...formData, sendMethod: e.target.value as any })}
                        className="text-blue-600"
                      />
                      <Mail className="h-5 w-5 text-blue-600" />
                      <span>Enviar por Email</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="sendMethod"
                        value="whatsapp"
                        checked={formData.sendMethod === 'whatsapp'}
                        onChange={(e) => setFormData({ ...formData, sendMethod: e.target.value as any })}
                        className="text-blue-600"
                      />
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <span>Enviar por WhatsApp</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="sendMethod"
                        value="both"
                        checked={formData.sendMethod === 'both'}
                        onChange={(e) => setFormData({ ...formData, sendMethod: e.target.value as any })}
                        className="text-blue-600"
                      />
                      <CheckSquare className="h-5 w-5 text-purple-600" />
                      <span>Enviar por Email e WhatsApp</span>
                    </label>
                  </div>
                </div>

                {(formData.sendMethod === 'whatsapp' || formData.sendMethod === 'both') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp * (com DDD)
                    </label>
                    <input
                      type="tel"
                      required={formData.sendMethod === 'whatsapp' || formData.sendMethod === 'both'}
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 98765-4321"
                    />
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Validade:</strong> O convite expira em 7 dias
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar Convite
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserInvitations
