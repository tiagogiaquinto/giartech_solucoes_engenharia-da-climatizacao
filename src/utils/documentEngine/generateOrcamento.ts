import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { BudgetDocumentData } from './types'
import {
  PAGE_W, MARGIN, CONTENT_W,
  fmt, fmtDate, fmtNow,
  primaryRgb,
  drawSectionBar, drawInfoGrid, checkBreak,
} from './pdfHelpers'
import { hexToRgb } from './companyService'

export async function generateOrcamentoPDF(data: BudgetDocumentData): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const company = data.company
  const [pr, pg, pb] = primaryRgb(company)
  const docNum = data.budget_number || 'S/N'

  let y = drawOrcamentoHeader(doc, company, docNum, data.created_at, data.valid_until)
  y += 2

  y = drawSectionBar(doc, company, 'Dados do Cliente', y)
  y = drawInfoGrid(doc, company, [
    { label: 'Nome / Razão Social', value: data.customer.name, span: 2 },
    { label: 'CPF / CNPJ', value: data.customer.cpf_cnpj || '—' },
    { label: 'Telefone', value: data.customer.phone || '—' },
    { label: 'E-mail', value: data.customer.email || '—', span: 2 },
    { label: 'Endereço', value: [data.customer.address, data.customer.city, data.customer.state].filter(Boolean).join(', ') || '—', span: 3 },
  ], y, 3)

  if (data.os_reference) {
    y = drawInfoGrid(doc, company, [
      { label: 'Referência OS', value: data.os_reference, span: 3 },
    ], y, 3)
  }

  // Separate services and materials
  const services = data.items.filter(item =>
    !item.description.toLowerCase().startsWith('material:') &&
    !item.description.toLowerCase().includes('[material]')
  )
  const materials = data.items.filter(item =>
    item.description.toLowerCase().startsWith('material:') ||
    item.description.toLowerCase().includes('[material]')
  )

  // Services table
  if (services.length > 0) {
    y = checkBreak(doc, y, 40, company, 'Orçamento', docNum)
    y = drawSectionBar(doc, company, 'Serviços', y)

    const serviceRows = services.map((item, i) => {
      const desc = item.notes
        ? `${item.description}\n${item.notes}`
        : item.description
      return [
        String(i + 1),
        desc,
        item.quantity.toFixed(2),
        item.unit || 'sv',
        fmt(item.unit_price),
        fmt(item.total),
      ]
    })

    autoTable(doc, {
      startY: y,
      head: [['#', 'Descrição do Serviço', 'Qtd', 'Un.', 'Vl. Unit.', 'Total']],
      body: serviceRows,
      theme: 'grid',
      headStyles: {
        fillColor: [pr, pg, pb] as [number, number, number],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto', cellPadding: 2 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: MARGIN, right: MARGIN },
      styles: { cellPadding: 3 },
      willDrawCell: (data) => {
        // Multi-line text support for description column
        if (data.column.index === 1 && data.cell.raw && data.cell.raw.includes('\n')) {
          const lines = data.cell.raw.split('\n')
          const lineHeight = 4
          const neededHeight = lines.length * lineHeight + 4
          if (data.row.height < neededHeight) {
            data.row.height = neededHeight
          }
        }
      }
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  // Materials table
  if (materials.length > 0) {
    y = checkBreak(doc, y, 35, company, 'Orçamento', docNum)
    y = drawSectionBar(doc, company, 'Materiais', y)

    const materialRows = materials.map((item, i) => [
      String(i + 1),
      item.description.replace(/^Material:\s*/i, '').replace(/\[material\]/i, '').trim(),
      item.quantity.toFixed(2),
      item.unit || 'un',
      fmt(item.unit_price),
      fmt(item.total),
    ])

    autoTable(doc, {
      startY: y,
      head: [['#', 'Descrição do Material', 'Qtd', 'Un.', 'Vl. Unit.', 'Total']],
      body: materialRows,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129] as [number, number, number],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [240, 253, 244] as [number, number, number] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: MARGIN, right: MARGIN },
      styles: { cellPadding: 3 },
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  // Financial summary
  y = checkBreak(doc, y, 45, company, 'Orçamento', docNum)
  y = drawSectionBar(doc, company, 'Valores', y)

  // Calculate subtotals for services and materials
  const servicesTotal = services.reduce((sum, item) => sum + item.total, 0)
  const materialsTotal = materials.reduce((sum, item) => sum + item.total, 0)

  const financialWithDetails = {
    ...data.financial,
    labor_value: servicesTotal > 0 ? servicesTotal : data.financial.labor_value,
    materials_value: materialsTotal > 0 ? materialsTotal : data.financial.materials_value,
  }
  y = drawFinancialSummary(doc, company, financialWithDetails, y)

  // Notes
  if (data.notes) {
    y = checkBreak(doc, y, 25, company, 'Orçamento', docNum)
    y = drawSectionBar(doc, company, 'Observações', y)
    const lines = doc.splitTextToSize(data.notes, CONTENT_W - 6)
    const boxH = Math.max(12, lines.length * 4.5 + 8)
    const [sr, sg, sb] = hexToRgb(company.secondary_color || '#E6F0FA')
    doc.setFillColor(sr, sg, sb)
    doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 1, 1, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(40, 40, 40)
    doc.text(lines, MARGIN + 3, y + 6)
    y += boxH + 3
  }

  // Warranty info from notes if present
  const warrantyInNotes = data.notes?.match(/Garantia:\s*(.+)/i)
  if (warrantyInNotes && warrantyInNotes[1]) {
    y = checkBreak(doc, y, 20, company, 'Orçamento', docNum)
    y = drawSectionBar(doc, company, 'Garantia', y)
    const warrantyText = warrantyInNotes[1].trim()
    const lines = doc.splitTextToSize(warrantyText, CONTENT_W - 6)
    const boxH = Math.max(10, lines.length * 4.5 + 6)
    doc.setFillColor(255, 248, 220)
    doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 1, 1, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(80, 60, 20)
    doc.text(lines, MARGIN + 3, y + 5)
    y += boxH + 3
  } else if (data.warranty_days || data.warranty_terms) {
    y = checkBreak(doc, y, 20, company, 'Orçamento', docNum)
    y = drawSectionBar(doc, company, 'Garantia', y)
    const warrantyText = [
      data.warranty_days ? `Garantia de ${data.warranty_days} dias` : '',
      data.warranty_terms || ''
    ].filter(Boolean).join('. ')
    const lines = doc.splitTextToSize(warrantyText, CONTENT_W - 6)
    const boxH = Math.max(10, lines.length * 4.5 + 6)
    doc.setFillColor(255, 248, 220)
    doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 1, 1, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(80, 60, 20)
    doc.text(lines, MARGIN + 3, y + 5)
    y += boxH + 3
  }

  // Acceptance block
  y = checkBreak(doc, y, 50, company, 'Orçamento', docNum)
  y = drawSectionBar(doc, company, 'Aceite e Assinatura do Cliente', y)
  y = drawAceiteBlock(doc, company, data.customer.name, y)

  updatePageFootersOrcamento(doc, company)

  return doc.output('blob')
}

function drawOrcamentoHeader(
  doc: jsPDF,
  company: any,
  docNum: string,
  createdAt?: string,
  validUntil?: string,
): number {
  const [pr, pg, pb] = primaryRgb(company)

  doc.setFillColor(pr, pg, pb)
  doc.rect(0, 0, PAGE_W, 40, 'F')
  doc.setFillColor(255, 193, 7)
  doc.rect(0, 40, PAGE_W, 2.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text(company.company_name || 'Empresa', MARGIN, 16)

  const subParts: string[] = []
  if (company.cnpj) subParts.push(`CNPJ: ${company.cnpj}`)
  if (company.phone) subParts.push(company.phone)
  if (company.email) subParts.push(company.email)
  if (subParts.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(200, 220, 240)
    doc.text(subParts.join('  ·  '), MARGIN, 24)
  }
  if (company.address) {
    const addrParts = [company.address, company.city && `${company.city}${company.state ? ` - ${company.state}` : ''}`].filter(Boolean)
    doc.setFontSize(7)
    doc.setTextColor(180, 205, 230)
    doc.text(addrParts.join('  ·  '), MARGIN, 30)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text('ORÇAMENTO', PAGE_W - MARGIN, 14, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(200, 220, 240)
  doc.text(`Nº ${docNum}`, PAGE_W - MARGIN, 22, { align: 'right' })

  if (createdAt || validUntil) {
    const dateParts: string[] = []
    if (createdAt) dateParts.push(`Emissão: ${fmtDate(createdAt)}`)
    if (validUntil) dateParts.push(`Validade: ${fmtDate(validUntil)}`)
    doc.setFontSize(8)
    doc.setTextColor(180, 205, 230)
    doc.text(dateParts.join('  ·  '), PAGE_W - MARGIN, 30, { align: 'right' })
  }

  return 48
}

function drawFinancialSummary(doc: jsPDF, company: any, financial: BudgetDocumentData['financial'], y: number): number {
  const [pr, pg, pb] = primaryRgb(company)
  const rightX = MARGIN + CONTENT_W
  const summaryX = MARGIN + CONTENT_W * 0.55

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(60, 60, 60)

  if (financial.labor_value && financial.labor_value > 0) {
    doc.text('Mão de Obra:', summaryX, y + 5)
    doc.text(fmt(financial.labor_value), rightX, y + 5, { align: 'right' })
    y += 7
  }
  if (financial.materials_value && financial.materials_value > 0) {
    doc.text('Materiais:', summaryX, y + 5)
    doc.text(fmt(financial.materials_value), rightX, y + 5, { align: 'right' })
    y += 7
  }
  if (financial.discount && financial.discount > 0) {
    doc.setTextColor(200, 50, 50)
    doc.text('Desconto:', summaryX, y + 5)
    doc.text(`- ${fmt(financial.discount)}`, rightX, y + 5, { align: 'right' })
    y += 7
    doc.setTextColor(60, 60, 60)
  }

  const totalBoxH = 14
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(summaryX - 2, y, rightX - summaryX + 2, totalBoxH, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('VALOR TOTAL:', summaryX + 2, y + 9.5)
  doc.text(fmt(financial.net_value || financial.subtotal), rightX - 3, y + 9.5, { align: 'right' })
  y += totalBoxH + 4

  const method = financial.payment_method || 'A combinar'
  const conditions = financial.payment_conditions ||
    (financial.payment_installments && financial.payment_installments > 1
      ? `${financial.payment_installments}x parcelas`
      : 'À vista')

  doc.setFillColor(232, 245, 233)
  doc.roundedRect(MARGIN, y, CONTENT_W / 2 - 1, 13, 1, 1, 'F')
  doc.setDrawColor(76, 175, 80)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, CONTENT_W / 2 - 1, 13, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(30, 100, 30)
  doc.text('FORMA DE PAGAMENTO', MARGIN + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(method, MARGIN + 3, y + 10.5)

  const x2 = MARGIN + CONTENT_W / 2 + 1
  doc.setFillColor(232, 245, 233)
  doc.roundedRect(x2, y, CONTENT_W / 2 - 1, 13, 1, 1, 'F')
  doc.setDrawColor(76, 175, 80)
  doc.setLineWidth(0.3)
  doc.roundedRect(x2, y, CONTENT_W / 2 - 1, 13, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(30, 100, 30)
  doc.text('CONDIÇÕES', x2 + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(conditions, x2 + 3, y + 10.5)

  y += 16

  if (financial.pix_key) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    doc.text(`Chave PIX: ${financial.pix_key}`, MARGIN, y + 4)
    y += 7
  }

  return y + 2
}

function drawAceiteBlock(doc: jsPDF, company: any, clientName: string | undefined, y: number): number {
  const [pr, pg, pb] = primaryRgb(company)
  const now = fmtNow()

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(MARGIN, y, CONTENT_W, 10, 1, 1, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  const aceiteText = `Ao assinar este orçamento, o(a) cliente declara que leu, compreendeu e concorda com todos os serviços, valores e condições aqui descritos.`
  doc.text(aceiteText, MARGIN + 3, y + 5.5, { maxWidth: CONTENT_W - 6 })
  y += 13

  const halfW = CONTENT_W / 2 - 3
  const signH = 30

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(MARGIN, y, halfW, signH, 1, 1, 'F')
  doc.setDrawColor(pr, pg, pb)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, halfW, signH, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(pr, pg, pb)
  doc.text('APROVADO POR (CLIENTE)', MARGIN + halfW / 2, y + 5.5, { align: 'center' })
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(MARGIN + 4, y + signH - 7, MARGIN + halfW - 4, y + signH - 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text(clientName || 'Nome e Assinatura', MARGIN + halfW / 2, y + signH - 2.5, { align: 'center' })

  const x2 = MARGIN + halfW + 6
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(x2, y, halfW, signH, 1, 1, 'F')
  doc.setDrawColor(76, 175, 80)
  doc.setLineWidth(0.3)
  doc.roundedRect(x2, y, halfW, signH, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(30, 100, 30)
  doc.text('DATA DE APROVAÇÃO', x2 + halfW / 2, y + 5.5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text('_____ / _____ / _______', x2 + halfW / 2, y + signH / 2 + 2, { align: 'center' })
  doc.setFontSize(7)
  doc.setTextColor(140, 140, 140)
  doc.text(`Emissão: ${now}`, x2 + halfW / 2, y + signH - 3, { align: 'center' })

  return y + signH + 4
}

function updatePageFootersOrcamento(doc: jsPDF, company: any) {
  const total = doc.getNumberOfPages()
  const [pr, pg, pb] = primaryRgb(company)
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.height
    doc.setFillColor(245, 247, 250)
    doc.rect(0, pageH - 16, PAGE_W, 16, 'F')
    doc.setFillColor(pr, pg, pb)
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
