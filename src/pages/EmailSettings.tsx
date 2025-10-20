import { useState, useEffect } from 'react'
import { Mail, Plus, Settings, Trash2, Check, X, Eye, EyeOff, RefreshCw, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface EmailAccount {
  id: string
  account_name: string
  email_address: string
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password: string
  smtp_secure: boolean
  imap_host?: string
  imap_port?: number
  imap_user?: string
  imap_password?: string
  imap_secure: boolean
  sender_name: string
  signature?: string
  is_default: boolean
  is_active: boolean
  last_sync_at?: string
  created_at: string
}

const EmailSettings = () => {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    account_name: '',
    email_address: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_secure: true,
    imap_host: '',
    imap_port: 993,
    imap_user: '',
    imap_password: '',
    imap_secure: true,
    sender_name: '',
    signature: '',
    is_default: false,
    is_active: true
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error loading email accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        const { error } = await supabase
          .from('email_accounts')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
        alert('✅ Conta de email atualizada com sucesso!')
      } else {
        const { error } = await supabase
          .from('email_accounts')
          .insert([formData])

        if (error) throw error
        alert('✅ Conta de email criada com sucesso!')
      }

      resetForm()
      loadAccounts()
    } catch (error: any) {
      console.error('Error saving email account:', error)

      // Mensagem específica para email duplicado
      if (error?.message?.includes('email_address') && error?.message?.includes('already exists')) {
        alert(`❌ ERRO: O email "${formData.email_address}" já está cadastrado!\n\nPara editar esta conta:\n1. Feche este formulário\n2. Clique no ícone de configuração (⚙️) da conta existente\n3. Faça as alterações necessárias`)
      } else if (error?.code === '23505') {
        alert('❌ ERRO: Esta conta de email já existe no sistema!\n\nVerifique a lista de contas abaixo.')
      } else {
        alert(`❌ Erro ao salvar conta de email:\n\n${error?.message || 'Erro desconhecido'}`)
      }
    }
  }

  const handleEdit = (account: EmailAccount) => {
    setFormData({
      account_name: account.account_name,
      email_address: account.email_address,
      smtp_host: account.smtp_host,
      smtp_port: account.smtp_port,
      smtp_user: account.smtp_user,
      smtp_password: account.smtp_password,
      smtp_secure: account.smtp_secure,
      imap_host: account.imap_host || '',
      imap_port: account.imap_port || 993,
      imap_user: account.imap_user || '',
      imap_password: account.imap_password || '',
      imap_secure: account.imap_secure,
      sender_name: account.sender_name,
      signature: account.signature || '',
      is_default: account.is_default,
      is_active: account.is_active
    })
    setEditingId(account.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Deseja realmente excluir a conta ${email}?`)) return

    try {
      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Erro ao excluir conta')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      // Remove default de todas
      await supabase
        .from('email_accounts')
        .update({ is_default: false })
        .neq('id', id)

      // Define nova default
      const { error } = await supabase
        .from('email_accounts')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error
      loadAccounts()
    } catch (error) {
      console.error('Error setting default:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      account_name: '',
      email_address: '',
      smtp_host: '',
      smtp_port: 587,
      smtp_user: '',
      smtp_password: '',
      smtp_secure: true,
      imap_host: '',
      imap_port: 993,
      imap_user: '',
      imap_password: '',
      imap_secure: true,
      sender_name: '',
      signature: '',
      is_default: false,
      is_active: true
    })
    setEditingId(null)
    setShowForm(false)
    setShowPassword(false)
  }

  const fillGmailDefaults = () => {
    setFormData(prev => ({
      ...prev,
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      imap_host: 'imap.gmail.com',
      imap_port: 993
    }))
  }

  const fillOutlookDefaults = () => {
    setFormData(prev => ({
      ...prev,
      smtp_host: 'smtp-mail.outlook.com',
      smtp_port: 587,
      imap_host: 'outlook.office365.com',
      imap_port: 993
    }))
  }

  const fillHostgatorDefaults = () => {
    if (!formData.email_address) {
      alert('Por favor, preencha o endereço de email primeiro!')
      return
    }

    // Extrai o domínio do email
    const domain = formData.email_address.split('@')[1]

    // Gera nome da conta automaticamente se não tiver
    const accountName = formData.account_name ||
      `Email Corporativo - ${formData.email_address.split('@')[0]}`

    // Gera nome do remetente se não tiver
    const senderName = formData.sender_name ||
      formData.email_address.split('@')[0].charAt(0).toUpperCase() +
      formData.email_address.split('@')[0].slice(1)

    setFormData(prev => ({
      ...prev,
      account_name: accountName,
      sender_name: senderName,
      smtp_host: `mail.${domain}`,
      smtp_port: 587,
      smtp_user: prev.email_address, // Usuário é o email completo
      imap_host: `mail.${domain}`,
      imap_port: 993,
      imap_user: prev.email_address,
      imap_password: prev.smtp_password, // Mesma senha para IMAP e SMTP
      smtp_secure: true,
      imap_secure: true,
      signature: `\n\n---\nAtenciosamente,\n${senderName}\n${domain}`
    }))

    alert('✅ Configurações Hostgator preenchidas!\n\nAgora você só precisa:\n1. Verificar os dados\n2. Preencher a senha\n3. Salvar')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Mail className="h-8 w-8 text-blue-600" />
              Configurações de Email
            </h1>
            <p className="text-gray-600 mt-1">
              Configure contas de email corporativo para envio e recebimento
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nova Conta
              </button>
            )}
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

        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Editar Conta' : 'Nova Conta de Email'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Presets */}
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Configuração Rápida:</span> Selecione seu provedor de email
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={fillHostgatorDefaults}
                    className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm hover:bg-orange-100 font-medium border border-orange-200"
                  >
                    🌐 Hostgator
                  </button>
                  <button
                    type="button"
                    onClick={fillGmailDefaults}
                    className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100 font-medium border border-red-200"
                  >
                    📧 Gmail
                  </button>
                  <button
                    type="button"
                    onClick={fillOutlookDefaults}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 font-medium border border-blue-200"
                  >
                    📨 Outlook
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 <strong>Hostgator:</strong> Preencha primeiro o email, depois clique no botão
                </p>
              </div>

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Conta *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Email Comercial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço de Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email_address}
                    onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="contato@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Remetente *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sender_name}
                    onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Empresa LTDA"
                  />
                </div>
              </div>

              {/* Configurações SMTP */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Configurações de Envio (SMTP)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Servidor SMTP *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.smtp_host}
                      onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porta SMTP *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.smtp_port}
                      onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuário SMTP *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.smtp_user}
                      onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha SMTP *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.smtp_password}
                        onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.smtp_secure}
                      onChange={(e) => setFormData({ ...formData, smtp_secure: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Usar conexão segura (TLS/SSL)</span>
                  </label>
                </div>
              </div>

              {/* Configurações IMAP */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Configurações de Recebimento (IMAP) - Opcional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Servidor IMAP
                    </label>
                    <input
                      type="text"
                      value={formData.imap_host}
                      onChange={(e) => setFormData({ ...formData, imap_host: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="imap.gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porta IMAP
                    </label>
                    <input
                      type="number"
                      value={formData.imap_port}
                      onChange={(e) => setFormData({ ...formData, imap_port: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuário IMAP
                    </label>
                    <input
                      type="text"
                      value={formData.imap_user}
                      onChange={(e) => setFormData({ ...formData, imap_user: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha IMAP
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.imap_password}
                      onChange={(e) => setFormData({ ...formData, imap_password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Assinatura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assinatura de Email
                </label>
                <textarea
                  value={formData.signature}
                  onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Atenciosamente,&#10;Sua Empresa&#10;Tel: (11) 1234-5678"
                />
              </div>

              {/* Opções */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Conta padrão</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Conta ativa</span>
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Conta'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Contas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Contas Configuradas</h2>

          {accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma conta de email configurada</p>
              <p className="text-sm mt-1">Clique em "Nova Conta" para adicionar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{account.account_name}</h3>
                        {account.is_default && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            Padrão
                          </span>
                        )}
                        {!account.is_active && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            Inativa
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{account.email_address}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        SMTP: {account.smtp_host}:{account.smtp_port}
                        {account.imap_host && ` | IMAP: ${account.imap_host}:${account.imap_port}`}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!account.is_default && (
                        <button
                          onClick={() => handleSetDefault(account.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Definir como padrão"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Editar"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id, account.email_address)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas de Configuração</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Para Gmail: Ative "Acesso a apps menos seguros" ou use "Senhas de app"</li>
            <li>• Para Outlook/Hotmail: Use smtp-mail.outlook.com na porta 587</li>
            <li>• Para domínios próprios: Consulte seu provedor de hospedagem</li>
            <li>• Recomendamos sempre usar conexão segura (TLS/SSL)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EmailSettings
