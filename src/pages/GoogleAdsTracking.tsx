import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, MousePointer, DollarSign, Target, AlertCircle, RefreshCw,
  Eye, Bell, Settings, ChevronRight, Sparkles, Zap, TrendingDown,
  BarChart3, Activity, CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
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
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedView, setSelectedView] = useState<'overview' | 'campaigns' | 'alerts'>('overview')

  useEffect(() => {
    loadData()

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

      const { data: campaignsData, error: campaignsError } = await supabase
        .rpc('get_realtime_campaign_stats', { p_time_window_hours: 24 })

      if (campaignsError) {
        console.error('Erro ao carregar campanhas:', campaignsError)
      } else {
        setCampaigns(campaignsData || [])
      }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Premium Header com Gradiente */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/10"></div>

        <div className="relative px-8 py-8">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Target className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">Google Ads Premium</h1>
                    <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      PRO
                    </span>
                  </div>
                  <p className="text-blue-100 mt-1">Rastreamento em Tempo Real de Campanhas</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Atualizado: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>

              <button
                onClick={loadData}
                disabled={loading}
                className="bg-white text-blue-600 px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg ${
                  autoRefresh
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Activity className="h-4 w-4" />
                {autoRefresh ? 'Live' : 'Paused'}
              </button>
            </div>
          </div>

          {/* Premium Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-500/30 rounded-lg">
                  <MousePointer className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-300 text-sm">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+12%</span>
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">{getTotalClicks().toLocaleString()}</div>
              <div className="text-blue-100 text-sm">Cliques Hoje</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-green-500/30 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-300 text-sm">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+8%</span>
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">{getTotalConversions()}</div>
              <div className="text-blue-100 text-sm">Conversões</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-orange-500/30 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-red-300 text-sm">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+5%</span>
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">R$ {getTotalCost().toFixed(2)}</div>
              <div className="text-blue-100 text-sm">Investido Hoje</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-purple-500/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-300 text-sm">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+3%</span>
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">{getAvgConversionRate().toFixed(2)}%</div>
              <div className="text-blue-100 text-sm">Taxa de Conversão</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-8 py-6 space-y-6">
        {/* Alertas Premium */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500 rounded-xl">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-900 mb-2">
                    {alerts.length} Alerta{alerts.length > 1 ? 's' : ''} Ativo{alerts.length > 1 ? 's' : ''}
                  </h3>
                  <div className="space-y-2">
                    {alerts.map(alert => (
                      <div key={alert.alert_id} className="flex items-center gap-3 bg-white/50 rounded-lg p-3">
                        <Zap className="h-5 w-5 text-amber-600" />
                        <div className="flex-1">
                          <span className="font-semibold text-amber-900">{alert.campaign_name}</span>
                          <span className="text-amber-700"> - {alert.alert_name}</span>
                        </div>
                        <div className="text-sm text-amber-800">
                          <span className="font-mono">{alert.current_value.toFixed(2)}</span>
                          <span className="mx-1">/</span>
                          <span className="font-mono">{alert.threshold_value.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabela Premium de Campanhas */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Campanhas em Tempo Real</h2>
              </div>
              <button
                onClick={() => navigate('/google-ads-settings')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 rounded-full opacity-20 animate-ping"></div>
                <RefreshCw className="h-12 w-12 text-blue-600 animate-spin relative" />
              </div>
              <span className="mt-4 text-gray-600 font-medium">Carregando dados em tempo real...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <Target className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma campanha ativa</h3>
              <p className="text-gray-600 mb-6">Conecte sua conta do Google Ads para começar</p>
              <button
                onClick={() => navigate('/google-ads-settings')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                <Sparkles className="h-4 w-4" />
                Conectar Google Ads
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Campanha
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3" />
                        Última Hora
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Cliques Hoje
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Conversões
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Taxa Conv.
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Custo Hoje
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      CPC Médio
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((campaign, index) => (
                    <motion.tr
                      key={campaign.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-blue-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                            <Target className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-semibold text-gray-900">{campaign.campaign_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                          <Activity className="h-3 w-3" />
                          {campaign.clicks_last_hour}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-gray-900">{campaign.clicks_today}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1 text-lg font-bold text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {campaign.conversions_today}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span className={`text-lg font-bold ${
                            campaign.conversion_rate >= 2 ? 'text-green-600' :
                            campaign.conversion_rate >= 1 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {campaign.conversion_rate.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-base font-semibold text-gray-900">
                          R$ {campaign.cost_today.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-base font-medium text-gray-700">
                          R$ {campaign.avg_cpc.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium opacity-0 group-hover:opacity-100">
                          <Eye className="h-4 w-4" />
                          Ver
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Premium Info Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3">Configure seu Rastreamento Premium</h3>
              <ol className="space-y-3 text-blue-50">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <span>Conecte sua conta do Google Ads nas configurações</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <span>Configure alertas personalizados para cada campanha</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <span>Sincronização automática a cada 15 minutos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <span>Receba notificações instantâneas quando limites forem atingidos</span>
                </li>
              </ol>
              <button
                onClick={() => navigate('/google-ads-settings')}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-lg"
              >
                <Settings className="h-5 w-5" />
                Configurar Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoogleAdsTracking
