import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface ReportData {
  revenue: number
  expenses: number
  profit: number
  serviceOrders: number
  customers: number
  avgTicket: number
}

interface ReportType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'financial' | 'operational' | 'commercial' | 'inventory'
}

export default function ReportsAdvanced() {
  const [reportType, setReportType] = useState<string>('')
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const reportTypes: ReportType[] = [
    {
      id: 'financial',
      name: 'Relatório Financeiro',
      description: 'DRE, Fluxo de Caixa, Contas a Pagar/Receber',
      icon: <DollarSign className="h-6 w-6" />,
      category: 'financial'
    },
    {
      id: 'service_orders',
      name: 'Relatório de OSs',
      description: 'Análise completa de ordens de serviço',
      icon: <FileText className="h-6 w-6" />,
      category: 'operational'
    },
    {
      id: 'sales',
      name: 'Relatório de Vendas',
      description: 'Vendas por cliente, produto e período',
      icon: <TrendingUp className="h-6 w-6" />,
      category: 'commercial'
    },
    {
      id: 'inventory',
      name: 'Relatório de Estoque',
      description: 'Movimentações, inventário e curva ABC',
      icon: <Package className="h-6 w-6" />,
      category: 'inventory'
    },
    {
      id: 'customers',
      name: 'Relatório de Clientes',
      description: 'Análise de base de clientes e performance',
      icon: <Users className="h-6 w-6" />,
      category: 'commercial'
    },
    {
      id: 'performance',
      name: 'Relatório de Performance',
      description: 'KPIs, métricas e análise de desempenho',
      icon: <BarChart3 className="h-6 w-6" />,
      category: 'operational'
    }
  ]

  useEffect(() => {
    if (reportType) {
      loadReportData()
    }
  }, [reportType, startDate, endDate])

  const loadReportData = async () => {
    setLoading(true)
    try {
      const { data: financeData } = await supabase
        .from('finance_entries')
        .select('*')
        .gte('due_date', startDate)
        .lte('due_date', endDate)

      const revenue = financeData
        ?.filter(e => e.type === 'income' && e.status === 'paid')
        .reduce((sum, e) => sum + (e.amount || 0), 0) || 0

      const expenses = financeData
        ?.filter(e => e.type === 'expense' && e.status === 'paid')
        .reduce((sum, e) => sum + (e.amount || 0), 0) || 0

      const { count: osCount } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

      setReportData({
        revenue,
        expenses,
        profit: revenue - expenses,
        serviceOrders: osCount || 0,
        customers: customerCount || 0,
        avgTicket: osCount ? revenue / osCount : 0
      })
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    setGenerating(true)
    try {
      const doc = new jsPDF()

      doc.setFontSize(20)
      doc.setTextColor(37, 99, 235)
      doc.text('Giartech - Relatório Gerencial', 20, 20)

      doc.setFontSize(12)
      doc.setTextColor(100)
      const reportTypeName = reportTypes.find(r => r.id === reportType)?.name || 'Relatório'
      doc.text(reportTypeName, 20, 30)
      doc.text(`Período: ${format(new Date(startDate), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(endDate), 'dd/MM/yyyy', { locale: ptBR })}`, 20, 37)
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, 44)

      doc.setDrawColor(229, 231, 235)
      doc.line(20, 50, 190, 50)

      if (reportData) {
        doc.setFontSize(16)
        doc.setTextColor(0)
        doc.text('Resumo Executivo', 20, 60)

        const summaryData = [
          ['Métrica', 'Valor'],
          ['Receitas', `R$ ${reportData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Despesas', `R$ ${reportData.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Lucro', `R$ ${reportData.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Ordens de Serviço', reportData.serviceOrders.toString()],
          ['Ticket Médio', `R$ ${reportData.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Total de Clientes', reportData.customers.toString()]
        ]

        ;(doc as any).autoTable({
          startY: 65,
          head: [summaryData[0]],
          body: summaryData.slice(1),
          theme: 'grid',
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: 255,
            fontSize: 11,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 10
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          }
        })
      }

      if (reportType === 'financial') {
        const yPos = (doc as any).lastAutoTable.finalY + 15

        doc.setFontSize(16)
        doc.setTextColor(0)
        doc.text('Detalhamento Financeiro', 20, yPos)

        const { data: financeEntries } = await supabase
          .from('finance_entries')
          .select('*')
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .order('due_date', { ascending: false })
          .limit(20)

        if (financeEntries && financeEntries.length > 0) {
          const detailData = financeEntries.map(entry => [
            format(new Date(entry.due_date), 'dd/MM/yyyy'),
            entry.description,
            entry.type === 'income' ? 'Receita' : 'Despesa',
            `R$ ${(entry.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            entry.status === 'paid' ? 'Pago' : entry.status === 'pending' ? 'Pendente' : 'Cancelado'
          ])

          ;(doc as any).autoTable({
            startY: yPos + 5,
            head: [['Data', 'Descrição', 'Tipo', 'Valor', 'Status']],
            body: detailData,
            theme: 'grid',
            headStyles: {
              fillColor: [37, 99, 235],
              textColor: 255,
              fontSize: 10,
              fontStyle: 'bold'
            },
            bodyStyles: {
              fontSize: 9
            },
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 60 },
              2: { cellWidth: 25 },
              3: { cellWidth: 30 },
              4: { cellWidth: 25 }
            }
          })
        }
      }

      if (reportType === 'service_orders') {
        const yPos = (doc as any).lastAutoTable.finalY + 15

        doc.setFontSize(16)
        doc.setTextColor(0)
        doc.text('Ordens de Serviço', 20, yPos)

        const { data: orders } = await supabase
          .from('service_orders')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false })
          .limit(20)

        if (orders && orders.length > 0) {
          const orderData = orders.map(order => [
            order.order_number,
            format(new Date(order.created_at), 'dd/MM/yyyy'),
            order.status === 'pending' ? 'Pendente' :
            order.status === 'in_progress' ? 'Em Andamento' :
            order.status === 'completed' ? 'Concluída' : 'Cancelada',
            `R$ ${(order.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          ])

          ;(doc as any).autoTable({
            startY: yPos + 5,
            head: [['OS', 'Data', 'Status', 'Valor']],
            body: orderData,
            theme: 'grid',
            headStyles: {
              fillColor: [37, 99, 235],
              textColor: 255,
              fontSize: 10,
              fontStyle: 'bold'
            },
            bodyStyles: {
              fontSize: 9
            }
          })
        }
      }

      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(9)
        doc.setTextColor(150)
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }

      const fileName = `relatorio_${reportType}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Erro ao gerar relatório PDF')
    } finally {
      setGenerating(false)
    }
  }

  const exportToCSV = async () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,'

      if (reportType === 'financial') {
        const { data } = await supabase
          .from('finance_entries')
          .select('*')
          .gte('due_date', startDate)
          .lte('due_date', endDate)

        csvContent += 'Data,Descrição,Tipo,Valor,Status\n'
        data?.forEach(entry => {
          csvContent += `${entry.due_date},"${entry.description}",${entry.type},${entry.amount},${entry.status}\n`
        })
      }

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `relatorio_${reportType}_${format(new Date(), 'yyyyMMdd')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios Avançados</h1>
        <p className="text-gray-600 mt-1">Gere relatórios detalhados e análises do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {reportTypes.map((type) => (
          <motion.button
            key={type.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setReportType(type.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              reportType === type.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className={`inline-flex p-2 rounded-lg mb-3 ${
              reportType === type.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {type.icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{type.name}</h3>
            <p className="text-sm text-gray-600">{type.description}</p>
          </motion.button>
        ))}
      </div>

      {reportType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={generatePDF}
                disabled={generating || loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Gerar PDF
                  </>
                )}
              </button>

              <button
                onClick={exportToCSV}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar CSV"
              >
                <FileText className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {reportType && reportData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Preview do Relatório</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Receitas</span>
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                R$ {reportData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">Despesas</span>
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900">
                R$ {reportData.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className={`rounded-lg p-4 ${
              reportData.profit >= 0
                ? 'bg-gradient-to-br from-blue-50 to-blue-100'
                : 'bg-gradient-to-br from-orange-50 to-orange-100'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${
                  reportData.profit >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}>
                  Lucro
                </span>
                <TrendingUp className={`h-4 w-4 ${
                  reportData.profit >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
              </div>
              <p className={`text-2xl font-bold ${
                reportData.profit >= 0 ? 'text-blue-900' : 'text-orange-900'
              }`}>
                R$ {reportData.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-700">Ordens de Serviço</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.serviceOrders}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-700">Ticket Médio</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                R$ {reportData.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-700">Total de Clientes</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.customers}</p>
            </div>
          </div>
        </motion.div>
      )}

      {!reportType && (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecione um Tipo de Relatório
          </h3>
          <p className="text-gray-600">
            Escolha um dos tipos de relatório acima para começar
          </p>
        </div>
      )}
    </div>
  )
}
