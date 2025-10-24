/**
 * Utilitário centralizado para mapear dados de serviços
 * Garante que TODOS os PDFs e visualizações usem os mesmos dados
 */

export interface ServiceItemComplete {
  // Identificação
  service_catalog_id?: string
  service_name: string

  // Descrições
  description?: string
  service_description?: string

  // Escopo e detalhes
  scope?: string
  service_scope?: string
  escopo_detalhado?: string

  // Informações técnicas
  technical_requirements?: string
  safety_warnings?: string
  execution_steps?: string
  expected_results?: string
  quality_standards?: string
  warranty_info?: string
  observations?: string

  // Comercial
  unit: string
  unit_price: number
  quantity: number
  total_price: number

  // Tempo
  estimated_duration?: number
  tempo_estimado_minutos?: number
}

/**
 * Mapeia item de OS + dados do catálogo para estrutura completa
 */
export function mapServiceItem(item: any, catalogData?: any): ServiceItemComplete {
  const catalog = catalogData || item.service_catalog || {}

  return {
    // Identificação
    service_catalog_id: item.service_catalog_id || catalog.id,
    service_name: item.service_name || catalog.name || item.descricao || item.description || 'Serviço',

    // Descrições
    description: item.descricao || item.description || catalog.description || '',
    service_description: item.service_description || catalog.description || '',

    // Escopo
    scope: item.escopo_detalhado || item.escopo || item.scope || catalog.escopo_servico || '',
    service_scope: item.escopo_detalhado || item.escopo || catalog.escopo_servico || '',
    escopo_detalhado: item.escopo_detalhado || catalog.escopo_servico || '',

    // Técnico
    technical_requirements: item.requisitos_tecnicos || catalog.requisitos_tecnicos || '',
    safety_warnings: item.avisos_seguranca || catalog.avisos_seguranca || '',
    execution_steps: item.passos_execucao || catalog.passos_execucao || '',
    expected_results: item.resultados_esperados || catalog.resultados_esperados || '',
    quality_standards: item.padroes_qualidade || catalog.padroes_qualidade || '',
    warranty_info: item.informacoes_garantia || catalog.informacoes_garantia || '',
    observations: item.observacoes_tecnicas || item.observacoes || catalog.observacoes_tecnicas || '',

    // Comercial
    unit: item.unit || item.unidade || catalog.unit || 'un.',
    unit_price: parseFloat(item.unit_price || item.preco_unitario || catalog.base_price || 0),
    quantity: parseFloat(item.quantity || item.quantidade || 1),
    total_price: parseFloat(item.total_price || item.preco_total || (item.quantity * item.unit_price) || 0),

    // Tempo
    estimated_duration: item.tempo_estimado_minutos || catalog.tempo_estimado_minutos || 0,
    tempo_estimado_minutos: item.tempo_estimado_minutos || catalog.tempo_estimado_minutos || 0
  }
}

/**
 * Mapeia array de itens
 */
export function mapServiceItems(items: any[]): ServiceItemComplete[] {
  if (!items || !Array.isArray(items)) return []

  return items.map(item => mapServiceItem(item, item.service_catalog))
}

/**
 * Query completa para buscar itens com todos os dados do catálogo
 */
export const COMPLETE_SERVICE_ITEMS_QUERY = `
  *,
  service_catalog:service_catalog_id(
    id,
    name,
    description,
    base_price,
    category,
    unit,
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
`

/**
 * Gera descrição completa do serviço para PDF
 */
export function generateServiceDescription(item: ServiceItemComplete): string {
  let desc = item.service_name || 'Serviço'

  // Adicionar descrição
  const fullDesc = item.service_description || item.description
  if (fullDesc && fullDesc !== desc) {
    desc += `\n${fullDesc}`
  }

  // Adicionar escopo
  const scope = item.service_scope || item.scope || item.escopo_detalhado
  if (scope) {
    desc += `\n\nESCOPO DO SERVIÇO:\n${scope}`
  }

  // Adicionar requisitos técnicos
  if (item.technical_requirements) {
    desc += `\n\nREQUISITOS TÉCNICOS:\n${item.technical_requirements}`
  }

  // Adicionar avisos de segurança
  if (item.safety_warnings) {
    desc += `\n\n⚠ AVISOS DE SEGURANÇA:\n${item.safety_warnings}`
  }

  // Adicionar passos de execução
  if (item.execution_steps) {
    desc += `\n\nPASSOS DE EXECUÇÃO:\n${item.execution_steps}`
  }

  // Adicionar resultados esperados
  if (item.expected_results) {
    desc += `\n\nRESULTADOS ESPERADOS:\n${item.expected_results}`
  }

  // Adicionar padrões de qualidade
  if (item.quality_standards) {
    desc += `\n\nPADRÕES DE QUALIDADE:\n${item.quality_standards}`
  }

  // Adicionar garantia
  if (item.warranty_info) {
    desc += `\n\n🛡 GARANTIA:\n${item.warranty_info}`
  }

  // Adicionar observações
  if (item.observations) {
    desc += `\n\nOBSERVAÇÕES:\n${item.observations}`
  }

  // Adicionar tempo estimado
  const duration = item.estimated_duration || item.tempo_estimado_minutos
  if (duration && duration > 0) {
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60

    if (hours > 0 && minutes > 0) {
      desc += `\n\n⏱ Tempo estimado: ${hours}h ${minutes}min`
    } else if (hours > 0) {
      desc += `\n\n⏱ Tempo estimado: ${hours} hora${hours > 1 ? 's' : ''}`
    } else {
      desc += `\n\n⏱ Tempo estimado: ${minutes} minutos`
    }
  }

  return desc
}

/**
 * Formata valores monetários
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Calcula totais dos serviços
 */
export function calculateServiceTotals(items: ServiceItemComplete[]): {
  subtotal: number
  count: number
  averageValue: number
} {
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const count = items.length
  const averageValue = count > 0 ? subtotal / count : 0

  return { subtotal, count, averageValue }
}
