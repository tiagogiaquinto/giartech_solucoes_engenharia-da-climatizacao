import { createClient } from '@supabase/supabase-js'
import {
  mapDBCustomerToClient,
  mapDBServiceOrderToServiceOrder,
  mapDBOrderToServiceOrder,
  mapDBInventoryItemToInventoryItem,
  mapDBCatalogServiceToServiceCatalogItem,
  mapDBStaffToEmployee,
  mapDBFinanceEntryToFinancialTransaction,
  mapClientToDBCustomer,
  mapServiceOrderToDBServiceOrder,
  mapInventoryItemToDBInventoryItem,
  mapServiceCatalogItemToDBCatalogService,
  mapFinancialTransactionToDBFinanceEntry,
  type DBCustomer,
  type DBServiceOrder,
  type DBOrder,
  type DBInventoryItem,
  type DBCatalogService,
  type DBStaff,
  type DBFinanceEntry,
  type Client,
  type ServiceOrder,
  type InventoryItem,
  type ServiceCatalogItem,
  type Employee,
  type FinancialTransaction
} from './database-mappers'

// Re-export types for backward compatibility
export type {
  Client,
  ServiceOrder,
  InventoryItem,
  ServiceCatalogItem,
  Employee,
  FinancialTransaction
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://0ec90b57d6e95fcbda19832f.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IjBlYzkwYjU3ZDZlOTVmY2JkYTE5ODMyZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI4ODgxNTc0LCJleHAiOjIwNDQ0NTc1NzR9.w8VPGzCPLqDYVrWYFXSqOy4kD9FfCxvdvHEXUAQ5Q2U'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Additional Database types (não exportados em database-mappers)
export interface Contract {
  id: string
  client_id: string
  customer_id?: string
  contract_number: string
  title: string
  start_date: string
  end_date: string
  contract_type: 'maintenance' | 'support' | 'service'
  frequency?: 'monthly' | 'quarterly' | 'biannual' | 'annual'
  value: number
  status: 'active' | 'expired' | 'cancelled' | 'suspended'
  sla_response_time?: number
  sla_resolution_time?: number
  sla_availability?: number
  next_service_date?: string
  terms_and_conditions?: string
  notes?: string
  created_at: string
  updated_at: string
  client?: Client
  services?: ServiceCatalogItem[]
}

export interface OrderMaterial {
  id: string
  order_id: string
  inventory_item_id?: string
  material_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface UserProfile {
  id: string
  nome: string
  telefone?: string
  tipo_usuario?: string
  empresa_id?: string
  user_id?: string
  tenant_id: string
  criado_em: string
}

export interface AgendaEvent {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  all_day?: boolean
  event_type?: string
  customer_id?: string
  employee_id?: string
  status?: string
  location?: string
  notes?: string
  color?: string
  priority?: string
  created_at?: string
  updated_at?: string
}

// Mappers removidos - AgendaEvent agora usa estrutura real do banco

// Mock data storage for development
let mockContracts: Contract[] = [
  {
    id: '1',
    client_id: '2',
    contract_number: 'CONT-2024-001',
    title: 'Contrato de Manutenção Preventiva',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    contract_type: 'maintenance',
    frequency: 'quarterly',
    value: 2400.00,
    status: 'active',
    sla_response_time: 4,
    sla_resolution_time: 24,
    sla_availability: 99.5,
    next_service_date: '2024-04-01',
    terms_and_conditions: 'Manutenção preventiva trimestral de todos os equipamentos de ar condicionado.',
    created_at: '2024-01-01T08:00:00',
    updated_at: '2024-01-01T08:00:00'
  },
  {
    id: '2',
    client_id: '1',
    contract_number: 'CONT-2024-002',
    title: 'Contrato de Suporte Técnico',
    start_date: '2024-01-15',
    end_date: '2024-07-15',
    contract_type: 'support',
    frequency: 'monthly',
    value: 1200.00,
    status: 'active',
    sla_response_time: 2,
    sla_resolution_time: 8,
    sla_availability: 98.0,
    next_service_date: '2024-02-15',
    notes: 'Suporte técnico mensal para residência.',
    created_at: '2024-01-15T08:00:00',
    updated_at: '2024-01-15T08:00:00'
  }
]

let mockServiceCatalog: ServiceCatalogItem[] = [
  {
    id: '1',
    name: 'Instalação de Ar Condicionado Split',
    category: 'Instalação',
    description: 'Instalação completa de ar condicionado split incluindo suporte, tubulação e testes',
    estimated_time: '3 horas',
    base_price: 350.00,
    materials: [
      { name: 'Suporte para Ar Condicionado', quantity: 1 },
      { name: 'Tubulação de Cobre 3m', quantity: 1 },
      { name: 'Cabo PP 3x2.5mm 5m', quantity: 1 }
    ],
    instructions: [
      'Verificar local de instalação',
      'Instalar suporte da unidade externa',
      'Fixar unidade interna',
      'Conectar tubulação',
      'Fazer conexão elétrica',
      'Testar funcionamento'
    ],
    is_active: true,
    created_at: '2023-12-15T08:00:00',
    updated_at: '2023-12-15T08:00:00'
  },
  {
    id: '2',
    name: 'Manutenção Preventiva',
    category: 'Manutenção',
    description: 'Limpeza de filtros, verificação de gás e limpeza geral do equipamento',
    estimated_time: '1.5 horas',
    base_price: 180.00,
    materials: [
      { name: 'Produto de Limpeza', quantity: 1 },
      { name: 'Filtro de Ar', quantity: 1 }
    ],
    instructions: [
      'Desligar equipamento',
      'Remover e limpar filtros',
      'Verificar nível de gás',
      'Limpar serpentinas',
      'Testar funcionamento'
    ],
    is_active: true,
    created_at: '2023-12-15T08:00:00',
    updated_at: '2023-12-15T08:00:00'
  },
  {
    id: '3',
    name: 'Reparo de Vazamento',
    category: 'Reparo',
    description: 'Identificação e reparo de vazamentos no sistema de refrigeração',
    estimated_time: '2 horas',
    base_price: 250.00,
    materials: [
      { name: 'Gás Refrigerante R410A', quantity: 1 },
      { name: 'Vedante', quantity: 1 }
    ],
    instructions: [
      'Localizar vazamento',
      'Reparar ponto de vazamento',
      'Testar vedação',
      'Recarregar gás',
      'Testar pressão'
    ],
    is_active: true,
    created_at: '2023-12-15T08:00:00',
    updated_at: '2023-12-15T08:00:00'
  }
]

let mockClients: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-1234',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    client_type: 'PF',
    document: '123.456.789-00',
    created_at: '2023-12-15T08:00:00',
    updated_at: '2023-12-15T08:00:00'
  },
  {
    id: '2',
    name: 'Empresa ABC Ltda',
    email: 'contato@empresaabc.com',
    phone: '(11) 98888-5678',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    client_type: 'PJ',
    document: '12.345.678/0001-90',
    company_name: 'Empresa ABC Ltda',
    trade_name: 'ABC Corp',
    created_at: '2023-12-14T08:00:00',
    updated_at: '2023-12-14T08:00:00'
  },
  {
    id: '3',
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '(11) 97777-9012',
    address: 'Rua das Palmeiras, 456 - São Paulo, SP',
    client_type: 'PF',
    document: '987.654.321-00',
    created_at: '2023-12-13T08:00:00',
    updated_at: '2023-12-13T08:00:00'
  }
]

let mockServiceOrders: ServiceOrder[] = [
  {
    id: 'OS-2023-001',
    order_number: 'OS-2023-001',
    client_name: 'João Silva',
    client_phone: '(11) 99999-1234',
    client_address: 'Rua das Flores, 123',
    service_type: 'Instalação de Ar Condicionado',
    description: 'Instalação de ar condicionado split 12.000 BTUs no quarto principal',
    priority: 'high',
    status: 'in_progress',
    assigned_to: 'Carlos Técnico',
    created_at: '2023-12-15T08:00:00',
    due_date: '2023-12-18',
    estimated_value: 850.00,
    notes: 'Cliente solicitou instalação urgente. Verificar voltagem antes da instalação.',
    updated_at: '2023-12-15T08:00:00'
  }
]

let mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Ar Condicionado Split 12.000 BTUs',
    category: 'Equipamentos',
    quantity: 5,
    min_stock: 2,
    price: 1800.00,
    supplier: 'Fornecedor A',
    sku: 'AC-12000-220',
    location: 'Prateleira A3',
    description: 'Ar condicionado split 12.000 BTUs, 220V',
    created_at: '2023-12-15T08:00:00',
    updated_at: '2023-12-15T08:00:00'
  },
  {
    id: '2',
    name: 'Suporte para Ar Condicionado',
    category: 'Acessórios',
    quantity: 15,
    min_stock: 5,
    price: 50.00,
    supplier: 'Fornecedor B',
    sku: 'SUP-AC-001',
    location: 'Prateleira B1',
    description: 'Suporte universal para unidade externa',
    created_at: '2023-12-15T08:00:00',
    updated_at: '2023-12-15T08:00:00'
  },
  {
    id: '3',
    name: 'Tubulação de Cobre 3m',
    category: 'Materiais',
    quantity: 8,
    min_stock: 3,
    price: 80.00,
    supplier: 'Fornecedor C',
    sku: 'TUB-CU-3M',
    location: 'Prateleira C2',
    description: 'Tubulação de cobre 1/4" x 3/8" - 3 metros',
    created_at: '2023-12-15T08:00:00',
    updated_at: '2023-12-15T08:00:00'
  }
]

import { cache } from '../utils/cache'
import { handleSupabaseError } from '../utils/errorHandler'

export const createServiceOrder = async (orderData: Omit<ServiceOrder, 'id' | 'created_at'>) => {
  try {
    const { data, error } = await supabase
      .from('service_orders')
      .insert([{
        order_number: orderData.order_number,
        client_id: orderData.client_id,
        client_name: orderData.client_name,
        client_phone: orderData.client_phone,
        client_address: orderData.client_address,
        service_type: orderData.service_type,
        description: orderData.description,
        priority: orderData.priority,
        status: orderData.status,
        assigned_to: orderData.assigned_to,
        due_date: orderData.due_date,
        estimated_value: orderData.estimated_value,
        notes: orderData.notes
      }])
      .select()
      .single()

    if (error) throw handleSupabaseError(error)

    cache.invalidatePattern('service_orders')
    return data as ServiceOrder
  } catch (error) {
    throw handleSupabaseError(error as Error)
  }
}

export const getServiceOrders = async () => {
  return cache.getOrFetch('service_orders_v2', async () => {
    try {
      // Buscar das duas tabelas possíveis e combinar
      const [ordersResult, serviceOrdersResult, customersResult] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('service_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*')
      ])

      const customers = (customersResult.data || []) as DBCustomer[]
      const customerMap = new Map(customers.map(c => [c.id, c]))

      const mappedOrders: ServiceOrder[] = []

      // Mapear orders
      if (ordersResult.data) {
        ordersResult.data.forEach((order: any) => {
          const customer = order.customer_id ? customerMap.get(order.customer_id) : undefined
          mappedOrders.push(mapDBOrderToServiceOrder(order as DBOrder, customer))
        })
      }

      // Mapear service_orders
      if (serviceOrdersResult.data) {
        serviceOrdersResult.data.forEach((order: any) => {
          const customer = order.customer_id ? customerMap.get(order.customer_id) : undefined
          mappedOrders.push(mapDBServiceOrderToServiceOrder(order as DBServiceOrder, customer))
        })
      }

      // Ordenar por data de criação
      mappedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return mappedOrders
    } catch (error) {
      console.error('Error fetching service orders:', error)
      return mockServiceOrders
    }
  }, 30 * 1000) // Cache de 30 segundos ao invés de 2 minutos
}

export const getServiceOrderById = async (id: string): Promise<ServiceOrder | null> => {
  try {
    const [ordersResult, serviceOrdersResult, customersResult, addressesResult, itemsResult, materialsResult, laborResult, teamResult] = await Promise.all([
      supabase.from('orders').select('*').eq('id', id).maybeSingle(),
      supabase.from('service_orders').select('*').eq('id', id).maybeSingle(),
      supabase.from('customers').select('*'),
      supabase.from('customer_addresses').select('*'),
      supabase.from('service_order_items').select(`
        *,
        service_catalog:service_catalog_id(
          id,
          name,
          description,
          base_price,
          category,
          escopo_servico,
          requisitos_tecnicos,
          avisos_seguranca,
          passos_execucao,
          resultados_esperados,
          padroes_qualidade,
          informacoes_garantia,
          observacoes_tecnicas,
          tempo_estimado_minutos
        )
      `).eq('service_order_id', id),
      supabase.from('service_order_materials').select('*, material:material_id(name, unit)').eq('service_order_id', id),
      supabase.from('service_order_labor').select('*, employee:staff_id(id, name)').eq('service_order_id', id),
      supabase.from('service_order_team').select('*, employee:employee_id(id, name)').eq('service_order_id', id)
    ])

    const customers = (customersResult.data || []) as DBCustomer[]
    const customerMap = new Map(customers.map(c => [c.id, c]))

    const addresses = addressesResult.data || []
    const addressMap = new Map()
    addresses.forEach((addr: any) => {
      if (!addressMap.has(addr.customer_id)) {
        addressMap.set(addr.customer_id, [])
      }
      addressMap.get(addr.customer_id).push(addr)
    })

    let serviceOrder: ServiceOrder | null = null

    if (ordersResult.data) {
      const order = ordersResult.data as DBOrder
      const customer = order.customer_id ? customerMap.get(order.customer_id) : undefined
      const customerAddresses = order.customer_id ? addressMap.get(order.customer_id) : undefined
      serviceOrder = mapDBOrderToServiceOrder(order, customer, customerAddresses)
    }

    if (serviceOrdersResult.data) {
      const order = serviceOrdersResult.data as DBServiceOrder
      const customer = order.customer_id ? customerMap.get(order.customer_id) : undefined
      const customerAddresses = order.customer_id ? addressMap.get(order.customer_id) : undefined
      serviceOrder = mapDBServiceOrderToServiceOrder(order, customer, customerAddresses)
    }

    if (serviceOrder) {
      // Mapear materiais e labor por item
      const materialsByItem = new Map()
      const laborByItem = new Map()

      ;(materialsResult.data || []).forEach((mat: any) => {
        const itemId = mat.service_order_item_id
        if (itemId) {
          if (!materialsByItem.has(itemId)) materialsByItem.set(itemId, [])
          materialsByItem.get(itemId).push({
            id: mat.id,
            material_id: mat.material_id,
            nome: mat.material_name || mat.nome_material || mat.material?.name || 'Material',
            quantidade: mat.quantity || mat.quantidade || 0,
            unidade_medida: mat.material_unit || mat.material?.unit || 'un',
            preco_compra_unitario: mat.unit_cost_at_time || mat.preco_compra || mat.unit_price || 0,
            preco_venda_unitario: mat.unit_sale_price || mat.preco_venda || mat.unit_price || 0,
            preco_compra: mat.total_cost || mat.custo_total || 0,
            preco_venda: mat.total_sale_price || mat.valor_total || mat.total_price || 0,
            custo_total: mat.total_cost || mat.custo_total || 0,
            valor_total: mat.total_sale_price || mat.valor_total || mat.total_price || 0,
            lucro: mat.lucro || 0
          })
        }
      })

      ;(laborResult.data || []).forEach((lab: any) => {
        const itemId = lab.service_order_item_id
        if (itemId) {
          if (!laborByItem.has(itemId)) laborByItem.set(itemId, [])
          laborByItem.get(itemId).push({
            id: lab.id,
            staff_id: lab.staff_id,
            nome: lab.nome_funcionario || lab.employee?.name || 'Funcionário',
            tempo_minutos: lab.tempo_minutos || (lab.hours ? lab.hours * 60 : 0) || 0,
            custo_hora: lab.custo_hora || lab.hourly_rate || 0,
            custo_total: lab.custo_total || lab.total_cost || 0
          })
        }
      })

      serviceOrder.items = (itemsResult.data || []).map((item: any) => ({
        id: item.id,
        service_order_id: item.service_order_id,
        service_catalog_id: item.service_catalog_id,
        service_name: item.service_catalog?.name || '',
        descricao: item.descricao || item.notes || item.service_catalog?.description || item.service_catalog?.name || '',
        description: item.notes || item.service_catalog?.description || item.service_catalog?.name || '',
        name: item.service_catalog?.name || '',
        escopo: item.escopo_detalhado || item.escopo || item.service_catalog?.escopo_servico || '',
        escopo_detalhado: item.escopo_detalhado || item.escopo || item.service_catalog?.escopo_servico || '',
        quantidade: item.quantity || item.quantidade || 1,
        quantity: item.quantity || 1,
        preco_unitario: item.unit_price || item.preco_unitario || 0,
        unit_price: item.unit_price || 0,
        preco_total: item.total_price || item.preco_total || 0,
        total_price: item.total_price || 0,
        tempo_estimado_minutos: item.estimated_duration || item.tempo_estimado_minutos || 0,
        estimated_duration: item.estimated_duration || 0,
        custo_materiais: item.custo_materiais || 0,
        custo_mao_obra: item.custo_mao_obra || 0,
        custo_total: item.custo_total || 0,
        lucro: item.lucro || 0,
        margem_lucro: item.margem_lucro || 0,
        notes: item.notes || '',
        difficulty_level: item.difficulty_level || 1,
        difficulty_multiplier: item.difficulty_multiplier || 1.0,
        base_unit_price: item.base_unit_price || item.unit_price || 0,
        materiais: materialsByItem.get(item.id) || [],
        funcionarios: laborByItem.get(item.id) || [],
        created_at: item.created_at,
        updated_at: item.updated_at
      }))
      serviceOrder.materials = (materialsResult.data || []).map((mat: any) => ({
        id: mat.id,
        service_order_id: mat.service_order_id,
        material_id: mat.material_id,
        material_name: mat.material_name,
        nome: mat.material_name,
        quantity: mat.quantity || 0,
        quantidade: mat.quantity || 0,
        unit_price: mat.unit_price || 0,
        preco_compra_unitario: mat.unit_price || 0,
        total_price: mat.total_price || 0,
        custo_total: mat.total_price || 0,
        notes: mat.notes || '',
        created_at: mat.created_at,
        updated_at: mat.updated_at
      }))
      serviceOrder.team = (teamResult.data || []).map((member: any) => ({
        id: member.id,
        service_order_id: member.service_order_id,
        employee_id: member.employee_id,
        nome: member.employee?.name || 'Funcionário',
        name: member.employee?.name || 'Funcionário',
        role: member.role || member.employee?.especialidade || member.employee?.role || '',
        assigned_at: member.assigned_at,
        created_at: member.created_at
      }))
    }

    return serviceOrder
  } catch (error) {
    console.error('Error fetching service order by ID:', error)
    return null
  }
}

export const updateServiceOrder = async (id: string, updates: Partial<ServiceOrder>) => {
  try {
    const { data, error } = await supabase
      .from('service_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw handleSupabaseError(error)

    cache.invalidatePattern('service_orders')
    return data as ServiceOrder
  } catch (error) {
    throw handleSupabaseError(error as Error)
  }
}

export const deleteServiceOrder = async (id: string) => {
  try {
    const { data, error } = await supabase
      .rpc('delete_service_order_complete', { p_service_order_id: id })

    if (error) throw handleSupabaseError(error)

    cache.invalidatePattern('service_orders')

    return data
  } catch (error) {
    throw handleSupabaseError(error as Error)
  }
}

export const createInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const dbData = mapInventoryItemToDBInventoryItem(itemData)
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([dbData])
      .select()
      .single()

    if (error) throw handleSupabaseError(error)

    cache.invalidatePattern('inventory')
    return mapDBInventoryItemToInventoryItem(data as DBInventoryItem)
  } catch (error) {
    throw handleSupabaseError(error as Error)
  }
}

export const getInventoryItems = async () => {
  return cache.getOrFetch('inventory_items', async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name')

      if (error) throw handleSupabaseError(error)

      return (data as DBInventoryItem[]).map(mapDBInventoryItemToInventoryItem)
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      return mockInventoryItems
    }
  }, 5 * 60 * 1000)
}

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
  const dbUpdates = mapInventoryItemToDBInventoryItem(updates)
  const { data, error } = await supabase
    .from('inventory_items')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating inventory item:', error)
    throw error
  }

  cache.invalidatePattern('inventory')
  return mapDBInventoryItemToInventoryItem(data as DBInventoryItem)
}

export const deleteInventoryItem = async (id: string) => {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting inventory item:', error)
    throw error
  }
}

// Client functions
export const createDbClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
  const dbData = mapClientToDBCustomer(clientData)

  const { data, error } = await supabase
    .from('customers')
    .insert([dbData])
    .select()
    .single()

  if (error) {
    console.error('Error creating client:', error)
    throw error
  }

  return mapDBCustomerToClient(data as DBCustomer)
}

export const getClients = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('nome_razao')

  if (error) {
    console.error('Error fetching clients:', error)
    return mockClients
  }

  return (data as DBCustomer[]).map(mapDBCustomerToClient)
}

export const updateClient = async (id: string, updates: Partial<Client>) => {
  try {
    const dbData = mapClientToDBCustomer(updates as Client)

    const { data, error } = await supabase
      .from('customers')
      .update(dbData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      throw error
    }

    cache.invalidatePattern('clients')
    cache.invalidatePattern('customers')

    return mapDBCustomerToClient(data as DBCustomer)
  } catch (error: any) {
    console.error('Error updating client:', error)
    throw error
  }
}

export const deleteClient = async (id: string) => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '23503') {
        throw new Error('Não é possível excluir este cliente pois existem registros vinculados (ordens de serviço, contratos, etc). Exclua os registros vinculados primeiro.')
      }
      throw error
    }

    cache.invalidatePattern('clients')
    cache.invalidatePattern('customers')
  } catch (error: any) {
    console.error('Error deleting client:', error)
    throw error
  }
}

// Contract functions
export const createContract = async (contractData: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) => {
  let contractTypeId = null

  if (contractData.contract_type) {
    const { data: types } = await supabase
      .from('contract_types')
      .select('id')
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    if (types) {
      contractTypeId = types.id
    }
  }

  const dbData: any = {
    customer_id: contractData.client_id || contractData.customer_id,
    contract_number: contractData.contract_number,
    start_date: contractData.start_date,
    end_date: contractData.end_date,
    value: contractData.value,
    status: contractData.status,
    payment_frequency: contractData.frequency,
    notes: contractData.notes || contractData.terms_and_conditions,
    contract_type_id: contractTypeId
  }

  const { data, error } = await supabase
    .from('contracts')
    .insert([dbData])
    .select()
    .single()

  if (error) {
    console.error('Error creating contract:', error)
    throw error
  }

  return data as Contract
}

export const getContracts = async () => {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, customers(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contracts:', error)
    return mockContracts
  }

  return data as Contract[]
}

export const getContractsByClient = async (clientId: string) => {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, customers(*)')
    .eq('customer_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching client contracts:', error)
    return []
  }

  return data as Contract[]
}

export const updateContract = async (id: string, updates: Partial<Contract>) => {
  const dbUpdates = {
    ...updates,
    customer_id: updates.client_id || updates.customer_id
  }
  delete (dbUpdates as any).client_id

  const { data, error } = await supabase
    .from('contracts')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating contract:', error)
    throw error
  }

  return data as Contract
}

export const deleteContract = async (id: string) => {
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting contract:', error)
    throw error
  }
}

// Service Catalog functions
export const createServiceCatalogItem = async (serviceData: Omit<ServiceCatalogItem, 'id' | 'created_at' | 'updated_at'>) => {
  const dbData: any = {
    name: serviceData.name,
    description: serviceData.description,
    category: serviceData.category,
    base_price: serviceData.base_price,
    active: serviceData.is_active !== undefined ? serviceData.is_active : (serviceData.active !== undefined ? serviceData.active : true)
  }

  if (serviceData.estimated_time) {
    const hours = parseFloat(serviceData.estimated_time)
    if (!isNaN(hours)) {
      dbData.estimated_duration = hours
    }
  } else if (serviceData.estimated_duration) {
    dbData.estimated_duration = serviceData.estimated_duration
  }

  const { data, error } = await supabase
    .from('service_catalog')
    .insert([dbData])
    .select()
    .single()

  if (error) {
    console.error('Error creating service catalog item:', error)
    throw error
  }

  return data as ServiceCatalogItem
}

export const getServiceCatalog = async () => {
  const { data, error } = await supabase
    .from('service_catalog')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('Error fetching service catalog:', error)
    return mockServiceCatalog
  }

  return data as ServiceCatalogItem[]
}

export const updateServiceCatalogItem = async (id: string, updates: Partial<ServiceCatalogItem>) => {
  const dbUpdates: any = {}

  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.category !== undefined) dbUpdates.category = updates.category
  if (updates.base_price !== undefined) dbUpdates.base_price = updates.base_price

  if (updates.is_active !== undefined) {
    dbUpdates.active = updates.is_active
  } else if (updates.active !== undefined) {
    dbUpdates.active = updates.active
  }

  if (updates.estimated_time) {
    const hours = parseFloat(updates.estimated_time)
    if (!isNaN(hours)) {
      dbUpdates.estimated_duration = hours
    }
  } else if (updates.estimated_duration !== undefined) {
    dbUpdates.estimated_duration = updates.estimated_duration
  }

  const { data, error } = await supabase
    .from('service_catalog')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating service catalog item:', error)
    throw error
  }

  return data as ServiceCatalogItem
}

export const deleteServiceCatalogItem = async (id: string) => {
  const { error } = await supabase
    .from('service_catalog')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting service catalog item:', error)
    throw error
  }
}

// User Profile functions
export const getUserProfiles = async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('nome')

  if (error) {
    console.error('Error fetching user profiles:', error)
    return []
  }

  return data as UserProfile[]
}

export const createUserProfile = async (profileData: Omit<UserProfile, 'id' | 'criado_em'>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([profileData])
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    throw error
  }

  return data as UserProfile
}

export const updateUserProfile = async (id: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data as UserProfile
}

export const deleteUserProfile = async (id: string) => {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting user profile:', error)
    throw error
  }
}

// Agenda functions
export const getAgendaEvents = async () => {
  const { data, error } = await supabase
    .from('agenda_events')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Error fetching agenda events:', error)
    return []
  }

  return (data as AgendaEvent[])
}

export const createAgendaEvent = async (eventData: Omit<AgendaEvent, 'id' | 'created_at'>) => {
  const { data, error} = await supabase
    .from('agenda_events')
    .insert([eventData])
    .select()
    .single()

  if (error) {
    console.error('Error creating agenda event:', error)
    throw error
  }

  return data as AgendaEvent
}

export const updateAgendaEvent = async (id: string, updates: Partial<AgendaEvent>) => {
  const { data, error } = await supabase
    .from('agenda_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating agenda event:', error)
    throw error
  }

  return data as AgendaEvent
}

export const deleteAgendaEvent = async (id: string) => {
  const { error } = await supabase
    .from('agenda_events')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting agenda event:', error)
    throw error
  }
}