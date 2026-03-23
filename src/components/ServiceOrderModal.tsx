import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, Trash2, Package, Users, DollarSign, Info, Calculator, Shield, User, Calendar, FileText, Clock, Search, Receipt, Download, AlertTriangle, ShoppingCart, TrendingUp, TrendingDown, Percent, ListChecks, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ServiceOrderCostManager from './ServiceOrderCostManager'
import TemplateSelectorModal from './TemplateSelectorModal'
import { fillTemplate } from '../services/templateFillService'
import { PortalAccountSelector } from './ServiceOrder/PortalAccountSelector'
import { useUser } from '../contexts/UserContext'
import ChecklistPlanner, { ChecklistStep } from './ServiceOrder/ChecklistPlanner'
import OSAddressesContacts, { OSAddress, OSContact } from './ServiceOrder/OSAddressesContacts'

interface TaxRate {
  id: string
  name: string
  rate_percentual: number
  is_active: boolean
}

interface StockAlert {
  materialId: string
  materialName: string
  requested: number
  available: number
  unit: string
}

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
  tipo: 'estoque' | 'insumo' | 'ferramenta' | 'peca'
  is_custom: boolean
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
  budgetId?: string
}

const STORAGE_KEY = 'serviceOrderDraft'

const ServiceOrderModal = ({ isOpen, onClose, onSave, orderId, budgetId }: ServiceOrderModalProps) => {
  const { profile } = useUser()
  const canEditStakeholders = !orderId || ['super_admin', 'admin', 'manager'].includes(profile?.role || '')
  const [portalAccountId, setPortalAccountId] = useState('')
  const [partnerAccountId, setPartnerAccountId] = useState('')
  const [activeTab, setActiveTab] = useState<'dados' | 'local' | 'servicos' | 'etapas' | 'pagamento' | 'garantia' | 'contrato'>('dados')
  const [osAddresses, setOsAddresses] = useState<OSAddress[]>([])
  const [osContacts, setOsContacts] = useState<OSContact[]>([])
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
  const [companySettings, setCompanySettings] = useState<any>(null)

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [globalMaterials, setGlobalMaterials] = useState<MaterialItem[]>([])
  const [globalLabor, setGlobalLabor] = useState<LaborItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false)
  const [pendingPurchaseItems, setPendingPurchaseItems] = useState<StockAlert[]>([])

  // Estados para modais de criação rápida
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [showNewServiceModal, setShowNewServiceModal] = useState(false)
  const [showNewMaterialModal, setShowNewMaterialModal] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({ nome_razao: '', telefone: '', email: '', cnpj_cpf: '' })
  const [newServiceData, setNewServiceData] = useState({ name: '', description: '', base_price: 0, estimated_time_minutes: 60 })
  const [newMaterialData, setNewMaterialData] = useState({ name: '', unit: 'un', unit_cost: 0, unit_price: 0, quantity: 1 })

  // Estados para Template Selector
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [loadedTemplateHtml, setLoadedTemplateHtml] = useState<string>('')

  // Checklist de etapas
  const [checklistSteps, setChecklistSteps] = useState<ChecklistStep[]>([])
  const [customerEquipment, setCustomerEquipment] = useState<any[]>([])

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

  useEffect(() => {
    if (formData.customer_id) {
      supabase
        .from('customer_equipment')
        .select('id, tipo_equipamento, marca, modelo, capacidade')
        .eq('customer_id', formData.customer_id)
        .then(({ data }) => setCustomerEquipment(data || []))
    } else {
      setCustomerEquipment([])
    }
  }, [formData.customer_id])

  useEffect(() => {
    if (!isOpen || !budgetId || checklistSteps.length > 0) return
    supabase
      .from('budgets')
      .select('data, customer_name')
      .eq('id', budgetId)
      .maybeSingle()
      .then(({ data: budget }) => {
        if (!budget?.data) return
        const budgetData = budget.data as any
        const items: Array<{ description?: string; name?: string; descricao?: string }> =
          budgetData.items || budgetData.services || budgetData.serviceItems || []
        if (items.length === 0) return
        const imported: ChecklistStep[] = items
          .filter(item => item.description || item.name || item.descricao)
          .map((item, i) => ({
            id: Math.random().toString(36).slice(2) + i,
            description: (item.description || item.name || item.descricao || '').toString(),
            position: i
          }))
        if (imported.length > 0) setChecklistSteps(imported)
      })
  }, [isOpen, budgetId])

  const loadData = async () => {
    try {
      const [customersRes, materialsRes, staffRes, bankAccountsRes, contractsRes, catalogRes, companyRes, taxRatesRes] = await Promise.all([
        supabase.from('customers').select('*, customer_addresses(*)').order('nome_razao'),
        supabase.from('inventory_items').select('id, name, unit, unit_cost, unit_price, quantity, min_quantity, code').eq('active', true).order('name'),
        supabase.from('employees').select('id, name, role, custo_hora, salary, encargos_percentual, horas_mensais, especialidade, nivel').eq('active', true).order('name'),
        supabase.from('bank_accounts').select('*').eq('active', true).order('account_name'),
        supabase.from('contract_templates').select('*').order('name'),
        supabase.from('service_catalog').select('*, service_catalog_materials(*)').eq('active', true).order('name'),
        supabase.from('company_settings').select('*').limit(1),
        supabase.from('tax_rates').select('*').eq('is_active', true).order('name')
      ])

      setCustomers(customersRes.data || [])
      setMaterials(materialsRes.data || [])
      setStaff(staffRes.data || [])
      setBankAccounts(bankAccountsRes.data || [])
      setContractTemplates(contractsRes.data || [])
      setServiceCatalog(catalogRes.data || [])
      setCompanySettings(companyRes.data?.[0] || null)
      setTaxRates(taxRatesRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadOrderData = async (id: string) => {
    try {
      setLoading(true)

      // Buscar ordem de serviço com TODOS os dados relacionados
      // Adicionar timestamp para evitar cache
      const cacheBuster = `?_t=${Date.now()}`

      const [orderRes, itemsRes, materialsRes, teamRes, checklistRes] = await Promise.all([
        supabase.from('service_orders').select('*').eq('id', id).single(),
        supabase.from('service_order_items').select('*').eq('service_order_id', id).order('created_at', { ascending: true }),
        supabase.from('service_order_materials').select('*').eq('service_order_id', id),
        supabase.from('service_order_team').select('*').eq('service_order_id', id),
        supabase.from('os_checklist_items').select('*').eq('os_id', id).order('position', { ascending: true })
      ])

      console.log('🔄 RELOAD FORÇADO - Items carregados:', itemsRes.data?.length || 0)

      const order = orderRes.data
      if (!order) {
        throw new Error('Ordem não encontrada')
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📦 CARREGANDO OS:', id)
      console.log('✅ TOTAL DE ITEMS NO BANCO:', itemsRes.data?.length || 0)
      console.log('✅ Items:', itemsRes.data?.map((i: any) => ({
        id: i.id.substring(0, 8),
        descricao: i.descricao?.substring(0, 30),
        created_at: i.created_at
      })))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      // Carregar portal/partner
      setPortalAccountId(order.portal_account_id || '')
      setPartnerAccountId(order.partner_account_id || '')

      // Carregar checklist de etapas
      if (checklistRes.data && checklistRes.data.length > 0) {
        setChecklistSteps(checklistRes.data.map((item: any) => ({
          id: item.id,
          description: item.description,
          equipment_id: item.equipment_id,
          technical_note: item.technical_note,
          position: item.position
        })))
      } else {
        setChecklistSteps([])
      }

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
            .from('service_order_labor')
            .select('*')
            .eq('service_order_id', id)
            .eq('service_order_item_id', item.id)

          const itemMateriais = (itemMaterialsRes.data || []).map((mat: any) => ({
            id: mat.id,
            material_id: mat.material_id || '',
            nome: mat.material_name || '',
            quantidade: mat.quantity || 0,
            unidade_medida: mat.material_unit || mat.unit || 'un',
            preco_compra_unitario: mat.unit_cost || 0,
            preco_venda_unitario: mat.unit_price || 0,
            custo_total: mat.total_cost || (mat.unit_cost || 0) * (mat.quantity || 0),
            valor_total: mat.total_price || (mat.unit_price || 0) * (mat.quantity || 0),
            lucro: ((mat.unit_price || 0) - (mat.unit_cost || 0)) * (mat.quantity || 0)
          }))

          const itemFuncionarios = (itemLaborRes.data || []).map((member: any) => ({
            id: member.id,
            staff_id: member.staff_id || '',
            nome: member.nome_funcionario || '',
            tempo_minutos: member.hours ? member.hours * 60 : 0,
            custo_hora: member.hourly_rate || 0,
            custo_total: member.total_cost || ((member.hourly_rate || 0) * (member.hours || 0))
          }))

          return {
            id: item.id,
            service_catalog_id: item.service_catalog_id || '',
            descricao: item.descricao || item.notes || 'Serviço',
            escopo: item.escopo_detalhado || '',
            escopo_detalhado: item.escopo_detalhado || '',
            quantity: item.quantity || 1,
            preco: item.unit_price || 0,
            preco_unitario: item.unit_price || 0,
            preco_total: item.total_price || 0,
            difficulty_level: typeof item.difficulty_level === 'number' ? item.difficulty_level : 1,
            complexity_level: typeof item.difficulty_level === 'string' ? item.difficulty_level : 'medium',
            notes: item.notes || '',
            materiais: itemMateriais,
            mao_obra: itemFuncionarios,
            custo_materiais: itemMateriais.reduce((sum, m) => sum + m.custo_total, 0),
            custo_mao_obra: itemFuncionarios.reduce((sum, f) => sum + f.custo_total, 0),
            custo_total: item.total_cost || 0,
            lucro: (item.total_price || 0) - (item.total_cost || 0),
            margem_lucro: item.total_price ? ((item.total_price - (item.total_cost || 0)) / item.total_price * 100) : 0
          }
        }))

        console.log('🔧 Serviços carregados com materiais e mão de obra:', loadedServiceItems)
        setServiceItems(loadedServiceItems as any)
      }

      // Carregar materiais GLOBAIS (não vinculados a serviços específicos)
      if (materialsRes.data && materialsRes.data.length > 0) {
        const globalMats = materialsRes.data.filter((mat: any) => !mat.service_order_item_id)
        const loadedMaterials = globalMats.map((mat: any) => ({
          id: mat.id,
          material_id: mat.material_id || '',
          nome: mat.material_name || '',
          quantidade: mat.quantity || 0,
          unidade_medida: mat.material_unit || mat.unit || 'un',
          preco_compra_unitario: mat.unit_cost || 0,
          preco_venda_unitario: mat.unit_price || 0,
          custo_total: mat.total_cost || (mat.unit_cost || 0) * (mat.quantity || 0),
          valor_total: mat.total_price || (mat.unit_price || 0) * (mat.quantity || 0),
          lucro: ((mat.unit_price || 0) - (mat.unit_cost || 0)) * (mat.quantity || 0),
          tipo: (mat.tipo || 'estoque') as MaterialItem['tipo'],
          is_custom: mat.is_custom || !mat.material_id
        }))
        console.log('📦 Materiais globais:', loadedMaterials)
        setGlobalMaterials(loadedMaterials as any)
      }

      // Equipe será carregada quando implementarmos o state teamMembers
      if (teamRes.data && teamRes.data.length > 0) {
        console.log('👥 Equipe disponível:', teamRes.data)
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

  const addMaterial = (tipo: MaterialItem['tipo'] = 'estoque') => {
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
      lucro: 0,
      tipo,
      is_custom: tipo !== 'estoque'
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

    const currentItem = globalMaterials.find(m => m.id === id)
    const requestedQty = currentItem?.quantidade || 1
    const availableQty = Number(material.quantity) || 0

    updateMaterial(id, {
      material_id: materialId,
      nome: material.name,
      unidade_medida: material.unit || 'UN',
      preco_compra_unitario: Number(material.unit_cost) || 0,
      preco_venda_unitario: Number(material.unit_price) || 0
    })
    setMaterialSearch('')

    if (availableQty < requestedQty) {
      const alert: StockAlert = {
        materialId,
        materialName: material.name,
        requested: requestedQty,
        available: availableQty,
        unit: material.unit || 'un'
      }
      setStockAlerts(prev => {
        const exists = prev.find(a => a.materialId === materialId)
        return exists ? prev.map(a => a.materialId === materialId ? alert : a) : [...prev, alert]
      })
    } else {
      setStockAlerts(prev => prev.filter(a => a.materialId !== materialId))
    }
  }

  const createAutoPurchaseOrder = async (items: StockAlert[]) => {
    try {
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          service_order_id: orderId || null,
          priority: 'alta',
          notes: `Gerada automaticamente pela OS${orderId ? ` (${orderId.substring(0, 8)})` : ''}`,
          total_amount: 0
        }])
        .select()
        .single()

      if (poError) throw poError

      const poItems = items.map(item => ({
        purchase_order_id: poData.id,
        inventory_item_id: item.materialId,
        item_name: item.materialName,
        quantity_requested: Math.max(item.requested - item.available, 1),
        unit: item.unit,
        unit_price: 0,
        notes: `Estoque disponível: ${item.available} ${item.unit}. Necessário: ${item.requested} ${item.unit}`
      }))

      await supabase.from('purchase_order_items').insert(poItems)

      setShowPurchaseOrderModal(false)
      setPendingPurchaseItems([])
      alert(`Ordem de Compra criada com sucesso!\nNúmero: será gerado automaticamente.\nItens: ${items.length} material(is) adicionado(s).`)
    } catch (err: any) {
      alert('Erro ao criar Ordem de Compra: ' + err.message)
    }
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

    let custoHora = Number(employee.custo_hora) || 0
    if (custoHora === 0 && employee.salary > 0) {
      const encargos = Number(employee.encargos_percentual) || 68
      const horas = Number(employee.horas_mensais) || 176
      custoHora = Math.round((employee.salary * (1 + encargos / 100) / horas) * 100) / 100
    }

    updateLabor(id, {
      staff_id: staffId,
      nome: employee.name,
      custo_hora: custoHora
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
    const total = subtotal - desconto

    const aliquota_total = taxRates.reduce((sum, t) => sum + Number(t.rate_percentual), 0)
    const valor_impostos = Math.round(total * aliquota_total / 100 * 100) / 100

    const custo_materiais_servicos = serviceItems.reduce((sum, s) => sum + s.custo_materiais, 0)
    const custo_mao_obra_servicos = serviceItems.reduce((sum, s) => sum + s.custo_mao_obra, 0)
    const custo_materiais_globais = globalMaterials.reduce((sum, m) => sum + m.custo_total, 0)
    const custo_mao_obra_globais = globalLabor.reduce((sum, l) => sum + l.custo_total, 0)

    const custo_total_materiais = custo_materiais_servicos + custo_materiais_globais
    const custo_total_mao_obra = custo_mao_obra_servicos + custo_mao_obra_globais
    const custo_total = custo_total_materiais + custo_total_mao_obra

    const margem_liquida = total - valor_impostos - custo_total
    const percentual_margem = total > 0 ? (margem_liquida / total) * 100 : 0
    const lucro_total = margem_liquida
    const margem_lucro = percentual_margem

    return {
      subtotal,
      desconto,
      total,
      aliquota_total,
      valor_impostos,
      custo_total,
      custo_total_materiais,
      custo_total_mao_obra,
      lucro_total,
      margem_liquida,
      margem_lucro,
      percentual_margem,
      global_materiais: custo_materiais_globais,
      global_mao_obra: custo_mao_obra_globais
    }
  }

  // Handlers para criação rápida
  const handleCreateCustomer = async () => {
    try {
      console.log('📝 Iniciando cadastro de cliente:', newCustomerData)
      if (!newCustomerData.nome_razao) {
        alert('Nome/Razão Social é obrigatório!')
        return
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...newCustomerData, tipo: 'fisica', active: true }])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao cadastrar cliente:', error)
        throw error
      }

      console.log('✅ Cliente cadastrado:', data)
      alert('✅ Cliente cadastrado com sucesso!')
      setCustomers([...customers, data])
      setFormData({...formData, customer_id: data.id})
      setShowNewCustomerModal(false)
      setNewCustomerData({ nome_razao: '', telefone: '', email: '', cnpj_cpf: '' })
    } catch (error: any) {
      console.error('❌ Erro completo:', error)
      alert(`❌ Erro ao cadastrar cliente: ${error.message}`)
    }
  }

  const handleCreateService = async () => {
    try {
      console.log('🛠️ Iniciando cadastro de serviço:', newServiceData)
      if (!newServiceData.name) {
        alert('Nome do serviço é obrigatório!')
        return
      }

      const { data, error } = await supabase
        .from('service_catalog')
        .insert([{ ...newServiceData, active: true, unit: 'un' }])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao cadastrar serviço:', error)
        throw error
      }

      console.log('✅ Serviço cadastrado:', data)
      alert('✅ Serviço cadastrado com sucesso!')
      setServiceCatalog([...serviceCatalog, data])
      setShowNewServiceModal(false)
      setNewServiceData({ name: '', description: '', base_price: 0, estimated_time_minutes: 60 })
    } catch (error: any) {
      console.error('❌ Erro completo:', error)
      alert(`❌ Erro ao cadastrar serviço: ${error.message}`)
    }
  }

  const handleCreateMaterial = async () => {
    try {
      console.log('📦 Iniciando cadastro de material:', newMaterialData)
      if (!newMaterialData.name) {
        alert('Nome do material é obrigatório!')
        return
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{
          name: newMaterialData.name,
          unit: newMaterialData.unit,
          unit_cost: newMaterialData.unit_cost,
          unit_price: newMaterialData.unit_price,
          quantity: newMaterialData.quantity,
          active: true,
          min_quantity: 1
        }])
        .select('id, name, unit, unit_cost, unit_price, quantity, min_quantity, code')
        .single()

      if (error) {
        console.error('❌ Erro ao cadastrar material:', error)
        throw error
      }

      console.log('✅ Material cadastrado:', data)
      alert('✅ Material cadastrado com sucesso!')
      setMaterials([...materials, data])
      setShowNewMaterialModal(false)
      setNewMaterialData({ name: '', unit: 'un', unit_cost: 0, unit_price: 0, quantity: 1 })
    } catch (error: any) {
      console.error('❌ Erro completo:', error)
      alert(`❌ Erro ao cadastrar material: ${error.message}`)
    }
  }

  const handleLoadTemplate = async (filledHtml: string, template: any) => {
    // Armazena o HTML preenchido para usar na impressão
    setLoadedTemplateHtml(filledHtml)
    setShowTemplateSelector(false)

    // Abre preview em nova janela
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${template.name} - OS ${formData.title || 'Nova'}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
              }
              @media print {
                body { margin: 0; padding: 10mm; }
              }
              @page {
                size: A4;
                margin: 10mm;
              }
            </style>
          </head>
          <body>
            ${filledHtml}
            <script>
              window.onload = () => {
                // Adiciona botão de impressão
                const printBtn = document.createElement('button')
                printBtn.textContent = '🖨️ Imprimir'
                printBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; z-index: 9999;'
                printBtn.onclick = () => window.print()
                document.body.appendChild(printBtn)

                // Esconde botão ao imprimir
                window.onbeforeprint = () => printBtn.style.display = 'none'
                window.onafterprint = () => printBtn.style.display = 'block'
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }

    alert('✅ Template carregado! Uma nova aba foi aberta com o documento preenchido.')
  }

  const handleSave = async () => {
    // Proteção contra salvamentos múltiplos simultâneos
    if (isSaving) {
      console.warn('⚠️ Salvamento já em andamento, ignorando...')
      return
    }

    try {
      if (!formData.customer_id || serviceItems.length === 0) {
        alert('Selecione um cliente e adicione pelo menos um serviço!')
        return
      }

      setIsSaving(true)
      setLoading(true)
      console.log('🔄 Iniciando salvamento da OS...')

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
        payment_pix: companySettings?.cnpj || companySettings?.cpf || '00.000.000/0000-00',
        title: (formData as any).title || '',
        brand: (formData as any).brand || '',
        model: (formData as any).model || '',
        equipment: (formData as any).equipment || '',
        prazo_execucao_dias: (formData as any).prazo_execucao_dias || null,
        relatorio_tecnico: (formData as any).relatorio_tecnico || '',
        orientacoes_servico: (formData as any).orientacoes_servico || '',
        escopo_detalhado: (formData as any).escopo_detalhado || '',
        additional_info: (formData as any).additional_info || 'Trabalhamos para que seus projetos, se tornem realidade.. Obrigado pela confiança',
        portal_account_id: portalAccountId || null,
        partner_account_id: partnerAccountId || null
      }

      let orderIdToUse = orderId

      if (orderId) {
        console.log('✏️ Atualizando OS existente:', orderId)
        const { error } = await supabase
          .from('service_orders')
          .update(orderData)
          .eq('id', orderId)

        if (error) throw error

        await supabase.from('service_order_items').delete().eq('service_order_id', orderId)
        await supabase.from('service_order_materials').delete().eq('service_order_id', orderId)
        await supabase.from('service_order_labor').delete().eq('service_order_id', orderId)
      } else {
        console.log('➕ Criando nova OS')
        const { data: order, error } = await supabase
          .from('service_orders')
          .insert([orderData])
          .select()
          .single()

        if (error) throw error
        orderIdToUse = order.id
        console.log('✅ OS criada com ID:', orderIdToUse)
      }

      console.log(`📦 Salvando ${serviceItems.length} itens de serviço...`)
      console.log('🔍 Items antes de salvar:', serviceItems.map((i: any) => ({
        id: i.id,
        descricao: i.descricao?.substring(0, 50),
        service_catalog_id: i.service_catalog_id
      })))

      // Remover duplicatas baseado em service_catalog_id + descricao
      const uniqueItems = serviceItems.filter((item: any, index, self) => {
        const key = `${item.service_catalog_id || 'null'}_${item.descricao || ''}`
        return index === self.findIndex((t: any) =>
          `${t.service_catalog_id || 'null'}_${t.descricao || ''}` === key
        )
      })

      if (uniqueItems.length !== serviceItems.length) {
        console.warn(`⚠️ Removidas ${serviceItems.length - uniqueItems.length} duplicatas!`)
      }

      for (const item of uniqueItems) {
        const itemAny = item as any
        const itemData = {
          service_order_id: orderIdToUse,
          service_catalog_id: itemAny.service_catalog_id || null,
          descricao: itemAny.descricao || '',
          escopo_detalhado: itemAny.escopo || itemAny.escopo_detalhado || '',
          quantity: itemAny.quantity || 1,
          unit_price: itemAny.preco || itemAny.preco_unitario || 0,
          total_price: (itemAny.quantity || 1) * (itemAny.preco || itemAny.preco_unitario || 0),
          difficulty_level: typeof itemAny.difficulty_level === 'number' ? itemAny.difficulty_level : 1,
          complexity_level: typeof itemAny.difficulty_level === 'string' ? itemAny.difficulty_level : 'medium',
          notes: itemAny.notes || ''
        }

        const { data: savedItem, error: itemError } = await supabase
          .from('service_order_items')
          .insert([itemData])
          .select()
          .single()

        if (itemError) {
          console.error('❌ Erro ao salvar item:', itemError)
          throw itemError
        }

        console.log('✅ Item salvo:', savedItem.id)

        if (itemAny.materiais && itemAny.materiais.length > 0) {
          console.log(`  📦 Salvando ${itemAny.materiais.length} materiais do item...`)
          for (const material of itemAny.materiais) {
            const matAny = material as any
            const materialData = {
              service_order_id: orderIdToUse,
              service_order_item_id: savedItem.id,
              material_id: matAny.material_id || null,
              material_name: matAny.nome || matAny.name || '',
              material_unit: matAny.unidade_medida || matAny.unit || 'un',
              quantity: matAny.quantidade || matAny.quantity || 0,
              unit_cost: matAny.preco_compra_unitario || matAny.preco_custo || matAny.unit_cost || 0,
              unit_price: matAny.preco_venda_unitario || matAny.preco_unitario || matAny.unit_price || 0,
              total_cost: matAny.custo_total || matAny.total_cost || 0,
              total_price: matAny.valor_total || matAny.total_price || 0
            }

            const { error: matError } = await supabase
              .from('service_order_materials')
              .insert([materialData])

            if (matError) {
              console.error('❌ Erro ao salvar material:', matError)
              throw matError
            }
          }
          console.log('  ✅ Materiais salvos')
        }

        if (itemAny.mao_obra && itemAny.mao_obra.length > 0) {
          console.log(`  👷 Salvando ${itemAny.mao_obra.length} funcionários do item...`)
          for (const labor of itemAny.mao_obra) {
            const laborAny = labor as any
            const laborData = {
              service_order_id: orderIdToUse,
              service_order_item_id: savedItem.id,
              staff_id: laborAny.employee_id || laborAny.staff_id || null,
              nome_funcionario: laborAny.nome || laborAny.name || '',
              hours: laborAny.tempo_minutos ? laborAny.tempo_minutos / 60 : (laborAny.hours || 0),
              hourly_rate: laborAny.custo_hora || laborAny.hourly_rate || 0,
              total_cost: laborAny.custo_total || laborAny.total_cost || 0
            }

            const { error: laborError } = await supabase
              .from('service_order_labor')
              .insert([laborData])

            if (laborError) {
              console.error('❌ Erro ao salvar mão de obra:', laborError)
              throw laborError
            }
          }
          console.log('  ✅ Mão de obra salva')
        }
      }

      if (globalMaterials && globalMaterials.length > 0) {
        console.log(`📦 Salvando ${globalMaterials.length} materiais globais...`)
        for (const material of globalMaterials) {
          const matAny = material as any
          const materialData = {
            service_order_id: orderIdToUse,
            service_order_item_id: null,
            material_id: matAny.material_id || null,
            material_name: matAny.nome || matAny.name || '',
            material_unit: matAny.unidade_medida || matAny.unit || 'un',
            quantity: matAny.quantidade || matAny.quantity || 0,
            unit_cost: matAny.preco_compra_unitario || matAny.preco_custo || matAny.unit_cost || 0,
            unit_price: matAny.preco_venda_unitario || matAny.preco_unitario || matAny.unit_price || 0,
            total_cost: matAny.custo_total || matAny.total_cost || 0,
            total_price: matAny.valor_total || matAny.total_price || 0
          }

          const { error: matError } = await supabase
            .from('service_order_materials')
            .insert([materialData])

          if (matError) {
            console.error('❌ Erro ao salvar material global:', matError)
            throw matError
          }
        }
        console.log('✅ Materiais globais salvos')
      }

      // Equipe será salva quando implementarmos o state teamMembers
      console.log('ℹ️ Salvamento de equipe será implementado')

      // Salvar checklist de etapas
      if (checklistSteps.length > 0) {
        await supabase.from('os_checklist_items').delete().eq('os_id', orderIdToUse)
        const checklistInserts = checklistSteps.map((step, i) => ({
          os_id: orderIdToUse,
          description: step.description,
          equipment_id: (step as any).equipment_id || null,
          technical_note: (step as any).technical_note || null,
          is_completed: false,
          position: i
        }))
        await supabase.from('os_checklist_items').insert(checklistInserts)
      }

      const addrRows = osAddresses.filter(a => a.logradouro || a.cep || a.cidade)
      const contactRows = osContacts.filter(c => c.nome || c.telefone)
      await supabase.from('service_order_addresses').delete().eq('service_order_id', orderIdToUse)
      await supabase.from('service_order_contacts').delete().eq('service_order_id', orderIdToUse)
      if (addrRows.length > 0) {
        await supabase.from('service_order_addresses').insert(
          addrRows.map(({ id: _, service_order_id: __, ...rest }) => ({ ...rest, service_order_id: orderIdToUse }))
        )
      }
      if (contactRows.length > 0) {
        await supabase.from('service_order_contacts').insert(
          contactRows.map(({ id: _, service_order_id: __, ...rest }) => ({ ...rest, service_order_id: orderIdToUse }))
        )
      }

      console.log('✅ OS salva com sucesso! ID:', orderIdToUse)
      clearDraft()
      alert('✅ Ordem de Serviço salva com sucesso!')
      onSave()
      onClose()
    } catch (error) {
      console.error('❌ Erro ao salvar ordem:', error)
      alert('❌ Erro ao salvar ordem de serviço! Verifique o console.')
    } finally {
      setIsSaving(false)
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg"
              title="Carregar template de OS com dados preenchidos"
            >
              <Download className="h-5 w-5" />
              Carregar Template
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('dados')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'dados'
                ? 'bg-blue-500 text-white border-b-4 border-blue-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <User className="h-5 w-5" />
            📋 Dados Básicos
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'local'
                ? 'bg-blue-600 text-white border-b-4 border-blue-700'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <MapPin className="h-5 w-5" />
            Local / Contatos
          </button>
          <button
            onClick={() => setActiveTab('servicos')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'servicos'
                ? 'bg-green-500 text-white border-b-4 border-green-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <Package className="h-5 w-5" />
            🔧 Serviços e Materiais
          </button>
          <button
            onClick={() => setActiveTab('etapas')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'etapas'
                ? 'bg-orange-500 text-white border-b-4 border-orange-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <ListChecks className="h-5 w-5" />
            Etapas
            {checklistSteps.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'etapas' ? 'bg-white/30 text-white' : 'bg-orange-100 text-orange-700'
              }`}>
                {checklistSteps.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pagamento')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pagamento'
                ? 'bg-emerald-500 text-white border-b-4 border-emerald-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <DollarSign className="h-5 w-5" />
            💰 Pagamento
          </button>
          <button
            onClick={() => setActiveTab('garantia')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'garantia'
                ? 'bg-amber-500 text-white border-b-4 border-amber-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <Shield className="h-5 w-5" />
            ⏰ Garantia
          </button>
          <button
            onClick={() => setActiveTab('contrato')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'contrato'
                ? 'bg-purple-500 text-white border-b-4 border-purple-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <FileText className="h-5 w-5" />
            📄 Contrato
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dados' && (
              <motion.div key="dados" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Cliente *</label>
                    <div className="flex gap-2">
                      <select value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecione...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.nome_razao}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Abrindo modal de novo cliente')
                          setShowNewCustomerModal(true)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        title="Novo Cliente"
                      >
                        <Plus className="h-4 w-4" />
                        Novo Cliente
                      </button>
                    </div>

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

                  <div className="md:col-span-2">
                    <PortalAccountSelector
                      clientPortalAccountId={portalAccountId}
                      partnerAccountId={partnerAccountId}
                      onClientChange={setPortalAccountId}
                      onPartnerChange={setPartnerAccountId}
                      disabled={!canEditStakeholders}
                      orderTotal={totals?.total || 0}
                    />
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

            {activeTab === 'local' && (
              <motion.div key="local" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-1">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    Endereços de Instalação e Contatos no Local
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Informe o(s) endereço(s) onde o serviço será executado e as pessoas de contato.
                    Não precisa ser o endereço cadastrado do cliente.
                  </p>
                  <OSAddressesContacts
                    serviceOrderId={orderId || undefined}
                    onAddressesChange={setOsAddresses}
                    onContactsChange={setOsContacts}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'servicos' && (
              <motion.div key="servicos" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Serviços da OS</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Abrindo modal de cadastro de novo serviço')
                        setShowNewServiceModal(true)
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      title="Cadastrar Novo Serviço no Sistema"
                    >
                      <Plus className="h-4 w-4" />
                      Cadastrar Novo
                    </button>
                    <button onClick={addServiceItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Serviço
                    </button>
                  </div>
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
                        <div className="flex gap-2">
                          <input type="text"
                            value={activeServiceSearchId === item.id ? serviceSearch : ''}
                            onFocus={() => setActiveServiceSearchId(item.id)}
                            onChange={(e) => {
                              setActiveServiceSearchId(item.id)
                              setServiceSearch(e.target.value)
                            }}
                            className="flex-1 px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Digite para buscar no catálogo..." />
                          <button
                            type="button"
                            onClick={() => {
                              console.log('Abrindo modal de novo serviço')
                              setShowNewServiceModal(true)
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                            title="Novo Serviço"
                          >
                            <Plus className="h-4 w-4" />
                            Novo Serviço
                          </button>
                        </div>

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

            {activeTab === 'etapas' && (
              <motion.div key="etapas" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-orange-500" />
                      Etapas do Serviço
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Defina o checklist passo a passo que o técnico irá seguir no campo. Use os atalhos ou adicione etapas manualmente.
                    </p>
                  </div>
                  {checklistSteps.length === 0 && (
                    <span className="flex-shrink-0 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold">
                      Nenhuma etapa definida
                    </span>
                  )}
                  {checklistSteps.length > 0 && (
                    <span className="flex-shrink-0 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold">
                      {checklistSteps.length} etapa{checklistSteps.length !== 1 ? 's' : ''} planejada{checklistSteps.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <ChecklistPlanner
                  steps={checklistSteps}
                  onChange={setChecklistSteps}
                  customerEquipment={customerEquipment}
                />

                {checklistSteps.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-blue-800 mb-1">Como funciona a transferência</p>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Ao salvar, cada etapa vira um item interativo no celular do técnico</li>
                      <li>O técnico marca as etapas conforme executa o serviço</li>
                      <li>O progresso atualiza em tempo real aqui no escritório</li>
                      <li>A OS só pode ser finalizada quando 100% das etapas forem concluídas</li>
                    </ol>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'materiais' && (
              <motion.div key="materiais" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Insumos, Materiais e Ferramentas</h3>
                    <p className="text-sm text-gray-600">Adicione itens do estoque ou cadastre manualmente</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewMaterialModal(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                    title="Cadastrar novo item no estoque"
                  >
                    <Plus className="h-4 w-4" />
                    Novo no Estoque
                  </button>
                </div>

                {/* Category add buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {([
                    { tipo: 'estoque' as const, label: 'Do Estoque', icon: '📦', color: 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100', desc: 'Buscar item cadastrado' },
                    { tipo: 'insumo' as const, label: 'Insumo', icon: '🧪', color: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100', desc: 'Fluidos, gases, consumíveis' },
                    { tipo: 'ferramenta' as const, label: 'Ferramenta Especial', icon: '🔧', color: 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100', desc: 'Equipamentos e ferramentas' },
                    { tipo: 'peca' as const, label: 'Peça / Componente', icon: '⚙️', color: 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100', desc: 'Placas, bombas, compressores' },
                  ]).map(cat => (
                    <button
                      key={cat.tipo}
                      type="button"
                      onClick={() => addMaterial(cat.tipo)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center ${cat.color}`}
                    >
                      <span className="text-xl mb-1">{cat.icon}</span>
                      <span className="text-sm font-semibold">{cat.label}</span>
                      <span className="text-xs opacity-70 mt-0.5">{cat.desc}</span>
                    </button>
                  ))}
                </div>

                {globalMaterials.length === 0 && (
                  <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-sm">Nenhum item adicionado</p>
                    <p className="text-xs mt-1">Use os botões acima para adicionar materiais por categoria</p>
                  </div>
                )}

                {globalMaterials.map((material, index) => {
                  const tipoConfig: Record<string, { icon: string; label: string; badgeColor: string; borderColor: string }> = {
                    estoque: { icon: '📦', label: 'Estoque', badgeColor: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-200' },
                    insumo: { icon: '🧪', label: 'Insumo', badgeColor: 'bg-amber-100 text-amber-700', borderColor: 'border-amber-200' },
                    ferramenta: { icon: '🔧', label: 'Ferramenta', badgeColor: 'bg-slate-100 text-slate-700', borderColor: 'border-slate-200' },
                    peca: { icon: '⚙️', label: 'Peça', badgeColor: 'bg-green-100 text-green-700', borderColor: 'border-green-200' },
                  }
                  const cfg = tipoConfig[material.tipo] || tipoConfig.estoque
                  const isStock = material.tipo === 'estoque'

                  return (
                    <div key={`material-${material.id}-${index}`} className={`border-2 rounded-xl p-4 bg-white ${cfg.borderColor}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cfg.icon}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badgeColor}`}>{cfg.label}</span>
                          <span className="text-sm text-gray-500">#{index + 1}</span>
                        </div>
                        <button onClick={() => removeMaterial(material.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Stock search OR custom name */}
                        {isStock ? (
                          <div className="md:col-span-2 relative">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Buscar no Estoque</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={activeServiceSearchId === material.id ? materialSearch : (material.nome || '')}
                                onChange={(e) => {
                                  setActiveServiceSearchId(material.id)
                                  setMaterialSearch(e.target.value)
                                }}
                                onFocus={() => {
                                  setActiveServiceSearchId(material.id)
                                  setMaterialSearch('')
                                }}
                                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Digite para buscar..."
                              />
                            </div>
                            {activeServiceSearchId === material.id && materialSearch && (
                              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                                {materials.filter(m =>
                                  m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
                                  (m.code && m.code.toLowerCase().includes(materialSearch.toLowerCase()))
                                ).length === 0 ? (
                                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    Nenhum item encontrado
                                    <button
                                      type="button"
                                      onClick={() => setShowNewMaterialModal(true)}
                                      className="block w-full mt-2 text-blue-600 hover:underline text-xs"
                                    >+ Cadastrar "{materialSearch}" no estoque</button>
                                  </div>
                                ) : (
                                  materials.filter(m =>
                                    m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
                                    (m.sku && m.sku.toLowerCase().includes(materialSearch.toLowerCase()))
                                  ).map(mat => (
                                    <button
                                      key={mat.id}
                                      type="button"
                                      onClick={() => {
                                        selectMaterial(material.id, mat.id)
                                        setActiveServiceSearchId(null)
                                        setMaterialSearch('')
                                      }}
                                      className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-0 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-900 text-sm">{mat.name}</span>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${Number(mat.quantity) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                          {Number(mat.quantity) > 0 ? `${mat.quantity} ${mat.unit}` : 'Sem estoque'}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                                        {mat.code && <span>Cód: {mat.code}</span>}
                                        <span>Custo: {formatCurrency(mat.unit_cost || 0)}</span>
                                        <span>Venda: {formatCurrency(mat.unit_price || 0)}</span>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição / Nome *</label>
                            <input
                              type="text"
                              value={material.nome}
                              onChange={(e) => updateMaterial(material.id, { nome: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder={
                                material.tipo === 'insumo' ? 'Ex: Gás refrigerante R410A, óleo lubrificante...' :
                                material.tipo === 'ferramenta' ? 'Ex: Manifold digital, vacuômetro, multímetro...' :
                                'Ex: Placa eletrônica, bomba de dreno, compressor...'
                              }
                            />
                          </div>
                        )}

                        {/* Qty and unit */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                          <input type="number" value={material.quantidade} min="0" step="0.01"
                            onChange={(e) => updateMaterial(material.id, { quantidade: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
                          {material.is_custom ? (
                            <select
                              value={material.unidade_medida}
                              onChange={(e) => updateMaterial(material.id, { unidade_medida: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              {['UN', 'PC', 'KG', 'L', 'M', 'M²', 'CX', 'PT', 'GL', 'HR', 'SV'].map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          ) : (
                            <input type="text" value={material.unidade_medida} readOnly
                              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" />
                          )}
                        </div>

                        {/* Cost and price */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Custo Unit. (R$)</label>
                          <input
                            type="number"
                            value={material.preco_compra_unitario}
                            readOnly={!material.is_custom}
                            onChange={(e) => material.is_custom && updateMaterial(material.id, { preco_compra_unitario: Number(e.target.value) })}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${material.is_custom ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'}`}
                            step="0.01" min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Preço Venda (R$)</label>
                          <input
                            type="number"
                            value={material.preco_venda_unitario}
                            readOnly={!material.is_custom}
                            onChange={(e) => material.is_custom && updateMaterial(material.id, { preco_venda_unitario: Number(e.target.value) })}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${material.is_custom ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'}`}
                            step="0.01" min="0"
                          />
                        </div>

                        {/* Note for custom items */}
                        {material.is_custom && (
                          <div className="md:col-span-4">
                            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                              Item personalizado — não vinculado ao estoque. Apenas para registro de custo na OS.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                          <span className="text-xs text-red-600">Custo Total</span>
                          <p className="text-base font-bold text-red-700">{formatCurrency(material.custo_total)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                          <span className="text-xs text-green-600">Valor Total</span>
                          <p className="text-base font-bold text-green-700">{formatCurrency(material.valor_total)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <span className="text-xs text-blue-600">Lucro</span>
                          <p className="text-base font-bold text-blue-700">{formatCurrency(material.lucro)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
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

            {activeTab === 'custos-extras' && orderId && (
              <motion.div key="custos-extras" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-6">
                <ServiceOrderCostManager
                  serviceOrderId={orderId}
                  onUpdate={() => {
                    console.log('Custos atualizados')
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'custos-extras' && !orderId && (
              <motion.div key="custos-extras-disabled" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <Receipt className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">Salve a OS primeiro</h3>
                  <p className="text-yellow-700">
                    Para adicionar custos extras, você precisa primeiro salvar a Ordem de Serviço.
                  </p>
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

                    <div className="bg-white rounded-lg p-6 border-2 border-gray-300 shadow-sm space-y-3">
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

                    <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 space-y-3">
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-slate-600" />
                        Análise Financeira Interna
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <p className="text-xs text-slate-500 mb-1">Faturamento Bruto</p>
                          <p className="font-bold text-slate-900 text-base">{formatCurrency(totals.total)}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <p className="text-xs text-red-600 mb-1 flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Impostos ({totals.aliquota_total.toFixed(2)}%)
                          </p>
                          <p className="font-bold text-red-700 text-base">- {formatCurrency(totals.valor_impostos)}</p>
                          <p className="text-xs text-red-500 mt-1">{taxRates.map(t => t.name).join(' + ')}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                          <p className="text-xs text-orange-600 mb-1 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Custo de Materiais
                          </p>
                          <p className="font-bold text-orange-700 text-base">- {formatCurrency(totals.custo_total_materiais)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Custo de Mão de Obra
                          </p>
                          <p className="font-bold text-blue-700 text-base">- {formatCurrency(totals.custo_total_mao_obra)}</p>
                        </div>
                      </div>
                      <div className={`rounded-lg p-4 border-2 ${totals.margem_liquida >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Margem de Lucro Líquida</p>
                            <p className="text-xs text-gray-500 mt-0.5">Bruto - Impostos - Materiais - MO</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-2xl ${totals.margem_liquida >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {formatCurrency(totals.margem_liquida)}
                            </p>
                            <p className={`text-sm font-semibold flex items-center justify-end gap-1 ${totals.margem_liquida >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {totals.margem_liquida >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {totals.percentual_margem.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {stockAlerts.length > 0 && (
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-300">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Alerta de Estoque Insuficiente ({stockAlerts.length})
                          </h4>
                          <button
                            onClick={() => { setPendingPurchaseItems(stockAlerts); setShowPurchaseOrderModal(true) }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Gerar Ordem de Compra
                          </button>
                        </div>
                        <div className="space-y-2">
                          {stockAlerts.map(alert => (
                            <div key={alert.materialId} className="flex justify-between items-center text-sm bg-white rounded p-2 border border-amber-200">
                              <span className="font-medium text-amber-900">{alert.materialName}</span>
                              <div className="text-right">
                                <span className="text-red-600 font-semibold">Disponível: {alert.available} {alert.unit}</span>
                                <span className="text-gray-500 mx-2">|</span>
                                <span className="text-amber-700">Necessário: {alert.requested} {alert.unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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

      {/* Modal Confirmar Ordem de Compra */}
      {showPurchaseOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-amber-600" />
              Gerar Ordem de Compra Automática
            </h3>
            <p className="text-sm text-gray-600 mb-4">Os seguintes materiais estão com estoque insuficiente. Uma Ordem de Compra será gerada automaticamente:</p>
            <div className="space-y-2 mb-6 max-h-56 overflow-y-auto">
              {pendingPurchaseItems.map(item => (
                <div key={item.materialId} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
                  <span className="font-medium text-gray-800">{item.materialName}</span>
                  <div className="text-right">
                    <p className="text-red-600 font-semibold">Falta: {Math.max(item.requested - item.available, 0)} {item.unit}</p>
                    <p className="text-gray-500 text-xs">Estoque: {item.available} | Pedido: {item.requested}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowPurchaseOrderModal(false); setPendingPurchaseItems([]) }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => createAutoPurchaseOrder(pendingPurchaseItems)}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Confirmar e Gerar OC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Cliente */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowNewCustomerModal(false)
            setNewCustomerData({ nome_razao: '', telefone: '', email: '', cnpj_cpf: '' })
          }
        }}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Novo Cliente
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome/Razão Social *</label>
                <input
                  type="text"
                  value={newCustomerData.nome_razao}
                  onChange={(e) => setNewCustomerData({...newCustomerData, nome_razao: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Nome completo ou razão social"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CPF/CNPJ</label>
                <input
                  type="text"
                  value={newCustomerData.cnpj_cpf}
                  onChange={(e) => setNewCustomerData({...newCustomerData, cnpj_cpf: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <input
                  type="text"
                  value={newCustomerData.telefone}
                  onChange={(e) => setNewCustomerData({...newCustomerData, telefone: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({...newCustomerData, email: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewCustomerModal(false)
                  setNewCustomerData({ nome_razao: '', telefone: '', email: '', cnpj_cpf: '' })
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCustomer}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Serviço */}
      {showNewServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowNewServiceModal(false)
            setNewServiceData({ name: '', description: '', base_price: 0, estimated_time_minutes: 60 })
          }
        }}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Novo Serviço
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  value={newServiceData.name}
                  onChange={(e) => setNewServiceData({...newServiceData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Instalação Elétrica"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={newServiceData.description}
                  onChange={(e) => setNewServiceData({...newServiceData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva o serviço..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preço Base (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newServiceData.base_price}
                  onChange={(e) => setNewServiceData({...newServiceData, base_price: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tempo Estimado (minutos)</label>
                <input
                  type="number"
                  value={newServiceData.estimated_time_minutes}
                  onChange={(e) => setNewServiceData({...newServiceData, estimated_time_minutes: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewServiceModal(false)
                  setNewServiceData({ name: '', description: '', base_price: 0, estimated_time_minutes: 60 })
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateService}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Material */}
      {showNewMaterialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowNewMaterialModal(false)
            setNewMaterialData({ name: '', unit: 'un', unit_cost: 0, unit_price: 0, quantity: 1 })
          }
        }}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Novo Material
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Material *</label>
                <input
                  type="text"
                  value={newMaterialData.name}
                  onChange={(e) => setNewMaterialData({...newMaterialData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: Tubo PVC 100mm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unidade</label>
                <select
                  value={newMaterialData.unit}
                  onChange={(e) => setNewMaterialData({...newMaterialData, unit: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="un">Unidade (un)</option>
                  <option value="m">Metro (m)</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="l">Litro (l)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="pç">Peça (pç)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantidade Inicial</label>
                <input
                  type="number"
                  value={newMaterialData.quantity}
                  onChange={(e) => setNewMaterialData({...newMaterialData, quantity: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preço de Custo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newMaterialData.unit_cost}
                  onChange={(e) => setNewMaterialData({...newMaterialData, unit_cost: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preço de Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newMaterialData.unit_price}
                  onChange={(e) => setNewMaterialData({...newMaterialData, unit_price: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewMaterialModal(false)
                  setNewMaterialData({ name: '', unit: 'un', unit_cost: 0, unit_price: 0, quantity: 1 })
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateMaterial}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelectorModal
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          templateType="service_order"
          data={{
            service_order: {
              order_number: formData.title || 'Nova OS',
              description: formData.description,
              scheduled_at: formData.scheduled_at,
              warranty_period: formData.warranty_period,
              warranty_type: formData.warranty_type,
              warranty_terms: formData.warranty_terms,
              payment_method: formData.payment_method,
              payment_installments: formData.payment_installments,
              notes: formData.notes,
              estimated_hours: formData.estimated_hours,
              brand: formData.brand,
              model: formData.model,
              equipment: formData.equipment,
              prazo_execucao_dias: formData.prazo_execucao_dias,
              relatorio_tecnico: formData.relatorio_tecnico,
              orientacoes_servico: formData.orientacoes_servico,
              escopo_detalhado: formData.escopo_detalhado,
              total_price: calculateTotals().total,
              subtotal: calculateTotals().subtotal,
              discount: calculateTotals().desconto,
              total_cost: calculateTotals().custo_total,
              profit: calculateTotals().lucro_total,
              profit_margin: calculateTotals().margem_lucro
            },
            customer: selectedCustomer ? {
              name: selectedCustomer.nome_razao,
              cpf_cnpj: selectedCustomer.cnpj_cpf,
              email: selectedCustomer.email,
              phone: selectedCustomer.telefone,
              address: selectedCustomer.endereco,
              city: selectedCustomer.cidade,
              state: selectedCustomer.estado,
              zip: selectedCustomer.cep
            } : {},
            company: companySettings ? {
              name: companySettings.company_name,
              cnpj: companySettings.cnpj,
              email: companySettings.email,
              phone: companySettings.phone,
              address: companySettings.address,
              city: companySettings.city,
              state: companySettings.state
            } : {},
            services: serviceItems.map(item => ({
              description: item.descricao,
              quantity: item.quantidade,
              unit_price: item.preco_unitario,
              total_price: item.preco_total,
              estimated_time: item.tempo_estimado_minutos,
              cost: item.custo_total,
              profit: item.lucro,
              profit_margin: item.margem_lucro
            })),
            materials: [
              ...serviceItems.flatMap(s => s.materiais || []),
              ...globalMaterials
            ].map(m => ({
              name: m.nome,
              quantity: m.quantidade,
              unit: m.unidade_medida,
              unit_cost: m.preco_compra_unitario,
              unit_price: m.preco_venda_unitario,
              total_cost: m.custo_total,
              total_price: m.valor_total
            })),
            labor: [
              ...serviceItems.flatMap(s => s.funcionarios || []),
              ...globalLabor
            ].map(l => ({
              name: l.nome,
              time_minutes: l.tempo_minutos,
              cost_per_hour: l.custo_hora,
              total_cost: l.custo_total
            }))
          }}
          onSelect={handleLoadTemplate}
          title="Selecionar Template de Ordem de Serviço"
        />
      )}
    </div>
  )
}

export default ServiceOrderModal
