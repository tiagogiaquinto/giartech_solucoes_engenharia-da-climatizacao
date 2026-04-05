export type ProfileType = 'staff' | 'cliente' | 'parceiro'

export interface StaffProfile {
  id: string
  type: 'staff'
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
  phone: string | null
  department: string | null
  avatar_url: string | null
  employee_id: string | null
  salary: number | null
  hourly_rate: number | null
  work_hours: number | null
  custo_hora: number | null
  especialidade: string | null
}

export interface PortalProfile {
  id: string
  type: 'cliente' | 'parceiro'
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
  phone: string | null
  document: string | null
  customer_id: string | null
  partner_id: string | null
  customer_name: string | null
  customer_email: string | null
}

export type AnyProfile = StaffProfile | PortalProfile

export interface AuditEntry {
  id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_by_email: string
  changed_at: string
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  technician: 'Técnico',
  sales: 'Comercial',
  financial: 'Financeiro',
  viewer: 'Visualizador',
  cliente: 'Cliente',
  parceiro: 'Parceiro',
}

export const ROLE_COLORS: Record<string, { from: string; to: string; text: string }> = {
  super_admin: { from: '#0f172a', to: '#1e3a5f', text: '#60a5fa' },
  admin:       { from: '#1e3a5f', to: '#1d4ed8', text: '#93c5fd' },
  manager:     { from: '#0f4c3a', to: '#065f46', text: '#6ee7b7' },
  technician:  { from: '#1c2d4a', to: '#1e40af', text: '#93c5fd' },
  sales:       { from: '#1a3a2a', to: '#166534', text: '#86efac' },
  financial:   { from: '#312e0a', to: '#713f12', text: '#fde68a' },
  viewer:      { from: '#1f2937', to: '#374151', text: '#d1d5db' },
  cliente:     { from: '#1a2a3a', to: '#0e7490', text: '#67e8f9' },
  parceiro:    { from: '#0f3a2a', to: '#065f46', text: '#6ee7b7' },
}

export const MODULE_LIST = [
  { code: 'dashboard',      label: 'Dashboard' },
  { code: 'agenda',         label: 'Agenda' },
  { code: 'clientes',       label: 'Clientes' },
  { code: 'crm',            label: 'CRM' },
  { code: 'service_orders', label: 'Ordens de Serviço' },
  { code: 'estoque',        label: 'Estoque' },
  { code: 'financeiro',     label: 'Financeiro' },
  { code: 'relatorios',     label: 'Relatórios' },
  { code: 'documentos',     label: 'Documentos' },
  { code: 'pessoas',        label: 'Gestão de Pessoas' },
  { code: 'thomaz',         label: 'Thomaz AI' },
  { code: 'configuracoes',  label: 'Configurações' },
]
