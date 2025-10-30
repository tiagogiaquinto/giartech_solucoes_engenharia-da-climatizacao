import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, DollarSign, AlertTriangle, Star, Clock, BarChart3, Filter, Download, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

interface RFMSegmentSummary {
  segment: string
  count: number
  avg_recency: number
  avg_frequency: number
  total_value: number
}

interface RFMCustomer {
  customer_id: string
  customer_name: string
  email: string
  recency_days: number
  frequency_count: number
  monetary_value: number
  r_score: number
  f_score: number
  m_score: number
  rfm_total: number
  segment: string
}

export default function CustomerRFM() {
  const [summary, setSummary] = useState<RFMSegmentSummary[]>([])
  const [customers, setCustomers] = useState<RFMCustomer[]>([])
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar resumo
      const { data: summaryData } = await supabase
        .from('v_rfm_summary')
        .select('*')
        .order('total_value', { ascending: false })

      setSummary(summaryData || [])

      // Carregar clientes
      const { data: customersData } = await supabase
        .from('v_customer_rfm_segments')
        .select('*')
        .order('monetary_value', { ascending: false })
        .limit(100)

      setCustomers(customersData || [])
    } catch (error) {
      console.error('Error loading RFM data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      'Champions': '#10b981',
      'Loyal': '#3b82f6',
      'Potential': '#8b5cf6',
      'At Risk': '#f59e0b',
      'Lost': '#ef4444',
      'New': '#6b7280',
      'Other': '#9ca3af'
    }
    return colors[segment] || '#9ca3af'
  }

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'Champions': return <Star className="h-5 w-5" />
      case 'Loyal': return <Users className="h-5 w-5" />
      case 'Potential': return <TrendingUp className="h-5 w-5" />
      case 'At Risk': return <AlertTriangle className="h-5 w-5" />
      case 'Lost': return <Clock className="h-5 w-5" />
      default: return <Users className="h-5 w-5" />
    }
  }

  const getActionForSegment = (segment: string) => {
    const actions: Record<string, string> = {
      'Champions': 'Recompensar com programa VIP e benefícios exclusivos',
      'Loyal': 'Oferecer upsell, cross-sell e produtos premium',
      'Potential': 'Engajar com benefícios de fidelidade',
      'At Risk': '⚠️ URGENTE: Campanha de retenção imediata!',
      'Lost': 'Campanha de win-back agressiva com ofertas especiais',
      'New': 'Nutrir relacionamento e apresentar catálogo',
      'Other': 'Monitorar comportamento'
    }
    return actions[segment] || 'Monitorar'
  }

  // Dados do gráfico de pizza
  const pieData = {
    labels: summary.map(s => s.segment),
    datasets: [{
      data: summary.map(s => s.count),
      backgroundColor: summary.map(s => getSegmentColor(s.segment)),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  // Dados do gráfico de barras
  const barData = {
    labels: summary.map(s => s.segment),
    datasets: [
      {
        label: 'Valor Total (R$)',
        data: summary.map(s => s.total_value),
        backgroundColor: summary.map(s => getSegmentColor(s.segment))
      }
    ]
  }

  const filteredCustomers = selectedSegment === 'all'
    ? customers
    : customers.filter(c => c.segment === selectedSegment)

  const totalCustomers = customers.length
  const totalValue = summary.reduce((acc, s) => acc + s.total_value, 0)
  const championsCount = summary.find(s => s.segment === 'Champions')?.count || 0
  const atRiskCount = summary.find(s => s.segment === 'At Risk')?.count || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análise RFM de Clientes</h1>
          <p className="text-gray-600 mt-1">Segmentação por Recência, Frequência e Valor Monetário</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalCustomers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                R$ {(totalValue / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Champions</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{championsCount}</p>
              <p className="text-xs text-gray-500 mt-1">Melhores clientes</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Em Risco</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{atRiskCount}</p>
              <p className="text-xs text-gray-500 mt-1">Requerem atenção</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Segmento</h3>
          <div className="h-64">
            <Doughnut
              data={pieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Valor por Segmento</h3>
          <div className="h-64">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => 'R$ ' + (Number(value) / 1000).toFixed(0) + 'k'
                    }
                  }
                }
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Segmentos Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summary.map((seg, index) => (
          <motion.div
            key={seg.segment}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedSegment(seg.segment)}
            style={{ borderLeft: `4px solid ${getSegmentColor(seg.segment)}` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${getSegmentColor(seg.segment)}20` }}
                >
                  <div style={{ color: getSegmentColor(seg.segment) }}>
                    {getSegmentIcon(seg.segment)}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{seg.segment}</h4>
                  <p className="text-sm text-gray-600">{seg.count} clientes</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor Total:</span>
                <span className="font-semibold">R$ {(seg.total_value / 1000).toFixed(1)}k</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Freq. Média:</span>
                <span className="font-semibold">{seg.avg_frequency} compras</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Recência Média:</span>
                <span className="font-semibold">{seg.avg_recency} dias</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-700">
                <strong>Ação:</strong> {getActionForSegment(seg.segment)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lista de Clientes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-lg shadow"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Clientes {selectedSegment !== 'all' ? `- ${selectedSegment}` : ''}
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os Segmentos</option>
                {summary.map(s => (
                  <option key={s.segment} value={s.segment}>{s.segment}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segmento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scores</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recência</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequência</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.slice(0, 20).map((customer) => (
                <tr key={customer.customer_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{customer.customer_name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: getSegmentColor(customer.segment) }}
                    >
                      {customer.segment}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        R:{customer.r_score}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        F:{customer.f_score}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        M:{customer.m_score}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {customer.recency_days} dias
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {customer.frequency_count} compras
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    R$ {customer.monetary_value.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length > 20 && (
          <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-600">
            Mostrando 20 de {filteredCustomers.length} clientes
          </div>
        )}
      </motion.div>
    </div>
  )
}
