import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { OSDocumentData } from './types'
import {
  PAGE_W, MARGIN, CONTENT_W,
  fmt, fmtDate, fmtNow,
  primaryRgb, hexToRgb,
  drawLetterhead, drawSectionBar, drawInfoGrid, checkBreak,
} from './pdfHelpers'

const WARRANTY_TEXT = (days: number) =>
  `GARANTIA TÉCNICA DE ${days} DIAS: Os serviços executados possuem garantia de ${days} (${days === 90 ? 'noventa' : String(days)}) dias contra defeitos de mão de obra, conforme o Código de Defesa do Consumidor (CDC — Lei 8.078/90). A garantia cobre exclusivamente os serviços realizados, não se estendendo a peças/equipamentos de terceiros, danos por mau uso, quedas de energia, falta de manutenção preventiva ou intervenções de terceiros após a conclusão.`

export async function generateOSPDF(data: OSDocumentData): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const company = data.company
  const [pr, pg, pb] = primaryRgb(company)
  const docNum = data.order_number || 'S/N'

  let y = drawLetterhead(doc, company, 'Ordem de Serviço', docNum, 1)
  y += 2

  y = drawSectionBar(doc, company, 'Informações da Ordem de Serviço', y)
  y = drawInfoGrid(doc, company, [
    { label: 'Nº da OS', value: docNum },
    { label: 'Status', value: data.status || 'Aberto' },
    { label: 'Prioridade', value: data.priority || 'Normal' },
    { label: 'Data de Abertura', value: fmtDate(data.created_at) },
    { label: 'Data Agendada', value: fmtDate(data.scheduled_date) },
    { label: 'Prazo de Execução', value: fmtDate(data.execution_deadline) },
  ], y, 3)

  y = drawSectionBar(doc, company, 'Dados do Cliente', y)
  y = drawInfoGrid(doc, company, [
    { label: 'Nome / Razão Social', value: data.customer.name, span: 2 },
    { label: 'CPF / CNPJ', value: data.customer.cpf_cnpj || '—' },
    { label: 'Telefone', value: data.customer.phone || '—' },
    { label: 'E-mail', value: data.customer.email || '—', span: 2 },
    { label: 'Endereço', value: [data.customer.address, data.customer.address_complement].filter(Boolean).join(', ') || '—', span: 2 },
    { label: 'Cidade / UF', value: [data.customer.city, data.customer.state].filter(Boolean).join(' - ') || '—' },
  ], y, 3)

  if (data.description || data.instructions) {
    y = checkBreak(doc, y, 30, company, 'Ordem de Serviço', docNum)
    y = drawSectionBar(doc, company, 'Descrição e Instruções', y)
    const [sr, sg, sb] = hexToRgb(company.secondary_color || '#E6F0FA')
    if (data.description) {
      doc.setFillColor(sr, sg, sb)
      doc.roundedRect(MARGIN, y, CONTENT_W, 10, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(100, 120, 140)
      doc.text('DESCRIÇÃO DO PROBLEMA', MARGIN + 3, y + 4)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(40, 40, 40)
      const lines = doc.splitTextToSize(data.description, CONTENT_W - 6)
      const boxH = Math.max(10, lines.length * 4.5 + 7)
      doc.setFillColor(sr, sg, sb)
      doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(100, 120, 140)
      doc.text('DESCRIÇÃO DO PROBLEMA', MARGIN + 3, y + 4)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(40, 40, 40)
      doc.text(lines, MARGIN + 3, y + 8.5)
      y += boxH + 2
    }
    if (data.instructions) {
      const lines2 = doc.splitTextToSize(data.instructions, CONTENT_W - 6)
      const boxH2 = Math.max(10, lines2.length * 4.5 + 7)
      doc.setFillColor(255, 248, 230)
      doc.roundedRect(MARGIN, y, CONTENT_W, boxH2, 1, 1, 'F')
      doc.setDrawColor(255, 193, 7)
      doc.setLineWidth(0.3)
      doc.roundedRect(MARGIN, y, CONTENT_W, boxH2, 1, 1, 'S')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(160, 100, 0)
      doc.text('INSTRUÇÕES TÉCNICAS', MARGIN + 3, y + 4)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(40, 40, 40)
      doc.text(lines2, MARGIN + 3, y + 8.5)
      y += boxH2 + 2
    }
  }

  if (data.items && data.items.length > 0) {
    y = checkBreak(doc, y, 40, company, 'Ordem de Serviço', docNum)
    y = drawSectionBar(doc, company, 'Itens e Serviços', y)

    autoTable(doc, {
      startY: y,
      head: [['#', 'Descrição / Serviço', 'Qtd', 'Un.', 'Vl. Unit.', 'Subtotal']],
      body: data.items.map((item, i) => [
        String(i + 1),
        item.description,
        String(item.quantity),
        item.unit || 'un',
        fmt(item.unit_price),
        fmt(item.total),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [pr, pg, pb] as [number, number, number],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 26, halign: 'right' },
        5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: MARGIN, right: MARGIN },
      styles: { cellPadding: 2.5 },
    })
    y = (doc as any).lastAutoTable.finalY + 3
  }

  if (data.materials && data.materials.length > 0) {
    y = checkBreak(doc, y, 30, company, 'Ordem de Serviço', docNum)
    y = drawSectionBar(doc, company, 'Materiais Utilizados', y)

    autoTable(doc, {
      startY: y,
      head: [['Material', 'Qtd', 'Un.', 'Vl. Unit.', 'Total']],
      body: data.materials.map((m) => [
        m.name,
        String(m.quantity),
        m.unit || 'un',
        fmt(m.unit_cost),
        fmt(m.total_cost),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [80, 110, 130] as [number, number, number], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 14, halign: 'center' },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 26, halign: 'right' },
        4: { cellWidth: 26, halign: 'right' },
      },
      margin: { left: MARGIN, right: MARGIN },
      styles: { cellPadding: 2.5 },
    })
    y = (doc as any).lastAutoTable.finalY + 3
  }

  if (data.milestones && data.milestones.length > 0) {
    y = checkBreak(doc, y, 40, company, 'Ordem de Serviço', docNum)
    y = drawSectionBar(doc, company, 'Cronograma de Etapas', y)
    y = drawMilestonesTable(doc, company, data.milestones, y, docNum)
  }

  y = checkBreak(doc, y, 45, company, 'Ordem de Serviço', docNum)
  y = drawSectionBar(doc, company, 'Resumo Financeiro', y)
  y = drawFinancialBlock(doc, company, data.financial, y)

  y = checkBreak(doc, y, 28, company, 'Ordem de Serviço', docNum)
  y = drawSectionBar(doc, company, 'Garantia Técnica', y)
  y = drawWarrantyBlock(doc, data.warranty_days || company.default_warranty_days || 90, data.warranty_terms, y)

  if (data.report) {
    y = checkBreak(doc, y, 25, company, 'Ordem de Serviço', docNum)
    y = drawSectionBar(doc, company, 'Relatório de Execução', y)
    const lines = doc.splitTextToSize(data.report, CONTENT_W - 6)
    const boxH = Math.max(14, lines.length * 4.5 + 8)
    doc.setFillColor(240, 255, 240)
    doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 1, 1, 'F')
    doc.setDrawColor(76, 175, 80)
    doc.setLineWidth(0.3)
    doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 1, 1, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(40, 40, 40)
    doc.text(lines, MARGIN + 3, y + 6)
    y += boxH + 3
  }

  y = checkBreak(doc, y, 50, company, 'Ordem de Serviço', docNum)
  y = drawSectionBar(doc, company, 'Assinaturas e Confirmação', y)
  y = drawSignatureBlock(doc, company, data.signature || {}, y)

  updatePageFooters(doc, company)

  return doc.output('blob')
}

function drawFinancialBlock(doc: jsPDF, company: any, financial: OSDocumentData['financial'], y: number): number {
  const [pr, pg, pb] = primaryRgb(company)
  const rightX = MARGIN + CONTENT_W
  const colW = CONTENT_W / 2 - 1

  const rows: Array<{ label: string; value: string; bold?: boolean; highlight?: boolean }> = []
  if (financial.labor_value != null && financial.labor_value > 0) rows.push({ label: 'Mão de Obra', value: fmt(financial.labor_value) })
  if (financial.materials_value != null && financial.materials_value > 0) rows.push({ label: 'Materiais', value: fmt(financial.materials_value) })
  if (financial.subtotal > 0 && rows.length > 0) rows.push({ label: 'Subtotal', value: fmt(financial.subtotal) })
  if (financial.discount && financial.discount > 0) rows.push({ label: 'Desconto', value: `- ${fmt(financial.discount)}` })
  rows.push({ label: 'VALOR TOTAL', value: fmt(financial.net_value || financial.subtotal), bold: true, highlight: true })

  let x = MARGIN
  for (const row of rows) {
    const rowH = row.highlight ? 12 : 9
    if (row.highlight) {
      doc.setFillColor(pr, pg, pb)
      doc.roundedRect(x, y, CONTENT_W, rowH, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      doc.text(row.label, x + 4, y + 8)
      doc.text(row.value, rightX - 4, y + 8, { align: 'right' })
    } else {
      doc.setFillColor(248, 250, 252)
      doc.rect(x, y, CONTENT_W, rowH, 'F')
      doc.setFont(row.bold ? 'helvetica' : 'helvetica', row.bold ? 'bold' : 'normal')
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      doc.text(row.label, x + 4, y + 6)
      doc.text(row.value, rightX - 4, y + 6, { align: 'right' })
    }
    y += rowH + 1
  }

  y += 2

  const method = financial.payment_method || 'A combinar'
  const conditions = financial.payment_conditions ||
    (financial.payment_installments && financial.payment_installments > 1
      ? `${financial.payment_installments}x parcel${financial.payment_installments === 1 ? 'a' : 'as'}`
      : 'À vista')

  doc.setFillColor(232, 245, 233)
  doc.roundedRect(MARGIN, y, colW, 14, 1, 1, 'F')
  doc.setDrawColor(76, 175, 80)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, colW, 14, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(30, 100, 30)
  doc.text('FORMA DE PAGAMENTO', MARGIN + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(method, MARGIN + 3, y + 11)

  doc.setFillColor(232, 245, 233)
  doc.roundedRect(MARGIN + colW + 1, y, colW, 14, 1, 1, 'F')
  doc.setDrawColor(76, 175, 80)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN + colW + 1, y, colW, 14, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(30, 100, 30)
  doc.text('CONDIÇÕES', MARGIN + colW + 4, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(conditions, MARGIN + colW + 4, y + 11)

  y += 17

  if (financial.pix_key) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    doc.text(`Chave PIX: ${financial.pix_key}`, MARGIN, y + 4)
    y += 7
  }

  return y + 2
}

function drawWarrantyBlock(doc: jsPDF, days: number, customTerms: string | undefined, y: number): number {
  const text = customTerms || WARRANTY_TEXT(days)
  const lines = doc.splitTextToSize(text, CONTENT_W - 8)
  const boxH = Math.max(14, lines.length * 4 + 10)

  doc.setFillColor(255, 248, 220)
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 1.5, 1.5, 'F')
  doc.setDrawColor(230, 150, 0)
  doc.setLineWidth(0.4)
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 1.5, 1.5, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(160, 100, 0)
  doc.text(`GARANTIA DE ${days} DIAS`, MARGIN + 4, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(60, 40, 0)
  doc.text(lines, MARGIN + 4, y + 11)

  return y + boxH + 3
}

function drawSignatureBlock(doc: jsPDF, company: any, sig: Partial<OSDocumentData['signature'] & {}>, y: number): number {
  const [pr, pg, pb] = primaryRgb(company)
  const halfW = CONTENT_W / 2 - 3
  const signH = 28

  const emitDate = sig?.emit_date || fmtNow()

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1, 1, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 100, 100)
  doc.text(`Data e Hora de Emissão: ${emitDate}`, MARGIN + 4, y + 5.5)
  y += 11

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(MARGIN, y, halfW, signH, 1, 1, 'F')
  doc.setDrawColor(pr, pg, pb)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, halfW, signH, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(pr, pg, pb)
  doc.text('TÉCNICO RESPONSÁVEL', MARGIN + halfW / 2, y + 5, { align: 'center' })
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(MARGIN + 4, y + signH - 6, MARGIN + halfW - 4, y + signH - 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  if (sig?.technician_name) {
    doc.text(sig.technician_name, MARGIN + halfW / 2, y + signH - 2.5, { align: 'center' })
  } else {
    doc.text('Assinatura', MARGIN + halfW / 2, y + signH - 2.5, { align: 'center' })
  }

  const x2 = MARGIN + halfW + 6
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(x2, y, halfW, signH, 1, 1, 'F')
  doc.setDrawColor(76, 175, 80)
  doc.setLineWidth(0.3)
  doc.roundedRect(x2, y, halfW, signH, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(30, 100, 30)
  doc.text('CLIENTE', x2 + halfW / 2, y + 5, { align: 'center' })
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(x2 + 4, y + signH - 6, x2 + halfW - 4, y + signH - 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  if (sig?.client_name) {
    doc.text(sig.client_name, x2 + halfW / 2, y + signH - 2.5, { align: 'center' })
  } else {
    doc.text('Assinatura / Carimbo', x2 + halfW / 2, y + signH - 2.5, { align: 'center' })
  }

  return y + signH + 4
}

const STATUS_LABELS: Record<string, string> = {
  agendado:     'Agendado',
  em_andamento: 'Em Andamento',
  concluido:    'Concluído',
  atrasado:     'Atrasado',
  pendente:     'Pendente',
  cancelado:    'Cancelado',
}

const STATUS_COLORS: Record<string, [number, number, number]> = {
  agendado:     [59, 130, 246],
  em_andamento: [245, 158, 11],
  concluido:    [34, 197, 94],
  atrasado:     [239, 68, 68],
  pendente:     [156, 163, 175],
  cancelado:    [107, 114, 128],
}

function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  } catch { return '—' }
}

function drawMilestonesTable(
  doc: jsPDF,
  company: any,
  milestones: NonNullable<OSDocumentData['milestones']>,
  y: number,
  docNum: string
): number {
  const [pr, pg, pb] = primaryRgb(company)

  autoTable(doc, {
    startY: y,
    head: [['#', 'Etapa / Atividade', 'Data Prevista', 'Data de Execução', 'Status']],
    body: milestones.map((m, i) => [
      String(i + 1),
      [m.title, m.notes ? `(${m.notes})` : ''].filter(Boolean).join('\n'),
      fmtDateShort(m.scheduled_at),
      fmtDateShort(m.actual_at),
      STATUS_LABELS[m.status] || m.status,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [pr, pg, pb] as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40], cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 32, halign: 'center' },
      4: { cellWidth: 28, halign: 'center' },
    },
    didDrawCell: (hookData: any) => {
      if (hookData.column.index === 4 && hookData.section === 'body') {
        const statusKey = milestones[hookData.row.index]?.status || 'agendado'
        const color = STATUS_COLORS[statusKey] || STATUS_COLORS.agendado
        const cell = hookData.cell
        const pad = 1.5
        doc.setFillColor(color[0], color[1], color[2])
        doc.setDrawColor(color[0], color[1], color[2])
        const bw = cell.width - pad * 4
        const bh = 5
        const bx = cell.x + pad * 2
        const by = cell.y + (cell.height - bh) / 2
        doc.roundedRect(bx, by, bw, bh, 1, 1, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(255, 255, 255)
        doc.text(STATUS_LABELS[statusKey] || statusKey, bx + bw / 2, by + 3.5, { align: 'center' })
      }
    },
    margin: { left: MARGIN, right: MARGIN },
  })

  y = (doc as any).lastAutoTable.finalY + 3

  const completedCount = milestones.filter(m => m.status === 'concluido').length
  const pct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0
  const barW = CONTENT_W
  const barH = 5
  const filled = (barW * pct) / 100

  doc.setFillColor(229, 231, 235)
  doc.roundedRect(MARGIN, y, barW, barH, 1, 1, 'F')
  if (filled > 0) {
    doc.setFillColor(34, 197, 94)
    doc.roundedRect(MARGIN, y, filled, barH, 1, 1, 'F')
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `${completedCount}/${milestones.length} etapas concluídas — ${pct}% de progresso`,
    MARGIN + barW / 2,
    y + 9,
    { align: 'center' }
  )

  return y + 14
}

function updatePageFooters(doc: jsPDF, company: any) {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.height
    doc.setFillColor(245, 247, 250)
    doc.rect(0, pageH - 16, PAGE_W, 16, 'F')
    doc.setFillColor(...(primaryRgb(company) as [number, number, number]))
    doc.rect(0, pageH - 16, PAGE_W, 0.4, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(130, 130, 130)
    const footerLeft = company.default_footer ||
      `${company.company_name}${company.cnpj ? ` · CNPJ: ${company.cnpj}` : ''}${company.phone ? ` · ${company.phone}` : ''}`
    doc.text(footerLeft, MARGIN, pageH - 5)
    doc.text(`Gerado em ${fmtNow()}  ·  Pág. ${i} de ${total}`, PAGE_W - MARGIN, pageH - 5, { align: 'right' })
  }
}
