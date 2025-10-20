import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { getCompanyInfo } from './companyData'

interface ServiceOrderData {
  order_number: string
  client: {
    name: string
    company_name?: string
    email?: string
    phone?: string
    address?: string
    address_city?: string
  }
  equipment?: string
  brand?: string
  model?: string
  serial_number?: string
  reported_issue?: string
  technician_notes?: string
  parts_used?: any[]
  service_type?: string
  priority?: string
  status: string
  scheduled_date?: string
  completion_date?: string
  estimated_cost?: number
  final_cost?: number
  payment_status?: string
  warranty_terms?: string
  created_at: string
  updated_at?: string
}

interface CompanyData {
  company_name?: string
  cnpj?: string
  address_street?: string
  address_number?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  address_zipcode?: string
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
  instagram?: string
  slogan?: string
  warranty_period?: string
}

export const generateServiceOrderPDF = async (
  orderData: ServiceOrderData,
  companyData?: CompanyData
) => {
  const companyInfo = await getCompanyInfo()

  const company = companyData || {
    company_name: companyInfo.name,
    cnpj: companyInfo.cnpj,
    address_street: companyInfo.address.split(',')[0],
    address_number: companyInfo.address.split(',')[1]?.trim(),
    address_neighborhood: companyInfo.neighborhood,
    address_city: companyInfo.city,
    address_state: companyInfo.state,
    address_zipcode: companyInfo.zip,
    phone: companyInfo.phone,
    email: companyInfo.email,
    website: companyInfo.website,
    instagram: companyInfo.instagram
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = 20

  const primaryColor: [number, number, number] = [41, 128, 185]
  const darkColor: [number, number, number] = [52, 73, 94]
  const lightGray: [number, number, number] = [236, 240, 241]
  const warningColor: [number, number, number] = [243, 156, 18]
  const successColor: [number, number, number] = [46, 204, 113]
  const dangerColor: [number, number, number] = [231, 76, 60]

  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - margin - 25) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // CABEÇALHO
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Logo
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, 10, 40, 25, 3, 3, 'F')
  doc.setFontSize(16)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('GT', margin + 13, 25)

  // Nome da empresa
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(company.company_name || 'Empresa', margin + 50, 18)

  // Dados da empresa
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  let infoY = 25
  if (company.cnpj) {
    doc.text(`CNPJ: ${company.cnpj}`, margin + 50, infoY)
    infoY += 3
  }
  if (company.address_street) {
    doc.text(`${company.address_street}, ${company.address_number || ''}`, margin + 50, infoY)
    infoY += 3
  }
  if (company.address_city) {
    doc.text(`${company.address_neighborhood || ''}, ${company.address_city}-${company.address_state || ''}`, margin + 50, infoY)
    infoY += 3
  }

  // Contatos
  doc.setTextColor(255, 255, 255)
  let contactY = 18
  if (company.email) {
    doc.text(`✉ ${company.email}`, pageWidth - margin, contactY, { align: 'right' })
    contactY += 3
  }
  if (company.phone) {
    doc.text(`☎ ${company.phone}`, pageWidth - margin, contactY, { align: 'right' })
    contactY += 3
  }
  if (company.whatsapp) {
    doc.text(`📱 ${company.whatsapp}`, pageWidth - margin, contactY, { align: 'right' })
    contactY += 3
  }

  // Data de emissão
  doc.setFontSize(9)
  doc.text(new Date(orderData.created_at).toLocaleDateString('pt-BR'), pageWidth - margin, 40, { align: 'right' })

  yPos = 50

  // Slogan
  if (company.slogan) {
    doc.setFontSize(9)
    doc.setTextColor(...darkColor)
    doc.setFont('helvetica', 'italic')
    doc.text(company.slogan, pageWidth / 2, yPos, { align: 'center' })
    yPos += 10
  }

  // TÍTULO - ORDEM DE SERVIÇO
  doc.setFillColor(...primaryColor)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ORDEM DE SERVIÇO', pageWidth / 2, yPos + 8, { align: 'center' })

  doc.setFontSize(14)
  doc.text(`Nº ${orderData.order_number}`, pageWidth / 2, yPos + 15, { align: 'center' })

  yPos += 25

  // STATUS E PRIORIDADE
  const statusColors: Record<string, [number, number, number]> = {
    'pending': [243, 156, 18],
    'in_progress': [41, 128, 185],
    'completed': [46, 204, 113],
    'cancelled': [231, 76, 60]
  }

  const statusLabels: Record<string, string> = {
    'pending': 'AGUARDANDO',
    'in_progress': 'EM ANDAMENTO',
    'completed': 'CONCLUÍDA',
    'cancelled': 'CANCELADA'
  }

  const priorityColors: Record<string, [number, number, number]> = {
    'low': [149, 165, 166],
    'medium': [243, 156, 18],
    'high': [231, 76, 60],
    'urgent': [192, 57, 43]
  }

  const priorityLabels: Record<string, string> = {
    'low': 'BAIXA',
    'medium': 'MÉDIA',
    'high': 'ALTA',
    'urgent': 'URGENTE'
  }

  // Status badge
  const statusColor = statusColors[orderData.status] || [149, 165, 166]
  doc.setFillColor(...statusColor)
  doc.roundedRect(margin, yPos, 50, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(statusLabels[orderData.status] || orderData.status.toUpperCase(), margin + 25, yPos + 6.5, { align: 'center' })

  // Priority badge
  if (orderData.priority) {
    const priorityColor = priorityColors[orderData.priority] || [149, 165, 166]
    doc.setFillColor(...priorityColor)
    doc.roundedRect(margin + 55, yPos, 50, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text(priorityLabels[orderData.priority] || orderData.priority.toUpperCase(), margin + 80, yPos + 6.5, { align: 'center' })
  }

  // Tipo de serviço
  if (orderData.service_type) {
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin + 110, yPos, 50, 10, 2, 2, 'F')
    doc.setTextColor(...darkColor)
    doc.text(orderData.service_type.toUpperCase(), margin + 135, yPos + 6.5, { align: 'center' })
  }

  yPos += 15

  // DADOS DO CLIENTE
  checkPageBreak(40)
  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('DADOS DO CLIENTE', margin + 2, yPos + 5.5)
  yPos += 12

  doc.setFontSize(10)
  doc.setTextColor(...darkColor)
  doc.setFont('helvetica', 'bold')
  doc.text('Nome/Empresa:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(orderData.client.company_name || orderData.client.name, margin + 35, yPos)
  yPos += 6

  if (orderData.client.phone) {
    doc.setFont('helvetica', 'bold')
    doc.text('Telefone:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(orderData.client.phone, margin + 35, yPos)
    yPos += 6
  }

  if (orderData.client.email) {
    doc.setFont('helvetica', 'bold')
    doc.text('E-mail:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(orderData.client.email, margin + 35, yPos)
    yPos += 6
  }

  if (orderData.client.address) {
    doc.setFont('helvetica', 'bold')
    doc.text('Endereço:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    const addressText = `${orderData.client.address}${orderData.client.address_city ? ', ' + orderData.client.address_city : ''}`
    doc.text(addressText, margin + 35, yPos)
    yPos += 8
  } else {
    yPos += 3
  }

  // DADOS DO EQUIPAMENTO
  if (orderData.equipment) {
    checkPageBreak(35)
    doc.setFillColor(...lightGray)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('DADOS DO EQUIPAMENTO', margin + 2, yPos + 5.5)
    yPos += 12

    doc.setFontSize(10)
    doc.setTextColor(...darkColor)

    doc.setFont('helvetica', 'bold')
    doc.text('Equipamento:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(orderData.equipment, margin + 35, yPos)
    yPos += 6

    if (orderData.brand) {
      doc.setFont('helvetica', 'bold')
      doc.text('Marca:', margin, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(orderData.brand, margin + 35, yPos)

      if (orderData.model) {
        doc.setFont('helvetica', 'bold')
        doc.text('Modelo:', margin + 80, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(orderData.model, margin + 100, yPos)
      }
      yPos += 6
    }

    if (orderData.serial_number) {
      doc.setFont('helvetica', 'bold')
      doc.text('Nº Série:', margin, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(orderData.serial_number, margin + 35, yPos)
      yPos += 8
    } else {
      yPos += 3
    }
  }

  // DESCRIÇÃO DO PROBLEMA
  if (orderData.reported_issue) {
    checkPageBreak(30)
    doc.setFillColor(...lightGray)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('PROBLEMA RELATADO', margin + 2, yPos + 5.5)
    yPos += 12

    doc.setFontSize(9)
    doc.setTextColor(...darkColor)
    doc.setFont('helvetica', 'normal')
    const issueLines = doc.splitTextToSize(orderData.reported_issue, pageWidth - 2 * margin - 4)
    doc.text(issueLines, margin + 2, yPos)
    yPos += issueLines.length * 4 + 5
  }

  // DIAGNÓSTICO E SERVIÇOS REALIZADOS
  if (orderData.technician_notes) {
    checkPageBreak(30)
    doc.setFillColor(...lightGray)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('DIAGNÓSTICO E SERVIÇOS REALIZADOS', margin + 2, yPos + 5.5)
    yPos += 12

    doc.setFontSize(9)
    doc.setTextColor(...darkColor)
    doc.setFont('helvetica', 'normal')
    const notesLines = doc.splitTextToSize(orderData.technician_notes, pageWidth - 2 * margin - 4)
    doc.text(notesLines, margin + 2, yPos)
    yPos += notesLines.length * 4 + 5
  }

  // PEÇAS E MATERIAIS UTILIZADOS
  if (orderData.parts_used && orderData.parts_used.length > 0) {
    checkPageBreak(40)
    doc.setFillColor(...lightGray)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('PEÇAS E MATERIAIS UTILIZADOS', margin + 2, yPos + 5.5)
    yPos += 12

    const partsData = orderData.parts_used.map((part: any) => [
      part.name || part.item_name || 'Item',
      part.quantity || 1,
      `R$ ${(part.unit_price || part.price || 0).toFixed(2)}`,
      `R$ ${((part.quantity || 1) * (part.unit_price || part.price || 0)).toFixed(2)}`
    ])

    ;(doc as any).autoTable({
      startY: yPos,
      head: [['Descrição', 'Qtd.', 'Preço Unit.', 'Total']],
      body: partsData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      margin: { left: margin, right: margin }
    })

    yPos = (doc as any).lastAutoTable.finalY + 5
  }

  // PRAZOS
  checkPageBreak(25)
  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('PRAZOS', margin + 2, yPos + 5.5)
  yPos += 12

  doc.setFontSize(10)
  doc.setTextColor(...darkColor)

  if (orderData.scheduled_date) {
    doc.setFont('helvetica', 'bold')
    doc.text('Agendado para:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(orderData.scheduled_date).toLocaleDateString('pt-BR'), margin + 40, yPos)
    yPos += 6
  }

  if (orderData.completion_date) {
    doc.setFont('helvetica', 'bold')
    doc.text('Conclusão:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(orderData.completion_date).toLocaleDateString('pt-BR'), margin + 40, yPos)
    yPos += 8
  } else {
    yPos += 3
  }

  // VALORES
  checkPageBreak(35)
  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('VALORES', margin + 2, yPos + 5.5)
  yPos += 12

  doc.setFontSize(10)
  doc.setTextColor(...darkColor)

  if (orderData.estimated_cost) {
    doc.setFont('helvetica', 'bold')
    doc.text('Custo Estimado:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(`R$ ${orderData.estimated_cost.toFixed(2)}`, margin + 40, yPos)
    yPos += 6
  }

  if (orderData.final_cost) {
    doc.setFont('helvetica', 'bold')
    doc.text('Custo Final:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(...successColor)
    doc.text(`R$ ${orderData.final_cost.toFixed(2)}`, margin + 40, yPos)
    yPos += 6
    doc.setFontSize(10)
    doc.setTextColor(...darkColor)
  }

  if (orderData.payment_status) {
    const paymentLabels: Record<string, string> = {
      'pending': 'PENDENTE',
      'partial': 'PARCIAL',
      'paid': 'PAGO'
    }
    const paymentColors: Record<string, [number, number, number]> = {
      'pending': warningColor,
      'partial': [243, 156, 18],
      'paid': successColor
    }
    const paymentColor = paymentColors[orderData.payment_status] || warningColor

    doc.setFont('helvetica', 'bold')
    doc.text('Status Pagamento:', margin, yPos)
    doc.setTextColor(...paymentColor)
    doc.text(paymentLabels[orderData.payment_status] || orderData.payment_status.toUpperCase(), margin + 50, yPos)
    yPos += 8
  }

  // GARANTIA
  if (orderData.warranty_terms || company.warranty_period) {
    checkPageBreak(30)
    doc.setFillColor(...lightGray)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('GARANTIA', margin + 2, yPos + 5.5)
    yPos += 12

    doc.setFontSize(9)
    doc.setTextColor(...darkColor)
    doc.setFont('helvetica', 'normal')
    const warrantyText = orderData.warranty_terms || `Garantia de ${company.warranty_period || '90 dias'} para o serviço realizado.`
    const warrantyLines = doc.splitTextToSize(warrantyText, pageWidth - 2 * margin - 4)
    doc.text(warrantyLines, margin + 2, yPos)
    yPos += warrantyLines.length * 4 + 8
  }

  // TERMOS E CONDIÇÕES
  checkPageBreak(40)
  doc.setFillColor(255, 243, 205)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFontSize(11)
  doc.setTextColor(133, 100, 4)
  doc.setFont('helvetica', 'bold')
  doc.text('TERMOS E CONDIÇÕES', margin + 2, yPos + 5.5)
  yPos += 12

  doc.setFontSize(8)
  doc.setTextColor(133, 100, 4)
  doc.setFont('helvetica', 'normal')
  const terms = [
    '1. Esta ordem de serviço é válida apenas para os serviços descritos acima.',
    '2. O cliente é responsável por fornecer acesso adequado ao local de trabalho.',
    '3. Serviços adicionais não previstos nesta OS serão orçados separadamente.',
    '4. O prazo de garantia inicia-se na data de conclusão do serviço.',
    '5. A garantia cobre defeitos de execução, não incluindo mau uso ou desgaste natural.'
  ]

  terms.forEach(term => {
    const termLines = doc.splitTextToSize(term, pageWidth - 2 * margin - 4)
    checkPageBreak(termLines.length * 3 + 2)
    doc.text(termLines, margin + 2, yPos)
    yPos += termLines.length * 3 + 2
  })

  yPos += 10

  // ASSINATURAS
  checkPageBreak(40)

  doc.setFontSize(9)
  doc.setTextColor(...darkColor)
  doc.setFont('helvetica', 'normal')
  const dateStr = orderData.completion_date
    ? new Date(orderData.completion_date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(`${company.address_city || 'São Paulo'}, ${dateStr}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  const signatureWidth = 70
  const leftSignX = margin + 10
  const rightSignX = pageWidth - margin - signatureWidth - 10

  // Assinatura empresa
  doc.setLineWidth(0.5)
  doc.line(leftSignX, yPos, leftSignX + signatureWidth, yPos)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(company.company_name || 'Empresa', leftSignX + signatureWidth / 2, yPos + 5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Responsável Técnico', leftSignX + signatureWidth / 2, yPos + 9, { align: 'center' })

  // Assinatura cliente
  doc.setLineWidth(0.5)
  doc.line(rightSignX, yPos, rightSignX + signatureWidth, yPos)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(orderData.client.company_name || orderData.client.name, rightSignX + signatureWidth / 2, yPos + 5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Cliente', rightSignX + signatureWidth / 2, yPos + 9, { align: 'center' })

  // RODAPÉ EM TODAS AS PÁGINAS
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')

    let footerY = pageHeight - 15

    // Informações da empresa
    const footerInfo = [
      company.company_name || '',
      company.cnpj ? `CNPJ: ${company.cnpj}` : '',
      company.phone ? `Tel: ${company.phone}` : '',
      company.email ? `Email: ${company.email}` : ''
    ].filter(Boolean).join(' | ')

    doc.text(footerInfo, pageWidth / 2, footerY, { align: 'center' })

    // Redes sociais
    if (company.instagram || company.website) {
      const social = [
        company.instagram ? `Instagram: ${company.instagram}` : '',
        company.website ? `Site: ${company.website}` : ''
      ].filter(Boolean).join(' | ')
      doc.text(social, pageWidth / 2, footerY + 3, { align: 'center' })
    }

    // Número da página
    doc.text(`Página ${i}/${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' })

    // OS Number no rodapé
    doc.text(`OS: ${orderData.order_number}`, margin, pageHeight - 8)
  }

  return doc
}
