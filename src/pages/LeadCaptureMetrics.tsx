import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Target, DollarSign, Activity, Filter, Calendar, Download } from 'lucide-react';
import StatCard from '../components/StatCard';

interface LeadMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  avgScore: number;
  qualificationRate: number;
}

interface PerformanceData {
  date: string;
  source: string;
  campaign_name: string;
  leads_captured: number;
  avg_score: number;
  qualified_count: number;
  qualification_rate: number;
}

interface FunnelData {
  source: string;
  status: string;
  count: number;
  avg_score: number;
  percentage_of_source: number;
}

interface QualityData {
  source: string;
  campaign_name: string;
  total_leads: number;
  avg_score: number;
  min_score: number;
  max_score: number;
  enriched_leads: number;
  qualified_leads: number;
  qualification_rate: number;
}

const LeadCaptureMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<LeadMetrics>({
    totalLeads: 0,
    qualifiedLeads: 0,
    avgScore: 0,
    qualificationRate: 0,
  });
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [qualityData, setQualityData] = useState<QualityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // dias
  const [selectedSource, setSelectedSource] = useState<string>('all');

  useEffect(() => {
    loadMetrics();
  }, [dateRange, selectedSource]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      // Calcular data de início
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Métricas gerais
      let query = supabase
        .from('crm_leads')
        .select('*', { count: 'exact' })
        .gte('created_at', startDate.toISOString());

      if (selectedSource !== 'all') {
        query = query.eq('source', selectedSource);
      }

      const { data: leads, count } = await query;

      if (leads) {
        const qualifiedCount = leads.filter((l: any) => l.status === 'qualified').length;
        const avgScore = leads.reduce((sum: number, l: any) => sum + (l.score || 0), 0) / leads.length;

        setMetrics({
          totalLeads: count || 0,
          qualifiedLeads: qualifiedCount,
          avgScore: Math.round(avgScore),
          qualificationRate: count ? Math.round((qualifiedCount / count) * 100) : 0,
        });
      }

      // Performance ao longo do tempo
      const { data: performance } = await supabase
        .from('v_lead_capture_performance')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (performance) {
        setPerformanceData(performance);
      }

      // Funil de conversão
      const { data: funnel } = await supabase
        .from('v_lead_funnel_metrics')
        .select('*');

      if (funnel) {
        if (selectedSource !== 'all') {
          setFunnelData(funnel.filter((f: FunnelData) => f.source === selectedSource));
        } else {
          setFunnelData(funnel);
        }
      }

      // Qualidade por fonte
      const { data: quality } = await supabase
        .from('v_lead_quality_by_source')
        .select('*')
        .order('qualification_rate', { ascending: false });

      if (quality) {
        setQualityData(quality);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const exportData = () => {
    const csvContent = [
      ['Fonte', 'Total Leads', 'Qualificados', 'Taxa Qualificação', 'Score Médio'],
      ...qualityData.map(q => [
        q.source,
        q.total_leads,
        q.qualified_leads,
        q.qualification_rate,
        q.avg_score,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-metrics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Captação de Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Métricas e performance de captação automática
          </p>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Exportar Dados
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as fontes</option>
              <option value="cnpj">CNPJ</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
              <option value="google_ads">Google Ads</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Leads Capturados"
          value={metrics.totalLeads.toString()}
          icon={<Users className="w-6 h-6" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Leads Qualificados"
          value={metrics.qualifiedLeads.toString()}
          icon={<Target className="w-6 h-6" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Taxa de Qualificação"
          value={`${metrics.qualificationRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Score Médio"
          value={metrics.avgScore.toString()}
          icon={<Activity className="w-6 h-6" />}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance ao longo do tempo */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Captação ao Longo do Tempo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="leads_captured"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Leads Capturados"
              />
              <Line
                type="monotone"
                dataKey="qualified_count"
                stroke="#10b981"
                strokeWidth={2}
                name="Qualificados"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por fonte */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Leads por Fonte
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={qualityData}
                dataKey="total_leads"
                nameKey="source"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.source}: ${entry.total_leads}`}
              >
                {qualityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Score médio por fonte */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Qualidade por Fonte
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={qualityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg_score" fill="#3b82f6" name="Score Médio" />
              <Bar dataKey="qualification_rate" fill="#10b981" name="Taxa Qualificação %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funil de conversão */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Funil de Conversão
          </h3>
          <div className="space-y-3">
            {Array.from(new Set(funnelData.map(f => f.status))).map((status) => {
              const statusData = funnelData.filter(f => f.status === status);
              const totalCount = statusData.reduce((sum, d) => sum + d.count, 0);
              const totalPercentage = statusData.reduce((sum, d) => sum + d.percentage_of_source, 0);

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium capitalize">{status}</span>
                    <span className="text-gray-600">{totalCount} leads</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabela de qualidade por fonte */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detalhamento por Fonte
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fonte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Campanha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Leads
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Qualificados
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Taxa
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Score Médio
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Enriquecidos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {qualityData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.campaign_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {row.total_leads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {row.qualified_leads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      row.qualification_rate >= 50
                        ? 'bg-green-100 text-green-800'
                        : row.qualification_rate >= 30
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {row.qualification_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {Math.round(row.avg_score)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {row.enriched_leads}/{row.total_leads}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadCaptureMetrics;
