import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  History,
  Calendar,
  TrendingUp,
  Filter,
  Download,
  Edit,
  X,
  Save
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SalaryTracking {
  id: string
  employee_id: string
  employee_name: string
  reference_month: string
  base_salary: number
  bonuses: number
  discounts: number
  gross_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue'
  due_date: string
  payment_count: number
}

interface PaymentHistory {
  payment_id: string
  employee_name: string
  reference_month: string
  payment_amount: number
  payment_date: string
  payment_method: string
  notes: string
}

const SalaryPaymentManager = () => {
  const [salaries, setSalaries] = useState<SalaryTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalToPay: 0,
    totalPaid: 0,
    totalRemaining: 0,
    overdueCount: 0
  })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedSalary, setSelectedSalary] = useState<SalaryTracking | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{
    base_salary: string
    bonuses: string
    discounts: string
    due_date: string
  }>({
    base_salary: '',
    bonuses: '',
    discounts: '',
    due_date: ''
  })

  useEffect(() => {
    loadSalaries()
  }, [filterStatus])

  const loadSalaries = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('v_pending_salary_payments')
        .select('*')

      if (filterStatus !== 'all') {
        query = query.eq('payment_status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error

      setSalaries(data || [])

      const totalToPay = data?.reduce((sum, s) => sum + Number(s.gross_amount), 0) || 0
      const totalPaid = data?.reduce((sum, s) => sum + Number(s.paid_amount), 0) || 0
      const totalRemaining = data?.reduce((sum, s) => sum + Number(s.remaining_amount), 0) || 0
      const overdueCount = data?.filter(s => s.payment_status === 'overdue').length || 0

      setStats({ totalToPay, totalPaid, totalRemaining, overdueCount })
    } catch (error) {
      console.error('Error loading salaries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMonthlySalaries = async () => {
    if (!confirm('Criar salários para o mês atual para todos os funcionários ativos?')) {
      return
    }

    try {
      const { data, error } = await supabase.rpc('create_monthly_salaries')

      if (error) throw error

      alert(`Sucesso! ${data[0]?.created_count || 0} salários criados no valor total de R$ ${(data[0]?.total_amount || 0).toFixed(2)}`)
      loadSalaries()
    } catch (error: any) {
      console.error('Error creating salaries:', error)
      alert('Erro ao criar salários: ' + error.message)
    }
  }

  const handleOpenPayment = (salary: SalaryTracking) => {
    setSelectedSalary(salary)
    setPaymentAmount(salary.remaining_amount.toString())
    setPaymentMethod('pix')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentNotes('')
    setShowPaymentModal(true)
  }

  const handleRegisterPayment = async () => {
    if (!selectedSalary || !paymentAmount || Number(paymentAmount) <= 0) {
      alert('Por favor, preencha o valor do pagamento')
      return
    }

    if (Number(paymentAmount) > selectedSalary.remaining_amount) {
      alert('Valor do pagamento não pode ser maior que o saldo devedor')
      return
    }

    try {
      const { data, error } = await supabase.rpc('register_salary_payment', {
        p_salary_id: selectedSalary.id,
        p_amount: Number(paymentAmount),
        p_payment_method: paymentMethod,
        p_payment_date: paymentDate,
        p_notes: paymentNotes || null
      })

      if (error) throw error

      alert('Pagamento registrado com sucesso!')
      setShowPaymentModal(false)
      loadSalaries()
    } catch (error: any) {
      console.error('Error registering payment:', error)
      alert('Erro ao registrar pagamento: ' + error.message)
    }
  }

  const handleStartEdit = (salary: SalaryTracking) => {
    setEditingId(salary.id)
    setEditValues({
      base_salary: salary.base_salary.toString(),
      bonuses: (salary.bonuses || 0).toString(),
      discounts: (salary.discounts || 0).toString(),
      due_date: format(new Date(salary.due_date), 'yyyy-MM-dd')
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValues({
      base_salary: '',
      bonuses: '',
      discounts: '',
      due_date: ''
    })
  }

  const handleSaveEdit = async (salaryId: string) => {
    try {
      const { data, error } = await supabase.rpc('update_salary_tracking', {
        p_salary_id: salaryId,
        p_base_salary: editValues.base_salary ? Number(editValues.base_salary) : null,
        p_bonuses: editValues.bonuses ? Number(editValues.bonuses) : null,
        p_discounts: editValues.discounts ? Number(editValues.discounts) : null,
        p_due_date: editValues.due_date || null,
        p_notes: null
      })

      if (error) throw error

      alert('Salário atualizado com sucesso!')
      handleCancelEdit()
      loadSalaries()
    } catch (error: any) {
      console.error('Error updating salary:', error)
      alert('Erro ao atualizar salário: ' + error.message)
    }
  }

  const loadPaymentHistory = async (salaryId: string) => {
    try {
      const { data, error } = await supabase
        .from('v_salary_payment_history')
        .select('*')
        .eq('salary_tracking_id', salaryId)
        .order('payment_date', { ascending: false })

      if (error) throw error

      setPaymentHistory(data || [])
      setShowHistoryModal(true)
    } catch (error) {
      console.error('Error loading payment history:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      partial: { label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
      paid: { label: 'Pago', color: 'bg-green-100 text-green-800' },
      overdue: { label: 'Atrasado', color: 'bg-red-100 text-red-800' }
    }

    const badge = badges[status as keyof typeof badges] || badges.pending

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
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Salários</h2>
          <p className="text-sm text-gray-600">Controle de pagamentos com suporte a parcelas</p>
        </div>
        <button
          onClick={handleCreateMonthlySalaries}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Criar Salários do Mês
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total a Pagar</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {stats.totalToPay.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pago</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {stats.totalPaid.toFixed(2)}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Restante</p>
              <p className="text-2xl font-bold text-orange-600">
                R$ {stats.totalRemaining.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Atrasados</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.overdueCount}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">Todos os Status</option>
            <option value="overdue">Atrasados</option>
            <option value="partial">Parciais</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>
      </div>

      {/* Salaries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Funcionário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mês Ref.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Valor Bruto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Restante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salaries.map((salary) => {
                const isEditing = editingId === salary.id
                const calculatedGross = isEditing
                  ? Number(editValues.base_salary || 0) + Number(editValues.bonuses || 0) - Number(editValues.discounts || 0)
                  : Number(salary.gross_amount)

                return (
                  <tr key={salary.id} className={`${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {salary.employee_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(salary.reference_month), 'MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="space-y-1">
                          <div>
                            <label className="text-xs text-gray-500">Base:</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.base_salary}
                              onChange={(e) => setEditValues({...editValues, base_salary: e.target.value})}
                              className="w-28 px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Bônus:</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.bonuses}
                              onChange={(e) => setEditValues({...editValues, bonuses: e.target.value})}
                              className="w-28 px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Desc:</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.discounts}
                              onChange={(e) => setEditValues({...editValues, discounts: e.target.value})}
                              className="w-28 px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div className="text-xs font-medium text-blue-600 mt-1">
                            Total: R$ {calculatedGross.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">R$ {Number(salary.gross_amount).toFixed(2)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Base: R$ {Number(salary.base_salary).toFixed(2)}
                          </div>
                          {salary.bonuses > 0 && (
                            <div className="text-xs text-green-600">
                              +Bônus: R$ {Number(salary.bonuses).toFixed(2)}
                            </div>
                          )}
                          {salary.discounts > 0 && (
                            <div className="text-xs text-red-600">
                              -Desc: R$ {Number(salary.discounts).toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      R$ {Number(salary.paid_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                      R$ {isEditing ? (calculatedGross - Number(salary.paid_amount)).toFixed(2) : Number(salary.remaining_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editValues.due_date}
                          onChange={(e) => setEditValues({...editValues, due_date: e.target.value})}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      ) : (
                        <span className="text-gray-500">
                          {format(new Date(salary.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(salary.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(salary.id)}
                              className="flex items-center gap-1 text-green-600 hover:text-green-800 font-medium"
                              title="Salvar"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(salary)}
                              className="text-gray-600 hover:text-gray-800"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenPayment(salary)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Pagar
                            </button>
                            {salary.payment_count > 0 && (
                              <button
                                onClick={() => loadPaymentHistory(salary.id)}
                                className="text-gray-600 hover:text-gray-800"
                                title="Ver histórico"
                              >
                                <History className="w-5 h-5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold mb-4">Registrar Pagamento</h3>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Funcionário</p>
                <p className="font-medium">{selectedSalary.employee_name}</p>
                <p className="text-sm text-gray-600 mt-2">Mês Referência</p>
                <p className="font-medium">
                  {format(new Date(selectedSalary.reference_month), 'MMMM yyyy', { locale: ptBR })}
                </p>
                <p className="text-sm text-gray-600 mt-2">Saldo Devedor</p>
                <p className="text-lg font-bold text-orange-600">
                  R$ {selectedSalary.remaining_amount.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor do Pagamento
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cheque">Cheque</option>
                  <option value="cartao">Cartão</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Pagamento
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Observações sobre o pagamento (opcional)"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirmar Pagamento
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
          >
            <h3 className="text-xl font-bold mb-4">Histórico de Pagamentos</h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {paymentHistory.map((payment) => (
                <div key={payment.payment_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{payment.employee_name}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(payment.reference_month), 'MMMM yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      R$ {Number(payment.payment_amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span>{format(new Date(payment.payment_date), 'dd/MM/yyyy')}</span>
                    <span className="capitalize">{payment.payment_method}</span>
                  </div>
                  {payment.notes && (
                    <p className="mt-2 text-sm text-gray-600">{payment.notes}</p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full mt-6 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Fechar
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default SalaryPaymentManager
