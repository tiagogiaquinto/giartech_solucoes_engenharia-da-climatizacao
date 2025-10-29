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
  title?: string
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
  discount_amount?: number
  final_total?: number
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
    bank?: {
      name: string
      agency: string
      account: string
      type: string
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
  additional_notes?: string
  additional_info?: string
  signatures?: {
    company_representative: string
    company_role: string
    client_name: string
    client_document: string
  }
}

export const generateProposalPDFV2 = (proposalData: ProposalData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = 20

  // Cores
  const primaryColor: [number, number, number] = [23, 162, 184]
  const darkGray: [number, number, number] = [52, 58, 64]
  const lightGray: [number, number, number] = [248, 249, 250]

  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - 25) {
      addFooter()
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  const addFooter = () => {
    const currentPage = doc.getCurrentPageInfo().pageNumber
    doc.setDrawColor(...lightGray)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 5, pageWidth - margin, pageHeight - 5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...darkGray)
    doc.text(`Página ${currentPage}`, pageWidth / 2, pageHeight - 2, { align: 'center' })
  }

  // =====================================================
  // CABEÇALHO DA EMPRESA
  // =====================================================

  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 55, 'F')

  // Logo circular
  doc.setFillColor(255, 255, 255)
  doc.circle(25, 25, 12, 'F')
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  const initial = proposalData.company.name.charAt(0).toUpperCase()
  doc.text(initial, 25, 30, { align: 'center' })

  // Nome da empresa
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text(proposalData.company.name, 42, 20)

  // Dados da empresa (esquerda)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  let yHeader = 26
  doc.text(proposalData.company.owner, 42, yHeader)
  yHeader += 3.5
  doc.text(`CNPJ: ${proposalData.company.cnpj}`, 42, yHeader)
  yHeader += 3.5
  doc.text(proposalData.company.address, 42, yHeader)
  yHeader += 3.5
  doc.text(`${proposalData.company.city}-${proposalData.company.state}${proposalData.company.cep ? ' • CEP ' + proposalData.company.cep : ''}`, 42, yHeader)

  // Dados de contato (direita)
  const rightX = pageWidth - margin
  doc.text(new Date(proposalData.date).toLocaleDateString('pt-BR'), rightX, 15, { align: 'right' })
  yHeader = 26
  doc.text(proposalData.company.email, rightX, yHeader, { align: 'right' })
  yHeader += 3.5
  proposalData.company.phones.forEach(phone => {
    doc.text(phone, rightX, yHeader, { align: 'right' })
    yHeader += 3.5
  })

  // Tagline
  if (proposalData.company.tagline) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.text(proposalData.company.tagline, pageWidth / 2, 52, { align: 'center' })
  }

  yPos = 65

  // =====================================================
  // TÍTULO DA PROPOSTA
  // =====================================================

  doc.setFillColor(...primaryColor)
  doc.rect(margin, yPos, pageWidth - 2 * margin, proposalData.title ? 18 : 12, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(`PROPOSTA ${proposalData.order_number}`, pageWidth / 2, yPos + 8, { align: 'center' })

  if (proposalData.title) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(proposalData.title, pageWidth / 2, yPos + 14, { align: 'center' })
    yPos += 24
  } else {
    yPos += 18
  }

  // =====================================================
  // DADOS DO CLIENTE
  // =====================================================

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text(`Cliente: ${proposalData.client.name}`, margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  if (proposalData.client.company_name) {
    doc.text(proposalData.client.company_name, margin + 3, yPos)
    yPos += 4
  }

  if (proposalData.client.cnpj) {
    doc.text(`CNPJ: ${proposalData.client.cnpj}`, margin + 3, yPos)
    yPos += 4
  }

  if (proposalData.client.address) {
    const fullAddress = [
      proposalData.client.address,
      proposalData.client.city && proposalData.client.state ? `${proposalData.client.city}-${proposalData.client.state}` : null,
      proposalData.client.cep ? `CEP ${proposalData.client.cep}` : null
    ].filter(Boolean).join(', ')

    const addressLines = doc.splitTextToSize(fullAddress, pageWidth - 2 * margin - 6)
    doc.text(addressLines, margin + 3, yPos)
    yPos += addressLines.length * 4
  }

  if (proposalData.client.phone) {
    doc.text(`☎ ${proposalData.client.phone}`, margin + 3, yPos)
    yPos += 4
  }

  if (proposalData.client.email) {
    doc.text(`✉ ${proposalData.client.email}`, margin + 3, yPos)
    yPos += 4
  }

  yPos += 4

  // =====================================================
  // INFORMAÇÕES BÁSICAS
  // =====================================================

  checkPageBreak(30)

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Informações do Serviço', margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  doc.text(`Prazo: ${proposalData.basic_info.deadline}`, margin + 3, yPos)
  yPos += 4

  if (proposalData.basic_info.brand) {
    doc.text(`Marca: ${proposalData.basic_info.brand}`, margin + 3, yPos)
    yPos += 4
  }

  if (proposalData.basic_info.model) {
    doc.text(`Modelo: ${proposalData.basic_info.model}`, margin + 3, yPos)
    yPos += 4
  }

  if (proposalData.basic_info.equipment) {
    doc.text(`Equipamento: ${proposalData.basic_info.equipment}`, margin + 3, yPos)
    yPos += 4
  }

  yPos += 4

  // =====================================================
  // SERVIÇOS E PRODUTOS
  // =====================================================

  checkPageBreak(40)

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Serviços e Produtos', margin + 3, yPos + 5.5)

  yPos += 12

  // Tabela de serviços
  const tableData = proposalData.items.map(item => {
    const row = [
      item.description + (item.scope ? `\n${item.scope}` : ''),
      item.unit,
      item.quantity.toString()
    ]

    if (proposalData.show_value !== false) {
      row.push(
        `R$ ${item.unit_price.toFixed(2)}`,
        `R$ ${item.total_price.toFixed(2)}`
      )
    }

    return row
  })

  const columns = proposalData.show_value !== false
    ? ['Descrição', 'Un.', 'Qtd', 'Preço Unit.', 'Total']
    : ['Descrição', 'Un.', 'Qtd']

  autoTable(doc, {
    startY: yPos,
    head: [columns],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: darkGray
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: proposalData.show_value !== false ? {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    } : {
      0: { cellWidth: 130 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  })

  yPos = (doc as any).lastAutoTable.finalY + 5

  // Totais
  if (proposalData.show_value !== false) {
    const totalsX = pageWidth - margin - 50

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...darkGray)

    doc.text('Subtotal:', totalsX, yPos, { align: 'right' })
    doc.text(`R$ ${proposalData.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
    yPos += 5

    if (proposalData.discount > 0 || proposalData.discount_amount) {
      const discountValue = proposalData.discount_amount || proposalData.discount
      doc.setTextColor(231, 76, 60)
      doc.text('Desconto:', totalsX, yPos, { align: 'right' })
      doc.text(`- R$ ${discountValue.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
      yPos += 5
    }

    // Linha
    doc.setDrawColor(...darkGray)
    doc.setLineWidth(1)
    doc.line(totalsX - 10, yPos, pageWidth - margin, yPos)
    yPos += 7

    // Total final
    doc.setFillColor(...primaryColor)
    doc.rect(totalsX - 15, yPos - 5, pageWidth - totalsX + 15 - margin, 10, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL:', totalsX, yPos + 2, { align: 'right' })
    doc.text(`R$ ${(proposalData.final_total || proposalData.total).toFixed(2)}`, pageWidth - margin - 3, yPos + 2, { align: 'right' })

    yPos += 15
  }

  // =====================================================
  // ESCOPO DETALHADO
  // =====================================================

  if (proposalData.escopo_detalhado) {
    checkPageBreak(50)

    doc.setFillColor(219, 234, 254)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(30, 64, 175)
    doc.text('Escopo Detalhado do Serviço', margin + 3, yPos + 5.5)

    yPos += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...darkGray)

    const escopoLines = doc.splitTextToSize(proposalData.escopo_detalhado, pageWidth - 2 * margin - 6)
    doc.text(escopoLines, margin + 3, yPos)
    yPos += escopoLines.length * 3.5 + 8
  }

  // =====================================================
  // RELATÓRIO TÉCNICO
  // =====================================================

  if (proposalData.relatorio_tecnico) {
    checkPageBreak(50)

    doc.setFillColor(254, 243, 199)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(146, 64, 14)
    doc.text('Relatório Técnico', margin + 3, yPos + 5.5)

    yPos += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...darkGray)

    const relatorioLines = doc.splitTextToSize(proposalData.relatorio_tecnico, pageWidth - 2 * margin - 6)
    doc.text(relatorioLines, margin + 3, yPos)
    yPos += relatorioLines.length * 3.5 + 8
  }

  // =====================================================
  // ORIENTAÇÕES DE SERVIÇO
  // =====================================================

  if (proposalData.orientacoes_servico) {
    checkPageBreak(50)

    doc.setFillColor(220, 252, 231)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(20, 83, 45)
    doc.text('Orientações de Serviço', margin + 3, yPos + 5.5)

    yPos += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...darkGray)

    const orientacoesLines = doc.splitTextToSize(proposalData.orientacoes_servico, pageWidth - 2 * margin - 6)
    doc.text(orientacoesLines, margin + 3, yPos)
    yPos += orientacoesLines.length * 3.5 + 8
  }

  // =====================================================
  // NOVA PÁGINA: PAGAMENTO, GARANTIA E CONTRATO
  // =====================================================

  if (yPos > pageHeight - 100) {
    addFooter()
    doc.addPage()
    yPos = margin
  }

  // =====================================================
  // PAGAMENTO
  // =====================================================

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Forma de Pagamento', margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  // Métodos de pagamento
  doc.text(`Métodos: ${proposalData.payment.methods}`, margin + 3, yPos)
  yPos += 5

  // PIX
  if (proposalData.payment.pix) {
    doc.text(`PIX: ${proposalData.payment.pix}`, margin + 3, yPos)
    yPos += 5
  }

  // Dados bancários
  const bankDetails = proposalData.payment.bank_details || proposalData.payment.bank
  if (bankDetails) {
    doc.setFont('helvetica', 'bold')
    doc.text('Dados bancários:', margin + 3, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')

    const bank = 'name' in bankDetails ? bankDetails.name : bankDetails.bank
    const agency = bankDetails.agency
    const account = bankDetails.account
    const type = 'type' in bankDetails ? bankDetails.type : bankDetails.account_type
    const holder = bankDetails.holder

    doc.text(`Banco: ${bank} | Ag: ${agency} | Conta: ${account}`, margin + 3, yPos)
    yPos += 4
    doc.text(`Tipo: ${type} | Titular: ${holder}`, margin + 3, yPos)
    yPos += 5
  }

  // Condições de pagamento
  doc.setFont('helvetica', 'bold')
  doc.text('Condições:', margin + 3, yPos)
  yPos += 5
  doc.setFont('helvetica', 'normal')

  const conditionsLines = doc.splitTextToSize(proposalData.payment.conditions, pageWidth - 2 * margin - 6)
  doc.text(conditionsLines, margin + 3, yPos)
  yPos += conditionsLines.length * 4 + 8

  // =====================================================
  // GARANTIA
  // =====================================================

  checkPageBreak(50)

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Garantia', margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...darkGray)

  if (proposalData.warranty.period) {
    doc.text(`Período: ${proposalData.warranty.period}`, margin + 3, yPos)
    yPos += 6
  }

  const warrantyText = typeof proposalData.warranty.conditions === 'string'
    ? proposalData.warranty.conditions
    : Array.isArray(proposalData.warranty.conditions)
    ? proposalData.warranty.conditions.join('\n\n')
    : ''

  const warrantyLines = doc.splitTextToSize(warrantyText, pageWidth - 2 * margin - 6)
  doc.text(warrantyLines, margin + 3, yPos)
  yPos += warrantyLines.length * 3.5 + 10

  // =====================================================
  // CONTRATO
  // =====================================================

  checkPageBreak(60)

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Contrato de Prestação de Serviços', margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...darkGray)

  if (typeof proposalData.contract_clauses === 'string') {
    const contractLines = doc.splitTextToSize(proposalData.contract_clauses, pageWidth - 2 * margin - 6)
    doc.text(contractLines, margin + 3, yPos)
    yPos += contractLines.length * 3.5
  } else if (Array.isArray(proposalData.contract_clauses)) {
    proposalData.contract_clauses.forEach(clause => {
      checkPageBreak(20)
      doc.setFont('helvetica', 'bold')
      doc.text(clause.title, margin + 3, yPos)
      yPos += 5
      doc.setFont('helvetica', 'normal')

      clause.items.forEach(item => {
        const itemLines = doc.splitTextToSize(`• ${item}`, pageWidth - 2 * margin - 6)
        doc.text(itemLines, margin + 3, yPos)
        yPos += itemLines.length * 3.5
      })
      yPos += 3
    })
  }

  yPos += 8

  // =====================================================
  // INFORMAÇÕES ADICIONAIS
  // =====================================================

  const additionalText = proposalData.additional_notes || proposalData.additional_info
  if (additionalText) {
    checkPageBreak(30)

    doc.setFillColor(...lightGray)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...primaryColor)
    doc.text('Observações', margin + 3, yPos + 5.5)

    yPos += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)

    const obsLines = doc.splitTextToSize(additionalText, pageWidth - 2 * margin - 6)
    doc.text(obsLines, margin + 3, yPos)
    yPos += obsLines.length * 4 + 8
  }

  // =====================================================
  // ASSINATURAS
  // =====================================================

  checkPageBreak(40)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  const centerY = yPos
  doc.text(`${proposalData.company.city}, ${new Date(proposalData.date).toLocaleDateString('pt-BR')}`, pageWidth / 2, centerY, { align: 'center' })

  yPos += 25

  // Assinatura empresa
  const lineStartX = margin + 10
  const lineEndX = pageWidth / 2 - 10
  doc.line(lineStartX, yPos, lineEndX, yPos)
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text(proposalData.company.name, (lineStartX + lineEndX) / 2, yPos, { align: 'center' })
  yPos += 4
  doc.setFont('helvetica', 'normal')
  doc.text(proposalData.company.owner, (lineStartX + lineEndX) / 2, yPos, { align: 'center' })

  // Assinatura cliente
  const lineStartX2 = pageWidth / 2 + 10
  const lineEndX2 = pageWidth - margin - 10
  yPos -= 9
  doc.line(lineStartX2, yPos, lineEndX2, yPos)
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text(proposalData.client.name, (lineStartX2 + lineEndX2) / 2, yPos, { align: 'center' })
  yPos += 4
  doc.setFont('helvetica', 'normal')
  if (proposalData.client.cnpj) {
    doc.text(`CNPJ ${proposalData.client.cnpj}`, (lineStartX2 + lineEndX2) / 2, yPos, { align: 'center' })
  }

  // =====================================================
  // RODAPÉ FINAL
  // =====================================================

  addFooter()

  // Atualizar contagem de páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...darkGray)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 2, { align: 'center' })
  }

  doc.save(`Proposta_${proposalData.order_number}.pdf`)
}

export default generateProposalPDFV2
