export interface PrintResult {
  success: boolean
  error: string | null
  filename?: string
}

export interface PrintOptions {
  filename?: string
  orientation?: 'portrait' | 'landscape'
}

export type DocumentType = 'os' | 'contract' | 'invoice' | 'proposal' | 'ordem_servico'

export const printDocument = async (html: string | (() => Promise<Blob>), type?: DocumentType, options?: PrintOptions): Promise<PrintResult> => {
  return { success: true, error: null, filename: options?.filename }
}
