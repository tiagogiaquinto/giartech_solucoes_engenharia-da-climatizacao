import { supabase } from '../lib/supabase'

export interface CepData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export interface CnpjData {
  cnpj: string
  razao_social: string
  nome_fantasia: string
  natureza_juridica: string
  capital_social: number
  porte: string
  abertura: string
  situacao: string
  tipo: string
  email: string
  telefone: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
  cep: string
  status: string
  message?: string
}

export const fetchCepData = async (cep: string): Promise<CepData | null> => {
  try {
    const cleanCep = cep.replace(/\D/g, '')

    if (cleanCep.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos')
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const apiUrl = `${supabaseUrl}/functions/v1/buscar-cep?cep=${cleanCep}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao buscar CEP. Verifique sua conexão.')
    }

    const data: CepData = await response.json()

    if (data.erro) {
      throw new Error('CEP não encontrado')
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    if (error instanceof TypeError) {
      throw new Error('Erro de conexão. Verifique sua internet.')
    }
    throw error
  }
}

export const fetchCnpjData = async (cnpj: string): Promise<CnpjData | null> => {
  try {
    const cleanCnpj = cnpj.replace(/\D/g, '')

    if (cleanCnpj.length !== 14) {
      throw new Error('CNPJ deve conter 14 dígitos')
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const apiUrl = `${supabaseUrl}/functions/v1/buscar-cnpj?cnpj=${cleanCnpj}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 429) {
        throw new Error('Limite de consultas atingido. Tente novamente em alguns segundos.')
      }
      if (response.status === 404) {
        throw new Error(errorData.error || 'CNPJ não encontrado na base de dados.')
      }
      throw new Error(errorData.error || 'Erro ao buscar CNPJ. Verifique sua conexão.')
    }

    const data = await response.json()

    if (data.status === 'ERROR') {
      throw new Error(data.message || 'CNPJ não encontrado')
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar CNPJ:', error)
    if (error instanceof TypeError) {
      throw new Error('Erro de conexão. Verifique sua internet.')
    }
    throw error
  }
}

export const formatCep = (cep: string): string => {
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length <= 5) {
    return cleaned
  }
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`
}

export const formatCnpj = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`
  if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`
}

export const formatCpf = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`
}

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length <= 2) return cleaned ? `(${cleaned}` : cleaned
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
}
