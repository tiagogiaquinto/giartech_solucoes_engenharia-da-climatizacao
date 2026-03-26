import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { GIARTECH_BRAND } from '../config/brandingConfig'

const B = GIARTECH_BRAND
const MARGIN = B.margins.left
const PAGE_WIDTH = 210
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

interface ServiceOrderData {
  order_number?: string
  number?: string
  status?: string
  created_at?: string
  scheduled_date?: string
  execution_deadline?: string
  description?: string
  instructions?: string
  report?: string
  priority?: string
  contract_type?: string
  payment_method?: string
  payment_installments?: number
  payment_conditions?: string
  pix_key?: string
  total_value?: number
  labor_value?: number
  materials_value?: number
  discount?: number
  net_value?: number
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  customer_cpf_cnpj?: string
  address?: string
  address_complement?: string
  city?: string
  state?: string
  items?: Array<{
    name?: string
    description?: string
    quantity?: number
    unit_price?: number
    total?: number
    unit?: string
  }>
  materials?: Array<{
    name?: string
    quantity?: number
    unit?: string
    unit_cost?: number
    total_cost?: number
  }>
  team?: Array<{
    name?: string
    role?: string
  }>
  checklist_items?: Array<{
    description?: string
    checked?: boolean
  }>
  signature_data?: string
  [key: string]: any
}

const formatCurrency = (v: number | undefined | null) => {
  if (v == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const formatDate = (d: string | undefined | null) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return d }
}

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  aberto: 'Aberto',
  em_andamento: 'Em Andamento',
  in_progress: 'Em Andamento',
  concluido: 'Concluído',
  completed: 'Concluído',
  cancelado: 'Cancelado',
  cancelled: 'Cancelado',
  pausado: 'Pausado',
  cotacao: 'Em Cotação',
  aguardando_pecas: 'Aguardando Peças'
}

const statusColor = (status: string | undefined): [number, number, number] => {
  const s = (status || '').toLowerCase()
  if (s.includes('conclu') || s === 'completed') return [76, 175, 80]
  if (s.includes('cancel')) return [244, 67, 54]
  if (s.includes('amento') || s === 'in_progress') return [33, 150, 243]
  if (s.includes('pausa')) return [255, 152, 0]
  return [158, 158, 158]
}

const drawPageHeader = (doc: jsPDF, orderNum: string, pageNum: number, totalPages: number, y: number) => {
  const [pr, pg, pb] = B.colors.primary

  doc.setFillColor(pr, pg, pb)
  doc.rect(0, 0, PAGE_WIDTH, 38, 'F')

  doc.setFillColor(255, 255, 255, 0.08)
  doc.rect(0, 0, PAGE_WIDTH, 38, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('GIARTECH SOLUÇÕES', MARGIN, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 220, 240)
  doc.text('Excelência em Serviços Técnicos', MARGIN, 22)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text('ORDEM DE SERVIÇO', PAGE_WIDTH - MARGIN, 13, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(200, 220, 240)
  doc.text(`Nº ${orderNum}`, PAGE_WIDTH - MARGIN, 21, { align: 'right' })

  if (pageNum > 1) {
    doc.setFontSize(8)
    doc.text(`Página ${pageNum} / ${totalPages}`, PAGE_WIDTH - MARGIN, 29, { align: 'right' })
  }

  doc.setFillColor(255, 193, 7)
  doc.rect(0, 36, PAGE_WIDTH, 2.5, 'F')

  return 44
}

const drawSectionHeader = (doc: jsPDF, title: string, y: number): number => {
  const [pr, pg, pb] = B.colors.primary
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(title.toUpperCase(), MARGIN + 4, y + 5.5)
  return y + 11
}

const drawInfoBox = (doc: jsPDF, label: string, value: string, x: number, y: number, w: number): number => {
  const [br, bg, bb] = B.colors.secondary
  doc.setFillColor(br, bg, bb)
  doc.roundedRect(x, y, w, 14, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...B.colors.textLight)
  doc.text(label.toUpperCase(), x + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...B.colors.text)
  doc.text(String(value || '—'), x + 3, y + 11, { maxWidth: w - 6 })
  return y + 16
}

const drawStatusBadge = (doc: jsPDF, status: string, x: number, y: number) => {
  const label = statusLabel[status?.toLowerCase()] || statusLabel[status] || status || 'Aberto'
  const color = statusColor(status)
  const tw = doc.getTextWidth(label) + 8
  doc.setFillColor(...color)
  doc.roundedRect(x, y - 5, tw, 7, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  doc.text(label, x + 4, y)
}

const WARRANTY_TEXT = 'Garantia: Os serviços executados possuem garantia de 90 (noventa) dias contra defeitos de mão de obra, conforme o Código de Defesa do Consumidor (CDC — Lei 8.078/90).'

const drawPageFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  const pageH = doc.internal.pageSize.height
  doc.setFillColor(245, 247, 250)
  doc.rect(0, pageH - 20, PAGE_WIDTH, 20, 'F')
  doc.setFillColor(...B.colors.primary)
  doc.rect(0, pageH - 20, PAGE_WIDTH, 0.5, 'F')

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.5)
  doc.setTextColor(...B.colors.textMuted)
  doc.text(WARRANTY_TEXT, MARGIN, pageH - 12, { maxWidth: CONTENT_WIDTH })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...B.colors.textMuted)
  doc.text(`Giartech Soluções — Documento gerado em ${new Date().toLocaleString('pt-BR')}`, MARGIN, pageH - 5)
  doc.text(`Página ${pageNum} de ${totalPages}`, PAGE_WIDTH - MARGIN, pageH - 5, { align: 'right' })
}

export const generateServiceOrderPDFGiartech = async (data: ServiceOrderData): Promise<void> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.height

  const orderNum = data.order_number || data.number || 'S/N'
  let y = drawPageHeader(doc, orderNum, 1, 1, 44)

  const statusVal = data.status || 'aberto'
  const halfW = (CONTENT_WIDTH - 4) / 2
  const thirdW = (CONTENT_WIDTH - 8) / 3

  y = drawSectionHeader(doc, 'Informações da Ordem', y)

  drawInfoBox(doc, 'Número', `OS-${orderNum}`, MARGIN, y, thirdW)
  drawInfoBox(doc, 'Data de Abertura', formatDate(data.created_at), MARGIN + thirdW + 4, y, thirdW)
  drawInfoBox(doc, 'Status', '', MARGIN + (thirdW + 4) * 2, y, thirdW)
  drawStatusBadge(doc, statusVal, MARGIN + (thirdW + 4) * 2 + 3, y + 11)
  y += 18

  drawInfoBox(doc, 'Data Agendada', formatDate(data.scheduled_date), MARGIN, y, thirdW)
  drawInfoBox(doc, 'Prazo de Execução', formatDate(data.execution_deadline), MARGIN + thirdW + 4, y, thirdW)
  drawInfoBox(doc, 'Prioridade', data.priority || 'Normal', MARGIN + (thirdW + 4) * 2, y, thirdW)
  y += 18

  if (data.description) {
    const [br, bg, bb] = B.colors.secondary
    doc.setFillColor(br, bg, bb)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 16, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...B.colors.textLight)
    doc.text('DESCRIÇÃO / PROBLEMA RELATADO', MARGIN + 3, y + 4.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...B.colors.text)
    const lines = doc.splitTextToSize(data.description, CONTENT_WIDTH - 6)
    doc.text(lines.slice(0, 2), MARGIN + 3, y + 11)
    y += 19
  }

  y += 2
  y = drawSectionHeader(doc, 'Dados do Cliente', y)

  drawInfoBox(doc, 'Nome / Razão Social', data.customer_name || '—', MARGIN, y, halfW)
  drawInfoBox(doc, 'CPF / CNPJ', data.customer_cpf_cnpj || '—', MARGIN + halfW + 4, y, halfW)
  y += 18

  drawInfoBox(doc, 'Telefone', data.customer_phone || '—', MARGIN, y, thirdW)
  drawInfoBox(doc, 'E-mail', data.customer_email || '—', MARGIN + thirdW + 4, y, thirdW * 2 + 4)
  y += 18

  const addressFull = [data.address, data.address_complement, data.city, data.state].filter(Boolean).join(', ')
  if (addressFull) {
    drawInfoBox(doc, 'Endereço Cadastrado', addressFull, MARGIN, y, CONTENT_WIDTH)
    y += 18
  }

  const hasInstallAddrs = Array.isArray(data.installation_addresses) && data.installation_addresses.length > 0
  const hasInstallContacts = Array.isArray(data.installation_contacts) && data.installation_contacts.length > 0

  if (hasInstallAddrs || hasInstallContacts) {
    y += 2
    if (y > pageH - 60) {
      doc.addPage()
      y = drawPageHeader(doc, orderNum, doc.getNumberOfPages(), 1, 44)
    }
    y = drawSectionHeader(doc, 'Local de Instalação / Execução', y)

    if (hasInstallAddrs) {
      for (const addr of data.installation_addresses!) {
        const labelStr = addr.label ? `[${addr.label}] ` : ''
        const parts = [addr.logradouro, addr.numero, addr.complemento].filter(Boolean).join(', ')
        const cityState = [addr.cidade, addr.estado].filter(Boolean).join(' / ')
        const cepStr = addr.cep ? `CEP ${addr.cep}` : ''
        const refStr = addr.referencia ? `Ref: ${addr.referencia}` : ''
        const isPrimary = addr.is_primary ? ' (Principal)' : ''
        const line1 = `${labelStr}${parts}${addr.bairro ? ' — ' + addr.bairro : ''}${isPrimary}`
        const line2 = [cityState, cepStr].filter(Boolean).join(' — ')
        const full = [line1, line2, refStr].filter(Boolean).join('\n')
        drawInfoBox(doc, 'Endereço de Instalação', full, MARGIN, y, CONTENT_WIDTH)
        y += addr.referencia ? 26 : 20
        if (y > pageH - 50) {
          doc.addPage()
          y = drawPageHeader(doc, orderNum, doc.getNumberOfPages(), 1, 44)
        }
      }
    }

    if (hasInstallContacts) {
      const [br, bg, bb] = B.colors.secondary
      doc.setFillColor(br, bg, bb)
      const tableBody = data.installation_contacts!.map(c => [
        (c.is_primary ? '★ ' : '') + (c.nome || '—'),
        c.cargo || '—',
        c.telefone || '—',
        c.email || '—',
      ])
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Nome', 'Cargo', 'Telefone', 'E-mail']],
        body: tableBody,
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: { fontSize: 8, textColor: B.colors.text },
        alternateRowStyles: { fillColor: B.colors.backgroundLight },
        theme: 'grid'
      })
      y = (doc as any).lastAutoTable.finalY + 4
    }
  }

  const hasItems = data.items && data.items.length > 0
  const hasMaterials = data.materials && data.materials.length > 0
  const hasTeam = data.team && data.team.length > 0
  const hasChecklist = data.checklist_items && data.checklist_items.length > 0

  if (hasItems) {
    y += 2
    if (y > pageH - 60) {
      doc.addPage()
      y = drawPageHeader(doc, orderNum, doc.getNumberOfPages(), 1, 44)
    }
    y = drawSectionHeader(doc, 'Serviços / Itens da Ordem', y)

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Item', 'Descrição', 'Qtd', 'Vl. Unit.', 'Subtotal']],
      body: (data.items || []).map((item, idx) => [
        String(idx + 1).padStart(2, '0'),
        item.name || item.description || '—',
        String(item.quantity || 1),
        formatCurrency(item.unit_price),
        formatCurrency(item.total ?? (item.quantity || 1) * (item.unit_price || 0))
      ]),
      headStyles: {
        fillColor: B.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: { fontSize: 8.5, textColor: B.colors.text },
      alternateRowStyles: { fillColor: B.colors.backgroundLight },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      },
      theme: 'grid',
      didParseCell: (hookData) => {
        if (hookData.section === 'head') {
          hookData.cell.styles.halign = hookData.column.index === 1 ? 'left' : 'center'
          if (hookData.column.index >= 3) hookData.cell.styles.halign = 'right'
        }
      }
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  if (hasMaterials) {
    if (y > pageH - 60) {
      doc.addPage()
      y = drawPageHeader(doc, orderNum, doc.getNumberOfPages(), 1, 44)
    }
    y += 2
    y = drawSectionHeader(doc, 'Materiais Utilizados', y)

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Material', 'Qtd', 'Unidade', 'Custo Unit.', 'Custo Total']],
      body: (data.materials || []).map(m => [
        m.name || '—',
        String(m.quantity || 0),
        m.unit || 'un',
        formatCurrency(m.unit_cost),
        formatCurrency(m.total_cost)
      ]),
      headStyles: {
        fillColor: [38, 120, 160],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: { fontSize: 8, textColor: B.colors.text },
      alternateRowStyles: { fillColor: B.colors.backgroundLight },
      columnStyles: {
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' }
      },
      theme: 'grid'
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  if (hasTeam) {
    if (y > pageH - 40) {
      doc.addPage()
      y = drawPageHeader(doc, orderNum, doc.getNumberOfPages(), 1, 44)
    }
    y += 2
    y = drawSectionHeader(doc, 'Equipe Responsável', y)

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Técnico / Responsável', 'Função']],
      body: (data.team || []).map(t => [t.name || '—', t.role || '—']),
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: { fontSize: 8, textColor: B.colors.text },
      alternateRowStyles: { fillColor: B.colors.backgroundLight },
      theme: 'grid'
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  if (hasChecklist) {
    if (y > pageH - 50) {
      doc.addPage()
      y = drawPageHeader(doc, orderNum, doc.getNumberOfPages(), 1, 44)
    }
    y += 2
    y = drawSectionHeader(doc, 'Checklist de Execução', y)

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['', 'Item de Verificação']],
      body: (data.checklist_items || []).map(c => [
        c.checked ? '✓' : '○',
        c.description || '—'
      ]),
      headStyles: {
        fillColor: [60, 130, 90],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: { fontSize: 8, textColor: B.colors.text },
      alternateRowStyles: { fillColor: B.colors.backgroundLight },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' }
      },
      theme: 'grid'
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  if (data.instructions || data.report) {
    if (y > pageH - 50) {
      doc.addPage()
      y = drawPageHeader(doc, orderNum, doc.getNumberOfPages(), 1, 44)
    }
    y += 2
    y = drawSectionHeader(doc, 'Instruções e Relatório Técnico', y)

    if (data.instructions) {
      const [br, bg, bb] = B.colors.secondary
      doc.setFillColor(br, bg, bb)
      const instrLines = doc.splitTextToSize(data.instructions, CONTENT_WIDTH - 6)
      const instrH = instrLines.length * 4.5 + 8
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, instrH, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...B.colors.textLight)
      doc.text('INSTRUÇÕES', MARGIN + 3, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...B.colors.text)
      doc.text(instrLines, MARGIN + 3, y + 10)
      y += instrH + 3
    }

    if (data.report) {
      const [br, bg, bb] = B.colors.secondary
      doc.setFillColor(br, bg, bb)
      const reportLines = doc.splitTextToSize(data.report, CONTENT_WIDTH - 6)
      const reportH = reportLines.length * 4.5 + 8
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, reportH, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...B.colors.textLight)
      doc.text('RELATÓRIO DE EXECUÇÃO', MARGIN + 3, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...B.colors.text)
      doc.text(reportLines, MARGIN + 3, y + 10)
      y += reportH + 3
    }
  }

  const itemsSubtotal = (data.items || []).reduce((acc: number, item: any) => {
    const sub = item.total ?? item.subtotal ?? ((item.quantity || 1) * (item.unit_price || 0))
    return acc + Number(sub)
  }, 0)

  const discount = data.discount ?? 0
  const rawTotal = data.total_value && data.total_value > 0 ? data.total_value : itemsSubtotal
  const grandTotal = data.net_value && data.net_value > 0 ? data.net_value : (rawTotal - discount)
  const hasTotals = grandTotal > 0 || (data.labor_value != null && data.labor_value > 0) || (data.materials_value != null && data.materials_value > 0)

  if (hasTotals) {
    if (y > pageH - 70) {
      doc.addPage()
      y = drawPageHeader(doc, orderNum, doc.getNumberOfPages(), 1, 44)
    }
    y += 2
    y = drawSectionHeader(doc, 'Resumo Financeiro', y)

    const boxW = CONTENT_WIDTH * 0.44
    const boxX = MARGIN + CONTENT_WIDTH - boxW

    const rows: [string, string][] = []
    if (data.labor_value != null && data.labor_value > 0) rows.push(['Mão de Obra', formatCurrency(data.labor_value)])
    if (data.materials_value != null && data.materials_value > 0) rows.push(['Materiais', formatCurrency(data.materials_value)])
    if ((!data.labor_value || data.labor_value === 0) && (!data.materials_value || data.materials_value === 0) && itemsSubtotal > 0) {
      rows.push(['Subtotal dos Itens', formatCurrency(itemsSubtotal)])
    }
    if (discount > 0) rows.push(['Desconto', `- ${formatCurrency(discount)}`])

    let fy = y
    const rowH = 7.5
    const boxH = rows.length * rowH + 14

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(boxX, fy, boxW, boxH, 2, 2, 'F')
    doc.setDrawColor(...B.colors.secondary)
    doc.roundedRect(boxX, fy, boxW, boxH, 2, 2, 'S')

    rows.forEach(([label, val]) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...B.colors.textLight)
      doc.text(label, boxX + 6, fy + 7)
      doc.setTextColor(...B.colors.text)
      doc.text(val, boxX + boxW - 6, fy + 7, { align: 'right' })
      fy += rowH
    })

    const [pr, pg, pb] = B.colors.primary
    doc.setFillColor(pr, pg, pb)
    doc.roundedRect(boxX, fy, boxW, 12, 0, 0, 'F')
    doc.roundedRect(boxX, fy, boxW, 12, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL', boxX + 6, fy + 8)
    doc.text(formatCurrency(grandTotal), boxX + boxW - 6, fy + 8, { align: 'right' })

    y += boxH + 5
  }

  const hasPayment = data.payment_method || data.payment_conditions
  if (hasPayment) {
    if (y > pageH - 50) {
      doc.addPage()
      y = drawPageHeader(doc, orderNum, doc.getNumberOfPages(), 1, 44)
    }
    y += 2
    y = drawSectionHeader(doc, 'Condições de Pagamento', y)

    const pmLabels: { label: string; value: string }[] = []

    const pmLabel = data.payment_method === 'pix' ? 'PIX'
      : data.payment_method === 'boleto' ? 'Boleto Bancário'
      : data.payment_method === 'credito' ? 'Cartão de Crédito'
      : data.payment_method === 'debito' ? 'Cartão de Débito'
      : data.payment_method === 'dinheiro' ? 'Dinheiro'
      : data.payment_method || ''

    if (pmLabel) pmLabels.push({ label: 'Forma de Pagamento', value: pmLabel })

    const inst = Number(data.payment_installments || 1)
    if (inst > 1) {
      pmLabels.push({ label: 'Condição', value: `${inst}x parcelas` })
    } else if (data.payment_conditions) {
      pmLabels.push({ label: 'Condição', value: data.payment_conditions })
    }

    if (data.pix_key && data.payment_method === 'pix') {
      pmLabels.push({ label: 'Chave PIX', value: data.pix_key })
    }

    const pmColW = (CONTENT_WIDTH - 4) / Math.max(pmLabels.length, 1)
    let pmX = MARGIN
    pmLabels.forEach(({ label, value }) => {
      doc.setFillColor(235, 248, 240)
      doc.roundedRect(pmX, y, pmColW - 2, 18, 1, 1, 'F')
      doc.setDrawColor(34, 197, 94)
      doc.setLineWidth(0.3)
      doc.roundedRect(pmX, y, pmColW - 2, 18, 1, 1, 'S')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...B.colors.textLight)
      doc.text(label.toUpperCase(), pmX + 4, y + 5)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(...B.colors.text)
      doc.text(value, pmX + 4, y + 13, { maxWidth: pmColW - 8 })
      pmX += pmColW
    })
    y += 22
  }

  if (y > pageH - 65) {
    doc.addPage()
    y = drawPageHeader(doc, orderNum, doc.getNumberOfPages(), 1, 44)
  }
  y += 4
  y = drawSectionHeader(doc, 'Assinatura e Confirmação', y)
  y += 4

  const sigColW = (CONTENT_WIDTH - 8) / 2

  doc.setDrawColor(...B.colors.textMuted)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y + 28, MARGIN + sigColW, y + 28)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...B.colors.textLight)
  doc.text('Assinatura do Técnico / Responsável', MARGIN + sigColW / 2, y + 32, { align: 'center' })
  doc.text(data.team?.[0]?.name || '___________________________', MARGIN + sigColW / 2, y + 38, { align: 'center' })

  doc.line(MARGIN + sigColW + 8, y + 28, MARGIN + sigColW * 2 + 8, y + 28)
  doc.text('Assinatura do Cliente', MARGIN + sigColW + 8 + sigColW / 2, y + 32, { align: 'center' })
  doc.text(data.customer_name || '___________________________', MARGIN + sigColW + 8 + sigColW / 2, y + 38, { align: 'center' })

  doc.text(`Data: _____ / _____ / _______`, MARGIN, y + 46)
  doc.text(`Horário: _____ : _____`, MARGIN + sigColW + 8, y + 46)

  if (data.signature_data) {
    try {
      doc.addImage(data.signature_data, 'PNG', MARGIN + sigColW + 8, y, sigColW, 25)
    } catch { /* ignore */ }
  }

  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    drawPageHeader(doc, orderNum, i, total, 44)
    drawPageFooter(doc, i, total)
  }

  const filename = `OS-${orderNum}-${(data.customer_name || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  doc.save(filename)
}

export const generateServiceOrderPDF = generateServiceOrderPDFGiartech
