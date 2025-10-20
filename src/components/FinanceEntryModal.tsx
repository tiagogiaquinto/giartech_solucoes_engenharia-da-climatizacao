import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, DollarSign, Calendar, FileText, CreditCard, User, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface FinanceEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  entryId?: string
}

interface Customer {
  id: string
  nome_razao: string
}

interface FinancialCategory {
  id: string
  name: string
  type: 'receita' | 'despesa'
  color: string
  icon: string
  active: boolean
}

interface BankAccount {
  id: string
  account_name: string
  bank_name: string
  balance: number
  active: boolean
  is_default?: boolean
}

interface Supplier {
  id: string
  name: string
  cnpj?: string
  active: boolean
}

const FinanceEntryModal = ({ isOpen, onClose, onSave, entryId }: FinanceEntryModalProps) => {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [subcategories, setSubcategories] = useState<FinancialCategory[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  const [formData, setFormData] = useState({
    descricao: '',
    valor: 0,
    tipo: 'receita' as 'receita' | 'despesa',
    status: 'a_receber' as 'recebido' | 'pago' | 'a_receber' | 'a_pagar',
    data: new Date().toISOString().split('T')[0],
    data_vencimento: new Date().toISOString().split('T')[0],
    customer_id: '',
    supplier_id: '',
    categoria: '',
    category_id: '',
    subcategory_id: '',
    forma_pagamento: 'dinheiro' as 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia',
    bank_account_id: '',
    observacoes: '',
    recorrente: false,
    frequencia_recorrencia: 'mensal' as 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual',
    data_fim_recorrencia: ''
  })

  useEffect(() => {
    loadCustomers()
    loadCategories()
    loadSuppliers()
    loadBankAccounts()
    if (entryId) {
      loadEntryData()
    }
  }, [entryId])

  useEffect(() => {
    if (formData.category_id) {
      loadSubcategories(formData.category_id)
    } else {
      setSubcategories([])
      setFormData(prev => ({ ...prev, subcategory_id: '' }))
    }
  }, [formData.category_id])

  const loadCustomers = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('id, nome_razao')
        .order('nome_razao')

      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('financial_categories')
        .select('*')
        .eq('active', true)
        .is('parent_id', null)
        .order('name')

      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadSubcategories = async (parentId: string) => {
    try {
      const { data } = await supabase
        .from('financial_categories')
        .select('*')
        .eq('active', true)
        .eq('parent_id', parentId)
        .order('name')

      setSubcategories(data || [])
    } catch (error) {
      console.error('Error loading subcategories:', error)
      setSubcategories([])
    }
  }

  const loadSuppliers = async () => {
    try {
      const { data } = await supabase
        .from('suppliers')
        .select('id, name, cnpj, active')
        .eq('active', true)
        .order('name')

      setSuppliers(data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const loadBankAccounts = async () => {
    try {
      const { data } = await supabase
        .from('bank_accounts')
        .select('id, account_name, bank_name, balance, active, is_default')
        .eq('active', true)
        .order('is_default', { ascending: false, nullsFirst: false })
        .order('account_name', { ascending: true })

      setBankAccounts(data || [])

      if (data && data.length > 0 && !entryId) {
        const defaultAccount = data.find(acc => acc.is_default)
        if (defaultAccount) {
          setFormData(prev => ({ ...prev, bank_account_id: defaultAccount.id }))
        }
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error)
    }
  }

  const loadEntryData = async () => {
    if (!entryId) return

    try {
      const { data } = await supabase
        .from('finance_entries')
        .select('*')
        .eq('id', entryId)
        .single()

      if (data) {
        setFormData({
          descricao: data.descricao || '',
          valor: data.valor || 0,
          tipo: data.tipo || 'receita',
          status: data.status || 'a_receber',
          data: data.data?.split('T')[0] || '',
          data_vencimento: data.data_vencimento?.split('T')[0] || '',
          customer_id: data.customer_id || '',
          supplier_id: data.supplier_id || '',
          categoria: data.categoria || '',
          category_id: data.category_id || '',
          subcategory_id: data.subcategory_id || '',
          forma_pagamento: data.forma_pagamento || 'dinheiro',
          bank_account_id: data.bank_account_id || '',
          observacoes: data.observacoes || '',
          recorrente: data.recorrente || false,
          frequencia_recorrencia: data.frequencia_recorrencia || 'mensal',
          data_fim_recorrencia: data.data_fim_recorrencia?.split('T')[0] || ''
        })
      }
    } catch (error) {
      console.error('Error loading entry:', error)
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.descricao || formData.valor <= 0) {
        alert('Preencha a descrição e o valor!')
        return
      }

      setLoading(true)

      const dataToSave: any = {
        descricao: formData.descricao,
        valor: Number(formData.valor),
        tipo: formData.tipo,
        status: formData.status,
        data: formData.data,
        data_vencimento: formData.data_vencimento || null,
        customer_id: formData.customer_id || null,
        supplier_id: formData.supplier_id || null,
        categoria: formData.categoria || null,
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
        forma_pagamento: formData.forma_pagamento,
        bank_account_id: formData.bank_account_id || null,
        observacoes: formData.observacoes || null
      }

      if (formData.recorrente) {
        dataToSave.intervalo_recorrencia = formData.frequencia_recorrencia
        dataToSave.data_fim_recorrencia = formData.data_fim_recorrencia || null
      } else {
        dataToSave.intervalo_recorrencia = null
        dataToSave.data_fim_recorrencia = null
      }

      let result
      if (entryId) {
        result = await supabase
          .from('finance_entries')
          .update(dataToSave)
          .eq('id', entryId)
          .select()
      } else {
        result = await supabase
          .from('finance_entries')
          .insert([dataToSave])
          .select()
      }

      if (result.error) {
        console.error('Database error:', result.error)
        throw new Error(result.error.message)
      }

      alert(entryId ? 'Lançamento atualizado com sucesso!' : 'Lançamento criado com sucesso!')
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error saving:', error)
      alert(`Erro ao salvar lançamento: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (formData.tipo === 'receita') {
      if (formData.status === 'pago' || formData.status === 'a_pagar') {
        setFormData(prev => ({ ...prev, status: prev.status === 'pago' ? 'recebido' : 'a_receber' }))
      }
    } else {
      if (formData.status === 'recebido' || formData.status === 'a_receber') {
        setFormData(prev => ({ ...prev, status: prev.status === 'recebido' ? 'pago' : 'a_pagar' }))
      }
    }
  }, [formData.tipo])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">
              {entryId ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
            <p className="text-blue-100 text-sm">Controle de receitas e despesas</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-4">
            <label className="flex-1 cursor-pointer">
              <div className={`border-2 rounded-xl p-4 transition-all ${
                formData.tipo === 'receita'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-300'
              }`}>
                <input
                  type="radio"
                  checked={formData.tipo === 'receita'}
                  onChange={() => setFormData({ ...formData, tipo: 'receita' })}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Receita</div>
                    <div className="text-sm text-gray-600">Entrada de dinheiro</div>
                  </div>
                </div>
              </div>
            </label>

            <label className="flex-1 cursor-pointer">
              <div className={`border-2 rounded-xl p-4 transition-all ${
                formData.tipo === 'despesa'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-red-300'
              }`}>
                <input
                  type="radio"
                  checked={formData.tipo === 'despesa'}
                  onChange={() => setFormData({ ...formData, tipo: 'despesa' })}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Despesa</div>
                    <div className="text-sm text-gray-600">Saída de dinheiro</div>
                  </div>
                </div>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Descrição *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Pagamento de serviço - OS #123"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Valor *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {formData.tipo === 'receita' ? (
                  <>
                    <option value="a_receber">A Receber</option>
                    <option value="recebido">Recebido</option>
                  </>
                ) : (
                  <>
                    <option value="a_pagar">A Pagar</option>
                    <option value="pago">Pago</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Data {formData.status === 'recebido' || formData.status === 'pago' ? 'do Pagamento' : 'de Lançamento'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Data de Vencimento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {formData.tipo === 'receita' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cliente (Opcional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um cliente...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.nome_razao}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {formData.tipo === 'despesa' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fornecedor (Opcional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um fornecedor...</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} {supplier.cnpj ? `- ${supplier.cnpj}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Categoria
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories
                    .filter(cat => cat.type === formData.tipo)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                </select>
              </div>

              {formData.category_id && subcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subcategoria
                  </label>
                  <select
                    value={formData.subcategory_id}
                    onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma subcategoria...</option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.icon} {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Forma de Pagamento
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.forma_pagamento}
                  onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value as any })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="boleto">Boleto</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Conta Bancária
              </label>
              <select
                value={formData.bank_account_id}
                onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione uma conta...</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.is_default ? '⭐ ' : ''}{account.bank_name} - {account.account_name} (Saldo: R$ {account.balance?.toFixed(2) || '0,00'})
                  </option>
                ))}
              </select>
              {formData.status === 'pago' || formData.status === 'recebido' ? (
                <p className="text-xs text-blue-600 mt-1">💡 O saldo será atualizado automaticamente</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  {bankAccounts.find(acc => acc.is_default) && (
                    <span>⭐ = Conta Padrão • </span>
                  )}
                  Selecione a conta para controlar o saldo
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Informações adicionais sobre este lançamento..."
              />
            </div>

            {/* Recurrence Section */}
            <div className="md:col-span-2 border-t pt-4 mt-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="recorrente"
                    checked={formData.recorrente}
                    onChange={(e) => setFormData({ ...formData, recorrente: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <label htmlFor="recorrente" className="block text-sm font-semibold text-blue-900 cursor-pointer">
                      Lançamento Recorrente / Provisionado <span className="text-blue-600">(Opcional)</span>
                    </label>
                    <p className="text-xs text-blue-700 mt-1">
                      Marque esta opção se este lançamento se repete periodicamente (ex: aluguel, salários) ou se deseja provisionar para o futuro
                    </p>
                  </div>
                </div>
              </div>

              {formData.recorrente && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-blue-200">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Frequência
                    </label>
                    <select
                      value={formData.frequencia_recorrencia}
                      onChange={(e) => setFormData({ ...formData, frequencia_recorrencia: e.target.value as any })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="semanal">Semanal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="mensal">Mensal</option>
                      <option value="bimestral">Bimestral</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Data Fim da Recorrência
                    </label>
                    <input
                      type="date"
                      value={formData.data_fim_recorrencia}
                      onChange={(e) => setFormData({ ...formData, data_fim_recorrencia: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={formData.data}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Deixe em branco para recorrência indefinida
                    </p>
                  </div>
                </div>
              )}
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
                Salvar Lançamento
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default FinanceEntryModal
