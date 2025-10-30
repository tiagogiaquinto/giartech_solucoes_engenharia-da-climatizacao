import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCompanyInfo } from './companyData'

interface ServiceItem {
  service_name: string
  description?: string
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

interface Material {
  material_name: string
  description?: string
  unit?: string
  unit_price: number
  quantity: number
  total_price: number
}

interface ProposalData {
  proposal_number: string
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
  service_info?: {
    deadline?: string
    start_date?: string
    description?: string
  }
  services: ServiceItem[]
  materials: Material[]
  labor_cost?: number
  subtotal_services: number
  subtotal_materials: number
  subtotal: number
  discount: number
  final_total: number
  payment_methods: string[]
  payment_terms?: string
  payment_discount_info?: string
  warranty_period?: string
  warranty_terms?: string
  additional_info?: string
  special_conditions?: string
  created_at: string
}

export const generateProposalPDFComplete = async (proposalData: ProposalData) => {
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

  // =====================================================
  // PÁGINA 1: PROPOSTA COMERCIAL
  // =====================================================

  // Cabeçalho com fundo
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 55, 'F')

  // Logo circular (esquerda)
  doc.setFillColor(255, 255, 255)
  doc.circle(25, 25, 12, 'F')
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('G', 25, 30, { align: 'center' })

  // Nome da empresa
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text(companyInfo.name, 42, 22)

  // Dados da empresa
  doc.setFont('times', 'normal')
  doc.setFontSize(8)
  let yHeader = 28
  doc.text(companyInfo.owner || 'Proprietário', 42, yHeader)
  yHeader += 3.5
  doc.text(`CNPJ: ${companyInfo.cnpj}`, 42, yHeader)
  yHeader += 3.5
  doc.text(companyInfo.address, 42, yHeader)
  yHeader += 3.5
  doc.text(`${companyInfo.city}-${companyInfo.state} • CEP ${companyInfo.zip}`, 42, yHeader)

  // Dados de contato (direita)
  const rightX = pageWidth - margin
  doc.text(new Date().toLocaleString('pt-BR'), rightX, 15, { align: 'right' })
  yHeader = 28
  doc.text(companyInfo.email, rightX, yHeader, { align: 'right' })
  yHeader += 3.5
  doc.text(companyInfo.phone, rightX, yHeader, { align: 'right' })
  yHeader += 3.5
  if (companyInfo.instagram) {
    doc.text(`@${companyInfo.instagram}`, rightX, yHeader, { align: 'right' })
  }

  yPos = 65

  // Título da proposta
  doc.setFillColor(...primaryColor)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 15, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(`PROPOSTA ${proposalData.proposal_number}`, pageWidth / 2, yPos + 10, { align: 'center' })

  yPos += 25

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

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  if (proposalData.client.company_name) {
    doc.text(proposalData.client.company_name, margin + 3, yPos)
    yPos += 4
  }

  if (proposalData.client.address_street) {
    const fullAddress = [
      proposalData.client.address_street,
      proposalData.client.address_number,
      proposalData.client.address_neighborhood,
      `${proposalData.client.address_city}, ${proposalData.client.address_state}`,
      `CEP: ${proposalData.client.address_zipcode}`
    ].filter(Boolean).join(', ')

    const addressLines = doc.splitTextToSize(fullAddress, pageWidth - 2 * margin - 6)
    doc.text(addressLines, margin + 3, yPos)
    yPos += addressLines.length * 4 + 4
  }

  // =====================================================
  // INFORMAÇÕES DO SERVIÇO
  // =====================================================

  if (proposalData.service_info?.deadline) {
    checkPageBreak(25)

    doc.setFillColor(...lightGray)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...primaryColor)
    doc.text('Informações do Serviço', margin + 3, yPos + 5.5)

    yPos += 12

    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkGray)
    doc.text(`Prazo: ${proposalData.service_info.deadline}`, margin + 3, yPos)
    yPos += 8
  }

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
  const tableData: any[] = []

  proposalData.services.forEach(service => {
    // Montar descrição completa
    let fullDesc = service.service_name

    const desc = service.service_description || service.description
    if (desc && desc !== fullDesc) {
      fullDesc += `\n${desc}`
    }

    if (service.service_scope) {
      fullDesc += `\n\nESCOPO:\n${service.service_scope}`
    }

    if (service.technical_requirements) {
      fullDesc += `\n\nREQUISITOS:\n${service.technical_requirements}`
    }

    if (service.safety_warnings) {
      fullDesc += `\n\n⚠ SEGURANÇA:\n${service.safety_warnings}`
    }

    if (service.execution_steps) {
      fullDesc += `\n\nPASSOS:\n${service.execution_steps}`
    }

    if (service.expected_results) {
      fullDesc += `\n\nRESULTADOS:\n${service.expected_results}`
    }

    if (service.quality_standards) {
      fullDesc += `\n\nQUALIDADE:\n${service.quality_standards}`
    }

    if (service.warranty_info) {
      fullDesc += `\n\n🛡 GARANTIA:\n${service.warranty_info}`
    }

    if (service.observations) {
      fullDesc += `\n\nOBS:\n${service.observations}`
    }

    const duration = service.estimated_duration || service.tempo_estimado_minutos
    if (duration) {
      fullDesc += `\n\n⏱ ${duration}min`
    }

    tableData.push([
      fullDesc,
      service.unit,
      service.quantity,
      `R$ ${service.unit_price.toFixed(2)}`,
      `R$ ${service.total_price.toFixed(2)}`
    ])
  })

  // Adicionar materiais se houver
  if (proposalData.materials && proposalData.materials.length > 0) {
    proposalData.materials.forEach(material => {
      tableData.push([
        material.material_name,
        material.unit || 'un.',
        material.quantity,
        `R$ ${material.unit_price.toFixed(2)}`,
        `R$ ${material.total_price.toFixed(2)}`
      ])
    })
  }

  // Adicionar mão de obra se houver
  if (proposalData.labor_cost && proposalData.labor_cost > 0) {
    tableData.push([
      'Mão de obra',
      'un.',
      1,
      `R$ ${proposalData.labor_cost.toFixed(2)}`,
      `R$ ${proposalData.labor_cost.toFixed(2)}`
    ])
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Descrição', 'Un.', 'Qtd', 'Preço Unit.', 'Total']],
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
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  })

  yPos = (doc as any).lastAutoTable.finalY + 5

  // Totais
  const totalsX = pageWidth - margin - 50

  doc.setFont('times', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...darkGray)

  doc.text('Subtotal:', totalsX, yPos, { align: 'right' })
  doc.text(`R$ ${proposalData.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
  yPos += 5

  if (proposalData.discount > 0) {
    doc.setTextColor(231, 76, 60)
    doc.text('Desconto:', totalsX, yPos, { align: 'right' })
    doc.text(`- R$ ${proposalData.discount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
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
  doc.text(`R$ ${proposalData.final_total.toFixed(2)}`, pageWidth - margin - 3, yPos + 2, { align: 'right' })

  yPos += 15

  // =====================================================
  // FORMA DE PAGAMENTO
  // =====================================================

  checkPageBreak(50)

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Forma de Pagamento', margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  // Métodos de pagamento
  doc.text(`Métodos: ${proposalData.payment_methods.join(', ')}`, margin + 3, yPos)
  yPos += 5

  // PIX
  doc.text(`PIX: ${companyInfo.pix || companyInfo.cnpj}`, margin + 3, yPos)
  yPos += 5

  // Dados bancários
  doc.text(`Banco: ${companyInfo.bank_name || 'CORA'} | Ag: ${companyInfo.bank_agency || 'null'} | Conta: ${companyInfo.bank_account || '0001'}`, margin + 3, yPos)
  yPos += 5

  // Forma de pagamento
  if (proposalData.payment_terms) {
    doc.text(`Forma de Pagamento: ${proposalData.payment_terms}`, margin + 3, yPos)
    yPos += 5
  }

  // Informação de desconto
  if (proposalData.payment_discount_info) {
    doc.text(proposalData.payment_discount_info, margin + 3, yPos)
    yPos += 5
  }

  // =====================================================
  // NOVA PÁGINA: GARANTIA E CONTRATO
  // =====================================================

  addFooter()
  doc.addPage()
  yPos = margin

  // =====================================================
  // GARANTIA
  // =====================================================

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Garantia', margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  if (proposalData.warranty_period) {
    doc.text(`Período: ${proposalData.warranty_period}`, margin + 3, yPos)
    yPos += 8
  }

  // Termos de garantia detalhados
  const warrantyText = proposalData.warranty_terms || `• Garantias referentes à sistemas de novo em tubulações antigas, só serão válidas, com os processos de descontaminação das tubulações antigas.

Garantia de (EQUIPAMENTOS NOVOS) que podem ser de 5 a 10 anos, só são válidas com manutenção semestral comprovada COM LAUDO TÉCNICO.

Garantias extendidas pela nossa empresa, são concedidas em caso de compra das máquinas conosco, as mesmas deixam de ter validade legal de 3 meses e podem ter até 12 meses de acordo com o tipo e capacidade do sistema, mediante a manutenção dos equipamentos realizadas conosco nos prazos estipulados pelo fabricante.`

  const warrantyLines = doc.splitTextToSize(warrantyText, pageWidth - 2 * margin - 6)
  doc.text(warrantyLines, margin + 3, yPos)
  yPos += warrantyLines.length * 4 + 10

  // =====================================================
  // CONTRATO DE PRESTAÇÃO DE SERVIÇOS
  // =====================================================

  checkPageBreak(60)

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Contrato de Prestação de Serviços', margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('times', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...darkGray)

  const contractText = `CONTRATANTE: ${proposalData.client.company_name || proposalData.client.name}
CNPJ/CPF: ${proposalData.client.cnpj || 'Não informado'}

CONTRATADA: ${companyInfo.name}
CNPJ: ${companyInfo.cnpj}

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto a prestação dos serviços descritos nesta proposta, conforme especificações técnicas e condições estabelecidas.

CLÁUSULA 2ª - DO VALOR E FORMA DE PAGAMENTO
O valor total dos serviços é de R$ ${proposalData.final_total.toFixed(2)} (${numberToWords(proposalData.final_total)}), a ser pago conforme condições estabelecidas nesta proposta.

CLÁUSULA 3ª - DO PRAZO
Os serviços serão executados no prazo de ${proposalData.service_info?.deadline || '30 dias'}, contados a partir da assinatura deste contrato e aprovação do pagamento.

CLÁUSULA 4ª - DAS OBRIGAÇÕES DA CONTRATADA
a) Executar os serviços com qualidade e dentro dos padrões técnicos;
b) Fornecer todos os materiais e equipamentos necessários à execução dos serviços;
c) Manter equipe técnica qualificada e habilitada;
d) Respeitar os prazos estabelecidos.

CLÁUSULA 5ª - DAS OBRIGAÇÕES DO CONTRATANTE
a) Efetuar o pagamento na forma e prazo estabelecidos;
b) Fornecer todas as informações necessárias à execução dos serviços;
c) Garantir acesso ao local de execução dos serviços;
d) Comunicar imediatamente qualquer problema ou irregularidade.

CLÁUSULA 6ª - DA GARANTIA
Os serviços prestados possuem garantia de ${proposalData.warranty_period || '3 meses'}, conforme termos especificados nesta proposta.

CLÁUSULA 7ª - DA RESCISÃO
O presente contrato poderá ser rescindido por qualquer das partes mediante comunicação prévia de 15 (quinze) dias, sem prejuízo das obrigações já assumidas.

CLÁUSULA 8ª - DO FORO
Fica eleito o foro da comarca de ${companyInfo.city || 'São Paulo'}-${companyInfo.state || 'SP'} para dirimir quaisquer dúvidas oriundas do presente contrato.`

  const contractLines = doc.splitTextToSize(contractText, pageWidth - 2 * margin - 6)
  doc.text(contractLines, margin + 3, yPos)
  yPos += contractLines.length * 3.5 + 10

  // =====================================================
  // OBSERVAÇÕES
  // =====================================================

  checkPageBreak(30)

  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...primaryColor)
  doc.text('Observações', margin + 3, yPos + 5.5)

  yPos += 12

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...darkGray)

  const observations = proposalData.additional_info || 'Trabalhamos para que seus projetos, se tornem realidade.. Obrigado pela confiança\n\nobrigado pela confiança, estaremos à disposição.'
  const obsLines = doc.splitTextToSize(observations, pageWidth - 2 * margin - 6)
  doc.text(obsLines, margin + 3, yPos)

  // =====================================================
  // RODAPÉ FINAL
  // =====================================================

  addFooter()

  // Atualizar contagem de páginas no rodapé
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('times', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...darkGray)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 2, { align: 'center' })
  }

  return doc
}

// Função auxiliar para converter número em extenso (simplificada)
function numberToWords(value: number): string {
  const intValue = Math.floor(value)
  const cents = Math.round((value - intValue) * 100)

  // Implementação básica
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']

  if (intValue === 0) return 'zero reais'
  if (intValue < 10) return `${unidades[intValue]} ${intValue === 1 ? 'real' : 'reais'}`
  if (intValue < 20) return `${especiais[intValue - 10]} reais`
  if (intValue < 100) {
    const dez = Math.floor(intValue / 10)
    const uni = intValue % 10
    return `${dezenas[dez]}${uni > 0 ? ' e ' + unidades[uni] : ''} reais`
  }

  return `${intValue.toLocaleString('pt-BR')} reais`
}

export default generateProposalPDFComplete
