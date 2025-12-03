import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  TrendingDown,
  History,
  XCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AdvancePayment {
  advance_id: string
  employee_id: string
  employee_name: string
  employee_salary: number
  amount: number
  advance_date: string
  deducted_from_month: string
  deduction_timing: 'overdue' | 'current' | 'future'
  notes: string
}

interface Employee {
  id: string
  name: string
  salary: number
}

const SalaryAdvanceManager = () => {
  const [advances, setAdvances] = useState<AdvancePayment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0])
  const [deductFromMonth, setDeductFromMonth] = useState(
    format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd')
  )
  const [advanceNotes, setAdvanceNotes] = useState('')
  const [stats, setStats] = useState({
    totalPending: 0,
    totalDeducted: 0,
    pendingCount: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadAdvances(), loadEmployees()])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdvances = async () => {
    try {
      const { data, error } = await supabase
        .from('v_pending_advances')
        .select('*')
        .order('deducted_from_month', { ascending: true })

      if (error) throw error

      setAdvances(data || [])

      const totalPending = data?.reduce((sum, a) => sum + Number(a.amount), 0) || 0
      const pendingCount = data?.length || 0

      const { data: summary } = await supabase
        .from('v_advance_summary')
        .select('deducted_amount')

      const totalDeducted = summary?.reduce((sum, s) => sum + Number(s.deducted_amount), 0) || 0

      setStats({ totalPending, totalDeducted, pendingCount })
    } catch (error) {
      console.error('Error loading advances:', error)
    }
  }

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, salary')
        .eq('active', true)
        .order('name')

      if (error) throw error

      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const handleRegisterAdvance = async () => {
    if (!selectedEmployeeId || !advanceAmount || Number(advanceAmount) <= 0) {
      alert('Por favor, selecione o funcionário e informe o valor')
      return
    }

    try {
      const { data, error } = await supabase.rpc('register_salary_advance', {
        p_employee_id: selectedEmployeeId,
        p_amount: Number(advanceAmount),
        p_advance_date: advanceDate,
        p_deducted_from_month: deductFromMonth,
        p_notes: advanceNotes || null
      })

      if (error) throw error

      alert('Vale registrado com sucesso! Será descontado automaticamente no mês indicado.')
      setShowAdvanceModal(false)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Error registering advance:', error)
      alert('Erro ao registrar vale: ' + error.message)
    }
  }

  const handleCancelAdvance = async (advanceId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este vale?')) {
      return
    }

    try {
      const { error } = await supabase.rpc('cancel_salary_advance', {
        p_advance_id: advanceId,
        p_reason: 'Cancelado manualmente pelo usuário'
      })

      if (error) throw error

      alert('Vale cancelado com sucesso!')
      loadData()
    } catch (error: any) {
      console.error('Error cancelling advance:', error)
      alert('Erro ao cancelar vale: ' + error.message)
    }
  }

  const resetForm = () => {
    setSelectedEmployeeId('')
    setAdvanceAmount('')
    setAdvanceDate(new Date().toISOString().split('T')[0])
    setDeductFromMonth(format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'))
    setAdvanceNotes('')
  }

  const getTimingBadge = (timing: string) => {
    const badges = {
      overdue: { label: 'Atrasado', color: 'bg-red-100 text-red-800' },
      current: { label: 'Mês Atual', color: 'bg-blue-100 text-blue-800' },
      future: { label: 'Futuro', color: 'bg-gray-100 text-gray-800' }
    }

    const badge = badges[timing as keyof typeof badges] || badges.future

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
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
          <h2 className="text-2xl font-bold text-gray-900">Vales e Adiantamentos</h2>
          <p className="text-sm text-gray-600">Desconto automático no salário do mês indicado</p>
        </div>
        <button
          onClick={() => setShowAdvanceModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Registrar Vale
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vales Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">
                R$ {stats.totalPending.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{stats.pendingCount} vale(s)</p>
            </div>
            <TrendingDown className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Já Descontados</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {stats.totalDeducted.toFixed(2)}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Geral</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {(stats.totalPending + stats.totalDeducted).toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Advances Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Vales Pendentes de Desconto</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Funcionário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data do Vale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descontar em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Timing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Observações
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {advances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-12 h-12 text-gray-300" />
                      <p>Nenhum vale pendente de desconto</p>
                    </div>
                  </td>
                </tr>
              ) : (
                advances.map((advance) => (
                  <tr key={advance.advance_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {advance.employee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Salário: R$ {Number(advance.employee_salary).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-orange-600">
                        R$ {Number(advance.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(advance.advance_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(new Date(advance.deducted_from_month), 'MMMM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTimingBadge(advance.deduction_timing)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {advance.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleCancelAdvance(advance.advance_id)}
                        className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Registrar Vale/Adiantamento</h3>
              <button
                onClick={() => {
                  setShowAdvanceModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  O vale será descontado automaticamente ao criar o salário do mês indicado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funcionário *
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione o funcionário</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - Salário: R$ {emp.salary.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor do Vale *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Adiantamento *
                </label>
                <input
                  type="date"
                  value={advanceDate}
                  onChange={(e) => setAdvanceDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descontar no Mês *
                </label>
                <input
                  type="month"
                  value={deductFromMonth.substring(0, 7)}
                  onChange={(e) => setDeductFromMonth(e.target.value + '-01')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  O desconto será aplicado automaticamente ao criar o salário deste mês
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Motivo do vale, observações..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAdvanceModal(false)
                  resetForm()
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterAdvance}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Registrar Vale
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default SalaryAdvanceManager
