import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface BudgetItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
  category?: string
}

export interface BudgetData {
  number: string
  date: string
  validUntil: string
  customer: {
    name: string
    document: string
    email?: string
    phone?: string
    address?: string
  }
  company: {
    name: string
    document: string
    email: string
    phone: string
    address: string
    logo?: string
  }
  items: BudgetItem[]
  subtotal: number
  discount?: number
  discountType?: 'percentage' | 'fixed'
  taxes?: number
  total: number
  notes?: string
  paymentTerms?: string
  observations?: string
}

export interface PDFTemplate {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: 'helvetica' | 'times' | 'courier'
  showLogo: boolean
  showHeader: boolean
  showFooter: boolean
  headerHeight: number
  footerHeight: number
}

export const defaultTemplates: PDFTemplate[] = [
  {
    id: 'professional',
    name: 'Profissional',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    accentColor: '#60a5fa',
    fontFamily: 'helvetica',
    showLogo: true,
    showHeader: true,
    showFooter: true,
    headerHeight: 40,
    footerHeight: 20
  },
  {
    id: 'technical',
    name: 'Técnico',
    primaryColor: '#047857',
    secondaryColor: '#10b981',
    accentColor: '#34d399',
    fontFamily: 'helvetica',
    showLogo: true,
    showHeader: true,
    showFooter: true,
    headerHeight: 35,
    footerHeight: 20
  },
  {
    id: 'modern',
    name: 'Moderno',
    primaryColor: '#7c3aed',
    secondaryColor: '#a78bfa',
    accentColor: '#c4b5fd',
    fontFamily: 'helvetica',
    showLogo: true,
    showHeader: true,
    showFooter: true,
    headerHeight: 45,
    footerHeight: 25
  },
  {
    id: 'classic',
    name: 'Clássico',
    primaryColor: '#1f2937',
    secondaryColor: '#4b5563',
    accentColor: '#9ca3af',
    fontFamily: 'times',
    showLogo: true,
    showHeader: true,
    showFooter: true,
    headerHeight: 35,
    footerHeight: 20
  }
]

class BudgetPDFService {
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0]
  }

  private addHeader(doc: jsPDF, data: BudgetData, template: PDFTemplate) {
    if (!template.showHeader) return

    const pageWidth = doc.internal.pageSize.getWidth()
    const [r, g, b] = this.hexToRgb(template.primaryColor)

    doc.setFillColor(r, g, b)
    doc.rect(0, 0, pageWidth, template.headerHeight, 'F')

    if (template.showLogo && data.company.logo) {
      try {
        doc.addImage(data.company.logo, 'PNG', 15, 8, 30, 30)
      } catch (error) {
        console.error('Error loading logo:', error)
      }
    }

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont(template.fontFamily, 'bold')
    doc.text(data.company.name, template.showLogo ? 50 : 15, 20)

    doc.setFontSize(10)
    doc.setFont(template.fontFamily, 'normal')
    doc.text(data.company.address, template.showLogo ? 50 : 15, 28)
    doc.text(`${data.company.phone} | ${data.company.email}`, template.showLogo ? 50 : 15, 35)

    doc.setFontSize(16)
    doc.setFont(template.fontFamily, 'bold')
    doc.text('ORÇAMENTO', pageWidth - 15, 25, { align: 'right' })
    doc.setFontSize(12)
    doc.setFont(template.fontFamily, 'normal')
    doc.text(`Nº ${data.number}`, pageWidth - 15, 32, { align: 'right' })
  }

  private addFooter(doc: jsPDF, template: PDFTemplate, pageNumber: number, totalPages: number) {
    if (!template.showFooter) return

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const [r, g, b] = this.hexToRgb(template.secondaryColor)

    doc.setFillColor(r, g, b)
    doc.rect(0, pageHeight - template.footerHeight, pageWidth, template.footerHeight, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont(template.fontFamily, 'normal')
    doc.text(
      `Página ${pageNumber} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )

    const generatedText = `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
    doc.text(generatedText, pageWidth - 15, pageHeight - 10, { align: 'right' })
  }

  private addCustomerInfo(doc: jsPDF, data: BudgetData, template: PDFTemplate, startY: number) {
    const [r, g, b] = this.hexToRgb(template.accentColor)

    doc.setFillColor(r, g, b)
    doc.roundedRect(15, startY, 180, 35, 3, 3, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont(template.fontFamily, 'bold')
    doc.text('DADOS DO CLIENTE', 20, startY + 8)

    doc.setFontSize(10)
    doc.setFont(template.fontFamily, 'normal')
    doc.text(`Nome: ${data.customer.name}`, 20, startY + 15)
    doc.text(`${data.customer.document.length === 11 ? 'CPF' : 'CNPJ'}: ${data.customer.document}`, 20, startY + 21)

    if (data.customer.phone) {
      doc.text(`Telefone: ${data.customer.phone}`, 20, startY + 27)
    }

    if (data.customer.email) {
      doc.text(`Email: ${data.customer.email}`, 115, startY + 27)
    }

    return startY + 40
  }

  private addBudgetInfo(doc: jsPDF, data: BudgetData, template: PDFTemplate, startY: number) {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont(template.fontFamily, 'bold')
    doc.text('Data de Emissão:', 15, startY)
    doc.setFont(template.fontFamily, 'normal')
    doc.text(format(new Date(data.date), 'dd/MM/yyyy', { locale: ptBR }), 60, startY)

    doc.setFont(template.fontFamily, 'bold')
    doc.text('Validade:', 110, startY)
    doc.setFont(template.fontFamily, 'normal')
    doc.text(format(new Date(data.validUntil), 'dd/MM/yyyy', { locale: ptBR }), 140, startY)

    return startY + 10
  }

  private addItemsTable(doc: jsPDF, data: BudgetData, template: PDFTemplate, startY: number) {
    const [r, g, b] = this.hexToRgb(template.primaryColor)

    const tableData = data.items.map((item, index) => [
      (index + 1).toString(),
      item.description,
      item.quantity.toFixed(2),
      item.unit,
      `R$ ${item.unitPrice.toFixed(2)}`,
      `R$ ${item.total.toFixed(2)}`
    ])

    autoTable(doc, {
      startY,
      head: [['#', 'Descrição', 'Qtd', 'Unid.', 'Valor Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [r, g, b],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 80 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right', cellWidth: 30 }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 15, right: 15 }
    })

    return (doc as any).lastAutoTable.finalY + 10
  }

  private addTotals(doc: jsPDF, data: BudgetData, template: PDFTemplate, startY: number) {
    const pageWidth = doc.internal.pageSize.getWidth()
    const [r, g, b] = this.hexToRgb(template.primaryColor)
    const rightX = pageWidth - 15

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)

    doc.setFont(template.fontFamily, 'bold')
    doc.text('Subtotal:', rightX - 60, startY, { align: 'right' })
    doc.setFont(template.fontFamily, 'normal')
    doc.text(`R$ ${data.subtotal.toFixed(2)}`, rightX, startY, { align: 'right' })

    let currentY = startY + 7

    if (data.discount && data.discount > 0) {
      const discountAmount = data.discountType === 'percentage'
        ? (data.subtotal * data.discount) / 100
        : data.discount

      doc.setFont(template.fontFamily, 'bold')
      doc.text(
        `Desconto ${data.discountType === 'percentage' ? `(${data.discount}%)` : ''}:`,
        rightX - 60,
        currentY,
        { align: 'right' }
      )
      doc.setFont(template.fontFamily, 'normal')
      doc.setTextColor(220, 38, 38)
      doc.text(`-R$ ${discountAmount.toFixed(2)}`, rightX, currentY, { align: 'right' })
      doc.setTextColor(0, 0, 0)
      currentY += 7
    }

    if (data.taxes && data.taxes > 0) {
      doc.setFont(template.fontFamily, 'bold')
      doc.text('Impostos:', rightX - 60, currentY, { align: 'right' })
      doc.setFont(template.fontFamily, 'normal')
      doc.text(`R$ ${data.taxes.toFixed(2)}`, rightX, currentY, { align: 'right' })
      currentY += 7
    }

    doc.setFillColor(r, g, b)
    doc.rect(rightX - 95, currentY - 5, 95, 12, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont(template.fontFamily, 'bold')
    doc.text('VALOR TOTAL:', rightX - 60, currentY + 3, { align: 'right' })
    doc.setFontSize(14)
    doc.text(`R$ ${data.total.toFixed(2)}`, rightX - 5, currentY + 3, { align: 'right' })

    return currentY + 15
  }

  private addPaymentTerms(doc: jsPDF, data: BudgetData, template: PDFTemplate, startY: number) {
    if (!data.paymentTerms) return startY

    const [r, g, b] = this.hexToRgb(template.accentColor)
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFillColor(r, g, b)
    doc.roundedRect(15, startY, pageWidth - 30, 8, 2, 2, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(template.fontFamily, 'bold')
    doc.text('CONDIÇÕES DE PAGAMENTO', 20, startY + 5)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont(template.fontFamily, 'normal')

    const lines = doc.splitTextToSize(data.paymentTerms, pageWidth - 40)
    doc.text(lines, 20, startY + 13)

    return startY + 13 + (lines.length * 5) + 5
  }

  private addObservations(doc: jsPDF, data: BudgetData, template: PDFTemplate, startY: number) {
    if (!data.observations && !data.notes) return startY

    const observations = data.observations || data.notes || ''
    const [r, g, b] = this.hexToRgb(template.accentColor)
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFillColor(r, g, b)
    doc.roundedRect(15, startY, pageWidth - 30, 8, 2, 2, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(template.fontFamily, 'bold')
    doc.text('OBSERVAÇÕES', 20, startY + 5)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont(template.fontFamily, 'normal')

    const lines = doc.splitTextToSize(observations, pageWidth - 40)
    doc.text(lines, 20, startY + 13)

    return startY + 13 + (lines.length * 5) + 5
  }

  generatePDF(data: BudgetData, template: PDFTemplate = defaultTemplates[0]): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    this.addHeader(doc, data, template)

    let currentY = template.headerHeight + 10
    currentY = this.addCustomerInfo(doc, data, template, currentY)
    currentY = this.addBudgetInfo(doc, data, template, currentY)
    currentY = this.addItemsTable(doc, data, template, currentY)
    currentY = this.addTotals(doc, data, template, currentY)
    currentY = this.addPaymentTerms(doc, data, template, currentY)
    currentY = this.addObservations(doc, data, template, currentY)

    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      this.addFooter(doc, template, i, totalPages)
    }

    return doc
  }

  async previewPDF(data: BudgetData, template: PDFTemplate = defaultTemplates[0]): Promise<string> {
    const doc = this.generatePDF(data, template)
    return doc.output('datauristring')
  }

  downloadPDF(data: BudgetData, template: PDFTemplate = defaultTemplates[0], filename?: string) {
    const doc = this.generatePDF(data, template)
    const name = filename || `Orcamento_${data.number}_${format(new Date(), 'ddMMyyyy')}.pdf`
    doc.save(name)
  }

  printPDF(data: BudgetData, template: PDFTemplate = defaultTemplates[0]) {
    const doc = this.generatePDF(data, template)
    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
  }

  async getPDFBlob(data: BudgetData, template: PDFTemplate = defaultTemplates[0]): Promise<Blob> {
    const doc = this.generatePDF(data, template)
    return doc.output('blob')
  }
}

export const budgetPDFService = new BudgetPDFService()
