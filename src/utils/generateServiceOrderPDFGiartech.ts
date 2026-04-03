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
  warranty_period?: number
  warranty_type?: string
  warranty_terms?: string
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
  installation_addresses?: any[]
  installation_contacts?: any[]
  [key: string]: any
}

const fmt = (v: number | undefined | null) => {
  if (v == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const fmtDate = (d: string | undefined | null) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return d }
}

const fmtDateTime = () => {
  return new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  aberto: 'Aberto',
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  in_progress: 'Em Andamento',
  concluido: 'Concluído',
  concluida: 'Concluída',
  completed: 'Concluído',
  cancelado: 'Cancelado',
  cancelled: 'Cancelado',
  pausado: 'Pausado',
  cotacao: 'Em Cotação',
  aguardando_pecas: 'Aguardando Peças',
}

const statusColor = (status: string | undefined): [number, number, number] => {
  const s = (status || '').toLowerCase()
  if (s.includes('conclu') || s === 'completed') return [76, 175, 80]
  if (s.includes('cancel')) return [244, 67, 54]
  if (s.includes('amento') || s === 'in_progress') return [33, 150, 243]
  if (s.includes('pausa')) return [255, 152, 0]
  return [100, 116, 139]
}

const drawPageHeader = (doc: jsPDF, orderNum: string, pageNum: number, totalPages: number) => {
  const [pr, pg, pb] = B.colors.primary

  doc.setFillColor(pr, pg, pb)
  doc.rect(0, 0, PAGE_WIDTH, 38, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('GIARTECH SOLUÇÕES', MARGIN, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
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

const drawSection = (doc: jsPDF, title: string, y: number): number => {
  const [pr, pg, pb] = B.colors.primary
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(title.toUpperCase(), MARGIN + 4, y + 5.5)
  return y + 11
}

const drawInfoBox = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h = 14,
  bgColor?: [number, number, number],
  borderColor?: [number, number, number]
): number => {
  const [br, bg, bb] = bgColor || (B.colors.secondary as [number, number, number])
  doc.setFillColor(br, bg, bb)
  doc.roundedRect(x, y, w, h, 1, 1, 'F')
  if (borderColor) {
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, w, h, 1, 1, 'S')
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...(B.colors.textLight as [number, number, number]))
  doc.text(label.toUpperCase(), x + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...(B.colors.text as [number, number, number]))
  doc.text(String(value || '—'), x + 3, y + 11, { maxWidth: w - 6 })
  return y + h + 2
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

const WARRANTY_90_DAYS = `GARANTIA TÉCNICA DE 90 DIAS: Os serviços executados possuem garantia de 90 (noventa) dias contra defeitos de mão de obra, conforme o Código de Defesa do Consumidor (CDC — Lei 8.078/90). A garantia cobre exclusivamente os serviços realizados pela Giartech Soluções, não se estendendo a peças/equipamentos de terceiros, danos causados por mau uso, quedas de energia, falta de manutenção preventiva ou intervenções realizadas por terceiros após a conclusão dos serviços. Equipamentos novos possuem garantia de fábrica (5 a 10 anos), válida somente com manutenção semestral comprovada por laudo técnico.`

const drawPageFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  const pageH = doc.internal.pageSize.height
  doc.setFillColor(245, 247, 250)
  doc.rect(0, pageH - 18, PAGE_WIDTH, 18, 'F')
  doc.setFillColor(...(B.colors.primary as [number, number, number]))
  doc.rect(0, pageH - 18, PAGE_WIDTH, 0.5, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...(B.colors.textMuted as [number, number, number]))
  doc.text(`Giartech Soluções — Documento gerado em ${fmtDateTime()}`, MARGIN, pageH - 5)
  doc.text(`Página ${pageNum} de ${totalPages}`, PAGE_WIDTH - MARGIN, pageH - 5, { align: 'right' })
}

const checkPageBreak = (doc: jsPDF, y: number, orderNum: string, needed = 50): number => {
  if (y > doc.internal.pageSize.height - needed) {
    doc.addPage()
    return drawPageHeader(doc, orderNum, doc.getNumberOfPages(), 1)
  }
  return y
}

export const generateServiceOrderPDFGiartech = async (data: ServiceOrderData): Promise<void> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const orderNum = data.order_number || data.number || 'S/N'
  let y = drawPageHeader(doc, orderNum, 1, 1, 44)

  const thirdW = (CONTENT_WIDTH - 8) / 3
  const halfW = (CONTENT_WIDTH - 4) / 2

  y = drawSection(doc, 'Informações da Ordem', y)

  drawInfoBox(doc, 'Número', `OS-${orderNum}`, MARGIN, y, thirdW)
  drawInfoBox(doc, 'Data de Abertura', fmtDate(data.created_at), MARGIN + thirdW + 4, y, thirdW)
  drawInfoBox(doc, 'Status', '', MARGIN + (thirdW + 4) * 2, y, thirdW)
  drawStatusBadge(doc, data.status || 'aberto', MARGIN + (thirdW + 4) * 2 + 3, y + 11)
  y += 18

  drawInfoBox(doc, 'Data Agendada', fmtDate(data.scheduled_date), MARGIN, y, thirdW)
  drawInfoBox(doc, 'Prazo de Execução', fmtDate(data.execution_deadline), MARGIN + thirdW + 4, y, thirdW)
  drawInfoBox(doc, 'Prioridade', data.priority || 'Normal', MARGIN + (thirdW + 4) * 2, y, thirdW)
  y += 18

  if (data.description) {
    const descLines = doc.splitTextToSize(data.description, CONTENT_WIDTH - 8)
    const descH = Math.max(14, descLines.length * 4.5 + 8)
    const [br, bg, bb] = B.colors.secondary as [number, number, number]
    doc.setFillColor(br, bg, bb)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, descH, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...(B.colors.textLight as [number, number, number]))
    doc.text('DESCRIÇÃO / PROBLEMA RELATADO', MARGIN + 3, y + 4.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...(B.colors.text as [number, number, number]))
    doc.text(descLines, MARGIN + 3, y + 11)
    y += descH + 3
  }

  y += 2
  y = drawSection(doc, 'Dados do Cliente', y)
  drawInfoBox(doc, 'Nome / Razão Social', data.customer_name || '—', MARGIN, y, halfW)
  drawInfoBox(doc, 'CPF / CNPJ', data.customer_cpf_cnpj || '—', MARGIN + halfW + 4, y, halfW)
  y += 18
  drawInfoBox(doc, 'Telefone', data.customer_phone || '—', MARGIN, y, thirdW)
  drawInfoBox(doc, 'E-mail', data.customer_email || '—', MARGIN + thirdW + 4, y, thirdW * 2 + 4)
  y += 18

  const addrFull = [data.address, data.address_complement, data.city, data.state].filter(Boolean).join(', ')
  if (addrFull) {
    drawInfoBox(doc, 'Endereço Cadastrado', addrFull, MARGIN, y, CONTENT_WIDTH)
    y += 18
  }

  const hasInstallAddrs = Array.isArray(data.installation_addresses) && data.installation_addresses.length > 0
  const hasInstallContacts = Array.isArray(data.installation_contacts) && data.installation_contacts.length > 0

  if (hasInstallAddrs || hasInstallContacts) {
    y = checkPageBreak(doc, y, orderNum, 60)
    y += 2
    y = drawSection(doc, 'Local de Instalação / Execução', y)
    if (hasInstallAddrs) {
      for (const addr of data.installation_addresses!) {
        const labelStr = addr.label ? `[${addr.label}] ` : ''
        const parts = [addr.logradouro, addr.numero, addr.complemento].filter(Boolean).join(', ')
        const cityState = [addr.cidade, addr.estado].filter(Boolean).join(' / ')
        const cepStr = addr.cep ? `CEP ${addr.cep}` : ''
        const isPrimary = addr.is_primary ? ' (Principal)' : ''
        const full = [
          `${labelStr}${parts}${addr.bairro ? ' — ' + addr.bairro : ''}${isPrimary}`,
          [cityState, cepStr].filter(Boolean).join(' — '),
          addr.referencia ? `Ref: ${addr.referencia}` : '',
        ].filter(Boolean).join('\n')
        drawInfoBox(doc, 'Endereço de Instalação', full, MARGIN, y, CONTENT_WIDTH, addr.referencia ? 26 : 20)
        y += addr.referencia ? 28 : 22
        y = checkPageBreak(doc, y, orderNum, 40)
      }
    }
    if (hasInstallContacts) {
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Nome', 'Cargo', 'Telefone', 'E-mail']],
        body: data.installation_contacts!.map(c => [
          (c.is_primary ? '★ ' : '') + (c.nome || '—'),
          c.cargo || '—', c.telefone || '—', c.email || '—',
        ]),
        headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: B.colors.text as [number, number, number] },
        alternateRowStyles: { fillColor: B.colors.backgroundLight as [number, number, number] },
        theme: 'grid',
      })
      y = (doc as any).lastAutoTable.finalY + 4
    }
  }

  const hasItems = Array.isArray(data.items) && data.items.length > 0
  const hasMaterials = Array.isArray(data.materials) && data.materials.length > 0
  const hasTeam = Array.isArray(data.team) && data.team.length > 0
  const hasChecklist = Array.isArray(data.checklist_items) && data.checklist_items.length > 0

  if (hasItems) {
    y = checkPageBreak(doc, y, orderNum, 60)
    y += 2
    y = drawSection(doc, 'Bloco de Itens — Serviços / Materiais da Ordem', y)

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Item', 'Descrição / Serviço', 'Qtd', 'Vl. Unit.', 'Subtotal']],
      body: (data.items || []).map((item, idx) => {
        const qty = item.quantity || 1
        const price = item.unit_price || 0
        const total = item.total ?? (qty * price)
        return [
          String(idx + 1).padStart(2, '0'),
          [item.name || item.description || '—', item.description && item.name !== item.description ? item.description : ''].filter(Boolean).join('\n'),
          String(qty),
          fmt(price),
          fmt(total),
        ]
      }),
      headStyles: {
        fillColor: B.colors.primary as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 9, textColor: B.colors.text as [number, number, number], minCellHeight: 10 },
      alternateRowStyles: { fillColor: B.colors.backgroundLight as [number, number, number] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      },
      theme: 'grid',
      didParseCell: (h) => {
        if (h.section === 'head') {
          h.cell.styles.halign = h.column.index >= 3 ? 'right' : h.column.index === 1 ? 'left' : 'center'
        }
      },
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  if (hasMaterials) {
    y = checkPageBreak(doc, y, orderNum, 60)
    y += 2
    y = drawSection(doc, 'Materiais Utilizados', y)
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Material', 'Qtd', 'Unidade', 'Vl. Unit.', 'Total']],
      body: (data.materials || []).map(m => [
        m.name || '—', String(m.quantity || 0), m.unit || 'un',
        fmt(m.unit_cost), fmt(m.total_cost),
      ]),
      headStyles: { fillColor: [38, 120, 160], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8.5, textColor: B.colors.text as [number, number, number] },
      alternateRowStyles: { fillColor: B.colors.backgroundLight as [number, number, number] },
      columnStyles: {
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
      theme: 'grid',
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  if (hasTeam) {
    y = checkPageBreak(doc, y, orderNum, 40)
    y += 2
    y = drawSection(doc, 'Equipe Responsável', y)
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Técnico / Responsável', 'Função']],
      body: (data.team || []).map(t => [t.name || '—', t.role || '—']),
      headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8.5, textColor: B.colors.text as [number, number, number] },
      alternateRowStyles: { fillColor: B.colors.backgroundLight as [number, number, number] },
      theme: 'grid',
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  if (hasChecklist) {
    y = checkPageBreak(doc, y, orderNum, 50)
    y += 2
    y = drawSection(doc, 'Checklist de Execução', y)
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['', 'Item de Verificação']],
      body: (data.checklist_items || []).map(c => [c.checked ? '✓' : '○', c.description || '—']),
      headStyles: { fillColor: [60, 130, 90], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8.5, textColor: B.colors.text as [number, number, number] },
      alternateRowStyles: { fillColor: B.colors.backgroundLight as [number, number, number] },
      columnStyles: { 0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' } },
      theme: 'grid',
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  if (data.instructions || data.report) {
    y = checkPageBreak(doc, y, orderNum, 50)
    y += 2
    y = drawSection(doc, 'Instruções e Relatório Técnico', y)
    for (const [label, text] of [['INSTRUÇÕES', data.instructions], ['RELATÓRIO DE EXECUÇÃO', data.report]] as [string, string | undefined][]) {
      if (!text) continue
      const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 8)
      const h = lines.length * 4.5 + 10
      const [br, bg, bb] = B.colors.secondary as [number, number, number]
      doc.setFillColor(br, bg, bb)
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, h, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...(B.colors.textLight as [number, number, number]))
      doc.text(label, MARGIN + 3, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...(B.colors.text as [number, number, number]))
      doc.text(lines, MARGIN + 3, y + 11)
      y += h + 4
    }
  }

  const itemsSubtotal = (data.items || []).reduce((acc, item) => {
    return acc + Number(item.total ?? ((item.quantity || 1) * (item.unit_price || 0)))
  }, 0)
  const discount = Number(data.discount ?? 0)
  const rawTotal = data.total_value && data.total_value > 0 ? data.total_value : itemsSubtotal
  const grandTotal = data.net_value && data.net_value > 0 ? data.net_value : Math.max(rawTotal - discount, 0)

  y = checkPageBreak(doc, y, orderNum, 80)
  y += 4
  y = drawSection(doc, 'Bloco Financeiro — Resumo de Valores', y)
  y += 3

  const boxW = CONTENT_WIDTH * 0.50
  const boxX = MARGIN + CONTENT_WIDTH - boxW

  const rows: [string, string][] = []
  if (data.labor_value && data.labor_value > 0) rows.push(['Mão de Obra', fmt(data.labor_value)])
  if (data.materials_value && data.materials_value > 0) rows.push(['Materiais', fmt(data.materials_value)])
  if (!data.labor_value && !data.materials_value && itemsSubtotal > 0) {
    rows.push(['Subtotal dos Itens', fmt(itemsSubtotal)])
  }
  if (discount > 0) rows.push(['Desconto', `- ${fmt(discount)}`])

  const rowH = 8
  const boxH = rows.length * rowH + 16

  let fy = y
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(boxX, fy, boxW, boxH, 2, 2, 'F')
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.3)
  doc.roundedRect(boxX, fy, boxW, boxH, 2, 2, 'S')

  rows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(label, boxX + 7, fy + 8)
    doc.setTextColor(30, 41, 59)
    doc.text(val, boxX + boxW - 7, fy + 8, { align: 'right' })
    fy += rowH
  })

  const [pr, pg, pb] = B.colors.primary as [number, number, number]
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(boxX, fy, boxW, 14, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text('VALOR TOTAL', boxX + 7, fy + 9.5)
  doc.text(fmt(grandTotal), boxX + boxW - 7, fy + 9.5, { align: 'right' })

  y += boxH + 5

  const paymentMethod = data.payment_method
  const installments = Number(data.payment_installments || 1)
  const paymentConditions = data.payment_conditions || ''
  const hasPayment = paymentMethod || paymentConditions || installments > 1

  if (hasPayment) {
    const pmLabel =
      paymentMethod === 'pix' ? 'PIX' :
      paymentMethod === 'boleto' ? 'Boleto Bancário' :
      paymentMethod === 'credito' || paymentMethod === 'cartao_credito' ? 'Cartão de Crédito' :
      paymentMethod === 'debito' || paymentMethod === 'cartao_debito' ? 'Cartão de Débito' :
      paymentMethod === 'dinheiro' ? 'Dinheiro' :
      paymentMethod === 'transferencia' ? 'Transferência Bancária' :
      paymentMethod || 'A Combinar'

    const condLabel =
      installments > 1 ? `${installments}x parcelas` :
      paymentConditions || 'À vista'

    const pmFields: { label: string; value: string }[] = [
      { label: 'Forma de Pagamento', value: pmLabel },
      { label: 'Condições', value: condLabel },
    ]
    if (data.pix_key && paymentMethod === 'pix') {
      pmFields.push({ label: 'Chave PIX', value: data.pix_key })
    }

    y = checkPageBreak(doc, y, orderNum, 40)
    const pmColW = (CONTENT_WIDTH) / pmFields.length
    let pmX = MARGIN
    pmFields.forEach(({ label, value }) => {
      doc.setFillColor(235, 248, 240)
      doc.roundedRect(pmX, y, pmColW - 3, 18, 1, 1, 'F')
      doc.setDrawColor(34, 197, 94)
      doc.setLineWidth(0.4)
      doc.roundedRect(pmX, y, pmColW - 3, 18, 1, 1, 'S')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(21, 128, 61)
      doc.text(label.toUpperCase(), pmX + 4, y + 5.5)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      doc.text(value, pmX + 4, y + 14, { maxWidth: pmColW - 8 })
      pmX += pmColW
    })
    y += 22
  }

  y = checkPageBreak(doc, y, orderNum, 70)
  y += 4
  y = drawSection(doc, 'Bloco de Garantia Técnica', y)
  y += 3

  const gtLines = doc.splitTextToSize(WARRANTY_90_DAYS, CONTENT_WIDTH - 10)
  const gtH = gtLines.length * 4.8 + 12
  doc.setFillColor(254, 243, 199)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, gtH, 2, 2, 'F')
  doc.setDrawColor(217, 119, 6)
  doc.setLineWidth(0.4)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, gtH, 2, 2, 'S')

  doc.setFillColor(217, 119, 6)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 2, 2, 'F')
  doc.rect(MARGIN, y + 4, CONTENT_WIDTH, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text('GARANTIA DE 90 DIAS — CONFORME CDC LEI 8.078/90', MARGIN + 5, y + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 53, 15)
  doc.text(gtLines, MARGIN + 5, y + 16)
  y += gtH + 6

  y = checkPageBreak(doc, y, orderNum, 75)
  y += 4
  y = drawSection(doc, 'Assinatura e Confirmação', y)
  y += 6

  const sigDateTime = fmtDateTime()
  const sigColW = (CONTENT_WIDTH - 8) / 2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Data e Hora de Emissão:', MARGIN, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text(sigDateTime, MARGIN + 42, y)
  y += 10

  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y + 28, MARGIN + sigColW, y + 28)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  doc.text('Assinatura do Técnico / Responsável', MARGIN + sigColW / 2, y + 32, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text(data.team?.[0]?.name || data.assigned_to || '________________________________', MARGIN + sigColW / 2, y + 38, { align: 'center' })

  doc.line(MARGIN + sigColW + 8, y + 28, MARGIN + sigColW * 2 + 8, y + 28)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  doc.text('Assinatura do Cliente / Responsável', MARGIN + sigColW + 8 + sigColW / 2, y + 32, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text(data.customer_name || '________________________________', MARGIN + sigColW + 8 + sigColW / 2, y + 38, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  doc.text(`Data: _____ / _____ / _______`, MARGIN, y + 46)
  doc.text(`Horário: _____ : _____`, MARGIN + sigColW + 8, y + 46)

  if (data.signature_data) {
    try {
      doc.addImage(data.signature_data, 'PNG', MARGIN + sigColW + 8, y, sigColW, 25)
    } catch { /* ignore invalid signature image */ }
  }

  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    drawPageHeader(doc, orderNum, i, total)
    drawPageFooter(doc, i, total)
  }

  const safeName = (data.customer_name || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`OS-${orderNum}-${safeName}.pdf`)
}

export const generateServiceOrderPDF = generateServiceOrderPDFGiartech
