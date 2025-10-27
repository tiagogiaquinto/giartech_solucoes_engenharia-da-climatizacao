import { useState, useEffect } from 'react'
import { Save, Key, CheckCircle, XCircle, Loader, TrendingUp, Zap } from 'lucide-react'
import AIProvidersService from '../services/aiProvidersService'

interface Provider {
  name: string
  apiKey?: string
  model: string
  available: boolean
  priority: number
  freeLimit?: number
}

interface Stats {
  total_requests: number
  total_tokens: number
  success_rate: number
  error_count: number
}

export default function AIProvidersSettings() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [stats, setStats] = useState<Record<string, Stats>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  const aiService = new AIProvidersService()

  useEffect(() => {
    loadProviders()
    loadStats()
  }, [])

  const loadProviders = async () => {
    try {
      const providersList = aiService.getProviders()
      setProviders(providersList)

      // Inicializar API keys vazias
      const keys: Record<string, string> = {}
      providersList.forEach(p => {
        keys[p.name] = p.apiKey === '***' ? '' : (p.apiKey || '')
      })
      setApiKeys(keys)
    } catch (err) {
      console.error('Erro ao carregar provedores:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await aiService.getUsageStats(7)
      setStats(statsData)
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }

  const handleSaveApiKey = async (providerName: string) => {
    setSaving(providerName)
    try {
      const apiKey = apiKeys[providerName]
      if (!apiKey) {
        alert('Por favor, insira uma API key')
        return
      }

      const success = await aiService.addApiKey(providerName, apiKey)
      if (success) {
        alert(`✅ API Key salva para ${providerName}`)
        loadProviders()
        loadStats()
      } else {
        alert('❌ Erro ao salvar API key')
      }
    } catch (err) {
      console.error('Erro ao salvar API key:', err)
      alert('❌ Erro ao salvar API key')
    } finally {
      setSaving(null)
    }
  }

  const handleTestProvider = async (providerName: string) => {
    setTesting(providerName)
    try {
      const result = await aiService.testProvider(providerName)
      setTestResults(prev => ({
        ...prev,
        [providerName]: result
      }))

      if (result.success) {
        alert(`✅ ${providerName} está funcionando!\n\nResposta: ${result.content}`)
      } else {
        alert(`❌ ${providerName} falhou\n\nErro: ${result.error}`)
      }
    } catch (err) {
      console.error('Erro ao testar provedor:', err)
      alert('❌ Erro ao testar provedor')
    } finally {
      setTesting(null)
    }
  }

  const getProviderColor = (name: string) => {
    const colors: Record<string, string> = {
      groq: 'border-purple-500 bg-purple-50',
      together: 'border-blue-500 bg-blue-50',
      huggingface: 'border-yellow-500 bg-yellow-50',
      gemini: 'border-green-500 bg-green-50',
      cohere: 'border-pink-500 bg-pink-50'
    }
    return colors[name] || 'border-gray-500 bg-gray-50'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Provedores de IA
        </h1>
        <p className="text-gray-600">
          Configure APIs gratuitas de IA para potencializar o Thomaz
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total de Requisições</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {Object.values(stats).reduce((sum, s) => sum + (s.total_requests || 0), 0)}
          </p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Taxa de Sucesso</span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {Object.values(stats).length > 0
              ? (Object.values(stats).reduce((sum, s) => sum + parseFloat(s.success_rate?.toString() || '0'), 0) / Object.values(stats).length).toFixed(1)
              : '0'}%
          </p>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Provedores Ativos</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {providers.filter(p => p.apiKey && p.apiKey !== '***').length} / {providers.length}
          </p>
        </div>

        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Tokens Usados</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            {Object.values(stats).reduce((sum, s) => sum + (s.total_tokens || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Lista de Provedores */}
      <div className="space-y-4">
        {providers.map(provider => (
          <div
            key={provider.name}
            className={`border-2 rounded-lg p-6 ${getProviderColor(provider.name)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold capitalize">{provider.name}</h3>
                  {provider.apiKey && provider.apiKey !== '***' ? (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Configurado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      <XCircle className="w-3 h-3" />
                      Não configurado
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">Modelo: {provider.model}</p>
                {provider.freeLimit && (
                  <p className="text-xs text-gray-500">
                    Limite gratuito: {provider.freeLimit.toLocaleString()} requisições/dia
                  </p>
                )}
              </div>

              {/* Estatísticas do Provedor */}
              {stats[provider.name] && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Requisições</p>
                    <p className="font-bold">{stats[provider.name].total_requests}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Taxa de Sucesso</p>
                    <p className="font-bold">{stats[provider.name].success_rate}%</p>
                  </div>
                </div>
              )}
            </div>

            {/* Campo de API Key */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeys[provider.name] || ''}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.name]: e.target.value }))}
                  placeholder={`Digite a API key do ${provider.name}`}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
                <button
                  onClick={() => handleSaveApiKey(provider.name)}
                  disabled={saving === provider.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {saving === provider.name ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar
                </button>
                <button
                  onClick={() => handleTestProvider(provider.name)}
                  disabled={testing === provider.name || !provider.apiKey || provider.apiKey === '***'}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {testing === provider.name ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Testar
                </button>
              </div>

              {/* Resultado do Teste */}
              {testResults[provider.name] && (
                <div className={`p-3 rounded-lg border-2 ${
                  testResults[provider.name].success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-sm">
                    {testResults[provider.name].success ? (
                      <span className="text-green-700">
                        ✅ Teste bem-sucedido! Resposta: {testResults[provider.name].content}
                      </span>
                    ) : (
                      <span className="text-red-700">
                        ❌ Teste falhou: {testResults[provider.name].error}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Links de Registro */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-600 mb-2">Como obter API key:</p>
              <div className="flex flex-wrap gap-2">
                {provider.name === 'groq' && (
                  <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    console.groq.com/keys
                  </a>
                )}
                {provider.name === 'together' && (
                  <a href="https://api.together.xyz/settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    api.together.xyz/settings/api-keys
                  </a>
                )}
                {provider.name === 'huggingface' && (
                  <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    huggingface.co/settings/tokens
                  </a>
                )}
                {provider.name === 'gemini' && (
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    aistudio.google.com/app/apikey
                  </a>
                )}
                {provider.name === 'cohere' && (
                  <a href="https://dashboard.cohere.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    dashboard.cohere.com/api-keys
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Informações Adicionais */}
      <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ Sobre os Provedores de IA</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• <strong>Groq:</strong> Llama 3.1 70B - Extremamente rápido (14,400 req/dia grátis)</p>
          <p>• <strong>Together AI:</strong> Llama 3.1 70B Turbo - Alta performance</p>
          <p>• <strong>Hugging Face:</strong> Meta Llama 3 70B - Comunidade open source</p>
          <p>• <strong>Google Gemini:</strong> Gemini 1.5 Flash - Rápido e eficiente</p>
          <p>• <strong>Cohere:</strong> Command - Excelente para conversação</p>
        </div>
        <p className="text-xs text-blue-600 mt-4">
          O sistema usa fallback automático: se um provedor falhar, tenta o próximo automaticamente.
        </p>
      </div>
    </div>
  )
}
