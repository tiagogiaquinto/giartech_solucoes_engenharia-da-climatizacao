import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCompanyInfo } from './companyData'

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
    cep?: string
    email: string
    phones: string[]
    social?: {
      instagram?: string
      facebook?: string
      website?: string
    }
    tagline?: string
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
  show_value?: boolean
  relatorio_tecnico?: string
  orientacoes_servico?: string
  escopo_detalhado?: string
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
    period?: string
    conditions: string | string[]
  }
  contract_clauses: string | {
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

export const generateProposalPDF = async (proposal: ProposalData): Promise<void> => {
  const companyInfo = await getCompanyInfo()
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPos = 20

  const tealColor: [number, number, number] = [15, 118, 110]
  const tealLightColor: [number, number, number] = [20, 184, 166]

  const addNewPageIfNeeded = (spaceNeeded: number) => {
    if (yPos + spaceNeeded > pageHeight - 20) {
      pdf.addPage()
      yPos = 20
      return true
    }
    return false
  }

  pdf.setFillColor(...tealColor)
  pdf.rect(0, 0, pageWidth, 50, 'F')

  pdf.setFillColor(255, 255, 255)
  pdf.circle(25, 25, 8, 'F')
  pdf.setTextColor(...tealColor)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('G', 25, 28, { align: 'center' })

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text(companyInfo.name, 38, 22)

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(proposal.company.owner || 'Diretor', 38, 28)
  pdf.text(`CNPJ: ${companyInfo.cnpj}`, 38, 33)

  pdf.setFontSize(9)
  pdf.text(`${companyInfo.address}`, 38, 38)
  pdf.text(`${companyInfo.city}-${companyInfo.state} • CEP ${companyInfo.zip}`, 38, 42)

  const rightX = pageWidth - 15
  pdf.setFontSize(9)
  pdf.text(proposal.date, rightX, 22, { align: 'right' })
  pdf.text(companyInfo.email, rightX, 27, { align: 'right' })
  pdf.text(companyInfo.phone, rightX, 32, { align: 'right' })
  if (companyInfo.instagram) {
    pdf.text(companyInfo.instagram, rightX, 37, { align: 'right' })
  }

  yPos = 60

  pdf.setFillColor(...tealColor)
  pdf.rect(15, yPos, pageWidth - 30, 12, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`PROPOSTA ${proposal.order_number}`, pageWidth / 2, yPos + 8, { align: 'center' })

  yPos += 20
  pdf.setTextColor(0, 0, 0)

  pdf.setFillColor(249, 250, 251)
  pdf.rect(15, yPos, pageWidth - 30, 30, 'F')
  pdf.setDrawColor(229, 231, 235)
  pdf.rect(15, yPos, pageWidth - 30, 30, 'S')

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...tealColor)
  pdf.text(`Cliente: ${proposal.client.name}`, 20, yPos + 8)

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(0, 0, 0)
  let clientYPos = yPos + 14

  if (proposal.client.company_name) {
    pdf.text(proposal.client.company_name, 20, clientYPos)
    clientYPos += 5
  }
  if (proposal.client.cnpj) {
    pdf.text(`CNPJ: ${proposal.client.cnpj}`, 20, clientYPos)
    clientYPos += 5
  }
  if (proposal.client.phone && proposal.client.email) {
    pdf.text(`${proposal.client.phone} • ${proposal.client.email}`, 20, clientYPos)
    clientYPos += 5
  }

  if (proposal.client.address) {
    const fullAddress = [
      proposal.client.address,
      proposal.client.city,
      proposal.client.state,
      proposal.client.cep && `CEP: ${proposal.client.cep}`
    ].filter(Boolean).join(', ')

    const addressLines = pdf.splitTextToSize(fullAddress, pageWidth - 40)
    pdf.text(addressLines, 20, clientYPos)
    clientYPos += addressLines.length * 5
  }

  yPos = clientYPos + 10

  addNewPageIfNeeded(30)

  pdf.setFillColor(249, 250, 251)
  pdf.rect(15, yPos, pageWidth - 30, 25, 'F')
  pdf.setDrawColor(229, 231, 235)
  pdf.rect(15, yPos, pageWidth - 30, 25, 'S')

  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...tealColor)
  pdf.text('Informações do Serviço', 20, yPos + 8)

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(0, 0, 0)
  pdf.text(`Prazo: ${proposal.basic_info.deadline}`, 20, yPos + 14)

  let infoX = 80
  if (proposal.basic_info.brand) {
    pdf.text(`Marca: ${proposal.basic_info.brand}`, infoX, yPos + 14)
    infoX += 50
  }
  if (proposal.basic_info.model) {
    pdf.text(`Modelo: ${proposal.basic_info.model}`, infoX, yPos + 14)
  }

  if (proposal.basic_info.equipment) {
    pdf.text(`Equipamento: ${proposal.basic_info.equipment}`, 20, yPos + 20)
  }

  yPos += 33

  addNewPageIfNeeded(60)

  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...tealColor)
  pdf.text('Serviços e Produtos', 20, yPos)
  yPos += 5

  const showValues = proposal.show_value !== false

  const tableData = proposal.items.map(item => {
    const description = item.description + (item.scope ? '\n\nEscopo: ' + item.scope : '')

    if (showValues) {
      return [
        description,
        item.unit,
        item.quantity.toString(),
        `R$ ${item.unit_price.toFixed(2)}`,
        `R$ ${item.total_price.toFixed(2)}`
      ]
    } else {
      return [
        description,
        item.unit,
        item.quantity.toString()
      ]
    }
  })

  const tableHeaders = showValues
    ? [['Descrição', 'Un.', 'Qtd', 'Preço Unit.', 'Total']]
    : [['Descrição', 'Un.', 'Qtd']]

  const columnStyles: any = showValues ? {
    0: { cellWidth: 80 },
    1: { cellWidth: 20, halign: 'center' },
    2: { cellWidth: 20, halign: 'center' },
    3: { cellWidth: 30, halign: 'right' },
    4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
  } : {
    0: { cellWidth: 130 },
    1: { cellWidth: 30, halign: 'center' },
    2: { cellWidth: 20, halign: 'center' }
  }

  autoTable(pdf, {
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: tealColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: columnStyles,
    margin: { left: 15, right: 15 }
  })

  yPos = (pdf as any).lastAutoTable.finalY + 5

  if (showValues) {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.text(`Subtotal:`, pageWidth - 70, yPos)
    pdf.text(`R$ ${proposal.subtotal.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' })

    if (proposal.discount > 0) {
      yPos += 6
      pdf.setTextColor(220, 38, 38)
      pdf.text(`Desconto:`, pageWidth - 70, yPos)
      pdf.text(`- R$ ${proposal.discount.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' })
    }
  }

  if (showValues) {
    yPos += 8
    pdf.setFillColor(...tealColor)
    pdf.rect(15, yPos - 5, pageWidth - 30, 10, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.text('TOTAL:', pageWidth - 70, yPos)
    pdf.text(`R$ ${proposal.total.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' })
  }

  yPos += 15

  if (proposal.escopo_detalhado) {
    addNewPageIfNeeded(50)
    pdf.setFillColor(240, 249, 255)
    const scopeLines = pdf.splitTextToSize(proposal.escopo_detalhado, pageWidth - 40)
    const scopeHeight = scopeLines.length * 5 + 15

    pdf.rect(15, yPos, pageWidth - 30, scopeHeight, 'F')
    pdf.setDrawColor(191, 219, 254)
    pdf.rect(15, yPos, pageWidth - 30, scopeHeight, 'S')

    pdf.setTextColor(30, 64, 175)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text('Escopo Detalhado do Serviço', 20, yPos + 8)

    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(scopeLines, 20, yPos + 14)

    yPos += scopeHeight + 8
  }

  if (proposal.relatorio_tecnico) {
    addNewPageIfNeeded(50)
    pdf.setFillColor(254, 249, 231)
    const reportLines = pdf.splitTextToSize(proposal.relatorio_tecnico, pageWidth - 40)
    const reportHeight = reportLines.length * 5 + 15

    pdf.rect(15, yPos, pageWidth - 30, reportHeight, 'F')
    pdf.setDrawColor(253, 224, 71)
    pdf.rect(15, yPos, pageWidth - 30, reportHeight, 'S')

    pdf.setTextColor(146, 64, 14)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text('Relatório Técnico', 20, yPos + 8)

    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(reportLines, 20, yPos + 14)

    yPos += reportHeight + 8
  }

  if (proposal.orientacoes_servico) {
    addNewPageIfNeeded(50)
    pdf.setFillColor(240, 253, 244)
    const instructionsLines = pdf.splitTextToSize(proposal.orientacoes_servico, pageWidth - 40)
    const instructionsHeight = instructionsLines.length * 5 + 15

    pdf.rect(15, yPos, pageWidth - 30, instructionsHeight, 'F')
    pdf.setDrawColor(134, 239, 172)
    pdf.rect(15, yPos, pageWidth - 30, instructionsHeight, 'S')

    pdf.setTextColor(21, 128, 61)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text('Orientações de Serviço', 20, yPos + 8)

    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(instructionsLines, 20, yPos + 14)

    yPos += instructionsHeight + 8
  }

  addNewPageIfNeeded(50)

  pdf.setFillColor(249, 250, 251)
  pdf.rect(15, yPos, pageWidth - 30, 45, 'F')
  pdf.setDrawColor(229, 231, 235)
  pdf.rect(15, yPos, pageWidth - 30, 45, 'S')

  pdf.setTextColor(...tealColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('Forma de Pagamento', 20, yPos + 8)

  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)

  let payYPos = yPos + 14
  pdf.text(`Métodos: ${proposal.payment.methods}`, 20, payYPos)

  if (proposal.payment.pix) {
    payYPos += 5
    pdf.text(`PIX: ${proposal.payment.pix}`, 20, payYPos)
  }

  if (proposal.payment.bank_details) {
    payYPos += 5
    const bank = proposal.payment.bank_details
    pdf.text(`Banco: ${bank.bank} | Ag: ${bank.agency} | Conta: ${bank.account}`, 20, payYPos)
  }

  payYPos += 5
  const conditionsLines = pdf.splitTextToSize(proposal.payment.conditions, pageWidth - 50)
  pdf.text(conditionsLines, 20, payYPos)

  yPos += 53

  addNewPageIfNeeded(40)

  pdf.setFillColor(249, 250, 251)
  pdf.rect(15, yPos, pageWidth - 30, 35, 'F')
  pdf.setDrawColor(229, 231, 235)
  pdf.rect(15, yPos, pageWidth - 30, 35, 'S')

  pdf.setTextColor(...tealColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('Garantia', 20, yPos + 8)

  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  if (proposal.warranty.period) {
    pdf.text(`Período: ${proposal.warranty.period}`, 20, yPos + 14)
  }

  let warrantyYPos = yPos + 20
  const conditions = Array.isArray(proposal.warranty.conditions)
    ? proposal.warranty.conditions
    : [proposal.warranty.conditions]

  conditions.slice(0, 3).forEach(condition => {
    const lines = pdf.splitTextToSize(`• ${condition}`, pageWidth - 50)
    pdf.text(lines, 20, warrantyYPos)
    warrantyYPos += lines.length * 4
  })

  yPos += 43

  addNewPageIfNeeded(30)

  if (proposal.additional_info) {
    pdf.setFillColor(249, 250, 251)
    const infoHeight = Math.min(30, (pdf.splitTextToSize(proposal.additional_info, pageWidth - 50).length * 5) + 15)
    pdf.rect(15, yPos, pageWidth - 30, infoHeight, 'F')
    pdf.setDrawColor(229, 231, 235)
    pdf.rect(15, yPos, pageWidth - 30, infoHeight, 'S')

    pdf.setTextColor(...tealColor)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text('Observações', 20, yPos + 8)

    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const infoLines = pdf.splitTextToSize(proposal.additional_info, pageWidth - 50)
    pdf.text(infoLines.slice(0, 3), 20, yPos + 14)

    yPos += infoHeight + 8
  }

  if (proposal.signatures) {
    addNewPageIfNeeded(40)

    pdf.setDrawColor(200, 200, 200)
    pdf.line(15, yPos, pageWidth - 15, yPos)
    yPos += 8

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text(`${proposal.client.city}, ${proposal.date}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 15

    const sigWidth = (pageWidth - 50) / 2

    pdf.line(20, yPos, 20 + sigWidth, yPos)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text(proposal.signatures.company_representative, 20 + sigWidth / 2, yPos + 5, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(companyInfo.name, 20 + sigWidth / 2, yPos + 10, { align: 'center' })
    pdf.text(proposal.signatures.company_role, 20 + sigWidth / 2, yPos + 14, { align: 'center' })

    const rightSigX = pageWidth - 20 - sigWidth
    pdf.line(rightSigX, yPos, pageWidth - 20, yPos)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(proposal.signatures.client_name, rightSigX + sigWidth / 2, yPos + 5, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(proposal.signatures.client_document, rightSigX + sigWidth / 2, yPos + 10, { align: 'center' })
  }

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

  pdf.save(`Proposta_${proposal.order_number}.pdf`)
}
