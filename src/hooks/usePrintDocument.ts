import { useState, useCallback } from 'react'
import {
  printDocument,
  type PrintOptions,
  type PrintResult,
  type DocumentType
} from '../utils/documentPrintManager'

interface UsePrintDocumentOptions {
  documentType: DocumentType
  onSuccess?: (result: PrintResult) => void
  onError?: (error: string) => void
}

export const usePrintDocument = (options: UsePrintDocumentOptions) => {
  const [isPrinting, setIsPrinting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<PrintResult | null>(null)

  const print = useCallback(
    async (
      generatePDFFunction: () => Promise<Blob>,
      printOptions?: Partial<PrintOptions>
    ): Promise<PrintResult> => {
      setIsPrinting(true)
      setError(null)

      const fullOptions: PrintOptions = {
        documentType: options.documentType,
        showSuccessMessage: true,
        includeImages: true,
        format: 'A4',
        orientation: 'portrait',
        ...printOptions
      }

      try {
        const result = await printDocument(generatePDFFunction, fullOptions)

        setLastResult(result)

        if (result.success) {
          options.onSuccess?.(result)
        } else {
          setError(result.error || 'Erro desconhecido')
          options.onError?.(result.error || 'Erro desconhecido')
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao imprimir documento'
        setError(errorMessage)
        options.onError?.(errorMessage)

        return {
          success: false,
          filename: '',
          message: errorMessage,
          error: errorMessage
        }
      } finally {
        setIsPrinting(false)
      }
    },
    [options]
  )

  const reset = useCallback(() => {
    setError(null)
    setLastResult(null)
    setIsPrinting(false)
  }, [])

  return {
    print,
    isPrinting,
    error,
    lastResult,
    reset
  }
}

export default usePrintDocument
