export const searchCep = async (cep: string) => ({ data: null, error: null })
export const searchCnpj = async (cnpj: string) => ({ data: null, error: null })
export const fetchCnpjData = async (cnpj: string) => null
export const fetchCepData = async (cep: string) => null
export const formatCnpj = (cnpj: string) => cnpj
export const formatCep = (cep: string) => cep
