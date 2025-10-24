import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCompanyInfo, type CompanyInfo as GiartechCompanyInfo } from './companyData'

interface ServiceOrderData {
  order_number: string
  created_at: string
  status: string
  customer: {
    nome_razao?: string
    name?: string
    cnpj_cpf?: string
    email?: string
    telefone?: string
    phone?: string
    endereco?: string
    address?: string
    cidade?: string
    city?: string
    estado?: string
    state?: string
    cep?: string
    zip_code?: string
  }
  description?: string
  scheduled_at?: string
  service_date?: string
  completion_date?: string
  items: Array<{
    id?: string
    descricao?: string
    description?: string
    name?: string
    quantidade?: number
    quantity?: number
    preco_unitario?: number
    unit_price?: number
    preco_total?: number
    total_price?: number
    tempo_estimado_minutos?: number
    estimated_duration?: number
    materiais?: Array<{
      nome: string
      quantidade: number
      unidade_medida: string
      preco_unitario?: number
      preco_venda?: number
      valor_total: number
    }>
    funcionarios?: Array<{
      nome: string
      tempo_minutos: number
      custo_hora?: number
      custo_total: number
    }>
  }>
  team?: Array<{
    id?: string
    employee_id?: string
    nome?: string
    role?: string
  }>
  payment_method?: string
  payment_installments?: number
  bank_account?: string
  warranty_period?: number
  warranty_type?: string
  warranty_terms?: string
  contract_notes?: string
  subtotal?: number
  total_value?: number
  desconto_percentual?: number
  desconto_valor?: number
  discount_amount?: number
  final_total?: number
  custo_total?: number
  lucro_total?: number
  margem_lucro?: number
  notes?: string
}

interface CompanyInfo {
  name: string
  cnpj?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  email?: string
  website?: string
}

export const generateServiceOrderPDFProfessional = async (
  orderData: ServiceOrderData,
  companyInfo?: CompanyInfo
) => {
  const giartechInfo = await getCompanyInfo()
  const company = companyInfo || {
    name: giartechInfo.name,
    cnpj: giartechInfo.cnpj,
    address: giartechInfo.address,
    city: giartechInfo.city,
    state: giartechInfo.state,
    zip: giartechInfo.zip,
    phone: giartechInfo.phone,
    email: giartechInfo.email,
    website: giartechInfo.website
  }
  const doc = new jsPDF()

  const primaryColor: [number, number, number] = [37, 99, 235]
  const secondaryColor: [number, number, number] = [100, 116, 139]
  const accentColor: [number, number, number] = [34, 197, 94]
  const lightGray: [number, number, number] = [243, 244, 246]
  const darkGray: [number, number, number] = [31, 41, 55]

  let yPosition = 20

  // === CABEÇALHO PROFISSIONAL COM DESIGN MODERNO ===
  // Fundo com gradiente simulado
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 42, 'F')

  // Borda decorativa inferior
  doc.setFillColor(...accentColor)
  doc.rect(0, 40, 210, 2, 'F')

  // Tentar carregar LOGO DA EMPRESA
  try {
    const logoImg = new Image()
    logoImg.src = '/8.jpg' // Logo da Giartech
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve
      logoImg.onerror = () => {
        console.log('Logo 8.jpg não encontrada, tentando image.png...')
        logoImg.src = '/image.png'
      }
      setTimeout(reject, 3000)
    })
    // Logo circular maior e bem posicionada
    doc.addImage(logoImg, 'JPEG', 10, 4, 34, 34)
  } catch (error) {
    console.log('Logo não carregada')
  }

  // NOME DA EMPRESA - Tipografia destacada
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name.toUpperCase(), 48, 15)

  // INFORMAÇÕES DA EMPRESA - Subtexto elegante
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  let headerY = 22
  if (company.cnpj) {
    doc.text(`CNPJ: ${company.cnpj}`, 48, headerY)
    headerY += 3.5
  }
  if (company.address) {
    const addressText = `${company.address}${company.city ? ', ' + company.city : ''}${company.state ? ' - ' + company.state : ''}`
    doc.text(addressText, 48, headerY)
    headerY += 3.5
  }
  if (company.phone || company.email) {
    const contact = [company.phone, company.email].filter(Boolean).join(' | ')
    doc.text(contact, 48, headerY)
  }

  // === BOX DA ORDEM DE SERVIÇO - Design Card ===
  // Fundo branco
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(143, 5, 62, 32, 2, 2, 'F')

  // Borda colorida
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(1.5)
  doc.roundedRect(143, 5, 62, 32, 2, 2, 'S')

  // Título
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('ORDEM DE SERVIÇO', 174, 12, { align: 'center' })

  // Número da OS - Destaque
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...accentColor)
  doc.text(`#${orderData.order_number}`, 174, 22, { align: 'center' })

  // STATUS BADGE - Pill design
  const statusY = 28
  const statusColors: { [key: string]: [number, number, number] } = {
    'pending': [251, 191, 36],
    'in_progress': [59, 130, 246],
    'completed': [34, 197, 94],
    'cancelled': [239, 68, 68]
  }
  const statusColor = statusColors[orderData.status] || secondaryColor
  doc.setFillColor(...statusColor)
  doc.roundedRect(149, statusY, 50, 7, 2, 2, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  const statusText = orderData.status === 'completed' ? 'CONCLUÍDA' :
                     orderData.status === 'in_progress' ? 'EM ANDAMENTO' :
                     orderData.status === 'pending' ? 'PENDENTE' :
                     orderData.status === 'cancelled' ? 'CANCELADA' : orderData.status.toUpperCase()
  doc.text(statusText, 174, statusY + 4.5, { align: 'center' })

  yPosition = 50

  doc.setFillColor(...lightGray)
  doc.rect(15, yPosition, 180, 8, 'F')
  doc.setTextColor(...darkGray)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DADOS DO CLIENTE', 17, yPosition + 5.5)

  yPosition += 12
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('Cliente:', 17, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  const customerName = orderData.customer.nome_razao || orderData.customer.name || 'Cliente'
  doc.text(customerName, 35, yPosition)

  yPosition += 6
  const clientDetails = []
  if (orderData.customer.cnpj_cpf) {
    clientDetails.push(`CNPJ/CPF: ${orderData.customer.cnpj_cpf}`)
  }
  const customerPhone = orderData.customer.telefone || orderData.customer.phone
  if (customerPhone) {
    clientDetails.push(`Tel: ${customerPhone}`)
  }
  if (orderData.customer.email) {
    clientDetails.push(`Email: ${orderData.customer.email}`)
  }

  if (clientDetails.length > 0) {
    doc.setFontSize(9)
    doc.setTextColor(...secondaryColor)
    doc.text(clientDetails.join(' | '), 17, yPosition)
    yPosition += 5
  }

  const customerAddress = orderData.customer.endereco || orderData.customer.address
  if (customerAddress) {
    doc.text(`Endereço: ${customerAddress}`, 17, yPosition)
    yPosition += 4
    const customerCity = orderData.customer.cidade || orderData.customer.city
    const customerState = orderData.customer.estado || orderData.customer.state
    const customerZip = orderData.customer.cep || orderData.customer.zip_code
    if (customerCity || customerState) {
      const location = [customerCity, customerState, customerZip]
        .filter(Boolean).join(' - ')
      doc.text(location, 17, yPosition)
      yPosition += 5
    }
  }

  yPosition += 3
  doc.setFillColor(...lightGray)
  doc.rect(15, yPosition, 180, 8, 'F')
  doc.setTextColor(...darkGray)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMAÇÕES DA ORDEM', 17, yPosition + 5.5)

  yPosition += 12
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)

  const orderInfo = []
  if (orderData.created_at) {
    orderInfo.push(`Emissão: ${new Date(orderData.created_at).toLocaleDateString('pt-BR')}`)
  }
  if (orderData.scheduled_at) {
    orderInfo.push(`Agendado: ${new Date(orderData.scheduled_at).toLocaleDateString('pt-BR')}`)
  }
  if (orderData.status) {
    orderInfo.push(`Status: ${orderData.status.toUpperCase()}`)
  }

  doc.text(orderInfo.join(' | '), 17, yPosition)
  yPosition += 6

  if (orderData.description) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkGray)
    doc.text('Descrição:', 17, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)
    const descLines = doc.splitTextToSize(orderData.description, 160)
    doc.text(descLines, 17, yPosition + 4)
    yPosition += 4 + (descLines.length * 4)
  }

  yPosition += 5
  doc.setFillColor(...lightGray)
  doc.rect(15, yPosition, 180, 8, 'F')
  doc.setTextColor(...darkGray)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SERVIÇOS', 17, yPosition + 5.5)

  yPosition += 10

  orderData.items.forEach((item, index) => {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFillColor(235, 240, 255)
    doc.rect(15, yPosition, 180, 7, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    const itemDesc = item.descricao || item.description || item.name || 'Serviço'
    doc.text(`${index + 1}. ${itemDesc}`, 17, yPosition + 5)

    yPosition += 9

    const itemQty = item.quantidade || item.quantity || 1
    const itemUnitPrice = item.preco_unitario || item.unit_price || 0
    const itemTotalPrice = item.preco_total || item.total_price || (itemUnitPrice * itemQty)
    const itemDuration = item.tempo_estimado_minutos || item.estimated_duration || 0

    const serviceDetailsTable = []
    serviceDetailsTable.push(['Quantidade', itemQty.toString()])
    serviceDetailsTable.push(['Preço Unit.', `R$ ${itemUnitPrice.toFixed(2)}`])
    serviceDetailsTable.push(['Tempo Est.', `${itemDuration} min`])
    serviceDetailsTable.push(['Total', `R$ ${itemTotalPrice.toFixed(2)}`])

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: serviceDetailsTable,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: secondaryColor, cellWidth: 30 },
        1: { textColor: darkGray, cellWidth: 35 },
      },
      margin: { left: 20 },
    })

    yPosition = (doc as any).autoTable.previous.finalY + 3

    if (item.materiais && item.materiais.length > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...darkGray)
      doc.text('Materiais:', 20, yPosition)
      yPosition += 4

      const materialsData = item.materiais.map(m => [
        m.nome,
        `${m.quantidade} ${m.unidade_medida}`,
        `R$ ${(m.preco_venda || m.preco_unitario || 0).toFixed(2)}`,
        `R$ ${m.valor_total.toFixed(2)}`
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Material', 'Qtd.', 'Unit.', 'Total']],
        body: materialsData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
        },
        margin: { left: 25 },
      })

      yPosition = (doc as any).autoTable.previous.finalY + 3
    }

    if (item.funcionarios && item.funcionarios.length > 0) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...darkGray)
      doc.text('Mão de Obra:', 20, yPosition)
      yPosition += 4

      const laborData = item.funcionarios.map(f => [
        f.nome,
        `${f.tempo_minutos} min`,
        `R$ ${f.custo_total.toFixed(2)}`
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Profissional', 'Tempo', 'Custo']],
        body: laborData,
        theme: 'striped',
        headStyles: {
          fillColor: accentColor,
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
        },
        margin: { left: 25 },
      })

      yPosition = (doc as any).autoTable.previous.finalY + 5
    }

    yPosition += 2
  })

  // Equipe Designada
  if (orderData.team && orderData.team.length > 0) {
    if (yPosition > 230) {
      doc.addPage()
      yPosition = 20
    }

    yPosition += 5
    doc.setFillColor(...lightGray)
    doc.rect(15, yPosition, 180, 8, 'F')
    doc.setTextColor(...darkGray)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('EQUIPE DESIGNADA', 17, yPosition + 5.5)

    yPosition += 12
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)

    orderData.team.forEach((member) => {
      const memberName = member.nome || 'Funcionário'
      const memberRole = member.role ? ` - ${member.role}` : ''
      doc.text(`• ${memberName}${memberRole}`, 17, yPosition)
      yPosition += 4
    })

    yPosition += 3
  }

  if (yPosition > 230) {
    doc.addPage()
    yPosition = 20
  }

  yPosition += 5
  doc.setFillColor(...primaryColor)
  doc.rect(15, yPosition, 180, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMO FINANCEIRO', 17, yPosition + 5.5)

  yPosition += 12

  const financialData = []
  const subtotal = orderData.subtotal || orderData.total_value || 0
  financialData.push(['Subtotal', `R$ ${subtotal.toFixed(2)}`])

  const discount = orderData.discount_amount || orderData.desconto_valor || 0
  if (discount > 0) {
    let discountText = `R$ ${discount.toFixed(2)}`
    if (orderData.desconto_percentual && orderData.desconto_percentual > 0) {
      discountText += ` (${orderData.desconto_percentual}%)`
    }
    financialData.push(['Desconto', discountText])
  }

  const finalTotal = orderData.final_total || orderData.total_value || (subtotal - discount)
  financialData.push(['TOTAL', `R$ ${finalTotal.toFixed(2)}`])

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: financialData,
    theme: 'plain',
    styles: {
      fontSize: 11,
      cellPadding: 3,
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        textColor: secondaryColor,
        cellWidth: 140,
        halign: 'right'
      },
      1: {
        fontStyle: 'bold',
        textColor: primaryColor,
        cellWidth: 40,
        halign: 'right',
        fontSize: 12
      },
    },
    margin: { left: 15, right: 15 },
  })

  yPosition = (doc as any).autoTable.previous.finalY + 5

  if (orderData.payment_method || orderData.warranty_period) {
    if (yPosition > 240) {
      doc.addPage()
      yPosition = 20
    }

    yPosition += 3
    doc.setFillColor(...lightGray)
    doc.rect(15, yPosition, 180, 8, 'F')
    doc.setTextColor(...darkGray)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('CONDIÇÕES', 17, yPosition + 5.5)

    yPosition += 12
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)

    if (orderData.payment_method) {
      const paymentMethodMap: Record<string, string> = {
        'dinheiro': 'Dinheiro',
        'pix': 'PIX',
        'debito': 'Cartão de Débito',
        'credito': 'Cartão de Crédito',
        'transferencia': 'Transferência Bancária',
        'boleto': 'Boleto Bancário',
        'cheque': 'Cheque'
      }

      const paymentText = paymentMethodMap[orderData.payment_method] || orderData.payment_method
      let paymentInfo = `Pagamento: ${paymentText}`

      if (orderData.payment_installments && orderData.payment_installments > 1) {
        const installmentValue = orderData.final_total / orderData.payment_installments
        paymentInfo += ` - ${orderData.payment_installments}x de R$ ${installmentValue.toFixed(2)}`
      }

      doc.setFont('helvetica', 'bold')
      doc.text(paymentInfo, 17, yPosition)
      yPosition += 5
    }

    if (orderData.warranty_period && orderData.warranty_type) {
      const warrantyTypeMap: Record<string, string> = {
        'days': 'dias',
        'months': 'meses',
        'years': 'anos'
      }
      const warrantyUnit = warrantyTypeMap[orderData.warranty_type] || orderData.warranty_type

      doc.setFont('helvetica', 'bold')
      doc.text(`Garantia: ${orderData.warranty_period} ${warrantyUnit}`, 17, yPosition)
      yPosition += 5

      if (orderData.warranty_terms) {
        doc.setFont('helvetica', 'normal')
        const warrantyLines = doc.splitTextToSize(orderData.warranty_terms, 170)
        doc.text(warrantyLines, 17, yPosition)
        yPosition += warrantyLines.length * 4 + 3
      }
    }
  }

  if (orderData.notes) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    yPosition += 3
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkGray)
    doc.text('Observações:', 17, yPosition)
    yPosition += 4

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)
    const notesLines = doc.splitTextToSize(orderData.notes, 170)
    doc.text(notesLines, 17, yPosition)
    yPosition += notesLines.length * 4 + 5
  }

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    doc.setDrawColor(...secondaryColor)
    doc.setLineWidth(0.5)
    doc.line(15, 287, 195, 287)

    doc.setFontSize(8)
    doc.setTextColor(...secondaryColor)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `${company.name} | ${company.phone || ''} | ${company.email || ''}`,
      105,
      291,
      { align: 'center' }
    )
    doc.text(`Página ${i} de ${pageCount}`, 195, 291, { align: 'right' })
  }

  const fileName = `OS_${orderData.order_number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  doc.save(fileName)

  return fileName
}
