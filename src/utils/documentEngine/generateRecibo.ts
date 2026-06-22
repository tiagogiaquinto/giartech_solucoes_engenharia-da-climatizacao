import jsPDF from 'jspdf'
import type { ReciboDocumentData } from './types'
import {
  PAGE_W, MARGIN, CONTENT_W,
  fmt, fmtDate, fmtNow,
  primaryRgb,
  drawSectionBar, drawInfoGrid,
} from './pdfHelpers'
import { valorPorExtenso, hexToRgb } from './companyService'

export async function generateReciboPDF(data: ReciboDocumentData): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const company = data.company
  const [pr, pg, pb] = primaryRgb(company)
  const docNum = data.recibo_number || 'S/N'

  let y = drawReciboHeader(doc, company, docNum, data.created_at)
  y += 2

  y = drawSectionBar(doc, company, 'Dados do Recebimento', y)
  y = drawInfoGrid(doc, company, [
    { label: 'Recebemos de', value: data.customer.name, span: 2 },
    { label: 'CPF / CNPJ', value: data.customer.cpf_cnpj || '—' },
    { label: 'Referência OS', value: data.os_reference || '—', span: 2 },
    { label: 'Data', value: fmtDate(data.created_at) },
  ], y, 3)

  const valor = data.financial.net_value || data.financial.subtotal
  const extenso = data.valor_extenso || valorPorExtenso(valor)

  y += 2
  y = drawSectionBar(doc, company, 'Valor', y)

  const valBoxH = 22
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(MARGIN, y, CONTENT_W, valBoxH, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text(fmt(valor), PAGE_W / 2, y + 12, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(200, 220, 240)
  doc.text(`(${extenso})`, PAGE_W / 2, y + 19, { align: 'center' })

  y += valBoxH + 4

  y = drawSectionBar(doc, company, 'Descrição do Serviço', y)
  const descLines = doc.splitTextToSize(data.description, CONTENT_W - 6)
  const descBoxH = Math.max(12, descLines.length * 4.5 + 8)
  const [sr, sg, sb] = hexToRgb(company.secondary_color || '#E6F0FA')
  doc.setFillColor(sr, sg, sb)
  doc.roundedRect(MARGIN, y, CONTENT_W, descBoxH, 1, 1, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(descLines, MARGIN + 4, y + 6)
  y += descBoxH + 4

  y = drawSectionBar(doc, company, 'Forma de Pagamento', y)
  const method = data.financial.payment_method || 'A combinar'
  const conditions = data.financial.payment_conditions ||
    (data.financial.payment_installments && data.financial.payment_installments > 1
      ? `${data.financial.payment_installments}x parcelas`
      : 'À vista')

  const halfW = CONTENT_W / 2 - 1
  doc.setFillColor(232, 245, 233)
  doc.roundedRect(MARGIN, y, halfW, 13, 1, 1, 'F')
  doc.setDrawColor(76, 175, 80)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, halfW, 13, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(30, 100, 30)
  doc.text('FORMA DE PAGAMENTO', MARGIN + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(method, MARGIN + 3, y + 10.5)

  const x2 = MARGIN + halfW + 1
  doc.setFillColor(232, 245, 233)
  doc.roundedRect(x2, y, halfW, 13, 1, 1, 'F')
  doc.setDrawColor(76, 175, 80)
  doc.setLineWidth(0.3)
  doc.roundedRect(x2, y, halfW, 13, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(30, 100, 30)
  doc.text('CONDIÇÕES', x2 + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text(conditions, x2 + 3, y + 10.5)
  y += 16

  if (data.financial.pix_key) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    doc.text(`Chave PIX: ${data.financial.pix_key}`, MARGIN, y + 4)
    y += 8
  }

  y += 6
  const quitacaoText = `Declaro que recebi a quantia acima referente aos serviços prestados, dando plena, geral e irrevogável quitação para todos os efeitos de direito.`
  const qLines = doc.splitTextToSize(quitacaoText, CONTENT_W - 6)
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(MARGIN, y, CONTENT_W, 14, 1, 1, 'F')
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, CONTENT_W, 14, 1, 1, 'S')
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(80, 80, 80)
  doc.text(qLines, MARGIN + 4, y + 5)
  y += 18

  y = drawSectionBar(doc, company, 'Assinatura', y)
  y = drawReciboSignature(doc, company, data, y)

  updateReciboFooter(doc, company)

  return doc.output('blob')
}

function drawReciboHeader(doc: jsPDF, company: any, docNum: string, createdAt?: string): number {
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

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text('RECIBO DE PAGAMENTO', PAGE_W - MARGIN, 14, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(200, 220, 240)
  doc.text(`Nº ${docNum}`, PAGE_W - MARGIN, 22, { align: 'right' })
  if (createdAt) {
    doc.setFontSize(8)
    doc.text(fmtDate(createdAt), PAGE_W - MARGIN, 30, { align: 'right' })
  }

  return 48
}

function drawReciboSignature(doc: jsPDF, company: any, data: ReciboDocumentData, y: number): number {
  const [pr, pg, pb] = primaryRgb(company)
  const now = fmtNow()
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
  doc.text('PRESTADOR DE SERVIÇO', MARGIN + halfW / 2, y + 5.5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(60, 60, 60)
  doc.text(company.company_name || '', MARGIN + halfW / 2, y + 11, { align: 'center', maxWidth: halfW - 8 })
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(MARGIN + 4, y + signH - 7, MARGIN + halfW - 4, y + signH - 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(140, 140, 140)
  doc.text('Assinatura', MARGIN + halfW / 2, y + signH - 2.5, { align: 'center' })

  const x2 = MARGIN + halfW + 6
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(x2, y, halfW, signH, 1, 1, 'F')
  doc.setDrawColor(76, 175, 80)
  doc.setLineWidth(0.3)
  doc.roundedRect(x2, y, halfW, signH, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(30, 100, 30)
  doc.text('PAGADOR / CLIENTE', x2 + halfW / 2, y + 5.5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(60, 60, 60)
  doc.text(data.customer.name || '', x2 + halfW / 2, y + 11, { align: 'center', maxWidth: halfW - 8 })
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(x2 + 4, y + signH - 7, x2 + halfW - 4, y + signH - 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(140, 140, 140)
  doc.text('Assinatura', x2 + halfW / 2, y + signH - 2.5, { align: 'center' })

  y += signH + 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text(`Emitido em: ${now}`, PAGE_W / 2, y, { align: 'center' })

  return y + 5
}

function updateReciboFooter(doc: jsPDF, company: any) {
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
