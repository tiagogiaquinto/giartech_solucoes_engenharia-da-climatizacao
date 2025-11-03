import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Trash2, Save, X, User, Calendar, FileText, Package, Users, Clock, DollarSign, TrendingUp, CircleAlert as AlertCircle, Check, Printer, Send, Download, Eye, FileDown, Search, ChevronDown, ChevronUp, Building2, CreditCard, FileSignature, Wrench } from 'lucide-react'
import { supabase, getServiceOrderById } from '../lib/supabase'
import { generateServiceOrderPDFGiartech } from '../utils/generateServiceOrderPDFGiartech'
import { getCompanyInfo } from '../utils/companyData'
import { mapServiceItems } from '../utils/serviceOrderDataMapper'
import { useAutoSave } from '../hooks/useAutoSave'
import { SmartServiceSearch } from '../components/SmartServiceSearch'
import { TemplateSelector } from '../components/TemplateSelector'
import { RealtimeCalculationPanel } from '../components/RealtimeCalculationPanel'

interface ServiceItem {
  id: string
  service_catalog_id?: string
  nome?: string
  descricao: string
  escopo?: string
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

const ServiceOrderCreate = () => {
  const navigate = useNavigate()
  const { id: paramId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit') || paramId
  const isEditMode = Boolean(editId)
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [contractTemplates, setContractTemplates] = useState<any[]>([])
  const [serviceCatalog, setServiceCatalog] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [activeTab, setActiveTab] = useState<'dados' | 'servicos' | 'pagamento' | 'garantia' | 'contrato'>('dados')

  const [formData, setFormData] = useState<{
    customer_id: string
    description: string
    scheduled_at: string
    prazo_execucao_dias: number
    data_inicio_execucao: string
    desconto_percentual: number
    desconto_valor: number
    show_material_costs: boolean
    show_value: boolean
    relatorio_tecnico: string
    orientacoes_servico: string
    escopo_detalhado: string
    payment_method: string
    payment_installments: number
    payment_conditions: string
    warranty_period: number
    warranty_type: string
    warranty_terms: string
    bank_account_id: string
    contract_template_id: string
    contract_notes: string
    notes: string
    custo_deslocamento: number
    custo_estacionamento: number
    custo_pedagio: number
    custo_outros: number
    descricao_outros: string
    company_name: string
    company_cnpj: string
    company_address: string
    company_phone: string
    company_email: string
    payment_methods_text: string
    payment_pix: string
    bank_name: string
    bank_agency: string
    bank_account: string
    bank_account_type: string
    bank_holder: string
    contract_clauses: string
    additional_info: string
  }>({
    customer_id: '',
    description: '',
    scheduled_at: '',
    prazo_execucao_dias: 7,
    data_inicio_execucao: '',
    desconto_percentual: 0,
    desconto_valor: 0,
    show_material_costs: false,
    show_value: true,
    relatorio_tecnico: '',
    orientacoes_servico: '',
    escopo_detalhado: '',
    payment_method: 'dinheiro',
    payment_installments: 1,
    payment_conditions: 'Sinal de 50% e o valor restante após a conclusão.',
    warranty_period: 90,
    warranty_type: 'days',
    warranty_terms: '',
    bank_account_id: '',
    contract_template_id: '',
    contract_notes: '',
    notes: '',
    custo_deslocamento: 0,
    custo_estacionamento: 0,
    custo_pedagio: 0,
    custo_outros: 0,
    descricao_outros: '',
    company_name: '',
    company_cnpj: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    payment_methods_text: 'Transferência bancária, dinheiro, cartão de crédito, cartão de débito ou pix',
    payment_pix: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    bank_account_type: 'Corrente',
    bank_holder: '',
    contract_clauses: '',
    additional_info: 'Trabalhamos para que seus projetos, se tornem realidade.'
  })

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([{
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
  }])

  const [totals, setTotals] = useState({
    subtotal: 0,
    desconto: 0,
    total: 0,
    custo_total_materiais: 0,
    custo_total_mao_obra: 0,
    custo_total: 0,
    lucro_total: 0,
    margem_lucro: 0
  })

  const [searchStaffTerm, setSearchStaffTerm] = useState<Record<string, string>>({})
  const [expandedSections, setExpandedSections] = useState({
    company: false,
    bankData: false,
    additionalClauses: false
  })
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [showNewServiceModal, setShowNewServiceModal] = useState(false)
  const [showNewMaterialModal, setShowNewMaterialModal] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({ nome_razao: '', telefone: '', email: '', cnpj_cpf: '' })
  const [newServiceData, setNewServiceData] = useState({ name: '', description: '', base_price: 0, estimated_time_minutes: 60 })
  const [newMaterialData, setNewMaterialData] = useState({ name: '', unit: 'un', unit_cost: 0, unit_price: 0, quantity: 1 })

  const toggleSection = (section: 'company' | 'bankData' | 'additionalClauses') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Auto-Save - Pacote B
  const { isSaving, lastSaved, error: saveError } = useAutoSave({
    key: 'service-order-draft',
    data: { formData, serviceItems, totals },
    interval: 30000,
    onSave: async (data) => {
      if (!isEditMode && formData.customer_id && formData.description) {
        const { error } = await supabase
          .from('service_order_drafts')
          .upsert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            customer_id: formData.customer_id,
            draft_name: `OS - ${customers.find(c => c.id === formData.customer_id)?.name || 'Cliente'} - ${new Date().toLocaleString('pt-BR')}`,
            draft_data: data,
            last_saved_at: new Date().toISOString()
          })
        if (error) throw error
      }
    }
  })

  useEffect(() => {
    loadData()
    if (isEditMode && editId) {
      loadOrderData(editId)
    }
  }, [editId])

  useEffect(() => {
    calculateTotals()
  }, [serviceItems, formData.desconto_percentual, formData.desconto_valor])

  const loadOrderData = async (orderId: string) => {
    try {
      setLoading(true)
      const orderData = await getServiceOrderById(orderId) as any

      if (orderData) {
        setFormData({
          customer_id: orderData.client_id || '',
          description: orderData.description || '',
          scheduled_at: orderData.due_date ? new Date(orderData.due_date).toISOString().slice(0, 16) :
                       orderData.scheduled_at ? new Date(orderData.scheduled_at).toISOString().slice(0, 16) : '',
          prazo_execucao_dias: orderData.prazo_execucao_dias || 7,
          data_inicio_execucao: orderData.data_inicio_execucao ? new Date(orderData.data_inicio_execucao).toISOString().split('T')[0] : '',
          desconto_percentual: orderData.desconto_percentual || orderData.discount_percentage || 0,
          desconto_valor: orderData.desconto_valor || orderData.discount_amount || orderData.discount_value || 0,
          show_material_costs: orderData.show_material_costs || false,
          show_value: orderData.show_value !== false,
          relatorio_tecnico: orderData.relatorio_tecnico || '',
          orientacoes_servico: orderData.orientacoes_servico || '',
          escopo_detalhado: orderData.escopo_detalhado || '',
          payment_method: orderData.payment_method || 'dinheiro',
          payment_installments: orderData.payment_installments || 1,
          payment_conditions: orderData.payment_conditions || 'Sinal de 50% e o valor restante após a conclusão.',
          warranty_period: orderData.warranty_period || 90,
          warranty_type: orderData.warranty_type || 'days',
          warranty_terms: orderData.warranty_terms || '',
          bank_account_id: orderData.bank_account_id || '',
          contract_template_id: orderData.contract_template_id || '',
          contract_notes: orderData.contract_notes || '',
          notes: orderData.notes || '',
          custo_deslocamento: orderData.custo_deslocamento || 0,
          custo_estacionamento: orderData.custo_estacionamento || 0,
          custo_pedagio: orderData.custo_pedagio || 0,
          custo_outros: orderData.custo_outros || 0,
          descricao_outros: orderData.descricao_outros || '',
          company_name: orderData.company_name || '',
          company_cnpj: orderData.company_cnpj || '',
          company_address: orderData.company_address || '',
          company_phone: orderData.company_phone || '',
          company_email: orderData.company_email || '',
          payment_methods_text: orderData.payment_methods_text || 'Transferência bancária, dinheiro, cartão de crédito, cartão de débito ou pix',
          payment_pix: orderData.payment_pix || '',
          bank_name: orderData.bank_name || '',
          bank_agency: orderData.bank_agency || '',
          bank_account: orderData.bank_account || '',
          bank_account_type: orderData.bank_account_type || 'Corrente',
          bank_holder: orderData.bank_holder || '',
          contract_clauses: orderData.contract_clauses || '',
          additional_info: orderData.additional_info || 'Trabalhamos para que seus projetos, se tornem realidade.'
        })

        setOrderNumber(orderData.order_number || '')

        if (orderData.client_id) {
          loadCustomerDetails(orderData.client_id)
        }

        if (orderData.items && orderData.items.length > 0) {
          const mappedItems = orderData.items.map((item: any) => {
            const materiaisData = (item.materiais || item.materials || []).map((mat: any) => ({
              id: mat.id || crypto.randomUUID(),
              material_id: mat.material_id || '',
              nome: mat.nome || mat.material_name || mat.name || '',
              quantidade: mat.quantidade || mat.quantity || 0,
              unidade_medida: mat.unidade_medida || mat.material_unit || mat.unit || 'un',
              preco_compra_unitario: mat.preco_compra_unitario || mat.unit_cost_at_time || mat.unit_price || 0,
              preco_venda_unitario: mat.preco_venda_unitario || mat.unit_sale_price || mat.preco_unitario || 0,
              preco_compra: mat.preco_compra || mat.total_cost || 0,
              preco_venda: mat.preco_venda || mat.valor_total || mat.total_sale_price || mat.total_price || 0,
              custo_total: mat.custo_total || mat.total_cost || 0,
              valor_total: mat.valor_total || mat.total_sale_price || mat.total_price || 0,
              lucro: mat.lucro || 0
            }))

            const funcionariosData = (item.funcionarios || item.labor || []).map((func: any) => ({
              id: func.id || crypto.randomUUID(),
              staff_id: func.staff_id || func.employee_id || '',
              nome: func.nome || func.nome_funcionario || func.name || '',
              tempo_minutos: func.tempo_minutos || func.time_minutes || 0,
              custo_hora: func.custo_hora || func.hourly_rate || 0,
              custo_total: func.custo_total || func.total_cost || 0
            }))

            return {
              id: item.id || crypto.randomUUID(),
              service_catalog_id: item.service_catalog_id || null,
              descricao: item.descricao || item.description || item.service_name || item.service_catalog?.name || '',
              escopo: item.escopo || item.escopo_detalhado || item.service_scope || '',
              escopo_detalhado: item.escopo_detalhado || item.escopo || item.service_scope || '',
              quantidade: item.quantidade || item.quantity || 1,
              preco_unitario: item.preco_unitario || item.unit_price || 0,
              preco_total: item.preco_total || item.total_price || 0,
              tempo_estimado_minutos: item.tempo_estimado_minutos || item.estimated_duration || item.estimated_time || 0,
              materiais: materiaisData,
              funcionarios: funcionariosData,
              custo_materiais: item.custo_materiais || item.cost_materials || 0,
              custo_mao_obra: item.custo_mao_obra || item.cost_labor || 0,
              custo_total: item.custo_total || item.total_cost || 0,
              lucro: item.lucro || item.profit || 0,
              margem_lucro: item.margem_lucro || item.profit_margin || 0
            }
          })
          setServiceItems(mappedItems)
        }
      }
    } catch (error) {
      console.error('Error loading order data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomerDetails = async (customerId: string) => {
    try {
      const [customerRes, addressRes] = await Promise.all([
        supabase.from('customers').select('*').eq('id', customerId).single(),
        supabase.from('customer_addresses').select('*').eq('customer_id', customerId).eq('principal', true).maybeSingle()
      ])

      if (customerRes.data) {
        const customerData = {
          ...customerRes.data,
          address: addressRes.data
        }
        setSelectedCustomer(customerData)

        if (addressRes.data) {
          setEmailRecipient(customerRes.data.email || '')
        }
      }
    } catch (error) {
      console.error('Error loading customer details:', error)
    }
  }

  const handleCustomerChange = (customerId: string) => {
    setFormData({...formData, customer_id: customerId})
    if (customerId) {
      loadCustomerDetails(customerId)
    } else {
      setSelectedCustomer(null)
    }
  }

  const loadData = async () => {
    try {
      console.log('🔄 Carregando dados...')

      const customersRes = await supabase.from('customers').select('*').order('nome_razao')
      if (customersRes.error) console.error('Erro clientes:', customersRes.error)
      else console.log('✅ Clientes carregados:', customersRes.data?.length || 0)
      setCustomers(customersRes.data || [])

      const materialsRes = await supabase.from('materials').select('*').eq('active', true).order('name')
      if (materialsRes.error) console.error('Erro materiais:', materialsRes.error)
      else console.log('✅ Materiais carregados:', materialsRes.data?.length || 0)
      setMaterials(materialsRes.data || [])

      const staffRes = await supabase.from('employees').select('id, name, role, custo_hora, especialidade, nivel').eq('active', true).order('name')
      if (staffRes.error) console.error('Erro funcionários:', staffRes.error)
      else console.log('✅ Funcionários carregados:', staffRes.data?.length || 0)
      setStaff(staffRes.data || [])

      const bankAccountsRes = await supabase.from('bank_accounts').select('*').eq('active', true).order('account_name')
      if (bankAccountsRes.error) console.error('Erro contas:', bankAccountsRes.error)
      else console.log('✅ Contas bancárias carregadas:', bankAccountsRes.data?.length || 0)
      setBankAccounts(bankAccountsRes.data || [])

      const contractsRes = await supabase.from('contract_templates').select('*').order('name')
      if (contractsRes.error) console.error('Erro contratos:', contractsRes.error)
      else console.log('✅ Contratos carregados:', contractsRes.data?.length || 0)
      setContractTemplates(contractsRes.data || [])

      const catalogRes = await supabase.from('service_catalog').select('*').eq('active', true).order('name')
      if (catalogRes.error) console.error('Erro catálogo:', catalogRes.error)
      else console.log('✅ Catálogo carregado:', catalogRes.data?.length || 0)
      setServiceCatalog(catalogRes.data || [])

      const inventoryRes = await supabase.from('inventory').select('*').order('name')
      if (inventoryRes.error) console.error('Erro inventário:', inventoryRes.error)
      else console.log('✅ Inventário carregado:', inventoryRes.data?.length || 0)
      setInventory(inventoryRes.data || [])

      console.log('✅ Todos os dados carregados!')
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error)
    }
  }

  const addServiceItem = () => {
    setServiceItems([...serviceItems, {
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
    }])
  }

  const removeServiceItem = (id: string) => {
    setServiceItems(serviceItems.filter(item => item.id !== id))
  }

  const updateServiceItem = (id: string, updates: Partial<ServiceItem>) => {
    setServiceItems(items => items.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates }
        updated.preco_total = updated.quantidade * updated.preco_unitario

        updated.custo_materiais = updated.materiais.reduce((sum, m) => sum + m.custo_total, 0)
        updated.custo_mao_obra = updated.funcionarios.reduce((sum, f) => sum + f.custo_total, 0)
        updated.custo_total = updated.custo_materiais + updated.custo_mao_obra
        updated.lucro = updated.preco_total - updated.custo_total
        updated.margem_lucro = updated.preco_total > 0 ? (updated.lucro / updated.preco_total) * 100 : 0

        return updated
      }
      return item
    }))
  }

  const addMaterial = (serviceId: string) => {
    const item = serviceItems.find(i => i.id === serviceId)
    if (!item) return

    const newMaterial: MaterialItem = {
      id: crypto.randomUUID(),
      material_id: '',
      nome: '',
      quantidade: 1,
      unidade_medida: 'UN',
      preco_compra_unitario: 0,
      preco_venda_unitario: 0,
      preco_compra: 0,
      preco_venda: 0,
      custo_total: 0,
      valor_total: 0,
      lucro: 0
    }

    updateServiceItem(serviceId, {
      materiais: [...item.materiais, newMaterial]
    })
  }

  const removeMaterial = (serviceId: string, materialId: string) => {
    const item = serviceItems.find(i => i.id === serviceId)
    if (!item) return

    updateServiceItem(serviceId, {
      materiais: item.materiais.filter(m => m.id !== materialId)
    })
  }

  const updateMaterial = (serviceId: string, materialId: string, updates: Partial<MaterialItem>) => {
    const item = serviceItems.find(i => i.id === serviceId)
    if (!item) return

    const updatedMateriais = item.materiais.map(m => {
      if (m.id === materialId) {
        const updated = { ...m, ...updates }

        const precoCompra = updated.preco_compra_unitario || 0
        const precoVenda = updated.preco_venda_unitario || 0

        updated.custo_total = updated.quantidade * precoCompra
        updated.valor_total = updated.quantidade * precoVenda
        updated.lucro = updated.valor_total - updated.custo_total
        return updated
      }
      return m
    })

    updateServiceItem(serviceId, { materiais: updatedMateriais })
  }

  const selectMaterial = (serviceId: string, materialId: string, selectedMaterialId: string) => {
    const material = materials.find(m => m.id === selectedMaterialId)
    if (!material) return

    const precoCompra = Number(material.unit_cost) || 0
    const precoVenda = Number(material.sale_price) || 0
    const unidade = material.unit || 'UN'

    updateMaterial(serviceId, materialId, {
      material_id: selectedMaterialId,
      nome: material.name,
      unidade_medida: unidade,
      preco_compra_unitario: precoCompra,
      preco_venda_unitario: precoVenda,
      preco_compra: precoCompra,
      preco_venda: precoVenda
    })
  }

  const addLabor = (serviceId: string) => {
    const item = serviceItems.find(i => i.id === serviceId)
    if (!item) return

    const newLabor: LaborItem = {
      id: crypto.randomUUID(),
      staff_id: '',
      nome: '',
      tempo_minutos: 60,
      custo_hora: 0,
      custo_total: 0
    }

    updateServiceItem(serviceId, {
      funcionarios: [...item.funcionarios, newLabor]
    })
  }

  const removeLabor = (serviceId: string, laborId: string) => {
    const item = serviceItems.find(i => i.id === serviceId)
    if (!item) return

    updateServiceItem(serviceId, {
      funcionarios: item.funcionarios.filter(f => f.id !== laborId)
    })
  }

  const updateLabor = (serviceId: string, laborId: string, updates: Partial<LaborItem>) => {
    const item = serviceItems.find(i => i.id === serviceId)
    if (!item) return

    const updatedFuncionarios = item.funcionarios.map(f => {
      if (f.id === laborId) {
        const updated = { ...f, ...updates }
        updated.custo_total = (updated.tempo_minutos / 60) * updated.custo_hora
        return updated
      }
      return f
    })

    updateServiceItem(serviceId, { funcionarios: updatedFuncionarios })
  }

  const selectStaff = (serviceId: string, laborId: string, selectedStaffId: string) => {
    const staffMember = staff.find(s => s.id === selectedStaffId)
    if (!staffMember) return

    updateLabor(serviceId, laborId, {
      staff_id: selectedStaffId,
      nome: staffMember.nome,
      custo_hora: Number(staffMember.salario_hora) || Number(staffMember.custo_hora) || 0
    })
  }

  const calculateTotals = () => {
    const subtotal = serviceItems.reduce((sum, item) => sum + item.preco_total, 0)

    const custosAdicionais = (
      (formData.custo_deslocamento || 0) +
      (formData.custo_estacionamento || 0) +
      (formData.custo_pedagio || 0) +
      (formData.custo_outros || 0)
    )

    const desconto = formData.desconto_valor || (subtotal * (formData.desconto_percentual / 100))
    const total = subtotal - custosAdicionais - desconto

    const custo_total_materiais = serviceItems.reduce((sum, item) => sum + item.custo_materiais, 0)
    const custo_total_mao_obra = serviceItems.reduce((sum, item) => sum + item.custo_mao_obra, 0)
    const custo_total = custo_total_materiais + custo_total_mao_obra + custosAdicionais
    const lucro_total = total - custo_total
    const margem_lucro = total > 0 ? (lucro_total / total) * 100 : 0

    setTotals({
      subtotal,
      desconto,
      total,
      custo_total_materiais,
      custo_total_mao_obra,
      custo_total,
      lucro_total,
      margem_lucro
    })
  }

  const handleSave = async () => {
    try {
      if (!formData.customer_id || serviceItems.length === 0) {
        alert('Selecione um cliente e adicione pelo menos um serviço!')
        return
      }

      setLoading(true)

      const warrantyEndDate = formData.scheduled_at ? new Date(
        new Date(formData.scheduled_at).getTime() +
        (formData.warranty_period * (
          formData.warranty_type === 'days' ? 86400000 :
          formData.warranty_type === 'months' ? 2592000000 : 31536000000
        ))
      ).toISOString().split('T')[0] : null

      const orderPayload = {
        customer_id: formData.customer_id || null,
        description: formData.description,
        scheduled_at: formData.scheduled_at || null,
        due_date: formData.scheduled_at || null,
        prazo_execucao_dias: formData.prazo_execucao_dias,
        data_inicio_execucao: formData.data_inicio_execucao || null,
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
        show_value: formData.show_value,
        relatorio_tecnico: formData.relatorio_tecnico,
        orientacoes_servico: formData.orientacoes_servico,
        escopo_detalhado: formData.escopo_detalhado,
        payment_method: formData.payment_method,
        payment_installments: formData.payment_installments,
        bank_account_id: formData.bank_account_id || null,
        warranty_period: formData.warranty_period,
        warranty_type: formData.warranty_type,
        warranty_terms: formData.warranty_terms,
        warranty_end_date: warrantyEndDate,
        contract_template_id: formData.contract_template_id || null,
        contract_notes: formData.contract_notes,
        notes: formData.notes,
        subtotal: totals.subtotal,
        discount_amount: totals.desconto,
        final_total: totals.total
      }

      let order: any

      if (isEditMode && editId) {
        const { data: updatedOrder, error: updateError } = await supabase
          .from('service_orders')
          .update(orderPayload)
          .eq('id', editId)
          .select()
          .single()

        if (updateError) throw updateError
        order = updatedOrder

        await supabase.from('service_order_items').delete().eq('service_order_id', editId)
        await supabase.from('service_order_materials').delete().eq('service_order_id', editId)
        await supabase.from('service_order_labor').delete().eq('service_order_id', editId)
      } else {
        const { data: newOrder, error: insertError } = await supabase
          .from('service_orders')
          .insert([orderPayload])
          .select()
          .single()

        if (insertError) throw insertError
        order = newOrder
      }

      if (!order) throw new Error('Erro ao salvar ordem')

      for (const item of serviceItems) {
        const { data: itemData, error: itemError } = await supabase
          .from('service_order_items')
          .insert([{
            service_order_id: order.id,
            service_catalog_id: item.service_catalog_id || null,
            descricao: item.descricao || item.nome || '',
            escopo_detalhado: item.escopo || item.escopo_detalhado || '',
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            preco_total: item.preco_total,
            tempo_estimado_minutos: item.tempo_estimado_minutos,
            custo_materiais: item.custo_materiais,
            custo_mao_obra: item.custo_mao_obra,
            custo_total: item.custo_total,
            lucro: item.lucro,
            margem_lucro: item.margem_lucro
          }])
          .select()
          .single()

        if (itemError) throw itemError

        if (item.materiais.length > 0) {
          const materiaisData = item.materiais.map(m => ({
            service_order_id: order.id,
            service_order_item_id: itemData.id,
            material_id: m.material_id,
            nome_material: m.nome,
            quantidade: m.quantidade,
            preco_compra: m.preco_compra,
            preco_venda: m.preco_venda,
            custo_total: m.custo_total,
            valor_total: m.valor_total,
            lucro: m.lucro
          }))

          const { error: materiaisError } = await supabase
            .from('service_order_materials')
            .insert(materiaisData)

          if (materiaisError) throw materiaisError
        }

        if (item.funcionarios.length > 0) {
          const funcionariosData = item.funcionarios.map(f => ({
            service_order_id: order.id,
            service_order_item_id: itemData.id,
            staff_id: f.staff_id,
            nome_funcionario: f.nome,
            tempo_minutos: f.tempo_minutos,
            custo_hora: f.custo_hora,
            custo_total: f.custo_total
          }))

          const { error: funcionariosError } = await supabase
            .from('service_order_labor')
            .insert(funcionariosData)

          if (funcionariosError) throw funcionariosError
        }
      }

      alert(isEditMode ? 'Ordem de Serviço atualizada com sucesso!' : 'Ordem de Serviço criada com sucesso!')
      navigate('/service-orders')
    } catch (error) {
      console.error('Error saving:', error)
      alert(`Erro ao ${isEditMode ? 'atualizar' : 'salvar'} ordem de serviço!`)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    try {
      const customer = selectedCustomer || customers.find(c => c.id === formData.customer_id)
      if (!customer) {
        alert('Cliente não encontrado!')
        return
      }

      const companyInfo = await getCompanyInfo()

      const customerAddress = customer.address || {}
      const fullAddress = [
        customerAddress.logradouro,
        customerAddress.numero,
        customerAddress.complemento,
        customerAddress.bairro
      ].filter(Boolean).join(', ')

      const orderData = {
        order_number: orderNumber || 'TEMP-' + Date.now(),
        created_at: new Date().toISOString(),
        status: 'aberta',
        customer: {
          nome_razao: customer.nome_razao || customer.name || 'Cliente',
          cnpj_cpf: customer.cnpj_cpf || customer.cnpj || customer.cpf || '',
          email: customer.email || '',
          telefone: customer.telefone || customer.phone || '',
          endereco: fullAddress || customer.endereco || customer.address || '',
          cidade: customerAddress.cidade || customer.cidade || customer.city || '',
          estado: customerAddress.estado || customer.estado || customer.state || '',
          cep: customerAddress.cep || customer.cep || customer.zip_code || ''
        },
        description: formData.description,
        scheduled_at: formData.scheduled_at,
        items: serviceItems.map(item => ({
          descricao: item.descricao,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          preco_total: item.preco_total,
          tempo_estimado_minutos: item.tempo_estimado_minutos,
          materiais: item.materiais.map(m => ({
            nome: m.nome,
            quantidade: m.quantidade,
            unidade_medida: m.unidade_medida,
            preco_venda_unitario: m.preco_venda_unitario,
            valor_total: m.valor_total
          })),
          funcionarios: item.funcionarios.map(f => ({
            nome: f.nome,
            tempo_minutos: f.tempo_minutos,
            custo_total: f.custo_total
          }))
        })),
        payment_method: formData.payment_method,
        payment_installments: formData.payment_installments,
        bank_account: bankAccounts.find(b => b.id === formData.bank_account_id)?.account_name || '',
        warranty_period: formData.warranty_period,
        warranty_type: formData.warranty_type,
        warranty_terms: formData.warranty_terms,
        contract_notes: formData.contract_notes,
        subtotal: totals.subtotal,
        desconto_percentual: formData.desconto_percentual,
        desconto_valor: formData.desconto_valor,
        discount_amount: totals.desconto,
        final_total: totals.total,
        custo_total: totals.custo_total,
        lucro_total: totals.lucro_total,
        margem_lucro: totals.margem_lucro,
        notes: formData.notes,
        prazo_execucao_dias: formData.prazo_execucao_dias,
        data_inicio_execucao: formData.data_inicio_execucao,
        data_fim_execucao: formData.data_inicio_execucao && formData.prazo_execucao_dias ?
          new Date(new Date(formData.data_inicio_execucao).getTime() + (formData.prazo_execucao_dias * 86400000)).toISOString().split('T')[0] : null,
        additional_costs: {
          deslocamento: formData.custo_deslocamento,
          estacionamento: formData.custo_estacionamento,
          pedagio: formData.custo_pedagio,
          outros: formData.custo_outros,
          descricao_outros: formData.descricao_outros
        }
      }

      // Preparar dados no formato Giartech
      const giartechData = {
        order_number: orderNumber || 'NOVA-OS',
        date: new Date().toISOString(),
        title: formData.description || 'Ordem de Serviço',
        client: {
          name: customer.nome_razao || customer.name || 'Cliente',
          company_name: customer.nome_fantasia || '',
          cnpj: customer.cnpj || '',
          cpf: customer.cpf || '',
          address: fullAddress || '',
          city: customerAddress.cidade || '',
          state: customerAddress.estado || '',
          cep: customerAddress.cep || '',
          email: customer.email || '',
          phone: customer.telefone || customer.phone || ''
        },
        basic_info: {
          deadline: `${formData.prazo_execucao_dias} dias`,
          brand: '',
          model: '',
          equipment: ''
        },
        items: serviceItems.map(item => ({
          service_name: item.descricao || 'Serviço',
          description: item.descricao,
          scope: '',
          unit: 'un.',
          unit_price: item.preco_unitario,
          quantity: item.quantidade,
          total_price: item.preco_total
        })),
        subtotal: totals.subtotal,
        discount: totals.desconto,
        total: totals.total,
        payment: {
          methods: 'Transferência bancária, dinheiro, cartão de crédito, cartão de débito ou pix',
          pix: customer.cnpj || customer.cpf || '',
          bank_details: bankAccounts.find(b => b.is_default) ? {
            bank: bankAccounts.find(b => b.is_default)?.bank_name || '',
            agency: bankAccounts.find(b => b.is_default)?.agency || '',
            account: bankAccounts.find(b => b.is_default)?.account_number || '',
            account_type: bankAccounts.find(b => b.is_default)?.account_type === 'checking' ? 'Corrente' : 'Poupança',
            holder: bankAccounts.find(b => b.is_default)?.account_holder || ''
          } : undefined,
          conditions: 'Sinal de 50% e o valor restante após a conclusão.'
        },
        warranty: {
          period: `${formData.warranty_period} ${formData.warranty_type === 'days' ? 'dias' : formData.warranty_type === 'months' ? 'meses' : 'anos'}`,
          conditions: formData.warranty_terms || 'Garantias referentes à sistemas de novo em tubulações antigas.'
        },
        contract_clauses: [],
        additional_info: formData.notes || 'Trabalhamos para que seus projetos, se tornem realidade.'
      }

      await generateServiceOrderPDFGiartech(giartechData)
      alert('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF!')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const handlePrint = async () => {
    if (!editId) {
      alert('Salve a ordem de serviço antes de imprimir!')
      return
    }

    try {
      setLoading(true)
      const orderData = await getServiceOrderById(editId)
      if (!orderData) throw new Error('OS não encontrada')

      const customer = customers.find(c => c.id === (orderData as any).customer_id)

      // Preparar dados no formato Giartech
      const giartechData = {
        order_number: (orderData as any).order_number || 'N/A',
        date: (orderData as any).created_at || new Date().toISOString(),
        title: (orderData as any).description || 'Ordem de Serviço',
        client: {
          name: customer?.nome_razao || customer?.name || 'Cliente',
          company_name: customer?.nome_fantasia || '',
          cnpj: customer?.cnpj || '',
          cpf: customer?.cpf || '',
          address: customer?.endereco || '',
          city: customer?.cidade || '',
          state: customer?.estado || '',
          cep: customer?.cep || '',
          email: customer?.email || '',
          phone: customer?.telefone || ''
        },
        basic_info: {
          deadline: '15 dias',
          brand: '',
          model: '',
          equipment: ''
        },
        items: mapServiceItems((orderData as any).items || []),
        subtotal: (orderData as any).subtotal || (orderData as any).total_value || 0,
        discount: (orderData as any).discount_amount || 0,
        total: (orderData as any).total_value || 0,
        payment: {
          methods: 'Transferência bancária, dinheiro, cartão de crédito, cartão de débito ou pix',
          pix: customer?.cnpj || customer?.cpf || '',
          bank_details: bankAccounts.find(b => b.is_default) ? {
            bank: bankAccounts.find(b => b.is_default)?.bank_name || '',
            agency: bankAccounts.find(b => b.is_default)?.agency || '',
            account: bankAccounts.find(b => b.is_default)?.account_number || '',
            account_type: bankAccounts.find(b => b.is_default)?.account_type === 'checking' ? 'Corrente' : 'Poupança',
            holder: bankAccounts.find(b => b.is_default)?.account_holder || ''
          } : undefined,
          conditions: 'Sinal de 50% e o valor restante após a conclusão.'
        },
        warranty: {
          period: '12 meses',
          conditions: 'Garantias referentes à sistemas de novo em tubulações antigas.'
        },
        contract_clauses: [],
        additional_info: 'Trabalhamos para que seus projetos, se tornem realidade.'
      }

      await generateServiceOrderPDFGiartech(giartechData)
    } catch (error) {
      console.error('Error printing:', error)
      alert('Erro ao gerar PDF!')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!editId) {
      alert('Salve a ordem de serviço antes de baixar!')
      return
    }

    try {
      setLoading(true)
      const orderData = await getServiceOrderById(editId)
      if (!orderData) throw new Error('OS não encontrada')

      const customer = customers.find(c => c.id === (orderData as any).customer_id)

      // Preparar dados no formato Giartech
      const giartechData = {
        order_number: (orderData as any).order_number || 'N/A',
        date: (orderData as any).created_at || new Date().toISOString(),
        title: (orderData as any).description || 'Ordem de Serviço',
        client: {
          name: customer?.nome_razao || customer?.name || 'Cliente',
          company_name: customer?.nome_fantasia || '',
          cnpj: customer?.cnpj || '',
          cpf: customer?.cpf || '',
          address: customer?.endereco || '',
          city: customer?.cidade || '',
          state: customer?.estado || '',
          cep: customer?.cep || '',
          email: customer?.email || '',
          phone: customer?.telefone || ''
        },
        basic_info: {
          deadline: '15 dias',
          brand: '',
          model: '',
          equipment: ''
        },
        items: mapServiceItems((orderData as any).items || []),
        subtotal: (orderData as any).subtotal || (orderData as any).total_value || 0,
        discount: (orderData as any).discount_amount || 0,
        total: (orderData as any).total_value || 0,
        payment: {
          methods: 'Transferência bancária, dinheiro, cartão de crédito, cartão de débito ou pix',
          pix: customer?.cnpj || customer?.cpf || '',
          bank_details: bankAccounts.find(b => b.is_default) ? {
            bank: bankAccounts.find(b => b.is_default)?.bank_name || '',
            agency: bankAccounts.find(b => b.is_default)?.agency || '',
            account: bankAccounts.find(b => b.is_default)?.account_number || '',
            account_type: bankAccounts.find(b => b.is_default)?.account_type === 'checking' ? 'Corrente' : 'Poupança',
            holder: bankAccounts.find(b => b.is_default)?.account_holder || ''
          } : undefined,
          conditions: 'Sinal de 50% e o valor restante após a conclusão.'
        },
        warranty: {
          period: '12 meses',
          conditions: 'Garantias referentes à sistemas de novo em tubulações antigas.'
        },
        contract_clauses: [],
        additional_info: 'Trabalhamos para que seus projetos, se tornem realidade.'
      }

      await generateServiceOrderPDFGiartech(giartechData)
    } catch (error) {
      console.error('Error downloading:', error)
      alert('Erro ao baixar PDF!')
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = () => {
    if (!editId) {
      alert('Salve a ordem de serviço antes de enviar!')
      return
    }

    const customer = customers.find(c => c.id === formData.customer_id)
    setEmailRecipient(customer?.email || '')
    setEmailMessage(`Olá, segue em anexo a Ordem de Serviço ${orderNumber || editId}.`)
    setShowEmailModal(true)
  }

  const confirmSendEmail = async () => {
    if (!emailRecipient) {
      alert('Digite um email válido!')
      return
    }

    try {
      setSendingEmail(true)
      alert(`Email enviado para: ${emailRecipient}\n\nNota: A funcionalidade de envio real requer configuração do servidor de email.`)
      setShowEmailModal(false)
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Erro ao enviar email!')
    } finally {
      setSendingEmail(false)
    }
  }

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
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao cadastrar material:', error)
        throw error
      }

      console.log('✅ Material cadastrado:', data)
      alert('✅ Material cadastrado com sucesso!')

      setInventory([...inventory, data])
      setShowNewMaterialModal(false)
      setNewMaterialData({ name: '', unit: 'un', unit_cost: 0, unit_price: 0, quantity: 1 })
    } catch (error: any) {
      console.error('❌ Erro completo:', error)
      alert(`❌ Erro ao cadastrar material: ${error.message}`)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            {isEditMode ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço Detalhada'}
          </h1>
          <p className="text-gray-600 mt-1">Sistema completo com múltiplos serviços, materiais e funcionários</p>
        </div>
        {!isEditMode && (
          <div className="text-sm">
            {isSaving && <span className="text-blue-600">💾 Salvando...</span>}
            {!isSaving && lastSaved && <span className="text-green-600">✓ Salvo {new Date(lastSaved).toLocaleTimeString()}</span>}
            {saveError && <span className="text-red-600">⚠️ Erro ao salvar</span>}
          </div>
        )}
      </div>

      {!isEditMode && (
        <div className="mb-4">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg">
            <FileText className="h-5 w-5" />
            📋 Usar Template de OS
          </button>
        </div>
      )}

      <TemplateSelector
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelect={(templateData) => {
          setFormData({ ...formData, ...(templateData.formData || {}) })
          if (templateData.serviceItems) setServiceItems(templateData.serviceItems)
          setShowTemplateModal(false)
        }}
      />

      {/* Sistema de Abas */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('dados')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'dados'
                ? 'bg-blue-500 text-white border-b-4 border-blue-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <User className="h-5 w-5" />
            Dados Básicos
          </button>
          <button
            onClick={() => setActiveTab('servicos')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'servicos'
                ? 'bg-green-500 text-white border-b-4 border-green-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <Wrench className="h-5 w-5" />
            Serviços e Materiais
          </button>
          <button
            onClick={() => setActiveTab('pagamento')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pagamento'
                ? 'bg-emerald-500 text-white border-b-4 border-emerald-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <DollarSign className="h-5 w-5" />
            Pagamento
          </button>
          <button
            onClick={() => setActiveTab('garantia')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'garantia'
                ? 'bg-amber-500 text-white border-b-4 border-amber-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <Clock className="h-5 w-5" />
            Garantia
          </button>
          <button
            onClick={() => setActiveTab('contrato')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'contrato'
                ? 'bg-purple-500 text-white border-b-4 border-purple-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            <FileText className="h-5 w-5" />
            Contrato
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* ABA: DADOS BÁSICOS */}
          {activeTab === 'dados' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Informações Básicas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cliente *</label>
                <div className="flex gap-2">
                  <select value={formData.customer_id} onChange={(e) => handleCustomerChange(e.target.value)}
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                    title="Novo Cliente"
                  >
                    <Plus className="h-4 w-4" />
                    Novo
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Agendada</label>
                <input type="datetime-local" value={formData.scheduled_at}
                  onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Início Execução</label>
                <input type="date" value={formData.data_inicio_execucao}
                  onChange={(e) => setFormData({...formData, data_inicio_execucao: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prazo de Execução (dias)</label>
                <input type="number" value={formData.prazo_execucao_dias} min="1"
                  onChange={(e) => setFormData({...formData, prazo_execucao_dias: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Descrição Geral</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={2}
                  placeholder="Descrição opcional da OS..." />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Escopo Detalhado do Serviço</label>
                <textarea value={formData.escopo_detalhado} onChange={(e) => setFormData({...formData, escopo_detalhado: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3}
                  placeholder="Descreva em detalhes tudo que será executado no serviço..." />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Relatório Técnico</label>
                <textarea value={formData.relatorio_tecnico} onChange={(e) => setFormData({...formData, relatorio_tecnico: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3}
                  placeholder="Relatório técnico detalhado (diagnóstico, análise, etc)..." />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Orientações de Serviço</label>
                <textarea value={formData.orientacoes_servico} onChange={(e) => setFormData({...formData, orientacoes_servico: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3}
                  placeholder="Instruções e orientações para a equipe executar o serviço..." />
              </div>

              <div className="md:col-span-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.show_value}
                    onChange={(e) => setFormData({...formData, show_value: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium">Exibir valores na proposta (desmarque para enviar ao cliente sem valores ou para funcionários)</span>
                </label>
              </div>
            </div>

            {selectedCustomer && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Nome/Razão Social:</span>
                    <p className="font-medium text-gray-900">{selectedCustomer.nome_razao}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">CPF/CNPJ:</span>
                    <p className="font-medium text-gray-900">{selectedCustomer.cpf || selectedCustomer.cnpj || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Telefone:</span>
                    <p className="font-medium text-gray-900">{selectedCustomer.telefone || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-900">{selectedCustomer.email || 'Não informado'}</p>
                  </div>
                  {selectedCustomer.address && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Endereço:</span>
                      <p className="font-medium text-gray-900">
                        {[
                          selectedCustomer.address.logradouro,
                          selectedCustomer.address.numero,
                          selectedCustomer.address.complemento,
                          selectedCustomer.address.bairro,
                          selectedCustomer.address.cidade,
                          selectedCustomer.address.estado,
                          selectedCustomer.address.cep && `CEP: ${selectedCustomer.address.cep}`
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {/* ABA: PAGAMENTO */}
          {activeTab === 'pagamento' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Pagamento e Financeiro
            </h2>
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
          </div>
          )}

          {/* ABA: GARANTIA */}
          {activeTab === 'garantia' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Garantia
            </h2>
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
                  placeholder="Descreva as condições da garantia: cobertura, exclusões, prazos..." />
              </div>
              <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Garantia:</strong> {formData.warranty_period} {
                    formData.warranty_type === 'days' ? 'dias' :
                    formData.warranty_type === 'months' ? 'meses' : 'anos'
                  } {formData.scheduled_at && `(válida até ${new Date(new Date(formData.scheduled_at).getTime() +
                    (formData.warranty_period * (
                      formData.warranty_type === 'days' ? 86400000 :
                      formData.warranty_type === 'months' ? 2592000000 : 31536000000
                    ))).toLocaleDateString('pt-BR')})`}
                </p>
              </div>
            </div>
          </div>
          )}

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-md border-2 border-green-300">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              💳 Condições de Pagamento
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Condições de Pagamento</label>
                <textarea
                  value={formData.payment_conditions}
                  onChange={(e) => setFormData({...formData, payment_conditions: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Ex: Sinal de 50% e o valor restante após a conclusão, Pagamento à vista com 10% de desconto, Parcelado em 3x sem juros, etc."
                />
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>💡 Dica:</strong> Estas condições aparecerão no PDF da ordem de serviço e na proposta enviada ao cliente.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 shadow-md border-2 border-red-300">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              💸 Custos Adicionais (Deduzidos do Total)
            </h2>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <strong>⚠️ Atenção:</strong> Estes custos serão DEDUZIDOS (subtraídos) do valor total da OS, não adicionados.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  🚗 Deslocamento
                </label>
                <input
                  type="number"
                  value={formData.custo_deslocamento}
                  min="0"
                  step="0.01"
                  onChange={(e) => setFormData({...formData, custo_deslocamento: Number(e.target.value)})}
                  className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  🅿️ Estacionamento
                </label>
                <input
                  type="number"
                  value={formData.custo_estacionamento}
                  min="0"
                  step="0.01"
                  onChange={(e) => setFormData({...formData, custo_estacionamento: Number(e.target.value)})}
                  className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  🛣️ Pedágio
                </label>
                <input
                  type="number"
                  value={formData.custo_pedagio}
                  min="0"
                  step="0.01"
                  onChange={(e) => setFormData({...formData, custo_pedagio: Number(e.target.value)})}
                  className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  💵 Outros Custos
                </label>
                <input
                  type="number"
                  value={formData.custo_outros}
                  min="0"
                  step="0.01"
                  onChange={(e) => setFormData({...formData, custo_outros: Number(e.target.value)})}
                  className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Descrição dos Outros Custos
                </label>
                <input
                  type="text"
                  value={formData.descricao_outros}
                  onChange={(e) => setFormData({...formData, descricao_outros: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                  placeholder="Ex: Alimentação, hospedagem, materiais extras..."
                />
              </div>
              {(formData.custo_deslocamento > 0 || formData.custo_estacionamento > 0 || formData.custo_pedagio > 0 || formData.custo_outros > 0) && (
                <div className="md:col-span-2 bg-red-100 border-2 border-red-400 rounded-lg p-4">
                  <p className="text-sm font-bold text-red-900 mb-2">
                    💸 Total de Custos a Deduzir:
                  </p>
                  <p className="text-2xl font-bold text-red-700">
                    -{formatCurrency((formData.custo_deslocamento || 0) + (formData.custo_estacionamento || 0) + (formData.custo_pedagio || 0) + (formData.custo_outros || 0))}
                  </p>
                  <p className="text-xs text-red-700 mt-1 font-semibold">
                    ⚠️ Este valor será DEDUZIDO do total da OS
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ABA: CONTRATO */}
          {activeTab === 'contrato' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Contrato
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Modelo de Contrato</label>
                <select value={formData.contract_template_id} onChange={(e) => setFormData({...formData, contract_template_id: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Sem contrato</option>
                  {contractTemplates.map(ct => (
                    <option key={ct.id} value={ct.id}>{ct.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações do Contrato</label>
                <textarea value={formData.contract_notes} onChange={(e) => setFormData({...formData, contract_notes: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3}
                  placeholder="Cláusulas especiais, condições particulares..." />
              </div>
            </div>
          </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-md border-2 border-blue-300">
            <button
              type="button"
              onClick={() => toggleSection('company')}
              className="w-full flex items-center justify-between text-lg font-semibold mb-4 hover:text-blue-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                🏢 Dados da Empresa no Documento
              </div>
              {expandedSections.company ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {expandedSections.company && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Deixe vazio para usar configuração padrão"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={formData.company_cnpj}
                    onChange={(e) => setFormData({...formData, company_cnpj: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.company_phone}
                    onChange={(e) => setFormData({...formData, company_phone: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => setFormData({...formData, company_email: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="contato@empresa.com.br"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Endereço Completo</label>
                  <textarea
                    value={formData.company_address}
                    onChange={(e) => setFormData({...formData, company_address: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                  />
                </div>
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Dica:</strong> Estes dados sobrescrevem as configurações padrão apenas para este documento.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 shadow-md border-2 border-green-300">
            <button
              type="button"
              onClick={() => toggleSection('bankData')}
              className="w-full flex items-center justify-between text-lg font-semibold mb-4 hover:text-green-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                💳 Dados Bancários e Formas de Pagamento
              </div>
              {expandedSections.bankData ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {expandedSections.bankData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Formas de Pagamento Aceitas</label>
                  <input
                    type="text"
                    value={formData.payment_methods_text}
                    onChange={(e) => setFormData({...formData, payment_methods_text: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: Transferência bancária, dinheiro, cartão de crédito..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Chave PIX</label>
                  <input
                    type="text"
                    value={formData.payment_pix}
                    onChange={(e) => setFormData({...formData, payment_pix: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="CPF/CNPJ ou chave aleatória"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Banco</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Nome do Banco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Agência</label>
                  <input
                    type="text"
                    value={formData.bank_agency}
                    onChange={(e) => setFormData({...formData, bank_agency: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Conta</label>
                  <input
                    type="text"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="00000-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Conta</label>
                  <select
                    value={formData.bank_account_type}
                    onChange={(e) => setFormData({...formData, bank_account_type: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Corrente">Corrente</option>
                    <option value="Poupança">Poupança</option>
                    <option value="Salário">Salário</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Titular da Conta</label>
                  <input
                    type="text"
                    value={formData.bank_holder}
                    onChange={(e) => setFormData({...formData, bank_holder: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Nome completo do titular"
                  />
                </div>
                <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>💡 Dica:</strong> Estes dados bancários aparecerão no documento para facilitar o pagamento do cliente.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-md border-2 border-purple-300">
            <button
              type="button"
              onClick={() => toggleSection('additionalClauses')}
              className="w-full flex items-center justify-between text-lg font-semibold mb-4 hover:text-purple-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-purple-600" />
                📋 Cláusulas e Informações Adicionais
              </div>
              {expandedSections.additionalClauses ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {expandedSections.additionalClauses && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cláusulas Contratuais Adicionais</label>
                  <textarea
                    value={formData.contract_clauses}
                    onChange={(e) => setFormData({...formData, contract_clauses: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={5}
                    placeholder="Digite cláusulas contratuais específicas, termos e condições adicionais..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Informações Adicionais / Rodapé</label>
                  <textarea
                    value={formData.additional_info}
                    onChange={(e) => setFormData({...formData, additional_info: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Mensagem de rodapé, slogan, avisos importantes..."
                  />
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800">
                    <strong>💡 Dica:</strong> Use este espaço para adicionar informações que devem aparecer no final do documento.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ABA: SERVIÇOS */}
          {activeTab === 'servicos' && (
          <>
          {serviceItems.map((item, index) => (
            <motion.div key={item.id} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
              className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Serviço #{index + 1}</h3>
                {serviceItems.length > 1 && (
                  <button onClick={() => removeServiceItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="mb-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <SmartServiceSearch
                        services={serviceCatalog.map(s => ({
                          id: s.id,
                          name: s.name,
                          description: s.description,
                          category: s.category,
                          base_price: s.base_price
                        }))}
                        onSelect={(service) => {
                      if (service) {
                        const catalog = serviceCatalog.find(s => s.id === service.id)
                        if (catalog) {
                          const catalogMaterials = (catalog as any).service_catalog_materials || []

                          const newMaterials = catalogMaterials.map((cm: any) => ({
                            id: crypto.randomUUID(),
                            material_id: cm.material_id || '',
                            nome: cm.material_name || '',
                            quantidade: Number(cm.quantity) || 1,
                            preco_compra: Number(cm.unit_cost_at_time) || 0,
                            preco_venda: Number(cm.unit_sale_price) || 0,
                            unidade_medida: cm.material_unit || 'UN',
                            preco_compra_unitario: Number(cm.unit_cost_at_time) || 0,
                            preco_venda_unitario: Number(cm.unit_sale_price) || 0,
                            custo_total: (Number(cm.quantity) || 1) * (Number(cm.unit_cost_at_time) || 0),
                            valor_total: (Number(cm.quantity) || 1) * (Number(cm.unit_sale_price) || 0),
                            lucro: ((Number(cm.quantity) || 1) * (Number(cm.unit_sale_price) || 0)) - ((Number(cm.quantity) || 1) * (Number(cm.unit_cost_at_time) || 0))
                          }))

                          updateServiceItem(item.id, {
                            descricao: catalog.name,
                            preco_unitario: Number(catalog.base_price) || 0,
                            tempo_estimado_minutos: Number((catalog as any).estimated_duration) || 0,
                            materiais: newMaterials,
                            funcionarios: []
                          })
                        }
                      }
                    }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Abrindo modal de novo serviço')
                        setShowNewServiceModal(true)
                      }}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                      title="Novo Serviço"
                    >
                      <Plus className="h-4 w-4" />
                      Novo Serviço
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Descrição do Serviço *</label>
                    <input type="text" value={item.descricao}
                      onChange={(e) => updateServiceItem(item.id, {descricao: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Instalação de Ar Condicionado 12k BTU" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tempo (min)</label>
                    <input type="number" value={item.tempo_estimado_minutos}
                      onChange={(e) => updateServiceItem(item.id, {tempo_estimado_minutos: Number(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantidade</label>
                    <input type="number" value={item.quantidade} min="1"
                      onChange={(e) => updateServiceItem(item.id, {quantidade: Number(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preço Unitário</label>
                    <input type="number" value={item.preco_unitario} step="0.01"
                      onChange={(e) => updateServiceItem(item.id, {preco_unitario: Number(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total</label>
                    <input type="text" value={formatCurrency(item.preco_total)} disabled
                      className="w-full px-4 py-2 border rounded-lg bg-gray-50 font-bold" />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />Materiais
                    </h4>
                    <button onClick={() => addMaterial(item.id)}
                      className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                      + Material
                    </button>
                  </div>

                  {item.materiais.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <label className="block text-sm font-medium text-green-900 mb-2">
                        🔍 Buscar do Inventário/Estoque
                      </label>
                      <div className="flex gap-2">
                        <select
                          onChange={(e) => {
                          const invItem = inventory.find(inv => inv.id === e.target.value)
                          if (invItem && item.materiais.length > 0) {
                            const lastMaterial = item.materiais[item.materiais.length - 1]
                            if (!lastMaterial.material_id) {
                              updateMaterial(item.id, lastMaterial.id, {
                                material_id: invItem.id,
                                nome: invItem.name,
                                quantidade: 1,
                                preco_compra: Number(invItem.purchase_price) || 0,
                                preco_venda: Number(invItem.sale_price) || 0,
                                unidade_medida: invItem.unit || 'UN'
                              })
                            }
                          }
                          e.target.value = ''
                        }}
                          className="flex-1 px-4 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white">
                          <option value="">Selecione um item do estoque...</option>
                          {inventory.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} - Estoque: {inv.quantity || 0} {inv.unit || 'UN'} - R$ {Number(inv.sale_price || 0).toFixed(2)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            console.log('Abrindo modal de novo material')
                            setShowNewMaterialModal(true)
                          }}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                          title="Novo Material"
                        >
                          <Plus className="h-4 w-4" />
                          Novo
                        </button>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Preenche o último material vazio adicionado
                      </p>
                    </div>
                  )}

                  {item.materiais.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum material adicionado</p>
                  )}
                  {item.materiais.map(material => (
                    <div key={material.id} className="border rounded-lg p-3 mb-3 bg-gray-50">
                      <div className="grid grid-cols-6 gap-2 mb-2">
                        <select value={material.material_id}
                          onChange={(e) => selectMaterial(item.id, material.id, e.target.value)}
                          className="col-span-3 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500">
                          <option value="">Selecione o material...</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} - {formatCurrency(Number(m.sale_price))} ({m.unit || 'UN'})
                            </option>
                          ))}
                        </select>
                        <div className="col-span-2 relative">
                          <input type="number" value={material.quantidade} min="0.01" step="0.01"
                            onChange={(e) => updateMaterial(item.id, material.id, {quantidade: Number(e.target.value)})}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                            placeholder="Qtd" />
                          {material.unidade_medida && (
                            <span className="absolute right-3 top-2 text-xs text-gray-500 font-semibold">
                              {material.unidade_medida}
                            </span>
                          )}
                        </div>
                        <button onClick={() => removeMaterial(item.id, material.id)}
                          className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {material.material_id && (
                        <div className="space-y-3 mt-3 pt-3 border-t">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">Custo Unitário:</label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-orange-500" />
                                <input
                                  type="number"
                                  value={material.preco_compra_unitario || ''}
                                  onChange={(e) => updateMaterial(item.id, material.id, {
                                    preco_compra_unitario: Number(e.target.value)
                                  })}
                                  className="w-full pl-7 pr-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-orange-500"
                                  step="0.01"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">Preço de Venda:</label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-green-500" />
                                <input
                                  type="number"
                                  value={material.preco_venda_unitario || ''}
                                  onChange={(e) => updateMaterial(item.id, material.id, {
                                    preco_venda_unitario: Number(e.target.value)
                                  })}
                                  className="w-full pl-7 pr-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-green-500"
                                  step="0.01"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded p-2">
                            <div>
                              <span className="text-xs text-gray-500">Custo Total:</span>
                              <p className="font-bold text-orange-700">{formatCurrency(material.custo_total || 0)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Venda Total:</span>
                              <p className="font-bold text-green-700">{formatCurrency(material.valor_total || 0)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Lucro:</span>
                              <p className={`font-bold ${(material.lucro || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(material.lucro || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-purple-900">Mão de Obra</span>
                    </h4>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 mb-4">
                    <label className="block text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      🔍 Buscar e Adicionar Funcionário
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchStaffTerm[item.id] || ''}
                        onChange={(e) => setSearchStaffTerm({...searchStaffTerm, [item.id]: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm"
                        placeholder="Digite o nome do funcionário..."
                      />
                      {searchStaffTerm[item.id] && (
                        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                          {staff.filter(st => {
                            const name = (st.name || st.nome || '').toLowerCase()
                            const role = (st.role || st.cargo || '').toLowerCase()
                            const search = searchStaffTerm[item.id].toLowerCase()
                            return name.includes(search) || role.includes(search)
                          }).map(st => (
                            <button
                              key={st.id}
                              onClick={() => {
                                const newLabor = {
                                  id: crypto.randomUUID(),
                                  staff_id: st.id,
                                  nome: st.name || st.nome || 'Funcionário',
                                  tempo_minutos: 60,
                                  custo_hora: Number(st.hourly_rate || st.custo_hora || 0),
                                  custo_total: (60 / 60) * Number(st.hourly_rate || st.custo_hora || 0)
                                }
                                updateServiceItem(item.id, {
                                  funcionarios: [...item.funcionarios, newLabor]
                                })
                                setSearchStaffTerm({...searchStaffTerm, [item.id]: ''})
                              }}
                              className="w-full px-4 py-3 hover:bg-purple-50 transition-colors text-left border-b border-purple-100 last:border-0"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-purple-900">{st.name || st.nome}</p>
                                  <p className="text-xs text-gray-600">{st.role || st.cargo || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-600">R$ {Number(st.hourly_rate || st.custo_hora || 0).toFixed(2)}/h</p>
                                  <p className="text-xs text-gray-500">Clique para adicionar</p>
                                </div>
                              </div>
                            </button>
                          ))}
                          {staff.filter(st => {
                            const name = (st.name || st.nome || '').toLowerCase()
                            const role = (st.role || st.cargo || '').toLowerCase()
                            const search = searchStaffTerm[item.id].toLowerCase()
                            return name.includes(search) || role.includes(search)
                          }).length === 0 && (
                            <div className="px-4 py-8 text-center text-gray-500">
                              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">Nenhum funcionário encontrado</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-purple-700 mt-2 flex items-center gap-1">
                      ✨ Digite para buscar e adicionar funcionários instantaneamente
                    </p>
                  </div>

                  {item.funcionarios.length > 0 && (
                    <div className="space-y-3">
                      {item.funcionarios.map((labor, index) => (
                        <motion.div
                          key={labor.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border-2 border-purple-100 rounded-xl p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-bold text-sm">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-bold text-purple-900">{labor.nome}</p>
                                <p className="text-xs text-gray-500">R$ {labor.custo_hora.toFixed(2)}/hora</p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeLabor(item.id, labor.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover funcionário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                ⏱️ Tempo de Trabalho
                              </label>
                              <div className="grid grid-cols-6 gap-2 mb-2">
                                {[10, 30, 60, 120, 240, 480].map(mins => (
                                  <button
                                    key={mins}
                                    type="button"
                                    onClick={() => updateLabor(item.id, labor.id, {tempo_minutos: mins})}
                                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                                      labor.tempo_minutos === mins
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                                  </button>
                                ))}
                              </div>
                              <select
                                value={labor.tempo_minutos}
                                onChange={(e) => updateLabor(item.id, labor.id, {tempo_minutos: Number(e.target.value)})}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                              >
                                {Array.from({ length: 96 }, (_, i) => (i + 1) * 10).map(mins => (
                                  <option key={mins} value={mins}>
                                    {mins < 60
                                      ? `${mins} minutos`
                                      : mins === 60
                                        ? '1 hora'
                                        : mins % 60 === 0
                                          ? `${mins / 60} horas`
                                          : `${Math.floor(mins / 60)}h ${mins % 60}m`
                                    }
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  💵 Custo/Hora
                                </label>
                                <input
                                  type="text"
                                  value={formatCurrency(labor.custo_hora)}
                                  disabled
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-blue-50 font-bold text-blue-700 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  💰 Custo Total
                                </label>
                                <input
                                  type="text"
                                  value={formatCurrency(labor.custo_total)}
                                  disabled
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-green-50 font-bold text-green-700 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {item.funcionarios.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">Nenhum funcionário adicionado</p>
                      <p className="text-xs text-gray-500">Use a busca acima para adicionar</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-600">Custo Materiais:</span>
                    <p className="font-bold text-orange-600">{formatCurrency(item.custo_materiais)}</p></div>
                  <div><span className="text-gray-600">Custo Mão Obra:</span>
                    <p className="font-bold text-blue-600">{formatCurrency(item.custo_mao_obra)}</p></div>
                  <div><span className="text-gray-600">Lucro:</span>
                    <p className="font-bold text-green-600">{formatCurrency(item.lucro)}</p></div>
                  <div><span className="text-gray-600">Margem:</span>
                    <p className="font-bold text-purple-600">{item.margem_lucro.toFixed(1)}%</p></div>
                </div>
              </div>
            </motion.div>
          ))}

          <button onClick={addServiceItem}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600">
            <Plus className="h-5 w-5" />
            Adicionar Outro Serviço
          </button>
          </>
          )}
        </div>

        <div className="space-y-6">
          <RealtimeCalculationPanel
            subtotal={totals.subtotal}
            discount={totals.desconto}
            total={totals.total}
            costMaterials={totals.custo_total_materiais}
            costLabor={totals.custo_total_mao_obra}
            totalCost={totals.custo_total}
            profit={totals.lucro_total}
            margin={totals.margem_lucro}
          />

          <div className="bg-white rounded-xl p-6 shadow-sm border sticky top-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Resumo Financeiro
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal Serviços:</span>
                <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
              </div>

              {((formData.custo_deslocamento || 0) + (formData.custo_estacionamento || 0) + (formData.custo_pedagio || 0) + (formData.custo_outros || 0)) > 0 && (
                <>
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 space-y-2">
                    <h4 className="font-semibold text-sm text-orange-700 flex items-center gap-1">
                      💸 Custos Adicionais (Deduzidos)
                    </h4>
                    {formData.custo_deslocamento > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600">🚗 Deslocamento:</span>
                        <span className="font-semibold text-orange-700">-{formatCurrency(formData.custo_deslocamento)}</span>
                      </div>
                    )}
                    {formData.custo_estacionamento > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600">🅿️ Estacionamento:</span>
                        <span className="font-semibold text-orange-700">-{formatCurrency(formData.custo_estacionamento)}</span>
                      </div>
                    )}
                    {formData.custo_pedagio > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600">🛣️ Pedágio:</span>
                        <span className="font-semibold text-orange-700">-{formatCurrency(formData.custo_pedagio)}</span>
                      </div>
                    )}
                    {formData.custo_outros > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600">💵 {formData.descricao_outros || 'Outros'}:</span>
                        <span className="font-semibold text-orange-700">-{formatCurrency(formData.custo_outros)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-orange-300 flex justify-between">
                      <span className="font-bold text-orange-700">Total Deduzido:</span>
                      <span className="font-bold text-red-700">-{formatCurrency((formData.custo_deslocamento || 0) + (formData.custo_estacionamento || 0) + (formData.custo_pedagio || 0) + (formData.custo_outros || 0))}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-3 text-red-600">💰 Desconto</h4>
                <div className="space-y-3">
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <label className="block text-xs font-medium text-red-700 mb-1">Desconto Percentual (%)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" value={formData.desconto_percentual} step="0.1" min="0" max="100"
                        onChange={(e) => setFormData({...formData, desconto_percentual: Number(e.target.value), desconto_valor: 0})}
                        className="flex-1 px-3 py-2 border-2 border-red-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500" />
                      <span className="text-red-700 font-bold text-lg">%</span>
                    </div>
                  </div>

                  <div className="text-center text-xs text-gray-500 font-medium">— OU —</div>

                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <label className="block text-xs font-medium text-red-700 mb-1">Desconto em Valor (R$)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-red-700 font-bold text-lg">R$</span>
                      <input type="number" value={formData.desconto_valor} step="0.01" min="0"
                        onChange={(e) => setFormData({...formData, desconto_valor: Number(e.target.value), desconto_percentual: 0})}
                        className="flex-1 px-3 py-2 border-2 border-red-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-3 flex justify-between items-center">
                <span className="text-red-700 font-semibold">Desconto Aplicado:</span>
                <span className="text-red-700 font-bold text-xl">-{formatCurrency(totals.desconto)}</span>
              </div>

              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span className="text-blue-600">{formatCurrency(totals.total)}</span>
              </div>

              <div className="border-t pt-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_material_costs}
                    onChange={(e) => setFormData({...formData, show_material_costs: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Mostrar custos dos materiais no documento</span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Se desmarcado, apenas os preços de venda serão exibidos
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t space-y-3">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Informações de Pagamento
              </h4>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Forma:</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {formData.payment_method === 'dinheiro' ? 'Dinheiro' :
                       formData.payment_method === 'pix' ? 'PIX' :
                       formData.payment_method === 'debito' ? 'Débito' :
                       formData.payment_method === 'credito' ? 'Crédito' :
                       formData.payment_method === 'transferencia' ? 'Transferência' :
                       formData.payment_method === 'boleto' ? 'Boleto' : 'Cheque'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Parcelas:</span>
                    <span className="font-semibold text-gray-900">
                      {formData.payment_installments}x {formData.payment_installments > 1 && `de ${formatCurrency(totals.total / formData.payment_installments)}`}
                    </span>
                  </div>
                  {formData.bank_account_id && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Conta:</span>
                      <span className="font-semibold text-gray-900">
                        {bankAccounts.find(ba => ba.id === formData.bank_account_id)?.account_name || 'Padrão'}
                      </span>
                    </div>
                  )}
                  {formData.warranty_period > 0 && (
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-amber-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Garantia:
                      </span>
                      <span className="font-semibold text-amber-700">
                        {formData.warranty_period} {formData.warranty_type === 'days' ? 'dias' : formData.warranty_type === 'months' ? 'meses' : 'anos'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t space-y-3">
              <h4 className="font-semibold text-sm mb-3">Análise de Custos</h4>

              <div className="bg-orange-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700">Custo Materiais:</span>
                  <span className="font-bold text-orange-700">{formatCurrency(totals.custo_total_materiais)}</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Custo Mão de Obra:</span>
                  <span className="font-bold text-blue-700">{formatCurrency(totals.custo_total_mao_obra)}</span>
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Custo Total:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(totals.custo_total)}</span>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <div className="flex justify-between mb-2">
                  <span className="text-green-700 font-semibold">Lucro:</span>
                  <span className="font-bold text-green-700 text-lg">{formatCurrency(totals.lucro_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 text-sm">Margem:</span>
                  <span className="font-bold text-green-600">{totals.margem_lucro.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                Enviar Ordem de Serviço
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email do Destinatário</label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mensagem</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  onClick={confirmSendEmail}
                  disabled={sendingEmail}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {sendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {isEditMode && (
              <>
                <button onClick={handlePrint} disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                  title="Imprimir OS">
                  <Printer className="h-4 w-4" />
                  Imprimir
                </button>
                <button onClick={handleDownload} disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                  title="Baixar PDF">
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button onClick={handleSendEmail} disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                  title="Enviar por Email">
                  <Send className="h-4 w-4" />
                  Enviar
                </button>
              </>
            )}
            <button onClick={handleGeneratePDF}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2 shadow-md"
              title="Gerar PDF Profissional">
              <FileDown className="h-4 w-4" />
              Gerar PDF
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => navigate('/service-orders')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button onClick={handleSave} disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center gap-2 shadow-md">
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : isEditMode ? 'Atualizar OS' : 'Salvar OS'}
            </button>
          </div>
        </div>
      </div>

      {/* DEBUG: Indicador Visual de Modal Aberto */}
      {(showNewCustomerModal || showNewServiceModal || showNewMaterialModal) && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-[10000] shadow-lg font-bold animate-pulse">
          ✅ MODAL ABERTO: {showNewCustomerModal ? 'CLIENTE' : showNewServiceModal ? 'SERVIÇO' : 'MATERIAL'}
        </div>
      )}

      {/* Modal Novo Cliente */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4" onClick={(e) => {
          console.log('Click no backdrop do modal cliente')
          if (e.target === e.currentTarget) {
            console.log('🚪 Fechando modal cliente')
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4" onClick={(e) => {
          console.log('Click no backdrop do modal serviço')
          if (e.target === e.currentTarget) {
            console.log('🚪 Fechando modal serviço')
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
                  placeholder="Ex: Instalação de Ar Condicionado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={newServiceData.description}
                  onChange={(e) => setNewServiceData({...newServiceData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descrição detalhada do serviço"
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4" onClick={(e) => {
          console.log('Click no backdrop do modal material')
          if (e.target === e.currentTarget) {
            console.log('🚪 Fechando modal material')
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
    </div>
  )
}

export default ServiceOrderCreate
