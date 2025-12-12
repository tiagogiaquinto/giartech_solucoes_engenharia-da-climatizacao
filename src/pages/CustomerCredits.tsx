import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, TrendingDown, Gift, Calendar, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

interface Credit {
  id: string
  customer_id: string
  customer_name: string
  credit_type: string
  original_amount: number
  used_amount: number
  available_amount: number
  issued_date: string
  expiration_date: string | null
  status: string
}

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  balance_before: number
  balance_after: number
  description: string
  created_at: string
}

const CustomerCredits = () => {
  const [credits, setCredits] = useState<Credit[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCredits()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      loadTransactions(selectedCustomer)
    }
  }, [selectedCustomer])

  const loadCredits = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customer_credits')
        .select(`
          *,
          customers!inner(nome_razao)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formatted = (data || []).map((c: any) => ({
        ...c,
        customer_name: c.customers?.nome_razao || 'N/A'
      }))

      setCredits(formatted)
    } catch (error) {
      console.error('Erro ao carregar créditos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_credit_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTransactions(data || [])
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'indicacao': 'Indicação',
      'bonus': 'Bônus',
      'promocao': 'Promoção',
      'devolucao': 'Devolução',
      'cortesia': 'Cortesia'
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      'ativo': { color: 'bg-green-100 text-green-800', label: 'Ativo' },
      'utilizado': { color: 'bg-gray-100 text-gray-800', label: 'Utilizado' },
      'expirado': { color: 'bg-red-100 text-red-800', label: 'Expirado' },
      'cancelado': { color: 'bg-orange-100 text-orange-800', label: 'Cancelado' }
    }
    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getTotalByStatus = () => {
    const available = credits
      .filter(c => c.status === 'ativo')
      .reduce((sum, c) => sum + c.available_amount, 0)

    const used = credits.reduce((sum, c) => sum + c.used_amount, 0)

    const expired = credits
      .filter(c => c.status === 'expirado')
      .reduce((sum, c) => sum + c.available_amount, 0)

    return { available, used, expired }
  }

  const totals = getTotalByStatus()

  const groupedCredits = credits.reduce((acc, credit) => {
    if (!acc[credit.customer_id]) {
      acc[credit.customer_id] = {
        customer_name: credit.customer_name,
        credits: [],
        total_available: 0,
        total_used: 0
      }
    }
    acc[credit.customer_id].credits.push(credit)
    if (credit.status === 'ativo') {
      acc[credit.customer_id].total_available += credit.available_amount
    }
    acc[credit.customer_id].total_used += credit.used_amount
    return acc
  }, {} as Record<string, any>)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Créditos de Clientes</h1>
        <p className="text-gray-600 mt-1">Saldo disponível e histórico de utilização</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            R$ {totals.available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-gray-600 text-sm">Créditos Disponíveis</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            R$ {totals.used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-gray-600 text-sm">Créditos Utilizados</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            R$ {totals.expired.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-gray-600 text-sm">Créditos Expirados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Saldo por Cliente</h2>
          </div>

          <div className="overflow-y-auto max-h-[600px]">
            {Object.entries(groupedCredits).map(([customerId, data]) => (
              <div
                key={customerId}
                onClick={() => setSelectedCustomer(customerId)}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedCustomer === customerId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{data.customer_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {data.credits.filter((c: any) => c.status === 'ativo').length} crédito(s) ativo(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      R$ {data.total_available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-500">
                      R$ {data.total_used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} usado
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCustomer ? 'Histórico de Transações' : 'Selecione um Cliente'}
            </h2>
          </div>

          <div className="overflow-y-auto max-h-[600px]">
            {!selectedCustomer ? (
              <div className="p-12 text-center text-gray-500">
                <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Selecione um cliente para ver o histórico</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>Nenhuma transação encontrada</p>
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          transaction.transaction_type === 'credito'
                            ? 'bg-green-100'
                            : 'bg-red-100'
                        }`}>
                          {transaction.transaction_type === 'credito' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {format(new Date(transaction.created_at), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Saldo: R$ {transaction.balance_before.toFixed(2)} → R$ {transaction.balance_after.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        transaction.transaction_type === 'credito'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'credito' ? '+' : '-'}
                        R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Todos os Créditos</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponível</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emissão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : credits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Nenhum crédito registrado
                  </td>
                </tr>
              ) : (
                credits.map((credit) => (
                  <tr key={credit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{credit.customer_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{getTypeLabel(credit.credit_type)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        R$ {credit.original_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-red-600">
                        R$ {credit.used_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-green-600">
                        R$ {credit.available_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {format(new Date(credit.issued_date), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {credit.expiration_date
                          ? format(new Date(credit.expiration_date), 'dd/MM/yyyy')
                          : 'Sem validade'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(credit.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CustomerCredits
