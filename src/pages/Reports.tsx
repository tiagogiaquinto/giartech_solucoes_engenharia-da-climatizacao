import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, 
  Calendar, 
  Download, 
  FileText, 
  Printer,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ClipboardList,
  Search,
  Filter,
  ChevronDown,
  Edit,
  Save,
  X,
  Eye,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend as ChartLegend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
)

const Reports = () => {
  const { isAdmin } = useUser()
  const [reportType, setReportType] = useState('service-orders')
  const [dateRange, setDateRange] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showCharts, setShowCharts] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingChart, setEditingChart] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const reportTypes = [
    { id: 'service-orders', name: 'Ordens de Serviço', icon: ClipboardList, adminOnly: false },
    { id: 'inventory', name: 'Movimentação de Estoque', icon: Package, adminOnly: false },
    { id: 'technicians', name: 'Desempenho de Técnicos', icon: Users, adminOnly: true },
    { id: 'financial', name: 'Relatório Financeiro', icon: DollarSign, adminOnly: true }
  ]

  const filteredReportTypes = reportTypes.filter(type => !type.adminOnly || (type.adminOnly && isAdmin))

  const handleGenerateReport = () => {
    console.log('Generating report:', {
      type: reportType,
      dateRange,
      startDate,
      endDate
    })
    
    // In a real app, you would call your API to generate the report
    setShowCharts(true)
  }

  const handleExport = (format: string) => {
    console.log(`Exporting report as ${format}`)
    
    // In a real app, you would call your API to export the report
    alert(`Relatório exportado como ${format}`)
  }

  // Sample data for charts
  const financialData = [
    { month: 'Jan', income: 12500, expense: 8200 },
    { month: 'Fev', income: 14800, expense: 9100 },
    { month: 'Mar', income: 13200, expense: 8700 },
    { month: 'Abr', income: 15850, expense: 9320 },
    { month: 'Mai', income: 16200, expense: 9800 },
    { month: 'Jun', income: 17500, expense: 10200 }
  ]

  const projectData = [
    { name: 'Concluídos', value: 5 },
    { name: 'Em Progresso', value: 6 },
    { name: 'Planejados', value: 1 }
  ]

  const transactionData = [
    { name: 'Serviços', value: 15850 },
    { name: 'Materiais', value: 4200 },
    { name: 'Administrativo', value: 3000 },
    { name: 'Folha de Pagamento', value: 8500 }
  ]

  // Chart.js data
  const barChartData = {
    labels: financialData.map(item => item.month),
    datasets: [
      {
        label: 'Receitas',
        data: financialData.map(item => item.income),
        backgroundColor: 'rgba(74, 222, 128, 0.6)',
        borderColor: 'rgb(74, 222, 128)',
        borderWidth: 1
      },
      {
        label: 'Despesas',
        data: financialData.map(item => item.expense),
        backgroundColor: 'rgba(248, 113, 113, 0.6)',
        borderColor: 'rgb(248, 113, 113)',
        borderWidth: 1
      }
    ]
  }

  const pieChartData = {
    labels: projectData.map(item => item.name),
    datasets: [
      {
        data: projectData.map(item => item.value),
        backgroundColor: [
          'rgba(74, 222, 128, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(139, 92, 246, 0.6)'
        ],
        borderColor: [
          'rgb(74, 222, 128)',
          'rgb(59, 130, 246)',
          'rgb(139, 92, 246)'
        ],
        borderWidth: 1
      }
    ]
  }

  const lineChartData = {
    labels: financialData.map(item => item.month),
    datasets: [
      {
        label: 'Receitas',
        data: financialData.map(item => item.income),
        borderColor: 'rgb(74, 222, 128)',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Despesas',
        data: financialData.map(item => item.expense),
        borderColor: 'rgb(248, 113, 113)',
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  }

  // Pagination for reports
  const reportsPerPage = 5
  const recentReports = [
    { id: 1, name: 'Relatório de OS - Dezembro 2023', type: 'Ordens de Serviço', date: '2023-12-15', user: 'Admin Demo' },
    { id: 2, name: 'Movimentação de Estoque - Dezembro 2023', type: 'Estoque', date: '2023-12-14', user: 'Admin Demo' },
    { id: 3, name: 'Desempenho de Técnicos - Novembro 2023', type: 'Desempenho', date: '2023-12-01', user: 'Admin Demo' },
    { id: 4, name: 'Relatório Financeiro - Dezembro 2023', type: 'Financeiro', date: '2023-12-31', user: 'Admin Demo' },
    { id: 5, name: 'Análise de Clientes - Dezembro 2023', type: 'Clientes', date: '2023-12-20', user: 'Admin Demo' },
    { id: 6, name: 'Relatório de OS - Novembro 2023', type: 'Ordens de Serviço', date: '2023-11-30', user: 'Admin Demo' },
    { id: 7, name: 'Movimentação de Estoque - Novembro 2023', type: 'Estoque', date: '2023-11-29', user: 'Admin Demo' },
    { id: 8, name: 'Desempenho de Técnicos - Outubro 2023', type: 'Desempenho', date: '2023-11-01', user: 'Admin Demo' },
    { id: 9, name: 'Relatório Financeiro - Novembro 2023', type: 'Financeiro', date: '2023-11-30', user: 'Admin Demo' },
    { id: 10, name: 'Análise de Clientes - Novembro 2023', type: 'Clientes', date: '2023-11-20', user: 'Admin Demo' }
  ]
  
  const pageCount = Math.ceil(recentReports.length / reportsPerPage)
  const paginatedReports = recentReports.slice(
    currentPage * reportsPerPage, 
    (currentPage + 1) * reportsPerPage
  )

  const [editingChartData, setEditingChartData] = useState<any>(null)
  const [editingChartType, setEditingChartType] = useState<string>('bar')

  const startEditingChart = (chartType: string, data: any) => {
    setEditingChartData(JSON.parse(JSON.stringify(data)))
    setEditingChartType(chartType)
    setShowEditModal(true)
  }

  const handleChartDataChange = (index: number, field: string, value: string) => {
    if (!editingChartData) return
    
    const newData = { ...editingChartData }
    
    if (field === 'label') {
      newData.labels[index] = value
    } else {
      const datasetIndex = parseInt(field.split('-')[1])
      const dataField = field.split('-')[2]
      
      if (dataField === 'label') {
        newData.datasets[datasetIndex].label = value
      } else if (dataField === 'data') {
        newData.datasets[datasetIndex].data[index] = parseFloat(value) || 0
      }
    }
    
    setEditingChartData(newData)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900">48</h3>
          <p className="text-sm text-gray-600">Ordens de Serviço</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900">156</h3>
          <p className="text-sm text-gray-600">Itens em Estoque</p>
        </motion.div>
        
        {isAdmin && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">8</h3>
              <p className="text-sm text-gray-600">Técnicos Ativos</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">R$ 15.850</h3>
              <p className="text-sm text-gray-600">Faturamento Mensal</p>
            </motion.div>
          </>
        )}
      </div>

      {/* Report Generator */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                Gerador de Relatórios
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Report Options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Relatório
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {filteredReportTypes.map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setReportType(type.id)}
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                            reportType === type.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <type.icon className="h-5 w-5" />
                          <span className="text-sm">{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setDateRange('week')}
                        className={`p-3 rounded-lg border-2 transition-colors text-sm ${
                          dateRange === 'week'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        Última Semana
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateRange('month')}
                        className={`p-3 rounded-lg border-2 transition-colors text-sm ${
                          dateRange === 'month'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        Último Mês
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateRange('custom')}
                        className={`p-3 rounded-lg border-2 transition-colors text-sm ${
                          dateRange === 'custom'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        Personalizado
                      </button>
                    </div>
                  </div>
                  
                  {dateRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data Inicial
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={dateRange === 'custom'}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data Final
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={dateRange === 'custom'}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleGenerateReport}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center"
                    >
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Gerar Relatório
                    </button>
                  </div>
                </div>
                
                {/* Report Preview */}
                <div className="bg-gray-50 rounded-lg p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Pré-visualização</h3>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleExport('pdf')}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        title="Exportar como PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('excel')}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Exportar como Excel"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('print')}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Imprimir"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                    {showCharts ? (
                      <div className="w-full h-full">
                        <div className="h-40 w-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                          <Bar 
                            data={barChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                },
                                title: {
                                  display: true,
                                  text: 'Receitas vs Despesas'
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">Selecione as opções e gere o relatório</p>
                        <p className="text-sm text-gray-400">A pré-visualização aparecerá aqui</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts Section */}
      {showCharts && (
        <div className="space-y-6">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Receitas vs Despesas</h3>
              <button
                onClick={() => startEditingChart('bar', barChartData)}
                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </button>
            </div>
            <div className="h-80">
              <Bar 
                data={barChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Receitas vs Despesas'
                    }
                  }
                }}
              />
            </div>
          </motion.div>

          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tendência de Fluxo de Caixa</h3>
              <button
                onClick={() => startEditingChart('line', lineChartData)}
                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </button>
            </div>
            <div className="h-80">
              <Line 
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Tendência de Fluxo de Caixa'
                    }
                  }
                }}
              />
            </div>
          </motion.div>

          {/* Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Status dos Projetos</h3>
                <button
                  onClick={() => startEditingChart('pie', pieChartData)}
                  className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
              </div>
              <div className="h-64">
                <Pie 
                  data={pieChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Status dos Projetos'
                      }
                    }
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Categorias de Transações</h3>
                <button
                  onClick={() => startEditingChart('pie', pieChartData)}
                  className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
              </div>
              <div className="h-64">
                <Pie 
                  data={{
                    labels: transactionData.map(item => item.name),
                    datasets: [
                      {
                        data: transactionData.map(item => item.value),
                        backgroundColor: [
                          'rgba(74, 222, 128, 0.6)',
                          'rgba(59, 130, 246, 0.6)',
                          'rgba(139, 92, 246, 0.6)',
                          'rgba(248, 113, 113, 0.6)'
                        ],
                        borderColor: [
                          'rgb(74, 222, 128)',
                          'rgb(59, 130, 246)',
                          'rgb(139, 92, 246)',
                          'rgb(248, 113, 113)'
                        ],
                        borderWidth: 1
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Categorias de Transações'
                      }
                    }
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Recent Reports */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-500" />
          Relatórios Recentes
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gerado por
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{report.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{report.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{new Date(report.date).toLocaleDateString('pt-BR')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{report.user}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg ${
                currentPage === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>
            
            <div className="text-sm text-gray-600">
              Página {currentPage + 1} de {pageCount}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(pageCount - 1, prev + 1))}
              disabled={currentPage === pageCount - 1}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg ${
                currentPage === pageCount - 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span>Próximo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Edit Chart Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Editar Gráfico</h2>
                <button onClick={() => setShowEditModal(false)}>
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Gráfico
                    </label>
                    <select
                      value={editingChartType}
                      onChange={(e) => setEditingChartType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="bar">Barras</option>
                      <option value="line">Linhas</option>
                      <option value="pie">Pizza</option>
                      <option value="area">Área</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estilo
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>Padrão</option>
                      <option>Gradiente</option>
                      <option>Monocromático</option>
                      <option>Pastel</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dados do Gráfico
                  </label>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mês
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Receitas
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Despesas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {financialData.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                defaultValue={item.month}
                                onChange={(e) => handleChartDataChange(index, 'label', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                defaultValue={item.income}
                                onChange={(e) => handleChartDataChange(index, '0-data', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                defaultValue={item.expense}
                                onChange={(e) => handleChartDataChange(index, '1-data', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visualização
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg h-64">
                    {editingChartType === 'bar' && (
                      <Bar 
                        data={barChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            title: {
                              display: true,
                              text: 'Receitas vs Despesas'
                            }
                          }
                        }}
                      />
                    )}
                    {editingChartType === 'line' && (
                      <Line 
                        data={lineChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            title: {
                              display: true,
                              text: 'Tendência de Fluxo de Caixa'
                            }
                          }
                        }}
                      />
                    )}
                    {editingChartType === 'pie' && (
                      <Pie 
                        data={pieChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            title: {
                              display: true,
                              text: 'Status dos Projetos'
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    alert('Alterações salvas com sucesso!')
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Reports