/**
 * Wrapper compatível - Usa gerador unificado mantendo interface antiga
 */
import { generateDocumentPDFUnified } from './generateDocumentPDFUnified'
import { DocumentTemplate } from '../config/brandingConfig'

export const generateServiceOrderPDFGiartech = async (data: any): Promise<void> => {
  return generateDocumentPDFUnified(
    {
      order_number: data.order_number || 'TEMP-' + Date.now(),
      document_type: 'order',
      date: data.date || new Date().toISOString(),
      title: data.title,
      client: {
        name: data.client?.name || data.client?.company_name || '',
        company_name: data.client?.company_name,
        cnpj: data.client?.cnpj,
        cpf: data.client?.cpf,
        address: data.client?.address,
        city: data.client?.city,
        state: data.client?.state,
        cep: data.client?.cep,
        email: data.client?.email,
        phone: data.client?.phone
      },
      basic_info: data.basic_info,
      items: data.items || [],
      subtotal: data.subtotal || 0,
      discount: data.discount || 0,
      total: data.total || 0,
      payment: data.payment,
      warranty: data.warranty,
      contract_clauses: data.contract_clauses,
      notes: data.additional_info
    },
    {
      template: DocumentTemplate.PROFESSIONAL,
      includeDetails: true,
      includeCosts: false
    }
  )
}

export default generateServiceOrderPDFGiartech
