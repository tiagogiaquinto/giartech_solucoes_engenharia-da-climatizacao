import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  Clock,
  Calendar,
  Edit2,
  Save,
  X,
  Users,
  TrendingUp,
  RefreshCw,
  Link as LinkIcon,
  Eye
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import FinanceIntegrationPanel from './FinanceIntegrationPanel'
import StandardModal from './StandardModal'

interface EmployeeSalaryDetail {
  employee_id: string
  employee_name: string
  email: string
  monthly_salary: number
  hourly_rate: number
  daily_rate: number
  work_hours_per_day: number
  work_days_per_month: number
  role: string
  department: string
  admission_date: string
  active: boolean
  total_months: number
  total_paid: number
  total_remaining: number
}

const EmployeeSalaryEditor = () => {
  const [employees, setEmployees] = useState<EmployeeSalaryDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSalaryDetail | null>(null)
  const [showIntegrationModal, setShowIntegrationModal] = useState(false)
  const [editData, setEditData] = useState({
    salary: '',
    workHoursPerDay: '8',
    workDaysPerMonth: '22'
  })
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('v_employee_salary_details')
        .select('*')
        .eq('active', true)
        .order('employee_name')

      if (error) throw error

      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (employee: EmployeeSalaryDetail) => {
    setEditingId(employee.employee_id)
    setEditData({
      salary: employee.monthly_salary.toString(),
      workHoursPerDay: employee.work_hours_per_day.toString(),
      workDaysPerMonth: employee.work_days_per_month.toString()
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({
      salary: '',
      workHoursPerDay: '8',
      workDaysPerMonth: '22'
    })
  }

  const handleSaveEdit = async (employeeId: string) => {
    try {
      const { data, error } = await supabase.rpc('update_employee_salary', {
        p_employee_id: employeeId,
        p_new_salary: Number(editData.salary),
        p_work_hours_per_day: Number(editData.workHoursPerDay),
        p_work_days_per_month: Number(editData.workDaysPerMonth)
      })

      if (error) throw error

      alert(`Salário atualizado com sucesso!\n\nMensal: R$ ${data[0].new_monthly_salary.toFixed(2)}\nPor Hora: R$ ${data[0].new_hourly_rate.toFixed(2)}\nPor Dia: R$ ${data[0].new_daily_rate.toFixed(2)}`)

      handleCancelEdit()
      loadEmployees()
    } catch (error: any) {
      console.error('Error updating salary:', error)
      alert('Erro ao atualizar salário: ' + error.message)
    }
  }

  const handleSyncEmployee = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Sincronizar ${employeeName} com o tracking de salários do mês atual?`)) {
      return
    }

    try {
      setSyncing(true)
      const { error } = await supabase.rpc('sync_employee_to_salary_tracking', {
        p_employee_id: employeeId,
        p_reference_month: new Date().toISOString().split('T')[0]
      })

      if (error) throw error

      alert('Funcionário sincronizado com sucesso!')
      loadEmployees()
    } catch (error: any) {
      console.error('Error syncing employee:', error)
      alert('Erro ao sincronizar: ' + error.message)
    } finally {
      setSyncing(false)
    }
  }

  const handleOpenIntegration = (employee: EmployeeSalaryDetail) => {
    setSelectedEmployee(employee)
    setShowIntegrationModal(true)
  }

  const handleCloseIntegration = () => {
    setShowIntegrationModal(false)
    setSelectedEmployee(null)
    loadEmployees()
  }

  const calculatePreview = () => {
    const salary = Number(editData.salary) || 0
    const hoursPerDay = Number(editData.workHoursPerDay) || 8
    const daysPerMonth = Number(editData.workDaysPerMonth) || 22

    const totalHours = hoursPerDay * daysPerMonth
    const hourlyRate = totalHours > 0 ? salary / totalHours : 0
    const dailyRate = daysPerMonth > 0 ? salary / daysPerMonth : 0

    return { hourlyRate, dailyRate, totalHours }
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
          <h2 className="text-2xl font-bold text-gray-900">Edição de Salários</h2>
          <p className="text-sm text-gray-600">Gerencie salários com fracionamento e integração financeira</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-5 h-5" />
          <span>{employees.length} funcionário(s)</span>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Sincronização Automática</h3>
            <p className="text-sm text-blue-800">
              Sistema reconhece automaticamente novos funcionários e seus salários da Gestão de Pessoas.
              Clique no ícone <LinkIcon className="w-4 h-4 inline" /> para vincular lançamentos financeiros.
            </p>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Funcionário
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Salário Mensal
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Por Hora
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Por Dia
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Horas/Dia
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Dias/Mês
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.employee_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {employee.employee_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.role} • {employee.department}
                      </div>
                      {employee.total_months > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {employee.total_months} mês(es) • R$ {Number(employee.total_paid).toFixed(2)} pagos
                        </div>
                      )}
                    </div>
                  </td>

                  {editingId === employee.employee_id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={editData.salary}
                          onChange={(e) => setEditData({ ...editData, salary: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-blue-600">
                          R$ {calculatePreview().hourlyRate.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-blue-600">
                          R$ {calculatePreview().dailyRate.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.5"
                          value={editData.workHoursPerDay}
                          onChange={(e) => setEditData({ ...editData, workHoursPerDay: e.target.value })}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={editData.workDaysPerMonth}
                          onChange={(e) => setEditData({ ...editData, workDaysPerMonth: e.target.value })}
                          className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs text-gray-500">
                          {calculatePreview().totalHours}h/mês
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(employee.employee_id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Salvar"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                            title="Cancelar"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-center">
                        <div className="text-lg font-bold text-gray-900">
                          R$ {Number(employee.monthly_salary).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            R$ {Number(employee.hourly_rate).toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            R$ {Number(employee.daily_rate).toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600">
                          {employee.work_hours_per_day}h
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600">
                          {employee.work_days_per_month} dias
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {employee.total_months > 0 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Sincronizado
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            Novo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStartEdit(employee)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar salário"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleSyncEmployee(employee.employee_id, employee.employee_name)}
                            disabled={syncing}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50"
                            title="Sincronizar com tracking"
                          >
                            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleOpenIntegration(employee)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Ver lançamentos financeiros"
                          >
                            <LinkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p>Nenhum funcionário ativo encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Como funciona o fracionamento:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <DollarSign className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Salário Mensal</p>
              <p className="text-gray-600">Valor total pago por mês</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Taxa por Hora</p>
              <p className="text-gray-600">Salário ÷ (Horas/dia × Dias/mês)</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Taxa por Dia</p>
              <p className="text-gray-600">Salário ÷ Dias úteis no mês</p>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Modal */}
      <AnimatePresence>
        {showIntegrationModal && selectedEmployee && (
          <StandardModal
            isOpen={showIntegrationModal}
            onClose={handleCloseIntegration}
            title={`Lançamentos Financeiros - ${selectedEmployee.employee_name}`}
            size="xl"
          >
            <FinanceIntegrationPanel
              employeeId={selectedEmployee.employee_id}
              employeeName={selectedEmployee.employee_name}
              onImportComplete={handleCloseIntegration}
            />
          </StandardModal>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EmployeeSalaryEditor
