import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Calendar, Package, DollarSign, RefreshCw, AlertCircle, Truck } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface RentalScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  scheduleId?: string
}

interface Customer {
  id: string
  nome_razao: string
  email: string
  telefone: string
}

const RentalScheduleModal = ({ isOpen, onClose, onSave, scheduleId }: RentalScheduleModalProps) => {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    schedule_name: '',
    customer_id: '',
    equipment_name: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly',
    rental_value: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    next_billing_date: new Date().toISOString().split('T')[0],
    active: true,
    notes: '',
    auto_generate_invoice: true
  })

  useEffect(() => {
    if (isOpen) {
      loadCustomers()
      if (scheduleId) {
        loadScheduleData()
      }
    }
  }, [isOpen, scheduleId])

  const loadCustomers = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('id, nome_razao, email, telefone')
        .order('nome_razao')

      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadScheduleData = async () => {
    if (!scheduleId) return

    try {
      const { data, error } = await supabase
        .from('rental_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          schedule_name: data.schedule_name || '',
          customer_id: data.customer_id || '',
          equipment_name: data.equipment_name || '',
          frequency: data.frequency || 'monthly',
          rental_value: data.rental_value || 0,
          start_date: data.start_date || new Date().toISOString().split('T')[0],
          end_date: data.end_date || '',
          next_billing_date: data.next_billing_date || new Date().toISOString().split('T')[0],
          active: data.active !== false,
          notes: data.notes || '',
          auto_generate_invoice: data.auto_generate_invoice !== false
        })
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
      alert('Erro ao carregar programação de locação')
    }
  }

  const createAgendaEvent = async (scheduleData: any) => {
    try {
      const customer = customers.find(c => c.id === scheduleData.customer_id)
      if (!customer) return

      await supabase.from('agenda_events').insert([{
        title: `Locação: ${scheduleData.equipment_name}`,
        description: `Cliente: ${customer.nome_razao}\nEquipamento: ${scheduleData.equipment_name}\nValor: R$ ${scheduleData.rental_value.toFixed(2)}\nFaturamento automático: ${scheduleData.auto_generate_invoice ? 'Sim' : 'Não'}`,
        start_date: scheduleData.next_billing_date,
        end_date: scheduleData.next_billing_date,
        type: 'rental',
        status: 'pending',
        all_day: true,
        color: '#8b5cf6',
        customer_id: scheduleData.customer_id,
        metadata: {
          schedule_id: scheduleId,
          customer_id: scheduleData.customer_id,
          equipment_name: scheduleData.equipment_name,
          rental_value: scheduleData.rental_value,
          auto_generate_invoice: scheduleData.auto_generate_invoice
        }
      }])
    } catch (error) {
      console.error('Error creating agenda event:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.schedule_name || !formData.customer_id || !formData.equipment_name || formData.rental_value <= 0) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      const scheduleData = {
        schedule_name: formData.schedule_name,
        customer_id: formData.customer_id,
        equipment_name: formData.equipment_name,
        frequency: formData.frequency,
        rental_value: formData.rental_value,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        next_billing_date: formData.next_billing_date,
        active: formData.active,
        notes: formData.notes,
        auto_generate_invoice: formData.auto_generate_invoice,
        updated_at: new Date().toISOString()
      }

      if (scheduleId) {
        const { error } = await supabase
          .from('rental_schedules')
          .update(scheduleData)
          .eq('id', scheduleId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('rental_schedules')
          .insert([scheduleData])
          .select()
          .single()

        if (error) throw error

        await createAgendaEvent(data)
      }

      alert('Programação de locação salva com sucesso!')
      onSave()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error saving rental schedule:', error)
      alert('Erro ao salvar programação de locação')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      schedule_name: '',
      customer_id: '',
      equipment_name: '',
      frequency: 'monthly',
      rental_value: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      next_billing_date: new Date().toISOString().split('T')[0],
      active: true,
      notes: '',
      auto_generate_invoice: true
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
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">
                  {scheduleId ? 'Editar' : 'Nova'} Programação de Locação
                </h2>
                <p className="text-sm text-purple-100">Locações e faturamentos recorrentes</p>
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
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <p className="font-medium mb-1">Faturamento Automático</p>
                <p>Esta locação será lançada automaticamente na agenda e pode gerar receitas financeiras na data especificada.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Programação *
                </label>
                <input
                  type="text"
                  value={formData.schedule_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, schedule_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Locação Mensal - Escavadeira"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.nome_razao}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Equipamento/Serviço *
                </label>
                <input
                  type="text"
                  value={formData.equipment_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipment_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Nome do equipamento ou serviço locado"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {frequencyOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Valor da Locação (R$) *
                </label>
                <input
                  type="number"
                  value={formData.rental_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, rental_value: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Data de Início *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Término (Opcional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Próximo Faturamento *
                </label>
                <input
                  type="date"
                  value={formData.next_billing_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_billing_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Ativa</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_generate_invoice}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_generate_invoice: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Gerar Receita</span>
                </label>
              </div>

              {formData.rental_value > 0 && (
                <div className="md:col-span-2 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-800">Valor por Período:</span>
                    <span className="text-2xl font-bold text-purple-600">
                      R$ {formData.rental_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Informações adicionais sobre esta locação..."
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
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
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

export default RentalScheduleModal
