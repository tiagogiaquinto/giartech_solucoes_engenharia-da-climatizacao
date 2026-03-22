import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { GIARTECH_BRAND } from '../config/brandingConfig'

const B = GIARTECH_BRAND
const MARGIN = B.margins.left
const PAGE_WIDTH = 210
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

export interface VisitReportData {
  order_number: string
  customer_name: string
  customer_address?: string
  customer_city?: string
  customer_phone?: string
  technician_name: string
  completed_at: string
  description?: string
  report?: string
  equipment?: string
  brand?: string
  model?: string
  checklist_items?: Array<{ description: string; is_completed: boolean }>
  materials_used?: Array<{ name: string; quantity: number; unit?: string }>
  tech_signature?: string | null
  client_signature?: string | null
  client_signer_name?: string
  total_value?: number
  photos_before?: string[]
  photos_after?: string[]
}

const fmt = (d: string | null | undefined) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return d }
}

const fmtCurrency = (v?: number) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—'

const drawHeader = (doc: jsPDF, orderNum: string, page: number, total: number) => {
  const [pr, pg, pb] = B.colors.primary
  doc.setFillColor(pr, pg, pb)
  doc.rect(0, 0, PAGE_WIDTH, 40, 'F')

  doc.setFillColor(255, 193, 7)
  doc.rect(0, 38, PAGE_WIDTH, 2.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('GIARTECH SOLUÇÕES', MARGIN, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(200, 220, 240)
  doc.text('Relatório de Visita Técnica', MARGIN, 21)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('LAUDO DE ATENDIMENTO', PAGE_WIDTH - MARGIN, 14, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 220, 240)
  doc.text(`OS #${orderNum}`, PAGE_WIDTH - MARGIN, 21, { align: 'right' })
  if (total > 1) doc.text(`Pág ${page}/${total}`, PAGE_WIDTH - MARGIN, 28, { align: 'right' })

  return 46
}

const sectionHeader = (doc: jsPDF, title: string, y: number): number => {
  const [pr, pg, pb] = B.colors.primary
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text(title.toUpperCase(), MARGIN + 4, y + 5.5)
  return y + 11
}

const infoBox = (doc: jsPDF, label: string, value: string, x: number, y: number, w: number, h = 14) => {
  const [br, bg, bb] = B.colors.secondary
  doc.setFillColor(br, bg, bb)
  doc.roundedRect(x, y, w, h, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...B.colors.textLight)
  doc.text(label.toUpperCase(), x + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...B.colors.text)
  doc.text(value || '—', x + 3, y + 11, { maxWidth: w - 6 })
  return y + h + 2
}

const drawFooter = (doc: jsPDF, page: number, total: number) => {
  const pH = doc.internal.pageSize.height
  doc.setFillColor(245, 247, 250)
  doc.rect(0, pH - 12, PAGE_WIDTH, 12, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...B.colors.textMuted)
  doc.text(`Giartech Soluções — Relatório gerado em ${new Date().toLocaleString('pt-BR')}`, MARGIN, pH - 4)
  doc.text(`Página ${page} de ${total}`, PAGE_WIDTH - MARGIN, pH - 4, { align: 'right' })
}

export const generateVisitReportPDF = async (data: VisitReportData): Promise<void> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.height
  const thirdW = (CONTENT_WIDTH - 8) / 3
  const halfW = (CONTENT_WIDTH - 4) / 2

  let y = drawHeader(doc, data.order_number, 1, 1)

  y = sectionHeader(doc, 'Dados do Atendimento', y)
  infoBox(doc, 'Nº da OS', data.order_number, MARGIN, y, thirdW)
  infoBox(doc, 'Data / Hora de Conclusão', fmt(data.completed_at), MARGIN + thirdW + 4, y, thirdW)
  infoBox(doc, 'Técnico Responsável', data.technician_name, MARGIN + (thirdW + 4) * 2, y, thirdW)
  y += 16

  y = sectionHeader(doc, 'Dados do Cliente', y)
  infoBox(doc, 'Cliente', data.customer_name, MARGIN, y, halfW)
  infoBox(doc, 'Telefone', data.customer_phone || '—', MARGIN + halfW + 4, y, halfW)
  y += 16

  if (data.customer_address) {
    infoBox(doc, 'Endereço', `${data.customer_address}${data.customer_city ? ' — ' + data.customer_city : ''}`, MARGIN, y, CONTENT_WIDTH)
    y += 16
  }

  if (data.equipment || data.brand || data.model) {
    y = sectionHeader(doc, 'Equipamento Atendido', y)
    infoBox(doc, 'Equipamento', data.equipment || '—', MARGIN, y, thirdW)
    infoBox(doc, 'Marca', data.brand || '—', MARGIN + thirdW + 4, y, thirdW)
    infoBox(doc, 'Modelo', data.model || '—', MARGIN + (thirdW + 4) * 2, y, thirdW)
    y += 16
  }

  if (data.description) {
    y = sectionHeader(doc, 'Descrição do Serviço', y)
    const lines = doc.splitTextToSize(data.description, CONTENT_WIDTH - 6)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, Math.max(12, lines.length * 5 + 6), 1, 1, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...B.colors.text)
    doc.text(lines, MARGIN + 3, y + 6)
    y += Math.max(14, lines.length * 5 + 8)
  }

  if (data.report) {
    y = sectionHeader(doc, 'Laudo Técnico', y)
    const lines = doc.splitTextToSize(data.report, CONTENT_WIDTH - 6)
    doc.setFillColor(254, 252, 232)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, Math.max(12, lines.length * 5 + 6), 1, 1, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...B.colors.text)
    doc.text(lines, MARGIN + 3, y + 6)
    y += Math.max(14, lines.length * 5 + 8)
  }

  if (data.checklist_items && data.checklist_items.length > 0) {
    if (y > pageH - 70) { doc.addPage(); y = drawHeader(doc, data.order_number, doc.getNumberOfPages(), 1); }
    y = sectionHeader(doc, 'Checklist de Execução', y)

    const checkRows = data.checklist_items.map(c => [
      c.is_completed ? '✓' : '✗',
      c.description
    ])

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['', 'Item Verificado']],
      body: checkRows,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: B.colors.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: CONTENT_WIDTH - 10 }
      },
      didDrawCell: (hookData) => {
        if (hookData.column.index === 0 && hookData.row.section === 'body') {
          const val = hookData.cell.raw as string
          doc.setTextColor(val === '✓' ? 76 : 244, val === '✓' ? 175 : 67, val === '✓' ? 80 : 54)
        }
      }
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  if (data.materials_used && data.materials_used.length > 0) {
    if (y > pageH - 60) { doc.addPage(); y = drawHeader(doc, data.order_number, doc.getNumberOfPages(), 1); }
    y = sectionHeader(doc, 'Materiais Utilizados', y)

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Material', 'Qtd', 'Un']],
      body: data.materials_used.map(m => [m.name, m.quantity, m.unit || 'un']),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: B.colors.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    })
    y = (doc as any).lastAutoTable.finalY + 4
  }

  if (data.total_value != null) {
    if (y > pageH - 30) { doc.addPage(); y = drawHeader(doc, data.order_number, doc.getNumberOfPages(), 1); }
    const [pr, pg, pb] = B.colors.primary
    doc.setFillColor(pr, pg, pb)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 12, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text('VALOR TOTAL DO ATENDIMENTO', MARGIN + 4, y + 8)
    doc.text(fmtCurrency(data.total_value), PAGE_WIDTH - MARGIN - 4, y + 8, { align: 'right' })
    y += 16
  }

  if (y > pageH - 60) { doc.addPage(); y = drawHeader(doc, data.order_number, doc.getNumberOfPages(), 1); }
  y = sectionHeader(doc, 'Confirmação e Assinaturas', y)
  y += 4

  const sigColW = (CONTENT_WIDTH - 8) / 2
  const sigBoxH = 32

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(MARGIN, y, sigColW, sigBoxH + 16, 1, 1, 'F')
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(MARGIN + sigColW + 8, y, sigColW, sigBoxH + 16, 1, 1, 'F')

  if (data.tech_signature) {
    try { doc.addImage(data.tech_signature, 'PNG', MARGIN + 2, y + 2, sigColW - 4, sigBoxH) } catch { /* ignore */ }
  }
  if (data.client_signature) {
    try { doc.addImage(data.client_signature, 'PNG', MARGIN + sigColW + 10, y + 2, sigColW - 4, sigBoxH) } catch { /* ignore */ }
  }

  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(MARGIN + 4, y + sigBoxH + 2, MARGIN + sigColW - 4, y + sigBoxH + 2)
  doc.line(MARGIN + sigColW + 12, y + sigBoxH + 2, MARGIN + sigColW * 2 + 4, y + sigBoxH + 2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...B.colors.textLight)
  doc.text('Técnico: ' + data.technician_name, MARGIN + sigColW / 2 + MARGIN, y + sigBoxH + 8, { align: 'center' })
  doc.text('Cliente: ' + (data.client_signer_name || data.customer_name), MARGIN + sigColW + 8 + sigColW / 2, y + sigBoxH + 8, { align: 'center' })

  y += sigBoxH + 20

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...B.colors.textMuted)
  doc.text(`Data/Hora: ${fmt(data.completed_at)}`, MARGIN, y)
  y += 6

  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    drawHeader(doc, data.order_number, i, total)
    drawFooter(doc, i, total)
  }

  const safeName = (data.customer_name || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`Laudo-OS-${data.order_number}-${safeName}.pdf`)
}
