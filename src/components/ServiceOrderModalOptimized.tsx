import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, Save, Loader2, FileText, GitBranch } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { CustomerSelector } from './ServiceOrder/CustomerSelector'
import { QuickServiceAdd } from './ServiceOrder/QuickServiceAdd'
import { ServiceItemCard } from './ServiceOrder/ServiceItemCard'
import { FinancialSummary } from './ServiceOrder/FinancialSummary'
import { TemplateSelector } from './TemplateSelector'
import { OSPipelineStepper, PipelineStage } from './ServiceOrder/OSPipelineStepper'
import { StockCheckPanel } from './ServiceOrder/StockCheckPanel'
import { MaterialItem } from './ServiceOrder/InlineMaterialSearch'

interface ExtraCost {
  id: string
  descricao: string
  valor: number
}

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
  custos_extras?: ExtraCost[]
  custo_materiais: number
  custo_mao_obra: number
  custo_total: number
  lucro: number
  margem_lucro: number
}

interface LaborItem {
  id: string
  staff_id: string
  nome: string
  tempo_minutos: number
  custo_hora: number
  custo_total: number
}

const EMPTY_FORM = {
  description: '',
  scheduled_at: '',
  notes: '',
  payment_method: 'pix',
  payment_conditions: '',
  warranty_period: 90,
  warranty_type: 'days' as 'days' | 'months' | 'years'
}

const EMPTY_TOTALS = {
  subtotal: 0,
  desconto: 0,
  descontoPercentual: 0,
  custoTotal: 0,
  total: 0,
  lucroTotal: 0,
  margemLucro: 0
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
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState<string | null>(null)
  const [showLaborModal, setShowLaborModal] = useState<string | null>(null)
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('orcamento')
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null)
  const [stockRequisitionCount, setStockRequisitionCount] = useState(0)

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [totals, setTotals] = useState(EMPTY_TOTALS)
  const loadingRef = useRef(false)

  const resetState = useCallback(() => {
    setSelectedCustomer(null)
    setServiceItems([])
    setFormData(EMPTY_FORM)
    setTotals(EMPTY_TOTALS)
    setShowMaterialModal(null)
    setShowLaborModal(null)
    setPipelineStage('orcamento')
    setSavedOrderId(null)
    setStockRequisitionCount(0)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      loadingRef.current = false
      return
    }
    if (loadingRef.current) return
    loadingRef.current = true
    resetState()
    loadInitialData()
    return () => {
      loadingRef.current = false
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
          id, name, description, category, base_price, estimated_time_minutes, active,
          service_catalog_materials(
            id, material_id, quantity, material_name, material_unit,
            unit_cost_at_time, unit_sale_price
          )
        `).eq('active', true).order('name'),
        supabase.from('materials').select('id, name, unit, unit_cost, sale_price, unit_of_measure').order('name'),
        supabase.from('employees').select('id, name, custo_hora').eq('active', true).order('name')
      ])

      if (customersRes.data) setCustomers(customersRes.data)
      if (catalogRes.data) {
        const mappedCatalog = catalogRes.data.map((item: any) => ({
          id: item.id,
          nome: item.name,
          descricao: item.description,
          categoria: item.category,
          preco_base: item.base_price,
          tempo_estimado_minutos: item.estimated_time_minutes,
          materiais: (item.service_catalog_materials || []).map((m: any) => ({
            material_id: m.material_id,
            quantidade: parseFloat(m.quantity || 1),
            nome: m.material_name || '',
            unidade_medida: m.material_unit || 'un',
            preco_compra: parseFloat(m.unit_cost_at_time || 0),
            preco_venda: parseFloat(m.unit_sale_price || m.unit_cost_at_time || 0)
          }))
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
            funcionarios:service_order_labor(*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!order) return

      let customerData = order.customer || null
      if (!customerData && order.customer_id) {
        const { data: cust } = await supabase
          .from('customers')
          .select('*')
          .eq('id', order.customer_id)
          .maybeSingle()
        customerData = cust || {
          id: order.customer_id,
          nome_razao: order.client_name || '',
          telefone: order.client_phone || '',
          email: order.client_email || ''
        }
      }
      if (!customerData && order.client_name) {
        customerData = {
          id: order.customer_id || '',
          nome_razao: order.client_name || '',
          telefone: order.client_phone || '',
          email: order.client_email || ''
        }
      }
      setSelectedCustomer(customerData)
      setFormData({
        description: order.description || '',
        scheduled_at: order.scheduled_at ? order.scheduled_at.split('T')[0] : '',
        notes: order.notes || '',
        payment_method: order.payment_method || 'pix',
        payment_conditions: order.payment_conditions || '',
        warranty_period: order.warranty_period || 90,
        warranty_type: order.warranty_type || 'days'
      })
      if (order.pipeline_stage) setPipelineStage(order.pipeline_stage as PipelineStage)
      setSavedOrderId(order.id)

      if (order.items && order.items.length > 0) {
        const mappedItems: ServiceItem[] = order.items.map((item: any) => ({
          id: item.id,
          service_catalog_id: item.service_catalog_id,
          descricao: item.descricao || '',
          escopo_detalhado: item.escopo_detalhado || '',
          quantidade: parseFloat(item.quantidade || 1),
          preco_unitario: parseFloat(item.preco_unitario || 0),
          preco_total: parseFloat(item.preco_total || 0),
          tempo_estimado_minutos: item.tempo_estimado_minutos || 0,
          materiais: (item.materiais || []).map((m: any) => {
            const nome = m.nome_material || m.material_name || m.nome || 'Material'
            const qtd = parseFloat(m.quantidade || m.quantity || 0)
            const precoCompraUnit = parseFloat(m.preco_compra || m.unit_cost_at_time || m.unit_cost || 0)
            const precoVendaUnit = parseFloat(m.preco_venda || m.unit_sale_price || m.unit_price || 0)
            const custoTotal = parseFloat(m.custo_total || m.total_cost || 0) || precoCompraUnit * qtd
            const valorTotal = parseFloat(m.valor_total || m.total_sale_price || m.total_price || 0) || precoVendaUnit * qtd
            return {
              id: m.id,
              material_id: m.material_id,
              nome,
              quantidade: qtd,
              unidade_medida: m.material_unit || m.unidade_medida || 'un',
              preco_compra_unitario: precoCompraUnit,
              preco_venda_unitario: precoVendaUnit,
              preco_compra: precoCompraUnit * qtd,
              preco_venda: precoVendaUnit * qtd,
              custo_total: custoTotal,
              valor_total: valorTotal,
              lucro: valorTotal - custoTotal,
              tipo_uso: (m.tipo_uso || 'consumo') as 'consumo' | 'locacao',
              observacoes_tecnicas: m.observacoes_tecnicas || '',
              preco_negociado: m.preco_unitario_negociado ? parseFloat(m.preco_unitario_negociado) : null,
              quantidade_estoque: parseFloat(m.quantidade_disponivel_estoque || 0),
              alerta_estoque: m.alerta_estoque || false,
              from_inventory: !!m.material_id
            }
          }),
          funcionarios: (item.funcionarios || []).map((f: any) => ({
            id: f.id,
            staff_id: f.staff_id || f.employee_id || '',
            nome: f.nome_funcionario || f.employee_name || f.description || 'Funcionário',
            tempo_minutos: f.tempo_minutos || Math.round((f.hours || 0) * 60),
            custo_hora: parseFloat(f.custo_hora || f.hourly_rate || 0),
            custo_total: parseFloat(f.custo_total || f.total_cost || 0)
          })),
          custo_materiais: parseFloat(item.custo_materiais || 0),
          custo_mao_obra: parseFloat(item.custo_mao_obra || 0),
          custo_total: parseFloat(item.custo_total || 0),
          lucro: parseFloat(item.lucro || 0),
          margem_lucro: parseFloat(item.margem_lucro || 0),
          custos_extras: Array.isArray(item.custos_extras) ? item.custos_extras : []
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

  const handleTemplateSelect = (templateData: any) => {
    if (templateData.description) {
      setFormData(prev => ({
        ...prev,
        description: templateData.description || prev.description,
        warranty_period: templateData.warranty_period || prev.warranty_period,
        warranty_type: templateData.warranty_type || prev.warranty_type,
        payment_method: templateData.payment_method || prev.payment_method,
        payment_conditions: templateData.payment_conditions || prev.payment_conditions,
        notes: templateData.notes || prev.notes
      }))
    }

    if (templateData.serviceItems && templateData.serviceItems.length > 0) {
      const mappedItems: ServiceItem[] = templateData.serviceItems.map((item: any, idx: number) => {
        const catalogMatch = serviceCatalog.find(
          c => c.id === item.service_catalog_id || c.nome === item.descricao
        )
        const precoUnitario = parseFloat(item.preco_unitario || catalogMatch?.preco_base || 0)
        const quantidade = parseFloat(item.quantidade || 1)
        const precoTotal = precoUnitario * quantidade

        const materiais = (item.materiais || catalogMatch?.materiais || []).map((m: any) => {
          const qtd = parseFloat(m.quantidade || 0)
          const precoCompraUnit = parseFloat(m.preco_compra_unitario || m.preco_compra || 0)
          const precoVendaUnit = parseFloat(m.preco_venda_unitario || m.preco_venda || 0)
          return {
            id: `mat-tpl-${Date.now()}-${idx}-${Math.random()}`,
            material_id: m.material_id || '',
            nome: m.nome || 'Material',
            quantidade: qtd,
            unidade_medida: m.unidade_medida || 'un',
            preco_compra_unitario: precoCompraUnit,
            preco_venda_unitario: precoVendaUnit,
            preco_compra: precoCompraUnit * qtd,
            preco_venda: precoVendaUnit * qtd,
            custo_total: precoCompraUnit * qtd,
            valor_total: precoVendaUnit * qtd,
            lucro: (precoVendaUnit - precoCompraUnit) * qtd,
            tipo_uso: (m.tipo_uso || 'consumo') as 'consumo' | 'locacao',
            observacoes_tecnicas: m.observacoes_tecnicas || '',
            preco_negociado: null,
            quantidade_estoque: 0,
            alerta_estoque: false,
            from_inventory: !!m.material_id
          }
        })

        const custoMateriais = materiais.reduce((s: number, m: any) => s + m.custo_total, 0)
        const custoMaoObra = parseFloat(item.custo_mao_obra || 0)
        const custoTotal = custoMateriais + custoMaoObra
        const lucro = precoTotal - custoTotal
        const margemLucro = precoTotal > 0 ? (lucro / precoTotal) * 100 : 0

        return {
          id: `tpl-${Date.now()}-${idx}`,
          service_catalog_id: item.service_catalog_id || catalogMatch?.id,
          descricao: item.descricao || '',
          escopo_detalhado: item.escopo_detalhado || '',
          quantidade,
          preco_unitario: precoUnitario,
          preco_total: precoTotal,
          tempo_estimado_minutos: item.tempo_estimado_minutos || 60,
          materiais,
          funcionarios: [],
          custo_materiais: custoMateriais,
          custo_mao_obra: custoMaoObra,
          custo_total: custoTotal,
          lucro,
          margem_lucro: margemLucro
        }
      })
      setServiceItems(mappedItems)
    }
  }

  const handleAddService = (service: ServiceItem) => {
    setServiceItems(prev => [...prev, service])
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
    setServiceItems(prev => [...prev, newService])
  }

  const handleUpdateService = (id: string, updates: Partial<ServiceItem>) => {
    setServiceItems(prev => prev.map(item => {
      if (item.id !== id) return item

      const updated = { ...item, ...updates }

      if (updates.quantidade !== undefined || updates.preco_unitario !== undefined) {
        updated.preco_total = updated.quantidade * updated.preco_unitario
      }

      const custoMateriais = updated.materiais?.reduce((sum, m) => sum + (m.custo_total || 0), 0) || 0
      const custoMaoObra = updated.funcionarios?.reduce((sum, f) => sum + (f.custo_total || 0), 0) || 0
      const custoExtras = updated.custos_extras?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0
      updated.custo_materiais = custoMateriais
      updated.custo_mao_obra = custoMaoObra
      updated.custo_total = custoMateriais + custoMaoObra + custoExtras
      updated.lucro = updated.preco_total - updated.custo_total
      updated.margem_lucro = updated.preco_total > 0 ? ((updated.lucro / updated.preco_total) * 100) : 0

      return updated
    }))
  }

  const handleDeleteService = (id: string) => {
    setServiceItems(prev => prev.filter(item => item.id !== id))
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

  const generateOrderNumber = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const rand = String(Math.floor(Math.random() * 9000) + 1000)
    return `OS-${y}${m}${d}-${rand}`
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
      const scheduledAt = formData.scheduled_at || new Date().toISOString()

      const orderData: any = {
        customer_id: selectedCustomer.id,
        client_name: selectedCustomer.nome_razao,
        client_phone: selectedCustomer.telefone || selectedCustomer.celular || null,
        client_email: selectedCustomer.email || null,
        description: formData.description,
        scheduled_at: scheduledAt,
        notes: formData.notes,
        payment_method: formData.payment_method,
        payment_conditions: formData.payment_conditions,
        warranty_period: formData.warranty_period,
        warranty_type: formData.warranty_type,
        subtotal: totals.subtotal,
        desconto_valor: totals.desconto,
        desconto_percentual: totals.descontoPercentual,
        total_value: totals.total,
        final_total: totals.total,
        custo_total: totals.custoTotal,
        lucro_total: totals.lucroTotal,
        margem_lucro: totals.margemLucro,
        status: 'aberta',
        pipeline_stage: pipelineStage
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
        orderData.order_number = generateOrderNumber()

        const { data, error } = await supabase
          .from('service_orders')
          .insert(orderData)
          .select()
          .single()

        if (error) throw error
        orderId = data.id

        const serviceTitles = serviceItems.map(s => s.descricao).filter(Boolean).join(', ')

        // Auto-create CRM opportunity when OS is saved
        try {
          const { data: pipelines } = await supabase
            .from('crm_pipelines')
            .select('id, stages:crm_stages(id, nome, ordem)')
            .limit(1)
            .maybeSingle()

          if (pipelines) {
            const stages = (pipelines.stages || []).sort((a: any, b: any) => a.ordem - b.ordem)
            const firstStage = stages[0]
            if (firstStage) {
              const { data: opp } = await supabase
                .from('crm_opportunities')
                .insert({
                  titulo: `OS: ${selectedCustomer.nome_razao}${serviceTitles ? ` — ${serviceTitles}` : ''}`,
                  customer_id: selectedCustomer.id,
                  pipeline_id: pipelines.id,
                  stage_id: firstStage.id,
                  valor: totals.total,
                  service_order_id: orderId,
                  origem_os: true,
                  status: 'aberto',
                  temperatura: 'quente',
                  prioridade: 'alta',
                  descricao: formData.description || null
                })
                .select()
                .maybeSingle()

              if (opp) {
                await supabase
                  .from('service_orders')
                  .update({ crm_opportunity_id: opp.id })
                  .eq('id', orderId)
              }
            }
          }
        } catch {
          // CRM creation is non-blocking
        }

        setSavedOrderId(orderId as string)
      }

      for (const item of serviceItems) {
        const { data: itemData, error: itemError } = await supabase
          .from('service_order_items')
          .insert({
            service_order_id: orderId,
            service_catalog_id: item.service_catalog_id || null,
            descricao: item.descricao,
            escopo_detalhado: item.escopo_detalhado,
            quantidade: item.quantidade,
            quantity: item.quantidade,
            preco_unitario: item.preco_unitario,
            unit_price: item.preco_unitario,
            preco_total: item.preco_total,
            total_price: item.preco_total,
            tempo_estimado_minutos: item.tempo_estimado_minutos,
            estimated_duration: item.tempo_estimado_minutos,
            custo_materiais: item.custo_materiais,
            custo_mao_obra: item.custo_mao_obra,
            custo_total: item.custo_total,
            lucro: item.lucro,
            margem_lucro: item.margem_lucro,
            custos_extras: item.custos_extras || []
          })
          .select()
          .single()

        if (itemError) throw itemError

        if (item.materiais?.length > 0) {
          await supabase
            .from('service_order_materials')
            .insert(
              item.materiais.map((m: any) => ({
                service_order_id: orderId,
                service_order_item_id: itemData.id,
                material_id: m.material_id || null,
                nome_material: m.nome,
                material_name: m.nome,
                quantidade: m.quantidade,
                quantity: m.quantidade,
                material_unit: m.unidade_medida,
                unit_cost_at_time: m.preco_compra_unitario || m.preco_compra || 0,
                unit_sale_price: m.preco_venda_unitario || m.preco_venda || 0,
                unit_price: m.preco_venda_unitario || m.preco_venda || 0,
                total_price: m.valor_total || 0,
                custo_total: m.custo_total || 0,
                valor_total: m.valor_total || 0,
                total_cost: m.custo_total || 0,
                total_sale_price: m.valor_total || 0,
                tipo_uso: m.tipo_uso || 'consumo',
                observacoes_tecnicas: m.observacoes_tecnicas || null,
                preco_unitario_negociado: m.preco_negociado || null,
                quantidade_disponivel_estoque: m.quantidade_estoque || null,
                alerta_estoque: m.alerta_estoque || false
              }))
            )
        }

        if (item.funcionarios?.length > 0) {
          await supabase
            .from('service_order_labor')
            .insert(
              item.funcionarios.map((f: any) => ({
                service_order_id: orderId,
                service_order_item_id: itemData.id,
                staff_id: f.staff_id || null,
                nome_funcionario: f.nome,
                tempo_minutos: f.tempo_minutos,
                custo_hora: f.custo_hora,
                custo_total: f.custo_total,
                total_cost: f.custo_total,
                hours: (f.tempo_minutos || 0) / 60,
                hourly_rate: f.custo_hora || 0
              }))
            )
        }
      }

      if (orderId) setSavedOrderId(orderId)

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
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">
                {serviceOrderId ? 'Editar' : 'Nova'} Ordem de Serviço
              </h2>
              <OSPipelineStepper
                currentStage={pipelineStage}
                onChange={setPipelineStage}
                compact
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors text-white ml-4"
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
                    onCustomerCreated={(c) => setCustomers(prev => [c, ...prev])}
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

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors border"
                    >
                      <FileText className="h-4 w-4" />
                      Usar Template de OS
                    </button>
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
                        staff={staff}
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

                  {savedOrderId && (
                    <StockCheckPanel
                      serviceOrderId={savedOrderId}
                      serviceItems={serviceItems}
                      onRequisitionCreated={(count) => setStockRequisitionCount(count)}
                    />
                  )}

                  {stockRequisitionCount > 0 && (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <GitBranch className="h-5 w-5 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-800">
                        <strong>{stockRequisitionCount} requisição(ões) de compra</strong> criada(s) automaticamente e vinculada(s) a esta OS. Acompanhe no módulo de Compras.
                      </p>
                    </div>
                  )}

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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Prazo de Garantia</label>
                        <input
                          type="number"
                          value={formData.warranty_period}
                          onChange={(e) => setFormData({ ...formData, warranty_period: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Garantia</label>
                        <select
                          value={formData.warranty_type}
                          onChange={(e) => setFormData({ ...formData, warranty_type: e.target.value as 'days' | 'months' | 'years' })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="days">Dias</option>
                          <option value="months">Meses</option>
                          <option value="years">Anos</option>
                        </select>
                      </div>
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

      <TemplateSelector
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelect={handleTemplateSelect}
      />
    </>
  )
}
