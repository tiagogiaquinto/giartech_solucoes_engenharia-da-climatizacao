import { supabase } from '../lib/supabase'

export interface CompanyInfo {
  name: string
  cnpj: string
  address: string
  neighborhood: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  website: string
  instagram?: string
  pix?: string
  fullAddress?: string
  owner?: string
  whatsapp?: string
  bank_name?: string
  bank_agency?: string
  bank_account?: string
  account_type?: string
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'Giartech Soluções',
  cnpj: '37.509.897/0001-93',
  address: 'Rua Quito, 14',
  neighborhood: 'Nossa Sra do Ó',
  city: 'São Paulo',
  state: 'SP',
  zip: '02734-010',
  phone: '(11) 5555-2560',
  email: 'diretor@giartechsolucoes.com.br',
  website: 'giartechsolucoes.com.br',
  instagram: '@giartech.soluções',
  pix: '37.509.897/0001-93',
  owner: 'Tiago Bruno Giaquinto',
  whatsapp: '(35) 1511-9666',
  bank_name: 'CORA',
  bank_agency: '0001',
  bank_account: '1412009-3',
  account_type: 'Corrente'
}

export const getCompanyInfo = async (): Promise<CompanyInfo> => {
  try {
    const { data: companyData } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (companyData) {
      const address = [companyData.address_street, companyData.address_number].filter(Boolean).join(', ')
      const fullAddress = [
        companyData.address_street,
        companyData.address_number,
        companyData.address_neighborhood,
        companyData.address_city,
        companyData.address_state,
        companyData.address_zip && `CEP: ${companyData.address_zip}`
      ].filter(Boolean).join(', ')

      return {
        name: companyData.company_name || DEFAULT_COMPANY_INFO.name,
        cnpj: companyData.cnpj || DEFAULT_COMPANY_INFO.cnpj,
        address: address || DEFAULT_COMPANY_INFO.address,
        neighborhood: companyData.address_neighborhood || DEFAULT_COMPANY_INFO.neighborhood,
        city: companyData.address_city || DEFAULT_COMPANY_INFO.city,
        state: companyData.address_state || DEFAULT_COMPANY_INFO.state,
        zip: companyData.address_zip || DEFAULT_COMPANY_INFO.zip,
        phone: companyData.phone || DEFAULT_COMPANY_INFO.phone,
        email: companyData.email || DEFAULT_COMPANY_INFO.email,
        website: companyData.website || DEFAULT_COMPANY_INFO.website,
        instagram: companyData.instagram || DEFAULT_COMPANY_INFO.instagram,
        pix: companyData.pix_key || DEFAULT_COMPANY_INFO.pix,
        fullAddress,
        owner: companyData.owner_name || DEFAULT_COMPANY_INFO.owner,
        whatsapp: companyData.whatsapp || DEFAULT_COMPANY_INFO.whatsapp,
        bank_name: companyData.bank_name || DEFAULT_COMPANY_INFO.bank_name,
        bank_agency: companyData.bank_agency || DEFAULT_COMPANY_INFO.bank_agency,
        bank_account: companyData.bank_account || DEFAULT_COMPANY_INFO.bank_account,
        account_type: companyData.account_type || DEFAULT_COMPANY_INFO.account_type
      }
    }

    return DEFAULT_COMPANY_INFO
  } catch (error) {
    console.error('Error loading company info:', error)
    return DEFAULT_COMPANY_INFO
  }
}
