import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ProposalItem {
  description: string
  scope?: string
  unit: string
  unit_price: number
  quantity: number
  total_price: number
}

interface ProposalData {
  order_number: string
  date: string
  client: {
    name: string
    company_name?: string
    cnpj?: string
    address?: string
    city?: string
    state?: string
    cep?: string
    email?: string
    phone?: string
  }
  company: {
    name: string
    owner: string
    cnpj: string
    address: string
    city: string
    state: string
    cep: string
    email: string
    phones: string[]
  }
  basic_info: {
    deadline: string
    brand?: string
    model?: string
    equipment?: string
  }
  items: ProposalItem[]
  subtotal: number
  discount: number
  total: number
  payment: {
    methods: string
    pix?: string
    bank_details?: {
      bank: string
      agency: string
      account: string
      account_type: string
      holder: string
    }
    conditions: string
  }
  warranty: {
    period: string
    conditions: string[]
  }
  contract_clauses: {
    title: string
    items: string[]
  }[]
  additional_info?: string
  signatures?: {
    company_representative: string
    company_role: string
    client_name: string
    client_document: string
  }
}

export const generateProposalPDFBase64 = (proposal: ProposalData): string => {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPos = 20

  const tealColor: [number, number, number] = [15, 118, 110]

  pdf.setFillColor(...tealColor)
  pdf.rect(0, 0, pageWidth, 40, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text(proposal.company.name, pageWidth / 2, 15, { align: 'center' })

  pdf.setFontSize(12)
  pdf.text(`PROPOSTA ${proposal.order_number}`, pageWidth / 2, 25, { align: 'center' })

  pdf.setFontSize(9)
  pdf.text(proposal.date, pageWidth / 2, 32, { align: 'center' })

  yPos = 50
  pdf.setTextColor(0, 0, 0)

  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Cliente: ${proposal.client.name}`, 20, yPos)
  yPos += 6

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  if (proposal.client.company_name) {
    pdf.text(proposal.client.company_name, 20, yPos)
    yPos += 5
  }

  yPos += 8

  const tableData = proposal.items.map(item => [
    item.description,
    item.unit,
    item.quantity.toString(),
    `R$ ${item.unit_price.toFixed(2)}`,
    `R$ ${item.total_price.toFixed(2)}`
  ])

  autoTable(pdf, {
    startY: yPos,
    head: [['Descrição', 'Un.', 'Qtd', 'Preço Unit.', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: tealColor,
      textColor: [255, 255, 255],
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  })

  yPos = (pdf as any).lastAutoTable.finalY + 10

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Subtotal: R$ ${proposal.subtotal.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' })

  if (proposal.discount > 0) {
    yPos += 6
    pdf.text(`Desconto: -R$ ${proposal.discount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' })
  }

  yPos += 8
  pdf.setFillColor(...tealColor)
  pdf.rect(15, yPos - 5, pageWidth - 30, 10, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(12)
  pdf.text(`TOTAL: R$ ${proposal.total.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' })

  yPos += 15
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Forma de Pagamento:', 20, yPos)
  yPos += 6
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(proposal.payment.methods, 20, yPos)

  if (proposal.payment.pix) {
    yPos += 5
    pdf.text(`PIX: ${proposal.payment.pix}`, 20, yPos)
  }

  yPos += 8
  pdf.text(proposal.payment.conditions, 20, yPos)

  const pageCount = (pdf as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  return pdf.output('datauristring').split(',')[1]
}
