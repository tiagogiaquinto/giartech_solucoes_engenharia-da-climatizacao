import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface TemplateData {
  serviceOrder?: any
  customer?: any
  company?: any
  items?: any[]
  materials?: any[]
  team?: any[]
  contract?: any
  proposal?: any
  budget?: any
}

export const fillTemplate = (templateHtml: string, data: TemplateData): string => {
  let filledHtml = templateHtml

  const replacements: Record<string, string> = {}

  if (data.company) {
    replacements['{{company.name}}'] = data.company.name || ''
    replacements['{{company.cnpj}}'] = data.company.cnpj || ''
    replacements['{{company.phone}}'] = data.company.phone || ''
    replacements['{{company.email}}'] = data.company.email || ''
    replacements['{{company.address}}'] = data.company.address || ''
    replacements['{{company.city}}'] = data.company.city || ''
    replacements['{{company.state}}'] = data.company.state || ''
    replacements['{{company.zipcode}}'] = data.company.zipcode || ''
    replacements['{{company.website}}'] = data.company.website || ''
  }

  if (data.customer) {
    replacements['{{customer.name}}'] = data.customer.name || data.customer.nome || ''
    replacements['{{customer.cpf}}'] = data.customer.cpf || data.customer.cpf_cnpj || ''
    replacements['{{customer.cnpj}}'] = data.customer.cnpj || data.customer.cpf_cnpj || ''
    replacements['{{customer.phone}}'] = data.customer.phone || data.customer.telefone || ''
    replacements['{{customer.email}}'] = data.customer.email || ''
    replacements['{{customer.address}}'] = data.customer.address || data.customer.endereco || ''
    replacements['{{customer.number}}'] = data.customer.number || data.customer.numero || ''
    replacements['{{customer.complement}}'] = data.customer.complement || data.customer.complemento || ''
    replacements['{{customer.neighborhood}}'] = data.customer.neighborhood || data.customer.bairro || ''
    replacements['{{customer.city}}'] = data.customer.city || data.customer.cidade || ''
    replacements['{{customer.state}}'] = data.customer.state || data.customer.estado || ''
    replacements['{{customer.zipcode}}'] = data.customer.zipcode || data.customer.cep || ''

    const fullAddress = [
      data.customer.endereco || data.customer.address,
      data.customer.numero || data.customer.number,
      data.customer.complemento || data.customer.complement,
      data.customer.bairro || data.customer.neighborhood,
      `${data.customer.cidade || data.customer.city} - ${data.customer.estado || data.customer.state}`,
      data.customer.cep || data.customer.zipcode
    ].filter(Boolean).join(', ')
    replacements['{{customer.full_address}}'] = fullAddress
  }

  if (data.serviceOrder) {
    replacements['{{os.number}}'] = data.serviceOrder.order_number || data.serviceOrder.numero_os || ''
    replacements['{{os.status}}'] = translateStatus(data.serviceOrder.status) || ''
    replacements['{{os.priority}}'] = translatePriority(data.serviceOrder.priority) || ''
    replacements['{{os.description}}'] = data.serviceOrder.description || data.serviceOrder.descricao || ''
    replacements['{{os.observations}}'] = data.serviceOrder.observations || data.serviceOrder.observacoes || ''
    replacements['{{os.notes}}'] = data.serviceOrder.notes || data.serviceOrder.anotacoes || ''

    replacements['{{os.date}}'] = data.serviceOrder.created_at
      ? format(new Date(data.serviceOrder.created_at), 'dd/MM/yyyy', { locale: ptBR })
      : format(new Date(), 'dd/MM/yyyy', { locale: ptBR })

    replacements['{{os.scheduled_date}}'] = data.serviceOrder.scheduled_date
      ? format(new Date(data.serviceOrder.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })
      : ''

    replacements['{{os.completed_date}}'] = data.serviceOrder.completed_at
      ? format(new Date(data.serviceOrder.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      : ''

    replacements['{{os.service_type}}'] = data.serviceOrder.service_type || ''
    replacements['{{os.equipment_type}}'] = data.serviceOrder.equipment_type || ''
    replacements['{{os.equipment_brand}}'] = data.serviceOrder.equipment_brand || ''
    replacements['{{os.equipment_model}}'] = data.serviceOrder.equipment_model || ''
    replacements['{{os.equipment_serial}}'] = data.serviceOrder.equipment_serial || ''

    replacements['{{os.subtotal}}'] = formatCurrency(data.serviceOrder.subtotal || 0)
    replacements['{{os.discount}}'] = formatCurrency(data.serviceOrder.discount || 0)
    replacements['{{os.total}}'] = formatCurrency(data.serviceOrder.total || 0)
    replacements['{{os.labor_cost}}'] = formatCurrency(data.serviceOrder.labor_cost || 0)
    replacements['{{os.material_cost}}'] = formatCurrency(data.serviceOrder.material_cost || 0)
    replacements['{{os.margin}}'] = `${(data.serviceOrder.margin_percentage || 0).toFixed(2)}%`
  }

  if (data.contract) {
    replacements['{{contract.number}}'] = data.contract.contract_number || ''
    replacements['{{contract.start_date}}'] = data.contract.start_date
      ? format(new Date(data.contract.start_date), 'dd/MM/yyyy', { locale: ptBR })
      : ''
    replacements['{{contract.end_date}}'] = data.contract.end_date
      ? format(new Date(data.contract.end_date), 'dd/MM/yyyy', { locale: ptBR })
      : ''
    replacements['{{contract.value}}'] = formatCurrency(data.contract.value || 0)
    replacements['{{contract.payment_terms}}'] = data.contract.payment_terms || ''
    replacements['{{contract.description}}'] = data.contract.description || ''
  }

  if (data.proposal) {
    replacements['{{proposal.number}}'] = data.proposal.proposal_number || ''
    replacements['{{proposal.validity}}'] = data.proposal.validity_days ? `${data.proposal.validity_days} dias` : ''
    replacements['{{proposal.payment_method}}'] = data.proposal.payment_method || ''
    replacements['{{proposal.delivery_time}}'] = data.proposal.delivery_time || ''
    replacements['{{proposal.total}}'] = formatCurrency(data.proposal.total || 0)
  }

  if (data.budget) {
    replacements['{{budget.number}}'] = data.budget.budget_number || ''
    replacements['{{budget.validity}}'] = data.budget.validity_date
      ? format(new Date(data.budget.validity_date), 'dd/MM/yyyy', { locale: ptBR })
      : ''
    replacements['{{budget.total}}'] = formatCurrency(data.budget.total || 0)
  }

  replacements['{{today}}'] = format(new Date(), 'dd/MM/yyyy', { locale: ptBR })
  replacements['{{now}}'] = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  replacements['{{current_year}}'] = new Date().getFullYear().toString()

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    filledHtml = filledHtml.replace(regex, value)
  }

  if (data.items && data.items.length > 0) {
    filledHtml = fillItemsTable(filledHtml, data.items)
  }

  if (data.materials && data.materials.length > 0) {
    filledHtml = fillMaterialsTable(filledHtml, data.materials)
  }

  if (data.team && data.team.length > 0) {
    filledHtml = fillTeamTable(filledHtml, data.team)
  }

  return filledHtml
}

const fillItemsTable = (html: string, items: any[]): string => {
  const itemsTableRegex = /<!--\s*ITEMS_TABLE_START\s*-->([\s\S]*?)<!--\s*ITEMS_TABLE_END\s*-->/
  const match = html.match(itemsTableRegex)

  if (!match) return html

  let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">'
  tableHtml += '<thead><tr style="background: #2563eb; color: white;">'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Item</th>'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Descrição</th>'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Qtd</th>'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Valor Unit.</th>'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Total</th>'
  tableHtml += '</tr></thead><tbody>'

  items.forEach((item, index) => {
    const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff'
    tableHtml += `<tr style="background: ${bgColor};">`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd;">${index + 1}</td>`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd;">${item.service_name || item.description || ''}</td>`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity || 1}</td>`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.unit_price || 0)}</td>`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(item.total_price || 0)}</td>`
    tableHtml += '</tr>'
  })

  const total = items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  tableHtml += '<tr style="background: #dbeafe; font-weight: bold;">'
  tableHtml += '<td colspan="4" style="padding: 12px; border: 1px solid #ddd; text-align: right;">TOTAL:</td>'
  tableHtml += `<td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #2563eb;">${formatCurrency(total)}</td>`
  tableHtml += '</tr>'
  tableHtml += '</tbody></table>'

  return html.replace(itemsTableRegex, tableHtml)
}

const fillMaterialsTable = (html: string, materials: any[]): string => {
  const materialsTableRegex = /<!--\s*MATERIALS_TABLE_START\s*-->([\s\S]*?)<!--\s*MATERIALS_TABLE_END\s*-->/
  const match = html.match(materialsTableRegex)

  if (!match) return html

  let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">'
  tableHtml += '<thead><tr style="background: #10b981; color: white;">'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Material</th>'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Qtd</th>'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Unidade</th>'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Valor</th>'
  tableHtml += '</tr></thead><tbody>'

  materials.forEach((material, index) => {
    const bgColor = index % 2 === 0 ? '#f0fdf4' : '#ffffff'
    tableHtml += `<tr style="background: ${bgColor};">`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd;">${material.material_name || material.name || ''}</td>`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${material.quantity || 0}</td>`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd;">${material.unit || 'UN'}</td>`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatCurrency(material.unit_price || 0)}</td>`
    tableHtml += '</tr>'
  })

  tableHtml += '</tbody></table>'

  return html.replace(materialsTableRegex, tableHtml)
}

const fillTeamTable = (html: string, team: any[]): string => {
  const teamTableRegex = /<!--\s*TEAM_TABLE_START\s*-->([\s\S]*?)<!--\s*TEAM_TABLE_END\s*-->/
  const match = html.match(teamTableRegex)

  if (!match) return html

  let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">'
  tableHtml += '<thead><tr style="background: #8b5cf6; color: white;">'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Técnico</th>'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Função</th>'
  tableHtml += '<th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Horas</th>'
  tableHtml += '</tr></thead><tbody>'

  team.forEach((member, index) => {
    const bgColor = index % 2 === 0 ? '#faf5ff' : '#ffffff'
    tableHtml += `<tr style="background: ${bgColor};">`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd;">${member.employee_name || member.name || ''}</td>`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd;">${member.role || member.cargo || 'Técnico'}</td>`
    tableHtml += `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${member.hours_worked || 0}h</td>`
    tableHtml += '</tr>'
  })

  tableHtml += '</tbody></table>'

  return html.replace(teamTableRegex, tableHtml)
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    'pending': 'Pendente',
    'scheduled': 'Agendado',
    'in_progress': 'Em Andamento',
    'paused': 'Pausado',
    'completed': 'Concluído',
    'cancelled': 'Cancelado',
    'quotation': 'Orçamento'
  }
  return translations[status] || status
}

const translatePriority = (priority: string): string => {
  const translations: Record<string, string> = {
    'low': 'Baixa',
    'medium': 'Média',
    'high': 'Alta',
    'urgent': 'Urgente'
  }
  return translations[priority] || priority
}
