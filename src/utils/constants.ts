export const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
} as const

export const STATUS_LABELS = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  completed: 'Concluído',
  cancelled: 'Cancelado'
} as const

export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
} as const

export const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
} as const

export const USER_ROLES = {
  admin: 'Administrador',
  manager: 'Gerente',
  technician: 'Técnico',
  external: 'Externo',
  viewer: 'Visualizador'
} as const

export const CONTRACT_TYPES = {
  maintenance: 'Manutenção',
  support: 'Suporte',
  service: 'Serviço'
} as const

export const FREQUENCY_LABELS = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  biannual: 'Semestral',
  annual: 'Anual'
} as const

export const DATE_FORMATS = {
  display: 'dd/MM/yyyy',
  displayTime: 'dd/MM/yyyy HH:mm',
  iso: 'yyyy-MM-dd'
} as const

export const CACHE_KEYS = {
  serviceOrders: 'service_orders',
  inventoryItems: 'inventory_items',
  clients: 'clients',
  contracts: 'contracts',
  users: 'users'
} as const

export const CACHE_TIMES = {
  short: 2 * 60 * 1000,
  medium: 5 * 60 * 1000,
  long: 10 * 60 * 1000
} as const

export const ITEMS_PER_PAGE = 10

export const MAX_FILE_SIZE = 5 * 1024 * 1024

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf'
]
