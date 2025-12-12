import { useState, useEffect } from 'react'
import { Users, Gift, TrendingUp, Plus, CheckCircle, Clock, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

interface Referral {
  id: string
  referrer_customer_id: string
  referred_customer_id: string
  referral_date: string
  status: string
  credit_amount: number
  order_value: number
  cashback_percent: number
  referrer_name: string
  referred_name: string
}

interface Customer {
  id: string
  nome_razao: string
  email: string
  phone: string
}

const CustomerReferrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    referrer_id: '',
    referred_id: '',
    source: 'direta'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [{ data: customersData }, { data: referralsData }] = await Promise.all([
        supabase.from('customers').select('id, nome_razao, email, phone').order('nome_razao'),
        supabase.from('customer_referrals').select(`
          *,
          referrer:customers!referrer_customer_id(nome_razao),
          referred:customers!referred_customer_id(nome_razao)
        `).order('created_at', { ascending: false })
      ])

      setCustomers(customersData || [])

      const formatted = (referralsData || []).map((r: any) => ({
        ...r,
        referrer_name: r.referrer?.nome_razao || 'N/A',
        referred_name: r.referred?.nome_razao || 'N/A'
      }))

      setReferrals(formatted)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterReferral = async () => {
    try {
      const { error } = await supabase.rpc('register_customer_referral', {
        p_referrer_id: formData.referrer_id,
        p_referred_id: formData.referred_id,
        p_source: formData.source
      })

      if (error) throw error

      alert('Indicação registrada com sucesso!')
      setShowModal(false)
      setFormData({ referrer_id: '', referred_id: '', source: 'direta' })
      loadData()
    } catch (error: any) {
      console.error('Erro:', error)
      alert(error.message || 'Erro ao registrar indicação')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'credito_gerado':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pendente':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'cancelada':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pendente': 'Pendente',
      'confirmada': 'Confirmada',
      'credito_gerado': 'Crédito Gerado',
      'cancelada': 'Cancelada',
      'expirada': 'Expirada'
    }
    return statusMap[status] || status
  }

  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.status === 'pendente').length,
    completed: referrals.filter(r => r.status === 'credito_gerado').length,
    totalCredits: referrals.reduce((sum, r) => sum + (r.credit_amount || 0), 0)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programa de Indicações</h1>
          <p className="text-gray-600 mt-1">Gerencie o sistema de indicações e créditos de clientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nova Indicação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          <p className="text-gray-600 text-sm">Total de Indicações</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.pending}</h3>
          <p className="text-gray-600 text-sm">Pendentes</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.completed}</h3>
          <p className="text-gray-600 text-sm">Concluídas</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Gift className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            R$ {stats.totalCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-gray-600 text-sm">Créditos Gerados</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Indicações Registradas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quem Indicou</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente Indicado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor OS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashback</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crédito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma indicação registrada
                  </td>
                </tr>
              ) : (
                referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(referral.status)}
                        <span className="text-sm font-medium">{getStatusText(referral.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{referral.referrer_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{referral.referred_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {format(new Date(referral.referral_date), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {referral.order_value > 0
                          ? `R$ ${referral.order_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {referral.cashback_percent > 0 ? `${referral.cashback_percent}%` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-green-600">
                        {referral.credit_amount > 0
                          ? `R$ ${referral.credit_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'
                        }
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Registrar Nova Indicação</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cliente que Indicou</label>
                <select
                  value={formData.referrer_id}
                  onChange={(e) => setFormData({ ...formData, referrer_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Selecione...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome_razao}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cliente Indicado</label>
                <select
                  value={formData.referred_id}
                  onChange={(e) => setFormData({ ...formData, referred_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Selecione...</option>
                  {customers.filter(c => c.id !== formData.referrer_id).map((c) => (
                    <option key={c.id} value={c.id}>{c.nome_razao}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Origem da Indicação</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="direta">Direta</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">E-mail</option>
                  <option value="telefone">Telefone</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterReferral}
                disabled={!formData.referrer_id || !formData.referred_id}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Registrar Indicação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerReferrals
