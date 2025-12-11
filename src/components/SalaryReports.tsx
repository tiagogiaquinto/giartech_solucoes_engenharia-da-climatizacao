import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  FileText
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MonthlySalaryData {
  month: string
  total_base: number
  total_bonuses: number
  total_discounts: number
  total_gross: number
  total_paid: number
  total_remaining: number
  employee_count: number
}

interface EmployeeSalaryData {
  employee_id: string
  employee_name: string
  current_salary: number
  total_months: number
  total_gross: number
  total_paid: number
  total_remaining: number
  months_pending: number
  months_partial: number
  months_paid: number
}

const SalaryReports = () => {
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [monthlyData, setMonthlyData] = useState<MonthlySalaryData[]>([])
  const [employeeData, setEmployeeData] = useState<EmployeeSalaryData[]>([])
  const [yearlyStats, setYearlyStats] = useState({
    totalPaid: 0,
    totalRemaining: 0,
    averageMonthly: 0,
    employeeCount: 0
  })

  useEffect(() => {
    loadReports()
  }, [selectedYear])

  const loadReports = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadMonthlyData(),
        loadEmployeeData(),
        loadYearlyStats()
      ])
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMonthlyData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_yearly_salary_report', {
        p_year: selectedYear
      })

      if (error) throw error

      const startDate = startOfYear(new Date(selectedYear, 0, 1))
      const endDate = endOfYear(new Date(selectedYear, 11, 31))
      const months = eachMonthOfInterval({ start: startDate, end: endDate })

      const monthlyMap = new Map<string, MonthlySalaryData>()

      months.forEach(month => {
        const monthKey = format(month, 'yyyy-MM')
        monthlyMap.set(monthKey, {
          month: monthKey,
          total_base: 0,
          total_bonuses: 0,
          total_discounts: 0,
          total_gross: 0,
          total_paid: 0,
          total_remaining: 0,
          employee_count: 0
        })
      })

      data?.forEach(item => {
        monthlyMap.set(item.month, {
          month: item.month,
          total_base: Number(item.total_base),
          total_bonuses: Number(item.total_bonuses),
          total_discounts: Number(item.total_discounts),
          total_gross: Number(item.total_gross),
          total_paid: Number(item.total_paid),
          total_remaining: Number(item.total_remaining),
          employee_count: item.employee_count
        })
      })

      setMonthlyData(Array.from(monthlyMap.values()))
    } catch (error) {
      console.error('Error loading monthly data:', error)
    }
  }

  const loadEmployeeData = async () => {
    try {
      const { data, error } = await supabase
        .from('v_employee_salary_summary')
        .select('*')
        .order('total_remaining', { ascending: false })

      if (error) throw error

      setEmployeeData(data || [])
    } catch (error) {
      console.error('Error loading employee data:', error)
    }
  }

  const loadYearlyStats = async () => {
    try {
      const { data, error } = await supabase
        .from('v_monthly_salary_consolidated')
        .select('total_paid, total_remaining, employee_count')
        .eq('year', selectedYear)

      if (error) throw error

      const totalPaid = data?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
      const totalRemaining = data?.reduce((sum, s) => sum + Number(s.total_remaining), 0) || 0
      const maxEmployees = Math.max(...(data?.map(s => s.employee_count) || [0]))
      const averageMonthly = data && data.length > 0 ? totalPaid / data.length : 0

      setYearlyStats({
        totalPaid,
        totalRemaining,
        averageMonthly,
        employeeCount: maxEmployees
      })
    } catch (error) {
      console.error('Error loading yearly stats:', error)
    }
  }

  const exportToCSV = (type: 'monthly' | 'employee') => {
    let csv = ''
    let filename = ''

    if (type === 'monthly') {
      csv = 'Mês,Salário Base,Bônus,Descontos,Total Bruto,Pago,Restante,Funcionários\n'
      monthlyData.forEach(row => {
        const monthName = format(new Date(row.month + '-01'), 'MMMM yyyy', { locale: ptBR })
        csv += `${monthName},${row.total_base.toFixed(2)},${row.total_bonuses.toFixed(2)},${row.total_discounts.toFixed(2)},${row.total_gross.toFixed(2)},${row.total_paid.toFixed(2)},${row.total_remaining.toFixed(2)},${row.employee_count}\n`
      })
      filename = `relatorio-mensal-salarios-${selectedYear}.csv`
    } else {
      csv = 'Funcionário,Salário Atual,Meses,Total Bruto,Total Pago,Restante,Pendentes,Parciais,Pagos\n'
      employeeData.forEach(row => {
        csv += `${row.employee_name},${row.current_salary.toFixed(2)},${row.total_months},${row.total_gross.toFixed(2)},${row.total_paid.toFixed(2)},${row.total_remaining.toFixed(2)},${row.months_pending},${row.months_partial},${row.months_paid}\n`
      })
      filename = `relatorio-funcionarios-salarios-${selectedYear}.csv`
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios de Salários</h2>
          <p className="text-sm text-gray-600">
            Análises consolidadas de todos os pagamentos (funcionários de simulação excluídos)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-1">Relatório Consolidado</h3>
            <p className="text-sm text-green-800">
              Este relatório resgata <strong>TODOS os valores pagos</strong> nos meses anteriores, incluindo:
            </p>
            <ul className="text-sm text-green-800 mt-2 space-y-1">
              <li>• Pagamentos feitos através do tracking de salários</li>
              <li>• Pagamentos parciais de meses anteriores</li>
              <li>• Lançamentos diretos do financeiro (quando vinculados)</li>
              <li>• Vales e adiantamentos descontados</li>
            </ul>
            <p className="text-sm text-green-800 mt-2">
              <strong>Observação:</strong> Funcionários de simulação/teste foram automaticamente excluídos dos relatórios.
            </p>
          </div>
        </div>
      </div>

      {/* Yearly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Pago {selectedYear}</p>
              <p className="text-2xl font-bold mt-1">
                R$ {yearlyStats.totalPaid.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Restante a Pagar</p>
              <p className="text-2xl font-bold mt-1">
                R$ {yearlyStats.totalRemaining.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Média Mensal</p>
              <p className="text-2xl font-bold mt-1">
                R$ {yearlyStats.averageMonthly.toFixed(2)}
              </p>
            </div>
            <BarChart3 className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Funcionários</p>
              <p className="text-2xl font-bold mt-1">
                {yearlyStats.employeeCount}
              </p>
            </div>
            <Users className="w-10 h-10 opacity-80" />
          </div>
        </div>
      </div>

      {/* Monthly Report */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Relatório Mensal</h3>
          </div>
          <button
            onClick={() => exportToCSV('monthly')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mês</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bônus</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Descontos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bruto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pago</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Restante</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Func.</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.map((row) => (
                <tr key={row.month} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {format(new Date(row.month + '-01'), 'MMMM yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    R$ {row.total_base.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    R$ {row.total_bonuses.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    R$ {row.total_discounts.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    R$ {row.total_gross.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                    R$ {row.total_paid.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                    R$ {row.total_remaining.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {row.employee_count}
                  </td>
                </tr>
              ))}
              {monthlyData.length > 0 && (
                <tr className="bg-gray-100 font-bold">
                  <td className="px-6 py-4 text-sm">TOTAL</td>
                  <td className="px-6 py-4 text-sm text-right">
                    R$ {monthlyData.reduce((sum, r) => sum + r.total_base, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-green-600">
                    R$ {monthlyData.reduce((sum, r) => sum + r.total_bonuses, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-red-600">
                    R$ {monthlyData.reduce((sum, r) => sum + r.total_discounts, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    R$ {monthlyData.reduce((sum, r) => sum + r.total_gross, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-green-600">
                    R$ {monthlyData.reduce((sum, r) => sum + r.total_paid, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-orange-600">
                    R$ {monthlyData.reduce((sum, r) => sum + r.total_remaining, 0).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Report */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Relatório por Funcionário</h3>
          </div>
          <button
            onClick={() => exportToCSV('employee')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funcionário</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Salário Atual</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Meses</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Bruto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Pago</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Restante</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeeData.map((row) => (
                <tr key={row.employee_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.employee_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    R$ {Number(row.current_salary).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {row.total_months}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    R$ {Number(row.total_gross).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                    R$ {Number(row.total_paid).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                    R$ {Number(row.total_remaining).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="flex gap-1 justify-center">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {row.months_paid}✓
                      </span>
                      {row.months_partial > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {row.months_partial}◐
                        </span>
                      )}
                      {row.months_pending > 0 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          {row.months_pending}⏱
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SalaryReports
