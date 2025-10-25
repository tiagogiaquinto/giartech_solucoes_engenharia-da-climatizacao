import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, Trash2, Package, Users, DollarSign, Info, Calculator, Shield, User, Calendar, FileText, Clock, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ServiceItem {
  id: string
  catalog_service_id?: string
  descricao: string
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
  onSave: () => void
  orderId?: string
}

const STORAGE_KEY = 'serviceOrderDraft'

const ServiceOrderModal = ({ isOpen, onClose, onSave, orderId }: ServiceOrderModalProps) => {
  const [activeTab, setActiveTab] = useState<'dados' | 'servicos' | 'materiais' | 'mao-obra' | 'pagamento' | 'garantia' | 'resumo'>('dados')
  const [loading, setLoading] = useState(false)
  const [materialSearch, setMaterialSearch] = useState('')
  const [laborSearch, setLaborSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [activeServiceSearchId, setActiveServiceSearchId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_id: '',
    description: '',
    scheduled_at: '',
    desconto_percentual: 0,
    desconto_valor: 0,
    show_material_costs: false,
    payment_method: 'dinheiro',
    payment_installments: 1,
    warranty_period: 90,
    warranty_type: 'days',
    warranty_terms: '',
    bank_account_id: '',
    contract_template_id: '',
    contract_notes: '',
    notes: '',
    estimated_hours: 0,
    actual_hours: 0,
    title: '',
    brand: '',
    model: '',
    equipment: '',
    prazo_execucao_dias: 15,
    relatorio_tecnico: '',
    orientacoes_servico: '',
    escopo_detalhado: '',
    additional_info: ''
  })

  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [contractTemplates, setContractTemplates] = useState<any[]>([])
  const [serviceCatalog, setServiceCatalog] = useState<any[]>([])

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [globalMaterials, setGlobalMaterials] = useState<MaterialItem[]>([])
  const [globalLabor, setGlobalLabor] = useState<LaborItem[]>([])

  useEffect(() => {
    if (isOpen) {
      loadData()
      if (orderId) {
        loadOrderData(orderId)
      } else {
        loadDraft()
      }
    } else {
      setActiveTab('dados')
    }
  }, [isOpen, orderId])

  useEffect(() => {
    if (isOpen && !orderId) {
      saveDraft()
    }
  }, [formData, serviceItems, globalMaterials, globalLabor])

  useEffect(() => {
    if (formData.customer_id && customers.length > 0) {
      const customer = customers.find(c => c.id === formData.customer_id)
      setSelectedCustomer(customer || null)
    }
  }, [formData.customer_id, customers])

  const loadData = async () => {
    try {
      const [customersRes, materialsRes, staffRes, bankAccountsRes, contractsRes, catalogRes] = await Promise.all([
        supabase.from('customers').select('*, customer_addresses(*)').order('nome_razao'),
        supabase.from('materials').select('*').eq('active', true).order('name'),
        supabase.from('employees').select('id, name, role, custo_hora, especialidade, nivel').eq('active', true).order('name'),
        supabase.from('bank_accounts').select('*').eq('active', true).order('account_name'),
        supabase.from('contract_templates').select('*').order('name'),
        supabase.from('service_catalog').select('*, service_catalog_materials(*)').eq('active', true).order('name')
      ])

      setCustomers(customersRes.data || [])
      setMaterials(materialsRes.data || [])
      setStaff(staffRes.data || [])
      setBankAccounts(bankAccountsRes.data || [])
      setContractTemplates(contractsRes.data || [])
      setServiceCatalog(catalogRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadOrderData = async (id: string) => {
    try {
      setLoading(true)

      // Buscar ordem de serviço com TODOS os dados relacionados
      const [orderRes, itemsRes, materialsRes, teamRes] = await Promise.all([
        supabase.from('service_orders').select('*').eq('id', id).single(),
        supabase.from('service_order_items').select('*').eq('service_order_id', id),
        supabase.from('service_order_materials').select('*').eq('service_order_id', id),
        supabase.from('service_order_team').select('*').eq('service_order_id', id)
      ])

      const order = orderRes.data
      if (!order) {
        throw new Error('Ordem não encontrada')
      }

      console.log('📦 Carregando OS:', id)
      console.log('✅ Ordem:', order)
      console.log('✅ Itens:', itemsRes.data)
      console.log('✅ Materiais:', materialsRes.data)
      console.log('✅ Equipe:', teamRes.data)

      // Carregar dados básicos da OS
      setFormData({
        customer_id: order.customer_id || '',
        description: order.description || '',
        scheduled_at: order.scheduled_at || '',
        desconto_percentual: order.discount_percentage || 0,
        desconto_valor: order.discount_amount || 0,
        show_material_costs: order.show_material_costs || false,
        payment_method: order.payment_method || 'dinheiro',
        payment_installments: order.payment_installments || 1,
        warranty_period: order.warranty_period || 90,
        warranty_type: order.warranty_type || 'days',
        warranty_terms: order.warranty_terms || '',
        bank_account_id: order.bank_account_id || '',
        contract_template_id: order.contract_template_id || '',
        contract_notes: order.contract_notes || '',
        notes: order.notes || '',
        estimated_hours: order.estimated_hours || 0,
        actual_hours: order.actual_hours || 0,
        title: order.title || '',
        brand: order.brand || '',
        model: order.model || '',
        equipment: order.equipment || '',
        prazo_execucao_dias: order.prazo_execucao_dias || 15,
        relatorio_tecnico: order.relatorio_tecnico || '',
        orientacoes_servico: order.orientacoes_servico || '',
        escopo_detalhado: order.escopo_detalhado || '',
        additional_info: order.additional_info || ''
      })

      // Carregar itens de serviço
      if (itemsRes.data && itemsRes.data.length > 0) {
        const loadedServiceItems = await Promise.all(itemsRes.data.map(async (item: any) => {
          // Buscar materiais e mão de obra deste serviço específico
          const itemMaterialsRes = await supabase
            .from('service_order_materials')
            .select('*')
            .eq('service_order_id', id)
            .eq('service_order_item_id', item.id)

          const itemLaborRes = await supabase
            .from('service_order_team')
            .select('*')
            .eq('service_order_id', id)
            .eq('service_order_item_id', item.id)

          const itemMateriais = (itemMaterialsRes.data || []).map((mat: any) => ({
            id: mat.id,
            material_id: mat.material_id || '',
            nome: mat.material_name || '',
            quantidade: mat.quantity || 0,
            unidade_medida: mat.unit || 'un',
            preco_compra_unitario: mat.unit_cost || 0,
            preco_venda_unitario: mat.unit_price || 0,
            custo_total: (mat.unit_cost || 0) * (mat.quantity || 0),
            valor_total: (mat.unit_price || 0) * (mat.quantity || 0),
            lucro: ((mat.unit_price || 0) - (mat.unit_cost || 0)) * (mat.quantity || 0)
          }))

          const itemFuncionarios = (itemLaborRes.data || []).map((member: any) => ({
            id: member.id,
            staff_id: member.employee_id || '',
            nome: member.employee_name || '',
            tempo_minutos: member.hours_worked ? member.hours_worked * 60 : 0,
            custo_hora: member.hourly_rate || 0,
            custo_total: (member.hourly_rate || 0) * (member.hours_worked || 0)
          }))

          return {
            id: item.id,
            catalog_service_id: item.service_catalog_id || '',
            descricao: item.service_name || item.description || 'Serviço',
            quantidade: item.quantity || 1,
            preco_unitario: item.unit_price || 0,
            preco_total: item.total_price || 0,
            tempo_estimado_minutos: item.estimated_duration || 0,
            materiais: itemMateriais,
            funcionarios: itemFuncionarios,
            custo_materiais: itemMateriais.reduce((sum, m) => sum + m.custo_total, 0),
            custo_mao_obra: itemFuncionarios.reduce((sum, f) => sum + f.custo_total, 0),
            custo_total: item.total_cost || 0,
            lucro: (item.total_price || 0) - (item.total_cost || 0),
            margem_lucro: item.total_price ? ((item.total_price - (item.total_cost || 0)) / item.total_price * 100) : 0
          }
        }))

        console.log('🔧 Serviços carregados com materiais e mão de obra:', loadedServiceItems)
        setServiceItems(loadedServiceItems)
      }

      // Carregar materiais GLOBAIS (não vinculados a serviços específicos)
      if (materialsRes.data && materialsRes.data.length > 0) {
        const globalMats = materialsRes.data.filter((mat: any) => !mat.service_order_item_id)
        const loadedMaterials = globalMats.map((mat: any) => ({
          id: mat.id,
          material_id: mat.material_id || '',
          nome: mat.material_name || '',
          quantidade: mat.quantity || 0,
          unidade_medida: mat.unit || 'un',
          preco_compra_unitario: mat.unit_cost || 0,
          preco_venda_unitario: mat.unit_price || 0,
          custo_total: (mat.unit_cost || 0) * (mat.quantity || 0),
          valor_total: (mat.unit_price || 0) * (mat.quantity || 0),
          lucro: ((mat.unit_price || 0) - (mat.unit_cost || 0)) * (mat.quantity || 0)
        }))
        console.log('📦 Materiais globais:', loadedMaterials)
        setGlobalMaterials(loadedMaterials)
      }

      // Carregar mão de obra GLOBAL (não vinculada a serviços específicos)
      if (teamRes.data && teamRes.data.length > 0) {
        const globalLabor = teamRes.data.filter((member: any) => !member.service_order_item_id)
        const loadedLabor = globalLabor.map((member: any) => ({
          id: member.id,
          staff_id: member.employee_id || '',
          nome: member.employee_name || '',
          tempo_minutos: member.hours_worked ? member.hours_worked * 60 : 0,
          custo_hora: member.hourly_rate || 0,
          custo_total: (member.hourly_rate || 0) * (member.hours_worked || 0)
        }))
        console.log('👷 Mão de obra global:', loadedLabor)
        setGlobalLabor(loadedLabor)
      }

      console.log('✅ Carregamento completo!')
    } catch (error) {
      console.error('❌ Erro ao carregar OS:', error)
      alert('Erro ao carregar dados da ordem de serviço: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = () => {
    try {
      const draft = {
        formData,
        serviceItems,
        globalMaterials,
        globalLabor,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        setFormData(draft.formData || formData)
        setServiceItems(draft.serviceItems || [])
        setGlobalMaterials(draft.globalMaterials || [])
        setGlobalLabor(draft.globalLabor || [])
      }
    } catch (error) {
      console.error('Error loading draft:', error)
    }
  }

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing draft:', error)
    }
  }

  const addServiceItem = () => {
    setServiceItems([{
      id: crypto.randomUUID(),
      descricao: '',
      quantidade: 1,
      preco_unitario: 0,
      preco_total: 0,
      tempo_estimado_minutos: 0,
      materiais: [],
      funcionarios: [],
      custo_materiais: 0,
      custo_mao_obra: 0,
      custo_total: 0,
      lucro: 0,
      margem_lucro: 0
    }, ...serviceItems])
  }

  const removeServiceItem = (id: string) => {
    setServiceItems(serviceItems.filter(s => s.id !== id))
  }

  const updateServiceItem = (id: string, updates: Partial<ServiceItem>) => {
    setServiceItems(serviceItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates }
        updated.preco_total = updated.quantidade * updated.preco_unitario

        updated.custo_materiais = updated.materiais?.reduce((sum, m) => sum + m.custo_total, 0) || 0
        updated.custo_mao_obra = updated.funcionarios?.reduce((sum, f) => sum + f.custo_total, 0) || 0
        updated.custo_total = updated.custo_materiais + updated.custo_mao_obra
        updated.lucro = updated.preco_total - updated.custo_total
        updated.margem_lucro = updated.custo_total > 0 ? (updated.lucro / updated.custo_total) * 100 : 0

        return updated
      }
      return item
    }))
  }

  const addMaterial = () => {
    setGlobalMaterials([{
      id: crypto.randomUUID(),
      material_id: '',
      nome: '',
      quantidade: 1,
      unidade_medida: 'UN',
      preco_compra_unitario: 0,
      preco_venda_unitario: 0,
      custo_total: 0,
      valor_total: 0,
      lucro: 0
    }, ...globalMaterials])
  }

  const removeMaterial = (id: string) => {
    setGlobalMaterials(globalMaterials.filter(m => m.id !== id))
  }

  const updateMaterial = (id: string, updates: Partial<MaterialItem>) => {
    setGlobalMaterials(globalMaterials.map(m => {
      if (m.id === id) {
        const updated = { ...m, ...updates }
        updated.custo_total = updated.quantidade * updated.preco_compra_unitario
        updated.valor_total = updated.quantidade * updated.preco_venda_unitario
        updated.lucro = updated.valor_total - updated.custo_total
        return updated
      }
      return m
    }))
  }

  const selectMaterial = (id: string, materialId: string) => {
    const material = materials.find(m => m.id === materialId)
    if (!material) return

    updateMaterial(id, {
      material_id: materialId,
      nome: material.name,
      unidade_medida: material.unit || 'UN',
      preco_compra_unitario: Number(material.unit_cost) || 0,
      preco_venda_unitario: Number(material.sale_price) || 0
    })
    setMaterialSearch('')
  }

  const addLabor = () => {
    setGlobalLabor([{
      id: crypto.randomUUID(),
      staff_id: '',
      nome: '',
      tempo_minutos: 60,
      custo_hora: 0,
      custo_total: 0
    }, ...globalLabor])
  }

  const removeLabor = (id: string) => {
    setGlobalLabor(globalLabor.filter(l => l.id !== id))
  }

  const updateLabor = (id: string, updates: Partial<LaborItem>) => {
    setGlobalLabor(globalLabor.map(l => {
      if (l.id === id) {
        const updated = { ...l, ...updates }
        const horas = updated.tempo_minutos / 60
        updated.custo_total = horas * updated.custo_hora
        return updated
      }
      return l
    }))
  }

  const selectStaff = (id: string, staffId: string) => {
    const employee = staff.find(s => s.id === staffId)
    if (!employee) return

    updateLabor(id, {
      staff_id: staffId,
      nome: employee.name,
      custo_hora: Number(employee.custo_hora) || 0
    })
    setLaborSearch('')
  }

  const selectCatalogService = (serviceItemId: string, catalogServiceId: string) => {
    const catalogService = serviceCatalog.find(s => s.id === catalogServiceId)
    if (!catalogService) return

    updateServiceItem(serviceItemId, {
      catalog_service_id: catalogServiceId,
      descricao: catalogService.name,
      preco_unitario: Number(catalogService.base_price) || 0,
      tempo_estimado_minutos: Number(catalogService.estimated_time_minutes) || 0
    })
    setServiceSearch('')
    setActiveServiceSearchId(null)
  }

  const calculateTotals = () => {
    const subtotal = serviceItems.reduce((sum, s) => sum + s.preco_total, 0)
    const desconto = formData.desconto_valor || (subtotal * (formData.desconto_percentual / 100))

    const custo_materiais_servicos = serviceItems.reduce((sum, s) => sum + s.custo_materiais, 0)
    const custo_mao_obra_servicos = serviceItems.reduce((sum, s) => sum + s.custo_mao_obra, 0)
    const custo_materiais_globais = globalMaterials.reduce((sum, m) => sum + m.custo_total, 0)
    const custo_mao_obra_globais = globalLabor.reduce((sum, l) => sum + l.custo_total, 0)

    const custo_total = custo_materiais_servicos + custo_mao_obra_servicos + custo_materiais_globais + custo_mao_obra_globais
    const total = subtotal - desconto
    const lucro_total = total - custo_total
    const margem_lucro = custo_total > 0 ? (lucro_total / custo_total) * 100 : 0

    return {
      subtotal,
      desconto,
      total,
      custo_total,
      lucro_total,
      margem_lucro,
      custo_total_materiais: custo_materiais_servicos + custo_materiais_globais,
      custo_total_mao_obra: custo_mao_obra_servicos + custo_mao_obra_globais,
      global_materiais: custo_materiais_globais,
      global_mao_obra: custo_mao_obra_globais
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.customer_id || serviceItems.length === 0) {
        alert('Selecione um cliente e adicione pelo menos um serviço!')
        return
      }

      setLoading(true)

      const totals = calculateTotals()

      const warrantyEndDate = formData.scheduled_at ? new Date(
        new Date(formData.scheduled_at).getTime() +
        (formData.warranty_period * (
          formData.warranty_type === 'days' ? 86400000 :
          formData.warranty_type === 'months' ? 2592000000 : 31536000000
        ))
      ).toISOString().split('T')[0] : null

      const orderData = {
        customer_id: formData.customer_id,
        description: formData.description,
        scheduled_at: formData.scheduled_at || null,
        status: 'aberta',
        total_value: totals.total,
        desconto_percentual: formData.desconto_percentual,
        desconto_valor: formData.desconto_valor,
        custo_total_materiais: totals.custo_total_materiais,
        custo_total_mao_obra: totals.custo_total_mao_obra,
        custo_total: totals.custo_total,
        lucro_total: totals.lucro_total,
        margem_lucro: totals.margem_lucro,
        show_material_costs: formData.show_material_costs,
        payment_method: formData.payment_method,
        payment_installments: formData.payment_installments,
        bank_account_id: formData.bank_account_id || null,
        warranty_period: formData.warranty_period,
        warranty_type: formData.warranty_type,
        warranty_terms: formData.warranty_terms,
        warranty_end_date: warrantyEndDate,
        contract_template_id: formData.contract_template_id || null,
        contract_notes: formData.contract_notes,
        subtotal: totals.subtotal,
        discount_amount: totals.desconto,
        final_total: totals.total,
        notes: formData.notes,
        client_name: selectedCustomer?.nome_razao || '',
        client_company_name: selectedCustomer?.nome_fantasia || '',
        client_cnpj: selectedCustomer?.cnpj || '',
        client_cpf: selectedCustomer?.cpf || '',
        client_phone: selectedCustomer?.telefone_1 || '',
        client_email: selectedCustomer?.email || '',
        client_address: selectedCustomer?.endereco_logradouro ?
          `${selectedCustomer.endereco_logradouro}${selectedCustomer.endereco_numero ? ', ' + selectedCustomer.endereco_numero : ''}${selectedCustomer.endereco_complemento ? ' - ' + selectedCustomer.endereco_complemento : ''}${selectedCustomer.endereco_bairro ? ', ' + selectedCustomer.endereco_bairro : ''}` : '',
        client_city: selectedCustomer?.endereco_cidade || '',
        client_state: selectedCustomer?.endereco_estado || '',
        client_cep: selectedCustomer?.endereco_cep || '',
        payment_methods: 'Transferência bancária, dinheiro, cartão de crédito, cartão de débito ou pix',
        payment_pix: selectedCustomer?.cnpj || selectedCustomer?.cpf || '',
        title: (formData as any).title || '',
        brand: (formData as any).brand || '',
        model: (formData as any).model || '',
        equipment: (formData as any).equipment || '',
        prazo_execucao_dias: (formData as any).prazo_execucao_dias || null,
        relatorio_tecnico: (formData as any).relatorio_tecnico || '',
        orientacoes_servico: (formData as any).orientacoes_servico || '',
        escopo_detalhado: (formData as any).escopo_detalhado || '',
        additional_info: (formData as any).additional_info || 'Trabalhamos para que seus projetos, se tornem realidade.. Obrigado pela confiança'
      }

      let orderIdToUse = orderId

      if (orderId) {
        const { error } = await supabase
          .from('service_orders')
          .update(orderData)
          .eq('id', orderId)

        if (error) throw error
      } else {
        const { data: order, error } = await supabase
          .from('service_orders')
          .insert([orderData])
          .select()
          .single()

        if (error) throw error
        orderIdToUse = order.id
      }

      clearDraft()
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving order:', error)
      alert('Erro ao salvar ordem de serviço!')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const totals = calculateTotals()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-7 w-7" />
              {orderId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
            </h2>
            <p className="text-blue-100 text-sm mt-1">Preencha os dados em cada aba - salvamento automático</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex border-b bg-gray-50">
          {[
            { id: 'dados', label: 'Dados Básicos', icon: Info },
            { id: 'servicos', label: 'Serviços', icon: Package },
            { id: 'materiais', label: 'Materiais', icon: Package },
            { id: 'mao-obra', label: 'Mão de Obra', icon: Users },
            { id: 'pagamento', label: 'Pagamento', icon: DollarSign },
            { id: 'garantia', label: 'Garantia & Contrato', icon: Shield },
            { id: 'resumo', label: 'Resumo Financeiro', icon: Calculator }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dados' && (
              <motion.div key="dados" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Cliente *</label>
                    <select value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecione...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.nome_razao}</option>)}
                    </select>

                    {selectedCustomer && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-semibold text-blue-900">CPF/CNPJ:</span>
                            <span className="text-blue-800 ml-2">{selectedCustomer.cpf_cnpj}</span>
                          </div>
                          {selectedCustomer.telefone && (
                            <div>
                              <span className="font-semibold text-blue-900">Telefone:</span>
                              <span className="text-blue-800 ml-2">{selectedCustomer.telefone}</span>
                            </div>
                          )}
                          {selectedCustomer.email && (
                            <div className="md:col-span-2">
                              <span className="font-semibold text-blue-900">Email:</span>
                              <span className="text-blue-800 ml-2">{selectedCustomer.email}</span>
                            </div>
                          )}
                          {selectedCustomer.customer_addresses && selectedCustomer.customer_addresses.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="font-semibold text-blue-900">Endereço:</span>
                              <span className="text-blue-800 ml-2">
                                {selectedCustomer.customer_addresses[0].logradouro}, {selectedCustomer.customer_addresses[0].numero}
                                {selectedCustomer.customer_addresses[0].complemento && `, ${selectedCustomer.customer_addresses[0].complemento}`}
                                {' - '}{selectedCustomer.customer_addresses[0].bairro}, {selectedCustomer.customer_addresses[0].cidade} - {selectedCustomer.customer_addresses[0].estado}
                                {', CEP: '}{selectedCustomer.customer_addresses[0].cep}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Data Agendada</label>
                    <input type="datetime-local" value={formData.scheduled_at}
                      onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Descrição Geral</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3}
                      placeholder="Descrição opcional da OS..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Observações Internas</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={2}
                      placeholder="Notas internas (não aparecem para o cliente)..." />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 text-blue-700">📋 Informações do Orçamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Título do Projeto</label>
                      <input type="text" value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: climatização apartamento da familia" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Marca</label>
                      <input type="text" value={formData.brand}
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Midea" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Modelo</label>
                      <input type="text" value={formData.model}
                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: VRF" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Aparelho/Equipamento</label>
                      <input type="text" value={formData.equipment}
                        onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: cassete 1 via e hiwall" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Prazo de Execução (dias)</label>
                      <input type="number" value={formData.prazo_execucao_dias}
                        onChange={(e) => setFormData({...formData, prazo_execucao_dias: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="15" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Escopo Detalhado</label>
                      <textarea value={formData.escopo_detalhado}
                        onChange={(e) => setFormData({...formData, escopo_detalhado: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3}
                        placeholder="Descrição detalhada do escopo do projeto..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Relatório Técnico</label>
                      <textarea value={formData.relatorio_tecnico}
                        onChange={(e) => setFormData({...formData, relatorio_tecnico: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3}
                        placeholder="Relatório técnico do serviço..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Orientações de Serviço</label>
                      <textarea value={formData.orientacoes_servico}
                        onChange={(e) => setFormData({...formData, orientacoes_servico: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3}
                        placeholder="Orientações específicas para execução..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Informações Adicionais</label>
                      <textarea value={formData.additional_info}
                        onChange={(e) => setFormData({...formData, additional_info: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={2}
                        placeholder="Trabalhamos para que seus projetos, se tornem realidade.. Obrigado pela confiança" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 text-gray-700">⏱️ Tempo de Execução</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <label className="block text-sm font-medium mb-2 text-blue-900">Tempo Previsto (horas)</label>
                      <input
                        type="number"
                        value={formData.estimated_hours}
                        onChange={(e) => setFormData({...formData, estimated_hours: Number(e.target.value)})}
                        min="0"
                        step="0.5"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 4"
                      />
                      <p className="text-xs text-blue-700 mt-1">Tempo estimado total para execução da OS</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <label className="block text-sm font-medium mb-2 text-green-900">Tempo Real (horas)</label>
                      <input
                        type="number"
                        value={formData.actual_hours}
                        onChange={(e) => setFormData({...formData, actual_hours: Number(e.target.value)})}
                        min="0"
                        step="0.5"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Ex: 3.5"
                      />
                      <p className="text-xs text-green-700 mt-1">Tempo real gasto após conclusão</p>
                    </div>
                  </div>
                  {formData.estimated_hours > 0 && formData.actual_hours > 0 && (
                    <div className={`mt-3 p-3 rounded-lg ${
                      formData.actual_hours <= formData.estimated_hours
                        ? 'bg-green-100 border border-green-300'
                        : 'bg-red-100 border border-red-300'
                    }`}>
                      <p className={`text-sm font-medium ${
                        formData.actual_hours <= formData.estimated_hours
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}>
                        {formData.actual_hours <= formData.estimated_hours
                          ? '✓ Dentro do prazo estimado!'
                          : `⚠️ ${(formData.actual_hours - formData.estimated_hours).toFixed(1)}h acima do estimado`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'servicos' && (
              <motion.div key="servicos" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Serviços da OS</h3>
                  <button onClick={addServiceItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Serviço
                  </button>
                </div>

                {serviceItems.length === 0 && (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhum serviço adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Serviço" para começar</p>
                  </div>
                )}

                {serviceItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Serviço #{index + 1}</h4>
                      <button onClick={() => removeServiceItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3 relative">
                        <label className="block text-sm font-medium mb-1">🔍 Buscar no Catálogo de Serviços</label>
                        <input type="text"
                          value={activeServiceSearchId === item.id ? serviceSearch : ''}
                          onFocus={() => setActiveServiceSearchId(item.id)}
                          onChange={(e) => {
                            setActiveServiceSearchId(item.id)
                            setServiceSearch(e.target.value)
                          }}
                          className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Digite para buscar no catálogo..." />

                        {activeServiceSearchId === item.id && serviceSearch && serviceCatalog.filter(s =>
                          s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                          (s.category && s.category.toLowerCase().includes(serviceSearch.toLowerCase()))
                        ).length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {serviceCatalog.filter(s =>
                              s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                              (s.category && s.category.toLowerCase().includes(serviceSearch.toLowerCase()))
                            ).map(srv => (
                              <button
                                key={srv.id}
                                type="button"
                                onClick={() => selectCatalogService(item.id, srv.id)}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-0 transition-colors"
                              >
                                <div className="font-medium text-gray-900">{srv.name}</div>
                                <div className="text-sm text-gray-600 flex items-center justify-between">
                                  <span>{srv.category || 'Sem categoria'}</span>
                                  <span className="font-semibold text-blue-600">
                                    {formatCurrency(Number(srv.base_price) || 0)} - {srv.estimated_time_minutes || 0}min
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium mb-1">Descrição do Serviço *</label>
                        <input type="text" value={item.descricao}
                          onChange={(e) => updateServiceItem(item.id, {descricao: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Instalação de Ar Condicionado" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Quantidade</label>
                        <input type="number" value={item.quantidade} min="1"
                          onChange={(e) => updateServiceItem(item.id, {quantidade: Number(e.target.value)})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Preço Unitário</label>
                        <input type="number" value={item.preco_unitario} min="0" step="0.01"
                          onChange={(e) => updateServiceItem(item.id, {preco_unitario: Number(e.target.value)})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tempo Estimado (min)</label>
                        <input type="number" value={item.tempo_estimado_minutos} min="0"
                          onChange={(e) => updateServiceItem(item.id, {tempo_estimado_minutos: Number(e.target.value)})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>

                    <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-900">Preço Total:</span>
                        <span className="text-lg font-bold text-blue-900">{formatCurrency(item.preco_total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'materiais' && (
              <motion.div key="materiais" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Materiais da OS</h3>
                    <p className="text-sm text-gray-600">Materiais que serão consumidos nesta ordem de serviço</p>
                  </div>
                  <button onClick={addMaterial}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Material
                  </button>
                </div>

                {globalMaterials.length === 0 && (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhum material adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Material" para começar</p>
                  </div>
                )}

                {globalMaterials.map((material, index) => (
                  <div key={`material-${material.id}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Material #{index + 1}</h4>
                      <button onClick={() => removeMaterial(material.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2 relative">
                        <label className="block text-sm font-medium mb-1">🔍 Buscar Material</label>
                        <input type="text" value={materialSearch}
                          onChange={(e) => setMaterialSearch(e.target.value)}
                          className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Digite para buscar no estoque..." />

                        {materialSearch && materials.filter(m =>
                          m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
                          (m.sku && m.sku.toLowerCase().includes(materialSearch.toLowerCase()))
                        ).length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {materials.filter(m =>
                              m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
                              (m.sku && m.sku.toLowerCase().includes(materialSearch.toLowerCase()))
                            ).map(mat => (
                              <button
                                key={mat.id}
                                type="button"
                                onClick={() => selectMaterial(material.id, mat.id)}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-0 transition-colors"
                              >
                                <div className="font-medium text-gray-900">{mat.name}</div>
                                <div className="text-sm text-gray-600 flex items-center justify-between">
                                  <span>{mat.sku || 'Sem SKU'} - {mat.unit}</span>
                                  <span className="font-semibold text-blue-600">
                                    Estoque: {mat.quantity}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Nome do Material *</label>
                        <input type="text" value={material.nome} readOnly
                          className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                          placeholder="Selecione um material" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Quantidade *</label>
                        <input type="number" value={material.quantidade} min="0" step="0.01"
                          onChange={(e) => updateMaterial(material.id, {quantidade: Number(e.target.value)})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Unidade</label>
                        <input type="text" value={material.unidade_medida} readOnly
                          className="w-full px-4 py-2 border rounded-lg bg-gray-100" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Custo Unit. (Compra)</label>
                        <input type="number" value={material.preco_compra_unitario} readOnly
                          className="w-full px-4 py-2 border rounded-lg bg-gray-100" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Preço Unit. (Venda)</label>
                        <input type="number" value={material.preco_venda_unitario} readOnly
                          className="w-full px-4 py-2 border rounded-lg bg-gray-100" />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <span className="text-xs text-red-700">Custo Total:</span>
                        <p className="text-lg font-bold text-red-700">{formatCurrency(material.custo_total)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <span className="text-xs text-green-700">Valor Total:</span>
                        <p className="text-lg font-bold text-green-700">{formatCurrency(material.valor_total)}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <span className="text-xs text-blue-700">Lucro:</span>
                        <p className="text-lg font-bold text-blue-700">{formatCurrency(material.lucro)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'mao-obra' && (
              <motion.div key="mao-obra" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Mão de Obra da OS</h3>
                    <p className="text-sm text-gray-600">Funcionários que trabalharão nesta ordem de serviço</p>
                  </div>
                  <button onClick={addLabor}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Funcionário
                  </button>
                </div>

                {globalLabor.length === 0 && (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhum funcionário adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Funcionário" para começar</p>
                  </div>
                )}

                {globalLabor.map((labor, index) => (
                  <div key={`labor-${labor.id}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Funcionário #{index + 1}</h4>
                      <button onClick={() => removeLabor(labor.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2 relative">
                        <label className="block text-sm font-medium mb-1">🔍 Buscar Funcionário</label>
                        <input type="text" value={laborSearch}
                          onChange={(e) => setLaborSearch(e.target.value)}
                          className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Digite para buscar..." />

                        {laborSearch && staff.filter(s =>
                          s.name.toLowerCase().includes(laborSearch.toLowerCase()) ||
                          (s.role && s.role.toLowerCase().includes(laborSearch.toLowerCase()))
                        ).length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {staff.filter(s =>
                              s.name.toLowerCase().includes(laborSearch.toLowerCase()) ||
                              (s.role && s.role.toLowerCase().includes(laborSearch.toLowerCase()))
                            ).map(emp => (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => selectStaff(labor.id, emp.id)}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-0 transition-colors"
                              >
                                <div className="font-medium text-gray-900">{emp.name}</div>
                                <div className="text-sm text-gray-600 flex items-center justify-between">
                                  <span>{emp.role || 'Sem função'}</span>
                                  <span className="font-semibold text-blue-600">
                                    R$ {Number(emp.custo_hora || 0).toFixed(2)}/h
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Nome do Funcionário *</label>
                        <input type="text" value={labor.nome} readOnly
                          className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                          placeholder="Selecione um funcionário" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Tempo (minutos) *</label>
                        <input type="number" value={labor.tempo_minutos} min="0" step="10"
                          onChange={(e) => updateLabor(labor.id, {tempo_minutos: Number(e.target.value)})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Custo/Hora</label>
                        <input type="number" value={labor.custo_hora} readOnly
                          className="w-full px-4 py-2 border rounded-lg bg-gray-100" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Horas Trabalhadas</label>
                        <input type="text" value={`${(labor.tempo_minutos / 60).toFixed(2)}h`} readOnly
                          className="w-full px-4 py-2 border rounded-lg bg-blue-50 text-blue-900 font-semibold" />
                      </div>
                    </div>

                    <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-900">Custo Total:</span>
                        <span className="text-lg font-bold text-blue-900">{formatCurrency(labor.custo_total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'pagamento' && (
              <motion.div key="pagamento" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                    <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="debito">Cartão de Débito</option>
                      <option value="credito">Cartão de Crédito</option>
                      <option value="transferencia">Transferência Bancária</option>
                      <option value="boleto">Boleto</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Parcelas</label>
                    <select value={formData.payment_installments} onChange={(e) => setFormData({...formData, payment_installments: Number(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="1">À vista</option>
                      {[2,3,4,5,6,7,8,9,10,12].map(n => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Conta Bancária</label>
                    <select value={formData.bank_account_id} onChange={(e) => setFormData({...formData, bank_account_id: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Padrão</option>
                      {bankAccounts.map(ba => (
                        <option key={ba.id} value={ba.id}>
                          {ba.account_name} - {ba.bank_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Desconto (Opcional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Desconto Percentual (%)</label>
                      <input
                        type="number"
                        value={formData.desconto_percentual}
                        min="0"
                        max="100"
                        step="0.01"
                        onChange={(e) => setFormData({...formData, desconto_percentual: Number(e.target.value), desconto_valor: 0})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 5"
                      />
                      <p className="text-xs text-gray-500 mt-1">Deixe em 0 se não houver desconto</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Desconto em Reais (R$)</label>
                      <input
                        type="number"
                        value={formData.desconto_valor}
                        min="0"
                        step="0.01"
                        onChange={(e) => setFormData({...formData, desconto_valor: Number(e.target.value), desconto_percentual: 0})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 50.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ou defina um valor fixo</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'garantia' && (
              <motion.div key="garantia" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Período de Garantia</label>
                    <input type="number" value={formData.warranty_period} min="0"
                      onChange={(e) => setFormData({...formData, warranty_period: Number(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de Período</label>
                    <select value={formData.warranty_type} onChange={(e) => setFormData({...formData, warranty_type: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="days">Dias</option>
                      <option value="months">Meses</option>
                      <option value="years">Anos</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Termos de Garantia</label>
                    <textarea value={formData.warranty_terms} onChange={(e) => setFormData({...formData, warranty_terms: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3}
                      placeholder="Descreva as condições da garantia..." />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Contrato</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Modelo de Contrato</label>
                      <select value={formData.contract_template_id} onChange={(e) => setFormData({...formData, contract_template_id: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Nenhum</option>
                        {contractTemplates.map(ct => (
                          <option key={ct.id} value={ct.id}>{ct.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Observações do Contrato</label>
                      <textarea value={formData.contract_notes} onChange={(e) => setFormData({...formData, contract_notes: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3}
                        placeholder="Observações adicionais..." />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'resumo' && (
              <motion.div key="resumo" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Resumo da Ordem de Serviço</h3>
                  <p className="text-sm text-gray-600 mb-6">Informações que serão apresentadas ao cliente</p>

                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3">Serviços Contratados</h4>
                      <div className="space-y-2">
                        {serviceItems.map((item, index) => (
                          <div key={item.id} className="flex justify-between text-sm py-2 border-b last:border-0">
                            <div>
                              <span className="font-medium">{index + 1}. {item.descricao}</span>
                              <span className="text-gray-600 ml-2">(Qtd: {item.quantidade})</span>
                            </div>
                            <span className="font-bold text-blue-700">{formatCurrency(item.preco_total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Informações de Pagamento</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Forma de Pagamento:</span>
                          <span className="font-semibold capitalize">{formData.payment_method.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Parcelas:</span>
                          <span className="font-semibold">{formData.payment_installments === 1 ? 'À vista' : `${formData.payment_installments}x`}</span>
                        </div>
                        {formData.payment_installments > 1 && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Valor por Parcela:</span>
                            <span className="font-semibold">{formatCurrency(totals.total / formData.payment_installments)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-3">Garantia</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Período de Garantia:</span>
                          <span className="font-semibold">
                            {formData.warranty_period} {
                              formData.warranty_type === 'days' ? 'dias' :
                              formData.warranty_type === 'months' ? 'meses' : 'anos'
                            }
                          </span>
                        </div>
                        {formData.warranty_terms && (
                          <div className="mt-2 p-3 bg-white rounded border">
                            <p className="text-xs text-gray-600 font-medium mb-1">Termos de Garantia:</p>
                            <p className="text-sm text-gray-700">{formData.warranty_terms}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 border-2 border-gray-300 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex justify-between text-base">
                          <span className="text-gray-700">Subtotal dos Serviços:</span>
                          <span className="font-bold">{formatCurrency(totals.subtotal)}</span>
                        </div>
                        {totals.desconto > 0 && (
                          <div className="flex justify-between text-base">
                            <span className="text-gray-700">Desconto Aplicado:</span>
                            <span className="font-bold text-red-600">- {formatCurrency(totals.desconto)}</span>
                          </div>
                        )}
                        <div className="border-t-2 pt-3 flex justify-between items-center">
                          <span className="font-bold text-xl text-gray-900">VALOR TOTAL DA PROPOSTA:</span>
                          <span className="font-bold text-3xl text-green-600">{formatCurrency(totals.total)}</span>
                        </div>
                      </div>
                    </div>

                    {formData.contract_notes && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Observações do Contrato</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.contract_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t p-6 bg-gray-50 rounded-b-xl flex justify-between">
          <button onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading}
            className="px-8 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : orderId ? 'Atualizar OS' : 'Salvar OS'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default ServiceOrderModal
