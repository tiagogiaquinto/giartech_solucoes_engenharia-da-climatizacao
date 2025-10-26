import { format } from 'date-fns'

export type DocumentType =
  | 'ordem_servico'
  | 'orcamento'
  | 'proposta'
  | 'contrato'
  | 'relatorio'
  | 'documento'
  | 'nota_fiscal'

export interface PrintOptions {
  documentType: DocumentType
  documentNumber?: string
  clientName?: string
  customFilename?: string
  showSuccessMessage?: boolean
  includeImages?: boolean
  format?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
}

export interface PrintResult {
  success: boolean
  filename: string
  message: string
  blob?: Blob
  error?: string
}

const normalizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const getDocumentTypeLabel = (type: DocumentType): string => {
  const labels: Record<DocumentType, string> = {
    'ordem_servico': 'OS',
    'orcamento': 'ORC',
    'proposta': 'PROP',
    'contrato': 'CONT',
    'relatorio': 'REL',
    'documento': 'DOC',
    'nota_fiscal': 'NF'
  }
  return labels[type] || 'DOC'
}

export const generateDocumentFilename = (options: PrintOptions): string => {
  const { documentType, documentNumber, clientName, customFilename } = options

  if (customFilename) {
    return customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`
  }

  const typeLabel = getDocumentTypeLabel(documentType)
  const date = format(new Date(), 'dd-MM-yyyy')

  let filename = typeLabel

  if (documentNumber) {
    const normalizedNumber = normalizeString(documentNumber)
    filename += `_${normalizedNumber}`
  }

  if (clientName) {
    const normalizedClient = normalizeString(clientName)
    filename += `_${normalizedClient}`
  }

  filename += `_${date}.pdf`

  return filename
}

export const downloadPDF = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const showPrintSuccess = (filename: string): void => {
  const message = `✅ Documento completo gerado com sucesso!\n📄 ${filename}`

  if (typeof window !== 'undefined' && window.alert) {
    const event = new CustomEvent('toast', {
      detail: {
        message: `Documento gerado: ${filename}`,
        type: 'success'
      }
    })
    window.dispatchEvent(event)
  }

  console.log('✅ PDF gerado:', filename)
}

export const showPrintError = (error: string): void => {
  const message = `❌ Erro ao gerar documento: ${error}`

  if (typeof window !== 'undefined') {
    const event = new CustomEvent('toast', {
      detail: {
        message,
        type: 'error'
      }
    })
    window.dispatchEvent(event)
  }

  console.error('❌ Erro na geração do PDF:', error)
}

export const printDocument = async (
  generatePDFFunction: () => Promise<Blob>,
  options: PrintOptions
): Promise<PrintResult> => {
  try {
    console.log('🖨️ Iniciando geração de documento completo...', options)

    const pdfBlob = await generatePDFFunction()

    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error('PDF gerado está vazio')
    }

    const filename = generateDocumentFilename(options)

    downloadPDF(pdfBlob, filename)

    if (options.showSuccessMessage !== false) {
      showPrintSuccess(filename)
    }

    return {
      success: true,
      filename,
      message: 'Documento completo gerado com sucesso em formato PDF',
      blob: pdfBlob
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao gerar PDF:', error)

    if (options.showSuccessMessage !== false) {
      showPrintError(errorMessage)
    }

    return {
      success: false,
      filename: '',
      message: `Erro ao gerar documento: ${errorMessage}`,
      error: errorMessage
    }
  }
}

export const validateDocumentData = (data: any, requiredFields: string[]): boolean => {
  for (const field of requiredFields) {
    if (!data[field]) {
      console.warn(`⚠️ Campo obrigatório ausente: ${field}`)
      return false
    }
  }
  return true
}

export const embedImageInPDF = async (imageUrl: string): Promise<string> => {
  try {
    if (imageUrl.startsWith('data:')) {
      return imageUrl
    }

    const response = await fetch(imageUrl)
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Erro ao incorporar imagem:', error)
    return ''
  }
}

export const preloadDocumentImages = async (
  imageUrls: string[]
): Promise<Record<string, string>> => {
  const images: Record<string, string> = {}

  for (const url of imageUrls) {
    if (url) {
      const base64 = await embedImageInPDF(url)
      if (base64) {
        images[url] = base64
      }
    }
  }

  return images
}

export const createPrintButton = (
  label: string = 'Imprimir Documento Completo',
  onClick: () => void,
  icon: string = '🖨️'
): HTMLButtonElement => {
  const button = document.createElement('button')
  button.innerHTML = `${icon} ${label}`
  button.className = 'btn btn-primary print-document-btn'
  button.onclick = onClick
  button.title = 'Gerar documento completo em PDF (formato A4)'
  return button
}

export default {
  printDocument,
  generateDocumentFilename,
  downloadPDF,
  showPrintSuccess,
  showPrintError,
  validateDocumentData,
  embedImageInPDF,
  preloadDocumentImages,
  createPrintButton
}
