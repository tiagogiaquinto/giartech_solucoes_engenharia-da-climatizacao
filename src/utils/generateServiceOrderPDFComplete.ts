import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCompanyInfo } from './companyData'
import { ServiceItemComplete, generateServiceDescription } from './serviceOrderDataMapper'

type ServiceItem = ServiceItemComplete

interface Material {
  material_id?: string
  material_name: string
  description?: string
  unit?: string
  unit_price: number
  quantity: number
  total_price: number
}

interface ServiceOrderData {
  order_number: string
  service_type?: string
  client: {
    name: string
    company_name?: string
    cnpj?: string
    email?: string
    phone?: string
    address_street?: string
    address_number?: string
    address_neighborhood?: string
    address_city?: string
    address_state?: string
    address_zipcode?: string
  }
  services: ServiceItem[]
  materials: Material[]
  subtotal_services: number
  subtotal_materials: number
  subtotal: number
  discount: number
  final_total: number
  payment_method?: string
  payment_terms?: string
  additional_info?: string
  warranty_period?: string
  warranty_terms?: string
  created_at: string
}

export const generateServiceOrderPDFComplete = async (orderData: ServiceOrderData) => {
  const companyInfo = await getCompanyInfo()

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = 20

  // Cores
  const primaryColor: [number, number, number] = [23, 162, 184] // Teal
  const darkGray: [number, number, number] = [52, 58, 64]
  const lightGray: [number, number, number] = [248, 249, 250]

  // =====================================================
  // CABEÇALHO DA EMPRESA
  // =====================================================

  // Fundo cinza claro
  doc.setFillColor(...lightGray)
  doc.rect(0, 0, pageWidth, 60, 'F')

  // Nome da empresa (esquerda)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...primaryColor)
  doc.text(companyInfo.name, margin, 20)

  // Dados da empresa (esquerda)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  let yCompany = 28
  doc.text(companyInfo.owner || 'Proprietário', margin, yCompany)
  yCompany += 4
  doc.text(`CNPJ: ${companyInfo.cnpj}`, margin, yCompany)
  yCompany += 4
  doc.text(`${companyInfo.address}`, margin, yCompany)
  yCompany += 4
  doc.text(`${companyInfo.city}-${companyInfo.state} • CEP ${companyInfo.zip}`, margin, yCompany)

  // Dados de contato (direita)
  const rightX = pageWidth - margin - 5
  let yContact = 28
  doc.setTextColor(...darkGray)
  doc.text(companyInfo.email, rightX, yContact, { align: 'right' })
  yContact += 4
  doc.text(companyInfo.phone, rightX, yContact, { align: 'right' })
  yContact += 4
  if (companyInfo.instagram) {
    doc.text(`@${companyInfo.instagram}`, rightX, yContact, { align: 'right' })
  }

  // Data de geração (canto superior direito)
  doc.setFontSize(8)
  doc.text(new Date().toLocaleString('pt-BR'), rightX, 15, { align: 'right' })

  yPos = 70

  // =====================================================
  // TÍTULO DA ORDEM DE SERVIÇO
  // =====================================================

  doc.setFillColor(...primaryColor)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(`Ordem de serviço ${orderData.order_number}`, pageWidth / 2, yPos + 8, { align: 'center' })

  if (orderData.service_type) {
    doc.setFontSize(10)
    doc.text(orderData.service_type, pageWidth / 2, yPos + 14, { align: 'center' })
    yPos += 18
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
  doc.text(`Cliente: ${orderData.client.name}`, margin + 3, yPos + 5.5)

  yPos += 12

  // Informações do cliente
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  if (orderData.client.company_name) {
    doc.text(orderData.client.company_name, margin + 3, yPos)
    yPos += 4
  }

  if (orderData.client.cnpj) {
    doc.text(`CNPJ: ${orderData.client.cnpj}`, margin + 3, yPos)
    yPos += 4
  }

  // Endereço completo
  if (orderData.client.address_street) {
    const fullAddress = [
      orderData.client.address_street,
      orderData.client.address_number,
      orderData.client.address_neighborhood,
      `${orderData.client.address_city}-${orderData.client.address_state}`,
      `CEP ${orderData.client.address_zipcode}`
    ].filter(Boolean).join(', ')

    doc.text(fullAddress, margin + 3, yPos)
    yPos += 4
  }

  // Telefone (direita)
  if (orderData.client.phone) {
    doc.setFont('helvetica', 'bold')
    doc.text(`☎ ${orderData.client.phone}`, pageWidth - margin - 5, yPos - 8, { align: 'right' })
  }

  yPos += 8

  // =====================================================
  // SERVIÇOS
  // =====================================================

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Serviços', margin + 3, yPos + 5.5)

  yPos += 12

  // Tabela de serviços
  const servicesData = orderData.services.map(service => [
    service.service_name + (service.description ? `\n${service.description}` : ''),
    service.unit,
    `R$ ${service.unit_price.toFixed(2)}`,
    service.quantity.toString(),
    `R$ ${service.total_price.toFixed(2)}`
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Descrição', 'Unidade', 'Preço unitário', 'Qtd.', 'Preço']],
    body: servicesData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: darkGray
    },
    headStyles: {
      fillColor: lightGray,
      textColor: darkGray,
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // =====================================================
  // MATERIAIS
  // =====================================================

  if (orderData.materials && orderData.materials.length > 0) {
    doc.setFillColor(...lightGray)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...primaryColor)
    doc.text('Materiais', margin + 3, yPos + 5.5)

    yPos += 12

    const materialsData = orderData.materials.map(material => [
      material.material_name + (material.description ? `\n${material.description}` : ''),
      material.unit || '',
      `R$ ${material.unit_price.toFixed(2)}`,
      material.quantity.toString(),
      `R$ ${material.total_price.toFixed(2)}`
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Unidade', 'Preço unitário', 'Qtd.', 'Preço']],
      body: materialsData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: darkGray
      },
      headStyles: {
        fillColor: lightGray,
        textColor: darkGray,
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // =====================================================
  // TOTAIS
  // =====================================================

  const totalsX = pageWidth - margin - 60

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...darkGray)

  // Serviços
  doc.text('Serviços', totalsX, yPos, { align: 'right' })
  doc.text(`R$ ${orderData.subtotal_services.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
  yPos += 6

  // Materiais
  doc.text('Materiais', totalsX, yPos, { align: 'right' })
  doc.text(`R$ ${orderData.subtotal_materials.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
  yPos += 6

  // Linha
  doc.setDrawColor(...darkGray)
  doc.line(totalsX - 10, yPos, pageWidth - margin, yPos)
  yPos += 6

  // Subtotal
  doc.setFont('helvetica', 'bold')
  doc.text('Subtotal', totalsX, yPos, { align: 'right' })
  doc.text(`R$ ${orderData.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
  yPos += 6

  // Desconto
  if (orderData.discount > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(231, 76, 60) // Vermelho
    doc.text('Desconto sobre serviços', totalsX, yPos, { align: 'right' })
    doc.text(`- R$ ${orderData.discount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
    yPos += 6
  }

  // Linha dupla
  doc.setDrawColor(...darkGray)
  doc.setLineWidth(1)
  doc.line(totalsX - 10, yPos, pageWidth - margin, yPos)
  yPos += 2
  doc.line(totalsX - 10, yPos, pageWidth - margin, yPos)
  yPos += 6
  doc.setLineWidth(0.1)

  // Total
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...darkGray)
  doc.text('Total', totalsX, yPos, { align: 'right' })
  doc.text(`R$ ${orderData.final_total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })

  yPos += 15

  // =====================================================
  // PAGAMENTO
  // =====================================================

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Pagamento', margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  // Meios de pagamento
  doc.setFont('helvetica', 'bold')
  doc.text('Meios de pagamento', margin + 3, yPos)
  yPos += 5
  doc.setFont('helvetica', 'normal')
  doc.text('Transferência bancária, dinheiro, cartão de crédito, cartão', margin + 3, yPos)
  yPos += 4
  doc.text('de débito ou pix.', margin + 3, yPos)
  yPos += 8

  // PIX
  doc.setFont('helvetica', 'bold')
  doc.text('PIX', margin + 3, yPos)
  yPos += 5
  doc.setFont('helvetica', 'normal')
  doc.text(companyInfo.pix || companyInfo.cnpj, margin + 3, yPos)
  yPos += 8

  // Verificar quebra de página
  if (yPos > pageHeight - 80) {
    doc.addPage()
    yPos = margin
  }

  // Dados bancários
  doc.setFont('helvetica', 'bold')
  doc.text('Dados bancários', margin + 3, yPos)
  yPos += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`Banco: ${companyInfo.bank_name || 'Cora'}`, margin + 3, yPos)
  yPos += 4
  doc.text(`Agência: ${companyInfo.bank_agency || '0001'}`, margin + 3, yPos)
  yPos += 4
  doc.text(`Conta: ${companyInfo.bank_account || ''}`, margin + 3, yPos)
  yPos += 4
  doc.text(`Tipo de conta: ${companyInfo.account_type || 'Corrente'}`, margin + 3, yPos)
  yPos += 4
  doc.text(`Titular da conta (CPF/CNPJ): ${companyInfo.cnpj}`, margin + 3, yPos)
  yPos += 8

  // Condições de pagamento (direita)
  const rightCondX = pageWidth / 2 + 10
  let yConditions = yPos - 33
  doc.setFont('helvetica', 'bold')
  doc.text('Condições de pagamento', rightCondX, yConditions)
  yConditions += 5
  doc.setFont('helvetica', 'normal')
  doc.text(orderData.payment_terms || 'À vista.', rightCondX, yConditions)

  // =====================================================
  // INFORMAÇÕES ADICIONAIS
  // =====================================================

  yPos += 8

  if (orderData.additional_info) {
    doc.setFillColor(...lightGray)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...primaryColor)
    doc.text('Informações adicionais', margin + 3, yPos + 5.5)

    yPos += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)

    const lines = doc.splitTextToSize(orderData.additional_info, pageWidth - 2 * margin - 6)
    doc.text(lines, margin + 3, yPos)
    yPos += lines.length * 4 + 8
  }

  // =====================================================
  // ASSINATURAS
  // =====================================================

  yPos += 10

  if (yPos > pageHeight - 40) {
    doc.addPage()
    yPos = margin
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  const centerY = yPos
  doc.text(`${orderData.client.address_city || 'São Paulo'}, ${new Date(orderData.created_at).toLocaleDateString('pt-BR')}`, pageWidth / 2, centerY, { align: 'center' })

  yPos += 25

  // Linha de assinatura empresa
  const lineStartX = margin + 10
  const lineEndX = pageWidth / 2 - 10
  doc.line(lineStartX, yPos, lineEndX, yPos)
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text(companyInfo.name, (lineStartX + lineEndX) / 2, yPos, { align: 'center' })
  yPos += 4
  doc.setFont('helvetica', 'normal')
  doc.text(companyInfo.owner || '', (lineStartX + lineEndX) / 2, yPos, { align: 'center' })

  // Linha de assinatura cliente
  const lineStartX2 = pageWidth / 2 + 10
  const lineEndX2 = pageWidth - margin - 10
  yPos -= 9
  doc.line(lineStartX2, yPos, lineEndX2, yPos)
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text(orderData.client.name, (lineStartX2 + lineEndX2) / 2, yPos, { align: 'center' })
  yPos += 4
  doc.setFont('helvetica', 'normal')
  if (orderData.client.cnpj) {
    doc.text(`CNPJ ${orderData.client.cnpj}`, (lineStartX2 + lineEndX2) / 2, yPos, { align: 'center' })
  }

  // =====================================================
  // RODAPÉ (todas as páginas)
  // =====================================================

  const totalPages = doc.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Linha separadora
    doc.setDrawColor(...lightGray)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20)

    // Informações de contato
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...darkGray)

    const footerY = pageHeight - 15
    doc.text(companyInfo.owner || '', margin, footerY)
    doc.text(`✉ ${companyInfo.email}`, margin, footerY + 3.5)
    doc.text(`CNPJ: ${companyInfo.cnpj}`, margin, footerY + 7)
    doc.text(`${companyInfo.address}`, margin, footerY + 10.5)

    const footerRightX = pageWidth - margin
    doc.text(`☎ ${companyInfo.phone}`, footerRightX, footerY + 3.5, { align: 'right' })
    if (companyInfo.whatsapp) {
      doc.text(`☎ ${companyInfo.whatsapp}`, footerRightX, footerY + 7, { align: 'right' })
    }

    // Redes sociais
    if (companyInfo.instagram) {
      doc.text(`@${companyInfo.instagram}`, margin + 60, footerY + 10.5)
    }

    // Número da página
    doc.setFont('helvetica', 'normal')
    doc.text(`Página ${i}/${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' })
  }

  return doc
}

export default generateServiceOrderPDFComplete
