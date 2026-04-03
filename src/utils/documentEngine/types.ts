export interface CompanyProfile {
  company_name: string
  trade_name?: string
  cnpj?: string
  state_registration?: string
  municipal_registration?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  pix_key?: string
  bank_name?: string
  bank_agency?: string
  bank_account?: string
  technical_manager?: string
  default_warranty_days?: number
  default_footer?: string
}

export interface DocumentCustomer {
  name: string
  cpf_cnpj?: string
  phone?: string
  email?: string
  address?: string
  address_complement?: string
  city?: string
  state?: string
  zip_code?: string
}

export interface DocumentItem {
  description: string
  quantity: number
  unit?: string
  unit_price: number
  total: number
  notes?: string
}

export interface DocumentFinancial {
  subtotal: number
  discount?: number
  net_value: number
  payment_method?: string
  payment_installments?: number
  payment_conditions?: string
  pix_key?: string
  labor_value?: number
  materials_value?: number
}

export interface DocumentSignature {
  client_name?: string
  technician_name?: string
  signature_data?: string
  emit_date?: string
}

export interface OSDocumentData {
  type: 'os'
  company: CompanyProfile
  order_number: string
  status?: string
  created_at?: string
  scheduled_date?: string
  execution_deadline?: string
  description?: string
  instructions?: string
  report?: string
  priority?: string
  customer: DocumentCustomer
  items: DocumentItem[]
  financial: DocumentFinancial
  signature?: DocumentSignature
  checklist_items?: Array<{ description: string; checked: boolean }>
  warranty_days?: number
  warranty_terms?: string
  team?: Array<{ name: string; role: string }>
  materials?: Array<{ name: string; quantity: number; unit?: string; unit_cost?: number; total_cost?: number }>
}

export interface BudgetDocumentData {
  type: 'orcamento'
  company: CompanyProfile
  budget_number: string
  valid_until?: string
  created_at?: string
  customer: DocumentCustomer
  items: DocumentItem[]
  financial: DocumentFinancial
  notes?: string
  os_reference?: string
}

export interface ReciboDocumentData {
  type: 'recibo'
  company: CompanyProfile
  recibo_number: string
  created_at?: string
  customer: DocumentCustomer
  os_reference?: string
  description: string
  financial: DocumentFinancial
  valor_extenso?: string
  signature?: DocumentSignature
}

export type AnyDocumentData = OSDocumentData | BudgetDocumentData | ReciboDocumentData
