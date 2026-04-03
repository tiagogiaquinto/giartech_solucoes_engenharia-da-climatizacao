import jsPDF from 'jspdf'
import type { CompanyProfile } from './types'
import { hexToRgb } from './companyService'

export const PAGE_W = 210
export const MARGIN = 18
export const CONTENT_W = PAGE_W - MARGIN * 2

export const fmt = (v: number | undefined | null) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

export const fmtDate = (d?: string | null) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return d }
}

export const fmtNow = () =>
  new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function primaryRgb(company: CompanyProfile): [number, number, number] {
  return hexToRgb(company.primary_color || '#0F567D')
}

export function drawLetterhead(
  doc: jsPDF,
  company: CompanyProfile,
  docTitle: string,
  docNumber: string,
  pageNum: number,
): number {
  const [pr, pg, pb] = primaryRgb(company)
  const pageH = doc.internal.pageSize.height

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
    doc.text(subParts.join('  ·  '), MARGIN, 23.5)
  }

  if (company.address) {
    const addrParts: string[] = [company.address]
    if (company.city) addrParts.push(`${company.city}${company.state ? ` - ${company.state}` : ''}`)
    if (company.zip_code) addrParts.push(`CEP ${company.zip_code}`)
    doc.setFontSize(7)
    doc.setTextColor(180, 205, 230)
    doc.text(addrParts.join('  ·  '), MARGIN, 30)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text(docTitle.toUpperCase(), PAGE_W - MARGIN, 14, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(200, 220, 240)
  doc.text(`Nº ${docNumber}`, PAGE_W - MARGIN, 22, { align: 'right' })

  if (pageNum > 1) {
    doc.setFontSize(7.5)
    doc.text(`Página ${pageNum}`, PAGE_W - MARGIN, 30, { align: 'right' })
  }

  drawPageFooter(doc, company, pageNum)

  return 48
}

export function drawPageFooter(doc: jsPDF, company: CompanyProfile, pageNum: number) {
  const pageH = doc.internal.pageSize.height
  const [pr, pg, pb] = primaryRgb(company)

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
  doc.text(`Gerado em ${fmtNow()}  ·  Pág. ${pageNum}`, PAGE_W - MARGIN, pageH - 5, { align: 'right' })
}

export function drawSectionBar(doc: jsPDF, company: CompanyProfile, title: string, y: number): number {
  const [pr, pg, pb] = primaryRgb(company)
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(MARGIN, y, CONTENT_W, 7.5, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(title.toUpperCase(), MARGIN + 4, y + 5.2)
  return y + 10
}

export function drawInfoGrid(
  doc: jsPDF,
  company: CompanyProfile,
  fields: Array<{ label: string; value: string; span?: number }>,
  y: number,
  cols = 3,
): number {
  const cellW = CONTENT_W / cols
  const cellH = 13
  const [sr, sg, sb] = hexToRgb(company.secondary_color || '#E6F0FA')

  let x = MARGIN
  let row = 0
  let colIdx = 0

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]
    const span = Math.min(f.span || 1, cols - colIdx)
    const w = cellW * span - 1

    doc.setFillColor(sr, sg, sb)
    doc.roundedRect(x, y + row * (cellH + 1), w, cellH, 0.8, 0.8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 120, 140)
    doc.text(f.label.toUpperCase(), x + 3, y + row * (cellH + 1) + 4.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(40, 40, 40)
    doc.text(f.value || '—', x + 3, y + row * (cellH + 1) + 10.5, { maxWidth: w - 5 })

    x += w + 1
    colIdx += span

    if (colIdx >= cols) {
      colIdx = 0
      x = MARGIN
      row++
    }
  }

  if (colIdx > 0) row++
  return y + row * (cellH + 1) + 2
}

export function checkBreak(doc: jsPDF, y: number, needed: number, company: CompanyProfile, docTitle: string, docNum: string): number {
  const pageH = doc.internal.pageSize.height
  if (y + needed > pageH - 25) {
    doc.addPage()
    const pageNum = doc.getNumberOfPages()
    return drawLetterhead(doc, company, docTitle, docNum, pageNum)
  }
  return y
}
