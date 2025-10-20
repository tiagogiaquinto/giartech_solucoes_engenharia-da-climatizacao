import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, DollarSign, Calendar, FileText, TrendingUp, Package, Fuel, Car, Users, Coffee, CreditCard, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ServiceOrderCostManagerProps {
  serviceOrderId: string
  onUpdate?: () => void
}

interface Cost {
  id: string
  service_order_id: string
  cost_type: string
  description: string
  amount: number
  cost_date: string
  supplier?: string
  payment_method?: string
  invoice_number?: string
  notes?: string
  created_at: string
}

const ServiceOrderCostManager = ({ serviceOrderId, onUpdate }: ServiceOrderCostManagerProps) => {
  const [costs, setCosts] = useState<Cost[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const [newCost, setNewCost] = useState<Partial<Cost>>({
    service_order_id: serviceOrderId,
    cost_type: 'outros',
    description: '',
    amount: 0,
    cost_date: new Date().toISOString().split('T')[0],
    supplier: '',
    payment_method: '',
    invoice_number: '',
    notes: ''
  })

  const costTypes = [
    { value: 'material', label: 'Material Extra', icon: Package, color: 'orange' },
    { value: 'combustivel', label: 'Combustível', icon: Fuel, color: 'red' },
    { value: 'deslocamento', label: 'Deslocamento', icon: Car, color: 'blue' },
    { value: 'terceirizado', label: 'Terceirizado', icon: Users, color: 'purple' },
    { value: 'alimentacao', label: 'Alimentação', icon: Coffee, color: 'green' },
    { value: 'pedagio', label: 'Pedágio', icon: CreditCard, color: 'yellow' },
    { value: 'estacionamento', label: 'Estacionamento', icon: Car, color: 'indigo' },
    { value: 'outros', label: 'Outros', icon: DollarSign, color: 'gray' }
  ]

  useEffect(() => {
    loadCosts()
  }, [serviceOrderId])

  const loadCosts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('service_order_costs')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('cost_date', { ascending: false })

      if (error) throw error
      setCosts(data || [])
    } catch (error) {
      console.error('Error loading costs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCost = async () => {
    if (!newCost.description || !newCost.amount) {
      alert('Preencha descrição e valor!')
      return
    }

    try {
      const { error } = await supabase
        .from('service_order_costs')
        .insert([newCost])

      if (error) throw error

      await loadCosts()
      setNewCost({
        service_order_id: serviceOrderId,
        cost_type: 'outros',
        description: '',
        amount: 0,
        cost_date: new Date().toISOString().split('T')[0],
        supplier: '',
        payment_method: '',
        invoice_number: '',
        notes: ''
      })
      setShowAddForm(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error adding cost:', error)
      alert('Erro ao adicionar custo!')
    }
  }

  const handleDeleteCost = async (id: string) => {
    if (!confirm('Deseja realmente excluir este custo?')) return

    try {
      const { error } = await supabase
        .from('service_order_costs')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadCosts()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error deleting cost:', error)
      alert('Erro ao excluir custo!')
    }
  }

  const getCostTypeInfo = (type: string) => {
    return costTypes.find(t => t.value === type) || costTypes[costTypes.length - 1]
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const totalCosts = costs.reduce((sum, cost) => sum + Number(cost.amount), 0)

  if (loading) {
    return <div className="text-center py-8">Carregando custos...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header com Total */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-1">Centro de Custos</h3>
            <p className="text-blue-100 text-sm">Gerencie todos os custos desta ordem de serviço</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm mb-1">Total de Custos Adicionais</p>
            <p className="text-3xl font-bold">{formatCurrency(totalCosts)}</p>
            <p className="text-blue-100 text-xs mt-1">{costs.length} {costs.length === 1 ? 'item' : 'itens'}</p>
          </div>
        </div>
      </div>

      {/* Botão Adicionar */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {showAddForm ? 'Cancelar' : 'Adicionar Custo'}
        </button>
      </div>

      {/* Formulário de Adicionar */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Novo Custo
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Custo
                </label>
                <select
                  value={newCost.cost_type}
                  onChange={(e) => setNewCost({ ...newCost, cost_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {costTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Custo
                </label>
                <input
                  type="date"
                  value={newCost.cost_date}
                  onChange={(e) => setNewCost({ ...newCost, cost_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={newCost.description}
                  onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Gasolina para deslocamento, Almoço da equipe..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newCost.amount}
                  onChange={(e) => setNewCost({ ...newCost, amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor/Local
                </label>
                <input
                  type="text"
                  value={newCost.supplier}
                  onChange={(e) => setNewCost({ ...newCost, supplier: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do fornecedor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  value={newCost.payment_method}
                  onChange={(e) => setNewCost({ ...newCost, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="credito">Cartão de Crédito</option>
                  <option value="boleto">Boleto</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da Nota/Cupom
                </label>
                <input
                  type="text"
                  value={newCost.invoice_number}
                  onChange={(e) => setNewCost({ ...newCost, invoice_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="NF/Cupom"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={newCost.notes}
                  onChange={(e) => setNewCost({ ...newCost, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCost}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar Custo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Custos */}
      {costs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">Nenhum custo adicional registrado</p>
          <p className="text-sm text-gray-500 mt-1">Clique em "Adicionar Custo" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {costs.map((cost) => {
            const typeInfo = getCostTypeInfo(cost.cost_type)
            const Icon = typeInfo.icon

            return (
              <motion.div
                key={cost.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 bg-${typeInfo.color}-100 rounded-lg`}>
                        <Icon className={`h-5 w-5 text-${typeInfo.color}-600`} />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">{cost.description}</h5>
                        <p className="text-sm text-gray-500">{typeInfo.label}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Data:</span>
                        <p className="font-medium">{formatDate(cost.cost_date)}</p>
                      </div>
                      {cost.supplier && (
                        <div>
                          <span className="text-gray-500">Fornecedor:</span>
                          <p className="font-medium">{cost.supplier}</p>
                        </div>
                      )}
                      {cost.payment_method && (
                        <div>
                          <span className="text-gray-500">Pagamento:</span>
                          <p className="font-medium capitalize">{cost.payment_method}</p>
                        </div>
                      )}
                      {cost.invoice_number && (
                        <div>
                          <span className="text-gray-500">NF/Cupom:</span>
                          <p className="font-medium">{cost.invoice_number}</p>
                        </div>
                      )}
                    </div>

                    {cost.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{cost.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-4 ml-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(cost.amount)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCost(cost.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir custo"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Resumo por Tipo */}
      {costs.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Resumo por Tipo de Custo
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {costTypes.map(type => {
              const typeCosts = costs.filter(c => c.cost_type === type.value)
              const total = typeCosts.reduce((sum, c) => sum + Number(c.amount), 0)

              if (total === 0) return null

              const Icon = type.icon

              return (
                <div key={type.value} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 text-${type.color}-600`} />
                    <span className="text-xs text-gray-600">{type.label}</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
                  <p className="text-xs text-gray-500">{typeCosts.length} {typeCosts.length === 1 ? 'item' : 'itens'}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceOrderCostManager
