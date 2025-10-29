/**
 * Mapeadores centralizados para conversão entre frontend (PT) e backend (EN/Mixed)
 *
 * Este arquivo resolve incompatibilidades de linguagem entre:
 * - Interface do usuário (português)
 * - Banco de dados (inglês/português misturado)
 * - Constraints do banco (valores específicos permitidos)
 */

// ========================================
// SERVICE ORDERS - Status
// ========================================

export const serviceOrderStatusUIToDb = {
  'pendente': 'pendente',
  'em_andamento': 'em_andamento',
  'pausado': 'pausado',
  'pausada': 'pausado',
  'concluido': 'concluido',
  'concluida': 'concluido',
  'cancelado': 'cancelado',
  'cancelada': 'cancelado',
  'aberta': 'pendente',
  'agendada': 'pendente',
  'aguardando_pecas': 'pausado',
  'on_hold': 'pausado',
  'pending': 'pendente',
  'in_progress': 'em_andamento',
  'completed': 'concluido',
  'cancelled': 'cancelado'
} as const

export const serviceOrderStatusDbToUI = {
  'pendente': 'pendente',
  'em_andamento': 'em_andamento',
  'pausado': 'pausado',
  'concluido': 'concluido',
  'cancelado': 'cancelado',
  'pending': 'pendente',
  'in_progress': 'em_andamento',
  'on_hold': 'pausado',
  'completed': 'concluido',
  'cancelled': 'cancelado',
  'aberta': 'pendente',
  'agendada': 'pendente',
  'aguardando_pecas': 'pausado',
  'pausada': 'pausado'
} as const

export const serviceOrderStatusLabels = {
  'pendente': 'Pendente',
  'em_andamento': 'Em Andamento',
  'pausado': 'Pausado',
  'concluido': 'Concluída',
  'cancelado': 'Cancelada',
  'pending': 'Pendente',
  'in_progress': 'Em Andamento',
  'on_hold': 'Pausado',
  'completed': 'Concluída',
  'cancelled': 'Cancelada',
  'aberta': 'Aberta',
  'agendada': 'Agendada',
  'aguardando_pecas': 'Aguardando Peças',
  'pausada': 'Pausado'
} as const

// ========================================
// SERVICE ORDERS - Priority
// ========================================

export const priorityLabels = {
  'low': 'Baixa',
  'medium': 'Média',
  'high': 'Alta',
  'urgent': 'Urgente'
} as const

// ========================================
// SERVICE ORDERS - Payment Method
// ========================================

// Frontend usa inglês com underscores, banco usa português com underscores
export const paymentMethodUIToDb = {
  'cash': 'dinheiro',
  'pix': 'pix',
  'credit_card': 'cartao_credito',
  'debit_card': 'cartao_debito',
  'bank_slip': 'boleto',
  'transfer': 'transferencia',
  'dinheiro': 'dinheiro',
  'cartao_credito': 'cartao_credito',
  'cartao_debito': 'cartao_debito',
  'boleto': 'boleto',
  'transferencia': 'transferencia'
} as const

export const paymentMethodDbToUI = {
  'dinheiro': 'dinheiro',
  'pix': 'pix',
  'cartao_credito': 'cartao_credito',
  'cartao_debito': 'cartao_debito',
  'boleto': 'boleto',
  'transferencia': 'transferencia',
  'cash': 'dinheiro',
  'credit_card': 'cartao_credito',
  'debit_card': 'cartao_debito',
  'bank_slip': 'boleto',
  'transfer': 'transferencia'
} as const

export const paymentMethodLabels = {
  'dinheiro': 'Dinheiro',
  'pix': 'PIX',
  'cartao_credito': 'Cartão de Crédito',
  'cartao_debito': 'Cartão de Débito',
  'boleto': 'Boleto',
  'transferencia': 'Transferência',
  'cash': 'Dinheiro',
  'credit_card': 'Cartão de Crédito',
  'debit_card': 'Cartão de Débito',
  'bank_slip': 'Boleto',
  'transfer': 'Transferência'
} as const

// ========================================
// FINANCE ENTRIES - Type
// ========================================

export const financeTypeUIToDb = {
  'income': 'receita',
  'expense': 'despesa',
  'receita': 'receita',
  'despesa': 'despesa'
} as const

export const financeTypeDbToUI = {
  'receita': 'receita',
  'despesa': 'despesa',
  'income': 'receita',
  'expense': 'despesa'
} as const

export const financeTypeLabels = {
  'receita': 'Receita',
  'despesa': 'Despesa',
  'income': 'Receita',
  'expense': 'Despesa'
} as const

// ========================================
// FINANCE ENTRIES - Status
// ========================================

export const financeStatusUIToDb = {
  'paid': 'pago',
  'pending': 'a_pagar',
  'received': 'recebido',
  'to_receive': 'a_receber',
  'pago': 'pago',
  'recebido': 'recebido',
  'a_pagar': 'a_pagar',
  'a_receber': 'a_receber',
  'pendente': 'a_pagar'
} as const

export const financeStatusDbToUI = {
  'pago': 'pago',
  'recebido': 'recebido',
  'a_pagar': 'a_pagar',
  'a_receber': 'a_receber',
  'paid': 'pago',
  'received': 'recebido',
  'pending': 'a_pagar',
  'to_receive': 'a_receber'
} as const

export const financeStatusLabels = {
  'pago': 'Pago',
  'recebido': 'Recebido',
  'a_pagar': 'A Pagar',
  'a_receber': 'A Receber',
  'paid': 'Pago',
  'received': 'Recebido',
  'pending': 'Pendente',
  'to_receive': 'A Receber'
} as const

// ========================================
// FINANCE ENTRIES - Payment Method
// ========================================
// Usa o mesmo mapeamento de service orders
export const financePaymentMethodUIToDb = paymentMethodUIToDb
export const financePaymentMethodDbToUI = paymentMethodDbToUI
export const financePaymentMethodLabels = paymentMethodLabels

// ========================================
// CUSTOMERS - Type
// ========================================

export const customerTypeUIToDb = {
  'individual': 'fisica',
  'company': 'juridica',
  'pf': 'fisica',
  'pj': 'juridica',
  'fisica': 'fisica',
  'juridica': 'juridica'
} as const

export const customerTypeDbToUI = {
  'fisica': 'fisica',
  'juridica': 'juridica',
  'pf': 'fisica',
  'pj': 'juridica',
  'individual': 'fisica',
  'company': 'juridica'
} as const

export const customerTypeLabels = {
  'fisica': 'Pessoa Física',
  'juridica': 'Pessoa Jurídica',
  'pf': 'Pessoa Física',
  'pj': 'Pessoa Jurídica',
  'individual': 'Pessoa Física',
  'company': 'Pessoa Jurídica'
} as const

// ========================================
// AGENDA EVENTS - Status (já implementado em calendarHelpers)
// ========================================
// Referência: usar calendarHelpers.ts

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Converte status de OS do frontend para o banco
 */
export function mapServiceOrderStatusToDb(status: string | undefined): string {
  if (!status) return 'pending'
  return serviceOrderStatusUIToDb[status as keyof typeof serviceOrderStatusUIToDb] || status
}

/**
 * Converte status de OS do banco para o frontend
 */
export function mapServiceOrderStatusFromDb(status: string | undefined): string {
  if (!status) return 'pendente'
  return serviceOrderStatusDbToUI[status as keyof typeof serviceOrderStatusDbToUI] || status
}

/**
 * Retorna label do status de OS
 */
export function getServiceOrderStatusLabel(status: string | undefined): string {
  if (!status) return 'Pendente'
  return serviceOrderStatusLabels[status as keyof typeof serviceOrderStatusLabels] || status
}

/**
 * Converte método de pagamento do frontend para o banco
 */
export function mapPaymentMethodToDb(method: string | undefined): string {
  if (!method) return 'dinheiro'
  return paymentMethodUIToDb[method as keyof typeof paymentMethodUIToDb] || method
}

/**
 * Converte método de pagamento do banco para o frontend
 */
export function mapPaymentMethodFromDb(method: string | undefined): string {
  if (!method) return 'dinheiro'
  return paymentMethodDbToUI[method as keyof typeof paymentMethodDbToUI] || method
}

/**
 * Retorna label do método de pagamento
 */
export function getPaymentMethodLabel(method: string | undefined): string {
  if (!method) return 'Dinheiro'
  return paymentMethodLabels[method as keyof typeof paymentMethodLabels] || method
}

/**
 * Converte tipo de lançamento financeiro do frontend para o banco
 */
export function mapFinanceTypeToDb(type: string | undefined): string {
  if (!type) return 'receita'
  return financeTypeUIToDb[type as keyof typeof financeTypeUIToDb] || type
}

/**
 * Converte tipo de lançamento financeiro do banco para o frontend
 */
export function mapFinanceTypeFromDb(type: string | undefined): string {
  if (!type) return 'receita'
  return financeTypeDbToUI[type as keyof typeof financeTypeDbToUI] || type
}

/**
 * Retorna label do tipo de lançamento financeiro
 */
export function getFinanceTypeLabel(type: string | undefined): string {
  if (!type) return 'Receita'
  return financeTypeLabels[type as keyof typeof financeTypeLabels] || type
}

/**
 * Converte status de lançamento financeiro do frontend para o banco
 */
export function mapFinanceStatusToDb(status: string | undefined, type: string = 'receita'): string {
  if (!status) return type === 'receita' ? 'a_receber' : 'a_pagar'
  return financeStatusUIToDb[status as keyof typeof financeStatusUIToDb] || status
}

/**
 * Converte status de lançamento financeiro do banco para o frontend
 */
export function mapFinanceStatusFromDb(status: string | undefined): string {
  if (!status) return 'a_receber'
  return financeStatusDbToUI[status as keyof typeof financeStatusDbToUI] || status
}

/**
 * Retorna label do status de lançamento financeiro
 */
export function getFinanceStatusLabel(status: string | undefined): string {
  if (!status) return 'A Receber'
  return financeStatusLabels[status as keyof typeof financeStatusLabels] || status
}

/**
 * Converte tipo de cliente do frontend para o banco
 */
export function mapCustomerTypeToDb(type: string | undefined): string {
  if (!type) return 'fisica'
  return customerTypeUIToDb[type as keyof typeof customerTypeUIToDb] || type
}

/**
 * Converte tipo de cliente do banco para o frontend
 */
export function mapCustomerTypeFromDb(type: string | undefined): string {
  if (!type) return 'fisica'
  return customerTypeDbToUI[type as keyof typeof customerTypeDbToUI] || type
}

/**
 * Retorna label do tipo de cliente
 */
export function getCustomerTypeLabel(type: string | undefined): string {
  if (!type) return 'Pessoa Física'
  return customerTypeLabels[type as keyof typeof customerTypeLabels] || type
}

/**
 * Retorna label de prioridade
 */
export function getPriorityLabel(priority: string | undefined): string {
  if (!priority) return 'Média'
  return priorityLabels[priority as keyof typeof priorityLabels] || priority
}
