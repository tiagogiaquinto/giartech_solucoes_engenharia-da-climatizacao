/**
 * GERADOR DE PDF UNIFICADO - Giartech
 *
 * UM gerador para TODOS os tipos de documentos:
 * - Orçamentos (Budget)
 * - Propostas (Proposal)
 * - Ordens de Serviço (Service Order)
 * - Notas Fiscais (Invoice)
 *
 * Usa brandingConfig para identidade visual consistente
 * Templates configuráveis
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { GIARTECH_BRAND, DocumentTemplate, TEMPLATE_CONFIGS, TemplateConfig } from '../config/brandingConfig'
import { getCompanyInfo } from './companyData'

export interface DocumentData {
  // Identificação
  order_number: string
  document_type: 'budget' | 'proposal' | 'order' | 'invoice'
  title?: string
  date: string
  status?: string

  // Cliente
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

  // Informações básicas
  basic_info?: {
    deadline?: string
    start_date?: string
    execution_days?: number
    equipment?: string
    brand?: string
    model?: string
  }

  // Itens/Serviços
  items: Array<{
    descricao: string
    quantidade: number
    preco_unitario: number
    preco_total: number
    escopo_detalhado?: string
    tempo_estimado_minutos?: number
    materiais?: Array<{
      nome: string
      quantidade: number
      unidade_medida: string
      preco_compra?: number
      preco_venda?: number
    }>
    funcionarios?: Array<{
      nome: string
      tempo_minutos: number
      custo_hora?: number
    }>
  }>

  // Totais
  subtotal: number
  discount?: number
  discount_percent?: number
  additional_costs?: number
  total: number

  // Custos (opcional)
  costs?: {
    materials_cost?: number
    labor_cost?: number
    total_cost?: number
    profit?: number
    profit_margin?: number
  }

  // Pagamento
  payment?: {
    methods: string
    installments?: number
    conditions?: string
    pix?: string
    bank_details?: {
      bank: string
      agency: string
      account: string
      account_type: string
      holder: string
    }
  }

  // Garantia
  warranty?: {
    period?: string
    type?: string
    conditions?: string | string[]
  }

  // Cláusulas contratuais
  contract_clauses?: Array<{
    title: string
    content: string
  }>

  // Observações
  notes?: string
  technical_report?: string
  service_guidelines?: string
}

export interface GenerateOptions {
  template: DocumentTemplate
  includeDetails: boolean
  includeCosts: boolean
  showMaterialCosts?: boolean
  showLaborCosts?: boolean
  customBranding?: typeof GIARTECH_BRAND
}

/**
 * FUNÇÃO PRINCIPAL - Gerar PDF Unificado
 */
export const generateDocumentPDFUnified = async (
  data: DocumentData,
  options: GenerateOptions = {
    template: DocumentTemplate.STANDARD,
    includeDetails: true,
    includeCosts: false
  }
): Promise<void> => {
  const branding = options.customBranding || GIARTECH_BRAND
  const templateConfig = TEMPLATE_CONFIGS[options.template]
  const companyInfo = await getCompanyInfo()

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = branding.margins.top

  // Cores do tema
  const colors = branding.colors
  const fonts = branding.fonts

  // ============================================
  // FUNÇÕES HELPER
  // ============================================

  const addPageIfNeeded = (spaceNeeded: number = 40) => {
    if (yPos + spaceNeeded > pageHeight - branding.margins.bottom) {
      doc.addPage()
      yPos = branding.margins.top
      if (templateConfig.showHeader) {
        addHeader()
      }
      return true
    }
    return false
  }

  const addHeader = () => {
    // Cabeçalho com logo e info da empresa
    if (templateConfig.showLogo) {
      // Logo (implementar carregamento)
      doc.setFillColor(...colors.primary)
      doc.rect(branding.margins.left, yPos, 50, 50, 'F')

      doc.setTextColor(...colors.text)
      doc.setFontSize(fonts.caption.size)
      doc.text('LOGO', branding.margins.left + 15, yPos + 25)
    }

    // Info da empresa
    const xStart = branding.margins.left + (templateConfig.showLogo ? 60 : 0)
    doc.setTextColor(...colors.primary)
    doc.setFontSize(fonts.title.size)
    doc.setFont('helvetica', 'bold')
    doc.text(companyInfo.name, xStart, yPos + 10)

    doc.setTextColor(...colors.textLight)
    doc.setFontSize(fonts.small.size)
    doc.setFont('helvetica', 'normal')
    doc.text(companyInfo.address || '', xStart, yPos + 18)
    doc.text(companyInfo.phone || '', xStart, yPos + 24)
    doc.text(companyInfo.email || '', xStart, yPos + 30)

    yPos += 60
  }

  const addDocumentTitle = () => {
    // Tipo de documento
    const documentTitles: Record<string, string> = {
      budget: 'ORÇAMENTO',
      proposal: 'PROPOSTA COMERCIAL',
      order: 'ORDEM DE SERVIÇO',
      invoice: 'NOTA FISCAL'
    }

    const title = data.title || documentTitles[data.document_type] || 'DOCUMENTO'

    doc.setFillColor(...colors.primary)
    doc.rect(branding.margins.left, yPos, pageWidth - branding.margins.left - branding.margins.right, 12, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(fonts.subtitle.size)
    doc.setFont('helvetica', 'bold')
    doc.text(title, pageWidth / 2, yPos + 8, { align: 'center' })

    yPos += 20
  }

  const addDocumentInfo = () => {
    const infoData: Array<[string, string]> = [
      ['Número:', data.order_number],
      ['Data:', new Date(data.date).toLocaleDateString('pt-BR')],
    ]

    if (data.status) {
      infoData.push(['Status:', data.status.toUpperCase()])
    }

    doc.setFontSize(fonts.body.size)
    doc.setFont('helvetica', 'normal')

    infoData.forEach(([label, value], index) => {
      const xLabel = pageWidth - branding.margins.right - 80
      const yLine = yPos + (index * 6)

      doc.setTextColor(...colors.textLight)
      doc.text(label, xLabel, yLine)

      doc.setTextColor(...colors.text)
      doc.setFont('helvetica', 'bold')
      doc.text(value, xLabel + 25, yLine)
      doc.setFont('helvetica', 'normal')
    })

    yPos += (infoData.length * 6) + 10
  }

  const addClientInfo = () => {
    doc.setFillColor(...colors.backgroundLight)
    doc.rect(branding.margins.left, yPos, pageWidth - branding.margins.left - branding.margins.right, 6, 'F')

    doc.setTextColor(...colors.primary)
    doc.setFontSize(fonts.heading.size)
    doc.setFont('helvetica', 'bold')
    doc.text('DADOS DO CLIENTE', branding.margins.left + 2, yPos + 4)

    yPos += 10

    const clientInfoRaw: Array<[string, string]> = [
      ['Nome/Razão Social:', data.client.name || data.client.company_name || ''],
      ['CPF/CNPJ:', data.client.cpf || data.client.cnpj || ''],
      ['Endereço:', data.client.address || ''],
      ['Cidade/UF:', `${data.client.city || ''} - ${data.client.state || ''}`],
      ['CEP:', data.client.cep || ''],
      ['Telefone:', data.client.phone || ''],
      ['Email:', data.client.email || '']
    ]
    const clientInfo = clientInfoRaw.filter(([_, value]) => value.trim() !== '' && value.trim() !== '-')

    doc.setFontSize(fonts.body.size)
    doc.setFont('helvetica', 'normal')

    clientInfo.forEach(([label, value]) => {
      doc.setTextColor(...colors.textLight)
      doc.text(label, branding.margins.left + 2, yPos)

      doc.setTextColor(...colors.text)
      doc.text(value, branding.margins.left + 40, yPos)

      yPos += 6
    })

    yPos += 8
  }

  const addItemsTable = () => {
    addPageIfNeeded(60)

    doc.setFillColor(...colors.backgroundLight)
    doc.rect(branding.margins.left, yPos, pageWidth - branding.margins.left - branding.margins.right, 6, 'F')

    doc.setTextColor(...colors.primary)
    doc.setFontSize(fonts.heading.size)
    doc.setFont('helvetica', 'bold')
    doc.text('ITENS / SERVIÇOS', branding.margins.left + 2, yPos + 4)

    yPos += 10

    const tableData = data.items.map((item, index) => {
      const row = [
        (index + 1).toString(),
        item.descricao,
        item.quantidade.toString(),
        `R$ ${item.preco_unitario.toFixed(2)}`,
        `R$ ${item.preco_total.toFixed(2)}`
      ]
      return row
    })

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Descrição', 'Qtd', 'Valor Unit.', 'Valor Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontSize: fonts.body.size,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: fonts.body.size,
        textColor: colors.text
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: branding.margins.left, right: branding.margins.right }
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  const addTotals = () => {
    addPageIfNeeded(40)

    const totalsX = pageWidth - branding.margins.right - 60
    const labelX = totalsX - 40

    doc.setFontSize(fonts.body.size)

    // Subtotal
    doc.setTextColor(...colors.textLight)
    doc.text('Subtotal:', labelX, yPos, { align: 'right' })
    doc.setTextColor(...colors.text)
    doc.text(`R$ ${data.subtotal.toFixed(2)}`, totalsX, yPos, { align: 'right' })
    yPos += 6

    // Desconto
    if (data.discount && data.discount > 0) {
      doc.setTextColor(...colors.textLight)
      doc.text('Desconto:', labelX, yPos, { align: 'right' })
      doc.setTextColor(...colors.danger)
      doc.text(`-R$ ${data.discount.toFixed(2)}`, totalsX, yPos, { align: 'right' })
      yPos += 6
    }

    // Custos adicionais
    if (data.additional_costs && data.additional_costs > 0) {
      doc.setTextColor(...colors.textLight)
      doc.text('Custos Adicionais:', labelX, yPos, { align: 'right' })
      doc.setTextColor(...colors.text)
      doc.text(`R$ ${data.additional_costs.toFixed(2)}`, totalsX, yPos, { align: 'right' })
      yPos += 6
    }

    // Total
    yPos += 2
    doc.setDrawColor(...colors.primary)
    doc.setLineWidth(0.5)
    doc.line(labelX - 10, yPos - 2, totalsX + 10, yPos - 2)

    doc.setFontSize(fonts.heading.size)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colors.primary)
    doc.text('TOTAL:', labelX, yPos, { align: 'right' })
    doc.setFontSize(fonts.subtitle.size)
    doc.text(`R$ ${data.total.toFixed(2)}`, totalsX, yPos, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    yPos += 12
  }

  const addPaymentInfo = () => {
    if (!data.payment) return

    addPageIfNeeded(40)

    doc.setFillColor(...colors.backgroundLight)
    doc.rect(branding.margins.left, yPos, pageWidth - branding.margins.left - branding.margins.right, 6, 'F')

    doc.setTextColor(...colors.primary)
    doc.setFontSize(fonts.heading.size)
    doc.setFont('helvetica', 'bold')
    doc.text('FORMA DE PAGAMENTO', branding.margins.left + 2, yPos + 4)

    yPos += 10

    doc.setFontSize(fonts.body.size)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colors.text)

    if (data.payment.methods) {
      doc.text(`Métodos: ${data.payment.methods}`, branding.margins.left + 2, yPos)
      yPos += 6
    }

    if (data.payment.conditions) {
      doc.text(`Condições: ${data.payment.conditions}`, branding.margins.left + 2, yPos)
      yPos += 6
    }

    if (data.payment.pix) {
      doc.text(`PIX: ${data.payment.pix}`, branding.margins.left + 2, yPos)
      yPos += 6
    }

    yPos += 8
  }

  const addFooter = () => {
    if (!templateConfig.showFooter) return

    const footerY = pageHeight - 15

    doc.setDrawColor(...colors.textMuted)
    doc.setLineWidth(0.3)
    doc.line(branding.margins.left, footerY - 3, pageWidth - branding.margins.right, footerY - 3)

    doc.setTextColor(...colors.textMuted)
    doc.setFontSize(fonts.caption.size)
    doc.text(
      `${companyInfo.name} | ${companyInfo.phone || ''} | ${companyInfo.email || ''}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    )

    if (templateConfig.showPageNumbers) {
      const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber
      doc.text(`Página ${pageNum}`, pageWidth - branding.margins.right, footerY, { align: 'right' })
    }
  }

  // ============================================
  // MONTAGEM DO DOCUMENTO
  // ============================================

  // Header
  if (templateConfig.showHeader) {
    addHeader()
  }

  // Título
  addDocumentTitle()

  // Info do documento
  addDocumentInfo()

  // Cliente
  addClientInfo()

  // Itens
  addItemsTable()

  // Totais
  addTotals()

  // Pagamento
  addPaymentInfo()

  // Footer em todas as páginas
  if (templateConfig.showFooter) {
    const totalPages = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addFooter()
    }
  }

  // Salvar/Download
  const filename = `${data.document_type}_${data.order_number}_${Date.now()}.pdf`
  doc.save(filename)
}

export default generateDocumentPDFUnified
