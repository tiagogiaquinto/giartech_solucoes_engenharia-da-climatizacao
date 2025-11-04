import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, MousePointer, DollarSign, Target, AlertCircle, RefreshCw, Eye, Bell, Settings, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Campaign {
  id: string
  campaign_name: string
  clicks_last_hour: number
  clicks_today: number
  conversions_today: number
  cost_today: number
  avg_cpc: number
  conversion_rate: number
}

interface Alert {
  alert_id: string
  campaign_name: string
  alert_name: string
  alert_type: string
  current_value: number
  threshold_value: number
  triggered: boolean
}

const GoogleAdsTracking = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadData()

    // Auto-refresh a cada 60 segundos
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadData()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const loadData = async () => {
    try {
      setLoading(true)

      // Buscar estatísticas em tempo real
      const { data: campaignsData, error: campaignsError } = await supabase
        .rpc('get_realtime_campaign_stats', { p_time_window_hours: 24 })

      if (campaignsError) {
        console.error('Erro ao carregar campanhas:', campaignsError)
      } else {
        setCampaigns(campaignsData || [])
      }

      // Buscar alertas acionados
      const { data: alertsData, error: alertsError } = await supabase
        .rpc('check_campaign_alerts')

      if (alertsError) {
        console.error('Erro ao carregar alertas:', alertsError)
      } else {
        setAlerts((alertsData || []).filter((a: Alert) => a.triggered))
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalClicks = () => campaigns.reduce((sum, c) => sum + c.clicks_today, 0)
  const getTotalConversions = () => campaigns.reduce((sum, c) => sum + c.conversions_today, 0)
  const getTotalCost = () => campaigns.reduce((sum, c) => sum + c.cost_today, 0)
  const getAvgConversionRate = () => {
    const total = campaigns.reduce((sum, c) => sum + c.conversion_rate, 0)
    return campaigns.length > 0 ? total / campaigns.length : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-8 w-8 text-blue-600" />
            Rastreamento Google Ads - Tempo Real
          </h1>
          <p className="text-gray-600 mt-1">Acompanhe cliques e conversões em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? '🟢 Auto-refresh ON' : '⚪ Auto-refresh OFF'}
          </button>
        </div>
      </div>

      {/* Alertas Ativos */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
        >
          <div className="flex items-start">
            <Bell className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {alerts.length} Alerta{alerts.length > 1 ? 's' : ''} Ativo{alerts.length > 1 ? 's' : ''}
              </h3>
              <div className="mt-2 space-y-1">
                {alerts.map(alert => (
                  <div key={alert.alert_id} className="text-sm text-yellow-700">
                    <strong>{alert.campaign_name}</strong>: {alert.alert_name}
                    (Atual: {alert.current_value.toFixed(2)} / Limite: {alert.threshold_value.toFixed(2)})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cards de Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <MousePointer className="h-8 w-8 text-blue-500" />
            <span className="text-xs text-gray-500">Hoje</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{getTotalClicks()}</h3>
          <p className="text-sm text-gray-600">Total de Cliques</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="h-8 w-8 text-green-500" />
            <span className="text-xs text-gray-500">Hoje</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{getTotalConversions()}</h3>
          <p className="text-sm text-gray-600">Conversões</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 text-orange-500" />
            <span className="text-xs text-gray-500">Hoje</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">
            R$ {getTotalCost().toFixed(2)}
          </h3>
          <p className="text-sm text-gray-600">Gasto Total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <span className="text-xs text-gray-500">Média</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">
            {getAvgConversionRate().toFixed(2)}%
          </h3>
          <p className="text-sm text-gray-600">Taxa de Conversão</p>
        </motion.div>
      </div>

      {/* Tabela de Campanhas */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Campanhas Ativas</h2>
          <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm">
            <Settings className="h-4 w-4" />
            Configurar Alertas
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-gray-600">Carregando dados...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhuma campanha ativa encontrada</p>
            <p className="text-sm text-gray-500 mt-1">
              Conecte sua conta do Google Ads para começar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campanha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliques (Última Hora)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliques (Hoje)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversões
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxa Conv.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo Hoje
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPC Médio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign, index) => (
                  <motion.tr
                    key={campaign.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Target className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="font-medium text-gray-900">{campaign.campaign_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {campaign.clicks_last_hour} cliques
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      {campaign.clicks_today}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                      {campaign.conversions_today}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {campaign.conversion_rate.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      R$ {campaign.cost_today.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      R$ {campaign.avg_cpc.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instruções de Configuração */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📘 Como Configurar o Rastreamento
        </h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Conecte sua conta do Google Ads nas configurações</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>Configure os alertas para cada campanha</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>Os dados serão sincronizados automaticamente a cada 15 minutos</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>Receba notificações quando os alertas forem acionados</span>
          </li>
        </ol>
      </div>
    </div>
  )
}

export default GoogleAdsTracking
