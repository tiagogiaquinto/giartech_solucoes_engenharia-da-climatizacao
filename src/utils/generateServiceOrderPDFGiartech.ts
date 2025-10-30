import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCompanyInfo } from './companyData'
import { ServiceItemComplete, generateServiceDescription } from './serviceOrderDataMapper'

type ServiceItem = ServiceItemComplete

interface ServiceOrderData {
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
    brand?: string
    model?: string
    equipment?: string
  }
  items: ServiceItem[]
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
  warranty?: {
    period?: string
    conditions: string | string[]
  }
  contract_clauses?: any[]
  additional_info?: string
  hide_material_prices?: boolean
}

export const generateServiceOrderPDFGiartech = async (data: ServiceOrderData): Promise<void> => {
  const companyInfo = await getCompanyInfo()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = 15

  const primaryBlue: [number, number, number] = [15, 86, 125]
  const lightBlue: [number, number, number] = [230, 240, 250]
  const darkGray: [number, number, number] = [51, 51, 51]
  const mediumGray: [number, number, number] = [102, 102, 102]

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
          resolve(canvas.toDataURL('image/jpeg', 0.9))
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
            resolve(canvas.toDataURL('image/jpeg', 0.9))
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

  const addHeader = async (pageNum: number) => {
    const logoBase64 = await loadLogo()

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'JPEG', margin, yPos, 40, 40)
      } catch (error) {
        console.error('Erro ao adicionar logo:', error)
      }
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...primaryBlue)
    doc.text(companyInfo.name, margin + 45, yPos + 5)

    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)
    let yHeader = yPos + 11
    doc.text(companyInfo.owner || 'TIAGO BRUNO GIAQUINTO', margin + 45, yHeader)
    yHeader += 4
    doc.text(`CNPJ: ${companyInfo.cnpj}`, margin + 45, yHeader)
    yHeader += 4
    doc.text(companyInfo.address, margin + 45, yHeader)
    yHeader += 4
    doc.text(`${companyInfo.city}-${companyInfo.state}`, margin + 45, yHeader)
    yHeader += 4
    doc.text(`CEP ${companyInfo.zip || '02734-010'}`, margin + 45, yHeader)

    const rightX = pageWidth - margin
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)

    doc.setFontSize(8)
    doc.setTextColor(...mediumGray)
    doc.text('Data:', rightX - 50, yPos + 5)
    doc.setTextColor(...darkGray)
    doc.text(new Date(data.date).toLocaleDateString('pt-BR'), rightX - 5, yPos + 5, { align: 'right' })

    let yContact = yPos + 11
    doc.setTextColor(...mediumGray)
    doc.text('Email:', rightX - 60, yContact)
    doc.setTextColor(...darkGray)
    doc.text(companyInfo.email, rightX - 5, yContact, { align: 'right' })
    yContact += 4
    doc.setTextColor(...mediumGray)
    doc.text('Tel:', rightX - 60, yContact)
    doc.setTextColor(...darkGray)
    doc.text(companyInfo.phone, rightX - 5, yContact, { align: 'right' })
    yContact += 4

    if (companyInfo.instagram) {
      doc.setTextColor(...mediumGray)
      doc.text('Instagram:', rightX - 60, yContact)
      doc.setTextColor(...darkGray)
      doc.text(companyInfo.instagram, rightX - 5, yContact, { align: 'right' })
    }
  }

  const addFooter = () => {
    const footerY = pageHeight - 18

    // Linha separadora discreta
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY, pageWidth - margin, footerY)

    // Fonte pequena e discreta (Times New Roman)
    doc.setFont('times', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)

    let yFooter = footerY + 3

    // Linha 1: Nome e Email
    doc.text(companyInfo.owner || 'TIAGO BRUNO GIAQUINTO', margin, yFooter)
    doc.text(`Email: ${companyInfo.email}`, pageWidth - margin, yFooter, { align: 'right' })

    yFooter += 3
    // Linha 2: CNPJ e Telefone
    doc.text(`CNPJ: ${companyInfo.cnpj}`, margin, yFooter)
    doc.text(`Tel: ${companyInfo.phone}`, pageWidth - margin, yFooter, { align: 'right' })

    yFooter += 3
    // Linha 3: Endereço e Instagram
    doc.text(companyInfo.address, margin, yFooter)
    if (companyInfo.instagram) {
      doc.text(`@${companyInfo.instagram}`, pageWidth - margin, yFooter, { align: 'right' })
    }

    yFooter += 3
    // Linha 4: Cidade/Estado e Site
    doc.text(`${companyInfo.city}-${companyInfo.state} - CEP ${companyInfo.zip || '02734-010'}`, margin, yFooter)
    doc.text(companyInfo.website || 'tgarconnection.com.br', pageWidth - margin, yFooter, { align: 'right' })
  }

  await addHeader(1)

  yPos = 60

  doc.setFont('times', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(...mediumGray)
  doc.text('Sua satisfação é o que motiva a nossa dedicação.', pageWidth / 2, yPos, { align: 'center' })

  yPos += 10

  doc.setFillColor(...primaryBlue)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 15, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text(`Ordem de serviço ${data.order_number}`, margin + 5, yPos + 7)

  if (data.title) {
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.text(data.title, margin + 5, yPos + 12)
  }

  yPos += 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...darkGray)
  doc.text(`Cliente: ${data.client.name}`, margin, yPos)

  yPos += 6

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  if (data.client.company_name) {
    doc.text(data.client.company_name, margin, yPos)
    yPos += 4
  }

  if (data.client.cnpj) {
    doc.text(`CNPJ: ${data.client.cnpj}`, margin, yPos)
    yPos += 4
  } else if (data.client.cpf) {
    doc.text(`CPF: ${data.client.cpf}`, margin, yPos)
    yPos += 4
  }

  if (data.client.address) {
    doc.text(data.client.address, margin, yPos)
    yPos += 4
    if (data.client.city) {
      doc.text(`${data.client.city}, ${data.client.state}-${data.client.state}`, margin, yPos)
      yPos += 4
    }
    if (data.client.cep) {
      doc.text(`CEP ${data.client.cep}`, margin, yPos)
      yPos += 4
    }
  }

  if (data.client.email) {
    doc.setFontSize(9)
    doc.setTextColor(...mediumGray)
    doc.text('Email:', margin, yPos)
    doc.setTextColor(...darkGray)
    doc.text(data.client.email, margin + 15, yPos)
    yPos += 4
  }

  if (data.client.phone) {
    doc.setFontSize(9)
    doc.setTextColor(...mediumGray)
    doc.text('Tel:', margin, yPos)
    doc.setTextColor(...darkGray)
    doc.text(data.client.phone, margin + 15, yPos)
    yPos += 4
  }

  yPos += 6

  if (data.basic_info) {
    doc.setFillColor(...lightBlue)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...primaryBlue)
    doc.text('Informações básicas', margin + 3, yPos + 5.5)

    yPos += 12

    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)

    const halfWidth = (pageWidth - 2 * margin) / 2

    doc.setFont('helvetica', 'bold')
    doc.text('Prazo de execução', margin, yPos)
    doc.text('Marca', margin + halfWidth, yPos)
    yPos += 4

    doc.setFont('times', 'normal')
    doc.text(data.basic_info.deadline, margin, yPos)
    if (data.basic_info.brand) {
      doc.text(data.basic_info.brand, margin + halfWidth, yPos)
    }
    yPos += 6

    doc.setFont('helvetica', 'bold')
    doc.text('Modelo', margin, yPos)
    doc.text('Aparelho', margin + halfWidth, yPos)
    yPos += 4

    doc.setFont('times', 'normal')
    if (data.basic_info.model) {
      doc.text(data.basic_info.model, margin, yPos)
    }
    if (data.basic_info.equipment) {
      doc.text(data.basic_info.equipment, margin + halfWidth, yPos)
    }

    yPos += 8
  }

  doc.setFillColor(...lightBlue)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryBlue)
  doc.text('Serviços', margin + 3, yPos + 5.5)

  yPos += 12

  const tableBody: any[] = []
  const materialsBody: any[] = []

  data.items.forEach(item => {
    const descText = generateServiceDescription(item)

    // Separar serviços de materiais
    const isMaterial = item.service_description?.toLowerCase().includes('material') ||
                      item.service_description?.toLowerCase().includes('peça') ||
                      descText.toLowerCase().includes('material')

    const rowData = [
      descText,
      item.unit,
      data.hide_material_prices && isMaterial ? '-' : `R$ ${item.unit_price.toFixed(2)}`,
      item.quantity.toString(),
      data.hide_material_prices && isMaterial ? '-' : `R$ ${item.total_price.toFixed(2)}`
    ]

    if (isMaterial && data.hide_material_prices) {
      materialsBody.push(rowData)
    } else {
      tableBody.push(rowData)
    }
  })

  // Adicionar materiais ao final sem preços se hide_material_prices
  if (data.hide_material_prices && materialsBody.length > 0) {
    tableBody.push(...materialsBody)
  }

  const tableResult = autoTable(doc, {
    startY: yPos,
    head: [['Descrição do Serviço', 'Unidade', 'Preço Unit.', 'Qtd.', 'Total']],
    body: tableBody,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      textColor: darkGray,
      lineColor: [255, 255, 255],
      lineWidth: 0
    },
    headStyles: {
      fillColor: lightBlue,
      textColor: primaryBlue,
      fontStyle: 'bold',
      halign: 'left',
      lineWidth: 0
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    didParseCell: function(data: any) {
      if (data.row.index === tableBody.length && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  yPos = (doc as any).lastAutoTable.finalY + 5

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  const totalsX = pageWidth - margin - 70

  doc.text('Serviços', totalsX, yPos, { align: 'right' })
  doc.text(`R$ ${data.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
  yPos += 6

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryBlue)
  doc.text('Subtotal', totalsX, yPos, { align: 'right' })
  doc.text(`R$ ${data.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
  yPos += 6

  if (data.discount > 0) {
    doc.setFont('times', 'normal')
    doc.setTextColor(...darkGray)
    doc.text('Desconto sobre serviços', totalsX, yPos, { align: 'right' })
    doc.text(`- R$ ${data.discount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
    yPos += 6
  }

  doc.setFillColor(...primaryBlue)
  doc.rect(totalsX - 5, yPos - 5, pageWidth - totalsX + 5 - margin, 10, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('Total', totalsX, yPos + 2, { align: 'right' })
  doc.text(`R$ ${data.total.toFixed(2)}`, pageWidth - margin - 3, yPos + 2, { align: 'right' })

  yPos += 15

  doc.setFillColor(...lightBlue)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryBlue)
  doc.text('Pagamento', margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)
  doc.text('Meios de pagamento', margin, yPos)

  const halfWidth = (pageWidth - 2 * margin) / 2
  doc.text('PIX', margin + halfWidth, yPos)
  yPos += 4

  doc.setFont('times', 'normal')
  const methodsLines = doc.splitTextToSize(data.payment.methods, halfWidth - 10)
  doc.text(methodsLines, margin, yPos)

  doc.text(data.payment.pix || companyInfo.cnpj, margin + halfWidth, yPos)

  addFooter()

  doc.addPage()
  yPos = 20

  if (data.payment.bank_details) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)
    doc.text('Dados bancários', margin, yPos)

    const halfWidth = (pageWidth - 2 * margin) / 2
    doc.text('Condições de pagamento', margin + halfWidth, yPos)
    yPos += 4

    doc.setFont('times', 'normal')
    const bank = data.payment.bank_details
    doc.text(`Banco: ${bank.bank}`, margin, yPos)
    yPos += 4
    doc.text(`Agência: ${bank.agency}`, margin, yPos)
    yPos += 4
    doc.text(`Conta: ${bank.account}`, margin, yPos)
    yPos += 4
    doc.text(`Tipo de conta: ${bank.account_type}`, margin, yPos)
    yPos += 4
    doc.text(`Titular da conta (CPF/CNPJ): ${bank.holder}`, margin, yPos)

    yPos -= 20
    const conditionsLines = doc.splitTextToSize(data.payment.conditions, halfWidth - 10)
    doc.text(conditionsLines, margin + halfWidth, yPos)

    yPos += Math.max(20, conditionsLines.length * 4) + 8
  }

  if (data.warranty) {
    doc.setFillColor(...lightBlue)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...primaryBlue)
    doc.text('Garantia', margin + 3, yPos + 5.5)

    yPos += 12

    if (data.warranty.period) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...darkGray)
      doc.text('Período de garantia', margin, yPos)
      yPos += 4

      doc.setFont('times', 'normal')
      doc.text(data.warranty.period, margin, yPos)
      yPos += 8
    }

    doc.setFont('helvetica', 'bold')
    doc.text('Condições da garantia', margin, yPos)
    yPos += 4

    doc.setFont('times', 'normal')
    const warrantyText = typeof data.warranty.conditions === 'string'
      ? data.warranty.conditions
      : Array.isArray(data.warranty.conditions)
      ? data.warranty.conditions.join('\n\n')
      : ''

    const warrantyLines = doc.splitTextToSize(warrantyText, pageWidth - 2 * margin - 6)
    doc.text(warrantyLines, margin, yPos)
    yPos += warrantyLines.length * 4 + 8
  }

  if (data.contract_clauses && data.contract_clauses.length > 0) {
    doc.setFillColor(...lightBlue)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...primaryBlue)
    doc.text('Cláusulas contratuais', margin + 3, yPos + 5.5)

    yPos += 12

    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)

    data.contract_clauses.forEach((clause: any) => {
      if (yPos > pageHeight - 60) {
        addFooter()
        doc.addPage()
        yPos = 15
      }

      doc.setFont('helvetica', 'bold')
      doc.text(clause.title, margin, yPos)
      yPos += 5

      doc.setFont('times', 'normal')
      clause.items.forEach((item: string) => {
        const itemLines = doc.splitTextToSize(item, pageWidth - 2 * margin - 6)
        doc.text(itemLines, margin, yPos)
        yPos += itemLines.length * 4
      })
      yPos += 4
    })
  }

  if (data.additional_info) {
    doc.setFillColor(...lightBlue)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...primaryBlue)
    doc.text('Informações adicionais', margin + 3, yPos + 5.5)

    yPos += 12

    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)

    const infoLines = doc.splitTextToSize(data.additional_info, pageWidth - 2 * margin - 6)
    doc.text(infoLines, margin, yPos)
    yPos += infoLines.length * 4 + 8
  }

  doc.setFont('times', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(...mediumGray)
  doc.text(
    'obrigado pela confiança, estaremos à disposição.',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  yPos += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...darkGray)
  doc.text(
    `${data.client.city || companyInfo.city}, ${new Date(data.date).toLocaleDateString('pt-BR')}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )

  yPos += 10

  doc.setFillColor(...lightBlue)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setFillColor(...primaryBlue)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.text('Termos e Condições do Contrato', margin + 3, yPos + 5)
  yPos += 12

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  const contractTerms = [
    '1. OBJETO: Este contrato tem como objeto a prestação de serviços conforme descritos nesta Ordem de Serviço.',
    '2. PRAZO: Os serviços serão executados no prazo especificado, salvo em casos de força maior.',
    '3. PAGAMENTO: O pagamento deverá ser realizado conforme condições especificadas neste documento.',
    '4. GARANTIA: A garantia dos serviços está sujeita às condições descritas na seção de Garantia.',
    '5. RESPONSABILIDADES: O contratante deve fornecer acesso adequado e condições necessárias para execução dos serviços.',
    '6. CANCELAMENTO: Cancelamentos devem ser comunicados com antecedência mínima de 24 horas.',
    '7. MANUTENÇÃO: Para manter a validade da garantia estendida, as manutenções preventivas devem ser realizadas nos prazos estabelecidos.',
    '8. ACEITAÇÃO: A assinatura deste documento implica na aceitação integral de todos os termos aqui descritos.'
  ]

  contractTerms.forEach((term) => {
    const lines = doc.splitTextToSize(term, pageWidth - 2 * margin - 4)
    lines.forEach((line: string) => {
      if (yPos > pageHeight - 40) {
        addFooter()
        doc.addPage()
        yPos = 20
      }
      doc.text(line, margin + 2, yPos)
      yPos += 4
    })
    yPos += 2
  })

  addFooter()

  doc.addPage()
  yPos = pageHeight / 2 - 40

  const sigWidth = (pageWidth - 2 * margin - 20) / 2
  const leftSigX = margin
  const rightSigX = pageWidth / 2 + 10

  doc.setDrawColor(...darkGray)
  doc.setLineWidth(0.5)
  doc.line(leftSigX, yPos, leftSigX + sigWidth, yPos)
  doc.line(rightSigX, yPos, rightSigX + sigWidth, yPos)

  yPos += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...darkGray)
  doc.text(companyInfo.name, leftSigX + sigWidth / 2, yPos, { align: 'center' })
  doc.text(data.client.name, rightSigX + sigWidth / 2, yPos, { align: 'center' })

  yPos += 5

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.text(companyInfo.owner || 'Tiago Bruno Giaquinto', leftSigX + sigWidth / 2, yPos, { align: 'center' })
  if (data.client.cnpj) {
    doc.text(`CNPJ ${data.client.cnpj}`, rightSigX + sigWidth / 2, yPos, { align: 'center' })
  } else if (data.client.cpf) {
    doc.text(`CPF ${data.client.cpf}`, rightSigX + sigWidth / 2, yPos, { align: 'center' })
  }

  yPos += 5

  doc.setFont('times', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(...mediumGray)
  doc.text('diretor técnico', leftSigX + sigWidth / 2, yPos, { align: 'center' })

  addFooter()

  doc.save(`Ordem_de_servico_${data.order_number}_${new Date().toISOString().split('T')[0]}.pdf`)
}

export default generateServiceOrderPDFGiartech
