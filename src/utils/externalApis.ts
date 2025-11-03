const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const fetchCnpjData = async (cnpj: string) => {
  try {
    const cleanCnpj = cnpj.replace(/\D/g, '')

    if (cleanCnpj.length !== 14) {
      throw new Error('CNPJ deve conter 14 dígitos')
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/buscar-cnpj?cnpj=${cleanCnpj}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao buscar CNPJ')
    }

    const data = await response.json()

    if (data.status === 'ERROR') {
      throw new Error(data.error || 'CNPJ não encontrado')
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar CNPJ:', error)
    throw error
  }
}

export const fetchCepData = async (cep: string) => {
  try {
    const cleanCep = cep.replace(/\D/g, '')

    if (cleanCep.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos')
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/buscar-cep?cep=${cleanCep}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao buscar CEP')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    throw error
  }
}

export const searchCep = async (cep: string) => {
  try {
    const data = await fetchCepData(cep)
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

export const searchCnpj = async (cnpj: string) => {
  try {
    const data = await fetchCnpjData(cnpj)
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

export const formatCnpj = (cnpj: string) => {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length <= 14) {
    return cleaned
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return cnpj
}

export const formatCep = (cep: string) => {
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length <= 8) {
    return cleaned.replace(/^(\d{5})(\d)/, '$1-$2')
  }
  return cep
}
