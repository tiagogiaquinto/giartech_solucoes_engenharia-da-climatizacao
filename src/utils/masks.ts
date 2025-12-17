export const phoneMask = (value: string) => value
export const cpfMask = (value: string) => value
export const cnpjMask = (value: string) => value
export const cepMask = (value: string) => value
export const maskCPF = (value: string) => value
export const maskPhone = (value: string) => value
export const maskCEP = (value: string) => value
export const validateCPF = (value: string) => true
export const validateEmail = (value: string) => true
export const unmask = (value: string) => value.replace(/\D/g, '')

export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseCurrencyToFloat(value) : value
  if (isNaN(numValue)) return '0,00'

  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export const maskCurrency = (value: string): string => {
  let numericValue = value.replace(/\D/g, '')

  if (numericValue === '') return ''

  const numberValue = parseFloat(numericValue) / 100

  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export const parseCurrencyToFloat = (value: string): number => {
  if (!value || value === '') return 0

  const cleanValue = value
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')

  const numValue = parseFloat(cleanValue)
  return isNaN(numValue) ? 0 : numValue
}
