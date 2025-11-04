import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Target, Plus, Settings, Trash2, RefreshCw, CheckCircle, XCircle, AlertTriangle, Save, Key, Link as LinkIcon, Zap, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface GoogleAdsAccount {
  id: string
  account_name: string
  customer_id: string
  is_active: boolean
  last_sync_at: string | null
  sync_frequency_minutes: number
  created_at: string
}

const GoogleAdsSettings = () => {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    account_name: '',
    customer_id: '',
    sync_frequency_minutes: 15
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('google_ads_accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase
        .from('google_ads_accounts')
        .insert([{
          account_name: formData.account_name,
          customer_id: formData.customer_id,
          is_active: true,
          sync_frequency_minutes: formData.sync_frequency_minutes
        }])

      if (error) throw error

      alert('✅ Conta adicionada com sucesso!')
      setShowAddForm(false)
      setFormData({ account_name: '', customer_id: '', sync_frequency_minutes: 15 })
      loadAccounts()
    } catch (error: any) {
      console.error('Erro ao adicionar conta:', error)
      alert(`❌ Erro ao adicionar conta: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta conta?')) return

    try {
      const { error } = await supabase
        .from('google_ads_accounts')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('✅ Conta removida com sucesso!')
      loadAccounts()
    } catch (error: any) {
      console.error('Erro ao remover conta:', error)
      alert(`❌ Erro ao remover conta: ${error.message}`)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('google_ads_accounts')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      loadAccounts()
    } catch (error: any) {
      console.error('Erro ao atualizar conta:', error)
      alert(`❌ Erro ao atualizar conta: ${error.message}`)
    }
  }

  const handleSync = async (accountId: string) => {
    try {
      alert('🔄 Iniciando sincronização...')

      // Chamar edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/functions/v1/google-ads-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: accountId,
          force_sync: true
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ Sincronização concluída!\n\n${result.records_synced} registros sincronizados em ${result.sync_duration_seconds}s`)
        loadAccounts()
      } else {
        alert(`❌ Erro na sincronização: ${result.error}`)
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error)
      alert(`❌ Erro ao sincronizar: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-8 w-8 text-blue-600" />
            Configurações Google Ads
          </h1>
          <p className="text-gray-600 mt-1">Conecte e gerencie suas contas do Google Ads</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
        >
          <Plus className="h-5 w-5" />
          {showAddForm ? 'Cancelar' : 'Adicionar Conta'}
        </button>
      </div>

      {/* Tutorial de Conexão */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Key className="h-5 w-5" />
          Como conectar sua conta Google Ads (Método Simplificado)
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="bg-white/50 rounded-lg p-4">
            <p className="font-semibold mb-2">📋 Passo 1: Obtenha seu Customer ID</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Acesse: <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">https://ads.google.com</a></li>
              <li>Faça login na sua conta</li>
              <li>No canto superior direito, você verá um número no formato: <strong>123-456-7890</strong></li>
              <li>Esse é seu Customer ID (ID do cliente)</li>
            </ol>
          </div>

          <div className="bg-white/50 rounded-lg p-4">
            <p className="font-semibold mb-2">✅ Passo 2: Adicione a Conta Abaixo</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Clique em "Adicionar Conta"</li>
              <li>Preencha o nome da sua conta (ex: "Minha Empresa")</li>
              <li>Cole o Customer ID que você copiou</li>
              <li>Configure a frequência de sincronização</li>
              <li>Clique em "Salvar"</li>
            </ol>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-4">
            <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Quer usar dados REAIS do Google Ads?
            </p>
            <p className="text-green-800 mb-3">
              Configure a conexão OAuth 2.0 para sincronizar automaticamente
              suas campanhas, cliques e conversões reais!
            </p>
            <button
              onClick={() => navigate('/google-ads-oauth')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <Shield className="h-4 w-4" />
              Configurar API Real
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Modo de Demonstração Ativo
            </p>
            <p className="text-amber-800">
              Atualmente o sistema está em modo demonstração e irá gerar dados simulados.
              Perfeito para testar a interface antes de conectar com a API real.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de Adicionar Conta */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Plus className="h-6 w-6 text-blue-600" />
            Adicionar Nova Conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Conta
              </label>
              <input
                type="text"
                required
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="Ex: Minha Empresa - Campanhas"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer ID (ID do Cliente)
              </label>
              <input
                type="text"
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                placeholder="123-456-7890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                Encontre no canto superior direito do Google Ads
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequência de Sincronização (minutos)
              </label>
              <select
                value={formData.sync_frequency_minutes}
                onChange={(e) => setFormData({ ...formData, sync_frequency_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>A cada 5 minutos</option>
                <option value={15}>A cada 15 minutos</option>
                <option value={30}>A cada 30 minutos</option>
                <option value={60}>A cada 1 hora</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors font-semibold"
              >
                <Save className="h-5 w-5" />
                Salvar Conta
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Lista de Contas */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Contas Conectadas</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhuma conta conectada</p>
            <p className="text-sm text-gray-500 mt-1">Clique em "Adicionar Conta" para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${account.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Target className={`h-5 w-5 ${account.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{account.account_name}</h3>
                        <p className="text-sm text-gray-600 font-mono">{account.customer_id}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        account.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.is_active ? '🟢 Ativa' : '⚪ Pausada'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                      <div className="flex items-center gap-1">
                        <RefreshCw className="h-4 w-4" />
                        <span>Sincroniza a cada {account.sync_frequency_minutes} min</span>
                      </div>
                      {account.last_sync_at && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Última sync: {new Date(account.last_sync_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSync(account.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Zap className="h-4 w-4" />
                      Sincronizar
                    </button>
                    <button
                      onClick={() => handleToggleActive(account.id, account.is_active)}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                        account.is_active
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {account.is_active ? 'Pausar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GoogleAdsSettings
