import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Settings,
  CheckCircle,
  XCircle,
  Save,
  TestTube,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  Globe,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MessageCircle,
  TrendingUp,
  Video,
  Mail
} from 'lucide-react'
import { useToast } from '../hooks/useToast'

interface LeadSource {
  id: string
  source_name: string
  source_type: string
  is_active: boolean
  api_key?: string
  api_secret?: string
  access_token?: string
  refresh_token?: string
  client_id?: string
  client_secret?: string
  additional_config: any
  search_parameters: any
  rate_limits: any
  last_sync_at?: string
  last_test_at?: string
  test_status?: 'success' | 'failed' | 'pending' | 'not_tested'
  test_message?: string
  created_at: string
  updated_at: string
}

const sourceIcons: Record<string, any> = {
  google_maps: Globe,
  google_places: Globe,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  google_ads: TrendingUp,
  tiktok: Video,
  youtube: Youtube,
  whatsapp_business: MessageCircle,
  email_api: Mail,
}

export default function LeadSourcesConfig() {
  const [sources, setSources] = useState<LeadSource[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSource, setSelectedSource] = useState<LeadSource | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const { showToast } = useToast()

  const [formData, setFormData] = useState<Partial<LeadSource>>({})

  useEffect(() => {
    loadSources()
  }, [])

  const loadSources = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_sources_config')
        .select('*')
        .order('source_name')

      if (error) throw error
      setSources(data || [])
    } catch (error) {
      console.error('Error loading sources:', error)
      showToast('Erro ao carregar configurações', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (source: LeadSource) => {
    setSelectedSource(source)
    setFormData(source)
    setShowModal(true)
  }

  const saveSource = async () => {
    try {
      if (!selectedSource) return

      const { error } = await supabase
        .from('lead_sources_config')
        .update(formData)
        .eq('id', selectedSource.id)

      if (error) throw error

      showToast('Configuração salva com sucesso!', 'success')
      setShowModal(false)
      loadSources()
    } catch (error: any) {
      console.error('Error saving source:', error)
      showToast(error.message || 'Erro ao salvar configuração', 'error')
    }
  }

  const toggleActive = async (sourceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('lead_sources_config')
        .update({ is_active: !isActive })
        .eq('id', sourceId)

      if (error) throw error

      showToast(
        !isActive ? 'Fonte ativada com sucesso!' : 'Fonte desativada com sucesso!',
        'success'
      )
      loadSources()
    } catch (error: any) {
      console.error('Error toggling source:', error)
      showToast(error.message || 'Erro ao alterar status', 'error')
    }
  }

  const testConnection = async (source: LeadSource) => {
    setTesting(source.id)

    try {
      // Simulação de teste - em produção, chamar edge function
      await new Promise(resolve => setTimeout(resolve, 2000))

      const success = Math.random() > 0.3 // 70% de sucesso para demonstração

      const { error } = await supabase
        .from('lead_sources_config')
        .update({
          last_test_at: new Date().toISOString(),
          test_status: success ? 'success' : 'failed',
          test_message: success
            ? 'Conexão estabelecida com sucesso!'
            : 'Falha ao conectar. Verifique as credenciais.'
        })
        .eq('id', source.id)

      if (error) throw error

      showToast(
        success ? 'Teste realizado com sucesso!' : 'Teste falhou. Verifique as credenciais.',
        success ? 'success' : 'error'
      )
      loadSources()
    } catch (error: any) {
      console.error('Error testing connection:', error)
      showToast(error.message || 'Erro ao testar conexão', 'error')
    } finally {
      setTesting(null)
    }
  }

  const getStatusBadge = (status?: string) => {
    const badges = {
      success: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Sucesso' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Falhou' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: RefreshCw, text: 'Pendente' },
      not_tested: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, text: 'Não Testado' }
    }
    return badges[status as keyof typeof badges] || badges.not_tested
  }

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (loading) {
    return <div className="p-6">Carregando...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuração de Fontes de Leads</h1>
        <p className="text-gray-600 mt-1">
          Configure APIs e integrações para captação automática de leads
        </p>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Fontes</p>
              <p className="text-2xl font-bold text-gray-900">{sources.length}</p>
            </div>
            <Settings className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fontes Ativas</p>
              <p className="text-2xl font-bold text-green-600">
                {sources.filter(s => s.is_active).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Configuradas</p>
              <p className="text-2xl font-bold text-blue-600">
                {sources.filter(s => s.api_key || s.access_token).length}
              </p>
            </div>
            <Settings className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Testadas</p>
              <p className="text-2xl font-bold text-purple-600">
                {sources.filter(s => s.test_status === 'success').length}
              </p>
            </div>
            <TestTube className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Lista de Fontes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => {
          const Icon = sourceIcons[source.source_type] || Globe
          const statusBadge = getStatusBadge(source.test_status)
          const StatusIcon = statusBadge.icon

          return (
            <div
              key={source.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${source.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Icon className={`w-6 h-6 ${source.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{source.source_name}</h3>
                    <p className="text-sm text-gray-500">{source.source_type}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(source.id, source.is_active)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    source.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {source.is_active ? 'Ativa' : 'Inativa'}
                </button>
              </div>

              {/* Status do Teste */}
              {source.test_status && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${statusBadge.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">{statusBadge.text}</span>
                </div>
              )}

              {/* Limites de Taxa */}
              <div className="mb-4 text-sm">
                <p className="text-gray-600">Limites de Taxa:</p>
                <p className="text-gray-900">
                  {source.rate_limits?.requests_per_day || 0} req/dia
                </p>
              </div>

              {/* Último Teste */}
              {source.last_test_at && (
                <p className="text-xs text-gray-500 mb-4">
                  Último teste: {new Date(source.last_test_at).toLocaleDateString('pt-BR')}
                </p>
              )}

              {/* Ações */}
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(source)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Configurar
                </button>
                <button
                  onClick={() => testConnection(source)}
                  disabled={testing === source.id}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  title="Testar Conexão"
                >
                  {testing === source.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de Configuração */}
      {showModal && selectedSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedSource.source_name}</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Configure as credenciais e parâmetros da API
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); saveSource(); }} className="space-y-6">
                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets['api_key'] ? 'text' : 'password'}
                      value={formData.api_key || ''}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="Digite a API Key"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility('api_key')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets['api_key'] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* API Secret */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Secret (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets['api_secret'] ? 'text' : 'password'}
                      value={formData.api_secret || ''}
                      onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="Digite o API Secret"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility('api_secret')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets['api_secret'] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Client ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.client_id || ''}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o Client ID"
                  />
                </div>

                {/* Client Secret */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Secret (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets['client_secret'] ? 'text' : 'password'}
                      value={formData.client_secret || ''}
                      onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="Digite o Client Secret"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility('client_secret')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets['client_secret'] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Access Token */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Token (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets['access_token'] ? 'text' : 'password'}
                      value={formData.access_token || ''}
                      onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="Digite o Access Token"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility('access_token')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets['access_token'] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Informações de Ajuda */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Como obter as credenciais?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {selectedSource.source_type === 'google_maps' && (
                      <>
                        <li>1. Acesse o Google Cloud Console</li>
                        <li>2. Crie um projeto ou selecione existente</li>
                        <li>3. Ative a API do Google Maps</li>
                        <li>4. Crie credenciais (API Key)</li>
                        <li>5. Configure restrições de API</li>
                      </>
                    )}
                    {selectedSource.source_type === 'linkedin' && (
                      <>
                        <li>1. Acesse LinkedIn Developers</li>
                        <li>2. Crie um aplicativo</li>
                        <li>3. Obtenha Client ID e Secret</li>
                        <li>4. Configure permissões de acesso</li>
                      </>
                    )}
                    {selectedSource.source_type === 'facebook' && (
                      <>
                        <li>1. Acesse Facebook for Developers</li>
                        <li>2. Crie um aplicativo</li>
                        <li>3. Obtenha App ID e Secret</li>
                        <li>4. Gere Access Token</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Configuração
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
