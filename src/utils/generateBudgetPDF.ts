import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { getCompanyInfo } from './companyData'

interface BudgetItem {
  description: string
  scope?: string
  service_name?: string
  service_description?: string
  service_scope?: string
  technical_requirements?: string
  safety_warnings?: string
  execution_steps?: string
  expected_results?: string
  quality_standards?: string
  warranty_info?: string
  observations?: string
  unit: string
  unit_price: number
  quantity: number
  total_price: number
  estimated_duration?: number
  tempo_estimado_minutos?: number
}

interface BudgetData {
  order_number: string
  date: string
  title?: string
  client: {
    name: string
    company_name?: string
    cnpj?: string
    cpf?: string
    address?: string
    city?: string
    state?: string
    cep?: string
    email?: string
    phone?: string
  }
  basic_info?: {
    deadline: string
    start_date?: string
    brand?: string
    model?: string
    equipment?: string
  }
  items: BudgetItem[]
  subtotal: number
  discount: number
  discount_percentage?: number
  total: number
  show_value?: boolean
  technical_report?: string
  service_instructions?: string
  detailed_scope?: string
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
  additional_info?: string
  special_conditions?: string
}

export const generateBudgetPDF = async (budgetData: BudgetData): Promise<void> => {
  const companyInfo = await getCompanyInfo()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = 20

  const primaryColor: [number, number, number] = [15, 118, 110]
  const accentColor: [number, number, number] = [20, 184, 166]
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
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...darkGray)
    doc.text(
      `${companyInfo.email} | ${companyInfo.phone} | ${companyInfo.website || companyInfo.instagram || ''}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    )
    doc.text(`Página ${currentPage}`, pageWidth / 2, pageHeight - 3, { align: 'center' })
  }

  const loadLogo = (): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        } else {
          resolve('')
        }
      }

      img.onerror = () => {
        const fallbackImg = new Image()
        fallbackImg.crossOrigin = 'anonymous'
        fallbackImg.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = fallbackImg.width
          canvas.height = fallbackImg.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(fallbackImg, 0, 0)
            resolve(canvas.toDataURL('image/jpeg', 0.8))
          } else {
            resolve('')
          }
        }
        fallbackImg.onerror = () => resolve('')
        fallbackImg.src = '/image.png'
      }

      img.src = '/8.jpg'
    })
  }

  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 50, 'F')

  const logoBase64 = await loadLogo()
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', margin, 10, 30, 30)
    } catch (error) {
      doc.setFillColor(255, 255, 255)
      doc.circle(margin + 15, 25, 12, 'F')
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryColor)
      const initial = companyInfo.name.charAt(0).toUpperCase()
      doc.text(initial, margin + 15, 30, { align: 'center' })
    }
  } else {
    doc.setFillColor(255, 255, 255)
    doc.circle(margin + 15, 25, 12, 'F')
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    const initial = companyInfo.name.charAt(0).toUpperCase()
    doc.text(initial, margin + 15, 30, { align: 'center' })
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text(companyInfo.name, margin + 50, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  let yHeader = 24
  doc.text(companyInfo.owner || 'Proprietário', margin + 50, yHeader)
  yHeader += 3.5
  doc.text(`CNPJ: ${companyInfo.cnpj}`, margin + 50, yHeader)
  yHeader += 3.5
  doc.text(companyInfo.address, margin + 50, yHeader)
  yHeader += 3.5
  doc.text(`${companyInfo.city}-${companyInfo.state}${companyInfo.zip ? ' • CEP ' + companyInfo.zip : ''}`, margin + 50, yHeader)

  const rightX = pageWidth - margin
  doc.text(new Date(budgetData.date).toLocaleDateString('pt-BR'), rightX, 18, { align: 'right' })
  yHeader = 24
  doc.text(companyInfo.email, rightX, yHeader, { align: 'right' })
  yHeader += 3.5
  doc.text(companyInfo.phone, rightX, yHeader, { align: 'right' })
  yHeader += 3.5
  if (companyInfo.instagram) {
    doc.text(companyInfo.instagram, rightX, yHeader, { align: 'right' })
  }

  yPos = 60

  doc.setFillColor(...accentColor)
  doc.rect(margin, yPos, pageWidth - 2 * margin, budgetData.title ? 18 : 12, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(`ORÇAMENTO ${budgetData.order_number}`, pageWidth / 2, yPos + 8, { align: 'center' })

  if (budgetData.title) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(budgetData.title, pageWidth / 2, yPos + 14, { align: 'center' })
    yPos += 24
  } else {
    yPos += 18
  }

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text(`Cliente: ${budgetData.client.name}`, margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  if (budgetData.client.company_name) {
    doc.text(budgetData.client.company_name, margin + 3, yPos)
    yPos += 4
  }

  if (budgetData.client.cnpj) {
    doc.text(`CNPJ: ${budgetData.client.cnpj}`, margin + 3, yPos)
    yPos += 4
  } else if (budgetData.client.cpf) {
    doc.text(`CPF: ${budgetData.client.cpf}`, margin + 3, yPos)
    yPos += 4
  }

  if (budgetData.client.address) {
    const fullAddress = [
      budgetData.client.address,
      budgetData.client.city && budgetData.client.state ? `${budgetData.client.city}-${budgetData.client.state}` : null,
      budgetData.client.cep ? `CEP ${budgetData.client.cep}` : null
    ].filter(Boolean).join(', ')

    const addressLines = doc.splitTextToSize(fullAddress, pageWidth - 2 * margin - 6)
    doc.text(addressLines, margin + 3, yPos)
    yPos += addressLines.length * 4
  }

  if (budgetData.client.phone) {
    doc.text(`Tel: ${budgetData.client.phone}`, margin + 3, yPos)
    yPos += 4
  }

  if (budgetData.client.email) {
    doc.text(`Email: ${budgetData.client.email}`, margin + 3, yPos)
    yPos += 4
  }

  yPos += 4

  if (budgetData.basic_info) {
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

    doc.text(`Prazo de Execução: ${budgetData.basic_info.deadline}`, margin + 3, yPos)
    yPos += 4

    if (budgetData.basic_info.start_date) {
      doc.text(`Data de Início: ${budgetData.basic_info.start_date}`, margin + 3, yPos)
      yPos += 4
    }

    if (budgetData.basic_info.brand) {
      doc.text(`Marca: ${budgetData.basic_info.brand}`, margin + 3, yPos)
      yPos += 4
    }

    if (budgetData.basic_info.model) {
      doc.text(`Modelo: ${budgetData.basic_info.model}`, margin + 3, yPos)
      yPos += 4
    }

    if (budgetData.basic_info.equipment) {
      doc.text(`Equipamento: ${budgetData.basic_info.equipment}`, margin + 3, yPos)
      yPos += 4
    }

    yPos += 4
  }

  checkPageBreak(40)

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Serviços e Produtos', margin + 3, yPos + 5.5)

  yPos += 12

  const showValues = budgetData.show_value !== false

  const tableData = budgetData.items.map(item => {
    // Montar descrição completa com todos os detalhes
    let description = item.service_name || item.description || 'Serviço'

    const fullDescription = item.service_description || item.description
    if (fullDescription && fullDescription !== description) {
      description += `\n${fullDescription}`
    }

    const serviceScope = item.service_scope || item.scope
    if (serviceScope) {
      description += `\n\nESCOPO:\n${serviceScope}`
    }

    if (item.technical_requirements) {
      description += `\n\nREQUISITOS TÉCNICOS:\n${item.technical_requirements}`
    }

    if (item.safety_warnings) {
      description += `\n\n⚠ AVISOS DE SEGURANÇA:\n${item.safety_warnings}`
    }

    if (item.execution_steps) {
      description += `\n\nPASSOS:\n${item.execution_steps}`
    }

    if (item.expected_results) {
      description += `\n\nRESULTADOS:\n${item.expected_results}`
    }

    if (item.quality_standards) {
      description += `\n\nQUALIDADE:\n${item.quality_standards}`
    }

    if (item.warranty_info) {
      description += `\n\n🛡 GARANTIA:\n${item.warranty_info}`
    }

    if (item.observations) {
      description += `\n\nOBS:\n${item.observations}`
    }

    const duration = item.estimated_duration || item.tempo_estimado_minutos
    if (duration) {
      description += `\n\n⏱ Tempo: ${duration}min`
    }

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

  ;(doc as any).autoTable({
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: darkGray
    },
    columnStyles: columnStyles,
    margin: { left: margin, right: margin }
  })

  yPos = (doc as any).lastAutoTable.finalY + 5

  if (showValues) {
    const totalsX = pageWidth - margin - 50

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...darkGray)

    doc.text('Subtotal:', totalsX, yPos, { align: 'right' })
    doc.text(`R$ ${budgetData.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
    yPos += 5

    if (budgetData.discount > 0) {
      doc.setTextColor(231, 76, 60)
      const discountText = budgetData.discount_percentage
        ? `Desconto (${budgetData.discount_percentage}%):`
        : 'Desconto:'
      doc.text(discountText, totalsX, yPos, { align: 'right' })
      doc.text(`- R$ ${budgetData.discount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
      yPos += 5
    }

    doc.setDrawColor(...darkGray)
    doc.setLineWidth(1)
    doc.line(totalsX - 10, yPos, pageWidth - margin, yPos)
    yPos += 7

    doc.setFillColor(...primaryColor)
    doc.rect(totalsX - 15, yPos - 5, pageWidth - totalsX + 15 - margin, 10, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL:', totalsX, yPos + 2, { align: 'right' })
    doc.text(`R$ ${budgetData.total.toFixed(2)}`, pageWidth - margin - 3, yPos + 2, { align: 'right' })

    yPos += 15
  }

  if (budgetData.detailed_scope) {
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

    const scopeLines = doc.splitTextToSize(budgetData.detailed_scope, pageWidth - 2 * margin - 6)
    doc.text(scopeLines, margin + 3, yPos)
    yPos += scopeLines.length * 3.5 + 8
  }

  if (budgetData.technical_report) {
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

    const reportLines = doc.splitTextToSize(budgetData.technical_report, pageWidth - 2 * margin - 6)
    doc.text(reportLines, margin + 3, yPos)
    yPos += reportLines.length * 3.5 + 8
  }

  if (budgetData.service_instructions) {
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

    const instructionsLines = doc.splitTextToSize(budgetData.service_instructions, pageWidth - 2 * margin - 6)
    doc.text(instructionsLines, margin + 3, yPos)
    yPos += instructionsLines.length * 3.5 + 8
  }

  if (yPos > pageHeight - 100) {
    addFooter()
    doc.addPage()
    yPos = margin
  }

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

  doc.text(`Métodos: ${budgetData.payment.methods}`, margin + 3, yPos)
  yPos += 5

  if (budgetData.payment.pix) {
    doc.text(`PIX: ${budgetData.payment.pix}`, margin + 3, yPos)
    yPos += 5
  }

  if (budgetData.payment.bank_details) {
    const bank = budgetData.payment.bank_details
    doc.setFont('helvetica', 'bold')
    doc.text('Dados bancários:', margin + 3, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.text(`Banco: ${bank.bank} | Agência: ${bank.agency} | Conta: ${bank.account}`, margin + 3, yPos)
    yPos += 4
    doc.text(`Tipo: ${bank.account_type} | Titular: ${bank.holder}`, margin + 3, yPos)
    yPos += 5
  }

  doc.setFont('helvetica', 'bold')
  doc.text('Condições:', margin + 3, yPos)
  yPos += 5
  doc.setFont('helvetica', 'normal')

  const conditionsLines = doc.splitTextToSize(budgetData.payment.conditions, pageWidth - 2 * margin - 6)
  doc.text(conditionsLines, margin + 3, yPos)
  yPos += conditionsLines.length * 4 + 8

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

  if (budgetData.warranty.period) {
    doc.text(`Período: ${budgetData.warranty.period}`, margin + 3, yPos)
    yPos += 6
  }

  const warrantyText = typeof budgetData.warranty.conditions === 'string'
    ? budgetData.warranty.conditions
    : Array.isArray(budgetData.warranty.conditions)
    ? budgetData.warranty.conditions.join('\n\n')
    : ''

  const warrantyLines = doc.splitTextToSize(warrantyText, pageWidth - 2 * margin - 6)
  doc.text(warrantyLines, margin + 3, yPos)
  yPos += warrantyLines.length * 3.5 + 10

  if (budgetData.additional_info || budgetData.special_conditions) {
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

    const obsText = budgetData.additional_info || budgetData.special_conditions || ''
    const obsLines = doc.splitTextToSize(obsText, pageWidth - 2 * margin - 6)
    doc.text(obsLines, margin + 3, yPos)
    yPos += obsLines.length * 4 + 8
  }

  checkPageBreak(40)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  const centerY = yPos
  doc.text(
    `${budgetData.client.city || companyInfo.city}, ${new Date(budgetData.date).toLocaleDateString('pt-BR')}`,
    pageWidth / 2,
    centerY,
    { align: 'center' }
  )

  yPos += 25

  const lineStartX = margin + 10
  const lineEndX = pageWidth / 2 - 10
  doc.line(lineStartX, yPos, lineEndX, yPos)
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text(companyInfo.name, (lineStartX + lineEndX) / 2, yPos, { align: 'center' })
  yPos += 4
  doc.setFont('helvetica', 'normal')
  doc.text(companyInfo.owner || 'Representante Legal', (lineStartX + lineEndX) / 2, yPos, { align: 'center' })

  const lineStartX2 = pageWidth / 2 + 10
  const lineEndX2 = pageWidth - margin - 10
  yPos -= 9
  doc.line(lineStartX2, yPos, lineEndX2, yPos)
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text(budgetData.client.name, (lineStartX2 + lineEndX2) / 2, yPos, { align: 'center' })
  yPos += 4
  doc.setFont('helvetica', 'normal')
  if (budgetData.client.cnpj) {
    doc.text(`CNPJ ${budgetData.client.cnpj}`, (lineStartX2 + lineEndX2) / 2, yPos, { align: 'center' })
  } else if (budgetData.client.cpf) {
    doc.text(`CPF ${budgetData.client.cpf}`, (lineStartX2 + lineEndX2) / 2, yPos, { align: 'center' })
  }

  addFooter()

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...darkGray)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 3, { align: 'right' })
  }

  doc.save(`Orcamento_${budgetData.order_number}_${new Date().toISOString().split('T')[0]}.pdf`)
}

export default generateBudgetPDF
