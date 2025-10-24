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

    doc.setFont('helvetica', 'normal')
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

    doc.text('📅', rightX - 35, yPos + 5)
    doc.text(new Date(data.date).toLocaleDateString('pt-BR'), rightX - 5, yPos + 5, { align: 'right' })

    let yContact = yPos + 11
    doc.text('✉', rightX - 60, yContact)
    doc.text(companyInfo.email, rightX - 5, yContact, { align: 'right' })
    yContact += 4
    doc.text('📞', rightX - 60, yContact)
    doc.text(companyInfo.phone, rightX - 5, yContact, { align: 'right' })
    yContact += 4

    if (companyInfo.instagram) {
      doc.text('📱', rightX - 60, yContact)
      doc.text(companyInfo.instagram, rightX - 5, yContact, { align: 'right' })
    }
  }

  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 25

    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY, pageWidth - margin, footerY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...mediumGray)

    let yFooter = footerY + 5
    doc.text(companyInfo.owner || 'TIAGO BRUNO GIAQUINTO', margin, yFooter)
    doc.text('✉', pageWidth - 80, yFooter)
    doc.text(companyInfo.email, pageWidth - margin, yFooter, { align: 'right' })

    yFooter += 4
    doc.text(`CNPJ: ${companyInfo.cnpj}`, margin, yFooter)
    doc.text('📞', pageWidth - 80, yFooter)
    doc.text(companyInfo.phone, pageWidth - margin, yFooter, { align: 'right' })

    yFooter += 4
    doc.text(companyInfo.address, margin, yFooter)
    if (companyInfo.instagram) {
      doc.text('📱', pageWidth - 80, yFooter)
      doc.text(companyInfo.instagram, pageWidth - margin, yFooter, { align: 'right' })
    }

    yFooter += 4
    doc.text(`${companyInfo.city}-${companyInfo.state}`, margin, yFooter)
    doc.text('🌐', pageWidth - 80, yFooter)
    doc.text(companyInfo.website || 'tgarconnection.com.br', pageWidth - margin, yFooter, { align: 'right' })

    yFooter += 4
    doc.text(`CEP ${companyInfo.zip || '02734-010'}`, margin, yFooter)

    yFooter += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(
      `@${companyInfo.instagram || 'tg.arconnection'}     ${companyInfo.website || 'tgarconnection.com.br'}`,
      margin,
      yFooter
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Página ${pageNum}/${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }

  await addHeader(1)

  yPos = 60

  doc.setFont('helvetica', 'italic')
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
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(data.title, margin + 5, yPos + 12)
  }

  yPos += 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...darkGray)
  doc.text(`Cliente: ${data.client.name}`, margin, yPos)

  yPos += 6

  doc.setFont('helvetica', 'normal')
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
    doc.text(`✉ ${data.client.email}`, margin, yPos)
    yPos += 4
  }

  if (data.client.phone) {
    doc.text(`📞 ${data.client.phone}`, margin, yPos)
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

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)

    const halfWidth = (pageWidth - 2 * margin) / 2

    doc.setFont('helvetica', 'bold')
    doc.text('Prazo de execução', margin, yPos)
    doc.text('Marca', margin + halfWidth, yPos)
    yPos += 4

    doc.setFont('helvetica', 'normal')
    doc.text(data.basic_info.deadline, margin, yPos)
    if (data.basic_info.brand) {
      doc.text(data.basic_info.brand, margin + halfWidth, yPos)
    }
    yPos += 6

    doc.setFont('helvetica', 'bold')
    doc.text('Modelo', margin, yPos)
    doc.text('Aparelho', margin + halfWidth, yPos)
    yPos += 4

    doc.setFont('helvetica', 'normal')
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
  data.items.forEach(item => {
    // Usar função centralizada para gerar descrição completa
    const descText = generateServiceDescription(item)

    tableBody.push([
      descText,
      item.unit,
      `R$ ${item.unit_price.toFixed(2)}`,
      item.quantity.toString(),
      `R$ ${item.total_price.toFixed(2)}`
    ])
  })

  ;(doc as any).autoTable({
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

  doc.setFont('helvetica', 'normal')
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
    doc.setFont('helvetica', 'normal')
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

  doc.setFont('helvetica', 'normal')
  const methodsLines = doc.splitTextToSize(data.payment.methods, halfWidth - 10)
  doc.text(methodsLines, margin, yPos)

  doc.text(data.payment.pix || companyInfo.cnpj, margin + halfWidth, yPos)

  addFooter(1, 3)

  doc.addPage()
  yPos = 15
  await addHeader(2)
  yPos = 60

  if (data.payment.bank_details) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)
    doc.text('Dados bancários', margin, yPos)

    const halfWidth = (pageWidth - 2 * margin) / 2
    doc.text('Condições de pagamento', margin + halfWidth, yPos)
    yPos += 4

    doc.setFont('helvetica', 'normal')
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

      doc.setFont('helvetica', 'normal')
      doc.text(data.warranty.period, margin, yPos)
      yPos += 8
    }

    doc.setFont('helvetica', 'bold')
    doc.text('Condições da garantia', margin, yPos)
    yPos += 4

    doc.setFont('helvetica', 'normal')
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

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)

    data.contract_clauses.forEach((clause: any) => {
      if (yPos > pageHeight - 60) {
        addFooter(2, 3)
        doc.addPage()
        yPos = 15
      }

      doc.setFont('helvetica', 'bold')
      doc.text(clause.title, margin, yPos)
      yPos += 5

      doc.setFont('helvetica', 'normal')
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

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)

    const infoLines = doc.splitTextToSize(data.additional_info, pageWidth - 2 * margin - 6)
    doc.text(infoLines, margin, yPos)
    yPos += infoLines.length * 4 + 8
  }

  doc.setFont('helvetica', 'italic')
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

  addFooter(2, 3)

  doc.addPage()
  yPos = 15
  await addHeader(3)
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

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(companyInfo.owner || 'Tiago Bruno Giaquinto', leftSigX + sigWidth / 2, yPos, { align: 'center' })
  if (data.client.cnpj) {
    doc.text(`CNPJ ${data.client.cnpj}`, rightSigX + sigWidth / 2, yPos, { align: 'center' })
  } else if (data.client.cpf) {
    doc.text(`CPF ${data.client.cpf}`, rightSigX + sigWidth / 2, yPos, { align: 'center' })
  }

  yPos += 5

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(...mediumGray)
  doc.text('diretor técnico', leftSigX + sigWidth / 2, yPos, { align: 'center' })

  addFooter(3, 3)

  doc.save(`Ordem_de_servico_${data.order_number}_${new Date().toISOString().split('T')[0]}.pdf`)
}

export default generateServiceOrderPDFGiartech
