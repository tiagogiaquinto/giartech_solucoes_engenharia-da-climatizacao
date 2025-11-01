import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Camera,
  FileCheck,
  Star,
  AlertCircle,
  Award,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const TechnicianPerformance = () => {
  const [loading, setLoading] = useState(true)
  const [technicians, setTechnicians] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null)
  const [performance, setPerformance] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [selectedPeriod])

  const loadData = async () => {
    try {
      setLoading(true)

      const [techRes, perfRes] = await Promise.all([
        supabase
          .from('employees')
          .select('*')
          .eq('active', true)
          .order('name'),

        supabase
          .from('v_technician_performance_public')
          .select('*')
          .order('completion_rate', { ascending: false })
      ])

      setTechnicians(techRes.data || [])
      setPerformance(perfRes.data || [])

    } catch (err) {
      console.error('Error loading performance data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTopPerformers = () => {
    return performance.slice(0, 3)
  }

  const getTechnicianPerformance = (employeeId: string) => {
    return performance.find(p => p.employee_id === employeeId) || {}
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50'
    if (rate >= 70) return 'text-blue-600 bg-blue-50'
    if (rate >= 50) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados de desempenho...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Desempenho - Técnicos
          </h1>
          <p className="text-gray-600">
            Acompanhe métricas de produtividade, qualidade e satisfação
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="current_week">Semana Atual</option>
                <option value="current_month">Mês Atual</option>
                <option value="last_month">Mês Anterior</option>
                <option value="current_quarter">Trimestre Atual</option>
                <option value="current_year">Ano Atual</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Técnico
              </label>
              <select
                value={selectedTechnician || ''}
                onChange={(e) => setSelectedTechnician(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os Técnicos</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            Top 3 Performers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getTopPerformers().map((perf, index) => (
              <motion.div
                key={perf.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
                  index === 0 ? 'border-yellow-400' :
                  index === 1 ? 'border-gray-400' :
                  'border-orange-400'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      'bg-orange-100 text-orange-600'
                    } font-bold text-xl`}>
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{perf.technician_name}</h3>
                      <p className="text-sm text-gray-500">Técnico</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taxa de Conclusão</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(perf.completion_rate)}`}>
                      {perf.completion_rate}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">OS Concluídas</span>
                    <span className="font-semibold text-gray-900">
                      {perf.total_os_completed}/{perf.total_os_assigned}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avaliação Média</span>
                    <div className="flex items-center gap-1">
                      {getRatingStars(Math.round(perf.avg_customer_rating || 0))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">OS Concluídas</h3>
            <p className="text-2xl font-bold text-gray-900">
              {performance.reduce((acc, p) => acc + (p.total_os_completed || 0), 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              De {performance.reduce((acc, p) => acc + (p.total_os_assigned || 0), 0)} atribuídas
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <FileCheck className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Taxa de Checklist</h3>
            <p className="text-2xl font-bold text-gray-900">
              {performance.length > 0
                ? Math.round(performance.reduce((acc, p) => acc + (p.checklist_completion_rate || 0), 0) / performance.length)
                : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {performance.reduce((acc, p) => acc + (p.total_checklists_completed || 0), 0)} completos
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Fotos Enviadas</h3>
            <p className="text-2xl font-bold text-gray-900">
              {performance.reduce((acc, p) => acc + (p.total_photos_submitted || 0), 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Relatórios fotográficos
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Horas Trabalhadas</h3>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(performance.reduce((acc, p) => acc + (p.total_hours_worked || 0), 0))}h
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Tempo total produtivo
            </p>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Desempenho Detalhado por Técnico
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnico
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OS Concluídas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxa Conclusão
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No Prazo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Checklist
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fotos
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assinaturas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avaliação
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {technicians.map(tech => {
                  const perf = getTechnicianPerformance(tech.id)
                  return (
                    <tr key={tech.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {tech.name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{tech.name}</p>
                            <p className="text-xs text-gray-500">{tech.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {perf.total_os_completed || 0}
                        </span>
                        <span className="text-xs text-gray-500">
                          /{perf.total_os_assigned || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(perf.completion_rate || 0)}`}>
                          {perf.completion_rate || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm">
                          <span className="text-green-600 font-medium">{perf.on_time_completion || 0}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-red-600 font-medium">{perf.late_completion || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">
                          {perf.checklist_completion_rate || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">
                          {perf.total_photos_submitted || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">
                          {perf.total_signatures_collected || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getRatingStars(Math.round(perf.avg_customer_rating || 0))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">
                          {Math.round(perf.total_hours_worked || 0)}h
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Excelente Desempenho</h3>
                <p className="text-sm text-green-700">
                  {performance.filter(p => (p.completion_rate || 0) >= 90).length} técnicos acima de 90%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">Atenção Necessária</h3>
                <p className="text-sm text-yellow-700">
                  {performance.filter(p => (p.completion_rate || 0) < 70 && (p.completion_rate || 0) >= 50).length} técnicos entre 50-70%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Requer Ação Imediata</h3>
                <p className="text-sm text-red-700">
                  {performance.filter(p => (p.completion_rate || 0) < 50).length} técnicos abaixo de 50%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TechnicianPerformance
