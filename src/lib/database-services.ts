import { supabase } from './supabase'

export interface ServiceOrderItem {
  id?: string
  service_order_id: string
  service_catalog_id?: string
  quantity: number
  unit_price?: number
  total_price?: number
  estimated_duration?: number
  notes?: string
  difficulty_level?: number
  difficulty_multiplier?: number
  base_unit_price?: number
  created_at?: string
  updated_at?: string
}

export interface ServiceOrderTeamMember {
  id?: string
  service_order_id: string
  employee_id: string
  role?: 'leader' | 'technician' | 'assistant' | 'supervisor'
  assigned_at?: string
  created_at?: string
}

export interface Employee {
  id?: string
  name: string
  email?: string
  phone?: string
  role?: string
  salary?: number
  active?: boolean
  cpf?: string
  rg?: string
  birth_date?: string
  admission_date?: string
  department?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  address_zip_code?: string
  bank_name?: string
  bank_agency?: string
  bank_account?: string
  bank_account_type?: string
  pix_key?: string
  driver_license_number?: string
  driver_license_category?: string
  driver_license_expiry?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  created_at?: string
  updated_at?: string
}

export interface EmployeeDocument {
  id?: string
  employee_id: string
  document_type: 'driver_license' | 'certificate' | 'training' | 'contract' | 'other'
  file_name: string
  file_url: string
  file_size?: number
  notes?: string
  uploaded_at?: string
  created_at?: string
}

export interface UserInvitation {
  id?: string
  email: string
  role: 'admin' | 'technician' | 'external'
  invited_by?: string
  token?: string
  status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expires_at?: string
  accepted_at?: string
  created_at?: string
  updated_at?: string
}

export const getServiceOrderItems = async (serviceOrderId: string): Promise<ServiceOrderItem[]> => {
  const { data, error } = await supabase
    .from('service_order_items')
    .select(`
      *,
      service_catalog:service_catalog_id (
        id,
        name,
        base_price,
        estimated_duration
      )
    `)
    .eq('service_order_id', serviceOrderId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const createServiceOrderItem = async (item: ServiceOrderItem): Promise<ServiceOrderItem> => {
  const { data, error } = await supabase
    .from('service_order_items')
    .insert([item])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateServiceOrderItem = async (id: string, updates: Partial<ServiceOrderItem>): Promise<ServiceOrderItem> => {
  const { data, error } = await supabase
    .from('service_order_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteServiceOrderItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('service_order_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const getServiceOrderTeam = async (serviceOrderId: string): Promise<ServiceOrderTeamMember[]> => {
  const { data, error } = await supabase
    .from('service_order_team')
    .select(`
      *,
      employee:employee_id (
        id,
        name,
        email,
        phone,
        role
      )
    `)
    .eq('service_order_id', serviceOrderId)
    .order('assigned_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const addTeamMember = async (member: ServiceOrderTeamMember): Promise<ServiceOrderTeamMember> => {
  const { data, error } = await supabase
    .from('service_order_team')
    .insert([member])
    .select()
    .single()

  if (error) throw error
  return data
}

export const removeTeamMember = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('service_order_team')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const updateTeamMemberRole = async (id: string, role: string): Promise<ServiceOrderTeamMember> => {
  const { data, error } = await supabase
    .from('service_order_team')
    .update({ role })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export const createEmployee = async (employee: Employee): Promise<Employee> => {
  const { data, error } = await supabase
    .from('employees')
    .insert([employee])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee> => {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteEmployee = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('employees')
    .update({ active: false })
    .eq('id', id)

  if (error) throw error
}

export const getUserInvitations = async (): Promise<UserInvitation[]> => {
  const { data, error } = await supabase
    .from('user_invitations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const createUserInvitation = async (invitation: UserInvitation): Promise<UserInvitation> => {
  const { data, error } = await supabase
    .from('user_invitations')
    .insert([invitation])
    .select()
    .single()

  if (error) throw error
  return data
}

export const cancelUserInvitation = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('user_invitations')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) throw error
}

export const expireOldInvitations = async (): Promise<void> => {
  const { error } = await supabase.rpc('expire_old_invitations')
  if (error) throw error
}

export interface CustomerAddress {
  id?: string
  customer_id: string
  tipo: 'comercial' | 'residencial' | 'filial' | 'outro'
  nome_identificacao?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  principal?: boolean
  created_at?: string
  updated_at?: string
}

export interface CustomerContact {
  id?: string
  customer_id: string
  nome: string
  cargo?: string
  email?: string
  telefone?: string
  celular?: string
  departamento?: string
  principal?: boolean
  recebe_notificacoes?: boolean
  created_at?: string
  updated_at?: string
}

export interface CustomerEquipment {
  id?: string
  customer_id: string
  customer_address_id?: string
  tipo_equipamento?: string
  marca?: string
  modelo?: string
  numero_serie?: string
  capacidade?: string
  data_instalacao?: string
  created_at?: string
  updated_at?: string
}

export const getCustomerAddresses = async (customerId: string): Promise<CustomerAddress[]> => {
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('principal', { ascending: false })

  if (error) throw error
  return data || []
}

export const createCustomerAddress = async (address: CustomerAddress): Promise<CustomerAddress> => {
  const { data, error } = await supabase
    .from('customer_addresses')
    .insert([address])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCustomerAddress = async (id: string, updates: Partial<CustomerAddress>): Promise<CustomerAddress> => {
  const { data, error } = await supabase
    .from('customer_addresses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteCustomerAddress = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const getCustomerContacts = async (customerId: string): Promise<CustomerContact[]> => {
  const { data, error } = await supabase
    .from('customer_contacts')
    .select('*')
    .eq('customer_id', customerId)
    .order('principal', { ascending: false })

  if (error) throw error
  return data || []
}

export const createCustomerContact = async (contact: CustomerContact): Promise<CustomerContact> => {
  const { data, error } = await supabase
    .from('customer_contacts')
    .insert([contact])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCustomerContact = async (id: string, updates: Partial<CustomerContact>): Promise<CustomerContact> => {
  const { data, error } = await supabase
    .from('customer_contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteCustomerContact = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('customer_contacts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const getCustomerEquipment = async (customerId: string): Promise<CustomerEquipment[]> => {
  const { data, error } = await supabase
    .from('customer_equipment')
    .select(`
      *,
      customer_address:customer_address_id (
        id,
        nome_identificacao,
        logradouro,
        numero,
        cidade,
        estado
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const createCustomerEquipment = async (equipment: CustomerEquipment): Promise<CustomerEquipment> => {
  const { data, error } = await supabase
    .from('customer_equipment')
    .insert([equipment])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCustomerEquipment = async (id: string, updates: Partial<CustomerEquipment>): Promise<CustomerEquipment> => {
  const { data, error } = await supabase
    .from('customer_equipment')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteCustomerEquipment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('customer_equipment')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export interface Material {
  id?: string
  name: string
  description?: string
  category?: string
  unit?: string
  quantity?: number
  min_quantity?: number
  unit_price?: number
  supplier?: string
  active?: boolean
  created_at?: string
  updated_at?: string
}

export const getMaterials = async (): Promise<Material[]> => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export const createMaterial = async (material: Material): Promise<Material> => {
  const { data, error } = await supabase
    .from('materials')
    .insert([material])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateMaterial = async (id: string, updates: Partial<Material>): Promise<Material> => {
  const { data, error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteMaterial = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('materials')
    .update({ active: false })
    .eq('id', id)

  if (error) throw error
}

export interface ServiceOrderMaterial {
  id?: string
  service_order_id: string
  material_id?: string
  material_name?: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
  created_at?: string
  updated_at?: string
}

export const getServiceOrderMaterials = async (serviceOrderId: string): Promise<ServiceOrderMaterial[]> => {
  const { data, error } = await supabase
    .from('service_order_materials')
    .select('*')
    .eq('service_order_id', serviceOrderId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export interface ServiceOrder {
  id: string
  order_number: string
  client_name: string
  client_phone?: string
  service_type: string
  description?: string
  status: string
  priority?: string
  assigned_to?: string
  due_date?: string
  service_date?: string
  total_value?: number
  final_total?: number
  custo_total?: number
  lucro_total?: number
  created_at: string
  updated_at: string
}

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const createServiceOrder = async (order: Partial<ServiceOrder>): Promise<ServiceOrder> => {
  const { data, error } = await supabase
    .from('service_orders')
    .insert([order])
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateServiceOrder = async (id: string, updates: Partial<ServiceOrder>): Promise<ServiceOrder> => {
  const { data, error } = await supabase
    .from('service_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteServiceOrder = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('service_orders')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export const getServiceOrderById = async (id: string): Promise<ServiceOrder> => {
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export interface InventoryItem {
  id?: string
  name: string
  sku?: string
  description?: string
  category?: string
  quantity: number
  min_quantity?: number
  unit_price?: number
  unit?: string
  supplier?: string
  location?: string
  active?: boolean
  created_at?: string
  updated_at?: string
}

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase.from('inventory_items').select('*').order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export const createInventoryItem = async (item: Partial<InventoryItem>): Promise<InventoryItem> => {
  const { data, error } = await supabase.from('inventory_items').insert([item]).select().single()
  if (error) throw error
  return data
}

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
  const { data, error } = await supabase.from('inventory_items').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteInventoryItem = async (id: string): Promise<void> => {
  const { error } = await supabase.from('inventory_items').update({ active: false }).eq('id', id)
  if (error) throw error
}

export const getServiceCatalog = async () => { const { data } = await supabase.from('service_catalog').select('*').eq('active', true); return data || [] }
export const createServiceCatalogItem = async (item: any) => { const { data } = await supabase.from('service_catalog').insert([item]).select().single(); return data }
export const updateServiceCatalogItem = async (id: string, updates: any) => { const { data } = await supabase.from('service_catalog').update(updates).eq('id', id).select().single(); return data }
export const deleteServiceCatalogItem = async (id: string) => { await supabase.from('service_catalog').update({ active: false }).eq('id', id) }
export const getClients = async () => { const { data } = await supabase.from('customers').select('*'); return data || [] }
export const createDbClient = async (client: any) => { const { data } = await supabase.from('customers').insert([client]).select().single(); return data }
export const updateClient = async (id: string, updates: any) => { const { data } = await supabase.from('customers').update(updates).eq('id', id).select().single(); return data }
export const deleteClient = async (id: string) => { await supabase.from('customers').delete().eq('id', id) }
export const getContracts = async () => { const { data } = await supabase.from('contracts').select('*'); return data || [] }
export const getContractsByClient = async (clientId: string) => { const { data } = await supabase.from('contracts').select('*').eq('customer_id', clientId); return data || [] }
export const createContract = async (contract: any) => { const { data } = await supabase.from('contracts').insert([contract]).select().single(); return data }
export const updateContract = async (id: string, updates: any) => { const { data } = await supabase.from('contracts').update(updates).eq('id', id).select().single(); return data }
export const deleteContract = async (id: string) => { await supabase.from('contracts').delete().eq('id', id) }
export const getAgendaEvents = async () => {
  const { data, error } = await supabase
    .from('agenda_events')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Error loading agenda events:', error)
    throw error
  }

  console.log(`✅ Loaded ${data?.length || 0} events from database`)
  return data || []
}
export const createAgendaEvent = async (event: any) => { const { data } = await supabase.from('agenda_events').insert([event]).select().single(); return data }
export const updateAgendaEvent = async (id: string, updates: any) => { const { data } = await supabase.from('agenda_events').update(updates).eq('id', id).select().single(); return data }
export const deleteAgendaEvent = async (id: string) => { await supabase.from('agenda_events').delete().eq('id', id) }
export const getFinanceEntries = async () => { const { data } = await supabase.from('finance_entries').select('*'); return data || [] }
export const createFinanceEntry = async (entry: any) => { const { data } = await supabase.from('finance_entries').insert([entry]).select().single(); return data }
export const updateFinanceEntry = async (id: string, updates: any) => { const { data } = await supabase.from('finance_entries').update(updates).eq('id', id).select().single(); return data }
export const deleteFinanceEntry = async (id: string) => { await supabase.from('finance_entries').delete().eq('id', id) }
export const getSuppliers = async () => { const { data } = await supabase.from('suppliers').select('*'); return data || [] }
export const createSupplier = async (supplier: any) => { const { data } = await supabase.from('suppliers').insert([supplier]).select().single(); return data }
export const updateSupplier = async (id: string, updates: any) => { const { data } = await supabase.from('suppliers').update(updates).eq('id', id).select().single(); return data }
export const deleteSupplier = async (id: string) => { await supabase.from('suppliers').delete().eq('id', id) }
