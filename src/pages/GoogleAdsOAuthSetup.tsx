import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Key, Link2, CheckCircle, AlertTriangle, ExternalLink, Copy, Eye, EyeOff, Lock, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface OAuthConfig {
  client_id: string
  client_secret: string
  developer_token: string
  customer_id: string
}

const GoogleAdsOAuthSetup = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showSecrets, setShowSecrets] = useState({
    client_secret: false,
    developer_token: false
  })

  const [config, setConfig] = useState<OAuthConfig>({
    client_id: '',
    client_secret: '',
    developer_token: '',
    customer_id: '687-563-5815'
  })

  const [accountId, setAccountId] = useState<string | null>(null)

  useEffect(() => {
    loadExistingConfig()
  }, [])

  const loadExistingConfig = async () => {
    try {
      const { data } = await supabase
        .from('google_ads_accounts')
        .select('id, client_id, customer_id, oauth_connected')
        .eq('customer_id', '687-563-5815')
        .maybeSingle()

      if (data) {
        setAccountId(data.id)
        setConfig(prev => ({
          ...prev,
          client_id: data.client_id || '',
          customer_id: data.customer_id
        }))

        if (data.oauth_connected) {
          setStep(4)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    }
  }

  const handleSaveCredentials = async () => {
    if (!config.client_id || !config.client_secret || !config.developer_token) {
      alert('Por favor, preencha todos os campos!')
      return
    }

    try {
      setLoading(true)

      if (!accountId) {
        alert('Conta não encontrada. Por favor, crie a conta primeiro.')
        return
      }

      const { error } = await supabase
        .from('google_ads_accounts')
        .update({
          client_id: config.client_id,
          client_secret_encrypted: config.client_secret,
          developer_token_encrypted: config.developer_token
        })
        .eq('id', accountId)

      if (error) throw error

      alert('✅ Credenciais salvas com sucesso!')
      setStep(3)
    } catch (error: any) {
      console.error('Erro ao salvar credenciais:', error)
      alert(`❌ Erro ao salvar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthConnect = async () => {
    try {
      setLoading(true)

      const redirectUri = `${window.location.origin}/oauth/callback`
      const scope = 'https://www.googleapis.com/auth/adwords'

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(config.client_id)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scope)}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${accountId}`

      window.location.href = authUrl
    } catch (error: any) {
      console.error('Erro ao iniciar OAuth:', error)
      alert(`❌ Erro: ${error.message}`)
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('✅ Copiado!')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Configuração OAuth Google Ads</h1>
        </div>
        <p className="text-blue-100">Conecte sua conta com dados reais via API oficial</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`w-16 h-1 mx-2 ${
                  step > s ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Key className="h-6 w-6 text-blue-600" />
                Passo 1: Obter Credenciais Google
              </h2>
              <p className="text-gray-600 mb-4">
                Antes de continuar, você precisa das credenciais do Google Cloud Console e Google Ads.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5">
              <h3 className="font-bold text-blue-900 mb-3">📋 Você vai precisar de:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Client ID:</strong> Do Google Cloud Console OAuth 2.0</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Client Secret:</strong> Do Google Cloud Console OAuth 2.0</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Developer Token:</strong> Do Google Ads API Center</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-900 font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Ainda não tem as credenciais?
              </p>
              <p className="text-amber-800 text-sm mb-3">
                Siga o guia completo que criamos para você!
              </p>
              <a
                href="/GUIA_CONEXAO_GOOGLE_ADS_API_REAL.md"
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir Guia Completo
              </a>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                Já tenho as credenciais
                <Key className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Lock className="h-6 w-6 text-blue-600" />
                Passo 2: Inserir Credenciais
              </h2>
              <p className="text-gray-600 mb-4">
                Cole suas credenciais abaixo. Elas serão armazenadas de forma segura e criptografada.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer ID (ID do Cliente)
                </label>
                <input
                  type="text"
                  value={config.customer_id}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={config.client_id}
                    onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                    placeholder="123456789-abc.apps.googleusercontent.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(config.client_id)}
                    className="absolute right-2 top-2 p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Do Google Cloud Console → Credentials → OAuth 2.0 Client ID
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Secret *
                </label>
                <div className="relative">
                  <input
                    type={showSecrets.client_secret ? 'text' : 'password'}
                    value={config.client_secret}
                    onChange={(e) => setConfig({ ...config, client_secret: e.target.value })}
                    placeholder="GOCSPX-..."
                    className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setShowSecrets({ ...showSecrets, client_secret: !showSecrets.client_secret })}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets.client_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Secret fornecido junto com o Client ID
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Developer Token *
                </label>
                <div className="relative">
                  <input
                    type={showSecrets.developer_token ? 'text' : 'password'}
                    value={config.developer_token}
                    onChange={(e) => setConfig({ ...config, developer_token: e.target.value })}
                    placeholder="abc123xyz..."
                    className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => setShowSecrets({ ...showSecrets, developer_token: !showSecrets.developer_token })}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets.developer_token ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Do Google Ads → Tools → API Center → Developer Token
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-900 font-medium mb-1 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança Garantida
              </p>
              <p className="text-green-800 text-sm">
                Suas credenciais serão criptografadas antes de serem armazenadas no banco de dados.
                Apenas o sistema poderá descriptografá-las para uso na API.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Voltar
              </button>
              <button
                onClick={handleSaveCredentials}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                {loading ? 'Salvando...' : 'Salvar Credenciais'}
                <Lock className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Link2 className="h-6 w-6 text-blue-600" />
                Passo 3: Autorizar Conexão
              </h2>
              <p className="text-gray-600 mb-4">
                Agora você será redirecionado para o Google para autorizar o acesso à sua conta do Google Ads.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5">
              <h3 className="font-bold text-blue-900 mb-3">O que vai acontecer:</h3>
              <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
                <li>Você será levado para a página de login do Google</li>
                <li>Faça login com a conta do Google Ads (687-563-5815)</li>
                <li>Autorize o acesso aos dados do Google Ads</li>
                <li>Será redirecionado de volta automaticamente</li>
                <li>A sincronização começará imediatamente!</li>
              </ol>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
              <Zap className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Pronto para conectar!
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Clique no botão abaixo para iniciar a autorização OAuth
              </p>
              <button
                onClick={handleOAuthConnect}
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-bold text-lg disabled:from-gray-400 disabled:to-gray-500"
              >
                {loading ? 'Redirecionando...' : 'Conectar com Google'}
                <ExternalLink className="h-6 w-6" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Voltar
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Conexão Estabelecida!
            </h2>
            <p className="text-gray-600 mb-8">
              Sua conta está conectada e sincronizando dados reais do Google Ads
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-4">Próximas Ações:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/google-ads-tracking')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Ver Dashboard
                </button>
                <button
                  onClick={() => navigate('/google-ads-settings')}
                  className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                >
                  Gerenciar Contas
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default GoogleAdsOAuthSetup
