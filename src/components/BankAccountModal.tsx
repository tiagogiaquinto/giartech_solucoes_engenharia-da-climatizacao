import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, Building, CreditCard, Hash, DollarSign, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface BankAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  accountId?: string
}

const BankAccountModal = ({ isOpen, onClose, onSave, accountId }: BankAccountModalProps) => {
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    bank_name: '',
    bank_code: '',
    agency: '',
    account_number: '',
    account_type: 'corrente' as 'corrente' | 'poupanca' | 'investimento',
    account_holder: '',
    document: '',
    initial_balance: '',
    current_balance: '',
    description: '',
    active: true
  })

  useEffect(() => {
    if (accountId) {
      loadAccountData()
    } else {
      resetForm()
    }
  }, [accountId, isOpen])

  const loadAccountData = async () => {
    if (!accountId) return

    try {
      const { data: account } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', accountId)
        .maybeSingle()

      if (account) {
        setFormData({
          bank_name: account.bank_name || '',
          bank_code: account.bank_code || '',
          agency: account.agency || '',
          account_number: account.account_number || '',
          account_type: account.account_type || 'corrente',
          account_holder: account.account_holder || '',
          document: account.document || '',
          initial_balance: account.initial_balance?.toString() || '',
          current_balance: account.current_balance?.toString() || '',
          description: account.description || '',
          active: account.active ?? true
        })
      }
    } catch (error) {
      console.error('Error loading account:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      bank_name: '',
      bank_code: '',
      agency: '',
      account_number: '',
      account_type: 'corrente',
      account_holder: '',
      document: '',
      initial_balance: '',
      current_balance: '',
      description: '',
      active: true
    })
  }

  const handleSave = async () => {
    try {
      if (!formData.bank_name || !formData.account_number) {
        alert('Banco e Número da Conta são obrigatórios!')
        return
      }

      setLoading(true)

      const dataToSave = {
        bank_name: formData.bank_name,
        bank_code: formData.bank_code || null,
        agency: formData.agency || null,
        account_number: formData.account_number,
        account_type: formData.account_type,
        account_holder: formData.account_holder || null,
        document: formData.document || null,
        initial_balance: formData.initial_balance ? parseFloat(formData.initial_balance) : 0,
        current_balance: formData.current_balance ? parseFloat(formData.current_balance) : 0,
        description: formData.description || null,
        active: formData.active
      }

      if (accountId) {
        const { error } = await supabase
          .from('bank_accounts')
          .update(dataToSave)
          .eq('id', accountId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('bank_accounts')
          .insert([dataToSave])
        if (error) throw error
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving account:', error)
      alert('Erro ao salvar conta bancária!')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">{accountId ? 'Editar Conta' : 'Nova Conta Bancária'}</h2>
            <p className="text-blue-100 text-sm">Gerenciamento de contas bancárias</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  Nome do Banco *
                </label>
                <select
                  value={formData.bank_name}
                  onChange={(e) => {
                    const selectedBank = bancos.find(b => b.nome === e.target.value)
                    setFormData({
                      ...formData,
                      bank_name: e.target.value,
                      bank_code: selectedBank?.codigo || ''
                    })
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um banco...</option>
                  {bancos.map(banco => (
                    <option key={banco.codigo} value={banco.nome}>
                      {banco.codigo} - {banco.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  Código do Banco
                </label>
                <input
                  type="text"
                  value={formData.bank_code}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-700"
                  placeholder="000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  Agência
                </label>
                <input
                  type="text"
                  value={formData.agency}
                  onChange={(e) => setFormData({...formData, agency: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  Número da Conta *
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="00000-0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  Tipo de Conta
                </label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({...formData, account_type: e.target.value as any})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Poupança</option>
                  <option value="investimento">Investimento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  Titular da Conta
                </label>
                <input
                  type="text"
                  value={formData.account_holder}
                  onChange={(e) => setFormData({...formData, account_holder: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do titular"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  CPF/CNPJ do Titular
                </label>
                <input
                  type="text"
                  value={formData.document}
                  onChange={(e) => setFormData({...formData, document: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  Saldo Inicial
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({...formData, initial_balance: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  Saldo Atual
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_balance}
                  onChange={(e) => setFormData({...formData, current_balance: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Informações adicionais sobre a conta"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Conta Ativa</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar Conta
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const bancos = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '341', nome: 'Itaú' },
  { codigo: '260', nome: 'Nubank' },
  { codigo: '077', nome: 'Inter' },
  { codigo: '212', nome: 'Banco Original' },
  { codigo: '380', nome: 'PicPay' },
  { codigo: '290', nome: 'Pagseguro' },
  { codigo: '323', nome: 'Mercado Pago' },
  { codigo: '756', nome: 'Sicoob' },
  { codigo: '748', nome: 'Sicredi' },
  { codigo: '655', nome: 'Neon' },
  { codigo: '422', nome: 'Safra' },
  { codigo: '389', nome: 'Banco Mercantil' },
]

export default BankAccountModal
