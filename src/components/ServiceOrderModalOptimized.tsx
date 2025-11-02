import React, { useState, useEffect } from 'react'
import { X, Save, Printer, Send, Loader2, Plus, Package, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { CustomerSelector } from './ServiceOrder/CustomerSelector'
import { QuickServiceAdd } from './ServiceOrder/QuickServiceAdd'
import { ServiceItemCard } from './ServiceOrder/ServiceItemCard'
import { FinancialSummary } from './ServiceOrder/FinancialSummary'

interface ServiceItem {
  id: string
  service_catalog_id?: string
  descricao: string
  escopo_detalhado?: string
  quantidade: number
  preco_unitario: number
  preco_total: number
  tempo_estimado_minutos: number
  materiais: MaterialItem[]
  funcionarios: LaborItem[]
  custo_materiais: number
  custo_mao_obra: number
  custo_total: number
  lucro: number
  margem_lucro: number
}

interface MaterialItem {
  id: string
  material_id: string
  nome: string
  quantidade: number
  unidade_medida: string
  preco_compra_unitario: number
  preco_venda_unitario: number
  preco_compra: number
  preco_venda: number
  custo_total: number
  valor_total: number
  lucro: number
}

interface LaborItem {
  id: string
  staff_id: string
  nome: string
  tempo_minutos: number
  custo_hora: number
  custo_total: number
}

interface ServiceOrderModalProps {
  isOpen: boolean
  onClose: () => void
  serviceOrderId?: string | null
  onSave?: (id: string) => void
}

export const ServiceOrderModalOptimized: React.FC<ServiceOrderModalProps> = ({
  isOpen,
  onClose,
  serviceOrderId,
  onSave
}) => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [serviceCatalog, setServiceCatalog] = useState<any[]>([])
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [showMaterialModal, setShowMaterialModal] = useState<string | null>(null)
  const [showLaborModal, setShowLaborModal] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    description: '',
    scheduled_at: '',
    notes: '',
    payment_method: 'pix',
    payment_conditions: '',
    warranty_period: 90,
    warranty_type: 'days' as 'days' | 'months' | 'years'
  })

  const [totals, setTotals] = useState({
    subtotal: 0,
    desconto: 0,
    descontoPercentual: 0,
    custoTotal: 0,
    total: 0,
    lucroTotal: 0,
    margemLucro: 0
  })

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen, serviceOrderId])

  useEffect(() => {
    calculateTotals()
  }, [serviceItems, totals.desconto])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [customersRes, catalogRes, materialsRes, staffRes] = await Promise.all([
        supabase.from('customers').select('*').order('nome_razao'),
        supabase.from('service_catalog').select(`
          *,
          materiais:service_catalog_materials(
            material_id,
            quantidade,
            material:materials(*)
          )
        `).order('nome'),
        supabase.from('materials').select('*').order('nome'),
        supabase.from('employees').select('id, nome, custo_hora').order('nome')
      ])

      if (customersRes.data) setCustomers(customersRes.data)
      if (catalogRes.data) {
        const mappedCatalog = catalogRes.data.map(item => ({
          ...item,
          materiais: item.materiais?.map((m: any) => ({
            material_id: m.material_id,
            quantidade: m.quantidade,
            nome: m.material?.nome,
            unidade_medida: m.material?.unidade_medida,
            preco_compra: m.material?.preco_compra,
            preco_venda: m.material?.preco_venda
          })) || []
        }))
        setServiceCatalog(mappedCatalog)
      }
      if (materialsRes.data) setMaterials(materialsRes.data)
      if (staffRes.data) setStaff(staffRes.data)

      if (serviceOrderId) {
        await loadServiceOrder(serviceOrderId)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadServiceOrder = async (id: string) => {
    try {
      const { data: order, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(*),
          items:service_order_items(*,
            materiais:service_order_materials(*),
            funcionarios:service_order_labor(*, employee:employees(*))
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!order) return

      setSelectedCustomer(order.customer)
      setFormData({
        description: order.description || '',
        scheduled_at: order.scheduled_at?.split('T')[0] || '',
        notes: order.notes || '',
        payment_method: order.payment_method || 'pix',
        payment_conditions: order.payment_conditions || '',
        warranty_period: order.warranty_period || 90,
        warranty_type: order.warranty_type || 'days'
      })

      if (order.items) {
        const mappedItems: ServiceItem[] = order.items.map((item: any) => ({
          id: item.id,
          descricao: item.descricao || '',
          escopo_detalhado: item.escopo_detalhado || '',
          quantidade: parseFloat(item.quantidade || 1),
          preco_unitario: parseFloat(item.preco_unitario || 0),
          preco_total: parseFloat(item.preco_total || 0),
          tempo_estimado_minutos: item.tempo_estimado_minutos || 0,
          materiais: item.materiais?.map((m: any) => ({
            id: m.id,
            material_id: m.material_id,
            nome: m.nome || 'Material',
            quantidade: parseFloat(m.quantidade || 0),
            unidade_medida: m.unidade_medida || 'un',
            preco_compra_unitario: parseFloat(m.preco_compra_unitario || 0),
            preco_venda_unitario: parseFloat(m.preco_venda_unitario || 0),
            preco_compra: parseFloat(m.preco_compra_unitario || 0) * parseFloat(m.quantidade || 0),
            preco_venda: parseFloat(m.preco_venda_unitario || 0) * parseFloat(m.quantidade || 0),
            custo_total: parseFloat(m.custo_total || 0),
            valor_total: parseFloat(m.valor_total || 0),
            lucro: parseFloat(m.valor_total || 0) - parseFloat(m.custo_total || 0)
          })) || [],
          funcionarios: item.funcionarios?.map((f: any) => ({
            id: f.id,
            staff_id: f.employee_id,
            nome: f.employee?.nome || 'Funcionário',
            tempo_minutos: f.tempo_minutos || 0,
            custo_hora: parseFloat(f.custo_hora || 0),
            custo_total: parseFloat(f.custo_total || 0)
          })) || [],
          custo_materiais: parseFloat(item.custo_materiais || 0),
          custo_mao_obra: parseFloat(item.custo_mao_obra || 0),
          custo_total: parseFloat(item.custo_total || 0),
          lucro: parseFloat(item.lucro || 0),
          margem_lucro: parseFloat(item.margem_lucro || 0)
        }))
        setServiceItems(mappedItems)
      }

      setTotals(prev => ({
        ...prev,
        desconto: parseFloat(order.desconto_valor || 0),
        descontoPercentual: parseFloat(order.desconto_percentual || 0)
      }))
    } catch (error) {
      console.error('Erro ao carregar OS:', error)
    }
  }

  const calculateTotals = () => {
    const subtotal = serviceItems.reduce((sum, item) => sum + item.preco_total, 0)
    const custoTotal = serviceItems.reduce((sum, item) => sum + item.custo_total, 0)
    const total = subtotal - totals.desconto
    const lucroTotal = total - custoTotal
    const margemLucro = total > 0 ? (lucroTotal / total) * 100 : 0

    setTotals(prev => ({
      ...prev,
      subtotal,
      custoTotal,
      total: Math.max(0, total),
      lucroTotal,
      margemLucro
    }))
  }

  const handleAddService = (service: ServiceItem) => {
    setServiceItems([...serviceItems, service])
  }

  const handleAddCustomService = () => {
    const newService: ServiceItem = {
      id: `service-${Date.now()}`,
      descricao: '',
      quantidade: 1,
      preco_unitario: 0,
      preco_total: 0,
      tempo_estimado_minutos: 60,
      materiais: [],
      funcionarios: [],
      custo_materiais: 0,
      custo_mao_obra: 0,
      custo_total: 0,
      lucro: 0,
      margem_lucro: 0
    }
    setServiceItems([...serviceItems, newService])
  }

  const handleUpdateService = (id: string, updates: Partial<ServiceItem>) => {
    setServiceItems(serviceItems.map(item => {
      if (item.id !== id) return item

      const updated = { ...item, ...updates }

      if (updates.quantidade !== undefined || updates.preco_unitario !== undefined) {
        updated.preco_total = updated.quantidade * updated.preco_unitario
      }

      const custoMateriais = updated.materiais?.reduce((sum, m) => sum + (m.custo_total || 0), 0) || 0
      const custoMaoObra = updated.funcionarios?.reduce((sum, f) => sum + (f.custo_total || 0), 0) || 0
      updated.custo_materiais = custoMateriais
      updated.custo_mao_obra = custoMaoObra
      updated.custo_total = custoMateriais + custoMaoObra
      updated.lucro = updated.preco_total - updated.custo_total
      updated.margem_lucro = updated.preco_total > 0 ? ((updated.lucro / updated.preco_total) * 100) : 0

      return updated
    }))
  }

  const handleDeleteService = (id: string) => {
    setServiceItems(serviceItems.filter(item => item.id !== id))
  }

  const handleDescontoChange = (valor: number, percentual: number) => {
    setTotals(prev => ({
      ...prev,
      desconto: valor,
      descontoPercentual: percentual
    }))
  }

  const handleAddMaterial = (itemId: string) => {
    setShowMaterialModal(itemId)
  }

  const handleAddLabor = (itemId: string) => {
    setShowLaborModal(itemId)
  }

  const handleSave = async () => {
    if (!selectedCustomer) {
      alert('Selecione um cliente')
      return
    }

    if (serviceItems.length === 0) {
      alert('Adicione pelo menos um serviço')
      return
    }

    setSaving(true)
    try {
      const orderData = {
        customer_id: selectedCustomer.id,
        description: formData.description,
        scheduled_at: formData.scheduled_at || new Date().toISOString(),
        notes: formData.notes,
        payment_method: formData.payment_method,
        payment_conditions: formData.payment_conditions,
        warranty_period: formData.warranty_period,
        warranty_type: formData.warranty_type,
        subtotal: totals.subtotal,
        desconto_valor: totals.desconto,
        desconto_percentual: totals.descontoPercentual,
        total: totals.total,
        custo_total: totals.custoTotal,
        lucro_total: totals.lucroTotal,
        margem_lucro: totals.margemLucro,
        status: 'aberto'
      }

      let orderId = serviceOrderId

      if (serviceOrderId) {
        const { error } = await supabase
          .from('service_orders')
          .update(orderData)
          .eq('id', serviceOrderId)

        if (error) throw error

        await supabase
          .from('service_order_items')
          .delete()
          .eq('service_order_id', serviceOrderId)
      } else {
        const { data, error } = await supabase
          .from('service_orders')
          .insert(orderData)
          .select()
          .single()

        if (error) throw error
        orderId = data.id
      }

      for (const item of serviceItems) {
        const { data: itemData, error: itemError } = await supabase
          .from('service_order_items')
          .insert({
            service_order_id: orderId,
            descricao: item.descricao,
            escopo_detalhado: item.escopo_detalhado,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            preco_total: item.preco_total,
            tempo_estimado_minutos: item.tempo_estimado_minutos,
            custo_materiais: item.custo_materiais,
            custo_mao_obra: item.custo_mao_obra,
            custo_total: item.custo_total,
            lucro: item.lucro,
            margem_lucro: item.margem_lucro
          })
          .select()
          .single()

        if (itemError) throw itemError

        if (item.materiais?.length > 0) {
          await supabase
            .from('service_order_materials')
            .insert(
              item.materiais.map(m => ({
                service_order_item_id: itemData.id,
                material_id: m.material_id,
                quantidade: m.quantidade,
                unidade_medida: m.unidade_medida,
                preco_compra_unitario: m.preco_compra_unitario,
                preco_venda_unitario: m.preco_venda_unitario,
                custo_total: m.custo_total,
                valor_total: m.valor_total
              }))
            )
        }

        if (item.funcionarios?.length > 0) {
          await supabase
            .from('service_order_labor')
            .insert(
              item.funcionarios.map(f => ({
                service_order_item_id: itemData.id,
                employee_id: f.staff_id,
                tempo_minutos: f.tempo_minutos,
                custo_hora: f.custo_hora,
                custo_total: f.custo_total
              }))
            )
        }
      }

      if (onSave && orderId) {
        onSave(orderId)
      }

      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar OS:', error)
      alert(`Erro ao salvar ordem de serviço: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-2xl font-bold text-white">
            {serviceOrderId ? 'Editar' : 'Nova'} Ordem de Serviço
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <CustomerSelector
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  onSelect={setSelectedCustomer}
                />

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <label className="block text-sm font-medium mb-2">Descrição da OS</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Descreva brevemente o serviço..."
                  />
                </div>

                <QuickServiceAdd
                  serviceCatalog={serviceCatalog}
                  onAddService={handleAddService}
                  onAddCustomService={handleAddCustomService}
                />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Serviços Adicionados ({serviceItems.length})</h3>
                  {serviceItems.map((item, index) => (
                    <ServiceItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      onUpdate={handleUpdateService}
                      onDelete={handleDeleteService}
                      onAddMaterial={handleAddMaterial}
                      onAddLabor={handleAddLabor}
                    />
                  ))}
                  {serviceItems.length === 0 && (
                    <div className="bg-gray-50 border-2 border-dashed rounded-xl p-8 text-center text-gray-500">
                      Nenhum serviço adicionado ainda
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
                  <h3 className="text-lg font-semibold">Informações Adicionais</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Data Agendada</label>
                      <input
                        type="date"
                        value={formData.scheduled_at}
                        onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                      <select
                        value={formData.payment_method}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="transferencia">Transferência</option>
                        <option value="boleto">Boleto</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Condições de Pagamento</label>
                    <textarea
                      value={formData.payment_conditions}
                      onChange={(e) => setFormData({ ...formData, payment_conditions: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Ex: 50% no início, 50% na conclusão"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Observações</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Observações internas..."
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <FinancialSummary
                  subtotal={totals.subtotal}
                  desconto={totals.desconto}
                  descontoPercentual={totals.descontoPercentual}
                  custoTotal={totals.custoTotal}
                  total={totals.total}
                  lucroTotal={totals.lucroTotal}
                  margemLucro={totals.margemLucro}
                  onDescontoChange={handleDescontoChange}
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-6 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !selectedCustomer || serviceItems.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
