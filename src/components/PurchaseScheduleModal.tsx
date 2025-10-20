import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Calendar, Package, DollarSign, RefreshCw, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface PurchaseScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  scheduleId?: string
}

interface InventoryItem {
  id: string
  name: string
  supplier_name: string
  unit_cost: number
  min_quantity: number
}

const PurchaseScheduleModal = ({ isOpen, onClose, onSave, scheduleId }: PurchaseScheduleModalProps) => {
  const [loading, setLoading] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [formData, setFormData] = useState({
    schedule_name: '',
    inventory_id: '',
    supplier_name: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly',
    quantity: 0,
    unit_price: 0,
    next_order_date: new Date().toISOString().split('T')[0],
    active: true,
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadInventoryItems()
      if (scheduleId) {
        loadScheduleData()
      }
    }
  }, [isOpen, scheduleId])

  const loadInventoryItems = async () => {
    try {
      const { data } = await supabase
        .from('inventory_items')
        .select('id, name, supplier_name, unit_cost, min_quantity')
        .eq('active', true)
        .order('name')

      setInventoryItems(data || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    }
  }

  const loadScheduleData = async () => {
    if (!scheduleId) return

    try {
      const { data, error } = await supabase
        .from('purchase_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          schedule_name: data.schedule_name || '',
          inventory_id: data.inventory_id || '',
          supplier_name: data.supplier_name || '',
          frequency: data.frequency || 'monthly',
          quantity: data.quantity || 0,
          unit_price: data.unit_price || 0,
          next_order_date: data.next_order_date || new Date().toISOString().split('T')[0],
          active: data.active !== false,
          notes: data.notes || ''
        })
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
      alert('Erro ao carregar programação')
    }
  }

  const handleItemChange = (itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId)
    if (item) {
      setFormData(prev => ({
        ...prev,
        inventory_id: itemId,
        supplier_name: item.supplier_name || '',
        unit_price: item.unit_cost || 0,
        quantity: item.min_quantity * 2 || 10,
        schedule_name: `Compra Recorrente - ${item.name}`
      }))
    }
  }

  const calculateNextDate = (frequency: string, fromDate: string) => {
    const date = new Date(fromDate)
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1)
        break
      case 'weekly':
        date.setDate(date.getDate() + 7)
        break
      case 'biweekly':
        date.setDate(date.getDate() + 14)
        break
      case 'monthly':
        date.setMonth(date.getMonth() + 1)
        break
      case 'quarterly':
        date.setMonth(date.getMonth() + 3)
        break
    }
    return date.toISOString().split('T')[0]
  }

  const createAgendaEvent = async (scheduleData: any) => {
    try {
      const item = inventoryItems.find(i => i.id === scheduleData.inventory_id)
      if (!item) return

      await supabase.from('agenda_events').insert([{
        title: `Compra Programada: ${item.name}`,
        description: `Programação automática de compra\nQuantidade: ${scheduleData.quantity}\nFornecedor: ${scheduleData.supplier_name}\nValor: R$ ${(scheduleData.quantity * scheduleData.unit_price).toFixed(2)}`,
        start_date: scheduleData.next_order_date,
        end_date: scheduleData.next_order_date,
        type: 'purchase',
        status: 'pending',
        all_day: true,
        color: '#f59e0b',
        metadata: {
          schedule_id: scheduleId,
          inventory_id: scheduleData.inventory_id,
          supplier: scheduleData.supplier_name,
          quantity: scheduleData.quantity,
          unit_price: scheduleData.unit_price
        }
      }])
    } catch (error) {
      console.error('Error creating agenda event:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.schedule_name || !formData.inventory_id || formData.quantity <= 0) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      const scheduleData = {
        schedule_name: formData.schedule_name,
        inventory_id: formData.inventory_id,
        supplier_name: formData.supplier_name,
        frequency: formData.frequency,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        next_order_date: formData.next_order_date,
        active: formData.active,
        notes: formData.notes,
        updated_at: new Date().toISOString()
      }

      if (scheduleId) {
        const { error } = await supabase
          .from('purchase_schedules')
          .update(scheduleData)
          .eq('id', scheduleId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('purchase_schedules')
          .insert([scheduleData])
          .select()
          .single()

        if (error) throw error

        await createAgendaEvent(data)
      }

      alert('Programação salva com sucesso!')
      onSave()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Erro ao salvar programação')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      schedule_name: '',
      inventory_id: '',
      supplier_name: '',
      frequency: 'monthly',
      quantity: 0,
      unit_price: 0,
      next_order_date: new Date().toISOString().split('T')[0],
      active: true,
      notes: ''
    })
  }

  const frequencyOptions = [
    { value: 'daily', label: 'Diária' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quinzenal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'quarterly', label: 'Trimestral' }
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">
                  {scheduleId ? 'Editar' : 'Nova'} Programação de Compra
                </h2>
                <p className="text-sm text-blue-100">Compras automáticas recorrentes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Programação Automática</p>
                <p>Esta compra será criada automaticamente na agenda na data especificada e se repetirá na frequência escolhida.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Item do Estoque *
                </label>
                <select
                  value={formData.inventory_id}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um item...</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.supplier_name || 'Sem fornecedor'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Programação *
                </label>
                <input
                  type="text"
                  value={formData.schedule_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, schedule_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Compra Mensal de Cabos"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor *
                </label>
                <input
                  type="text"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do fornecedor"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <RefreshCw className="inline h-4 w-4 mr-1" />
                  Frequência *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {frequencyOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Preço Unitário (R$)
                </label>
                <input
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Próxima Compra *
                </label>
                <input
                  type="date"
                  value={formData.next_order_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_order_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Programação Ativa</span>
                </label>
              </div>

              {formData.quantity > 0 && formData.unit_price > 0 && (
                <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Valor Total Estimado:</span>
                    <span className="text-2xl font-bold text-green-600">
                      R$ {(formData.quantity * formData.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Informações adicionais sobre esta programação..."
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-xl flex justify-end gap-3 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Programação'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default PurchaseScheduleModal
