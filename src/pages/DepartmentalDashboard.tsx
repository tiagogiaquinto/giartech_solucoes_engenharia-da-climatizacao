import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChartBar as BarChart3, ChartPie as PieChart, TrendingUp, Users, Clock, CircleCheck as CheckCircle, ListFilter as Filter, Download, Calendar, RefreshCw, ArrowRight, ArrowDown, ArrowUp, Zap, Star, TriangleAlert as AlertTriangle, X, Printer, FileText, Mail, Loader } from 'lucide-react'
import DonutChart from '../components/charts/DonutChart'
import BarChartComponent from '../components/charts/BarChartComponent'
import ComparisonChart from '../components/charts/ComparisonChart'
import DepartmentCard from '../components/DepartmentCard'
import { AnimatePresence } from 'framer-motion'
import AlertsList from '../components/alerts/AlertsList'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Tipos
interface Department {
  id: string
  name: string
  color: string
  metrics: {
    productivity: number
    efficiency: number
    quality: number
    satisfaction: number
  }
  performance: {
    current: number
    previous: number
    change: number
  }
}

interface Alert {
  id: string
  departmentId: string
  title: string
  description: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
  status: 'new' | 'viewed' | 'resolved'
}

interface ScheduledReport {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  format: 'pdf' | 'excel'
  recipients: string[]
  nextDate: string
}

const DepartmentalDashboard = () => {
  const dashboardRef = useRef<HTMLDivElement>(null)
  
  const [selectedDepartment, setSelectedDepartment] = useState<string | 'all'>('all')
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'quarter'>('month')
  const [metricType, setMetricType] = useState<'productivity' | 'efficiency' | 'quality' | 'satisfaction'>('productivity')
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [showAlerts, setShowAlerts] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel'>('pdf')
  const [reportRecipients, setReportRecipients] = useState('')
  const [reportFrequency, setReportFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Relatório Semanal de Desempenho',
      frequency: 'weekly',
      format: 'pdf',
      recipients: ['admin@example.com'],
      nextDate: '2024-01-25'
    }
  ])
  const [showGeneratingIndicator, setShowGeneratingIndicator] = useState(false)
  const [generatingProgress, setGeneratingProgress] = useState(0)

  // Dados simulados
  const departments: Department[] = [
    {
      id: 'operations',
      name: 'Operacional',
      color: '#3b82f6', // blue
      metrics: {
        productivity: 87,
        efficiency: 82,
        quality: 90,
        satisfaction: 85
      },
      performance: {
        current: 87,
        previous: 82,
        change: 5
      }
    },
    {
      id: 'commercial',
      name: 'Comercial',
      color: '#10b981', // green
      metrics: {
        productivity: 92,
        efficiency: 88,
        quality: 85,
        satisfaction: 91
      },
      performance: {
        current: 92,
        previous: 89,
        change: 3
      }
    },
    {
      id: 'financial',
      name: 'Financeiro',
      color: '#8b5cf6', // purple
      metrics: {
        productivity: 95,
        efficiency: 93,
        quality: 97,
        satisfaction: 89
      },
      performance: {
        current: 95,
        previous: 92,
        change: 3
      }
    },
    {
      id: 'administrative',
      name: 'Administrativo',
      color: '#f59e0b', // amber
      metrics: {
        productivity: 89,
        efficiency: 91,
        quality: 93,
        satisfaction: 88
      },
      performance: {
        current: 89,
        previous: 90,
        change: -1
      }
    },
    {
      id: 'technical',
      name: 'Técnico',
      color: '#ef4444', // red
      metrics: {
        productivity: 83,
        efficiency: 85,
        quality: 88,
        satisfaction: 82
      },
      performance: {
        current: 83,
        previous: 80,
        change: 3
      }
    }
  ]

  // Alertas simulados
  const alerts: Alert[] = [
    {
      id: 'alert1',
      departmentId: 'operations',
      title: 'Queda na produtividade',
      description: 'A produtividade do departamento operacional caiu 5% nas últimas 24 horas.',
      timestamp: '2024-01-15T10:30:00',
      severity: 'medium',
      status: 'new'
    },
    {
      id: 'alert2',
      departmentId: 'technical',
      title: 'Atraso em atendimentos',
      description: 'O tempo médio de atendimento está acima da meta estabelecida.',
      timestamp: '2024-01-15T09:15:00',
      severity: 'high',
      status: 'new'
    },
    {
      id: 'alert3',
      departmentId: 'commercial',
      title: 'Meta de vendas atingida',
      description: 'O departamento comercial atingiu 100% da meta mensal antes do prazo.',
      timestamp: '2024-01-14T16:45:00',
      severity: 'low',
      status: 'viewed'
    }
  ]

  // Dados para gráficos
  const getServiceTypeData = () => {
    return [
      { name: 'Instalações', value: 35, color: '#3b82f6' },
      { name: 'Manutenções', value: 40, color: '#10b981' },
      { name: 'Reparos', value: 25, color: '#f59e0b' }
    ]
  }

  const getResolutionRateData = () => {
    return [
      { name: '1ª Visita', value: 65, color: '#10b981' },
      { name: '2ª Visita', value: 25, color: '#f59e0b' },
      { name: '3+ Visitas', value: 10, color: '#ef4444' }
    ]
  }

  const getTechnicianPerformanceData = () => {
    return [
      { name: 'Carlos', value: 92, color: '#3b82f6' },
      { name: 'Ana', value: 88, color: '#8b5cf6' },
      { name: 'Pedro', value: 85, color: '#10b981' },
      { name: 'Maria', value: 91, color: '#f59e0b' },
      { name: 'João', value: 78, color: '#ef4444' }
    ]
  }

  const getDepartmentComparisonData = () => {
    return departments.map(dept => ({
      name: dept.name,
      current: dept.metrics[metricType],
      previous: dept.metrics[metricType] - (Math.random() * 10 - 5),
      color: dept.color
    }))
  }

  // Simular carregamento de dados
  const refreshData = () => {
    setIsLoading(true)
    
    // Simular delay de rede
    setTimeout(() => {
      setLastUpdate(new Date())
      setIsLoading(false)
    }, 1000)
  }

  // Manipuladores de eventos
  const handleResolveAlert = (alertId: string) => {
    console.log('Resolvendo alerta:', alertId)
    // Implementar lógica de resolução
  }

  const handleEscalateAlert = (alertId: string) => {
    console.log('Escalando alerta:', alertId)
    // Implementar lógica de escalação
  }

  const handleIgnoreAlert = (alertId: string) => {
    console.log('Ignorando alerta:', alertId)
    // Implementar lógica de ignorar
  }

  // Gerar PDF do dashboard
  const generatePDF = async () => {
    if (!dashboardRef.current) return
    
    setIsGeneratingPDF(true)
    setShowGeneratingIndicator(true)
    setGeneratingProgress(10)
    
    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setGeneratingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)
      
      // Capturar o conteúdo do dashboard
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 1,
        useCORS: true,
        logging: false
      })
      
      setGeneratingProgress(95)
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // Adicionar cabeçalho
      pdf.setFillColor(59, 130, 246) // Azul
      pdf.rect(0, 0, pdf.internal.pageSize.width, 20, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(14)
      pdf.text('Dashboard Departamental - GiarTech', 10, 10)
      pdf.setFontSize(10)
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, 16)
      
      // Adicionar imagem do dashboard
      const imgWidth = pdf.internal.pageSize.width
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 25, imgWidth, imgHeight)
      
      // Salvar PDF
      pdf.save('dashboard-departamental.pdf')
      
      setGeneratingProgress(100)
      
      // Limpar após um tempo
      setTimeout(() => {
        setIsGeneratingPDF(false)
        setShowGeneratingIndicator(false)
        setGeneratingProgress(0)
      }, 1000)
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      setIsGeneratingPDF(false)
      setShowGeneratingIndicator(false)
      alert('Erro ao gerar PDF. Tente novamente.')
    }
  }

  // Gerar Excel
  const generateExcel = () => {
    setShowGeneratingIndicator(true)
    setGeneratingProgress(10)
    
    // Simular progresso
    const progressInterval = setInterval(() => {
      setGeneratingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)
    
    // Simular geração de Excel
    setTimeout(() => {
      setGeneratingProgress(100)
      
      // Em um app real, aqui você geraria o Excel e faria o download
      alert('Relatório Excel gerado com sucesso!')
      
      // Limpar após um tempo
      setTimeout(() => {
        setShowGeneratingIndicator(false)
        setGeneratingProgress(0)
      }, 1000)
    }, 1500)
  }

  // Imprimir dashboard
  const printDashboard = () => {
    setShowGeneratingIndicator(true)
    setGeneratingProgress(50)
    
    setTimeout(() => {
      setGeneratingProgress(100)
      window.print()
      
      // Limpar após um tempo
      setTimeout(() => {
        setShowGeneratingIndicator(false)
        setGeneratingProgress(0)
      }, 1000)
    }, 1000)
  }

  // Agendar relatório
  const scheduleReport = () => {
    if (!reportRecipients) {
      alert('Por favor, informe pelo menos um destinatário')
      return
    }
    
    const recipients = reportRecipients.split(',').map(email => email.trim())
    
    // Calcular próxima data com base na frequência
    const nextDate = new Date()
    if (reportFrequency === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1)
    } else if (reportFrequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7)
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1)
    }
    
    const newScheduledReport: ScheduledReport = {
      id: Date.now().toString(),
      name: `Relatório ${reportFrequency === 'daily' ? 'Diário' : reportFrequency === 'weekly' ? 'Semanal' : 'Mensal'} - ${selectedDepartment === 'all' ? 'Todos Departamentos' : departments.find(d => d.id === selectedDepartment)?.name}`,
      frequency: reportFrequency,
      format: reportFormat,
      recipients,
      nextDate: nextDate.toISOString().split('T')[0]
    }
    
    setScheduledReports([...scheduledReports, newScheduledReport])
    setShowScheduleModal(false)
    setReportRecipients('')
    
    alert('Relatório agendado com sucesso!')
  }

  return (
    <div ref={dashboardRef} className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center md:text-left">
              Dashboard Departamental
            </h1>
            <p className="text-gray-600 text-center md:text-left">
              Análise de desempenho por departamento
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Período:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="day">Hoje</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mês</option>
                <option value="quarter">Este Trimestre</option>
              </select>
            </div>
            
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
            
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                showAlerts 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Alertas</span>
              <div className="w-5 h-5 bg-white text-yellow-700 rounded-full flex items-center justify-center text-xs font-bold">
                {alerts.length}
              </div>
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 text-center mt-2">
          Última atualização: {lastUpdate.toLocaleString('pt-BR')}
        </div>
      </motion.div>

      {/* Alertas */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Alertas</h2>
              <button
                onClick={() => setShowAlerts(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <AlertsList
              alerts={alerts}
              departments={departments}
              onResolve={handleResolveAlert}
              onEscalate={handleEscalateAlert}
              onIgnore={handleIgnoreAlert}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seletor de Departamentos */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Departamentos</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
              selectedDepartment === 'all'
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedDepartment('all')}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-2">
                <Users className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-medium text-gray-900">Todos</h3>
              <p className="text-xs text-gray-500 mt-1">Visão Geral</p>
              
              <div className="mt-2 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '90%' }}></div>
              </div>
              <div className="flex justify-between w-full mt-1">
                <span className="text-xs text-gray-500">Performance</span>
                <span className="text-xs font-medium text-gray-900">90%</span>
              </div>
            </div>
          </motion.div>
          
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              id={dept.id}
              name={dept.name}
              color={dept.color}
              metrics={dept.metrics}
              performance={dept.performance}
              isSelected={selectedDepartment === dept.id}
              onClick={() => setSelectedDepartment(dept.id)}
            />
          ))}
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: 'Produtividade', 
            value: selectedDepartment === 'all' 
              ? '89%' 
              : `${departments.find(d => d.id === selectedDepartment)?.metrics.productivity || 0}%`,
            change: '+3.5%',
            icon: Zap,
            color: 'from-blue-500 to-blue-600'
          },
          { 
            title: 'Eficiência', 
            value: selectedDepartment === 'all' 
              ? '87%' 
              : `${departments.find(d => d.id === selectedDepartment)?.metrics.efficiency || 0}%`,
            change: '+2.1%',
            icon: TrendingUp,
            color: 'from-green-500 to-green-600'
          },
          { 
            title: 'Qualidade', 
            value: selectedDepartment === 'all' 
              ? '91%' 
              : `${departments.find(d => d.id === selectedDepartment)?.metrics.quality || 0}%`,
            change: '+4.2%',
            icon: Star,
            color: 'from-purple-500 to-purple-600'
          },
          { 
            title: 'Satisfação', 
            value: selectedDepartment === 'all' 
              ? '87%' 
              : `${departments.find(d => d.id === selectedDepartment)?.metrics.satisfaction || 0}%`,
            change: '+1.8%',
            icon: CheckCircle,
            color: 'from-amber-500 to-amber-600'
          }
        ].map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 bg-gradient-to-r ${kpi.color} rounded-lg flex items-center justify-center`}>
                <kpi.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                <ArrowUp className="h-3 w-3 text-green-500" />
                <span className="text-xs font-medium text-green-600">{kpi.change}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
            <p className="text-sm text-gray-600">{kpi.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Gráficos - Layout Responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Tipo de Serviço */}
        <DonutChart
          data={getServiceTypeData()}
          title="Tipo de Serviço"
          subtitle="Distribuição por categoria"
        />
        
        {/* Gráfico de Taxa de Resolução */}
        <DonutChart
          data={getResolutionRateData()}
          title="Taxa de Resolução"
          subtitle="Resolução por número de visitas"
        />
        
        {/* Gráfico de Desempenho de Técnicos */}
        <BarChartComponent
          data={getTechnicianPerformanceData()}
          title="Desempenho de Técnicos"
          subtitle="Produtividade individual"
          suffix="%"
        />
        
        {/* Gráfico de Comparação de Departamentos */}
        <ComparisonChart
          data={getDepartmentComparisonData()}
          title="Comparação de Departamentos"
          subtitle="Atual vs. Período Anterior"
          metricType={metricType}
          onMetricChange={(metric: string) => setMetricType(metric as 'productivity' | 'efficiency' | 'quality' | 'satisfaction')}
        />
      </div>

      {/* Métricas Operacionais */}
      {selectedDepartment === 'operations' || selectedDepartment === 'all' ? (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Métricas Operacionais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Tempo Médio de Atendimento</h3>
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-blue-600">1h 45m</div>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowDown className="h-4 w-4 mr-1" />
                  <span>-12%</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">Meta: 2h 00m</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Atendimentos Realizados</h3>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-green-600">248</div>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>+8%</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">Meta: 230</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Satisfação do Cliente</h3>
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-purple-600">4.8</div>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>+0.2</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">Meta: 4.5</p>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Atendimentos por Tipo</h3>
              <div className="space-y-3">
                {[
                  { label: 'Instalações', value: 87, total: 95, color: '#3b82f6' },
                  { label: 'Manutenções Preventivas', value: 102, total: 110, color: '#10b981' },
                  { label: 'Reparos/Corretivas', value: 59, total: 65, color: '#f59e0b' }
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.value}/{item.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${(item.value / item.total) * 100}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Produtividade por Equipe</h3>
              <div className="space-y-3">
                {[
                  { label: 'Equipe A', value: 92, color: '#3b82f6' },
                  { label: 'Equipe B', value: 87, color: '#10b981' },
                  { label: 'Equipe C', value: 78, color: '#f59e0b' },
                  { label: 'Equipe D', value: 85, color: '#8b5cf6' }
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${item.value}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Ações de Relatório */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Relatórios</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex flex-col items-center justify-center space-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="h-8 w-8 text-red-600" />
            <span className="text-sm font-medium text-gray-900">Baixar PDF</span>
            <span className="text-xs text-gray-500">Relatório completo em PDF</span>
          </button>
          
          <button 
            onClick={generateExcel}
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex flex-col items-center justify-center space-y-2"
          >
            <FileText className="h-8 w-8 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Exportar Excel</span>
            <span className="text-xs text-gray-500">Dados em formato Excel</span>
          </button>
          
          <button 
            onClick={printDashboard}
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex flex-col items-center justify-center space-y-2"
          >
            <Printer className="h-8 w-8 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Imprimir</span>
            <span className="text-xs text-gray-500">Versão para impressão</span>
          </button>
          
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex flex-col items-center justify-center space-y-2"
          >
            <Calendar className="h-8 w-8 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Agendar</span>
            <span className="text-xs text-gray-500">Envio automático por email</span>
          </button>
        </div>
        
        {/* Relatórios Agendados */}
        {scheduledReports.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Relatórios Agendados</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequência</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formato</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próximo Envio</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scheduledReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{report.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {report.frequency === 'daily' ? 'Diário' : 
                         report.frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {report.format.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.nextDate).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Indicador de Geração de Relatório */}
      <AnimatePresence>
        {showGeneratingIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Gerando Relatório</h3>
              {generatingProgress === 100 && (
                <button 
                  onClick={() => setShowGeneratingIndicator(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3 mb-2">
              {generatingProgress < 100 ? (
                <Loader className="h-5 w-5 text-blue-500 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${generatingProgress}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">{generatingProgress}%</span>
            </div>
            
            <p className="text-xs text-gray-500">
              {generatingProgress < 100 
                ? 'Processando dados e gerando relatório...' 
                : 'Relatório gerado com sucesso!'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Agendamento */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScheduleModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Agendar Relatório</h2>
                <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequência
                  </label>
                  <select
                    value={reportFrequency}
                    onChange={(e) => setReportFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formato
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={reportFormat === 'pdf'}
                        onChange={() => setReportFormat('pdf')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>PDF</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={reportFormat === 'excel'}
                        onChange={() => setReportFormat('excel')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Excel</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatários (separados por vírgula)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={reportRecipients}
                      onChange={(e) => setReportRecipients(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@exemplo.com, outro@exemplo.com"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center text-blue-700 mb-2">
                    <Calendar className="h-5 w-5 mr-2" />
                    <h3 className="font-medium">Informações do Relatório</h3>
                  </div>
                  <p className="text-sm text-blue-600">
                    O relatório será enviado automaticamente na frequência selecionada para os destinatários informados.
                    O conteúdo será baseado nos filtros atuais do dashboard.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={scheduleReport}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg"
                >
                  Agendar Relatório
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DepartmentalDashboard