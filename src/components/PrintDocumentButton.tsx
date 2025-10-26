import React from 'react'
import { Printer, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { usePrintDocument } from '../hooks/usePrintDocument'
import type { DocumentType, PrintOptions } from '../utils/documentPrintManager'

interface PrintDocumentButtonProps {
  documentType: DocumentType
  generatePDF: () => Promise<Blob>
  printOptions?: Partial<PrintOptions>
  label?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  icon?: boolean
  disabled?: boolean
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
}

export const PrintDocumentButton: React.FC<PrintDocumentButtonProps> = ({
  documentType,
  generatePDF,
  printOptions,
  label = 'Imprimir Documento',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon = true,
  disabled = false,
  onSuccess,
  onError,
  className = ''
}) => {
  const { print, isPrinting, error, lastResult } = usePrintDocument({
    documentType,
    onSuccess: () => onSuccess?.(),
    onError: (err) => onError?.(err)
  })

  const handlePrint = async () => {
    await print(generatePDF, printOptions)
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white'
      case 'outline':
        return 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm'
      case 'md':
        return 'px-4 py-2 text-base'
      case 'lg':
        return 'px-6 py-3 text-lg'
      default:
        return 'px-4 py-2 text-base'
    }
  }

  const getIcon = () => {
    if (!icon) return null

    if (isPrinting) {
      return <Loader2 className="h-5 w-5 animate-spin" />
    }

    if (lastResult?.success) {
      return <CheckCircle className="h-5 w-5" />
    }

    if (error) {
      return <AlertCircle className="h-5 w-5" />
    }

    return <Printer className="h-5 w-5" />
  }

  return (
    <button
      onClick={handlePrint}
      disabled={disabled || isPrinting}
      className={`
        flex items-center justify-center gap-2 font-medium rounded-lg
        transition-all duration-200
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isPrinting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
        ${className}
      `}
      title="Gerar documento completo em PDF (formato A4)"
    >
      {getIcon()}
      <span>
        {isPrinting ? 'Gerando PDF...' : label}
      </span>
    </button>
  )
}

export default PrintDocumentButton
