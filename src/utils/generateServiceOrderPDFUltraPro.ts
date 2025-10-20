import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { getCompanyInfo, type CompanyInfo as GiartechCompanyInfo } from './companyData'

interface CompanyInfo {
  name: string
  cnpj: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  website: string
  logo?: string
}

interface Customer {
  nome_razao: string
  cnpj_cpf: string
  email: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
}

interface Material {
  nome: string
  quantidade: number
  unidade_medida: string
  preco_venda_unitario?: number
  valor_total: number
}

interface Funcionario {
  nome: string
  tempo_minutos: number
  custo_hora?: number
  custo_total: number
}

interface ServiceItem {
  descricao: string
  quantidade: number
  preco_unitario: number
  preco_total: number
  tempo_estimado_minutos?: number
  materiais?: Material[]
  funcionarios?: Funcionario[]
}

interface AdditionalCosts {
  deslocamento?: number
  estacionamento?: number
  pedagio?: number
  outros?: number
  descricao_outros?: string
}

interface OrderData {
  order_number: string
  created_at: string
  status: string
  customer: Customer
  description: string
  scheduled_at: string
  prazo_execucao_dias?: number
  data_inicio_execucao?: string
  data_fim_execucao?: string
  items: ServiceItem[]
  payment_method: string
  payment_installments: number
  warranty_period: number
  warranty_type: string
  warranty_terms?: string
  subtotal: number
  discount_amount: number
  final_total: number
  notes?: string
  additional_costs?: AdditionalCosts
}

export const generateServiceOrderPDFUltraPro = async (orderData: OrderData, companyInfo?: CompanyInfo) => {
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
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  // Cores
  const primaryColor: [number, number, number] = [37, 99, 235] // Azul
  const secondaryColor: [number, number, number] = [147, 51, 234] // Roxo
  const successColor: [number, number, number] = [34, 197, 94] // Verde
  const textColor: [number, number, number] = [31, 41, 55] // Cinza escuro
  const lightGray: [number, number, number] = [243, 244, 246]

  // Função auxiliar para desenhar retângulo com gradiente simulado
  const drawGradientHeader = () => {
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageWidth, 35, 'F')
    doc.setFillColor(147, 51, 234)
    doc.setGState(new (doc as any).GState({ opacity: 0.3 }))
    doc.rect(pageWidth * 0.6, 0, pageWidth * 0.4, 35, 'F')
    doc.setGState(new (doc as any).GState({ opacity: 1 }))
  }

  // ===== CABEÇALHO COM GRADIENTE =====
  drawGradientHeader()

  // Logo/Nome da Empresa
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name.toUpperCase(), margin, 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`CNPJ: ${company.cnpj}`, margin, 21)
  doc.text(`${company.phone} | ${company.email}`, margin, 26)
  doc.text(`${company.website}`, margin, 31)

  // Número da OS (direita)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  const osText = `OS #${orderData.order_number}`
  doc.text(osText, pageWidth - margin, 18, { align: 'right' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const dataEmissao = new Date(orderData.created_at).toLocaleDateString('pt-BR')
  doc.text(`Emitida em: ${dataEmissao}`, pageWidth - margin, 25, { align: 'right' })

  yPosition = 45

  // ===== TÍTULO DO DOCUMENTO =====
  doc.setFillColor(...lightGray)
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 12, 'F')

  doc.setTextColor(...primaryColor)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ORDEM DE SERVIÇO', pageWidth / 2, yPosition + 8, { align: 'center' })

  yPosition += 20

  // ===== DADOS DO CLIENTE =====
  doc.setFillColor(...primaryColor)
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('DADOS DO CLIENTE', margin + 3, yPosition + 5.5)

  yPosition += 12

  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Razão Social / Nome:', margin, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(orderData.customer.nome_razao || 'Não informado', margin + 45, yPosition)

  yPosition += 6
  doc.setFont('helvetica', 'bold')
  doc.text('CNPJ / CPF:', margin, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(orderData.customer.cnpj_cpf || 'Não informado', margin + 45, yPosition)

  doc.setFont('helvetica', 'bold')
  doc.text('Telefone:', pageWidth / 2, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(orderData.customer.telefone || 'Não informado', pageWidth / 2 + 20, yPosition)

  yPosition += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Email:', margin, yPosition)
  doc.setFont('helvetica', 'normal')
  doc.text(orderData.customer.email || 'Não informado', margin + 45, yPosition)

  yPosition += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Endereço:', margin, yPosition)
  doc.setFont('helvetica', 'normal')
  const enderecoCompleto = `${orderData.customer.endereco || ''}, ${orderData.customer.cidade || ''} - ${orderData.customer.estado || ''}, CEP: ${orderData.customer.cep || ''}`
  doc.text(enderecoCompleto, margin + 45, yPosition)

  yPosition += 12

  // ===== PRAZO DE EXECUÇÃO =====
  if (orderData.prazo_execucao_dias || orderData.data_inicio_execucao) {
    doc.setFillColor(255, 243, 205)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 12, 'F')
    doc.setDrawColor(255, 193, 7)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 12, 'S')

    yPosition += 4
    doc.setTextColor(180, 83, 9)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')

    let prazoTexto = ''
    if (orderData.data_inicio_execucao && orderData.data_fim_execucao) {
      const dataInicio = new Date(orderData.data_inicio_execucao).toLocaleDateString('pt-BR')
      const dataFim = new Date(orderData.data_fim_execucao).toLocaleDateString('pt-BR')
      prazoTexto = `PRAZO DE EXECUÇÃO: ${orderData.prazo_execucao_dias} dias úteis (${dataInicio} até ${dataFim})`
    } else if (orderData.prazo_execucao_dias) {
      prazoTexto = `PRAZO DE EXECUÇÃO: ${orderData.prazo_execucao_dias} dias úteis`
    }

    doc.text(prazoTexto, pageWidth / 2, yPosition + 4, { align: 'center' })
    yPosition += 12
  }

  yPosition += 3

  // ===== DESCRIÇÃO DO SERVIÇO =====
  doc.setFillColor(...primaryColor)
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIÇÃO DOS SERVIÇOS', margin + 3, yPosition + 5.5)

  yPosition += 12

  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const descLines = doc.splitTextToSize(orderData.description, pageWidth - 2 * margin - 10)
  doc.text(descLines, margin + 5, yPosition)
  yPosition += descLines.length * 5 + 5

  // ===== TABELA DE SERVIÇOS =====
  if (orderData.items && orderData.items.length > 0) {
    yPosition += 5

    doc.setFillColor(...primaryColor)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('DETALHAMENTO DOS SERVIÇOS', margin + 3, yPosition + 5.5)

    yPosition += 12

    orderData.items.forEach((item, index) => {
      // Verificar espaço na página
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margin
      }

      // Box do serviço
      doc.setFillColor(249, 250, 251)
      doc.setDrawColor(229, 231, 235)
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'FD')

      yPosition += 5

      // Título do serviço
      doc.setTextColor(...primaryColor)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${item.descricao}`, margin + 3, yPosition)

      yPosition += 7

      // Informações do serviço
      doc.setTextColor(...textColor)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      doc.text(`Quantidade: ${item.quantidade}`, margin + 5, yPosition)
      doc.text(`Preço Unit.: ${formatCurrency(item.preco_unitario)}`, margin + 50, yPosition)
      doc.text(`Total: ${formatCurrency(item.preco_total)}`, margin + 100, yPosition)

      if (item.tempo_estimado_minutos) {
        doc.text(`Tempo: ${item.tempo_estimado_minutos} min`, margin + 145, yPosition)
      }

      yPosition += 5

      // Materiais
      if (item.materiais && item.materiais.length > 0) {
        yPosition += 3
        doc.setTextColor(34, 197, 94)
        doc.setFont('helvetica', 'bold')
        doc.text('📦 Materiais:', margin + 5, yPosition)

        yPosition += 5
        doc.setTextColor(...textColor)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)

        item.materiais.forEach(mat => {
          if (yPosition > pageHeight - 40) {
            doc.addPage()
            yPosition = margin
          }

          const matText = `• ${mat.nome} - ${mat.quantidade} ${mat.unidade_medida} - ${formatCurrency(mat.valor_total)}`
          doc.text(matText, margin + 8, yPosition)
          yPosition += 4
        })
      }

      // Mão de Obra
      if (item.funcionarios && item.funcionarios.length > 0) {
        yPosition += 3
        doc.setTextColor(147, 51, 234)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('👷 Mão de Obra:', margin + 5, yPosition)

        yPosition += 5
        doc.setTextColor(...textColor)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)

        item.funcionarios.forEach(func => {
          if (yPosition > pageHeight - 40) {
            doc.addPage()
            yPosition = margin
          }

          const funcText = `• ${func.nome} - ${func.tempo_minutos} min - ${formatCurrency(func.custo_total)}`
          doc.text(funcText, margin + 8, yPosition)
          yPosition += 4
        })
      }

      yPosition += 5
    })
  }

  // Verificar espaço para custos adicionais
  if (yPosition > pageHeight - 80) {
    doc.addPage()
    yPosition = margin
  }

  // ===== CUSTOS ADICIONAIS =====
  const additionalCosts = orderData.additional_costs
  const hasAdditionalCosts = additionalCosts && (
    additionalCosts.deslocamento ||
    additionalCosts.estacionamento ||
    additionalCosts.pedagio ||
    additionalCosts.outros
  )

  if (hasAdditionalCosts) {
    yPosition += 5

    doc.setFillColor(220, 38, 38)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('CUSTOS ADICIONAIS (DEDUZIDOS)', margin + 3, yPosition + 5.5)

    yPosition += 12

    doc.setTextColor(220, 38, 38)
    doc.setFontSize(10)

    if (additionalCosts.deslocamento) {
      doc.setFont('helvetica', 'bold')
      doc.text('🚗 Deslocamento:', margin + 5, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text('-' + formatCurrency(additionalCosts.deslocamento), pageWidth - margin - 30, yPosition)
      yPosition += 6
    }

    if (additionalCosts.estacionamento) {
      doc.setFont('helvetica', 'bold')
      doc.text('🅿️ Estacionamento:', margin + 5, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text('-' + formatCurrency(additionalCosts.estacionamento), pageWidth - margin - 30, yPosition)
      yPosition += 6
    }

    if (additionalCosts.pedagio) {
      doc.setFont('helvetica', 'bold')
      doc.text('🛣️ Pedágio:', margin + 5, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text('-' + formatCurrency(additionalCosts.pedagio), pageWidth - margin - 30, yPosition)
      yPosition += 6
    }

    if (additionalCosts.outros) {
      doc.setFont('helvetica', 'bold')
      const descOutros = additionalCosts.descricao_outros || 'Outros'
      doc.text(`💰 ${descOutros}:`, margin + 5, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text('-' + formatCurrency(additionalCosts.outros), pageWidth - margin - 30, yPosition)
      yPosition += 6
    }

    yPosition += 5
  }

  // ===== RESUMO FINANCEIRO =====
  if (yPosition > pageHeight - 60) {
    doc.addPage()
    yPosition = margin
  }

  yPosition += 5

  doc.setFillColor(...successColor)
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMO FINANCEIRO', margin + 3, yPosition + 5.5)

  yPosition += 12

  const boxWidth = pageWidth - 2 * margin
  const boxX = margin

  doc.setFillColor(249, 250, 251)
  doc.setDrawColor(...successColor)
  doc.setLineWidth(0.5)
  doc.rect(boxX, yPosition, boxWidth, 35, 'FD')

  yPosition += 8

  doc.setTextColor(...textColor)
  doc.setFontSize(11)

  // Subtotal
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal dos Serviços:', boxX + 5, yPosition)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(orderData.subtotal), pageWidth - margin - 5, yPosition, { align: 'right' })

  yPosition += 7

  // Custos Adicionais Total
  if (hasAdditionalCosts) {
    const totalAdditional = (additionalCosts.deslocamento || 0) +
                           (additionalCosts.estacionamento || 0) +
                           (additionalCosts.pedagio || 0) +
                           (additionalCosts.outros || 0)

    doc.setTextColor(220, 38, 38)
    doc.setFont('helvetica', 'normal')
    doc.text('Custos Adicionais (Deduzidos):', boxX + 5, yPosition)
    doc.setFont('helvetica', 'bold')
    doc.text('-' + formatCurrency(totalAdditional), pageWidth - margin - 5, yPosition, { align: 'right' })
    doc.setTextColor(...textColor)
    yPosition += 7
  }

  // Desconto
  if (orderData.discount_amount > 0) {
    doc.setTextColor(220, 38, 38)
    doc.setFont('helvetica', 'normal')
    doc.text('Desconto:', boxX + 5, yPosition)
    doc.setFont('helvetica', 'bold')
    doc.text(`- ${formatCurrency(orderData.discount_amount)}`, pageWidth - margin - 5, yPosition, { align: 'right' })
    yPosition += 7
  }

  // Total Final
  doc.setDrawColor(...successColor)
  doc.setLineWidth(0.8)
  doc.line(boxX + 5, yPosition - 2, pageWidth - margin - 5, yPosition - 2)

  yPosition += 3

  doc.setTextColor(...successColor)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('VALOR TOTAL:', boxX + 5, yPosition)
  doc.text(formatCurrency(orderData.final_total), pageWidth - margin - 5, yPosition, { align: 'right' })

  yPosition += 15

  // ===== CONDIÇÕES DE PAGAMENTO =====
  if (yPosition > pageHeight - 50) {
    doc.addPage()
    yPosition = margin
  }

  doc.setFillColor(...primaryColor)
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('CONDIÇÕES COMERCIAIS', margin + 3, yPosition + 5.5)

  yPosition += 12

  doc.setTextColor(...textColor)
  doc.setFontSize(10)

  // Forma de Pagamento
  doc.setFont('helvetica', 'bold')
  doc.text('Forma de Pagamento:', margin + 5, yPosition)
  doc.setFont('helvetica', 'normal')
  const paymentMethodText = orderData.payment_method.replace(/_/g, ' ').toUpperCase()
  doc.text(paymentMethodText, margin + 60, yPosition)

  yPosition += 6

  // Parcelamento
  if (orderData.payment_installments > 1) {
    doc.setFont('helvetica', 'bold')
    doc.text('Parcelamento:', margin + 5, yPosition)
    doc.setFont('helvetica', 'normal')
    const valorParcela = orderData.final_total / orderData.payment_installments
    doc.text(
      `${orderData.payment_installments}x de ${formatCurrency(valorParcela)} sem juros`,
      margin + 60,
      yPosition
    )
    yPosition += 6
  }

  // Garantia
  doc.setFont('helvetica', 'bold')
  doc.text('Garantia:', margin + 5, yPosition)
  doc.setFont('helvetica', 'normal')
  const warrantyText = `${orderData.warranty_period} ${
    orderData.warranty_type === 'days' ? 'dias' :
    orderData.warranty_type === 'months' ? 'meses' : 'anos'
  }`
  doc.text(warrantyText, margin + 60, yPosition)

  yPosition += 10

  // Observações
  if (orderData.notes) {
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFillColor(...lightGray)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')

    doc.setTextColor(...primaryColor)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVAÇÕES', margin + 3, yPosition + 5.5)

    yPosition += 12

    doc.setTextColor(...textColor)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    const notesLines = doc.splitTextToSize(orderData.notes, pageWidth - 2 * margin - 10)
    doc.text(notesLines, margin + 5, yPosition)
    yPosition += notesLines.length * 4 + 5
  }

  // ===== RODAPÉ =====
  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 20

    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY, pageWidth - margin, footerY)

    doc.setTextColor(100, 116, 139)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')

    doc.text(
      `${company.address}, ${company.city} - ${company.state}, CEP: ${company.zip}`,
      pageWidth / 2,
      footerY + 5,
      { align: 'center' }
    )

    doc.text(
      `Tel: ${company.phone} | Email: ${company.email} | ${company.website}`,
      pageWidth / 2,
      footerY + 9,
      { align: 'center' }
    )

    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY + 9, { align: 'right' })
  }

  // Adicionar rodapé em todas as páginas
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(i, totalPages)
  }

  // Salvar PDF
  const fileName = `OS-${orderData.order_number}-${new Date().getTime()}.pdf`
  doc.save(fileName)
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}
