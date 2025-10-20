import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface DocumentData {
  title: string
  description?: string
  content: string
  department: string
  category?: string
  version: number
  createdAt: string
  updatedAt: string
  status: string
  createdBy?: string
  approvedBy?: string
  approvedAt?: string
  tags?: string[]
}

export const generateDocumentPDF = (document: DocumentData, companyInfo?: any) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPos = 20

  const addText = (text: string, x: number, fontSize: number = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', style)
    doc.text(text, x, yPos)
    yPos += fontSize * 0.5
  }

  const checkPageBreak = (neededSpace: number = 20) => {
    if (yPos + neededSpace > pageHeight - 20) {
      doc.addPage()
      yPos = 20
      return true
    }
    return false
  }

  doc.setFillColor(41, 128, 185)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(document.title, 15, 25)

  if (companyInfo?.company_name) {
    doc.setFontSize(10)
    doc.text(companyInfo.company_name, pageWidth - 15, 15, { align: 'right' })
  }

  yPos = 50
  doc.setTextColor(0, 0, 0)

  doc.setFillColor(245, 245, 245)
  doc.rect(10, yPos - 5, pageWidth - 20, 40, 'F')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Informações do Documento', 15, yPos + 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  const infoY = yPos + 10
  doc.text(`Departamento: ${document.department}`, 15, infoY)
  doc.text(`Versão: ${document.version}`, pageWidth / 2, infoY)

  if (document.category) {
    doc.text(`Categoria: ${document.category}`, 15, infoY + 7)
  }

  doc.text(`Status: ${getStatusLabel(document.status)}`, pageWidth / 2, infoY + 7)

  doc.text(`Criado em: ${new Date(document.createdAt).toLocaleDateString('pt-BR')}`, 15, infoY + 14)
  doc.text(`Atualizado em: ${new Date(document.updatedAt).toLocaleDateString('pt-BR')}`, pageWidth / 2, infoY + 14)

  yPos += 48

  if (document.description) {
    checkPageBreak(20)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Descrição', 15, yPos)
    yPos += 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const descLines = doc.splitTextToSize(document.description, pageWidth - 30)
    descLines.forEach((line: string) => {
      checkPageBreak()
      doc.text(line, 15, yPos)
      yPos += 5
    })
    yPos += 5
  }

  if (document.tags && document.tags.length > 0) {
    checkPageBreak(15)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Tags: ', 15, yPos)

    doc.setFont('helvetica', 'normal')
    doc.text(document.tags.join(', '), 35, yPos)
    yPos += 10
  }

  checkPageBreak(20)
  doc.setDrawColor(41, 128, 185)
  doc.setLineWidth(0.5)
  doc.line(15, yPos, pageWidth - 15, yPos)
  yPos += 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Conteúdo', 15, yPos)
  yPos += 8

  const content = parseMarkdownToPDF(document.content)
  content.forEach((block: any) => {
    checkPageBreak(block.height || 15)

    if (block.type === 'heading1') {
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(block.text, 15, yPos)
      yPos += 10
    } else if (block.type === 'heading2') {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(block.text, 15, yPos)
      yPos += 8
    } else if (block.type === 'heading3') {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(block.text, 15, yPos)
      yPos += 7
    } else if (block.type === 'paragraph') {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(block.text, pageWidth - 30)
      lines.forEach((line: string) => {
        checkPageBreak()
        doc.text(line, 15, yPos)
        yPos += 5
      })
      yPos += 3
    } else if (block.type === 'list') {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      block.items.forEach((item: string) => {
        checkPageBreak()
        doc.text('• ' + item, 20, yPos)
        yPos += 5
      })
      yPos += 3
    }
  })

  yPos = pageHeight - 30
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(15, yPos, pageWidth - 15, yPos)

  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Documento gerado em ${new Date().toLocaleString('pt-BR')}`,
    pageWidth / 2,
    yPos + 7,
    { align: 'center' }
  )

  if (document.approvedBy && document.approvedAt) {
    doc.text(
      `Aprovado por: ${document.approvedBy} em ${new Date(document.approvedAt).toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      yPos + 12,
      { align: 'center' }
    )
  }

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 15,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  return doc
}

function parseMarkdownToPDF(markdown: string) {
  const blocks: any[] = []
  const lines = markdown.split('\n')

  let currentParagraph = ''
  let currentList: string[] = []

  lines.forEach(line => {
    const trimmed = line.trim()

    if (trimmed.startsWith('# ')) {
      if (currentParagraph) {
        blocks.push({ type: 'paragraph', text: currentParagraph.trim() })
        currentParagraph = ''
      }
      if (currentList.length > 0) {
        blocks.push({ type: 'list', items: currentList })
        currentList = []
      }
      blocks.push({ type: 'heading1', text: trimmed.substring(2) })
    } else if (trimmed.startsWith('## ')) {
      if (currentParagraph) {
        blocks.push({ type: 'paragraph', text: currentParagraph.trim() })
        currentParagraph = ''
      }
      if (currentList.length > 0) {
        blocks.push({ type: 'list', items: currentList })
        currentList = []
      }
      blocks.push({ type: 'heading2', text: trimmed.substring(3) })
    } else if (trimmed.startsWith('### ')) {
      if (currentParagraph) {
        blocks.push({ type: 'paragraph', text: currentParagraph.trim() })
        currentParagraph = ''
      }
      if (currentList.length > 0) {
        blocks.push({ type: 'list', items: currentList })
        currentList = []
      }
      blocks.push({ type: 'heading3', text: trimmed.substring(4) })
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (currentParagraph) {
        blocks.push({ type: 'paragraph', text: currentParagraph.trim() })
        currentParagraph = ''
      }
      currentList.push(trimmed.substring(2))
    } else if (trimmed === '') {
      if (currentParagraph) {
        blocks.push({ type: 'paragraph', text: currentParagraph.trim() })
        currentParagraph = ''
      }
      if (currentList.length > 0) {
        blocks.push({ type: 'list', items: currentList })
        currentList = []
      }
    } else {
      if (currentList.length > 0) {
        blocks.push({ type: 'list', items: currentList })
        currentList = []
      }
      currentParagraph += (currentParagraph ? ' ' : '') + trimmed
    }
  })

  if (currentParagraph) {
    blocks.push({ type: 'paragraph', text: currentParagraph.trim() })
  }
  if (currentList.length > 0) {
    blocks.push({ type: 'list', items: currentList })
  }

  return blocks
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Rascunho',
    review: 'Em Revisão',
    approved: 'Aprovado',
    archived: 'Arquivado'
  }
  return statusMap[status] || status
}
