export type ColumnId = 'todo' | 'in_progress' | 'review' | 'blocked' | 'done'
export type Priority = 'urgent' | 'high' | 'normal' | 'low'

export interface Subtask {
  id: string
  task_id: string
  title: string
  completed: boolean
  position: number
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  author_name: string
  author_avatar?: string
  body: string
  is_thomaz: boolean
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  column_id: ColumnId
  priority: Priority
  assignee_id?: string
  assignee_name?: string
  assignee_avatar?: string
  due_date?: string
  category?: string
  tags: string[]
  position: number
  created_by?: string
  created_at: string
  updated_at: string
  blocked_since?: string
  thomaz_notified: boolean
  subtasks?: Subtask[]
  subtasks_total?: number
  subtasks_done?: number
}

export interface Column {
  id: ColumnId
  label: string
  color: string
  headerBg: string
  dotColor: string
}

export const COLUMNS: Column[] = [
  { id: 'todo',        label: 'Para Fazer',   color: 'text-gray-600',   headerBg: 'bg-gray-100',   dotColor: 'bg-gray-400' },
  { id: 'in_progress', label: 'Em Andamento', color: 'text-blue-700',   headerBg: 'bg-blue-50',    dotColor: 'bg-blue-500' },
  { id: 'review',      label: 'Em Revisão',   color: 'text-amber-700',  headerBg: 'bg-amber-50',   dotColor: 'bg-amber-400' },
  { id: 'blocked',     label: 'Bloqueado',    color: 'text-red-700',    headerBg: 'bg-red-50',     dotColor: 'bg-red-500' },
  { id: 'done',        label: 'Concluído',    color: 'text-teal-700',   headerBg: 'bg-teal-50',    dotColor: 'bg-teal-500' },
]

export const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string; border: string }> = {
  urgent: { label: 'Urgente', bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300' },
  high:   { label: 'Alta',    bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  normal: { label: 'Normal',  bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300' },
  low:    { label: 'Baixa',   bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-300' },
}
