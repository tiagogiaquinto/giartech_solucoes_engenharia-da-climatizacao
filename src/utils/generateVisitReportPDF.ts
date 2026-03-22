import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { GIARTECH_BRAND } from '../config/brandingConfig'

const B = GIARTECH_BRAND
const MARGIN = 18
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

// Navy blue for RVT — matches "Azul Marinho" aesthetic
const NAVY: [number, number, number] = [11, 61, 98]
const NAVY_LIGHT: [number, number, number] = [19, 89, 140]
const GOLD: [number, number, number] = [255, 193, 7]
const WHITE: [number, number, number] = [255, 255, 255]
const BG_LIGHT: [number, number, number] = [244, 248, 252]
const BG_SUBTLE: [number, number, number] = [248, 250, 252]
const TEXT_DARK: [number, number, number] = [20, 30, 48]
const TEXT_MID: [number, number, number] = [80, 95, 115]
const TEXT_MUTED: [number, number, number] = [140, 155, 170]
const GREEN: [number, number, number] = [34, 160, 80]
const RED: [number, number, number] = [220, 53, 69]
const GREEN_BG: [number, number, number] = [232, 250, 240]
const BORDER: [number, number, number] = [215, 225, 236]

export interface VisitReportData {
  order_number: string
  customer_name: string
  customer_address?: string
  customer_city?: string
  customer_phone?: string
  customer_email?: string
  technician_name: string
  start_date?: string
  completed_at: string
  description?: string
  report?: string
  equipment?: string
  brand?: string
  model?: string
  equipment_location?: string
  checklist_items?: Array<{
    description: string
    is_completed: boolean
    technical_note?: string
  }>
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
  try {
    return new Date(d).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return d }
}

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  } catch { return d }
}

const fmtTime = (d: string | null | undefined) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch { return d }
}

const fmtCurrency = (v?: number) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—'

// ─── PREMIUM HEADER ────────────────────────────────────────────────────────────
const drawPremiumHeader = (doc: jsPDF, orderNum: string, page: number, total: number): number => {
  // Full-width dark navy background
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PAGE_WIDTH, 52, 'F')

  // Gold accent stripe
  doc.setFillColor(...GOLD)
  doc.rect(0, 50, PAGE_WIDTH, 3, 'F')

  // Left: Company name + tagline
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...WHITE)
  doc.text('GIARTECH', MARGIN, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(170, 200, 230)
  doc.text('SOLUÇÕES TÉCNICAS', MARGIN, 27)

  // Separator line (vertical)
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.8)
  doc.line(MARGIN + 62, 10, MARGIN + 62, 42)

  // Center: Document type badge
  const centerX = PAGE_WIDTH / 2
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...WHITE)
  doc.text('RELATÓRIO DE VISITA TÉCNICA', centerX, 19, { align: 'center' })

  // Center: OS badge pill
  const badgeW = 60
  const badgeX = centerX - badgeW / 2
  doc.setFillColor(...NAVY_LIGHT)
  doc.roundedRect(badgeX, 22, badgeW, 10, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GOLD)
  doc.text(`RVT #${orderNum}`, centerX, 29, { align: 'center' })

  // Right: Page number
  if (total > 1) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(170, 200, 230)
    doc.text(`Página ${page} / ${total}`, PAGE_WIDTH - MARGIN, 28, { align: 'right' })
  }

  // Right: Date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(170, 200, 230)
  doc.text(new Date().toLocaleDateString('pt-BR'), PAGE_WIDTH - MARGIN, 20, { align: 'right' })

  return 60
}

// ─── SECTION HEADER ────────────────────────────────────────────────────────────
const sectionHeader = (doc: jsPDF, title: string, iconChar: string, y: number): number => {
  // Full-width accent bar
  doc.setFillColor(...BG_LIGHT)
  doc.rect(MARGIN, y, CONTENT_WIDTH, 9, 'F')

  doc.setFillColor(...NAVY)
  doc.rect(MARGIN, y, 3.5, 9, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...NAVY)
  doc.text(`${iconChar}  ${title.toUpperCase()}`, MARGIN + 7, y + 6)

  return y + 13
}

// ─── INFO GRID CELL ────────────────────────────────────────────────────────────
const infoCell = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h = 16
) => {
  doc.setFillColor(...BG_SUBTLE)
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'F')
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...TEXT_MUTED)
  doc.text(label.toUpperCase(), x + 3.5, y + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_DARK)
  const lines = doc.splitTextToSize(value || '—', w - 7)
  doc.text(lines[0] || '—', x + 3.5, y + 12)

  return y + h + 2
}

// ─── FOOTER ────────────────────────────────────────────────────────────────────
const drawFooter = (doc: jsPDF, page: number, total: number) => {
  const pH = doc.internal.pageSize.height

  doc.setFillColor(...NAVY)
  doc.rect(0, pH - 13, PAGE_WIDTH, 13, 'F')

  doc.setFillColor(...GOLD)
  doc.rect(0, pH - 13, PAGE_WIDTH, 0.6, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(170, 200, 230)
  doc.text(
    `Giartech Soluções Técnicas  |  Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')}`,
    MARGIN, pH - 5
  )
  doc.text(`${page} / ${total}`, PAGE_WIDTH - MARGIN, pH - 5, { align: 'right' })
}

// ─── PAGE BREAK GUARD ──────────────────────────────────────────────────────────
const pageGuard = (doc: jsPDF, y: number, need: number, orderNum: string): number => {
  if (y + need > PAGE_HEIGHT - 20) {
    doc.addPage()
    return drawPremiumHeader(doc, orderNum, doc.getNumberOfPages(), 1)
  }
  return y
}

// ─── MAIN EXPORT (saves file) ─────────────────────────────────────────────────
export const generateVisitReportPDF = async (data: VisitReportData): Promise<void> => {
  const blob = await buildReportBlob(data)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = (data.customer_name || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')
  a.download = `RVT-OS-${data.order_number}-${safeName}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── MAIN BUILDER (returns Blob for upload) ───────────────────────────────────
export const buildReportBlob = async (data: VisitReportData): Promise<Blob> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const thirdW = (CONTENT_WIDTH - 6) / 3
  const halfW = (CONTENT_WIDTH - 4) / 2

  let y = drawPremiumHeader(doc, data.order_number, 1, 1)

  // ── BLOCO 1: Dados do Atendimento ──────────────────────────────────────────
  y = sectionHeader(doc, 'Dados do Atendimento', '01', y)

  infoCell(doc, 'Número da OS', `RVT-${data.order_number}`, MARGIN, y, thirdW)
  infoCell(doc, 'Data de Início', fmtDate(data.start_date || data.completed_at), MARGIN + thirdW + 3, y, thirdW)
  infoCell(doc, 'Data / Hora de Conclusão', fmt(data.completed_at), MARGIN + (thirdW + 3) * 2, y, thirdW)
  y += 18

  infoCell(doc, 'Técnico Responsável', data.technician_name, MARGIN, y, halfW)
  infoCell(doc, 'Hora de Início', fmtTime(data.start_date), MARGIN + halfW + 4, y, halfW / 2)
  infoCell(doc, 'Hora de Conclusão', fmtTime(data.completed_at), MARGIN + halfW + 4 + halfW / 2 + 2, y, halfW / 2 - 2)
  y += 18

  // ── BLOCO 1b: Dados do Cliente ─────────────────────────────────────────────
  y = sectionHeader(doc, 'Dados do Cliente', '02', y)

  infoCell(doc, 'Cliente / Empresa', data.customer_name, MARGIN, y, halfW)
  infoCell(doc, 'Telefone', data.customer_phone || '—', MARGIN + halfW + 4, y, halfW)
  y += 18

  if (data.customer_address) {
    const addr = `${data.customer_address}${data.customer_city ? ', ' + data.customer_city : ''}`
    infoCell(doc, 'Endereço Completo', addr, MARGIN, y, CONTENT_WIDTH)
    y += 18
  }

  // ── BLOCO 2: O Ativo / Equipamento ─────────────────────────────────────────
  if (data.equipment || data.brand || data.model || data.equipment_location) {
    y = pageGuard(doc, y, 30, data.order_number)
    y = sectionHeader(doc, 'Identificação do Equipamento', '03', y)

    infoCell(doc, 'Tipo de Equipamento', data.equipment || '—', MARGIN, y, thirdW)
    infoCell(doc, 'Marca', data.brand || '—', MARGIN + thirdW + 3, y, thirdW)
    infoCell(doc, 'Modelo', data.model || '—', MARGIN + (thirdW + 3) * 2, y, thirdW)
    y += 18

    if (data.equipment_location) {
      infoCell(doc, 'Localização Exata', data.equipment_location, MARGIN, y, CONTENT_WIDTH)
      y += 18
    }
  }

  // ── Descrição do Serviço ───────────────────────────────────────────────────
  if (data.description) {
    y = pageGuard(doc, y, 25, data.order_number)
    y = sectionHeader(doc, 'Descrição do Serviço', '04', y)

    const lines = doc.splitTextToSize(data.description, CONTENT_WIDTH - 8)
    const boxH = Math.max(14, lines.length * 5.2 + 8)
    doc.setFillColor(...BG_SUBTLE)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.2)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxH, 1.5, 1.5, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...TEXT_DARK)
    doc.text(lines, MARGIN + 4, y + 7)
    y += boxH + 4
  }

  // ── Laudo Técnico ──────────────────────────────────────────────────────────
  if (data.report) {
    y = pageGuard(doc, y, 25, data.order_number)
    y = sectionHeader(doc, 'Laudo Técnico', '05', y)

    const lines = doc.splitTextToSize(data.report, CONTENT_WIDTH - 8)
    const boxH = Math.max(14, lines.length * 5.2 + 8)
    doc.setFillColor(252, 248, 232)
    doc.setDrawColor(220, 195, 120)
    doc.setLineWidth(0.2)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxH, 1.5, 1.5, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...TEXT_DARK)
    doc.text(lines, MARGIN + 4, y + 7)
    y += boxH + 4
  }

  // ── BLOCO 3: Checklist de Execução ─────────────────────────────────────────
  if (data.checklist_items && data.checklist_items.length > 0) {
    y = pageGuard(doc, y, 40, data.order_number)
    y = sectionHeader(doc, 'Checklist de Execução', '06', y)

    const completedCount = data.checklist_items.filter(c => c.is_completed).length
    const totalCount = data.checklist_items.length

    // Progress bar
    doc.setFillColor(...BORDER)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 4, 2, 2, 'F')
    const pct = totalCount > 0 ? (completedCount / totalCount) : 0
    doc.setFillColor(...GREEN)
    doc.roundedRect(MARGIN, y, Math.max(4, CONTENT_WIDTH * pct), 4, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...TEXT_MID)
    doc.text(`${completedCount} / ${totalCount} itens concluídos (${Math.round(pct * 100)}%)`, PAGE_WIDTH - MARGIN, y + 3.2, { align: 'right' })
    y += 8

    // Table rows
    const checkBody: any[][] = data.checklist_items.map((c) => [
      c.is_completed ? 'SIM' : 'NAO',
      c.description || '—',
      c.technical_note || ''
    ])

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['OK?', 'Item Verificado', 'Nota Técnica']],
      body: checkBody,
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: {
        fillColor: NAVY,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: (CONTENT_WIDTH - 14) * 0.6 },
        2: { cellWidth: (CONTENT_WIDTH - 14) * 0.4, textColor: TEXT_MID as any, fontSize: 7.5, fontStyle: 'italic' as any }
      },
      didDrawCell: (hookData) => {
        if (hookData.column.index === 0 && hookData.row.section === 'body') {
          const val = hookData.cell.raw as string
          const ok = val === 'SIM'
          const cx = hookData.cell.x + hookData.cell.width / 2
          const cy = hookData.cell.y + hookData.cell.height / 2
          doc.setFillColor(...(ok ? GREEN_BG : [255, 240, 240] as [number, number, number]))
          doc.rect(hookData.cell.x, hookData.cell.y, hookData.cell.width, hookData.cell.height, 'F')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          doc.setTextColor(...(ok ? GREEN : RED))
          doc.text(ok ? '✓' : '✗', cx, cy + 1.5, { align: 'center' })
        }
      },
      alternateRowStyles: { fillColor: [250, 252, 255] }
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ── BLOCO 4: Fotos Antes e Depois ──────────────────────────────────────────
  const hasBefore = data.photos_before && data.photos_before.length > 0
  const hasAfter = data.photos_after && data.photos_after.length > 0

  if (hasBefore || hasAfter) {
    y = pageGuard(doc, y, 80, data.order_number)
    y = sectionHeader(doc, 'Evidências Fotográficas', '07', y)

    const photoW = (CONTENT_WIDTH - 8) / 2
    const photoH = 55

    if (hasBefore) {
      doc.setFillColor(...BG_SUBTLE)
      doc.roundedRect(MARGIN, y, photoW, photoH + 10, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...NAVY)
      doc.text('ANTES DO SERVIÇO', MARGIN + photoW / 2, y + 7, { align: 'center' })
      try {
        doc.addImage(data.photos_before![0], 'JPEG', MARGIN + 2, y + 10, photoW - 4, photoH - 4)
      } catch {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(...TEXT_MUTED)
        doc.text('Foto não disponível', MARGIN + photoW / 2, y + photoH / 2 + 10, { align: 'center' })
      }
    }

    if (hasAfter) {
      const startX = hasBefore ? MARGIN + photoW + 8 : MARGIN
      doc.setFillColor(...GREEN_BG)
      doc.roundedRect(startX, y, photoW, photoH + 10, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...GREEN)
      doc.text('DEPOIS DO SERVIÇO', startX + photoW / 2, y + 7, { align: 'center' })
      try {
        doc.addImage(data.photos_after![0], 'JPEG', startX + 2, y + 10, photoW - 4, photoH - 4)
      } catch {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(...TEXT_MUTED)
        doc.text('Foto não disponível', startX + photoW / 2, y + photoH / 2 + 10, { align: 'center' })
      }
    }

    y += photoH + 16
  }

  // ── Materiais Utilizados ───────────────────────────────────────────────────
  if (data.materials_used && data.materials_used.length > 0) {
    y = pageGuard(doc, y, 40, data.order_number)
    y = sectionHeader(doc, 'Materiais Utilizados', '08', y)

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Material / Peça', 'Qtd', 'Un']],
      body: data.materials_used.map(m => [m.name, String(m.quantity), m.unit || 'un']),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: CONTENT_WIDTH - 30 },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' }
      },
      alternateRowStyles: { fillColor: [250, 252, 255] }
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ── Valor Total ────────────────────────────────────────────────────────────
  if (data.total_value != null) {
    y = pageGuard(doc, y, 20, data.order_number)

    doc.setFillColor(...NAVY)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 14, 2, 2, 'F')
    doc.setFillColor(...GOLD)
    doc.roundedRect(MARGIN, y, 5, 14, 2, 0, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...WHITE)
    doc.text('VALOR TOTAL DO ATENDIMENTO', MARGIN + 10, y + 9.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...GOLD)
    doc.text(fmtCurrency(data.total_value), PAGE_WIDTH - MARGIN - 3, y + 9.5, { align: 'right' })
    y += 18
  }

  // ── BLOCO 5: Assinaturas ───────────────────────────────────────────────────
  y = pageGuard(doc, y, 65, data.order_number)
  y = sectionHeader(doc, 'Confirmação e Assinaturas', '09', y)

  const sigColW = (CONTENT_WIDTH - 8) / 2
  const sigBoxH = 38

  // Tech sig box
  doc.setFillColor(...BG_SUBTLE)
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, sigColW, sigBoxH + 20, 2, 2, 'FD')

  doc.setFillColor(...NAVY)
  doc.roundedRect(MARGIN, y, sigColW, 7, 2, 2, 'F')
  doc.rect(MARGIN, y + 4, sigColW, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...WHITE)
  doc.text('TÉCNICO RESPONSÁVEL', MARGIN + sigColW / 2, y + 5, { align: 'center' })

  if (data.tech_signature) {
    try {
      doc.addImage(data.tech_signature, 'PNG', MARGIN + 4, y + 9, sigColW - 8, sigBoxH - 2)
    } catch { /* ignore */ }
  } else {
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.4)
    doc.line(MARGIN + 8, y + sigBoxH - 4, MARGIN + sigColW - 8, y + sigBoxH - 4)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT_DARK)
  doc.text(data.technician_name, MARGIN + sigColW / 2, y + sigBoxH + 10, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_MUTED)
  doc.text('Assinatura do Técnico', MARGIN + sigColW / 2, y + sigBoxH + 15, { align: 'center' })

  // Client sig box
  const sigX2 = MARGIN + sigColW + 8
  doc.setFillColor(...BG_SUBTLE)
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(sigX2, y, sigColW, sigBoxH + 20, 2, 2, 'FD')

  doc.setFillColor(...GREEN)
  doc.roundedRect(sigX2, y, sigColW, 7, 2, 2, 'F')
  doc.rect(sigX2, y + 4, sigColW, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...WHITE)
  doc.text('CLIENTE / RESPONSÁVEL', sigX2 + sigColW / 2, y + 5, { align: 'center' })

  if (data.client_signature) {
    try {
      doc.addImage(data.client_signature, 'PNG', sigX2 + 4, y + 9, sigColW - 8, sigBoxH - 2)
    } catch { /* ignore */ }
  } else {
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.4)
    doc.line(sigX2 + 8, y + sigBoxH - 4, sigX2 + sigColW - 8, y + sigBoxH - 4)
  }

  const clientDisplayName = data.client_signer_name || data.customer_name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT_DARK)
  doc.text(clientDisplayName, sigX2 + sigColW / 2, y + sigBoxH + 10, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_MUTED)
  doc.text('Assinatura do Cliente', sigX2 + sigColW / 2, y + sigBoxH + 15, { align: 'center' })

  y += sigBoxH + 26

  // Timestamp
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...TEXT_MUTED)
  doc.text(
    `Serviço executado e confirmado em: ${fmt(data.completed_at)}  |  OS #${data.order_number}`,
    PAGE_WIDTH / 2, y, { align: 'center' }
  )

  // ── Finalizar todas as páginas ─────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawPremiumHeader(doc, data.order_number, i, totalPages)
    drawFooter(doc, i, totalPages)
  }

  return doc.output('blob')
}
