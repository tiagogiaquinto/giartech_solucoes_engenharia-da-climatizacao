import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  nome_razao: string
  nome_fantasia?: string
  email?: string
  telefone?: string
  celular?: string
  tipo_pessoa: string
  cpf?: string
  cnpj?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  status?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface Contract {
  id: string
  customer_id?: string
  client_id?: string
  title?: string
  description?: string
  status?: string
  value?: number
  start_date?: string
  end_date?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface ServiceOrder {
  id: string
  order_number?: string
  customer_id?: string
  employee_id?: string
  status?: string
  priority?: string
  title?: string
  description?: string
  total_value?: number
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface InventoryItem {
  id: string
  nome: string
  sku?: string
  descricao?: string
  categoria?: string
  quantidade: number
  quantidade_minima?: number
  preco_custo?: number
  preco_venda?: number
  unidade?: string
  fornecedor?: string
  localizacao?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface ServiceCatalogItem {
  id: string
  nome: string
  descricao?: string
  categoria?: string
  preco?: number
  duracao_estimada?: number
  ativo?: boolean
  created_at?: string
  updated_at?: string
  [key: string]: any
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export const getClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase.from('customers').select('*').order('nome_razao', { ascending: true })
  if (error) throw error
  return data || []
}

export const createDbClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
  const { data, error } = await supabase.from('customers').insert(client).select().single()
  if (error) throw error
  return data
}

export const updateClient = async (id: string, client: Partial<Client>): Promise<void> => {
  const { error } = await supabase.from('customers').update(client).eq('id', id)
  if (error) throw error
}

export const deleteClient = async (id: string): Promise<void> => {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

// ─── Contracts ────────────────────────────────────────────────────────────────

export const getContractsByClient = async (clientId: string): Promise<Contract[]> => {
  const { data, error } = await supabase.from('contracts').select('*').eq('customer_id', clientId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const createContract = async (contract: Omit<Contract, 'id'>): Promise<Contract> => {
  const { data, error } = await supabase.from('contracts').insert(contract).select().single()
  if (error) throw error
  return data
}

export const updateContract = async (id: string, contract: Partial<Contract>): Promise<void> => {
  const { error } = await supabase.from('contracts').update(contract).eq('id', id)
  if (error) throw error
}

export const deleteContract = async (id: string): Promise<void> => {
  const { error } = await supabase.from('contracts').delete().eq('id', id)
  if (error) throw error
}

// ─── Service Orders ───────────────────────────────────────────────────────────

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
  const { data, error } = await supabase.from('service_orders').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const getServiceOrderById = async (id: string): Promise<ServiceOrder | null> => {
  const { data, error } = await supabase.from('service_orders').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createServiceOrder = async (order: Omit<ServiceOrder, 'id'>): Promise<ServiceOrder> => {
  const { data, error } = await supabase.from('service_orders').insert(order).select().single()
  if (error) throw error
  return data
}

export const updateServiceOrder = async (id: string, order: Partial<ServiceOrder>): Promise<void> => {
  const { error } = await supabase.from('service_orders').update(order).eq('id', id)
  if (error) throw error
}

export const deleteServiceOrder = async (id: string): Promise<void> => {
  const { error } = await supabase.from('service_orders').delete().eq('id', id)
  if (error) throw error
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase.from('inventory_items').select('*').order('nome', { ascending: true })
  if (error) throw error
  return data || []
}

export const createInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
  const { data, error } = await supabase.from('inventory_items').insert(item).select().single()
  if (error) throw error
  return data
}

export const updateInventoryItem = async (id: string, item: Partial<InventoryItem>): Promise<void> => {
  const { error } = await supabase.from('inventory_items').update(item).eq('id', id)
  if (error) throw error
}

export const deleteInventoryItem = async (id: string): Promise<void> => {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id)
  if (error) throw error
}

// ─── Service Catalog ──────────────────────────────────────────────────────────

export const getServiceCatalog = async (): Promise<ServiceCatalogItem[]> => {
  const { data, error } = await supabase.from('service_catalog').select('*').order('nome', { ascending: true })
  if (error) throw error
  return data || []
}

export const createServiceCatalogItem = async (item: Omit<ServiceCatalogItem, 'id'>): Promise<ServiceCatalogItem> => {
  const { data, error } = await supabase.from('service_catalog').insert(item).select().single()
  if (error) throw error
  return data
}

export const updateServiceCatalogItem = async (id: string, item: Partial<ServiceCatalogItem>): Promise<void> => {
  const { error } = await supabase.from('service_catalog').update(item).eq('id', id)
  if (error) throw error
}

export const deleteServiceCatalogItem = async (id: string): Promise<void> => {
  const { error } = await supabase.from('service_catalog').delete().eq('id', id)
  if (error) throw error
}

// ─── Bulk Operations ──────────────────────────────────────────────────────────

export const bulkDelete = async (table: string, ids: string[]): Promise<void> => {
  const { error } = await supabase.from(table).delete().in('id', ids)
  if (error) throw error
}

// ─── Agenda Events ────────────────────────────────────────────────────────────

export type AgendaEvent = Record<string, any>

export const getAgendaEvents = async (): Promise<AgendaEvent[]> => {
  const { data, error } = await supabase.from('agenda_events').select('*').order('start_date', { ascending: true })
  if (error) throw error
  return data || []
}

export const createAgendaEvent = async (event: AgendaEvent): Promise<AgendaEvent> => {
  const { data, error } = await supabase.from('agenda_events').insert(event).select().single()
  if (error) throw error
  return data
}

export const updateAgendaEvent = async (id: string, event: Partial<AgendaEvent>): Promise<void> => {
  const { error } = await supabase.from('agenda_events').update(event).eq('id', id)
  if (error) throw error
}

export const deleteAgendaEvent = async (id: string): Promise<void> => {
  const { error } = await supabase.from('agenda_events').delete().eq('id', id)
  if (error) throw error
}
