export interface Channel {
  id: string
  channel_type: 'direct' | 'os' | 'group'
  name: string
  service_order_id: string | null
  last_message_at: string | null
  created_at: string
  unread_count?: number
  last_message?: string
}

export interface ChatMessage {
  id: string
  channel_id: string
  sender_id: string | null
  sender_name: string
  sender_role: string
  message_type: string
  content: string
  file_url?: string
  file_name?: string
  reply_to_id: string | null
  is_deleted: boolean
  created_at: string
}

export interface BroadcastMessage {
  id: string
  title: string
  content: string
  priority: 'info' | 'warning' | 'urgent'
  target: 'all' | 'technicians' | 'admin' | 'partners' | 'customers'
  created_by: string | null
  created_by_name: string
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface MiniTask {
  id: string
  title: string
  column_id: string
  priority: string
  assignee_name?: string
  due_date?: string
  tags: string[]
  subtasks_total?: number
  subtasks_done?: number
}

export const DEPT_CHANNELS = [
  { key: 'geral',        label: 'Geral GiarTech',  color: 'bg-blue-500' },
  { key: 'tecnico',      label: 'Técnico',          color: 'bg-emerald-500' },
  { key: 'administrativo', label: 'Administrativo', color: 'bg-amber-500' },
  { key: 'comercial',    label: 'Comercial',        color: 'bg-rose-500' },
]

export const PRIORITY_BADGE: Record<string, { label: string; cls: string }> = {
  urgent: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
  high:   { label: 'Alta',    cls: 'bg-orange-100 text-orange-700' },
  normal: { label: 'Normal',  cls: 'bg-blue-100 text-blue-700' },
  low:    { label: 'Baixa',   cls: 'bg-gray-100 text-gray-500' },
}

export const BROADCAST_PRIORITY: Record<string, { label: string; bg: string; border: string; text: string; icon: string }> = {
  info:    { label: 'Informativo', bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',  icon: 'ℹ️' },
  warning: { label: 'Atenção',     bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-800', icon: '⚠️' },
  urgent:  { label: 'Urgente',     bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800',   icon: '🚨' },
}
