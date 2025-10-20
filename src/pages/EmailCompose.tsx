import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, X, Paperclip, FileText, Loader, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface EmailAccount {
  id: string
  account_name: string
  email_address: string
  sender_name: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  body_text: string
}

const EmailCompose = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [formData, setFormData] = useState({
    account_id: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body_text: '',
    body_html: '',
  })

  useEffect(() => {
    loadAccounts()
    loadTemplates()
  }, [])

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('id, account_name, email_address, sender_name')
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      if (error) throw error
      setAccounts(data || [])

      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, account_id: data[0].id }))
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, subject, body_html, body_text')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      body_text: template.body_text,
      body_html: template.body_html,
    }))
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.to || !formData.subject || (!formData.body_text && !formData.body_html)) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/functions/v1/send-smtp-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          account_id: formData.account_id,
          to: formData.to.split(',').map(e => e.trim()).filter(e => e),
          cc: formData.cc ? formData.cc.split(',').map(e => e.trim()).filter(e => e) : undefined,
          bcc: formData.bcc ? formData.bcc.split(',').map(e => e.trim()).filter(e => e) : undefined,
          subject: formData.subject,
          body_text: formData.body_text,
          body_html: formData.body_html,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar email')
      }

      alert('Email enviado com sucesso!')
      navigate('/email/inbox')
    } catch (error: any) {
      console.error('Error sending email:', error)
      alert(`Erro ao enviar email: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Novo Email</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 font-medium transition-colors"
                  title="Voltar ao Dashboard"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Voltar ao Sistema
                </button>
                <button
                  onClick={() => navigate('/email/inbox')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="p-6 space-y-4">
            {/* Conta de Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                De (Conta de Email) *
              </label>
              <select
                required
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_name} ({account.email_address})
                  </option>
                ))}
              </select>
              {accounts.length === 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  Nenhuma conta configurada. Configure em Configurações de Email.
                </p>
              )}
            </div>

            {/* Template */}
            {templates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usar Template (Opcional)
                </label>
                <select
                  onChange={(e) => e.target.value && handleTemplateSelect(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="">Nenhum template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Para */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Para * <span className="text-xs text-gray-500">(separe múltiplos emails com vírgula)</span>
              </label>
              <input
                type="text"
                required
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="destinatario@email.com, outro@email.com"
              />
            </div>

            {/* CC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CC <span className="text-xs text-gray-500">(cópia)</span>
              </label>
              <input
                type="text"
                value={formData.cc}
                onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="copia@email.com"
              />
            </div>

            {/* BCC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CCO <span className="text-xs text-gray-500">(cópia oculta)</span>
              </label>
              <input
                type="text"
                value={formData.bcc}
                onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="copia.oculta@email.com"
              />
            </div>

            {/* Assunto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assunto *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Assunto do email"
              />
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem *
              </label>
              <textarea
                required
                value={formData.body_text}
                onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                rows={12}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Digite a mensagem do email..."
              />
              <p className="text-xs text-gray-500 mt-1">
                A assinatura configurada será adicionada automaticamente
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading || accounts.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Enviar Email
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/email/inbox')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Dicas */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use templates para agilizar o envio de emails recorrentes</li>
            <li>• Para enviar para múltiplos destinatários, separe os emails com vírgula</li>
            <li>• A assinatura da conta será adicionada automaticamente ao final</li>
            <li>• Verifique se a conta SMTP está configurada corretamente</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EmailCompose
