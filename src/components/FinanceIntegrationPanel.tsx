import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  Link,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  Calendar,
  FileText,
  TrendingUp
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UnlinkedPayment {
  id: string
  descricao: string
  amount: number
  payment_date: string
  payment_method: string
  observacoes: string
  status: string
  reference_month: string
  suggested_type: string
}

interface EmployeeSummary {
  employee_name: string
  total_salary_base: number
  total_paid_tracking: number
  total_advances: number
  total_unlinked_payments: number
  payment_months: number
  last_payment_date: string
  has_pending: boolean
}

interface Props {
  employeeId: string
  employeeName: string
  onImportComplete?: () => void
}

const FinanceIntegrationPanel: React.FC<Props> = ({
  employeeId,
  employeeName,
  onImportComplete
}) => {
  const [unlinkedPayments, setUnlinkedPayments] = useState<UnlinkedPayment[]>([])
  const [summary, setSummary] = useState<EmployeeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [employeeId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar lançamentos não vinculados
      const { data: payments, error: paymentsError } = await supabase
        .from('v_unlinked_salary_payments')
        .select('*')
        .order('payment_date', { ascending: false })

      if (paymentsError) throw paymentsError

      // Carregar resumo do funcionário
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_employee_payment_summary', {
          p_employee_id: employeeId
        })

      if (summaryError) throw summaryError

      setUnlinkedPayments(payments || [])
      setSummary(summaryData?.[0] || null)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePayment = (paymentId: string) => {
    const newSelected = new Set(selectedPayments)
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId)
    } else {
      newSelected.add(paymentId)
    }
    setSelectedPayments(newSelected)
  }

  const handleImportSelected = async () => {
    if (selectedPayments.size === 0) {
      alert('Selecione pelo menos um lançamento para importar')
      return
    }

    if (!confirm(`Importar ${selectedPayments.size} lançamento(s) para ${employeeName}?`)) {
      return
    }

    try {
      setImporting(true)
      let successCount = 0
      let failCount = 0

      for (const paymentId of Array.from(selectedPayments)) {
        const payment = unlinkedPayments.find(p => p.id === paymentId)
        if (!payment) continue

        const { data, error } = await supabase.rpc('import_finance_entry_to_salary', {
          p_finance_entry_id: paymentId,
          p_employee_id: employeeId,
          p_reference_month: payment.reference_month
        })

        if (error || !data?.[0]?.success) {
          failCount++
          console.error('Error importing payment:', error)
        } else {
          successCount++
        }
      }

      alert(
        `Importação concluída!\n\n` +
        `✅ Sucesso: ${successCount}\n` +
        `❌ Falha: ${failCount}`
      )

      setSelectedPayments(new Set())
      loadData()
      onImportComplete?.()
    } catch (error: any) {
      console.error('Error importing payments:', error)
      alert('Erro ao importar lançamentos: ' + error.message)
    } finally {
      setImporting(false)
    }
  }

  const handleImportSingle = async (paymentId: string, payment: UnlinkedPayment) => {
    if (!confirm(`Importar este lançamento para ${employeeName}?`)) {
      return
    }

    try {
      setImporting(true)

      const { data, error } = await supabase.rpc('import_finance_entry_to_salary', {
        p_finance_entry_id: paymentId,
        p_employee_id: employeeId,
        p_reference_month: payment.reference_month
      })

      if (error) throw error

      if (data?.[0]?.success) {
        alert('Lançamento importado com sucesso!')
        loadData()
        onImportComplete?.()
      } else {
        alert('Erro: ' + (data?.[0]?.message || 'Falha ao importar'))
      }
    } catch (error: any) {
      console.error('Error importing payment:', error)
      alert('Erro ao importar: ' + error.message)
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Funcionário */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Resumo de Pagamentos: {employeeName}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Salário Base Total</p>
              <p className="text-xl font-bold text-gray-900">
                R$ {Number(summary.total_salary_base).toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pago (Tracking)</p>
              <p className="text-xl font-bold text-green-600">
                R$ {Number(summary.total_paid_tracking).toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Vales Pendentes</p>
              <p className="text-xl font-bold text-orange-600">
                R$ {Number(summary.total_advances).toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Não Vinculados</p>
              <p className="text-xl font-bold text-red-600">
                R$ {Number(summary.total_unlinked_payments).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                <Calendar className="w-4 h-4 inline mr-1" />
                {summary.payment_months} mês(es) registrado(s)
              </span>
              {summary.last_payment_date && (
                <span className="text-gray-600">
                  Último pagamento: {format(new Date(summary.last_payment_date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              )}
            </div>
            {summary.has_pending && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                Possui Pendências
              </span>
            )}
          </div>
        </div>
      )}

      {/* Lançamentos Não Vinculados */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Lançamentos Financeiros Disponíveis
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Lançamentos de salários ainda não vinculados ao tracking
              </p>
            </div>

            {selectedPayments.size > 0 && (
              <button
                onClick={handleImportSelected}
                disabled={importing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Importar Selecionados ({selectedPayments.size})
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {unlinkedPayments.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">
                Todos os lançamentos de salários estão vinculados!
              </p>
            </div>
          ) : (
            unlinkedPayments.map((payment) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  selectedPayments.has(payment.id) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedPayments.has(payment.id)}
                    onChange={() => handleTogglePayment(payment.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />

                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {payment.descricao || 'Sem descrição'}
                        </h4>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {payment.payment_method || 'Não especificado'}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            {payment.suggested_type}
                          </span>
                        </div>
                        {payment.observacoes && (
                          <p className="mt-2 text-sm text-gray-500">
                            <FileText className="w-4 h-4 inline mr-1" />
                            {payment.observacoes}
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-bold text-gray-900">
                          R$ {Number(payment.amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Ref: {format(new Date(payment.reference_month), 'MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleImportSingle(payment.id, payment)}
                        disabled={importing}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Link className="w-4 h-4" />
                        Vincular a {employeeName}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Info sobre Importação */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <h4 className="font-semibold text-blue-900 mb-1">Como funciona a integração:</h4>
            <ul className="space-y-1 text-blue-800">
              <li>• Lançamentos criados no <strong>Financeiro</strong> com categoria "Salários" aparecem aqui</li>
              <li>• Você pode <strong>vincular</strong> esses lançamentos ao tracking de salários</li>
              <li>• Após vinculados, eles contam no <strong>valor pago</strong> do mês</li>
              <li>• A sincronização é <strong>automática</strong> - não há duplicação</li>
              <li>• Lançamentos já vinculados <strong>não aparecem</strong> na lista</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinanceIntegrationPanel
