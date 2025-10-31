/**
 * Mapeadores de Banco de Dados
 *
 * Este arquivo contém funções para mapear entre os nomes de campos do banco de dados
 * e os nomes esperados pelo frontend.
 */

// ============================================================
// TIPOS DO BANCO DE DADOS (nomes reais das tabelas)
// ============================================================

export interface DBCustomer {
  id: string
  tipo_pessoa: 'pf' | 'pj'
  nome_razao: string
  nome_fantasia?: string
  cpf?: string
  rg?: string
  cnpj?: string
  inscricao_estadual?: string
  inscricao_municipal?: string
  data_nascimento?: string
  data_fundacao?: string
  email?: string
  telefone?: string
  celular?: string
  observacoes?: string
  created_at: string
  updated_at?: string
}

export interface DBServiceOrder {
  id: string
  order_number?: string
  tenant_id?: string
  customer_id?: string
  equipment_id?: string
  contract_id?: string
  status?: string
  description?: string
  scheduled_at?: string
  opened_at: string
  closed_at?: string
  total_value?: number
  show_value?: boolean
  total_estimated_duration?: number
  generated_contract?: string
}

export interface DBOrder {
  id: string
  codigo?: string
  customer_id?: string
  address_id?: string
  status?: string
  descricao?: string
  data?: string
  subtotal?: number
  mao_obra?: number
  total?: number
  created_at: string
}

export interface DBInventoryItem {
  id: string
  code?: string
  name: string
  description?: string
  category?: string
  unit?: string
  quantity?: number
  min_quantity?: number
  max_quantity?: number
  unit_cost?: number
  unit_price?: number
  location?: string
  supplier_name?: string
  active?: boolean
  created_at?: string
  updated_at?: string
}

export interface DBCatalogService {
  id: string
  nome: string
  descricao?: string
  preco?: number
  categoria_id?: string
  ativo?: boolean
}

export interface DBStaff {
  id: string
  nome: string
  cargo?: string
  salario?: number
  dias_mes?: number
  horas_dia?: number
  custo_hora?: number
  ativo?: boolean
  created_at: string
}

export interface DBFinanceEntry {
  id: string
  codigo?: string
  data: string
  tipo: 'receita' | 'despesa'
  categoria_id?: string
  descricao: string
  valor: number
  status: 'a_receber' | 'recebido' | 'a_pagar' | 'pago' | 'cancelado'
  order_id?: string
  customer_id?: string
  created_at: string
}

export interface DBAgenda {
  id: string
  data: string
  hora?: string
  tipo: string
  descricao?: string
  status?: string
  valor?: number
  order_id?: string
  customer_id?: string
  created_at: string
}

// ============================================================
// TIPOS DO FRONTEND (interface esperada)
// ============================================================

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  client_type: 'PF' | 'PJ'
  document?: string
  company_name?: string
  trade_name?: string
  state_registration?: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface ServiceOrder {
  id: string
  order_number?: string
  client_id?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  client_address?: string
  client_city?: string
  client_state?: string
  client_cep?: string
  client_document?: string
  client_company_name?: string
  service_type?: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  assigned_to?: string
  created_at: string
  service_date?: string
  due_date?: string
  completion_date?: string
  estimated_value?: number
  actual_value?: number
  notes?: string
  updated_at?: string
  items?: any[]
  materials?: any[]
  team?: any[]
}

export interface InventoryItem {
  id: string
  name: string
  category?: string
  quantity: number
  min_stock?: number
  unit?: string
  cost?: number
  price: number
  supplier?: string
  sku?: string
  location?: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface ServiceCatalogItem {
  id: string
  name: string
  category?: string
  description?: string
  estimated_duration?: number
  estimated_time?: string
  base_price: number
  materials?: Array<{
    name: string
    quantity: number
  }>
  instructions?: string[]
  active?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface Employee {
  id: string
  full_name: string
  position?: string
  salary?: number
  is_active?: boolean
  created_at: string
}

export interface FinancialTransaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  status: 'paid' | 'pending' | 'cancelled'
  date: string
  category_id?: string
  client_id?: string
  order_id?: string
  created_at: string
}

// ============================================================
// FUNÇÕES DE MAPEAMENTO: DB -> FRONTEND
// ============================================================

export function mapDBCustomerToClient(dbCustomer: DBCustomer): Client {
  const isPJ = dbCustomer.tipo_pessoa === 'pj'
  return {
    id: dbCustomer.id,
    name: dbCustomer.nome_razao || '',
    email: dbCustomer.email,
    phone: dbCustomer.telefone,
    address: '',
    client_type: dbCustomer.tipo_pessoa?.toUpperCase() as 'PF' | 'PJ' || 'PF',
    document: isPJ ? dbCustomer.cnpj : dbCustomer.cpf,
    company_name: isPJ ? dbCustomer.nome_razao : undefined,
    notes: dbCustomer.observacoes,
    created_at: dbCustomer.created_at,
    updated_at: dbCustomer.updated_at || dbCustomer.created_at
  }
}

export function mapDBServiceOrderToServiceOrder(dbOrder: DBServiceOrder, customer?: DBCustomer, addresses?: any[]): ServiceOrder {
  // Mapear status do banco para status do frontend
  let status: ServiceOrder['status'] = 'pending'
  if (dbOrder.status) {
    const statusLower = dbOrder.status.toLowerCase()
    // Mapear status direto do banco (pending, in_progress, completed, cancelled)
    if (statusLower === 'pending' || statusLower.includes('aberta') || statusLower.includes('pendente')) status = 'pending'
    else if (statusLower === 'in_progress' || statusLower.includes('execução') || statusLower.includes('agendada') || statusLower.includes('andamento')) status = 'in_progress'
    else if (statusLower === 'completed' || statusLower.includes('conclu')) status = 'completed'
    else if (statusLower === 'cancelled' || statusLower.includes('cancel')) status = 'cancelled'
    // Se o status já estiver no formato correto, usar diretamente
    else if (['pending', 'in_progress', 'completed', 'cancelled'].includes(statusLower)) {
      status = statusLower as ServiceOrder['status']
    }
  }

  // Buscar endereço principal
  const primaryAddress = addresses?.find(addr => addr.principal === true) || addresses?.[0]
  let fullAddress = ''
  if (primaryAddress) {
    const parts = [
      primaryAddress.logradouro,
      primaryAddress.numero,
      primaryAddress.complemento,
      primaryAddress.bairro,
      primaryAddress.cidade,
      primaryAddress.estado,
      primaryAddress.cep
    ].filter(Boolean)
    fullAddress = parts.join(', ')
  }

  return {
    ...dbOrder,
    id: dbOrder.id,
    order_number: dbOrder.order_number || dbOrder.id,
    client_id: dbOrder.customer_id,
    client_name: customer?.nome_razao || '',
    client_phone: customer?.telefone || '',
    client_email: customer?.email,
    client_address: fullAddress,
    client_city: primaryAddress?.cidade || '',
    client_state: primaryAddress?.estado || '',
    client_cep: primaryAddress?.cep || '',
    client_document: customer?.tipo_pessoa === 'pj' ? customer?.cnpj : customer?.cpf,
    client_company_name: customer?.tipo_pessoa === 'pj' ? customer?.nome_razao : undefined,
    description: dbOrder.description || '',
    status: status,
    created_at: dbOrder.opened_at,
    due_date: dbOrder.scheduled_at,
    scheduled_at: dbOrder.scheduled_at,
    estimated_value: dbOrder.total_value,
    actual_value: dbOrder.total_value,
    notes: (dbOrder as any).notes || '',
    updated_at: dbOrder.opened_at
  } as any
}

export function mapDBOrderToServiceOrder(dbOrder: DBOrder, customer?: DBCustomer, addresses?: any[]): ServiceOrder {
  // Mapear status do banco para status do frontend
  let status: ServiceOrder['status'] = 'pending'
  if (dbOrder.status) {
    const statusLower = dbOrder.status.toLowerCase()
    if (statusLower === 'aberta' || statusLower === 'pendente') status = 'pending'
    else if (statusLower === 'em andamento' || statusLower === 'execução') status = 'in_progress'
    else if (statusLower === 'concluida' || statusLower === 'finalizada') status = 'completed'
    else if (statusLower === 'cancelada') status = 'cancelled'
  }

  // Buscar endereço principal
  const primaryAddress = addresses?.find(addr => addr.principal === true) || addresses?.[0]
  let fullAddress = ''
  if (primaryAddress) {
    const parts = [
      primaryAddress.logradouro,
      primaryAddress.numero,
      primaryAddress.complemento,
      primaryAddress.bairro,
      primaryAddress.cidade,
      primaryAddress.estado,
      primaryAddress.cep
    ].filter(Boolean)
    fullAddress = parts.join(', ')
  }

  return {
    id: dbOrder.id,
    order_number: dbOrder.codigo || dbOrder.id,
    client_id: dbOrder.customer_id,
    client_name: customer?.nome_razao || '',
    client_phone: customer?.telefone || '',
    client_email: customer?.email,
    client_address: fullAddress,
    client_city: primaryAddress?.cidade || '',
    client_state: primaryAddress?.estado || '',
    client_cep: primaryAddress?.cep || '',
    client_document: customer?.tipo_pessoa === 'pj' ? customer?.cnpj : customer?.cpf,
    client_company_name: customer?.tipo_pessoa === 'pj' ? customer?.nome_razao : undefined,
    description: dbOrder.descricao || '',
    status: status,
    created_at: dbOrder.created_at,
    due_date: dbOrder.data,
    estimated_value: dbOrder.total,
    actual_value: dbOrder.total,
    notes: '',
    updated_at: dbOrder.created_at
  }
}

export function mapDBInventoryItemToInventoryItem(dbItem: DBInventoryItem): InventoryItem {
  return {
    id: dbItem.id,
    name: dbItem.name,
    category: dbItem.category,
    quantity: dbItem.quantity || 0,
    min_stock: dbItem.min_quantity || 0,
    price: dbItem.unit_price || dbItem.unit_cost || 0,
    supplier: dbItem.supplier_name || '',
    sku: dbItem.code,
    location: dbItem.location,
    description: dbItem.description,
    created_at: dbItem.created_at || new Date().toISOString(),
    updated_at: dbItem.updated_at || new Date().toISOString()
  }
}

export function mapDBCatalogServiceToServiceCatalogItem(dbService: DBCatalogService): ServiceCatalogItem {
  return {
    id: dbService.id,
    name: dbService.nome,
    category: '',
    description: dbService.descricao,
    estimated_time: '',
    base_price: dbService.preco || 0,
    materials: [],
    instructions: [],
    is_active: dbService.ativo !== false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export function mapDBStaffToEmployee(dbStaff: DBStaff): Employee {
  return {
    id: dbStaff.id,
    full_name: dbStaff.nome,
    position: dbStaff.cargo,
    salary: dbStaff.salario,
    is_active: dbStaff.ativo !== false,
    created_at: dbStaff.created_at
  }
}

export function mapDBFinanceEntryToFinancialTransaction(dbEntry: DBFinanceEntry): FinancialTransaction {
  // Mapear tipo
  const type: FinancialTransaction['type'] = dbEntry.tipo === 'receita' ? 'income' : 'expense'

  // Mapear status
  let status: FinancialTransaction['status'] = 'pending'
  if (dbEntry.status === 'recebido' || dbEntry.status === 'pago') status = 'paid'
  else if (dbEntry.status === 'a_receber' || dbEntry.status === 'a_pagar') status = 'pending'
  else if (dbEntry.status === 'cancelado') status = 'cancelled'

  return {
    id: dbEntry.id,
    description: dbEntry.descricao,
    amount: dbEntry.valor,
    type: type,
    status: status,
    date: dbEntry.data,
    category_id: dbEntry.categoria_id,
    client_id: dbEntry.customer_id,
    order_id: dbEntry.order_id,
    created_at: dbEntry.created_at
  }
}

// ============================================================
// FUNÇÕES DE MAPEAMENTO: FRONTEND -> DB
// ============================================================

export function mapClientToDBCustomer(client: Partial<Client>): Partial<DBCustomer> {
  const isPJ = client.client_type === 'PJ'
  return {
    nome_razao: client.name,
    tipo_pessoa: client.client_type?.toLowerCase() as 'pf' | 'pj',
    cpf: isPJ ? undefined : client.document,
    cnpj: isPJ ? client.document : undefined,
    email: client.email,
    telefone: client.phone,
    observacoes: client.notes
  }
}

export function mapServiceOrderToDBServiceOrder(order: Partial<ServiceOrder>): Partial<DBServiceOrder> {
  // Mapear status frontend -> banco
  let dbStatus = 'ABERTA'
  if (order.status === 'pending') dbStatus = 'ABERTA'
  else if (order.status === 'in_progress') dbStatus = 'EM EXECUÇÃO'
  else if (order.status === 'completed') dbStatus = 'CONCLUIDA'
  else if (order.status === 'cancelled') dbStatus = 'CANCELADA'

  return {
    customer_id: order.client_id,
    status: dbStatus,
    description: order.description,
    scheduled_at: order.due_date,
    total_value: order.estimated_value || order.actual_value
  }
}

export function mapInventoryItemToDBInventoryItem(item: Partial<InventoryItem>): Partial<DBInventoryItem> {
  const generateCode = () => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 7)
    return `INV-${timestamp}-${random}`.toUpperCase()
  }

  return {
    name: item.name || '',
    description: item.description || undefined,
    code: item.sku && item.sku.trim() !== '' ? item.sku : generateCode(),
    category: item.category || undefined,
    quantity: item.quantity,
    min_quantity: item.min_stock,
    unit_price: item.price,
    unit_cost: item.cost || item.price,
    location: item.location || undefined,
    supplier_name: item.supplier || undefined,
    active: true
  }
}

export function mapServiceCatalogItemToDBCatalogService(service: Partial<ServiceCatalogItem>): Partial<DBCatalogService> {
  return {
    nome: service.name || '',
    descricao: service.description,
    preco: service.base_price,
    ativo: service.is_active !== false
  }
}

export function mapFinancialTransactionToDBFinanceEntry(transaction: Partial<FinancialTransaction>): Partial<DBFinanceEntry> {
  // Mapear tipo
  const tipo: DBFinanceEntry['tipo'] = transaction.type === 'income' ? 'receita' : 'despesa'

  // Mapear status
  let status: DBFinanceEntry['status'] = 'a_receber'
  if (transaction.status === 'paid') {
    status = transaction.type === 'income' ? 'recebido' : 'pago'
  } else if (transaction.status === 'pending') {
    status = transaction.type === 'income' ? 'a_receber' : 'a_pagar'
  } else if (transaction.status === 'cancelled') {
    status = 'cancelado'
  }

  return {
    descricao: transaction.description || '',
    valor: transaction.amount || 0,
    tipo: tipo,
    status: status,
    data: transaction.date || new Date().toISOString().split('T')[0],
    categoria_id: transaction.category_id,
    customer_id: transaction.client_id,
    order_id: transaction.order_id
  }
}
