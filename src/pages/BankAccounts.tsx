import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Plus, TrendingUp, TrendingDown, DollarSign, Building2, Eye, EyeOff, MoveVertical as MoreVertical, CreditCard as Edit, Trash2, Snowflake, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface BankAccount {
  id: string
  account_name: string
  bank_name: string
  account_number: string
  balance: number
  active: boolean
  is_default?: boolean
  created_at: string
  updated_at: string
}

const BankAccounts = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showBalances, setShowBalances] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [formData, setFormData] = useState({
    account_name: '',
    bank_name: '',
    account_number: '',
    balance: 0,
    active: true
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.account_name || !formData.bank_name || !formData.account_number) {
        alert('Preencha todos os campos obrigatórios')
        return
      }

      if (editingAccount) {
        const { error } = await supabase
          .from('bank_accounts')
          .update(formData)
          .eq('id', editingAccount.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('bank_accounts')
          .insert([formData])
        if (error) throw error
      }

      alert(editingAccount ? 'Conta atualizada!' : 'Conta criada!')
      handleCloseModal()
      await loadAccounts()
    } catch (error) {
      console.error('Error saving account:', error)
      alert('Erro ao salvar conta')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir a conta "${name}"?\n\nEsta ação é irreversível!`)) return

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id)
      if (error) throw error
      alert('Conta excluída!')
      await loadAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Erro ao excluir conta')
    }
  }

  const handleFreeze = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ active: !currentStatus })
        .eq('id', id)
      if (error) throw error
      alert(currentStatus ? 'Conta congelada!' : 'Conta ativada!')
      await loadAccounts()
    } catch (error) {
      console.error('Error freezing account:', error)
      alert('Erro ao alterar status da conta')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error
      alert('Conta definida como padrão!')
      await loadAccounts()
    } catch (error) {
      console.error('Error setting default account:', error)
      alert('Erro ao definir conta padrão')
    }
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
    setFormData({
      account_name: account.account_name,
      bank_name: account.bank_name,
      account_number: account.account_number,
      balance: account.balance,
      active: account.active
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAccount(null)
    setFormData({
      account_name: '',
      bank_name: '',
      account_number: '',
      balance: 0,
      active: true
    })
  }

  const formatCurrency = (value: number) => {
    if (!showBalances) return 'R$ •••••'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const totalBalance = accounts.filter(a => a.active).reduce((sum, acc) => sum + Number(acc.balance), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-blue-600" />
            Contas Bancárias
          </h1>
          <p className="text-gray-600 mt-1">Gerenciar contas e saldos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Conta
        </button>
      </div>

      {/* Saldo Total */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white shadow-lg mx-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm">Saldo Total</p>
            <h2 className="text-4xl font-bold mt-2">{formatCurrency(totalBalance)}</h2>
          </div>
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            {showBalances ? (
              <Eye className="h-6 w-6" />
            ) : (
              <EyeOff className="h-6 w-6" />
            )}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-300 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Este mês</span>
            </div>
            <p className="text-xl font-semibold">+R$ 12.450,00</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-300 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Saídas</span>
            </div>
            <p className="text-xl font-semibold">-R$ 8.320,00</p>
          </div>
        </div>
      </motion.div>

      {/* Lista de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-6 pb-6">
        {accounts.map((account, index) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${account.active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Building2 className={`h-6 w-6 ${account.active ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{account.account_name}</h3>
                    {account.is_default && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center gap-1">
                        ⭐ Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{account.bank_name}</p>
                  {!account.active && (
                    <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <Snowflake className="h-3 w-3" />
                      Congelada
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Conta</p>
              <p className="font-mono text-gray-900">{account.account_number}</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-1">Saldo Atual</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(Number(account.balance))}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(account)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleFreeze(account.id, account.active)}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1 ${
                    account.active
                      ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                  title={account.active ? 'Congelar conta' : 'Ativar conta'}
                >
                  {account.active ? (
                    <><Snowflake className="h-4 w-4" /> Congelar</>
                  ) : (
                    <><Check className="h-4 w-4" /> Ativar</>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(account.id, account.account_name)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  title="Excluir conta"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {!account.is_default && (
                <button
                  onClick={() => handleSetDefault(account.id)}
                  className="w-full px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 rounded-lg hover:from-yellow-100 hover:to-amber-100 transition-all text-sm font-medium flex items-center justify-center gap-1 border border-yellow-200"
                >
                  ⭐ Definir como Padrão
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 mx-6">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma conta cadastrada</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Adicionar Primeira Conta
          </button>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold mb-6">
              {editingAccount ? 'Editar Conta' : 'Nova Conta Bancária'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta *</label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Conta Corrente Principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banco *</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Banco do Brasil"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Conta *</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 12345-6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingAccount ? 'Atualizar' : 'Criar Conta'}
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default BankAccounts
